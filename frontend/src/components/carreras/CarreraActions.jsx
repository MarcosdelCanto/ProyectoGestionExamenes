import React, { useState } from 'react';
import { Button, Col, Row } from 'react-bootstrap';
import UpdateCarreraPlanModal from './UpdateCarreraPlanModal'; // Asegúrate de que la ruta sea correcta

function CarreraActions({
  onAdd,
  onEdit,
  onDelete,
  selectedCarreras, // Cambiado de selectedCarrera a selectedCarreras
  onRefetchData, // Añadido para permitir recargar datos después de la carga masiva
}) {
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const canEdit = selectedCarreras && selectedCarreras.length === 1;
  const canDelete = selectedCarreras && selectedCarreras.length > 0;

  const handleOpenUpdateModal = () => setShowUpdateModal(true);
  const handleCloseUpdateModal = () => setShowUpdateModal(false);

  // Función para manejar la finalización de la carga en el modal
  const handleUpdateComplete = (result) => {
    console.log('Carga masiva de actualización de carrera completada:', result);
    if (result.success) {
      // Si la carga fue exitosa, recargamos los datos de la tabla de carreras
      if (typeof onRefetchData === 'function') {
        onRefetchData();
      }
    }
    handleCloseUpdateModal(); // Cerrar el modal después de la carga, sin importar el resultado
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

        {/* Nuevo botón para la actualización masiva de carreras por plan de estudio */}
        <Button
          variant="primary" // O el color que prefieras para esta acción
          onClick={handleOpenUpdateModal}
          className="ms-2 mb-2 btn-icon-only-candidate" // Añadido margen izquierdo y las clases de estilo
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
