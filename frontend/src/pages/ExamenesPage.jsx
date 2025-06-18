// src/pages/ExamenesPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Layout from '../components/Layout';
import ExamenForm from '../components/examenes/ExamenForm';
import ExamenActions from '../components/examenes/ExamenActions';
import ExamenList from '../components/examenes/ExamenList';
import ExamenFilter from '../components/examenes/ExamenFilter'; // <-- IMPORTAR NUEVO COMPONENTE
import PaginationComponent from '../components/PaginationComponent'; // <-- IMPORTAR PAGINACIÓN
import {
  Alert,
  Modal as BootstrapModal,
  Button as BsButton,
  Spinner,
} from 'react-bootstrap'; // Usar Modal y Button de react-bootstrap
import api from '../services/api'; // <-- USA TU INSTANCIA DE AXIOS CONFIGURADA (api.js)

// Importar los servicios reales
import { fetchAllEscuelas } from '../services/escuelaService';
import { fetchAllCarreras } from '../services/carreraService';
import { fetchAllAsignaturas } from '../services/asignaturaService';
import { fetchAllSecciones } from '../services/seccionService';

const ITEMS_PER_PAGE = 6; // Cambiado a 6 filas por página

const normalizeText = (text) => {
  if (!text) return '';
  return text
    .normalize('NFD') // Descomponer caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Eliminar
    .toLowerCase(); // Convertir a minúsculas
};

export default function ExamenesPage() {
  const [examenes, setExamenes] = useState([]);
  const [processedExamenes, setProcessedExamenes] = useState([]); // Estado para exámenes enriquecidos
  const [selectedExamenes, setSelectedExamenes] = useState([]); // Para la selección múltiple
  const [loading, setLoading] = useState(true); // Inicia en true para la carga inicial
  const [isProcessing, setIsProcessing] = useState(false); // Para acciones CRUD en el modal
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // const [showModal, setShowModal] = useState(false); // Se manejará con modal.show
  const [modal, setModal] = useState({
    type: null,
    entity: null,
    data: null,
    show: false,
  });
  const [currentPage, setCurrentPage] = useState(1);

  // State para filtros
  const [filters, setFilters] = useState({
    text: '',
    escuela: '',
    carrera: '',
    asignatura: '',
    seccion: '',
    estado: '',
  });

  // State para datos de los dropdowns del filtro
  const [allEscuelas, setAllEscuelas] = useState([]);
  const [allCarreras, setAllCarreras] = useState([]);
  const [allAsignaturas, setAllAsignaturas] = useState([]);
  const [allSecciones, setAllSecciones] = useState([]);
  const estadosExamen = useMemo(
    () => [
      { value: '', label: 'Todos los estados' },
      { value: 'ACTIVO', label: 'ACTIVO' }, // <--- CAMBIO AQUÍ
      { value: 'PROGRAMADO', label: 'PROGRAMADO' },
      // Puedes añadir más estados si son necesarios para filtrar
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
      const response = await api.get('/examen'); // Usa tu instancia de Axios
      setCurrentPage(1); // Resetear página en nueva carga
      setExamenes(Array.isArray(response.data) ? response.data : []); // Asegura que sea un array
      setSelectedExamenes([]); // Limpiar selección al recargar
    } catch (err) {
      console.error('Error al cargar los exámenes:', err);
      // setError(
      //   err.response?.data?.error ||
      //     err.message ||
      //     'Error al cargar los exámenes. Intente más tarde.'
      // );
      setExamenes([]); // Devuelve array vacío en caso de error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExamenes();

    // Cargar datos para los filtros
    const loadFilterData = async () => {
      try {
        // En un futuro, podrías tener un estado de carga para los filtros también
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

  // Efecto para procesar exámenes una vez que todos los datos necesarios estén cargados
  useEffect(() => {
    if (
      examenes.length > 0 &&
      allSecciones.length > 0 &&
      allAsignaturas.length > 0 &&
      allCarreras.length > 0 &&
      allEscuelas.length > 0
    ) {
      // console.log('Iniciando enriquecimiento de exámenes...');
      const examenesEnriquecidos = examenes.map((ex) => {
        // console.log(`--- Procesando examen original ID: ${ex.ID_EXAMEN}`, ex);

        // Asumimos que el examen tiene SECCION_ID_SECCION o SECCION_ID
        // Y que SECCION_ID_SECCION es el más probable según ExamenList.jsx
        let seccionIdDelExamen = ex.SECCION_ID_SECCION || ex.SECCION_ID;

        // Intento de fallback: Si no hay ID de sección, pero sí NOMBRE_SECCION, buscar por nombre.
        // Esto es menos robusto que tener el ID directamente.
        if (!seccionIdDelExamen && ex.NOMBRE_SECCION) {
          const seccionPorNombre = allSecciones.find(
            (s) =>
              s.NOMBRE_SECCION === ex.NOMBRE_SECCION ||
              s.CODIGO_SECCION === ex.NOMBRE_SECCION
          ); // Comparamos con NOMBRE_SECCION o CODIGO_SECCION
          if (seccionPorNombre) {
            seccionIdDelExamen = seccionPorNombre.ID_SECCION;
            // console.log(
            //   `  Fallback: ID de Sección encontrado por NOMBRE_SECCION '${ex.NOMBRE_SECCION}': ${seccionIdDelExamen}`
            // );
          }
        }
        // console.log(`  ID de Sección obtenido de 'ex': ${seccionIdDelExamen}`);
        const seccion = seccionIdDelExamen
          ? allSecciones.find(
              (s) => String(s.ID_SECCION) === String(seccionIdDelExamen)
            )
          : null;
        // console.log(`  Objeto 'seccion' encontrado:`, seccion);

        // Asumimos que la sección tiene ASIGNATURA_ID_ASIGNATURA o similar
        // VERIFICA EL NOMBRE DE LA PROPIEDAD 'ASIGNATURA_ID_ASIGNATURA' EN TUS OBJETOS 'seccion'
        const asignaturaIdDesdeSeccion = seccion
          ? seccion.ASIGNATURA_ID_ASIGNATURA // <-- VERIFICA Y AJUSTA SI ES NECESARIO
          : null;
        // console.log(
        //   `  ID de Asignatura obtenido de 'seccion': ${asignaturaIdDesdeSeccion}`
        // );

        // O si el examen tiene un ID de asignatura directo:
        let asignaturaIdDelExamen =
          ex.ASIGNATURA_ID || asignaturaIdDesdeSeccion;

        // Intento de fallback: Si no hay ID de asignatura (directo o de sección), pero sí NOMBRE_ASIGNATURA, buscar por nombre.
        if (!asignaturaIdDelExamen && ex.NOMBRE_ASIGNATURA) {
          const asignaturaPorNombre = allAsignaturas.find(
            (a) => a.NOMBRE_ASIGNATURA === ex.NOMBRE_ASIGNATURA
          );
          if (asignaturaPorNombre) {
            asignaturaIdDelExamen = asignaturaPorNombre.ID_ASIGNATURA;
            // console.log(
            //   `  Fallback: ID de Asignatura encontrado por NOMBRE_ASIGNATURA '${ex.NOMBRE_ASIGNATURA}': ${asignaturaIdDelExamen}`
            // );
          }
        }
        // console.log(
        //   `  ID de Asignatura final para búsqueda: ${asignaturaIdDelExamen} (de ex.ASIGNATURA_ID: ${ex.ASIGNATURA_ID})`
        // );
        const asignatura = asignaturaIdDelExamen
          ? allAsignaturas.find(
              (a) => String(a.ID_ASIGNATURA) === String(asignaturaIdDelExamen)
            )
          : null;
        // console.log(`  Objeto 'asignatura' encontrado:`, asignatura);

        // Asumimos que la asignatura tiene CARRERA_ID_CARRERA o similar
        // VERIFICA EL NOMBRE DE LA PROPIEDAD 'CARRERA_ID_CARRERA' EN TUS OBJETOS 'asignatura'
        const carreraIdDesdeAsignatura = asignatura
          ? asignatura.CARRERA_ID_CARRERA // <-- VERIFICA Y AJUSTA SI ES NECESARIO
          : null;
        // console.log(
        //   `  ID de Carrera obtenido de 'asignatura': ${carreraIdDesdeAsignatura}`
        // );

        const carrera = carreraIdDesdeAsignatura
          ? allCarreras.find(
              (c) => String(c.ID_CARRERA) === String(carreraIdDesdeAsignatura)
            )
          : null;
        // console.log(`  Objeto 'carrera' encontrado:`, carrera);

        // Asumimos que la carrera tiene ESCUELA_ID_ESCUELA o similar
        // VERIFICA EL NOMBRE DE LA PROPIEDAD 'ESCUELA_ID_ESCUELA' EN TUS OBJETOS 'carrera'
        const escuelaIdDesdeCarrera = carrera
          ? carrera.ESCUELA_ID_ESCUELA // <-- VERIFICA Y AJUSTA SI ES NECESARIO
          : null;
        // console.log(
        //   `  ID de Escuela obtenido de 'carrera': ${escuelaIdDesdeCarrera}`
        // );

        // const escuela = escuelaIdDesdeCarrera ? allEscuelas.find(e => String(e.ID_ESCUELA) === String(escuelaIdDesdeCarrera)) : null; // No necesitamos el objeto escuela, solo el ID

        return {
          ...ex,
          // Guardamos los IDs derivados para el filtrado. Usa los nombres de propiedad que esperas en filteredExamenes.
          // Estos son los que usaremos para comparar con filters.escuela, filters.carrera, etc.
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
      // console.log(
      //   'Exámenes enriquecidos:',
      //   examenesEnriquecidos.length > 0 ? examenesEnriquecidos[0] : 'Ninguno'
      // );
      setProcessedExamenes(examenesEnriquecidos);
    } else {
      // Si alguna de las listas base no está cargada, o no hay exámenes,
      // es posible que quieras limpiar processedExamenes o manejarlo de otra forma.
      if (examenes.length === 0) {
        // Si no hay exámenes originales, no hay nada que procesar.
        setProcessedExamenes([]);
      }
    }
  }, [examenes, allEscuelas, allCarreras, allAsignaturas, allSecciones]);

  useEffect(() => {
    let timer;
    if (success) {
      timer = setTimeout(() => setSuccess(''), 3000);
    }
    if (error) {
      timer = setTimeout(() => setError(''), 5000);
    }
    return () => clearTimeout(timer);
  }, [success, error]);

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

  const openModalHandler = (type, entityName, entityPayload = null) => {
    let modalData = null;
    if (type === 'add') {
      setSelectedExamenes([]);
      setModal({ type, entity: entityName, data: null, show: true });
    } else if (type === 'edit' && entityPayload) {
      // entityPayload es el ID_EXAMEN
      modalData = examenes.find(
        (ex) => String(ex.ID_EXAMEN) === String(entityPayload)
      );
      if (!modalData) {
        displayMessage(setError, 'Examen no encontrado para editar.');
        return;
      }
      setModal({ type, entity: entityName, data: modalData, show: true });
    } else if (
      type === 'delete' &&
      Array.isArray(entityPayload) &&
      entityPayload.length > 0
    ) {
      setModal({
        type,
        entity: entityName,
        data: [...entityPayload],
        show: true,
      });
    }
  };

  const closeModalHandler = () => {
    setModal({ type: null, entity: null, data: null, show: false });
  };

  const handleFormSubmit = async (formData) => {
    setIsProcessing(true);
    setError('');
    setSuccess('');
    try {
      if (modal.type === 'add') {
        await api.post('/examen', formData); // Asume que formData tiene el formato correcto
        displayMessage(setSuccess, 'Examen creado con éxito');
      } else if (modal.type === 'edit' && modal.data) {
        await api.put(`/examen/${modal.data.ID_EXAMEN}`, formData);
        displayMessage(setSuccess, 'Examen actualizado con éxito');
      }
      await loadExamenes();
      closeModalHandler();
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
      closeModalHandler();
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
        await loadExamenes(); // Esto ya limpia selectedExamenes
      } else {
        setSelectedExamenes([]); // Limpiar selección si no hubo éxito
      }
      closeModalHandler();
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

  // Handler para el cambio de filtro
  const handleFilterChange = useCallback((changedFilters) => {
    setFilters((prevFilters) => {
      const newFilters = { ...prevFilters, ...changedFilters };

      // Si cambia la escuela, resetear carrera, asignatura y sección
      if (changedFilters.escuela !== undefined) {
        newFilters.carrera = '';
        newFilters.asignatura = '';
        newFilters.seccion = '';
      }
      // Si cambia la carrera, resetear asignatura y sección
      else if (changedFilters.carrera !== undefined) {
        newFilters.asignatura = '';
        newFilters.seccion = '';
      }
      // Si cambia la asignatura, resetear sección
      else if (changedFilters.asignatura !== undefined) {
        newFilters.seccion = '';
      }
      return newFilters;
    });
    setCurrentPage(1); // Resetear a la primera página al cambiar filtros
    setSelectedExamenes([]); // Limpiar selección al cambiar filtros
  }, []);

  // Opciones filtradas para los dropdowns
  const carrerasOptions = useMemo(() => {
    if (!filters.escuela) return allCarreras;
    // Asumimos que cada objeto carrera tiene una propiedad como ESCUELA_ID_ESCUELA o ID_ESCUELA
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

  // Aplicar el filtro y la búsqueda
  const filteredExamenes = useMemo(() => {
    // Usar processedExamenes en lugar de examenes
    return processedExamenes.filter((examen) => {
      const matchesText =
        !filters.text ||
        (examen.NOMBRE_EXAMEN &&
          normalizeText(examen.NOMBRE_EXAMEN).includes(
            normalizeText(filters.text)
          ));

      // --- Filtro Escuela ---
      // Usar el ID derivado
      const escuelaIdEnExamen = examen.DERIVED_ESCUELA_ID;
      const matchesEscuela =
        !filters.escuela ||
        (escuelaIdEnExamen !== undefined &&
          escuelaIdEnExamen !== null &&
          String(escuelaIdEnExamen) === String(filters.escuela));
      // console.log(
      //   `Examen Escuela ID: ${escuelaIdEnExamen}, Filtro Escuela: '${filters.escuela}', Coincide Escuela: ${matchesEscuela}`
      // );

      // --- Filtro Carrera ---
      const carreraIdEnExamen = examen.DERIVED_CARRERA_ID;
      const matchesCarrera =
        !filters.carrera ||
        (carreraIdEnExamen !== undefined &&
          carreraIdEnExamen !== null &&
          String(carreraIdEnExamen) === String(filters.carrera));
      // console.log(
      //   `Examen Carrera ID: ${carreraIdEnExamen}, Filtro Carrera: '${filters.carrera}', Coincide Carrera: ${matchesCarrera}`
      // );

      // --- Filtro Asignatura ---
      const asignaturaIdEnExamen = examen.DERIVED_ASIGNATURA_ID;
      const matchesAsignatura =
        !filters.asignatura ||
        (asignaturaIdEnExamen !== undefined &&
          asignaturaIdEnExamen !== null &&
          String(asignaturaIdEnExamen) === String(filters.asignatura));
      // console.log(
      //   `Examen Asignatura ID: ${asignaturaIdEnExamen}, Filtro Asignatura: '${filters.asignatura}', Coincide Asignatura: ${matchesAsignatura}`
      // );

      // --- Filtro Sección ---
      const seccionIdDelExamen = examen.DERIVED_SECCION_ID;
      const matchesSeccion =
        !filters.seccion ||
        (seccionIdDelExamen !== undefined &&
          seccionIdDelExamen !== null &&
          String(seccionIdDelExamen) === String(filters.seccion));
      // console.log(
      //   `Examen Sección ID: ${seccionIdDelExamen}, Filtro Sección: '${filters.seccion}', Coincide Sección: ${matchesSeccion}`
      // );

      // --- Filtro Estado ---
      const estadoEnExamen = examen.NOMBRE_ESTADO; // <-- CAMBIO AQUÍ: Usar NOMBRE_ESTADO
      let calculatedMatchesEstado;
      if (!filters.estado) {
        // Si el filtro es "Todos los estados"
        calculatedMatchesEstado = true;
      } else {
        calculatedMatchesEstado = estadoEnExamen === filters.estado;
      }
      const matchesEstado = calculatedMatchesEstado;
      // console.log(
      //   `Comparando ESTADO: Examen='${estadoEnExamen}' vs Filtro='${filters.estado}'. Coincide: ${matchesEstado}`
      // );

      const finalMatch =
        matchesText &&
        matchesEscuela &&
        matchesCarrera &&
        matchesAsignatura &&
        matchesSeccion &&
        matchesEstado;
      // console.log(
      //   'Resultado final de coincidencia para este examen:',
      //   finalMatch
      // );
      // console.log('----------------------------------------------------');

      return (
        matchesText &&
        matchesEscuela &&
        matchesCarrera &&
        matchesAsignatura &&
        matchesSeccion &&
        matchesEstado
      );
    }); // Fin de examenes.filter()
  }, [processedExamenes, filters]); // Depender de processedExamenes

  // Lógica de Paginación
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentExamenesPaginados = filteredExamenes.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  // Cambiar de página
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleAddAction = () => {
    openModalHandler('add', 'examen');
  };

  const handleEditAction = () => {
    if (selectedExamenes.length === 1) {
      openModalHandler('edit', 'examen', selectedExamenes[0].ID_EXAMEN);
    } else {
      displayMessage(
        setError,
        'Por favor, seleccione un único examen para editar.'
      );
    }
  };

  const handleDeleteAction = () => {
    if (selectedExamenes.length > 0) {
      openModalHandler('delete', 'examen', selectedExamenes);
    } else {
      displayMessage(
        setError,
        'Por favor, seleccione al menos un examen para eliminar.'
      );
    }
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

        {/* Filtro de Exámenes */}
        <ExamenFilter
          escuelas={allEscuelas} // El dropdown de escuelas siempre muestra todas
          carreras={carrerasOptions}
          asignaturas={asignaturasOptions}
          secciones={seccionesOptions}
          estados={estadosExamen}
          onFilterChange={handleFilterChange}
          currentFilters={filters}
        />
        <ExamenActions
          onAdd={handleAddAction}
          onEdit={handleEditAction}
          onDelete={handleDeleteAction}
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
              examenes={currentExamenesPaginados} // Usar la lista paginada y filtrada
              selectedExamenes={selectedExamenes}
              onToggleExamenSelection={handleToggleExamenSelection}
              onToggleSelectAllExamenes={handleToggleSelectAllExamenes}
              loading={loading && examenes.length > 0} // Mostrar loading en tabla si se está recargando pero ya hay datos
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

      {/* Modal para Crear/Editar Examen */}
      {modal.show && (modal.type === 'add' || modal.type === 'edit') && (
        <BootstrapModal
          show={modal.show}
          onHide={closeModalHandler}
          centered
          size="lg"
        >
          <BootstrapModal.Header closeButton>
            <BootstrapModal.Title>
              {modal.type === 'add' ? 'Agregar Nuevo Examen' : 'Editar Examen'}
            </BootstrapModal.Title>
          </BootstrapModal.Header>
          <BootstrapModal.Body>
            <ExamenForm
              onSubmit={handleFormSubmit} // ExamenForm espera 'onSubmit'
              initial={modal.type === 'edit' ? modal.data : null} // ExamenForm espera 'initial'
              onCancel={closeModalHandler} // ExamenForm espera 'onCancel'
              isProcessing={isProcessing}
            />
          </BootstrapModal.Body>
        </BootstrapModal>
      )}
      {/* Modal de Confirmación para Eliminar Examen */}
      {modal.show && modal.type === 'delete' && modal.data && (
        <BootstrapModal show={modal.show} onHide={closeModalHandler} centered>
          <BootstrapModal.Header closeButton>
            <BootstrapModal.Title>Confirmar Eliminación</BootstrapModal.Title>
          </BootstrapModal.Header>
          <BootstrapModal.Body>
            {modal.data && modal.data.length === 1 ? (
              <p>
                ¿Está seguro de que desea eliminar el examen "
                <strong>
                  {modal.data[0]?.NOMBRE_EXAMEN || 'seleccionado'}
                </strong>
                "?
              </p>
            ) : (
              <p>
                ¿Está seguro de que desea eliminar los{' '}
                <strong>{modal.data?.length}</strong> exámenes seleccionados?
              </p>
            )}
          </BootstrapModal.Body>
          <BootstrapModal.Footer>
            <BsButton
              variant="secondary"
              onClick={closeModalHandler}
              disabled={isProcessing}
            >
              Cancelar
            </BsButton>
            <BsButton
              variant="danger"
              onClick={handleDeleteExamen}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Spinner as="span" size="sm" animation="border" />
              ) : (
                'Eliminar'
              )}
            </BsButton>
          </BootstrapModal.Footer>
        </BootstrapModal>
      )}
    </Layout>
  );
}
