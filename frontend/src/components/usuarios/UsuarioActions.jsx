// No olvides importar useState y el componente Modal
import React, { useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import UserBulkUploadModal from '../cargaMasiva/UserBulkUploadModal'; // Asegúrate de que la ruta sea correcta

function UsuarioActions({
  onAdd,
  onEdit,
  onDelete, // onDelete ahora espera recibir los usuarios a eliminar (selectedUsuarios)
  selectedUsuarios,
  isLoadingList, // Prop para deshabilitar botones si la lista está cargando
  isProcessingAction, // Prop para deshabilitar si ya hay una acción en progreso
  onBulkUploadComplete, // Callback para cuando la carga masiva de usuarios finaliza
  onUploadResult, // Prop para pasar resultados de la carga masiva al padre
}) {
  // Estado para controlar la visibilidad del modal de confirmación de eliminación
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Determinar si los botones deben estar deshabilitados
  const isDisabled = isLoadingList || isProcessingAction;
  const canEdit = selectedUsuarios.length === 1; // Solo se puede editar si hay un único usuario seleccionado
  const canDelete = selectedUsuarios.length > 0; // Se puede eliminar si hay al menos un usuario seleccionado

  // Funciones para manejar la visibilidad del modal de confirmación
  const handleShowModal = () => setShowConfirmModal(true);
  const handleCloseModal = () => setShowConfirmModal(false);

  // Función que se ejecuta al confirmar la eliminación en el modal
  const handleConfirmDelete = () => {
    // Llama a la función 'onDelete' que viene del padre, pasándole los usuarios seleccionados
    onDelete(selectedUsuarios);
    // Luego cierra el modal de confirmación
    handleCloseModal();
  };

  return (
    <>
      {/* Usamos un Fragment (<>) para poder retornar el div y el Modal juntos */}
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

          {/* El botón Eliminar ahora abre el modal de confirmación */}
          <Button
            variant="danger"
            onClick={handleShowModal} // Llama a handleShowModal para abrir la confirmación
            disabled={isDisabled || !canDelete}
            className="btn-icon-only-candidate me-2 mb-2"
            title="Eliminar Selección"
          >
            <i className="bi bi-trash"></i>
            <span className="btn-responsive-text ms-2">Eliminar</span>
          </Button>

          {/* Componente para la carga masiva de usuarios */}
          <div className="me-2 mb-2">
            <UserBulkUploadModal
              onSuccess={onBulkUploadComplete}
              externalDisabled={isDisabled}
              onUploadResult={onUploadResult}
            />
          </div>
        </div>
      </div>

      {/* Componente del Modal de Confirmación de Eliminación */}
      <Modal show={showConfirmModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Mensaje dinámico según la cantidad de usuarios seleccionados */}
          ¿Estás seguro de que deseas eliminar {selectedUsuarios.length}{' '}
          {selectedUsuarios.length === 1 ? 'usuario' : 'usuarios'}{' '}
          seleccionado(s)? Esta acción no se puede deshacer.
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
