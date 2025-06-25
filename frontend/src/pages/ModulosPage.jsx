// src/pages/ModulosPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react'; // Añadido useMemo
import Layout from '../components/Layout'; // Ajusta la ruta
import ModuloTable from '../components/modulos/ModuloTable';
import ModuloForm from '../components/modulos/ModuloForm';
import ModuloActions from '../components/modulos/moduloActions';
import ModuloFilter from '../components/modulos/ModuloFilter'; // <-- IMPORTAR ModuloFilter
import PaginationComponent from '../components/PaginationComponent';
import {
  fetchAllModulos, // Asume que existe en tu moduloService y usa tu 'api' de Axios
  createModulo as AddModuloService, // Renombrado para claridad, usa el servicio
  updateModulo as EditModuloService, // Renombrado para claridad, usa el servicio
  deleteModulo as DeleteModuloService, // Renombrado para claridad, usa el servicio
} from '../services/moduloService'; // Ajusta la ruta
import { fetchAllEstados } from '../services/estadoService'; // Para el selector de estado en el formulario
import {
  Alert,
  Spinner,
  Modal as BootstrapModal,
  Button as BsButton,
} from 'react-bootstrap'; // Usando Modal y Button de react-bootstrap

// El Modal genérico que ya tienes, asegúrate que reciba 'show'
function Modal({ title, children, onClose, show }) {
  if (!show) return null;
  return (
    <div
      className="modal show"
      tabIndex="-1"
      style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function ModulosPage() {
  const [modulos, setModulos] = useState([]);
  const [estados, setEstados] = useState([]); // Para el selector de estado en ModuloForm
  const [selectedModulos, setSelectedModulos] = useState([]); // Para la selección múltiple

  const [loading, setLoading] = useState(true); // Para la carga inicial de la lista
  const [isProcessing, setIsProcessing] = useState(false); // Para acciones CRUD en el modal
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [modal, setModal] = useState({ type: null, data: null, show: false }); // show para controlar visibilidad
  // const [activeTab, setActiveTab] = useState('modulos'); // Si solo tienes módulos, no necesitas tabs

  const [itemsPerPage] = useState(6); // Ajustado a 6 para consistencia con otras páginas
  const [currentPageModulos, setCurrentPageModulos] = useState(1);

  // Estado para los filtros de Módulo
  const [moduloFilters, setModuloFilters] = useState({
    nombre: '',
    horaInicio: '',
    horaFin: '',
    estado: '',
  });

  const estadosModuloOptions = useMemo(
    () => [
      // Usar los valores string directamente si así se almacenan en la BD para el módulo
      { ID_ESTADO: 1, NOMBRE_ESTADO: 'ACTIVO' },
      { ID_ESTADO: 7, NOMBRE_ESTADO: 'INACTIVO' },
    ],
    []
  );

  const displayMessage = (setter, message, duration = 4000) => {
    setter(message);
    setTimeout(() => setter(''), duration);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Usar las funciones de servicio que llaman a tu instancia 'api' de Axios
      const [modulosData, estadosData] = await Promise.all([
        fetchAllModulos(),
        fetchAllEstados(), // Para poblar el selector de estado en ModuloForm
      ]);

      setModulos(modulosData || []); // fetchAllModulos ya debería devolver [] en error
      setEstados(estadosData || []);

      setCurrentPageModulos(1);
    } catch (err) {
      // console.error('Error al cargar datos para Módulos:', err);
      setError(
        'Error al cargar datos: ' + (err.message || 'Intente más tarde')
      );
      setModulos([]);
      setEstados([]);
    } finally {
      setLoading(false);
      setSelectedModulos([]); // Limpiar selección al recargar datos
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleModuloSelection = (moduloToToggle) => {
    setSelectedModulos((prevSelected) =>
      prevSelected.find((m) => m.ID_MODULO === moduloToToggle.ID_MODULO)
        ? prevSelected.filter((m) => m.ID_MODULO !== moduloToToggle.ID_MODULO)
        : [...prevSelected, moduloToToggle]
    );
  };

  const handleToggleSelectAllModulos = () => {
    // Selecciona/deselecciona todos los módulos en la página actual (currentModulos)
    const currentModuloIdsOnPage = currentModulos.map((m) => m.ID_MODULO);
    const allOnPageSelected =
      currentModulos.length > 0 &&
      currentModulos.every((m) =>
        selectedModulos.some((sm) => sm.ID_MODULO === m.ID_MODULO)
      );

    if (allOnPageSelected) {
      // Deseleccionar todos los de la página actual
      setSelectedModulos((prev) =>
        prev.filter((sm) => !currentModuloIdsOnPage.includes(sm.ID_MODULO))
      );
    } else {
      // Seleccionar todos los de la página actual que no estén ya seleccionados
      const newSelectionsFromPage = currentModulos.filter(
        (m) => !selectedModulos.some((sm) => sm.ID_MODULO === m.ID_MODULO)
      );
      setSelectedModulos((prev) => [...prev, ...newSelectionsFromPage]);
    }
  };

  const openModalHandler = (type, entityName, entityPayload = null) => {
    let modalData = null;
    if (type === 'add') {
      setSelectedModulos([]); // Limpiar selección para 'add'
      setModal({ type, entity: entityName, data: null, show: true });
    } else if (type === 'edit' && entityPayload) {
      // entityPayload es el ID_MODULO para editar
      modalData = modulos.find(
        (m) => String(m.ID_MODULO) === String(entityPayload)
      );
      if (!modalData) {
        displayMessage(setError, 'Módulo no encontrado para editar.');
        return;
      }
      setModal({ type, entity: entityName, data: modalData, show: true });
    } else if (
      type === 'delete' &&
      Array.isArray(entityPayload) &&
      entityPayload.length > 0
    ) {
      // entityPayload es el array de modulos seleccionados
      setModal({
        type,
        entity: entityName,
        data: [...entityPayload],
        show: true,
      });
    } else {
      // console.warn("openModalHandler llamado con parámetros inválidos o sin selección:", type, entityPayload);
      // No mostrar modal si no hay nada que hacer (ej. delete sin selección)
    }
  };

  const closeModalHandler = () =>
    setModal({ type: null, entity: null, data: null, show: false });

  const handleFormSubmit = async (formDataFromForm) => {
    setIsProcessing(true);
    setError('');
    setSuccess('');
    try {
      let message = '';
      if (modal.type === 'add') {
        await AddModuloService(formDataFromForm); // Usa la función de servicio
        message = 'Módulo creado con éxito.';
      } else if (modal.type === 'edit' && modal.data) {
        await EditModuloService(modal.data.ID_MODULO, formDataFromForm); // Usa la función de servicio
        message = 'Módulo actualizado con éxito.';
      }
      displayMessage(setSuccess, message);
      loadData();
      closeModalHandler();
    } catch (err) {
      displayMessage(
        setError,
        'Error al guardar módulo: ' + (err.response?.data?.error || err.message)
      );
      console.error('Error guardando módulo:', err);
    } finally {
      // console.error('Error guardando módulo:', err);
      setIsProcessing(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!modal.data || !Array.isArray(modal.data) || modal.data.length === 0) {
      // console.error("handleDeleteConfirm: modal.data no es un array válido o está vacío", modal.data);
      closeModalHandler();
      return;
    }

    setIsProcessing(true);
    setError('');
    setSuccess('');
    let successCount = 0;
    let errorCount = 0;
    const errorMessages = [];

    for (const moduloToDelete of modal.data) {
      try {
        await DeleteModuloService(moduloToDelete.ID_MODULO);
        successCount++;
      } catch (err) {
        errorCount++;
        const specificError =
          err.response?.data?.error ||
          err.message ||
          `Error eliminando ${moduloToDelete.NOMBRE_MODULO || moduloToDelete.ID_MODULO}`;
        errorMessages.push(specificError);
        console.error(
          `Error eliminando módulo ${moduloToDelete.ID_MODULO}:`,
          err
        );
      }
    }

    if (successCount > 0) {
      displayMessage(
        setSuccess,
        `${successCount} módulo(s) eliminado(s) con éxito.`
      );
    }
    if (errorCount > 0) {
      displayMessage(
        setError,
        `Error al eliminar ${errorCount} módulo(s): ${errorMessages.join('; ')}`
      );
    }

    if (successCount > 0) {
      // Solo recargar y limpiar selección si hubo éxito
      await loadData(); // loadData ya limpia selectedModulos
    }
    closeModalHandler();
    // setSelectedModulos([]); // loadData lo hace, pero por si acaso no se llama loadData
    setIsProcessing(false);
  };

  // Handler para el cambio de filtro de módulos
  const handleModuloFilterChange = useCallback((changedFilters) => {
    setModuloFilters((prevFilters) => ({
      ...prevFilters,
      ...changedFilters,
    }));
    setCurrentPageModulos(1); // Resetear a la primera página al cambiar filtros
    setSelectedModulos([]); // Limpiar selección al cambiar filtros
  }, []);

  // Aplicar el filtro a la lista de módulos
  const filteredModulos = useMemo(() => {
    return modulos.filter((modulo) => {
      // --- INICIO CONSOLE LOGS PARA DEBUG HORARIO ---
      // console.log(
      //   `--- Filtrando Módulo ID: ${modulo.ID_MODULO} --- INICIO_MODULO: '${modulo.INICIO_MODULO}', FIN_MODULO: '${modulo.FIN_MODULO}'`
      // );
      // console.log(
      //   `Filtros aplicados: HoraInicio='${moduloFilters.horaInicio}', HoraFin='${moduloFilters.horaFin}'`
      // );
      const matchesNombre =
        !moduloFilters.nombre ||
        (modulo.NOMBRE_MODULO &&
          modulo.NOMBRE_MODULO.toLowerCase().includes(
            moduloFilters.nombre.toLowerCase()
          ));

      let calculatedMatchesHoraInicio;
      if (!moduloFilters.horaInicio) {
        calculatedMatchesHoraInicio = true;
      } else {
        calculatedMatchesHoraInicio = modulo.INICIO_MODULO // <-- CAMBIO AQUÍ
          ? modulo.INICIO_MODULO >= moduloFilters.horaInicio
          : false;
      }
      const matchesHoraInicio = calculatedMatchesHoraInicio;
      // console.log(
      //   `Comparando HORA_INICIO: Modulo='${modulo.INICIO_MODULO}' >= Filtro='${moduloFilters.horaInicio}'. Coincide: ${matchesHoraInicio}`
      // );

      let calculatedMatchesHoraFin;
      if (!moduloFilters.horaFin) {
        calculatedMatchesHoraFin = true;
      } else {
        calculatedMatchesHoraFin = modulo.FIN_MODULO // <-- CAMBIO AQUÍ
          ? modulo.FIN_MODULO <= moduloFilters.horaFin
          : false;
      }
      const matchesHoraFin = calculatedMatchesHoraFin;
      // console.log(
      //   `Comparando HORA_FIN: Modulo='${modulo.FIN_MODULO}' <= Filtro='${moduloFilters.horaFin}'. Coincide: ${matchesHoraFin}`
      // );

      const matchesEstado =
        !moduloFilters.estado ||
        String(modulo.ESTADO_ID_ESTADO) === String(moduloFilters.estado);

      // console.log('--- Fin Filtro Módulo ---');

      return (
        matchesNombre && matchesHoraInicio && matchesHoraFin && matchesEstado
      );
    });
  }, [modulos, moduloFilters]);

  const paginateModulos = (pageNumber) => setCurrentPageModulos(pageNumber);

  const currentModulos = useMemo(() => {
    const indexOfLastItem = currentPageModulos * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredModulos.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredModulos, currentPageModulos, itemsPerPage]);

  if (loading && modulos.length === 0) {
    return (
      <Layout>
        <div className="container-fluid mt-4 text-center">
          <Spinner animation="border" variant="primary" />
          <p>Cargando módulos...</p>
        </div>
      </Layout>
    );
  }

  const handleAddAction = () => {
    openModalHandler('add', 'modulo');
  };

  const handleEditAction = () => {
    if (selectedModulos.length === 1) {
      openModalHandler('edit', 'modulo', selectedModulos[0].ID_MODULO);
    } else {
      displayMessage(
        setError,
        'Por favor, seleccione un único módulo para editar.'
      );
    }
  };

  const handleDeleteAction = () => {
    if (selectedModulos.length > 0) {
      openModalHandler('delete', 'modulo', selectedModulos); // Pasa el array de módulos seleccionados
    } else {
      displayMessage(
        setError,
        'Por favor, seleccione al menos un módulo para eliminar.'
      );
    }
  };

  return (
    <Layout>
      <div className="container-fluid pt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="display-6">
            <i className="bi bi-grid-1x2-fill me-3"></i>
            Gestión de Módulos
          </h2>
        </div>
        <hr />
        {error && (
          <Alert variant="danger" onClose={() => setError('')} dismissible>
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" onClose={() => setSuccess('')} dismissible>
            {success}
          </Alert>
        )}

        <ModuloFilter
          estados={estadosModuloOptions} // Pasar las opciones fijas
          onFilterChange={handleModuloFilterChange}
          currentFilters={moduloFilters}
        />

        <div className="mb-3">
          {/* Contenedor para acciones */}
          <ModuloActions
            onAdd={handleAddAction}
            onEdit={handleEditAction}
            onDelete={handleDeleteAction}
            selectedModulos={selectedModulos} // Pasar el array de módulos seleccionados
            disabled={isProcessing || loading} //isLoading es loading de la tabla, isProcessing es para acciones
          />
        </div>

        <ModuloTable
          modulos={currentModulos}
          selectedModulos={selectedModulos}
          onToggleModuloSelection={handleToggleModuloSelection}
          onToggleSelectAllModulos={handleToggleSelectAllModulos}
          loading={loading}
          // Pasa filteredModulos.length si el checkbox de cabecera debe reflejar "todos los filtrados"
        />
        {!loading && filteredModulos.length > itemsPerPage && (
          <PaginationComponent
            itemsPerPage={itemsPerPage}
            totalItems={filteredModulos.length}
            paginate={paginateModulos}
            currentPage={currentPageModulos}
          />
        )}
      </div>

      {/* Modal para Crear/Editar/Eliminar Módulo */}
      <Modal
        title={
          modal.type === 'add'
            ? 'Agregar Módulo'
            : modal.type === 'edit'
              ? 'Editar Módulo'
              : 'Eliminar Módulo'
        }
        show={modal.show && modal.entity === 'modulo'} // Controla la visibilidad del modal
        onClose={closeModalHandler}
      >
        {modal.type === 'delete' ? (
          <div>
            {modal.data && modal.data.length === 1 ? (
              <p>
                ¿Está seguro de que desea eliminar el módulo "
                <strong>
                  {modal.data[0]?.NOMBRE_MODULO || 'seleccionado'}
                </strong>
                "?
              </p>
            ) : (
              <p>
                ¿Está seguro de que desea eliminar los
                <strong>{modal.data?.length}</strong> módulos seleccionados?
              </p>
            )}
            <div className="modal-footer">
              <BsButton
                variant="secondary"
                onClick={closeModalHandler}
                disabled={isProcessing}
              >
                Cancelar
              </BsButton>
              <BsButton
                variant="danger"
                onClick={handleDeleteConfirm}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Spinner as="span" size="sm" animation="border" />
                ) : (
                  'Eliminar'
                )}
              </BsButton>
            </div>
          </div>
        ) : (
          // Para 'add' o 'edit'
          <ModuloForm
            initial={modal.data} // Prop se llama 'initial' en ModuloForm
            onSubmit={handleFormSubmit}
            onCancel={closeModalHandler}
            isProcessing={isProcessing}
            // estados={estados} // ModuloForm obtiene sus propios estados
          />
        )}
      </Modal>
    </Layout>
  );
}
