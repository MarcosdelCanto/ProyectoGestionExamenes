import React, { useState, useEffect, useCallback } from 'react';
import Modal from 'react-modal';
import * as XLSX from 'xlsx';
import { FaFilter, FaFileExcel, FaTable } from 'react-icons/fa';

// Servicios para obtener datos de reportes
import { getReporteDetalladoExamenes } from '../services/reportsService';
// Servicios para opciones de filtros (reutilizar o adaptar de DashboardConGraficos)
import { fetchAllSedes } from '../services/sedeService';
import { fetchEscuelasBySede } from '../services/escuelaService';
import { fetchCarrerasByEscuela } from '../services/carreraService';
import { fetchAsignaturasByCarrera } from '../services/asignaturaService';
import { fetchAllJornadas } from '../services/jornadaService';
import { fetchAllEstados } from '../services/estadoService';

import './ReportesPage.css'; // Crea este archivo para estilos

Modal.setAppElement('#root');

const REPORT_TYPES = {
  DETALLE_EXAMENES: 'DETALLE_EXAMENES',
  // Agrega más tipos de reportes aquí
  // DETALLE_USO_SALAS: 'DETALLE_USO_SALAS',
};

const initialReportState = {
  data: [],
  isLoading: false,
  error: null,
  filters: {},
  tempFilters: {},
  filterOptions: {},
  isFilterModalOpen: false,
};

const ReportesPage = () => {
  const [selectedReportType, setSelectedReportType] = useState('');
  const [reportState, setReportState] = useState(initialReportState);

  const reportConfig = {
    [REPORT_TYPES.DETALLE_EXAMENES]: {
      title: 'Reporte Detallado de Exámenes',
      serviceFn: getReporteDetalladoExamenes,
      initialFilters: {
        sedeId: '',
        escuelaId: '',
        carreraId: '',
        asignaturaId: '',
        jornadaId: '',
        fechaDesde: '',
        fechaHasta: '',
        estadoExamenId: '',
        // estadoReservaId: '', // Si aplica
      },
      filterFields: [
        'sede',
        'escuela',
        'carrera',
        'asignatura',
        'jornada',
        'estado',
        'dateRange',
      ], // Define qué campos de filtro usar
      tableHeaders: [
        'ID Reserva',
        'Fecha/Hora',
        'Examen',
        'Asignatura',
        'Carrera',
        'Escuela',
        'Sede',
        'Sección',
        'Jornada',
        'Sala',
        'Docente',
        'Estado Examen',
        'Estado Reserva',
      ],
      excelMapper: (item) => ({
        'ID Reserva': item.ID_RESERVA,
        'Fecha/Hora Reserva': item.FECHA_HORA_RESERVA,
        'Nombre Examen': item.NOMBRE_EXAMEN,
        Asignatura: item.NOMBRE_ASIGNATURA,
        Carrera: item.NOMBRE_CARRERA,
        Escuela: item.NOMBRE_ESCUELA,
        Sede: item.NOMBRE_SEDE,
        Sección: item.NOMBRE_SECCION,
        Jornada: item.NOMBRE_JORNADA,
        Sala: item.NOMBRE_SALA,
        Docente: item.DOCENTE_ASIGNADO,
        'Estado Examen': item.ESTADO_EXAMEN,
        'Estado Reserva': item.ESTADO_RESERVA,
      }),
    },
    // Define configuraciones para otros reportes aquí
  };

  const currentConfig = reportConfig[selectedReportType];

  const loadReportData = useCallback(async () => {
    if (!currentConfig) return;

    setReportState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await currentConfig.serviceFn(reportState.filters);
      setReportState((prev) => ({ ...prev, data, isLoading: false }));
    } catch (err) {
      setReportState((prev) => ({
        ...prev,
        isLoading: false,
        error: `Error al cargar el reporte: ${err.response?.data?.message || err.message}`,
      }));
    }
  }, [selectedReportType, reportState.filters, currentConfig]);

  useEffect(() => {
    if (selectedReportType && currentConfig) {
      // Inicializar filtros cuando se selecciona un nuevo reporte
      setReportState((prev) => ({
        ...initialReportState, // Resetea data, isLoading, error
        filters: { ...currentConfig.initialFilters },
        tempFilters: { ...currentConfig.initialFilters },
      }));
      // La carga de datos se disparará por el cambio en reportState.filters en el siguiente useEffect
    } else {
      setReportState(initialReportState); // Limpiar si no hay reporte seleccionado
    }
  }, [selectedReportType, currentConfig]);

  useEffect(() => {
    if (
      selectedReportType &&
      currentConfig &&
      Object.keys(reportState.filters).length > 0
    ) {
      loadReportData();
    }
  }, [selectedReportType, reportState.filters, loadReportData, currentConfig]);

  const handleReportTypeChange = (e) => {
    setSelectedReportType(e.target.value);
  };

  const toggleFilterModal = async () => {
    if (
      !reportState.isFilterModalOpen &&
      Object.keys(reportState.filterOptions).length === 0 &&
      currentConfig
    ) {
      // Cargar opciones de filtro
      try {
        const [sedes, jornadas, estados] = await Promise.all([
          fetchAllSedes(),
          fetchAllJornadas(),
          fetchAllEstados(),
        ]);
        setReportState((prev) => ({
          ...prev,
          filterOptions: {
            sedes: sedes || [],
            jornadas: jornadas || [],
            estados: estados || [],
            escuelas: [],
            carreras: [],
            asignaturas: [], // Inicializar vacíos
          },
          isFilterModalOpen: !prev.isFilterModalOpen,
          tempFilters: { ...prev.filters },
        }));
      } catch (error) {
        console.error('Error loading initial filter options:', error);
        setReportState((prev) => ({
          ...prev,
          isFilterModalOpen: !prev.isFilterModalOpen,
          tempFilters: { ...prev.filters },
        }));
      }
    } else {
      setReportState((prev) => ({
        ...prev,
        isFilterModalOpen: !prev.isFilterModalOpen,
        tempFilters: { ...prev.filters },
      }));
    }
  };

  const handleTempFilterChange = async (filterName, value) => {
    setReportState((prev) => ({
      ...prev,
      tempFilters: { ...prev.tempFilters, [filterName]: value },
    }));

    // Lógica de carga dependiente (similar a DashboardConGraficos)
    if (filterName === 'sedeId') {
      const escuelas = value ? await fetchEscuelasBySede(value) : [];
      setReportState((prev) => ({
        ...prev,
        filterOptions: {
          ...prev.filterOptions,
          escuelas: escuelas || [],
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
    } else if (filterName === 'escuelaId') {
      const carreras = value ? await fetchCarrerasByEscuela(value) : [];
      setReportState((prev) => ({
        ...prev,
        filterOptions: {
          ...prev.filterOptions,
          carreras: carreras || [],
          asignaturas: [],
        },
        tempFilters: { ...prev.tempFilters, carreraId: '', asignaturaId: '' },
      }));
    } else if (filterName === 'carreraId') {
      const asignaturas = value ? await fetchAsignaturasByCarrera(value) : [];
      setReportState((prev) => ({
        ...prev,
        filterOptions: {
          ...prev.filterOptions,
          asignaturas: asignaturas || [],
        },
        tempFilters: { ...prev.tempFilters, asignaturaId: '' },
      }));
    }
  };

  const handleApplyFilters = () => {
    setReportState((prev) => ({
      ...prev,
      filters: { ...prev.tempFilters },
      isFilterModalOpen: false,
    }));
  };

  const exportToExcel = () => {
    if (!currentConfig || !reportState.data || reportState.data.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }
    const dataToExport = reportState.data.map(currentConfig.excelMapper);
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      ws,
      currentConfig.title.replace(/ /g, '_')
    );
    XLSX.writeFile(wb, `${currentConfig.title.replace(/ /g, '_')}.xlsx`);
  };

  // --- Renderizado del Modal de Filtros (simplificado, adaptar según `currentConfig.filterFields`) ---
  const renderFilterModalContent = () => {
    if (!currentConfig) return null;
    // Aquí construirías dinámicamente los campos del formulario basados en `currentConfig.filterFields`
    // Por ahora, un ejemplo para DETALLE_EXAMENES
    return (
      <>
        <div className="mb-3">
          <label htmlFor="repSede" className="form-label">
            Sede
          </label>
          <select
            id="repSede"
            className="form-select"
            value={reportState.tempFilters.sedeId}
            onChange={(e) => handleTempFilterChange('sedeId', e.target.value)}
          >
            <option value="">Todas</option>
            {reportState.filterOptions.sedes?.map((s) => (
              <option key={s.ID_SEDE} value={s.ID_SEDE}>
                {s.NOMBRE_SEDE}
              </option>
            ))}
          </select>
        </div>
        {/* Añadir más selectores para escuela, carrera, asignatura, jornada, estado, fechas, etc. */}
        {/* Ejemplo para Fecha Desde */}
        <div className="row">
          <div className="col-md-6 mb-3">
            <label htmlFor="repFechaDesde" className="form-label">
              Fecha Desde
            </label>
            <input
              type="date"
              id="repFechaDesde"
              className="form-control"
              value={reportState.tempFilters.fechaDesde}
              onChange={(e) =>
                handleTempFilterChange('fechaDesde', e.target.value)
              }
            />
          </div>
          <div className="col-md-6 mb-3">
            <label htmlFor="repFechaHasta" className="form-label">
              Fecha Hasta
            </label>
            <input
              type="date"
              id="repFechaHasta"
              className="form-control"
              value={reportState.tempFilters.fechaHasta}
              onChange={(e) =>
                handleTempFilterChange('fechaHasta', e.target.value)
              }
            />
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="container-fluid p-4 reportes-page">
      <div className="card shadow mb-4">
        <div className="card-header">
          <h4 className="card-title">Generador de Reportes</h4>
        </div>
        <div className="card-body">
          <div className="mb-3">
            <label htmlFor="reportTypeSelect" className="form-label">
              Seleccione un tipo de reporte:
            </label>
            <select
              id="reportTypeSelect"
              className="form-select"
              value={selectedReportType}
              onChange={handleReportTypeChange}
            >
              <option value="" disabled>
                -- Elegir Reporte --
              </option>
              <option value={REPORT_TYPES.DETALLE_EXAMENES}>
                Reporte Detallado de Exámenes
              </option>
              {/* <option value={REPORT_TYPES.DETALLE_USO_SALAS}>Reporte Detallado de Uso de Salas</option> */}
            </select>
          </div>
        </div>
      </div>

      {selectedReportType && currentConfig && (
        <div className="card shadow">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="card-title mb-0">{currentConfig.title}</h5>
            <div>
              <button
                onClick={toggleFilterModal}
                className="btn btn-sm btn-outline-secondary me-2"
                title="Filtrar"
              >
                <FaFilter /> Filtrar
              </button>
              <button
                onClick={exportToExcel}
                className="btn btn-sm btn-outline-success"
                title="Exportar a Excel"
              >
                <FaFileExcel /> Exportar
              </button>
            </div>
          </div>
          <div className="card-body">
            {reportState.isLoading && <p>Cargando reporte...</p>}
            {reportState.error && (
              <div className="alert alert-danger">{reportState.error}</div>
            )}
            {!reportState.isLoading &&
              !reportState.error &&
              reportState.data.length === 0 && (
                <p>No hay datos para mostrar con los filtros actuales.</p>
              )}
            {!reportState.isLoading &&
              !reportState.error &&
              reportState.data.length > 0 && (
                <div className="table-responsive">
                  <table className="table table-striped table-hover table-bordered">
                    <thead>
                      <tr>
                        {currentConfig.tableHeaders.map((header) => (
                          <th key={header}>{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportState.data.map((item, index) => {
                        const mappedItem = currentConfig.excelMapper(item);
                        const rowKey =
                          item.ID_RESERVA || item.ID_EXAMEN || index;
                        return (
                          <tr key={rowKey}>
                            {Object.values(mappedItem).map(
                              (value, cellIndex) => (
                                // Usar cellIndex para la clave de la celda si las claves de mappedItem no son estables/únicas para la celda
                                <td key={`${rowKey}-${cellIndex}`}>{value}</td>
                              )
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        </div>
      )}

      {currentConfig && (
        <Modal
          isOpen={reportState.isFilterModalOpen}
          onRequestClose={toggleFilterModal}
          contentLabel={`Filtros para ${currentConfig.title}`}
          className="ReactModal__Content"
          overlayClassName="ReactModal__Overlay"
        >
          <div className="modal-header">
            <h5 className="modal-title">Filtros para {currentConfig.title}</h5>
            <button
              type="button"
              className="btn-close"
              onClick={toggleFilterModal}
            ></button>
          </div>
          <div className="modal-body">{renderFilterModalContent()}</div>
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
      )}
    </div>
  );
};

export default ReportesPage;
