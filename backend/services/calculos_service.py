"""
Servicio de cálculo de costos, márgenes y utilidades para recetas.
Encapsula toda la lógica de negocio relacionada con costeo.
"""

class CalculoCostos:
    """Clase para manejar todos los cálculos de costos y márgenes."""
    
    @staticmethod
    def calcular_costo_receta(ingredientes):
        """
        Calcula el costo total de una receta basado en sus ingredientes.
        
        Args:
            ingredientes: Lista de RecetaIngrediente
        
        Returns:
            float: Costo total de la receta
        """
        costo_total = 0.0
        for ing in ingredientes:
            # Costo = cantidad * costo_unitario del ingrediente
            costo = ing.cantidad * ing.ingrediente.costo_unitario
            ing.costo_calculado = costo
            costo_total += costo
        
        return round(costo_total, 2)
    
    @staticmethod
    def calcular_costo_por_porcion(costo_total, rendimiento_porciones):
        """
        Calcula el costo por porción de una receta.
        
        Args:
            costo_total: float - Costo total de la receta
            rendimiento_porciones: int - Número de porciones
        
        Returns:
            float: Costo por porción
        """
        if rendimiento_porciones <= 0:
            return 0.0
        
        return round(costo_total / rendimiento_porciones, 2)
    
    @staticmethod
    def calcular_margen_porcentaje(precio_venta, costo_unitario):
        """
        Calcula el margen de ganancia en porcentaje.
        
        Fórmula: (Precio - Costo) / Costo * 100
        
        Args:
            precio_venta: float - Precio de venta unitario
            costo_unitario: float - Costo por unidad
        
        Returns:
            float: Porcentaje de margen
        """
        if costo_unitario <= 0:
            return 0.0
        
        margen = ((precio_venta - costo_unitario) / costo_unitario) * 100
        return round(margen, 2)
    
    @staticmethod
    def calcular_utilidad_total(precio_venta, costo_unitario, rendimiento_porciones):
        """
        Calcula la utilidad total de la receta.
        
        Fórmula: (Precio - Costo) * Porciones
        
        Args:
            precio_venta: float - Precio de venta por porción
            costo_unitario: float - Costo por porción
            rendimiento_porciones: int - Número de porciones
        
        Returns:
            float: Utilidad total
        """
        ganancia_unitaria = precio_venta - costo_unitario
        utilidad_total = ganancia_unitaria * rendimiento_porciones
        return round(utilidad_total, 2)
    
    @staticmethod
    def actualizar_calculos_receta(receta):
        """
        Actualiza todos los cálculos de una receta automáticamente.
        Se llama cuando se modifican ingredientes o precio de venta.
        
        Args:
            receta: Objeto Receta a actualizar
        
        Returns:
            dict: Diccionario con los valores actualizados
        """
        # Calcular costo total
        costo_total = CalculoCostos.calcular_costo_receta(receta.ingredientes)
        receta.costo_total = costo_total
        
        # Calcular costo por porción
        costo_por_porcion = CalculoCostos.calcular_costo_por_porcion(
            costo_total, 
            receta.rendimiento_porciones
        )
        receta.costo_por_porcion = costo_por_porcion
        
        # Calcular margen
        margen = CalculoCostos.calcular_margen_porcentaje(
            receta.precio_venta, 
            costo_por_porcion
        )
        receta.margen_porcentaje = margen
        
        # Calcular utilidad total
        utilidad = CalculoCostos.calcular_utilidad_total(
            receta.precio_venta,
            costo_por_porcion,
            receta.rendimiento_porciones
        )
        receta.utilidad_total = utilidad
        
        return {
            'costo_total': receta.costo_total,
            'costo_por_porcion': receta.costo_por_porcion,
            'margen_porcentaje': receta.margen_porcentaje,
            'utilidad_total': receta.utilidad_total
        }
    
    @staticmethod
    def sugerir_precio_venta(costo_unitario, margen_deseado=40):
        """
        Sugiere un precio de venta basado en el costo y margen deseado.
        
        Fórmula: Precio = Costo / (1 - Margen/100)
        
        Args:
            costo_unitario: float - Costo por unidad
            margen_deseado: float - Margen deseado en porcentaje (default 40%)
        
        Returns:
            float: Precio sugerido
        """
        if margen_deseado >= 100:
            return round(costo_unitario * 2, 2)  # Si margen >= 100%, doblar el precio
        
        precio = costo_unitario / (1 - (margen_deseado / 100))
        return round(precio, 2)
    
    @staticmethod
    def recalcular_todas_recetas(usuario_id, db, recetas):
        """
        Recalcula todas las recetas de un usuario cuando cambia el costo de un ingrediente.
        
        Args:
            usuario_id: int - ID del usuario
            db: SQLAlchemy database instance
            recetas: Lista de recetas del usuario
        
        Returns:
            list: Lista de recetas actualizadas
        """
        actualizadas = []
        
        for receta in recetas:
            calculos = CalculoCostos.actualizar_calculos_receta(receta)
            actualizadas.append({
                'receta_id': receta.id,
                'receta_nombre': receta.nombre,
                'calculos': calculos
            })
        
        db.session.commit()
        return actualizadas


class GeneradorReportes:
    """Clase para generar reportes de costos y márgenes."""
    
    @staticmethod
    def reporte_resumen_recetas(recetas):
        """
        Genera un resumen de todas las recetas con sus costos y márgenes.
        
        Args:
            recetas: Lista de objetos Receta
        
        Returns:
            dict: Reporte con totales y promedios
        """
        if not recetas:
            return {
                'total_recetas': 0,
                'costo_total_promedio': 0,
                'margen_promedio': 0,
                'utilidad_total': 0,
                'recetas': []
            }
        
        recetas_data = [
            {
                'id': r.id,
                'nombre': r.nombre,
                'costo_total': r.costo_total,
                'costo_por_porcion': r.costo_por_porcion,
                'precio_venta': r.precio_venta,
                'margen_porcentaje': r.margen_porcentaje,
                'utilidad_total': r.utilidad_total,
                'rendimiento_porciones': r.rendimiento_porciones
            }
            for r in recetas
        ]
        
        costo_promedio = sum(r['costo_total'] for r in recetas_data) / len(recetas_data)
        margen_promedio = sum(r['margen_porcentaje'] for r in recetas_data) / len(recetas_data)
        utilidad_total = sum(r['utilidad_total'] for r in recetas_data)
        
        return {
            'total_recetas': len(recetas_data),
            'costo_total_promedio': round(costo_promedio, 2),
            'margen_promedio': round(margen_promedio, 2),
            'utilidad_total': round(utilidad_total, 2),
            'recetas': recetas_data
        }
    
    @staticmethod
    def reporte_ingredientes_costos(ingredientes):
        """
        Genera un reporte de todos los ingredientes con sus costos.
        
        Args:
            ingredientes: Lista de objetos Ingrediente
        
        Returns:
            dict: Reporte de ingredientes
        """
        ingredientes_data = [
            {
                'id': i.id,
                'nombre': i.nombre,
                'unidad_medida': i.unidad_medida,
                'costo_unitario': i.costo_unitario,
                'costo_anterior': i.costo_anterior,
                'cambio_porcentaje': round(
                    ((i.costo_unitario - i.costo_anterior) / i.costo_anterior * 100) 
                    if i.costo_anterior > 0 else 0, 2
                ),
                'updated_at': i.updated_at.isoformat()
            }
            for i in ingredientes
        ]
        
        return {
            'total_ingredientes': len(ingredientes_data),
            'costo_promedio': round(
                sum(i['costo_unitario'] for i in ingredientes_data) / len(ingredientes_data)
                if ingredientes_data else 0, 2
            ),
            'ingredientes': ingredientes_data
        }
    
    @staticmethod
    def reporte_rentabilidad_por_margen(recetas):
        """
        Agrupa recetas por rango de margen y genera reporte de rentabilidad.
        
        Args:
            recetas: Lista de objetos Receta
        
        Returns:
            dict: Reporte agrupado por rango de margen
        """
        rangos = {
            'bajo': {'min': 0, 'max': 20, 'recetas': []},
            'medio': {'min': 20, 'max': 40, 'recetas': []},
            'alto': {'min': 40, 'max': 100, 'recetas': []},
            'muy_alto': {'min': 100, 'max': float('inf'), 'recetas': []}
        }
        
        for receta in recetas:
            margen = receta.margen_porcentaje
            if margen <= 20:
                rangos['bajo']['recetas'].append(receta)
            elif margen <= 40:
                rangos['medio']['recetas'].append(receta)
            elif margen <= 100:
                rangos['alto']['recetas'].append(receta)
            else:
                rangos['muy_alto']['recetas'].append(receta)
        
        resultado = {}
        for rango, datos in rangos.items():
            recetas_en_rango = datos['recetas']
            if recetas_en_rango:
                resultado[rango] = {
                    'cantidad': len(recetas_en_rango),
                    'utilidad_total': round(
                        sum(r.utilidad_total for r in recetas_en_rango), 2
                    ),
                    'margen_promedio': round(
                        sum(r.margen_porcentaje for r in recetas_en_rango) / len(recetas_en_rango), 2
                    ),
                    'recetas': [r.nombre for r in recetas_en_rango]
                }
        
        return resultado
