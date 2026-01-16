/**
 * Página de Punto de Venta (POS)
 * Sistema integrado de ventas para productos
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { recetasService } from '../services/apiService';

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    backgroundColor: '#f5f5f5',
    fontFamily: 'Arial, sans-serif'
  },
  panel: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto'
  },
  leftPanel: {
    backgroundColor: '#fff',
    borderRight: '1px solid #ddd'
  },
  rightPanel: {
    backgroundColor: '#f9f9f9',
    maxWidth: '400px'
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#333'
  },
  subtitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '15px',
    color: '#555'
  },
  productGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '10px'
  },
  productCard: {
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '15px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textAlign: 'center'
  },
  productCardHover: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
    transform: 'translateY(-2px)'
  },
  productName: {
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#333',
    fontSize: '14px'
  },
  productPrice: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#4caf50',
    marginBottom: '8px'
  },
  productStock: {
    fontSize: '12px',
    color: '#999',
    marginBottom: '8px'
  },
  cartItem: {
    backgroundColor: '#fff',
    borderBottom: '1px solid #ddd',
    padding: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  cartItemLeft: {
    flex: 1
  },
  cartItemName: {
    fontWeight: 'bold',
    fontSize: '14px',
    marginBottom: '4px'
  },
  cartItemPrice: {
    fontSize: '12px',
    color: '#666'
  },
  cartItemRight: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  },
  quantityInput: {
    width: '50px',
    padding: '4px 8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    textAlign: 'center',
    fontSize: '14px'
  },
  removeBtn: {
    backgroundColor: '#f44336',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 8px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  summary: {
    backgroundColor: '#fff',
    padding: '15px',
    borderRadius: '8px',
    marginTop: '15px',
    borderTop: '2px solid #ddd'
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
    fontSize: '14px'
  },
  summaryTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#4caf50',
    borderTop: '1px solid #ddd',
    paddingTop: '10px',
    marginTop: '10px'
  },
  checkoutBtn: {
    width: '100%',
    padding: '15px',
    backgroundColor: '#4caf50',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '15px',
    transition: 'background-color 0.3s ease'
  },
  checkoutBtnDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed'
  },
  form: {
    backgroundColor: '#fff',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '15px'
  },
  formGroup: {
    marginBottom: '12px'
  },
  label: {
    display: 'block',
    marginBottom: '4px',
    fontWeight: 'bold',
    fontSize: '12px',
    color: '#333'
  },
  input: {
    width: '100%',
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '12px',
    boxSizing: 'border-box'
  },
  alert: {
    padding: '12px',
    backgroundColor: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '4px',
    marginBottom: '15px',
    color: '#856404',
    fontSize: '14px'
  },
  alertError: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
    color: '#721c24'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '15px',
    borderBottom: '2px solid #ddd'
  },
  headerTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333'
  },
  logoutBtn: {
    backgroundColor: '#f44336',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  }
};

export default function VentasPage() {
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [cart, setCart] = useState([]);
  const [cliente, setCliente] = useState('');
  const [mesa, setMesa] = useState('');
  const [descuento, setDescuento] = useState(0);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      // TODO: Cambiar a endpoint real de productos
      // Por ahora usamos recetas como productos
      const datos = await recetasService.listar();
      const productosSimulados = datos.recetas.map(r => ({
        id: r.id,
        nombre: r.nombre,
        precio: r.precio_venta || 5.00,
        stock: 100, // Simulado
        costo: r.costo_total || 0
      }));
      setProductos(productosSimulados);
    } catch (err) {
      setError('Error cargando productos');
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  const agregarAlCarrito = (producto) => {
    if (producto.stock <= 0) {
      setError('Producto sin stock');
      return;
    }

    const itemExistente = cart.find(item => item.id === producto.id);

    if (itemExistente) {
      if (itemExistente.cantidad < producto.stock) {
        setCart(cart.map(item =>
          item.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        ));
      } else {
        setError('No hay más stock disponible');
      }
    } else {
      setCart([...cart, { ...producto, cantidad: 1 }]);
    }
    setError('');
  };

  const cambiarCantidad = (productoId, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(productoId);
      return;
    }

    const producto = productos.find(p => p.id === productoId);
    if (nuevaCantidad > producto.stock) {
      setError('Cantidad excede el stock disponible');
      return;
    }

    setCart(cart.map(item =>
      item.id === productoId
        ? { ...item, cantidad: nuevaCantidad }
        : item
    ));
  };

  const eliminarDelCarrito = (productoId) => {
    setCart(cart.filter(item => item.id !== productoId));
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

    setCargando(true);
    try {
      // TODO: Llamar a endpoint de crear venta
      // await ventasService.crearVenta(...)

      setMensaje('✓ Venta procesada correctamente');
      setCart([]);
      setCliente('');
      setMesa('');
      setDescuento(0);

      setTimeout(() => setMensaje(''), 3000);
    } catch (err) {
      setError('Error al procesar venta: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  const totales = calcularTotales();

  if (cargando) {
    return <div style={styles.container}><div style={styles.panel}>Cargando...</div></div>;
  }

  return (
    <div style={styles.container}>
      {/* Panel Izquierdo - Productos */}
      <div style={{ ...styles.panel, ...styles.leftPanel }}>
        <div style={styles.header}>
          <div style={styles.headerTitle}>🛒 Punto de Venta</div>
          <button style={styles.logoutBtn} onClick={() => navigate('/login')}>
            Salir
          </button>
        </div>

        <div style={styles.title}>Productos Disponibles</div>

        <div style={styles.productGrid}>
          {productos.map(producto => (
            <div
              key={producto.id}
              style={styles.productCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e3f2fd';
                e.currentTarget.style.borderColor = '#2196f3';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fff';
                e.currentTarget.style.borderColor = '#ddd';
              }}
              onClick={() => agregarAlCarrito(producto)}
            >
              <div style={styles.productName}>{producto.nombre}</div>
              <div style={styles.productPrice}>${producto.precio.toFixed(2)}</div>
              <div style={styles.productStock}>
                Stock: {producto.stock > 0 ? producto.stock : 'Agotado'}
              </div>
              <button
                style={{
                  width: '100%',
                  padding: '6px',
                  backgroundColor: producto.stock > 0 ? '#2196f3' : '#ccc',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: producto.stock > 0 ? 'pointer' : 'not-allowed',
                  fontSize: '12px'
                }}
                disabled={producto.stock <= 0}
              >
                {producto.stock > 0 ? 'Agregar' : 'Sin stock'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Panel Derecho - Carrito */}
      <div style={{ ...styles.panel, ...styles.rightPanel }}>
        <div style={styles.title}>Carrito de Compra</div>

        {mensaje && (
          <div style={styles.alert}>{mensaje}</div>
        )}

        {error && (
          <div style={{ ...styles.alert, ...styles.alertError }}>{error}</div>
        )}

        {/* Formulario de Cliente */}
        <div style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Nombre Cliente:</label>
            <input
              type="text"
              style={styles.input}
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              placeholder="Opcional"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Número de Mesa:</label>
            <input
              type="number"
              style={styles.input}
              value={mesa}
              onChange={(e) => setMesa(e.target.value)}
              placeholder="Opcional"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Descuento (%):</label>
            <input
              type="number"
              style={styles.input}
              value={descuento}
              onChange={(e) => setDescuento(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
              min="0"
              max="100"
            />
          </div>
        </div>

        {/* Ítems del Carrito */}
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', marginBottom: '15px' }}>
          {cart.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
              Carrito vacío
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} style={styles.cartItem}>
                <div style={styles.cartItemLeft}>
                  <div style={styles.cartItemName}>{item.nombre}</div>
                  <div style={styles.cartItemPrice}>
                    ${item.precio.toFixed(2)} c/u
                  </div>
                </div>
                <div style={styles.cartItemRight}>
                  <input
                    type="number"
                    min="1"
                    value={item.cantidad}
                    onChange={(e) => cambiarCantidad(item.id, parseInt(e.target.value))}
                    style={styles.quantityInput}
                  />
                  <button
                    style={styles.removeBtn}
                    onClick={() => eliminarDelCarrito(item.id)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Resumen de Totales */}
        {cart.length > 0 && (
          <div style={styles.summary}>
            <div style={styles.summaryRow}>
              <span>Subtotal:</span>
              <span>${totales.subtotal.toFixed(2)}</span>
            </div>
            {descuento > 0 && (
              <div style={styles.summaryRow}>
                <span>Descuento ({descuento}%):</span>
                <span>-${totales.descuentoMonto.toFixed(2)}</span>
              </div>
            )}
            <div style={styles.summaryRow}>
              <span>Subtotal Neto:</span>
              <span>${totales.subtotalDesc.toFixed(2)}</span>
            </div>
            <div style={styles.summaryRow}>
              <span>IVA (19%):</span>
              <span>${totales.iva.toFixed(2)}</span>
            </div>
            <div style={styles.summaryRow}>
              <span>Propina (10%):</span>
              <span>${totales.propina.toFixed(2)}</span>
            </div>
            <div style={styles.summaryTotal}>
              <span>TOTAL:</span>
              <span>${totales.total.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Botón de Checkout */}
        <button
          style={{
            ...styles.checkoutBtn,
            ...(cart.length === 0 && styles.checkoutBtnDisabled)
          }}
          onClick={procesarVenta}
          disabled={cart.length === 0 || cargando}
        >
          {cargando ? 'Procesando...' : 'PROCESAR VENTA'}
        </button>
      </div>
    </div>
  );
}
