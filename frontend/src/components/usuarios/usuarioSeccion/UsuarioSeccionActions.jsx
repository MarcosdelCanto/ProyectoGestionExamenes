import React from 'react';
import { Button } from 'react-bootstrap';

function UsuarioSeccionActions({
  onNewAssociation,
  onEditSelected,
  onBulkDelete,
  processing,
  selectedCount,
}) {
  return (
    <div className="mb-3 d-flex justify-content-start">
      <Button
        variant="success"
        onClick={onNewAssociation}
        className="me-2"
        disabled={processing}
      >
        <i className="bi bi-plus me-2"></i>Nueva Asociación
      </Button>
      <Button
        variant="warning"
        onClick={onEditSelected}
        className="me-2"
        disabled={processing || selectedCount !== 1}
      >
        <i className="bi bi-pencil-square me-2"></i>Modificar
      </Button>
      <Button
        variant="danger"
        onClick={onBulkDelete}
        disabled={processing || selectedCount === 0}
      >
        <i className="bi bi-trash3 me-2"></i>Desvincular Todo de Seleccionados
      </Button>
    </div>
  );
}

export default UsuarioSeccionActions;
