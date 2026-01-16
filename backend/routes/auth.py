"""
Endpoints para autenticación y gestión de usuarios.
"""
from flask import Blueprint, request, jsonify
from models import db, Usuario
from services.auth_service import AuthService

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/auth/registro', methods=['POST'])
def registro():
    """
    Endpoint para registrar un nuevo usuario.
    
    Body:
        {
            "nombre": "string",
            "email": "string",
            "password": "string"
        }
    
    Returns:
        {
            "mensaje": "Usuario creado exitosamente",
            "usuario": {...},
            "token": "jwt_token"
        }
    """
    try:
        datos = request.get_json()
        
        if not datos:
            return jsonify({'error': 'No se proporcionaron datos'}), 400
        
        # Validar campos requeridos
        campos_requeridos = ['nombre', 'email', 'password']
        for campo in campos_requeridos:
            if campo not in datos or not datos[campo]:
                return jsonify({'error': f'Campo requerido: {campo}'}), 400
        
        # Verificar si el usuario ya existe
        if Usuario.query.filter_by(email=datos['email']).first():
            return jsonify({'error': 'El email ya está registrado'}), 409
        
        # Crear usuario
        usuario = Usuario(
            nombre=datos['nombre'],
            email=datos['email'],
            rol='user'  # Rol por defecto
        )
        usuario.set_password(datos['password'])
        
        db.session.add(usuario)
        db.session.commit()
        
        # Generar token
        token = AuthService.generar_token(usuario)
        
        return jsonify({
            'mensaje': 'Usuario creado exitosamente',
            'usuario': usuario.to_dict(),
            'token': token
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/auth/login', methods=['POST'])
def login():
    """
    Endpoint para iniciar sesión.
    
    Body:
        {
            "email": "string",
            "password": "string"
        }
    
    Returns:
        {
            "mensaje": "Sesión iniciada",
            "usuario": {...},
            "token": "jwt_token"
        }
    """
    try:
        datos = request.get_json()
        
        if not datos:
            return jsonify({'error': 'No se proporcionaron credenciales'}), 400
        
        email = datos.get('email')
        password = datos.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Email y password son requeridos'}), 400
        
        # Buscar usuario
        usuario = Usuario.query.filter_by(email=email).first()
        
        if not usuario or not usuario.check_password(password):
            return jsonify({'error': 'Email o contraseña incorrectos'}), 401
        
        if not usuario.activo:
            return jsonify({'error': 'Usuario inactivo'}), 403
        
        # Generar token
        token = AuthService.generar_token(usuario)
        
        return jsonify({
            'mensaje': 'Sesión iniciada',
            'usuario': usuario.to_dict(),
            'token': token
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/auth/perfil', methods=['GET'])
@AuthService.requerir_autenticacion
def obtener_perfil():
    """
    Endpoint para obtener el perfil del usuario autenticado.
    
    Headers:
        Authorization: Bearer <token>
    
    Returns:
        {
            "usuario": {...}
        }
    """
    try:
        usuario = Usuario.query.get(request.usuario_id)
        
        if not usuario:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        
        return jsonify({
            'usuario': usuario.to_dict()
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/auth/cambiar-password', methods=['PUT'])
@AuthService.requerir_autenticacion
def cambiar_password():
    """
    Endpoint para cambiar la contraseña del usuario.
    
    Headers:
        Authorization: Bearer <token>
    
    Body:
        {
            "password_actual": "string",
            "password_nueva": "string"
        }
    
    Returns:
        {
            "mensaje": "Contraseña cambiada exitosamente"
        }
    """
    try:
        datos = request.get_json()
        
        if not datos:
            return jsonify({'error': 'No se proporcionaron datos'}), 400
        
        usuario = Usuario.query.get(request.usuario_id)
        
        if not usuario:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        
        # Verificar password actual
        if not usuario.check_password(datos.get('password_actual')):
            return jsonify({'error': 'Contraseña actual incorrecta'}), 401
        
        # Establecer nueva contraseña
        usuario.set_password(datos.get('password_nueva'))
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Contraseña cambiada exitosamente'
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/auth/validar-token', methods=['POST'])
def validar_token():
    """
    Endpoint para validar un token JWT.
    
    Body:
        {
            "token": "string"
        }
    
    Returns:
        {
            "valido": true/false,
            "datos": {...}
        }
    """
    try:
        datos = request.get_json()
        token = datos.get('token') if datos else None
        
        if not token:
            return jsonify({'valido': False}), 400
        
        payload = AuthService.verificar_token(token)
        
        if not payload:
            return jsonify({'valido': False}), 401
        
        return jsonify({
            'valido': True,
            'datos': {
                'usuario_id': payload.get('usuario_id'),
                'email': payload.get('email'),
                'rol': payload.get('rol')
            }
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
