# 📋 SUMARIO TÉCNICO ARQUITECTONICO

**Proyecto:** Carbon & Cheddar - Sistema de Gestión de Recetas y Costeo Gastronómico  
**Fecha:** Enero 2026  
**Rol:** Arquitecto de Software Senior

---

## 1️⃣ MODELO DE DATOS

### Relaciones Principales

```
┌──────────────┐
│   Usuario    │ (1)
└──────┬───────┘
       │
       │ (1:N)
       │
┌──────▼────────────┐
│     Receta        │
└──────┬────────────┘
       │
       │ (1:N)
       │
┌──────▼─────────────────────┐
│  RecetaIngrediente          │
│  (Tabla de Asociación)      │
└──────┬─────────────────────┘
       │
       │ (N:1)
       │
┌──────▼────────────────┐
│   Ingrediente         │
└──────┬────────────────┘
       │
       │ (1:N)
       │
┌──────▼──────────────────────────┐
│ HistorialCostoIngrediente        │
└─────────────────────────────────┘
```

### Entidades

#### 1. Usuario
```python
class Usuario(db.Model):
    id: Integer (PK)
    nombre: String(100)
    email: String(120) - UNIQUE
    password_hash: String(255) - bcrypt hash
    rol: String(20) - admin|manager|user
    activo: Boolean
    created_at: DateTime
    
    Relationships:
    - recetas: Receta[] (1:N)
```

#### 2. Ingrediente
```python
class Ingrediente(db.Model):
    id: Integer (PK)
    nombre: String(100) - UNIQUE
    descripcion: String(255)
    unidad_medida: String(50) - kg|l|g|unidad
    costo_unitario: Float - Current cost
    costo_anterior: Float - Previous cost for history
    created_at: DateTime
    updated_at: DateTime
    
    Relationships:
    - receta_ingredientes: RecetaIngrediente[] (1:N)
    - historial_costos: HistorialCostoIngrediente[] (1:N)
```

#### 3. Receta
```python
class Receta(db.Model):
    id: Integer (PK)
    usuario_id: Integer (FK) → Usuario
    nombre: String(100)
    descripcion: String(255)
    rendimiento_porciones: Integer - ¿Cuántas porciones produce?
    
    # Calculated fields
    costo_total: Float - Σ(ingrediente.cantidad * ingrediente.costo)
    costo_por_porcion: Float - costo_total / rendimiento_porciones
    precio_venta: Float - Set by user
    margen_porcentaje: Float - ((precio_venta - costo_por_porcion) / costo_por_porcion) * 100
    utilidad_total: Float - (precio_venta - costo_por_porcion) * rendimiento_porciones
    
    created_at: DateTime
    updated_at: DateTime
    
    Relationships:
    - usuario: Usuario (N:1)
    - ingredientes: RecetaIngrediente[] (1:N) cascade
```

#### 4. RecetaIngrediente (Tabla de Asociación)
```python
class RecetaIngrediente(db.Model):
    id: Integer (PK)
    receta_id: Integer (FK) → Receta
    ingrediente_id: Integer (FK) → Ingrediente
    cantidad: Float - Cantidad utilizada en esta receta
    costo_calculado: Float - cantidad * ingrediente.costo_unitario
    created_at: DateTime
    
    Relationships:
    - receta: Receta (N:1)
    - ingrediente: Ingrediente (N:1)
```

#### 5. HistorialCostoIngrediente (Auditoría)
```python
class HistorialCostoIngrediente(db.Model):
    id: Integer (PK)
    ingrediente_id: Integer (FK) → Ingrediente
    costo_anterior: Float
    costo_nuevo: Float
    fecha_cambio: DateTime
    
    Relationships:
    - ingrediente: Ingrediente (N:1)
```

---

## 2️⃣ LÓGICA DE NEGOCIO (Servicios Backend)

### Clase: CalculoCostos

**Responsabilidad:** Encapsular toda la lógica de cálculos de costos y márgenes

#### Métodos Principales

```python
CalculoCostos:
    ├── calcular_costo_receta(ingredientes) → Float
    │   └─ Suma: Σ(cantidad × costo_unitario)
    │
    ├── calcular_costo_por_porcion(costo_total, porciones) → Float
    │   └─ costo_total / porciones
    │
    ├── calcular_margen_porcentaje(precio, costo) → Float
    │   └─ ((precio - costo) / costo) × 100
    │
    ├── calcular_utilidad_total(precio, costo, porciones) → Float
    │   └─ (precio - costo) × porciones
    │
    ├── actualizar_calculos_receta(receta) → Dict
    │   └─ Actualiza TODOS los campos calculados de la receta
    │
    ├── sugerir_precio_venta(costo, margen_deseado) → Float
    │   └─ costo / (1 - margen%)
    │
    └── recalcular_todas_recetas(usuario_id, recetas) → List
        └─ IMPORTANTE: Se ejecuta cuando cambia un ingrediente
```

### Clase: GeneradorReportes

**Responsabilidad:** Agregar y formatear datos para reportes

#### Métodos Principales

```python
GeneradorReportes:
    ├── reporte_resumen_recetas(recetas) → Dict
    │   └─ {total, promedio_costo, margen_promedio, utilidad_total}
    │
    ├── reporte_ingredientes_costos(ingredientes) → Dict
    │   └─ {ingredientes[], cambios_porcentaje}
    │
    └── reporte_rentabilidad_por_margen(recetas) → Dict
        └─ {bajo: {...}, medio: {...}, alto: {...}, muy_alto: {...}}
```

---

## 3️⃣ SERVICIOS (Services Layer)

### RecetaService

```python
RecetaService:
    ├── crear_receta(usuario_id, datos) → (Receta, error)
    ├── obtener_receta(receta_id, usuario_id) → Receta
    ├── actualizar_receta(receta_id, usuario_id, datos) → (Receta, error)
    ├── eliminar_receta(receta_id, usuario_id) → (Bool, error)
    ├── listar_recetas_usuario(usuario_id, pagina, por_pagina) → {total, recetas[]}
    ├── agregar_ingrediente(receta_id, usuario_id, ing_id, cantidad) → (RecetaIngrediente, error)
    ├── eliminar_ingrediente(receta_id, usuario_id, ri_id) → (Bool, error)
    └── actualizar_cantidad_ingrediente(receta_id, usuario_id, ri_id, cantidad) → (RecetaIngrediente, error)
```

### IngredienteService

```python
IngredienteService:
    ├── crear_ingrediente(datos) → (Ingrediente, error)
    ├── obtener_ingrediente(ing_id) → Ingrediente
    ├── actualizar_ingrediente(ing_id, datos) → (Ingrediente, error)
    │   └─ ⚠️ AUTOMÁTICAMENTE recalcula todas las recetas afectadas
    ├── eliminar_ingrediente(ing_id) → (Bool, error)
    ├── listar_ingredientes(pagina, por_pagina) → {total, ingredientes[]}
    ├── obtener_historial_costos(ing_id, limite) → HistorialCostoIngrediente[]
    ├── buscar_ingredientes(termino) → Ingrediente[]
    └── _recalcular_recetas_con_ingrediente(ing_id) → PRIVATE
        └─ Se llama automáticamente en actualizar_ingrediente
```

### AuthService

```python
AuthService:
    ├── generar_token(usuario) → JWT_TOKEN
    ├── verificar_token(token) → {usuario_id, email, rol, exp}
    ├── obtener_token_de_header() → token_string
    ├── requerir_autenticacion → Decorator
    └── requerir_rol(rol_requerido) → Decorator
```

---

## 4️⃣ API REST ENDPOINTS

### Estructura General

```
BASE_URL: http://localhost:5000/api
HEADERS: {
  "Authorization": "Bearer <JWT_TOKEN>",
  "Content-Type": "application/json"
}
```

### Endpoints de Autenticación

| Método | Endpoint | Privado | Descripción |
|--------|----------|---------|-------------|
| POST | `/auth/registro` | ❌ | Registrar nuevo usuario |
| POST | `/auth/login` | ❌ | Iniciar sesión |
| GET | `/auth/perfil` | ✅ | Obtener perfil autenticado |
| PUT | `/auth/cambiar-password` | ✅ | Cambiar contraseña |
| POST | `/auth/validar-token` | ❌ | Validar JWT |

### Endpoints de Recetas

| Método | Endpoint | Privado | Descripción |
|--------|----------|---------|-------------|
| GET | `/recetas` | ✅ | Listar recetas del usuario |
| POST | `/recetas` | ✅ | Crear receta |
| GET | `/recetas/<id>` | ✅ | Obtener receta específica |
| PUT | `/recetas/<id>` | ✅ | Actualizar receta |
| DELETE | `/recetas/<id>` | ✅ | Eliminar receta |
| POST | `/recetas/<id>/ingredientes` | ✅ | Agregar ingrediente a receta |
| PUT | `/recetas/<id>/ingredientes/<ing_id>` | ✅ | Actualizar cantidad de ingrediente |
| DELETE | `/recetas/<id>/ingredientes/<ing_id>` | ✅ | Eliminar ingrediente de receta |

### Endpoints de Ingredientes

| Método | Endpoint | Privado | Rol | Descripción |
|--------|----------|---------|-----|-------------|
| GET | `/ingredientes` | ✅ | Any | Listar ingredientes |
| POST | `/ingredientes` | ✅ | Admin | Crear ingrediente |
| GET | `/ingredientes/<id>` | ✅ | Any | Obtener ingrediente |
| PUT | `/ingredientes/<id>` | ✅ | Admin | Actualizar ingrediente |
| DELETE | `/ingredientes/<id>` | ✅ | Admin | Eliminar ingrediente |
| GET | `/ingredientes/<id>/historial` | ✅ | Any | Obtener historial de costos |

### Endpoints de Reportes

| Método | Endpoint | Privado | Descripción |
|--------|----------|---------|-------------|
| GET | `/reportes/resumen` | ✅ | Resumen de todas las recetas del usuario |
| GET | `/reportes/rentabilidad` | ✅ | Análisis por rango de margen |
| GET | `/reportes/ingredientes` | ✅ | Reporte de todos los ingredientes |

---

## 5️⃣ FLUJOS DE NEGOCIO CRÍTICOS

### Flujo 1: Crear Receta (Happy Path)

```
1. Usuario accede a /receta/nueva
   └─> Frontend: GET /ingredientes (carga lista)
   
2. Usuario ingresa:
   - Nombre: "Burger Clásica"
   - Descripción: "..."
   - Rendimiento: 1 porción
   - Precio venta: $8.50
   
3. Usuario agrega ingredientes:
   - 150g Carne molida ($12/kg) = $1.80
   - 1 Pan brioche ($0.80) = $0.80
   - Lechuga: 0.05 kg ($3.50/kg) = $0.175
   └─> Frontend calcula: Costo Total = $2.855
   
4. Backend calcula automáticamente:
   - costo_total: 2.855
   - costo_por_porcion: 2.855 / 1 = 2.855
   - margen: ((8.50 - 2.855) / 2.855) × 100 = 197.8%
   - utilidad_total: (8.50 - 2.855) × 1 = 5.645
   
5. Usuario guarda receta
   └─> POST /recetas {nombre, descripcion, rendimiento, precio_venta}
   └─> Backend persiste y devuelve receta con cálculos
   
6. Usuario redirigido a dashboard
   └─> Dashboard muestra receta con métricas
```

### Flujo 2: Actualizar Costo de Ingrediente (CRÍTICO)

```
1. Admin actualiza ingrediente:
   - Ingrediente: "Carne molida"
   - Costo anterior: $12/kg
   - Costo nuevo: $15/kg
   └─> PUT /ingredientes/1 {costo_unitario: 15}

2. Backend (IngredienteService.actualizar):
   a) Registra en HistorialCostoIngrediente:
      {ingrediente_id: 1, costo_anterior: 12, costo_nuevo: 15}
   
   b) Actualiza Ingrediente:
      {costo_unitario: 15, costo_anterior: 12}
   
   c) AUTOMÁTICAMENTE llama:
      _recalcular_recetas_con_ingrediente(1)
      
   d) Esta función:
      - Encuentra TODAS las recetas con carne molida
      - Para CADA receta:
        * Recalcula costo_total
        * Recalcula costo_por_porcion
        * Recalcula margen_porcentaje
        * Recalcula utilidad_total
      - Persiste todos los cambios
      
3. Ejemplo - Receta "Burger Clásica":
   Antes:
   - 150g Carne × $12 = $1.80
   - Total: $2.855
   - Margen: 197.8%
   
   Después (automático):
   - 150g Carne × $15 = $2.25
   - Total: $3.405 (aumentó $0.55)
   - Margen: 149.6% (bajó, ahora menos rentable)
   
4. Frontend notificado (próxima carga):
   - Precio venta: $8.50 (sin cambios)
   - Pero margen y utilidad bajaron automáticamente
```

### Flujo 3: Generar Reporte de Rentabilidad

```
1. Usuario solicita reporte:
   └─> GET /reportes/rentabilidad

2. Backend (GeneradorReportes.reporte_rentabilidad_por_margen):
   a) Obtiene TODAS las recetas del usuario
   
   b) Agrupa por rango de margen:
      - Bajo: 0-20%
      - Medio: 20-40%
      - Alto: 40-100%
      - Muy Alto: >100%
   
   c) Para cada grupo calcula:
      - Cantidad de recetas
      - Utilidad total del grupo
      - Margen promedio del grupo
      
   d) Responde:
      {
        "bajo": {
          "cantidad": 2,
          "utilidad_total": 5.00,
          "margen_promedio": 15.0,
          "recetas": ["Agua", "Té"]
        },
        "medio": { ... },
        "alto": { ... },
        "muy_alto": { ... }
      }

3. Frontend visualiza:
   - Gráfico de distribución
   - Recetas por rentabilidad
   - Oportunidades de mejora
```

---

## 6️⃣ COMPONENTES FRONTEND

### Estructura de Carpetas

```
frontend/src/
├── pages/
│   ├── LoginPage.jsx         - Autenticación
│   ├── Dashboard.jsx         - Panel principal
│   ├── RecetaForm.jsx        - CRUD recetas
│   └── IngredientesPage.jsx  - Gestión ingredientes
│
├── services/
│   └── apiService.js         - Cliente HTTP + encapsulación API
│
├── App_nueva.jsx             - Routing principal
├── main.jsx                  - Entry point
└── App.css                   - Estilos globales
```

### Componentes Principales

#### 1. LoginPage
```javascript
Props: None
State: {email, password, error, cargando, mostrarRegistro}
Métodos: handleLogin, handleRegistro
Flujo: 
  - Permite login y registro
  - Valida credenciales con backend
  - Almacena token en localStorage
  - Redirige a /dashboard
```

#### 2. Dashboard
```javascript
Props: None
State: {usuario, recetas, reporte, cargando, tab}
Métodos: cargarDatos, handleLogout, irACrearReceta, irAEditar
Flujo:
  - Carga recetas del usuario
  - Carga resumen de reportes
  - Muestra grid de recetas con métricas
  - Permite crear/editar/eliminar recetas
  - Muestra reportes
```

#### 3. RecetaForm
```javascript
Props: None (usa URL params)
State: {receta, ingredientes, selectedIngrediente, cantidadIngrediente}
Métodos: cargarDatos, handleInputChange, agregarIngrediente, eliminarIngrediente, guardar
Flujo:
  - Si URL tiene /receta/:id → Modo EDICIÓN
  - Si URL es /receta/nueva → Modo CREACIÓN
  - Carga ingredientes disponibles
  - Permite agregar/eliminar ingredientes
  - Muestra cálculos automáticos
  - Guarda en backend
```

#### 4. IngredientesPage
```javascript
Props: None
State: {ingredientes, formularioVisible, editar, busqueda, formulario}
Métodos: cargarIngredientes, buscarIngredientes, abrirFormulario, guardarIngrediente, eliminarIngrediente
Flujo:
  - Lista ingredientes
  - Permite crear/editar/eliminar (solo admin)
  - Búsqueda en tiempo real
  - Modal para formulario
```

### Servicio API (apiService.js)

```javascript
// Organizado por dominio
export const authService = { ... }      // auth/*
export const recetasService = { ... }   // recetas/*
export const ingredientesService = { } // ingredientes/*
export const reportesService = { ... }  // reportes/*

// Características:
- Interceptores para agregar JWT
- Interceptores para manejo de errores 401
- Métodos para cada endpoint
- Manejo centralizado de localStorage
```

---

## 7️⃣ TECNOLOGÍAS UTILIZADAS

### Backend
```
Framework:     Flask 2.x
ORM:           SQLAlchemy 1.4+
Autenticación: JWT (PyJWT)
Seguridad:     bcrypt (werkzeug)
Base de Datos: SQLite3
API:           REST
```

### Frontend
```
Librería UI:   React 18.x
Router:        React Router 6.x
Build Tool:    Vite 4.x
HTTP Client:   Axios 1.x
Estilos:       CSS inline (escalable a CSS Modules o Styled Components)
```

### Base de Datos
```
Motor:         SQLite3
Tipo:          Relacional
Características:
  - Relaciones 1:N
  - Claves foráneas
  - Cascada de eliminación
  - Campos timestamp automáticos
  - Índices en campos únicos
```

---

## 8️⃣ CONSIDERACIONES DE ESCALABILIDAD

### Actuales
- ✅ Arquitectura modular y escalable
- ✅ Separación de capas (Models, Services, Routes)
- ✅ Reutilización de componentes
- ✅ API REST

### Para Producción
- [ ] PostgreSQL en lugar de SQLite
- [ ] Caché con Redis (reportes, ingredientes)
- [ ] WebSockets para notificaciones en tiempo real
- [ ] Paginación mejorada
- [ ] Full-text search para ingredientes
- [ ] Rate limiting en API
- [ ] Logging centralizado
- [ ] Monitoring y alertas
- [ ] CI/CD pipeline
- [ ] Containerización (Docker)
- [ ] Load balancing

---

## 9️⃣ DECISIONES ARQUITECTÓNICAS CLAVE

### 1. RecetaIngrediente como Tabla de Asociación
**Por qué:** Permite N:N relationship + almacenar metadatos (cantidad, costo calculado)

### 2. HistorialCostoIngrediente para Auditoría
**Por qué:** Trazabilidad completa de cambios de costos + análisis de tendencias

### 3. Campos Calculados en Receta
**Por qué:** 
- Normalización: evitar cálculos repetidos
- Performance: consultas más rápidas
- Consistencia: single source of truth

### 4. Recálculo automático en actualizar ingrediente
**Por qué:** Garantiza que todos los márgenes/utilidades siempre sean correctos

### 5. JWT para autenticación stateless
**Por qué:**
- Escalabilidad horizontal sin estado
- Compatible con SPA
- Seguro si se usa HTTPS

### 6. Componentes con inline styles (MVP)
**Por qué:** Rápido para prototipo, escalable a CSS Modules después

---

## 🔟 GUÍA DE DESPLIEGUE

### Desarrollo Local
```bash
# Terminal 1: Backend
cd backend
python app.py  # http://localhost:5000

# Terminal 2: Frontend
cd frontend
npm run dev    # http://localhost:5173
```

### Producción (AWS/Heroku/DigitalOcean)
```bash
# Backend
gunicorn -w 4 app:app
# Environment variables: SECRET_KEY, DATABASE_URL

# Frontend
npm run build
# Servir dist/ con nginx/apache

# Database
PostgreSQL recomendado
Migrations con Alembic
```

---

## CONCLUSIÓN

Sistema completo, escalable y bien estructurado para gestión de recetas con costeo automático. Listo para MVP y fácilmente extensible a características adicionales.

**Puntos Fuertes:**
✅ Arquitectura limpia y modular  
✅ Cálculos automáticos robustos  
✅ Seguridad con JWT  
✅ API REST bien diseñada  
✅ UX intuitiva  

**Próximos Pasos:**
→ Testing (unit + integration)  
→ Documentación API (OpenAPI/Swagger)  
→ Despliegue a servidor  
→ Feedback de usuarios  
