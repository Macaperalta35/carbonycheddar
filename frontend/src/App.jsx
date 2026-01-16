
import React, { useEffect, useState } from 'react'
import './App.css'

export default function App() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Cargar productos
  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:5000/api/productos')
      const data = await response.json()
      setProducts(data)
      setError(null)
    } catch (err) {
      setError('Error al cargar productos: ' + err.message)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Login
  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await response.json()
      
      if (response.ok) {
        setIsLoggedIn(true)
        setUsername('')
        setPassword('')
        setError(null)
      } else {
        setError(data.error || 'Credenciales inválidas')
      }
    } catch (err) {
      setError('Error en login: ' + err.message)
    }
  }

  // Agregar al carrito
  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id)
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      ))
    } else {
      setCart([...cart, { ...product, cantidad: 1 }])
    }
  }

  // Remover del carrito
  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId))
  }

  // Procesar venta
  const handleCheckout = async () => {
    if (cart.length === 0) {
      setError('El carrito está vacío')
      return
    }

    try {
      const total = cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0)
      
      const response = await fetch('http://localhost:5000/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          total: total,
          usuario: username
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setError(null)
        setCart([])
        alert('¡Venta registrada exitosamente!')
      } else {
        setError('Error al registrar venta')
      }
    } catch (err) {
      setError('Error en checkout: ' + err.message)
    }
  }

  // Logout
  const handleLogout = () => {
    setIsLoggedIn(false)
    setCart([])
    setUsername('')
    setPassword('')
  }

  // Pantalla de Login
  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1>🍔 Carbon & Cheddar</h1>
          <p className="subtitle">Sistema de Ventas</p>
          
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Usuario</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingrese usuario"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingrese contraseña"
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}
            
            <button type="submit" className="btn-primary">Ingresar</button>
            
            <div className="demo-info">
              <p><strong>Demo:</strong></p>
              <p>Usuario: <code>admin</code></p>
              <p>Contraseña: <code>admin123</code></p>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // Pantalla Principal
  return (
    <div className="app-container">
      <header className="header">
        <div className="header-content">
          <h1>🍔 Carbon & Cheddar</h1>
          <div className="user-info">
            <span>Bienvenido, <strong>{username}</strong></span>
            <button onClick={handleLogout} className="btn-logout">Cerrar Sesión</button>
          </div>
        </div>
      </header>

      <div className="main-content">
        <section className="products-section">
          <h2>📋 Nuestros Productos</h2>
          
          {loading && <p className="loading">Cargando productos...</p>}
          {error && <div className="error-message">{error}</div>}
          
          <div className="products-grid">
            {products.map(product => (
              <div key={product.id} className="product-card">
                <div className="product-icon">🍔</div>
                <h3>{product.nombre}</h3>
                <p className="price">${product.precio.toLocaleString()}</p>
                <button
                  onClick={() => addToCart(product)}
                  className="btn-add"
                >
                  Agregar al Carrito
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="cart-section">
          <h2>🛒 Carrito de Compras</h2>
          
          {cart.length === 0 ? (
            <p className="empty-cart">El carrito está vacío</p>
          ) : (
            <>
              <div className="cart-items">
                {cart.map(item => (
                  <div key={item.id} className="cart-item">
                    <div className="item-info">
                      <h4>{item.nombre}</h4>
                      <p>${item.precio} x {item.cantidad} = <strong>${(item.precio * item.cantidad).toLocaleString()}</strong></p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="btn-remove"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="cart-summary">
                <h3>Total: ${cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0).toLocaleString()}</h3>
              </div>

              {error && error.includes('carrito') && <div className="error-message">{error}</div>}
              
              <button
                onClick={handleCheckout}
                className="btn-checkout"
              >
                Procesar Venta
              </button>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
