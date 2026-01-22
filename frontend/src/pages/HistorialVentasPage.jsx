import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiService';

const HistorialVentasPage = () => {
    const navigate = useNavigate();
    const [ventas, setVentas] = useState([]);
    const [filtros, setFiltros] = useState({
        id: '',
        fecha_inicio: '',
        fecha_fin: '',
        cliente: ''
    });
    const [paginacion, setPaginacion] = useState({ page: 1, total: 0, pages: 1 });
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');

    // Modal estado
    const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
    const [editando, setEditando] = useState(false);
    const [datosEdicion, setDatosEdicion] = useState({});

    useEffect(() => {
        buscarVentas();
    }, [paginacion.page]);

    const buscarVentas = async () => {
        setCargando(true);
        setError('');
        try {
            const params = {
                pagina: paginacion.page,
                por_pagina: 20,
                ...filtros
            };

            // Limpiar params vacíos
            Object.keys(params).forEach(key => {
                if (params[key] === '') delete params[key];
            });

            const response = await apiClient.get('/ventas/historial', { params });

            if (response.data.success) {
                setVentas(response.data.data.ventas);
                setPaginacion({
                    page: response.data.data.pagina,
                    total: response.data.data.total,
                    pages: Math.ceil(response.data.data.total / response.data.data.por_pagina)
                });
            }
        } catch (err) {
            console.error(err);
            setError('Error cargando historial');
        } finally {
            setCargando(false);
        }
    };

    const verDetalle = (venta) => {
        setVentaSeleccionada(venta);
        setEditando(false);
        setDatosEdicion({
            cliente_nombre: venta.cliente_nombre,
            numero_mesa: venta.numero_mesa,
            items_observaciones: venta.items.reduce((acc, item) => ({ ...acc, [item.id]: item.observaciones }), {})
        });
    };

    const guardarCambios = async () => {
        try {
            await apiClient.put(`/ventas/${ventaSeleccionada.id}`, datosEdicion);
            alert('Venta actualizada');
            setVentaSeleccionada(null);
            buscarVentas();
        } catch (err) {
            alert('Error actualizando venta');
        }
    };

    const imprimirComanda = async (tipo) => {
        try {
            const res = await apiClient.get(`/ventas/${ventaSeleccionada.id}/comanda/${tipo}`);
            if (res.data.success) {
                const ventana = window.open('', '_blank');
                ventana.document.write(res.data.data.html);
                ventana.document.close();
            }
        } catch (err) {
            alert('Error obteniendo comanda');
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1>🔍 Historial de Ventas</h1>
                <button onClick={() => navigate('/dashboard')} style={styles.btnBack}>Volver</button>
            </div>

            <div style={styles.filtros}>
                <input
                    placeholder="N° Orden"
                    value={filtros.id}
                    onChange={e => setFiltros({ ...filtros, id: e.target.value })}
                    style={styles.input}
                />
                <input
                    placeholder="Cliente"
                    value={filtros.cliente}
                    onChange={e => setFiltros({ ...filtros, cliente: e.target.value })}
                    style={styles.input}
                />
                <input
                    type="date"
                    value={filtros.fecha_inicio}
                    onChange={e => setFiltros({ ...filtros, fecha_inicio: e.target.value })}
                    style={styles.input}
                />
                <button onClick={() => { setPaginacion({ ...paginacion, page: 1 }); buscarVentas(); }} style={styles.btnBuscar}>
                    Buscar
                </button>
            </div>

            {cargando ? <p>Cargando...</p> : (
                <div style={styles.tableContainer}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th>Orden #</th>
                                <th>Fecha</th>
                                <th>Cliente</th>
                                <th>Mesa</th>
                                <th>Total</th>
                                <th>Items</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ventas.map(v => (
                                <tr key={v.id}>
                                    <td><strong>{v.id}</strong></td>
                                    <td>{new Date(v.created_at).toLocaleString()}</td>
                                    <td>{v.cliente_nombre || '-'}</td>
                                    <td>{v.numero_mesa || '-'}</td>
                                    <td>${v.total.toFixed(2)}</td>
                                    <td>{v.items.length}</td>
                                    <td>
                                        <button onClick={() => verDetalle(v)} style={styles.btnVer}>Ver / Editar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* MODAL DETALLE */}
            {ventaSeleccionada && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <h2>Orden #{ventaSeleccionada.id}</h2>

                        <div style={styles.modalContent}>
                            {!editando ? (
                                <>
                                    <div style={styles.infoRow}>
                                        <p><strong>Cliente:</strong> {ventaSeleccionada.cliente_nombre}</p>
                                        <p><strong>Mesa:</strong> {ventaSeleccionada.numero_mesa}</p>
                                        <p><strong>Fecha:</strong> {new Date(ventaSeleccionada.created_at).toLocaleString()}</p>
                                    </div>
                                    <div style={styles.actionsRow}>
                                        <button onClick={() => setEditando(true)} style={styles.btnEdit}>✏️ Editar Datos</button>
                                        <button onClick={() => imprimirComanda('cocina')} style={styles.btnPrint}>🖨️ Cocina</button>
                                        <button onClick={() => imprimirComanda('caja')} style={styles.btnPrint}>🖨️ Ticket Cliente</button>
                                    </div>
                                    <hr />
                                    <h3>Items</h3>
                                    <ul style={styles.itemsList}>
                                        {ventaSeleccionada.items.map(item => (
                                            <li key={item.id} style={styles.itemRow}>
                                                <span>
                                                    {item.es_receta ? '🍽️' : '📦'} <strong> {item.producto_nombre || item.receta_nombre}</strong> x{item.cantidad}
                                                </span>
                                                <span>${item.subtotal.toFixed(2)}</span>
                                                {item.observaciones && <div style={{ color: 'red', fontSize: '0.9em' }}>Nota: {item.observaciones}</div>}
                                            </li>
                                        ))}
                                    </ul>
                                    <div style={styles.totalRow}>
                                        <h3>Total: ${ventaSeleccionada.total.toFixed(2)}</h3>
                                    </div>
                                </>
                            ) : (
                                <div style={styles.formEdit}>
                                    <label>Cliente:</label>
                                    <input
                                        value={datosEdicion.cliente_nombre}
                                        onChange={e => setDatosEdicion({ ...datosEdicion, cliente_nombre: e.target.value })}
                                        style={styles.input}
                                    />
                                    <label>Mesa:</label>
                                    <input
                                        value={datosEdicion.numero_mesa}
                                        onChange={e => setDatosEdicion({ ...datosEdicion, numero_mesa: e.target.value })}
                                        style={styles.input}
                                    />
                                    <label>Notas de Items (Cocina):</label>
                                    {ventaSeleccionada.items.map(item => (
                                        <div key={item.id} style={{ marginBottom: 10 }}>
                                            <span>{item.producto_nombre || item.receta_nombre}</span>
                                            <input
                                                value={datosEdicion.items_observaciones[item.id] || ''}
                                                onChange={e => setDatosEdicion({
                                                    ...datosEdicion,
                                                    items_observaciones: {
                                                        ...datosEdicion.items_observaciones,
                                                        [item.id]: e.target.value
                                                    }
                                                })}
                                                style={styles.inputSmall}
                                                placeholder="Nota para cocina..."
                                            />
                                        </div>
                                    ))}

                                    <div style={styles.actionsRow}>
                                        <button onClick={guardarCambios} style={styles.btnSave}>Guardar Cambios</button>
                                        <button onClick={() => setEditando(false)} style={styles.btnCancel}>Cancelar</button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <button onClick={() => setVentaSeleccionada(null)} style={styles.btnClose}>Cerrar</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: { padding: 20, maxWidth: 1000, margin: '0 auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    filtros: { display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' },
    input: { padding: 8, borderRadius: 4, border: '1px solid #ddd', flex: 1 },
    inputSmall: { padding: 5, borderRadius: 4, border: '1px solid #ddd', width: '100%', marginTop: 2 },
    btnBuscar: { padding: '8px 16px', background: '#4caf50', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' },
    btnBack: { padding: '8px 16px', background: '#666', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' },
    tableContainer: { overflowX: 'auto', background: 'white', padding: 15, borderRadius: 8, boxShadow: '0 2px 5px rgba(0,0,0,0.1)' },
    table: { width: '100%', borderCollapse: 'collapse' },
    btnVer: { padding: '5px 10px', background: '#2196f3', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modal: { background: 'white', padding: 25, borderRadius: 8, width: '90%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' },
    modalContent: { marginBottom: 20 },
    infoRow: { marginBottom: 15, lineHeight: '1.6' },
    actionsRow: { display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' },
    btnEdit: { padding: '8px', background: '#ff9800', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' },
    btnPrint: { padding: '8px', background: '#607d8b', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' },
    btnSave: { padding: '8px', background: '#4caf50', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' },
    btnCancel: { padding: '8px', background: '#f44336', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' },
    btnClose: { width: '100%', padding: 10, background: '#333', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' },
    itemsList: { listStyle: 'none', padding: 0 },
    itemRow: { padding: '8px 0', borderBottom: '1px solid #eee' },
    totalRow: { textAlign: 'right', marginTop: 15, fontSize: '1.2em' },
    formEdit: { display: 'flex', flexDirection: 'column', gap: 10 }
};

export default HistorialVentasPage;
