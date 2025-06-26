import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Layout from '../components/Layout';
import {
  listUsuarios,
  createUsuario,
  updateUsuario,
  resetPassword,
  deleteUser,
  deleteMultipleUsers,
} from '../services/usuarioService';
import { fetchAllRoles } from '../services/rolService';
import './UsuariosPage.css';

import UsuarioTable from '../components/usuarios/UsuarioTable';
import UsuarioForm from '../components/usuarios/UsuarioForm';
import UsuarioActions from '../components/usuarios/UsuarioActions';
import UsuarioFilter from '../components/usuarios/UsuarioFilter';
import PaginationComponent from '../components/PaginationComponent';
import { Alert, Nav, Spinner } from 'react-bootstrap';
import UsuarioCarreraTab from '../components/usuarios/UsuarioCarreraTab';
import UsuarioSeccionTab from '../components/usuarios/UsuarioSeccionTab';

import { listCarrerasByUsuario } from '../services/usuarioCarreraService';
import { listSeccionesByUsuario } from '../services/usuarioSeccionService';
import { usePermission } from '../hooks/usePermission';

// --- COMPONENTE MODAL UNIFICADO (DEFINIDO AFUERA SI ES REUTILIZABLE) ---
function Modal({ title, children, onClose, processing }) {
  return (
    <div
      className="modal show"
      style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div
          className="modal-content"
          style={{ border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,.3)' }}
        >
          {' '}
          {/* AÑADIDO: style para quitar el borde */}
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={onClose}
              disabled={processing}
            ></button>
          </div>
          <div className="modal-body">{children}</div>
        </div>
      </div>
    </div>
  );
}
// --- FIN COMPONENTE MODAL UNIFICADO ---

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsuarios, setSelectedUsuarios] = useState([]);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [filters, setFilters] = useState({ text: '', role: '' });
  const [roles, setRoles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [bulkUploadResult, setBulkUploadResult] = useState(null);
  const [activeTab, setActiveTab] = useState('gestionUsuarios');

  // --- ESTADOS PARA MODALES PERSONALIZADAS (ALERTAS/CONFIRMACIONES/FORMULARIOS/ASOCIACIONES) ---
  const [modalState, setModalState] = useState({
    type: null,
    entity: null,
    data: null,
    content: [],
    loadingContent: false,
    title: '',
    action: null,
    show: false,
  });
  // --- FIN ESTADOS PARA MODALES PERSONALIZADAS ---

  const { canCreate, canEdit, canDelete, hasPermission } = usePermission();

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listUsuarios();
      setUsuarios(data || []);
      setCurrentPage(1);
    } catch (err) {
      console.error('Error al obtener usuarios:', err);
      setUsuarios([]);
      setModalState((prev) => ({
        ...prev,
        type: 'alert',
        title: 'Error de Carga',
        data: 'No se pudieron cargar los usuarios.',
        show: true,
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRoles = useCallback(async () => {
    try {
      const rolesData = await fetchAllRoles();
      setRoles(rolesData || []);
    } catch (error) {
      console.error('Error al cargar roles:', error);
      setRoles([]);
      setModalState((prev) => ({
        ...prev,
        type: 'alert',
        title: 'Error de Carga',
        data: 'No se pudieron cargar los roles.',
        show: true,
      }));
    }
  }, []);

  useEffect(() => {
    loadRoles();
    fetchUsuarios();
  }, [fetchUsuarios, loadRoles]);

  useEffect(() => {
    let timer;
    if (bulkUploadResult) {
      timer = setTimeout(() => setBulkUploadResult(null), 7000);
    }
    return () => clearTimeout(timer);
  }, [bulkUploadResult]);

  const closeCustomModal = useCallback(() => {
    setModalState({
      type: null,
      entity: null,
      data: null,
      content: [],
      loadingContent: false,
      title: '',
      action: null,
      show: false,
    });
    setSelectedUsuarios([]);
  }, []);

  // --- MANEJADORES DE ACCIONES CON MODALES PERSONALIZADAS ---
  const handleDeleteConfirmed = useCallback(async () => {
    const usuariosToDelete = modalState.data;
    if (!usuariosToDelete || usuariosToDelete.length === 0) {
      closeCustomModal();
      return;
    }

    const idsToDelete = usuariosToDelete.map((user) => user.ID_USUARIO);

    setIsProcessingAction(true);
    try {
      const response =
        idsToDelete.length === 1
          ? await deleteUser(idsToDelete[0])
          : await deleteMultipleUsers(idsToDelete);
      closeCustomModal();
      fetchUsuarios();
      setModalState((prev) => ({
        ...prev,
        type: 'alert',
        title: 'Eliminación Exitosa',
        data:
          response.message ||
          `${idsToDelete.length} usuario(s) eliminado(s) correctamente.`,
        show: true,
      }));
    } catch (error) {
      const errorMessage =
        error.response?.data?.details ||
        error.response?.data?.error ||
        error.message ||
        'Error desconocido al eliminar usuario(s).';
      setModalState((prev) => ({
        ...prev,
        type: 'alert',
        title: 'Error de Eliminación',
        data: errorMessage,
        show: true,
      }));
    } finally {
      setIsProcessingAction(false);
    }
  }, [fetchUsuarios, modalState.data, closeCustomModal, modalState.action]);

  const handleResetPassword = useCallback(
    async (id) => {
      setIsProcessingAction(true);
      try {
        const { password } = await resetPassword(id);
        closeCustomModal();
        setModalState((prev) => ({
          ...prev,
          type: 'alert',
          title: 'Contraseña Reseteada',
          data: `La nueva contraseña es: ${password}`,
          show: true,
        }));
      } catch (err) {
        const errorMessage =
          err.response?.data?.message || 'Error al resetear contraseña.';
        setModalState((prev) => ({
          ...prev,
          type: 'alert',
          title: 'Error',
          data: errorMessage,
          show: true,
        }));
      } finally {
        setIsProcessingAction(false);
      }
    },
    [closeCustomModal]
  );

  const openCustomModal = useCallback(
    async (type, entity, payload = null) => {
      setModalState({
        type: null,
        entity: null,
        data: null,
        content: [],
        loadingContent: false,
        title: '',
        action: null,
        show: false,
      });
      setIsProcessingAction(false);

      if (type === 'add') {
        if (!canCreate('usuarios')) {
          setModalState((prev) => ({
            ...prev,
            type: 'alert',
            title: 'Acceso Denegado',
            data: 'No tienes permiso para crear usuarios.',
            show: true,
          }));
          return;
        }
        setSelectedUsuarios([]);
        setModalState({
          type: 'add',
          entity: entity,
          data: null,
          title: 'Nuevo Usuario',
          show: true,
        });
      } else if (type === 'edit') {
        if (!canEdit('usuarios')) {
          setModalState((prev) => ({
            ...prev,
            type: 'alert',
            title: 'Acceso Denegado',
            data: 'No tienes permiso para editar usuarios.',
            show: true,
          }));
          return;
        }
        if (selectedUsuarios.length !== 1) {
          setModalState((prev) => ({
            ...prev,
            type: 'alert',
            title: 'Error de Selección',
            data: 'Debe seleccionar un único usuario para modificar.',
            show: true,
          }));
          return;
        }
        setModalState({
          type: 'edit',
          entity: entity,
          data: selectedUsuarios[0],
          title: 'Editar Usuario',
          show: true,
        });
      } else if (type === 'delete') {
        if (!canDelete('usuarios')) {
          setModalState((prev) => ({
            ...prev,
            type: 'alert',
            title: 'Acceso Denegado',
            data: 'No tienes permiso para eliminar usuarios.',
            show: true,
          }));
          return;
        }
        if (selectedUsuarios.length === 0) {
          setModalState((prev) => ({
            ...prev,
            type: 'alert',
            title: 'Error de Selección',
            data: 'Debe seleccionar al menos un usuario para eliminar.',
            show: true,
          }));
          return;
        }
        setModalState((prev) => ({
          ...prev,
          type: 'delete',
          entity: entity,
          data: selectedUsuarios,
          title: 'Confirmar Eliminación',
          action: handleDeleteConfirmed,
          show: true,
        }));
      } else if (type === 'showAssociations') {
        setModalState((prev) => ({
          ...prev,
          type: 'showAssociations',
          entity: entity,
          data: payload,
          title: `${entity.charAt(0).toUpperCase() + entity.slice(1)} de ${payload?.NOMBRE_USUARIO}`,
          loadingContent: true,
          show: true,
        }));
        try {
          let content = [];
          if (entity === 'carreras')
            content = await listCarrerasByUsuario(payload.ID_USUARIO);
          else if (entity === 'secciones')
            content = await listSeccionesByUsuario(payload.ID_USUARIO);

          setModalState((prev) => ({
            ...prev,
            content: content || [],
            loadingContent: false,
          }));
        } catch (err) {
          console.error('Error al cargar asociaciones:', err);
          setModalState((prev) => ({
            ...prev,
            type: 'alert',
            title: 'Error de Carga',
            data: `No se pudieron cargar las ${entity} asociadas.`,
            loadingContent: false,
            show: true,
          }));
        }
      } else if (type === 'confirm') {
        const userIdToReset = payload.ID_USUARIO;
        const userNameToReset = payload.NOMBRE_USUARIO;
        setModalState((prev) => ({
          ...prev,
          type: 'confirm',
          entity: 'usuario',
          data: payload,
          title: 'Confirmar Reseteo de Contraseña',
          action: () => handleResetPassword(userIdToReset),
          data: `¿Está seguro de que desea resetear la contraseña del usuario "${userNameToReset}"?`,
          show: true,
        }));
      }
    },
    [
      selectedUsuarios,
      canCreate,
      canEdit,
      canDelete,
      handleDeleteConfirmed,
      handleResetPassword,
    ]
  );

  const onSave = useCallback(
    async (formData) => {
      setIsProcessingAction(true);
      try {
        const payload = { ...formData };
        let result;
        if (modalState.type === 'edit' && modalState.data?.ID_USUARIO) {
          await updateUsuario(modalState.data.ID_USUARIO, payload);
          result = { message: 'Usuario actualizado.' };
        } else {
          result = await createUsuario(payload);
        }
        closeCustomModal();
        fetchUsuarios();
        setModalState((prev) => ({
          ...prev,
          type: 'alert',
          title: 'Operación Exitosa',
          data: `Usuario ${modalState.data ? 'actualizado' : 'creado'} con éxito.${result?.password ? ' Nueva contraseña: ' + result.password : ''}`,
          show: true,
        }));
      } catch (err) {
        const errorMessage =
          err.response?.data?.message ||
          'Error desconocido al guardar usuario.';
        setModalState((prev) => ({
          ...prev,
          type: 'alert',
          title: 'Error',
          data: errorMessage,
          show: true,
        }));
      } finally {
        setIsProcessingAction(false);
      }
    },
    [modalState.type, modalState.data, fetchUsuarios, closeCustomModal]
  );

  const handleUploadProcessComplete = useCallback(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);
  const handleBulkUploadDataResult = useCallback((result) => {
    setBulkUploadResult(result);
  }, []);
  const handleToggleUsuarioSelection = useCallback((usuarioToToggle) => {
    setSelectedUsuarios((prev) => {
      const isSelected = prev.find(
        (u) => u.ID_USUARIO === usuarioToToggle.ID_USUARIO
      );
      if (isSelected) {
        return prev.filter((u) => u.ID_USUARIO !== usuarioToToggle.ID_USUARIO);
      }
      return [...prev, usuarioToToggle];
    });
  }, []);

  const filteredUsuarios = useMemo(() => {
    return usuarios.filter((usuario) => {
      const matchesRole =
        filters.role === '' ||
        String(usuario.ROL_ID_ROL) === String(filters.role);
      const matchesText =
        filters.text === '' ||
        (usuario.NOMBRE_USUARIO &&
          usuario.NOMBRE_USUARIO.toLowerCase().includes(
            filters.text.toLowerCase()
          )) ||
        (usuario.EMAIL_USUARIO &&
          usuario.EMAIL_USUARIO.toLowerCase().includes(
            filters.text.toLowerCase()
          ));
      return matchesRole && matchesText;
    });
  }, [usuarios, filters]);

  const handleToggleSelectAll = useCallback(() => {
    if (selectedUsuarios.length === filteredUsuarios.length) {
      setSelectedUsuarios([]);
    } else {
      setSelectedUsuarios([...filteredUsuarios]);
    }
  }, [selectedUsuarios.length, filteredUsuarios]);

  const handleFilterChange = useCallback((changedFilters) => {
    setFilters((prev) => ({ ...prev, ...changedFilters }));
    setCurrentPage(1);
  }, []);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsuarios = filteredUsuarios.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // --- RENDERIZADO CONDICIONAL DE CONTENIDO DE MODAL ---
  const renderModalContent = () => {
    if (!modalState.type) return null;

    switch (modalState.type) {
      case 'add':
      case 'edit':
        return (
          <UsuarioForm
            initial={modalState.data}
            onClose={closeCustomModal}
            onSave={onSave}
            roles={roles}
            isProcessing={isProcessingAction} // Pasar isProcessingAction al formulario
          />
        );
      case 'delete':
        if (!modalState.data || modalState.data.length === 0)
          return <p>No hay usuarios seleccionados.</p>;
        const itemsToDelete = modalState.data;
        const itemName = itemsToDelete.length > 1 ? 'usuarios' : 'usuario';
        const icon = 'bi bi-person-x-fill';
        const itemsToList = itemsToDelete.map((item) => ({
          key: item.ID_USUARIO,
          name: item.NOMBRE_USUARIO,
        }));
        const consequences = (
          <ul>
            <li>
              El acceso al sistema para este/os usuario/s será revocado
              permanentemente.
            </li>
            <li>
              Todas sus asignaciones a <strong>Carreras</strong> y{' '}
              <strong>Secciones</strong> serán eliminadas.
            </li>
          </ul>
        );
        return (
          <div>
            <p>
              ¿Está seguro de que desea eliminar {itemsToDelete.length}{' '}
              {itemName}?
            </p>
            <ul className="list-unstyled my-3 p-3 border bg-light rounded">
              {itemsToList.map((item) => (
                <li key={item.key}>
                  <i className={`${icon} me-2`}></i>
                  {item.name || `Usuario sin nombre`}
                </li>
              ))}
            </ul>
            <Alert variant="danger" className="mt-3">
              <Alert.Heading>
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                ¡Atención! Esta acción es irreversible.
              </Alert.Heading>
              <p className="mb-0">
                Al eliminar, también se borrarán los siguientes datos asociados:
              </p>
              <hr />
              {consequences}
            </Alert>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeCustomModal}
                disabled={isProcessingAction}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={modalState.action}
                disabled={isProcessingAction}
              >
                {isProcessingAction ? (
                  <Spinner as="span" size="sm" animation="border" />
                ) : (
                  'Sí, entiendo, eliminar'
                )}
              </button>
            </div>
          </div>
        );
      case 'showAssociations':
        const { entity, content, loadingContent } = modalState;
        return (
          <div>
            {loadingContent ? (
              <div className="text-center">
                <Spinner animation="border" />
              </div>
            ) : content && content.length > 0 ? (
              <ul className="list-unstyled">
                {entity === 'carreras' &&
                  content.map((item) => (
                    <li key={item.ID_CARRERA || item.CARRERA_ID_CARRERA}>
                      {item.NOMBRE_CARRERA}
                    </li>
                  ))}
                {entity === 'secciones' &&
                  content.map((item) => (
                    <li key={item.ID_SECCION || item.SECCION_ID_SECCION}>
                      {item.NOMBRE_SECCION}
                      {item.CODIGO_SECCION ? ` (${item.CODIGO_SECCION})` : ''}
                    </li>
                  ))}
              </ul>
            ) : (
              <p>No hay {entity} asociadas a este usuario.</p>
            )}
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={closeCustomModal}
                disabled={isProcessingAction}
              >
                Cerrar
              </button>
            </div>
          </div>
        );
      case 'alert':
        return (
          <div>
            <p>{modalState.data}</p>
            <div className="modal-footer">
              <button
                className="btn btn-primary"
                onClick={closeCustomModal}
                disabled={isProcessingAction}
              >
                Aceptar
              </button>
            </div>
          </div>
        );
      case 'confirm':
        return (
          <div>
            <p>{modalState.data}</p>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={closeCustomModal}
                disabled={isProcessingAction}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={modalState.action}
                disabled={isProcessingAction}
              >
                {isProcessingAction ? (
                  <Spinner as="span" size="sm" animation="border" />
                ) : (
                  'Sí, Confirmar'
                )}
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };
  // --- FIN RENDERIZADO CONDICIONAL DE CONTENIDO DE MODAL ---

  return (
    <Layout>
      <div className="container-fluid pt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="display-6">
            <i className="bi bi-people-fill me-3"></i>Gestión de Usuarios
          </h2>
        </div>
        <hr />

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

        <Nav
          variant="tabs"
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
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

        {activeTab === 'gestionUsuarios' && (
          <>
            <UsuarioFilter
              roles={roles}
              onFilterChange={handleFilterChange}
              currentFilters={filters}
            />
            <UsuarioActions
              onAdd={() => openCustomModal('add', 'usuario')}
              onEdit={() => openCustomModal('edit', 'usuario')}
              onDelete={() => openCustomModal('delete', 'usuario')}
              selectedUsuarios={selectedUsuarios}
              isLoadingList={loading && activeTab === 'gestionUsuarios'}
              isProcessingAction={isProcessingAction}
              onBulkUploadComplete={handleUploadProcessComplete}
              onUploadResult={handleBulkUploadDataResult}
            />
            {loading && activeTab === 'gestionUsuarios' ? (
              <p className="text-center">Cargando usuarios…</p>
            ) : (
              <UsuarioTable
                usuarios={currentUsuarios}
                selectedUsuarios={selectedUsuarios}
                onToggleUsuarioSelection={handleToggleUsuarioSelection}
                onToggleSelectAll={handleToggleSelectAll}
                onEdit={(u) => openCustomModal('edit', 'usuario', u)}
                handleResetPassword={(u) =>
                  openCustomModal('confirm', 'usuario', u)
                }
                onShowUserCarreras={(user) =>
                  openCustomModal('showAssociations', 'carreras', user)
                }
                onShowUserSecciones={(user) =>
                  openCustomModal('showAssociations', 'secciones', user)
                }
              />
            )}
            {!loading &&
              activeTab === 'gestionUsuarios' &&
              filteredUsuarios.length > itemsPerPage && (
                <PaginationComponent
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredUsuarios.length}
                  paginate={paginate}
                  currentPage={currentPage}
                />
              )}
          </>
        )}

        {activeTab === 'usuariosCarreras' && (
          <UsuarioCarreraTab allUsers={usuarios} allRoles={roles} />
        )}
        {activeTab === 'usuariosSecciones' && (
          <UsuarioSeccionTab allUsers={usuarios} allRoles={roles} />
        )}

        {modalState.show && (
          <Modal
            title={modalState.title}
            onClose={closeCustomModal}
            processing={isProcessingAction}
          >
            {renderModalContent()}
          </Modal>
        )}
      </div>
    </Layout>
  );
}
