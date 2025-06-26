import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Table, Button, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import {
  listUsuarioCarreras,
  createUsuarioCarrera,
  deleteUsuarioCarrera,
  listCarrerasByUsuario,
} from '../../services/usuarioCarreraService';
import { fetchAllCarreras } from '../../services/carreraService';
import { fetchAllEscuelas } from '../../services/escuelaService';

import UsuarioCarreraActions from './usuarioCarrera/UsuarioCarreraActions';
import UsuarioCarreraModal from './usuarioCarrera/UsuarioCarreraModal';
import UsuarioCarreraTable from './usuarioCarrera/UsuarioCarreraTable';
import UsuarioFilter from '../usuarios/UsuarioFilter';
import PaginationComponent from '../PaginationComponent';

const COORDINADOR_ROLE_NAME = 'COORDINADOR CARRERA';
const DIRECTOR_ROLE_NAME = 'JEFE CARRERA';
const COORDINADOR_DOCENTE_ROLE_NAME = 'COORDINADOR DOCENTE';
const ITEMS_PER_PAGE = 4;

function UsuarioCarreraTab({ allUsers, allRoles }) {
  const [associations, setAssociations] = useState([]);
  const [eligibleUsers, setEligibleUsers] = useState([]);
  const [carreras, setCarreras] = useState([]);
  const [escuelas, setEscuelas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [selectedUsuarioIdModal, setSelectedUsuarioIdModal] = useState('');
  const [selectedCarreraIdsModal, setSelectedCarreraIdsModal] = useState([]);
  const [processingModal, setProcessingModal] = useState(false);

  const [searchTermUserModal, setSearchTermUserModal] = useState('');
  const [filterRoleUserModal, setFilterRoleUserModal] = useState('');
  const [filterEscuelaCarreraModal, setFilterEscuelaCarreraModal] =
    useState('');

  const [groupedAssociations, setGroupedAssociations] = useState({});
  const [selectedUserIdsInTable, setSelectedUserIdsInTable] = useState([]);

  const [showViewCarrerasModal, setShowViewCarrerasModal] = useState(false);
  const [viewingUserCarreras, setViewingUserCarreras] = useState([]);
  const [viewingUserName, setViewingUserName] = useState('');
  const [viewingModalLoading, setViewingModalLoading] = useState(false);

  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertModalMessage, setAlertModalMessage] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalMessage, setConfirmModalMessage] = useState('');
  const [confirmModalAction, setConfirmModalAction] = useState(null);
  const [confirmModalTitle, setConfirmModalTitle] = useState('');

  const [usuarioTableFilters, setUsuarioTableFilters] = useState({
    text: '',
    role: '',
  });
  const [currentPageTable, setCurrentPageTable] = useState(1);

  const eligibleRoleIds = useMemo(() => {
    if (!Array.isArray(allRoles) || allRoles.length === 0) return [];
    return allRoles
      .filter(
        (r) =>
          r.NOMBRE_ROL === COORDINADOR_ROLE_NAME ||
          r.NOMBRE_ROL === DIRECTOR_ROLE_NAME ||
          r.NOMBRE_ROL === COORDINADOR_DOCENTE_ROLE_NAME
      )
      .map((r) => r.ID_ROL);
  }, [allRoles]);

  useEffect(() => {
    if (Array.isArray(allUsers) && eligibleRoleIds.length > 0) {
      const filtered = allUsers.filter(
        (user) => user.ROL_ID_ROL && eligibleRoleIds.includes(user.ROL_ID_ROL)
      );
      setEligibleUsers(filtered);
    } else {
      setEligibleUsers([]);
    }
  }, [allUsers, eligibleRoleIds]);

  const userExistsAndIsInRole = (userId, usersList, roleIdsList) => {
    if (!Array.isArray(usersList) || !Array.isArray(roleIdsList)) return false;
    const user = usersList.find((u) => u.ID_USUARIO === userId);
    return user && user.ROL_ID_ROL && roleIdsList.includes(user.ROL_ID_ROL);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [assocData, carrerasData, escuelasData] = await Promise.all([
        listUsuarioCarreras(),
        fetchAllCarreras(),
        fetchAllEscuelas(),
      ]);
      const validCarrerasData = Array.isArray(carrerasData) ? carrerasData : [];
      setCarreras(validCarrerasData);
      setEscuelas(Array.isArray(escuelasData) ? escuelasData : []);
      const enrichedAssociations = (Array.isArray(assocData) ? assocData : [])
        .map((assoc) => {
          const user = allUsers.find(
            (u) => u.ID_USUARIO === assoc.USUARIO_ID_USUARIO
          );
          const carrera = validCarrerasData.find(
            (c) => c.ID_CARRERA === assoc.CARRERA_ID_CARRERA
          );
          return {
            ...assoc,
            NOMBRE_USUARIO: user
              ? user.NOMBRE_USUARIO
              : `Usuario ID: ${assoc.USUARIO_ID_USUARIO}`,
            EMAIL_USUARIO: user ? user.EMAIL_USUARIO : '',
            NOMBRE_CARRERA: carrera
              ? carrera.NOMBRE_CARRERA
              : `Carrera ID: ${assoc.CARRERA_ID_CARRERA}`,
            ROL_USUARIO: user && user.NOMBRE_ROL ? user.NOMBRE_ROL : 'N/A',
          };
        })
        .filter((assoc) =>
          userExistsAndIsInRole(
            assoc.USUARIO_ID_USUARIO,
            allUsers,
            eligibleRoleIds
          )
        );
      setAssociations(enrichedAssociations);
    } catch (err) {
      setError(
        'Error al cargar datos: ' + (err.message || 'Error desconocido')
      );
    } finally {
      setLoading(false);
    }
  }, [allUsers, eligibleRoleIds]);

  useEffect(() => {
    if (
      Array.isArray(allUsers) &&
      allUsers.length > 0 &&
      Array.isArray(allRoles) &&
      allRoles.length > 0
    ) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [fetchData, allUsers, allRoles]);

  const usersAvailableForNewCarreraAssociation = useMemo(() => {
    if (!eligibleUsers || eligibleUsers.length === 0) return [];
    if (!associations || associations.length === 0) return eligibleUsers;

    const associatedUserIds = new Set(
      associations.map((assoc) => assoc.USUARIO_ID_USUARIO)
    );
    return eligibleUsers.filter(
      (user) => !associatedUserIds.has(user.ID_USUARIO)
    );
  }, [eligibleUsers, associations]);

  const displayableGroupedAssociations = useMemo(() => {
    if (!usuarioTableFilters.text && !usuarioTableFilters.role) {
      return groupedAssociations;
    }
    const filteredResult = {};
    for (const userIdStr in groupedAssociations) {
      const userId = parseInt(userIdStr, 10);
      const user = eligibleUsers.find((u) => u.ID_USUARIO === userId);
      if (user) {
        const matchesText =
          !usuarioTableFilters.text ||
          (user.NOMBRE_USUARIO &&
            user.NOMBRE_USUARIO.toLowerCase().includes(
              usuarioTableFilters.text.toLowerCase()
            )) ||
          (user.EMAIL_USUARIO &&
            user.EMAIL_USUARIO.toLowerCase().includes(
              usuarioTableFilters.text.toLowerCase()
            ));

        const matchesRole =
          !usuarioTableFilters.role ||
          String(user.ROL_ID_ROL) === String(usuarioTableFilters.role);

        if (matchesText && matchesRole) {
          filteredResult[userIdStr] = groupedAssociations[userIdStr];
        }
      }
    }
    return filteredResult;
  }, [groupedAssociations, eligibleUsers, usuarioTableFilters]);

  useEffect(() => {
    if (!Array.isArray(associations) || !Array.isArray(allUsers)) {
      setGroupedAssociations({});
      return;
    }
    const newGrouped = associations.reduce((acc, assoc) => {
      const user = allUsers.find(
        (u) => u.ID_USUARIO === assoc.USUARIO_ID_USUARIO
      );
      const key = assoc.USUARIO_ID_USUARIO;
      acc[key] = acc[key] || {
        ID_USUARIO: assoc.USUARIO_ID_USUARIO,
        NOMBRE_USUARIO: user?.NOMBRE_USUARIO || `Usuario ID: ${key}`,
        EMAIL_USUARIO: user?.EMAIL_USUARIO || '',
        ROL_USUARIO: user?.NOMBRE_ROL || 'N/A',
        carreras: [],
      };
      acc[key].carreras.push({
        ID_CARRERA: assoc.CARRERA_ID_CARRERA,
        NOMBRE_CARRERA: assoc.NOMBRE_CARRERA,
      });
      return acc;
    }, {});
    setGroupedAssociations(newGrouped);
  }, [associations, allUsers]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleUsuarioTableFilterChange = useCallback((changedFilters) => {
    setUsuarioTableFilters((prev) => ({ ...prev, ...changedFilters }));
    setSelectedUserIdsInTable([]);
    setCurrentPageTable(1);
  }, []);

  const resetModalStateAndFilters = () => {
    setSelectedUsuarioIdModal('');
    setSelectedCarreraIdsModal([]);
    setEditingUser(null);
    setShowFormModal(false);
    setSuccessMessage('');
    setSearchTermUserModal('');
    setFilterRoleUserModal('');
    setFilterEscuelaCarreraModal('');
    setShowAlertModal(false);
    setAlertModalMessage('');
    setShowConfirmModal(false);
    setConfirmModalMessage('');
    setConfirmModalAction(null);
    setConfirmModalTitle('');
  };

  const handleOpenNewAssociationModal = () => {
    setEditingUser(null);
    resetModalStateAndFilters();
    setShowFormModal(true);
  };

  const handleOpenEditAssociationModal = (userId) => {
    const userToEdit = eligibleUsers.find((u) => u.ID_USUARIO === userId);
    if (!userToEdit) {
      setAlertModalMessage(
        'No se pudo encontrar el usuario elegible para editar.'
      );
      setShowAlertModal(true);
      return;
    }

    setEditingUser(userToEdit);
    setSelectedUsuarioIdModal(String(userId));
    const associatedCarreras = (
      groupedAssociations[userId]?.carreras || []
    ).map((c) => String(c.ID_CARRERA));
    setSelectedCarreraIdsModal(associatedCarreras);

    setSearchTermUserModal('');
    setFilterRoleUserModal('');
    setFilterEscuelaCarreraModal('');
    setShowFormModal(true);
  };

  const handleOpenViewCarrerasModal = useCallback(
    async (userId) => {
      const userData = eligibleUsers.find((u) => u.ID_USUARIO === userId);
      if (userData) {
        setViewingUserName(userData.NOMBRE_USUARIO);
        setViewingUserCarreras([]);
        setShowViewCarrerasModal(true);
        setViewingModalLoading(true);

        try {
          const carrerasAsociadas = await listCarrerasByUsuario(userId);
          setViewingUserCarreras(carrerasAsociadas || []);
        } catch (err) {
          console.error('Error al cargar carreras del usuario:', err);
          setAlertModalMessage('No se pudieron cargar las carreras asociadas.');
          setShowAlertModal(true);
          setViewingUserCarreras([]);
        } finally {
          setViewingModalLoading(false);
        }
      } else {
        setAlertModalMessage(
          'No se encontró información del usuario para ver las carreras.'
        );
        setShowAlertModal(true);
      }
    },
    [eligibleUsers]
  );

  useEffect(() => {
    console.log(
      '[UsuarioCarreraTab] El estado showViewCarrerasModal cambió a:',
      showViewCarrerasModal
    );
  }, [showViewCarrerasModal]);

  const handleModalSubmit = async () => {
    if (!selectedUsuarioIdModal || selectedCarreraIdsModal.length === 0) {
      setAlertModalMessage(
        'Debe seleccionar un usuario y al menos una carrera.'
      );
      setShowAlertModal(true);
      return;
    }
    setProcessingModal(true);
    setError(null);
    setSuccessMessage('');
    const userId = parseInt(selectedUsuarioIdModal);
    const newCarreraIds = selectedCarreraIdsModal.map((id) => parseInt(id));
    try {
      if (editingUser) {
        const currentAssociatedCarreraIds = (
          groupedAssociations[editingUser.ID_USUARIO]?.carreras || []
        ).map((c) => c.ID_CARRERA);
        const carrerasToDelete = currentAssociatedCarreraIds.filter(
          (id) => !newCarreraIds.includes(id)
        );
        const carrerasToAdd = newCarreraIds.filter(
          (id) => !currentAssociatedCarreraIds.includes(id)
        );
        await Promise.all([
          ...carrerasToDelete.map((carreraId) =>
            deleteUsuarioCarrera(userId, carreraId)
          ),
          ...carrerasToAdd.map((carreraId) =>
            createUsuarioCarrera({
              USUARIO_ID_USUARIO: userId,
              CARRERA_ID_CARRERA: carreraId,
            })
          ),
        ]);
        setSuccessMessage('Asociaciones actualizadas exitosamente.');
      } else {
        await Promise.all(
          selectedCarreraIdsModal.map((carreraId) =>
            createUsuarioCarrera({
              USUARIO_ID_USUARIO: parseInt(selectedUsuarioIdModal),
              CARRERA_ID_CARRERA: parseInt(carreraId),
            })
          )
        );
        setSuccessMessage('Asociaciones creadas exitosamente.');
      }
      resetModalStateAndFilters();
      fetchData();
    } catch (err) {
      const errorMsg =
        `Error al ${editingUser ? 'actualizar' : 'crear'} asociación: ` +
        (err.response?.data?.message || err.message || 'Error desconocido');
      setAlertModalMessage(errorMsg);
      setShowAlertModal(true);
      console.error(errorMsg, err);
    } finally {
      setProcessingModal(false);
    }
  };

  const handleToggleUserSelectionInTable = (userToToggleId) => {
    setSelectedUserIdsInTable((prevSelected) =>
      prevSelected.includes(userToToggleId)
        ? prevSelected.filter((id) => id !== userToToggleId)
        : [...prevSelected, userToToggleId]
    );
  };

  const displayableUserIds = useMemo(() => {
    return Object.keys(displayableGroupedAssociations).map((id) =>
      parseInt(id, 10)
    );
  }, [displayableGroupedAssociations]);

  const indexOfLastUserId = currentPageTable * ITEMS_PER_PAGE;
  const indexOfFirstUserId = indexOfLastUserId - ITEMS_PER_PAGE;
  const currentUserIdsOnPage = displayableUserIds.slice(
    indexOfFirstUserId,
    indexOfLastUserId
  );

  const paginatedGroupedAssociations = useMemo(() => {
    const newPaginated = {};
    currentUserIdsOnPage.forEach((userId) => {
      if (displayableGroupedAssociations[userId]) {
        newPaginated[userId] = displayableGroupedAssociations[userId];
      }
    });
    return newPaginated;
  }, [currentUserIdsOnPage, displayableGroupedAssociations]);

  const handleToggleSelectAllInTable = () => {
    const usersOnCurrentPage = currentUserIdsOnPage
      .map((userId) => eligibleUsers.find((u) => u.ID_USUARIO === userId))
      .filter(Boolean);

    const allSelectedOnPage =
      usersOnCurrentPage.length > 0 &&
      usersOnCurrentPage.every((u) =>
        selectedUserIdsInTable.includes(u.ID_USUARIO)
      );

    if (allSelectedOnPage) {
      setSelectedUserIdsInTable((prev) =>
        prev.filter((id) => !currentUserIdsOnPage.includes(id))
      );
    } else {
      const newSelections = usersOnCurrentPage
        .filter(
          (u) =>
            !selectedUserIdsInTable.some(
              (selU) => selU.ID_USUARIO === u.ID_USUARIO
            )
        ) // Corregido: evitar duplicados
        .map((u) => u.ID_USUARIO);
      setSelectedUserIdsInTable((prev) => [
        ...new Set([...prev, ...newSelections]),
      ]);
    }
  };

  const executeBulkDeleteFromTable = async (usersToProcessIds) => {
    setProcessingModal(true);
    setError(null);
    try {
      for (const userId of usersToProcessIds) {
        const userAssociations = associations.filter(
          (assoc) => assoc.USUARIO_ID_USUARIO === userId
        );
        await Promise.all(
          userAssociations.map((assoc) =>
            deleteUsuarioCarrera(userId, assoc.CARRERA_ID_CARRERA)
          )
        );
      }
      setSuccessMessage('Asociaciones desvinculadas exitosamente.');
      setSelectedUserIdsInTable([]);
      fetchData();
    } catch (err) {
      setError(
        'Error al desvincular carreras: ' +
          (err.response?.data?.message || err.message || 'Error desconocido')
      );
      console.error('Error al desvincular carreras:', err);
    } finally {
      setProcessingModal(false);
      setShowConfirmModal(false);
    }
  };

  // --- handleBulkDeleteFromTable (CORREGIDO PARA MOSTRAR LISTA EN MODAL) ---
  const handleBulkDeleteFromTable = () => {
    if (selectedUserIdsInTable.length === 0) {
      setAlertModalMessage('Seleccione al menos un usuario para desvincular.');
      setShowAlertModal(true);
      return;
    }

    // Obtener los objetos de usuario completos para mostrar en la lista del modal
    const usersForModalList = selectedUserIdsInTable.map((userId) => {
      const user = allUsers.find((u) => u.ID_USUARIO === userId); // Buscar en allUsers para tener toda la información
      return {
        key: userId,
        name: user ? user.NOMBRE_USUARIO : `Usuario ID: ${userId}`,
      };
    });

    setConfirmModalTitle('Confirmar Eliminación de Asociaciones');
    setConfirmModalMessage(
      `<div><p>¿Está seguro de que desea desvincular <strong>TODAS</strong> las carreras de los <strong>${selectedUserIdsInTable.length}</strong> usuarios seleccionados? Esta acción no eliminará a los usuarios.</p><ul class="list-unstyled my-3 p-3 border bg-light rounded" style="maxHeight: '150px', overflowY: 'auto'}">${usersForModalList.map((item) => `<li><i class="bi bi-person-fill me-2"></i>${item.name || `Usuario sin nombre`}</li>`).join('')}</ul></div>`
    );
    setConfirmModalAction(
      () => () => executeBulkDeleteFromTable(selectedUserIdsInTable)
    );
    setShowConfirmModal(true);
  };
  // --- FIN handleBulkDeleteFromTable ---

  const paginateTable = (pageNumber) => setCurrentPageTable(pageNumber);

  if (loading && !associations.length) {
    return (
      <div className="text-center p-3">
        <Spinner animation="border" variant="primary" />
        <p>Cargando datos...</p>
      </div>
    );
  }

  return (
    <div>
      <h4 className="mb-3 mt-3">Asociar Coordinadores/Directores a Carreras</h4>
      {error && (
        <Alert
          variant="danger"
          onClose={() => setError(null)}
          dismissible
          className="mt-2"
        >
          {error}
        </Alert>
      )}
      {successMessage && (
        <Alert
          variant="success"
          onClose={() => setSuccessMessage('')}
          dismissible
          className="mt-2"
        >
          {successMessage}
        </Alert>
      )}

      <UsuarioFilter
        roles={allRoles.filter((role) => eligibleRoleIds.includes(role.ID_ROL))}
        onFilterChange={handleUsuarioTableFilterChange}
        currentFilters={usuarioTableFilters}
      />

      <div className="mb-3">
        <UsuarioCarreraActions
          onNewAssociation={handleOpenNewAssociationModal}
          onEditSelected={() => {
            if (selectedUserIdsInTable.length === 1)
              handleOpenEditAssociationModal(selectedUserIdsInTable[0]);
            else {
              setAlertModalMessage(
                'Seleccione un solo usuario de la tabla para editar sus asociaciones.'
              );
              setShowAlertModal(true);
            }
          }}
          onBulkDelete={handleBulkDeleteFromTable}
          processing={processingModal}
          selectedCount={selectedUserIdsInTable.length}
          disabledEdit={selectedUserIdsInTable.length !== 1}
        />
      </div>

      {eligibleUsers.length === 0 && !loading && (
        <Alert variant="info" className="mt-3">
          No hay usuarios con rol "{COORDINADOR_ROLE_NAME}", "
          {DIRECTOR_ROLE_NAME}" o "{COORDINADOR_DOCENTE_ROLE_NAME}" definidos o
          disponibles.
        </Alert>
      )}

      {showFormModal && (
        <UsuarioCarreraModal
          show={showFormModal}
          onHide={resetModalStateAndFilters}
          onSubmit={handleModalSubmit}
          editingUser={editingUser}
          allRoles={allRoles}
          eligibleUsers={
            editingUser ? eligibleUsers : usersAvailableForNewCarreraAssociation
          }
          allCarreras={carreras}
          allEscuelas={escuelas}
          selectedUsuarioId={selectedUsuarioIdModal}
          setSelectedUsuarioId={setSelectedUsuarioIdModal}
          selectedCarreraIds={selectedCarreraIdsModal}
          setSelectedCarreraIds={setSelectedCarreraIdsModal}
          processing={processingModal}
          searchTermUser={searchTermUserModal}
          setSearchTermUser={setSearchTermUserModal}
          filterRoleUser={filterRoleUserModal}
          setFilterRoleUser={setFilterRoleUserModal}
          filterEscuelaCarrera={filterEscuelaCarreraModal}
          setFilterEscuelaCarrera={setFilterEscuelaCarreraModal}
        />
      )}

      <UsuarioCarreraTable
        groupedAssociations={paginatedGroupedAssociations}
        eligibleUsers={eligibleUsers}
        selectedUsersInTab={
          Array.isArray(allUsers)
            ? selectedUserIdsInTable
                .map((id) => allUsers.find((u) => u.ID_USUARIO === id))
                .filter(Boolean)
            : []
        }
        processing={processingModal}
        loading={loading}
        onToggleUserSelection={(userObject) =>
          handleToggleUserSelectionInTable(userObject.ID_USUARIO)
        }
        onToggleSelectAllUsers={handleToggleSelectAllInTable}
        onViewUserCarreras={handleOpenViewCarrerasModal}
        onOpenViewCarrerasModal={handleOpenViewCarrerasModal}
        onEditUserAssociations={handleOpenEditAssociationModal}
        onDeleteAllUserAssociations={handleBulkDeleteFromTable}
      />
      {displayableUserIds.length > ITEMS_PER_PAGE && (
        <PaginationComponent
          itemsPerPage={ITEMS_PER_PAGE}
          totalItems={displayableUserIds.length}
          paginate={paginateTable}
          currentPage={currentPageTable}
        />
      )}

      {/* MODAL DE VISUALIZACIÓN DE CARRERAS ASOCIADAS */}
      <Modal
        show={showViewCarrerasModal}
        onHide={() => setShowViewCarrerasModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Carreras Asociadas a {viewingUserName}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {viewingModalLoading ? (
            <div className="text-center">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Cargando carreras...</span>
              </Spinner>
            </div>
          ) : viewingUserCarreras.length > 0 ? (
            // --- MODIFICACIÓN AQUÍ: Eliminar clases de Bootstrap para la lista ---
            <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
              {' '}
              {/* Remover padding por defecto de UL */}
              {viewingUserCarreras.map((carrera) => (
                <li key={carrera.ID_CARRERA} style={{ marginBottom: '5px' }}>
                  {' '}
                  {/* Añadir margen para espacio */}
                  {carrera.NOMBRE_CARRERA}
                </li>
              ))}
            </ul>
          ) : (
            <p>No hay carreras asociadas a este usuario.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowViewCarrerasModal(false)}
          >
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* NUEVA MODAL DE ALERTA PERSONALIZADA */}
      <Modal
        show={showAlertModal}
        onHide={() => setShowAlertModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Alerta</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">{alertModalMessage}</Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setShowAlertModal(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* NUEVA MODAL DE CONFIRMACIÓN PERSONALIZADA */}
      <Modal
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>{confirmModalTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <div dangerouslySetInnerHTML={{ __html: confirmModalMessage }} />
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowConfirmModal(false)}
            disabled={processingModal}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={confirmModalAction}
            disabled={processingModal}
          >
            {processingModal ? (
              <Spinner
                as="span"
                size="sm"
                animation="border"
                role="status"
                aria-hidden="true"
              />
            ) : (
              'Confirmar'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default UsuarioCarreraTab;
