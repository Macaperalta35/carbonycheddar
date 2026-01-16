/**
 * Componente para crear/editar recetas
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { recetasService, ingredientesService } from '../services/apiService';

export default function RecetaForm() {
  const navigate = useNavigate();
  const { recetaId } = useParams();
  const [receta, setReceta] = useState({
    nombre: '',
    descripcion: '',
    rendimiento_porciones: 1,
    precio_venta: 0,
    ingredientes: []
  });
  const [ingredientes, setIngredientes] = useState([]);
  const [ingredienteSeleccionado, setIngredienteSeleccionado] = useState('');
  const [cantidadIngrediente, setCantidadIngrediente] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarDatos();
  }, [recetaId]);

  const cargarDatos = async () => {
    try {
      const datosIngredientes = await ingredientesService.listar();
      setIngredientes(datosIngredientes.ingredientes || []);

      if (recetaId) {
        const datosReceta = await recetasService.obtener(recetaId);
        setReceta(datosReceta.receta);
      }
    } catch (err) {
      setError('Error cargando datos');
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setReceta({
      ...receta,
      [name]: name === 'rendimiento_porciones' ? parseInt(value) : value
    });
  };

  const agregarIngrediente = async () => {
    if (!ingredienteSeleccionado || !cantidadIngrediente) {
      setError('Selecciona ingrediente y cantidad');
      return;
    }

    try {
      const datosReceta = await recetasService.agregarIngrediente(
        receta.id,
        parseInt(ingredienteSeleccionado),
        parseFloat(cantidadIngrediente)
      );
      setReceta(datosReceta.receta);
      setIngredienteSeleccionado('');
      setCantidadIngrediente('');
    } catch (err) {
      setError('Error agregando ingrediente');
    }
  };

  const eliminarIngrediente = async (riId) => {
    try {
      const datosReceta = await recetasService.eliminarIngrediente(
        receta.id,
        riId
      );
      setReceta(datosReceta.receta);
    } catch (err) {
      setError('Error eliminando ingrediente');
    }
  };

  const guardar = async () => {
    try {
      setCargando(true);
      if (recetaId) {
        await recetasService.actualizar(recetaId, {
          nombre: receta.nombre,
          descripcion: receta.descripcion,
          rendimiento_porciones: receta.rendimiento_porciones,
          precio_venta: parseFloat(receta.precio_venta)
        });
      } else {
        await recetasService.crear({
          nombre: receta.nombre,
          descripcion: receta.descripcion,
          rendimientoPorciones: receta.rendimiento_porciones,
          precioVenta: parseFloat(receta.precio_venta)
        });
      }
      navigate('/dashboard');
    } catch (err) {
      setError('Error guardando receta');
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return <div style={styles.container}>Cargando...</div>;
  }

  const unidadIngredienteSeleccionado = ingredientes.find(
    (i) => i.id === parseInt(ingredienteSeleccionado)
  )?.unidad_medida || '';

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1>{recetaId ? 'Editar Receta' : 'Nueva Receta'}</h1>

        {error && <div style={styles.alert}>{error}</div>}

        {/* Datos básicos */}
        <div style={styles.section}>
          <h2>Datos Básicos</h2>

          <div style={styles.formGroup}>
            <label>Nombre de la Receta:</label>
            <input
              type="text"
              name="nombre"
              value={receta.nombre}
              onChange={handleInputChange}
              style={styles.input}
              placeholder="Ej: Burger Clásica"
            />
          </div>

          <div style={styles.formGroup}>
            <label>Descripción:</label>
            <textarea
              name="descripcion"
              value={receta.descripcion}
              onChange={handleInputChange}
              style={{ ...styles.input, minHeight: '80px' }}
              placeholder="Descripción de la receta"
            />
          </div>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label>Rendimiento (porciones):</label>
              <input
                type="number"
                name="rendimiento_porciones"
                value={receta.rendimiento_porciones}
                onChange={handleInputChange}
                style={styles.input}
                min="1"
              />
            </div>

            <div style={styles.formGroup}>
              <label>Precio de Venta ($):</label>
              <input
                type="number"
                name="precio_venta"
                value={receta.precio_venta}
                onChange={handleInputChange}
                style={styles.input}
                step="0.01"
              />
            </div>
          </div>
        </div>

        {/* Ingredientes */}
        <div style={styles.section}>
          <h2>Ingredientes</h2>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label>Selecciona Ingrediente:</label>
              <select
                value={ingredienteSeleccionado}
                onChange={(e) => setIngredienteSeleccionado(e.target.value)}
                style={styles.input}
              >
                <option value="">-- Selecciona --</option>
                {ingredientes.map((ing) => (
                  <option key={ing.id} value={ing.id}>
                    {ing.nombre} ({ing.unidad_medida})
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label>
                Cantidad ({unidadIngredienteSeleccionado}):
              </label>
              <input
                type="number"
                value={cantidadIngrediente}
                onChange={(e) => setCantidadIngrediente(e.target.value)}
                style={styles.input}
                step="0.01"
                placeholder="0.00"
              />
            </div>

            <button
              onClick={agregarIngrediente}
              style={styles.buttonAgregar}
            >
              + Agregar
            </button>
          </div>

          {/* Lista de ingredientes */}
          {receta.ingredientes && receta.ingredientes.length > 0 && (
            <div style={styles.ingredientesTable}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>Ingrediente</th>
                    <th>Cantidad</th>
                    <th>Costo Unitario</th>
                    <th>Costo Total</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {receta.ingredientes.map((ing) => (
                    <tr key={ing.id}>
                      <td>{ing.ingrediente_nombre}</td>
                      <td>{ing.cantidad} {ing.ingrediente_unidad}</td>
                      <td>${ing.costo_unitario.toFixed(2)}</td>
                      <td>${ing.costo_calculado.toFixed(2)}</td>
                      <td>
                        <button
                          onClick={() => eliminarIngrediente(ing.id)}
                          style={styles.buttonDelete}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Cálculos */}
        {receta.costo_total > 0 && (
          <div style={styles.section}>
            <h2>Cálculos Automáticos</h2>

            <div style={styles.calculosGrid}>
              <div style={styles.calculoItem}>
                <span>Costo Total:</span>
                <strong>${receta.costo_total?.toFixed(2)}</strong>
              </div>
              <div style={styles.calculoItem}>
                <span>Costo por Porción:</span>
                <strong>${receta.costo_por_porcion?.toFixed(2)}</strong>
              </div>
              <div style={styles.calculoItem}>
                <span>Margen (%):</span>
                <strong>{receta.margen_porcentaje?.toFixed(1)}%</strong>
              </div>
              <div style={styles.calculoItem}>
                <span>Utilidad Total:</span>
                <strong style={{ color: '#4caf50' }}>
                  ${receta.utilidad_total?.toFixed(2)}
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* Botones */}
        <div style={styles.formActions}>
          <button
            onClick={() => navigate('/dashboard')}
            style={styles.buttonSecondary}
          >
            Cancelar
          </button>
          <button
            onClick={guardar}
            style={styles.buttonPrimary}
            disabled={cargando || !receta.nombre}
          >
            {cargando ? 'Guardando...' : 'Guardar Receta'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f5f5',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  },
  card: {
    maxWidth: '800px',
    margin: '0 auto',
    background: 'white',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
  },
  section: {
    marginBottom: '30px',
    paddingBottom: '20px',
    borderBottom: '1px solid #eee'
  },
  formGroup: {
    marginBottom: '15px'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px'
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
  alert: {
    padding: '12px',
    marginBottom: '20px',
    background: '#fee',
    color: '#c33',
    borderRadius: '4px'
  },
  buttonAgregar: {
    padding: '10px 20px',
    background: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    alignSelf: 'flex-end'
  },
  ingredientesTable: {
    marginTop: '20px',
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  calculosGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '15px'
  },
  calculoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '15px',
    background: '#f0f0f0',
    borderRadius: '4px'
  },
  formActions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    marginTop: '30px'
  },
  buttonPrimary: {
    padding: '12px 30px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  buttonSecondary: {
    padding: '12px 30px',
    background: '#999',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  buttonDelete: {
    padding: '4px 8px',
    background: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  }
};
