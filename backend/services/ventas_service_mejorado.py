"""
Servicio de Ventas - Gestión de ventas por producto
Integrado con el sistema de recetas y costos
"""
from models import db, Venta, VentaItem, Producto, Receta
from sqlalchemy import func, desc
from datetime import datetime, timedelta


class VentasService:
    """Servicio centralizado para gestión de ventas"""

    @staticmethod
    def crear_venta(usuario_id, items, cliente_nombre='', numero_mesa='', descuento=0):
        """
        Crear una nueva venta con múltiples items
        
        Args:
            usuario_id: ID del usuario que realiza la venta
            items: Lista de dict con {producto_id, cantidad, precio_unitario}
            cliente_nombre: Nombre del cliente (opcional)
            numero_mesa: Número de mesa (opcional)
            descuento: Descuento a aplicar (0-100)
        
        Returns:
            dict con datos de la venta creada
        """
        if not items:
            raise ValueError("La venta debe contener al menos un item")
        
        if not 0 <= descuento <= 100:
            raise ValueError("Descuento debe estar entre 0 y 100")
        
        try:
            # Calcular subtotal y validar stock
            subtotal = 0
            venta_items = []
            
            for item in items:
                producto = Producto.query.get(item['producto_id'])
                if not producto:
                    raise ValueError(f"Producto {item['producto_id']} no encontrado")
                
                if producto.stock < item['cantidad']:
                    raise ValueError(
                        f"Stock insuficiente de {producto.nombre}. "
                        f"Disponible: {producto.stock}, Solicitado: {item['cantidad']}"
                    )
                
                precio_unitario = item.get('precio_unitario', producto.precio)
                monto_item = precio_unitario * item['cantidad']
                subtotal += monto_item
                
                # Crear item de venta (no persistir aún)
                venta_items.append({
                    'producto_id': item['producto_id'],
                    'cantidad': item['cantidad'],
                    'precio_unitario': precio_unitario,
                    'monto': monto_item
                })
            
            # Aplicar descuento
            descuento_monto = round(subtotal * (descuento / 100), 2)
            subtotal_desc = subtotal - descuento_monto
            
            # Calcular IVA (19%) y propina (10%)
            iva = round(subtotal_desc * 0.19, 2)
            propina = round(subtotal_desc * 0.10, 2)
            total = subtotal_desc + iva + propina
            
            # Crear venta
            venta = Venta(
                usuario_id=usuario_id,
                cliente_nombre=cliente_nombre,
                numero_mesa=numero_mesa,
                subtotal=subtotal,
                descuento=descuento_monto,
                iva=iva,
                propina=propina,
                total=total,
                fecha=datetime.now()
            )
            
            db.session.add(venta)
            db.session.flush()  # Para obtener el ID de la venta
            
            # Crear items de venta y actualizar stock
            for item_data in venta_items:
                producto = Producto.query.get(item_data['producto_id'])
                
                venta_item = VentaItem(
                    venta_id=venta.id,
                    producto_id=item_data['producto_id'],
                    cantidad=item_data['cantidad'],
                    precio_unitario=item_data['precio_unitario'],
                    monto=item_data['monto']
                )
                db.session.add(venta_item)
                
                # Descontar stock
                producto.stock -= item_data['cantidad']
                if producto.stock < 0:
                    producto.stock = 0
            
            db.session.commit()
            
            return {
                'id': venta.id,
                'usuario_id': venta.usuario_id,
                'cliente_nombre': venta.cliente_nombre,
                'numero_mesa': venta.numero_mesa,
                'subtotal': float(venta.subtotal),
                'descuento': float(venta.descuento),
                'iva': float(venta.iva),
                'propina': float(venta.propina),
                'total': float(venta.total),
                'items': len(venta_items),
                'fecha': venta.fecha.isoformat()
            }
        
        except Exception as e:
            db.session.rollback()
            raise e

    @staticmethod
    def obtener_venta(venta_id):
        """Obtener detalles completos de una venta"""
        venta = Venta.query.get(venta_id)
        if not venta:
            return None
        
        items = VentaItem.query.filter_by(venta_id=venta_id).all()
        
        return {
            'id': venta.id,
            'usuario_id': venta.usuario_id,
            'cliente_nombre': venta.cliente_nombre,
            'numero_mesa': venta.numero_mesa,
            'subtotal': float(venta.subtotal),
            'descuento': float(venta.descuento),
            'iva': float(venta.iva),
            'propina': float(venta.propina),
            'total': float(venta.total),
            'fecha': venta.fecha.isoformat(),
            'items': [
                {
                    'id': item.id,
                    'producto_id': item.producto_id,
                    'producto_nombre': item.producto.nombre if item.producto else 'N/A',
                    'cantidad': item.cantidad,
                    'precio_unitario': float(item.precio_unitario),
                    'monto': float(item.monto)
                }
                for item in items
            ]
        }

    @staticmethod
    def listar_ventas_usuario(usuario_id, pagina=1, por_pagina=10, fecha_desde=None, fecha_hasta=None):
        """Listar ventas de un usuario con paginación"""
        query = Venta.query.filter_by(usuario_id=usuario_id)
        
        if fecha_desde:
            query = query.filter(Venta.fecha >= fecha_desde)
        
        if fecha_hasta:
            query = query.filter(Venta.fecha <= fecha_hasta)
        
        total = query.count()
        total_paginas = (total + por_pagina - 1) // por_pagina
        
        ventas = query.order_by(desc(Venta.fecha)).offset(
            (pagina - 1) * por_pagina
        ).limit(por_pagina).all()
        
        return {
            'pagina': pagina,
            'por_pagina': por_pagina,
            'total': total,
            'total_paginas': total_paginas,
            'ventas': [
                {
                    'id': v.id,
                    'cliente_nombre': v.cliente_nombre,
                    'numero_mesa': v.numero_mesa,
                    'subtotal': float(v.subtotal),
                    'descuento': float(v.descuento),
                    'total': float(v.total),
                    'fecha': v.fecha.isoformat(),
                    'items_count': len(v.items)
                }
                for v in ventas
            ]
        }

    @staticmethod
    def anular_venta(venta_id):
        """Anular una venta y devolver stock"""
        venta = Venta.query.get(venta_id)
        if not venta:
            raise ValueError("Venta no encontrada")
        
        try:
            # Devolver stock
            items = VentaItem.query.filter_by(venta_id=venta_id).all()
            for item in items:
                producto = Producto.query.get(item.producto_id)
                if producto:
                    producto.stock += item.cantidad
            
            # Eliminar venta
            db.session.delete(venta)
            db.session.commit()
            
            return {'mensaje': 'Venta anulada correctamente'}
        except Exception as e:
            db.session.rollback()
            raise e

    @staticmethod
    def reporte_ventas_diarias(usuario_id, fecha=None):
        """Reporte de ventas del día"""
        if fecha is None:
            fecha = datetime.now().date()
        
        fecha_inicio = datetime.combine(fecha, datetime.min.time())
        fecha_fin = datetime.combine(fecha, datetime.max.time())
        
        ventas = Venta.query.filter(
            Venta.usuario_id == usuario_id,
            Venta.fecha >= fecha_inicio,
            Venta.fecha <= fecha_fin
        ).all()
        
        total_ventas = len(ventas)
        total_ingresos = sum(v.total for v in ventas) if ventas else 0
        total_descuentos = sum(v.descuento for v in ventas) if ventas else 0
        total_items_vendidos = sum(len(v.items) for v in ventas) if ventas else 0
        
        # Producto más vendido
        items_agrupados = {}
        for venta in ventas:
            for item in venta.items:
                if item.producto_id not in items_agrupados:
                    items_agrupados[item.producto_id] = {
                        'nombre': item.producto.nombre if item.producto else 'N/A',
                        'cantidad': 0,
                        'ingresos': 0
                    }
                items_agrupados[item.producto_id]['cantidad'] += item.cantidad
                items_agrupados[item.producto_id]['ingresos'] += item.monto
        
        producto_top = max(
            items_agrupados.items(),
            key=lambda x: x[1]['ingresos'],
            default=(None, {'nombre': 'N/A', 'cantidad': 0, 'ingresos': 0})
        ) if items_agrupados else (None, {'nombre': 'N/A', 'cantidad': 0, 'ingresos': 0})
        
        return {
            'fecha': fecha.isoformat(),
            'total_ventas': total_ventas,
            'total_ingresos': float(total_ingresos),
            'total_descuentos': float(total_descuentos),
            'total_items_vendidos': total_items_vendidos,
            'ticket_promedio': float(total_ingresos / total_ventas) if total_ventas > 0 else 0,
            'producto_top': {
                'nombre': producto_top[1]['nombre'],
                'cantidad': producto_top[1]['cantidad'],
                'ingresos': float(producto_top[1]['ingresos'])
            },
            'productos': {
                producto_id: {
                    'nombre': datos['nombre'],
                    'cantidad': datos['cantidad'],
                    'ingresos': float(datos['ingresos'])
                }
                for producto_id, datos in items_agrupados.items()
            }
        }

    @staticmethod
    def reporte_ventas_rango(usuario_id, fecha_desde, fecha_hasta):
        """Reporte de ventas en un rango de fechas"""
        ventas = Venta.query.filter(
            Venta.usuario_id == usuario_id,
            Venta.fecha >= fecha_desde,
            Venta.fecha <= fecha_hasta
        ).all()
        
        total_ingresos = sum(v.total for v in ventas) if ventas else 0
        total_descuentos = sum(v.descuento for v in ventas) if ventas else 0
        
        return {
            'fecha_desde': fecha_desde.isoformat(),
            'fecha_hasta': fecha_hasta.isoformat(),
            'total_ventas': len(ventas),
            'total_ingresos': float(total_ingresos),
            'total_descuentos': float(total_descuentos),
            'promedio_por_venta': float(total_ingresos / len(ventas)) if ventas else 0,
            'dias_operativos': len(set(v.fecha.date() for v in ventas)),
            'ingresos_promedio_diario': float(total_ingresos / max(1, len(set(v.fecha.date() for v in ventas))))
        }
