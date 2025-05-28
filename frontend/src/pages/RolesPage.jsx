// src/pages/RolesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import {
  fetchAllRoles,
  createRole,
  updateRole,
  deleteRole,
} from '../services/rolService';
import { Alert, Container, Row, Col, Modal, Button } from 'react-bootstrap'; // Añadir Modal y Button
import RoleActions from '../components/roles/RoleActions';
import RoleTable from '../components/roles/RoleTable';
import RoleForm from '../components/roles/RoleForm';
function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Para errores a nivel de página
  const [modalError, setModalError] = useState(null); // Para errores dentro del modal
  const [successMessage, setSuccessMessage] = useState('');

  const [isProcessing, setIsProcessing] = useState(false); // Para el estado de envío del formulario
  // Estado para el modal: type puede ser 'add', 'edit', 'delete'. data es el rol actual.
  const [modalState, setModalState] = useState({
    type: null,
    data: null,
    show: false,
  });
  const [selectedRole, setSelectedRole] = useState(null); // Estado para el rol seleccionado

  const loadRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllRoles();
      // Asumiendo que fetchAllRoles devuelve el array de roles directamente o dentro de una propiedad 'data'
      setRoles(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError('Error al cargar los roles. Intente de nuevo más tarde.');
      console.error('Error en loadRoles:', err);
      setRoles([]);
    } finally {
      setSelectedRole(null); // Deseleccionar cualquier rol al recargar
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 4000); // Mensaje visible por 4 segundos
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const openModal = (type, roleData = null) => {
    setModalError(null); // Limpiar errores del modal al abrir
    if (type === 'edit' && roleData) setSelectedRole(roleData); // Asegurar que el rol para editar esté seleccionado
    setModalState({ type, data: roleData, show: true });
  };

  const handleCloseModal = () => {
    setModalState({ type: null, data: null, show: false });
    setModalError(null);
    // No deseleccionar aquí para que RoleActions siga reflejando la selección si el modal se cierra sin guardar
  };

  // Renombrar la función para que coincida con la prop onSubmit y ajustar el parámetro
  const handleSubmitForm = async (formDataFromForm) => {
    // El rol actual para edición se toma de modalState.data
    const currentRoleForSubmit =
      modalState.type === 'edit' ? modalState.data : null;
    if (modalState.type !== 'add' && modalState.type !== 'edit') {
      console.error(
        'handleSubmitForm llamado con tipo de modal incorrecto:',
        modalState.type
      );
      return;
    }
    setModalError(null);
    setSuccessMessage('');

    if (!formDataFromForm.NOMBRE_ROL.trim()) {
      setModalError('El nombre del rol es obligatorio.');
      return;
    }

    setIsProcessing(true);
    try {
      if (currentRoleForSubmit) {
        // Si estamos editando
        await updateRole(currentRoleForSubmit.ID_ROL, formDataFromForm);
        setSuccessMessage('Rol actualizado exitosamente.');
      } else {
        await createRole(formDataFromForm);
        setSuccessMessage('Rol creado exitosamente.');
      }
      loadRoles();
      handleCloseModal();
    } catch (err) {
      console.error('Error en handleSubmitForm:', err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Error al guardar el rol.';
      // Si el error es por duplicado (ej. 409 Conflict)
      if (err.response?.status === 409) {
        setModalError(errorMessage);
      } else {
        setModalError(
          err.message || // Usar el mensaje de error de la respuesta si está disponible
            'Ocurrió un error inesperado. Por favor, intente de nuevo.'
        );
      }
      // También podrías mostrar un error a nivel de página si el modal se cierra por el error
      // setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (roleId) => {
    // Esta función ahora solo abre el modal de confirmación de borrado
    // Encuentra el rol por ID para pasarlo al modal si necesitas mostrar su nombre, etc.
    const roleToDelete = roles.find((r) => r.ID_ROL === roleId);
    if (roleToDelete) {
      openModal('delete', roleToDelete);
      setSelectedRole(roleToDelete); // Asegurar que el rol para eliminar esté seleccionado
    } else {
      console.error('Rol no encontrado para eliminar:', roleId);
      setError('No se pudo encontrar el rol para eliminar.');
    }
  };

  const handleConfirmDelete = async () => {
    if (modalState.type !== 'delete' || !modalState.data) return;
    setIsProcessing(true); // Usar el mismo estado de procesamiento
    setError(null);
    setSuccessMessage('');
    try {
      await deleteRole(modalState.data.ID_ROL);
      setSuccessMessage('Rol eliminado exitosamente.');
      loadRoles();
      handleCloseModal();
      setSelectedRole(null); // Deseleccionar después de eliminar
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Error al eliminar el rol.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Funciones para los botones de RoleActions
  const handleAddAction = () => {
    setSelectedRole(null); // Deseleccionar al añadir nuevo
    openModal('add');
  };

  const handleEditAction = () => {
    if (selectedRole) {
      openModal('edit', selectedRole);
    }
  };

  // handleDelete ya maneja la apertura del modal de borrado para el rol seleccionado o desde la tabla
  return (
    <Layout>
      <Container fluid>
        <div>
          <p className="display-5 page-title-custom mb-2">
            {' '}
            {/* Clase de UsuariosPage */}
            <i className="bi bi-shield-lock-fill me-3"></i>
            Gestión de Roles y Accesos
          </p>
        </div>
        <hr />
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}
        {successMessage && (
          <Alert
            variant="success"
            onClose={() => setSuccessMessage('')}
            dismissible
          >
            {successMessage}
          </Alert>
        )}
        <RoleActions
          onAddRole={handleAddAction}
          onEditRole={handleEditAction}
          onDeleteRole={() => {
            // onDeleteRole en RoleActions ahora abre el modal de confirmación para el selectedRole
            if (selectedRole) handleDelete(selectedRole.ID_ROL);
          }}
          selectedRole={selectedRole}
          isLoading={loading || isProcessing} // Combinar estados de carga
        />
        {/* No hay filtros para roles en esta versión, pero aquí iría el UsuarioFilter si se necesitara */}
        <RoleTable
          roles={roles}
          selectedRole={selectedRole} // Pasar el rol seleccionado a la tabla
          onSelectRole={setSelectedRole} // Permitir que la tabla actualice el rol seleccionado
          onEditRole={(role) => openModal('edit', role)}
          onDeleteRole={handleDelete}
          isLoading={loading && roles.length === 0} // Mostrar "cargando" solo si no hay roles aún
        />
        {/* No hay paginación para roles en esta versión */}
      </Container>

      {/* Modal para Crear/Editar Rol */}
      {(modalState.type === 'add' || modalState.type === 'edit') &&
        modalState.show && (
          <RoleForm
            show={modalState.show}
            onHide={handleCloseModal}
            onSubmit={handleSubmitForm}
            currentRole={modalState.type === 'edit' ? modalState.data : null}
            initialData={
              modalState.data
                ? {
                    NOMBRE_ROL: modalState.data.NOMBRE_ROL,
                    // DESCRIPCION_ROL ya no es parte del formulario
                  }
                : { NOMBRE_ROL: '' } // Para añadir, solo NOMBRE_ROL
            }
            isProcessing={isProcessing}
            error={modalError}
          />
        )}

      {/* Modal de Confirmación para Eliminar Rol */}
      {modalState.type === 'delete' && modalState.show && modalState.data && (
        <Modal
          show={modalState.show}
          onHide={handleCloseModal}
          centered
          backdrop="static"
        >
          <Modal.Header closeButton>
            <Modal.Title>Confirmar Eliminación</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              ¿Está seguro de que desea eliminar el rol "
              <strong>{modalState.data.NOMBRE_ROL}</strong>"?
            </p>
            <p className="text-danger">
              Esta acción no se puede deshacer y podría afectar a usuarios
              asignados a este rol.
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={handleCloseModal}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              disabled={isProcessing}
            >
              {isProcessing ? 'Eliminando...' : 'Sí, Eliminar'}
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </Layout>
  );
}

export default RolesPage;
