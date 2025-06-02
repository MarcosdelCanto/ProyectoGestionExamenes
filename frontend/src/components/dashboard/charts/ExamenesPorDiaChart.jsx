import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import * as XLSX from 'xlsx';
import { FaFilter, FaTable, FaChartBar, FaFileExcel } from 'react-icons/fa';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { getExamenesPorDiaData } from '../../../services/dashboardService';
import { fetchAllSedes } from '../../../services/sedeService';
import { fetchEscuelasBySede } from '../../../services/escuelaService';
import { fetchCarrerasByEscuela } from '../../../services/carreraService';
import { fetchAsignaturasByCarrera } from '../../../services/asignaturaService';
import { fetchAllJornadas } from '../../../services/jornadaService';
import { fetchAllEstados } from '../../../services/estadoService';

const COLORS = [
  '#ffc107',
  '#0d6efd',
  '#198754',
  '#dc3545',
  '#6f42c1',
  '#fd7e14',
]; // Color diferente

const initialChartState = {
  data: [], // Espera datos con { fecha_completa, dia_semana, estado_examen, cantidad_examenes }
  isLoading: true,
  error: null,
  isFilterModalOpen: false,
  showTable: false,
  filterOptions: {
    sedes: [],
    escuelas: [],
    carreras: [],
    asignaturas: [],
    jornadas: [],
    todosLosEstados: [],
  },
  filters: {
    sedeId: '',
    escuelaId: '',
    carreraId: '',
    asignaturaId: '',
    jornadaId: '',
    fechaDesde: '',
    fechaHasta: '',
    estadoReservaId: '',
  },
  tempFilters: {
    sedeId: '',
    escuelaId: '',
    carreraId: '',
    asignaturaId: '',
    jornadaId: '',
    fechaDesde: '',
    fechaHasta: '',
    estadoReservaId: '',
  },
};

const ExamenesPorDiaChart = () => {
  const [chartState, setChartState] = useState(initialChartState);

  const fetchData = async (currentFilters) => {
    setChartState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await getExamenesPorDiaData(currentFilters);
      const actualData = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];
      setChartState((prev) => ({
        ...prev,
        data: actualData,
        isLoading: false,
      }));
    } catch (err) {
      console.error('Error fetching Exámenes por Día data:', err);
      setChartState((prev) => ({
        ...prev,
        isLoading: false,
        error: `Error al cargar datos: ${err.response?.data?.message || err.response?.data?.error || err.message}`,
      }));
    }
  };

  useEffect(() => {
    fetchData(chartState.filters);
  }, [chartState.filters]);

  const loadFilterOptions = async () => {
    let isModalStillOpen = true;
    setChartState((prev) => {
      isModalStillOpen = prev.isFilterModalOpen;
      return prev;
    });
    if (!isModalStillOpen) return;

    try {
      const [sedesRes, jornadasRes, estadosRes] = await Promise.all([
        fetchAllSedes(),
        fetchAllJornadas(),
        fetchAllEstados(),
      ]);
      let newFilterOptions = {
        sedes: sedesRes || [],
        jornadas: jornadasRes || [],
        todosLosEstados: estadosRes || [],
        escuelas: [],
        carreras: [],
        asignaturas: [],
      };

      if (chartState.tempFilters.sedeId) {
        const escuelasData = await fetchEscuelasBySede(
          chartState.tempFilters.sedeId
        );
        newFilterOptions.escuelas = escuelasData || [];
        if (
          chartState.tempFilters.escuelaId &&
          newFilterOptions.escuelas.some(
            (e) =>
              e.ID_ESCUELA.toString() ===
              chartState.tempFilters.escuelaId.toString()
          )
        ) {
          const carrerasData = await fetchCarrerasByEscuela(
            chartState.tempFilters.escuelaId
          );
          newFilterOptions.carreras = carrerasData || [];
          if (
            chartState.tempFilters.carreraId &&
            newFilterOptions.carreras.some(
              (c) =>
                c.ID_CARRERA.toString() ===
                chartState.tempFilters.carreraId.toString()
            )
          ) {
            const asignaturasData = await fetchAsignaturasByCarrera(
              chartState.tempFilters.carreraId
            );
            newFilterOptions.asignaturas = asignaturasData || [];
          }
        }
      }
      setChartState((prev) => ({ ...prev, filterOptions: newFilterOptions }));
    } catch (error) {
      console.error(
        'Error loading filter options for Examenes por Dia:',
        error
      );
      setChartState((prev) => ({
        ...prev,
        filterOptions: {
          sedes: [],
          escuelas: [],
          carreras: [],
          asignaturas: [],
          jornadas: [],
          todosLosEstados: [],
        },
      }));
    }
  };

  const toggleFilterModal = () => {
    setChartState((prev) => {
      const openingModal = !prev.isFilterModalOpen;
      if (openingModal && prev.filterOptions.sedes.length === 0) {
        loadFilterOptions();
      }
      return {
        ...prev,
        isFilterModalOpen: openingModal,
        tempFilters: openingModal ? { ...prev.filters } : prev.tempFilters,
      };
    });
  };

  const handleTempFilterChange = async (filterName, value) => {
    setChartState((prev) => ({
      ...prev,
      tempFilters: { ...prev.tempFilters, [filterName]: value },
    }));

    if (filterName === 'sedeId') {
      setChartState((prev) => ({
        ...prev,
        tempFilters: {
          ...prev.tempFilters,
          escuelaId: '',
          carreraId: '',
          asignaturaId: '',
        },
      }));
      if (value) {
        const escuelasData = await fetchEscuelasBySede(value);
        setChartState((prev) => ({
          ...prev,
          filterOptions: {
            ...prev.filterOptions,
            escuelas: escuelasData || [],
            carreras: [],
            asignaturas: [],
          },
        }));
      } else {
        setChartState((prev) => ({
          ...prev,
          filterOptions: {
            ...prev.filterOptions,
            escuelas: [],
            carreras: [],
            asignaturas: [],
          },
        }));
      }
    } else if (filterName === 'escuelaId') {
      setChartState((prev) => ({
        ...prev,
        tempFilters: { ...prev.tempFilters, carreraId: '', asignaturaId: '' },
      }));
      if (value) {
        const carrerasData = await fetchCarrerasByEscuela(value);
        setChartState((prev) => ({
          ...prev,
          filterOptions: {
            ...prev.filterOptions,
            carreras: carrerasData || [],
            asignaturas: [],
          },
        }));
      } else {
        setChartState((prev) => ({
          ...prev,
          filterOptions: {
            ...prev.filterOptions,
            carreras: [],
            asignaturas: [],
          },
        }));
      }
    } else if (filterName === 'carreraId') {
      setChartState((prev) => ({
        ...prev,
        tempFilters: { ...prev.tempFilters, asignaturaId: '' },
      }));
      if (value) {
        const asignaturasData = await fetchAsignaturasByCarrera(value);
        setChartState((prev) => ({
          ...prev,
          filterOptions: {
            ...prev.filterOptions,
            asignaturas: asignaturasData || [],
          },
        }));
      } else {
        setChartState((prev) => ({
          ...prev,
          filterOptions: { ...prev.filterOptions, asignaturas: [] },
        }));
      }
    }
  };

  const handleApplyFilters = () => {
    setChartState((prev) => ({
      ...prev,
      filters: { ...prev.tempFilters },
      isFilterModalOpen: false,
    }));
  };

  const toggleTableView = () => {
    setChartState((prev) => ({ ...prev, showTable: !prev.showTable }));
  };

  const exportToExcel = () => {
    if (!chartState.data || chartState.data.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }
    const dataToExport = chartState.data.map((item) => ({
      Día: `${item.fecha_completa} (${item.dia_semana})`,
      'Estado Examen': item.estado_examen,
      'Cantidad de Exámenes': item.cantidad_examenes,
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ExamenesPorDia');
    XLSX.writeFile(wb, 'examenes_por_dia.xlsx');
  };

  const renderContent = () => {
    if (chartState.isLoading) return <p>Cargando Exámenes por Día...</p>;
    if (chartState.error)
      return <div className="alert alert-danger">{chartState.error}</div>;

    if (chartState.showTable) {
      return (
        <div
          className="table-responsive flex-grow-1"
          style={{ minHeight: '300px' }}
        >
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>Día</th>
                <th>Estado Examen</th>
                <th>Cantidad de Exámenes</th>
              </tr>
            </thead>
            <tbody>
              {chartState.data.map((item, index) => (
                <tr
                  key={`${item.fecha_completa}-${item.estado_examen || index}`}
                >
                  <td>
                    {item.fecha_completa} ({item.dia_semana})
                  </td>
                  <td>{item.estado_examen || 'N/A'}</td>
                  <td>{item.cantidad_examenes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // Para el gráfico, si quieres agrupar por estado_examen, necesitarás transformar los datos
    // o usar múltiples <Bar /> components con stackId si quieres apilarlos.
    // Por simplicidad, mostramos una barra por día_semana sumando todas las cantidades.
    // El tooltip puede mostrar más detalles si la API lo provee.
    return (
      <div className="flex-grow-1" style={{ minHeight: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartState.data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dia_semana" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="cantidad_examenes"
              name="Total Exámenes"
              fill={COLORS[0]}
            />
            {/* Si quisieras barras por estado_examen, necesitarías lógica adicional aquí */}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="card shadow h-100">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="card-title fw-semibold mb-0">Exámenes por Día</h5>
        <div className="chart-actions">
          <button
            onClick={toggleFilterModal}
            className="btn btn-sm btn-outline-secondary me-1"
            title="Filtrar"
          >
            <FaFilter />
          </button>
          <button
            onClick={toggleTableView}
            className="btn btn-sm btn-outline-secondary me-1"
            title={chartState.showTable ? 'Ver Gráfico' : 'Ver Tabla'}
          >
            {chartState.showTable ? <FaChartBar /> : <FaTable />}
          </button>
          <button
            onClick={exportToExcel}
            className="btn btn-sm btn-outline-success"
            title="Exportar a Excel"
          >
            <FaFileExcel />
          </button>
        </div>
      </div>
      <div className="card-body d-flex flex-column">{renderContent()}</div>

      <Modal
        isOpen={chartState.isFilterModalOpen}
        onRequestClose={toggleFilterModal}
        contentLabel="Filtros Exámenes por Día"
        className="ReactModal__Content"
        overlayClassName="ReactModal__Overlay"
      >
        <div className="modal-header">
          <h5 className="modal-title">Filtros para Exámenes por Día</h5>
          <button
            type="button"
            className="btn-close"
            onClick={toggleFilterModal}
          ></button>
        </div>
        <div className="modal-body">
          {/* Sede, Escuela, Carrera, Asignatura */}
          <div className="mb-3">
            <label htmlFor="epdSede" className="form-label">
              Sede
            </label>
            <select
              id="epdSede"
              className="form-select"
              value={chartState.tempFilters.sedeId}
              onChange={(e) => handleTempFilterChange('sedeId', e.target.value)}
            >
              <option value="">Todas</option>
              {chartState.filterOptions.sedes?.map((s) => (
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
              value={chartState.tempFilters.escuelaId}
              onChange={(e) =>
                handleTempFilterChange('escuelaId', e.target.value)
              }
              disabled={!chartState.tempFilters.sedeId}
            >
              <option value="">Todas</option>
              {chartState.filterOptions.escuelas?.map((e) => (
                <option key={e.ID_ESCUELA} value={e.ID_ESCUELA}>
                  {e.NOMBRE_ESCUELA}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label htmlFor="epdCarrera" className="form-label">
              Carrera
            </label>
            <select
              id="epdCarrera"
              className="form-select"
              value={chartState.tempFilters.carreraId}
              onChange={(e) =>
                handleTempFilterChange('carreraId', e.target.value)
              }
              disabled={!chartState.tempFilters.escuelaId}
            >
              <option value="">Todas</option>
              {chartState.filterOptions.carreras?.map((c) => (
                <option key={c.ID_CARRERA} value={c.ID_CARRERA}>
                  {c.NOMBRE_CARRERA}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label htmlFor="epdAsignatura" className="form-label">
              Asignatura
            </label>
            <select
              id="epdAsignatura"
              className="form-select"
              value={chartState.tempFilters.asignaturaId}
              onChange={(e) =>
                handleTempFilterChange('asignaturaId', e.target.value)
              }
              disabled={!chartState.tempFilters.carreraId}
            >
              <option value="">Todas</option>
              {chartState.filterOptions.asignaturas?.map((a) => (
                <option key={a.ID_ASIGNATURA} value={a.ID_ASIGNATURA}>
                  {a.NOMBRE_ASIGNATURA}
                </option>
              ))}
            </select>
          </div>
          {/* Jornada */}
          <div className="mb-3">
            <label htmlFor="epdJornada" className="form-label">
              Jornada
            </label>
            <select
              id="epdJornada"
              className="form-select"
              value={chartState.tempFilters.jornadaId}
              onChange={(e) =>
                handleTempFilterChange('jornadaId', e.target.value)
              }
            >
              <option value="">Todas</option>
              {chartState.filterOptions.jornadas?.map((j) => (
                <option key={j.ID_JORNADA} value={j.ID_JORNADA}>
                  {j.NOMBRE_JORNADA}
                </option>
              ))}
            </select>
          </div>
          {/* Estado Reserva */}
          <div className="mb-3">
            <label htmlFor="epdEstadoReserva" className="form-label">
              Estado de la Reserva
            </label>
            <select
              id="epdEstadoReserva"
              className="form-select"
              value={chartState.tempFilters.estadoReservaId}
              onChange={(e) =>
                handleTempFilterChange('estadoReservaId', e.target.value)
              }
            >
              <option value="">Todos</option>
              {chartState.filterOptions.todosLosEstados?.map((estado) => (
                <option key={estado.ID_ESTADO} value={estado.ID_ESTADO}>
                  {estado.NOMBRE_ESTADO}
                </option>
              ))}
            </select>
          </div>
          {/* Fechas */}
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="epdFechaDesde" className="form-label">
                Fecha Desde (Reserva)
              </label>
              <input
                type="date"
                id="epdFechaDesde"
                className="form-control"
                value={chartState.tempFilters.fechaDesde}
                onChange={(e) =>
                  handleTempFilterChange('fechaDesde', e.target.value)
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
                value={chartState.tempFilters.fechaHasta}
                onChange={(e) =>
                  handleTempFilterChange('fechaHasta', e.target.value)
                }
              />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={toggleFilterModal}
          >
            Cerrar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleApplyFilters}
          >
            Aplicar Filtros
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ExamenesPorDiaChart;
