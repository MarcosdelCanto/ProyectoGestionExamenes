import React from 'react';
import { Button, Col, Row } from 'react-bootstrap';

function CarreraActions({
  onAdd,
  onEdit,
  onDelete,
  selectedCarreras, // Cambiado de selectedCarrera a selectedCarreras
  // isLoading,
}) {
  const canEdit = selectedCarreras && selectedCarreras.length === 1;
  const canDelete = selectedCarreras && selectedCarreras.length > 0;

  return (
    <Row className="mb-3">
      <Col>
        <Button
          variant="success"
          onClick={onAdd}
          // disabled={isLoading}
          className="me-2 mb-2 btn-icon-only-candidate"
          title="Agregar Nueva Carrera"
        >
          <i className="bi bi-plus"></i>
          <span className="btn-responsive-text ms-2">Agregar Carrera</span>
        </Button>
        <Button
          variant="warning"
          onClick={onEdit}
          disabled={!canEdit /*|| isLoading*/}
          className="me-2 mb-2 btn-icon-only-candidate"
          title="Modificar Carrera Seleccionada"
        >
          <i className="bi bi-pencil-square"></i>
          <span className="btn-responsive-text ms-2">Modificar Carrera</span>
        </Button>
        <Button
          variant="danger"
          onClick={onDelete}
          disabled={!canDelete /*|| isLoading*/}
          className="mb-2 btn-icon-only-candidate"
          title="Eliminar Carreras Seleccionadas"
        >
          <i className="bi bi-trash"></i>
          <span className="btn-responsive-text ms-2">Eliminar Carrera</span>
        </Button>
      </Col>
    </Row>
  );
}

export default CarreraActions;
