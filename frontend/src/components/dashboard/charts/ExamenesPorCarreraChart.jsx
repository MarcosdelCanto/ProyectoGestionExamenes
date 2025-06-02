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
} from 'recharts';
import { getExamenesPorCarreraData } from '../../../services/dashboardService';
import { fetchAllSedes } from '../../../services/sedeService';
import { fetchEscuelasBySede } from '../../../services/escuelaService';
import { fetchCarrerasByEscuela } from '../../../services/carreraService';

const COLORS = [
  '#0d6efd',
  '#198754',
  '#ffc107',
  '#dc3545',
  '#6f42c1',
  '#fd7e14',
];

const initialChartState = {
  data: [],
  isLoading: true,
  error: null,
  isFilterModalOpen: false,
  showTable: false,
  filterOptions: { sedes: [], escuelas: [], carreras: [] },
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
};

const ExamenesPorCarreraChart = () => {
  const [chartState, setChartState] = useState(initialChartState);

  const fetchData = async (currentFilters) => {
    setChartState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await getExamenesPorCarreraData(currentFilters);
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
      console.error('Error fetching Exámenes por Carrera data:', err);
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
      const sedesRes = await fetchAllSedes();
      let newFilterOptions = {
        sedes: sedesRes || [],
        escuelas: [],
        carreras: [],
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
        }
      }
      setChartState((prev) => ({ ...prev, filterOptions: newFilterOptions }));
    } catch (error) {
      console.error(
        'Error loading filter options for Examenes por Carrera:',
        error
      );
      setChartState((prev) => ({
        ...prev,
        filterOptions: { sedes: [], escuelas: [], carreras: [] },
      }));
    }
  };

  const toggleFilterModal = () => {
    setChartState((prev) => {
      const openingModal = !prev.isFilterModalOpen;
      if (openingModal && Object.keys(prev.filterOptions.sedes).length === 0) {
        // Load options if modal is opening and options are not loaded
        loadFilterOptions();
      }
      return {
        ...prev,
        isFilterModalOpen: openingModal,
        tempFilters: openingModal ? { ...prev.filters } : prev.tempFilters, // Reset tempFilters if opening, or keep if closing (e.g. for apply)
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
        tempFilters: { ...prev.tempFilters, escuelaId: '', carreraId: '' },
      }));
      if (value) {
        const escuelasData = await fetchEscuelasBySede(value);
        setChartState((prev) => ({
          ...prev,
          filterOptions: {
            ...prev.filterOptions,
            escuelas: escuelasData || [],
            carreras: [],
          },
        }));
      } else {
        setChartState((prev) => ({
          ...prev,
          filterOptions: { ...prev.filterOptions, escuelas: [], carreras: [] },
        }));
      }
    }
    if (filterName === 'escuelaId') {
      setChartState((prev) => ({
        ...prev,
        tempFilters: { ...prev.tempFilters, carreraId: '' },
      }));
      if (value) {
        const carrerasData = await fetchCarrerasByEscuela(value);
        setChartState((prev) => ({
          ...prev,
          filterOptions: {
            ...prev.filterOptions,
            carreras: carrerasData || [],
          },
        }));
      } else {
        setChartState((prev) => ({
          ...prev,
          filterOptions: { ...prev.filterOptions, carreras: [] },
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
      Carrera: item.name,
      'Cantidad de Exámenes': item.value,
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ExamenesPorCarrera');
    XLSX.writeFile(wb, 'examenes_por_carrera.xlsx');
  };

  const renderContent = () => {
    if (chartState.isLoading) return <p>Cargando Exámenes por Carrera...</p>;
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
                <th>Carrera</th>
                <th>Cantidad de Exámenes</th>
              </tr>
            </thead>
            <tbody>
              {chartState.data.map((item) => (
                <tr key={item.name}>
                  <td>{item.name}</td>
                  <td>{item.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <div className="flex-grow-1" style={{ minHeight: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartState.data}
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
      </div>
    );
  };

  return (
    <div className="card shadow h-100">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="card-title fw-semibold mb-0">Exámenes por Carrera</h5>
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
        contentLabel="Filtros Exámenes por Carrera"
        className="ReactModal__Content"
        overlayClassName="ReactModal__Overlay"
      >
        <div className="modal-header">
          <h5 className="modal-title">Filtros para Exámenes por Carrera</h5>
          <button
            type="button"
            className="btn-close"
            onClick={toggleFilterModal}
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
            <label htmlFor="ecEscuela" className="form-label">
              Escuela
            </label>
            <select
              id="ecEscuela"
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
            <label htmlFor="ecCarrera" className="form-label">
              Carrera
            </label>
            <select
              id="ecCarrera"
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
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="ecFechaDesde" className="form-label">
                Fecha Desde (Reserva)
              </label>
              <input
                type="date"
                id="ecFechaDesde"
                className="form-control"
                value={chartState.tempFilters.fechaDesde}
                onChange={(e) =>
                  handleTempFilterChange('fechaDesde', e.target.value)
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

export default ExamenesPorCarreraChart;
