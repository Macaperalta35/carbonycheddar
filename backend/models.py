from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

# ============= USUARIOS Y AUTENTICACIÓN =============
class Usuario(db.Model):
    __tablename__ = 'usuarios'
    
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    rol = db.Column(db.String(20), default='user')  # admin, manager, user
    activo = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    recetas = db.relationship('Receta', backref='usuario', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'email': self.email,
            'rol': self.rol,
            'activo': self.activo,
            'created_at': self.created_at.isoformat()
        }

# ============= INGREDIENTES =============
class Ingrediente(db.Model):
    __tablename__ = 'ingredientes'
    
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False, unique=True)
    descripcion = db.Column(db.String(255))
    unidad_medida = db.Column(db.String(50), nullable=False)  # kg, l, unidad, etc.
    costo_unitario = db.Column(db.Float, nullable=False)  # Costo por unidad actual
    costo_anterior = db.Column(db.Float, default=0)  # Historial
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    receta_ingredientes = db.relationship('RecetaIngrediente', backref='ingrediente', lazy=True, cascade='all, delete-orphan')
    historial_costos = db.relationship('HistorialCostoIngrediente', backref='ingrediente', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'descripcion': self.descripcion,
            'unidad_medida': self.unidad_medida,
            'costo_unitario': self.costo_unitario,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

# ============= HISTORIAL DE COSTOS =============
class HistorialCostoIngrediente(db.Model):
    __tablename__ = 'historial_costo_ingrediente'
    
    id = db.Column(db.Integer, primary_key=True)
    ingrediente_id = db.Column(db.Integer, db.ForeignKey('ingredientes.id'), nullable=False)
    costo_anterior = db.Column(db.Float, nullable=False)
    costo_nuevo = db.Column(db.Float, nullable=False)
    fecha_cambio = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'ingrediente_id': self.ingrediente_id,
            'costo_anterior': self.costo_anterior,
            'costo_nuevo': self.costo_nuevo,
            'fecha_cambio': self.fecha_cambio.isoformat()
        }

# ============= RECETAS =============
class Receta(db.Model):
    __tablename__ = 'recetas'
    
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    nombre = db.Column(db.String(100), nullable=False)
    descripcion = db.Column(db.String(255))
    rendimiento_porciones = db.Column(db.Integer, default=1)  # Cuántas porciones produce
    costo_total = db.Column(db.Float, default=0)  # Costo calculado automáticamente
    costo_por_porcion = db.Column(db.Float, default=0)  # Costo unitario
    precio_venta = db.Column(db.Float, nullable=False)  # Precio de venta establecido
    margen_porcentaje = db.Column(db.Float, default=0)  # % de margen
    utilidad_total = db.Column(db.Float, default=0)  # Utilidad total = (precio - costo) * porciones
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    ingredientes = db.relationship('RecetaIngrediente', backref='receta', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self, incluir_ingredientes=True):
        datos = {
            'id': self.id,
            'usuario_id': self.usuario_id,
            'nombre': self.nombre,
            'descripcion': self.descripcion,
            'rendimiento_porciones': self.rendimiento_porciones,
            'costo_total': round(self.costo_total, 2),
            'costo_por_porcion': round(self.costo_por_porcion, 2),
            'precio_venta': self.precio_venta,
            'margen_porcentaje': round(self.margen_porcentaje, 2),
            'utilidad_total': round(self.utilidad_total, 2),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        
        if incluir_ingredientes:
            datos['ingredientes'] = [ing.to_dict() for ing in self.ingredientes]
        
        return datos

# ============= INGREDIENTES EN RECETAS =============
class RecetaIngrediente(db.Model):
    __tablename__ = 'receta_ingredientes'
    
    id = db.Column(db.Integer, primary_key=True)
    receta_id = db.Column(db.Integer, db.ForeignKey('recetas.id'), nullable=False)
    ingrediente_id = db.Column(db.Integer, db.ForeignKey('ingredientes.id'), nullable=False)
    cantidad = db.Column(db.Float, nullable=False)  # Cantidad utilizada
    costo_calculado = db.Column(db.Float, default=0)  # Costo = cantidad * costo_unitario del ingrediente
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'receta_id': self.receta_id,
            'ingrediente_id': self.ingrediente_id,
            'ingrediente_nombre': self.ingrediente.nombre,
            'ingrediente_unidad': self.ingrediente.unidad_medida,
            'cantidad': self.cantidad,
            'costo_unitario': self.ingrediente.costo_unitario,
            'costo_calculado': round(self.costo_calculado, 2),
            'created_at': self.created_at.isoformat()
        }

# ============= PRODUCTOS LEGACY =============
class Producto(db.Model):
    __tablename__ = 'productos'
    
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    descripcion = db.Column(db.String(255))
    precio = db.Column(db.Float, nullable=False)
    stock = db.Column(db.Integer, default=0)
    costo = db.Column(db.Float, default=0)  # Costo para calcular ganancias
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'descripcion': self.descripcion,
            'precio': self.precio,
            'stock': self.stock,
            'costo': self.costo,
            'created_at': self.created_at.isoformat()
        }
# ============= VENTAS (LEGACY) =============
class Venta(db.Model):
    __tablename__ = 'ventas'
    
    id = db.Column(db.Integer, primary_key=True)
    usuario = db.Column(db.String(50))
    cliente_nombre = db.Column(db.String(100))
    numero_mesa = db.Column(db.String(20))
    subtotal = db.Column(db.Float, default=0)
    iva = db.Column(db.Float, default=0)
    propina = db.Column(db.Float, default=0)
    total = db.Column(db.Float, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    items = db.relationship('VentaItem', backref='venta', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'usuario': self.usuario,
            'cliente_nombre': self.cliente_nombre,
            'numero_mesa': self.numero_mesa,
            'subtotal': self.subtotal,
            'iva': self.iva,
            'propina': self.propina,
            'total': self.total,
            'items': [item.to_dict() for item in self.items],
            'created_at': self.created_at.isoformat()
        }

class VentaItem(db.Model):
    __tablename__ = 'venta_items'
    
    id = db.Column(db.Integer, primary_key=True)
    venta_id = db.Column(db.Integer, db.ForeignKey('ventas.id'), nullable=False)
    producto_id = db.Column(db.Integer, db.ForeignKey('productos.id'), nullable=False)
    receta_id = db.Column(db.Integer, db.ForeignKey('recetas.id'), nullable=True)  # Si es una receta
    cantidad = db.Column(db.Integer, nullable=False)
    precio_unitario = db.Column(db.Float, nullable=False)
    subtotal = db.Column(db.Float, nullable=False)
    observaciones = db.Column(db.Text, default='')
    es_receta = db.Column(db.Boolean, default=False)  # Para saber si hubo explosión
    explosion_detalles = db.Column(db.Text, default='{}')  # JSON con ingredientes descontados
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    producto = db.relationship('Producto')
    receta = db.relationship('Receta')
    
    def to_dict(self):
        datos = {
            'id': self.id,
            'producto_id': self.producto_id,
            'producto_nombre': self.producto.nombre,
            'cantidad': self.cantidad,
            'precio_unitario': self.precio_unitario,
            'subtotal': self.subtotal,
            'observaciones': self.observaciones,
            'es_receta': self.es_receta,
            'created_at': self.created_at.isoformat()
        }
        
        # Incluir detalles de explosión si aplica
        if self.es_receta and self.explosion_detalles:
            try:
                datos['explosion_detalles'] = json.loads(self.explosion_detalles)
            except:
                datos['explosion_detalles'] = {}
        
        return datos

class Merma(db.Model):
    __tablename__ = 'mermas'
    
    id = db.Column(db.Integer, primary_key=True)
    producto_id = db.Column(db.Integer, db.ForeignKey('productos.id'), nullable=False)
    cantidad = db.Column(db.Integer, nullable=False)
    razon = db.Column(db.String(255))
    usuario = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    producto = db.relationship('Producto')
    
    def to_dict(self):
        return {
            'id': self.id,
            'producto_id': self.producto_id,
            'producto_nombre': self.producto.nombre,
            'cantidad': self.cantidad,
            'razon': self.razon,
            'usuario': self.usuario,
            'created_at': self.created_at.isoformat()
        }

# ============= COMPROBANTES/COMANDAS =============
class Comanda(db.Model):
    __tablename__ = 'comandas'
    
    id = db.Column(db.Integer, primary_key=True)
    venta_id = db.Column(db.Integer, db.ForeignKey('ventas.id'), nullable=False, unique=True)
    tipo_comanda = db.Column(db.String(20), nullable=False)  # 'cocina' o 'caja'
    contenido_html = db.Column(db.Text, nullable=False)  # HTML del comprobante
    contenido_texto = db.Column(db.Text, nullable=False)  # Versión texto para impresora térmica
    impresa = db.Column(db.Boolean, default=False)
    fecha_impresion = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    venta = db.relationship('Venta', backref='comandas')
    
    def to_dict(self):
        return {
            'id': self.id,
            'venta_id': self.venta_id,
            'tipo_comanda': self.tipo_comanda,
            'impresa': self.impresa,
            'fecha_impresion': self.fecha_impresion.isoformat() if self.fecha_impresion else None,
            'created_at': self.created_at.isoformat()
        }
