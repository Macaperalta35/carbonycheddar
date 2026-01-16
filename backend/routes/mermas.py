from flask import Blueprint, request, jsonify
from models import db, Merma, Producto
from datetime import datetime, timedelta
from sqlalchemy import func

mermas_bp = Blueprint('mermas', __name__)

# Registrar merma
@mermas_bp.route('/mermas', methods=['POST'])
def create_merma():
    data = request.json
    
    try:
        producto_id = data.get('producto_id')
        cantidad = int(data.get('cantidad', 0))
        razon = data.get('razon', 'Sin especificar')
        usuario = data.get('usuario', 'anonimo')
        
        producto = Producto.query.get(producto_id)
        if not producto:
            return jsonify({"error": "Producto no encontrado"}), 404
        
        if producto.stock < cantidad:
            return jsonify({"error": f"Stock insuficiente. Disponible: {producto.stock}"}), 400
        
        # Crear merma
        merma = Merma(
            producto_id=producto_id,
            cantidad=cantidad,
            razon=razon,
            usuario=usuario
        )
        
        # Descontar del stock
        producto.stock -= cantidad
        
        db.session.add(merma)
        db.session.commit()
        
        return jsonify({
            "status": "merma registrada",
            "merma": merma.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# Obtener todas las mermas
@mermas_bp.route('/mermas', methods=['GET'])
def get_mermas():
    mermas = Merma.query.order_by(Merma.created_at.desc()).all()
    return jsonify([m.to_dict() for m in mermas]), 200

# Obtener mermas por producto
@mermas_bp.route('/mermas/producto/<int:producto_id>', methods=['GET'])
def get_mermas_producto(producto_id):
    mermas = Merma.query.filter_by(producto_id=producto_id).order_by(Merma.created_at.desc()).all()
    return jsonify([m.to_dict() for m in mermas]), 200

# Reportes - Mermas por producto
@mermas_bp.route('/reportes/mermas-por-producto', methods=['GET'])
def mermas_por_producto():
    mermas = db.session.query(
        Producto.id,
        Producto.nombre,
        func.sum(Merma.cantidad).label('cantidad_mermas'),
        func.count(Merma.id).label('cantidad_registros')
    ).join(Merma).group_by(Producto.id).order_by(
        func.sum(Merma.cantidad).desc()
    ).all()
    
    resultado = [{
        'producto_id': m[0],
        'producto_nombre': m[1],
        'cantidad_mermas': m[2],
        'cantidad_registros': m[3]
    } for m in mermas]
    
    return jsonify(resultado), 200

# Reportes - Mermas por razón
@mermas_bp.route('/reportes/mermas-por-razon', methods=['GET'])
def mermas_por_razon():
    mermas = db.session.query(
        Merma.razon,
        func.sum(Merma.cantidad).label('cantidad'),
        func.count(Merma.id).label('registros')
    ).group_by(Merma.razon).order_by(
        func.sum(Merma.cantidad).desc()
    ).all()
    
    resultado = [{
        'razon': m[0] or 'Sin especificar',
        'cantidad': m[1],
        'registros': m[2]
    } for m in mermas]
    
    return jsonify(resultado), 200

# Reportes - Mermas diarias
@mermas_bp.route('/reportes/mermas-diarias', methods=['GET'])
def mermas_diarias():
    dias = request.args.get('dias', 7, type=int)
    
    ahora = datetime.utcnow()
    hace_n_dias = ahora - timedelta(days=dias)
    
    mermas = db.session.query(
        func.date(Merma.created_at).label('fecha'),
        func.sum(Merma.cantidad).label('cantidad'),
        func.count(Merma.id).label('registros')
    ).filter(
        Merma.created_at >= hace_n_dias
    ).group_by('fecha').all()
    
    resultado = [{
        'fecha': str(m[0]) if m[0] else 'N/A',
        'cantidad': m[1],
        'registros': m[2]
    } for m in mermas]
    
    return jsonify(resultado), 200
