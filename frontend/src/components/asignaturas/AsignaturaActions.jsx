import React from 'react';
import { Button, Col, Row } from 'react-bootstrap';

function AsignaturaActions({
  onAdd,
  onEdit,
  onDelete,
  selectedAsignaturas, // Cambiado de selectedAsignatura a selectedAsignaturas
  // isLoading,
}) {
  const canEdit = selectedAsignaturas && selectedAsignaturas.length === 1;
  const canDelete = selectedAsignaturas && selectedAsignaturas.length > 0;

  return (
    <Row className="mb-3">
      <Col>
        <Button
          variant="success"
          onClick={onAdd}
          // disabled={isLoading}
          className="me-2 mb-2 btn-icon-only-candidate"
          title="Agregar Nueva Asignatura"
        >
          <i className="bi bi-plus"></i>
          <span className="btn-responsive-text ms-2">Agregar Asignatura</span>
        </Button>
        <Button
          variant="warning"
          onClick={onEdit}
          disabled={!canEdit /*|| isLoading*/}
          className="me-2 mb-2 btn-icon-only-candidate"
          title="Modificar Asignatura Seleccionada"
        >
          <i className="bi bi-pencil-square"></i>
          <span className="btn-responsive-text ms-2">Modificar Asignatura</span>
        </Button>
        <Button
          variant="danger"
          onClick={onDelete}
          disabled={!canDelete /*|| isLoading*/}
          className="mb-2 btn-icon-only-candidate"
          title="Eliminar Asignaturas Seleccionadas"
        >
          <i className="bi bi-trash"></i>
          <span className="btn-responsive-text ms-2">Eliminar Asignatura</span>
        </Button>
      </Col>
    </Row>
  );
}

export default AsignaturaActions;
