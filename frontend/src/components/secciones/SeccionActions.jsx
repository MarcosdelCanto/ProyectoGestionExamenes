import React from 'react';
import { Button, Col, Row } from 'react-bootstrap';

function SeccionActions({
  onAdd,
  onEdit,
  onDelete,
  selectedSecciones, // Este es el array de secciones seleccionadas
  // isLoading, // Descomenta si usas un estado de carga para los botones
}) {
  // Determinar si los botones deben estar habilitados
  const canEdit = selectedSecciones && selectedSecciones.length === 1;
  const canDelete = selectedSecciones && selectedSecciones.length > 0;

  return (
    <Row className="mb-3">
      <Col>
        <Button
          variant="success"
          onClick={onAdd}
          // disabled={isLoading}
          className="me-2 mb-2 btn-icon-only-candidate"
          title="Agregar Nueva Sección"
        >
          <i className="bi bi-plus"></i>
          <span className="btn-responsive-text ms-2">Agregar Sección</span>
        </Button>
        <Button
          variant="warning"
          onClick={onEdit}
          disabled={!canEdit /*|| isLoading*/}
          className="me-2 mb-2 btn-icon-only-candidate"
          title="Modificar Sección Seleccionada"
        >
          <i className="bi bi-pencil-square"></i>
          <span className="btn-responsive-text ms-2">Modificar Sección</span>
        </Button>
        <Button
          variant="danger"
          onClick={onDelete}
          disabled={!canDelete /*|| isLoading*/}
          className="mb-2 btn-icon-only-candidate"
          title="Eliminar Secciones Seleccionadas"
        >
          <i className="bi bi-trash"></i>
          <span className="btn-responsive-text ms-2">Eliminar Sección</span>
        </Button>
      </Col>
    </Row>
  );
}

export default SeccionActions;
