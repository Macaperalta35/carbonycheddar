"""
Servicio de lógica de negocio para ingredientes.
"""
from models import db, Ingrediente, HistorialCostoIngrediente, Receta
from services.calculos_service import CalculoCostos
from sqlalchemy import exc


class IngredienteService:
    """Servicio para operaciones con ingredientes."""
    
    @staticmethod
    def crear_ingrediente(datos):
        """
        Crea un nuevo ingrediente.
        
        Args:
            datos: dict - {nombre, descripcion, unidad_medida, costo_unitario}
        
        Returns:
            tuple: (ingrediente_creado, error_message)
        """
        try:
            ingrediente = Ingrediente(
                nombre=datos.get('nombre'),
                descripcion=datos.get('descripcion', ''),
                unidad_medida=datos.get('unidad_medida'),
                costo_unitario=datos.get('costo_unitario', 0),
                costo_anterior=datos.get('costo_unitario', 0)
            )
            
            db.session.add(ingrediente)
            db.session.commit()
            
            return ingrediente, None
        
        except exc.IntegrityError:
            db.session.rollback()
            return None, 'Ingrediente con ese nombre ya existe'
        except Exception as e:
            db.session.rollback()
            return None, str(e)
    
    @staticmethod
    def obtener_ingrediente(ingrediente_id):
        """
        Obtiene un ingrediente por ID.
        
        Args:
            ingrediente_id: int - ID del ingrediente
        
        Returns:
            Ingrediente o None
        """
        return Ingrediente.query.get(ingrediente_id)
    
    @staticmethod
    def actualizar_ingrediente(ingrediente_id, datos):
        """
        Actualiza un ingrediente.
        
        Args:
            ingrediente_id: int - ID del ingrediente
            datos: dict - Datos a actualizar
        
        Returns:
            tuple: (ingrediente_actualizado, error_message)
        """
        ingrediente = IngredienteService.obtener_ingrediente(ingrediente_id)
        
        if not ingrediente:
            return None, 'Ingrediente no encontrado'
        
        try:
            if 'nombre' in datos:
                ingrediente.nombre = datos['nombre']
            if 'descripcion' in datos:
                ingrediente.descripcion = datos['descripcion']
            if 'unidad_medida' in datos:
                ingrediente.unidad_medida = datos['unidad_medida']
            
            # Si cambió el costo, registrar histórico
            if 'costo_unitario' in datos and datos['costo_unitario'] != ingrediente.costo_unitario:
                costo_anterior = ingrediente.costo_unitario
                ingrediente.costo_anterior = costo_anterior
                ingrediente.costo_unitario = datos['costo_unitario']
                
                # Crear registro de historial
                historial = HistorialCostoIngrediente(
                    ingrediente_id=ingrediente_id,
                    costo_anterior=costo_anterior,
                    costo_nuevo=datos['costo_unitario']
                )
                db.session.add(historial)
                
                # Recalcular todas las recetas que usan este ingrediente
                IngredienteService._recalcular_recetas_con_ingrediente(ingrediente_id)
            
            db.session.commit()
            return ingrediente, None
        
        except Exception as e:
            db.session.rollback()
            return None, str(e)
    
    @staticmethod
    def _recalcular_recetas_con_ingrediente(ingrediente_id):
        """
        Recalcula todas las recetas que contienen este ingrediente.
        Se llama cuando cambia el costo del ingrediente.
        
        Args:
            ingrediente_id: int - ID del ingrediente
        """
        from models import RecetaIngrediente
        
        receta_ingredientes = RecetaIngrediente.query.filter_by(
            ingrediente_id=ingrediente_id
        ).all()
        
        recetas_actualizadas = set()
        
        for ri in receta_ingredientes:
            if ri.receta_id not in recetas_actualizadas:
                receta = Receta.query.get(ri.receta_id)
                if receta:
                    CalculoCostos.actualizar_calculos_receta(receta)
                    recetas_actualizadas.add(receta.id)
    
    @staticmethod
    def eliminar_ingrediente(ingrediente_id):
        """
        Elimina un ingrediente (soft delete en producción).
        
        Args:
            ingrediente_id: int - ID del ingrediente
        
        Returns:
            tuple: (success, error_message)
        """
        ingrediente = IngredienteService.obtener_ingrediente(ingrediente_id)
        
        if not ingrediente:
            return False, 'Ingrediente no encontrado'
        
        try:
            db.session.delete(ingrediente)
            db.session.commit()
            return True, None
        except Exception as e:
            db.session.rollback()
            return False, str(e)
    
    @staticmethod
    def listar_ingredientes(pagina=1, por_pagina=20):
        """
        Lista todos los ingredientes con paginación.
        
        Args:
            pagina: int - Número de página
            por_pagina: int - Ingredientes por página
        
        Returns:
            dict: {total, pagina, ingredientes}
        """
        query = Ingrediente.query.order_by(Ingrediente.nombre)
        
        total = query.count()
        ingredientes = query.paginate(page=pagina, per_page=por_pagina, error_out=False).items
        
        return {
            'total': total,
            'pagina': pagina,
            'por_pagina': por_pagina,
            'total_paginas': (total + por_pagina - 1) // por_pagina,
            'ingredientes': [i.to_dict() for i in ingredientes]
        }
    
    @staticmethod
    def obtener_historial_costos(ingrediente_id, limite=10):
        """
        Obtiene el historial de cambios de costo de un ingrediente.
        
        Args:
            ingrediente_id: int - ID del ingrediente
            limite: int - Número de registros a traer
        
        Returns:
            list: Historial de costos
        """
        historial = HistorialCostoIngrediente.query.filter_by(
            ingrediente_id=ingrediente_id
        ).order_by(HistorialCostoIngrediente.fecha_cambio.desc()).limit(limite).all()
        
        return [h.to_dict() for h in historial]
    
    @staticmethod
    def buscar_ingredientes(termino):
        """
        Busca ingredientes por nombre o descripción.
        
        Args:
            termino: str - Término de búsqueda
        
        Returns:
            list: Ingredientes encontrados
        """
        resultados = Ingrediente.query.filter(
            (Ingrediente.nombre.ilike(f'%{termino}%')) |
            (Ingrediente.descripcion.ilike(f'%{termino}%'))
        ).all()
        
        return [i.to_dict() for i in resultados]
