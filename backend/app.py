from flask import Flask, jsonify
from flask_cors import CORS
import sys
import os

# Añadir la carpeta actual al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models import db, Usuario, Ingrediente
from routes.auth import auth_bp
from routes.recetas import recetas_bp
from routes.ingredientes import ingredientes_bp
from routes.productos import productos_bp
from routes.ventas import ventas_bp
from routes.ventas_avanzado import ventas_bp as ventas_avanzado_bp
from routes.mermas import mermas_bp

app = Flask(__name__)

# Configuración de BD
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///carbo_cheddar.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'tu-clave-secreta-super-segura-aqui')

# Inicializar BD
db.init_app(app)

# Configurar CORS de manera más explícita para evitar errores 405
CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Registrar blueprints de API REST
app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(recetas_bp, url_prefix='/api')
app.register_blueprint(ingredientes_bp, url_prefix='/api')
app.register_blueprint(productos_bp, url_prefix='/api')
app.register_blueprint(ventas_bp, url_prefix='/api')
app.register_blueprint(ventas_avanzado_bp)  # Ya incluye /api/ventas en su prefijo
app.register_blueprint(mermas_bp, url_prefix='/api')

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        "message": "API Carbon y Cheddar - Sistema de Gestión de Recetas",
        "versión": "3.0",
        "endpoints": {
            "autenticación": "/api/auth/*",
            "recetas": "/api/recetas/*",
            "ingredientes": "/api/ingredientes/*",
            "reportes": "/api/reportes/*"
        }
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint no encontrado", "status": 404}), 404

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({"error": "Método HTTP no permitido. Usa GET, POST, PUT o DELETE", "status": 405}), 405

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Error interno del servidor", "status": 500}), 500

# Crear tablas e inicializar datos de demostración
with app.app_context():
    db.create_all()
    
    # Crear usuario de demostración si no existe
    if Usuario.query.count() == 0:
        usuario_demo = Usuario(
            nombre="Usuario Demo",
            email="demo@example.com",
            rol='admin'
        )
        usuario_demo.set_password('demo123')
        db.session.add(usuario_demo)
        db.session.commit()
        print("✓ Usuario de demostración creado: demo@example.com / demo123")
    
    # Crear ingredientes de demostración si no existen
    if Ingrediente.query.count() == 0:
        ingredientes_demo = [
            Ingrediente(
                nombre="Carne molida",
                descripcion="Carne molida de res",
                unidad_medida="kg",
                costo_unitario=12.00
            ),
            Ingrediente(
                nombre="Pan para burger",
                descripcion="Pan brioche para hamburguesas",
                unidad_medida="unidad",
                costo_unitario=0.80
            ),
            Ingrediente(
                nombre="Queso cheddar",
                descripcion="Queso cheddar tajado",
                unidad_medida="kg",
                costo_unitario=15.00
            ),
            Ingrediente(
                nombre="Lechuga",
                descripcion="Lechuga americana",
                unidad_medida="kg",
                costo_unitario=3.50
            ),
            Ingrediente(
                nombre="Tomate",
                descripcion="Tomate para sándwich",
                unidad_medida="kg",
                costo_unitario=4.00
            ),
            Ingrediente(
                nombre="Bacon",
                descripcion="Bacon ahumado",
                unidad_medida="kg",
                costo_unitario=20.00
            ),
            Ingrediente(
                nombre="Cebolla",
                descripcion="Cebolla blanca",
                unidad_medida="kg",
                costo_unitario=2.50
            ),
            Ingrediente(
                nombre="Mayonesa",
                descripcion="Mayonesa artesanal",
                unidad_medida="kg",
                costo_unitario=8.00
            )
        ]
        for ing in ingredientes_demo:
            db.session.add(ing)
        db.session.commit()
        print("✓ Ingredientes de demostración creados")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
