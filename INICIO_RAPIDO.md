# ⚡ INICIO RÁPIDO - 5 MINUTOS

## 🎯 Lo que tienes ahora

- ✅ Backend Flask completamente funcional
- ✅ Frontend React completamente funcional
- ✅ Base de datos SQLite con datos de demostración
- ✅ 20+ endpoints API listos
- ✅ Autenticación JWT implementada
- ✅ Todo integrado y probado

---

## 🚀 Empezar AHORA (3 pasos)

### Paso 1: Abrir 2 Terminales

**Terminal 1** (Backend):
```powershell
cd c:\Users\macas\OneDrive\Desktop\carbon_y_cheddar_api\backend
python app.py
```

**Terminal 2** (Frontend):
```powershell
cd c:\Users\macas\OneDrive\Desktop\carbon_y_cheddar_api\frontend
npm run dev
```

### Paso 2: Esperar 10 segundos

Verás esto en Terminal 1:
```
✓ Usuario de demostración creado: demo@example.com / demo123
✓ Ingredientes de demostración creados
 * Running on http://127.0.0.1:5000
```

Verás esto en Terminal 2:
```
VITE v4.5.14 ready in XXX ms
➜ Local: http://localhost:5173/
```

### Paso 3: Abrir navegador

```
http://localhost:5173
```

---

## 📝 Credenciales de Entrada

```
Email:      demo@example.com
Contraseña: demo123
```

---

## 🎮 Qué Puedes Hacer

### 1. Dashboard
- Ver todas tus recetas
- Ver métricas (costo total, margen, utilidad)
- Crear nueva receta

### 2. Crear Receta
- Nombre, descripción, rendimiento
- Agregar ingredientes
- Ver cálculos automáticos
- Guardar

### 3. Gestionar Ingredientes
- Ver lista de ingredientes
- Buscar ingredientes
- Cambiar precios
- Ver historial de cambios

### 4. Ver Reportes
- Resumen de recetas
- Análisis de rentabilidad
- Costos por ingrediente

### 5. Logout
- Cerrar sesión seguramente

---

## 🛑 Si Algo No Funciona

### Error: "Connection refused"
→ Asegúrate de tener 2 terminales abiertas (backend + frontend)

### Error: "405 Method Not Allowed"
→ Ya está solucionado. Reinicia ambos servidores.

### Error: "CORS blocked"
→ Reinicia el backend:
```powershell
Get-Process python | Stop-Process -Force
python app.py
```

### No aparece nada en el navegador
→ Espera 5-10 segundos más. Vite necesita compilar.

---

## 📚 Documentación

Si necesitas más info:

| Archivo | Leer si... |
|---------|-----------|
| `README.md` | Quieres instalación detallada |
| `DIAGNOSTICO_405.md` | Tienes errores HTTP |
| `COMANDOS_UTILES.md` | Necesitas ejecutar pruebas |
| `ARQUITECTURA_TECNICA.md` | Quieres entender el código |
| `PROXIMOS_PASOS.md` | Quieres testing o despliegue |

---

## ✅ Checklist de Verificación

Cuando veas esto, ¡está todo OK!

- [ ] Backend corriendo en http://localhost:5000
- [ ] Frontend corriendo en http://localhost:5173
- [ ] Navegador abierto en http://localhost:5173
- [ ] Login con demo@example.com funciona
- [ ] Dashboard carga con éxito
- [ ] Puedes ver la lista de ingredientes
- [ ] Botón "Nueva Receta" funciona

---

## 🎉 ¡LISTO!

Tu aplicación de gestión de recetas está funcionando.

**Próximos pasos opcionales:**
1. 🧪 Agregar tests automáticos
2. 🚀 Desplegar a producción
3. 📊 Crear más recetas y probar
4. 🔧 Personalizar según tus necesidades

---

**¿Preguntas?** Consulta los archivos .md en la raíz del proyecto.

**¿Error?** Revisa `DIAGNOSTICO_405.md`

**¿Comandos?** Revisa `COMANDOS_UTILES.md`

---

Versión: 3.0 | Estado: ✅ Operacional | Fecha: 2026-01-16
