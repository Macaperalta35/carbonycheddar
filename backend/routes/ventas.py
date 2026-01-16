from flask import Blueprint, request, jsonify, render_template_string
from models import db, Venta, VentaItem, Producto, Merma
from datetime import datetime, timedelta
from sqlalchemy import func

ventas_bp = Blueprint('ventas', __name__)

# Crear venta (agrupa múltiples items)
@ventas_bp.route('/ventas', methods=['POST'])
def create_venta():
    data = request.json
    
    try:
        items = data.get('items', [])
        usuario = data.get('usuario', 'anonimo')
        cliente_nombre = data.get('cliente_nombre', '')
        numero_mesa = data.get('numero_mesa', '')
        
        if not items:
            return jsonify({"error": "No hay items en la venta"}), 400
        
        # Validar stock y calcular subtotal
        subtotal = 0
        for item in items:
            producto = Producto.query.get(item['id'])
            
            if not producto:
                return jsonify({"error": f"Producto {item['id']} no encontrado"}), 404
            
            if producto.stock < item['cantidad']:
                return jsonify({"error": f"Stock insuficiente de {producto.nombre}"}), 400
            
            subtotal += item['precio'] * item['cantidad']
        
        # Crear venta principal
        iva = round(subtotal * 0.19, 2)
        propina = round(subtotal * 0.10, 2)  # 10% de propina
        total = subtotal + iva + propina
        
        venta = Venta(
            usuario=usuario,
            cliente_nombre=cliente_nombre,
            numero_mesa=numero_mesa,
            subtotal=subtotal,
            iva=iva,
            propina=propina,
            total=total
        )
        
        db.session.add(venta)
        db.session.flush()  # Para obtener el ID de la venta
        
        # Crear items de venta
        for item in items:
            producto = Producto.query.get(item['id'])
            
            venta_item = VentaItem(
                venta_id=venta.id,
                producto_id=item['id'],
                cantidad=item['cantidad'],
                precio_unitario=item['precio'],
                subtotal=item['precio'] * item['cantidad'],
                observaciones=item.get('observaciones', '')
            )
            
            # Descontar del stock
            producto.stock -= item['cantidad']
            
            db.session.add(venta_item)
        
        db.session.commit()
        
        return jsonify({
            "status": "venta registrada",
            "venta": venta.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# Obtener todas las ventas
@ventas_bp.route('/ventas', methods=['GET'])
def get_ventas():
    ventas = Venta.query.order_by(Venta.created_at.desc()).all()
    return jsonify([v.to_dict() for v in ventas]), 200

# Obtener una venta por ID
@ventas_bp.route('/ventas/<int:id>', methods=['GET'])
def get_venta(id):
    venta = Venta.query.get(id)
    if not venta:
        return jsonify({"error": "Venta no encontrada"}), 404
    return jsonify(venta.to_dict()), 200

# Voucher HTML (para imprimir)
@ventas_bp.route('/voucher/<int:venta_id>', methods=['GET'])
def get_voucher(venta_id):
    venta = Venta.query.get(venta_id)
    if not venta:
        return jsonify({"error": "Venta no encontrada"}), 404
    
    tipo = request.args.get('tipo', 'cliente')  # cliente o cocina
    
    # Generar líneas de items
    items_html = ""
    for item in venta.items:
        items_html += f"""
        <div class="item">
            <strong>{item.producto_nombre}</strong><br>
            {item.cantidad} x ${item.precio_unitario} = ${item.subtotal}
        </div>
        """
        if item.observaciones:
            items_html += f"<div style='font-size: 11px; color: #666; margin-left: 10px;'>* {item.observaciones}</div>"
    
    html_template = f"""
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Voucher</title>
        <style>
            body {{
                font-family: 'Courier New', monospace;
                margin: 0;
                padding: 10px;
                background: white;
                width: 80mm;
                margin: 0 auto;
            }}
            .voucher {{
                text-align: center;
                border: 1px dashed #333;
                padding: 15px;
            }}
            .header {{
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 10px;
            }}
            .separator {{
                border-top: 1px dashed #333;
                margin: 10px 0;
            }}
            .item {{
                text-align: left;
                margin: 5px 0;
                font-size: 12px;
            }}
            .row {{
                display: flex;
                justify-content: space-between;
                font-size: 12px;
                text-align: left;
            }}
            .tipo {{
                font-weight: bold;
                color: red;
                font-size: 14px;
                margin: 10px 0;
            }}
            .total {{
                font-weight: bold;
                font-size: 16px;
                margin-top: 10px;
            }}
            @media print {{
                body {{ margin: 0; padding: 0; }}
                .voucher {{ border: none; }}
            }}
        </style>
    </head>
    <body>
        <div class="voucher">
            <div class="header">🍔 CARBON & CHEDDAR</div>
            <div class="separator"></div>
            
            <div class="tipo">{'COPIA COCINA' if tipo == 'cocina' else 'COPIA CLIENTE'}</div>
            <div class="separator"></div>
            
            <div style="text-align: left; font-size: 12px;">
                <strong>Orden #{venta.id}</strong><br>
                Hora: {venta.created_at.strftime('%H:%M:%S')}<br>
                Cajero: {venta.usuario}
            </div>
            
            {f'<div style="text-align: left; font-size: 12px; margin-top: 5px;"><strong>Mesa:</strong> {venta.numero_mesa}</div>' if venta.numero_mesa else ''}
            {f'<div style="text-align: left; font-size: 12px;"><strong>Cliente:</strong> {venta.cliente_nombre}</div>' if venta.cliente_nombre else ''}
            
            <div class="separator"></div>
            
            {items_html}
            
            <div class="separator"></div>
            
            <div class="row">
                <span>Subtotal:</span>
                <span>${venta.subtotal}</span>
            </div>
            <div class="row">
                <span>IVA (19%):</span>
                <span>${venta.iva}</span>
            </div>
            <div class="row">
                <span>Propina (10%):</span>
                <span>${venta.propina}</span>
            </div>
            
            <div class="separator"></div>
            
            <div class="row total">
                <span>TOTAL:</span>
                <span>${venta.total}</span>
            </div>
            
            <div class="separator"></div>
            <div style="font-size: 11px; margin-top: 10px;">¡GRACIAS POR SU COMPRA!</div>
        </div>
        <script>
            window.print();
        </script>
    </body>
    </html>
    """
    
    return render_template_string(html_template)

# Reportes - Ventas por hora
@ventas_bp.route('/reportes/ventas-por-hora', methods=['GET'])
def ventas_por_hora():
    ahora = datetime.utcnow()
    hace_24h = ahora - timedelta(hours=24)
    
    ventas = db.session.query(
        func.strftime('%H', Venta.created_at).label('hora'),
        func.count(Venta.id).label('cantidad_ventas'),
        func.sum(Venta.total).label('total')
    ).filter(
        Venta.created_at >= hace_24h
    ).group_by(func.strftime('%H', Venta.created_at)).all()
    
    resultado = [{
        'hora': (v[0] + ':00') if v[0] else '00:00',
        'cantidad_ventas': v[1],
        'total': round(v[2], 2) if v[2] else 0
    } for v in ventas]
    
    # Si no hay datos, retornar array vacío en lugar de None
    return jsonify(resultado if resultado else []), 200

# Reportes - Ventas diarias
@ventas_bp.route('/reportes/ventas-diarias', methods=['GET'])
def ventas_diarias():
    dias = request.args.get('dias', 7, type=int)
    
    ahora = datetime.utcnow()
    hace_n_dias = ahora - timedelta(days=dias)
    
    ventas = db.session.query(
        func.date(Venta.created_at).label('fecha'),
        func.count(Venta.id).label('cantidad_ventas'),
        func.sum(Venta.total).label('total')
    ).filter(
        Venta.created_at >= hace_n_dias
    ).group_by(func.date(Venta.created_at)).all()
    
    resultado = [{
        'fecha': str(v[0]) if v[0] else 'N/A',
        'cantidad_ventas': v[1],
        'total': round(v[2], 2) if v[2] else 0
    } for v in ventas]
    
    return jsonify(resultado if resultado else []), 200

# Reportes - Productos más vendidos
@ventas_bp.route('/reportes/productos-mas-vendidos', methods=['GET'])
def productos_mas_vendidos():
    limite = request.args.get('limite', 10, type=int)
    
    productos = db.session.query(
        Producto.id,
        Producto.nombre,
        func.sum(VentaItem.cantidad).label('cantidad_vendida'),
        func.sum(VentaItem.subtotal).label('total_ventas')
    ).join(VentaItem, Producto.id == VentaItem.producto_id).group_by(Producto.id).order_by(
        func.sum(VentaItem.cantidad).desc()
    ).limit(limite).all()
    
    resultado = [{
        'producto_id': p[0],
        'producto_nombre': p[1],
        'cantidad_vendida': p[2] or 0,
        'total_ventas': round(p[3], 2) if p[3] else 0
    } for p in productos]
    
    return jsonify(resultado), 200

# Reportes - Resumen general
@ventas_bp.route('/reportes/resumen', methods=['GET'])
def resumen_ventas():
    ahora = datetime.utcnow()
    hoy = ahora.replace(hour=0, minute=0, second=0, microsecond=0)
    hace_7_dias = ahora - timedelta(days=7)
    
    # Hoy
    ventas_hoy = db.session.query(
        func.count(Venta.id),
        func.sum(Venta.total)
    ).filter(Venta.created_at >= hoy).first()
    
    # Últimos 7 días
    ventas_7_dias = db.session.query(
        func.count(Venta.id),
        func.sum(Venta.total)
    ).filter(Venta.created_at >= hace_7_dias).first()
    
    # Total
    ventas_totales = db.session.query(
        func.count(Venta.id),
        func.sum(Venta.total)
    ).first()
    
    # Stock
    productos = Producto.query.all()
    stock_total = sum(p.stock for p in productos)
    valor_stock = sum(p.stock * p.precio for p in productos)
    
    return jsonify({
        'hoy': {
            'cantidad_ventas': ventas_hoy[0] or 0,
            'total': round(ventas_hoy[1], 2) if ventas_hoy[1] else 0
        },
        'ultimos_7_dias': {
            'cantidad_ventas': ventas_7_dias[0] or 0,
            'total': round(ventas_7_dias[1], 2) if ventas_7_dias[1] else 0
        },
        'total': {
            'cantidad_ventas': ventas_totales[0] or 0,
            'total': round(ventas_totales[1], 2) if ventas_totales[1] else 0
        },
        'inventario': {
            'cantidad_productos': len(productos),
            'stock_total': stock_total,
            'valor_stock': round(valor_stock, 2)
        }
    }), 200
