// src/components/roles/RoleTable.jsx
import React from 'react';
import { Table, Button, Alert } from 'react-bootstrap';

function RoleTable({
  roles,
  isLoading,
  selectedRoles, // Cambiado de selectedRole (objeto) a selectedRoles (array)
  onToggleRoleSelection, // Para seleccionar/deseleccionar un rol individual
  onToggleSelectAllRoles, // Para seleccionar/deseleccionar todos los roles
}) {
  // 'roles' aquí son los roles de la página actual
  // Mostrar "cargando" solo si no hay datos aún y isLoading es true
  if (isLoading && (!roles || roles.length === 0)) {
    return (
      <div className="text-center p-3">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando roles...</span>
        </div>
        <p className="mt-2">Cargando roles...</p>
      </div>
    );
  }

  if (!roles || roles.length === 0) {
    return (
      <Alert variant="info" className="text-center">
        No hay roles para mostrar. Puede crear uno nuevo utilizando el botón de
        arriba.
      </Alert>
    );
  }

  return (
    <div className="table-responsive border mb-3">
      <table className="table table-hover table-bordered mb-0">
        <thead className="table-light">
          <tr>
            <th style={{ width: '5%' }} className="text-center align-middle">
              <input
                type="checkbox"
                className="form-check-input"
                checked={
                  roles.length > 0 &&
                  roles.every((role) =>
                    selectedRoles.some((sr) => sr.ID_ROL === role.ID_ROL)
                  )
                }
                onChange={onToggleSelectAllRoles}
                disabled={roles.length === 0}
                aria-label="Seleccionar todos los roles"
              />
            </th>
            <th>ID</th>
            <th>Nombre del Rol</th>
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => (
            <tr
              key={`role-${role.ID_ROL}`}
              onClick={() => onToggleRoleSelection(role)} // Cambiado para usar la nueva función de toggle
              className={`align-middle ${
                selectedRoles.find((r) => r.ID_ROL === role.ID_ROL)
                  ? 'table-primary'
                  : ''
              }`} // Resaltar si está en el array de seleccionados
              style={{ cursor: 'pointer' }}
            >
              <td className="text-center align-middle">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={
                    !!selectedRoles.find((r) => r.ID_ROL === role.ID_ROL)
                  }
                  onChange={(e) => {
                    e.stopPropagation(); // Evita que el onClick de la fila se dispare también
                    onToggleRoleSelection(role);
                  }}
                  aria-label={`Seleccionar rol ${role.NOMBRE_ROL || role.ID_ROL}`}
                />
              </td>
              <td>{role.ID_ROL}</td>
              <td>{role.NOMBRE_ROL}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default RoleTable;
