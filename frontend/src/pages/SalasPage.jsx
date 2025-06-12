// src/pages/SalasPage.jsx
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
import { Alert, Spinner, Button as BsButton } from 'react-bootstrap'; // Añadido Button as BsButton

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

// Componente Modal Bootstrap Genérico (el que ya tenías, está bien)
function Modal({ title, children, onClose, show }) {
  // Añadida prop 'show'
  if (!show) return null; // No renderizar si no se debe mostrar

  return (
    <div
      className="modal show"
      tabIndex="-1"
      style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
    >
      <div className="modal-dialog modal-dialog-centered">
        {/* modal-dialog-centered para centrarlo */}
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

export default function SalasPage() {
  const [salas, setSalas] = useState([]);
  const [edificios, setEdificios] = useState([]);
  const [sedes, setSedes] = useState([]);

  // Cambiar a estados de selección múltiple
  const [selectedSalas, setSelectedSalas] = useState([]);
  const [selectedEdificios, setSelectedEdificios] = useState([]);
  const [selectedSedes, setSelectedSedes] = useState([]);
  // const [selectedSala, setSelectedSala] = useState(null); // Conservar si alguna lógica aún lo usa, pero priorizar el array
  // const [selectedEdificio, setSelectedEdificio] = useState(null);
  // const [selectedSede, setSelectedSede] = useState(null);

  const [loading, setLoading] = useState(true); // Para la carga inicial de todas las listas
  const [isProcessing, setIsProcessing] = useState(false); // Para acciones CRUD
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [modal, setModal] = useState({
    type: null,
    entity: null,
    data: null,
    show: false,
  }); // Añadido 'show'
  const [activeTab, setActiveTab] = useState('salas');

  const [itemsPerPage] = useState(6); // Cambiado a 6 filas por página
  const [currentPageSalas, setCurrentPageSalas] = useState(1);
  const [currentPageEdificios, setCurrentPageEdificios] = useState(1);
  const [currentPageSedes, setCurrentPageSedes] = useState(1);

  // Estado para los filtros de Sala
  const [salaFilters, setSalaFilters] = useState({
    sede: '',
    nombre: '', // Añadir estado para el filtro de nombre
    edificio: '',
  });

  // Estado para los filtros de Edificio
  const [edificioFilters, setEdificioFilters] = useState({
    nombre: '',
    sede: '',
  });

  // Estado para los filtros de Sede
  const [sedeFilters, setSedeFilters] = useState({
    nombre: '',
  });

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
      setSalas(salasData || []); // Asegura que siempre sea un array
      setEdificios(edificiosData || []);
      setSedes(sedesData || []);

      setCurrentPageSalas(1);
      setCurrentPageEdificios(1);
      setCurrentPageSedes(1);
    } catch (err) {
      // console.error('Error al cargar datos:', err);
      setError('Error al cargar datos. ' + (err.message || ''));
      setSalas([]);
      setEdificios([]);
      setSedes([]); // En caso de error, inicializar como arrays vacíos
      setSelectedSalas([]);
      setSelectedEdificios([]);
      setSelectedSedes([]); // Limpiar selección
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- Funciones de Selección Múltiple ---
  const handleToggleSalaSelection = (salaToToggle) => {
    setSelectedSalas((prevSelected) =>
      prevSelected.find((s) => s.ID_SALA === salaToToggle.ID_SALA)
        ? prevSelected.filter((s) => s.ID_SALA !== salaToToggle.ID_SALA)
        : [...prevSelected, salaToToggle]
    );
  };

  const handleToggleSelectAllSalas = () => {
    const currentSalaIdsOnPage = currentSalas.map((s) => s.ID_SALA);
    const allOnPageSelected =
      currentSalas.length > 0 &&
      currentSalas.every((s) =>
        selectedSalas.some((ss) => ss.ID_SALA === s.ID_SALA)
      );
    if (allOnPageSelected) {
      setSelectedSalas((prev) =>
        prev.filter((ss) => !currentSalaIdsOnPage.includes(ss.ID_SALA))
      );
    } else {
      const newSelections = currentSalas.filter(
        (s) => !selectedSalas.some((ss) => ss.ID_SALA === s.ID_SALA)
      );
      setSelectedSalas((prev) => [...prev, ...newSelections]);
    }
  };

  const handleToggleEdificioSelection = (edificioToToggle) => {
    setSelectedEdificios((prevSelected) =>
      prevSelected.find((e) => e.ID_EDIFICIO === edificioToToggle.ID_EDIFICIO)
        ? prevSelected.filter(
            (e) => e.ID_EDIFICIO !== edificioToToggle.ID_EDIFICIO
          )
        : [...prevSelected, edificioToToggle]
    );
  };

  const handleToggleSelectAllEdificios = () => {
    const currentEdificioIdsOnPage = currentEdificios.map((e) => e.ID_EDIFICIO);
    const allOnPageSelected =
      currentEdificios.length > 0 &&
      currentEdificios.every((e) =>
        selectedEdificios.some((se) => se.ID_EDIFICIO === e.ID_EDIFICIO)
      );
    if (allOnPageSelected) {
      setSelectedEdificios((prev) =>
        prev.filter((se) => !currentEdificioIdsOnPage.includes(se.ID_EDIFICIO))
      );
    } else {
      const newSelections = currentEdificios.filter(
        (e) => !selectedEdificios.some((se) => se.ID_EDIFICIO === e.ID_EDIFICIO)
      );
      setSelectedEdificios((prev) => [...prev, ...newSelections]);
    }
  };

  const handleToggleSedeSelection = (sedeToToggle) => {
    setSelectedSedes((prevSelected) =>
      prevSelected.find((s) => s.ID_SEDE === sedeToToggle.ID_SEDE)
        ? prevSelected.filter((s) => s.ID_SEDE !== sedeToToggle.ID_SEDE)
        : [...prevSelected, sedeToToggle]
    );
  };

  const handleToggleSelectAllSedes = () => {
    const currentSedeIdsOnPage = currentSedes.map((s) => s.ID_SEDE);
    const allOnPageSelected =
      currentSedes.length > 0 &&
      currentSedes.every((s) =>
        selectedSedes.some((ss) => ss.ID_SEDE === s.ID_SEDE)
      );
    if (allOnPageSelected) {
      setSelectedSedes((prev) =>
        prev.filter((ss) => !currentSedeIdsOnPage.includes(ss.ID_SEDE))
      );
    } else {
      const newSelections = currentSedes.filter(
        (s) => !selectedSedes.some((ss) => ss.ID_SEDE === s.ID_SEDE)
      );
      setSelectedSedes((prev) => [...prev, ...newSelections]);
    }
  };

  const openModalHandler = (type, entity, entityPayload = null) => {
    let dataToModal = null;
    if (type === 'add') {
      if (entity === 'sala') setSelectedSalas([]);
      else if (entity === 'edificio') setSelectedEdificios([]);
      else if (entity === 'sede') setSelectedSedes([]);
      setModal({ type, entity, data: null, show: true });
    } else if (type === 'edit' && entityPayload) {
      // entityPayload es el ID de la entidad
      switch (entity) {
        case 'sala':
          dataToModal = salas.find(
            (s) => String(s.ID_SALA) === String(entityPayload)
          );
          break;
        case 'edificio':
          dataToModal = edificios.find(
            (e) => String(e.ID_EDIFICIO) === String(entityPayload)
          );
          break;
        case 'sede':
          dataToModal = sedes.find(
            (s) => String(s.ID_SEDE) === String(entityPayload)
          );
          break;
        default:
          break;
      }
      if (!dataToModal) {
        displayMessage(
          setError,
          `${entity.charAt(0).toUpperCase() + entity.slice(1)} no encontrada para editar.`
        );
        return;
      }
      setModal({ type, entity, data: dataToModal, show: true });
    } else if (
      type === 'delete' &&
      Array.isArray(entityPayload) &&
      entityPayload.length > 0
    ) {
      // entityPayload es el array de entidades seleccionadas
      setModal({ type, entity, data: [...entityPayload], show: true });
    }
  };

  const closeModalHandler = () =>
    setModal({ type: null, entity: null, data: null, show: false });

  // --- Manejadores CRUD ---
  const handleSave = async (entity, form) => {
    setIsProcessing(true);
    setError('');
    setSuccess('');
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
      closeModalHandler();
    } catch (err) {
      displayMessage(
        setError,
        `Error al guardar ${entity}: ` +
          (err.response?.data?.error || err.message)
      );
      // console.error(`Error guardando ${entity}:`, err);
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
      closeModalHandler();
      return;
    }

    setIsProcessing(true);
    setError('');
    setSuccess('');
    const entityName =
      modal.entity.charAt(0).toUpperCase() + modal.entity.slice(1);

    try {
      // Start of the main try block
      let successCount = 0;
      let errorCount = 0;
      const errorMessages = [];

      for (const itemToDelete of modal.data) {
        try {
          // Inner try for each item deletion
          if (modal.entity === 'sala')
            await deleteSalaById(itemToDelete.ID_SALA);
          else if (modal.entity === 'edificio')
            await deleteEdificioById(itemToDelete.ID_EDIFICIO);
          else if (modal.entity === 'sede')
            await deleteSedeById(itemToDelete.ID_SEDE);
          successCount++;
        } catch (err) {
          // Inner catch for individual item deletion error
          errorCount++;
          const specificError =
            err.response?.data?.error ||
            err.message ||
            `Error eliminando ${itemToDelete.NOMBRE_SALA || itemToDelete.NOMBRE_EDIFICIO || itemToDelete.NOMBRE_SEDE || 'item'}`;
          errorMessages.push(specificError);
        }
      }

      if (successCount > 0) {
        displayMessage(
          setSuccess,
          `${successCount} ${entityName}(s) eliminada(s) con éxito.`
        );
      }
      if (errorCount > 0) {
        displayMessage(
          setError,
          `Error al eliminar ${errorCount} ${entityName}(s): ${errorMessages.join('; ')}`
        );
      }

      if (successCount > 0) {
        await loadData(); // This already clears selections as per its implementation
      } else {
        // If no successes, but maybe errors, still clear current page selections
        if (modal.entity === 'sala') setSelectedSalas([]);
        if (modal.entity === 'edificio') setSelectedEdificios([]);
        if (modal.entity === 'sede') setSelectedSedes([]);
      }
    } catch (err) {
      // Catch for errors in the main try block (e.g., from loadData)
      displayMessage(
        setError,
        `Error general durante la eliminación de ${entityName}: ` +
          (err.response?.data?.error || err.message)
      );
    } finally {
      closeModalHandler(); // Ensure modal is closed
      setIsProcessing(false);
    }
  };

  // Handler para el cambio de filtro de salas
  const handleSalaFilterChange = useCallback((changedFilters) => {
    setSalaFilters((prevFilters) => {
      const newFilters = { ...prevFilters, ...changedFilters };
      // Si cambia la sede, resetear el filtro de edificio
      if (changedFilters.sede !== undefined) {
        newFilters.edificio = '';
      }
      return newFilters;
    });
    setCurrentPageSalas(1); // Resetear a la primera página al cambiar filtros
    setSelectedSalas([]); // Limpiar selección
  }, []);

  // Handler para el cambio de filtro de edificios
  const handleEdificioFilterChange = useCallback((changedFilters) => {
    setEdificioFilters((prevFilters) => ({
      ...prevFilters,
      ...changedFilters,
    }));
    setCurrentPageEdificios(1); // Resetear a la primera página al cambiar filtros
    setSelectedEdificios([]); // Limpiar selección
  }, []);

  // Handler para el cambio de filtro de sedes
  const handleSedeFilterChange = useCallback((changedFilters) => {
    setSedeFilters((prevFilters) => ({
      ...prevFilters,
      ...changedFilters,
    }));
    setCurrentPageSedes(1); // Resetear a la primera página al cambiar filtros
    setSelectedSedes([]); // Limpiar selección
  }, []);

  // Opciones de edificios para el filtro, dependientes de la sede seleccionada en el filtro
  const edificiosOptionsForFilter = useMemo(() => {
    if (!salaFilters.sede) {
      // Si no hay sede seleccionada en el filtro, mostrar todos los edificios
      // O podrías optar por no mostrar ninguno hasta que se seleccione una sede.
      // Por ahora, mostramos todos si no hay sede, para permitir filtrar solo por edificio si se desea.
      return edificios;
    }
    return edificios.filter(
      (ed) => String(ed.SEDE_ID_SEDE) === String(salaFilters.sede)
    );
  }, [salaFilters.sede, edificios]); // edificiosOptionsForFilter no necesita cambiar si solo se añade filtro por nombre de sala

  // Aplicar el filtro a la lista de salas
  const filteredSalas = useMemo(() => {
    return salas.filter((sala) => {
      const matchesNombre =
        !salaFilters.nombre ||
        (sala.NOMBRE_SALA && // Asegurarse que NOMBRE_SALA exista
          sala.NOMBRE_SALA.toLowerCase().includes(
            salaFilters.nombre.toLowerCase()
          ));

      const matchesSede =
        !salaFilters.sede ||
        (sala.EDIFICIO_SEDE_ID // Asumimos que cada sala tiene esta propiedad después de un join o procesamiento
          ? String(sala.EDIFICIO_SEDE_ID) === String(salaFilters.sede)
          : // Fallback si no tenemos EDIFICIO_SEDE_ID directamente en la sala:
            // Encontrar el edificio de la sala y luego la sede de ese edificio.
            // Esto requiere que 'edificios' (la lista completa) esté disponible.
            edificios.find(
              (e) => String(e.ID_EDIFICIO) === String(sala.EDIFICIO_ID_EDIFICIO)
            )?.SEDE_ID_SEDE === parseInt(salaFilters.sede));

      const matchesEdificio =
        !salaFilters.edificio ||
        String(sala.EDIFICIO_ID_EDIFICIO) === String(salaFilters.edificio);

      return matchesNombre && matchesSede && matchesEdificio;
    });
  }, [salas, salaFilters, edificios]);

  // Aplicar el filtro a la lista de edificios
  const filteredEdificios = useMemo(() => {
    return edificios.filter((edificio) => {
      const matchesNombre =
        !edificioFilters.nombre ||
        (edificio.NOMBRE_EDIFICIO &&
          edificio.NOMBRE_EDIFICIO.toLowerCase().includes(
            edificioFilters.nombre.toLowerCase()
          )) ||
        (edificio.SIGLA_EDIFICIO &&
          edificio.SIGLA_EDIFICIO.toLowerCase().includes(
            edificioFilters.nombre.toLowerCase()
          ));

      const matchesSede =
        !edificioFilters.sede ||
        String(edificio.SEDE_ID_SEDE) === String(edificioFilters.sede);

      return matchesNombre && matchesSede;
    });
  }, [edificios, edificioFilters]);

  // Aplicar el filtro a la lista de sedes
  const filteredSedes = useMemo(() => {
    return sedes.filter((sede) => {
      const matchesNombre =
        !sedeFilters.nombre ||
        (sede.NOMBRE_SEDE &&
          sede.NOMBRE_SEDE.toLowerCase().includes(
            sedeFilters.nombre.toLowerCase()
          ));
      return matchesNombre;
    });
  }, [sedes, sedeFilters]);

  // Funciones de paginación
  const paginateSalas = (pageNumber) => setCurrentPageSalas(pageNumber);
  const paginateEdificios = (pageNumber) => setCurrentPageEdificios(pageNumber);
  const paginateSedes = (pageNumber) => setCurrentPageSedes(pageNumber);

  const getPaginatedData = (items, currentPage) => {
    if (!Array.isArray(items) || items === null) return []; // Asegurarse de que items sea un array
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return items.slice(indexOfFirstItem, indexOfLastItem);
  };

  const currentSalas = getPaginatedData(filteredSalas, currentPageSalas); // Usar filteredSalas
  const currentEdificios = getPaginatedData(
    filteredEdificios,
    currentPageEdificios
  ); // Usar filteredEdificios
  const currentSedes = getPaginatedData(filteredSedes, currentPageSedes); // Usar filteredSedes

  const handleSetTab = (tabName) => {
    setActiveTab(tabName);
    // Limpiar selecciones al cambiar de tab
    setSelectedSalas([]);
    setSelectedEdificios([]);
    setSelectedSedes([]);
  };

  // --- Handlers para Acciones (pasados a los componentes Actions) ---
  const handleAddAction = (entity) => {
    openModalHandler('add', entity);
  };

  const handleEditAction = (entity) => {
    let selectedItems;
    let idField;
    if (entity === 'sala') {
      selectedItems = selectedSalas;
      idField = 'ID_SALA';
    } else if (entity === 'edificio') {
      selectedItems = selectedEdificios;
      idField = 'ID_EDIFICIO';
    } else if (entity === 'sede') {
      selectedItems = selectedSedes;
      idField = 'ID_SEDE';
    } else return;

    if (selectedItems.length === 1) {
      openModalHandler('edit', entity, selectedItems[0][idField]);
    } else {
      displayMessage(
        setError,
        `Por favor, seleccione un único ${entity} para editar.`
      );
    }
  };

  const handleDeleteAction = (entity) => {
    let selectedItems;
    if (entity === 'sala') selectedItems = selectedSalas;
    else if (entity === 'edificio') selectedItems = selectedEdificios;
    else if (entity === 'sede') selectedItems = selectedSedes;
    else return;

    if (selectedItems.length > 0) {
      openModalHandler('delete', entity, selectedItems);
    } else {
      displayMessage(
        setError,
        `Por favor, seleccione al menos un ${entity} para eliminar.`
      );
    }
  };

  const handleBulkUploadComplete = (entity) => {
    displayMessage(
      setSuccess,
      `Carga masiva de ${entity} completada. Recargando datos...`
    );
    loadData();
  };

  // Renderizado
  if (
    loading &&
    salas.length === 0 &&
    edificios.length === 0 &&
    sedes.length === 0
  ) {
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
            <i className="bi bi-door-open-fill me-3"></i>
            Gestión de Espacios
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
              onAdd={() => handleAddAction('sala')}
              onEdit={() => handleEditAction('sala')}
              onDelete={() => handleDeleteAction('sala')}
              selectedSalas={selectedSalas}
              isLoadingList={loading}
              isProcessingAction={isProcessing}
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
              loading={loading} // Para mostrar 'cargando' en la tabla si es necesario
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
              onAdd={() => handleAddAction('edificio')}
              onEdit={() => handleEditAction('edificio')}
              onDelete={() => handleDeleteAction('edificio')}
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
              onAdd={() => handleAddAction('sede')}
              onEdit={() => handleEditAction('sede')}
              onDelete={() => handleDeleteAction('sede')}
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

        {/* Modal Genérico */}
        <Modal
          title={
            modal.type === 'add'
              ? `Agregar ${modal.entity}`
              : modal.type === 'edit'
                ? `Editar ${modal.entity}`
                : `Eliminar ${modal.entity}`
          }
          show={modal.show} // Prop 'show' para el Modal
          onClose={closeModalHandler}
        >
          {modal.type === 'delete' ? (
            <div>
              {modal.data && modal.data.length === 1 ? (
                <p>
                  ¿Está seguro de que desea eliminar{' '}
                  {modal.entity === 'sede' ? 'la' : 'el'} {modal.entity} "
                  <strong>
                    {modal.data[0]?.NOMBRE_SALA ||
                      modal.data[0]?.NOMBRE_EDIFICIO ||
                      modal.data[0]?.NOMBRE_SEDE ||
                      'seleccionado'}
                  </strong>
                  "?
                </p>
              ) : (
                <p>
                  ¿Está seguro de que desea eliminar los{' '}
                  <strong>{modal.data?.length}</strong>{' '}
                  {modal.entity === 'sala'
                    ? 'salas seleccionadas'
                    : modal.entity === 'edificio'
                      ? 'edificios seleccionados'
                      : 'sedes seleccionadas'}
                  ?
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
                  onClick={handleDelete}
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
          ) : modal.entity === 'sala' ? (
            <SalaForm
              initial={modal.data} // Cambiado de initialData a initial
              onSubmit={(form) => handleSave('sala', form)}
              onCancel={closeModalHandler}
              isProcessing={isProcessing}
              edificios={edificios}
            />
          ) : modal.entity === 'edificio' ? (
            <EdificioForm
              initial={modal.data} // Cambiado de initialData a initial
              onSubmit={(form) => handleSave('edificio', form)}
              onCancel={closeModalHandler}
              isProcessing={isProcessing}
              sedes={sedes}
            />
          ) : modal.entity === 'sede' ? (
            <SedeForm
              initial={modal.data} // Cambiado de initialData a initial
              onSubmit={(form) => handleSave('sede', form)}
              onCancel={closeModalHandler}
              isProcessing={isProcessing}
            />
          ) : null}
        </Modal>
      </div>
    </Layout>
  );
}
