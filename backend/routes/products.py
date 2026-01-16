
from flask import Blueprint, jsonify

products_bp = Blueprint('products', __name__)

@products_bp.route('/productos', methods=['GET'])
def get_products():
    return jsonify([
        {"id": 1, "nombre": "Burger Clásica", "precio": 4500},
        {"id": 2, "nombre": "Burger Cheddar", "precio": 5200}
    ])
