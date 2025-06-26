import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button, Form, Alert, Spinner, Modal } from 'react-bootstrap';
import {
  listUsuarioSecciones,
  createUsuarioSeccion,
  deleteUsuarioSeccion,
  listSeccionesByUsuario,
} from '../../services/usuarioSeccionService';
import { fetchAllSecciones } from '../../services/seccionService';
import { fetchAllAsignaturas } from '../../services/asignaturaService';

import UsuarioSeccionActions from './usuarioSeccion/UsuarioSeccionActions.jsx';
import UsuarioSeccionModal from './usuarioSeccion/UsuarioSeccionModal.jsx';
import UsuarioSeccionTable from './usuarioSeccion/UsuarioSeccionTable.jsx';
import UsuarioFilter from './UsuarioFilter';
import PaginationComponent from '../PaginationComponent';

const ALUMNO_ROLE_NAME = 'ALUMNO';
const DOCENTE_ROLE_NAME = 'DOCENTE';
const ITEMS_PER_PAGE = 4;

function UsuarioSeccionTab({ allUsers, allRoles }) {
  const [associations, setAssociations] = useState([]);
  const [eligibleUsers, setEligibleUsers] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [asignaturas, setAsignaturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [modal, setModal] = useState({
    type: null,
    entity: null,
    data: null,
    content: [],
    loadingContent: false,
  });
  const [processing, setProcessing] = useState(false);

  // --- ESTADOS PARA MODALES PERSONALIZADAS ---
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertModalMessage, setAlertModalMessage] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalMessage, setConfirmModalMessage] = useState('');
  const [confirmModalAction, setConfirmModalAction] = useState(null);
  const [confirmModalTitle, setConfirmModalTitle] = useState('');
  // --- FIN ESTADOS PARA MODALES PERSONALIZADAS ---

  const [selectedUsuarioId, setSelectedUsuarioId] = useState('');
  const [selectedSeccionIds, setSelectedSeccionIds] = useState([]);
  const [searchTermUser, setSearchTermUser] = useState('');
  const [filterRoleUser, setFilterRoleUser] = useState('');
  const [filterAsignaturaSeccion, setFilterAsignaturaSeccion] = useState('');
  const [groupedAssociations, setGroupedAssociations] = useState({});
  const [selectedUsersInTab, setSelectedUsersInTab] = useState([]);
  const [usuarioTableFilters, setUsuarioTableFilters] = useState({
    text: '',
    role: '',
  });
  const [currentPageTable, setCurrentPageTable] = useState(1);

  const eligibleRoleIds = useMemo(() => {
    if (!allRoles || allRoles.length === 0) return [];
    return allRoles
      .filter(
        (r) =>
          r.NOMBRE_ROL === ALUMNO_ROLE_NAME ||
          r.NOMBRE_ROL === DOCENTE_ROLE_NAME
      )
      .map((r) => r.ID_ROL);
  }, [allRoles]);

  useEffect(() => {
    if (eligibleRoleIds.length > 0 && allUsers.length > 0) {
      setEligibleUsers(
        allUsers.filter((user) => eligibleRoleIds.includes(user.ROL_ID_ROL))
      );
    } else {
      setEligibleUsers([]);
    }
  }, [allUsers, eligibleRoleIds]);

  const handleUsuarioTableFilterChange = useCallback((changedFilters) => {
    setUsuarioTableFilters((prev) => ({ ...prev, ...changedFilters }));
    setSelectedUsersInTab([]);
    setCurrentPageTable(1);
  }, []);

  const displayableGroupedAssociations = useMemo(() => {
    if (!usuarioTableFilters.text && !usuarioTableFilters.role)
      return groupedAssociations;
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

  const displayableUserIds = useMemo(
    () =>
      Object.keys(displayableGroupedAssociations).map((id) => parseInt(id, 10)),
    [displayableGroupedAssociations]
  );
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [assocData, seccionesData, asignaturasData] = await Promise.all([
        listUsuarioSecciones(),
        fetchAllSecciones(),
        fetchAllAsignaturas(),
      ]);
      setSecciones(seccionesData || []);
      setAsignaturas(asignaturasData || []);
      const enrichedAssociations = (assocData || [])
        .map((assoc) => {
          const user = allUsers.find(
            (u) => u.ID_USUARIO === assoc.USUARIO_ID_USUARIO
          );
          const seccion = (seccionesData || []).find(
            (s) => s.ID_SECCION === assoc.SECCION_ID_SECCION
          );
          return {
            ...assoc,
            NOMBRE_USUARIO: user
              ? `${user.NOMBRE_USUARIO}`
              : `Usuario ID: ${assoc.USUARIO_ID_USUARIO}`,
            NOMBRE_SECCION: seccion
              ? seccion.NOMBRE_SECCION ||
                seccion.CODIGO_SECCION ||
                `Sección ID: ${assoc.SECCION_ID_SECCION}`
              : `Sección ID: ${assoc.SECCION_ID_SECCION}`,
            ROL_USUARIO: user?.NOMBRE_ROL || 'N/A',
            EMAIL_USUARIO: user?.EMAIL_USUARIO || '',
          };
        })
        .filter((assoc) =>
          eligibleRoleIds.includes(
            allUsers.find((u) => u.ID_USUARIO === assoc.USUARIO_ID_USUARIO)
              ?.ROL_ID_ROL
          )
        );
      setAssociations(enrichedAssociations);
    } catch (err) {
      setError('Error al cargar datos. ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  }, [allUsers, eligibleRoleIds]);

  useEffect(() => {
    if (allUsers.length > 0 && allRoles.length > 0) {
      fetchData();
    }
  }, [allUsers, allRoles, fetchData]);

  useEffect(() => {
    if (!associations) return;
    const newGrouped = associations.reduce((acc, assoc) => {
      const key = assoc.USUARIO_ID_USUARIO;
      acc[key] = acc[key] || {
        NOMBRE_USUARIO: assoc.NOMBRE_USUARIO,
        ROL_USUARIO: assoc.ROL_USUARIO,
        EMAIL_USUARIO: assoc.EMAIL_USUARIO,
        secciones: [],
      };
      acc[key].secciones.push({
        ID_SECCION: assoc.SECCION_ID_SECCION,
        NOMBRE_SECCION: assoc.NOMBRE_SECCION,
      });
      return acc;
    }, {});
    setGroupedAssociations(newGrouped);
  }, [associations]);

  const usersAvailableForNewSeccionAssociation = useMemo(() => {
    if (!eligibleUsers.length) return [];
    const associatedUserIds = new Set(
      associations.map((assoc) => assoc.USUARIO_ID_USUARIO)
    );
    return eligibleUsers.filter(
      (user) => !associatedUserIds.has(user.ID_USUARIO)
    );
  }, [eligibleUsers, associations]);

  const resetModalState = () => {
    setSelectedUsuarioId('');
    setSelectedSeccionIds([]);
    setEditingUser(null);
    setProcessing(false);
    setShowFormModal(false);
    // Limpiar estados de las modales personalizadas
    setShowAlertModal(false);
    setAlertModalMessage('');
    setShowConfirmModal(false);
    setConfirmModalMessage('');
    setConfirmModalAction(null);
    setConfirmModalTitle('');
  };

  const closeModal = () =>
    setModal({
      type: null,
      entity: null,
      data: null,
      content: [],
      loadingContent: false,
    });

  const openModal = async (type, entity, data) => {
    if (type === 'delete-bulk' && selectedUsersInTab.length === 0) {
      setAlertModalMessage('Seleccione al menos un usuario.');
      setShowAlertModal(true);
      return;
    }
    if (type === 'showAssociations') {
      setModal({ type, entity, data, content: [], loadingContent: true });
      try {
        const content = await listSeccionesByUsuario(data.ID_USUARIO);
        setModal((prev) => ({
          ...prev,
          content: content || [],
          loadingContent: false,
        }));
      } catch (err) {
        setError(`No se pudieron cargar las asociaciones.`);
        setModal((prev) => ({ ...prev, content: [], loadingContent: false }));
      }
    } else {
      setModal({ type, entity, data, content: [], loadingContent: false });
    }
  };

  const handleAddAssociation = async () => {
    const finalUserId = editingUser
      ? editingUser.ID_USUARIO.toString()
      : selectedUsuarioId;
    if (!finalUserId || selectedSeccionIds.length === 0) {
      setAlertModalMessage(
        'Debe seleccionar un usuario y al menos una sección.'
      );
      setShowAlertModal(true);
      return;
    }
    setProcessing(true);
    try {
      if (editingUser) {
        const currentSeccionesForUser = associations
          .filter((assoc) => assoc.USUARIO_ID_USUARIO === parseInt(finalUserId))
          .map((assoc) => assoc.SECCION_ID_SECCION);
        const seccionesToDelete = currentSeccionesForUser.filter(
          (sId) => !selectedSeccionIds.includes(sId.toString())
        );
        const seccionesToAdd = selectedSeccionIds.filter(
          (sIdStr) => !currentSeccionesForUser.includes(parseInt(sIdStr))
        );
        await Promise.all([
          ...seccionesToDelete.map((seccionId) =>
            deleteUsuarioSeccion(parseInt(finalUserId), seccionId)
          ),
          ...seccionesToAdd.map((seccionId) =>
            createUsuarioSeccion({
              USUARIO_ID_USUARIO: parseInt(finalUserId),
              SECCION_ID_SECCION: parseInt(seccionId),
            })
          ),
        ]);
      } else {
        await Promise.all(
          selectedSeccionIds.map((seccionId) =>
            createUsuarioSeccion({
              USUARIO_ID_USUARIO: parseInt(finalUserId),
              SECCION_ID_SECCION: parseInt(seccionId),
            })
          )
        );
      }
      resetModalState();
      fetchData();
    } catch (err) {
      setAlertModalMessage(
        `Error: ${err.response?.data?.message || err.message}`
      );
      setShowAlertModal(true);
      setError(`Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleEditUserAssociations = (userId) => {
    const userToEdit = allUsers.find((u) => u.ID_USUARIO === userId);
    if (!userToEdit) {
      // Si no encuentra el usuario, la alerta ya la manejaría el caller si la lógica lo requiere.
      setAlertModalMessage(
        'No se pudo encontrar el usuario para editar sus asociaciones.'
      );
      setShowAlertModal(true);
      return;
    }
    setEditingUser(userToEdit);
    setSelectedUsuarioId(userId.toString());
    const associatedSecciones = associations
      .filter((assoc) => assoc.USUARIO_ID_USUARIO === userId)
      .map((assoc) => assoc.SECCION_ID_SECCION.toString());
    setSelectedSeccionIds(associatedSecciones);
    setShowFormModal(true);
  };

  // --- Funciones para ejecutar las acciones de eliminación confirmadas ---
  const executeDeleteSingleAssociation = async (userId, seccionId) => {
    setProcessing(true);
    try {
      await deleteUsuarioSeccion(userId, seccionId);
      fetchData();
    } catch (err) {
      setError(
        'Error al eliminar asociación: ' +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setProcessing(false);
      setShowConfirmModal(false); // Cierra el modal de confirmación
    }
  };

  const executeDeleteAllUserAssociations = async (userId) => {
    setProcessing(true);
    try {
      const userAssociations = associations.filter(
        (assoc) => assoc.USUARIO_ID_USUARIO === userId
      );
      await Promise.all(
        userAssociations.map((assoc) =>
          deleteUsuarioSeccion(userId, assoc.SECCION_ID_SECCION)
        )
      );
      fetchData();
    } catch (err) {
      setError(
        'Error al eliminar todas las asociaciones: ' +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setProcessing(false);
      setShowConfirmModal(false); // Cierra el modal de confirmación
    }
  };

  const executeBulkDeleteAssociations = async (usersToDelete) => {
    setProcessing(true);
    try {
      for (const user of usersToDelete) {
        const userAssociations = associations.filter(
          (assoc) => assoc.USUARIO_ID_USUARIO === user.ID_USUARIO
        );
        await Promise.all(
          userAssociations.map((assoc) =>
            deleteUsuarioSeccion(user.ID_USUARIO, assoc.SECCION_ID_SECCION)
          )
        );
      }
      fetchData();
      setSelectedUsersInTab([]);
    } catch (err) {
      setError(
        'Error al eliminar asociaciones en lote: ' +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setProcessing(false);
      setShowConfirmModal(false); // Cierra el modal de confirmación
    }
  };
  // --- Fin funciones de eliminación confirmadas ---

  const confirmDeleteSingleAssociation = (userId, seccionId) => {
    const seccion = secciones.find((s) => s.ID_SECCION === seccionId);
    const seccionNombre = seccion
      ? seccion.NOMBRE_SECCION || seccion.CODIGO_SECCION
      : `ID: ${seccionId}`;

    setConfirmModalTitle('Confirmar Eliminación de Asociación');
    setConfirmModalMessage(
      `<p>¿Está seguro de que desea desvincular la sección "<strong>${seccionNombre}</strong>" de este usuario?</p>`
    );
    setConfirmModalAction(
      () => () => executeDeleteSingleAssociation(userId, seccionId)
    );
    setShowConfirmModal(true);
  };

  const confirmDeleteAllUserAssociations = (userId, userName) => {
    setConfirmModalTitle('Confirmar Eliminación de Todas las Asociaciones');
    setConfirmModalMessage(
      `<p>¿Está seguro de que desea eliminar <strong>TODAS</strong> las asociaciones de sección para el usuario <strong>${userName}</strong>? Esta acción no eliminará al usuario.</p>`
    );
    setConfirmModalAction(() => () => executeDeleteAllUserAssociations(userId));
    setShowConfirmModal(true);
  };

  const handleBulkDelete = () => {
    if (selectedUsersInTab.length === 0) {
      setAlertModalMessage('Seleccione al menos un usuario para desvincular.');
      setShowAlertModal(true);
      return;
    }

    const itemsToList = selectedUsersInTab.map((item) => ({
      key: item.ID_USUARIO,
      name: item.NOMBRE_USUARIO,
    }));

    setConfirmModalTitle('Confirmar Eliminación de Asociaciones');
    setConfirmModalMessage(
      `<div><p>¿Está seguro de que desea eliminar <strong>TODAS</strong> las asociaciones de sección para los <strong>${selectedUsersInTab.length}</strong> usuarios seleccionados? Esta acción no eliminará a los usuarios.</p><ul class="list-unstyled my-3 p-3 border bg-light rounded" style="maxHeight: '150px', overflowY: 'auto'}">${itemsToList.map((item) => `<li><i class="bi bi-person-fill me-2"></i>${item.name || `Usuario sin nombre`}</li>`).join('')}</ul></div>`
    );
    setConfirmModalAction(
      () => () => executeBulkDeleteAssociations(selectedUsersInTab)
    );
    setShowConfirmModal(true);
  };

  const handleToggleUserSelection = (userToToggle) => {
    setSelectedUsersInTab((prev) =>
      prev.find((u) => u.ID_USUARIO === userToToggle.ID_USUARIO)
        ? prev.filter((u) => u.ID_USUARIO !== userToToggle.ID_USUARIO)
        : [...prev, userToToggle]
    );
  };

  const handleToggleSelectAllUsers = () => {
    const usersOnCurrentPage = currentUserIdsOnPage
      .map((userId) =>
        eligibleUsers.find((u) => u.ID_USUARIO === parseInt(userId))
      )
      .filter(Boolean);
    const allSelectedOnPage =
      usersOnCurrentPage.length > 0 &&
      usersOnCurrentPage.every((u) =>
        selectedUsersInTab.some((selU) => selU.ID_USUARIO === u.ID_USUARIO)
      );
    if (allSelectedOnPage) {
      setSelectedUsersInTab((prev) =>
        prev.filter((selU) => !currentUserIdsOnPage.includes(selU.ID_USUARIO))
      );
    } else {
      const newSelections = usersOnCurrentPage.filter(
        (u) =>
          !selectedUsersInTab.some((selU) => selU.ID_USUARIO === u.ID_USUARIO)
      );
      setSelectedUsersInTab((prev) => [
        ...new Set([...prev, ...newSelections]),
      ]);
    }
  };

  const paginateTable = (pageNumber) => setCurrentPageTable(pageNumber);

  if (loading) {
    return (
      <div className="text-center p-3">
        <Spinner animation="border" variant="primary" />
        <p>Cargando datos...</p>
      </div>
    );
  }

  return (
    <div>
      <h4>Asociar Alumnos/Docentes a Secciones</h4>
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      <UsuarioFilter
        roles={allRoles.filter((role) => eligibleRoleIds.includes(role.ID_ROL))}
        onFilterChange={handleUsuarioTableFilterChange}
        currentFilters={usuarioTableFilters}
      />
      <UsuarioSeccionActions
        onNewAssociation={() => setShowFormModal(true)}
        onEditSelected={() => {
          if (selectedUsersInTab.length === 1)
            handleEditUserAssociations(selectedUsersInTab[0].ID_USUARIO);
          else {
            setAlertModalMessage(
              'Seleccione un solo usuario de la tabla para modificar sus asociaciones.'
            );
            setShowAlertModal(true);
          }
        }}
        onBulkDelete={handleBulkDelete}
        processing={processing}
        selectedCount={selectedUsersInTab.length}
      />

      {showFormModal && (
        <UsuarioSeccionModal
          show={showFormModal}
          onHide={resetModalState}
          editingUser={editingUser}
          allRoles={allRoles}
          eligibleUsers={
            editingUser ? eligibleUsers : usersAvailableForNewSeccionAssociation
          }
          secciones={secciones}
          asignaturas={asignaturas}
          selectedUsuarioId={selectedUsuarioId}
          setSelectedUsuarioId={setSelectedUsuarioId}
          selectedSeccionIds={selectedSeccionIds}
          handleSeccionSelection={(id) =>
            setSelectedSeccionIds((prev) =>
              prev.includes(id)
                ? prev.filter((pId) => pId !== id)
                : [...prev, id]
            )
          }
          handleAddAssociation={handleAddAssociation}
          processing={processing}
          searchTermUser={searchTermUser}
          setSearchTermUser={setSearchTermUser}
          filterRoleUser={filterRoleUser}
          setFilterRoleUser={setFilterRoleUser}
          filterAsignaturaSeccion={filterAsignaturaSeccion}
          setFilterAsignaturaSeccion={setFilterAsignaturaSeccion}
        />
      )}

      <UsuarioSeccionTable
        groupedAssociations={paginatedGroupedAssociations}
        eligibleUsers={eligibleUsers}
        selectedUsersInTab={selectedUsersInTab}
        processing={processing}
        loading={loading}
        onToggleUserSelection={handleToggleUserSelection}
        onToggleSelectAllUsers={handleToggleSelectAllUsers}
        onOpenViewSeccionesModal={(userId) => {
          const user = eligibleUsers.find((u) => u.ID_USUARIO === userId);
          if (user) {
            openModal('showAssociations', 'secciones', user);
          }
        }}
        onEditUserAssociations={handleEditUserAssociations}
        onDeleteAllUserAssociations={(userId) => {
          const user = eligibleUsers.find((u) => u.ID_USUARIO === userId);
          if (user) {
            confirmDeleteAllUserAssociations(userId, user.NOMBRE_USUARIO);
          }
        }}
        onDeleteAssociation={(userId, seccionId) =>
          confirmDeleteSingleAssociation(userId, seccionId)
        }
      />

      {displayableUserIds.length > ITEMS_PER_PAGE && (
        <PaginationComponent
          itemsPerPage={ITEMS_PER_PAGE}
          totalItems={displayableUserIds.length}
          paginate={paginateTable}
          currentPage={currentPageTable}
        />
      )}

      {/* Modal de confirmación para eliminaciones */}
      {showConfirmModal && (
        <Modal
          show={showConfirmModal}
          onHide={() => setShowConfirmModal(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>{confirmModalTitle}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {/* CORRECCIÓN: Envuelve dangerouslySetInnerHTML en un div */}
            <Alert variant="warning">
              <div dangerouslySetInnerHTML={{ __html: confirmModalMessage }} />
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowConfirmModal(false)}
              disabled={processing}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={confirmModalAction}
              disabled={processing}
            >
              {processing ? (
                <Spinner as="span" size="sm" animation="border" />
              ) : (
                'Sí, Eliminar'
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Modal de alerta genérica */}
      {showAlertModal && (
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
      )}

      {/* Modal de visualización de asociaciones (existente en UsuarioSeccionTab) */}
      {modal.type === 'showAssociations' && (
        <Modal
          show={modal.type === 'showAssociations'} // Asegúrate de que show esté bien ligado
          onHide={closeModal}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Secciones de {modal.data?.NOMBRE_USUARIO}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {modal.loadingContent ? (
              <div className="text-center">
                <Spinner animation="border" />
              </div>
            ) : modal.content && modal.content.length > 0 ? (
              <ul className="list-unstyled">
                {modal.content.map((item) => (
                  <li key={item.ID_SECCION}>{item.NOMBRE_SECCION}</li>
                ))}
              </ul>
            ) : (
              <p>No hay secciones asociadas a este usuario.</p>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeModal}>
              Cerrar
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
}

export default UsuarioSeccionTab;
