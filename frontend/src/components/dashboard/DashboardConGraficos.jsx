import React, { useState, useEffect } from 'react';
import {
  getExamenesPorCarreraData,
  getModulosAgendadosData,
  getUsoSalasData,
  getExamenesPorDiaData,
} from '../../services/dashboardService'; // Importar funciones del servicio
import Modal from 'react-modal';
import * as XLSX from 'xlsx';
// import api from '../../services/api'; // Ya no es necesario para cargar opciones de filtros directamente aquí
import { fetchAllSedes, createSede } from '../../services/sedeService';
import { fetchEscuelasBySede } from '../../services/escuelaService';
import { fetchCarrerasByEscuela } from '../../services/carreraService';
import { fetchAsignaturasByCarrera } from '../../services/asignaturaService';
import { fetchEdificiosBySede } from '../../services/edificioService';
import { fetchAllJornadas } from '../../services/jornadaService';
import { fetchAllEstados } from '../../services/estadoService';
import { FaFilter, FaTable, FaChartBar, FaFileExcel } from 'react-icons/fa';

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import './DashboardConGraficos.css'; // Crearemos este archivo para estilos adicionales

// Configuración de React Modal
Modal.setAppElement('#root'); // Asegúrate que '#root' es el ID de tu elemento raíz de la aplicación

const COLORS = [
  '#0d6efd',
  '#198754',
  '#ffc107',
  '#dc3545',
  '#6f42c1',
  '#fd7e14',
]; // Colores de Bootstrap, añadí más por si acaso

const initialChartState = {
  data: [],
  isLoading: true,
  error: null,
  isFilterModalOpen: false,
  showTable: false,
  filters: {},
  filterOptions: {}, // Para selectores: { sedes: [], escuelas: [], etc. }
  tempFilters: {}, // Filtros temporales mientras el modal está abierto
};

const DashboardConGraficos = () => {
  const [examenesCarrera, setExamenesCarrera] = useState({
    ...initialChartState,
    filters: {
      sedeId: '',
      escuelaId: '',
      carreraId: '',
      fechaDesde: '',
      fechaHasta: '',
    },
    tempFilters: {
      sedeId: '',
      escuelaId: '',
      carreraId: '',
      fechaDesde: '',
      fechaHasta: '',
    },
  });
  const [modulosAgendados, setModulosAgendados] = useState({
    ...initialChartState,
    filters: {
      jornadaId: '',
      fechaDesde: '',
      fechaHasta: '',
      estadoModuloId: '',
    },
    tempFilters: {
      jornadaId: '',
      fechaDesde: '',
      fechaHasta: '',
      estadoModuloId: '',
    },
  });
  const [usoSalas, setUsoSalas] = useState({
    ...initialChartState,
    filters: {
      sedeId: '',
      edificioId: '',
      fecha: '',
      capacidadMin: '',
      capacidadMax: '',
    },
    tempFilters: {
      sedeId: '',
      edificioId: '',
      fecha: '',
      capacidadMin: '',
      capacidadMax: '',
    },
  });
  const [examenesPorDia, setExamenesPorDia] = useState({
    ...initialChartState,
    filters: {
      sedeId: '',
      escuelaId: '',
      carreraId: '',
      asignaturaId: '',
      jornadaId: '',
      fechaDesde: '',
      fechaHasta: '',
      estadoReservaId: '', // Nuevo filtro
    },
    tempFilters: {
      sedeId: '',
      escuelaId: '',
      carreraId: '',
      asignaturaId: '',
      jornadaId: '',
      fechaDesde: '',
      fechaHasta: '',
      estadoReservaId: '', // Nuevo filtro
    },
  });

  // --- Funciones genéricas de carga y manejo de estado ---
  const fetchDataForChart = async (chartSetter, serviceFn, currentFilters) => {
    chartSetter((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const serviceCallResult = await serviceFn(currentFilters);

      let actualData = [];
      if (serviceCallResult) {
        // Check if the result is an Axios-like response object with a 'data' property that is an array
        if (
          typeof serviceCallResult.data !== 'undefined' &&
          Array.isArray(serviceCallResult.data)
        ) {
          actualData = serviceCallResult.data;
        } else if (Array.isArray(serviceCallResult)) {
          // Check if the result itself is an array
          actualData = serviceCallResult;
        }
      }

      // Enhanced logging for diagnosis
      if (serviceFn === getExamenesPorDiaData) {
        console.log(
          'Raw result from getExamenesPorDiaData:',
          serviceCallResult
        );
        console.log('Processed data for Exámenes por Día:', actualData);
      }
      if (serviceFn === getUsoSalasData) {
        console.log('Raw result from getUsoSalasData:', serviceCallResult);
        console.log('Processed data for Uso de Salas:', actualData);
      }
      chartSetter((prev) => ({
        ...prev,
        data: actualData,
        isLoading: false,
      }));
    } catch (err) {
      console.error(`Error fetching data for chart:`, err);
      chartSetter((prev) => ({
        ...prev,
        isLoading: false,
        error: `Error al cargar datos: ${err.response?.data?.message || err.response?.data?.error || err.message}`,
      }));
    }
  };

  useEffect(() => {
    fetchDataForChart(
      setExamenesCarrera,
      getExamenesPorCarreraData,
      examenesCarrera.filters
    );
  }, [examenesCarrera.filters]);

  useEffect(() => {
    fetchDataForChart(
      setModulosAgendados,
      getModulosAgendadosData,
      modulosAgendados.filters
    );
  }, [modulosAgendados.filters]);

  useEffect(() => {
    fetchDataForChart(setUsoSalas, getUsoSalasData, usoSalas.filters);
  }, [usoSalas.filters]);

  useEffect(() => {
    fetchDataForChart(
      setExamenesPorDia,
      getExamenesPorDiaData,
      examenesPorDia.filters
    );
  }, [examenesPorDia.filters]);

  // --- Funciones de utilidad para Modales y Vistas ---
  const toggleFilterModal = (chartSetter) => {
    chartSetter((prev) => {
      if (
        !prev.isFilterModalOpen &&
        Object.keys(prev.filterOptions).length === 0
      ) {
        // Cargar opciones solo la primera vez o si están vacías
        loadFilterOptionsForChart(chartSetter, prev.filters); // Asume que esta función existe y carga opciones
      }
      return {
        ...prev,
        isFilterModalOpen: !prev.isFilterModalOpen,
        tempFilters: { ...prev.filters },
      }; // Copia filtros actuales a tempFilters al abrir
    });
  };

  const toggleTableView = (chartSetter) => {
    chartSetter((prev) => ({ ...prev, showTable: !prev.showTable }));
  };

  const handleApplyFilters = (chartSetter) => {
    chartSetter((prev) => ({
      ...prev,
      filters: { ...prev.tempFilters },
      isFilterModalOpen: false,
    }));
  };

  const handleTempFilterChange = (chartSetter, filterName, value) => {
    chartSetter((prev) => ({
      ...prev,
      tempFilters: { ...prev.tempFilters, [filterName]: value },
    }));
    // Lógica para selectores dependientes (ej: si cambia sede, recargar escuelas)
    if (filterName === 'sedeId') {
      // Determinar qué gráficos usan la jerarquía Sede -> Escuela
      if (
        chartSetter === setExamenesCarrera ||
        chartSetter === setExamenesPorDia
      ) {
        loadEscuelasBySede(chartSetter, value);
      }
      // Determinar qué gráficos usan la jerarquía Sede -> Edificio
      if (chartSetter === setUsoSalas) {
        loadEdificiosBySede(chartSetter, value);
      }
    }
    if (filterName === 'escuelaId') {
      if (
        chartSetter === setExamenesCarrera ||
        chartSetter === setExamenesPorDia
      ) {
        loadCarrerasByEscuela(chartSetter, value);
      }
    }
    if (filterName === 'carreraId' && chartSetter === setExamenesPorDia) {
      loadAsignaturasByCarrera(chartSetter, value);
    }
  };

  const exportToExcel = (data, fileName, sheetName, mappingFn) => {
    if (!data || data.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }
    const dataToExport = data.map(mappingFn);
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, fileName);
  };

  // --- Carga de opciones para filtros (Ejemplos, necesitarás endpoints reales) ---
  const loadFilterOptionsForChart = async (chartSetter, currentFilters) => {
    // Detener si el modal ya no está abierto (el usuario podría haberlo cerrado rápidamente)
    let isModalStillOpen = true;
    chartSetter((prev) => {
      isModalStillOpen = prev.isFilterModalOpen;
      return prev;
    });
    if (!isModalStillOpen) return;

    try {
      const sedesPromise = fetchAllSedes();
      const jornadasPromise = fetchAllJornadas();
      const estadosPromise = fetchAllEstados();

      const [sedesRes, jornadasRes, estadosRes] = await Promise.all([
        sedesPromise,
        jornadasPromise,
        estadosPromise,
      ]);
      // CORRECCIÓN AQUÍ: Si los servicios devuelven el array directamente, no uses .data
      let newFilterOptions = {
        sedes: sedesRes || [], // Asume que sedesRes es el array de sedes
        jornadas: jornadasRes || [], // Asume que jornadasRes es el array de jornadas
        // Para estadosModulo, si estadosRes es el array, el filter se aplica directamente
        estadosModulo: (estadosRes || []).filter(
          // Estos son para el filtro de "Estado del Módulo" en otro gráfico
          (e) => e.NOMBRE_ESTADO === 'ACTIVO' || e.NOMBRE_ESTADO === 'Inactivo'
        ),
        escuelas: [],
        carreras: [],
        asignaturas: [],
        edificios: [],
      };
      newFilterOptions.todosLosEstados = estadosRes || []; // Para el filtro de estado de reserva

      // Carga encadenada de opciones si hay filtros preexistentes
      if (currentFilters.sedeId) {
        try {
          const escuelasData = await fetchEscuelasBySede(currentFilters.sedeId);
          newFilterOptions.escuelas = escuelasData || [];
          if (
            currentFilters.escuelaId &&
            newFilterOptions.escuelas.some(
              (e) =>
                e.ID_ESCUELA.toString() === currentFilters.escuelaId.toString()
            )
          ) {
            const carrerasData = await fetchCarrerasByEscuela(
              currentFilters.escuelaId
            );
            newFilterOptions.carreras = carrerasData || [];
            if (
              currentFilters.carreraId &&
              newFilterOptions.carreras.some(
                (c) =>
                  c.ID_CARRERA.toString() ===
                  currentFilters.carreraId.toString()
              )
            ) {
              if (chartSetter === setExamenesPorDia) {
                const asignaturasData = await fetchAsignaturasByCarrera(
                  currentFilters.carreraId
                );
                newFilterOptions.asignaturas = asignaturasData || [];
              }
            }
          }
        } catch (chainedError) {
          console.error('Error loading chained filter options:', chainedError);
        }
        if (chartSetter === setUsoSalas) {
          try {
            const edificiosData = await fetchEdificiosBySede(
              currentFilters.sedeId
            );
            newFilterOptions.edificios = edificiosData || [];
          } catch (edificioError) {
            console.error(
              'Error loading edificios filter options:',
              edificioError
            );
          }
        }
      }

      chartSetter((prev) => {
        if (!prev.isFilterModalOpen) return prev;
        return { ...prev, filterOptions: newFilterOptions };
      });
    } catch (error) {
      console.error('Error loading filter options:', error);
      chartSetter((prev) => {
        if (!prev.isFilterModalOpen) return prev;
        return {
          ...prev,
          filterOptions: {
            sedes: [],
            jornadas: [],
            estadosModulo: [],
            escuelas: [],
            carreras: [],
            asignaturas: [],
            edificios: [],
            todosLosEstados: [],
          },
        };
      });
    }
  };

  const loadEscuelasBySede = async (chartSetter, sedeId) => {
    if (!sedeId) {
      chartSetter((prev) => ({
        ...prev,
        filterOptions: {
          ...prev.filterOptions,
          escuelas: [],
          carreras: [],
          asignaturas: [],
        },
        tempFilters: {
          ...prev.tempFilters,
          escuelaId: '',
          carreraId: '',
          asignaturaId: '',
        }, // Resetear todos los descendientes
      }));
      return;
    }
    try {
      const escuelasData = await fetchEscuelasBySede(sedeId);
      chartSetter((prev) => ({
        ...prev,
        filterOptions: {
          ...prev.filterOptions,
          escuelas: escuelasData || [],
          carreras: [],
          asignaturas: [],
        }, // Actualizar escuelas, limpiar descendientes
        tempFilters: {
          ...prev.tempFilters,
          escuelaId: '',
          carreraId: '',
          asignaturaId: '',
        }, // Resetear tempFilters de descendientes
      }));
    } catch (error) {
      console.error(`Error loading escuelas for sede ${sedeId}:`, error);
      chartSetter((prev) => ({
        ...prev,
        filterOptions: {
          ...prev.filterOptions,
          escuelas: [],
          carreras: [],
          asignaturas: [],
        },
        tempFilters: {
          ...prev.tempFilters,
          escuelaId: '',
          carreraId: '',
          asignaturaId: '',
        },
      }));
    }
  };

  const loadCarrerasByEscuela = async (chartSetter, escuelaId) => {
    if (!escuelaId) {
      chartSetter((prev) => ({
        ...prev,
        filterOptions: { ...prev.filterOptions, carreras: [], asignaturas: [] },
        tempFilters: { ...prev.tempFilters, carreraId: '', asignaturaId: '' }, // Resetear todos los descendientes
      }));
      return;
    }
    try {
      const carrerasData = await fetchCarrerasByEscuela(escuelaId);
      chartSetter((prev) => ({
        ...prev,
        filterOptions: {
          ...prev.filterOptions,
          carreras: carrerasData || [],
          asignaturas: [],
        }, // Actualizar carreras, limpiar descendientes
        tempFilters: { ...prev.tempFilters, carreraId: '', asignaturaId: '' }, // Resetear tempFilters de descendientes
      }));
    } catch (error) {
      console.error(`Error loading carreras for escuela ${escuelaId}:`, error);
      chartSetter((prev) => ({
        ...prev,
        filterOptions: { ...prev.filterOptions, carreras: [], asignaturas: [] },
        tempFilters: { ...prev.tempFilters, carreraId: '', asignaturaId: '' },
      }));
    }
  };

  const loadEdificiosBySede = async (chartSetter, sedeId) => {
    if (!sedeId) {
      chartSetter((prev) => ({
        ...prev,
        filterOptions: { ...prev.filterOptions, edificios: [] },
        tempFilters: { ...prev.tempFilters, edificioId: '' }, // Solo este nivel
      }));
      return;
    }
    try {
      const edificiosData = await fetchEdificiosBySede(sedeId);
      chartSetter((prev) => ({
        ...prev,
        filterOptions: {
          ...prev.filterOptions,
          edificios: edificiosData || [],
        },
        tempFilters: { ...prev.tempFilters, edificioId: '' }, // Resetear el tempFilter del hijo
      }));
    } catch (error) {
      console.error(`Error loading edificios for sede ${sedeId}:`, error);
      chartSetter((prev) => ({
        ...prev,
        filterOptions: { ...prev.filterOptions, edificios: [] },
        tempFilters: { ...prev.tempFilters, edificioId: '' },
      }));
    }
  };

  const loadAsignaturasByCarrera = async (chartSetter, carreraId) => {
    if (!carreraId) {
      chartSetter((prev) => ({
        ...prev,
        filterOptions: { ...prev.filterOptions, asignaturas: [] },
        tempFilters: { ...prev.tempFilters, asignaturaId: '' }, // Solo este nivel
      }));
      return;
    }
    try {
      const asignaturasData = await fetchAsignaturasByCarrera(carreraId);
      chartSetter((prev) => ({
        ...prev,
        filterOptions: {
          ...prev.filterOptions,
          asignaturas: asignaturasData || [],
        },
        tempFilters: { ...prev.tempFilters, asignaturaId: '' }, // Resetear el tempFilter del hijo
      }));
    } catch (error) {
      console.error(
        `Error loading asignaturas for carrera ${carreraId}:`,
        error
      );
      chartSetter((prev) => ({
        ...prev,
        filterOptions: { ...prev.filterOptions, asignaturas: [] },
        tempFilters: { ...prev.tempFilters, asignaturaId: '' },
      }));
    }
  };

  // --- Renderizado ---
  // Comprobación global de carga o error (opcional, si prefieres manejar por gráfico)
  // if (examenesCarrera.isLoading || modulosAgendados.isLoading || usoSalas.isLoading || examenesPorDia.isLoading) {
  //   return <div className="container-fluid p-4"><p>Cargando gráficos del dashboard...</p></div>;
  // }
  // if (examenesCarrera.error || modulosAgendados.error || usoSalas.error || examenesPorDia.error) {
  //   return <div className="container-fluid p-4"><div className="alert alert-danger">Error al cargar algunos gráficos.</div></div>;
  // }

  const renderChartOrTable = (
    chartState,
    chartSetter,
    title,
    ChartComponent,
    tableHeaders,
    tableRowMapper,
    excelMapper,
    excelFileName,
    excelSheetName
  ) => {
    if (chartState.isLoading) return <p>Cargando {title}...</p>;
    if (chartState.error)
      return <div className="alert alert-danger">{chartState.error}</div>;

    return (
      <>
        {chartState.showTable ? (
          <div
            className="table-responsive flex-grow-1"
            style={{ minHeight: '300px' }}
          >
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  {tableHeaders.map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>{chartState.data.map(tableRowMapper)}</tbody>
            </table>
          </div>
        ) : (
          ChartComponent
        )}
      </>
    );
  };

  const exportExamenesCarreraToExcel = () =>
    exportToExcel(
      examenesCarrera.data,
      'examenes_por_carrera.xlsx',
      'ExamenesPorCarrera',
      (item) => ({
        Carrera: item.name,
        'Cantidad de Exámenes': item.value,
      })
    );

  return (
    <div className="row g-3 g-md-4 p-3 p-md-4">
      {/* Gráfico de Exámenes por Carrera */}
      <div className="col-12 col-md-6 mb-4">
        <div className="card shadow h-100">
          {/* Quitado align-items-center para que flex-grow-1 pueda expandirse bien */}
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="card-title fw-semibold mb-0">
              Exámenes por Carrera
            </h5>
            <div className="chart-actions">
              <button
                onClick={() => toggleFilterModal(setExamenesCarrera)}
                className="btn btn-sm btn-outline-secondary me-1"
                title="Filtrar"
              >
                <FaFilter />
              </button>
              <button
                onClick={() => toggleTableView(setExamenesCarrera)}
                className="btn btn-sm btn-outline-secondary me-1"
                title={examenesCarrera.showTable ? 'Ver Gráfico' : 'Ver Tabla'}
              >
                {examenesCarrera.showTable ? <FaChartBar /> : <FaTable />}
              </button>
              <button
                onClick={exportExamenesCarreraToExcel}
                className="btn btn-sm btn-outline-success"
                title="Exportar a Excel"
              >
                <FaFileExcel />
              </button>
            </div>
          </div>
          <div className="card-body d-flex flex-column">
            {renderChartOrTable(
              examenesCarrera,
              setExamenesCarrera,
              'Exámenes por Carrera', // ChartComponent
              <div className="flex-grow-1" style={{ minHeight: '300px' }}>
                {' '}
                {/* Ajusta esta altura según necesites */}
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={examenesCarrera.data}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={150}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip />
                    <Bar dataKey="value" fill={COLORS[0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>,
              ['Carrera', 'Cantidad de Exámenes'], // tableHeaders
              (
                item // tableRowMapper
              ) => (
                <tr key={item.name}>
                  <td>{item.name}</td>
                  <td>{item.value}</td>
                </tr>
              )
              // excelMapper, excelFileName, excelSheetName are handled by dedicated export function
            )}
          </div>
        </div>
      </div>

      {/* Gráfico de Módulos más agendados */}
      <div className="col-12 col-md-6 mb-4">
        <div className="card shadow h-100">
          {/* Quitado align-items-center para que flex-grow-1 pueda expandirse bien */}
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="card-title fw-semibold mb-0">
              Módulos más Agendados
            </h5>
            <div className="chart-actions">
              {/* TODO: Implementar acciones para este gráfico */}
              <button
                onClick={() => toggleFilterModal(setModulosAgendados)}
                className="btn btn-sm btn-outline-secondary me-1"
                title="Filtrar"
              >
                <FaFilter />
              </button>
              <button
                onClick={() => toggleTableView(setModulosAgendados)}
                className="btn btn-sm btn-outline-secondary me-1"
                title={modulosAgendados.showTable ? 'Ver Gráfico' : 'Ver Tabla'}
              >
                {modulosAgendados.showTable ? <FaChartBar /> : <FaTable />}
              </button>
              <button
                onClick={() =>
                  exportToExcel(
                    modulosAgendados.data,
                    'modulos_agendados.xlsx',
                    'Modulos',
                    (item) => ({
                      'Módulo (Hora)': item.hora,
                      'Cantidad Agendada': item.cantidad,
                    })
                  )
                }
                className="btn btn-sm btn-outline-success"
                title="Exportar a Excel"
              >
                <FaFileExcel />
              </button>
            </div>
          </div>
          <div className="card-body d-flex flex-column">
            {renderChartOrTable(
              modulosAgendados,
              setModulosAgendados,
              'Módulos más Agendados', // ChartComponent
              <div className="flex-grow-1" style={{ minHeight: '300px' }}>
                {' '}
                {/* Ajusta esta altura según necesites */}
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={modulosAgendados.data}
                    margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hora" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="cantidad"
                      stroke={COLORS[1]}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>,
              ['Módulo (Hora)', 'Cantidad Agendada'], // tableHeaders
              (
                item // tableRowMapper
              ) => (
                <tr key={item.hora}>
                  <td>{item.hora}</td>
                  <td>{item.cantidad}</td>
                </tr>
              )
            )}
          </div>
        </div>
      </div>

      {/* Gráfico de Distribución de Salas */}
      <div className="col-12 col-md-6 mb-4">
        <div className="card shadow h-100">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="card-title fw-semibold mb-0">Uso de Salas</h5>
            <div className="chart-actions">
              {/* TODO: Implementar acciones para este gráfico */}
              <button
                onClick={() => toggleFilterModal(setUsoSalas)}
                className="btn btn-sm btn-outline-secondary me-1"
                title="Filtrar"
              >
                <FaFilter />
              </button>
              <button
                onClick={() => toggleTableView(setUsoSalas)}
                className="btn btn-sm btn-outline-secondary me-1"
                title={usoSalas.showTable ? 'Ver Gráfico' : 'Ver Tabla'}
              >
                {usoSalas.showTable ? <FaChartBar /> : <FaTable />}
              </button>
              <button
                onClick={() =>
                  exportToExcel(
                    usoSalas.data,
                    'uso_salas.xlsx',
                    'UsoSalas',
                    (item) => ({ Estado: item.name, Cantidad: item.value })
                  )
                }
                className="btn btn-sm btn-outline-success"
                title="Exportar a Excel"
              >
                <FaFileExcel />
              </button>
            </div>
          </div>
          <div className="card-body d-flex flex-column align-items-center">
            {renderChartOrTable(
              usoSalas,
              setUsoSalas,
              'Uso de Salas', // ChartComponent
              <div
                className="flex-grow-1"
                style={{ width: '100%', height: '300px' }} // Ajusta esta altura si es necesario
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie // Usa chartData.usoSalas
                      data={usoSalas.data}
                      cx="50%"
                      cy="50%"
                      outerRadius={80} // Puedes aumentar esto si hay más espacio
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {usoSalas.data.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>,
              ['Estado', 'Cantidad'], // tableHeaders
              (
                item // tableRowMapper
              ) => (
                <tr key={item.name}>
                  <td>{item.name}</td>
                  <td>{item.value}</td>
                </tr>
              )
            )}
          </div>
        </div>
      </div>

      {/* Exámenes por Día */}
      <div className="col-12 col-md-6 mb-4">
        <div className="card shadow h-100">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="card-title fw-semibold mb-0">Exámenes por Día</h5>
            <div className="chart-actions">
              {/* TODO: Implementar acciones para este gráfico */}
              <button
                onClick={() => toggleFilterModal(setExamenesPorDia)}
                className="btn btn-sm btn-outline-secondary me-1"
                title="Filtrar"
              >
                <FaFilter />
              </button>
              <button
                onClick={() => toggleTableView(setExamenesPorDia)}
                className="btn btn-sm btn-outline-secondary me-1"
                title={examenesPorDia.showTable ? 'Ver Gráfico' : 'Ver Tabla'}
              >
                {examenesPorDia.showTable ? <FaChartBar /> : <FaTable />}
              </button>
              <button
                onClick={() =>
                  exportToExcel(
                    examenesPorDia.data,
                    'examenes_por_dia.xlsx',
                    'ExamenesPorDia',
                    (item) => ({
                      Día: `${item.fecha_completa} (${item.dia_semana})`,
                      'Estado Examen': item.estado_examen, // Asegúrate que item.estado_examen provenga del backend
                      'Cantidad de Exámenes': item.cantidad_examenes,
                    })
                  )
                }
                className="btn btn-sm btn-outline-success"
                title="Exportar a Excel"
              >
                <FaFileExcel />
              </button>
            </div>
          </div>
          <div className="card-body d-flex flex-column">
            {renderChartOrTable(
              examenesPorDia,
              setExamenesPorDia,
              'Exámenes por Día', // ChartComponent
              <div className="flex-grow-1" style={{ minHeight: '300px' }}>
                {' '}
                {/* Ajusta esta altura según necesites */}
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={examenesPorDia.data}
                    // layout="vertical" // Cambiado a horizontal para mejor visualización de barras agrupadas/apiladas por día
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="dia_semana" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {/*
                      Para mostrar barras apiladas o agrupadas por estado_examen,
                      necesitarías transformar los datos o tener una lógica más compleja aquí.
                      Ejemplo conceptual para barras apiladas (requiere transformar datos o múltiples <Bar>):
                      Asumiendo que tienes una lista de estados de examen únicos:
                      const estadosDeExamenUnicos = [...new Set(examenesPorDia.data.map(d => d.estado_examen))];
                      estadosDeExamenUnicos.map((estado, index) => (
                        <Bar
                          key={estado}
                          dataKey={(item) => item.estado_examen === estado ? item.cantidad_examenes : 0}
                          stackId="a" // Todos los estados en la misma pila por día
                          name={estado}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))
                      Por simplicidad, mostraremos una sola barra por ahora, sumando todos los estados.
                      El desglose se verá en la tabla y el tooltip.
                    */}
                    <Bar
                      dataKey="cantidad_examenes"
                      name="Total Exámenes"
                      fill={COLORS[2]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>,
              ['Día', 'Estado Examen', 'Cantidad de Exámenes'], // tableHeaders
              (
                item // tableRowMapper
              ) => (
                // Usar una clave única, por ejemplo, combinando fecha y estado
                // Asegúrate que las propiedades coincidan con lo que devuelve tu backend
                <tr
                  key={`${item.fecha_completa}-${item.estado_examen || 'general'}`}
                >
                  <td>
                    {item.fecha_completa} ({item.dia_semana})
                  </td>
                  <td>{item.estado_examen}</td>
                  <td>{item.cantidad_examenes}</td>
                </tr>
              )
            )}
          </div>
        </div>
      </div>

      {/* Modal de Filtros para Exámenes por Carrera */}
      <Modal
        isOpen={examenesCarrera.isFilterModalOpen}
        onRequestClose={() => toggleFilterModal(setExamenesCarrera)}
        contentLabel="Filtros Exámenes por Carrera"
        className="ReactModal__Content"
        overlayClassName="ReactModal__Overlay"
      >
        <div className="modal-header">
          <h5 className="modal-title">Filtros para Exámenes por Carrera</h5>
          <button
            type="button"
            className="btn-close"
            onClick={() => toggleFilterModal(setExamenesCarrera)}
          ></button>
        </div>
        <div className="modal-body">
          <div className="mb-3">
            <label htmlFor="ecSede" className="form-label">
              Sede
            </label>
            <select
              id="ecSede"
              className="form-select"
              value={examenesCarrera.tempFilters.sedeId}
              onChange={(e) =>
                handleTempFilterChange(
                  setExamenesCarrera,
                  'sedeId',
                  e.target.value
                )
              }
            >
              <option value="">Todas</option>
              {examenesCarrera.filterOptions.sedes?.map((s) => (
                <option key={s.ID_SEDE} value={s.ID_SEDE}>
                  {s.NOMBRE_SEDE}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label htmlFor="ecEscuela" className="form-label">
              Escuela
            </label>
            <select
              id="ecEscuela"
              className="form-select"
              value={examenesCarrera.tempFilters.escuelaId}
              onChange={(e) =>
                handleTempFilterChange(
                  setExamenesCarrera,
                  'escuelaId',
                  e.target.value
                )
              }
              disabled={!examenesCarrera.tempFilters.sedeId}
            >
              <option value="">Todas</option>
              {examenesCarrera.filterOptions.escuelas &&
              examenesCarrera.filterOptions.escuelas.length > 0 ? (
                examenesCarrera.filterOptions.escuelas.map((e) => (
                  <option key={e.ID_ESCUELA} value={e.ID_ESCUELA}>
                    {e.NOMBRE_ESCUELA}
                  </option>
                ))
              ) : examenesCarrera.tempFilters.sedeId ? (
                <option value="" disabled>
                  (No hay escuelas para esta sede)
                </option>
              ) : null}
            </select>
          </div>
          <div className="mb-3">
            <label htmlFor="ecCarrera" className="form-label">
              Carrera
            </label>
            <select
              id="ecCarrera"
              className="form-select"
              value={examenesCarrera.tempFilters.carreraId}
              onChange={(e) =>
                handleTempFilterChange(
                  setExamenesCarrera,
                  'carreraId',
                  e.target.value
                )
              }
              disabled={!examenesCarrera.tempFilters.escuelaId}
            >
              <option value="">Todas</option>
              {examenesCarrera.filterOptions.carreras &&
              examenesCarrera.filterOptions.carreras.length > 0 ? (
                examenesCarrera.filterOptions.carreras.map((c) => (
                  <option key={c.ID_CARRERA} value={c.ID_CARRERA}>
                    {c.NOMBRE_CARRERA}
                  </option>
                ))
              ) : examenesCarrera.tempFilters.escuelaId ? (
                <option value="" disabled>
                  (No hay carreras para esta escuela)
                </option>
              ) : null}
            </select>
          </div>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="ecFechaDesde" className="form-label">
                Fecha Desde (Reserva)
              </label>
              <input
                type="date"
                id="ecFechaDesde"
                className="form-control"
                value={examenesCarrera.tempFilters.fechaDesde}
                onChange={(e) =>
                  handleTempFilterChange(
                    setExamenesCarrera,
                    'fechaDesde',
                    e.target.value
                  )
                }
              />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="ecFechaHasta" className="form-label">
                Fecha Hasta (Reserva)
              </label>
              <input
                type="date"
                id="ecFechaHasta"
                className="form-control"
                value={examenesCarrera.tempFilters.fechaHasta}
                onChange={(e) =>
                  handleTempFilterChange(
                    setExamenesCarrera,
                    'fechaHasta',
                    e.target.value
                  )
                }
              />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => toggleFilterModal(setExamenesCarrera)}
          >
            Cerrar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleApplyFilters(setExamenesCarrera)}
          >
            Aplicar Filtros
          </button>
        </div>
      </Modal>

      {/* Modal de Filtros para Módulos Agendados */}
      <Modal
        isOpen={modulosAgendados.isFilterModalOpen}
        onRequestClose={() => toggleFilterModal(setModulosAgendados)}
        contentLabel="Filtros Módulos Agendados"
        className="ReactModal__Content"
        overlayClassName="ReactModal__Overlay"
      >
        <div className="modal-header">
          <h5 className="modal-title">Filtros para Módulos Agendados</h5>
          <button
            type="button"
            className="btn-close"
            onClick={() => toggleFilterModal(setModulosAgendados)}
          ></button>
        </div>
        <div className="modal-body">
          <div className="mb-3">
            <label htmlFor="maJornada" className="form-label">
              Jornada
            </label>
            <select
              id="maJornada"
              className="form-select"
              value={modulosAgendados.tempFilters.jornadaId}
              onChange={(e) =>
                handleTempFilterChange(
                  setModulosAgendados,
                  'jornadaId',
                  e.target.value
                )
              }
            >
              <option value="">Todas</option>
              {modulosAgendados.filterOptions.jornadas?.map((j) => (
                <option key={j.ID_JORNADA} value={j.ID_JORNADA}>
                  {j.NOMBRE_JORNADA}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label htmlFor="maEstadoModulo" className="form-label">
              Estado del Módulo
            </label>
            <select
              id="maEstadoModulo"
              className="form-select"
              value={modulosAgendados.tempFilters.estadoModuloId}
              onChange={(e) =>
                handleTempFilterChange(
                  setModulosAgendados,
                  'estadoModuloId',
                  e.target.value
                )
              }
            >
              <option value="">Todos</option>
              {modulosAgendados.filterOptions.estadosModulo?.map((e) => (
                <option key={e.ID_ESTADO} value={e.ID_ESTADO}>
                  {e.NOMBRE_ESTADO}
                </option>
              ))}
            </select>
          </div>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="maFechaDesde" className="form-label">
                Fecha Desde (Reserva)
              </label>
              <input
                type="date"
                id="maFechaDesde"
                className="form-control"
                value={modulosAgendados.tempFilters.fechaDesde}
                onChange={(e) =>
                  handleTempFilterChange(
                    setModulosAgendados,
                    'fechaDesde',
                    e.target.value
                  )
                }
              />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="maFechaHasta" className="form-label">
                Fecha Hasta (Reserva)
              </label>
              <input
                type="date"
                id="maFechaHasta"
                className="form-control"
                value={modulosAgendados.tempFilters.fechaHasta}
                onChange={(e) =>
                  handleTempFilterChange(
                    setModulosAgendados,
                    'fechaHasta',
                    e.target.value
                  )
                }
              />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => toggleFilterModal(setModulosAgendados)}
          >
            Cerrar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleApplyFilters(setModulosAgendados)}
          >
            Aplicar Filtros
          </button>
        </div>
      </Modal>

      {/* Modal de Filtros para Uso de Salas */}
      <Modal
        isOpen={usoSalas.isFilterModalOpen}
        onRequestClose={() => toggleFilterModal(setUsoSalas)}
        contentLabel="Filtros Uso de Salas"
        className="ReactModal__Content"
        overlayClassName="ReactModal__Overlay"
      >
        <div className="modal-header">
          <h5 className="modal-title">Filtros para Uso de Salas</h5>
          <button
            type="button"
            className="btn-close"
            onClick={() => toggleFilterModal(setUsoSalas)}
          ></button>
        </div>
        <div className="modal-body">
          <div className="mb-3">
            <label htmlFor="usSede" className="form-label">
              Sede
            </label>
            <select
              id="usSede"
              className="form-select"
              value={usoSalas.tempFilters.sedeId}
              onChange={(e) =>
                handleTempFilterChange(setUsoSalas, 'sedeId', e.target.value)
              }
            >
              <option value="">Todas</option>
              {usoSalas.filterOptions.sedes?.map((s) => (
                <option key={s.ID_SEDE} value={s.ID_SEDE}>
                  {s.NOMBRE_SEDE}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label htmlFor="usEdificio" className="form-label">
              Edificio
            </label>
            <select
              id="usEdificio"
              className="form-select"
              value={usoSalas.tempFilters.edificioId}
              onChange={(e) =>
                handleTempFilterChange(
                  setUsoSalas,
                  'edificioId',
                  e.target.value
                )
              }
              disabled={!usoSalas.tempFilters.sedeId}
            >
              <option value="">Todos</option>
              {usoSalas.filterOptions.edificios &&
              usoSalas.filterOptions.edificios.length > 0 ? (
                usoSalas.filterOptions.edificios.map((e) => (
                  <option key={e.ID_EDIFICIO} value={e.ID_EDIFICIO}>
                    {e.NOMBRE_EDIFICIO}
                  </option>
                ))
              ) : usoSalas.tempFilters.sedeId ? (
                <option value="" disabled>
                  (No hay edificios para esta sede)
                </option>
              ) : null}
            </select>
          </div>
          <div className="mb-3">
            <label htmlFor="usFecha" className="form-label">
              Fecha Específica (Reserva)
            </label>
            <input
              type="date"
              className="form-control"
              id="usFecha"
              value={usoSalas.tempFilters.fecha}
              onChange={(e) =>
                handleTempFilterChange(setUsoSalas, 'fecha', e.target.value)
              }
            />
          </div>
          {/* TODO: Filtros de capacidad */}
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => toggleFilterModal(setUsoSalas)}
          >
            Cerrar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleApplyFilters(setUsoSalas)}
          >
            Aplicar Filtros
          </button>
        </div>
      </Modal>

      {/* Modal de Filtros para Exámenes por Día */}
      <Modal
        isOpen={examenesPorDia.isFilterModalOpen}
        onRequestClose={() => toggleFilterModal(setExamenesPorDia)}
        contentLabel="Filtros Exámenes por Día"
        className="ReactModal__Content"
        overlayClassName="ReactModal__Overlay"
      >
        <div className="modal-header">
          <h5 className="modal-title">Filtros para Exámenes por Día</h5>
          <button
            type="button"
            className="btn-close"
            onClick={() => toggleFilterModal(setExamenesPorDia)}
          ></button>
        </div>
        <div className="modal-body">
          <div className="mb-3">
            <label htmlFor="epdSede" className="form-label">
              Sede
            </label>
            <select
              id="epdSede"
              className="form-select"
              value={examenesPorDia.tempFilters.sedeId}
              onChange={(e) =>
                handleTempFilterChange(
                  setExamenesPorDia,
                  'sedeId',
                  e.target.value
                )
              }
            >
              <option value="">Todas</option>
              {examenesPorDia.filterOptions.sedes?.map((s) => (
                <option key={s.ID_SEDE} value={s.ID_SEDE}>
                  {s.NOMBRE_SEDE}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label htmlFor="epdEscuela" className="form-label">
              Escuela
            </label>
            <select
              id="epdEscuela"
              className="form-select"
              value={examenesPorDia.tempFilters.escuelaId}
              onChange={(e) =>
                handleTempFilterChange(
                  setExamenesPorDia,
                  'escuelaId',
                  e.target.value
                )
              }
              disabled={!examenesPorDia.tempFilters.sedeId}
            >
              <option value="">Todas</option>
              {examenesPorDia.filterOptions.escuelas &&
              examenesPorDia.filterOptions.escuelas.length > 0 ? (
                examenesPorDia.filterOptions.escuelas.map((e) => (
                  <option key={e.ID_ESCUELA} value={e.ID_ESCUELA}>
                    {e.NOMBRE_ESCUELA}
                  </option>
                ))
              ) : examenesPorDia.tempFilters.sedeId ? (
                <option value="" disabled>
                  (No hay escuelas para esta sede)
                </option>
              ) : null}
            </select>
          </div>
          <div className="mb-3">
            <label htmlFor="epdCarrera" className="form-label">
              Carrera
            </label>
            <select
              id="epdCarrera"
              className="form-select"
              value={examenesPorDia.tempFilters.carreraId}
              onChange={(e) =>
                handleTempFilterChange(
                  setExamenesPorDia,
                  'carreraId',
                  e.target.value
                )
              }
              disabled={!examenesPorDia.tempFilters.escuelaId}
            >
              <option value="">Todas</option>
              {examenesPorDia.filterOptions.carreras &&
              examenesPorDia.filterOptions.carreras.length > 0 ? (
                examenesPorDia.filterOptions.carreras.map((c) => (
                  <option key={c.ID_CARRERA} value={c.ID_CARRERA}>
                    {c.NOMBRE_CARRERA}
                  </option>
                ))
              ) : examenesPorDia.tempFilters.escuelaId ? (
                <option value="" disabled>
                  (No hay carreras para esta escuela)
                </option>
              ) : null}
            </select>
          </div>
          <div className="mb-3">
            <label htmlFor="epdAsignatura" className="form-label">
              Asignatura
            </label>
            <select
              id="epdAsignatura"
              className="form-select"
              value={examenesPorDia.tempFilters.asignaturaId}
              onChange={(e) =>
                handleTempFilterChange(
                  setExamenesPorDia,
                  'asignaturaId',
                  e.target.value
                )
              }
              disabled={!examenesPorDia.tempFilters.carreraId}
            >
              <option value="">Todas</option>
              {examenesPorDia.filterOptions.asignaturas &&
              examenesPorDia.filterOptions.asignaturas.length > 0 ? (
                examenesPorDia.filterOptions.asignaturas.map((a) => (
                  <option key={a.ID_ASIGNATURA} value={a.ID_ASIGNATURA}>
                    {a.NOMBRE_ASIGNATURA}
                  </option>
                ))
              ) : examenesPorDia.tempFilters.carreraId ? (
                <option value="" disabled>
                  (No hay asignaturas para esta carrera)
                </option>
              ) : null}
            </select>
          </div>
          <div className="mb-3">
            <label htmlFor="epdJornada" className="form-label">
              Jornada
            </label>
            <select
              id="epdJornada"
              className="form-select"
              value={examenesPorDia.tempFilters.jornadaId}
              onChange={(e) =>
                handleTempFilterChange(
                  setExamenesPorDia,
                  'jornadaId',
                  e.target.value
                )
              }
            >
              <option value="">Todas</option>
              {examenesPorDia.filterOptions.jornadas?.map((j) => (
                <option key={j.ID_JORNADA} value={j.ID_JORNADA}>
                  {j.NOMBRE_JORNADA}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label htmlFor="epdEstadoReserva" className="form-label">
              Estado de la Reserva
            </label>
            <select
              id="epdEstadoReserva"
              className="form-select"
              value={examenesPorDia.tempFilters.estadoReservaId}
              onChange={(e) =>
                handleTempFilterChange(
                  setExamenesPorDia,
                  'estadoReservaId',
                  e.target.value
                )
              }
            >
              <option value="">Todos</option>
              {examenesPorDia.filterOptions.todosLosEstados?.map((estado) => (
                <option key={estado.ID_ESTADO} value={estado.ID_ESTADO}>
                  {estado.NOMBRE_ESTADO}
                </option>
              ))}
            </select>
          </div>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="epdFechaDesde" className="form-label">
                Fecha Desde (Reserva)
              </label>
              <input
                type="date"
                id="epdFechaDesde"
                className="form-control"
                value={examenesPorDia.tempFilters.fechaDesde}
                onChange={(e) =>
                  handleTempFilterChange(
                    setExamenesPorDia,
                    'fechaDesde',
                    e.target.value
                  )
                }
              />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="epdFechaHasta" className="form-label">
                Fecha Hasta (Reserva)
              </label>
              <input
                type="date"
                id="epdFechaHasta"
                className="form-control"
                value={examenesPorDia.tempFilters.fechaHasta}
                onChange={(e) =>
                  handleTempFilterChange(
                    setExamenesPorDia,
                    'fechaHasta',
                    e.target.value
                  )
                }
              />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => toggleFilterModal(setExamenesPorDia)}
          >
            Cerrar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleApplyFilters(setExamenesPorDia)}
          >
            Aplicar Filtros
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default DashboardConGraficos;
