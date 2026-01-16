# 📊 Sistema Avanzado de Ventas con Explosión de Recetas

## Resumen de Nuevas Características

Este documento describe las mejoras implementadas al sistema de ventas:

1. **Explosión automática de recetas** - Descuenta ingredientes del inventario
2. **Comprobantes duales** - Comanda para cocina y recibo para caja
3. **Reportes granulares** - Por hora, día y rango de fechas
4. **Integración completa** - Backend + Frontend con APIs REST

---

## 1. Explosión Automática de Recetas

### ¿Qué es?
Cuando se vende una receta, el sistema automáticamente:
- Identifica los ingredientes que componen la receta
- Multiplica la cantidad de ingredientes por la cantidad de recetas vendidas
- Registra el consumo en la base de datos
- Puede generar alertas de inventario bajo

### Ejemplo
```
Receta: Tacos de Pollo
Ingredientes:
  - Pollo: 250g
  - Tortillas: 2 unidades
  - Salsa: 50ml

Cliente compra: 3 órdenes de Tacos
↓
Sistema descuenta automáticamente:
  - Pollo: 250g × 3 = 750g
  - Tortillas: 2 × 3 = 6 unidades
  - Salsa: 50ml × 3 = 150ml
```

### Datos en Base de Datos
En `VentaItem`:
```json
{
  "es_receta": true,
  "receta_id": 5,
  "explosion_detalles": {
    "1": {
      "ingrediente_id": 1,
      "ingrediente_nombre": "Pollo",
      "unidad": "gramos",
      "cantidad_por_receta": 250,
      "cantidad_total": 750,
      "costo_unitario": 2.50,
      "costo_total": 1875.00
    }
  }
}
```

---

## 2. Comprobantes Duales

### Comanda para Cocina
**Características:**
- Enfocada en la preparación
- Detalles de ingredientes (explosión completa)
- Observaciones prominentes
- Checkbox para marcar cuando está listo
- Versión HTML e imprimible

**Contenido:**
```
╔════════════════════════════════════╗
║      👨‍🍳 COMANDA COCINA           ║
╠════════════════════════════════════╣
Orden: #1024
Hora: 14:30:45
Mesa: 5
╠════════════════════════════════════╣
PRODUCTOS
🍽️  Tacos de Pollo x3
   → 750g de Pollo
   → 6 de Tortillas
   → 150ml de Salsa
   ⚠️  NOTA: Sin cebolla
╠════════════════════════════════════╣
         ☐ Marca cuando esté listo
╚════════════════════════════════════╝
```

### Recibo para Caja
**Características:**
- Enfocada en la venta
- Detalles económicos completos
- IVA 19% desglosado
- Propina 10% sugerida
- Totales destacados

**Contenido:**
```
╔════════════════════════════════════╗
║      🧾 RECIBO DE VENTA           ║
║      Carbon & Cheddar             ║
╠════════════════════════════════════╣
Recibo #: 1024
Fecha: 14/12/2024
Hora: 14:30:45
Cajero: Juan
Cliente: Carlos
Mesa: 5
╠════════════════════════════════════╣
Tacos de Pollo x3         $75.00
Bebida x3                 $30.00
╠════════════════════════════════════╣
SUBTOTAL:                 $105.00
IVA (19%):                 $19.95
PROPINA (10%):             $10.50
╠════════════════════════════════════╣
TOTAL:                    $135.45
╠════════════════════════════════════╣
        ¡Gracias por su compra!
        Vuelva pronto
╚════════════════════════════════════╝
```

### Endpoints de Comprobantes
```bash
# Obtener comanda
GET /api/ventas/{venta_id}/comanda/{tipo}
Query params:
  - tipo: 'cocina' | 'caja'

# Marcar como impresa
PUT /api/ventas/comanda/{comanda_id}/marcar-impresa
```

---

## 3. Reportes Granulares

### 3.1 Reporte por Hora

**Propósito:** Análisis detallado del flujo de ventas durante el día

**Datos incluidos:**
- Cantidad de ventas por hora
- Ingresos por hora
- Ticket promedio
- Detalles de productos vendidos

**Endpoint:**
```bash
GET /api/ventas/reportes/por-hora?fecha=2024-12-14
```

**Respuesta:**
```json
{
  "fecha": "2024-12-14",
  "total_ventas": 47,
  "total_ingresos": 3250.50,
  "total_items": 125,
  "horas": [
    {
      "hora": "09:00",
      "cantidad_ventas": 3,
      "total_ingresos": 150.25,
      "ticket_promedio": 50.08,
      "items": [
        {"nombre": "Café", "cantidad": 5, "monto": 75}
      ]
    },
    {
      "hora": "12:00",
      "cantidad_ventas": 15,
      "total_ingresos": 900.00,
      "ticket_promedio": 60.00,
      "items": [...]
    }
  ]
}
```

### 3.2 Reporte por Día

**Propósito:** Análisis de tendencias diarias

**Datos incluidos:**
- Cantidad de ventas por día
- Ingresos por día
- Descuentos aplicados
- Productos más vendidos por día

**Endpoint:**
```bash
GET /api/ventas/reportes/por-dia?fecha_inicio=2024-12-01&fecha_fin=2024-12-14
```

**Respuesta:**
```json
{
  "fecha_inicio": "2024-12-01",
  "fecha_fin": "2024-12-14",
  "total_ventas": 450,
  "total_ingresos": 25000.00,
  "dias": [
    {
      "fecha": "2024-12-01",
      "cantidad_ventas": 32,
      "total_ingresos": 1800.00,
      "total_descuentos": 150.00,
      "ticket_promedio": 56.25,
      "productos_mas_vendidos": {
        "Tacos": 45,
        "Bebidas": 32
      }
    }
  ]
}
```

### 3.3 Reporte Detallado

**Propósito:** Análisis completo con desglose por productos y recetas

**Datos incluidos:**
- Resumen general (ventas, ingresos, IVA)
- Productos vendidos (cantidad, ingresos)
- Recetas vendidas (cantidad, ingresos, costo, utilidad)
- Listado completo de ventas

**Endpoint:**
```bash
GET /api/ventas/reportes/detallado?fecha_inicio=2024-12-01&fecha_fin=2024-12-14
```

**Respuesta:**
```json
{
  "fecha_inicio": "2024-12-01",
  "fecha_fin": "2024-12-14",
  "resumen": {
    "cantidad_ventas": 450,
    "total_ingresos": 25000.00,
    "total_descuentos": 1200.00,
    "total_iva": 4750.00,
    "ticket_promedio": 55.56
  },
  "productos": {
    "Tacos": {"cantidad": 450, "ingresos": 10500},
    "Bebidas": {"cantidad": 380, "ingresos": 5700}
  },
  "recetas": {
    "Tacos de Pollo": {
      "cantidad": 250,
      "ingresos": 6250,
      "costo": 3750,
      "utilidad": 2500
    }
  },
  "ventas": [...]
}
```

---

## 4. Frontend Mejorado

### VentasPageMejorada.jsx

**Características:**
- Tab selector para Productos/Recetas
- Diferenciación visual (productos vs recetas)
- Detalles de costo y margen para recetas
- Indicador automático de explosión
- Visualizador de comprobantes integrado
- Impresión directa
- Modal de comanda (cocina + caja)

**Flujo de Venta:**
1. Seleccionar tipo (Producto/Receta)
2. Agregar items al carrito
3. Agregar observaciones (ej: "sin picante")
4. Ingresar datos de cliente (opcional)
5. Aplicar descuento (opcional)
6. Procesar venta
7. Visualizar y imprimir comandas

### ReportesVentasAvanzado.jsx

**Características:**
- Tab selector: Por Hora / Por Día / Detallado
- Filtros dinámicos según tipo de reporte
- Métricas en cards destacadas
- Gráficos de barras (ingresos por hora)
- Tablas sorteable
- Exportación a CSV
- Cálculo automático de promedios

**Opciones de Descarga:**
- CSV con formato estándar
- Apto para Excel/Google Sheets
- Preserva estructura de datos

---

## 5. Cambios en Modelos

### VentaItem (actualizado)
```python
class VentaItem(db.Model):
    # ... campos existentes ...
    receta_id = db.Column(db.Integer, db.ForeignKey('recetas.id'), nullable=True)
    es_receta = db.Column(db.Boolean, default=False)
    explosion_detalles = db.Column(db.Text, default='{}')  # JSON
    
    receta = db.relationship('Receta')
```

### Comanda (nuevo)
```python
class Comanda(db.Model):
    venta_id = db.Column(db.Integer, db.ForeignKey('ventas.id'), unique=True)
    tipo_comanda = db.Column(db.String(20))  # 'cocina' o 'caja'
    contenido_html = db.Column(db.Text)
    contenido_texto = db.Column(db.Text)  # Para impresora térmica
    impresa = db.Column(db.Boolean, default=False)
    fecha_impresion = db.Column(db.DateTime, nullable=True)
```

---

## 6. API Endpoints

### Crear Venta con Explosión
```bash
POST /api/ventas/crear-con-explosion

Body:
{
  "items": [
    {
      "tipo": "receta",
      "id": 5,
      "cantidad": 3,
      "precio_unitario": 25.00,
      "observaciones": "sin picante"
    },
    {
      "tipo": "producto",
      "id": 10,
      "cantidad": 2,
      "precio_unitario": 15.00,
      "observaciones": ""
    }
  ],
  "cliente_nombre": "Carlos",
  "numero_mesa": "5",
  "descuento": 10,
  "comentarios": "Cliente VIP"
}

Response:
{
  "success": true,
  "data": {
    "venta_id": 1024,
    "cliente": "Carlos",
    "mesa": "5",
    "total": 135.45,
    "comanda_cocina_id": 101,
    "comanda_caja_id": 102,
    "explosion_detalles": {
      "1": {"ingrediente_nombre": "Pollo", "cantidad_total": 750}
    }
  }
}
```

### Obtener Comanda
```bash
GET /api/ventas/1024/comanda/cocina

Response:
{
  "success": true,
  "data": {
    "id": 101,
    "venta_id": 1024,
    "tipo": "cocina",
    "html": "...",
    "texto": "...",
    "impresa": false,
    "created_at": "2024-12-14T14:30:45"
  }
}
```

### Reportes
```bash
# Por Hora
GET /api/ventas/reportes/por-hora?fecha=2024-12-14

# Por Día
GET /api/ventas/reportes/por-dia?fecha_inicio=2024-12-01&fecha_fin=2024-12-14

# Detallado
GET /api/ventas/reportes/detallado?fecha_inicio=2024-12-01&fecha_fin=2024-12-14
```

---

## 7. Instalación y Configuración

### Backend
```bash
# Las migraciones de BD se hacen automáticamente
python app.py

# El modelo Comanda se crea automáticamente
```

### Frontend
```bash
# Los nuevos componentes ya están importados
npm run dev

# Acceso:
# - Punto de Venta: /ventas
# - Reportes: /reportes-ventas
```

---

## 8. Casos de Uso

### Caso 1: Venta de Receta con Obsevaciones
```
Usuario: Camarero Juan
Acción: Vende 2 órdenes de Tacos de Pollo "sin cebolla"
Sistema:
1. Descuenta automáticamente: 500g pollo, 4 tortillas, 100ml salsa
2. Genera comanda de cocina con "SIN CEBOLLA"
3. Genera recibo para caja
4. Ambos están disponibles para imprimir
5. Se registra en reportes
```

### Caso 2: Análisis de Pico de Ventas
```
Usuario: Gerente María
Acción: Abre reporte por hora del día
Sistema:
1. Muestra gráfico de ingresos por hora
2. Identifica pico en hora 12:00 (almuerzo)
3. Permite analizar qué productos se vendieron
4. Exporta datos para análisis adicional
```

### Caso 3: Control de Inventario
```
Usuario: Chef Pedro
Acción: Revisa qué ingredientes se consumieron
Sistema:
1. Accede a detalles de venta
2. Ve "explosion_detalles" con cantidad exacta
3. Actualiza compras según consumo real
4. Evita over-stocking/under-stocking
```

---

## 9. Próximas Mejoras

- [ ] Alertas de stock bajo en ingredientes
- [ ] Predicción de demanda (ML)
- [ ] Impresoras térmicas integradas
- [ ] Múltiples locales/sucursales
- [ ] Dashboard de camarero
- [ ] Sistema de mesas en tiempo real
- [ ] Integración con delivery apps
- [ ] Análisis de rentabilidad por receta

---

## 10. Troubleshooting

### Error: "Stock insuficiente de ingrediente X"
**Causa:** Los ingredientes descontados en explosión no existen
**Solución:** Crear ingredientes en sección Ingredientes

### Error: "Receta no encontrada"
**Causa:** ID de receta inválido
**Solución:** Verificar ID en sección de Recetas

### Comanda no se genera
**Causa:** Error en servicio de comprobantes
**Solución:** Revisar logs del backend

### Reporte vacío
**Causa:** No hay ventas en rango de fechas
**Solución:** Cambiar rango de fechas

---

## Conclusión

El sistema está completamente integrado y listo para producción. Las tres mejoras principales (explosión, comprobantes, reportes) trabajan juntas para crear un sistema completo de gestión de ventas.
