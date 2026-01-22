import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiService';

/**
 * Componente para visualizar comprobantes (comandas)
 * Muestra versiones de cocina y caja
 * Permite imprimir
 */
const ComandaViewer = ({ ventaId, onClose }) => {
  const [comanda, setComanda] = useState(null);
  const [tipo, setTipo] = useState('cocina');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [imprimiendo, setImprimiendo] = useState(false);

  useEffect(() => {
    if (ventaId) {
      cargarComanda();
    }
  }, [ventaId, tipo]);

  const cargarComanda = async () => {
    try {
      setCargando(true);
      setError(null);

      const response = await apiClient.get(`/ventas/${ventaId}/comanda/${tipo}`);

      if (response.data.success) {
        setComanda(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar comanda');
    } finally {
      setCargando(false);
    }
  };

  const imprimirComanda = async () => {
    try {
      setImprimiendo(true);

      // Crear iframe invisible para imprimir
      const printWindow = window.open('', '', 'height=500,width=800');

      if (comanda) {
        printWindow.document.write(comanda.html);
        printWindow.document.close();

        // Esperar a que se cargue el contenido
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    } catch (err) {
      console.error('Error al imprimir:', err);
      alert('Error al imprimir la comanda');
    } finally {
      setImprimiendo(false);
    }
  };

  const marcarImpresa = async () => {
    try {
      await apiClient.put(`/ventas/comanda/${comanda.id}/marcar-impresa`);
      cargarComanda();
    } catch (err) {
      alert('Error al marcar como impresa: ' + err.message);
    }
  };

  if (cargando) {
    return <div style={styles.container}><p>Cargando comanda...</p></div>;
  }

  return (
    <div style={styles.modal}>
      <div style={styles.overlay} onClick={onClose}></div>

      <div style={styles.contenedor}>
        <div style={styles.header}>
          <h2>Comanda #{ventaId}</h2>
          <button onClick={onClose} style={styles.btnCerrar}>✕</button>
        </div>

        <div style={styles.tabs}>
          <button
            onClick={() => setTipo('cocina')}
            style={{
              ...styles.tab,
              ...(tipo === 'cocina' ? styles.tabActivo : {})
            }}
          >
            👨‍🍳 Cocina
          </button>
          <button
            onClick={() => setTipo('caja')}
            style={{
              ...styles.tab,
              ...(tipo === 'caja' ? styles.tabActivo : {})
            }}
          >
            🧾 Caja
          </button>
        </div>

        {error && (
          <div style={styles.error}>
            ⚠️ {error}
          </div>
        )}

        {comanda && (
          <>
            <div
              style={styles.comanda}
              dangerouslySetInnerHTML={{ __html: comanda.html }}
            />

            <div style={styles.acciones}>
              <button
                onClick={imprimirComanda}
                disabled={imprimiendo}
                style={styles.btnImprimir}
              >
                {imprimiendo ? '⏳ Imprimiendo...' : '🖨️ Imprimir'}
              </button>

              {!comanda.impresa && (
                <button
                  onClick={marcarImpresa}
                  style={styles.btnMarcar}
                >
                  ✓ Marcar como impresa
                </button>
              )}

              {comanda.impresa && (
                <div style={styles.badge}>
                  ✓ Impresa
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/**
 * Componente mejorado para el POS con explosión de recetas
 */
const VentasPageMejorada = () => {
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [recetas, setRecetas] = useState([]);
  const [cart, setCart] = useState([]);
  const [cliente, setCliente] = useState('');
  const [mesa, setMesa] = useState('');
  const [descuento, setDescuento] = useState(0);
  const [comentarios, setComentarios] = useState('');
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState(null);
  const [ventaExitosa, setVentaExitosa] = useState(null);
  const [mostrarComanda, setMostrarComanda] = useState(false);
  const [ventaId, setVentaId] = useState(null);
  const [tipoItemSelected, setTipoItemSelected] = useState('producto');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);

      const [productosRes, recetasRes] = await Promise.all([
        apiClient.get('/productos').catch(err => ({ data: { data: [] } })),
        apiClient.get('/recetas').catch(err => ({ data: { data: [] } }))
      ]);

      setProductos(productosRes.data.data || productosRes.data || []);
      setRecetas(recetasRes.data.data || recetasRes.data || []);

      if ((!productosRes.data || !productosRes.data.data || productosRes.data.data.length === 0) &&
        (!recetasRes.data || !recetasRes.data.data || recetasRes.data.data.length === 0)) {
        setError('No hay productos o recetas disponibles');
      }
    } catch (err) {
      setError('Error al cargar datos: ' + (err.message || 'desconocido'));
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  const agregarAlCarrito = async (item, tipo) => {
    try {
      // Validar stock con el backend (recursivo)
      const res = await apiClient.get('/ventas/validar-stock', {
        params: { tipo: tipo, id: item.id, cantidad: 1 }
      });

      if (res.data.success) {
        const stockData = res.data.data;
        if (!stockData.disponible) {
          const faltantesStr = stockData.faltantes
            .map(f => `${f.nombre} (Stock: ${f.stock_actual} / Requerido: ${f.requerido} ${f.unidad || ''})`)
            .join('\n');

          const confirmar = window.confirm(
            `⚠️ ATENCIÓN: Faltan ingredientes para este producto:\n\n${faltantesStr}\n\n¿Deseas agregarlo al carrito de todos modos?`
          );

          if (!confirmar) return;
        }
      }
    } catch (err) {
      console.error('Error validando stock:', err);
      // Si falla la validación (ej: error 500), avisar pero permitir agregar o manejar el error
      const proceed = window.confirm('No se pudo verificar el stock. ¿Deseas agregar el producto de todos modos?');
      if (!proceed) return;
    }

    const nuevoItem = {
      id: `${tipo}-${item.id}-${Date.now()}`, // Agregar timestamp para permitir múltiples entradas del mismo item si se desea o IDs únicos
      tipo: tipo,
      id_ref: item.id,
      nombre: item.nombre,
      precio: tipo === 'producto' ? item.precio : item.precio_venta,
      cantidad: 1,
      observaciones: ''
    };

    setCart([...cart, nuevoItem]);
  };

  const actualizarCantidad = (id, cantidad) => {
    if (cantidad <= 0) {
      eliminarDelCarrito(id);
    } else {
      setCart(cart.map(item =>
        item.id === id ? { ...item, cantidad } : item
      ));
    }
  };

  const actualizarObservaciones = (id, observaciones) => {
    setCart(cart.map(item =>
      item.id === id ? { ...item, observaciones } : item
    ));
  };

  const eliminarDelCarrito = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const calcularTotales = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const descuentoMonto = subtotal * (descuento / 100);
    const subtotalDesc = subtotal - descuentoMonto;
    const iva = subtotalDesc * 0.19;
    const propina = subtotalDesc * 0.10;
    const total = subtotalDesc + iva + propina;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      descuentoMonto: Math.round(descuentoMonto * 100) / 100,
      subtotalDesc: Math.round(subtotalDesc * 100) / 100,
      iva: Math.round(iva * 100) / 100,
      propina: Math.round(propina * 100) / 100,
      total: Math.round(total * 100) / 100
    };
  };

  const procesarVenta = async () => {
    if (cart.length === 0) {
      setError('El carrito está vacío');
      return;
    }

    try {
      setProcesando(true);
      setError(null);

      const items = cart.map(item => ({
        tipo: item.tipo,
        id: item.id_ref,
        cantidad: item.cantidad,
        precio_unitario: item.precio,
        observaciones: item.observaciones
      }));

      const response = await apiClient.post('/ventas/crear-con-explosion', {
        items,
        cliente_nombre: cliente,
        numero_mesa: mesa,
        descuento,
        comentarios
      });

      if (response.data.success) {
        const venta = response.data.data;
        setVentaExitosa(venta);
        setVentaId(venta.venta_id);
        setMostrarComanda(true);

        // Limpiar carrito
        setCart([]);
        setCliente('');
        setMesa('');
        setDescuento(0);
        setComentarios('');

        // Recargar productos (stock actualizado)
        setTimeout(() => {
          cargarDatos();
          setVentaExitosa(null);
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al procesar venta');
    } finally {
      setProcesando(false);
    }
  };

  const totales = calcularTotales();
  const hayItems = cart.length > 0;

  if (cargando) {
    return <div style={styles.container}><p>Cargando...</p></div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>🛒 Punto de Venta - Sistema de Explosión de Recetas</h1>
        <button
          onClick={() => navigate('/dashboard')}
          style={styles.btnVolver}
          title="Volver al menú principal"
        >
          ← Volver al Menú
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {ventaExitosa && (
        <div style={styles.exito}>
          ✓ Venta #{ventaExitosa.venta_id} procesada exitosamente
        </div>
      )}

      <div style={styles.mainContent}>
        {/* Panel Izquierdo: Productos y Recetas */}
        <div style={styles.leftPanel}>
          <div style={styles.tabs}>
            <button
              onClick={() => setTipoItemSelected('producto')}
              style={{
                ...styles.tab,
                ...(tipoItemSelected === 'producto' ? styles.tabActivo : {})
              }}
            >
              📦 Productos ({productos.length})
            </button>
            <button
              onClick={() => setTipoItemSelected('receta')}
              style={{
                ...styles.tab,
                ...(tipoItemSelected === 'receta' ? styles.tabActivo : {})
              }}
            >
              🍽️ Recetas ({recetas.length})
            </button>
          </div>

          <div style={styles.grid}>
            {tipoItemSelected === 'producto' && productos.map(producto => (
              <div key={producto.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <strong>{producto.nombre}</strong>
                </div>
                <div style={styles.cardBody}>
                  <p style={styles.precio}>${producto.precio}</p>
                  <p style={{ fontSize: '0.85em', color: '#666' }}>
                    Stock: {producto.stock}
                  </p>
                </div>
                <button
                  onClick={() => agregarAlCarrito(producto, 'producto')}
                  style={styles.btnAgregar}
                >
                  ➕ Agregar
                </button>
              </div>
            ))}

            {tipoItemSelected === 'receta' && recetas.map(receta => (
              <div key={receta.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <strong>{receta.nombre}</strong>
                </div>
                <div style={styles.cardBody}>
                  <p style={styles.precio}>${receta.precio_venta}</p>
                  <p style={{ fontSize: '0.8em', color: '#666' }}>
                    Costo: ${receta.costo_por_porcion}
                  </p>
                  <p style={{ fontSize: '0.8em', color: '#009900', fontWeight: 'bold' }}>
                    Margen: {receta.margen_porcentaje}%
                  </p>
                </div>
                <button
                  onClick={() => agregarAlCarrito(receta, 'receta')}
                  style={styles.btnAgregar}
                >
                  ➕ Agregar
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Panel Derecho: Carrito */}
        <div style={styles.rightPanel}>
          <h3>🛒 Carrito</h3>

          {/* Información del Cliente */}
          <div style={styles.formGroup}>
            <label>Cliente:</label>
            <input
              type="text"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              placeholder="Nombre del cliente"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label>Mesa:</label>
            <input
              type="text"
              value={mesa}
              onChange={(e) => setMesa(e.target.value)}
              placeholder="Número de mesa"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label>Comentarios:</label>
            <textarea
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              placeholder="Observaciones generales"
              style={{ ...styles.input, minHeight: '60px' }}
            />
          </div>

          <hr style={{ margin: '10px 0' }} />

          {/* Items del Carrito */}
          <div style={styles.cartItems}>
            {cart.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#999' }}>
                Carrito vacío
              </p>
            ) : (
              cart.map(item => (
                <div key={item.id} style={styles.cartItem}>
                  <div style={styles.cartItemInfo}>
                    <strong>{item.nombre}</strong>
                    <p style={{ fontSize: '0.9em', margin: '2px 0' }}>
                      ${item.precio} c/u
                    </p>
                    {item.tipo === 'receta' && (
                      <p style={{ fontSize: '0.8em', color: '#666' }}>
                        (Receta - explosión automática)
                      </p>
                    )}
                  </div>

                  <div style={styles.cartItemControls}>
                    <input
                      type="number"
                      min="1"
                      value={item.cantidad}
                      onChange={(e) => actualizarCantidad(item.id, parseInt(e.target.value))}
                      style={{ ...styles.input, width: '50px' }}
                    />
                    <span>${(item.precio * item.cantidad).toFixed(2)}</span>
                    <button
                      onClick={() => eliminarDelCarrito(item.id)}
                      style={styles.btnEliminar}
                    >
                      ✕
                    </button>
                  </div>

                  <input
                    type="text"
                    value={item.observaciones}
                    onChange={(e) => actualizarObservaciones(item.id, e.target.value)}
                    placeholder="Observaciones (ej: sin picante)"
                    style={{ ...styles.input, marginTop: '5px', fontSize: '0.9em' }}
                  />
                </div>
              ))
            )}
          </div>

          <hr style={{ margin: '10px 0' }} />

          {/* Descuento */}
          <div style={styles.formGroup}>
            <label>Descuento (%):</label>
            <input
              type="number"
              min="0"
              max="100"
              value={descuento}
              onChange={(e) => setDescuento(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
              style={styles.input}
            />
          </div>

          {/* Cálculos */}
          {hayItems && (
            <div style={styles.totals}>
              <div style={styles.totalRow}>
                <span>Subtotal:</span>
                <strong>${totales.subtotal.toFixed(2)}</strong>
              </div>

              {descuento > 0 && (
                <div style={{ ...styles.totalRow, color: 'green' }}>
                  <span>Descuento ({descuento}%):</span>
                  <strong>-${totales.descuentoMonto.toFixed(2)}</strong>
                </div>
              )}

              <div style={styles.totalRow}>
                <span>Neto:</span>
                <strong>${totales.subtotalDesc.toFixed(2)}</strong>
              </div>

              <div style={styles.totalRow}>
                <span>IVA (19%):</span>
                <strong>${totales.iva.toFixed(2)}</strong>
              </div>

              <div style={styles.totalRow}>
                <span>Propina (10%):</span>
                <strong>${totales.propina.toFixed(2)}</strong>
              </div>

              <div style={styles.totalRowFinal}>
                <span>TOTAL:</span>
                <strong>${totales.total.toFixed(2)}</strong>
              </div>
            </div>
          )}

          {/* Botón Procesar */}
          <button
            onClick={procesarVenta}
            disabled={!hayItems || procesando}
            style={{
              ...styles.btnProcesar,
              opacity: (!hayItems || procesando) ? 0.5 : 1,
              cursor: (!hayItems || procesando) ? 'not-allowed' : 'pointer'
            }}
          >
            {procesando ? '⏳ Procesando...' : '✓ PROCESAR VENTA'}
          </button>
        </div>
      </div>

      {/* Modal de Comanda */}
      {mostrarComanda && ventaId && (
        <ComandaViewer
          ventaId={ventaId}
          onClose={() => setMostrarComanda(false)}
        />
      )}
    </div>
  );
};

// Estilos
const styles = {
  container: {
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh'
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
    transition: 'all 0.3s ease'
  },
  mainContent: {
    display: 'grid',
    gridTemplateColumns: '1fr 400px',
    gap: '20px',
    marginTop: '20px'
  },
  leftPanel: {
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  rightPanel: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '90vh',
    overflow: 'auto'
  },
  tabs: {
    display: 'flex',
    borderBottom: '2px solid #e0e0e0',
    backgroundColor: '#f9f9f9'
  },
  tab: {
    flex: 1,
    padding: '10px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '0.95em',
    fontWeight: 'bold',
    color: '#666',
    borderBottom: '3px solid transparent',
    transition: 'all 0.3s ease'
  },
  tabActivo: {
    color: '#2196F3',
    borderBottomColor: '#2196F3'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '10px',
    padding: '15px'
  },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: '6px',
    overflow: 'hidden',
    border: '1px solid #e0e0e0',
    transition: 'transform 0.2s'
  },
  cardHeader: {
    padding: '8px',
    backgroundColor: '#f0f0f0',
    borderBottom: '1px solid #e0e0e0',
    fontSize: '0.9em'
  },
  cardBody: {
    padding: '8px'
  },
  precio: {
    color: '#2196F3',
    fontSize: '1.1em',
    fontWeight: 'bold',
    margin: '5px 0'
  },
  btnAgregar: {
    width: '100%',
    padding: '6px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.85em',
    fontWeight: 'bold'
  },
  cartItems: {
    flex: 1,
    overflowY: 'auto',
    marginBottom: '10px'
  },
  cartItem: {
    borderBottom: '1px solid #e0e0e0',
    paddingBottom: '10px',
    marginBottom: '10px',
    paddingTop: '10px'
  },
  cartItemInfo: {
    marginBottom: '5px'
  },
  cartItemControls: {
    display: 'flex',
    gap: '5px',
    alignItems: 'center',
    marginBottom: '5px'
  },
  btnEliminar: {
    padding: '3px 8px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '3px'
  },
  formGroup: {
    marginBottom: '10px'
  },
  input: {
    width: '100%',
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '0.95em',
    boxSizing: 'border-box'
  },
  totals: {
    borderTop: '2px solid #333',
    paddingTop: '10px',
    marginBottom: '10px'
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '5px',
    fontSize: '0.95em'
  },
  totalRowFinal: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '1.2em',
    fontWeight: 'bold',
    borderTop: '2px solid #333',
    paddingTop: '10px',
    marginTop: '10px'
  },
  btnProcesar: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    fontSize: '1em',
    fontWeight: 'bold',
    cursor: 'pointer',
    borderRadius: '4px'
  },
  error: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '10px',
    borderLeft: '4px solid #f44336'
  },
  exito: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '10px',
    borderLeft: '4px solid #4CAF50'
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    cursor: 'pointer'
  },
  contenedor: {
    backgroundColor: 'white',
    borderRadius: '8px',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflow: 'auto',
    zIndex: 1001,
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
  },
  comandaHeader: {
    padding: '15px',
    borderBottom: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9'
  },
  btnCerrar: {
    background: 'none',
    border: 'none',
    fontSize: '1.5em',
    cursor: 'pointer'
  },
  comanda: {
    padding: '20px',
    overflow: 'auto'
  },
  acciones: {
    padding: '15px',
    borderTop: '1px solid #e0e0e0',
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  btnImprimir: {
    padding: '10px 20px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  btnMarcar: {
    padding: '10px 20px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  badge: {
    padding: '10px 20px',
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    borderRadius: '4px',
    fontWeight: 'bold',
    borderLeft: '4px solid #4CAF50'
  }
};

export default VentasPageMejorada;
