from flask import Flask, jsonify
from flask_cors import CORS
import sys
import os

# Añadir la carpeta actual al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models import db, Usuario, Ingrediente, Producto, Receta, RecetaIngrediente
from routes.auth import auth_bp
from routes.recetas import recetas_bp
from routes.ingredientes import ingredientes_bp
from routes.productos import productos_bp
from routes.ventas import ventas_bp
from routes.ventas_avanzado import ventas_bp as ventas_avanzado_bp
from routes.mermas import mermas_bp
from routes.admin_usuarios import admin_bp
from routes.inventario import inventario_bp

app = Flask(__name__)

# Configuración de BD
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///carbo_cheddar_new.db'
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
app.register_blueprint(admin_bp) # /api/admin
app.register_blueprint(inventario_bp) # /api/inventario

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        "message": "API Carbon y Cheddar - Sistema de Gestión de Recetas",
        "versión": "3.1",
        "endpoints": {
            "autenticación": "/api/auth/*",
            "recetas": "/api/recetas/*",
            "ingredientes": "/api/ingredientes/*",
            "reportes": "/api/reportes/*",
            "admin": "/api/admin/*",
            "inventario": "/api/inventario/*"
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
            rol='admin',
            permisos=['ver_ventas', 'ver_recetas', 'ver_reportes', 'ver_inventario', 'admin_usuarios']
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

    # Crear productos de demostración si no existen
    if Producto.query.count() == 0:
        productos_demo = [
            Producto(
                nombre="Hamburguesa Clásica",
                descripcion="Hamburguesa con carne, queso, lechuga y tomate",
                precio=8.50,
                stock=50,
                costo=5.20
            ),
            Producto(
                nombre="Papas Fritas",
                descripcion="Porción de papas fritas",
                precio=3.00,
                stock=100,
                costo=1.50
            ),
            Producto(
                nombre="Refresco",
                descripcion="Bebida gaseosa 500ml",
                precio=2.50,
                stock=200,
                costo=1.00
            ),
            Producto(
                nombre="Helado",
                descripcion="Cono de helado de vainilla",
                precio=2.00,
                stock=80,
                costo=0.80
            )
        ]
        for prod in productos_demo:
            db.session.add(prod)
        db.session.commit()
        print("✓ Productos de demostración creados")

    # Crear recetas de demostración si no existen
    if Receta.query.count() == 0:
        # Obtener usuario demo
        usuario = Usuario.query.filter_by(email="demo@example.com").first()
        if usuario:
            # Obtener ingredientes
            carne = Ingrediente.query.filter_by(nombre="Carne molida").first()
            pan = Ingrediente.query.filter_by(nombre="Pan para burger").first()
            queso = Ingrediente.query.filter_by(nombre="Queso cheddar").first()
            lechuga = Ingrediente.query.filter_by(nombre="Lechuga").first()
            tomate = Ingrediente.query.filter_by(nombre="Tomate").first()
            bacon = Ingrediente.query.filter_by(nombre="Bacon").first()
            cebolla = Ingrediente.query.filter_by(nombre="Cebolla").first()
            mayonesa = Ingrediente.query.filter_by(nombre="Mayonesa").first()

            # Receta 1: Hamburguesa Clásica
            receta1 = Receta(
                usuario_id=usuario.id,
                nombre="Hamburguesa Clásica",
                descripcion="Hamburguesa tradicional con carne, queso y vegetales",
                rendimiento_porciones=1,
                precio_venta=8.50
            )
            db.session.add(receta1)
            db.session.commit()  # Commit para obtener el ID

            # Ingredientes de la receta 1
            ingredientes_receta1 = [
                RecetaIngrediente(receta_id=receta1.id, ingrediente_id=carne.id, cantidad=0.15, costo_calculado=0.15 * carne.costo_unitario),
                RecetaIngrediente(receta_id=receta1.id, ingrediente_id=pan.id, cantidad=1, costo_calculado=1 * pan.costo_unitario),
                RecetaIngrediente(receta_id=receta1.id, ingrediente_id=queso.id, cantidad=0.03, costo_calculado=0.03 * queso.costo_unitario),
                RecetaIngrediente(receta_id=receta1.id, ingrediente_id=lechuga.id, cantidad=0.02, costo_calculado=0.02 * lechuga.costo_unitario),
                RecetaIngrediente(receta_id=receta1.id, ingrediente_id=tomate.id, cantidad=0.02, costo_calculado=0.02 * tomate.costo_unitario),
                RecetaIngrediente(receta_id=receta1.id, ingrediente_id=cebolla.id, cantidad=0.01, costo_calculado=0.01 * cebolla.costo_unitario),
                RecetaIngrediente(receta_id=receta1.id, ingrediente_id=mayonesa.id, cantidad=0.01, costo_calculado=0.01 * mayonesa.costo_unitario)
            ]
            for ing_rec in ingredientes_receta1:
                db.session.add(ing_rec)

            # Calcular costo total de la receta 1
            costo_total1 = sum(ing.costo_calculado for ing in ingredientes_receta1)
            receta1.costo_total = costo_total1
            receta1.costo_por_porcion = costo_total1 / receta1.rendimiento_porciones
            receta1.margen_porcentaje = ((receta1.precio_venta - receta1.costo_por_porcion) / receta1.costo_por_porcion) * 100
            receta1.utilidad_total = (receta1.precio_venta - receta1.costo_por_porcion) * receta1.rendimiento_porciones

            # Receta 2: Hamburguesa con Bacon
            receta2 = Receta(
                usuario_id=usuario.id,
                nombre="Hamburguesa con Bacon",
                descripcion="Hamburguesa premium con bacon ahumado",
                rendimiento_porciones=1,
                precio_venta=10.50
            )
            db.session.add(receta2)
            db.session.commit()

            # Ingredientes de la receta 2
            ingredientes_receta2 = [
                RecetaIngrediente(receta_id=receta2.id, ingrediente_id=carne.id, cantidad=0.15, costo_calculado=0.15 * carne.costo_unitario),
                RecetaIngrediente(receta_id=receta2.id, ingrediente_id=pan.id, cantidad=1, costo_calculado=1 * pan.costo_unitario),
                RecetaIngrediente(receta_id=receta2.id, ingrediente_id=queso.id, cantidad=0.03, costo_calculado=0.03 * queso.costo_unitario),
                RecetaIngrediente(receta_id=receta2.id, ingrediente_id=bacon.id, cantidad=0.02, costo_calculado=0.02 * bacon.costo_unitario),
                RecetaIngrediente(receta_id=receta2.id, ingrediente_id=lechuga.id, cantidad=0.02, costo_calculado=0.02 * lechuga.costo_unitario),
                RecetaIngrediente(receta_id=receta2.id, ingrediente_id=tomate.id, cantidad=0.02, costo_calculado=0.02 * tomate.costo_unitario),
                RecetaIngrediente(receta_id=receta2.id, ingrediente_id=cebolla.id, cantidad=0.01, costo_calculado=0.01 * cebolla.costo_unitario),
                RecetaIngrediente(receta_id=receta2.id, ingrediente_id=mayonesa.id, cantidad=0.01, costo_calculado=0.01 * mayonesa.costo_unitario)
            ]
            for ing_rec in ingredientes_receta2:
                db.session.add(ing_rec)

            # Calcular costo total de la receta 2
            costo_total2 = sum(ing.costo_calculado for ing in ingredientes_receta2)
            receta2.costo_total = costo_total2
            receta2.costo_por_porcion = costo_total2 / receta2.rendimiento_porciones
            receta2.margen_porcentaje = ((receta2.precio_venta - receta2.costo_por_porcion) / receta2.costo_por_porcion) * 100
            receta2.utilidad_total = (receta2.precio_venta - receta2.costo_por_porcion) * receta2.rendimiento_porciones

            db.session.commit()
            print("✓ Recetas de demostración creadas")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
