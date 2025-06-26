import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Layout from '../components/Layout'; // Ajusta la ruta si es necesario

// Importa tus servicios (asumiendo que usan tu instancia de 'api' de Axios)
import {
  fetchAllSalas as fetchAllSalasService, // Renombrado para evitar conflicto con estado
  createSala as AddSala, // Renombrado createSala a AddSala
  updateSala as EditSala, // Renombrado updateSala a EditSala
  deleteSalaById, // Renombrado deleteSala a deleteSalaById
} from '../services/salaService'; // Renombrado deleteSala a deleteSalaById
import {
  fetchAllEdificios,
  createEdificio,
  updateEdificio,
  fetchEdificiosBySede, // Importar para el filtro dependiente
  deleteEdificio as deleteEdificioById,
} from '../services/edificioService'; // Renombrado deleteEdificio
import {
  fetchAllSedes,
  createSede,
  updateSede,
  deleteSede as deleteSedeById,
} from '../services/sedeService'; // Renombrado deleteSede

// Importa componentes de UI de React Bootstrap
import { Alert, Spinner } from 'react-bootstrap';

// Importa tus componentes de UI específicos
import SalaForm from '../components/salas/SalaForm';
import SalaList from '../components/salas/SalaList';
import SalaActions from '../components/salas/SalaActions';
import SalaFilter from '../components/salas/SalaFilter'; // <-- IMPORTAR SalaFilter
import EdificioForm from '../components/edificios/EdificioForm';
import EdificioList from '../components/edificios/EdificioList';
import EdificioFilter from '../components/edificios/EdificioFilter'; // <-- IMPORTAR EdificioFilter
import EdificioActions from '../components/edificios/EdificioActions';
import SedeForm from '../components/sedes/SedeForm';
import SedeFilter from '../components/sedes/SedeFilter'; // <-- IMPORTAR SedeFilter
import SedeList from '../components/sedes/SedeList';
import SedeActions from '../components/sedes/SedeActions';
import PaginationComponent from '../components/PaginationComponent'; // Asegúrate de que la ruta sea correcta

// Componente Modal Bootstrap Genérico
function Modal({ title, children, onClose }) {
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

const normalizeText = (text) => {
  if (!text) return '';
  return text
    .normalize('NFD') // Descompone caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Elimina los diacríticos
    .toLowerCase(); // Convierte a minúsculas
};

export default function SalasPage() {
  const [salas, setSalas] = useState([]);
  const [edificios, setEdificios] = useState([]);
  const [sedes, setSedes] = useState([]);

  const [selectedSalas, setSelectedSalas] = useState([]);
  const [selectedEdificios, setSelectedEdificios] = useState([]);
  const [selectedSedes, setSelectedSedes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [modal, setModal] = useState({ type: null, entity: null, data: null });
  const [activeTab, setActiveTab] = useState('salas');

  const [itemsPerPage] = useState(6);
  const [currentPageSalas, setCurrentPageSalas] = useState(1);
  const [currentPageEdificios, setCurrentPageEdificios] = useState(1);
  const [currentPageSedes, setCurrentPageSedes] = useState(1);

  const [salaFilters, setSalaFilters] = useState({
    sede: '',
    nombre: '',
    edificio: '',
  });
  const [edificioFilters, setEdificioFilters] = useState({
    nombre: '',
    sede: '',
  });
  const [sedeFilters, setSedeFilters] = useState({ nombre: '' });

  const displayMessage = (setter, message, duration = 4000) => {
    setter(message);
    setTimeout(() => setter(''), duration);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [salasData, edificiosData, sedesData] = await Promise.all([
        fetchAllSalasService(),
        fetchAllEdificios(),
        fetchAllSedes(),
      ]);
      setSalas(salasData || []);
      setEdificios(edificiosData || []);
      setSedes(sedesData || []);
    } catch (err) {
      setError('Error al cargar datos. ' + (err.message || ''));
    } finally {
      setLoading(false);
      setSelectedSalas([]);
      setSelectedEdificios([]);
      setSelectedSedes([]);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleSalaSelection = (salaToToggle) => {
    setSelectedSalas((prev) =>
      prev.find((s) => s.ID_SALA === salaToToggle.ID_SALA)
        ? prev.filter((s) => s.ID_SALA !== salaToToggle.ID_SALA)
        : [...prev, salaToToggle]
    );
  };

  const handleToggleSelectAllSalas = () => {
    const allOnPageSelected =
      currentSalas.length > 0 &&
      currentSalas.every((s) =>
        selectedSalas.some((ss) => ss.ID_SALA === s.ID_SALA)
      );
    if (allOnPageSelected) {
      setSelectedSalas((prev) =>
        prev.filter(
          (ss) => !currentSalas.map((s) => s.ID_SALA).includes(ss.ID_SALA)
        )
      );
    } else {
      const newSelections = currentSalas.filter(
        (s) => !selectedSalas.some((ss) => ss.ID_SALA === s.ID_SALA)
      );
      setSelectedSalas((prev) => [...prev, ...newSelections]);
    }
  };

  const handleToggleEdificioSelection = (edificioToToggle) => {
    setSelectedEdificios((prev) =>
      prev.find((e) => e.ID_EDIFICIO === edificioToToggle.ID_EDIFICIO)
        ? prev.filter((e) => e.ID_EDIFICIO !== edificioToToggle.ID_EDIFICIO)
        : [...prev, edificioToToggle]
    );
  };

  const handleToggleSelectAllEdificios = () => {
    const allOnPageSelected =
      currentEdificios.length > 0 &&
      currentEdificios.every((e) =>
        selectedEdificios.some((se) => se.ID_EDIFICIO === e.ID_EDIFICIO)
      );
    if (allOnPageSelected) {
      setSelectedEdificios((prev) =>
        prev.filter(
          (se) =>
            !currentEdificios.map((e) => e.ID_EDIFICIO).includes(se.ID_EDIFICIO)
        )
      );
    } else {
      const newSelections = currentEdificios.filter(
        (e) => !selectedEdificios.some((se) => se.ID_EDIFICIO === e.ID_EDIFICIO)
      );
      setSelectedEdificios((prev) => [...prev, ...newSelections]);
    }
  };

  const handleToggleSedeSelection = (sedeToToggle) => {
    setSelectedSedes((prev) =>
      prev.find((s) => s.ID_SEDE === sedeToToggle.ID_SEDE)
        ? prev.filter((s) => s.ID_SEDE !== sedeToToggle.ID_SEDE)
        : [...prev, sedeToToggle]
    );
  };

  const handleToggleSelectAllSedes = () => {
    const allOnPageSelected =
      currentSedes.length > 0 &&
      currentSedes.every((s) =>
        selectedSedes.some((ss) => ss.ID_SEDE === s.ID_SEDE)
      );
    if (allOnPageSelected) {
      setSelectedSedes((prev) =>
        prev.filter(
          (ss) => !currentSedes.map((s) => s.ID_SEDE).includes(ss.ID_SEDE)
        )
      );
    } else {
      const newSelections = currentSedes.filter(
        (s) => !selectedSedes.some((ss) => ss.ID_SEDE === s.ID_SEDE)
      );
      setSelectedSedes((prev) => [...prev, ...newSelections]);
    }
  };

  const closeModal = () => setModal({ type: null, entity: null, data: null });

  const openModal = (type, entity) => {
    let data = null;
    let selectedItems = [];

    switch (entity) {
      case 'sala':
        selectedItems = selectedSalas;
        break;
      case 'edificio':
        selectedItems = selectedEdificios;
        break;
      case 'sede':
        selectedItems = selectedSedes;
        break;
      default:
        return;
    }

    if (type === 'edit') {
      if (selectedItems.length !== 1) {
        displayMessage(
          setError,
          `Por favor, seleccione una única ${entity} para editar.`
        );
        return;
      }
      data = selectedItems[0];
    } else if (type === 'delete') {
      if (selectedItems.length === 0) {
        displayMessage(
          setError,
          `Por favor, seleccione al menos una ${entity} para eliminar.`
        );
        return;
      }
      data = selectedItems;
    }
    setModal({ type, entity, data });
  };

  const handleSave = async (entity, form) => {
    setIsProcessing(true);
    try {
      let message = '';
      if (modal.type === 'add') {
        if (entity === 'sala') await AddSala(form);
        else if (entity === 'edificio') await createEdificio(form);
        else if (entity === 'sede') await createSede(form);
        message = `${entity.charAt(0).toUpperCase() + entity.slice(1)} creada con éxito.`;
      } else if (modal.type === 'edit' && modal.data) {
        if (entity === 'sala') await EditSala(modal.data.ID_SALA, form);
        else if (entity === 'edificio')
          await updateEdificio(modal.data.ID_EDIFICIO, form);
        else if (entity === 'sede') await updateSede(modal.data.ID_SEDE, form);
        message = `${entity.charAt(0).toUpperCase() + entity.slice(1)} actualizada con éxito.`;
      }
      displayMessage(setSuccess, message);
      loadData();
      closeModal();
    } catch (err) {
      displayMessage(
        setError,
        `Error al guardar ${entity}: ` +
          (err.response?.data?.error || err.message)
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (
      !modal.data ||
      !modal.entity ||
      !Array.isArray(modal.data) ||
      modal.data.length === 0
    ) {
      closeModal();
      return;
    }
    setIsProcessing(true);
    const entityName = modal.entity;
    try {
      for (const itemToDelete of modal.data) {
        if (entityName === 'sala') await deleteSalaById(itemToDelete.ID_SALA);
        else if (entityName === 'edificio')
          await deleteEdificioById(itemToDelete.ID_EDIFICIO);
        else if (entityName === 'sede')
          await deleteSedeById(itemToDelete.ID_SEDE);
      }
      displayMessage(
        setSuccess,
        `${entityName.charAt(0).toUpperCase() + entityName.slice(1)}(s) eliminada(s) con éxito.`
      );
      loadData();
    } catch (err) {
      displayMessage(
        setError,
        `Error al eliminar ${entityName}: ` +
          (err.response?.data?.error || err.message)
      );
    } finally {
      closeModal();
      setIsProcessing(false);
    }
  };

  const handleSalaFilterChange = useCallback((changedFilters) => {
    setSalaFilters((prev) => ({
      ...prev,
      ...changedFilters,
      ...(changedFilters.sede !== undefined && { edificio: '' }),
    }));
    setCurrentPageSalas(1);
    setSelectedSalas([]);
  }, []);
  const handleEdificioFilterChange = useCallback((changedFilters) => {
    setEdificioFilters((prev) => ({ ...prev, ...changedFilters }));
    setCurrentPageEdificios(1);
    setSelectedEdificios([]);
  }, []);
  const handleSedeFilterChange = useCallback((changedFilters) => {
    setSedeFilters((prev) => ({ ...prev, ...changedFilters }));
    setCurrentPageSedes(1);
    setSelectedSedes([]);
  }, []);

  const edificiosOptionsForFilter = useMemo(() => {
    if (!salaFilters.sede) return edificios;
    return edificios.filter(
      (ed) => String(ed.SEDE_ID_SEDE) === String(salaFilters.sede)
    );
  }, [salaFilters.sede, edificios]);

  const filteredSalas = useMemo(() => {
    return salas.filter((sala) => {
      const matchesNombre =
        !salaFilters.nombre ||
        (sala.NOMBRE_SALA &&
          normalizeText(sala.NOMBRE_SALA).includes(
            normalizeText(salaFilters.nombre)
          ));
      const edificioDeSala = edificios.find(
        (e) => String(e.ID_EDIFICIO) === String(sala.EDIFICIO_ID_EDIFICIO)
      );
      const matchesSede =
        !salaFilters.sede ||
        (edificioDeSala &&
          String(edificioDeSala.SEDE_ID_SEDE) === String(salaFilters.sede));
      const matchesEdificio =
        !salaFilters.edificio ||
        String(sala.EDIFICIO_ID_EDIFICIO) === String(salaFilters.edificio);
      return matchesNombre && matchesSede && matchesEdificio;
    });
  }, [salas, salaFilters, edificios]);

  const filteredEdificios = useMemo(() => {
    return edificios.filter((edificio) => {
      const matchesNombre =
        !edificioFilters.nombre ||
        (edificio.NOMBRE_EDIFICIO &&
          normalizeText(edificio.NOMBRE_EDIFICIO).includes(
            normalizeText(edificioFilters.nombre)
          )) ||
        (edificio.SIGLA_EDIFICIO &&
          normalizeText(edificio.SIGLA_EDIFICIO).includes(
            normalizeText(edificioFilters.nombre)
          ));
      const matchesSede =
        !edificioFilters.sede ||
        String(edificio.SEDE_ID_SEDE) === String(edificioFilters.sede);
      return matchesNombre && matchesSede;
    });
  }, [edificios, edificioFilters]);

  const filteredSedes = useMemo(() => {
    return sedes.filter(
      (sede) =>
        !sedeFilters.nombre ||
        (sede.NOMBRE_SEDE &&
          normalizeText(sede.NOMBRE_SEDE).includes(
            normalizeText(sedeFilters.nombre)
          ))
    );
  }, [sedes, sedeFilters]);

  const paginateSalas = (pageNumber) => setCurrentPageSalas(pageNumber);
  const paginateEdificios = (pageNumber) => setCurrentPageEdificios(pageNumber);
  const paginateSedes = (pageNumber) => setCurrentPageSedes(pageNumber);

  const getPaginatedData = (items, currentPage) => {
    if (!Array.isArray(items)) return [];
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return items.slice(indexOfFirstItem, indexOfLastItem);
  };

  const currentSalas = getPaginatedData(filteredSalas, currentPageSalas);
  const currentEdificios = getPaginatedData(
    filteredEdificios,
    currentPageEdificios
  );
  const currentSedes = getPaginatedData(filteredSedes, currentPageSedes);

  const handleSetTab = (tabName) => {
    setActiveTab(tabName);
    setSelectedSalas([]);
    setSelectedEdificios([]);
    setSelectedSedes([]);
  };

  const handleBulkUploadComplete = (entity) => {
    displayMessage(
      setSuccess,
      `Carga masiva de ${entity} completada. Recargando datos...`
    );
    loadData();
  };

  const renderDeleteModalContent = () => {
    if (!modal.data || modal.data.length === 0)
      return <p>No hay elementos seleccionados.</p>;

    let itemsToDelete = modal.data;
    let itemName = '';
    let deleteHandler = handleDelete;
    let consequences = null;
    let icon = 'bi bi-trash';
    let itemsToList = [];

    switch (modal.entity) {
      case 'sede':
        itemName = itemsToDelete.length > 1 ? 'sedes' : 'sede';
        icon = 'bi bi-building-fill';
        itemsToList = itemsToDelete.map((item) => ({
          key: item.ID_SEDE,
          name: item.NOMBRE_SEDE,
        }));
        consequences = (
          <ul>
            <li>
              Todos los <strong>Edificios</strong> y <strong>Salas</strong> de
              esta(s) sede(s).
            </li>
            <li>
              Todas las <strong>Reservas</strong> asociadas a esas salas.
            </li>
          </ul>
        );
        break;
      case 'edificio':
        itemName = itemsToDelete.length > 1 ? 'edificios' : 'edificio';
        icon = 'bi bi-building';
        itemsToList = itemsToDelete.map((item) => ({
          key: item.ID_EDIFICIO,
          name: item.NOMBRE_EDIFICIO,
        }));
        consequences = (
          <ul>
            <li>
              Todas las <strong>Salas</strong> de este/os edificio(s).
            </li>
            <li>
              Todas las <strong>Reservas</strong> asociadas a esas salas.
            </li>
          </ul>
        );
        break;
      case 'sala':
        itemName = itemsToDelete.length > 1 ? 'salas' : 'sala';
        icon = 'bi bi-door-open';
        itemsToList = itemsToDelete.map((item) => ({
          key: item.ID_SALA,
          name: item.NOMBRE_SALA,
        }));
        consequences = (
          <ul>
            <li>
              Todas las <strong>Reservas</strong> de exámenes asociadas a
              esta(s) sala(s).
            </li>
          </ul>
        );
        break;
      default:
        return <p>Error: Entidad desconocida.</p>;
    }

    return (
      <div>
        <p>
          ¿Está seguro de que desea eliminar {itemsToDelete.length} {itemName}?
        </p>
        <ul className="list-unstyled my-3 p-3 border bg-light rounded">
          {itemsToList.map((item) => (
            <li key={item.key}>
              <i className={`${icon} me-2`}></i>
              {item.name || `Elemento sin nombre`}
            </li>
          ))}
        </ul>
        <Alert variant="danger" className="mt-3">
          <Alert.Heading>
            <i className="bi bi-exclamation-triangle-fill me-2"></i>¡Atención!
            Esta acción es irreversible.
          </Alert.Heading>
          <p className="mb-0">
            Al eliminar, también se borrarán de forma permanente los siguientes
            datos asociados:
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

  if (loading && !salas.length && !edificios.length && !sedes.length) {
    return (
      <Layout>
        <div className="container-fluid mt-4 text-center">
          <Spinner animation="border" variant="primary" />
          <p>Cargando datos...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-fluid pt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="display-6">
            <i className="bi bi-door-open-fill me-3"></i>Gestión de Espacios
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

        <ul className="nav nav-tabs mb-3">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'salas' ? 'active' : ''}`}
              onClick={() => handleSetTab('salas')}
            >
              Salas
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'edificios' ? 'active' : ''}`}
              onClick={() => handleSetTab('edificios')}
            >
              Edificios
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'sedes' ? 'active' : ''}`}
              onClick={() => handleSetTab('sedes')}
            >
              Sedes
            </button>
          </li>
        </ul>

        {activeTab === 'salas' && (
          <>
            <SalaFilter
              sedes={sedes}
              edificiosOptions={edificiosOptionsForFilter}
              onFilterChange={handleSalaFilterChange}
              currentFilters={salaFilters}
            />
            <SalaActions
              onAdd={() => openModal('add', 'sala')}
              onEdit={() => openModal('edit', 'sala')}
              onDelete={() => openModal('delete', 'sala')}
              selectedSalas={selectedSalas}
              onBulkUploadComplete={() => handleBulkUploadComplete('salas')}
              onUploadResult={({ success, error }) => {
                if (success) displayMessage(setSuccess, success);
                if (error) displayMessage(setError, error);
              }}
            />
            <SalaList
              salas={currentSalas}
              selectedSalas={selectedSalas}
              onToggleSalaSelection={handleToggleSalaSelection}
              onToggleSelectAllSalas={handleToggleSelectAllSalas}
              loading={loading}
            />
            {!loading && filteredSalas.length > itemsPerPage && (
              <PaginationComponent
                itemsPerPage={itemsPerPage}
                totalItems={filteredSalas.length}
                paginate={paginateSalas}
                currentPage={currentPageSalas}
              />
            )}
          </>
        )}
        {activeTab === 'edificios' && (
          <>
            <EdificioFilter
              sedes={sedes}
              onFilterChange={handleEdificioFilterChange}
              currentFilters={edificioFilters}
            />
            <EdificioActions
              onAdd={() => openModal('add', 'edificio')}
              onEdit={() => openModal('edit', 'edificio')}
              onDelete={() => openModal('delete', 'edificio')}
              selectedEdificios={selectedEdificios}
              disabled={isProcessing}
            />
            <EdificioList
              edificios={currentEdificios}
              selectedEdificios={selectedEdificios}
              onToggleEdificioSelection={handleToggleEdificioSelection}
              onToggleSelectAllEdificios={handleToggleSelectAllEdificios}
              loading={loading}
            />
            {!loading && filteredEdificios.length > itemsPerPage && (
              <PaginationComponent
                itemsPerPage={itemsPerPage}
                totalItems={filteredEdificios.length}
                paginate={paginateEdificios}
                currentPage={currentPageEdificios}
              />
            )}
          </>
        )}
        {activeTab === 'sedes' && (
          <>
            <SedeFilter
              onFilterChange={handleSedeFilterChange}
              currentFilters={sedeFilters}
            />
            <SedeActions
              onAdd={() => openModal('add', 'sede')}
              onEdit={() => openModal('edit', 'sede')}
              onDelete={() => openModal('delete', 'sede')}
              selectedSedes={selectedSedes}
              disabled={isProcessing}
            />
            <SedeList
              sedes={currentSedes}
              selectedSedes={selectedSedes}
              onToggleSedeSelection={handleToggleSedeSelection}
              onToggleSelectAllSedes={handleToggleSelectAllSedes}
              loading={loading}
            />
            {!loading && filteredSedes.length > itemsPerPage && (
              <PaginationComponent
                itemsPerPage={itemsPerPage}
                totalItems={filteredSedes.length}
                paginate={paginateSedes}
                currentPage={currentPageSedes}
              />
            )}
          </>
        )}

        {modal.type && modal.entity && (
          <Modal
            title={
              modal.type === 'add'
                ? `Agregar ${modal.entity}`
                : modal.type === 'edit'
                  ? `Editar ${modal.entity}`
                  : // **INICIO DE LA CORRECCIÓN**
                    `Eliminar ${modal.entity.charAt(0).toUpperCase() + modal.entity.slice(1)}`
              // **FIN DE LA CORRECCIÓN**
            }
            onClose={closeModal}
          >
            {modal.type === 'delete' ? (
              renderDeleteModalContent()
            ) : modal.entity === 'sala' ? (
              <SalaForm
                initial={modal.data}
                onSubmit={(form) => handleSave('sala', form)}
                onCancel={closeModal}
                isProcessing={isProcessing}
                edificios={edificios}
              />
            ) : modal.entity === 'edificio' ? (
              <EdificioForm
                initial={modal.data}
                onSubmit={(form) => handleSave('edificio', form)}
                onCancel={closeModal}
                isProcessing={isProcessing}
                sedes={sedes}
              />
            ) : modal.entity === 'sede' ? (
              <SedeForm
                initial={modal.data}
                onSubmit={(form) => handleSave('sede', form)}
                onCancel={closeModal}
                isProcessing={isProcessing}
              />
            ) : null}
          </Modal>
        )}
      </div>
    </Layout>
  );
}
