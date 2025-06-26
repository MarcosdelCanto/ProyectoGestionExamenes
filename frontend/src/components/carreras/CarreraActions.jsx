import React, { useState } from 'react';
import { Button, Col, Row } from 'react-bootstrap';
import UpdateCarreraPlanModal from './UpdateCarreraPlanModal'; // Asegúrate de que la ruta sea correcta

function CarreraActions({
  onAdd,
  onEdit,
  onDelete,
  selectedCarreras,
  onRefetchData, // Prop para recargar los datos desde la página principal
}) {
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const canEdit = selectedCarreras && selectedCarreras.length === 1;
  const canDelete = selectedCarreras && selectedCarreras.length > 0;

  const handleOpenUpdateModal = () => setShowUpdateModal(true);
  const handleCloseUpdateModal = () => setShowUpdateModal(false);

  /**
   * Esta función se ejecuta cuando el modal de carga masiva termina.
   * Si la operación fue exitosa, llama a la función para recargar los datos.
   * @param {object} result - El resultado de la operación de carga.
   */
  const handleUpdateComplete = (result) => {
    console.log('Carga masiva de actualización de carrera completada:', result);
    if (result.success) {
      // Si la carga fue exitosa, se llama a la función para recargar los datos de la tabla.
      if (typeof onRefetchData === 'function') {
        onRefetchData();
      }
    }
    // Siempre se cierra el modal al finalizar, sin importar el resultado.
    handleCloseUpdateModal();
  };

  return (
    <Row className="mb-3">
      <Col>
        <Button
          variant="success"
          onClick={onAdd}
          className="me-2 mb-2 btn-icon-only-candidate"
          title="Agregar Nueva Carrera"
        >
          <i className="bi bi-plus"></i>
          <span className="btn-responsive-text ms-2">Agregar Carrera</span>
        </Button>
        <Button
          variant="warning"
          onClick={onEdit}
          disabled={!canEdit}
          className="me-2 mb-2 btn-icon-only-candidate"
          title="Modificar Carrera Seleccionada"
        >
          <i className="bi bi-pencil-square"></i>
          <span className="btn-responsive-text ms-2">Modificar Carrera</span>
        </Button>
        <Button
          variant="danger"
          onClick={onDelete}
          disabled={!canDelete}
          className="mb-2 btn-icon-only-candidate"
          title="Eliminar Carreras Seleccionadas"
        >
          <i className="bi bi-trash"></i>
          <span className="btn-responsive-text ms-2">Eliminar Carrera</span>
        </Button>

        {/* Botón para la actualización masiva de carreras por plan de estudio */}
        <Button
          variant="primary"
          onClick={handleOpenUpdateModal}
          className="ms-2 mb-2 btn-icon-only-candidate"
          title="Actualizar Nombres y Planes de Carrera por Carga Masiva"
        >
          <i className="bi bi-upload"></i>
          <span className="btn-responsive-text ms-2">
            Actualizar Carreras (Plan Estudio)
          </span>
        </Button>

        {/* Modal para la nueva funcionalidad */}
        <UpdateCarreraPlanModal
          show={showUpdateModal}
          handleClose={handleCloseUpdateModal}
          onUpdateComplete={handleUpdateComplete}
        />
      </Col>
    </Row>
  );
}

export default CarreraActions;
