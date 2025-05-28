import React, { useState, useEffect, useMemo } from 'react';
import { Table, Button, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import {
  listUsuarioCarreras,
  createUsuarioCarrera,
  deleteUsuarioCarrera,
} from '../../services/usuarioCarreraService';
import { fetchAllCarreras } from '../../services/carreraService';
import { fetchAllEscuelas } from '../../services/escuelaService'; // Asumiendo que tienes este servicio

import UsuarioCarreraActions from './usuarioCarrera/UsuarioCarreraActions';
import UsuarioCarreraModal from './usuarioCarrera/UsuarioCarreraModal';
import UsuarioCarreraTable from './usuarioCarrera/UsuarioCarreraTable';

const COORDINADOR_ROLE_NAME = 'COORDINADOR';
const DIRECTOR_ROLE_NAME = 'DIRECTOR';

function UsuarioCarreraTab({ allUsers, allRoles }) {
  const [associations, setAssociations] = useState([]);
  const [eligibleUsers, setEligibleUsers] = useState([]);
  const [carreras, setCarreras] = useState([]);
  const [escuelas, setEscuelas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // Para saber si estamos editando o creando

  // Estados para la modal
  const [selectedUsuarioId, setSelectedUsuarioId] = useState('');
  const [selectedCarreraIds, setSelectedCarreraIds] = useState([]); // Múltiples carreras
  const [processing, setProcessing] = useState(false);
  const [searchTermUser, setSearchTermUser] = useState('');
  const [filterRoleUser, setFilterRoleUser] = useState('');
  const [filterEscuelaCarrera, setFilterEscuelaCarrera] = useState('');

  // Estado para la tabla agrupada y selección
  const [groupedAssociations, setGroupedAssociations] = useState({});
  const [selectedUsersInTab, setSelectedUsersInTab] = useState([]); // Usuarios seleccionados en esta tabla

  // Estados para el modal de visualización de carreras de un usuario
  const [showViewCarrerasModal, setShowViewCarrerasModal] = useState(false);
  const [viewingUserCarreras, setViewingUserCarreras] = useState([]);
  const [viewingUserName, setViewingUserName] = useState('');

  const eligibleRoleIds = useMemo(() => {
    if (!allRoles || allRoles.length === 0) return [];
    return allRoles
      .filter(
        (r) =>
          r.NOMBRE_ROL === COORDINADOR_ROLE_NAME ||
          r.NOMBRE_ROL === DIRECTOR_ROLE_NAME
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

  useEffect(() => {
    // Agrupar asociaciones por usuario
    if (!allUsers || allUsers.length === 0) return;
    const grouped = associations.reduce((acc, assoc) => {
      acc[assoc.USUARIO_ID_USUARIO] = acc[assoc.USUARIO_ID_USUARIO] || {
        NOMBRE_USUARIO: assoc.NOMBRE_USUARIO,
        ROL_USUARIO:
          allUsers.find((u) => u.ID_USUARIO === assoc.USUARIO_ID_USUARIO)
            ?.NOMBRE_ROL || 'N/A',
        EMAIL_USUARIO:
          allUsers.find((u) => u.ID_USUARIO === assoc.USUARIO_ID_USUARIO)
            ?.EMAIL_USUARIO || '',
        carreras: [],
      };
      acc[assoc.USUARIO_ID_USUARIO].carreras.push({
        ID_CARRERA: assoc.CARRERA_ID_CARRERA,
        NOMBRE_CARRERA: assoc.NOMBRE_CARRERA,
      });
      return acc;
    }, {});
    setGroupedAssociations(grouped);
  }, [associations, allUsers]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [assocData, carrerasData, escuelasData] = await Promise.all([
        listUsuarioCarreras(),
        fetchAllCarreras(),
        fetchAllEscuelas(), // Cargar escuelas
      ]);

      setCarreras(carrerasData || []);

      const enrichedAssociations = (assocData || [])
        .map((assoc) => {
          const user = allUsers.find(
            (u) => u.ID_USUARIO === assoc.USUARIO_ID_USUARIO // Asegúrate que ID_USUARIO es numérico o haz la conversión
          );
          const carrera = (carrerasData || []).find(
            (c) => c.ID_CARRERA === assoc.CARRERA_ID_CARRERA // Asegúrate que ID_CARRERA es numérico o haz la conversión
          );
          return {
            ...assoc,
            NOMBRE_USUARIO: user
              ? `${user.NOMBRE_USUARIO} (${user.EMAIL_USUARIO})`
              : `Usuario ID: ${assoc.USUARIO_ID_USUARIO}`,
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
        ); // Filtrar por si un usuario cambió de rol

      setAssociations(enrichedAssociations);
      setEscuelas(escuelasData || []);
    } catch (err) {
      setError(
        'Error al cargar datos de asociaciones Usuario-Carrera. ' +
          (err.message || '')
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to check if user exists and is in one of the eligible roles
  const userExistsAndIsInRole = (userId, usersList, roleIdsList) => {
    const user = usersList.find((u) => u.ID_USUARIO === userId);
    return user && roleIdsList.includes(user.ROL_ID_ROL);
  };

  useEffect(() => {
    if (allUsers.length > 0 && allRoles.length > 0) {
      fetchData();
    } else {
      setLoading(false); // No hay usuarios o roles, no podemos cargar
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allUsers, allRoles]); // Dependemos de allUsers y allRoles para iniciar la carga

  const resetModalState = () => {
    setSelectedUsuarioId('');
    setSelectedCarreraIds([]);
    setSearchTermUser('');
    setFilterRoleUser('');
    setFilterEscuelaCarrera('');
    setEditingUser(null);
    setShowModal(false);
  };

  const handleAddAssociation = async () => {
    if (!selectedUsuarioId || selectedCarreraIds.length === 0) {
      setError('Debe seleccionar un usuario y al menos una carrera.');
      return;
    }
    setProcessing(true);
    setError(null);
    try {
      if (editingUser) {
        // Lógica de edición: eliminar las antiguas y agregar las nuevas
        // 1. Obtener las carreras actualmente asociadas al usuario
        const currentCarrerasForUser = associations
          .filter(
            (assoc) => assoc.USUARIO_ID_USUARIO === parseInt(selectedUsuarioId)
          )
          .map((assoc) => assoc.CARRERA_ID_CARRERA);

        // 2. Identificar carreras a eliminar (están en currentCarrerasForUser pero no en selectedCarreraIds)
        const carrerasToDelete = currentCarrerasForUser.filter(
          (cId) => !selectedCarreraIds.includes(cId.toString())
        );

        // 3. Identificar carreras a agregar (están en selectedCarreraIds pero no en currentCarrerasForUser)
        const carrerasToAdd = selectedCarreraIds.filter(
          (cId) => !currentCarrerasForUser.includes(parseInt(cId))
        );

        await Promise.all([
          ...carrerasToDelete.map((carreraId) =>
            deleteUsuarioCarrera(parseInt(selectedUsuarioId), carreraId)
          ),
          ...carrerasToAdd.map((carreraId) =>
            createUsuarioCarrera({
              USUARIO_ID_USUARIO: parseInt(selectedUsuarioId),
              CARRERA_ID_CARRERA: parseInt(carreraId),
            })
          ),
        ]);
      } else {
        // Lógica de creación (múltiples carreras)
        await Promise.all(
          selectedCarreraIds.map((carreraId) =>
            createUsuarioCarrera({
              USUARIO_ID_USUARIO: parseInt(selectedUsuarioId),
              CARRERA_ID_CARRERA: parseInt(carreraId),
            })
          )
        );
      }
      resetModalState();
      fetchData();
    } catch (err) {
      setError(
        `Error al ${editingUser ? 'actualizar' : 'crear'} asociación: ` +
          (err.response?.data?.message || err.message || 'Error desconocido')
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleEditUserAssociations = (userId) => {
    const userToEdit = allUsers.find((u) => u.ID_USUARIO === userId);
    if (!userToEdit) return;

    setEditingUser(userToEdit);
    setSelectedUsuarioId(userId.toString());

    const associatedCarreras = associations
      .filter((assoc) => assoc.USUARIO_ID_USUARIO === userId)
      .map((assoc) => assoc.CARRERA_ID_CARRERA.toString());
    setSelectedCarreraIds(associatedCarreras);

    // Opcional: pre-seleccionar filtros si es relevante
    // setFilterRoleUser(userToEdit.ROL_ID_ROL.toString());
    setShowModal(true);
    setSelectedUsersInTab([userToEdit]); // Seleccionar el usuario que se está editando
  };

  const handleDeleteAssociation = async (usuarioId, carreraId) => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta asociación?'))
      return;
    setProcessing(true);
    setError(null);
    try {
      await deleteUsuarioCarrera(usuarioId, carreraId);
      fetchData();
    } catch (err) {
      setError(
        'Error al eliminar asociación: ' +
          (err.response?.data?.message || err.message || 'Error desconocido')
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteAllUserAssociations = async (userId) => {
    const user = eligibleUsers.find((u) => u.ID_USUARIO === userId); // Usar eligibleUsers
    if (!user) return;
    if (
      !window.confirm(
        // Confirmación individual
        `¿Está seguro de que desea eliminar TODAS las asociaciones de carrera para el usuario ${user.NOMBRE_USUARIO}? Esta acción no eliminará al usuario.`
      )
    )
      return;

    setProcessing(true);
    setError(null);
    try {
      const userAssociations = associations.filter(
        (assoc) => assoc.USUARIO_ID_USUARIO === userId
      );
      await Promise.all(
        userAssociations.map((assoc) =>
          deleteUsuarioCarrera(userId, assoc.CARRERA_ID_CARRERA)
        )
      );
      fetchData();
    } catch (err) {
      setError(
        'Error al eliminar todas las asociaciones del usuario: ' +
          (err.response?.data?.message || err.message || 'Error desconocido')
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleUserSelection = (userToToggle) => {
    setSelectedUsersInTab((prevSelected) => {
      const isSelected = prevSelected.find(
        (u) => u.ID_USUARIO === userToToggle.ID_USUARIO
      );
      if (isSelected) {
        return prevSelected.filter(
          (u) => u.ID_USUARIO !== userToToggle.ID_USUARIO
        );
      }
      return [...prevSelected, userToToggle];
    });
  };

  const handleToggleSelectAllUsers = () => {
    const usersInCurrentView = Object.keys(groupedAssociations)
      .map((userId) =>
        eligibleUsers.find((u) => u.ID_USUARIO === parseInt(userId))
      )
      .filter(Boolean);

    if (selectedUsersInTab.length === usersInCurrentView.length) {
      setSelectedUsersInTab([]);
    } else {
      setSelectedUsersInTab(usersInCurrentView);
    }
  };

  const handleOpenViewCarrerasModal = (userId) => {
    const userData = groupedAssociations[userId];
    if (userData) {
      setViewingUserName(userData.NOMBRE_USUARIO);
      setViewingUserCarreras(userData.carreras);
      setShowViewCarrerasModal(true);
    }
  };

  const handleBulkDeleteAssociations = async () => {
    if (selectedUsersInTab.length === 0) {
      setError('Seleccione al menos un usuario.');
      return;
    }
    if (
      !window.confirm(
        `¿Está seguro de que desea eliminar TODAS las asociaciones de carrera para los ${selectedUsersInTab.length} usuarios seleccionados? Esta acción no eliminará a los usuarios.`
      )
    ) {
      return;
    }
    setProcessing(true);
    setError(null);
    try {
      for (const user of selectedUsersInTab) {
        const userAssociations = associations.filter(
          (assoc) => assoc.USUARIO_ID_USUARIO === user.ID_USUARIO
        );
        await Promise.all(
          userAssociations.map((assoc) =>
            deleteUsuarioCarrera(user.ID_USUARIO, assoc.CARRERA_ID_CARRERA)
          )
        );
      }
      fetchData(); // Refrescar datos
      setSelectedUsersInTab([]); // Limpiar selección
    } catch (err) {
      setError(
        'Error al eliminar asociaciones en lote: ' +
          (err.response?.data?.message || err.message || 'Error desconocido')
      );
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center p-3">
        <Spinner animation="border" />{' '}
        <p>Cargando asociaciones Usuario-Carrera...</p>
      </div>
    );
  }

  const filteredEligibleUsers = eligibleUsers.filter((user) => {
    const searchTermMatch =
      searchTermUser === '' ||
      user.NOMBRE_USUARIO.toLowerCase().includes(
        searchTermUser.toLowerCase()
      ) ||
      user.EMAIL_USUARIO.toLowerCase().includes(searchTermUser.toLowerCase());
    const roleMatch =
      filterRoleUser === '' || user.ROL_ID_ROL === parseInt(filterRoleUser);
    return searchTermMatch && roleMatch;
  });

  const filteredCarrerasByEscuela = carreras.filter((carrera) => {
    return (
      filterEscuelaCarrera === '' ||
      carrera.ESCUELA_ID_ESCUELA === parseInt(filterEscuelaCarrera)
    );
  });

  const handleCarreraSelection = (carreraId) => {
    setSelectedCarreraIds((prevSelected) =>
      prevSelected.includes(carreraId)
        ? prevSelected.filter((id) => id !== carreraId)
        : [...prevSelected, carreraId]
    );
  };

  return (
    <div>
      <h4>Asociar Coordinadores/Directores a Carreras</h4>
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      <UsuarioCarreraActions
        onNewAssociation={() => {
          setEditingUser(null);
          setShowModal(true);
        }}
        onEditSelected={() => {
          if (selectedUsersInTab.length === 1)
            handleEditUserAssociations(selectedUsersInTab[0].ID_USUARIO);
        }}
        onBulkDelete={handleBulkDeleteAssociations}
        processing={processing}
        selectedCount={selectedUsersInTab.length}
      />

      {eligibleUsers.length === 0 && (
        <Alert variant="warning">
          No hay usuarios con rol "{COORDINADOR_ROLE_NAME}" o "
          {DIRECTOR_ROLE_NAME}" disponibles para asociar.
        </Alert>
      )}
      {/* {carreras.length === 0 && !loading && (
        <Alert variant="warning">
          No hay carreras disponibles para asociar.
        </Alert>
      )} */}

      {showModal && (
        <UsuarioCarreraModal
          show={showModal}
          onHide={resetModalState}
          editingUser={editingUser}
          allRoles={allRoles}
          eligibleUsers={eligibleUsers}
          carreras={carreras}
          escuelas={escuelas}
          selectedUsuarioId={selectedUsuarioId}
          setSelectedUsuarioId={setSelectedUsuarioId}
          selectedCarreraIds={selectedCarreraIds}
          handleCarreraSelection={handleCarreraSelection}
          handleAddAssociation={handleAddAssociation}
          processing={processing}
          searchTermUser={searchTermUser}
          setSearchTermUser={setSearchTermUser}
          filterRoleUser={filterRoleUser}
          setFilterRoleUser={setFilterRoleUser}
          filterEscuelaCarrera={filterEscuelaCarrera}
          setFilterEscuelaCarrera={setFilterEscuelaCarrera}
        />
      )}

      <UsuarioCarreraTable
        groupedAssociations={groupedAssociations}
        eligibleUsers={eligibleUsers}
        selectedUsersInTab={selectedUsersInTab}
        processing={processing}
        loading={loading}
        onToggleUserSelection={handleToggleUserSelection}
        onToggleSelectAllUsers={handleToggleSelectAllUsers}
        onOpenViewCarrerasModal={handleOpenViewCarrerasModal}
        onEditUserAssociations={handleEditUserAssociations}
        onDeleteAllUserAssociations={handleDeleteAllUserAssociations}
      />

      {/* Modal para visualizar carreras de un usuario */}
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
