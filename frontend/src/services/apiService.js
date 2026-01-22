/**
 * Servicio de API Cliente - Comunicación con el backend
 * Encapsula todas las llamadas HTTP y manejo de autenticación
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Crear instancia de axios con configuración base
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar token en cada solicitud
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores de autenticación
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============= AUTENTICACIÓN =============
export const authService = {
  /**
   * Registrar un nuevo usuario
   */
  registro: async (nombre, email, password) => {
    const response = await apiClient.post('/auth/registro', {
      nombre,
      email,
      password
    });
    return response.data;
  },

  /**
   * Iniciar sesión
   */
  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', {
      email,
      password
    });

    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('usuario', JSON.stringify(response.data.usuario));
    }

    return response.data;
  },

  /**
   * Cerrar sesión
   */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  },

  /**
   * Obtener perfil del usuario autenticado
   */
  obtenerPerfil: async () => {
    const response = await apiClient.get('/auth/perfil');
    return response.data;
  },

  /**
   * Cambiar contraseña
   */
  cambiarPassword: async (passwordActual, passwordNueva) => {
    const response = await apiClient.put('/auth/cambiar-password', {
      password_actual: passwordActual,
      password_nueva: passwordNueva
    });
    return response.data;
  },

  /**
   * Validar token
   */
  validarToken: async (token) => {
    const response = await apiClient.post('/auth/validar-token', { token });
    return response.data;
  }
};

// ============= RECETAS =============
export const recetasService = {
  /**
   * Listar todas las recetas del usuario
   */
  listar: async (pagina = 1, porPagina = 10) => {
    const response = await apiClient.get('/recetas-usuario', {
      params: { pagina, por_pagina: porPagina }
    });
    return response.data;
  },

  /**
   * Crear una nueva receta
   */
  crear: async (datos) => {
    const response = await apiClient.post('/recetas', {
      nombre: datos.nombre,
      descripcion: datos.descripcion || '',
      rendimiento_porciones: datos.rendimientoPorciones || 1,
      precio_venta: datos.precioVenta
    });
    return response.data;
  },

  /**
   * Obtener una receta específica
   */
  obtener: async (recetaId) => {
    const response = await apiClient.get(`/recetas/${recetaId}`);
    return response.data;
  },

  /**
   * Actualizar una receta
   */
  actualizar: async (recetaId, datos) => {
    const response = await apiClient.put(`/recetas/${recetaId}`, datos);
    return response.data;
  },

  /**
   * Eliminar una receta
   */
  eliminar: async (recetaId) => {
    const response = await apiClient.delete(`/recetas/${recetaId}`);
    return response.data;
  },

  /**
   * Agregar un ingrediente a una receta
   */
  agregarIngrediente: async (recetaId, ingredienteId, cantidad, subRecetaId = null) => {
    const payload = { cantidad };
    if (ingredienteId) payload.ingrediente_id = ingredienteId;
    if (subRecetaId) payload.sub_receta_id = subRecetaId;

    const response = await apiClient.post(
      `/recetas/${recetaId}/ingredientes`,
      payload
    );
    return response.data;
  },

  /**
   * Actualizar cantidad de ingrediente en receta
   */
  actualizarCantidadIngrediente: async (recetaId, riId, cantidad) => {
    const response = await apiClient.put(
      `/recetas/${recetaId}/ingredientes/${riId}`,
      { cantidad }
    );
    return response.data;
  },

  /**
   * Eliminar un ingrediente de una receta
   */
  eliminarIngrediente: async (recetaId, riId) => {
    const response = await apiClient.delete(
      `/recetas/${recetaId}/ingredientes/${riId}`
    );
    return response.data;
  }
};

// ============= INGREDIENTES =============
export const ingredientesService = {
  /**
   * Listar todos los ingredientes
   */
  listar: async (pagina = 1, porPagina = 20) => {
    const response = await apiClient.get('/ingredientes', {
      params: { pagina, por_pagina: porPagina }
    });
    return response.data;
  },

  /**
   * Buscar ingredientes
   */
  buscar: async (termino) => {
    const response = await apiClient.get('/ingredientes', {
      params: { buscar: termino }
    });
    return response.data;
  },

  /**
   * Crear un nuevo ingrediente
   */
  crear: async (datos) => {
    const response = await apiClient.post('/ingredientes', {
      nombre: datos.nombre,
      descripcion: datos.descripcion || '',
      unidad_medida: datos.unidadMedida,
      costo_unitario: datos.costoUnitario
    });
    return response.data;
  },

  /**
   * Obtener un ingrediente específico
   */
  obtener: async (ingredienteId) => {
    const response = await apiClient.get(`/ingredientes/${ingredienteId}`);
    return response.data;
  },

  /**
   * Actualizar un ingrediente
   */
  actualizar: async (ingredienteId, datos) => {
    const response = await apiClient.put(`/ingredientes/${ingredienteId}`, datos);
    return response.data;
  },

  /**
   * Eliminar un ingrediente
   */
  eliminar: async (ingredienteId) => {
    const response = await apiClient.delete(`/ingredientes/${ingredienteId}`);
    return response.data;
  },

  /**
   * Obtener historial de costos de un ingrediente
   */
  obtenerHistorial: async (ingredienteId, limite = 10) => {
    const response = await apiClient.get(
      `/ingredientes/${ingredienteId}/historial`,
      { params: { limite } }
    );
    return response.data;
  }
};

// ============= REPORTES =============
export const reportesService = {
  /**
   * Obtener resumen de recetas
   */
  obtenerResumenRecetas: async () => {
    const response = await apiClient.get('/reportes/resumen');
    return response.data;
  },

  /**
   * Obtener reporte de rentabilidad
   */
  obtenerRentabilidad: async () => {
    const response = await apiClient.get('/reportes/rentabilidad');
    return response.data;
  },

  /**
   * Obtener reporte de ingredientes
   */
  obtenerIngredientes: async () => {
    const response = await apiClient.get('/reportes/ingredientes');
    return response.data;
  }
};

export default apiClient;
