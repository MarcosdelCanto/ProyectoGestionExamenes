import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Table, Button, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import {
  listUsuarioCarreras,
  createUsuarioCarrera,
  deleteUsuarioCarrera,
} from '../../services/usuarioCarreraService';
import { fetchAllCarreras } from '../../services/carreraService';
import { fetchAllEscuelas } from '../../services/escuelaService';

import UsuarioCarreraActions from './usuarioCarrera/UsuarioCarreraActions';
import UsuarioCarreraModal from './usuarioCarrera/UsuarioCarreraModal';
import UsuarioCarreraTable from './usuarioCarrera/UsuarioCarreraTable';
import UsuarioFilter from '../usuarios/UsuarioFilter'; // Importar el filtro de usuario
import PaginationComponent from '../PaginationComponent'; // Importar el componente de paginación

const COORDINADOR_ROLE_NAME = 'COORDINADOR CARRERA';
const DIRECTOR_ROLE_NAME = 'JEFE CARRERA';
const COORDINADOR_DOCENTE_ROLE_NAME = 'COORDINADOR DOCENTE'; // Añadido
const ITEMS_PER_PAGE = 4; // Definir ítems por página

function UsuarioCarreraTab({ allUsers, allRoles }) {
  const [associations, setAssociations] = useState([]);
  const [eligibleUsers, setEligibleUsers] = useState([]); // Usuarios con roles elegibles (Coordinador, Jefe, Coord. Docente)
  const [carreras, setCarreras] = useState([]);
  const [escuelas, setEscuelas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Estados para los valores seleccionados DENTRO DEL MODAL, controlados por este componente padre
  const [selectedUsuarioIdModal, setSelectedUsuarioIdModal] = useState('');
  const [selectedCarreraIdsModal, setSelectedCarreraIdsModal] = useState([]);
  const [processingModal, setProcessingModal] = useState(false);

  // --- ESTADOS PARA LOS FILTROS DENTRO DEL MODAL, CONTROLADOS AQUÍ ---
  const [searchTermUserModal, setSearchTermUserModal] = useState('');
  const [filterRoleUserModal, setFilterRoleUserModal] = useState('');
  const [filterEscuelaCarreraModal, setFilterEscuelaCarreraModal] =
    useState('');

  // Estados para la tabla principal
  const [groupedAssociations, setGroupedAssociations] = useState({});
  const [selectedUserIdsInTable, setSelectedUserIdsInTable] = useState([]);

  // Estados para el modal de visualización de carreras
  const [showViewCarrerasModal, setShowViewCarrerasModal] = useState(false);
  const [viewingUserCarreras, setViewingUserCarreras] = useState([]);
  const [viewingUserName, setViewingUserName] = useState('');

  // Estado para los filtros de la tabla principal de UsuarioCarreraTab
  const [usuarioTableFilters, setUsuarioTableFilters] = useState({
    text: '',
    role: '',
  });
  const [currentPageTable, setCurrentPageTable] = useState(1); // Estado para la paginación de la tabla

  const eligibleRoleIds = useMemo(() => {
    if (!Array.isArray(allRoles) || allRoles.length === 0) return [];
    return allRoles
      .filter(
        (r) =>
          r.NOMBRE_ROL === COORDINADOR_ROLE_NAME ||
          r.NOMBRE_ROL === DIRECTOR_ROLE_NAME ||
          r.NOMBRE_ROL === COORDINADOR_DOCENTE_ROLE_NAME // Incluido
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
          const user = Array.isArray(allUsers)
            ? allUsers.find((u) => u.ID_USUARIO === assoc.USUARIO_ID_USUARIO)
            : null;
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
  // Usuarios que tienen un rol elegible (Coordinador, etc.) Y NO tienen asociaciones de carrera existentes.
  // Esta lista se usará para el modal cuando se crea una NUEVA asociación.
  const usersAvailableForNewCarreraAssociation = useMemo(() => {
    if (!eligibleUsers || eligibleUsers.length === 0) return [];
    // Si no hay asociaciones aún, todos los usuarios elegibles están disponibles.
    if (!associations || associations.length === 0) return eligibleUsers;

    const associatedUserIds = new Set(
      associations.map((assoc) => assoc.USUARIO_ID_USUARIO)
    );
    return eligibleUsers.filter(
      (user) => !associatedUserIds.has(user.ID_USUARIO)
    );
  }, [eligibleUsers, associations]);

  // Filtrar los usuarios que se mostrarán en la tabla de asociaciones
  const displayableGroupedAssociations = useMemo(() => {
    if (!usuarioTableFilters.text && !usuarioTableFilters.role) {
      return groupedAssociations;
    }
    const filteredResult = {};
    for (const userIdStr in groupedAssociations) {
      const userId = parseInt(userIdStr, 10);
      // Encontrar el objeto usuario completo desde eligibleUsers para poder filtrar por nombre, email, rol
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
    setSelectedUserIdsInTable([]); // Limpiar selección de la tabla al cambiar filtros
    setCurrentPageTable(1); // Resetear paginación al cambiar filtros
  }, []);

  const resetModalStateAndFilters = () => {
    setSelectedUsuarioIdModal('');
    setSelectedCarreraIdsModal([]);
    setEditingUser(null);
    setShowModal(false);
    setSuccessMessage('');
    // Resetea los filtros del modal
    setSearchTermUserModal('');
    setFilterRoleUserModal('');
    setFilterEscuelaCarreraModal('');
  };

  const handleOpenNewAssociationModal = () => {
    setEditingUser(null);
    resetModalStateAndFilters(); // Llama a la función que también resetea filtros
    setShowModal(true);
  };

  const handleOpenEditAssociationModal = (userId) => {
    const userToEdit = eligibleUsers.find((u) => u.ID_USUARIO === userId);
    if (!userToEdit) {
      setError('No se pudo encontrar el usuario elegible para editar.');
      return;
    }

    setEditingUser(userToEdit);
    setSelectedUsuarioIdModal(String(userId));
    const associatedCarreras = (
      groupedAssociations[userId]?.carreras || []
    ).map((c) => String(c.ID_CARRERA));
    setSelectedCarreraIdsModal(associatedCarreras);

    // Resetear filtros del modal al abrir para editar
    setSearchTermUserModal('');
    setFilterRoleUserModal('');
    setFilterEscuelaCarreraModal('');
    setShowModal(true);
  };

  // Esta es tu función correcta para abrir el modal de visualización
  const handleOpenViewCarrerasModal = (userId) => {
    console.log(
      '[UsuarioCarreraTab] handleOpenViewCarrerasModal llamado con userId:',
      userId
    );
    const userData = groupedAssociations[userId];
    console.log(
      '[UsuarioCarreraTab] userData encontrada para modal de vista:',
      userData
    );
    if (userData && Array.isArray(userData.carreras)) {
      // Asegúrate que userData y userData.carreras existan
      setViewingUserName(userData.NOMBRE_USUARIO);
      setViewingUserCarreras(userData.carreras);
      setShowViewCarrerasModal(true);
      console.log(
        '[UsuarioCarreraTab] setShowViewCarrerasModal(true) fue ejecutado.'
      );
    } else {
      console.warn(
        '[UsuarioCarreraTab] No se encontró userData o userData.carreras para el modal de visualización. UserData:',
        userData
      );
      // Opcional: mostrar un error al usuario si userData no se encuentra
      // setError('No se pudieron cargar los detalles de las carreras para este usuario.');
    }
  };

  useEffect(() => {
    console.log(
      '[UsuarioCarreraTab] El estado showViewCarrerasModal cambió a:',
      showViewCarrerasModal
    );
  }, [showViewCarrerasModal]);

  const handleModalSubmit = async () => {
    if (!selectedUsuarioIdModal || selectedCarreraIdsModal.length === 0) {
      alert('Debe seleccionar un usuario y al menos una carrera.');
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
          newCarreraIds.map((carreraId) =>
            createUsuarioCarrera({
              USUARIO_ID_USUARIO: userId,
              CARRERA_ID_CARRERA: carreraId,
            })
          )
        );
        setSuccessMessage('Asociaciones creadas exitosamente.');
      }
      resetModalStateAndFilters(); // Llama a la función que también resetea filtros
      fetchData();
    } catch (err) {
      const errorMsg =
        `Error al ${editingUser ? 'actualizar' : 'crear'} asociación: ` +
        (err.response?.data?.message || err.message || 'Error desconocido');
      alert(errorMsg);
      console.error(errorMsg, err);
    } finally {
      setProcessingModal(false);
    }
  };

  const handleToggleUserSelectionInTable = (userIdPassed) => {
    setSelectedUserIdsInTable((prevSelected) =>
      prevSelected.includes(userIdPassed)
        ? prevSelected.filter((id) => id !== userIdPassed)
        : [...prevSelected, userIdPassed]
    );
  };

  // IDs de usuarios que coinciden con los filtros actuales
  const displayableUserIds = useMemo(() => {
    return Object.keys(displayableGroupedAssociations).map((id) =>
      parseInt(id, 10)
    );
  }, [displayableGroupedAssociations]);

  // Paginación de los IDs de usuario
  const indexOfLastUserId = currentPageTable * ITEMS_PER_PAGE;
  const indexOfFirstUserId = indexOfLastUserId - ITEMS_PER_PAGE;
  const currentUserIdsOnPage = displayableUserIds.slice(
    indexOfFirstUserId,
    indexOfLastUserId
  );

  // Objeto de asociaciones agrupadas solo para la página actual
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
    // Usuarios completos en la página actual
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
        .filter((u) => !selectedUserIdsInTable.includes(u.ID_USUARIO))
        .map((u) => u.ID_USUARIO);
      setSelectedUserIdsInTable((prev) => [
        ...new Set([...prev, ...newSelections]),
      ]);
    }
  };

  const handleBulkDeleteFromTable = async () => {
    /* ... tu lógica ... */
  };

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
        roles={allRoles.filter((role) => eligibleRoleIds.includes(role.ID_ROL))} // Solo roles elegibles para esta pestaña
        onFilterChange={handleUsuarioTableFilterChange}
        currentFilters={usuarioTableFilters}
      />

      <div className="mb-3">
        <UsuarioCarreraActions
          onNewAssociation={handleOpenNewAssociationModal}
          onEditSelected={() => {
            if (selectedUserIdsInTable.length === 1)
              handleOpenEditAssociationModal(selectedUserIdsInTable[0]);
            else
              alert(
                'Seleccione un solo usuario de la tabla para editar sus asociaciones.'
              );
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

      {showModal && (
        <UsuarioCarreraModal
          show={showModal}
          onHide={resetModalStateAndFilters} // Usa la función que también resetea filtros
          onSubmit={handleModalSubmit}
          editingUser={editingUser}
          allRoles={allRoles}
          // Si estamos editando, pasamos todos los elegibles (el modal maneja la UI)
          // Si estamos creando una nueva asociación, pasamos solo los que no tienen asociaciones previas
          eligibleUsers={
            editingUser ? eligibleUsers : usersAvailableForNewCarreraAssociation
          }
          allCarreras={carreras} // Renombrado de 'carreras' a 'allCarreras' para claridad
          allEscuelas={escuelas} // Renombrado de 'escuelas' a 'allEscuelas' para claridad
          selectedUsuarioId={selectedUsuarioIdModal}
          setSelectedUsuarioId={setSelectedUsuarioIdModal}
          selectedCarreraIds={selectedCarreraIdsModal}
          // Pasamos la función para manejar la selección de carreras del modal directamente
          // setSelectedCarreraIds para que el modal pueda actualizar este estado del padre
          // O, si handleCarreraSelection ya hace eso, mantenlo. Por simplicidad, le paso setSelectedCarreraIdsModal.
          setSelectedCarreraIds={setSelectedCarreraIdsModal}
          processing={processingModal}
          // Pasar los estados de filtro y sus setters al modal
          searchTermUser={searchTermUserModal}
          setSearchTermUser={setSearchTermUserModal}
          filterRoleUser={filterRoleUserModal}
          setFilterRoleUser={setFilterRoleUserModal}
          filterEscuelaCarrera={filterEscuelaCarreraModal}
          setFilterEscuelaCarrera={setFilterEscuelaCarreraModal}
        />
      )}

      <UsuarioCarreraTable
        groupedAssociations={paginatedGroupedAssociations} // Usar las asociaciones paginadas
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
        onOpenViewCarrerasModal={handleOpenViewCarrerasModal} // <--- Nombre de prop correcto
        onEditUserAssociations={handleOpenEditAssociationModal}
        onDeleteAllUserAssociations={handleBulkDeleteFromTable} // Añadido por consistencia si la tabla tiene este botón
      />
      {/* Componente de Paginación para la tabla */}
      {displayableUserIds.length > ITEMS_PER_PAGE && (
        <PaginationComponent
          itemsPerPage={ITEMS_PER_PAGE}
          totalItems={displayableUserIds.length}
          paginate={paginateTable}
          currentPage={currentPageTable}
        />
      )}

      <Modal
        show={showViewCarrerasModal}
        onHide={() => setShowViewCarrerasModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Carreras Asociadas a {viewingUserName}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {viewingUserCarreras.length > 0 ? (
            <ul className="list-group">
              {viewingUserCarreras.map((carrera) => (
                <li key={carrera.ID_CARRERA} className="list-group-item">
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
    </div>
  );
}

export default UsuarioCarreraTab;
