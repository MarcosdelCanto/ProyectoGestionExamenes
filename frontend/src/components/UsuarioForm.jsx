import React, { useState, useEffect } from 'react';
import { getRoles } from '../services/usuarioService';

export default function UsuarioForm({ initial, onSave, onClose }) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [rolId, setRolId] = useState('');
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    if (initial) {
      setNombre(initial.NOMBRE_USUARIO);
      setEmail(initial.EMAIL_USUARIO);
      setRolId(initial.ROL_ID_ROL);
    }
    getRoles().then((r) => setRoles(r));
  }, []);

  const submit = (e) => {
    e.preventDefault();
    onSave({ nombre_usuario: nombre, email_usuario: email, rol_id_rol: rolId });
  };

  return (
    <div className="modal show d-block" tabIndex="-1">
      <div className="modal-dialog">
        <form onSubmit={submit}>
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {initial ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Nombre</label>
                <input
                  type="text"
                  className="form-control"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Rol</label>
                <select
                  className="form-select"
                  value={rolId}
                  onChange={(e) => setRolId(e.target.value)}
                  required
                >
                  <option value="">-- Selecciona --</option>
                  {roles.map((r) => (
                    <option key={r.ID_ROL} value={r.ID_ROL}>
                      {r.NOMBRE_ROL}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Guardar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
