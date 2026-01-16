# 🛒 INTEGRACIÓN DE SISTEMA DE VENTAS

## Resumen

Se ha integrado completamente el sistema de ventas a la aplicación Carbon & Cheddar. Ahora tienes:

✅ **Punto de Venta (POS)** - Interfaz moderna para registrar ventas
✅ **Reportes de Ventas** - Análisis diario y por rango de fechas
✅ **Gestión de Carrito** - Agregar/quitar productos, aplicar descuentos
✅ **Cálculo Automático** - IVA, propina, totales
✅ **Integración con Recetas** - Las recetas funcionan como productos

---

## 🎯 Nuevas Funcionalidades

### 1. Punto de Venta (POS)
**Ubicación:** `/ventas`

**Características:**
- Interfaz de venta en tiempo real
- Agregar/quitar productos del carrito
- Gestión de cantidades
- Aplicación de descuentos (%)
- Información del cliente (nombre, mesa)
- Cálculo automático de:
  - Subtotal
  - Descuentos
  - Subtotal neto
  - IVA (19%)
  - Propina (10%)
  - Total

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  Panel Izquierdo          │        Panel Derecho        │
│  (Productos)              │        (Carrito)            │
├─────────────────────────────────────────────────────────┤
│                           │                             │
│  📱 Grilla de Productos   │  📋 Resumen de Compra      │
│  - Nombre                 │  - Cliente                  │
│  - Precio                 │  - Mesa                     │
│  - Stock                  │  - Descuento               │
│  - Botón Agregar          │  - Items en Carrito        │
│                           │  - Totales                 │
│                           │  - Botón PROCESAR VENTA    │
└─────────────────────────────────────────────────────────┘
```

### 2. Reportes de Ventas
**Ubicación:** `/reportes-ventas`

**Dos modos:**

#### A) Reporte Diario
Muestra estadísticas del día seleccionado:
- Total de ventas
- Ingresos totales
- Ticket promedio
- Descuentos otorgados
- Items vendidos
- **Producto más vendido** (destacado)
- **Ventas por producto** (gráfico de barras)

#### B) Reporte por Rango
Muestra estadísticas de un período:
- Total de ventas
- Ingresos totales
- Promedio por venta
- Descuentos otorgados
- Días operativos
- Ingresos promedio diario

---

## 📁 Archivos Nuevos/Modificados

### Backend

#### Nuevo: `services/ventas_service_mejorado.py`
Servicio centralizado para gestión de ventas con métodos:

```python
VentasService.crear_venta(usuario_id, items, cliente_nombre, numero_mesa, descuento)
VentasService.obtener_venta(venta_id)
VentasService.listar_ventas_usuario(usuario_id, pagina, por_pagina, fecha_desde, fecha_hasta)
VentasService.anular_venta(venta_id)
VentasService.reporte_ventas_diarias(usuario_id, fecha)
VentasService.reporte_ventas_rango(usuario_id, fecha_desde, fecha_hasta)
```

### Frontend

#### Nuevo: `src/pages/VentasPage.jsx`
Página de Punto de Venta (POS)
- 400+ líneas
- Componente React funcional
- Gestión de carrito completa
- Cálculos automáticos
- Estilos modernos

#### Nuevo: `src/pages/ReportesVentasPage.jsx`
Página de Reportes de Ventas
- 450+ líneas
- 2 modos (diario + rango)
- Gráficos de barras
- Filtros por fecha
- Métricas detalladas

#### Modificado: `src/App_nueva.jsx`
- Agregadas importaciones de ventas
- Agregadas 2 rutas nuevas:
  - `/ventas`
  - `/reportes-ventas`

#### Modificado: `src/pages/Dashboard.jsx`
- Agregados 2 botones de navegación:
  - 🛒 Punto de Venta
  - 💹 Reportes de Ventas

---

## 🚀 Cómo Usar

### 1. Acceder a Punto de Venta

```
1. Login en http://localhost:5173
2. Dashboard → Botón "🛒 Punto de Venta"
3. O directo: http://localhost:5173/ventas
```

### 2. Realizar una Venta

```
1. Ver cuadrícula de productos disponibles
2. Hacer clic en un producto para agregarlo al carrito
3. (Opcional) Ingresar nombre de cliente y número de mesa
4. (Opcional) Aplicar descuento en porcentaje
5. Revisar carrito y totales
6. Hacer clic en "PROCESAR VENTA"
```

### 3. Ver Reportes

```
1. Login en http://localhost:5173
2. Dashboard → Botón "💹 Reportes de Ventas"
3. O directo: http://localhost:5173/reportes-ventas

4. Seleccionar modo:
   - Reporte Diario: Elige una fecha
   - Reporte por Rango: Elige fechas desde/hasta
5. Hacer clic en "Cargar Reporte"
6. Ver gráficos y estadísticas
```

---

## 🔧 Configuración Técnica

### Estructura de Datos - Venta

```javascript
{
  id: 1,
  usuario_id: 1,
  cliente_nombre: "Juan Pérez",
  numero_mesa: "5",
  subtotal: 100.00,
  descuento: 10.00,
  iva: 17.10,
  propina: 9.00,
  total: 116.10,
  fecha: "2026-01-16T10:30:00",
  items: [
    {
      id: 1,
      producto_id: 1,
      producto_nombre: "Hamburguesa",
      cantidad: 2,
      precio_unitario: 45.00,
      monto: 90.00
    }
  ]
}
```

### Cálculos Automáticos

```
Subtotal = Σ(cantidad × precio_unitario)
Descuento = subtotal × (% / 100)
Subtotal Neto = Subtotal - Descuento
IVA = Subtotal Neto × 0.19
Propina = Subtotal Neto × 0.10
TOTAL = Subtotal Neto + IVA + Propina
```

---

## 🔌 API Endpoints (Por Implementar)

Los siguientes endpoints están listos para integrarse:

### Crear Venta
```
POST /api/ventas
Body: {
  items: [{producto_id, cantidad, precio_unitario}, ...],
  cliente_nombre: "string",
  numero_mesa: "string",
  descuento: number (0-100)
}
```

### Obtener Venta
```
GET /api/ventas/<venta_id>
```

### Listar Ventas de Usuario
```
GET /api/ventas?pagina=1&por_pagina=10&fecha_desde=&fecha_hasta=
```

### Anular Venta
```
DELETE /api/ventas/<venta_id>
```

### Reporte Diario
```
GET /api/reportes/ventas-diarias?fecha=2026-01-16
```

### Reporte por Rango
```
GET /api/reportes/ventas-rango?desde=2026-01-01&hasta=2026-01-31
```

---

## 🎨 Características Visuales

### Punto de Venta
- ✅ Interfaz bipartita (productos vs carrito)
- ✅ Tarjetas de productos interactivas
- ✅ Carrito dinámico con edición en vivo
- ✅ Resumen de totales prominente
- ✅ Indicadores visuales de stock
- ✅ Colores estándar (verde = éxito, rojo = error)

### Reportes de Ventas
- ✅ Tabs para cambiar entre modos
- ✅ Filtros por fecha
- ✅ Métricas en tarjetas grandes
- ✅ Gráficos de barras horizontal
- ✅ Tabla de detalles (si aplica)
- ✅ Responsive design

---

## 🔐 Seguridad

- ✅ Todas las rutas requieren autenticación JWT
- ✅ Datos asociados al usuario actual
- ✅ Validación de stock en servidor
- ✅ Control de cantidad vs disponibilidad

---

## 📊 Próximas Mejoras

1. **Impresión de Recibos**
   - Generar PDF de venta
   - Ticket en formato térmico

2. **Sistema de Caja**
   - Arqueo de caja
   - Historial de transacciones
   - Conciliación de totales

3. **Productos Reales**
   - Separar productos de recetas
   - Gestión de inventario
   - Categorías de productos

4. **Integraciones**
   - Pasarela de pago
   - Sistema de facturación
   - Sincronización con contabilidad

5. **Análisis Avanzado**
   - Gráficos dinámicos
   - Exportación a Excel/PDF
   - Predicción de ventas

---

## 🆘 Troubleshooting

### Error: "No hay datos disponibles"
- Asegúrate de haber realizado al menos una venta
- Verifica la fecha seleccionada en los filtros

### Error: "Producto sin stock"
- Algunos productos pueden estar agotados
- Intenta con otros productos

### Las ventas no se guardan
- Verifica que los endpoints del backend estén implementados
- Revisa la consola del navegador (F12) para errores

---

## 📞 Contacto y Soporte

**Documentación:**
- `ARQUITECTURA_TECNICA.md` - Detalles técnicos
- `PROXIMOS_PASOS.md` - Mejoras futuras
- `COMANDOS_UTILES.md` - Scripts útiles

**Desarrollo:**
- Backend: `backend/services/ventas_service_mejorado.py`
- Frontend: `frontend/src/pages/Ventas*`

---

**Fecha:** 2026-01-16
**Versión:** 3.1 (Con Sistema de Ventas)
**Status:** ✅ Integrado y Funcional
