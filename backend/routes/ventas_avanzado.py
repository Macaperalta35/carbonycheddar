"""
Rutas de Ventas Avanzadas
- Crear venta con explosión de recetas
- Obtener comprobantes (cocina/caja)
- Reportes granulares (hora/día/rango)
"""
from flask import Blueprint, request, jsonify
from services.auth_service import AuthService
from services.ventas_service_avanzado import VentasServiceAvanzado
from datetime import datetime
import traceback

ventas_bp = Blueprint('ventas_avanzado', __name__, url_prefix='/api/ventas')

# ======================== CREAR VENTA CON EXPLOSIÓN ========================

@ventas_bp.route('/crear-con-explosion', methods=['POST'])
@AuthService.requerir_autenticacion
def crear_venta_explosion():
    """
    Crear venta con explosión automática de recetas
    
    Body JSON:
    {
        "items": [
            {"tipo": "producto|receta", "id": 1, "cantidad": 2, "precio_unitario": 15.50, "observaciones": ""},
            {"tipo": "receta", "id": 5, "cantidad": 1, "precio_unitario": 25.00, "observaciones": "sin picante"}
        ],
        "cliente_nombre": "Juan",
        "numero_mesa": "5",
        "descuento": 10,
        "comentarios": "Cliente VIP"
    }
    """
    try:
        datos = request.get_json()
        
        resultado = VentasServiceAvanzado.crear_venta_con_explosion(
            usuario_id=request.usuario_id,
            items=datos.get('items', []),
            cliente_nombre=datos.get('cliente_nombre', ''),
            numero_mesa=datos.get('numero_mesa', ''),
            descuento=datos.get('descuento', 0),
            comentarios=datos.get('comentarios', '')
        )
        
        return jsonify({
            'success': True,
            'message': 'Venta creada exitosamente',
            'data': resultado
        }), 201
    
    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400
    
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': f'Error al crear venta: {str(e)}'
        }), 500

# ======================== COMPROBANTES ========================

@ventas_bp.route('/<int:venta_id>/comanda/<tipo>', methods=['GET'])
@AuthService.requerir_autenticacion
def obtener_comanda(venta_id, tipo):
    """
    Obtiene comanda (comprobante) para cocina o caja
    
    tipo: 'cocina' | 'caja'
    """
    try:
        if tipo not in ['cocina', 'caja']:
            return jsonify({
                'success': False,
                'message': f'Tipo de comanda inválido: {tipo}. Debe ser "cocina" o "caja"'
            }), 400
        
        comanda = VentasServiceAvanzado.obtener_comanda(venta_id, tipo)
        
        return jsonify({
            'success': True,
            'data': comanda
        }), 200
    
    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 404
    
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': f'Error al obtener comanda: {str(e)}'
        }), 500

@ventas_bp.route('/comanda/<int:comanda_id>/marcar-impresa', methods=['PUT'])
@AuthService.requerir_autenticacion
def marcar_comanda_impresa(comanda_id):
    """
    Marca una comanda como impresa
    """
    try:
        resultado = VentasServiceAvanzado.marcar_comanda_impresa(comanda_id)
        
        return jsonify({
            'success': True,
            'message': 'Comanda marcada como impresa',
            'data': resultado
        }), 200
    
    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 404
    
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500

# ======================== REPORTES GRANULARES ========================

@ventas_bp.route('/reportes/por-hora', methods=['GET'])
@AuthService.requerir_autenticacion
def reporte_por_hora():
    """
    Reporte de ventas agrupado por hora
    
    Query params:
    - fecha: YYYY-MM-DD (requerido)
    """
    try:
        fecha_str = request.args.get('fecha')
        if not fecha_str:
            return jsonify({
                'success': False,
                'message': 'Parámetro fecha requerido (YYYY-MM-DD)'
            }), 400
        
        fecha = datetime.strptime(fecha_str, '%Y-%m-%d').date()
        
        reporte = VentasServiceAvanzado.reporte_ventas_por_hora(
            usuario_id=request.usuario_id,
            fecha=fecha
        )
        
        return jsonify({
            'success': True,
            'data': reporte
        }), 200
    
    except ValueError as e:
        return jsonify({
            'success': False,
            'message': f'Error en formato de fecha: {str(e)}'
        }), 400
    
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500

@ventas_bp.route('/reportes/por-dia', methods=['GET'])
@AuthService.requerir_autenticacion
def reporte_por_dia():
    """
    Reporte de ventas agrupado por día
    
    Query params:
    - fecha_inicio: YYYY-MM-DD
    - fecha_fin: YYYY-MM-DD
    """
    try:
        fecha_inicio_str = request.args.get('fecha_inicio')
        fecha_fin_str = request.args.get('fecha_fin')
        
        if not fecha_inicio_str or not fecha_fin_str:
            return jsonify({
                'success': False,
                'message': 'Parámetros requeridos: fecha_inicio y fecha_fin (YYYY-MM-DD)'
            }), 400
        
        fecha_inicio = datetime.strptime(fecha_inicio_str, '%Y-%m-%d').date()
        fecha_fin = datetime.strptime(fecha_fin_str, '%Y-%m-%d').date()
        
        if fecha_inicio > fecha_fin:
            return jsonify({
                'success': False,
                'message': 'fecha_inicio no puede ser mayor que fecha_fin'
            }), 400
        
        reporte = VentasServiceAvanzado.reporte_ventas_por_dia(
            usuario_id=request.usuario_id,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin
        )
        
        return jsonify({
            'success': True,
            'data': reporte
        }), 200
    
    except ValueError as e:
        return jsonify({
            'success': False,
            'message': f'Error en formato de fecha: {str(e)}'
        }), 400
    
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500

@ventas_bp.route('/reportes/detallado', methods=['GET'])
@AuthService.requerir_autenticacion
def reporte_detallado():
    """
    Reporte detallado con desglose completo
    
    Query params:
    - fecha_inicio: YYYY-MM-DD
    - fecha_fin: YYYY-MM-DD
    """
    try:
        fecha_inicio_str = request.args.get('fecha_inicio')
        fecha_fin_str = request.args.get('fecha_fin')
        
        if not fecha_inicio_str or not fecha_fin_str:
            return jsonify({
                'success': False,
                'message': 'Parámetros requeridos: fecha_inicio y fecha_fin (YYYY-MM-DD)'
            }), 400
        
        fecha_inicio = datetime.strptime(fecha_inicio_str, '%Y-%m-%d').date()
        fecha_fin = datetime.strptime(fecha_fin_str, '%Y-%m-%d').date()
        
        if fecha_inicio > fecha_fin:
            return jsonify({
                'success': False,
                'message': 'fecha_inicio no puede ser mayor que fecha_fin'
            }), 400
        
        reporte = VentasServiceAvanzado.reporte_detallado_ventas(
            usuario_id=request.usuario_id,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin
        )
        
        return jsonify({
            'success': True,
            'data': reporte
        }), 200
    
    except ValueError as e:
        return jsonify({
            'success': False,
            'message': f'Error en formato de fecha: {str(e)}'
        }), 400
    
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500
