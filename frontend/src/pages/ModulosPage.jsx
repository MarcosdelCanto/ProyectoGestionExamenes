// src/pages/ModulosPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react'; // Añadido useMemo
import Layout from '../components/Layout'; // Ajusta la ruta
import ModuloTable from '../components/modulos/ModuloTable';
import ModuloForm from '../components/modulos/ModuloForm';
import ModuloActions from '../components/modulos/ModuloActions';
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
  const [selectedModuloId, setSelectedModuloId] = useState(null); // Guardamos el ID del módulo seleccionado

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
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openModalHandler = (type, entityName, entityId = null) => {
    // Cambiada la firma
    // Cambiada la firma
    let moduloData = null;
    if ((type === 'edit' || type === 'delete') && entityId) {
      // Usar entityId
      // Usar entityId
      // Log para depuración
      // console.log(
      //  `Abriendo modal para: tipo='${type}', entity='${entityName}', entityId='${entityId}' (tipo: ${typeof entityId})`
      // );
      moduloData = modulos.find(
        (m) => String(m.ID_MODULO) === String(entityId) // Usar entityId para la búsqueda
      );
      // console.log('Datos del módulo encontrado para el modal:', moduloData);
    }
    // setSelectedModuloId(moduloId); // selectedModuloId ya se establece al hacer clic en la tabla
    setModal({ type, entity: entityName, data: moduloData, show: true }); // Usar entityName
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
    if (!modal.data || !modal.data.ID_MODULO) return;
    setIsProcessing(true);
    setError('');
    setSuccess('');
    try {
      await DeleteModuloService(modal.data.ID_MODULO); // Usa la función de servicio
      displayMessage(setSuccess, 'Módulo eliminado con éxito.');
      loadData();
      setSelectedModuloId(null); // Limpiar selección
      closeModalHandler();
    } catch (err) {
      displayMessage(
        setError,
        'Error al eliminar módulo: ' +
          (err.response?.data?.error || err.message)
      );
      // console.error('Error eliminando módulo:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler para el cambio de filtro de módulos
  const handleModuloFilterChange = useCallback((changedFilters) => {
    setModuloFilters((prevFilters) => ({
      ...prevFilters,
      ...changedFilters,
    }));
    setCurrentPageModulos(1); // Resetear a la primera página al cambiar filtros
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
            onAdd={() => openModalHandler('add', 'modulo')}
            onEdit={() =>
              selectedModuloId &&
              openModalHandler('edit', 'modulo', selectedModuloId)
            }
            onDelete={() =>
              selectedModuloId &&
              openModalHandler('delete', 'modulo', selectedModuloId)
            }
            selectedModuloId={selectedModuloId} // Pasa el ID para habilitar/deshabilitar botones
            disabled={isProcessing || loading}
          />
        </div>

        <ModuloTable
          modulos={currentModulos}
          selectedModuloId={selectedModuloId} // Pasa el ID
          onSelectModulo={setSelectedModuloId} // Pasar directamente la función para setear el ID
          loading={loading}
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
            <p>
              ¿Está seguro de que desea eliminar el módulo "
              <strong>{modal.data?.NOMBRE_MODULO || 'seleccionado'}</strong>"?
            </p>
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
