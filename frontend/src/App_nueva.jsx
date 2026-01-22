import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { authService } from './services/apiService';

// Importar páginas
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import RecetaForm from './pages/RecetaForm';
import IngredientesPage from './pages/IngredientesPage';
import VentasPageMejorada from './pages/VentasPageMejorada';
import ReportesVentasAvanzado from './pages/ReportesVentasAvanzado';
import AdminUsuariosPage from './pages/AdminUsuariosPage';
import InventarioPage from './pages/InventarioPage';
import HistorialVentasPage from './pages/HistorialVentasPage';

// Componente de ruta protegida
function ProtectedRoute({ element }) {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" />;
  }

  return element;
}

export default function App() {
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Verificar si hay sesión válida al cargar
    const token = localStorage.getItem('token');
    if (token) {
      // Aquí podrías validar el token con el backend
      setCargando(false);
    } else {
      setCargando(false);
    }
  }, []);

  if (cargando) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Cargando...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rutas protegidas */}
        <Route
          path="/dashboard"
          element={<ProtectedRoute element={<Dashboard />} />}
        />
        <Route
          path="/receta/nueva"
          element={<ProtectedRoute element={<RecetaForm />} />}
        />
        <Route
          path="/receta/:recetaId"
          element={<ProtectedRoute element={<RecetaForm />} />}
        />
        <Route
          path="/ingredientes"
          element={<ProtectedRoute element={<IngredientesPage />} />}
        />
        <Route
          path="/ventas"
          element={<ProtectedRoute element={<VentasPageMejorada />} />}
        />
        <Route
          path="/reportes-ventas"
          element={<ProtectedRoute element={<ReportesVentasAvanzado />} />}
        />
        <Route
          path="/admin/usuarios"
          element={<ProtectedRoute element={<AdminUsuariosPage />} />}
        />
        <Route
          path="/inventario"
          element={<ProtectedRoute element={<InventarioPage />} />}
        />
        <Route
          path="/ventas/historial"
          element={<ProtectedRoute element={<HistorialVentasPage />} />}
        />

        {/* Redirección por defecto */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}
