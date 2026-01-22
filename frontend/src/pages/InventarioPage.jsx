import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiService';

const InventarioPage = () => {
    const [ingredientes, setIngredientes] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);

    // Estado para Mermas
    const [merma, setMerma] = useState({
        ingrediente_id: '',
        cantidad: '',
        razon: ''
    });

    // Estado para Nuevo Ingrediente
    const [nuevoIngrediente, setNuevoIngrediente] = useState({
        nombre: '',
        descripcion: '',
        unidad_medida: 'kg', // default
        costo_unitario: '',
        stock_actual: 0
    });

    const [modalType, setModalType] = useState(null); // 'compra', 'merma', 'nuevo'

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

    const handleInputChange = (e, stateSetter, currentState) => {
        const { name, value } = e.target;
        stateSetter({ ...currentState, [name]: value });
    };

    // --- REABASTECIMIENTO ---
    const handleSubmitCompra = async (e) => {
        e.preventDefault();
        try {
            await apiClient.post('/inventario/reabastecer', compra);
            alert('Compra registrada exitosamente');
            cerrarModales();
            cargarInventario();
        } catch (err) {
            alert(err.response?.data?.error || 'Error al registrar compra');
        }
    };

    // --- MERMAS ---
    const handleSubmitMerma = async (e) => {
        e.preventDefault();
        try {
            await apiClient.post('/inventario/mermas', merma);
            alert('Merma registrada exitosamente');
            cerrarModales();
            cargarInventario();
        } catch (err) {
            alert(err.response?.data?.error || 'Error al registrar merma');
        }
    };

    // --- NUEVO INGREDIENTE ---
    const handleSubmitNuevo = async (e) => {
        e.preventDefault();
        try {
            // endpoint existente en routes/ingredientes.py: POST /api/ingredientes
            await apiClient.post('/ingredientes', {
                ...nuevoIngrediente,
                costo_unitario: parseFloat(nuevoIngrediente.costo_unitario),
                stock_actual: parseFloat(nuevoIngrediente.stock_actual || 0)
            });
            alert('Ingrediente creado exitosamente');
            cerrarModales();
            cargarInventario();
        } catch (err) {
            alert(err.response?.data?.error || 'Error al crear ingrediente');
        }
    };

    const abrirModal = (tipo, ingredienteId = '') => {
        setModalType(tipo);
        if (tipo === 'compra' || tipo === 'merma') {
            const stateSetter = tipo === 'compra' ? setCompra : setMerma;
            stateSetter(prev => ({ ...prev, ingrediente_id: ingredienteId }));
        }
    };

    const cerrarModales = () => {
        setModalType(null);
        setCompra({ ingrediente_id: '', cantidad: '', costo_compra: '', proveedor: '', observaciones: '' });
        setMerma({ ingrediente_id: '', cantidad: '', razon: '' });
        setNuevoIngrediente({ nombre: '', descripcion: '', unidad_medida: 'kg', costo_unitario: '', stock_actual: 0 });
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1>📦 Gestión de Inventario</h1>
                <div style={styles.actionsHeader}>
                    <button onClick={() => abrirModal('nuevo')} style={styles.btnNuevo}>
                        + Nuevo Ingrediente
                    </button>
                    <button onClick={() => abrirModal('merma')} style={styles.btnMerma}>
                        🗑️ Registrar Merma
                    </button>
                    <button onClick={() => abrirModal('compra')} style={styles.btnCrear}>
                        📥 Registrar Compra
                    </button>
                </div>
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
                                    <button onClick={() => abrirModal('compra', ing.id)} style={styles.btnAccion}>
                                        ➕
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL COMPRA */}
            {modalType === 'compra' && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h2>Registrar Compra / Entrada</h2>
                        <form onSubmit={handleSubmitCompra}>
                            {/* Form fields reused from original login but adapted */}
                            <div style={styles.formGroup}>
                                <label>Ingrediente:</label>
                                <select
                                    name="ingrediente_id"
                                    value={compra.ingrediente_id}
                                    onChange={(e) => handleInputChange(e, setCompra, compra)}
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
                                    <label>Cantidad:</label>
                                    <input type="number" step="any" name="cantidad" value={compra.cantidad} onChange={(e) => handleInputChange(e, setCompra, compra)} required style={styles.input} />
                                </div>
                                <div style={styles.formGroup}>
                                    <label>Costo Total ($):</label>
                                    <input type="number" step="any" name="costo_compra" value={compra.costo_compra} onChange={(e) => handleInputChange(e, setCompra, compra)} required style={styles.input} />
                                </div>
                            </div>
                            <div style={styles.formGroup}>
                                <label>Proveedor:</label>
                                <input name="proveedor" value={compra.proveedor} onChange={(e) => handleInputChange(e, setCompra, compra)} style={styles.input} />
                            </div>
                            <div style={styles.modalActions}>
                                <button type="button" onClick={cerrarModales} style={styles.btnCancel}>Cancelar</button>
                                <button type="submit" style={styles.btnSave}>Registrar Entrada</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL MERMA */}
            {modalType === 'merma' && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h2>Registrar Merma / Desperdicio</h2>
                        <p style={{ fontSize: '0.9em', color: '#666' }}>Esto descontará stock del inventario.</p>
                        <form onSubmit={handleSubmitMerma}>
                            <div style={styles.formGroup}>
                                <label>Ingrediente:</label>
                                <select
                                    name="ingrediente_id"
                                    value={merma.ingrediente_id}
                                    onChange={(e) => handleInputChange(e, setMerma, merma)}
                                    required
                                    style={styles.input}
                                >
                                    <option value="">-- Seleccione Ingrediente --</option>
                                    {ingredientes.map(i => (
                                        <option key={i.id} value={i.id}>{i.nombre} ({i.unidad_medida}) - Stock: {i.stock_actual}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={styles.formGroup}>
                                <label>Cantidad Desperdiciada:</label>
                                <input type="number" step="any" name="cantidad" value={merma.cantidad} onChange={(e) => handleInputChange(e, setMerma, merma)} required style={styles.input} />
                            </div>
                            <div style={styles.formGroup}>
                                <label>Razón:</label>
                                <textarea name="razon" value={merma.razon} onChange={(e) => handleInputChange(e, setMerma, merma)} required placeholder="Ej: Caducado, Caída, etc." style={styles.input} />
                            </div>
                            <div style={styles.modalActions}>
                                <button type="button" onClick={cerrarModales} style={styles.btnCancel}>Cancelar</button>
                                <button type="submit" style={styles.btnDanger}>Registrar Merma</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL NUEVO INGREDIENTE */}
            {modalType === 'nuevo' && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h2>Crear Nuevo Ingrediente</h2>
                        <form onSubmit={handleSubmitNuevo}>
                            <div style={styles.formGroup}>
                                <label>Nombre:</label>
                                <input name="nombre" value={nuevoIngrediente.nombre} onChange={(e) => handleInputChange(e, setNuevoIngrediente, nuevoIngrediente)} required style={styles.input} />
                            </div>
                            <div style={styles.formGroup}>
                                <label>Descripción:</label>
                                <input name="descripcion" value={nuevoIngrediente.descripcion} onChange={(e) => handleInputChange(e, setNuevoIngrediente, nuevoIngrediente)} style={styles.input} />
                            </div>
                            <div style={styles.row}>
                                <div style={styles.formGroup}>
                                    <label>Unidad:</label>
                                    <select name="unidad_medida" value={nuevoIngrediente.unidad_medida} onChange={(e) => handleInputChange(e, setNuevoIngrediente, nuevoIngrediente)} style={styles.input}>
                                        <option value="kg">Kilogramos (kg)</option>
                                        <option value="g">Gramos (g)</option>
                                        <option value="l">Litros (l)</option>
                                        <option value="ml">Mililitros (ml)</option>
                                        <option value="unidad">Unidad</option>
                                        <option value="paquete">Paquete</option>
                                    </select>
                                </div>
                                <div style={styles.formGroup}>
                                    <label>Costo Unitario ($):</label>
                                    <input type="number" step="any" name="costo_unitario" value={nuevoIngrediente.costo_unitario} onChange={(e) => handleInputChange(e, setNuevoIngrediente, nuevoIngrediente)} required style={styles.input} />
                                </div>
                            </div>
                            <div style={styles.formGroup}>
                                <label>Stock Inicial (Opcional):</label>
                                <input type="number" step="any" name="stock_actual" value={nuevoIngrediente.stock_actual} onChange={(e) => handleInputChange(e, setNuevoIngrediente, nuevoIngrediente)} style={styles.input} />
                            </div>
                            <div style={styles.modalActions}>
                                <button type="button" onClick={cerrarModales} style={styles.btnCancel}>Cancelar</button>
                                <button type="submit" style={styles.btnSave}>Crear Ingrediente</button>
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
    actionsHeader: { display: 'flex', gap: '10px' },
    btnCrear: { background: '#2196F3', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer' },
    btnMerma: { background: '#FF9800', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer' },
    btnNuevo: { background: '#4CAF50', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer' },
    tableContainer: { overflowX: 'auto', background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    table: { width: '100%', borderCollapse: 'collapse' },
    error: { background: '#ffebee', color: '#c62828', padding: '10px', marginBottom: '10px', borderRadius: '4px' },
    numero: { textAlign: 'right', fontFamily: 'monospace' },
    btnAccion: { background: '#2196F3', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9em' },

    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { background: 'white', padding: '20px', borderRadius: '8px', width: '90%', maxWidth: '500px' },
    formGroup: { marginBottom: '15px', flex: 1 },
    row: { display: 'flex', gap: '10px' },
    input: { width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' },
    modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' },
    btnCancel: { background: '#ddd', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer' },
    btnSave: { background: '#2196F3', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer' },
    btnDanger: { background: '#f44336', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer' }
};

export default InventarioPage;
