from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from services.productos_service import listar_productos, crear_producto

productos_bp = Blueprint("productos", __name__)

@productos_bp.route("/api/productos", methods=["GET"])
def get_productos():
    return jsonify(listar_productos())

@productos_bp.route("/api/productos", methods=["POST"])
@jwt_required()
def post_producto():
    data = request.json
    crear_producto(data["nombre"], data["precio"], data["costo"])
    return jsonify({"msg": "Producto creado"}), 201
