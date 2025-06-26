import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Layout from '../components/Layout';
import ModuloTable from '../components/modulos/ModuloTable';
import ModuloForm from '../components/modulos/ModuloForm';
import ModuloActions from '../components/modulos/moduloActions';
import ModuloFilter from '../components/modulos/ModuloFilter';
import PaginationComponent from '../components/PaginationComponent';
import {
  fetchAllModulos,
  createModulo as AddModuloService,
  updateModulo as EditModuloService,
  deleteModulo as DeleteModuloService,
} from '../services/moduloService';
import { Alert, Spinner } from 'react-bootstrap';

// --- COMPONENTE MODAL UNIFICADO ---
function Modal({ title, children, onClose }) {
  return (
    <div
      className="modal show"
      style={{
        display: 'block',
        backgroundColor: 'rgba(0,0,0,0.5)',
      }}
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
  const [selectedModulos, setSelectedModulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [modal, setModal] = useState({ type: null, entity: null, data: null });
  const [itemsPerPage] = useState(6);
  const [currentPageModulos, setCurrentPageModulos] = useState(1);
  const [moduloFilters, setModuloFilters] = useState({
    nombre: '',
    horaInicio: '',
    horaFin: '',
    estado: '',
  });

  const estadosModuloOptions = useMemo(
    () => [
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
      const modulosData = await fetchAllModulos();
      setModulos(modulosData || []);
      setCurrentPageModulos(1);
    } catch (err) {
      setError(
        'Error al cargar datos: ' + (err.message || 'Intente más tarde')
      );
      setModulos([]);
    } finally {
      setLoading(false);
      setSelectedModulos([]);
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
    const currentModuloIdsOnPage = currentModulos.map((m) => m.ID_MODULO);
    const allOnPageSelected =
      currentModulos.length > 0 &&
      currentModulos.every((m) =>
        selectedModulos.some((sm) => sm.ID_MODULO === m.ID_MODULO)
      );

    if (allOnPageSelected) {
      setSelectedModulos((prev) =>
        prev.filter((sm) => !currentModuloIdsOnPage.includes(sm.ID_MODULO))
      );
    } else {
      const newSelectionsFromPage = currentModulos.filter(
        (m) => !selectedModulos.some((sm) => sm.ID_MODULO === m.ID_MODULO)
      );
      setSelectedModulos((prev) => [...prev, ...newSelectionsFromPage]);
    }
  };

  const openModal = (type, entity) => {
    let data = null;
    if (type === 'edit') {
      if (selectedModulos.length !== 1) {
        displayMessage(
          setError,
          'Por favor, seleccione un único módulo para editar.'
        );
        return;
      }
      data = selectedModulos[0];
    } else if (type === 'delete') {
      if (selectedModulos.length === 0) {
        displayMessage(
          setError,
          'Por favor, seleccione al menos un módulo para eliminar.'
        );
        return;
      }
      data = selectedModulos;
    }
    setModal({ type, entity, data });
  };

  const closeModal = () => setModal({ type: null, entity: null, data: null });

  const handleFormSubmit = async (formDataFromForm) => {
    setIsProcessing(true);
    setError('');
    setSuccess('');
    try {
      let message = '';
      if (modal.type === 'add') {
        await AddModuloService(formDataFromForm);
        message = 'Módulo creado con éxito.';
      } else if (modal.type === 'edit' && modal.data) {
        await EditModuloService(modal.data.ID_MODULO, formDataFromForm);
        message = 'Módulo actualizado con éxito.';
      }
      displayMessage(setSuccess, message);
      loadData();
      closeModal();
    } catch (err) {
      displayMessage(
        setError,
        'Error al guardar módulo: ' + (err.response?.data?.error || err.message)
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteModulo = async () => {
    if (!modal.data || !Array.isArray(modal.data) || modal.data.length === 0) {
      closeModal();
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
      await loadData();
    }
    closeModal();
    setIsProcessing(false);
  };

  const handleModuloFilterChange = useCallback((changedFilters) => {
    setModuloFilters((prevFilters) => ({
      ...prevFilters,
      ...changedFilters,
    }));
    setCurrentPageModulos(1);
    setSelectedModulos([]);
  }, []);

  const filteredModulos = useMemo(() => {
    return modulos.filter((modulo) => {
      const matchesNombre =
        !moduloFilters.nombre ||
        (modulo.NOMBRE_MODULO &&
          modulo.NOMBRE_MODULO.toLowerCase().includes(
            moduloFilters.nombre.toLowerCase()
          ));
      const matchesHoraInicio =
        !moduloFilters.horaInicio ||
        (modulo.INICIO_MODULO &&
          modulo.INICIO_MODULO >= moduloFilters.horaInicio);
      const matchesHoraFin =
        !moduloFilters.horaFin ||
        (modulo.FIN_MODULO && modulo.FIN_MODULO <= moduloFilters.horaFin);
      const matchesEstado =
        !moduloFilters.estado ||
        String(modulo.ESTADO_ID_ESTADO) === String(moduloFilters.estado);
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

  const renderDeleteModalContent = () => {
    if (!modal.data || modal.data.length === 0)
      return <p>No hay módulos seleccionados.</p>;

    const itemsToDelete = modal.data;
    const itemName = itemsToDelete.length > 1 ? 'módulos' : 'módulo';
    const deleteHandler = handleDeleteModulo;
    const icon = 'bi bi-clock-fill';

    const itemsToList = itemsToDelete.map((item) => ({
      key: item.ID_MODULO,
      name: item.NOMBRE_MODULO,
    }));

    const consequences = (
      <ul>
        <li>El módulo horario será eliminado de forma permanente.</li>
        <li>
          Cualquier <strong>reserva de examen</strong> que utilice este módulo
          podría quedar inconsistente o generar errores.
        </li>
      </ul>
    );

    return (
      <div>
        <p>
          ¿Está seguro de que desea eliminar {itemsToDelete.length} {itemName}?
        </p>

        <ul className="list-unstyled my-3 p-3 border bg-light rounded">
          {itemsToList.map((item) => (
            <li key={item.key}>
              <i className={`${icon} me-2`}></i>
              {item.name || `Módulo sin nombre (ID: ${item.key})`}
            </li>
          ))}
        </ul>

        <Alert variant="danger" className="mt-3">
          <Alert.Heading>
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            ¡Atención! Esta acción es irreversible.
          </Alert.Heading>
          <p className="mb-0">
            Al eliminar, se podrían afectar los siguientes datos asociados:
          </p>
          <hr />
          {consequences}
        </Alert>

        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={closeModal}
            disabled={isProcessing}
          >
            Cancelar
          </button>
          <button
            className="btn btn-danger"
            onClick={deleteHandler}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Spinner as="span" size="sm" animation="border" />
            ) : (
              'Sí, entiendo, eliminar'
            )}
          </button>
        </div>
      </div>
    );
  };

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
          estados={estadosModuloOptions}
          onFilterChange={handleModuloFilterChange}
          currentFilters={moduloFilters}
        />

        <div className="mb-3">
          <ModuloActions
            onAdd={() => openModal('add', 'modulo')}
            onEdit={() => openModal('edit', 'modulo')}
            onDelete={() => openModal('delete', 'modulo')}
            selectedModulos={selectedModulos}
            disabled={isProcessing || loading}
          />
        </div>

        <ModuloTable
          modulos={currentModulos}
          selectedModulos={selectedModulos}
          onToggleModuloSelection={handleToggleModuloSelection}
          onToggleSelectAllModulos={handleToggleSelectAllModulos}
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

      {modal.type && modal.entity === 'modulo' && (
        <Modal
          title={
            modal.type === 'add'
              ? 'Agregar Módulo'
              : modal.type === 'edit'
                ? 'Editar Módulo'
                : 'Eliminar Módulo'
          }
          onClose={closeModal}
        >
          {modal.type === 'delete' ? (
            renderDeleteModalContent()
          ) : (
            <ModuloForm
              initial={modal.data}
              onSubmit={handleFormSubmit}
              onCancel={closeModal}
              isProcessing={isProcessing}
            />
          )}
        </Modal>
      )}
    </Layout>
  );
}
