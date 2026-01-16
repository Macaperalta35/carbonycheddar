# 🚀 GUÍA DE PRÓXIMOS PASOS

## Fase 1: Verificación Local (HOY)

### ✅ Backend - Verificar que todo funciona

```bash
cd backend

# 1. Instalar dependencias
pip install -r requirements.txt

# 2. Ejecutar servidor
python app.py

# Esperado:
# * Running on http://0.0.0.0:5000
# ✓ Usuario de demostración creado
# ✓ Ingredientes de demostración creados
```

### ✅ Frontend - Verificar que todo funciona

```bash
cd frontend

# 1. Instalar dependencias
npm install

# 2. Ejecutar servidor
npm run dev

# Esperado:
# ➜  Local:   http://localhost:5173/
# ➜  Press q to quit
```

### ✅ Test Manual - Flujo Completo

```
1. Abrir http://localhost:5173 en navegador
2. Login:
   Email: demo@example.com
   Contraseña: demo123
3. Navegar a /dashboard
4. Ver las recetas creadas
5. Ir a /ingredientes
6. Ver ingredientes de demostración
7. Volver a /dashboard
8. Logout
9. Intentar acceder a /dashboard
   → Debe redirigir a /login (protección)
```

---

## Fase 2: Testing (ESTA SEMANA)

### Unit Tests - Backend

```bash
# Crear archivo: backend/tests/test_calculos.py

import unittest
from services.calculos_service import CalculoCostos

class TestCalculoCostos(unittest.TestCase):
    def test_calcular_costo_por_porcion(self):
        resultado = CalculoCostos.calcular_costo_por_porcion(10.0, 2)
        self.assertEqual(resultado, 5.0)
    
    def test_calcular_margen_porcentaje(self):
        resultado = CalculoCostos.calcular_margen_porcentaje(8.50, 2.85)
        self.assertAlmostEqual(resultado, 197.8, places=1)

# Ejecutar:
python -m unittest tests.test_calculos
```

### Integration Tests - API

```bash
# Crear archivo: backend/tests/test_api.py

import unittest
import json
from app import app

class TestAuthAPI(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
    
    def test_login_exitoso(self):
        response = self.client.post('/api/auth/login', 
            json={
                'email': 'demo@example.com',
                'password': 'demo123'
            })
        self.assertEqual(response.status_code, 200)
        self.assertIn('token', json.loads(response.data))

# Ejecutar:
python -m unittest tests.test_api
```

### E2E Tests - Frontend (Opcional)

```bash
# Instalar Playwright
npm install -D @playwright/test

# Crear archivo: frontend/tests/login.spec.js
import { test, expect } from '@playwright/test';

test('Login exitoso', async ({ page }) => {
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'demo@example.com');
  await page.fill('input[type="password"]', 'demo123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('**/dashboard');
});

# Ejecutar:
npx playwright test
```

---

## Fase 3: Documentación API (ESTA SEMANA)

### Generar Swagger/OpenAPI

```bash
cd backend

# Instalar herramienta
pip install flask-restx

# Configurar en app.py
from flask_restx import Api, Resource

api = Api(app, version='1.0', title='Carbon & Cheddar API',
    description='Sistema de Gestión de Recetas')

# Auto-genera: http://localhost:5000/swagger
```

O crea manualmente: `backend/API_DOCUMENTATION.md`

```markdown
# API Documentation

## Authentication

### POST /api/auth/login
```json
Request:
{
  "email": "user@example.com",
  "password": "password123"
}

Response (200):
{
  "token": "eyJhbGc...",
  "usuario": {
    "id": 1,
    "nombre": "User",
    "email": "user@example.com",
    "rol": "admin"
  }
}
```
```

---

## Fase 4: Optimizaciones (PRÓXIMA SEMANA)

### Backend

#### 1. Agregar Validaciones Más Robustas
```python
# backend/utils/validators.py
from marshmallow import Schema, fields, ValidationError

class RecetaSchema(Schema):
    nombre = fields.Str(required=True, validate=lambda x: len(x) >= 3)
    precio_venta = fields.Float(required=True, validate=lambda x: x > 0)
    rendimiento_porciones = fields.Int(validate=lambda x: x > 0)

# En routes:
schema = RecetaSchema()
try:
    datos = schema.load(request.get_json())
except ValidationError as err:
    return jsonify({'error': err.messages}), 400
```

#### 2. Agregar Paginación Mejorada
```python
# En RecetaService.listar_recetas_usuario
from flask_sqlalchemy import SQLAlchemy

query = Receta.query.filter_by(usuario_id=usuario_id)
paginated = query.paginate(
    page=pagina,
    per_page=por_pagina,
    error_out=False
)

return {
    'items': [r.to_dict() for r in paginated.items],
    'total': paginated.total,
    'pages': paginated.pages,
    'has_next': paginated.has_next,
    'has_prev': paginated.has_prev
}
```

#### 3. Agregar Logging
```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@auth_bp.route('/auth/login', methods=['POST'])
def login():
    email = request.json.get('email')
    logger.info(f'Intento de login: {email}')
    try:
        # ... código
        logger.info(f'Login exitoso: {email}')
    except Exception as e:
        logger.error(f'Error en login: {str(e)}')
```

#### 4. Agregar Rate Limiting
```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

@auth_bp.route('/auth/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    # ... código
```

### Frontend

#### 1. Agregar Validación de Formularios
```javascript
const [errores, setErrores] = useState({});

const validarFormulario = () => {
  const nuevosErrores = {};
  
  if (!formulario.nombre || formulario.nombre.length < 3) {
    nuevosErrores.nombre = 'Mínimo 3 caracteres';
  }
  
  if (formulario.precio_venta <= 0) {
    nuevosErrores.precio_venta = 'Debe ser mayor a 0';
  }
  
  setErrores(nuevosErrores);
  return Object.keys(nuevosErrores).length === 0;
};

const handleSubmit = (e) => {
  e.preventDefault();
  if (!validarFormulario()) return;
  // ... guardar
};
```

#### 2. Agregar Loading States
```javascript
const [cargando, setCargando] = useState(false);

const guardar = async () => {
  setCargando(true);
  try {
    await recetasService.crear(formulario);
  } catch (err) {
    // ...
  } finally {
    setCargando(false);
  }
};

// En botón:
<button disabled={cargando}>
  {cargando ? 'Guardando...' : 'Guardar'}
</button>
```

#### 3. Agregar Notificaciones Toast
```javascript
// Instalar: npm install react-hot-toast
import toast from 'react-hot-toast';

const guardar = async () => {
  try {
    await recetasService.crear(formulario);
    toast.success('Receta guardada exitosamente');
    navigate('/dashboard');
  } catch (err) {
    toast.error(err.response?.data?.error || 'Error al guardar');
  }
};
```

#### 4. Agregar Confirmación antes de Eliminar
```javascript
const eliminarReceta = (recetaId) => {
  if (window.confirm('¿Estás seguro de eliminar esta receta?')) {
    // ... proceder a eliminar
  }
};
```

---

## Fase 5: Despliegue (DOS SEMANAS)

### Opción A: Heroku (Fácil)

```bash
# 1. Instalar Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# 2. Login
heroku login

# 3. Crear app
heroku create carbon-cheddar-api

# 4. Crear Procfile
echo 'web: gunicorn app:app' > Procfile

# 5. Crear runtime.txt
echo 'python-3.9.16' > runtime.txt

# 6. Instalar gunicorn
pip install gunicorn
pip freeze > requirements.txt

# 7. Desplegar
git add .
git commit -m "Deploy to Heroku"
git push heroku main

# 8. Ver logs
heroku logs --tail

# 9. Base de datos (Heroku Postgres)
heroku addons:create heroku-postgresql:hobby-dev
```

### Opción B: DigitalOcean (Más control)

```bash
# 1. Crear droplet Ubuntu 22.04

# 2. SSH a la instancia
ssh root@<IP_DROPLET>

# 3. Instalar dependencias
apt update
apt install -y python3-pip postgresql nginx

# 4. Clonar repo
git clone https://github.com/tu-usuario/carbon-cheddar.git
cd carbon-cheddar/backend

# 5. Crear virtualenv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn

# 6. Configurar BD PostgreSQL
sudo -u postgres createdb carbo_cheddar
# Actualizar DATABASE_URL en .env

# 7. Crear archivo systemd service
# /etc/systemd/system/carbon-cheddar.service
[Unit]
Description=Carbon & Cheddar API
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/carbon-cheddar/backend
ExecStart=/var/www/carbon-cheddar/backend/venv/bin/gunicorn -w 4 app:app
Restart=always

[Install]
WantedBy=multi-user.target

# 8. Iniciar servicio
systemctl start carbon-cheddar
systemctl enable carbon-cheddar

# 9. Configurar Nginx
# /etc/nginx/sites-available/carbon-cheddar
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:8000;
    }
}

# 10. Activar sitio
ln -s /etc/nginx/sites-available/carbon-cheddar \
      /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# 11. SSL con Let's Encrypt
apt install certbot python3-certbot-nginx
certbot --nginx -d tu-dominio.com
```

### Opción C: Docker (Recomendado)

```bash
# Crear Dockerfile (backend)
# backend/Dockerfile

FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]

# Crear Dockerfile (frontend)
# frontend/Dockerfile

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

# Exponer puerto
EXPOSE 5173

# Ejecutar con vite
CMD ["npm", "run", "dev"]

# Crear docker-compose.yml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - SECRET_KEY=tu-clave-secreta
      - DATABASE_URL=sqlite:///carbo_cheddar.db
    volumes:
      - ./backend:/app

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=http://localhost:5000/api
    volumes:
      - ./frontend:/app

# Ejecutar
docker-compose up

# Acceder
# Backend: http://localhost:5000
# Frontend: http://localhost:5173
```

---

## Fase 6: Post-Despliegue (CONTINUO)

### Monitoreo

```python
# backend/utils/monitoring.py

import logging
from datetime import datetime

logger = logging.getLogger('app')

def log_request(endpoint, method, status_code, user_id=None):
    logger.info(f'{datetime.now()} | {method} {endpoint} | Status: {status_code} | User: {user_id}')

def log_error(error, context):
    logger.error(f'Error: {str(error)} | Context: {context}')
```

### Analytics

```javascript
// frontend/utils/analytics.js

export const trackEvent = (eventName, data) => {
  // Enviar a Google Analytics, Mixpanel, etc.
  if (window.gtag) {
    window.gtag('event', eventName, data);
  }
};

// En componentes:
trackEvent('receta_creada', { nombre: formulario.nombre });
```

### Performance

```bash
# Backend
pip install flask-limiter  # Rate limiting
pip install flask-cors     # CORS

# Frontend
npm install react-helmet   # SEO
npm install @testing-library/react  # Testing
```

---

## Fase 7: Mejoras a Largo Plazo

### Funcionales

- [ ] Exportar recetas a PDF
- [ ] Historial de cambios (Audit Trail)
- [ ] Cálculo de recetas escalables (×2, ×10, etc.)
- [ ] Gestión de proveedores
- [ ] Análisis de tendencias
- [ ] Predicciones de costos
- [ ] Integración con PDV

### Técnicas

- [ ] Pasar a PostgreSQL
- [ ] Implementar Redis para caché
- [ ] Agregar WebSockets para notificaciones
- [ ] Implementar GraphQL
- [ ] Agregar CI/CD (GitHub Actions)
- [ ] Aumentar cobertura de tests a 80%+
- [ ] Implementar E2E testing automático

### UX

- [ ] Diseño mejorado (Tailwind CSS)
- [ ] Modo oscuro
- [ ] Soporte multiidioma (i18n)
- [ ] App móvil (React Native)
- [ ] Aplicación de escritorio (Electron)

---

## 📊 Roadmap Sugerido

```
Semana 1: ✅ Verificación local + Testing
Semana 2: ✅ Documentación + Optimizaciones
Semana 3: 🚀 Despliegue a producción
Semana 4: 📈 Monitoreo + Feedback
Semana 5+: 🛠️ Mejoras basadas en feedback
```

---

## 📞 Contacto para Soporte

Para dudas sobre la implementación:
1. Revisar documentación en project root
2. Revisar comentarios en código
3. Buscar en CASOS_DE_USO.md
4. Revisar logs en `app.py` y consola

---

## ✅ Checklist Final

- [ ] Backend funciona localmente
- [ ] Frontend funciona localmente
- [ ] Login/Logout funciona
- [ ] CRUD recetas funciona
- [ ] CRUD ingredientes funciona
- [ ] Cálculos automáticos funcionan
- [ ] Reportes se generan
- [ ] Tests pasan
- [ ] Documentación completa
- [ ] Pronto para despliegue

---

**¡Sistema listo para llevar a producción! 🚀**

Próximo paso: Ejecutar backend y frontend localmente para verificar.

Comando rápido:
```bash
# Terminal 1
cd backend && python app.py

# Terminal 2
cd frontend && npm run dev

# Navegar a: http://localhost:5173
```
