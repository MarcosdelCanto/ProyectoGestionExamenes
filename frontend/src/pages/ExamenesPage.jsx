import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Layout from '../components/Layout';
import ExamenForm from '../components/examenes/ExamenForm';
import ExamenActions from '../components/examenes/ExamenActions';
import ExamenList from '../components/examenes/ExamenList';
import ExamenFilter from '../components/examenes/ExamenFilter';
import PaginationComponent from '../components/PaginationComponent';
import { Alert, Spinner } from 'react-bootstrap';
import api from '../services/api';

// Servicios para los filtros
import { fetchAllEscuelas } from '../services/escuelaService';
import { fetchAllCarreras } from '../services/carreraService';
import { fetchAllAsignaturas } from '../services/asignaturaService';
import { fetchAllSecciones } from '../services/seccionService';

const ITEMS_PER_PAGE = 6;

const normalizeText = (text) => {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
};

// --- COMPONENTE MODAL UNIFICADO (COPIADO DE AsignaturasPage.jsx) ---
function Modal({ title, children, onClose }) {
  return (
    <div
      className="modal show"
      style={{
        display: 'block',
        backgroundColor: 'rgba(0,0,0,0.5)',
      }}
    >
      <div className="modal-dialog">
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

export default function ExamenesPage() {
  const [examenes, setExamenes] = useState([]);
  const [processedExamenes, setProcessedExamenes] = useState([]);
  const [selectedExamenes, setSelectedExamenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modal, setModal] = useState({ type: null, entity: null, data: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    text: '',
    escuela: '',
    carrera: '',
    asignatura: '',
    seccion: '',
    estado: '',
  });

  const [allEscuelas, setAllEscuelas] = useState([]);
  const [allCarreras, setAllCarreras] = useState([]);
  const [allAsignaturas, setAllAsignaturas] = useState([]);
  const [allSecciones, setAllSecciones] = useState([]);
  const estadosExamen = useMemo(
    () => [
      { value: '', label: 'Todos los estados' },
      { value: 'ACTIVO', label: 'ACTIVO' },
      { value: 'PROGRAMADO', label: 'PROGRAMADO' },
    ],
    []
  );

  const displayMessage = (setter, message, duration = 4000) => {
    setter(message);
    setTimeout(() => setter(''), duration);
  };

  const loadExamenes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/examen');
      setCurrentPage(1);
      setExamenes(Array.isArray(response.data) ? response.data : []);
      setSelectedExamenes([]);
    } catch (err) {
      console.error('Error al cargar los exámenes:', err);
      setExamenes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExamenes();
    const loadFilterData = async () => {
      try {
        const [escuelasData, carrerasData, asignaturasData, seccionesData] =
          await Promise.all([
            fetchAllEscuelas(),
            fetchAllCarreras(),
            fetchAllAsignaturas(),
            fetchAllSecciones(),
          ]);
        setAllEscuelas(escuelasData || []);
        setAllCarreras(carrerasData || []);
        setAllAsignaturas(asignaturasData || []);
        setAllSecciones(seccionesData || []);
      } catch (error) {
        // console.error('Error cargando datos para filtros:', error);
      }
    };
    loadFilterData();
  }, [loadExamenes]);

  useEffect(() => {
    if (
      examenes.length > 0 &&
      allSecciones.length > 0 &&
      allAsignaturas.length > 0 &&
      allCarreras.length > 0 &&
      allEscuelas.length > 0
    ) {
      const examenesEnriquecidos = examenes.map((ex) => {
        let seccionIdDelExamen = ex.SECCION_ID_SECCION || ex.SECCION_ID;
        const seccion = seccionIdDelExamen
          ? allSecciones.find(
              (s) => String(s.ID_SECCION) === String(seccionIdDelExamen)
            )
          : null;
        const asignaturaIdDesdeSeccion = seccion
          ? seccion.ASIGNATURA_ID_ASIGNATURA
          : null;
        let asignaturaIdDelExamen =
          ex.ASIGNATURA_ID || asignaturaIdDesdeSeccion;
        const asignatura = asignaturaIdDelExamen
          ? allAsignaturas.find(
              (a) => String(a.ID_ASIGNATURA) === String(asignaturaIdDelExamen)
            )
          : null;
        const carreraIdDesdeAsignatura = asignatura
          ? asignatura.CARRERA_ID_CARRERA
          : null;
        const carrera = carreraIdDesdeAsignatura
          ? allCarreras.find(
              (c) => String(c.ID_CARRERA) === String(carreraIdDesdeAsignatura)
            )
          : null;
        const escuelaIdDesdeCarrera = carrera
          ? carrera.ESCUELA_ID_ESCUELA
          : null;

        return {
          ...ex,
          DERIVED_ESCUELA_ID: escuelaIdDesdeCarrera
            ? String(escuelaIdDesdeCarrera)
            : null,
          DERIVED_CARRERA_ID: carreraIdDesdeAsignatura
            ? String(carreraIdDesdeAsignatura)
            : null,
          DERIVED_ASIGNATURA_ID: asignaturaIdDelExamen
            ? String(asignaturaIdDelExamen)
            : null,
          DERIVED_SECCION_ID: seccionIdDelExamen
            ? String(seccionIdDelExamen)
            : null,
        };
      });
      setProcessedExamenes(examenesEnriquecidos);
    } else {
      if (examenes.length === 0) {
        setProcessedExamenes([]);
      }
    }
  }, [examenes, allEscuelas, allCarreras, allAsignaturas, allSecciones]);

  const handleToggleExamenSelection = (examenToToggle) => {
    setSelectedExamenes((prevSelected) =>
      prevSelected.find((ex) => ex.ID_EXAMEN === examenToToggle.ID_EXAMEN)
        ? prevSelected.filter((ex) => ex.ID_EXAMEN !== examenToToggle.ID_EXAMEN)
        : [...prevSelected, examenToToggle]
    );
  };

  const handleToggleSelectAllExamenes = () => {
    const currentExamenIdsOnPage = currentExamenesPaginados.map(
      (ex) => ex.ID_EXAMEN
    );
    const allOnPageSelected =
      currentExamenesPaginados.length > 0 &&
      currentExamenesPaginados.every((ex) =>
        selectedExamenes.some((se) => se.ID_EXAMEN === ex.ID_EXAMEN)
      );

    if (allOnPageSelected) {
      setSelectedExamenes((prev) =>
        prev.filter((se) => !currentExamenIdsOnPage.includes(se.ID_EXAMEN))
      );
    } else {
      const newSelectionsFromPage = currentExamenesPaginados.filter(
        (ex) => !selectedExamenes.some((se) => se.ID_EXAMEN === ex.ID_EXAMEN)
      );
      setSelectedExamenes((prev) => [...prev, ...newSelectionsFromPage]);
    }
  };

  const closeModal = () =>
    setModal({ type: null, entity: null, data: null, show: false });

  const openModal = (type, entity) => {
    let data = null;
    if (type === 'edit') {
      if (selectedExamenes.length !== 1) {
        displayMessage(
          setError,
          'Por favor, seleccione un único examen para editar.'
        );
        return;
      }
      data = selectedExamenes[0];
    } else if (type === 'delete') {
      if (selectedExamenes.length === 0) {
        displayMessage(
          setError,
          'Por favor, seleccione al menos un examen para eliminar.'
        );
        return;
      }
      data = selectedExamenes;
    }
    setModal({ type, entity, data, show: true });
  };

  const handleFormSubmit = async (formData) => {
    setIsProcessing(true);
    setError('');
    setSuccess('');
    try {
      if (modal.type === 'add') {
        await api.post('/examen', formData);
        displayMessage(setSuccess, 'Examen creado con éxito');
      } else if (modal.type === 'edit' && modal.data) {
        await api.put(`/examen/${modal.data.ID_EXAMEN}`, formData);
        displayMessage(setSuccess, 'Examen actualizado con éxito');
      }
      await loadExamenes();
      closeModal();
    } catch (err) {
      displayMessage(
        setError,
        'Error al guardar el examen: ' +
          (err.response?.data?.error || err.message)
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteExamen = async () => {
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

    try {
      for (const examenToDelete of modal.data) {
        try {
          await api.delete(`/examen/${examenToDelete.ID_EXAMEN}`);
          successCount++;
        } catch (err) {
          errorCount++;
          const specificError =
            err.response?.data?.error ||
            err.message ||
            `Error eliminando ${examenToDelete.NOMBRE_EXAMEN || examenToDelete.ID_EXAMEN}`;
          errorMessages.push(specificError);
        }
      }

      if (successCount > 0) {
        displayMessage(
          setSuccess,
          `${successCount} examen(es) eliminado(s) con éxito.`
        );
      }
      if (errorCount > 0) {
        displayMessage(
          setError,
          `Error al eliminar ${errorCount} examen(es): ${errorMessages.join('; ')}`
        );
      }

      if (successCount > 0) {
        await loadExamenes();
      } else {
        setSelectedExamenes([]);
      }
      closeModal();
    } catch (err) {
      displayMessage(
        setError,
        'Error general durante la eliminación: ' +
          (err.response?.data?.error || err.message)
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFilterChange = useCallback((changedFilters) => {
    setFilters((prevFilters) => {
      const newFilters = { ...prevFilters, ...changedFilters };
      if (changedFilters.escuela !== undefined) {
        newFilters.carrera = '';
        newFilters.asignatura = '';
        newFilters.seccion = '';
      } else if (changedFilters.carrera !== undefined) {
        newFilters.asignatura = '';
        newFilters.seccion = '';
      } else if (changedFilters.asignatura !== undefined) {
        newFilters.seccion = '';
      }
      return newFilters;
    });
    setCurrentPage(1);
    setSelectedExamenes([]);
  }, []);

  const carrerasOptions = useMemo(() => {
    if (!filters.escuela) return allCarreras;
    return allCarreras.filter(
      (c) => String(c.ESCUELA_ID_ESCUELA) === String(filters.escuela)
    );
  }, [filters.escuela, allCarreras]);

  const asignaturasOptions = useMemo(() => {
    if (!filters.carrera) return allAsignaturas;
    return allAsignaturas.filter(
      (a) => String(a.CARRERA_ID_CARRERA) === String(filters.carrera)
    );
  }, [filters.carrera, allAsignaturas]);

  const seccionesOptions = useMemo(() => {
    if (!filters.asignatura) return allSecciones;
    return allSecciones.filter(
      (s) => String(s.ASIGNATURA_ID_ASIGNATURA) === String(filters.asignatura)
    );
  }, [filters.asignatura, allSecciones]);

  const filteredExamenes = useMemo(() => {
    return processedExamenes.filter((examen) => {
      const matchesText =
        !filters.text ||
        (examen.NOMBRE_EXAMEN &&
          normalizeText(examen.NOMBRE_EXAMEN).includes(
            normalizeText(filters.text)
          ));
      const matchesEscuela =
        !filters.escuela ||
        String(examen.DERIVED_ESCUELA_ID) === String(filters.escuela);
      const matchesCarrera =
        !filters.carrera ||
        String(examen.DERIVED_CARRERA_ID) === String(filters.carrera);
      const matchesAsignatura =
        !filters.asignatura ||
        String(examen.DERIVED_ASIGNATURA_ID) === String(filters.asignatura);
      const matchesSeccion =
        !filters.seccion ||
        String(examen.DERIVED_SECCION_ID) === String(filters.seccion);
      const matchesEstado =
        !filters.estado || examen.NOMBRE_ESTADO === filters.estado;
      return (
        matchesText &&
        matchesEscuela &&
        matchesCarrera &&
        matchesAsignatura &&
        matchesSeccion &&
        matchesEstado
      );
    });
  }, [processedExamenes, filters]);

  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentExamenesPaginados = filteredExamenes.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // --- RENDERIZADO DEL MODAL DE ELIMINACIÓN (LÓGICA UNIFICADA) ---
  const renderDeleteModalContent = () => {
    if (!modal.data || modal.data.length === 0)
      return <p>No hay elementos seleccionados.</p>;

    let itemsToDelete = modal.data;
    let itemName = 'examen';
    let deleteHandler = handleDeleteExamen;
    let icon = 'bi bi-file-earmark-text-fill';

    let itemsToList = itemsToDelete.map((item) => ({
      key: item.ID_EXAMEN,
      name: item.NOMBRE_EXAMEN,
    }));

    let consequences = (
      <ul>
        <li>
          Todas las <strong>Reservas</strong> de salas y horarios asociadas a
          este/os examen/es.
        </li>
        <li>
          Las <strong>confirmaciones y solicitudes de revisión</strong> de los
          docentes.
        </li>
      </ul>
    );

    return (
      <div>
        <p>
          ¿Está seguro de que desea eliminar {itemsToDelete.length}{' '}
          {itemsToDelete.length > 1 ? 'exámenes' : 'examen'}?
        </p>

        <ul className="list-unstyled my-3 p-3 border bg-light rounded">
          {itemsToList.map((item) => (
            <li key={item.key}>
              <i className={`${icon} me-2`}></i>
              {item.name || `Examen sin nombre (ID: ${item.key})`}
            </li>
          ))}
        </ul>

        <Alert variant="danger" className="mt-3">
          <Alert.Heading>
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            ¡Atención! Esta acción es irreversible.
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

  return (
    <Layout>
      <div className="container-fluid pt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="display-6">
            <i className="bi bi-file-earmark-text-fill me-3"></i>
            Gestión de Exámenes
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

        <ExamenFilter
          escuelas={allEscuelas}
          carreras={carrerasOptions}
          asignaturas={asignaturasOptions}
          secciones={seccionesOptions}
          estados={estadosExamen}
          onFilterChange={handleFilterChange}
          currentFilters={filters}
        />
        <ExamenActions
          onAdd={() => openModal('add', 'examen')}
          onEdit={() => openModal('edit', 'examen')}
          onDelete={() => openModal('delete', 'examen')}
          selectedExamenes={selectedExamenes}
          disabled={loading || isProcessing}
        />

        {loading && filteredExamenes.length === 0 ? (
          <div className="text-center">
            <Spinner animation="border" variant="primary" />
            <p>Cargando exámenes...</p>
          </div>
        ) : (
          <>
            <ExamenList
              examenes={currentExamenesPaginados}
              selectedExamenes={selectedExamenes}
              onToggleExamenSelection={handleToggleExamenSelection}
              onToggleSelectAllExamenes={handleToggleSelectAllExamenes}
              loading={loading && examenes.length > 0}
            />
            {filteredExamenes.length > ITEMS_PER_PAGE && (
              <PaginationComponent
                itemsPerPage={ITEMS_PER_PAGE}
                totalItems={filteredExamenes.length}
                paginate={paginate}
                currentPage={currentPage}
              />
            )}
          </>
        )}
      </div>

      {modal.show && modal.entity === 'examen' && (
        <Modal
          title={`${modal.type === 'add' ? 'Agregar' : modal.type === 'edit' ? 'Editar' : 'Eliminar'} Examen`}
          onClose={closeModal}
        >
          {modal.type === 'delete' ? (
            renderDeleteModalContent()
          ) : (
            <ExamenForm
              onSubmit={handleFormSubmit}
              initial={modal.data}
              onCancel={closeModal}
              isProcessing={isProcessing}
            />
          )}
        </Modal>
      )}
    </Layout>
  );
}
