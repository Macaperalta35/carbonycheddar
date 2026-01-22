"""
Servicio de autenticación con JWT y manejo de usuarios.
"""
import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify
import os

class AuthService:
    """Servicio de autenticación con JWT."""
    
    # Usar variable de entorno o valor por defecto (CAMBIAR EN PRODUCCIÓN)
    SECRET_KEY = os.getenv('SECRET_KEY', 'tu-clave-secreta-super-segura-aqui')
    TOKEN_EXPIRATION = 24  # horas
    
    @staticmethod
    def generar_token(usuario):
        """
        Genera un JWT token para un usuario.
        
        Args:
            usuario: Objeto Usuario
        
        Returns:
            str: Token JWT
        """
        payload = {
            'usuario_id': usuario.id,
            'email': usuario.email,
            'rol': usuario.rol,
            'iat': datetime.utcnow(),
            'exp': datetime.utcnow() + timedelta(hours=AuthService.TOKEN_EXPIRATION)
        }
        
        token = jwt.encode(payload, AuthService.SECRET_KEY, algorithm='HS256')
        return token
    
    @staticmethod
    def verificar_token(token):
        """
        Verifica y decodifica un JWT token.
        
        Args:
            token: str - Token JWT a verificar
        
        Returns:
            dict: Datos decodificados del token o None si es inválido
        """
        try:
            payload = jwt.decode(token, AuthService.SECRET_KEY, algorithms=['HS256'])
            return payload
        except jwt.ExpiredSignatureError:
            return None  # Token expirado
        except jwt.InvalidTokenError:
            return None  # Token inválido
    
    @staticmethod
    def obtener_token_de_header():
        """
        Extrae el token JWT del header Authorization.
        
        Returns:
            str: Token o None si no existe
        """
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return None
        
        # Esperar formato: "Bearer <token>"
        partes = auth_header.split()
        if len(partes) != 2 or partes[0] != 'Bearer':
            return None
        
        return partes[1]
    
    @staticmethod
    def requerir_autenticacion(f):
        """
        Decorador para proteger endpoints que requieren autenticación.
        
        Usage:
            @auth_bp.route('/ruta-protegida')
            @requerir_autenticacion
            def ruta_protegida():
                usuario_id = request.usuario_id
                ...
        """
        @wraps(f)
        def decorado(*args, **kwargs):
            token = AuthService.obtener_token_de_header()
            
            if not token:
                return jsonify({'error': 'Token faltante'}), 401
            
            payload = AuthService.verificar_token(token)
            
            if not payload:
                return jsonify({'error': 'Token inválido o expirado'}), 401
            
            # Almacenar datos en request para usar en la función
            from models import Usuario
            usuario = Usuario.query.get(payload['usuario_id'])
            
            if not usuario or not usuario.activo:
                 return jsonify({'error': 'Usuario no encontrado o inactivo'}), 401

            request.usuario = usuario
            request.usuario_id = usuario.id # Mantener compatibilidad
            
            return f(*args, **kwargs)
        
        return decorado
    
    @staticmethod
    def requerir_rol(rol_requerido):
        """
        Decorador para proteger endpoints por rol.
        
        Usage:
            @auth_bp.route('/ruta-admin')
            @requerir_autenticacion
            @requerir_rol('admin')
            def ruta_admin():
                ...
        """
        def decorador(f):
            @wraps(f)
            def decorado(*args, **kwargs):
                if not hasattr(request, 'usuario_rol'):
                    return jsonify({'error': 'Usuario no autenticado'}), 401
                
                if request.usuario_rol != rol_requerido:
                    return jsonify({
                        'error': f'Se requiere rol {rol_requerido}. Tu rol es {request.usuario_rol}'
                    }), 403
                
                return f(*args, **kwargs)
            
            return decorado
        
        return decorador
