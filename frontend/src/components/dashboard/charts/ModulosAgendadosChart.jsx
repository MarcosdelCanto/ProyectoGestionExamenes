import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import * as XLSX from 'xlsx';
import { FaFilter, FaTable, FaChartBar, FaFileExcel } from 'react-icons/fa';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { getModulosAgendadosData } from '../../../services/dashboardService';
import { fetchAllJornadas } from '../../../services/jornadaService';
import { fetchAllEstados } from '../../../services/estadoService'; // Asumiendo que tienes un servicio para estados

const COLORS = [
  '#198754',
  '#0d6efd',
  '#ffc107',
  '#dc3545',
  '#6f42c1',
  '#fd7e14',
]; // Color diferente para este gráfico

const initialChartState = {
  data: [],
  isLoading: true,
  error: null,
  isFilterModalOpen: false,
  showTable: false,
  filterOptions: { jornadas: [], estadosModulo: [] },
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
};

const ModulosAgendadosChart = () => {
  const [chartState, setChartState] = useState(initialChartState);

  const fetchData = async (currentFilters) => {
    setChartState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await getModulosAgendadosData(currentFilters);
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
      console.error('Error fetching Módulos Agendados data:', err);
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
      const [jornadasRes, estadosRes] = await Promise.all([
        fetchAllJornadas(),
        fetchAllEstados(), // Asume que esto devuelve todos los estados
      ]);
      const estadosModuloFiltrados = (estadosRes || []).filter(
        (e) => e.NOMBRE_ESTADO === 'ACTIVO' || e.NOMBRE_ESTADO === 'Inactivo' // Ajusta según tus nombres de estado
      );

      setChartState((prev) => ({
        ...prev,
        filterOptions: {
          jornadas: jornadasRes || [],
          estadosModulo: estadosModuloFiltrados,
        },
      }));
    } catch (error) {
      console.error(
        'Error loading filter options for Modulos Agendados:',
        error
      );
      setChartState((prev) => ({
        ...prev,
        filterOptions: { jornadas: [], estadosModulo: [] },
      }));
    }
  };

  const toggleFilterModal = () => {
    setChartState((prev) => {
      const openingModal = !prev.isFilterModalOpen;
      if (
        openingModal &&
        (prev.filterOptions.jornadas.length === 0 ||
          prev.filterOptions.estadosModulo.length === 0)
      ) {
        loadFilterOptions();
      }
      return {
        ...prev,
        isFilterModalOpen: openingModal,
        tempFilters: openingModal ? { ...prev.filters } : prev.tempFilters,
      };
    });
  };

  const handleTempFilterChange = (filterName, value) => {
    setChartState((prev) => ({
      ...prev,
      tempFilters: { ...prev.tempFilters, [filterName]: value },
    }));
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
      'Módulo (Hora)': item.hora, // Asegúrate que 'hora' sea la propiedad correcta
      'Cantidad Agendada': item.cantidad, // Asegúrate que 'cantidad' sea la propiedad correcta
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ModulosAgendados');
    XLSX.writeFile(wb, 'modulos_agendados.xlsx');
  };

  const renderContent = () => {
    if (chartState.isLoading) return <p>Cargando Módulos Agendados...</p>;
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
                <th>Módulo (Hora)</th>
                <th>Cantidad Agendada</th>
              </tr>
            </thead>
            <tbody>
              {chartState.data.map((item) => (
                <tr key={item.hora}>
                  {/* Asume que 'hora' es único */}
                  <td>{item.hora}</td>
                  <td>{item.cantidad}</td>
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
          <LineChart
            data={chartState.data}
            margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hora" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="cantidad"
              stroke={COLORS[0]}
              strokeWidth={2}
              name="Cantidad Agendada"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="card shadow h-100">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="card-title fw-semibold mb-0">Módulos más Agendados</h5>
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
        contentLabel="Filtros Módulos Agendados"
        className="ReactModal__Content"
        overlayClassName="ReactModal__Overlay"
      >
        <div className="modal-header">
          <h5 className="modal-title">Filtros para Módulos Agendados</h5>
          <button
            type="button"
            className="btn-close"
            onClick={toggleFilterModal}
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
          <div className="mb-3">
            <label htmlFor="maEstadoModulo" className="form-label">
              Estado del Módulo
            </label>
            <select
              id="maEstadoModulo"
              className="form-select"
              value={chartState.tempFilters.estadoModuloId}
              onChange={(e) =>
                handleTempFilterChange('estadoModuloId', e.target.value)
              }
            >
              <option value="">Todos</option>
              {chartState.filterOptions.estadosModulo?.map((e) => (
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
                value={chartState.tempFilters.fechaDesde}
                onChange={(e) =>
                  handleTempFilterChange('fechaDesde', e.target.value)
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

export default ModulosAgendadosChart;
