/**
 * Componente de Login
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/apiService';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: '',
    email: '',
    password: ''
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');

    try {
      const data = await authService.login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setCargando(false);
    }
  };

  const handleRegistro = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');

    try {
      await authService.registro(
        nuevoUsuario.nombre,
        nuevoUsuario.email,
        nuevoUsuario.password
      );
      setMostrarRegistro(false);
      setEmail(nuevoUsuario.email);
      setPassword(nuevoUsuario.password);
      setNuevoUsuario({ nombre: '', email: '', password: '' });
      setError('Registro exitoso. Inicia sesión.');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrarse');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>💼 Sistema de Ventas</h1>
        <p style={styles.subtitle}>Gestión de Ventas y Recetas</p>

        {error && <div style={styles.alert}>{error}</div>}

        {!mostrarRegistro ? (
          <>
            <form onSubmit={handleLogin}>
              <div style={styles.formGroup}>
                <label>Email:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label>Contraseña:</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={styles.input}
                />
              </div>

              <button
                type="submit"
                disabled={cargando}
                style={styles.buttonPrimary}
              >
                {cargando ? 'Cargando...' : 'Iniciar Sesión'}
              </button>
            </form>

            <p style={styles.textCenter}>
              ¿No tienes cuenta?{' '}
              <button
                onClick={() => setMostrarRegistro(true)}
                style={styles.linkButton}
              >
                Regístrate aquí
              </button>
            </p>
          </>
        ) : (
          <>
            <form onSubmit={handleRegistro}>
              <div style={styles.formGroup}>
                <label>Nombre:</label>
                <input
                  type="text"
                  value={nuevoUsuario.nombre}
                  onChange={(e) =>
                    setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })
                  }
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label>Email:</label>
                <input
                  type="email"
                  value={nuevoUsuario.email}
                  onChange={(e) =>
                    setNuevoUsuario({ ...nuevoUsuario, email: e.target.value })
                  }
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label>Contraseña:</label>
                <input
                  type="password"
                  value={nuevoUsuario.password}
                  onChange={(e) =>
                    setNuevoUsuario({
                      ...nuevoUsuario,
                      password: e.target.value
                    })
                  }
                  required
                  style={styles.input}
                />
              </div>

              <button
                type="submit"
                disabled={cargando}
                style={styles.buttonPrimary}
              >
                {cargando ? 'Registrando...' : 'Registrarse'}
              </button>
            </form>

            <p style={styles.textCenter}>
              ¿Ya tienes cuenta?{' '}
              <button
                onClick={() => setMostrarRegistro(false)}
                style={styles.linkButton}
              >
                Inicia sesión
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: 'Arial, sans-serif'
  },
  card: {
    background: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
    width: '100%',
    maxWidth: '400px'
  },
  title: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '10px',
    fontSize: '28px'
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: '30px',
    fontSize: '14px'
  },
  alert: {
    padding: '12px',
    marginBottom: '20px',
    background: '#fee',
    color: '#c33',
    borderRadius: '4px',
    fontSize: '14px',
    borderLeft: '4px solid #c33'
  },
  formGroup: {
    marginBottom: '20px'
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box',
    marginTop: '5px'
  },
  buttonPrimary: {
    width: '100%',
    padding: '12px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background 0.3s'
  },
  textCenter: {
    textAlign: 'center',
    marginTop: '20px',
    fontSize: '14px',
    color: '#666'
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#667eea',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontSize: '14px'
  }
};
