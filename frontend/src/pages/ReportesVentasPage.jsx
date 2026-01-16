/**
 * Página de Reportes de Ventas
 * Análisis y reportes de ventas diarias y por rango de fechas
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f5f5f5'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    paddingBottom: '20px',
    borderBottom: '2px solid #ddd'
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333'
  },
  backBtn: {
    backgroundColor: '#2196f3',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  tabContainer: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    borderBottom: '2px solid #ddd'
  },
  tab: {
    padding: '10px 20px',
    backgroundColor: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#999',
    borderBottom: '3px solid transparent',
    transition: 'all 0.3s ease'
  },
  tabActive: {
    color: '#2196f3',
    borderBottomColor: '#2196f3'
  },
  filterSection: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  filterGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '15px'
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column'
  },
  label: {
    fontWeight: 'bold',
    marginBottom: '5px',
    fontSize: '14px',
    color: '#333'
  },
  input: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  },
  filterBtns: {
    display: 'flex',
    gap: '10px'
  },
  filterBtn: {
    padding: '10px 20px',
    backgroundColor: '#4caf50',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '15px',
    marginBottom: '30px'
  },
  metric: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    borderLeft: '4px solid #2196f3'
  },
  metricValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#2196f3',
    marginBottom: '5px'
  },
  metricLabel: {
    fontSize: '12px',
    color: '#999',
    fontWeight: 'bold'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: '#fff',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  tableHeader: {
    backgroundColor: '#f5f5f5',
    borderBottom: '2px solid #ddd'
  },
  tableHeaderCell: {
    padding: '12px',
    textAlign: 'left',
    fontWeight: 'bold',
    fontSize: '12px',
    color: '#333'
  },
  tableRow: {
    borderBottom: '1px solid #ddd'
  },
  tableCell: {
    padding: '12px',
    fontSize: '14px',
    color: '#333'
  },
  tableRowHover: {
    backgroundColor: '#f9f9f9'
  },
  emptyMessage: {
    padding: '30px',
    textAlign: 'center',
    color: '#999',
    fontSize: '16px'
  },
  chart: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    marginTop: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  chartTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '15px',
    color: '#333'
  },
  bar: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '12px'
  },
  barLabel: {
    width: '150px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#333'
  },
  barContainer: {
    flex: 1,
    backgroundColor: '#e3f2fd',
    borderRadius: '4px',
    marginRight: '10px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    paddingLeft: '10px'
  },
  barFill: {
    height: '100%',
    backgroundColor: '#2196f3',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    paddingLeft: '5px',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  barValue: {
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#333',
    minWidth: '60px',
    textAlign: 'right'
  }
};

export default function ReportesVentasPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('diario');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [fechaDesde, setFechaDesde] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [fechaHasta, setFechaHasta] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      // TODO: Reemplazar con llamadas reales a la API
      if (tab === 'diario') {
        // Simular datos de reporte diario
        setDatos({
          fecha: fecha,
          total_ventas: 15,
          total_ingresos: 850.50,
          total_descuentos: 45.00,
          total_items_vendidos: 48,
          ticket_promedio: 56.70,
          producto_top: {
            nombre: 'Hamburguesa Premium',
            cantidad: 12,
            ingresos: 180.00
          },
          productos: {
            '1': { nombre: 'Hamburguesa Clásica', cantidad: 8, ingresos: 120.00 },
            '2': { nombre: 'Hamburguesa Premium', cantidad: 12, ingresos: 180.00 },
            '3': { nombre: 'Sándwich de Pollo', cantidad: 10, ingresos: 100.00 },
            '4': { nombre: 'Ensalada Fresca', cantidad: 6, ingresos: 90.00 },
            '5': { nombre: 'Bebida Refrescante', cantidad: 12, ingresos: 36.00 }
          }
        });
      } else {
        // Simular datos de reporte por rango
        setDatos({
          fecha_desde: fechaDesde,
          fecha_hasta: fechaHasta,
          total_ventas: 256,
          total_ingresos: 14850.75,
          total_descuentos: 450.00,
          promedio_por_venta: 58.04,
          dias_operativos: 30,
          ingresos_promedio_diario: 495.02
        });
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.title}>📊 Reportes de Ventas</div>
        <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>
          ← Volver al Dashboard
        </button>
      </div>

      {/* Tabs */}
      <div style={styles.tabContainer}>
        <button
          style={{ ...styles.tab, ...(tab === 'diario' && styles.tabActive) }}
          onClick={() => { setTab('diario'); cargarDatos(); }}
        >
          Reporte Diario
        </button>
        <button
          style={{ ...styles.tab, ...(tab === 'rango' && styles.tabActive) }}
          onClick={() => { setTab('rango'); cargarDatos(); }}
        >
          Reporte por Rango
        </button>
      </div>

      {/* Filtros */}
      {tab === 'diario' ? (
        <div style={styles.filterSection}>
          <div style={styles.filterGrid}>
            <div style={styles.filterGroup}>
              <label style={styles.label}>Fecha:</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                style={styles.input}
              />
            </div>
          </div>
          <div style={styles.filterBtns}>
            <button style={styles.filterBtn} onClick={cargarDatos}>
              {cargando ? 'Cargando...' : 'Cargar Reporte'}
            </button>
          </div>
        </div>
      ) : (
        <div style={styles.filterSection}>
          <div style={styles.filterGrid}>
            <div style={styles.filterGroup}>
              <label style={styles.label}>Desde:</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.filterGroup}>
              <label style={styles.label}>Hasta:</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                style={styles.input}
              />
            </div>
          </div>
          <div style={styles.filterBtns}>
            <button style={styles.filterBtn} onClick={cargarDatos}>
              {cargando ? 'Cargando...' : 'Cargar Reporte'}
            </button>
          </div>
        </div>
      )}

      {/* Métricas */}
      {datos && (
        <>
          <div style={styles.metricsGrid}>
            <div style={styles.metric}>
              <div style={styles.metricValue}>{datos.total_ventas}</div>
              <div style={styles.metricLabel}>TOTAL DE VENTAS</div>
            </div>
            <div style={styles.metric}>
              <div style={styles.metricValue}>${datos.total_ingresos.toFixed(2)}</div>
              <div style={styles.metricLabel}>INGRESOS TOTALES</div>
            </div>
            <div style={styles.metric}>
              <div style={styles.metricValue}>${datos.ticket_promedio?.toFixed(2) || (datos.total_ingresos / datos.total_ventas).toFixed(2)}</div>
              <div style={styles.metricLabel}>TICKET PROMEDIO</div>
            </div>
            <div style={styles.metric}>
              <div style={styles.metricValue}>${datos.total_descuentos.toFixed(2)}</div>
              <div style={styles.metricLabel}>DESCUENTOS OTORGADOS</div>
            </div>
          </div>

          {/* Producto Top */}
          {datos.producto_top && (
            <div style={styles.chart}>
              <div style={styles.chartTitle}>🏆 Producto Más Vendido</div>
              <div style={styles.bar}>
                <div style={styles.barLabel}>{datos.producto_top.nombre}</div>
                <div style={styles.barContainer}>
                  <div style={{
                    ...styles.barFill,
                    width: '100%'
                  }}>
                    {datos.producto_top.cantidad} unidades
                  </div>
                </div>
                <div style={styles.barValue}>${datos.producto_top.ingresos.toFixed(2)}</div>
              </div>
            </div>
          )}

          {/* Productos por Categoría */}
          {datos.productos && (
            <div style={styles.chart}>
              <div style={styles.chartTitle}>📈 Ventas por Producto</div>
              {Object.entries(datos.productos).map(([id, producto]) => {
                const maxIngresos = Math.max(...Object.values(datos.productos).map(p => p.ingresos));
                const porcentaje = (producto.ingresos / maxIngresos) * 100;

                return (
                  <div key={id} style={styles.bar}>
                    <div style={styles.barLabel}>{producto.nombre}</div>
                    <div style={styles.barContainer}>
                      <div style={{
                        ...styles.barFill,
                        width: `${porcentaje}%`
                      }}>
                        {producto.cantidad} unidades
                      </div>
                    </div>
                    <div style={styles.barValue}>${producto.ingresos.toFixed(2)}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Métricas Adicionales */}
          {tab === 'rango' && (
            <div style={styles.metricsGrid}>
              <div style={styles.metric}>
                <div style={styles.metricValue}>{datos.dias_operativos}</div>
                <div style={styles.metricLabel}>DÍAS OPERATIVOS</div>
              </div>
              <div style={styles.metric}>
                <div style={styles.metricValue}>${datos.ingresos_promedio_diario.toFixed(2)}</div>
                <div style={styles.metricLabel}>INGRESOS PROMEDIO DIARIO</div>
              </div>
            </div>
          )}

          {tab === 'diario' && (
            <div style={styles.metricsGrid}>
              <div style={styles.metric}>
                <div style={styles.metricValue}>{datos.total_items_vendidos}</div>
                <div style={styles.metricLabel}>ITEMS VENDIDOS</div>
              </div>
            </div>
          )}
        </>
      )}

      {cargando && !datos && (
        <div style={styles.emptyMessage}>Cargando datos...</div>
      )}

      {!datos && !cargando && (
        <div style={styles.emptyMessage}>No hay datos disponibles</div>
      )}
    </div>
  );
}
