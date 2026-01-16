from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from services.ventas_service import registrar_venta

ventas_bp = Blueprint("ventas", __name__)

@ventas_bp.route("/api/ventas", methods=["POST"])
@jwt_required()
def post_venta():
    data = request.json
    registrar_venta(
        data["producto_id"],
        data["cantidad"],
        data["cliente"],
        data["mesa"]
    )
    return jsonify({"msg": "Venta registrada"}), 201
