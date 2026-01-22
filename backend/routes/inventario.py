from flask import Blueprint, request, jsonify
from models import db, Ingrediente, ReabastecimientoInventario, Receta, MermaIngrediente
from services.auth_service import AuthService
from services.calculos_service import CalculoCostos

inventario_bp = Blueprint('inventario', __name__, url_prefix='/api/inventario')

@inventario_bp.route('/', methods=['GET'])
@AuthService.requerir_autenticacion
def listar_inventario():
    """Lista todos los ingredientes con su stock y costos"""
    try:
        if request.usuario.rol == 'user' and 'ver_inventario' not in (request.usuario.permisos or []):
             # Permitir acceso si tiene permiso explícito o si no es rol 'user' limitado
             pass 

        ingredientes = Ingrediente.query.all()
        return jsonify({
            'success': True,
            'data': [i.to_dict() for i in ingredientes]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@inventario_bp.route('/reabastecer', methods=['POST'])
@AuthService.requerir_autenticacion
def reabastecer_inventario():
    """
    Registra una compra/reabastecimiento de ingrediente.
    Actualiza el costo_unitario (promedio ponderado o último precio) y suma al stock.
    """
    try:
        datos = request.get_json()
        
        required = ['ingrediente_id', 'cantidad', 'costo_compra']
        if not all(k in datos for k in required):
            return jsonify({'error': 'Faltan datos requeridos (ingrediente_id, cantidad, costo_compra)'}), 400
            
        ingrediente = Ingrediente.query.get(datos['ingrediente_id'])
        if not ingrediente:
            return jsonify({'error': 'Ingrediente no encontrado'}), 404
            
        cantidad_nueva = float(datos['cantidad'])
        costo_compra_total = float(datos['costo_compra']) # Costo total de la compra
        
        if cantidad_nueva <= 0:
            return jsonify({'error': 'La cantidad debe ser positiva'}), 400

        # Crear registro de reabastecimiento
        reabastecimiento = ReabastecimientoInventario(
            ingrediente_id=ingrediente.id,
            cantidad=cantidad_nueva,
            costo_compra=costo_compra_total,
            proveedor=datos.get('proveedor'),
            observaciones=datos.get('observaciones'),
            usuario_id=request.usuario.id
        )
        
        # Actualizar Costo Unitario (Promedio Ponderado)
        # Costo Unitario Nuevo = ( (StockActual * CostoActual) + CostoCompraTotal ) / (StockActual + CantidadNueva)
        valor_stock_actual = ingrediente.stock_actual * ingrediente.costo_unitario
        nuevo_stock_total = ingrediente.stock_actual + cantidad_nueva
        
        nuevo_costo_unitario = (valor_stock_actual + costo_compra_total) / nuevo_stock_total
        
        # Guardar historial si el costo cambia significativamente (>1%)
        if abs(ingrediente.costo_unitario - nuevo_costo_unitario) > (ingrediente.costo_unitario * 0.01):
             ingrediente.costo_anterior = ingrediente.costo_unitario
             # Aquí podríamos disparar el recálculo de recetas
        
        ingrediente.costo_unitario = round(nuevo_costo_unitario, 2)
        ingrediente.stock_actual = round(nuevo_stock_total, 3) # 3 decimales para precisión en kg/lt
        
        db.session.add(reabastecimiento)
        db.session.commit()

        # Opcional: Disparar recálculo de costos de recetas que usen este ingrediente
        # Esto podría ser una tarea asíncrona en un sistema más grande
        recetas_afectadas = Receta.query.join(Receta.ingredientes).filter_by(ingrediente_id=ingrediente.id).all()
        CalculoCostos.recalcular_todas_recetas(request.usuario.id, db, recetas_afectadas)
        
        return jsonify({
            'success': True,
            'mensaje': 'Inventario actualizado correctamente',
            'ingrediente': ingrediente.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@inventario_bp.route('/mermas', methods=['POST'])
@AuthService.requerir_autenticacion
def registrar_merma():
    """
    Registra una merma/desperdicio de ingrediente.
    Resta del stock actual.
    """
    try:
        datos = request.get_json()
        
        required = ['ingrediente_id', 'cantidad']
        if not all(k in datos for k in required):
            return jsonify({'error': 'Faltan datos requeridos (ingrediente_id, cantidad)'}), 400
            
        ingrediente = Ingrediente.query.get(datos['ingrediente_id'])
        if not ingrediente:
            return jsonify({'error': 'Ingrediente no encontrado'}), 404
            
        cantidad = float(datos['cantidad'])
        if cantidad <= 0:
             return jsonify({'error': 'La cantidad debe ser positiva'}), 400
             
        if (ingrediente.stock_actual or 0) < cantidad:
             # Opcional: permitir stock negativo o no. 
             # Generalmente las mermas se registran sobre lo que había.
             pass 

        # Crear registro de merma
        merma = MermaIngrediente(
            ingrediente_id=ingrediente.id,
            cantidad=cantidad,
            razon=datos.get('razon', 'Sin especificar'),
            usuario_id=request.usuario.id
        )
        
        # Descontar stock
        ingrediente.stock_actual = (ingrediente.stock_actual or 0) - cantidad
        
        db.session.add(merma)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'mensaje': 'Merma registrada, stock descontado',
            'ingrediente': ingrediente.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
