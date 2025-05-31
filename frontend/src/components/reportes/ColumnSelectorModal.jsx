// src/components/reportes/ColumnSelectorModal.jsx

import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';

const ColumnSelectorModal = ({
  isOpen,
  onRequestClose,
  allHeaders,
  currentVisibility,
  onApply,
  reportTitle,
}) => {
  const [tempVisibility, setTempVisibility] = useState(currentVisibility);

  // Actualiza la visibilidad temporal si cambia la visibilidad actual (ej. al cambiar de reporte)
  useEffect(() => {
    setTempVisibility(currentVisibility);
  }, [currentVisibility, isOpen]); // Se actualiza también cuando se abre el modal

  const handleCheckboxChange = (header) => {
    setTempVisibility((prev) => ({
      ...prev,
      [header]: !prev[header],
    }));
  };

  const handleApplyClick = () => {
    onApply(tempVisibility);
  };

  if (!allHeaders || allHeaders.length === 0) {
    return null; // No mostrar el modal si no hay cabeceras
  }

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel={`Seleccionar Columnas para ${reportTitle}`}
      className="ReactModal__Content"
      overlayClassName="ReactModal__Overlay"
    >
      <div className="modal-header">
        <h5 className="modal-title">
          Seleccionar Columnas Visibles para "{reportTitle}"
        </h5>
        <button
          type="button"
          className="btn-close"
          aria-label="Close"
          onClick={onRequestClose}
        ></button>
      </div>
      <div className="modal-body">
        <p>Selecciona las columnas que deseas ver en el reporte:</p>
        <div className="row">
          {allHeaders.map((header) => (
            <div className="col-md-6 col-lg-4 mb-2" key={header}>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={`checkbox-${header.replace(/\s+/g, '-')}`} // ID único para el input
                  checked={!!tempVisibility[header]} // Asegura que sea booleano
                  onChange={() => handleCheckboxChange(header)}
                />
                <label
                  className="form-check-label"
                  htmlFor={`checkbox-${header.replace(/\s+/g, '-')}`}
                >
                  {header}
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="modal-footer">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onRequestClose}
        >
          Cancelar
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleApplyClick}
        >
          Aplicar Cambios
        </button>
      </div>
    </Modal>
  );
};

export default ColumnSelectorModal;
