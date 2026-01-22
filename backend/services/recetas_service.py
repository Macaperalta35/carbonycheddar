"""
Servicio de lógica de negocio para recetas.
"""
from models import db, Receta, RecetaIngrediente, Ingrediente
from services.calculos_service import CalculoCostos
from sqlalchemy import exc


class RecetaService:
    """Servicio para operaciones con recetas."""
    
    @staticmethod
    def crear_receta(usuario_id, datos):
        """
        Crea una nueva receta.
        
        Args:
            usuario_id: int - ID del usuario
            datos: dict - Datos de la receta {nombre, descripcion, rendimiento_porciones, precio_venta}
        
        Returns:
            tuple: (receta_creada, error_message)
        """
        try:
            receta = Receta(
                usuario_id=usuario_id,
                nombre=datos.get('nombre'),
                descripcion=datos.get('descripcion', ''),
                rendimiento_porciones=datos.get('rendimiento_porciones', 1),
                precio_venta=datos.get('precio_venta', 0)
            )
            
            db.session.add(receta)
            db.session.commit()
            
            return receta, None
        
        except exc.IntegrityError:
            db.session.rollback()
            return None, 'Error de integridad en la base de datos'
        except Exception as e:
            db.session.rollback()
            return None, str(e)
    
    @staticmethod
    def obtener_receta(receta_id, usuario_id):
        """
        Obtiene una receta por ID.
        
        Args:
            receta_id: int - ID de la receta
            usuario_id: int - ID del usuario (para verificar permisos)
        
        Returns:
            Receta o None
        """
        return Receta.query.filter_by(id=receta_id, usuario_id=usuario_id).first()
    
    @staticmethod
    def actualizar_receta(receta_id, usuario_id, datos):
        """
        Actualiza una receta existente.
        
        Args:
            receta_id: int - ID de la receta
            usuario_id: int - ID del usuario
            datos: dict - Datos a actualizar
        
        Returns:
            tuple: (receta_actualizada, error_message)
        """
        receta = RecetaService.obtener_receta(receta_id, usuario_id)
        
        if not receta:
            return None, 'Receta no encontrada'
        
        try:
            if 'nombre' in datos:
                receta.nombre = datos['nombre']
            if 'descripcion' in datos:
                receta.descripcion = datos['descripcion']
            if 'rendimiento_porciones' in datos:
                receta.rendimiento_porciones = datos['rendimiento_porciones']
            if 'precio_venta' in datos:
                receta.precio_venta = datos['precio_venta']
            
            # Recalcular todos los valores
            CalculoCostos.actualizar_calculos_receta(receta)
            
            db.session.commit()
            return receta, None
        
        except Exception as e:
            db.session.rollback()
            return None, str(e)
    
    @staticmethod
    def eliminar_receta(receta_id, usuario_id):
        """
        Elimina una receta.
        
        Args:
            receta_id: int - ID de la receta
            usuario_id: int - ID del usuario
        
        Returns:
            tuple: (success, error_message)
        """
        receta = RecetaService.obtener_receta(receta_id, usuario_id)
        
        if not receta:
            return False, 'Receta no encontrada'
        
        try:
            db.session.delete(receta)
            db.session.commit()
            return True, None
        except Exception as e:
            db.session.rollback()
            return False, str(e)
    
    @staticmethod
    def listar_recetas_usuario(usuario_id, pagina=1, por_pagina=10):
        """
        Lista todas las recetas de un usuario con paginación.
        
        Args:
            usuario_id: int - ID del usuario
            pagina: int - Número de página
            por_pagina: int - Recetas por página
        
        Returns:
            dict: {total, pagina, recetas}
        """
        query = Receta.query.filter_by(usuario_id=usuario_id).order_by(Receta.updated_at.desc())
        
        total = query.count()
        recetas = query.paginate(page=pagina, per_page=por_pagina, error_out=False).items
        
        return {
            'total': total,
            'pagina': pagina,
            'por_pagina': por_pagina,
            'total_paginas': (total + por_pagina - 1) // por_pagina,
            'recetas': [r.to_dict(incluir_ingredientes=False) for r in recetas]
        }
    
    @staticmethod
    def agregar_ingrediente(receta_id, usuario_id, ingrediente_id, cantidad, sub_receta_id=None):
        """
        Agrega un ingrediente o sub-receta a una receta.
        
        Args:
            receta_id: int - ID de la receta padre
            usuario_id: int - ID del usuario
            ingrediente_id: int - ID del ingrediente (opcional si hay sub_receta_id)
            cantidad: float - Cantidad a agregar
            sub_receta_id: int - ID de la sub-receta (opcional)
        """
        receta = RecetaService.obtener_receta(receta_id, usuario_id)
        
        if not receta:
            return None, 'Receta no encontrada'
        
        # Validar que sea uno u otro
        if not ingrediente_id and not sub_receta_id:
             return None, 'Debe especificar ingrediente_id o sub_receta_id'
        
        if ingrediente_id:
            ingrediente = Ingrediente.query.get(ingrediente_id)
            if not ingrediente:
                return None, 'Ingrediente no encontrado'
            target_filter = {'ingrediente_id': ingrediente_id}
        else:
            sub_receta = Receta.query.get(sub_receta_id)
            if not sub_receta:
                return None, 'Sub-receta no encontrada'
            if sub_receta.id == receta.id:
                return None, 'No se puede agregar una receta a sí misma'
            target_filter = {'sub_receta_id': sub_receta_id}

        try:
            # Verificar si ya está en la receta
            existente = RecetaIngrediente.query.filter_by(
                receta_id=receta_id,
                **target_filter
            ).first()
            
            if existente:
                # Actualizar cantidad
                existente.cantidad += cantidad
                ri = existente
            else:
                # Crear nuevo
                ri = RecetaIngrediente(
                    receta_id=receta_id,
                    ingrediente_id=ingrediente_id,
                    sub_receta_id=sub_receta_id,
                    cantidad=cantidad
                )
                db.session.add(ri)
            
            # Recalcular receta
            CalculoCostos.actualizar_calculos_receta(receta)
            
            db.session.commit()
            return ri, None
        
        except Exception as e:
            db.session.rollback()
            return None, str(e)
    
    @staticmethod
    def eliminar_ingrediente(receta_id, usuario_id, receta_ingrediente_id):
        """
        Elimina un ingrediente de una receta.
        
        Args:
            receta_id: int - ID de la receta
            usuario_id: int - ID del usuario
            receta_ingrediente_id: int - ID de RecetaIngrediente
        
        Returns:
            tuple: (success, error_message)
        """
        receta = RecetaService.obtener_receta(receta_id, usuario_id)
        
        if not receta:
            return False, 'Receta no encontrada'
        
        ri = RecetaIngrediente.query.filter_by(
            id=receta_ingrediente_id,
            receta_id=receta_id
        ).first()
        
        if not ri:
            return False, 'Ingrediente en receta no encontrado'
        
        try:
            db.session.delete(ri)
            
            # Recalcular receta
            CalculoCostos.actualizar_calculos_receta(receta)
            
            db.session.commit()
            return True, None
        
        except Exception as e:
            db.session.rollback()
            return False, str(e)
    
    @staticmethod
    def actualizar_cantidad_ingrediente(receta_id, usuario_id, receta_ingrediente_id, cantidad):
        """
        Actualiza la cantidad de un ingrediente en una receta.
        
        Args:
            receta_id: int - ID de la receta
            usuario_id: int - ID del usuario
            receta_ingrediente_id: int - ID de RecetaIngrediente
            cantidad: float - Nueva cantidad
        
        Returns:
            tuple: (receta_ingrediente, error_message)
        """
        receta = RecetaService.obtener_receta(receta_id, usuario_id)
        
        if not receta:
            return None, 'Receta no encontrada'
        
        ri = RecetaIngrediente.query.filter_by(
            id=receta_ingrediente_id,
            receta_id=receta_id
        ).first()
        
        if not ri:
            return None, 'Ingrediente en receta no encontrado'
        
        try:
            ri.cantidad = cantidad
            
            # Recalcular receta
            CalculoCostos.actualizar_calculos_receta(receta)
            
            db.session.commit()
            return ri, None
        
        except Exception as e:
            db.session.rollback()
            return None, str(e)
