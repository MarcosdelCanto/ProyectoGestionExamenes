import React, { useEffect, useState, useCallback } from 'react';
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
import { Alert } from 'react-bootstrap'; // Asegúrate de importar Alert

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

  const fetchUsuarios = async () => {
    setLoading(true);
    const data = await listUsuarios();
    setUsuarios(data);
    setLoading(false);
    setCurrentPage(1);
  };

  const loadRoles = async () => {
    try {
      const rolesData = await fetchAllRoles();
      console.log('Respuesta de fetchAllRoles en UsuariosPage:', rolesData); // LOG 1: ¿Qué devuelve el servicio?
      if (rolesData && rolesData.length > 0) {
        setRoles(rolesData);
        console.log('Estado de roles actualizado en UsuariosPage:', rolesData); // LOG 2: ¿Se actualiza el estado?
      } else {
        console.warn(
          'No se encontraron roles o la respuesta está vacía en UsuariosPage.'
        );
        setRoles([]);
      }
    } catch (error) {
      console.error('Error crítico cargando roles en UsuariosPage:', error);
      setRoles([]);
    }
  };

  useEffect(() => {
    loadRoles(); // Asegúrate que esto se llama
    fetchUsuarios();
  }, []); // Dependencias vacías para que se ejecute al montar

  useEffect(() => {
    // Timer para limpiar el resultado de la carga masiva después de un tiempo
    let timer;
    if (bulkUploadResult) {
      timer = setTimeout(() => setBulkUploadResult(null), 7000); // Limpiar después de 7 segundos
    }
    return () => clearTimeout(timer);
  }, [bulkUploadResult]);

  const onSave = async ({ nombre, email, rolId, password }) => {
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
      fetchUsuarios(); // Usar el nombre de función actualizado
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
  };

  const handleResetPassword = async (id) => {
    const { password } = await resetPassword(id);
    setMsgModal({
      title: 'Contraseña reseteada',
      body: `La nueva contraseña es: ${password}`,
    });
  };

  const onDelete = async (id) => {
    if (window.confirm('¿Eliminar este usuario?')) {
      await deleteUsuario(id);
      // Si el usuario eliminado estaba en la selección múltiple, quitarlo
      setSelectedUsuarios((prev) => prev.filter((u) => u.ID_USUARIO !== id));
      fetchUsuarios(); // Usar el nombre de función actualizado
      // No mostramos modal aquí, ya que esta función es para borrado individual (ej. desde otra tabla)
    }
  };

  // Esta función se llamará cuando el proceso de carga masiva termine (éxito o fracaso del proceso en sí)
  // y es útil para refrescar la lista de usuarios.
  const handleUploadProcessComplete = () => {
    console.log('Proceso de carga masiva completado, refrescando usuarios...');
    fetchUsuarios(); // Refrescar la lista de usuarios
  };

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
  const handleToggleUsuarioSelection = (usuarioToToggle) => {
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
  };

  const handleToggleSelectAll = () => {
    if (selectedUsuarios.length === usuarios.length) {
      setSelectedUsuarios([]);
    } else {
      setSelectedUsuarios([...usuarios]);
    }
  };

  // Handlers para UsuarioActions
  const handleAddUsuario = () => {
    setEditing(null);
    setSelectedUsuarios([]);
    setShowForm(true);
  };

  const handleEditUsuario = () => {
    if (selectedUsuarios.length === 1) {
      setEditing(selectedUsuarios[0]);
      setShowForm(true);
    }
  };

  const handleDeleteSelectedUsuarios = async () => {
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
  };

  // Handler para el cambio de filtro
  const handleFilterChange = (changedFilters) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      // Al cambiar filtros, volver a la primera página
      ...changedFilters, // Sobrescribe solo las propiedades que cambiaron
    }));
    setCurrentPage(1);
  };

  // Aplicar el filtro
  const filteredUsuarios = usuarios.filter((usuario) => {
    // --- Inicio: Bloque de depuración ---

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

  // Lógica de Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsuarios = filteredUsuarios.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  // Cambiar de página
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  console.log('Estado de roles ANTES de renderizar UsuarioFilter:', roles); // LOG 3: ¿Qué valor tiene el estado roles aquí?

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
                Resumen de la carga: Nuevos:{' '}
                {bulkUploadResult.inserted !== undefined
                  ? bulkUploadResult.inserted
                  : 'N/A'}{' '}
                | Actualizados:{' '}
                {bulkUploadResult.updated !== undefined
                  ? bulkUploadResult.updated
                  : 'N/A'}{' '}
                | Ignorados:{' '}
                {bulkUploadResult.ignored !== undefined
                  ? bulkUploadResult.ignored
                  : 'N/A'}
                {bulkUploadResult.associations_created !== undefined && (
                  <>
                    {' | '}Asociaciones Creadas:{' '}
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

        {/* Acciones en su propia sección */}
        <div className="usuario-actions-wrapper mb-3">
          <UsuarioActions
            onAdd={handleAddUsuario}
            onEdit={handleEditUsuario}
            onDelete={handleDeleteSelectedUsuarios}
            selectedUsuarios={selectedUsuarios}
            isLoadingList={loading}
            isProcessingAction={isProcessingAction}
            onBulkUploadComplete={handleUploadProcessComplete} // Para refrescar la lista
            onUploadResult={handleBulkUploadDataResult} // Para obtener los datos del resumen y mostrar la alerta
          />
        </div>

        {/* Filtro en su propia sección, ocupando todo el ancho */}
        <div className="usuario-filter-wrapper">
          {' '}
          {/* Este wrapper ahora puede ser width: 100% */}
          <UsuarioFilter
            roles={roles} // Así se pasan los roles
            onFilterChange={handleFilterChange}
            currentFilters={filters}
          />
        </div>

        {loading ? (
          <p>Cargando…</p>
        ) : (
          // Aplicar clase a la tabla si es necesario (Bootstrap ya lo hace bien)
          <UsuarioTable
            usuarios={currentUsuarios} // Pasar solo los usuarios de la página actual
            selectedUsuarios={selectedUsuarios}
            onToggleUsuarioSelection={handleToggleUsuarioSelection}
            onToggleSelectAll={handleToggleSelectAll}
            onEdit={(u) => {
              setEditing(u);
              setSelectedUsuarios([u]); // Al editar desde una tabla con botones de fila, seleccionamos solo ese
              setShowForm(true);
            }}
            onDelete={onDelete}
            handleResetPassword={handleResetPassword}
            className="usuario-table" // Opcional, si necesitas más especificidad
          />
        )}
        {!loading && filteredUsuarios.length > itemsPerPage && (
          // Aplicar clase al contenedor de paginación
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
              // No es necesario limpiar selectedUsuario aquí, ya que la selección es independiente del formulario
            }}
            onSave={onSave}
          />
        )}
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
                />{' '}
                {/* CORREGIDO: Botón auto-cerrado */}
              </div>{' '}
              {/* CORREGIDO: div del header cierra después del botón */}
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
