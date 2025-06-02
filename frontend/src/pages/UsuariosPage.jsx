import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Layout from '../components/Layout';
import {
  listUsuarios,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  resetPassword,
} from '../services/usuarioService';
import { fetchAllRoles } from '../services/rolService'; // Importar servicio de roles
import './UsuariosPage.css'; // Ajusta la ruta si guardaste el CSS en otro lugar

import UsuarioTable from '../components/usuarios/UsuarioTable';
import UsuarioForm from '../components/usuarios/UsuarioForm';
import UsuarioActions from '../components/usuarios/UsuarioActions';
import UsuarioFilter from '../components/usuarios/UsuarioFilter'; // Importarías tu nuevo componente
import PaginationComponent from '../components/PaginationComponent'; // Nuevo componente de paginación
import {
  Alert,
  Nav,
  Modal,
  Button as BsButton,
  Spinner,
} from 'react-bootstrap'; // Asegúrate de importar Alert y Nav
import UsuarioCarreraTab from '../components/usuarios/UsuarioCarreraTab'; // Nueva pestaña
import UsuarioSeccionTab from '../components/usuarios/UsuarioSeccionTab'; // Nueva pestaña

import { listCarrerasByUsuario } from '../services/usuarioCarreraService'; // Para el nuevo modal
import { listSeccionesByUsuario } from '../services/usuarioSeccionService'; // Para el nuevo modal

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedUsuarios, setSelectedUsuarios] = useState([]); // Array de usuarios seleccionados
  const [isProcessingAction, setIsProcessingAction] = useState(false); // Nuevo estado para acciones en curso
  const [filters, setFilters] = useState({ text: '', role: '' }); // Estado unificado para filtros
  const [roles, setRoles] = useState([]); // Estado para almacenar los roles
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Puedes hacerlo configurable
  const [msgModal, setMsgModal] = useState(null);
  const [bulkUploadResult, setBulkUploadResult] = useState(null);
  const [activeTab, setActiveTab] = useState('gestionUsuarios'); // Estado para la pestaña activa

  // Estados para el modal de asociaciones de usuario
  const [showAssociationsModal, setShowAssociationsModal] = useState(false);
  const [selectedUserForModal, setSelectedUserForModal] = useState(null);
  const [modalContentType, setModalContentType] = useState(''); // 'carreras' o 'secciones'
  const [modalContent, setModalContent] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listUsuarios();
      setUsuarios(data || []); // Asegurar que data es un array
      setCurrentPage(1); // Resetear página en nueva carga
    } catch (error) {
      console.error('Error fetching usuarios:', error);
      setUsuarios([]); // Establecer a vacío en caso de error
      // Opcionalmente, establecer un estado de error para mostrar al usuario
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRoles = useCallback(async () => {
    try {
      const rolesData = await fetchAllRoles();
      if (rolesData && rolesData.length > 0) {
        setRoles(rolesData);
      } else {
        setRoles([]);
      }
    } catch (error) {
      console.error('Error crítico cargando roles en UsuariosPage:', error);
      setRoles([]);
    }
  }, []);

  useEffect(() => {
    loadRoles(); // Asegúrate que esto se llama
    fetchUsuarios();
  }, [fetchUsuarios, loadRoles]); // Dependencias actualizadas

  useEffect(() => {
    // Timer para limpiar el resultado de la carga masiva después de un tiempo
    let timer;
    if (bulkUploadResult) {
      timer = setTimeout(() => setBulkUploadResult(null), 7000); // Limpiar después de 7 segundos
    }
    return () => clearTimeout(timer);
  }, [bulkUploadResult]);

  const onSave = useCallback(
    async ({ nombre, email, rolId, password }) => {
      const payload = {
        nombre_usuario: nombre,
        email_usuario: email,
        rol_id_rol: rolId,
        password_usuario: password,
      };
      try {
        setIsProcessingAction(true);
        let result;
        if (editing) {
          result = await updateUsuario(editing.ID_USUARIO, payload);
        } else {
          result = await createUsuario(payload);
        }
        setShowForm(false);
        setEditing(null);
        setSelectedUsuarios([]); // Limpiar selección después de guardar
        fetchUsuarios();
        setMsgModal({
          title: 'Usuario guardado',
          body: editing
            ? `El usuario ha sido actualizado. Nueva contraseña: ${password}`
            : `Usuario creado con contraseña: ${result.password}`,
        });
      } catch (err) {
        if (err.response?.status === 409) {
          alert(err.response.data.message);
        } else {
          console.error('Error guardando usuario:', err);
          alert('Error guardando usuario');
        }
      } finally {
        setIsProcessingAction(false);
      }
    },
    [editing, fetchUsuarios]
  );

  const handleResetPassword = useCallback(async (id) => {
    const { password } = await resetPassword(id);
    setMsgModal({
      title: 'Contraseña reseteada',
      body: `La nueva contraseña es: ${password}`,
    });
  }, []);

  const onDelete = useCallback(
    async (id) => {
      if (window.confirm('¿Eliminar este usuario?')) {
        await deleteUsuario(id);
        // Si el usuario eliminado estaba en la selección múltiple, quitarlo
        setSelectedUsuarios((prev) => prev.filter((u) => u.ID_USUARIO !== id));
        fetchUsuarios();
        // No mostramos modal aquí, ya que esta función es para borrado individual (ej. desde otra tabla)
      }
    },
    [fetchUsuarios]
  );

  // Esta función se llamará cuando el proceso de carga masiva termine (éxito o fracaso del proceso en sí)
  // y es útil para refrescar la lista de usuarios.
  const handleUploadProcessComplete = useCallback(() => {
    console.log('Proceso de carga masiva completado, refrescando usuarios...');
    fetchUsuarios(); // Refrescar la lista de usuarios
  }, [fetchUsuarios]);

  // Esta función se llamará con los DATOS del resultado de la carga (el resumen)
  const handleBulkUploadDataResult = (result) => {
    console.log(
      'Datos del resultado de carga masiva recibidos en UsuariosPage:',
      result
    );
    if (result && result.type === 'summary' && result.data) {
      setBulkUploadResult(result.data); // result.data es el objeto con inserted, updated, etc.
    } else if (result && result.type === 'successMessage' && result.message) {
      // Para manejar un mensaje de éxito simple si no hay un resumen detallado
      setBulkUploadResult({ message: result.message });
    } else {
      // Si el resultado no es lo esperado o es para limpiar, se establece a null
      setBulkUploadResult(null);
    }
  };

  // Handlers para la selección en la tabla
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
  }, []);

  const handleToggleSelectAll = useCallback(() => {
    if (selectedUsuarios.length === usuarios.length) {
      setSelectedUsuarios([]);
    } else {
      setSelectedUsuarios([...usuarios]);
    }
  }, [selectedUsuarios.length, usuarios]);

  // Handlers para UsuarioActions
  const handleAddUsuario = useCallback(() => {
    setEditing(null);
    setSelectedUsuarios([]);
    setShowForm(true);
  }, []);

  const handleEditUsuario = useCallback(() => {
    if (selectedUsuarios.length === 1) {
      setEditing(selectedUsuarios[0]);
      setShowForm(true);
    }
  }, [selectedUsuarios]);

  const handleDeleteSelectedUsuarios = useCallback(async () => {
    if (selectedUsuarios.length === 0) return;

    const userCount = selectedUsuarios.length;
    setIsProcessingAction(true);
    try {
      // La confirmación ya se hizo, así que vamos directo a la eliminación
      await Promise.all(
        selectedUsuarios.map((usuario) => deleteUsuario(usuario.ID_USUARIO))
      );
      setMsgModal({
        title: 'Usuarios Eliminados',
        body: `${userCount} usuario(s) ha(n) sido eliminado(s) correctamente.`,
      });
      setSelectedUsuarios([]);
      fetchUsuarios();
    } catch (error) {
      console.error('Error eliminando usuarios:', error);
      setMsgModal({
        title: 'Error de Eliminación',
        body: 'Ocurrió un error al intentar eliminar los usuarios.',
      });
    } finally {
      // Esto se ejecutará siempre, después del try o del catch
      setIsProcessingAction(false);
    }
  }, [selectedUsuarios, fetchUsuarios]);

  // Handler para el cambio de filtro
  const handleFilterChange = useCallback((changedFilters) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      // Al cambiar filtros, volver a la primera página
      ...changedFilters, // Sobrescribe solo las propiedades que cambiaron
    }));
    setCurrentPage(1);
  }, []);

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
      // Podrías mostrar un error en el modal
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
      // Aquí faltaba la llave de apertura
      console.error('Error al cargar secciones del usuario:', error);
      setModalContent([]);
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

  // Aplicar el filtro
  const filteredUsuarios = useMemo(() => {
    return usuarios.filter((usuario) => {
      const matchesRole =
        filters.role === '' || // Si no hay rol seleccionado, este criterio se cumple para todos
        parseInt(String(usuario.ROL_ID_ROL), 10) === parseInt(filters.role, 10);

      const matchesText =
        filters.text === '' || // Si no hay texto, este criterio se cumple para todos
        (usuario.NOMBRE_USUARIO &&
          usuario.NOMBRE_USUARIO.toLowerCase().includes(
            filters.text.toLowerCase()
          )) ||
        (usuario.EMAIL_USUARIO &&
          usuario.EMAIL_USUARIO.toLowerCase().includes(
            filters.text.toLowerCase()
          ));
      return matchesRole && matchesText; // El usuario debe cumplir ambos criterios
    });
  }, [usuarios, filters]);

  // Lógica de Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsuarios = filteredUsuarios.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  // Cambiar de página
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <Layout>
      <div className="container-fluid usuarios-page-container">
        {/* Combinando Bootstrap con una clase personalizada */}
        <p className="display-5 page-title-custom mb-2">
          <i className="bi bi-person-lines-fill me-3"></i>
          Gestión de Usuarios
        </p>
        <hr></hr>

        {/* Aquí se mostrarían las alertas de carga masiva */}
        {bulkUploadResult && (
          <Alert
            variant={
              // Si tienes un campo 'errors' en tu bulkUploadResult, puedes usarlo para cambiar el variant
              // Por ejemplo: bulkUploadResult.errors && bulkUploadResult.errors.length > 0 ? 'warning' : 'info'
              // O simplemente 'info' o 'success' si solo manejas resúmenes exitosos aquí
              bulkUploadResult.message ? 'success' : 'info' // Ajusta según la estructura de bulkUploadResult
            }
            className="mb-3"
            onClose={() => setBulkUploadResult(null)}
            dismissible
          >
            {bulkUploadResult.message ? (
              <p>{bulkUploadResult.message}</p>
            ) : (
              <>
                Resumen de la carga: Nuevos:
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
                {/* Si tu backend devuelve un array de errores detallados en bulkUploadResult.errors */}
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
            {/* Acciones en su propia sección */}
            <div className="usuario-actions-wrapper mb-3">
              <UsuarioActions
                onAdd={handleAddUsuario}
                onEdit={handleEditUsuario}
                onDelete={handleDeleteSelectedUsuarios}
                selectedUsuarios={selectedUsuarios}
                isLoadingList={loading && activeTab === 'gestionUsuarios'} // Solo loading de usuarios si esta pestaña está activa
                isProcessingAction={isProcessingAction}
                onBulkUploadComplete={handleUploadProcessComplete} // Para refrescar la lista
                onUploadResult={handleBulkUploadDataResult} // Para obtener los datos del resumen y mostrar la alerta
              />
            </div>

            {/* Filtro en su propia sección, ocupando todo el ancho */}
            <div className="usuario-filter-wrapper">
              <UsuarioFilter
                roles={roles} // Así se pasan los roles
                onFilterChange={handleFilterChange}
                currentFilters={filters}
              />
            </div>

            {loading && activeTab === 'gestionUsuarios' ? ( // Solo loading de usuarios si esta pestaña está activa
              <p>Cargando usuarios…</p>
            ) : (
              <UsuarioTable
                usuarios={currentUsuarios} // Pasar solo los usuarios de la página actual
                selectedUsuarios={selectedUsuarios}
                onToggleUsuarioSelection={handleToggleUsuarioSelection}
                onToggleSelectAll={handleToggleSelectAll}
                onEdit={(u) => {
                  setEditing(u);
                  setSelectedUsuarios([u]);
                  setShowForm(true);
                }}
                onDelete={onDelete}
                handleResetPassword={handleResetPassword}
                onShowUserCarreras={handleShowUserCarreras} // Pasar la nueva función
                onShowUserSecciones={handleShowUserSecciones} // Pasar la nueva función
                className="usuario-table"
              />
            )}
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
            {showForm && (
              <UsuarioForm
                initial={editing}
                onClose={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
                onSave={onSave}
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

        {/* Modal para mostrar asociaciones de un usuario */}
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
                No hay
                {modalContentType === 'carreras' ? 'carreras' : 'secciones'}
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

      {msgModal && (
        <div
          className="modal fade show custom-msg-modal" // Añade tu clase custom
          tabIndex="-1"
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} // Puedes quitar los estilos inline
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{msgModal.title}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setMsgModal(null)}
                  aria-label="Close" // Es buena práctica añadir aria-label para accesibilidad
                />
              </div>
              <div className="modal-body">
                <p>{msgModal.body}</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button" // Es buena práctica especificar el type para botones
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
