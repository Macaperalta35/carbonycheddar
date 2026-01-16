# Carbon & Cheddar - Sistema de Gestión de Recetas y Costeo Gastronómico

## 📋 Descripción

Sistema web completo para gestionar recetas gastronómicas con cálculo automático de costos, márgenes y utilidades. Permite a cocineros y empresarios gastronómicos:

- ✅ CRUD completo de recetas
- ✅ Gestión de ingredientes con costos actualizables
- ✅ Cálculo automático de costos totales, márgenes y utilidades
- ✅ Recalculo automático cuando cambian costos de ingredientes
- ✅ Reportes detallados de rentabilidad
- ✅ Sistema de autenticación seguro con JWT
- ✅ Control de roles (admin, manager, user)

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────┐
│         Frontend (React + Vite)             │
│  - Login/Registro                           │
│  - Dashboard                                │
│  - Gestión Recetas                          │
│  - Gestión Ingredientes                     │
│  - Reportes                                 │
└──────────────┬──────────────────────────────┘
               │ HTTP/REST
               ↓
┌─────────────────────────────────────────────┐
│      Backend (Flask API REST)               │
│  - Autenticación JWT                        │
│  - CRUD Recetas                             │
│  - CRUD Ingredientes                        │
│  - Cálculos Costeo                          │
│  - Reportes                                 │
└──────────────┬──────────────────────────────┘
               │ SQL
               ↓
┌─────────────────────────────────────────────┐
│   Base de Datos (SQLite)                    │
│  - Usuarios                                 │
│  - Recetas                                  │
│  - Ingredientes                             │
│  - Historial de Costos                      │
└─────────────────────────────────────────────┘
```

## 🗄️ Modelo de Datos

### Entidades Principales

#### Usuario
```sql
- id (PK)
- nombre
- email (UNIQUE)
- password_hash
- rol (admin|manager|user)
- activo
- created_at
```

#### Ingrediente
```sql
- id (PK)
- nombre (UNIQUE)
- descripcion
- unidad_medida (kg|l|g|unidad|etc)
- costo_unitario (CURRENT)
- costo_anterior (for history)
- created_at, updated_at
```

#### Receta
```sql
- id (PK)
- usuario_id (FK)
- nombre
- descripcion
- rendimiento_porciones (cuántas porciones produce)
- costo_total (auto-calculated)
- costo_por_porcion (auto-calculated)
- precio_venta (set by user)
- margen_porcentaje (auto-calculated)
- utilidad_total (auto-calculated)
- created_at, updated_at
```

#### RecetaIngrediente
```sql
- id (PK)
- receta_id (FK)
- ingrediente_id (FK)
- cantidad (used in this recipe)
- costo_calculado (auto-calculated)
- created_at
```

#### HistorialCostoIngrediente
```sql
- id (PK)
- ingrediente_id (FK)
- costo_anterior
- costo_nuevo
- fecha_cambio
```

## 🧮 Fórmulas de Cálculo

### 1. Costo Total de Receta
```
Costo Total = Σ (Cantidad Ingrediente × Costo Unitario Ingrediente)
```

### 2. Costo por Porción
```
Costo por Porción = Costo Total / Rendimiento en Porciones
```

### 3. Margen de Ganancia (%)
```
Margen % = ((Precio Venta - Costo por Porción) / Costo por Porción) × 100
```

### 4. Utilidad Total
```
Utilidad Total = (Precio Venta - Costo por Porción) × Rendimiento en Porciones
```

### 5. Precio Sugerido (basado en margen deseado)
```
Precio = Costo / (1 - Margen Deseado/100)
Ejemplo: Costo $10, margen deseado 40%
Precio = 10 / (1 - 0.40) = $16.67
```

## 📦 Instalación y Configuración

### Backend (Flask)

#### 1. Requisitos previos
- Python 3.8+
- pip

#### 2. Instalación
```bash
cd backend

# Crear entorno virtual (opcional pero recomendado)
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt
```

#### 3. Ejecutar servidor
```bash
python app.py
```

El servidor estará disponible en `http://localhost:5000`

### Frontend (React + Vite)

#### 1. Requisitos previos
- Node.js 16+ y npm

#### 2. Instalación
```bash
cd frontend

# Instalar dependencias
npm install
```

#### 3. Crear archivo .env
```bash
# frontend/.env
VITE_API_URL=http://localhost:5000/api
```

#### 4. Ejecutar en desarrollo
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 🔐 Autenticación

### Usuarios de Demostración

Al iniciar el servidor, se crean automáticamente:

```
Email: demo@example.com
Contraseña: demo123
Rol: admin
```

### Flujo de Autenticación

1. Usuario ingresa email y contraseña en Login
2. Backend valida credenciales y devuelve JWT
3. Frontend almacena JWT en localStorage
4. Cada solicitud incluye JWT en header `Authorization: Bearer <token>`
5. Backend valida JWT en cada solicitud
6. Si token expira, frontend redirige a login

### Estructura JWT
```json
{
  "usuario_id": 1,
  "email": "user@example.com",
  "rol": "admin",
  "iat": 1234567890,
  "exp": 1234567890
}
```

## 📡 API REST Endpoints

### Autenticación

```
POST   /api/auth/registro          - Registrar usuario
POST   /api/auth/login              - Iniciar sesión
GET    /api/auth/perfil            - Obtener perfil (protegido)
PUT    /api/auth/cambiar-password  - Cambiar contraseña (protegido)
POST   /api/auth/validar-token     - Validar token
```

### Recetas

```
GET    /api/recetas                                    - Listar recetas
POST   /api/recetas                                    - Crear receta
GET    /api/recetas/<id>                              - Obtener receta
PUT    /api/recetas/<id>                              - Actualizar receta
DELETE /api/recetas/<id>                              - Eliminar receta

POST   /api/recetas/<id>/ingredientes                 - Agregar ingrediente
PUT    /api/recetas/<id>/ingredientes/<ing_id>       - Actualizar cantidad
DELETE /api/recetas/<id>/ingredientes/<ing_id>       - Eliminar ingrediente
```

### Ingredientes

```
GET    /api/ingredientes                     - Listar ingredientes
POST   /api/ingredientes                     - Crear ingrediente (admin)
GET    /api/ingredientes/<id>                - Obtener ingrediente
PUT    /api/ingredientes/<id>                - Actualizar ingrediente (admin)
DELETE /api/ingredientes/<id>                - Eliminar ingrediente (admin)
GET    /api/ingredientes/<id>/historial     - Historial de costos
```

### Reportes

```
GET    /api/reportes/resumen                 - Resumen de recetas
GET    /api/reportes/rentabilidad            - Análisis por margen
GET    /api/reportes/ingredientes            - Reporte de ingredientes
```

## 💻 Ejemplo de Uso

### 1. Crear Receta "Burger Clásica"

```bash
# Primero, login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"demo123"}'

# Respuesta incluye token JWT

# Crear receta
curl -X POST http://localhost:5000/api/recetas \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Burger Clásica",
    "descripcion": "Burger con carne, lechuga y tomate",
    "rendimiento_porciones": 1,
    "precio_venta": 8.50
  }'

# Respuesta: Receta creada con costo_total = 0 (sin ingredientes aún)
```

### 2. Agregar Ingredientes

```bash
# Agregar 150g de carne molida (costo: $12/kg = $1.80)
curl -X POST http://localhost:5000/api/recetas/1/ingredientes \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "ingrediente_id": 1,
    "cantidad": 0.15
  }'

# Respuesta: Receta actualizada
# costo_total: $1.80
# costo_por_porcion: $1.80
# margen: ((8.50 - 1.80) / 1.80) × 100 = 372%
# utilidad_total: $6.70
```

### 3. Actualizar Costo de Ingrediente

```bash
# El admin actualiza precio de carne a $15/kg
curl -X PUT http://localhost:5000/api/ingredientes/1 \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "costo_unitario": 15
  }'

# Backend automáticamente:
# 1. Registra cambio en HistorialCostoIngrediente
# 2. Recalcula TODAS las recetas que usan carne molida
# 3. Usuario ve actualización en tiempo real
```

## 🎨 Componentes Frontend

### Páginas

1. **LoginPage** - Autenticación y registro
   - Formulario login
   - Formulario registro
   - Validación de credenciales

2. **Dashboard** - Panel principal
   - Listado de recetas con métricas
   - Resumen de costos y márgenes
   - Acceso a reportes
   - Navegación principal

3. **RecetaForm** - Crear/editar recetas
   - Formulario básico de receta
   - Tabla de ingredientes
   - Agregar/eliminar ingredientes
   - Cálculos automáticos en tiempo real

4. **IngredientesPage** - Gestión de ingredientes
   - Listar ingredientes
   - Crear/editar ingredientes
   - Buscar ingredientes
   - Historial de cambios de costos

### Servicios

**apiService.js**
```javascript
// Encapsula todas las llamadas HTTP
export const recetasService = { ... }
export const ingredientesService = { ... }
export const reportesService = { ... }
export const authService = { ... }
```

## 🔄 Flujos Principales

### Flujo: Crear Receta

```
Usuario abre /receta/nueva
    ↓
Carga ingredientes disponibles
    ↓
Usuario ingresa datos básicos
    ↓
Usuario agrega ingredientes (cantidad)
    ↓
Sistema calcula automáticamente:
  - Costo total
  - Costo por porción
  - Margen %
  - Utilidad total
    ↓
Usuario establece precio venta
    ↓
Usuario guarda receta
    ↓
Backend valida y persiste en BD
```

### Flujo: Actualizar Costo Ingrediente

```
Admin actualiza costo ingrediente
    ↓
Backend registra cambio en historial
    ↓
Backend identifica recetas afectadas
    ↓
Backend recalcula cada receta:
  - Costo total (nuevo)
  - Margen % (nuevo)
  - Utilidad (nuevo)
    ↓
Frontend notificado (WebSocket o poll)
    ↓
Usuario ve cambios en tiempo real
```

## 📊 Reportes Disponibles

### 1. Resumen de Recetas
```json
{
  "total_recetas": 15,
  "costo_total_promedio": 3.50,
  "margen_promedio": 45.2,
  "utilidad_total": 125.50,
  "recetas": [...]
}
```

### 2. Análisis de Rentabilidad
```json
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
```

### 3. Reporte de Ingredientes
```json
{
  "total_ingredientes": 25,
  "costo_promedio": 8.50,
  "ingredientes": [
    {
      "nombre": "Carne molida",
      "costo_unitario": 15.00,
      "costo_anterior": 12.00,
      "cambio_porcentaje": 25.0
    }
  ]
}
```

## 🛡️ Seguridad

### Medidas Implementadas

1. **Contraseñas**: Hash con werkzeug.security.generate_password_hash
2. **JWT**: Tokens con expiración en 24 horas
3. **CORS**: Configurado para aceptar frontend en localhost
4. **Roles**: Admin, Manager, User con permisos diferenciados
5. **Validación**: Todos los inputs validados en backend
6. **Autenticación**: Requerida en todos los endpoints (excepto auth y validación)

### Variables de Entorno

```bash
# backend/.env
SECRET_KEY=tu-clave-super-secreta-aqui
FLASK_ENV=production
DATABASE_URL=sqlite:///carbo_cheddar.db

# frontend/.env
VITE_API_URL=http://localhost:5000/api
```

## 🐛 Troubleshooting

### Backend no conecta
```bash
# Verificar que el servidor está corriendo
curl http://localhost:5000/

# Si no, reiniciar:
python app.py
```

### Frontend no conecta al backend
```
Verificar VITE_API_URL en .env
Verificar CORS en backend (app.py)
Verificar que backend está en http://localhost:5000
```

### Errores de base de datos
```bash
# Resetear BD
rm backend/instance/carbo_cheddar.db

# Reiniciar server (crea nuevamente)
python app.py
```

## 📚 Extensiones Futuras

- [ ] Exportar reportes a PDF
- [ ] Integración con punto de venta
- [ ] Cálculo de recetas escalables
- [ ] Análisis de proveedores
- [ ] Dashboard de proyecciones
- [ ] API de terceros (contabilidad, inventario)
- [ ] Aplicación móvil (React Native)
- [ ] Sistema de notificaciones
- [ ] Multitenancy (múltiples negocios)

## 📄 Licencia

MIT

## 👨‍💻 Autor

Desarrollado como sistema integral de gestión de recetas.

---

**¡Listo para empezar! 🚀**

Para preguntas o problemas, verifica la documentación de los endpoints en el código backend.
