import React from 'react';
import { Button, Col, Row } from 'react-bootstrap';

function EscuelaActions({
  onAdd,
  onEdit,
  onDelete,
  selectedEscuelas, // Cambiado de selectedEscuela a selectedEscuelas
  // isLoading,
}) {
  const canEdit = selectedEscuelas && selectedEscuelas.length === 1;
  const canDelete = selectedEscuelas && selectedEscuelas.length > 0;

  return (
    <Row className="mb-3">
      <Col>
        <Button
          variant="success"
          onClick={onAdd}
          // disabled={isLoading}
          className="me-2 mb-2 btn-icon-only-candidate"
          title="Agregar Nueva Escuela"
        >
          <i className="bi bi-plus"></i>
          <span className="btn-responsive-text ms-2">Agregar Escuela</span>
        </Button>
        <Button
          variant="warning"
          onClick={onEdit}
          disabled={!canEdit /*|| isLoading*/}
          className="me-2 mb-2 btn-icon-only-candidate"
          title="Modificar Escuela Seleccionada"
        >
          <i className="bi bi-pencil-square"></i>
          <span className="btn-responsive-text ms-2">Modificar Escuela</span>
        </Button>
        <Button
          variant="danger"
          onClick={onDelete}
          disabled={!canDelete /*|| isLoading*/}
          className="mb-2 btn-icon-only-candidate"
          title="Eliminar Escuelas Seleccionadas"
        >
          <i className="bi bi-trash"></i>
          <span className="btn-responsive-text ms-2">Eliminar Escuela</span>
        </Button>
      </Col>
    </Row>
  );
}

export default EscuelaActions;
