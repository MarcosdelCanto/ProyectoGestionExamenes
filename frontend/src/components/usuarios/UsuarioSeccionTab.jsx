import React, { useState, useEffect, useMemo } from 'react';
import { Table, Button, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import {
  listUsuarioSecciones,
  createUsuarioSeccion,
  deleteUsuarioSeccion,
} from '../../services/usuarioSeccionService';
import { fetchAllSecciones } from '../../services/seccionService';
import { fetchAllAsignaturas } from '../../services/asignaturaService'; // Servicio para obtener asignaturas

import UsuarioSeccionActions from './usuarioSeccion/UsuarioSeccionActions.jsx';
import UsuarioSeccionModal from './usuarioSeccion/UsuarioSeccionModal.jsx';
import UsuarioSeccionTable from './usuarioSeccion/UsuarioSeccionTable.jsx';

const ALUMNO_ROLE_NAME = 'ALUMNO';
const DOCENTE_ROLE_NAME = 'DOCENTE';

function UsuarioSeccionTab({ allUsers, allRoles }) {
  const [associations, setAssociations] = useState([]);
  const [eligibleUsers, setEligibleUsers] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [asignaturas, setAsignaturas] = useState([]); // Estado para almacenar asignaturas
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Estados para la modal
  const [selectedUsuarioId, setSelectedUsuarioId] = useState('');
  const [selectedSeccionIds, setSelectedSeccionIds] = useState([]); // Múltiples secciones
  const [processing, setProcessing] = useState(false);
  const [searchTermUser, setSearchTermUser] = useState('');
  const [filterRoleUser, setFilterRoleUser] = useState('');
  const [filterAsignaturaSeccion, setFilterAsignaturaSeccion] = useState(''); // Para filtrar secciones

  // Estado para la tabla agrupada
  const [groupedAssociations, setGroupedAssociations] = useState({});
  const [selectedUsersInTab, setSelectedUsersInTab] = useState([]); // Usuarios seleccionados en esta tabla

  // Estados para el modal de visualización de secciones de un usuario
  const [showViewSeccionesModal, setShowViewSeccionesModal] = useState(false);
  const [viewingUserSecciones, setViewingUserSecciones] = useState([]);
  const [viewingUserName, setViewingUserName] = useState('');

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
        secciones: [],
      };
      acc[assoc.USUARIO_ID_USUARIO].secciones.push({
        ID_SECCION: assoc.SECCION_ID_SECCION,
        NOMBRE_SECCION: assoc.NOMBRE_SECCION,
      });
      return acc;
    }, {});
    setGroupedAssociations(grouped);
  }, [associations, allUsers]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [assocData, seccionesData, asignaturasData] = await Promise.all([
        listUsuarioSecciones(),
        fetchAllSecciones(),
        fetchAllAsignaturas(), // Cargar asignaturas para el filtro
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
              ? `${user.NOMBRE_USUARIO} (${user.EMAIL_USUARIO})`
              : `Usuario ID: ${assoc.USUARIO_ID_USUARIO}`,
            NOMBRE_SECCION: seccion
              ? seccion.NOMBRE_SECCION ||
                seccion.CODIGO_SECCION ||
                `Sección ID: ${assoc.SECCION_ID_SECCION}`
              : `Sección ID: ${assoc.SECCION_ID_SECCION}`,
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
    } catch (err) {
      setError(
        'Error al cargar datos de asociaciones Usuario-Sección. ' +
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
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allUsers, allRoles]);

  const resetModalState = () => {
    setSelectedUsuarioId('');
    setSelectedSeccionIds([]);
    setSearchTermUser('');
    setFilterRoleUser('');
    setFilterAsignaturaSeccion('');
    setEditingUser(null);
    setShowModal(false);
  };

  const handleAddAssociation = async () => {
    if (!selectedUsuarioId || selectedSeccionIds.length === 0) {
      setError('Debe seleccionar un usuario y al menos una sección.');
      return;
    }
    setProcessing(true);
    setError(null);
    try {
      if (editingUser) {
        // Lógica de edición
        const currentSeccionesForUser = associations
          .filter(
            (assoc) => assoc.USUARIO_ID_USUARIO === parseInt(selectedUsuarioId)
          )
          .map((assoc) => assoc.SECCION_ID_SECCION);

        const seccionesToDelete = currentSeccionesForUser.filter(
          (sId) => !selectedSeccionIds.includes(sId.toString())
        );
        const seccionesToAdd = selectedSeccionIds.filter(
          (sId) => !currentSeccionesForUser.includes(parseInt(sId))
        );

        await Promise.all([
          ...seccionesToDelete.map((seccionId) =>
            deleteUsuarioSeccion(parseInt(selectedUsuarioId), seccionId)
          ),
          ...seccionesToAdd.map((seccionId) =>
            createUsuarioSeccion({
              USUARIO_ID_USUARIO: parseInt(selectedUsuarioId),
              SECCION_ID_SECCION: parseInt(seccionId),
            })
          ),
        ]);
      } else {
        // Lógica de creación
        await Promise.all(
          selectedSeccionIds.map((seccionId) =>
            createUsuarioSeccion({
              USUARIO_ID_USUARIO: parseInt(selectedUsuarioId),
              SECCION_ID_SECCION: parseInt(seccionId),
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

    const associatedSecciones = associations
      .filter((assoc) => assoc.USUARIO_ID_USUARIO === userId)
      .map((assoc) => assoc.SECCION_ID_SECCION.toString());
    setSelectedSeccionIds(associatedSecciones);

    setShowModal(true);
    setSelectedUsersInTab([userToEdit]); // Seleccionar el usuario que se está editando
  };

  const handleDeleteAssociation = async (usuarioId, seccionId) => {
    const seccion = secciones.find((s) => s.ID_SECCION === seccionId);
    const seccionNombre = seccion
      ? seccion.NOMBRE_SECCION || seccion.CODIGO_SECCION
      : `ID: ${seccionId}`;
    if (
      !window.confirm(
        `¿Está seguro de que desea desvincular la sección "${seccionNombre}" de este usuario?`
      )
    )
      return;
    setProcessing(true);
    setError(null);
    try {
      await deleteUsuarioSeccion(usuarioId, seccionId);
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
        `¿Está seguro de que desea eliminar TODAS las asociaciones de sección para el usuario ${user.NOMBRE_USUARIO}? Esta acción no eliminará al usuario.`
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
          deleteUsuarioSeccion(userId, assoc.SECCION_ID_SECCION)
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

  const handleOpenViewSeccionesModal = (userId) => {
    const userData = groupedAssociations[userId];
    if (userData) {
      setViewingUserName(userData.NOMBRE_USUARIO);
      setViewingUserSecciones(userData.secciones);
      setShowViewSeccionesModal(true);
    }
  };

  const handleBulkDeleteAssociations = async () => {
    if (selectedUsersInTab.length === 0) {
      setError('Seleccione al menos un usuario.');
      return;
    }
    if (
      !window.confirm(
        `¿Está seguro de que desea eliminar TODAS las asociaciones de sección para los ${selectedUsersInTab.length} usuarios seleccionados? Esta acción no eliminará a los usuarios.`
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
            deleteUsuarioSeccion(user.ID_USUARIO, assoc.SECCION_ID_SECCION)
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
        <p>Cargando asociaciones Usuario-Sección...</p>
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

  const filteredSecciones = secciones.filter((seccion) => {
    // Filtrar por asignatura seleccionada
    return (
      filterAsignaturaSeccion === '' ||
      seccion.ASIGNATURA_ID_ASIGNATURA === parseInt(filterAsignaturaSeccion)
    );
  });

  const handleSeccionSelection = (seccionId) => {
    setSelectedSeccionIds((prevSelected) =>
      prevSelected.includes(seccionId)
        ? prevSelected.filter((id) => id !== seccionId)
        : [...prevSelected, seccionId]
    );
  };

  return (
    <div>
      <h4>Asociar Alumnos/Docentes a Secciones</h4>
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      <UsuarioSeccionActions
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
          No hay usuarios con rol "{ALUMNO_ROLE_NAME}" o "{DOCENTE_ROLE_NAME}"
          disponibles para asociar.
        </Alert>
      )}
      {/* Secciones.length check se maneja dentro de UsuarioSeccionModal y UsuarioSeccionTable */}
      {/* {secciones.length === 0 && !loading && (
        <Alert variant="warning">
          No hay secciones disponibles para asociar.
        </Alert>
      )} */}

      {showModal && (
        <UsuarioSeccionModal
          show={showModal}
          onHide={resetModalState}
          editingUser={editingUser}
          allRoles={allRoles}
          eligibleUsers={eligibleUsers} // Pasar la lista completa de usuarios elegibles
          secciones={secciones}
          asignaturas={asignaturas}
          selectedUsuarioId={selectedUsuarioId}
          setSelectedUsuarioId={setSelectedUsuarioId}
          selectedSeccionIds={selectedSeccionIds}
          handleSeccionSelection={handleSeccionSelection}
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
        groupedAssociations={groupedAssociations}
        eligibleUsers={eligibleUsers}
        selectedUsersInTab={selectedUsersInTab}
        processing={processing}
        loading={loading}
        onToggleUserSelection={handleToggleUserSelection}
        onToggleSelectAllUsers={handleToggleSelectAllUsers}
        onOpenViewSeccionesModal={handleOpenViewSeccionesModal}
        onEditUserAssociations={handleEditUserAssociations}
        onDeleteAllUserAssociations={handleDeleteAllUserAssociations}
      />

      {/* Modal para visualizar secciones de un usuario */}
      <Modal
        show={showViewSeccionesModal}
        onHide={() => setShowViewSeccionesModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Secciones Asociadas a {viewingUserName}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {viewingUserSecciones.length > 0 ? (
            <ul className="list-group">
              {viewingUserSecciones.map((seccion) => (
                <li key={seccion.ID_SECCION} className="list-group-item">
                  {seccion.NOMBRE_SECCION}
                </li>
              ))}
            </ul>
          ) : (
            <p>No hay secciones asociadas a este usuario.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowViewSeccionesModal(false)}
          >
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default UsuarioSeccionTab;
