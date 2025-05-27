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
  return (
    <Row className="mb-3">
      <Col>
        <Button
          variant="success"
          onClick={onAddRole}
          disabled={isLoading}
          className="me-2 mb-2 btn-icon-only-candidate"
          title="Crear Nuevo Rol"
        >
          <i className="bi bi-plus-circle"></i>
          <span className="btn-responsive-text ms-2">Crear Nuevo Rol</span>
        </Button>
        <Button
          variant="warning"
          onClick={onEditRole}
          disabled={!selectedRole || isLoading}
          className="me-2 mb-2 btn-icon-only-candidate"
          title="Modificar Rol"
        >
          <i className="bi bi-pencil-square"></i>
          <span className="btn-responsive-text ms-2">Modificar Rol</span>
        </Button>
        <Button
          variant="danger"
          onClick={onDeleteRole}
          disabled={!selectedRole || isLoading}
          className="mb-2 btn-icon-only-candidate"
          title="Eliminar Rol"
        >
          <i className="bi bi-trash"></i>
          <span className="btn-responsive-text ms-2">Eliminar Rol</span>
        </Button>
      </Col>
    </Row>
  );
}
export default RoleActions;
