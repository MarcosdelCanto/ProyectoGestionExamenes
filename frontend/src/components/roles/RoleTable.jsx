// src/components/roles/RoleTable.jsx
import React from 'react';
import { Table, Button, Alert } from 'react-bootstrap';

function RoleTable({
  roles,
  isLoading,
  selectedRole, // Nueva prop
  onSelectRole, // Nueva prop
}) {
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
    <div
      className="table-responsive border" // Estilo similar a ModuloTable
      style={{
        maxHeight: '70vh', // Altura máxima para el scroll, puedes ajustarla
        overflowY: 'auto',
        marginBottom: '1rem', // Margen inferior como en ModuloTable
      }}
    >
      <Table striped bordered hover responsive="sm" className="mb-0">
        <thead className="table-light position-sticky top-0">
          <tr>
            <th>ID</th>
            <th>Nombre del Rol</th>
            {/* Columna de Acciones eliminada */}
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => (
            <tr
              key={`role-${role.ID_ROL}`}
              onClick={() => onSelectRole(role)} // Seleccionar rol al hacer clic
              className={
                selectedRole?.ID_ROL === role.ID_ROL ? 'table-primary' : ''
              } // Resaltar fila seleccionada
              style={{ cursor: 'pointer' }}
            >
              <td>{role.ID_ROL}</td>
              <td>{role.NOMBRE_ROL}</td>
              {/* Celda de Acciones eliminada */}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default RoleTable;
