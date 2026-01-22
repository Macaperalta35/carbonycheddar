import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiService';

const InventarioPage = () => {
    const [ingredientes, setIngredientes] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);

    // Estado para el formulario de compra
    const [compra, setCompra] = useState({
        ingrediente_id: '',
        cantidad: '',
        costo_compra: '',
        proveedor: '',
        observaciones: ''
    });

    useEffect(() => {
        cargarInventario();
    }, []);

    const cargarInventario = async () => {
        try {
            setCargando(true);
            const response = await apiClient.get('/inventario/');
            if (response.data.success) {
                setIngredientes(response.data.data);
            }
        } catch (err) {
            setError('Error al cargar inventario.');
            console.error(err);
        } finally {
            setCargando(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCompra({ ...compra, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await apiClient.post('/inventario/reabastecer', compra);
            alert('Compra registrada exitosamente');
            setModalOpen(false);
            setCompra({
                ingrediente_id: '',
                cantidad: '',
                costo_compra: '',
                proveedor: '',
                observaciones: ''
            });
            cargarInventario();
        } catch (err) {
            alert(err.response?.data?.error || 'Error al registrar compra');
        }
    };

    const abrirModalCompra = (ingredienteId = '') => {
        setCompra(prev => ({ ...prev, ingrediente_id: ingredienteId }));
        setModalOpen(true);
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1>📦 Gestión de Inventario</h1>
                <button onClick={() => abrirModalCompra('')} style={styles.btnCrear}>
                    + Registrar Compra
                </button>
            </div>

            {error && <div style={styles.error}>{error}</div>}

            <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th>Ingrediente</th>
                            <th>Stock Actual</th>
                            <th>Unidad</th>
                            <th>Costo Promedio</th>
                            <th>Valor Todo Stock</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ingredientes.map(ing => (
                            <tr key={ing.id} style={ing.stock_actual <= 0 ? { backgroundColor: '#ffebee' } : {}}>
                                <td>
                                    <strong>{ing.nombre}</strong>
                                    <div style={{ fontSize: '0.8em', color: '#666' }}>{ing.descripcion}</div>
                                </td>
                                <td style={styles.numero}>
                                    {ing.stock_actual?.toFixed(3) || 0}
                                </td>
                                <td>{ing.unidad_medida}</td>
                                <td style={styles.numero}>${ing.costo_unitario?.toFixed(2)}</td>
                                <td style={styles.numero}>
                                    ${((ing.stock_actual || 0) * (ing.costo_unitario || 0)).toFixed(2)}
                                </td>
                                <td>
                                    <button onClick={() => abrirModalCompra(ing.id)} style={styles.btnAccion}>
                                        ➕ Reabastecer
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL DE COMPRA */}
            {modalOpen && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h2>Registrar Compra / Entrada</h2>
                        <form onSubmit={handleSubmit}>
                            <div style={styles.formGroup}>
                                <label>Ingrediente:</label>
                                <select
                                    name="ingrediente_id"
                                    value={compra.ingrediente_id}
                                    onChange={handleInputChange}
                                    required
                                    style={styles.input}
                                >
                                    <option value="">-- Seleccione Ingrediente --</option>
                                    {ingredientes.map(i => (
                                        <option key={i.id} value={i.id}>{i.nombre} ({i.unidad_medida})</option>
                                    ))}
                                </select>
                            </div>

                            <div style={styles.row}>
                                <div style={styles.formGroup}>
                                    <label>Cantidad Comprada:</label>
                                    <input
                                        type="number"
                                        step="any"
                                        name="cantidad"
                                        value={compra.cantidad}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Ej: 5.5"
                                        style={styles.input}
                                    />
                                </div>
                                <div style={styles.formGroup}>
                                    <label>Costo TOTAL Compra ($):</label>
                                    <input
                                        type="number"
                                        step="any"
                                        name="costo_compra"
                                        value={compra.costo_compra}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Total pagado"
                                        style={styles.input}
                                    />
                                </div>
                            </div>

                            <div style={styles.formGroup}>
                                <label>Proveedor (Opcional):</label>
                                <input name="proveedor" value={compra.proveedor} onChange={handleInputChange} style={styles.input} />
                            </div>

                            <div style={styles.formGroup}>
                                <label>Observaciones:</label>
                                <textarea name="observaciones" value={compra.observaciones} onChange={handleInputChange} style={styles.input} />
                            </div>

                            <div style={styles.modalActions}>
                                <button type="button" onClick={() => setModalOpen(false)} style={styles.btnCancel}>Cancelar</button>
                                <button type="submit" style={styles.btnSave}>Registrar Entrada</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: { padding: '20px', maxWidth: '1000px', margin: '0 auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    btnCrear: { background: '#2196F3', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer' },
    tableContainer: { overflowX: 'auto', background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    table: { width: '100%', borderCollapse: 'collapse' },
    error: { background: '#ffebee', color: '#c62828', padding: '10px', marginBottom: '10px', borderRadius: '4px' },
    numero: { textAlign: 'right', fontFamily: 'monospace' },
    btnAccion: { background: '#4CAF50', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9em' },

    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { background: 'white', padding: '20px', borderRadius: '8px', width: '90%', maxWidth: '500px' },
    formGroup: { marginBottom: '15px', flex: 1 },
    row: { display: 'flex', gap: '10px' },
    input: { width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' },
    modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' },
    btnCancel: { background: '#ddd', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer' },
    btnSave: { background: '#2196F3', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer' }
};

export default InventarioPage;
