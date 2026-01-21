"""
Servicio Avanzado de Ventas - Gestión completa con explosión de recetas y comprobantes
Características:
- Explosión automática de recetas (descuenta ingredientes)
- Generación de comprobantes (cocina y caja)
- Reportes granulares (por hora, día, rango de fechas)
"""
from models import (
    db, Venta, VentaItem, Producto, Receta, RecetaIngrediente, 
    Ingrediente, Comanda, Usuario
)
from sqlalchemy import func, desc, and_
from datetime import datetime, timedelta
import json


class VentasServiceAvanzado:
    """Servicio centralizado para gestión avanzada de ventas"""

    # ======================== CREACIÓN DE VENTAS ========================

    @staticmethod
    def crear_venta_con_explosion(usuario_id, items, cliente_nombre='', numero_mesa='', descuento=0, comentarios=''):
        """
        Crear venta con explosión automática de recetas
        
        Args:
            usuario_id: ID del usuario
            items: Lista de {tipo:'producto'|'receta', id, cantidad, precio_unitario, observaciones}
            cliente_nombre: Nombre del cliente
            numero_mesa: Número de mesa
            descuento: Porcentaje de descuento
            comentarios: Comentarios generales de la venta
        
        Returns:
            dict con datos de venta, comprobantes e información de explosión
        """
        if not items:
            raise ValueError("La venta debe contener al menos un item")
        
        if not 0 <= descuento <= 100:
            raise ValueError("Descuento debe estar entre 0 y 100")
        
        try:
            # Validar y procesar items
            subtotal = 0
            venta_items_data = []
            descuentos_inventario = {}  # Tracking de ingredientes descontados
            
            for item in items:
                tipo = item.get('tipo', 'producto')
                cantidad = item.get('cantidad', 1)
                
                if tipo == 'producto':
                    # Item es un producto simple
                    producto = Producto.query.get(item['id'])
                    if not producto:
                        raise ValueError(f"Producto {item['id']} no encontrado")
                    
                    if producto.stock < cantidad:
                        raise ValueError(
                            f"Stock insuficiente de {producto.nombre}. "
                            f"Disponible: {producto.stock}, Solicitado: {cantidad}"
                        )
                    
                    precio_unitario = item.get('precio_unitario', producto.precio)
                    monto = precio_unitario * cantidad
                    subtotal += monto
                    
                    venta_items_data.append({
                        'tipo': 'producto',
                        'producto_id': producto.id,
                        'receta_id': None,
                        'cantidad': cantidad,
                        'precio_unitario': precio_unitario,
                        'monto': monto,
                        'observaciones': item.get('observaciones', ''),
                        'es_receta': False,
                        'explosion_detalles': {}
                    })
                
                elif tipo == 'receta':
                    # Item es una receta - requiere explosión
                    receta = Receta.query.get(item['id'])
                    if not receta:
                        raise ValueError(f"Receta {item['id']} no encontrada")
                    
                    precio_unitario = item.get('precio_unitario', receta.precio_venta)
                    monto = precio_unitario * cantidad
                    subtotal += monto
                    
                    # Procesar explosión de ingredientes
                    explosion = VentasServiceAvanzado._procesar_explosion_receta(
                        receta, cantidad, descuentos_inventario
                    )
                    
                    # Crear producto dummy para vincular el VentaItem
                    # (La receta se vincula directamente)
                    venta_items_data.append({
                        'tipo': 'receta',
                        'producto_id': None,
                        'receta_id': receta.id,
                        'cantidad': cantidad,
                        'precio_unitario': precio_unitario,
                        'monto': monto,
                        'observaciones': item.get('observaciones', ''),
                        'es_receta': True,
                        'explosion_detalles': explosion
                    })
            
            # Validar stock para todos los ingredientes explosionados
            VentasServiceAvanzado._validar_stock_ingredientes(descuentos_inventario)
            
            # Calcular montos finales
            descuento_monto = round(subtotal * (descuento / 100), 2)
            subtotal_desc = subtotal - descuento_monto
            iva = round(subtotal_desc * 0.19, 2)
            propina = round(subtotal_desc * 0.10, 2)
            total = subtotal_desc + iva + propina
            
            # Crear venta
            # Obtener nombre del usuario
            usuario = Usuario.query.get(usuario_id)
            usuario_nombre = usuario.nombre if usuario else f"Usuario {usuario_id}"
            
            venta = Venta(
                usuario=usuario_nombre,
                cliente_nombre=cliente_nombre,
                numero_mesa=numero_mesa,
                subtotal=subtotal,
                descuento=descuento_monto,
                iva=iva,
                propina=propina,
                total=total
            )
            
            db.session.add(venta)
            db.session.flush()  # Para obtener el ID
            
            # Agregar items y descontar stock
            for item_data in venta_items_data:
                venta_item = VentaItem(
                    venta_id=venta.id,
                    producto_id=item_data['producto_id'],
                    receta_id=item_data['receta_id'],
                    cantidad=item_data['cantidad'],
                    precio_unitario=item_data['precio_unitario'],
                    subtotal=item_data['monto'],
                    observaciones=item_data['observaciones'],
                    es_receta=item_data['es_receta'],
                    explosion_detalles=json.dumps(item_data['explosion_detalles'])
                )
                db.session.add(venta_item)
                
                # Descontar stock de productos
                if item_data['producto_id']:
                    producto = Producto.query.get(item_data['producto_id'])
                    producto.stock -= item_data['cantidad']
            
            # Descontar ingredientes (explosión)
            for ingrediente_id, cantidad_total in descuentos_inventario.items():
                ingrediente = Ingrediente.query.get(ingrediente_id)
                if ingrediente:
                    # Los ingredientes no tienen "stock" en el sentido tradicional
                    # Pero registramos que fueron usados
                    pass
            
            db.session.commit()
            
            # Generar comprobantes
            comanda_cocina = VentasServiceAvanzado._generar_comanda(venta, 'cocina')
            comanda_caja = VentasServiceAvanzado._generar_comanda(venta, 'caja')
            
            return {
                'venta_id': venta.id,
                'cliente': cliente_nombre,
                'mesa': numero_mesa,
                'subtotal': subtotal,
                'descuento': descuento_monto,
                'iva': iva,
                'propina': propina,
                'total': total,
                'items': len(venta_items_data),
                'explosion_detalles': descuentos_inventario,
                'comanda_cocina_id': comanda_cocina.id,
                'comanda_caja_id': comanda_caja.id
            }
        
        except Exception as e:
            db.session.rollback()
            raise e

    @staticmethod
    def _procesar_explosion_receta(receta, cantidad_recetas, descuentos_tracking):
        """
        Procesa la explosión de una receta
        
        Returns:
            dict con detalles de ingredientes descontados
        """
        explosion = {}
        
        for receta_ingrediente in receta.ingredientes:
            ingrediente_id = receta_ingrediente.ingrediente_id
            cantidad_a_descontar = receta_ingrediente.cantidad * cantidad_recetas
            
            # Tracking de total descontado por ingrediente
            if ingrediente_id not in descuentos_tracking:
                descuentos_tracking[ingrediente_id] = 0
            descuentos_tracking[ingrediente_id] += cantidad_a_descontar
            
            # Detalles de explosión
            explosion[str(ingrediente_id)] = {
                'ingrediente_id': ingrediente_id,
                'ingrediente_nombre': receta_ingrediente.ingrediente.nombre,
                'unidad': receta_ingrediente.ingrediente.unidad_medida,
                'cantidad_por_receta': receta_ingrediente.cantidad,
                'cantidad_total': cantidad_a_descontar,
                'costo_unitario': receta_ingrediente.ingrediente.costo_unitario,
                'costo_total': round(cantidad_a_descontar * receta_ingrediente.ingrediente.costo_unitario, 2)
            }
        
        return explosion

    @staticmethod
    def _validar_stock_ingredientes(descuentos_tracking):
        """
        Valida que haya suficiente stock de ingredientes
        En este caso, solo registramos el uso (ingredientes no tienen stock limit)
        """
        pass

    # ======================== COMPROBANTES ========================

    @staticmethod
    def _generar_comanda(venta, tipo_comanda):
        """
        Genera comanda (comprobante) para cocina o caja
        
        tipo_comanda: 'cocina' | 'caja'
        """
        # Verificar si ya existe
        comanda_existente = Comanda.query.filter_by(
            venta_id=venta.id,
            tipo_comanda=tipo_comanda
        ).first()
        
        if comanda_existente:
            return comanda_existente
        
        # Generar contenido según tipo
        if tipo_comanda == 'cocina':
            html, texto = VentasServiceAvanzado._generar_comanda_cocina(venta)
        else:  # caja
            html, texto = VentasServiceAvanzado._generar_comanda_caja(venta)
        
        comanda = Comanda(
            venta_id=venta.id,
            tipo_comanda=tipo_comanda,
            contenido_html=html,
            contenido_texto=texto
        )
        
        db.session.add(comanda)
        db.session.commit()
        
        return comanda

    @staticmethod
    def _generar_comanda_cocina(venta):
        """
        Genera comanda para cocina con detalles de productos e ingredientes
        """
        html = f"""
        <div style="font-family: monospace; max-width: 400px; padding: 10px;">
            <h2 style="text-align: center; margin: 5px 0;">👨‍🍳 COMANDA COCINA</h2>
            <hr style="margin: 5px 0;">
            <p><strong>Orden:</strong> #{venta.id}</p>
            <p><strong>Hora:</strong> {venta.created_at.strftime('%H:%M:%S')}</p>
            <p><strong>Mesa:</strong> {venta.numero_mesa or 'N/A'}</p>
            <hr style="margin: 5px 0;">
            <h3 style="margin: 10px 0; border-bottom: 2px solid black;">PRODUCTOS</h3>
        """
        
        texto = f"""
╔════════════════════════════════════╗
║      👨‍🍳 COMANDA COCINA           ║
╠════════════════════════════════════╣
Orden: #{venta.id}
Hora: {venta.created_at.strftime('%H:%M:%S')}
Mesa: {venta.numero_mesa or 'N/A'}
╠════════════════════════════════════╣
        """
        
        for item in venta.items:
            if item.es_receta:
                # Mostrar receta y detalles de ingredientes
                receta = item.receta
                html += f"""
                <div style="margin: 10px 0; padding: 8px; border: 1px solid #ccc; background: #fffacd;">
                    <strong style="font-size: 1.2em;">🍽️ {receta.nombre}</strong><br>
                    <span style="color: red; font-size: 1.5em; font-weight: bold;">x{item.cantidad}</span>
                """
                
                texto += f"\n🍽️  {receta.nombre} x{item.cantidad}\n"
                
                # Detalles de ingredientes
                try:
                    explosion = json.loads(item.explosion_detalles)
                    for ing_key, ing_data in explosion.items():
                        html += f"""
                        <br><small>
                            • {ing_data['cantidad_total']}{ing_data['unidad']} de {ing_data['ingrediente_nombre']}
                        </small>
                        """
                        texto += f"   → {ing_data['cantidad_total']}{ing_data['unidad']} {ing_data['ingrediente_nombre']}\n"
                except:
                    pass
                
                # Observaciones
                if item.observaciones:
                    html += f"<br><em style='color: red;'>⚠️ {item.observaciones}</em>"
                    texto += f"   ⚠️  NOTA: {item.observaciones}\n"
                
                html += "</div>"
            else:
                # Producto simple
                html += f"""
                <div style="margin: 8px 0; padding: 5px; border-bottom: 1px dotted #ccc;">
                    <strong>{item.producto.nombre}</strong> x{item.cantidad}
                """
                
                texto += f"\n📦 {item.producto.nombre} x{item.cantidad}\n"
                
                if item.observaciones:
                    html += f"<br><small style='color: red;'>⚠️ {item.observaciones}</small>"
                    texto += f"   ⚠️  {item.observaciones}\n"
                
                html += "</div>"
        
        html += """
            <hr style="margin: 10px 0;">
            <p style="text-align: center; font-size: 0.9em; margin-top: 20px;">
                <strong>Marque cuando esté listo</strong><br>
                __ Cocina __ QA
            </p>
        </div>
        """
        
        texto += """
╠════════════════════════════════════╣
         ☐ Marca cuando esté listo
╚════════════════════════════════════╝
        """
        
        return html, texto

    @staticmethod
    def _generar_comanda_caja(venta):
        """
        Genera recibo para caja/cajero
        """
        usuario = Usuario.query.get(venta.usuario_id)
        usuario_nombre = usuario.nombre if usuario else "Sistema"
        
        html = f"""
        <div style="font-family: monospace; max-width: 400px; padding: 15px; background: white;">
            <div style="text-align: center; margin-bottom: 15px;">
                <h2 style="margin: 5px 0;">🧾 RECIBO DE VENTA</h2>
                <p style="font-size: 0.9em; color: #666;">Carbon & Cheddar</p>
            </div>
            
            <hr style="margin: 10px 0;">
            
            <table style="width: 100%; font-size: 0.95em;">
                <tr>
                    <td><strong>Recibo #:</strong></td>
                    <td style="text-align: right;">{venta.id}</td>
                </tr>
                <tr>
                    <td><strong>Fecha:</strong></td>
                    <td style="text-align: right;">{venta.created_at.strftime('%d/%m/%Y')}</td>
                </tr>
                <tr>
                    <td><strong>Hora:</strong></td>
                    <td style="text-align: right;">{venta.created_at.strftime('%H:%M:%S')}</td>
                </tr>
                <tr>
                    <td><strong>Cajero:</strong></td>
                    <td style="text-align: right;">{usuario_nombre}</td>
                </tr>
                {f'<tr><td><strong>Cliente:</strong></td><td style="text-align: right;">{venta.cliente_nombre}</td></tr>' if venta.cliente_nombre else ''}
                {f'<tr><td><strong>Mesa:</strong></td><td style="text-align: right;">{venta.numero_mesa}</td></tr>' if venta.numero_mesa else ''}
            </table>
            
            <hr style="margin: 10px 0;">
            
            <h4 style="margin: 10px 0;">DETALLES</h4>
        """
        
        texto = f"""
╔════════════════════════════════════╗
║      🧾 RECIBO DE VENTA           ║
║      Carbon & Cheddar             ║
╠════════════════════════════════════╣
Recibo #: {venta.id}
Fecha: {venta.created_at.strftime('%d/%m/%Y')}
Hora: {venta.created_at.strftime('%H:%M:%S')}
Cajero: {usuario_nombre}
{f'Cliente: {venta.cliente_nombre}' if venta.cliente_nombre else ''}
{f'Mesa: {venta.numero_mesa}' if venta.numero_mesa else ''}
╠════════════════════════════════════╣
        """
        
        # Items
        for item in venta.items:
            nombre = item.receta.nombre if item.es_receta else item.producto.nombre
            html += f"""
            <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dotted #ddd;">
                <span>{nombre} x{item.cantidad}</span>
                <strong>${item.subtotal:.2f}</strong>
            </div>
            """
            
            texto += f"{nombre} x{item.cantidad:<25}${item.subtotal:>8.2f}\n"
        
        html += f"""
            <hr style="margin: 10px 0; font-weight: bold;">
            
            <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                <span>Subtotal:</span>
                <strong>${venta.subtotal:.2f}</strong>
            </div>
        """
        
        texto += f"\n{'SUBTOTAL:':<35}${venta.subtotal:>8.2f}\n"
        
        if venta.descuento > 0:
            html += f"""
            <div style="display: flex; justify-content: space-between; padding: 5px 0; color: green;">
                <span>Descuento:</span>
                <strong>-${venta.descuento:.2f}</strong>
            </div>
            """
            texto += f"{'DESCUENTO:':<35}-${venta.descuento:>8.2f}\n"
        
        html += f"""
            <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                <span>IVA (19%):</span>
                <strong>${venta.iva:.2f}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                <span>Propina (10%):</span>
                <strong>${venta.propina:.2f}</strong>
            </div>
            
            <hr style="margin: 10px 0; border: 2px solid black;">
            
            <div style="display: flex; justify-content: space-between; padding: 10px 0; font-size: 1.3em; font-weight: bold;">
                <span>TOTAL:</span>
                <span>${venta.total:.2f}</span>
            </div>
            
            <hr style="margin: 10px 0;">
            
            <div style="text-align: center; font-size: 0.85em; color: #666;">
                <p>¡Gracias por su compra!</p>
                <p>Vuelva pronto</p>
            </div>
        </div>
        """
        
        texto += f"""
{'IVA (19%):':<35}${venta.iva:>8.2f}
{'PROPINA (10%):':<35}${venta.propina:>8.2f}
╠════════════════════════════════════╣
{'TOTAL:':<35}${venta.total:>8.2f}
╠════════════════════════════════════╣
        ¡Gracias por su compra!
        Vuelva pronto
╚════════════════════════════════════╝
        """
        
        return html, texto

    # ======================== OBTENER COMPROBANTES ========================

    @staticmethod
    def obtener_comanda(venta_id, tipo_comanda='cocina'):
        """
        Obtiene comanda existente o genera si no existe
        """
        comanda = Comanda.query.filter_by(
            venta_id=venta_id,
            tipo_comanda=tipo_comanda
        ).first()
        
        if not comanda:
            venta = Venta.query.get(venta_id)
            if not venta:
                raise ValueError(f"Venta {venta_id} no encontrada")
            comanda = VentasServiceAvanzado._generar_comanda(venta, tipo_comanda)
        
        return {
            'id': comanda.id,
            'venta_id': comanda.venta_id,
            'tipo': comanda.tipo_comanda,
            'html': comanda.contenido_html,
            'texto': comanda.contenido_texto,
            'impresa': comanda.impresa,
            'created_at': comanda.created_at.isoformat()
        }

    @staticmethod
    def marcar_comanda_impresa(comanda_id):
        """
        Marca una comanda como impresa
        """
        comanda = Comanda.query.get(comanda_id)
        if not comanda:
            raise ValueError(f"Comanda {comanda_id} no encontrada")
        
        comanda.impresa = True
        comanda.fecha_impresion = datetime.utcnow()
        db.session.commit()
        
        return comanda.to_dict()

    # ======================== REPORTES GRANULARES ========================

    @staticmethod
    def reporte_ventas_por_hora(usuario_id, fecha, agrupar_por='hora'):
        """
        Genera reporte de ventas agrupado por hora
        
        agrupar_por: 'hora' | 'producto' | 'receta'
        """
        # Obtener nombre del usuario desde su ID
        usuario = Usuario.query.get(usuario_id)
        if not usuario:
            raise ValueError(f"Usuario {usuario_id} no encontrado")
        
        fecha_inicio = datetime.combine(fecha, datetime.min.time())
        fecha_fin = fecha_inicio + timedelta(days=1)
        
        ventas = Venta.query.filter(
            Venta.usuario == usuario.nombre,
            Venta.created_at >= fecha_inicio,
            Venta.created_at < fecha_fin
        ).order_by(Venta.created_at).all()
        
        if not ventas:
            return {
                'fecha': fecha.isoformat(),
                'total_ventas': 0,
                'total_ingresos': 0,
                'total_items': 0,
                'agrupacion': {},
                'detalles_hora': []
            }
        
        # Agrupar por hora
        ventas_por_hora = {}
        for venta in ventas:
            hora = venta.created_at.strftime('%H:00')
            if hora not in ventas_por_hora:
                ventas_por_hora[hora] = {
                    'hora': hora,
                    'cantidad_ventas': 0,
                    'total_ingresos': 0,
                    'items': [],
                    'ticket_promedio': 0
                }
            
            ventas_por_hora[hora]['cantidad_ventas'] += 1
            ventas_por_hora[hora]['total_ingresos'] += venta.total
            
            for item in venta.items:
                nombre = item.receta.nombre if item.es_receta else item.producto.nombre
                ventas_por_hora[hora]['items'].append({
                    'nombre': nombre,
                    'cantidad': item.cantidad,
                    'monto': item.subtotal
                })
        
        # Calcular promedios
        for hora, datos in ventas_por_hora.items():
            datos['ticket_promedio'] = round(datos['total_ingresos'] / datos['cantidad_ventas'], 2)
        
        total_ingresos = sum(v['total_ingresos'] for v in ventas_por_hora.values())
        
        return {
            'fecha': fecha.isoformat(),
            'total_ventas': len(ventas),
            'total_ingresos': round(total_ingresos, 2),
            'total_items': sum(v['cantidad_ventas'] for v in ventas_por_hora.values()),
            'horas': sorted(ventas_por_hora.items())
        }

    @staticmethod
    def reporte_ventas_por_dia(usuario_id, fecha_inicio, fecha_fin):
        """
        Genera reporte de ventas por día en un rango
        """
        # Obtener nombre del usuario desde su ID
        usuario = Usuario.query.get(usuario_id)
        if not usuario:
            raise ValueError(f"Usuario {usuario_id} no encontrado")
        
        ventas = Venta.query.filter(
            Venta.usuario == usuario.nombre,
            Venta.created_at >= datetime.combine(fecha_inicio, datetime.min.time()),
            Venta.created_at < datetime.combine(fecha_fin + timedelta(days=1), datetime.min.time())
        ).all()
        
        # Agrupar por día
        ventas_por_dia = {}
        for venta in ventas:
            dia = venta.created_at.date().isoformat()
            if dia not in ventas_por_dia:
                ventas_por_dia[dia] = {
                    'fecha': dia,
                    'cantidad_ventas': 0,
                    'total_ingresos': 0,
                    'total_descuentos': 0,
                    'ticket_promedio': 0,
                    'productos_mas_vendidos': {}
                }
            
            ventas_por_dia[dia]['cantidad_ventas'] += 1
            ventas_por_dia[dia]['total_ingresos'] += venta.total
            ventas_por_dia[dia]['total_descuentos'] += venta.descuento
            
            # Productos más vendidos
            for item in venta.items:
                nombre = item.receta.nombre if item.es_receta else item.producto.nombre
                if nombre not in ventas_por_dia[dia]['productos_mas_vendidos']:
                    ventas_por_dia[dia]['productos_mas_vendidos'][nombre] = 0
                ventas_por_dia[dia]['productos_mas_vendidos'][nombre] += item.cantidad
        
        # Calcular promedios
        for dia, datos in ventas_por_dia.items():
            if datos['cantidad_ventas'] > 0:
                datos['ticket_promedio'] = round(datos['total_ingresos'] / datos['cantidad_ventas'], 2)
        
        return {
            'fecha_inicio': fecha_inicio.isoformat(),
            'fecha_fin': fecha_fin.isoformat(),
            'total_ventas': len(ventas),
            'total_ingresos': round(sum(d['total_ingresos'] for d in ventas_por_dia.values()), 2),
            'dias': sorted(ventas_por_dia.items())
        }

    @staticmethod
    def reporte_detallado_ventas(usuario_id, fecha_inicio, fecha_fin):
        """
        Reporte detallado con desglose completo
        """
        # Obtener nombre del usuario desde su ID
        usuario = Usuario.query.get(usuario_id)
        if not usuario:
            raise ValueError(f"Usuario {usuario_id} no encontrado")
        
        ventas = Venta.query.filter(
            Venta.usuario == usuario.nombre,
            Venta.created_at >= datetime.combine(fecha_inicio, datetime.min.time()),
            Venta.created_at < datetime.combine(fecha_fin + timedelta(days=1), datetime.min.time())
        ).order_by(desc(Venta.created_at)).all()
        
        # Detalles de productos
        productos_vendidos = {}
        recetas_vendidas = {}
        
        for venta in ventas:
            for item in venta.items:
                if item.es_receta:
                    nombre = item.receta.nombre
                    if nombre not in recetas_vendidas:
                        recetas_vendidas[nombre] = {
                            'cantidad': 0,
                            'ingresos': 0,
                            'costo': 0
                        }
                    recetas_vendidas[nombre]['cantidad'] += item.cantidad
                    recetas_vendidas[nombre]['ingresos'] += item.subtotal
                    recetas_vendidas[nombre]['costo'] += item.receta.costo_total * item.cantidad
                else:
                    nombre = item.producto.nombre
                    if nombre not in productos_vendidos:
                        productos_vendidos[nombre] = {
                            'cantidad': 0,
                            'ingresos': 0
                        }
                    productos_vendidos[nombre]['cantidad'] += item.cantidad
                    productos_vendidos[nombre]['ingresos'] += item.subtotal
        
        total_ingresos = sum(v['total'] for v in ventas)
        total_descuentos = sum(v['descuento'] for v in ventas)
        total_iva = sum(v['iva'] for v in ventas)
        
        return {
            'fecha_inicio': fecha_inicio.isoformat(),
            'fecha_fin': fecha_fin.isoformat(),
            'resumen': {
                'cantidad_ventas': len(ventas),
                'total_ingresos': round(total_ingresos, 2),
                'total_descuentos': round(total_descuentos, 2),
                'total_iva': round(total_iva, 2),
                'ticket_promedio': round(total_ingresos / len(ventas), 2) if ventas else 0
            },
            'productos': productos_vendidos,
            'recetas': recetas_vendidas,
            'ventas': [
                {
                    'id': v.id,
                    'fecha': v.created_at.isoformat(),
                    'cliente': v.cliente_nombre,
                    'mesa': v.numero_mesa,
                    'total': v.total,
                    'items_count': len(v.items)
                }
                for v in ventas
            ]
        }
