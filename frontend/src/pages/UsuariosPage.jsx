import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import {
  listUsuarios,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  importUsuarios,
  resetPassword,
} from '../services/usuarioService';
import UsuarioTable from '../components/UsuarioTable';
import UsuarioForm from '../components/UsuarioForm';
import CSVUpload from '../components/CSVUpload';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); //usuario a editar
  const [showForm, setShowForm] = useState(false); //para mostrar el formulario

  const [msgModal, setMsgModal] = useState(null); //para mostrar el modal de mensaje

  const fetch = async () => {
    setLoading(true);
    const data = await listUsuarios();
    setUsuarios(data);
    setLoading(false);
  };

  useEffect(() => {
    fetch();
  }, []);

  const onSave = async ({ nombre, email, rolId }) => {
    const payload = {
      nombre_usuario: nombre,
      email_usuario: email,
      rol_id_rol: rolId,
    };
    try {
      let result;
      if (editing) {
        result = await updateUsuario(editing.ID_USUARIO, payload);
      } else {
        result = await createUsuario(payload);
      }
      setShowForm(false);
      setEditing(null);
      fetch();
      setMsgModal({
        tittle: 'Usuario guardado',
        body: editing
          ? 'El usuario ha sido actualizado correctamente'
          : `Usuario creado con contraseña: ${result.password}`,
      });
    } catch (err) {
      if (err.response?.status === 409) {
        alert(err.response.data.message);
      } else {
        console.error('Error guardando usuario:', err);
        alert('Error guardando usuario');
      }
    }
  };
  // resetear contraseña
  const handleResetPassword = async (id) => {
    const { password } = await resetPassword(id);
    setMsgModal({
      title: 'Contraseña reseteada',
      body: `La contraseña del usuario ha sido reseteada a: ${password}`,
    });
  };

  const onDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      await deleteUsuario(id);
      fetch();
    }
  };
  const onImport = async (file) => {
    await importUsuarios(file);
    fetch();
  };

  return (
    <>
      <Layout>
        <div className="container mt-4">
          <h2>Gestión de Usuarios</h2>
          <div className="mb-3 d-flex align-items-center">
            <button
              className="btn btn-primary me-2"
              onClick={() => {
                setEditing(null);
                setShowForm(true);
              }}
            >
              Nuevo Usuario
            </button>
            <CSVUpload onImport={onImport} />
          </div>

          {loading ? (
            <p>Cargando…</p>
          ) : (
            <UsuarioTable
              usuarios={usuarios}
              onEdit={(u) => {
                setEditing(u);
                setShowForm(true);
              }}
              onDelete={onDelete}
              handleResetPassword={handleResetPassword}
            />
          )}

          {showForm && (
            <UsuarioForm
              initial={editing}
              onClose={() => {
                setShowForm(false);
                setEditing(null);
              }}
              onSave={onSave}
            />
          )}
        </div>

        {/* Modal manual */}
      </Layout>
      {msgModal && (
        <div
          className="modal fade show"
          tabIndex="-1"
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{msgModal.title}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setMsgModal(null)}
                />
              </div>
              <div className="modal-body">
                <p>{msgModal.body}</p>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-primary"
                  onClick={() => setMsgModal(null)}
                >
                  Aceptar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
