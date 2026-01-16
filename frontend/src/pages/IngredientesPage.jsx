/**
 * Componente para gestionar ingredientes
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ingredientesService } from '../services/apiService';

export default function IngredientesPage() {
  const navigate = useNavigate();
  const [ingredientes, setIngredientes] = useState([]);
  const [formularioVisible, setFormularioVisible] = useState(false);
  const [editar, setEditar] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [formulario, setFormulario] = useState({
    nombre: '',
    descripcion: '',
    unidad_medida: 'kg',
    costo_unitario: ''
  });

  useEffect(() => {
    cargarIngredientes();
  }, []);

  const cargarIngredientes = async () => {
    try {
      const datos = await ingredientesService.listar();
      setIngredientes(datos.ingredientes || []);
    } catch (err) {
      console.error('Error cargando ingredientes:', err);
    } finally {
      setCargando(false);
    }
  };

  const buscarIngredientes = async () => {
    if (!busqueda) {
      cargarIngredientes();
      return;
    }

    try {
      const datos = await ingredientesService.buscar(busqueda);
      setIngredientes(datos.ingredientes || []);
    } catch (err) {
      console.error('Error buscando:', err);
    }
  };

  const abrirFormulario = (ingrediente = null) => {
    if (ingrediente) {
      setFormulario({
        nombre: ingrediente.nombre,
        descripcion: ingrediente.descripcion,
        unidad_medida: ingrediente.unidad_medida,
        costo_unitario: ingrediente.costo_unitario
      });
      setEditar(ingrediente.id);
    } else {
      setFormulario({
        nombre: '',
        descripcion: '',
        unidad_medida: 'kg',
        costo_unitario: ''
      });
      setEditar(null);
    }
    setFormularioVisible(true);
  };

  const cerrarFormulario = () => {
    setFormularioVisible(false);
    setEditar(null);
  };

  const guardarIngrediente = async (e) => {
    e.preventDefault();

    try {
      setCargando(true);
      if (editar) {
        await ingredientesService.actualizar(editar, formulario);
      } else {
        await ingredientesService.crear(formulario);
      }
      await cargarIngredientes();
      cerrarFormulario();
    } catch (err) {
      alert('Error guardando ingrediente');
    } finally {
      setCargando(false);
    }
  };

  const eliminarIngrediente = async (id) => {
    if (confirm('¿Estás seguro de que deseas eliminar este ingrediente?')) {
      try {
        await ingredientesService.eliminar(id);
        setIngredientes(ingredientes.filter((i) => i.id !== id));
      } catch (err) {
        alert('Error eliminando ingrediente');
      }
    }
  };

  if (cargando && ingredientes.length === 0) {
    return <div style={styles.container}>Cargando...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1>🧂 Gestión de Ingredientes</h1>
        <button
          onClick={() => navigate('/dashboard')}
          style={styles.buttonVolver}
        >
          ← Volver
        </button>
      </div>

      {/* Búsqueda y botón nuevo */}
      <div style={styles.buscador}>
        <input
          type="text"
          placeholder="Buscar ingrediente..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          onKeyUp={buscarIngredientes}
          style={styles.inputBusqueda}
        />
        <button
          onClick={() => abrirFormulario()}
          style={styles.buttonPrimary}
        >
          + Nuevo Ingrediente
        </button>
      </div>

      {/* Tabla de ingredientes */}
      <div style={styles.tablaContenedor}>
        <table style={styles.tabla}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Unidad</th>
              <th>Costo Unitario</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ingredientes.map((ing) => (
              <tr key={ing.id}>
                <td style={styles.cellNombre}>{ing.nombre}</td>
                <td style={styles.cellDescripcion}>{ing.descripcion || '-'}</td>
                <td>{ing.unidad_medida}</td>
                <td style={styles.cellCosto}>
                  ${ing.costo_unitario.toFixed(2)}
                </td>
                <td style={styles.cellAcciones}>
                  <button
                    onClick={() => abrirFormulario(ing)}
                    style={styles.buttonEdit}
                  >
                    Editar
                  </button>
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

      {/* Modal Formulario */}
      {formularioVisible && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h2>{editar ? 'Editar Ingrediente' : 'Nuevo Ingrediente'}</h2>

            <form onSubmit={guardarIngrediente}>
              <div style={styles.formGroup}>
                <label>Nombre:</label>
                <input
                  type="text"
                  value={formulario.nombre}
                  onChange={(e) =>
                    setFormulario({ ...formulario, nombre: e.target.value })
                  }
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label>Descripción:</label>
                <textarea
                  value={formulario.descripcion}
                  onChange={(e) =>
                    setFormulario({
                      ...formulario,
                      descripcion: e.target.value
                    })
                  }
                  style={styles.textarea}
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label>Unidad de Medida:</label>
                  <select
                    value={formulario.unidad_medida}
                    onChange={(e) =>
                      setFormulario({
                        ...formulario,
                        unidad_medida: e.target.value
                      })
                    }
                    style={styles.input}
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="l">l</option>
                    <option value="ml">ml</option>
                    <option value="unidad">unidad</option>
                    <option value="docena">docena</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label>Costo Unitario ($):</label>
                  <input
                    type="number"
                    value={formulario.costo_unitario}
                    onChange={(e) =>
                      setFormulario({
                        ...formulario,
                        costo_unitario: parseFloat(e.target.value)
                      })
                    }
                    style={styles.input}
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={cerrarFormulario}
                  style={styles.buttonSecondary}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={styles.buttonPrimary}
                  disabled={cargando}
                >
                  {cargando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
  buscador: {
    display: 'flex',
    gap: '10px',
    padding: '20px',
    background: 'white',
    maxWidth: '1200px',
    margin: '20px auto',
    borderRadius: '8px'
  },
  inputBusqueda: {
    flex: 1,
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px'
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
  buttonVolver: {
    padding: '8px 16px',
    background: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  tablaContenedor: {
    maxWidth: '1200px',
    margin: '0 auto',
    background: 'white',
    borderRadius: '8px',
    overflowX: 'auto'
  },
  tabla: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  cellNombre: {
    fontWeight: 'bold'
  },
  cellDescripcion: {
    color: '#666',
    fontSize: '13px'
  },
  cellCosto: {
    color: '#4caf50',
    fontWeight: 'bold'
  },
  cellAcciones: {
    display: 'flex',
    gap: '5px'
  },
  buttonEdit: {
    padding: '4px 8px',
    background: '#2196f3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
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
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    background: 'white',
    padding: '30px',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '500px'
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
  textarea: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    minHeight: '80px',
    boxSizing: 'border-box',
    marginTop: '5px'
  },
  modalActions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    marginTop: '20px'
  },
  buttonSecondary: {
    padding: '10px 20px',
    background: '#999',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  }
};
