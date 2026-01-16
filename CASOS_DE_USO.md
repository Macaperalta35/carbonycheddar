# 🍔 GUÍA DE CASOS DE USO - Carbon & Cheddar

## Caso 1: Chef abre su restaurante

### Escenario
María es chef y quiere abrir su restaurante "Burgers del Barrio". Necesita gestionar 3 recetas iniciales con control de costos.

### Pasos

#### 1. Registro e Inicio de Sesión
```
- URL: http://localhost:5173/login
- Opción: "Regístrate aquí"
- Datos:
  Nombre: María García
  Email: maria@burgers-barrio.com
  Contraseña: Segura123!
- Sistema: Crea usuario en BD y devuelve JWT token
```

#### 2. Crear Ingredientes Base
```
Dashboard → Ingredientes

Para cada ingrediente:
- Carne molida: $12/kg, unidad: kg
- Pan brioche: $0.80, unidad: unidad  
- Queso cheddar: $15/kg, unidad: kg
- Lechuga: $3.50/kg, unidad: kg
- Tomate: $4/kg, unidad: kg
- Bacon: $20/kg, unidad: kg
- Mayonesa: $8/kg, unidad: kg

→ Sistema almacena en tabla Ingrediente
```

#### 3. Crear Primera Receta: "Burger Clásica"
```
Dashboard → + Nueva Receta

Datos básicos:
- Nombre: Burger Clásica
- Descripción: Burger con carne, lechuga y tomate
- Rendimiento: 1 porción
- Precio venta: $8.50

Agregar ingredientes:
1. Carne molida: 0.15 kg (150g)
   → Costo: 0.15 × $12 = $1.80
   
2. Pan brioche: 1 unidad
   → Costo: 1 × $0.80 = $0.80
   
3. Lechuga: 0.05 kg
   → Costo: 0.05 × $3.50 = $0.175
   
4. Tomate: 0.05 kg
   → Costo: 0.05 × $4.00 = $0.20
   
5. Mayonesa: 0.03 kg (3 cucharadas)
   → Costo: 0.03 × $8 = $0.24

Sistema calcula automáticamente:
- Costo Total: $1.80 + $0.80 + $0.175 + $0.20 + $0.24 = $3.435
- Costo por Porción: $3.435 / 1 = $3.435
- Margen: ((8.50 - 3.435) / 3.435) × 100 = 147.4%
- Utilidad: (8.50 - 3.435) × 1 = $5.065

Guardar → Receta persistida en BD
```

#### 4. Crear Segunda Receta: "Burger Cheddar"
```
+ Nueva Receta

Datos:
- Nombre: Burger Cheddar
- Precio venta: $9.50

Ingredientes:
1. Carne molida: 0.15 kg → $1.80
2. Pan brioche: 1 unidad → $0.80
3. Queso cheddar: 0.05 kg → $0.75
4. Bacon: 0.05 kg → $1.00
5. Mayonesa: 0.03 kg → $0.24

Cálculos:
- Costo Total: $4.59
- Margen: 107.0%
- Utilidad: $4.91

→ "Burger Cheddar" es más rentable que la Clásica (107% vs 147%)
  pero genera menos margen absoluto ($4.91 vs $5.07)
```

#### 5. Crear Tercera Receta: "Burger Doble"
```
+ Nueva Receta

Datos:
- Nombre: Burger Doble
- Rendimiento: 1 porción
- Precio venta: $12.00

Ingredientes:
1. Carne molida: 0.30 kg → $3.60
2. Pan brioche: 1 unidad → $0.80
3. Queso cheddar: 0.1 kg → $1.50
4. Mayonesa: 0.04 kg → $0.32

Cálculos:
- Costo Total: $6.22
- Margen: 92.9%
- Utilidad: $5.78

→ Burger Doble tiene mayor utilidad absoluta ($5.78) pero menor margen (92.9%)
```

---

## Caso 2: Proveedor Aumenta Precio

### Escenario
El proveedor de carne anuncia que subirá el precio a $15/kg (aumentó 25%). María quiere ver el impacto.

### Pasos

#### 1. Actualizar Costo de Ingrediente
```
Dashboard → Ingredientes

Buscar: "Carne molida"
Editar → Costo unitario: $15 (era $12)

Backend automáticamente:
1. Registra en HistorialCostoIngrediente:
   {ingrediente_id: 1, costo_anterior: 12, costo_nuevo: 15}
   
2. Actualiza Ingrediente:
   {id: 1, costo_unitario: 15, costo_anterior: 12}
   
3. Ejecuta: _recalcular_recetas_con_ingrediente(1)
   
4. Recalcula TODAS las recetas con carne:
   - Burger Clásica
   - Burger Cheddar
   - Burger Doble
```

#### 2. Ver Impacto en Recetas

**Burger Clásica:**
```
Antes:
- Costo Total: $3.435
- Costo por Porción: $3.435
- Margen: 147.4%
- Utilidad: $5.065

Después (automático):
- Carne: 0.15 × $15 = $2.25 (era $1.80)
- Costo Total: $3.985 (aumentó $0.55)
- Costo por Porción: $3.985
- Margen: 113.6% (bajó 33.8 puntos)
- Utilidad: $4.515 (bajó $0.55)
```

**Burger Doble:**
```
Antes:
- Costo Total: $6.22
- Margen: 92.9%
- Utilidad: $5.78

Después:
- Carne: 0.30 × $15 = $4.50 (era $3.60)
- Costo Total: $7.12 (aumentó $0.90)
- Margen: 68.7% (bajó 24.2 puntos)
- Utilidad: $4.88 (bajó $0.90)

→ Burger Doble ahora NO es tan rentable
```

#### 3. Analizar Opciones

María ve 3 opciones:

**Opción A: Aumentar Precio de Venta**
```
Burger Clásica: $8.50 → $9.05 (mantener margen 147%)
Burger Doble: $12.00 → $13.62 (mantener margen 92.9%)

Cliente: ¿Aumentaré precios o absorbo el costo?
```

**Opción B: Reducir Tamaño**
```
Burger Doble: Reducir carne a 0.25 kg (en lugar de 0.30)
- Nueva carne: 0.25 × $15 = $3.75
- Nuevo costo total: $6.27
- Nuevo margen: 91.2%

Cliente: Cambio casi imperceptible pero baja costos
```

**Opción C: Cambiar Proveedor**
```
Dashboard → Ingredientes → Historial de Carne
- Ve que pasó de $12 a $15
- Busca alternativa a $13/kg
- Vuelve a editar: $13/kg
- Recalcula automáticamente
```

---

## Caso 3: Reportes y Análisis

### Escenario
Es fin de mes. María quiere ver cómo está la rentabilidad de sus recetas.

### Pasos

#### 1. Acceder a Reportes
```
Dashboard → Reportes
```

#### 2. Ver Resumen de Recetas
```
API: GET /reportes/resumen

Respuesta:
{
  "total_recetas": 3,
  "costo_total_promedio": 5.78,
  "margen_promedio": 104.5,
  "utilidad_total": 14.87,
  "recetas": [
    {
      "nombre": "Burger Clásica",
      "costo_total": 3.985,
      "costo_por_porcion": 3.985,
      "precio_venta": 8.50,
      "margen_porcentaje": 113.6,
      "utilidad_total": 4.515
    },
    ...
  ]
}
```

#### 3. Ver Rentabilidad por Margen
```
API: GET /reportes/rentabilidad

Respuesta:
{
  "bajo": {
    "cantidad": 1,
    "utilidad_total": 4.88,
    "margen_promedio": 68.7,
    "recetas": ["Burger Doble"]
  },
  "medio": {
    "cantidad": 1,
    "utilidad_total": 4.515,
    "margen_promedio": 113.6,
    "recetas": ["Burger Clásica"]
  },
  "alto": {
    "cantidad": 1,
    "utilidad_total": 4.91,
    "margen_promedio": 120.5,
    "recetas": ["Burger Cheddar"]
  },
  "muy_alto": {}
}

Insights:
→ Burger Doble tiene margen BAJO (68.7%) pero genera utilidad
→ Burger Clásica es más rentable que Doble
→ Todas están en rango aceptable (>60%)
```

#### 4. Ver Historial de Ingredientes
```
Dashboard → Ingredientes → Carne Molida → Historial

Resultado:
{
  "ingrediente_nombre": "Carne molida",
  "historial": [
    {
      "fecha_cambio": "2026-01-15 10:30",
      "costo_anterior": 12.00,
      "costo_nuevo": 15.00
    }
  ]
}

→ Trazabilidad completa de cambios
```

---

## Caso 4: Nuevo Empleado (No Admin)

### Escenario
Tomás es empleado de María (rol: user). Solo puede ver recetas, no crear ingredientes.

### Pasos

#### 1. Login como Tomás
```
Email: tomas@burgers-barrio.com
Contraseña: Tomas123!
Rol: user (asignado por María/admin)
```

#### 2. Ver Dashboard
```
✅ Puede: Ver todas las recetas y sus costos/márgenes
✅ Puede: Ver reportes generales
✅ Puede: Buscar ingredientes

❌ No puede:
   - Crear/editar/eliminar ingredientes
   - Cambiar precios de ingredientes
   - Crear/editar recetas
   - Ver datos de otros usuarios
```

#### 3. Control de Acceso
```
Intenta: POST /ingredientes {nombre, costo}
Respuesta: 403 Forbidden
{
  "error": "Se requiere rol admin. Tu rol es user"
}
```

---

## Caso 5: Integración con PDV

### Escenario
María quiere integrar recetas con su sistema de punto de venta para:
- Cuando vende una Burger Clásica por $8.50
- El PDV sabe que le ganó $5.065

### Pasos

#### 1. PDV Consulta Receta
```
PDV hace: GET /api/recetas/1
Con token de usuario María

Recibe:
{
  "receta": {
    "nombre": "Burger Clásica",
    "precio_venta": 8.50,
    "costo_por_porcion": 3.985,
    "margen_porcentaje": 113.6,
    "utilidad_total": 4.515
  }
}
```

#### 2. PDV Registra Venta
```
Se vende 1 Burger Clásica:
- Ingresos: +$8.50
- Costo: -$3.985
- Ganancia: +$4.515
```

#### 3. Dashboard Financiero (Extensión Futura)
```
VENTAS DEL DÍA:
- 10 Burger Clásica: $85.00 ingresos, $39.85 costos, $45.15 ganancia
- 8 Burger Doble: $96.00 ingresos, $56.96 costos, $39.04 ganancia
- 6 Burger Cheddar: $57.00 ingresos, $27.54 costos, $29.46 ganancia
─────────────────────────────────────────────────────────────────
TOTAL: $238.00 ingresos, $124.35 costos, $113.65 ganancia
MARGEN DIARIO: 47.7%
```

---

## Caso 6: Troubleshooting - Errores Comunes

### Error 1: "Costo unitario negativo"
```
Problema: Usuario intenta guardar ingrediente con costo -$5
Validación backend: 
  if costo_unitario < 0: return error "El costo debe ser positivo"
Solución: Usuario corrige valor
```

### Error 2: "Token expirado"
```
Problema: Usuario lleva 24+ horas sin usar la app
Respuesta: 401 Unauthorized
Frontend: Redirige a /login
Solución: Usuario se autentica nuevamente
```

### Error 3: "No tienes permiso"
```
Problema: Usuario no admin intenta editar ingrediente
Respuesta: 403 Forbidden
"Se requiere rol admin. Tu rol es user"
Solución: Admin debe hacer el cambio
```

### Error 4: "Base de datos corrupta"
```
Problema: BD se corrompe (raro en SQLite)
Solución:
  1. Backup de datos (exportar JSON)
  2. Borrar carbo_cheddar.db
  3. Reiniciar servidor (recrea BD vacía)
  4. Re-crear ingredientes y recetas
```

---

## 🎯 Conclusión

Carbon & Cheddar permite a pequeños negocios gastronómicos:
- ✅ Controlar costos precisamente
- ✅ Tomar decisiones basadas en datos
- ✅ Responder rápidamente a cambios de mercado
- ✅ Maximizar rentabilidad
- ✅ Escalar sin perder control financiero

El sistema es **escalable** para:
- Múltiples usuarios/locales
- Integración con PDV/inventario
- Reportes avanzados
- Análisis predictivos
