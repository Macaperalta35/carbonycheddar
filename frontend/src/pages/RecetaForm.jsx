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
  const [subRecetas, setSubRecetas] = useState([]);
  const [tipoSeleccion, setTipoSeleccion] = useState('ingrediente'); // 'ingrediente' | 'subreceta'
  const [itemSeleccionado, setItemSeleccionado] = useState(''); // ID del ingrediente o receta

  useEffect(() => {
    cargarDatos();
  }, [recetaId]);

  const cargarDatos = async () => {
    try {
      const datosIngredientes = await ingredientesService.listar(1, 100); // Traer más
      setIngredientes(datosIngredientes.ingredientes || []);

      const datosRecetas = await recetasService.listar(1, 100);
      setSubRecetas(datosRecetas.recetas || []);

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

  const agregarItem = async () => {
    if (!itemSeleccionado || !cantidadIngrediente) {
      setError('Selecciona item y cantidad');
      return;
    }

    try {
      const ingredienteId = tipoSeleccion === 'ingrediente' ? parseInt(itemSeleccionado) : null;
      const subRecetaId = tipoSeleccion === 'subreceta' ? parseInt(itemSeleccionado) : null;

      const datosReceta = await recetasService.agregarIngrediente(
        receta.id,
        ingredienteId,
        parseFloat(cantidadIngrediente),
        subRecetaId
      );
      setReceta(datosReceta.receta);
      setItemSeleccionado('');
      setCantidadIngrediente('');
    } catch (err) {
      console.error(err);
      setError('Error agregando item: ' + (err.response?.data?.error || err.message));
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

  // Filtrar recetas para evitar auto-referencia si estamos editando
  const recetasDisponibles = subRecetas.filter(r => r.id !== parseInt(recetaId || 0));

  let unidadLabel = 'Unidad';
  if (tipoSeleccion === 'ingrediente') {
    const ing = ingredientes.find(i => i.id === parseInt(itemSeleccionado));
    unidadLabel = ing?.unidad_medida || '';
  } else {
    unidadLabel = 'Porciones';
  }

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

        {/* Ingredientes y Sub-recetas */}
        <div style={styles.section}>
          <h2>Composición (Ingredientes / Sub-recetas)</h2>

          <div style={styles.toggleContainer}>
            <button
              style={tipoSeleccion === 'ingrediente' ? styles.toggleActive : styles.toggleInactive}
              onClick={() => { setTipoSeleccion('ingrediente'); setItemSeleccionado(''); }}
            >
              Ingrediente
            </button>
            <button
              style={tipoSeleccion === 'subreceta' ? styles.toggleActive : styles.toggleInactive}
              onClick={() => { setTipoSeleccion('subreceta'); setItemSeleccionado(''); }}
            >
              Sub-receta
            </button>
          </div>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label>Selecciona {tipoSeleccion === 'ingrediente' ? 'Ingrediente' : 'Sub-receta'}:</label>
              <select
                value={itemSeleccionado}
                onChange={(e) => setItemSeleccionado(e.target.value)}
                style={styles.input}
              >
                <option value="">-- Selecciona --</option>
                {tipoSeleccion === 'ingrediente' ? (
                  ingredientes.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.nombre} ({ing.unidad_medida})
                    </option>
                  ))
                ) : (
                  recetasDisponibles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nombre} (Costo: ${r.costo_por_porcion})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label>
                Cantidad ({unidadLabel}):
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
              onClick={agregarItem}
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
                    <th>Tipo</th>
                    <th>Nombre</th>
                    <th>Cantidad</th>
                    <th>Costo Unitario</th>
                    <th>Costo Total</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {receta.ingredientes.map((ing) => (
                    <tr key={ing.id}>
                      <td>
                        {ing.tipo === 'subreceta' ? (
                          <span style={styles.badgeReceta}>Sub-receta</span>
                        ) : (
                          <span style={styles.badgeIngrediente}>Ingrediente</span>
                        )}
                      </td>
                      <td>{ing.nombre}</td>
                      <td>{ing.cantidad} {ing.unidad}</td>
                      <td>${ing.costo_unitario?.toFixed(2)}</td>
                      <td>${ing.costo_calculado?.toFixed(2)}</td>
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
  },
  toggleContainer: {
    display: 'flex',
    gap: '10px',
    marginBottom: '15px'
  },
  toggleActive: {
    padding: '8px 16px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  toggleInactive: {
    padding: '8px 16px',
    background: '#eee',
    color: '#666',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer'
  },
  badgeIngrediente: {
    background: '#e3f2fd',
    color: '#1565c0',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '0.8em',
    fontWeight: 'bold'
  },
  badgeReceta: {
    background: '#fff3e0',
    color: '#ef6c00',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '0.8em',
    fontWeight: 'bold'
  }
};
