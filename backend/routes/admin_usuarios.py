from flask import Blueprint, request, jsonify
from models import db, Usuario
from services.auth_service import AuthService

admin_bp = Blueprint('admin_usuarios', __name__, url_prefix='/api/admin')

@admin_bp.route('/usuarios', methods=['GET'])
@AuthService.requerir_autenticacion
def listar_usuarios():
    """Lista todos los usuarios del sistema"""
    try:
        # Verificar permisos (solo admin)
        if request.usuario.rol != 'admin':
             return jsonify({'error': 'Acceso no autorizado'}), 403

        usuarios = Usuario.query.all()
        return jsonify({
            'success': True,
            'usuarios': [u.to_dict() for u in usuarios]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/usuarios', methods=['POST'])
@AuthService.requerir_autenticacion
def crear_usuario():
    """Crea un nuevo usuario"""
    try:
        if request.usuario.rol != 'admin':
             return jsonify({'error': 'Acceso no autorizado'}), 403
             
        datos = request.get_json()
        
        # Validaciones básicas
        if not datos.get('email') or not datos.get('password') or not datos.get('nombre'):
            return jsonify({'error': 'Faltan campos requeridos'}), 400
            
        if Usuario.query.filter_by(email=datos['email']).first():
            return jsonify({'error': 'El email ya está registrado'}), 400
            
        nuevo_usuario = Usuario(
            nombre=datos['nombre'],
            email=datos['email'],
            rol=datos.get('rol', 'user'),
            permisos=datos.get('permisos', []),
            activo=datos.get('activo', True)
        )
        nuevo_usuario.set_password(datos['password'])
        
        db.session.add(nuevo_usuario)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'mensaje': 'Usuario creado exitosamente',
            'usuario': nuevo_usuario.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/usuarios/<int:id>', methods=['PUT'])
@AuthService.requerir_autenticacion
def actualizar_usuario(id):
    """Actualiza un usuario existente"""
    try:
        if request.usuario.rol != 'admin':
             return jsonify({'error': 'Acceso no autorizado'}), 403
             
        usuario = Usuario.query.get(id)
        if not usuario:
            return jsonify({'error': 'Usuario no encontrado'}), 404
            
        datos = request.get_json()
        
        if 'nombre' in datos:
            usuario.nombre = datos['nombre']
        if 'email' in datos: # Validar unicidad si cambia
            existente = Usuario.query.filter_by(email=datos['email']).first()
            if existente and existente.id != id:
                return jsonify({'error': 'El email ya está en uso'}), 400
            usuario.email = datos['email']
        if 'rol' in datos:
            usuario.rol = datos['rol']
        if 'permisos' in datos:
            usuario.permisos = datos['permisos']
        if 'activo' in datos:
            usuario.activo = datos['activo']
        if 'password' in datos and datos['password']:
            usuario.set_password(datos['password'])
            
        db.session.commit()
        
        return jsonify({
            'success': True,
            'mensaje': 'Usuario actualizado',
            'usuario': usuario.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/usuarios/<int:id>', methods=['DELETE'])
@AuthService.requerir_autenticacion
def eliminar_usuario(id):
    """Elimina (o desactiva) un usuario"""
    try:
        if request.usuario.rol != 'admin':
             return jsonify({'error': 'Acceso no autorizado'}), 403
             
        if id == request.usuario.id:
            return jsonify({'error': 'No puedes eliminarte a ti mismo'}), 400
            
        usuario = Usuario.query.get(id)
        if not usuario:
            return jsonify({'error': 'Usuario no encontrado'}), 404
            
        db.session.delete(usuario)
        db.session.commit()
        
        return jsonify({'success': True, 'mensaje': 'Usuario eliminado'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/logo', methods=['POST'])
@AuthService.requerir_autenticacion
def subir_logo():
    """
    Sube el logo de la empresa.
    Espera form-data con key 'logo'.
    """
    import os
    from werkzeug.utils import secure_filename
    from flask import current_app

    try:
        # Solo admin o staff autorizado
        # if request.usuario.rol != 'admin':
        #      return jsonify({'error': 'Acceso no autorizado'}), 403

        if 'logo' not in request.files:
            return jsonify({'error': 'No se encontró archivo logo'}), 400
            
        file = request.files['logo']
        if file.filename == '':
            return jsonify({'error': 'Nombre de archivo vacío'}), 400
            
        if file:
            filename = 'logo_empresa.jpg' # Forzamos nombre único para reemplazar siempre
            
            # Asegurar directorio uploads
            static_folder = current_app.static_folder or 'static'
            upload_folder = os.path.join(current_app.root_path, static_folder, 'uploads')
            os.makedirs(upload_folder, exist_ok=True)
            
            save_path = os.path.join(upload_folder, filename)
            file.save(save_path)
            
            logo_url = f'/static/uploads/{filename}'
            
            return jsonify({
                'success': True, 
                'mensaje': 'Logo actualizado correctamente',
                'url': logo_url
            }), 200
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500
