import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiService';

/**
 * Componente de Reportes Avanzados
 * - Reporte por hora
 * - Reporte por día
 * - Reporte detallado
 */
const ReportesVentasAvanzado = () => {
  const navigate = useNavigate();
  const [tipoReporte, setTipoReporte] = useState('hora');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [fechaInicio, setFechaInicio] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);

  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarReporte();
  }, [tipoReporte]);

  const cargarReporte = async () => {
    try {
      setCargando(true);
      setError(null);

      let response;
      if (tipoReporte === 'hora') {
        response = await apiClient.get('/ventas/reportes/por-hora', {
          params: { fecha }
        });
      } else if (tipoReporte === 'dia') {
        response = await apiClient.get('/ventas/reportes/por-dia', {
          params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin }
        });
      } else {
        response = await apiClient.get('/ventas/reportes/detallado', {
          params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin }
        });
      }

      if (response.data.success) {
        setReporte(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar reporte');
    } finally {
      setCargando(false);
    }
  };

  const descargarCSV = () => {
    if (!reporte) return;

    let csv = '';
    if (tipoReporte === 'hora') {
      csv = generarCSVHora();
    } else if (tipoReporte === 'dia') {
      csv = generarCSVDia();
    } else {
      csv = generarCSVDetallado();
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-ventas-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const generarCSVHora = () => {
    let csv = 'Hora,Cantidad Ventas,Total Ingresos,Ticket Promedio\n';
    (reporte.horas || []).forEach(([hora, datos]) => {
      csv += `${hora},${datos.cantidad_ventas || 0},${(datos.total_ingresos || 0).toFixed(2)},${(datos.ticket_promedio || 0).toFixed(2)}\n`;
    });
    return csv;
  };

  const generarCSVDia = () => {
    let csv = 'Fecha,Cantidad Ventas,Total Ingresos,Total Descuentos,Ticket Promedio\n';
    (reporte.dias || []).forEach(([dia, datos]) => {
      csv += `${dia},${datos.cantidad_ventas || 0},${(datos.total_ingresos || 0).toFixed(2)},${(datos.total_descuentos || 0).toFixed(2)},${(datos.ticket_promedio || 0).toFixed(2)}\n`;
    });
    return csv;
  };

  const generarCSVDetallado = () => {
    let csv = 'Resumen General\n';
    const resumen = reporte.resumen || {};
    csv += `Cantidad de Ventas,${resumen.cantidad_ventas || 0}\n`;
    csv += `Total Ingresos,${(resumen.total_ingresos || 0).toFixed(2)}\n`;
    csv += `Total Descuentos,${(resumen.total_descuentos || 0).toFixed(2)}\n`;
    csv += `Total IVA,${(resumen.total_iva || 0).toFixed(2)}\n`;
    csv += `Ticket Promedio,${(resumen.ticket_promedio || 0).toFixed(2)}\n\n`;

    csv += 'Productos Vendidos\n';
    csv += 'Producto,Cantidad,Ingresos\n';
    Object.entries(reporte.productos || {}).forEach(([nombre, datos]) => {
      csv += `${nombre},${datos.cantidad || 0},${(datos.ingresos || 0).toFixed(2)}\n`;
    });

    csv += '\nRecetas Vendidas\n';
    csv += 'Receta,Cantidad,Ingresos,Costo\n';
    Object.entries(reporte.recetas || {}).forEach(([nombre, datos]) => {
      csv += `${nombre},${datos.cantidad || 0},${(datos.ingresos || 0).toFixed(2)},${(datos.costo || 0).toFixed(2)}\n`;
    });

    return csv;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>📊 Reportes Avanzados de Ventas</h1>
        <button
          onClick={() => navigate('/dashboard')}
          style={styles.btnVolver}
          title="Volver al menú principal"
        >
          ← Volver al Menú
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* Selector de tipo de reporte */}
      <div style={styles.selectorReporte}>
        <button
          onClick={() => { setTipoReporte('hora'); }}
          style={{
            ...styles.tabBtn,
            ...(tipoReporte === 'hora' ? styles.tabBtnActivo : {})
          }}
        >
          🕐 Por Hora
        </button>
        <button
          onClick={() => { setTipoReporte('dia'); }}
          style={{
            ...styles.tabBtn,
            ...(tipoReporte === 'dia' ? styles.tabBtnActivo : {})
          }}
        >
          📅 Por Día
        </button>
        <button
          onClick={() => { setTipoReporte('detallado'); }}
          style={{
            ...styles.tabBtn,
            ...(tipoReporte === 'detallado' ? styles.tabBtnActivo : {})
          }}
        >
          📈 Detallado
        </button>
      </div>

      {/* Filtros */}
      <div style={styles.filtros}>
        {tipoReporte === 'hora' && (
          <div>
            <label>Fecha:</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => { setFecha(e.target.value); }}
              style={styles.input}
            />
            <button onClick={cargarReporte} style={styles.btnCargar}>
              {cargando ? '⏳' : '🔄'} Recargar
            </button>
          </div>
        )}

        {(tipoReporte === 'dia' || tipoReporte === 'detallado') && (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div>
              <label>Desde:</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => { setFechaInicio(e.target.value); }}
                style={styles.input}
              />
            </div>
            <div>
              <label>Hasta:</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => { setFechaFin(e.target.value); }}
                style={styles.input}
              />
            </div>
            <button
              onClick={cargarReporte}
              style={{ ...styles.btnCargar, alignSelf: 'flex-end' }}
            >
              {cargando ? '⏳' : '🔄'} Recargar
            </button>
          </div>
        )}
      </div>

      {/* Reporte Por Hora */}
      {tipoReporte === 'hora' && reporte && (
        <div style={styles.reporteSection}>
          <h2>Ventas del {fecha}</h2>
          <div style={styles.metricas}>
            <div style={styles.metrica}>
              <strong>Total Ventas</strong>
              <p>{reporte.total_ventas || 0}</p>
            </div>
            <div style={styles.metrica}>
              <strong>Total Ingresos</strong>
              <p>${(reporte.total_ingresos || 0).toFixed(2)}</p>
            </div>
            <div style={styles.metrica}>
              <strong>Total Items</strong>
              <p>{reporte.total_items || 0}</p>
            </div>
          </div>

          <div style={styles.tabla}>
            <h3>Desglose por Hora</h3>
            <table>
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Ventas</th>
                  <th>Ingresos</th>
                  <th>Ticket Promedio</th>
                </tr>
              </thead>
              <tbody>
                {(reporte.horas || []).map(([hora, datos]) => (
                  <tr key={hora}>
                    <td>{hora}</td>
                    <td>{datos.cantidad_ventas || 0}</td>
                    <td>${(datos.total_ingresos || 0).toFixed(2)}</td>
                    <td>${(datos.ticket_promedio || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(reporte.horas || []).length > 0 && (
            <div style={styles.grafico}>
              <h3>Ingresos por Hora</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '5px', height: '200px' }}>
                {(reporte.horas || []).map(([hora, datos]) => {
                  const maxIngresos = Math.max(...(reporte.horas || []).map(h => h[1].total_ingresos || 0)) || 1;
                  const altura = ((datos.total_ingresos || 0) / maxIngresos) * 150 || 5;
                  return (
                    <div key={hora} style={{ textAlign: 'center', flex: 1 }}>
                      <div
                        style={{
                          backgroundColor: '#2196F3',
                          height: `${altura}px`,
                          marginBottom: '5px',
                          borderRadius: '4px 4px 0 0'
                        }}
                        title={`${hora}: $${(datos.total_ingresos || 0).toFixed(2)}`}
                      ></div>
                      <small>{hora}</small>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reporte Por Día */}
      {tipoReporte === 'dia' && reporte && (
        <div style={styles.reporteSection}>
          <h2>Ventas de {fechaInicio} a {fechaFin}</h2>
          <div style={styles.metricas}>
            <div style={styles.metrica}>
              <strong>Total Ventas</strong>
              <p>{reporte.total_ventas || 0}</p>
            </div>
            <div style={styles.metrica}>
              <strong>Total Ingresos</strong>
              <p>${(reporte.total_ingresos || 0).toFixed(2)}</p>
            </div>
            <div style={styles.metrica}>
              <strong>Promedio Diario</strong>
              <p>${((reporte.total_ingresos || 0) / (reporte.dias?.length || 1)).toFixed(2)}</p>
            </div>
          </div>

          <div style={styles.tabla}>
            <h3>Desglose por Día</h3>
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Ventas</th>
                  <th>Ingresos</th>
                  <th>Descuentos</th>
                  <th>Ticket Promedio</th>
                </tr>
              </thead>
              <tbody>
                {(reporte.dias || []).map(([dia, datos]) => (
                  <tr key={dia}>
                    <td>{dia}</td>
                    <td>{datos.cantidad_ventas || 0}</td>
                    <td>${(datos.total_ingresos || 0).toFixed(2)}</td>
                    <td>${(datos.total_descuentos || 0).toFixed(2)}</td>
                    <td>${(datos.ticket_promedio || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(reporte.dias || []).length > 0 && (
            <div style={styles.tabla}>
              <h3>Productos Más Vendidos</h3>
              {(reporte.dias || []).map(([dia, datos]) => (
                <div key={dia} style={{ marginBottom: '20px' }}>
                  <h4>{dia}</h4>
                  <table style={{ width: '100%', fontSize: '0.9em' }}>
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(datos.productos_mas_vendidos || {})
                        .sort((a, b) => (b[1] || 0) - (a[1] || 0))
                        .map(([nombre, cantidad]) => (
                          <tr key={nombre}>
                            <td>{nombre}</td>
                            <td>{cantidad || 0}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reporte Detallado */}
      {tipoReporte === 'detallado' && reporte && (
        <div style={styles.reporteSection}>
          <h2>Reporte Detallado de {fechaInicio} a {fechaFin}</h2>

          {(() => {
            const resumen = reporte.resumen || {};
            return (
              <div style={styles.metricas}>
                <div style={styles.metrica}>
                  <strong>Cantidad de Ventas</strong>
                  <p>{resumen.cantidad_ventas || 0}</p>
                </div>
                <div style={styles.metrica}>
                  <strong>Total Ingresos</strong>
                  <p>${(resumen.total_ingresos || 0).toFixed(2)}</p>
                </div>
                <div style={styles.metrica}>
                  <strong>Total Descuentos</strong>
                  <p>${(resumen.total_descuentos || 0).toFixed(2)}</p>
                </div>
                <div style={styles.metrica}>
                  <strong>Total IVA</strong>
                  <p>${(resumen.total_iva || 0).toFixed(2)}</p>
                </div>
                <div style={styles.metrica}>
                  <strong>Ticket Promedio</strong>
                  <p>${(resumen.ticket_promedio || 0).toFixed(2)}</p>
                </div>
              </div>
            );
          })()}

          {reporte.productos && Object.keys(reporte.productos).length > 0 && (
            <div style={styles.tabla}>
              <h3>📦 Productos Vendidos</h3>
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Ingresos</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(reporte.productos)
                    .sort((a, b) => (b[1].ingresos || 0) - (a[1].ingresos || 0))
                    .map(([nombre, datos]) => (
                      <tr key={nombre}>
                        <td>{nombre}</td>
                        <td>{datos.cantidad || 0}</td>
                        <td>${(datos.ingresos || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {reporte.recetas && Object.keys(reporte.recetas).length > 0 && (
            <div style={styles.tabla}>
              <h3>🍽️ Recetas Vendidas</h3>
              <table>
                <thead>
                  <tr>
                    <th>Receta</th>
                    <th>Cantidad</th>
                    <th>Ingresos</th>
                    <th>Costo</th>
                    <th>Utilidad</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(reporte.recetas)
                    .sort((a, b) => (b[1].ingresos || 0) - (a[1].ingresos || 0))
                    .map(([nombre, datos]) => {
                      const utilidad = (datos.ingresos || 0) - (datos.costo || 0);
                      return (
                        <tr key={nombre}>
                          <td>{nombre}</td>
                          <td>{datos.cantidad || 0}</td>
                          <td>${(datos.ingresos || 0).toFixed(2)}</td>
                          <td>${(datos.costo || 0).toFixed(2)}</td>
                          <td style={{ color: utilidad > 0 ? 'green' : 'red' }}>
                            ${utilidad.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}

          {reporte.ventas && reporte.ventas.length > 0 && (
            <div style={styles.tabla}>
              <h3>Últimas Ventas</h3>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>Items</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {reporte.ventas.map((venta) => (
                    <tr key={venta.id}>
                      <td>{venta.id}</td>
                      <td>{new Date(venta.fecha).toLocaleString()}</td>
                      <td>{venta.cliente || 'N/A'}</td>
                      <td>{venta.items_count || 0}</td>
                      <td>${(venta.total || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Botón de descarga */}
      {reporte && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button onClick={descargarCSV} style={styles.btnDescargar}>
            📥 Descargar como CSV
          </button>
        </div>
      )}

      {cargando && <p style={{ textAlign: 'center', color: '#666' }}>Cargando...</p>}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '15px',
    borderBottom: '2px solid #e0e0e0'
  },
  btnVolver: {
    padding: '10px 20px',
    backgroundColor: '#FF9800',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.95em',
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: '#F57C00'
    }
  },
  selectorReporte: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    borderBottom: '2px solid #e0e0e0',
    paddingBottom: '10px'
  },
  tabBtn: {
    padding: '10px 20px',
    backgroundColor: '#f0f0f0',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '4px',
    fontWeight: 'bold',
    transition: 'all 0.3s'
  },
  tabBtnActivo: {
    backgroundColor: '#2196F3',
    color: 'white'
  },
  filtros: {
    backgroundColor: '#f9f9f9',
    padding: '15px',
    borderRadius: '4px',
    marginBottom: '20px'
  },
  input: {
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    marginRight: '10px'
  },
  btnCargar: {
    padding: '8px 15px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  btnDescargar: {
    padding: '12px 25px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1em',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  reporteSection: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '4px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  metricas: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '15px',
    marginBottom: '20px'
  },
  metrica: {
    backgroundColor: '#f0f0f0',
    padding: '15px',
    borderRadius: '4px',
    textAlign: 'center'
  },
  tabla: {
    marginBottom: '30px'
  },
  grafico: {
    backgroundColor: '#f9f9f9',
    padding: '20px',
    borderRadius: '4px',
    marginTop: '20px'
  },
  error: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '10px'
  }
};

export default ReportesVentasAvanzado;
