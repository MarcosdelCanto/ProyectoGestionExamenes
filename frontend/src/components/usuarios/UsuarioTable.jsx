import React from 'react';
import { Button } from 'react-bootstrap'; // Importar Button

function UsuarioTable({
  usuarios,
  selectedUsuarios,
  onToggleUsuarioSelection,
  onToggleSelectAll,
  onShowUserCarreras, // Nueva prop
  onShowUserSecciones, // Nueva prop
  loading,
}) {
  // Mostrar "cargando" solo si no hay datos aún y isLoading es true
  if (loading && (!usuarios || usuarios.length === 0)) {
    return (
      <div className="text-center p-3">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando Usuarios...</span>
        </div>
        <p className="mt-2">Cargando Usuarios...</p>
      </div>
    );
  }

  return (
    <div
      className="table-responsive border mb-3"
      style={{ overflowY: 'hidden' }} // Esto ocultará el scroll vertical en ESTE div
    >
      <table className="table table-hover table-bordered mb-0">
        <thead className="table-light">
          <tr>
            <th className="text-center align-middle">
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
            <th className="align-middle text-center">Asociaciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr
              key={`usuario-${u.ID_USUARIO}`}
              onClick={() => onToggleUsuarioSelection(u)}
              className={`align-middle ${
                // No aplicar table-primary directamente en la fila por el click
                selectedUsuarios.find((su) => su.ID_USUARIO === u.ID_USUARIO)
                  ? 'table-primary'
                  : ''
              } `}
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
              <td className="text-center">
                {/* Solo mostrar iconos si el rol es elegible para alguna asociación */}
                {(u.NOMBRE_ROL === 'COORDINADOR' ||
                  u.NOMBRE_ROL === 'DIRECTOR') && (
                  <Button
                    variant="outline-info"
                    size="sm"
                    className="me-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onShowUserCarreras(u);
                    }}
                    title="Ver Carreras Asociadas"
                  >
                    <i className="bi bi-diagram-3"></i>
                    {/* Icono para carreras */}
                  </Button>
                )}
                {(u.NOMBRE_ROL === 'ALUMNO' || u.NOMBRE_ROL === 'DOCENTE') && (
                  <Button
                    variant="outline-success"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onShowUserSecciones(u);
                    }}
                    title="Ver Secciones Asociadas"
                  >
                    <i className="bi bi-list-task"></i>
                    {/* Icono para secciones */}
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UsuarioTable;
