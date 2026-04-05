// src/components/reportes/ReportToolbar.jsx
import React from 'react';
import { FaFilter, FaFileExcel, FaCog } from 'react-icons/fa'; // <-- Añadimos FaCog

const ReportToolbar = ({
  title,
  onFilterClick,
  onExportClick,
  isExportDisabled = false,
  onConfigureColumnsClick, // <-- NUEVA PROP
}) => {
  return (
    <div className="d-flex justify-content-between align-items-center">
      <h5 className="card-title mb-0">{title}</h5>
      {/* Usamos el título pasado como prop */}
      <div>
        <button
          onClick={onFilterClick}
          className="btn btn-sm btn-toolbar-yellow me-2"
          title="Filtrar Resultados"
        >
          <FaFilter /> Filtrar
        </button>
        <button
          onClick={onConfigureColumnsClick}
          className="btn btn-sm btn-toolbar-gray me-2"
          title="Configurar Columnas Visibles"
        >
          <FaCog /> Columnas
        </button>
        <button
          onClick={onExportClick}
          className="btn btn-sm btn-toolbar-excel"
          title="Exportar a Excel"
          disabled={isExportDisabled}
        >
          <FaFileExcel /> Exportar
        </button>
      </div>
    </div>
  );
};

export default ReportToolbar;
