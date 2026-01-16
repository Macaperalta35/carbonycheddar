"""
Endpoints para gestión de ingredientes.
"""
from flask import Blueprint, request, jsonify
from models import db
from services.auth_service import AuthService
from services.ingredientes_service import IngredienteService
from services.calculos_service import GeneradorReportes

ingredientes_bp = Blueprint('ingredientes', __name__)


@ingredientes_bp.route('/ingredientes', methods=['GET'])
@AuthService.requerir_autenticacion
def listar_ingredientes():
    """
    Endpoint para listar todos los ingredientes.
    
    Query Parameters:
        pagina: int (default 1)
        por_pagina: int (default 20)
        buscar: string (opcional)
    
    Returns:
        {
            "total": int,
            "ingredientes": [...]
        }
    """
    try:
        buscar = request.args.get('buscar', '')
        
        if buscar:
            ingredientes = IngredienteService.buscar_ingredientes(buscar)
            return jsonify({
                'total': len(ingredientes),
                'ingredientes': ingredientes
            }), 200
        
        pagina = request.args.get('pagina', 1, type=int)
        por_pagina = request.args.get('por_pagina', 20, type=int)
        
        resultado = IngredienteService.listar_ingredientes(
            pagina=pagina,
            por_pagina=por_pagina
        )
        
        return jsonify(resultado), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@ingredientes_bp.route('/ingredientes', methods=['POST'])
@AuthService.requerir_autenticacion
@AuthService.requerir_rol('admin')
def crear_ingrediente():
    """
    Endpoint para crear un nuevo ingrediente. Requiere rol admin.
    
    Body:
        {
            "nombre": "string",
            "descripcion": "string",
            "unidad_medida": "string",
            "costo_unitario": float
        }
    
    Returns:
        {
            "mensaje": "Ingrediente creado",
            "ingrediente": {...}
        }
    """
    try:
        datos = request.get_json()
        
        if not datos:
            return jsonify({'error': 'No se proporcionaron datos'}), 400
        
        # Validar campos requeridos
        campos_requeridos = ['nombre', 'unidad_medida', 'costo_unitario']
        for campo in campos_requeridos:
            if campo not in datos or datos[campo] is None:
                return jsonify({'error': f'Campo requerido: {campo}'}), 400
        
        ingrediente, error = IngredienteService.crear_ingrediente(datos)
        
        if error:
            return jsonify({'error': error}), 400
        
        return jsonify({
            'mensaje': 'Ingrediente creado exitosamente',
            'ingrediente': ingrediente.to_dict()
        }), 201
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@ingredientes_bp.route('/ingredientes/<int:ingrediente_id>', methods=['GET'])
@AuthService.requerir_autenticacion
def obtener_ingrediente(ingrediente_id):
    """
    Endpoint para obtener un ingrediente específico.
    
    Returns:
        {
            "ingrediente": {...}
        }
    """
    try:
        ingrediente = IngredienteService.obtener_ingrediente(ingrediente_id)
        
        if not ingrediente:
            return jsonify({'error': 'Ingrediente no encontrado'}), 404
        
        return jsonify({
            'ingrediente': ingrediente.to_dict()
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@ingredientes_bp.route('/ingredientes/<int:ingrediente_id>', methods=['PUT'])
@AuthService.requerir_autenticacion
@AuthService.requerir_rol('admin')
def actualizar_ingrediente(ingrediente_id):
    """
    Endpoint para actualizar un ingrediente. Requiere rol admin.
    
    Body:
        {
            "nombre": "string",
            "descripcion": "string",
            "unidad_medida": "string",
            "costo_unitario": float
        }
    
    Returns:
        {
            "mensaje": "Ingrediente actualizado",
            "ingrediente": {...}
        }
    """
    try:
        datos = request.get_json()
        
        if not datos:
            return jsonify({'error': 'No se proporcionaron datos'}), 400
        
        ingrediente, error = IngredienteService.actualizar_ingrediente(ingrediente_id, datos)
        
        if error:
            return jsonify({'error': error}), 404 if 'no encontrado' in error else 400
        
        return jsonify({
            'mensaje': 'Ingrediente actualizado exitosamente',
            'ingrediente': ingrediente.to_dict()
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@ingredientes_bp.route('/ingredientes/<int:ingrediente_id>', methods=['DELETE'])
@AuthService.requerir_autenticacion
@AuthService.requerir_rol('admin')
def eliminar_ingrediente(ingrediente_id):
    """
    Endpoint para eliminar un ingrediente. Requiere rol admin.
    
    Returns:
        {
            "mensaje": "Ingrediente eliminado"
        }
    """
    try:
        success, error = IngredienteService.eliminar_ingrediente(ingrediente_id)
        
        if not success:
            return jsonify({'error': error}), 404 if 'no encontrado' in error else 400
        
        return jsonify({
            'mensaje': 'Ingrediente eliminado exitosamente'
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@ingredientes_bp.route('/ingredientes/<int:ingrediente_id>/historial', methods=['GET'])
@AuthService.requerir_autenticacion
def obtener_historial_costos(ingrediente_id):
    """
    Endpoint para obtener el historial de cambios de costo de un ingrediente.
    
    Query Parameters:
        limite: int (default 10)
    
    Returns:
        {
            "historial": [...]
        }
    """
    try:
        limite = request.args.get('limite', 10, type=int)
        
        ingrediente = IngredienteService.obtener_ingrediente(ingrediente_id)
        
        if not ingrediente:
            return jsonify({'error': 'Ingrediente no encontrado'}), 404
        
        historial = IngredienteService.obtener_historial_costos(ingrediente_id, limite)
        
        return jsonify({
            'ingrediente_nombre': ingrediente.nombre,
            'historial': historial
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============= REPORTES =============

@ingredientes_bp.route('/reportes/ingredientes', methods=['GET'])
@AuthService.requerir_autenticacion
def reporte_ingredientes():
    """
    Endpoint para obtener un reporte de todos los ingredientes y sus costos.
    
    Returns:
        {
            "total_ingredientes": int,
            "costo_promedio": float,
            "ingredientes": [...]
        }
    """
    try:
        from models import Ingrediente
        
        ingredientes = Ingrediente.query.all()
        reporte = GeneradorReportes.reporte_ingredientes_costos(ingredientes)
        
        return jsonify(reporte), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
