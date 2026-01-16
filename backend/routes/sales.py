
from flask import Blueprint, request, jsonify

sales_bp = Blueprint('sales', __name__)

@sales_bp.route('/ventas', methods=['POST'])
def create_sale():
    return jsonify({"status": "venta registrada"})
