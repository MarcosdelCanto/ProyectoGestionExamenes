import React from 'react';
import { Button } from 'react-bootstrap';
import UserBulkUploadModal from '../cargaMasiva/UserBulkUploadModal';

function UsuarioActions({
  onAdd,
  onEdit,
  onDelete, // Esta es la función que viene del padre para abrir el modal
  selectedUsuarios,
  isLoadingList,
  isProcessingAction,
  onBulkUploadComplete,
  onUploadResult,
}) {
  // --- INICIO DE LA CORRECCIÓN ---
  // Se eliminan todos los estados y manejadores del modal local que causaban el conflicto.
  // const [showConfirmModal, setShowConfirmModal] = useState(false);
  // const handleShowModal = () => setShowConfirmModal(true);
  // const handleCloseModal = () => setShowConfirmModal(false);
  // const handleConfirmDelete = () => { ... };
  // --- FIN DE LA CORRECCIÓN ---

  const isDisabled = isLoadingList || isProcessingAction;
  const canEdit = selectedUsuarios.length === 1;
  const canDelete = selectedUsuarios.length > 0;

  return (
    <div className="mb-2 d-flex flex-wrap align-items-center">
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

        {/* --- CORRECCIÓN CLAVE --- */}
        {/* El botón "Eliminar" ahora llama directamente a la función 'onDelete' del padre, */}
        {/* que es la encargada de abrir el modal correcto y detallado. */}
        <Button
          variant="danger"
          onClick={onDelete}
          disabled={isDisabled || !canDelete}
          className="btn-icon-only-candidate me-2 mb-2"
          title="Eliminar Selección"
        >
          <i className="bi bi-trash"></i>
          <span className="btn-responsive-text ms-2">Eliminar</span>
        </Button>
        {/* --- FIN DE LA CORRECCIÓN --- */}

        <div className="me-2 mb-2">
          <UserBulkUploadModal
            onSuccess={onBulkUploadComplete}
            externalDisabled={isDisabled}
            onUploadResult={onUploadResult}
          />
        </div>
      </div>
      {/* Ya no hay un <Modal> aquí, porque se gestiona desde la página principal */}
    </div>
  );
}

export default UsuarioActions;
