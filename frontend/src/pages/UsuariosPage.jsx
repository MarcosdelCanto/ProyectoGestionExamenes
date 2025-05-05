import React, { useEffect, useState } from 'react';
import {
  listUsuarios,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  importUsuarios,
} from '../services/usuarioService';
import UsuarioTable from '../components/UsuarioTable';
import UsuarioForm from '../components/UsuarioForm';
import CSVUpload from '../components/CSVUpload';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); //usuario a editar
  const [showForm, setShowForm] = useState(false); //para mostrar el formulario

  const fetch = async () => {
    setLoading(true);
    const data = await listUsuarios();
    setUsuarios(data);
    setLoading(false);
  };

  useEffect(() => {
    fetch();
  }, []);

  const onSave = async (usuario) => {
    if (editing) {
      await updateUsuario(editing.ID_USUARIO, usuario);
    } else {
      await createUsuario(usuario);
    }
    setShowForm(false);
    setEditing(null);
    fetch();
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
    <div className="container mt-4">
      <h2>Gestión de Usuarios</h2>

      <div className="d-flex mb-3">
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
        <p>Cargando...</p>
      ) : (
        <UsuarioTable
          usuarios={usuarios}
          onEdit={(u) => {
            setEditing(u);
            setShowForm(true);
          }}
          onDelete={onDelete}
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
  );
}
