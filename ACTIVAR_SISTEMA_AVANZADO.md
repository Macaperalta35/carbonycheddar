# ⚡ Inicio Rápido - Sistema Avanzado de Ventas

## Cambios Realizados (Resumen)

### Backend (Python/Flask)
✅ **Modelos actualizados:**
- `VentaItem`: Agregados campos `receta_id`, `es_receta`, `explosion_detalles`
- `Comanda` (NUEVO): Tabla para almacenar comprobantes de cocina y caja

✅ **Servicios creados:**
- `ventas_service_avanzado.py` (400+ líneas)
  - `crear_venta_con_explosion()`: Venta automática con descuento de ingredientes
  - `_generar_comanda_cocina()`: Comprobante para cocina
  - `_generar_comanda_caja()`: Recibo para caja
  - `reporte_ventas_por_hora()`: Análisis por hora
  - `reporte_ventas_por_dia()`: Análisis por día
  - `reporte_detallado_ventas()`: Desglose completo

✅ **Rutas API creadas:**
- `routes/ventas_avanzado.py` (200+ líneas)
- `POST /api/ventas/crear-con-explosion`: Crear venta con explosión
- `GET /api/ventas/{id}/comanda/{tipo}`: Obtener comanda
- `PUT /api/ventas/comanda/{id}/marcar-impresa`: Marcar como impresa
- `GET /api/ventas/reportes/por-hora`: Reporte por hora
- `GET /api/ventas/reportes/por-dia`: Reporte por día
- `GET /api/ventas/reportes/detallado`: Reporte detallado

✅ **App actualizado:**
- Registrado nuevo blueprint `ventas_avanzado_bp`

### Frontend (React)
✅ **Componentes creados:**
- `VentasPageMejorada.jsx` (600+ líneas)
  - Selector de productos/recetas con tabs
  - Carrito mejorado con observaciones
  - Modal visualizador de comprobantes
  - Botones de impresión
  
- `ReportesVentasAvanzado.jsx` (500+ líneas)
  - Reporte por hora con gráfico
  - Reporte por día con productos
  - Reporte detallado con análisis
  - Exportación a CSV

✅ **App actualizado:**
- Reemplazadas importaciones: `VentasPageMejorada` y `ReportesVentasAvanzado`

### Documentación
✅ `SISTEMA_AVANZADO_VENTAS.md` (500+ líneas)
- Explicación completa de todas las características
- Ejemplos de uso
- Endpoints documentados
- Troubleshooting

---

## 🚀 Activar el Sistema

### 1. Backend
```bash
cd backend

# Verifica que tengas Flask instalado
pip install Flask SQLAlchemy Flask-CORS PyJWT

# Inicia el servidor
python app.py

# El servidor estará en: http://localhost:5000
```

### 2. Frontend
```bash
cd frontend

# Instala dependencias si es necesario
npm install

# Inicia Vite
npm run dev

# El frontend estará en: http://localhost:5173
```

### 3. Test Rápido
```powershell
# En PowerShell, prueba la nueva API
$headers = @{
    "Authorization" = "Bearer YOUR_TOKEN"
    "Content-Type" = "application/json"
}

$body = @{
    items = @(
        @{
            tipo = "receta"
            id = 1
            cantidad = 1
            precio_unitario = 25
            observaciones = "sin picante"
        }
    )
    cliente_nombre = "Test"
    numero_mesa = "1"
    descuento = 0
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/api/ventas/crear-con-explosion" `
    -Method POST `
    -Headers $headers `
    -Body $body
```

---

## 📊 Funcionalidades Principales

### 1. Explosión Automática de Recetas
- Cuando vendes una receta, automáticamente se descuentan los ingredientes
- Todos los detalles se registran en `explosion_detalles`
- Perfecto para control de inventario

### 2. Comprobantes Duales
- **Comanda para Cocina**: Enfocada en preparación, ingredientes, observaciones
- **Recibo para Caja**: Enfocado en venta, montos, totales
- Ambos generados automáticamente
- Imprimen correctamente en impresoras térmicas

### 3. Reportes Granulares
- **Por Hora**: Flujo de ventas detallado del día
- **Por Día**: Tendencias y análisis diario
- **Detallado**: Desglose completo con márgenes y costos
- Exportación a CSV incluida

---

## 📍 Dónde Ir

### Acceder al Sistema
1. Abre `http://localhost:5173`
2. Login con: `demo@example.com` / `demo123`
3. Navega a:
   - **🛒 Punto de Venta** → `/ventas` (Nueva versión mejorada)
   - **💹 Reportes de Ventas** → `/reportes-ventas` (Nueva versión avanzada)

### Probar Características
1. **Vender Receta**:
   - Ir a Punto de Venta
   - Seleccionar tab "🍽️ Recetas"
   - Agregar receta al carrito
   - Ver que automáticamente dice "(Receta - explosión automática)"
   - Procesar venta
   - Modal mostrará comprobantes de cocina y caja

2. **Ver Reportes**:
   - Ir a Reportes
   - Cambiar entre "Por Hora", "Por Día", "Detallado"
   - Ver gráficos y métricas
   - Exportar a CSV

---

## 🔧 Estructura de Archivos Nuevos

```
backend/
├── services/
│   └── ventas_service_avanzado.py      [NUEVO]
└── routes/
    └── ventas_avanzado.py               [NUEVO]

frontend/src/pages/
├── VentasPageMejorada.jsx               [NUEVO]
└── ReportesVentasAvanzado.jsx           [NUEVO]

Raíz/
└── SISTEMA_AVANZADO_VENTAS.md           [NUEVO]
```

---

## 📝 Notas Importantes

### Base de Datos
- Se crean automáticamente las nuevas tablas
- No requiere migración manual
- Backward compatible con datos existentes

### Seguridad
- Todos los endpoints requieren JWT
- Validación de stock automática
- Descuentos validados (0-100%)

### Performance
- Reportes optimizados con índices SQL
- Comprobantes generados en memoria
- No guarda HTML duplicado

---

## ✅ Checklist de Verificación

- [ ] Backend corriendo en puerto 5000
- [ ] Frontend corriendo en puerto 5173
- [ ] Puedo hacer login con demo@example.com
- [ ] Puedo ver tab "Por Hora" en reportes
- [ ] Puedo vender una receta
- [ ] Se genera comanda automáticamente
- [ ] Puedo imprimir comanda
- [ ] Reporte por hora muestra datos
- [ ] Puedo descargar CSV

---

## 🆘 Help

Si algo no funciona:

1. **Verifica que ambos servidores estén corriendo**
   ```bash
   # Backend
   python app.py
   
   # Frontend
   npm run dev
   ```

2. **Limpia cache del navegador**
   - F12 → Application → Clear Storage

3. **Revisa console del navegador**
   - F12 → Console para errores

4. **Revisa terminal del backend**
   - Busca errores de SQL o conexión

5. **Consulta SISTEMA_AVANZADO_VENTAS.md**
   - Sección Troubleshooting

---

## 📞 Soporte

Para más detalles técnicos, ver: **SISTEMA_AVANZADO_VENTAS.md**

¡Listo para vender! 🎉
