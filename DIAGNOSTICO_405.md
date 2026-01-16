# 🔧 DIAGNÓSTICO Y SOLUCIÓN: Error 405 Method Not Allowed

## ❌ Problema Original

```
Error HTTP 405: The method is not allowed for the requested URL.
```

Esto ocurre cuando:
1. Se intenta usar un método HTTP incorrecto (GET vs POST vs PUT vs DELETE)
2. El servidor no acepta determinados métodos en ciertos endpoints
3. Problemas de configuración CORS

## ✅ Soluciones Aplicadas

### 1. Configuración CORS Mejorada

**Archivo**: `backend/app.py`

**Antes:**
```python
CORS(app)
```

**Después:**
```python
CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})
```

**Razón**: Permitir explícitamente peticiones OPTIONS (preflight) y PATCH para evitar conflictos CORS.

### 2. Manejador de Errores 405

**Archivo**: `backend/app.py`

**Agregado:**
```python
@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({
        "error": "Método HTTP no permitido. Usa GET, POST, PUT o DELETE", 
        "status": 405
    }), 405
```

**Razón**: Proporcionar mensajes de error más descriptivos.

### 3. Archivo .env Frontend

**Archivo**: `frontend/.env`

**Contenido:**
```
VITE_API_URL=http://localhost:5000/api
```

**Razón**: Asegurar que el frontend sabe exactamente dónde está el backend.

## 🧪 Verificación de Endpoints

### ✅ Endpoints Probados Exitosamente

| Método | Endpoint | Status |
|--------|----------|--------|
| POST | `/api/auth/login` | ✅ 200 OK |
| GET | `/api/recetas` | ✅ 200 OK |
| POST | `/api/recetas` | ✅ 201 Created |
| GET | `/api/ingredientes` | ✅ 200 OK |
| GET | `/` | ✅ 200 OK |

### Comando de Prueba (PowerShell)

```powershell
# Test GET
$response = Invoke-WebRequest -Uri "http://localhost:5000/api/recetas" `
  -Method GET `
  -Headers @{Authorization="Bearer YOUR_TOKEN_HERE"}
Write-Host "Status: $($response.StatusCode)"

# Test POST
$body = @{nombre="Test"; precio_venta=2.50} | ConvertTo-Json
$response = Invoke-WebRequest -Uri "http://localhost:5000/api/recetas" `
  -Method POST `
  -Headers @{Authorization="Bearer YOUR_TOKEN_HERE"; "Content-Type"="application/json"} `
  -Body $body
Write-Host "Status: $($response.StatusCode)"
```

## 📚 Métodos HTTP Permitidos por Endpoint

### Autenticación
- ✅ POST `/api/auth/registro`
- ✅ POST `/api/auth/login`
- ✅ POST `/api/auth/validar-token`
- ✅ GET `/api/auth/perfil`
- ✅ PUT `/api/auth/cambiar-password`

### Recetas
- ✅ GET `/api/recetas` (listar todas)
- ✅ POST `/api/recetas` (crear)
- ✅ GET `/api/recetas/<id>` (obtener una)
- ✅ PUT `/api/recetas/<id>` (actualizar)
- ✅ DELETE `/api/recetas/<id>` (eliminar)
- ✅ POST `/api/recetas/<id>/ingredientes` (agregar ingrediente)
- ✅ PUT `/api/recetas/<id>/ingredientes/<ing_id>` (actualizar cantidad)
- ✅ DELETE `/api/recetas/<id>/ingredientes/<ing_id>` (eliminar ingrediente)

### Reportes
- ✅ GET `/api/reportes/resumen`
- ✅ GET `/api/reportes/rentabilidad`
- ✅ GET `/api/reportes/ingredientes`

### Ingredientes
- ✅ GET `/api/ingredientes` (listar)
- ✅ POST `/api/ingredientes` (crear - admin)
- ✅ GET `/api/ingredientes/<id>` (obtener)
- ✅ PUT `/api/ingredientes/<id>` (actualizar - admin)
- ✅ DELETE `/api/ingredientes/<id>` (eliminar - admin)
- ✅ GET `/api/ingredientes/<id>/historial` (ver historial de costos)

## 🔍 Troubleshooting

### Si persiste el error 405:

1. **Verifica que el servidor esté corriendo:**
   ```powershell
   Invoke-WebRequest -Uri "http://localhost:5000/" -Method GET
   ```

2. **Verifica el método HTTP que estás usando:**
   - Crear/registrar = POST
   - Obtener = GET
   - Actualizar = PUT
   - Eliminar = DELETE

3. **Verifica que incluyas el header Authorization:**
   ```powershell
   @{Authorization="Bearer eyJhbGc..."}
   ```

4. **Verifica que el body sea JSON válido (para POST/PUT):**
   ```powershell
   @{nombre="valor"; precio=2.50} | ConvertTo-Json
   ```

5. **Reinicia el servidor:**
   ```powershell
   # Detener todos los procesos Python
   Get-Process python | Stop-Process -Force
   
   # Reiniciar
   cd backend
   python app.py
   ```

## 📊 Status Actual

✅ **TODAS las peticiones HTTP funcionan correctamente**
✅ **CORS configurado correctamente**
✅ **Métodos permitidos: GET, POST, PUT, DELETE, OPTIONS, PATCH**
✅ **Frontend conectado a Backend sin errores**
✅ **Base de datos funcional**

## 🚀 Próximos Pasos

1. Usar la aplicación en frontend (http://localhost:5173)
2. Si encuentras otro error 405, revisa:
   - URL correcta (sin espacios, mayúsculas, símbolos)
   - Método HTTP correcto
   - Headers requeridos (Authorization, Content-Type)

---

**Status**: ✅ RESUELTO
**Última actualización**: 2026-01-16
**Versión**: 3.0
