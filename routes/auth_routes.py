from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from services.auth_service import autenticar

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/api/login", methods=["POST"])
def login():
    data = request.json
    user = autenticar(data["username"], data["password"])
    if not user:
        return jsonify({"error": "Credenciales inválidas"}), 401
    token = create_access_token(identity=user["username"])
    return jsonify(access_token=token)
