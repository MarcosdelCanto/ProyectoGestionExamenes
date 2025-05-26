import React from 'react';

function UsuarioList({
  usuarios,
  selectedUsuarios,
  onToggleUsuarioSelection,
  onToggleSelectAll,
  loading,
}) {
  if (loading) {
    return <div>Cargando usuarios...</div>;
  }

  if (!usuarios || usuarios.length === 0) {
    return <div>No hay usuarios para mostrar.</div>;
  }

  return (
    <table className="table table-responsive table-hover">
      <thead className="table-light">
        <tr>
          <th style={{ width: '5%' }} className="text-center align-middle">
            <input
              type="checkbox"
              className="form-check-input"
              checked={
                usuarios.length > 0 &&
                selectedUsuarios.length === usuarios.length
              }
              onChange={onToggleSelectAll}
              disabled={usuarios.length === 0}
            />
          </th>
          <th className="align-middle text-center">ID</th>
          <th className="align-middle">Nombre</th>
          <th className="align-middle">Email</th>
          <th className="align-middle">Rol</th>
        </tr>
      </thead>
      <tbody>
        {usuarios.map((u) => (
          <tr
            key={`usuario-${u.ID_USUARIO}`}
            onClick={() => onToggleUsuarioSelection(u)}
            className={`align-middle ${
              selectedUsuarios.find((su) => su.ID_USUARIO === u.ID_USUARIO)
                ? 'table-primary'
                : ''
            }`}
            style={{ cursor: 'pointer' }}
          >
            <td className="text-center">
              <input
                type="checkbox"
                className="form-check-input"
                checked={
                  !!selectedUsuarios.find(
                    (su) => su.ID_USUARIO === u.ID_USUARIO
                  )
                }
                onChange={(e) => {
                  e.stopPropagation(); // Evita que el onClick de la fila se dispare dos veces
                  onToggleUsuarioSelection(u);
                }}
              />
            </td>
            <td className="text-center">{u.ID_USUARIO}</td>
            <td>{u.NOMBRE_USUARIO}</td>
            <td>{u.EMAIL_USUARIO}</td>
            <td>{u.NOMBRE_ROL}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default UsuarioList;
