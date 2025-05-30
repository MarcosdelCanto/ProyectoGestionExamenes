import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import * as XLSX from 'xlsx';
import { FaFilter, FaTable, FaChartBar, FaFileExcel } from 'react-icons/fa';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { getUsoSalasData } from '../../../services/dashboardService';
import { fetchAllSedes } from '../../../services/sedeService';
import { fetchEdificiosBySede } from '../../../services/edificioService';

const COLORS_PIE = [
  '#0d6efd',
  '#198754',
  '#ffc107',
  '#dc3545',
  '#6f42c1',
  '#fd7e14',
]; // Colores para el PieChart

const initialChartState = {
  data: [], // Espera datos en formato { name: 'Estado', value: cantidad }
  isLoading: true,
  error: null,
  isFilterModalOpen: false,
  showTable: false,
  filterOptions: { sedes: [], edificios: [] },
  filters: {
    sedeId: '',
    edificioId: '',
    fecha: '',
    // capacidadMin: '', // Descomentar si se implementa
    // capacidadMax: '', // Descomentar si se implementa
  },
  tempFilters: {
    sedeId: '',
    edificioId: '',
    fecha: '',
    // capacidadMin: '',
    // capacidadMax: '',
  },
};

const UsoSalasChart = () => {
  const [chartState, setChartState] = useState(initialChartState);

  const fetchData = async (currentFilters) => {
    setChartState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await getUsoSalasData(currentFilters);
      // Asegurarse que los datos tengan 'name' y 'value'
      const actualData = (
        Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : []
      ).map((item) => ({
        name: item.name || item.estado || 'Desconocido',
        value: item.value || item.cantidad || 0,
      }));

      setChartState((prev) => ({
        ...prev,
        data: actualData,
        isLoading: false,
      }));
    } catch (err) {
      console.error('Error fetching Uso de Salas data:', err);
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
        edificios: [],
      };

      if (chartState.tempFilters.sedeId) {
        const edificiosData = await fetchEdificiosBySede(
          chartState.tempFilters.sedeId
        );
        newFilterOptions.edificios = edificiosData || [];
      }
      setChartState((prev) => ({ ...prev, filterOptions: newFilterOptions }));
    } catch (error) {
      console.error('Error loading filter options for Uso de Salas:', error);
      setChartState((prev) => ({
        ...prev,
        filterOptions: { sedes: [], edificios: [] },
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
        tempFilters: { ...prev.tempFilters, edificioId: '' },
      }));
      if (value) {
        const edificiosData = await fetchEdificiosBySede(value);
        setChartState((prev) => ({
          ...prev,
          filterOptions: {
            ...prev.filterOptions,
            edificios: edificiosData || [],
          },
        }));
      } else {
        setChartState((prev) => ({
          ...prev,
          filterOptions: { ...prev.filterOptions, edificios: [] },
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
      Estado: item.name,
      Cantidad: item.value,
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'UsoSalas');
    XLSX.writeFile(wb, 'uso_salas.xlsx');
  };

  const renderContent = () => {
    if (chartState.isLoading) return <p>Cargando Uso de Salas...</p>;
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
                <th>Estado</th>
                <th>Cantidad</th>
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
      <div
        className="flex-grow-1 d-flex justify-content-center align-items-center"
        style={{ minHeight: '300px', width: '100%' }}
      >
        <ResponsiveContainer width="90%" height={300}>
          <PieChart>
            <Pie
              data={chartState.data}
              cx="50%"
              cy="50%"
              outerRadius={100}
              dataKey="value"
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
            >
              {chartState.data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS_PIE[index % COLORS_PIE.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="card shadow h-100">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="card-title fw-semibold mb-0">Uso de Salas</h5>
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
        contentLabel="Filtros Uso de Salas"
        className="ReactModal__Content"
        overlayClassName="ReactModal__Overlay"
      >
        <div className="modal-header">
          <h5 className="modal-title">Filtros para Uso de Salas</h5>
          <button
            type="button"
            className="btn-close"
            onClick={toggleFilterModal}
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
            <label htmlFor="usEdificio" className="form-label">
              Edificio
            </label>
            <select
              id="usEdificio"
              className="form-select"
              value={chartState.tempFilters.edificioId}
              onChange={(e) =>
                handleTempFilterChange('edificioId', e.target.value)
              }
              disabled={!chartState.tempFilters.sedeId}
            >
              <option value="">Todos</option>
              {chartState.filterOptions.edificios?.map((e) => (
                <option key={e.ID_EDIFICIO} value={e.ID_EDIFICIO}>
                  {e.NOMBRE_EDIFICIO}
                </option>
              ))}
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
              value={chartState.tempFilters.fecha}
              onChange={(e) => handleTempFilterChange('fecha', e.target.value)}
            />
          </div>
          {/* TODO: Filtros de capacidad si se implementan */}
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

export default UsoSalasChart;
