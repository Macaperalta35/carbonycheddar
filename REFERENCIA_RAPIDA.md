# 📋 Referencia Rápida - API Endpoints

## Resumen de Cambios

| Componente | Archivo | Cambios |
|-----------|---------|---------|
| Modelos | `models.py` | VentaItem + campos, Nueva tabla Comanda |
| Servicio | `ventas_service_avanzado.py` | 400+ líneas, 6 métodos principales |
| Rutas | `ventas_avanzado.py` | 5 nuevos endpoints |
| Frontend | `App_nueva.jsx` | Importa nuevos componentes |
| Pages | `VentasPageMejorada.jsx` | 600+ líneas, POS mejorado |
| Pages | `ReportesVentasAvanzado.jsx` | 500+ líneas, reportes avanzados |

---

## 🔌 Endpoints API

### 1. Crear Venta con Explosión
```http
POST /api/ventas/crear-con-explosion
Authorization: Bearer {token}
Content-Type: application/json

{
  "items": [
    {
      "tipo": "receta|producto",
      "id": 5,
      "cantidad": 3,
      "precio_unitario": 25.00,
      "observaciones": "sin picante"
    }
  ],
  "cliente_nombre": "Carlos",
  "numero_mesa": "5",
  "descuento": 10,
  "comentarios": ""
}

Response: 201
{
  "success": true,
  "data": {
    "venta_id": 1024,
    "total": 98.18,
    "comanda_cocina_id": 101,
    "comanda_caja_id": 102
  }
}
```

### 2. Obtener Comanda
```http
GET /api/ventas/{venta_id}/comanda/{tipo}
Authorization: Bearer {token}

# tipo: 'cocina' o 'caja'

Response: 200
{
  "success": true,
  "data": {
    "id": 101,
    "venta_id": 1024,
    "tipo": "cocina",
    "html": "...",
    "texto": "...",
    "impresa": false
  }
}
```

### 3. Marcar Comanda Impresa
```http
PUT /api/ventas/comanda/{comanda_id}/marcar-impresa
Authorization: Bearer {token}

Response: 200
{
  "success": true,
  "data": {
    "impresa": true,
    "fecha_impresion": "2024-12-14T14:31:00"
  }
}
```

### 4. Reporte Por Hora
```http
GET /api/ventas/reportes/por-hora?fecha=2024-12-14
Authorization: Bearer {token}

Response: 200
{
  "success": true,
  "data": {
    "fecha": "2024-12-14",
    "total_ventas": 47,
    "total_ingresos": 3250.50,
    "horas": [
      {
        "hora": "09:00",
        "cantidad_ventas": 3,
        "total_ingresos": 150.25,
        "ticket_promedio": 50.08
      }
    ]
  }
}
```

### 5. Reporte Por Día
```http
GET /api/ventas/reportes/por-dia?fecha_inicio=2024-12-01&fecha_fin=2024-12-14
Authorization: Bearer {token}

Response: 200
{
  "success": true,
  "data": {
    "total_ventas": 450,
    "total_ingresos": 25000.00,
    "dias": [
      {
        "fecha": "2024-12-01",
        "cantidad_ventas": 32,
        "total_ingresos": 1800.00,
        "ticket_promedio": 56.25
      }
    ]
  }
}
```

### 6. Reporte Detallado
```http
GET /api/ventas/reportes/detallado?fecha_inicio=2024-12-01&fecha_fin=2024-12-14
Authorization: Bearer {token}

Response: 200
{
  "success": true,
  "data": {
    "resumen": {
      "cantidad_ventas": 450,
      "total_ingresos": 25000.00,
      "ticket_promedio": 55.56
    },
    "productos": {
      "Tacos": {"cantidad": 450, "ingresos": 10500}
    },
    "recetas": {
      "Tacos de Pollo": {
        "cantidad": 250,
        "ingresos": 6250,
        "costo": 3750,
        "utilidad": 2500
      }
    }
  }
}
```

---

## 📊 Estructura de Datos

### VentaItem (Actualizado)
```python
{
  "id": 5001,
  "venta_id": 1024,
  "producto_id": null,          # null si es receta
  "receta_id": 5,               # null si es producto
  "cantidad": 3,
  "precio_unitario": 25.00,
  "subtotal": 75.00,
  "observaciones": "sin picante",
  "es_receta": true,
  "explosion_detalles": {       # Solo si es_receta=true
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

### Comanda (Nuevo)
```python
{
  "id": 101,
  "venta_id": 1024,
  "tipo_comanda": "cocina",     # 'cocina' o 'caja'
  "contenido_html": "<div>...",
  "contenido_texto": "╔═════...",
  "impresa": true,
  "fecha_impresion": "2024-12-14T14:31:00"
}
```

---

## 🎨 Rutas del Navegador

| Ruta | Componente | Descripción |
|------|-----------|------------|
| `/login` | LoginPage | Autenticación |
| `/dashboard` | Dashboard | Panel principal |
| `/ventas` | VentasPageMejorada | Punto de venta (mejorado) |
| `/reportes-ventas` | ReportesVentasAvanzado | Reportes (avanzado) |
| `/ingredientes` | IngredientesPage | Gestión de ingredientes |
| `/receta/nueva` | RecetaForm | Crear receta |
| `/receta/:id` | RecetaForm | Editar receta |

---

## ⚡ Características Principales

### ✅ Explosión de Recetas
- Automática al vender
- Registra ingredientes consumidos
- Tracking completo en BD
- Validación de disponibilidad

### ✅ Comprobantes Duales
- **Cocina**: Ingredientes, preparación, observaciones
- **Caja**: Detalles económicos, totales, propina
- Generación automática
- Imprimible (HTML + texto plano)
- Marca de "impresa"

### ✅ Reportes Granulares
- **Hora**: Flujo detallado del día
- **Día**: Tendencias y análisis
- **Detallado**: Completo con márgenes
- Exportación CSV
- Gráficos visuales
- Filtros dinámicos

---

## 🔐 Autenticación

Todos los endpoints requieren:
```http
Authorization: Bearer {token}
```

Obtener token:
```bash
POST /api/auth/login
{
  "email": "demo@example.com",
  "password": "demo123"
}

Response:
{
  "success": true,
  "token": "eyJhbGciOi...",
  "usuario": {...}
}
```

---

## 🐛 Validaciones

### Crear Venta
- ✓ Items no puede estar vacío
- ✓ Descuento entre 0-100%
- ✓ Stock disponible (productos)
- ✓ Precio unitario válido

### Reportes
- ✓ Fecha debe estar en formato YYYY-MM-DD
- ✓ fecha_inicio no puede ser mayor que fecha_fin
- ✓ Usuario debe estar autenticado

---

## 📝 Ejemplos cURL

### Crear Venta
```bash
curl -X POST http://localhost:5000/api/ventas/crear-con-explosion \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"tipo":"receta","id":5,"cantidad":3,"precio_unitario":25}],
    "cliente_nombre":"Carlos",
    "numero_mesa":"5",
    "descuento":10
  }'
```

### Obtener Reporte
```bash
curl -X GET "http://localhost:5000/api/ventas/reportes/por-hora?fecha=2024-12-14" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🚀 Despliegue Rápido

### Backend
```bash
cd backend
python app.py
# Puerto: 5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Puerto: 5173
```

### Test
```bash
# Abre http://localhost:5173
# Login: demo@example.com / demo123
# Navega a: /ventas o /reportes-ventas
```

---

## 📞 Debugging

### Si la venta no se crea
1. Verifica JWT en DevTools (F12)
2. Revisa console para errores
3. Chequea ingredientes existen
4. Valida stock de productos

### Si no se genera comanda
1. Verifica venta creó correctamente
2. Revisa tabla Comanda en BD
3. Chequea servicio de templates

### Si reportes vacíos
1. Verifica hay ventas en rango
2. Cambia rango de fechas
3. Revisa usuario_id correcto

---

## 📚 Documentación Completa

- **SISTEMA_AVANZADO_VENTAS.md**: Guía técnica completa
- **GUIA_VISUAL_AVANZADO.md**: Ejemplos visuales y diagramas
- **ACTIVAR_SISTEMA_AVANZADO.md**: Guía de inicio rápido

---

## ✨ Resumen

| Item | Cantidad |
|------|----------|
| Nuevos Endpoints | 5 |
| Nuevos Métodos Backend | 6 |
| Nuevos Componentes Frontend | 2 |
| Líneas de Código Backend | 600+ |
| Líneas de Código Frontend | 1100+ |
| Documentación | 2000+ |

**Estado: ✅ COMPLETO Y FUNCIONAL**
