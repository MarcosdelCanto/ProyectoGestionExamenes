// No olvides importar useState y el componente Modal
import React, { useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import UserBulkUploadModal from '../cargaMasiva/UserBulkUploadModal';

function UsuarioActions({
  onAdd,
  onEdit,
  onDelete,
  selectedUsuarios,
  isLoadingList,
  isProcessingAction,
  onBulkUploadComplete,
  onUploadResult,
}) {
  // --- 1. Estado para controlar la visibilidad del modal ---
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const isDisabled = isLoadingList || isProcessingAction;
  const canEdit = selectedUsuarios.length === 1;
  const canDelete = selectedUsuarios.length > 0;

  // --- 2. Funciones para manejar el modal ---
  const handleShowModal = () => setShowConfirmModal(true);
  const handleCloseModal = () => setShowConfirmModal(false);

  const handleConfirmDelete = () => {
    // Llama a la función de eliminar que viene del padre
    onDelete();
    // Y luego cierra el modal
    handleCloseModal();
  };

  return (
    <>
      {/* Usamos un Fragment (<>) para poder retornar el div y el Modal juntos */}
      <div className="mb-3 d-flex flex-wrap align-items-center">
        <div className="usuario-action-buttons d-flex flex-wrap">
          <Button
            variant="success"
            onClick={onAdd}
            disabled={isDisabled}
            className="btn-icon-only-candidate me-2 mb-2"
            title="Añadir Usuario"
          >
            <i className="bi bi-plus-lg"></i>
            <span className="btn-responsive-text ms-2">Añadir Usuario</span>
          </Button>
          <Button
            variant="warning"
            onClick={onEdit}
            disabled={isDisabled || !canEdit}
            className="btn-icon-only-candidate me-2 mb-2"
            title="Modificar Usuario"
          >
            <i className="bi bi-pencil-square"></i>
            <span className="btn-responsive-text ms-2">Modificar</span>
          </Button>

          {/* --- 3. El botón Eliminar ahora abre el modal --- */}
          <Button
            variant="danger"
            onClick={handleShowModal} // En lugar de llamar a onDelete, llama a handleShowModal
            disabled={isDisabled || !canDelete}
            className="btn-icon-only-candidate me-2 mb-2"
            title="Eliminar Selección"
          >
            <i className="bi bi-trash"></i>
            <span className="btn-responsive-text ms-2">Eliminar</span>
          </Button>

          <div className="me-2 mb-2">
            <UserBulkUploadModal
              onSuccess={onBulkUploadComplete}
              externalDisabled={isDisabled}
              onUploadResult={onUploadResult}
            />
          </div>
        </div>
      </div>
      {/* --- 4. Aquí va el componente del Modal de Confirmación --- */}
      <Modal show={showConfirmModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Hacemos el mensaje un poco más dinámico */}
          ¿Estás seguro de que deseas eliminar {selectedUsuarios.length}
          usuario(s)? Esta acción no se puede deshacer.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete}>
            Sí, Eliminar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default UsuarioActions;
