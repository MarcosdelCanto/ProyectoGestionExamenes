// src/pages/RolesPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react'; // Añadido useMemo
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
import RoleFilter from '../components/roles/RoleFilter'; // <-- IMPORTAR RoleFilter
import PaginationComponent from '../components/PaginationComponent'; // Importar PaginationComponent

const ITEMS_PER_PAGE = 6; // Definir cuántos ítems mostrar por página

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
  const [selectedRoles, setSelectedRoles] = useState([]); // Cambiado a array para selección múltiple

  // Estado para los filtros de Rol
  const [roleFilters, setRoleFilters] = useState({
    nombre: '',
  });
  const [currentPage, setCurrentPage] = useState(1); // Estado para la página actual

  const { forceReloadUserData, currentUser } = usePermission();

  const loadRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllRoles();
      setRoles(Array.isArray(data) ? data : data.data || []);
      setCurrentPage(1); // Resetear a la primera página al cargar roles
    } catch (err) {
      setError('Error al cargar los roles. Intente de nuevo más tarde.');
      console.error('Error en loadRoles:', err);
      setRoles([]);
    } finally {
      setSelectedRoles([]); // Limpiar selección de la tabla al recargar roles
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
      setSelectedRoles([]); // Limpiar selección para 'add'
      setModalState({ type: 'add', data: null, show: true });
    } else if (type === 'edit') {
      // Para editar, se espera que selectedRoles tenga un solo ítem
      if (selectedRoles.length !== 1) {
        setError('Por favor, seleccione un único rol para editar.');
        setTimeout(() => setError(null), 4000);
        return;
      }
      const roleToEdit = selectedRoles[0];
      setIsProcessing(true); // Mostrar indicador mientras se cargan los detalles completos del rol
      setModalState({ type: 'edit', data: null, show: true }); // Abrir modal, datos vendrán después
      try {
        // Fetch completo del rol, incluyendo sus permisos asignados
        const fullRoleDataWithPermissions = await fetchRoleByIdWithPermissions(
          roleToEdit.ID_ROL
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
    } else if (type === 'delete') {
      // Para eliminar, se pueden tener múltiples roles seleccionados
      if (selectedRoles.length === 0) {
        setError('Por favor, seleccione al menos un rol para eliminar.');
        setTimeout(() => setError(null), 4000);
        return;
      }
      // Para el modal de confirmación, podríamos mostrar los nombres o solo la cantidad
      setModalState({ type: 'delete', data: [...selectedRoles], show: true }); // Pasar una copia del array
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

  const handleConfirmDelete = async () => {
    if (modalState.type !== 'delete' || !modalState.data) return;
    setIsProcessing(true);
    setError(null); // Limpiar errores a nivel de página
    setSuccessMessage('');
    try {
      await deleteRole(modalState.data.ID_ROL);
      // Si modalState.data es un array (para borrado múltiple)
      for (const roleToDelete of modalState.data) {
        await deleteRole(roleToDelete.ID_ROL);
      }
      setSuccessMessage(
        `${modalState.data.length} rol(es) eliminado(s) exitosamente.`
      );
      await loadRoles(); // Recargar roles
      handleCloseModal();
      setSelectedRoles([]); // Limpiar selección
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

  // Handler para el cambio de filtro de roles
  const handleRoleFilterChange = useCallback((changedFilters) => {
    setRoleFilters((prevFilters) => ({
      ...prevFilters,
      ...changedFilters,
    }));
    setCurrentPage(1); // Resetear a la primera página al cambiar filtros
  }, []);

  // Aplicar el filtro a la lista de roles
  const filteredRoles = useMemo(() => {
    return roles.filter((role) => {
      const matchesNombre =
        !roleFilters.nombre ||
        (role.NOMBRE_ROL &&
          role.NOMBRE_ROL.toLowerCase().includes(
            roleFilters.nombre.toLowerCase()
          ));
      return matchesNombre;
    });
  }, [roles, roleFilters]);

  // Lógica de Paginación
  const indexOfLastRole = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstRole = indexOfLastRole - ITEMS_PER_PAGE;
  const currentRolesOnPage = useMemo(() => {
    return filteredRoles.slice(indexOfFirstRole, indexOfLastRole);
  }, [filteredRoles, indexOfFirstRole, indexOfLastRole]);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const handleAddAction = () => {
    openModal('add');
  };

  const handleEditAction = () => {
    if (selectedRoles.length === 1) {
      openModal('edit'); // openModal ('edit') ahora usa selectedRoles[0]
    } else {
      alert('Por favor, seleccione un rol de la tabla para editar.');
    }
  };

  const handleDeleteAction = () => {
    if (selectedRoles.length > 0) {
      openModal('delete'); // openModal ('delete') ahora usa selectedRoles
    } else {
      alert('Por favor, seleccione al menos un rol de la tabla para eliminar.');
    }
  };

  const handleToggleRoleSelection = (roleToToggle) => {
    setSelectedRoles((prevSelected) =>
      prevSelected.find((r) => r.ID_ROL === roleToToggle.ID_ROL)
        ? prevSelected.filter((r) => r.ID_ROL !== roleToToggle.ID_ROL)
        : [...prevSelected, roleToToggle]
    );
  };

  const handleToggleSelectAllRoles = () => {
    // Funciona sobre los roles de la página actual
    const allCurrentPageRoleIds = currentRolesOnPage.map((r) => r.ID_ROL);
    const allOnPageSelected =
      currentRolesOnPage.length > 0 &&
      currentRolesOnPage.every((role) =>
        selectedRoles.some((sr) => sr.ID_ROL === role.ID_ROL)
      );

    if (allOnPageSelected) {
      // Deseleccionar todos los de la página actual
      setSelectedRoles((prev) =>
        prev.filter((sr) => !allCurrentPageRoleIds.includes(sr.ID_ROL))
      );
    } else {
      // Seleccionar todos los de la página actual que no estén ya seleccionados
      const newSelectionsFromPage = currentRolesOnPage.filter(
        (role) => !selectedRoles.some((sr) => sr.ID_ROL === role.ID_ROL)
      );
      setSelectedRoles((prev) => [...prev, ...newSelectionsFromPage]);
    }
  };

  return (
    <Layout>
      <div className="container-fluid pt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="display-6">
            <i className="bi bi-shield-lock-fill me-3"></i>
            Gestión de Roles y Accesos
          </h2>
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
        <RoleFilter
          onFilterChange={handleRoleFilterChange}
          currentFilters={roleFilters}
        />
        <div className="mb-3">
          {/* Espacio para RoleActions */}
          <RoleActions
            onAddRole={handleAddAction}
            onEditRole={handleEditAction}
            onDeleteRole={handleDeleteAction}
            selectedRoles={selectedRoles} // Pasar el array de roles seleccionados
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
            roles={currentRolesOnPage} // Usar roles de la página actual
            selectedRoles={selectedRoles}
            onToggleRoleSelection={handleToggleRoleSelection}
            onToggleSelectAllRoles={handleToggleSelectAllRoles}
            // Las acciones de editar/eliminar se manejan desde RoleActions ahora
            isLoading={loading} // Pasar loading para que la tabla pueda mostrar un indicador si lo necesita
          />
        )}
        {!loading && filteredRoles.length > ITEMS_PER_PAGE && (
          <PaginationComponent
            itemsPerPage={ITEMS_PER_PAGE}
            totalItems={filteredRoles.length}
            paginate={paginate}
            currentPage={currentPage}
          />
        )}
      </div>

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
            {modalState.data.length === 1 ? (
              <p>
                ¿Está seguro de que desea eliminar el rol "
                <strong>{modalState.data[0].NOMBRE_ROL}</strong>"?
              </p>
            ) : (
              <p>
                ¿Está seguro de que desea eliminar los
                <strong>{modalState.data.length}</strong> roles seleccionados?
              </p>
            )}
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
