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
      setRecetas(datosRecetas?.recetas || datosRecetas?.data || []);

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
        <h1 style={styles.headerTitle}>
          <img
            src={localStorage.getItem('logoUrl') || "http://localhost:5000/static/uploads/logo_empresa.jpg"}
            onError={(e) => { e.target.onerror = null; e.target.src = '/logo.jpg' }}
            alt="Logo"
            style={styles.logo}
          />
        </h1>
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
          onClick={() => navigate('/ventas/historial')}
          style={styles.tabButton}
        >
          🕒 Historial y Notas
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
        <button
          onClick={() => navigate('/inventario')}
          style={styles.tabButton}
        >
          📦 Inventario
        </button>
        {usuario?.rol === 'admin' && (
          <button
            onClick={() => navigate('/admin/usuarios')}
            style={{ ...styles.tabButton, color: '#d32f2f' }}
          >
            👥 Usuarios
          </button>
        )}
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
                          ${(receta.costo_total || 0).toFixed(2)}
                        </span>
                      </div>
                      <div style={styles.stat}>
                        <span style={styles.label}>Costo/Porción:</span>
                        <span style={styles.value}>
                          ${(receta.costo_por_porcion || 0).toFixed(2)}
                        </span>
                      </div>
                      <div style={styles.stat}>
                        <span style={styles.label}>Precio Venta:</span>
                        <span style={styles.value}>
                          ${(receta.precio_venta || 0).toFixed(2)}
                        </span>
                      </div>
                      <div
                        style={{
                          ...styles.stat,
                          background:
                            (receta.margen_porcentaje || 0) > 30 ? '#c8e6c9' : '#ffccbc'
                        }}
                      >
                        <span style={styles.label}>Margen:</span>
                        <span style={styles.value}>
                          {(receta.margen_porcentaje || 0).toFixed(1)}%
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
                    <strong>{reporte.total_recetas || 0}</strong>
                  </div>
                  <div style={styles.reporteItem}>
                    <span>Costo Promedio:</span>
                    <strong>${(reporte.costo_total_promedio || 0).toFixed(2)}</strong>
                  </div>
                  <div style={styles.reporteItem}>
                    <span>Margen Promedio:</span>
                    <strong>{(reporte.margen_promedio || 0).toFixed(1)}%</strong>
                  </div>
                  <div style={styles.reporteItem}>
                    <span>Utilidad Total:</span>
                    <strong
                      style={{
                        color:
                          (reporte.utilidad_total || 0) > 0 ? '#4caf50' : '#f44336'
                      }}
                    >
                      ${(reporte.utilidad_total || 0).toFixed(2)}
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
                <p style={{ color: '#666', marginBottom: '15px' }}>
                  Configura el nombre de tu negocio que aparecerá en documentos y reportes
                </p>

                <div style={styles.formGroup}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
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

                <div style={{ marginTop: '20px', padding: '15px', background: '#e3f2fd', borderRadius: '4px' }}>
                  <p style={{ margin: 0, color: '#1565c0', fontSize: '14px' }}>
                    <strong>Nombre actual del negocio:</strong> {nombreNegocio}
                  </p>
                </div>
              </div>

              <div style={styles.configSection}>
                <h3>Logo / Marca</h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '15px' }}>
                  <img
                    src={localStorage.getItem('logoUrl') || "http://localhost:5000/static/uploads/logo_empresa.jpg"}
                    onError={(e) => { e.target.onerror = null; e.target.src = '/logo.jpg' }}
                    alt="Logo Actual"
                    style={{ height: '100px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}
                  />
                  <div>
                    <p style={{ marginBottom: '5px' }}>Sube tu logo (JPG/PNG)</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;

                        const formData = new FormData();
                        formData.append('logo', file);

                        try {
                          // Asumimos que apiClient ya existe e importado arriba, pero por si acaso usamos fetch directo con token
                          const token = localStorage.getItem('token');
                          const res = await fetch('http://localhost:5000/api/admin/logo', {
                            method: 'POST',
                            headers: {
                              'Authorization': `Bearer ${token}`
                            },
                            body: formData
                          });
                          const data = await res.json();

                          if (data.success) {
                            const newUrl = `http://localhost:5000${data.url}?t=${new Date().getTime()}`;
                            localStorage.setItem('logoUrl', newUrl);
                            alert('Logo actualizado!');
                            window.location.reload(); // Recargar para aplicar en todos lados
                          } else {
                            alert('Error: ' + data.error);
                          }
                        } catch (err) {
                          alert('Error subiendo logo: ' + err.message);
                        }
                      }}
                    />
                  </div>
                </div>

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
    background: 'var(--bg-main)',
    color: 'var(--text-main)',
    fontFamily: "'Inter', sans-serif"
  },
  header: {
    background: 'var(--bg-card)',
    padding: '20px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: 'var(--border-gold)',
    boxShadow: 'var(--shadow-card)'
  },
  headerTitle: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '300',
    color: 'var(--primary-gold)',
    letterSpacing: '2px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  logo: {
    height: '60px',
    borderRadius: '8px',
    border: 'var(--border-gold)'
  },
  bienvenida: {
    marginRight: '20px',
    fontSize: '14px',
    color: 'var(--text-secondary)',
    fontWeight: '500'
  },
  buttonLogout: {
    padding: '10px 20px',
    background: 'var(--bg-card)',
    color: 'var(--text-secondary)',
    border: '1px solid #ddd',
    borderRadius: '30px',
    cursor: 'pointer',
    fontSize: '13px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    transition: 'all 0.3s'
  },
  tabsContainer: {
    background: 'var(--bg-card)',
    display: 'flex',
    borderBottom: 'var(--border-light)',
    padding: '0 40px',
    overflowX: 'auto',
    gap: '5px'
  },
  tabButton: {
    padding: '20px 25px',
    background: 'transparent',
    border: 'none',
    borderBottom: '3px solid transparent',
    cursor: 'pointer',
    fontSize: '14px',
    color: 'var(--text-secondary)',
    transition: 'all 0.3s',
    whiteSpace: 'nowrap',
    fontWeight: '500'
  },
  tabActive: {
    borderBottomColor: 'var(--primary-gold)',
    color: 'var(--primary-gold)',
    fontWeight: 'bold',
    background: 'linear-gradient(to top, rgba(197, 160, 40, 0.05), transparent)'
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 20px'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px'
  },
  buttonPrimary: {
    padding: '12px 24px',
    background: 'linear-gradient(45deg, var(--primary-gold), #D4AF37)',
    color: '#fff',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    boxShadow: 'var(--shadow-gold)'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px',
    background: 'var(--bg-card)',
    borderRadius: '16px',
    border: 'var(--border-light)',
    color: 'var(--text-secondary)',
    boxShadow: 'var(--shadow-card)'
  },
  recetasGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '30px'
  },
  recetaCard: {
    background: 'var(--bg-card)',
    padding: '25px',
    borderRadius: '16px',
    border: 'var(--border-light)',
    boxShadow: 'var(--shadow-card)',
    transition: 'transform 0.3s, box-shadow 0.3s'
  },
  descripcion: {
    color: 'var(--text-secondary)',
    fontSize: '14px',
    margin: '10px 0 20px 0',
    lineHeight: '1.5'
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
    margin: '20px 0'
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    padding: '12px',
    background: 'var(--bg-main)',
    borderRadius: '8px',
    border: 'var(--border-light)'
  },
  label: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '5px'
  },
  value: {
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--text-main)'
  },
  cardActions: {
    display: 'flex',
    gap: '15px',
    marginTop: '25px'
  },
  buttonSecondary: {
    flex: 1,
    padding: '10px',
    background: 'transparent',
    color: 'var(--text-main)',
    border: '1px solid #ddd',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  buttonDanger: {
    flex: 1,
    padding: '10px',
    background: '#ffebee',
    color: 'var(--danger)',
    border: '1px solid var(--danger)',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  reporteContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '30px'
  },
  reporteCard: {
    background: 'var(--bg-card)',
    padding: '30px',
    borderRadius: '16px',
    border: 'var(--border-light)',
    boxShadow: 'var(--shadow-card)'
  },
  reporteContent: {
    marginTop: '20px'
  },
  reporteItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '15px 0',
    borderBottom: '1px solid #f0f0f0',
    fontSize: '15px',
    color: 'var(--text-main)'
  },
  configCard: {
    background: 'var(--bg-card)',
    borderRadius: '16px',
    padding: '40px',
    maxWidth: '800px',
    margin: '0 auto',
    boxShadow: 'var(--shadow-card)',
    border: 'var(--border-light)'
  },
  configSection: {
    marginBottom: '40px',
    paddingBottom: '40px',
    borderBottom: '1px solid #f0f0f0'
  },
  formGroup: {
    marginBottom: '25px'
  },
  input: {
    width: '100%',
    padding: '15px',
    background: 'var(--bg-main)',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '16px',
    color: 'var(--text-main)',
    boxSizing: 'border-box',
    fontFamily: "'Inter', sans-serif"
  },
  infoBlock: {
    background: 'var(--bg-main)',
    padding: '20px',
    borderRadius: '8px',
    lineHeight: '2',
    color: 'var(--text-secondary)'
  }
};
