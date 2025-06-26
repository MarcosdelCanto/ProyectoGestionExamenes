// src/components/roles/RoleActions.jsx
import React from 'react';
import { Button, Col, Row } from 'react-bootstrap';
import { usePermission } from '../../hooks/usePermission';

function RoleActions({
  onAddRole,
  isLoading,
  onEditRole,
  onDeleteRole,
  selectedRoles, // Cambiado de selectedRole a selectedRoles (array)
}) {
  // Usamos el hook para obtener los permisos desde la BBDD
  const { hasPermission } = usePermission();

  return (
    <Row className="mb-3">
      <Col>
        {/* Solo mostramos botón si el usuario tiene el permiso CREAR ROLES */}
        {hasPermission('CREAR ROLES') && (
          <Button
            variant="success"
            onClick={onAddRole}
            disabled={isLoading}
            className="me-2 mb-2 btn-icon-only-candidate"
            title="Crear Nuevo Rol"
          >
            <i className="bi bi-plus-lg"></i>
            <span className="btn-responsive-text ms-2">Crear Nuevo Rol</span>
          </Button>
        )}

        {/* Solo mostramos botón si el usuario tiene el permiso EDITAR ROLES */}
        {hasPermission('EDITAR ROLES') && (
          <Button
            variant="warning"
            onClick={onEditRole}
            disabled={isLoading || selectedRoles.length !== 1} // Habilitar solo si hay exactamente un rol seleccionado
            className="me-2 mb-2 btn-icon-only-candidate"
            title="Modificar Rol"
          >
            <i className="bi bi-pencil-square"></i>
            <span className="btn-responsive-text ms-2">Modificar Rol</span>
          </Button>
        )}

        {/* Solo mostramos botón si el usuario tiene el permiso ELIMINAR ROLES */}
        {hasPermission('ELIMINAR ROLES') && (
          <Button
            variant="danger"
            onClick={onDeleteRole}
            disabled={isLoading || selectedRoles.length === 0} // Habilitar si hay al menos un rol seleccionado
            className="mb-2 btn-icon-only-candidate"
            title="Eliminar Rol"
          >
            <i className="bi bi-trash"></i>
            <span className="btn-responsive-text ms-2">Eliminar Rol</span>
          </Button>
        )}
      </Col>
    </Row>
  );
}

export default RoleActions;
