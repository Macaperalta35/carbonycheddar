import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiService';

const AdminUsuariosPage = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [usuarioEditar, setUsuarioEditar] = useState(null);

    // Estado del formulario
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        password: '',
        rol: 'user',
        activo: true,
        permisos: [] // 'ver_ventas', 'ver_recetas', 'ver_reportes', 'ver_inventario', 'admin_usuarios'
    });

    const PERMISOS_DISPONIBLES = [
        { id: 'ver_ventas', label: 'Ver Ventas' },
        { id: 'ver_recetas', label: 'Gestionar Recetas' },
        { id: 'ver_reportes', label: 'Ver Reportes' },
        { id: 'ver_inventario', label: 'Gestionar Inventario' },
        { id: 'admin_usuarios', label: 'Administrar Usuarios' }
    ];

    useEffect(() => {
        cargarUsuarios();
    }, []);

    const cargarUsuarios = async () => {
        try {
            setCargando(true);
            const response = await apiClient.get('/admin/usuarios');
            if (response.data.success) {
                setUsuarios(response.data.usuarios);
            }
        } catch (err) {
            setError('Error al cargar usuarios. Verifica que tengas permisos de administrador.');
        } finally {
            setCargando(false);
        }
    };

    const abrirModal = (usuario = null) => {
        if (usuario) {
            setUsuarioEditar(usuario);
            setFormData({
                nombre: usuario.nombre,
                email: usuario.email,
                password: '', // No mostrar password
                rol: usuario.rol,
                activo: usuario.activo,
                permisos: usuario.permisos || []
            });
        } else {
            setUsuarioEditar(null);
            setFormData({
                nombre: '',
                email: '',
                password: '',
                rol: 'user',
                activo: true,
                permisos: []
            });
        }
        setModalOpen(true);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handlePermisoChange = (permisoId) => {
        setFormData(prev => {
            const permisos = prev.permisos.includes(permisoId)
                ? prev.permisos.filter(p => p !== permisoId)
                : [...prev.permisos, permisoId];
            return { ...prev, permisos };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (usuarioEditar) {
                await apiClient.put(`/admin/usuarios/${usuarioEditar.id}`, formData);
            } else {
                await apiClient.post('/admin/usuarios', formData);
            }
            setModalOpen(false);
            cargarUsuarios();
        } catch (err) {
            alert(err.response?.data?.error || 'Error al guardar usuario');
        }
    };

    const eliminarUsuario = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return;
        try {
            await apiClient.delete(`/admin/usuarios/${id}`);
            cargarUsuarios();
        } catch (err) {
            alert(err.response?.data?.error || 'Error al eliminar');
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1>👥 Administración de Usuarios</h1>
                <button onClick={() => abrirModal()} style={styles.btnCrear}>
                    + Nuevo Usuario
                </button>
            </div>

            {error && <div style={styles.error}>{error}</div>}

            <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Email</th>
                            <th>Rol</th>
                            <th>Estado</th>
                            <th>Permisos</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usuarios.map(u => (
                            <tr key={u.id}>
                                <td>{u.nombre}</td>
                                <td>{u.email}</td>
                                <td>
                                    <span style={u.rol === 'admin' ? styles.badgeAdmin : styles.badgeUser}>
                                        {u.rol}
                                    </span>
                                </td>
                                <td>{u.activo ? '🟢 Activo' : '🔴 Inactivo'}</td>
                                <td>
                                    <small>{(u.permisos || []).length} permisos</small>
                                </td>
                                <td>
                                    <button onClick={() => abrirModal(u)} style={styles.btnEdit}>✏️</button>
                                    <button onClick={() => eliminarUsuario(u.id)} style={styles.btnDelete}>🗑️</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL */}
            {modalOpen && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h2>{usuarioEditar ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div style={styles.formGroup}>
                                <label>Nombre:</label>
                                <input name="nombre" value={formData.nombre} onChange={handleInputChange} required style={styles.input} />
                            </div>
                            <div style={styles.formGroup}>
                                <label>Email:</label>
                                <input type="email" name="email" value={formData.email} onChange={handleInputChange} required style={styles.input} />
                            </div>
                            <div style={styles.formGroup}>
                                <label>Contraseña {usuarioEditar && '(dejar en blanco para no cambiar)'}:</label>
                                <input type="password" name="password" value={formData.password} onChange={handleInputChange}
                                    required={!usuarioEditar} style={styles.input} />
                            </div>
                            <div style={styles.formGroup}>
                                <label>Rol:</label>
                                <select name="rol" value={formData.rol} onChange={handleInputChange} style={styles.input}>
                                    <option value="user">Usuario</option>
                                    <option value="admin">Administrador</option>
                                    <option value="manager">Gerente</option>
                                </select>
                            </div>

                            <div style={styles.formGroup}>
                                <label>Permisos:</label>
                                <div style={styles.permisosContainer}>
                                    {PERMISOS_DISPONIBLES.map(p => (
                                        <label key={p.id} style={styles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={formData.permisos.includes(p.id)}
                                                onChange={() => handlePermisoChange(p.id)}
                                            />
                                            {p.label}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div style={styles.formGroup}>
                                <label>
                                    <input type="checkbox" name="activo" checked={formData.activo} onChange={handleInputChange} />
                                    Usuario Activo
                                </label>
                            </div>

                            <div style={styles.modalActions}>
                                <button type="button" onClick={() => setModalOpen(false)} style={styles.btnCancel}>Cancelar</button>
                                <button type="submit" style={styles.btnSave}>Guardar</button>
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
    btnCrear: { background: '#4CAF50', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer' },
    tableContainer: { overflowX: 'auto', background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    table: { width: '100%', borderCollapse: 'collapse' },
    error: { background: '#ffebee', color: '#c62828', padding: '10px', marginBottom: '10px', borderRadius: '4px' },
    badgeAdmin: { background: '#E3F2FD', color: '#1565C0', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8em', fontWeight: 'bold' },
    badgeUser: { background: '#F5F5F5', color: '#616161', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8em' },
    btnEdit: { background: 'none', border: 'none', cursor: 'pointer', marginRight: '5px' },
    btnDelete: { background: 'none', border: 'none', cursor: 'pointer' },

    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { background: 'white', padding: '20px', borderRadius: '8px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' },
    formGroup: { marginBottom: '15px' },
    input: { width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' },
    permisosContainer: { display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '5px', background: '#f9f9f9', padding: '10px', borderRadius: '4px' },
    checkboxLabel: { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9em' },
    modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' },
    btnCancel: { background: '#ddd', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer' },
    btnSave: { background: '#2196F3', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer' }
};

export default AdminUsuariosPage;
