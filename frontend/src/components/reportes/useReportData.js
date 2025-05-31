import { useState, useCallback, useEffect } from 'react';

// --- NUEVAS IMPORTACIONES ---
// Asegúrate de tener estos archivos de servicio y sus funciones correspondientes
import { fetchAllSedes } from '../../services/sedeService';
import { fetchEscuelasBySede } from '../../services/escuelaService';
import { fetchCarrerasByEscuela } from '../../services/carreraService';
import { fetchAsignaturasByCarrera } from '../../services/asignaturaService';
import { fetchSeccionesByAsignatura } from '../../services/seccionService';
import { fetchAllJornadas } from '../../services/jornadaService';
import { fetchAllEstados } from '../../services/estadoService';
import { fetchAllDocentes } from '../../services/usuarioService';

export const useReportData = (reportConfig) => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Se inicializa con el config del reporte o un objeto vacío para evitar errores
  const [filters, setFilters] = useState(reportConfig?.initialFilters || {});
  const [tempFilters, setTempFilters] = useState(
    reportConfig?.initialFilters || {}
  );

  const [filterOptions, setFilterOptions] = useState({
    sedes: [],
    escuelas: [],
    carreras: [],
    asignaturas: [],
    secciones: [], // <-- NUEVO ESTADO PARA LAS SECCIONES
    jornadas: [],
    estados: [],
    docentes: [],
  });

  // --- NUEVO EFECTO ---
  // Resetea el estado cuando el tipo de reporte cambia
  useEffect(() => {
    if (reportConfig) {
      setFilters(reportConfig.initialFilters);
      setTempFilters(reportConfig.initialFilters);
      setData([]); // Limpiamos los datos del reporte anterior
      // Limpiamos las opciones para que se recarguen si es necesario
      setFilterOptions({
        sedes: [],
        escuelas: [],
        carreras: [],
        asignaturas: [],
        secciones: [],
        jornadas: [],
        estados: [],
        docentes: [],
      });
    }
  }, [reportConfig]);

  const loadReportData = useCallback(async () => {
    if (!reportConfig) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await reportConfig.serviceFn(filters);
      setData(data);
    } catch (err) {
      setError(
        `Error al cargar el reporte: ${err.response?.data?.details || err.message}`
      );
    } finally {
      setIsLoading(false);
    }
  }, [filters, reportConfig]);

  const loadFilterOptions = useCallback(async () => {
    try {
      const [sedesData, jornadasData, estadosData, docentesData] =
        await Promise.all([
          fetchAllSedes(),
          fetchAllJornadas(),
          fetchAllEstados(),
          fetchAllDocentes(),
        ]);
      setFilterOptions((prev) => ({
        ...prev,
        sedes: sedesData || [],
        jornadas: jornadasData || [],
        estados: estadosData || [],
        docentes: docentesData || [],
      }));
    } catch (err) {
      console.error('Error cargando opciones de filtro', err);
      setError('No se pudieron cargar las opciones de filtro.');
    }
  }, []);

  // --- LÓGICA DE CASCADA COMPLETA ---
  const handleTempFilterChange = useCallback(
    async (name, value) => {
      const newTempFilters = { ...tempFilters, [name]: value };

      if (name === 'sedeId') {
        newTempFilters.escuelaId = '';
        newTempFilters.carreraId = '';
        newTempFilters.asignaturaId = '';
        newTempFilters.seccionId = '';
        setFilterOptions((prev) => ({
          ...prev,
          escuelas: [],
          carreras: [],
          asignaturas: [],
          secciones: [],
        }));
        if (value) {
          const escuelas = await fetchEscuelasBySede(value);
          setFilterOptions((prev) => ({ ...prev, escuelas: escuelas || [] }));
        }
      } else if (name === 'escuelaId') {
        newTempFilters.carreraId = '';
        newTempFilters.asignaturaId = '';
        newTempFilters.seccionId = '';
        setFilterOptions((prev) => ({
          ...prev,
          carreras: [],
          asignaturas: [],
          secciones: [],
        }));
        if (value) {
          const carreras = await fetchCarrerasByEscuela(value);
          setFilterOptions((prev) => ({ ...prev, carreras: carreras || [] }));
        }
      } else if (name === 'carreraId') {
        newTempFilters.asignaturaId = '';
        newTempFilters.seccionId = '';
        setFilterOptions((prev) => ({
          ...prev,
          asignaturas: [],
          secciones: [],
        }));
        if (value) {
          const asignaturas = await fetchAsignaturasByCarrera(value);
          setFilterOptions((prev) => ({
            ...prev,
            asignaturas: asignaturas || [],
          }));
        }
      } else if (name === 'asignaturaId') {
        newTempFilters.seccionId = '';
        setFilterOptions((prev) => ({ ...prev, secciones: [] }));
        if (value) {
          const secciones = await fetchSeccionesByAsignatura(value);
          setFilterOptions((prev) => ({ ...prev, secciones: secciones || [] }));
        }
      }

      setTempFilters(newTempFilters);
    },
    [tempFilters]
  );

  const applyFilters = () => {
    setFilters(tempFilters);
  };

  const resetTempFilters = () => {
    setTempFilters(filters);
  };

  return {
    data,
    isLoading,
    error,
    filters,
    tempFilters,
    filterOptions,
    loadReportData,
    loadFilterOptions,
    handleTempFilterChange,
    applyFilters,
    resetTempFilters,
  };
};
