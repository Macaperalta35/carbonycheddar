"""
Endpoints para gestión de recetas.
"""
from flask import Blueprint, request, jsonify
from models import db
from services.auth_service import AuthService
from services.recetas_service import RecetaService
from services.calculos_service import CalculoCostos, GeneradorReportes

recetas_bp = Blueprint('recetas', __name__)


@recetas_bp.route('/recetas', methods=['GET'])
@AuthService.requerir_autenticacion
def listar_recetas():
    """
    Endpoint para listar todas las recetas del usuario autenticado.
    
    Query Parameters:
        pagina: int (default 1)
        por_pagina: int (default 10)
    
    Returns:
        {
            "total": int,
            "pagina": int,
            "recetas": [...]
        }
    """
    try:
        pagina = request.args.get('pagina', 1, type=int)
        por_pagina = request.args.get('por_pagina', 10, type=int)
        
        resultado = RecetaService.listar_recetas_usuario(
            request.usuario_id,
            pagina=pagina,
            por_pagina=por_pagina
        )
        
        return jsonify(resultado), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@recetas_bp.route('/recetas', methods=['POST'])
@AuthService.requerir_autenticacion
def crear_receta():
    """
    Endpoint para crear una nueva receta.
    
    Body:
        {
            "nombre": "string",
            "descripcion": "string",
            "rendimiento_porciones": int,
            "precio_venta": float
        }
    
    Returns:
        {
            "mensaje": "Receta creada",
            "receta": {...}
        }
    """
    try:
        datos = request.get_json()
        
        if not datos:
            return jsonify({'error': 'No se proporcionaron datos'}), 400
        
        # Validar campos requeridos
        if 'nombre' not in datos or not datos['nombre']:
            return jsonify({'error': 'Campo requerido: nombre'}), 400
        
        if 'precio_venta' not in datos or datos['precio_venta'] is None:
            return jsonify({'error': 'Campo requerido: precio_venta'}), 400
        
        receta, error = RecetaService.crear_receta(request.usuario_id, datos)
        
        if error:
            return jsonify({'error': error}), 400
        
        return jsonify({
            'mensaje': 'Receta creada exitosamente',
            'receta': receta.to_dict()
        }), 201
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@recetas_bp.route('/recetas/<int:receta_id>', methods=['GET'])
@AuthService.requerir_autenticacion
def obtener_receta(receta_id):
    """
    Endpoint para obtener una receta específica.
    
    Returns:
        {
            "receta": {...}
        }
    """
    try:
        receta = RecetaService.obtener_receta(receta_id, request.usuario_id)
        
        if not receta:
            return jsonify({'error': 'Receta no encontrada'}), 404
        
        return jsonify({
            'receta': receta.to_dict()
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@recetas_bp.route('/recetas/<int:receta_id>', methods=['PUT'])
@AuthService.requerir_autenticacion
def actualizar_receta(receta_id):
    """
    Endpoint para actualizar una receta.
    
    Body:
        {
            "nombre": "string",
            "descripcion": "string",
            "rendimiento_porciones": int,
            "precio_venta": float
        }
    
    Returns:
        {
            "mensaje": "Receta actualizada",
            "receta": {...}
        }
    """
    try:
        datos = request.get_json()
        
        if not datos:
            return jsonify({'error': 'No se proporcionaron datos'}), 400
        
        receta, error = RecetaService.actualizar_receta(receta_id, request.usuario_id, datos)
        
        if error:
            return jsonify({'error': error}), 404 if 'no encontrada' in error else 400
        
        return jsonify({
            'mensaje': 'Receta actualizada exitosamente',
            'receta': receta.to_dict()
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@recetas_bp.route('/recetas/<int:receta_id>', methods=['DELETE'])
@AuthService.requerir_autenticacion
def eliminar_receta(receta_id):
    """
    Endpoint para eliminar una receta.
    
    Returns:
        {
            "mensaje": "Receta eliminada"
        }
    """
    try:
        success, error = RecetaService.eliminar_receta(receta_id, request.usuario_id)
        
        if not success:
            return jsonify({'error': error}), 404 if 'no encontrada' in error else 400
        
        return jsonify({
            'mensaje': 'Receta eliminada exitosamente'
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============= INGREDIENTES EN RECETAS =============

@recetas_bp.route('/recetas/<int:receta_id>/ingredientes', methods=['POST'])
@AuthService.requerir_autenticacion
def agregar_ingrediente_a_receta(receta_id):
    """
    Endpoint para agregar un ingrediente a una receta.
    
    Body:
        {
            "ingrediente_id": int,
            "cantidad": float
        }
    
    Returns:
        {
            "mensaje": "Ingrediente agregado",
            "receta": {...}
        }
    """
    try:
        datos = request.get_json()
        
        if not datos:
            return jsonify({'error': 'No se proporcionaron datos'}), 400
        
        if 'ingrediente_id' not in datos or 'cantidad' not in datos:
            return jsonify({'error': 'Campos requeridos: ingrediente_id, cantidad'}), 400
        
        ri, error = RecetaService.agregar_ingrediente(
            receta_id,
            request.usuario_id,
            datos['ingrediente_id'],
            datos['cantidad']
        )
        
        if error:
            return jsonify({'error': error}), 404 if 'no encontrada' in error else 400
        
        receta = RecetaService.obtener_receta(receta_id, request.usuario_id)
        
        return jsonify({
            'mensaje': 'Ingrediente agregado exitosamente',
            'receta': receta.to_dict()
        }), 201
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@recetas_bp.route('/recetas/<int:receta_id>/ingredientes/<int:ri_id>', methods=['PUT'])
@AuthService.requerir_autenticacion
def actualizar_cantidad_ingrediente(receta_id, ri_id):
    """
    Endpoint para actualizar la cantidad de un ingrediente en una receta.
    
    Body:
        {
            "cantidad": float
        }
    
    Returns:
        {
            "mensaje": "Cantidad actualizada",
            "receta": {...}
        }
    """
    try:
        datos = request.get_json()
        
        if not datos or 'cantidad' not in datos:
            return jsonify({'error': 'Campo requerido: cantidad'}), 400
        
        ri, error = RecetaService.actualizar_cantidad_ingrediente(
            receta_id,
            request.usuario_id,
            ri_id,
            datos['cantidad']
        )
        
        if error:
            return jsonify({'error': error}), 404 if 'no encontrada' in error else 400
        
        receta = RecetaService.obtener_receta(receta_id, request.usuario_id)
        
        return jsonify({
            'mensaje': 'Cantidad actualizada exitosamente',
            'receta': receta.to_dict()
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@recetas_bp.route('/recetas/<int:receta_id>/ingredientes/<int:ri_id>', methods=['DELETE'])
@AuthService.requerir_autenticacion
def eliminar_ingrediente_de_receta(receta_id, ri_id):
    """
    Endpoint para eliminar un ingrediente de una receta.
    
    Returns:
        {
            "mensaje": "Ingrediente eliminado",
            "receta": {...}
        }
    """
    try:
        success, error = RecetaService.eliminar_ingrediente(receta_id, request.usuario_id, ri_id)
        
        if not success:
            return jsonify({'error': error}), 404 if 'no encontrada' in error else 400
        
        receta = RecetaService.obtener_receta(receta_id, request.usuario_id)
        
        return jsonify({
            'mensaje': 'Ingrediente eliminado exitosamente',
            'receta': receta.to_dict()
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============= REPORTES =============

@recetas_bp.route('/reportes/resumen', methods=['GET'])
@AuthService.requerir_autenticacion
def reporte_resumen():
    """
    Endpoint para obtener un resumen de todas las recetas del usuario.
    
    Returns:
        {
            "total_recetas": int,
            "costo_total_promedio": float,
            "margen_promedio": float,
            "utilidad_total": float,
            "recetas": [...]
        }
    """
    try:
        from models import Receta
        
        recetas = Receta.query.filter_by(usuario_id=request.usuario_id).all()
        reporte = GeneradorReportes.reporte_resumen_recetas(recetas)
        
        return jsonify(reporte), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@recetas_bp.route('/reportes/rentabilidad', methods=['GET'])
@AuthService.requerir_autenticacion
def reporte_rentabilidad():
    """
    Endpoint para obtener un reporte de rentabilidad agrupado por márgenes.
    
    Returns:
        {
            "bajo": {...},
            "medio": {...},
            "alto": {...},
            "muy_alto": {...}
        }
    """
    try:
        from models import Receta
        
        recetas = Receta.query.filter_by(usuario_id=request.usuario_id).all()
        reporte = GeneradorReportes.reporte_rentabilidad_por_margen(recetas)
        
        return jsonify(reporte), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
