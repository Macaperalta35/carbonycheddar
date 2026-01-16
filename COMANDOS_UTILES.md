# 🛠️ COMANDOS ÚTILES - Carbon & Cheddar

## 🚀 Iniciar Desarrollo (Local)

### Terminal 1 - Backend
```powershell
cd backend
python app.py
```

**Esperado:**
```
✓ Usuario de demostración creado: demo@example.com / demo123
✓ Ingredientes de demostración creados
 * Running on http://127.0.0.1:5000
```

### Terminal 2 - Frontend
```powershell
cd frontend
npm run dev
```

**Esperado:**
```
VITE v4.5.14 ready in XXX ms
➜ Local: http://localhost:5173/
```

---

## 📊 Pruebas de Endpoints (PowerShell)

### Test 1: Login
```powershell
$body = @{email="demo@example.com"; password="demo123"} | ConvertTo-Json
$response = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
Write-Host "Status: $($response.StatusCode)"
$response.Content | ConvertFrom-Json | ConvertTo-Json
```

### Test 2: Listar Recetas
```powershell
$token = "YOUR_TOKEN_HERE"
$response = Invoke-WebRequest -Uri "http://localhost:5000/api/recetas" `
  -Method GET `
  -Headers @{Authorization="Bearer $token"}
Write-Host "Status: $($response.StatusCode)"
$response.Content | ConvertFrom-Json | ConvertTo-Json
```

### Test 3: Crear Receta
```powershell
$token = "YOUR_TOKEN_HERE"
$body = @{
  nombre="Mi Receta"
  descripcion="Una receta de prueba"
  rendimiento_porciones=4
  precio_venta=10.00
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:5000/api/recetas" `
  -Method POST `
  -Headers @{Authorization="Bearer $token"; "Content-Type"="application/json"} `
  -Body $body
Write-Host "Status: $($response.StatusCode)"
$response.Content | ConvertFrom-Json | ConvertTo-Json
```

### Test 4: Listar Ingredientes
```powershell
$token = "YOUR_TOKEN_HERE"
$response = Invoke-WebRequest -Uri "http://localhost:5000/api/ingredientes" `
  -Method GET `
  -Headers @{Authorization="Bearer $token"}
Write-Host "Status: $($response.StatusCode)"
$response.Content | ConvertFrom-Json | ConvertTo-Json
```

### Test 5: Generar Reportes
```powershell
$token = "YOUR_TOKEN_HERE"

# Reporte de Resumen
$response = Invoke-WebRequest -Uri "http://localhost:5000/api/reportes/resumen" `
  -Method GET `
  -Headers @{Authorization="Bearer $token"}
Write-Host "Reporte Resumen:"
$response.Content | ConvertFrom-Json | ConvertTo-Json

# Reporte de Rentabilidad
$response = Invoke-WebRequest -Uri "http://localhost:5000/api/reportes/rentabilidad" `
  -Method GET `
  -Headers @{Authorization="Bearer $token"}
Write-Host "Reporte Rentabilidad:"
$response.Content | ConvertFrom-Json | ConvertTo-Json
```

---

## 🔧 Mantenimiento

### Limpiar Base de Datos
```powershell
cd backend
Remove-Item instance -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item *.db -Force -ErrorAction SilentlyContinue
Write-Host "✓ Base de datos limpiada"
```

### Reinstalar Dependencias Python
```powershell
cd backend
pip install -r requirements.txt --upgrade
```

### Reinstalar Dependencias Node
```powershell
cd frontend
npm install
# o si tienes problemas:
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json -Force
npm install
```

### Detener Servidores
```powershell
# Matar todos los procesos Python
Get-Process python | Stop-Process -Force

# O específicamente Flask
Get-Process python | Where-Object {$_.CommandLine -match "app.py"} | Stop-Process -Force
```

### Reiniciar Servicios
```powershell
# Matar todos
Get-Process python | Stop-Process -Force

# Iniciar Backend
Start-Process powershell -ArgumentList "cd backend; python app.py" -NoNewWindow

# Iniciar Frontend (en otra terminal)
Start-Process powershell -ArgumentList "cd frontend; npm run dev" -NoNewWindow
```

---

## 📝 Cambiar Credenciales Demo

### Cambiar contraseña demo
```sql
-- En backend/database/db.py, cambiar:
usuario_demo.set_password('tu-nueva-contraseña')
```

### Cambiar email demo
```sql
-- En backend/app.py, cambiar:
email="nuevo-email@example.com"
```

---

## 🐛 Debugging

### Ver logs del Backend
```powershell
# Los logs aparecen en tiempo real en la terminal donde ejecutaste python app.py
# Busca líneas con: INFO, ERROR, DEBUG

# Para más detalle, modifica backend/app.py:
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Ver logs del Frontend
```powershell
# Abre DevTools en navegador (F12)
# Consola → Busca errores, warnings
# Network → Ve peticiones HTTP y sus respuestas
```

### Probar conectividad con Backend
```powershell
# Verificar que esté corriendo
Invoke-WebRequest -Uri "http://localhost:5000/" -Method GET

# Ver estado detallado
$response = Invoke-WebRequest -Uri "http://localhost:5000/" -Method GET
$response.Content | ConvertFrom-Json | ConvertTo-Json
```

---

## 🔄 Procesos Comunes

### Crear un Usuario Nuevo (Vía API)
```powershell
$body = @{
  nombre="Juan Pérez"
  email="juan@example.com"
  password="password123"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/registro" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body

$response.Content | ConvertFrom-Json | ConvertTo-Json
```

### Cambiar Contraseña
```powershell
$token = "YOUR_TOKEN_HERE"
$body = @{
  password_actual="demo123"
  password_nueva="nueva_contraseña123"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/cambiar-password" `
  -Method PUT `
  -Headers @{Authorization="Bearer $token"; "Content-Type"="application/json"} `
  -Body $body

Write-Host "Status: $($response.StatusCode)"
```

### Exportar Datos (Backup)
```powershell
# Copiar base de datos
Copy-Item backend/carbo_cheddar.db backup/carbo_cheddar_$(Get-Date -Format 'yyyyMMdd_HHmmss').db

# Exportar usuarios, recetas, ingredientes a JSON
# (Agregar endpoint en backend si es necesario)
```

---

## 🚀 Despliegue Rápido

### Docker Compose (Recomendado)
```powershell
# Desde raíz del proyecto
docker-compose up

# Acceder
# Backend: http://localhost:5000
# Frontend: http://localhost:5173
```

### Heroku
```powershell
# Login
heroku login

# Crear app
heroku create carbon-cheddar-api

# Deploy
git push heroku main

# Ver logs
heroku logs --tail
```

### DigitalOcean / VPS
```bash
# SSH a servidor
ssh root@IP_SERVIDOR

# Clone repo
git clone <URL_REPO>
cd carbon-cheddar

# Install
pip install -r backend/requirements.txt
npm install --prefix frontend

# Run with supervisor/systemd
# (Ver PROXIMOS_PASOS.md para configuración completa)
```

---

## 📊 Monitoreo en Producción

### Verificar que Backend esté corriendo
```powershell
# Cada 30 segundos
while ($true) {
  $status = try { 
    (Invoke-WebRequest -Uri "http://localhost:5000/" -Method GET).StatusCode 
  } catch { 
    "ERROR" 
  }
  Write-Host "$(Get-Date): $status"
  Start-Sleep -Seconds 30
}
```

### Ver tamaño de BD
```powershell
cd backend
(Get-Item carbo_cheddar.db).Length | ForEach-Object { "$([math]::Round($_/1MB, 2)) MB" }
```

### Contar registros en BD
```powershell
# Usar SQLite Browser o similar para ver:
SELECT COUNT(*) FROM usuarios;
SELECT COUNT(*) FROM recetas;
SELECT COUNT(*) FROM ingredientes;
```

---

## 🆘 Troubleshooting Rápido

### Error: "Address already in use"
```powershell
# Puerto 5000 ya está en uso
Get-Process | Where-Object {$_.Handles -gt 0} | Where-Object {$_.Name -eq "python"} | Stop-Process -Force

# O cambiar puerto en app.py:
app.run(host='0.0.0.0', port=5001, debug=True)
```

### Error: "Module not found"
```powershell
# Reinstalar dependencias
cd backend
pip install -r requirements.txt
```

### Error: "CORS blocked"
```powershell
# Verificar que CORS esté configurado en app.py:
CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Reiniciar servidor
```

### Error: "JWT token inválido"
```powershell
# El token expiró (24h)
# Hacer login de nuevo:
# 1. En frontend: http://localhost:5173/login
# 2. O vía API: POST /api/auth/login
```

---

## 📚 Documentación Rápida

| Archivo | Propósito |
|---------|-----------|
| `README.md` | Guía de inicio |
| `ARQUITECTURA_TECNICA.md` | Diseño del sistema |
| `CASOS_DE_USO.md` | Ejemplos prácticos |
| `RESUMEN_IMPLEMENTACION.md` | Sumario ejecutivo |
| `PROXIMOS_PASOS.md` | Testing y despliegue |
| `DIAGNOSTICO_405.md` | Solución de errores HTTP |
| `STATUS_FINAL.md` | Estado actual |
| `COMANDOS_UTILES.md` | Este archivo |

---

## 🎯 Atajos Frecuentes

### Acceso Rápido
```
Frontend:  http://localhost:5173
Backend:   http://localhost:5000
Demo User: demo@example.com / demo123
```

### Desarrollo Rápido
```powershell
# Script para iniciar todo en un comando
# Guardar como: start.ps1

$env:PYTHONPATH = "$pwd\backend"
Start-Process python -ArgumentList "backend/app.py" -NoNewWindow
Start-Process npm -ArgumentList "run dev" -WorkingDirectory "frontend" -NoNewWindow
Write-Host "✓ Servidores iniciados:"
Write-Host "  Backend:  http://localhost:5000"
Write-Host "  Frontend: http://localhost:5173"
```

Ejecutar:
```powershell
.\start.ps1
```

---

**Última actualización**: 2026-01-16
**Versión**: 3.0
**Estado**: ✅ Operacional
