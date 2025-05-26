// src/components/roles/RoleActions.jsx
import React from 'react';
import { Button, Col, Row } from 'react-bootstrap';

function RoleActions({
  onAddRole,
  isLoading,
  onEditRole,
  onDeleteRole,
  selectedRole,
}) {
  // onAddRole: Función para manejar la creación de un nuevo rol
  // isLoading: Booleano para indicar si la acción está en proceso
  return (
    <Row className="mb-3">
      <Col>
        {/* Cambiado variant a 'success' para parecerse a ModuloActions, manteniendo el icono y texto de roles */}
        <Button
          variant="success"
          onClick={onAddRole}
          disabled={isLoading}
          className="me-2 mb-2"
        >
          <i className="bi bi-plus-circle me-2"></i> Crear Nuevo Rol
        </Button>
        <Button
          variant="warning"
          onClick={onEditRole}
          disabled={!selectedRole || isLoading}
          className="me-2 mb-2"
        >
          <i className="bi bi-pencil-square me-2"></i> Modificar Rol
        </Button>
        <Button
          variant="danger"
          onClick={onDeleteRole}
          disabled={!selectedRole || isLoading}
          className="mb-2"
        >
          <i className="bi bi-trash me-2"></i> Eliminar Rol
        </Button>
      </Col>
    </Row>
  );
}
export default RoleActions;
