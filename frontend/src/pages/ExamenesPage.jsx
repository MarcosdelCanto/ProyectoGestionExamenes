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

const ITEMS_PER_PAGE = 10;

export default function ExamenesPage() {
  const [examenes, setExamenes] = useState([]);
  const [processedExamenes, setProcessedExamenes] = useState([]); // Estado para exámenes enriquecidos
  const [selectedExamenId, setSelectedExamenId] = useState(null); // Cambiado a selectedExamenId para manejar solo el ID
  const [loading, setLoading] = useState(true); // Inicia en true para la carga inicial
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null); // 'add', 'edit', 'delete'
  const [currentExamenData, setCurrentExamenData] = useState(null); // Para editar o eliminar
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

  const loadExamenes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Asumimos que tu endpoint en examen.routes.js para GET / es getAllExamenes
      // y que está montado en /api/examen en server.js
      const response = await api.get('/examen'); // Usa tu instancia de Axios
      setCurrentPage(1); // Resetear página en nueva carga
      setExamenes(Array.isArray(response.data) ? response.data : []); // Asegura que sea un array
    } catch (err) {
      console.error('Error al cargar los exámenes:', err);
      setError(
        err.response?.data?.error ||
          err.message ||
          'Error al cargar los exámenes. Intente más tarde.'
      );
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
        console.error('Error cargando datos para filtros:', error);
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
      console.log('Iniciando enriquecimiento de exámenes...');
      const examenesEnriquecidos = examenes.map((ex) => {
        console.log(`--- Procesando examen original ID: ${ex.ID_EXAMEN}`, ex);

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
            console.log(
              `  Fallback: ID de Sección encontrado por NOMBRE_SECCION '${ex.NOMBRE_SECCION}': ${seccionIdDelExamen}`
            );
          }
        }
        console.log(`  ID de Sección obtenido de 'ex': ${seccionIdDelExamen}`);
        const seccion = seccionIdDelExamen
          ? allSecciones.find(
              (s) => String(s.ID_SECCION) === String(seccionIdDelExamen)
            )
          : null;
        console.log(`  Objeto 'seccion' encontrado:`, seccion);

        // Asumimos que la sección tiene ASIGNATURA_ID_ASIGNATURA o similar
        // VERIFICA EL NOMBRE DE LA PROPIEDAD 'ASIGNATURA_ID_ASIGNATURA' EN TUS OBJETOS 'seccion'
        const asignaturaIdDesdeSeccion = seccion
          ? seccion.ASIGNATURA_ID_ASIGNATURA // <-- VERIFICA Y AJUSTA SI ES NECESARIO
          : null;
        console.log(
          `  ID de Asignatura obtenido de 'seccion': ${asignaturaIdDesdeSeccion}`
        );

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
            console.log(
              `  Fallback: ID de Asignatura encontrado por NOMBRE_ASIGNATURA '${ex.NOMBRE_ASIGNATURA}': ${asignaturaIdDelExamen}`
            );
          }
        }
        console.log(
          `  ID de Asignatura final para búsqueda: ${asignaturaIdDelExamen} (de ex.ASIGNATURA_ID: ${ex.ASIGNATURA_ID})`
        );
        const asignatura = asignaturaIdDelExamen
          ? allAsignaturas.find(
              (a) => String(a.ID_ASIGNATURA) === String(asignaturaIdDelExamen)
            )
          : null;
        console.log(`  Objeto 'asignatura' encontrado:`, asignatura);

        // Asumimos que la asignatura tiene CARRERA_ID_CARRERA o similar
        // VERIFICA EL NOMBRE DE LA PROPIEDAD 'CARRERA_ID_CARRERA' EN TUS OBJETOS 'asignatura'
        const carreraIdDesdeAsignatura = asignatura
          ? asignatura.CARRERA_ID_CARRERA // <-- VERIFICA Y AJUSTA SI ES NECESARIO
          : null;
        console.log(
          `  ID de Carrera obtenido de 'asignatura': ${carreraIdDesdeAsignatura}`
        );

        const carrera = carreraIdDesdeAsignatura
          ? allCarreras.find(
              (c) => String(c.ID_CARRERA) === String(carreraIdDesdeAsignatura)
            )
          : null;
        console.log(`  Objeto 'carrera' encontrado:`, carrera);

        // Asumimos que la carrera tiene ESCUELA_ID_ESCUELA o similar
        // VERIFICA EL NOMBRE DE LA PROPIEDAD 'ESCUELA_ID_ESCUELA' EN TUS OBJETOS 'carrera'
        const escuelaIdDesdeCarrera = carrera
          ? carrera.ESCUELA_ID_ESCUELA // <-- VERIFICA Y AJUSTA SI ES NECESARIO
          : null;
        console.log(
          `  ID de Escuela obtenido de 'carrera': ${escuelaIdDesdeCarrera}`
        );

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
      console.log(
        'Exámenes enriquecidos:',
        examenesEnriquecidos.length > 0 ? examenesEnriquecidos[0] : 'Ninguno'
      );
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

  const openModalHandler = (type, examenId = null) => {
    setModalType(type);
    if ((type === 'edit' || type === 'delete') && examenId) {
      const examenToProcess = examenes.find((e) => e.ID_EXAMEN === examenId);
      setCurrentExamenData(examenToProcess || null);
    } else {
      setCurrentExamenData(null); // Para 'add'
    }
    setShowModal(true);
  };

  const closeModalHandler = () => {
    setShowModal(false);
    setModalType(null);
    setCurrentExamenData(null);
  };

  const handleFormSubmit = async (formData) => {
    setLoading(true); // Para indicar procesamiento
    try {
      if (modalType === 'add') {
        await api.post('/examen', formData); // Asume que formData tiene el formato correcto
        setSuccess('Examen creado con éxito');
      } else if (modalType === 'edit' && currentExamenData) {
        await api.put(`/examen/${currentExamenData.ID_EXAMEN}`, formData);
        setSuccess('Examen actualizado con éxito');
      }
      await loadExamenes();
      closeModalHandler();
    } catch (err) {
      setError(
        err.response?.data?.error || err.message || 'Error al guardar el examen'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExamen = async () => {
    if (!currentExamenData) return;
    setLoading(true);
    try {
      await api.delete(`/examen/${currentExamenData.ID_EXAMEN}`);
      setSuccess('Examen eliminado con éxito');
      await loadExamenes();
      setSelectedExamenId(null); // Deseleccionar
      closeModalHandler();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.message ||
          'Error al eliminar el examen'
      );
    } finally {
      setLoading(false);
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
      // DEBUG: Muestra el examen actual y los filtros aplicados
      // console.log(
      //   `--- Filtrando examen ID: ${examen.ID_EXAMEN}, Nombre: ${examen.NOMBRE_EXAMEN} ---`
      // );
      // console.log('Filtros actuales:', JSON.stringify(filters));

      const matchesText =
        !filters.text ||
        (examen.NOMBRE_EXAMEN && // Asegúrate que NOMBRE_EXAMEN exista
          examen.NOMBRE_EXAMEN.toLowerCase().includes(
            filters.text.toLowerCase()
          ));

      // console.log(`Examen: ${examen.NOMBRE_EXAMEN}, Filtro Texto: '${filters.text}', Coincide Texto: ${matchesText}`);

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
      console.log(
        `Comparando ESTADO: Examen='${estadoEnExamen}' vs Filtro='${filters.estado}'. Coincide: ${matchesEstado}`
      );

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

        <ExamenActions
          onAdd={() => openModalHandler('add')}
          onEdit={() => {
            // El botón debe estar deshabilitado por ExamenActions si no hay selectedExamenId
            if (selectedExamenId) {
              openModalHandler('edit', selectedExamenId);
            } else {
              console.warn(
                'Intento de editar sin examen seleccionado. El botón debería estar deshabilitado.'
              );
            }
          }}
          onDelete={() => {
            // El botón debe estar deshabilitado por ExamenActions si no hay selectedExamenId
            if (selectedExamenId) {
              openModalHandler('delete', selectedExamenId);
            } else {
              console.warn(
                'Intento de eliminar sin examen seleccionado. El botón debería estar deshabilitado.'
              );
            }
          }}
          isExamenSelected={!!selectedExamenId} // Para habilitar/deshabilitar botones
        />

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

        {loading && filteredExamenes.length === 0 ? (
          <div className="text-center">
            <Spinner animation="border" variant="primary" />
            <p>Cargando exámenes...</p>
          </div>
        ) : (
          <>
            <ExamenList
              examenes={currentExamenesPaginados} // Usar la lista paginada y filtrada
              selectedExamenId={selectedExamenId}
              onSelectExamen={setSelectedExamenId}
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
      {showModal && (modalType === 'add' || modalType === 'edit') && (
        <BootstrapModal
          show={showModal}
          onHide={closeModalHandler}
          centered
          size="lg"
        >
          <BootstrapModal.Header closeButton>
            <BootstrapModal.Title>
              {modalType === 'add' ? 'Agregar Nuevo Examen' : 'Editar Examen'}
            </BootstrapModal.Title>
          </BootstrapModal.Header>
          <BootstrapModal.Body>
            <ExamenForm
              onSubmit={handleFormSubmit} // ExamenForm espera 'onSubmit'
              initial={modalType === 'edit' ? currentExamenData : null} // ExamenForm espera 'initial'
              onCancel={closeModalHandler} // ExamenForm espera 'onCancel'
              // isProcessing={loading} // ExamenForm no usa esta prop actualmente, pero podría añadirse para deshabilitar el form
            />
          </BootstrapModal.Body>
        </BootstrapModal>
      )}
      {/* Modal de Confirmación para Eliminar Examen */}
      {showModal && modalType === 'delete' && currentExamenData && (
        <BootstrapModal show={showModal} onHide={closeModalHandler} centered>
          <BootstrapModal.Header closeButton>
            <BootstrapModal.Title>Confirmar Eliminación</BootstrapModal.Title>
          </BootstrapModal.Header>
          <BootstrapModal.Body>
            <p>
              ¿Está seguro de que desea eliminar el examen "
              <strong>{currentExamenData.NOMBRE_EXAMEN}</strong>"?
            </p>
          </BootstrapModal.Body>
          <BootstrapModal.Footer>
            <BsButton
              variant="secondary"
              onClick={closeModalHandler}
              disabled={loading}
            >
              Cancelar
            </BsButton>
            <BsButton
              variant="danger"
              onClick={handleDeleteExamen}
              disabled={loading}
            >
              {loading ? (
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
