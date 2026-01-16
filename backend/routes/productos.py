from flask import Blueprint, request, jsonify
from models import db, Producto

productos_bp = Blueprint('productos', __name__)

def require_admin(request):
    """Verifica si el usuario es admin"""
    is_admin = request.headers.get('X-Is-Admin', 'false').lower() == 'true'
    if not is_admin:
        return False
    return True

# Obtener todos los productos
@productos_bp.route('/productos', methods=['GET'])
def get_productos():
    productos = Producto.query.all()
    return jsonify([p.to_dict() for p in productos]), 200

# Obtener un producto por ID
@productos_bp.route('/productos/<int:id>', methods=['GET'])
def get_producto(id):
    producto = Producto.query.get(id)
    if not producto:
        return jsonify({"error": "Producto no encontrado"}), 404
    return jsonify(producto.to_dict()), 200

# Crear producto (SOLO ADMIN)
@productos_bp.route('/productos', methods=['POST'])
def create_producto():
    if not require_admin(request):
        return jsonify({"error": "Solo administradores pueden crear productos"}), 403
    
    data = request.json
    
    if not data.get('nombre') or not data.get('precio'):
        return jsonify({"error": "Nombre y precio son requeridos"}), 400
    
    producto = Producto(
        nombre=data['nombre'],
        descripcion=data.get('descripcion', ''),
        precio=float(data['precio']),
        stock=int(data.get('stock', 0)),
        costo=float(data.get('costo', 0))
    )
    
    db.session.add(producto)
    db.session.commit()
    
    return jsonify(producto.to_dict()), 201

# Actualizar producto (SOLO ADMIN)
@productos_bp.route('/productos/<int:id>', methods=['PUT'])
def update_producto(id):
    if not require_admin(request):
        return jsonify({"error": "Solo administradores pueden actualizar productos"}), 403
    
    producto = Producto.query.get(id)
    if not producto:
        return jsonify({"error": "Producto no encontrado"}), 404
    
    data = request.json
    
    if 'nombre' in data:
        producto.nombre = data['nombre']
    if 'descripcion' in data:
        producto.descripcion = data['descripcion']
    if 'precio' in data:
        producto.precio = float(data['precio'])
    if 'stock' in data:
        producto.stock = int(data['stock'])
    if 'costo' in data:
        producto.costo = float(data['costo'])
    
    db.session.commit()
    
    return jsonify(producto.to_dict()), 200

# Eliminar producto (SOLO ADMIN)
@productos_bp.route('/productos/<int:id>', methods=['DELETE'])
def delete_producto(id):
    if not require_admin(request):
        return jsonify({"error": "Solo administradores pueden eliminar productos"}), 403
    
    producto = Producto.query.get(id)
    if not producto:
        return jsonify({"error": "Producto no encontrado"}), 404
    
    db.session.delete(producto)
    db.session.commit()
    
    return jsonify({"message": "Producto eliminado"}), 200

# Actualizar stock (SOLO ADMIN)
@productos_bp.route('/productos/<int:id>/stock', methods=['PATCH'])
def update_stock(id):
    if not require_admin(request):
        return jsonify({"error": "Solo administradores pueden actualizar stock"}), 403
    
    producto = Producto.query.get(id)
    if not producto:
        return jsonify({"error": "Producto no encontrado"}), 404
    
    data = request.json
    cantidad = int(data.get('cantidad', 0))
    
    producto.stock += cantidad
    db.session.commit()
    
    return jsonify({
        "message": "Stock actualizado",
        "producto": producto.to_dict()
    }), 200
