# 🎬 Casos de Uso Completos - Sistema Avanzado

## Caso 1: Venta Normal (Producto Simple)

### Escenario
Es mediodía. Un cliente llega al restaurante y ordena:
- 1 Hamburguesa
- 2 Refrescos
- 1 Postre

### Pasos en la App

**1. Abrir Punto de Venta**
```
Ruta: /ventas
Componente: VentasPageMejorada
```

**2. Agregar Productos**
```
Panel Izquierdo:
├─ Tab: 📦 PRODUCTOS
├─ Card: Hamburguesa [$8.00]
│  └─ Click: ➕ Agregar
├─ Card: Refresco [$2.50] x2
└─ Card: Postre [$3.00]
```

**3. Rellenar Datos**
```
Panel Derecho:
├─ Cliente: [María]
├─ Mesa: [3]
├─ Comentarios: [Cliente nuevo]
└─ Descuento: [0%]
```

**4. Procesar Venta**
```
Cart Summary:
├─ Hamburguesa x1: $8.00
├─ Refresco x2: $5.00
├─ Postre x1: $3.00
├─ Subtotal: $16.00
├─ IVA (19%): $3.04
├─ Propina (10%): $1.60
└─ TOTAL: $20.64

Click: ✓ PROCESAR VENTA
```

**5. Ver Comprobantes**
```
Modal: Comandas (#1024)
├─ Tab: 👨‍🍳 Cocina
│  └─ Muestra: Hamburguesa, Postre
├─ Tab: 🧾 Caja
│  └─ Muestra: Detalle económico
├─ Botón: 🖨️ Imprimir
└─ Botón: ✓ Marcar como impresa
```

**6. Actualización de Stock**
```
Backend:
└─ Productos.stock -=1 (Hamburguesa)
   └─ Productos.stock -=2 (Refresco)
      └─ Productos.stock -=1 (Postre)
```

### Resultado BD
```sql
INSERT INTO ventas (usuario_id, cliente_nombre, numero_mesa, subtotal, iva, propina, total)
VALUES (1, 'María', '3', 16.00, 3.04, 1.60, 20.64);

INSERT INTO venta_items (venta_id, producto_id, cantidad, precio_unitario, subtotal, es_receta)
VALUES 
  (1024, 5, 1, 8.00, 8.00, false),
  (1024, 10, 2, 2.50, 5.00, false),
  (1024, 15, 1, 3.00, 3.00, false);

INSERT INTO comandas (venta_id, tipo_comanda, contenido_html, contenido_texto, impresa)
VALUES 
  (1024, 'cocina', '<div>...</div>', '╔═══...', false),
  (1024, 'caja', '<div>...</div>', '╔═══...', false);
```

---

## Caso 2: Venta con Receta y Explosión

### Escenario
Un cliente ordena:
- 2 Tacos de Pollo (con explosión automática)
- 1 Ensalada
- 3 Bebidas
- Descuento especial: 15%

### Estructura de Receta
```
Tacos de Pollo
├─ Pollo: 250g
├─ Tortillas: 2 unidades
├─ Salsa: 50ml
├─ Queso: 30g
├─ Cebolla: 20g
└─ Cilantro: 5g

Costo: $15 | Precio: $20 | Margen: 33%
```

### Pasos en la App

**1. Seleccionar Receta**
```
Panel Izquierdo:
├─ Tab: 🍽️ RECETAS
├─ Card: Tacos de Pollo [$20.00]
│  ├─ Costo: $15.00
│  ├─ Margen: 33%
│  └─ Click: ➕ Agregar x2
```

**2. Agregar Observaciones**
```
Panel Derecho:
├─ Tacos de Pollo x2
├─ Observaciones: [SIN CEBOLLA, EXTRA CILANTRO]
├─ (El carrito muestra: "⚙️ Explosión automática")
```

**3. Aplicar Descuento**
```
Cart:
├─ Items: $60.00
├─ Descuento: 15% (-$9.00)
├─ Neto: $51.00
├─ IVA (19%): $9.69
├─ Propina (10%): $5.10
└─ TOTAL: $65.79
```

**4. Procesar Venta**
```bash
POST /api/ventas/crear-con-explosion

Body:
{
  "items": [{
    "tipo": "receta",
    "id": 5,
    "cantidad": 2,
    "precio_unitario": 20.00,
    "observaciones": "SIN CEBOLLA, EXTRA CILANTRO"
  }],
  "cliente_nombre": "Pedro",
  "numero_mesa": "7",
  "descuento": 15,
  "comentarios": ""
}
```

**5. Explosión Automática**
```
Backend calcula:
├─ Pollo: 250g × 2 = 500g
├─ Tortillas: 2 × 2 = 4 unidades
├─ Salsa: 50ml × 2 = 100ml
├─ Queso: 30g × 2 = 60g
├─ Cebolla: 0g (Por observación "SIN CEBOLLA")
└─ Cilantro: 5g × 2 × 2 = 20g (Por "EXTRA CILANTRO")
```

**6. Ver Comanda de Cocina**
```
╔════════════════════════════════════╗
║      👨‍🍳 COMANDA COCINA             ║
╠════════════════════════════════════╣
Orden: #1025
Hora: 13:45:22
Mesa: 7
Cajero: Juan

PRODUCTOS
────────────────────────────────────
🍽️  TACOS DE POLLO x2

Ingredientes necesarios:
   • 500 gramos de Pollo
   • 4 unidades de Tortillas
   • 100 ml de Salsa
   • 60 gramos de Queso fresco
   • 20 gramos de Cilantro (EXTRA)

⚠️  OBSERVACIONES ESPECIALES:
   → SIN CEBOLLA ROJA
   → EXTRA CILANTRO

📦 ENSALADA x1
   • Lechuga, tomate, zanahoria

🥤 BEBIDA x3
   • Bebidas variadas
────────────────────────────────────
☐ Cocina ☐ QA

╚════════════════════════════════════╝
```

**7. Ver Recibo para Caja**
```
╔════════════════════════════════════╗
║      🧾 RECIBO DE VENTA            ║
╠════════════════════════════════════╣
Recibo #: 1025
Fecha: 14/12/2024
Hora: 13:45:22
Cajero: Juan
Cliente: Pedro
Mesa: 7

Tacos de Pollo x2          $40.00
Ensalada x1                $12.00
Bebidas x3                  $9.00
                           ──────
Subtotal:                  $61.00
Descuento (15%):          -$9.15
Subtotal neto:            $51.85

IVA (19%):                  $9.85
Propina (10%):              $5.19

╠════════════════════════════════════╣
TOTAL:                     $66.89
╠════════════════════════════════════╣
        ¡Gracias por su compra!
╚════════════════════════════════════╝
```

### Resultado BD
```sql
-- Venta principal
INSERT INTO ventas (usuario_id, cliente_nombre, numero_mesa, subtotal, descuento, iva, propina, total)
VALUES (1, 'Pedro', '7', 61.00, 9.15, 9.85, 5.19, 66.89);

-- Item con explosión
INSERT INTO venta_items (venta_id, receta_id, cantidad, precio_unitario, es_receta, explosion_detalles)
VALUES (1025, 5, 2, 20.00, true, '
{
  "1": {
    "ingrediente_id": 1,
    "ingrediente_nombre": "Pollo",
    "cantidad_total": 500,
    "unidad": "gramos"
  },
  "2": {
    "ingrediente_id": 2,
    "ingrediente_nombre": "Tortillas",
    "cantidad_total": 4,
    "unidad": "unidades"
  }
}
');

-- Comandas generadas automáticamente
INSERT INTO comandas (venta_id, tipo_comanda, contenido_html, contenido_texto)
VALUES (1025, 'cocina', '...', '...');
INSERT INTO comandas (venta_id, tipo_comanda, contenido_html, contenido_texto)
VALUES (1025, 'caja', '...', '...');
```

---

## Caso 3: Análisis de Reportes

### Escenario
Es final de semana. El gerente quiere analizar ventas de la semana.

### 3A. Reporte por Hora (Específico)

**Análisis:** Flujo de ventas del día viernes

```
Ruta: /reportes-ventas
Tab: 🕐 Por Hora
Fecha: [14/12/2024]
Click: 🔄 Recargar
```

**Resultado esperado:**
```
📊 VENTAS DEL 14/12/2024

Métricas:
┌───────────┬───────────────┬──────────────┐
│ Ventas    │ Ingresos      │ Items        │
│    47     │  $3,250.50    │    125       │
└───────────┴───────────────┴──────────────┘

Tabla:
┌──────┬─────────┬────────────┬─────────────┐
│ Hora │ Ventas  │ Ingresos   │ Promedio    │
├──────┼─────────┼────────────┼─────────────┤
│ 09:00│    3    │   $150.25  │ $50.08      │
│ 10:00│    5    │   $275.50  │ $55.10      │
│ 11:00│    8    │   $425.75  │ $53.22      │
│ 12:00│   15    │   $900.00  │ $60.00  ⭐  │ ← PICO ALMUERZO
│ 13:00│   10    │   $625.00  │ $62.50      │
└──────┴─────────┴────────────┴─────────────┘

Gráfico:
       Ingresos
$900   |    ████
$600   | ██ ████ ██
$300   |██ ██████ ██
$0     |─────────────
       09:00 12:00 15:00
```

**Interpretación:**
- Pico máximo a las 12:00 (almuerzo)
- Ticket promedio más alto en hora 13:00
- Total de 47 transacciones en el día
- Promedio: $69.17 por venta

---

### 3B. Reporte por Día (Tendencias)

**Análisis:** Comparar semana completa

```
Ruta: /reportes-ventas
Tab: 📅 Por Día
Desde: [08/12/2024]
Hasta: [14/12/2024]
Click: 🔄 Recargar
```

**Resultado esperado:**
```
📅 VENTAS DE 08/12 A 14/12/2024

Métricas:
┌─────────────┬──────────────┬───────────────┐
│ Total Ventas│ Total Ingreso│ Promedio/Día  │
│    450      │ $25,000.00   │  $3,571.43    │
└─────────────┴──────────────┴───────────────┘

Tabla:
┌──────────┬────────┬──────────┬─────────────┐
│ Fecha    │ Ventas │ Ingresos │ Descuentos  │
├──────────┼────────┼──────────┼─────────────┤
│ 08/12 Su │   32   │$1,800.00 │  $150.00    │
│ 09/12 Lú │   35   │$1,950.00 │  $175.00    │
│ 10/12 Ma │   42   │$2,400.00 │  $250.00    │
│ 11/12 Mi │   38   │$2,100.00 │  $200.00    │
│ 12/12 Ju │   40   │$2,350.00 │  $225.00    │
│ 13/12 Vi │   48   │$2,800.00 │  $300.00    │
│ 14/12 Sa │   47   │$3,250.50 │  $325.00    │ ← MÁS ALTO
└──────────┴────────┴──────────┴─────────────┘

Productos Más Vendidos (14/12):
┌──────────────┬──────────┐
│ Producto     │ Cantidad │
├──────────────┼──────────┤
│ Tacos        │    45    │
│ Bebidas      │    32    │
│ Pasta        │    18    │
└──────────────┴──────────┘
```

**Interpretación:**
- Sabado fue el mejor día ($3,250.50)
- Martes fue el segundo mejor día ($2,400.00)
- Promedio diario: $3,571.43
- Patrón: Fines de semana tienen más ventas

---

### 3C. Reporte Detallado (Análisis Profundo)

**Análisis:** Rentabilidad por receta

```
Ruta: /reportes-ventas
Tab: 📈 Detallado
Desde: [01/12/2024]
Hasta: [14/12/2024]
Click: 🔄 Recargar
```

**Resultado esperado:**
```
📈 REPORTE DETALLADO (01/12 A 14/12/2024)

RESUMEN GENERAL:
┌────────────────────────┐
│ Cantidad de Ventas: 450│
│ Total Ingresos: $25,000│
│ Total Descuentos: $1,200│
│ Total IVA: $4,750      │
│ Ticket Promedio: $55.56│
└────────────────────────┘

PRODUCTOS VENDIDOS:
┌──────────────┬──────────┬──────────┐
│ Producto     │ Cantidad │ Ingresos │
├──────────────┼──────────┼──────────┤
│ Tacos        │   450    │ $10,500  │
│ Bebidas      │   380    │  $5,700  │
│ Pasta        │   125    │  $3,750  │
│ Postres      │    95    │  $2,850  │
└──────────────┴──────────┴──────────┘

RECETAS VENDIDAS (Análisis Rentabilidad):
┌──────────────────┬───────┬────────┬────────┬──────────┐
│ Receta           │ Qtd   │ Ingr   │ Costo  │ Utilidad │
├──────────────────┼───────┼────────┼────────┼──────────┤
│ Tacos Pollo ⭐   │ 250   │$6,250  │$3,750  │ $2,500✓  │ ← MEJOR
│ Pasta Crema      │  80   │$2,400  │$1,200  │ $1,200✓  │
│ Burger Clásico   │  95   │$2,850  │$1,425  │ $1,425✓  │
│ Ensalada Verde   │  75   │$1,875  │$1,125  │  $750 ✓  │
│ Agua/Bebida      │ 200   │$1,200  │  $400  │  $800 ✓  │ ← VOLUMEN
└──────────────────┴───────┴────────┴────────┴──────────┘

ÚLTIMAS VENTAS:
┌──────┬─────────────┬──────────┬──────────┐
│  #   │ Fecha/Hora  │ Cliente  │ Total    │
├──────┼─────────────┼──────────┼──────────┤
│ 1025 │14/12 13:45  │ Pedro    │ $66.89   │
│ 1024 │14/12 13:30  │ María    │ $20.64   │
│ 1023 │14/12 13:15  │ N/A      │ $45.50   │
└──────┴─────────────┴──────────┴──────────┘
```

**Interpretación:**
- Tacos de Pollo: Mejor margen ($2,500 utilidad)
- Agua/Bebida: Volumen alto ($1,200 ingresos)
- Promedio de utilidad: $1,335 por receta
- Enfoque: Aumentar venta de Tacos (máxima rentabilidad)

**Exportar CSV:**
```csv
Fecha,Cliente,Items,Total
2024-12-14,Pedro,2,$66.89
2024-12-14,María,3,$20.64
2024-12-14,N/A,1,$45.50
```

---

## Caso 4: Control de Inventario

### Escenario
Chef revisa qué ingredientes se consumieron.

**Antes (Sin explosión):**
```
❌ No hay forma de saber cuánto de cada ingrediente se usó
❌ Solo se vende "Tacos", sin desglose
```

**Ahora (Con explosión):**
```
✅ Abre venta #1025
✅ Click en "explosion_detalles"
✅ Ve exactamente:
   - Pollo: 500g usado
   - Tortillas: 4 unidades
   - Salsa: 100ml
   - Queso: 60g
```

**Impacto:**
- Control preciso de inventario
- Compras basadas en datos reales
- Reducción de desperdicios
- Previsión de stock más acertada

---

## Caso 5: Reportes para Gerencia

### Escenario
Dueño quiere enviar reportes a contador.

**Antes:**
```
❌ Contar ventas manualmente
❌ Calcular totales a mano
❌ Error en datos
```

**Ahora:**
```
✅ Abre /reportes-ventas
✅ Selecciona rango: 01/12 - 14/12
✅ Tab: Detallado
✅ Click: 📥 Descargar CSV
✅ Abre en Excel
✅ Envía a contador
```

**Contenido del CSV:**
```
Resumen General
Cantidad de Ventas,450
Total Ingresos,25000.00
Total Descuentos,1200.00
Total IVA,4750.00

Productos Vendidos
Producto,Cantidad,Ingresos
Tacos,450,10500.00
Bebidas,380,5700.00

Recetas Vendidas
Receta,Cantidad,Ingresos,Costo,Utilidad
Tacos Pollo,250,6250.00,3750.00,2500.00
```

**Impacto:**
- Reportes profesionales
- Integración con contabilidad
- Auditoría completa
- Decisiones basadas en datos

---

## Conclusión de Casos de Uso

Todos los casos demuestran:
1. ✅ Sistema intuitivo y fácil de usar
2. ✅ Datos precisos y confiables
3. ✅ Automatización de tareas
4. ✅ Reportes profesionales
5. ✅ Control completo del negocio
