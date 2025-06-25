import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Layout from '../components/Layout';
import {
  listUsuarios,
  createUsuario,
  updateUsuario,
  resetPassword,
  deleteUser, // Función para eliminar un solo usuario
  deleteMultipleUsers, // Función para eliminar múltiples usuarios
} from '../services/usuarioService';
import { fetchAllRoles } from '../services/rolService';
import './UsuariosPage.css';

import UsuarioTable from '../components/usuarios/UsuarioTable';
import UsuarioForm from '../components/usuarios/UsuarioForm';
import UsuarioActions from '../components/usuarios/UsuarioActions';
import UsuarioFilter from '../components/usuarios/UsuarioFilter';
import PaginationComponent from '../components/PaginationComponent';
import {
  Alert,
  Nav,
  Modal,
  Button as BsButton,
  Spinner,
} from 'react-bootstrap';
import UsuarioCarreraTab from '../components/usuarios/UsuarioCarreraTab';
import UsuarioSeccionTab from '../components/usuarios/UsuarioSeccionTab';

import { listCarrerasByUsuario } from '../services/usuarioCarreraService';
import { listSeccionesByUsuario } from '../services/usuarioSeccionService';
import { useModals } from '../hooks/useModals';
import { usePermission } from '../hooks/usePermission'; // Asegúrate de que el hook de permisos esté actualizado

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedUsuarios, setSelectedUsuarios] = useState([]);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [filters, setFilters] = useState({ text: '', role: '' });
  const [roles, setRoles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [msgModal, setMsgModal] = useState(null); // Para mensajes de modales informativos
  const [bulkUploadResult, setBulkUploadResult] = useState(null); // Para resultados de carga masiva
  const [activeTab, setActiveTab] = useState('gestionUsuarios');

  // Estados para el modal de asociaciones de usuario
  const [showAssociationsModal, setShowAssociationsModal] = useState(false);
  const [selectedUserForModal, setSelectedUserForModal] = useState(null);
  const [modalContentType, setModalContentType] = useState(''); // 'carreras' o 'secciones'
  const [modalContent, setModalContent] = useState([]); // Datos a mostrar en el modal de asociaciones
  const [modalLoading, setModalLoading] = useState(false); // Estado de carga del modal de asociaciones

  // Hook de permisos
  const { canCreate, canEdit, canDelete, hasPermission } = usePermission(); // Asegúrate de usar los permisos correctamente

  // Hook de modales genéricos (para formularios)
  const {
    showModal,
    handleShowModal,
    handleCloseModal,
    modalTitle,
    modalContent: formModalContent, // Renombrado para evitar conflicto con modalContent de asociaciones
  } = useModals();

  // Función para obtener la lista de usuarios
  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    // No hay estado de error directo aquí, se maneja con el msgModal
    try {
      const data = await listUsuarios();
      setUsuarios(data || []);
      setCurrentPage(1); // Resetear a la primera página al recargar usuarios
    } catch (err) {
      console.error('Error al obtener usuarios:', err);
      setUsuarios([]); // Vaciar la lista en caso de error
      // Podrías usar setMsgModal aquí para informar de un error de carga general
      setMsgModal({
        title: 'Error de Carga',
        body: 'No se pudieron cargar los usuarios.',
      });
    } finally {
      setLoading(false);
    }
  }, []); // Dependencias: [] para que se ejecute solo al montar

  // Función para cargar los roles
  const loadRoles = useCallback(async () => {
    try {
      const rolesData = await fetchAllRoles();
      setRoles(rolesData || []);
    } catch (error) {
      console.error('Error al cargar roles en UsuariosPage:', error);
      setRoles([]);
      setMsgModal({
        title: 'Error de Carga',
        body: 'No se pudieron cargar los roles.',
      });
    }
  }, []); // Dependencias: [] para que se ejecute solo al montar

  // Efecto para cargar roles y usuarios al montar el componente
  useEffect(() => {
    loadRoles();
    fetchUsuarios();
  }, [fetchUsuarios, loadRoles]); // Dependencias: Se recargan si fetchUsuarios o loadRoles cambian (aunque son useCallback sin dependencias, útil si se modificaran)

  // Efecto para limpiar el resultado de la carga masiva después de un tiempo
  useEffect(() => {
    let timer;
    if (bulkUploadResult) {
      timer = setTimeout(() => setBulkUploadResult(null), 7000); // Limpiar después de 7 segundos
    }
    return () => clearTimeout(timer); // Limpiar el timer si el componente se desmonta o bulkUploadResult cambia
  }, [bulkUploadResult]);

  // Handler para guardar un usuario (crear o actualizar)
  const onSave = useCallback(
    async ({ nombre, email, rolId, password }) => {
      const payload = {
        nombre_usuario: nombre,
        email_usuario: email,
        rol_id_rol: rolId,
      };
      if (password) {
        // Solo incluir la contraseña si se proporcionó
        payload.password_usuario = password;
      }

      try {
        setIsProcessingAction(true); // Iniciar estado de procesamiento
        let result;
        if (editing) {
          // Si hay un usuario en edición
          result = await updateUsuario(editing.ID_USUARIO, payload);
        } else {
          // Si es un nuevo usuario
          result = await createUsuario(payload);
        }
        setShowForm(false); // Ocultar formulario
        setEditing(null); // Limpiar usuario en edición
        setSelectedUsuarios([]); // Limpiar selección
        fetchUsuarios(); // Recargar lista de usuarios
        setMsgModal({
          title: 'Usuario guardado',
          body: editing
            ? `El usuario ha sido actualizado.${
                password ? ' Se ha establecido una nueva contraseña.' : ''
              }`
            : `Usuario creado con contraseña: ${result.password}`, // Asume que createUsuario devuelve la contraseña generada
        });
      } catch (err) {
        console.error('Error guardando usuario:', err);
        const errorMessage =
          err.response?.data?.message ||
          'Error desconocido al guardar usuario.';
        if (err.response?.status === 409) {
          // Conflicto (ej. email duplicado)
          setMsgModal({ title: 'Conflicto', body: errorMessage });
        } else {
          setMsgModal({ title: 'Error', body: errorMessage });
        }
      } finally {
        setIsProcessingAction(false); // Finalizar estado de procesamiento
      }
    },
    [editing, fetchUsuarios]
  ); // Dependencias: `editing` para saber si es update o create, `fetchUsuarios` para recargar la lista

  // Handler para resetear contraseña
  const handleResetPassword = useCallback(async (id) => {
    try {
      const { password } = await resetPassword(id);
      setMsgModal({
        title: 'Contraseña reseteada',
        body: `La nueva contraseña es: ${password}`,
      });
    } catch (err) {
      console.error('Error al resetear contraseña:', err);
      const errorMessage =
        err.response?.data?.message ||
        'Error desconocido al resetear contraseña.';
      setMsgModal({ title: 'Error', body: errorMessage });
    }
  }, []);

  // Kóva hína pe tembiapo ojeipurútava ojepe’a hag̃ua peteĩ jepurukuaaty añónte térã hetave
  const handleDeleteSelectedUsuarios = useCallback(
    async (usuariosToDelete) => {
      if (!canDelete('usuarios')) {
        // Ojehechakuaa jepurukuaatykuéra
        setMsgModal({
          title: 'Acceso Denegado',
          body: 'No tienes permiso para eliminar usuarios.',
        });
        return;
      }

      const idsToDelete = usuariosToDelete.map((user) => user.ID_USUARIO);
      if (idsToDelete.length === 0) return;

      // YA NO SE USA window.confirm(). La confirmación se maneja enteramente en el modal de Bootstrap.

      setIsProcessingAction(true); // Iniciar estado de procesamiento
      try {
        let response;
        if (idsToDelete.length === 1) {
          // Eliminar un solo usuario
          response = await deleteUser(idsToDelete[0]);
        } else {
          // Eliminar múltiples usuarios
          response = await deleteMultipleUsers(idsToDelete);
        }

        setMsgModal({
          title: 'Usuario(s) Eliminado(s)',
          body:
            response.message ||
            `${idsToDelete.length} usuario(s) ha(n) sido eliminado(s) correctamente.`,
        });
        setSelectedUsuarios([]); // Limpiar selección después de la eliminación
        fetchUsuarios(); // Recargar la lista de usuarios
      } catch (error) {
        console.error('Error eliminando usuarios:', error);
        const errorMessage =
          error.response?.data?.details ||
          error.response?.data?.error ||
          error.message ||
          'Error desconocido al eliminar usuario(s).';
        setMsgModal({
          title: 'Error de Eliminación',
          body: errorMessage,
        });
      } finally {
        setIsProcessingAction(false); // Finalizar estado de procesamiento
      }
    },
    [fetchUsuarios, canDelete]
  ); // Dependencias: `fetchUsuarios` para recargar, `canDelete` para permiso

  // Esta función se llamará cuando el proceso de carga masiva de archivos termine.
  const handleUploadProcessComplete = useCallback(() => {
    console.log('Proceso de carga masiva completado, refrescando usuarios...');
    fetchUsuarios(); // Recargar la lista de usuarios después de la carga
  }, [fetchUsuarios]);

  // Esta función se llamará con los datos del resultado de la carga masiva (el resumen)
  const handleBulkUploadDataResult = useCallback((result) => {
    console.log(
      'Datos del resultado de carga masiva recibidos en UsuariosPage:',
      result
    );
    // Ajusta la estructura según lo que tu backend devuelva para el resumen de carga
    if (result && result.success) {
      // Asumiendo que el resultado tiene una propiedad `success`
      setBulkUploadResult({
        message: result.message,
        inserted: result.details?.inserted?.usuario || 'N/A', // Ajusta según la estructura real
        updated: result.details?.updated?.usuario || 'N/A',
        ignored: result.details?.ignored?.fila_total || 'N/A',
        errors: result.errors, // Si el backend envía errores por fila
      });
    } else if (result && result.message) {
      setBulkUploadResult({
        message: result.message,
        errors: result.errorDetails || [],
      });
    } else {
      setBulkUploadResult(null); // Para limpiar o si el formato no es el esperado
    }
  }, []); // Dependencias: [] porque solo usa los parámetros pasados

  // Handlers para la selección de usuarios en la tabla
  const handleToggleUsuarioSelection = useCallback((usuarioToToggle) => {
    setSelectedUsuarios((prevSelected) => {
      const isSelected = prevSelected.find(
        (u) => u.ID_USUARIO === usuarioToToggle.ID_USUARIO
      );
      if (isSelected) {
        return prevSelected.filter(
          (u) => u.ID_USUARIO !== usuarioToToggle.ID_USUARIO
        );
      }
      return [...prevSelected, usuarioToToggle];
    });
  }, []); // Dependencias: [] porque solo usa el estado anterior

  // Aplicar el filtro (definido ANTES de los callbacks que lo usan)
  const filteredUsuarios = useMemo(() => {
    return usuarios.filter((usuario) => {
      // Filtrar por rol
      const matchesRole =
        filters.role === '' || // Si el filtro de rol está vacío, coincide con todos
        parseInt(String(usuario.ROL_ID_ROL), 10) === parseInt(filters.role, 10); // Comparar ID de rol

      // Filtrar por texto (nombre o email)
      const matchesText =
        filters.text === '' || // Si el filtro de texto está vacío, coincide con todos
        (usuario.NOMBRE_USUARIO && // Asegurarse de que el nombre exista
          usuario.NOMBRE_USUARIO.toLowerCase().includes(
            filters.text.toLowerCase()
          )) ||
        (usuario.EMAIL_USUARIO && // Asegurarse de que el email exista
          usuario.EMAIL_USUARIO.toLowerCase().includes(
            filters.text.toLowerCase()
          ));
      return matchesRole && matchesText; // Un usuario debe coincidir con ambos filtros
    });
  }, [usuarios, filters]); // Dependencias: `usuarios` (la lista completa) y `filters`

  // Handler para seleccionar/deseleccionar todos los usuarios
  const handleToggleSelectAll = useCallback(() => {
    if (selectedUsuarios.length === filteredUsuarios.length) {
      // AHORA filteredUsuarios ya está definido
      setSelectedUsuarios([]);
    } else {
      setSelectedUsuarios([...filteredUsuarios]); // AHORA filteredUsuarios ya está definido
    }
  }, [selectedUsuarios.length, filteredUsuarios]); // Dependencias: `filteredUsuarios` para que se reevalúe con el filtro

  // Handlers para UsuarioActions (añadir/editar)
  const handleAddUsuario = useCallback(() => {
    if (!canCreate('usuarios')) {
      setMsgModal({
        title: 'Acceso Denegado',
        body: 'No tienes permiso para crear usuarios.',
      });
      return;
    }
    setEditing(null); // Limpiar cualquier usuario en edición
    setSelectedUsuarios([]); // Limpiar selección
    setShowForm(true); // Mostrar formulario
    // La función `onSave` en UsuarioForm será la que maneje createUsuario
  }, [canCreate]);

  const handleEditUsuario = useCallback(() => {
    if (!canEdit('usuarios')) {
      setMsgModal({
        title: 'Acceso Denegado',
        body: 'No tienes permiso para editar usuarios.',
      });
      return;
    }
    if (selectedUsuarios.length === 1) {
      setEditing(selectedUsuarios[0]); // Establecer el usuario a editar
      setShowForm(true); // Mostrar formulario
    } else {
      setMsgModal({
        title: 'Error de Selección',
        body: 'Debe seleccionar exactamente un usuario para modificar.',
      });
    }
  }, [selectedUsuarios, canEdit]); // Dependencias: `selectedUsuarios` para saber cuál editar, `canEdit` para permiso

  // Handler para el cambio de filtro
  const handleFilterChange = useCallback((changedFilters) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      ...changedFilters, // Sobrescribe solo las propiedades que cambiaron
    }));
    setCurrentPage(1); // Volver a la primera página al cambiar filtros
  }, []); // Dependencias: [] porque solo actualiza el estado

  // Handlers para mostrar/ocultar modales de asociaciones
  const handleShowUserCarreras = useCallback(async (user) => {
    setSelectedUserForModal(user);
    setModalContentType('carreras');
    setShowAssociationsModal(true);
    setModalLoading(true);
    try {
      const carreras = await listCarrerasByUsuario(user.ID_USUARIO);
      setModalContent(carreras || []);
    } catch (error) {
      console.error('Error al cargar carreras del usuario:', error);
      setModalContent([]);
      setMsgModal({
        title: 'Error de Carga',
        body: 'No se pudieron cargar las carreras asociadas.',
      });
    } finally {
      setModalLoading(false);
    }
  }, []);

  const handleShowUserSecciones = useCallback(async (user) => {
    setSelectedUserForModal(user);
    setModalContentType('secciones');
    setShowAssociationsModal(true);
    setModalLoading(true);
    try {
      const secciones = await listSeccionesByUsuario(user.ID_USUARIO);
      setModalContent(secciones || []);
    } catch (error) {
      console.error('Error al cargar secciones del usuario:', error);
      setModalContent([]);
      setMsgModal({
        title: 'Error de Carga',
        body: 'No se pudieron cargar las secciones asociadas.',
      });
    } finally {
      setModalLoading(false);
    }
  }, []);

  const handleCloseAssociationsModal = () => {
    setShowAssociationsModal(false);
    setSelectedUserForModal(null);
    setModalContentType('');
    setModalContent([]);
  };

  // Lógica de Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsuarios = filteredUsuarios.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  // Función para cambiar de página en la paginación
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <Layout>
      <div className="container-fluid pt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="display-6">
            <i className="bi bi-people-fill me-3"></i>
            Gestión de Usuarios
          </h2>
        </div>
        <hr></hr>

        {/* Alerta para resultados de carga masiva */}
        {bulkUploadResult && (
          <Alert
            variant={
              bulkUploadResult.errors && bulkUploadResult.errors.length > 0
                ? 'warning'
                : 'success'
            }
            className="mb-3"
            onClose={() => setBulkUploadResult(null)}
            dismissible
          >
            {bulkUploadResult.message ? (
              <p>{bulkUploadResult.message}</p>
            ) : (
              // Mensaje genérico si no hay un `message` específico, pero sí `inserted`, etc.
              <>
                Resumen de la carga: Insertados:
                {bulkUploadResult.inserted !== undefined
                  ? bulkUploadResult.inserted
                  : 'N/A'}
                | Actualizados:
                {bulkUploadResult.updated !== undefined
                  ? bulkUploadResult.updated
                  : 'N/A'}
                | Ignorados:
                {bulkUploadResult.ignored !== undefined
                  ? bulkUploadResult.ignored
                  : 'N/A'}
                {bulkUploadResult.associations_created !== undefined && (
                  <>
                    {' | '}Asociaciones Creadas:
                    {bulkUploadResult.associations_created !== undefined
                      ? bulkUploadResult.associations_created
                      : 'N/A'}
                  </>
                )}
                {/* Detalles de errores si existen */}
                {bulkUploadResult.errors &&
                  bulkUploadResult.errors.length > 0 && (
                    <div className="mt-2">
                      <strong>Detalles de errores/ignorados:</strong>
                      <ul
                        style={{
                          maxHeight: '100px',
                          overflowY: 'auto',
                          fontSize: '0.9em',
                        }}
                      >
                        {bulkUploadResult.errors.map((errDetail, index) => (
                          <li key={index}>
                            {errDetail.idDocente ||
                              errDetail.idAlumno ||
                              `Fila ${errDetail.fila || index + 1}`}
                            : {errDetail.email || ''} - {errDetail.error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </>
            )}
          </Alert>
        )}

        {/* Navegación por pestañas */}
        <Nav
          variant="tabs"
          activeKey={activeTab}
          onSelect={(k, e) => {
            // Evitar cambio de pestaña si el clic se origina dentro de un modal
            if (e && e.target && e.target.closest('.modal-content')) {
              return;
            }
            setActiveTab(k);
          }}
          className="mb-3"
        >
          <Nav.Item>
            <Nav.Link eventKey="gestionUsuarios">Gestión de Usuarios</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="usuariosCarreras">Usuarios y Carreras</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="usuariosSecciones">
              Usuarios y Secciones
            </Nav.Link>
          </Nav.Item>
        </Nav>

        {/* Contenido de la pestaña "Gestión de Usuarios" */}
        {activeTab === 'gestionUsuarios' && (
          <>
            {/* Componente de filtro de usuarios */}
            <UsuarioFilter
              roles={roles}
              onFilterChange={handleFilterChange}
              currentFilters={filters}
            />

            {/* Componente de acciones de usuario (Añadir, Modificar, Eliminar, Carga Masiva) */}
            <UsuarioActions
              onAdd={handleAddUsuario}
              onEdit={handleEditUsuario}
              onDelete={handleDeleteSelectedUsuarios} // Pasa la función para eliminar usuarios seleccionados
              selectedUsuarios={selectedUsuarios}
              isLoadingList={loading && activeTab === 'gestionUsuarios'}
              isProcessingAction={isProcessingAction}
              onBulkUploadComplete={handleUploadProcessComplete}
              onUploadResult={handleBulkUploadDataResult}
            />

            {/* Renderizado condicional de la tabla de usuarios o mensaje de carga */}
            {loading && activeTab === 'gestionUsuarios' ? (
              <p className="text-center">Cargando usuarios…</p>
            ) : (
              <UsuarioTable
                usuarios={currentUsuarios} // Pasa solo los usuarios de la página actual
                selectedUsuarios={selectedUsuarios}
                onToggleUsuarioSelection={handleToggleUsuarioSelection}
                onToggleSelectAll={handleToggleSelectAll}
                onEdit={(u) => {
                  // Para la edición desde la tabla (ícono de lápiz)
                  setEditing(u);
                  setSelectedUsuarios([u]); // Asegura que solo este usuario esté seleccionado
                  setShowForm(true);
                }}
                // `onDelete` aquí sería para una eliminación individual directa desde la tabla (ej. por un ícono de basura en cada fila)
                // Si solo quieres eliminar desde el botón principal de `UsuarioActions`, puedes omitir esta prop aquí
                // onDelete={onDelete} // Si se quiere un borrado individual desde la tabla
                handleResetPassword={handleResetPassword}
                onShowUserCarreras={handleShowUserCarreras}
                onShowUserSecciones={handleShowUserSecciones}
                className="usuario-table"
              />
            )}
            {/* Paginación */}
            {!loading &&
              activeTab === 'gestionUsuarios' &&
              filteredUsuarios.length > itemsPerPage && (
                <div className="pagination-container">
                  <PaginationComponent
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredUsuarios.length}
                    paginate={paginate}
                    currentPage={currentPage}
                  />
                </div>
              )}
            {/* Formulario de usuario (Modal) */}
            {showForm && (
              <>
                <div className="modal-backdrop fade show"></div>{' '}
                {/* Fondo oscuro del modal */}
                <UsuarioForm
                  initial={editing}
                  onClose={() => {
                    setShowForm(false);
                    setEditing(null);
                  }}
                  onSave={onSave}
                  roles={roles} // Asegúrate de pasar los roles al formulario
                />
              </>
            )}
          </>
        )}

        {/* Contenido de otras pestañas */}
        {activeTab === 'usuariosCarreras' && (
          <UsuarioCarreraTab allUsers={usuarios} allRoles={roles} />
        )}
        {activeTab === 'usuariosSecciones' && (
          <UsuarioSeccionTab allUsers={usuarios} allRoles={roles} />
        )}

        {/* Modal para mostrar asociaciones de carreras/secciones */}
        <Modal
          show={showAssociationsModal}
          onHide={handleCloseAssociationsModal}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>
              {modalContentType === 'carreras'
                ? 'Carreras Asociadas a '
                : 'Secciones Asociadas a '}
              {selectedUserForModal?.NOMBRE_USUARIO}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {modalLoading ? (
              <div className="text-center">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </Spinner>
              </div>
            ) : modalContent.length > 0 ? (
              <ul className="list-unstyled">
                {modalContentType === 'carreras' &&
                  modalContent.map((item) => (
                    // Asumiendo que listCarrerasByUsuario devuelve objetos con ID_CARRERA y NOMBRE_CARRERA
                    <li key={item.ID_CARRERA || item.CARRERA_ID_CARRERA}>
                      {item.NOMBRE_CARRERA}
                    </li>
                  ))}
                {modalContentType === 'secciones' &&
                  modalContent.map((item) => (
                    // Asumiendo que listSeccionesByUsuario devuelve objetos con ID_SECCION y NOMBRE_SECCION
                    <li key={item.ID_SECCION || item.SECCION_ID_SECCION}>
                      {item.NOMBRE_SECCION}
                      {item.CODIGO_SECCION ? ` (${item.CODIGO_SECCION})` : ''}
                    </li>
                  ))}
              </ul>
            ) : (
              <p>
                No hay{' '}
                {modalContentType === 'carreras' ? 'carreras' : 'secciones'}{' '}
                asociadas a este usuario.
              </p>
            )}
          </Modal.Body>
          <Modal.Footer>
            <BsButton
              variant="secondary"
              onClick={handleCloseAssociationsModal}
            >
              Cerrar
            </BsButton>
          </Modal.Footer>
        </Modal>
      </div>

      {/* Modal para mensajes informativos (msgModal) */}
      {msgModal && (
        <div
          className="modal fade show custom-msg-modal"
          tabIndex="-1"
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{msgModal.title}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setMsgModal(null)}
                  aria-label="Cerrar"
                />
              </div>
              <div className="modal-body">
                <p>{msgModal.body}</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setMsgModal(null)}
                >
                  Aceptar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
