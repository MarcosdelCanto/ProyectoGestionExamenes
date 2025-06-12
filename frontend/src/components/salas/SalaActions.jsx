import React from 'react';
import { Button } from 'react-bootstrap';
import SalaBulkUploadModal from '../cargaMasiva/SalaBulkUploadModal';

function SalaActions({
  onAdd,
  onEdit,
  onDelete,
  selectedSalas, // Cambiado de selectedSala a selectedSalas (array)
  isLoadingList,
  isProcessingAction,
  onBulkUploadComplete,
  onUploadResult,
}) {
  const baseDisabled = isLoadingList || isProcessingAction;

  return (
    <div className="mb-2 d-flex flex-wrap align-items-center">
      <div className="sala-action-buttons d-flex flex-wrap">
        <Button
          variant="success"
          onClick={onAdd}
          disabled={baseDisabled}
          className="btn-icon-only-candidate me-2 mb-2"
          title="Agregar Sala"
        >
          <i className="bi bi-plus-lg"></i>
          <span className="btn-responsive-text ms-2">Agregar Sala</span>
        </Button>

        <Button
          variant="warning"
          onClick={onEdit}
          disabled={
            baseDisabled || !selectedSalas || selectedSalas.length !== 1
          }
          className="btn-icon-only-candidate me-2 mb-2"
          title="Modificar Sala"
        >
          <i className="bi bi-pencil-square"></i>
          <span className="btn-responsive-text ms-2">Modificar</span>
        </Button>

        <Button
          variant="danger"
          onClick={onDelete}
          disabled={
            baseDisabled || !selectedSalas || selectedSalas.length === 0
          }
          className="btn-icon-only-candidate me-2 mb-2"
          title="Eliminar Sala"
        >
          <i className="bi bi-trash"></i>
          <span className="btn-responsive-text ms-2">Eliminar</span>
        </Button>

        <div className="me-2 mb-2">
          <SalaBulkUploadModal
            onSuccess={onBulkUploadComplete}
            externalDisabled={baseDisabled}
            onUploadResult={onUploadResult}
          />
        </div>
      </div>
    </div>
  );
}

export default SalaActions;
