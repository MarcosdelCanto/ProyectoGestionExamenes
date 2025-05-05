import React from 'react';

export default function UsuarioTable({ usuarios, onEdit, onDelete }) {
  return (
    <table className="table table-striped">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Email</th>
          <th>Rol</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {usuarios.map((u) => (
          <tr key={u.ID_USUARIO}>
            <td>{u.NOMBRE_USUARIO}</td>
            <td>{u.EMAIL_USUARIO}</td>
            <td>{u.ROL_ID_ROL}</td>
            <td>
              <button
                className="btn btn-sm btn-outline-secondary me-2"
                onClick={() => onEdit(u)}
              >
                Editar
              </button>
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={() => onDelete(u.ID_USUARIO)}
              >
                Borrar
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
