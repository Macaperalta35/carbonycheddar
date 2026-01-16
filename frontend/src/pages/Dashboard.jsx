/**
 * Componente Dashboard Principal
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, recetasService, reportesService } from '../services/apiService';

export default function Dashboard() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [nombreNegocio, setNombreNegocio] = useState(localStorage.getItem('nombreNegocio') || 'Mi Negocio');
  const [nuevoNombreNegocio, setNuevoNombreNegocio] = useState(nombreNegocio);
  const [recetas, setRecetas] = useState([]);
  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [tab, setTab] = useState('recetas');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const usuarioStorageData = localStorage.getItem('usuario');
      if (usuarioStorageData) {
        setUsuario(JSON.parse(usuarioStorageData));
      }

      const datosRecetas = await recetasService.listar();
      setRecetas(datosRecetas.recetas || []);

      const datosReporte = await reportesService.obtenerResumenRecetas();
      setReporte(datosReporte);
    } catch (err) {
      console.error('Error cargando datos:', err);
      navigate('/login');
    } finally {
      setCargando(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const guardarNombreNegocio = () => {
    localStorage.setItem('nombreNegocio', nuevoNombreNegocio);
    setNombreNegocio(nuevoNombreNegocio);
    alert('Nombre del negocio guardado correctamente');
  };

  const irACrearReceta = () => {
    navigate('/receta/nueva');
  };

  const irAEditar = (recetaId) => {
    navigate(`/receta/${recetaId}`);
  };

  if (cargando) {
    return <div style={styles.container}>Cargando...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>📊 Sistema de Ventas</h1>
        <div>
          <span style={styles.bienvenida}>
            Bienvenido, {usuario?.nombre || 'Usuario'}
          </span>
          <button onClick={handleLogout} style={styles.buttonLogout}>
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div style={styles.tabsContainer}>
        <button
          onClick={() => setTab('recetas')}
          style={{
            ...styles.tabButton,
            ...(tab === 'recetas' ? styles.tabActive : {})
          }}
        >
          📋 Mis Recetas ({recetas.length})
        </button>
        <button
          onClick={() => setTab('reportes')}
          style={{
            ...styles.tabButton,
            ...(tab === 'reportes' ? styles.tabActive : {})
          }}
        >
          📊 Reportes
        </button>
        <button
          onClick={() => navigate('/ingredientes')}
          style={styles.tabButton}
        >
          🧂 Ingredientes
        </button>
        <button
          onClick={() => navigate('/ventas')}
          style={styles.tabButton}
        >
          🛒 Punto de Venta
        </button>
        <button
          onClick={() => navigate('/reportes-ventas')}
          style={styles.tabButton}
        >
          💹 Reportes de Ventas
        </button>
        <button
          onClick={() => setTab('configuracion')}
          style={{
            ...styles.tabButton,
            ...(tab === 'configuracion' ? styles.tabActive : {})
          }}
        >
          ⚙️ Configuración
        </button>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {tab === 'recetas' && (
          <>
            <div style={styles.sectionHeader}>
              <h2>Mis Recetas</h2>
              <button onClick={irACrearReceta} style={styles.buttonPrimary}>
                + Nueva Receta
              </button>
            </div>

            {recetas.length === 0 ? (
              <div style={styles.emptyState}>
                <p>No tienes recetas aún. Crea una nueva para comenzar.</p>
                <button onClick={irACrearReceta} style={styles.buttonPrimary}>
                  Crear Primera Receta
                </button>
              </div>
            ) : (
              <div style={styles.recetasGrid}>
                {recetas.map((receta) => (
                  <div key={receta.id} style={styles.recetaCard}>
                    <h3>{receta.nombre}</h3>
                    <p style={styles.descripcion}>{receta.descripcion}</p>

                    <div style={styles.stats}>
                      <div style={styles.stat}>
                        <span style={styles.label}>Costo Total:</span>
                        <span style={styles.value}>
                          ${receta.costo_total.toFixed(2)}
                        </span>
                      </div>
                      <div style={styles.stat}>
                        <span style={styles.label}>Costo/Porción:</span>
                        <span style={styles.value}>
                          ${receta.costo_por_porcion.toFixed(2)}
                        </span>
                      </div>
                      <div style={styles.stat}>
                        <span style={styles.label}>Precio Venta:</span>
                        <span style={styles.value}>
                          ${receta.precio_venta.toFixed(2)}
                        </span>
                      </div>
                      <div
                        style={{
                          ...styles.stat,
                          background:
                            receta.margen_porcentaje > 30 ? '#c8e6c9' : '#ffccbc'
                        }}
                      >
                        <span style={styles.label}>Margen:</span>
                        <span style={styles.value}>
                          {receta.margen_porcentaje.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div style={styles.cardActions}>
                      <button
                        onClick={() => irAEditar(receta.id)}
                        style={styles.buttonSecondary}
                      >
                        Editar
                      </button>
                      <button style={styles.buttonDanger}>Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'reportes' && reporte && (
          <>
            <h2>Reportes y Análisis</h2>
            <div style={styles.reporteContainer}>
              <div style={styles.reporteCard}>
                <h3>Resumen General</h3>
                <div style={styles.reporteContent}>
                  <div style={styles.reporteItem}>
                    <span>Total de Recetas:</span>
                    <strong>{reporte.total_recetas}</strong>
                  </div>
                  <div style={styles.reporteItem}>
                    <span>Costo Promedio:</span>
                    <strong>${reporte.costo_total_promedio?.toFixed(2)}</strong>
                  </div>
                  <div style={styles.reporteItem}>
                    <span>Margen Promedio:</span>
                    <strong>{reporte.margen_promedio?.toFixed(1)}%</strong>
                  </div>
                  <div style={styles.reporteItem}>
                    <span>Utilidad Total:</span>
                    <strong
                      style={{
                        color:
                          reporte.utilidad_total > 0 ? '#4caf50' : '#f44336'
                      }}
                    >
                      ${reporte.utilidad_total?.toFixed(2)}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {tab === 'configuracion' && (
          <>
            <div style={styles.sectionHeader}>
              <h2>⚙️ Configuración del Negocio</h2>
            </div>

            <div style={styles.configCard}>
              <div style={styles.configSection}>
                <h3>Nombre del Negocio</h3>
                <p style={{color: '#666', marginBottom: '15px'}}>
                  Configura el nombre de tu negocio que aparecerá en documentos y reportes
                </p>
                
                <div style={styles.formGroup}>
                  <label style={{display: 'block', marginBottom: '8px', fontWeight: 'bold'}}>
                    Nombre del Negocio
                  </label>
                  <input
                    type="text"
                    value={nuevoNombreNegocio}
                    onChange={(e) => setNuevoNombreNegocio(e.target.value)}
                    style={styles.input}
                    placeholder="Ingresa el nombre de tu negocio"
                  />
                </div>

                <button 
                  onClick={guardarNombreNegocio}
                  style={styles.buttonPrimary}
                >
                  💾 Guardar Cambios
                </button>

                <div style={{marginTop: '20px', padding: '15px', background: '#e3f2fd', borderRadius: '4px'}}>
                  <p style={{margin: 0, color: '#1565c0', fontSize: '14px'}}>
                    <strong>Nombre actual del negocio:</strong> {nombreNegocio}
                  </p>
                </div>
              </div>

              <div style={styles.configSection}>
                <h3>Información del Usuario</h3>
                <div style={styles.infoBlock}>
                  <p><strong>Nombre:</strong> {usuario?.nombre || 'No disponible'}</p>
                  <p><strong>Email:</strong> {usuario?.email || 'No disponible'}</p>
                  <p><strong>Rol:</strong> {usuario?.rol || 'Usuario'}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f5f5',
    fontFamily: 'Arial, sans-serif'
  },
  header: {
    background: '#667eea',
    color: 'white',
    padding: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: {
    margin: 0,
    fontSize: '28px'
  },
  bienvenida: {
    marginRight: '20px',
    fontSize: '14px'
  },
  buttonLogout: {
    padding: '8px 16px',
    background: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  tabsContainer: {
    background: 'white',
    display: 'flex',
    borderBottom: '2px solid #ddd',
    padding: '0 20px'
  },
  tabButton: {
    padding: '15px 20px',
    background: 'none',
    border: 'none',
    borderBottom: '3px solid transparent',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#666',
    transition: 'all 0.3s'
  },
  tabActive: {
    borderBottomColor: '#667eea',
    color: '#667eea',
    fontWeight: 'bold'
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  buttonPrimary: {
    padding: '10px 20px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    background: 'white',
    borderRadius: '8px'
  },
  recetasGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px'
  },
  recetaCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.3s'
  },
  descripcion: {
    color: '#666',
    fontSize: '13px',
    margin: '8px 0'
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    margin: '15px 0'
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    padding: '8px',
    background: '#f0f0f0',
    borderRadius: '4px'
  },
  label: {
    fontSize: '12px',
    color: '#666'
  },
  value: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333'
  },
  cardActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '15px'
  },
  buttonSecondary: {
    flex: 1,
    padding: '8px',
    background: '#2196f3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  buttonDanger: {
    flex: 1,
    padding: '8px',
    background: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  reporteContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '20px'
  },
  reporteCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
  },
  reporteContent: {
    marginTop: '15px'
  },
  reporteItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid #eee',
    fontSize: '14px'
  },
  configCard: {
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    padding: '30px'
  },
  configSection: {
    marginBottom: '30px',
    paddingBottom: '30px',
    borderBottom: '1px solid #eee'
  },
  formGroup: {
    marginBottom: '15px'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box',
    fontFamily: 'Arial, sans-serif'
  },
  infoBlock: {
    background: '#f5f5f5',
    padding: '15px',
    borderRadius: '4px',
    lineHeight: '1.8'
  }
};
