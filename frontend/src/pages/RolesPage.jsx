// src/pages/RolesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout'; // Ajusta la ruta si es necesario
import {
  fetchAllRoles,
  createRole,
  updateRole,
  deleteRole,
  fetchRoleByIdWithPermissions, // <-- IMPORTANTE: Servicio para obtener rol con sus permisos
} from '../services/rolService'; // Ajusta la ruta si es necesario
import { usePermission } from '../hooks/usePermission';
import {
  Alert,
  Container,
  Modal,
  Button as BsButton, // Renombrado para evitar colisión si usaras un Button propio
  Spinner,
} from 'react-bootstrap';
import RoleActions from '../components/roles/RoleActions';
import RoleTable from '../components/roles/RoleTable';
import RoleForm from '../components/roles/RoleForm';

function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true); // Carga inicial de la tabla de roles
  const [error, setError] = useState(null); // Errores a nivel de página
  const [modalError, setModalError] = useState(null); // Errores específicos del modal/formulario
  const [successMessage, setSuccessMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false); // Para acciones como guardar, eliminar

  const [modalState, setModalState] = useState({
    type: null, // 'add', 'edit', 'delete'
    data: null, // El rol actual para editar/eliminar (con sus permisos si es para editar)
    show: false,
  });
  const [selectedRole, setSelectedRole] = useState(null); // Rol seleccionado en la tabla

  const { forceReloadUserData, currentUser } = usePermission();

  const loadRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllRoles();
      setRoles(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError('Error al cargar los roles. Intente de nuevo más tarde.');
      console.error('Error en loadRoles:', err);
      setRoles([]);
    } finally {
      setSelectedRole(null); // Limpiar selección de la tabla al recargar roles
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const openModal = async (type, roleDataFromTable = null) => {
    setModalError(null); // Limpiar errores previos del modal
    setIsProcessing(false); // Asegurar que no esté en estado de procesamiento

    if (type === 'add') {
      setSelectedRole(null);
      setModalState({ type: 'add', data: null, show: true });
    } else if (type === 'edit' && roleDataFromTable) {
      setSelectedRole(roleDataFromTable); // Mantener la selección de la tabla
      setIsProcessing(true); // Mostrar indicador mientras se cargan los detalles completos del rol
      setModalState({ type: 'edit', data: null, show: true }); // Abrir modal, datos vendrán después
      try {
        // Fetch completo del rol, incluyendo sus permisos asignados
        const fullRoleDataWithPermissions = await fetchRoleByIdWithPermissions(
          roleDataFromTable.ID_ROL
        );
        setModalState({
          type: 'edit',
          data: fullRoleDataWithPermissions,
          show: true,
        });
      } catch (err) {
        console.error('Error al cargar datos del rol para editar:', err);
        setModalError(
          'No se pudieron cargar los detalles del rol para editar. Intente cerrar y abrir de nuevo.'
        );
        // Opcional: no cerrar el modal para que el usuario vea el error
        // setModalState({ type: null, data: null, show: false });
      } finally {
        setIsProcessing(false); // Quitar indicador de carga de detalles del rol
      }
    } else if (type === 'delete' && roleDataFromTable) {
      setSelectedRole(roleDataFromTable);
      setModalState({ type: 'delete', data: roleDataFromTable, show: true });
    }
  };

  const handleCloseModal = () => {
    setModalState({ type: null, data: null, show: false });
    setModalError(null);
  };

  const handleSubmitForm = async (formDataFromForm) => {
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

    if (!formDataFromForm.NOMBRE_ROL || !formDataFromForm.NOMBRE_ROL.trim()) {
      setModalError('El nombre del rol es obligatorio.');
      return;
    }

    setIsProcessing(true);
    try {
      let affectedRoleId = null;
      if (currentRoleForSubmit) {
        await updateRole(currentRoleForSubmit.ID_ROL, {
          NOMBRE_ROL: formDataFromForm.NOMBRE_ROL,
          permisos: formDataFromForm.permisos, // Array de IDs de permisos seleccionados
        });
        setSuccessMessage('Rol actualizado exitosamente.');
        affectedRoleId = currentRoleForSubmit.ID_ROL;
      } else {
        const newRoleResponse = await createRole({
          // Asumimos que createRole devuelve el rol creado
          NOMBRE_ROL: formDataFromForm.NOMBRE_ROL,
          permisos: formDataFromForm.permisos,
        });
        setSuccessMessage('Rol creado exitosamente.');
        affectedRoleId = newRoleResponse?.ID_ROL;
      }

      await loadRoles(); // Recargar lista de roles para reflejar cambios
      handleCloseModal(); // Cerrar el formulario

      // Refrescar permisos del usuario actual si su rol fue el afectado
      if (currentUser && affectedRoleId === currentUser.ROL_ID_ROL) {
        if (typeof forceReloadUserData === 'function') {
          console.log(
            'Rol del usuario actual modificado, refrescando permisos...'
          );
          await forceReloadUserData();
        }
      }
    } catch (err) {
      console.error('Error en handleSubmitForm:', err);
      const errorMessage =
        err.response?.data?.details ||
        err.response?.data?.error ||
        err.message ||
        'Error al guardar el rol.';
      if (err.response?.status === 409) {
        // Conflicto, ej: nombre de rol duplicado
        setModalError(errorMessage);
      } else {
        setModalError(errorMessage); // Otros errores
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteRequest = (roleId) => {
    // Renombrado para evitar colisión con servicio deleteRole
    const roleToDelete = roles.find((r) => r.ID_ROL === roleId);
    if (roleToDelete) {
      openModal('delete', roleToDelete); // openModal se encarga de setSelectedRole para 'delete'
    } else {
      console.error('Rol no encontrado para eliminar con ID:', roleId);
      setError('No se pudo encontrar el rol especificado para eliminar.');
    }
  };

  const handleConfirmDelete = async () => {
    if (modalState.type !== 'delete' || !modalState.data) return;
    setIsProcessing(true);
    setError(null); // Limpiar errores a nivel de página
    setSuccessMessage('');
    try {
      await deleteRole(modalState.data.ID_ROL);
      setSuccessMessage('Rol eliminado exitosamente.');
      await loadRoles(); // Recargar roles
      handleCloseModal();
      setSelectedRole(null); // Limpiar selección
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

  const handleAddAction = () => {
    openModal('add');
  };

  const handleEditAction = () => {
    if (selectedRole) {
      openModal('edit', selectedRole); // openModal ('edit') ahora carga los datos completos
    } else {
      alert('Por favor, seleccione un rol de la tabla para editar.');
    }
  };

  return (
    <Layout>
      <Container fluid className="pt-4">
        {/* pt-4 para padding superior */}
        <div>
          <h2 className="display-6 mb-3">
            {/* Título más pequeño, mb-3 para separación */}
            <i className="bi bi-shield-lock-fill me-3"></i>
            Gestión de Roles y Accesos
          </h2>
        </div>
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
        <div className="mb-3">
          {/* Espacio para RoleActions */}
          <RoleActions
            onAddRole={handleAddAction}
            onEditRole={handleEditAction}
            onDeleteRole={() => {
              if (selectedRole) handleDeleteRequest(selectedRole.ID_ROL);
            }}
            selectedRole={selectedRole}
            isLoading={loading || isProcessing} // Si la tabla está cargando o una acción está en proceso
          />
        </div>
        {loading && roles.length === 0 ? ( // Muestra spinner solo si está cargando y no hay roles
          <div className="text-center">
            <Spinner animation="border" variant="primary" />
            <p>Cargando roles...</p>
          </div>
        ) : (
          <RoleTable
            roles={roles}
            selectedRole={selectedRole}
            onSelectRole={setSelectedRole}
            onEditRole={(role) => openModal('edit', role)} // 'role' aquí es de la lista simplificada
            onDeleteRole={handleDeleteRequest}
            isLoading={loading} // Pasar loading para que la tabla pueda mostrar un indicador si lo necesita
          />
        )}
      </Container>

      {/* Modal para Crear/Editar Rol */}
      {(modalState.type === 'add' || modalState.type === 'edit') &&
        modalState.show && (
          <RoleForm
            show={modalState.show}
            onHide={handleCloseModal}
            onSubmit={handleSubmitForm}
            currentRole={modalState.data} // Para 'edit', modalState.data ya tiene el rol con sus permisos
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
            <BsButton
              variant="secondary"
              onClick={handleCloseModal}
              disabled={isProcessing}
            >
              Cancelar
            </BsButton>
            <BsButton
              variant="danger"
              onClick={handleConfirmDelete}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Spinner as="span" animation="border" size="sm" />
              ) : (
                'Sí, Eliminar'
              )}
            </BsButton>
          </Modal.Footer>
        </Modal>
      )}
    </Layout>
  );
}

export default RolesPage;
