import React, { useState, useEffect, useMemo } from 'react';
import Modal from 'react-modal';
import Select from 'react-select';
import * as XLSX from 'xlsx';

// Hook y componentes de UI
import Layout from '../components/Layout';
import { useReportData } from '../components/reportes/useReportData';
import FilterModal from '../components/reportes/FilterModal';
import FilterForm from '../components/reportes/FilterForm';
import ReportTable from '../components/reportes/ReportTable';
import ReportToolbar from '../components/reportes/ReportToolbar';
import ColumnSelectorModal from '../components/reportes/ColumnSelectorModal';
import PaginationComponent from '../components/PaginationComponent';
import { reportConfig, REPORT_TYPES } from './reportConfig';
import './ReportesPage.css';
Modal.setAppElement('#root');
const ITEMS_PER_PAGE_REPORT = 6; // O el número de filas que prefieras para los reportes

const ReportesPage = () => {
  const [selectedReportType, setSelectedReportType] = useState(
    REPORT_TYPES.DETALLE_EXAMENES
  );
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [isReportSelectOpen, setIsReportSelectOpen] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [currentPageReport, setCurrentPageReport] = useState(1);

  const currentConfig = reportConfig[selectedReportType];

  const handleReportTypeChange = (e) => {
    setSelectedReportType(e.target.value);
  };

  const {
    data,
    isLoading,
    error,
    tempFilters,
    filterOptions,
    loadReportData,
    loadFilterOptions,
    handleTempFilterChange,
    applyFilters,
    resetTempFilters,
  } = useReportData(currentConfig);

  useEffect(() => {
    if (currentConfig) {
      loadReportData();
      const initialVisibility = {};
      setCurrentPageReport(1); // Resetear paginación al cambiar de reporte
      if (currentConfig.tableHeaders) {
        currentConfig.tableHeaders.forEach((header) => {
          initialVisibility[header] = true;
        });
      }
      setColumnVisibility(initialVisibility);
    }
  }, [currentConfig, loadReportData]);

  const openFilterModal = () => {
    loadFilterOptions();
    resetTempFilters();
    setIsFilterModalOpen(true);
  };

  const closeFilterModal = () => {
    setIsFilterModalOpen(false);
  };

  const handleApplyFilters = () => {
    applyFilters();
    setCurrentPageReport(1); // Resetear paginación al aplicar filtros
    closeFilterModal();
  };

  const openColumnSelectorModal = () => {
    console.log(
      '[ReportesPage] openColumnSelectorModal fue llamada. Cambiando isColumnModalOpen a true.'
    ); // Log para depurar
    setIsColumnModalOpen(true);
  };

  const closeColumnSelectorModal = () => {
    setIsColumnModalOpen(false);
  };

  const handleApplyColumnVisibility = (newVisibility) => {
    setColumnVisibility(newVisibility);
    closeColumnSelectorModal();
  };

  const exportToExcel = () => {
    if (!currentConfig || !data || data.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }
    const visibleHeaders = getVisibleHeaders();
    const dataToExport = data.map((item) => {
      const mappedItem = currentConfig.excelMapper(item);
      const filteredItem = {};
      visibleHeaders.forEach((header) => {
        filteredItem[header] = mappedItem[header];
      });
      return filteredItem;
    });
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      ws,
      currentConfig.title.replace(/ /g, '_')
    );
    XLSX.writeFile(wb, `${currentConfig.title.replace(/ /g, '_')}.xlsx`);
  };

  const getVisibleHeaders = () => {
    if (!currentConfig || !currentConfig.tableHeaders) return [];
    return currentConfig.tableHeaders.filter(
      (header) => columnVisibility[header]
    );
  };

  // Log para depurar el estado del modal de columnas
  useEffect(() => {
    console.log(
      '[ReportesPage] El estado isColumnModalOpen cambió a:',
      isColumnModalOpen
    );
  }, [isColumnModalOpen]);

  // Lógica de Paginación para el reporte
  const indexOfLastItemReport = currentPageReport * ITEMS_PER_PAGE_REPORT;
  const indexOfFirstItemReport = indexOfLastItemReport - ITEMS_PER_PAGE_REPORT;
  const currentReportDataOnPage = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.slice(indexOfFirstItemReport, indexOfLastItemReport);
  }, [data, indexOfFirstItemReport, indexOfLastItemReport]);

  const paginateReport = (pageNumber) => setCurrentPageReport(pageNumber);

  return (
    <Layout>
      {/* <--- 2. ENVUELVES TODO EL CONTENIDO DE TU PÁGINA CON EL LAYOUT */}
      <div className="container-fluid p-4 reportes-page">
        {isReportSelectOpen && (
          <div
            onClick={() => setIsReportSelectOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.35)',
              backdropFilter: 'blur(3px)',
              zIndex: 9998,
            }}
          />
        )}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="display-6">
            <i className="bi bi-file-earmark-bar-graph-fill me-3"></i>
            Reportes
          </h2>
        </div>
        <hr />
        <div
          className="card shadow mb-4"
          style={
            isReportSelectOpen ? { position: 'relative', zIndex: 9999 } : {}
          }
        >
          <div className="card-header">
            <h4 className="card-title">Generador de Reportes</h4>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label">
                Seleccione un tipo de reporte:
              </label>
              <Select
                inputId="reportTypeSelect"
                onMenuOpen={() => setIsReportSelectOpen(true)}
                onMenuClose={() => setIsReportSelectOpen(false)}
                options={[
                  {
                    value: REPORT_TYPES.DETALLE_EXAMENES,
                    label: 'Reporte Detallado de Exámenes',
                  },
                  {
                    value: REPORT_TYPES.ALUMNOS_RESERVAS,
                    label: 'Reporte de Alumnos y sus Reservas',
                  },
                ]}
                value={[
                  {
                    value: REPORT_TYPES.DETALLE_EXAMENES,
                    label: 'Reporte Detallado de Exámenes',
                  },
                  {
                    value: REPORT_TYPES.ALUMNOS_RESERVAS,
                    label: 'Reporte de Alumnos y sus Reservas',
                  },
                ].find((o) => o.value === selectedReportType)}
                onChange={(opt) =>
                  handleReportTypeChange({ target: { value: opt.value } })
                }
                styles={{
                  control: (base, state) => ({
                    ...base,
                    borderColor: state.isFocused ? '#6c757d' : '#ced4da',
                    boxShadow: state.isFocused
                      ? '0 0 0 0.2rem rgba(108,117,125,0.25)'
                      : 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.9rem',
                    '&:hover': { borderColor: '#6c757d' },
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected
                      ? '#1a1a1a'
                      : state.isFocused
                        ? '#f0f0f0'
                        : '#ffffff',
                    color: state.isSelected ? '#ffffff' : '#2d2d2d',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    ':active': { backgroundColor: '#d6d8db', color: '#1a1a1a' },
                  }),
                  singleValue: (base) => ({ ...base, color: '#2d2d2d' }),
                  indicatorSeparator: () => ({ display: 'none' }),
                  dropdownIndicator: (base) => ({ ...base, color: '#6c757d' }),
                  menu: (base) => ({
                    ...base,
                    borderRadius: '0.375rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 9999,
                  }),
                  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                }}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            </div>
          </div>
        </div>

        {currentConfig && (
          <div className="card shadow mb-4">
            <div className="card-header">
              <ReportToolbar
                title={currentConfig.title}
                onFilterClick={openFilterModal}
                onExportClick={exportToExcel}
                isExportDisabled={!data || data.length === 0}
                onConfigureColumnsClick={openColumnSelectorModal}
              />
            </div>

            <div className="p-1">
              <ReportTable
                headers={getVisibleHeaders()}
                allHeaders={currentConfig.tableHeaders}
                columnVisibility={columnVisibility}
                data={currentReportDataOnPage} // Pasar solo los datos de la página actual
                mapper={currentConfig.excelMapper}
                isLoading={isLoading}
                error={error}
              />
            </div>
          </div>
        )}

        {currentConfig &&
          data &&
          data.length > ITEMS_PER_PAGE_REPORT &&
          !isLoading && (
            <PaginationComponent
              itemsPerPage={ITEMS_PER_PAGE_REPORT}
              totalItems={data.length} // Total de items del reporte completo
              paginate={paginateReport}
              currentPage={currentPageReport}
            />
          )}

        {currentConfig && (
          <FilterModal
            isOpen={isFilterModalOpen}
            onRequestClose={closeFilterModal}
            title={`Filtros para ${currentConfig.title}`}
            onApply={handleApplyFilters}
          >
            <FilterForm
              config={currentConfig}
              tempFilters={tempFilters}
              filterOptions={filterOptions}
              onFilterChange={handleTempFilterChange}
            />
          </FilterModal>
        )}

        {/* --- 2. DESCOMENTA ESTE BLOQUE COMPLETO --- */}
        {currentConfig && (
          <ColumnSelectorModal
            isOpen={isColumnModalOpen}
            onRequestClose={closeColumnSelectorModal}
            allHeaders={currentConfig.tableHeaders}
            currentVisibility={columnVisibility}
            onApply={handleApplyColumnVisibility}
            reportTitle={currentConfig.title}
          />
        )}
      </div>
    </Layout>
  );
};

export default ReportesPage;
