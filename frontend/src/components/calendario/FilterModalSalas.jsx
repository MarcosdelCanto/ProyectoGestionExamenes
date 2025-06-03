import React from 'react';
import './styles/Modal.css';

export default function FilterModalSalas({
  isOpen,
  onClose,
  sedesDisponibles,
  selectedSede,
  onSetSelectedSede,
  edificiosDisponibles,
  selectedEdificio,
  onSetSelectedEdificio,
  onAplicarFiltros, // Para cerrar el modal y aplicar
}) {
  if (!isOpen) return null;

  return (
    <>
      <div className="modal-backdrop" onClick={onClose}></div>
      <div className="modal-container">
        <div className="modal-header">
          <h5>Filtrar Salas</h5>
          <button
            type="button"
            className="btn-close"
            aria-label="Close"
            onClick={onClose}
          ></button>
        </div>
        <div className="modal-content">
          <div className="form-group">
            <label htmlFor="sedeSelect" className="form-label form-label-sm">
              Sede:
            </label>
            <select
              id="sedeSelect"
              className="form-select form-select-sm"
              value={selectedSede}
              onChange={(e) => onSetSelectedSede(e.target.value)}
            >
              <option value="">Todas las Sedes</option>
              {sedesDisponibles.map((sede) => (
                <option key={sede.ID_SEDE} value={sede.ID_SEDE}>
                  {sede.NOMBRE_SEDE}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label
              htmlFor="edificioSelect"
              className="form-label form-label-sm"
            >
              Edificio:
            </label>
            <select
              id="edificioSelect"
              className="form-select form-select-sm"
              value={selectedEdificio}
              onChange={(e) => onSetSelectedEdificio(e.target.value)}
              disabled={
                !selectedSede &&
                edificiosDisponibles.some((e) => e.SEDE_ID_SEDE)
              } // Deshabilitar si no hay sede y los edificios dependen de ella
            >
              <option value="">Todos los Edificios</option>
              {edificiosDisponibles
                .filter(
                  (edificio) =>
                    !selectedSede ||
                    edificio.SEDE_ID_SEDE === parseInt(selectedSede)
                ) // Filtrar edificios por sede seleccionada
                .map((edificio) => (
                  <option
                    key={edificio.ID_EDIFICIO}
                    value={edificio.ID_EDIFICIO}
                  >
                    {edificio.NOMBRE_EDIFICIO}
                  </option>
                ))}
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary btn-sm" onClick={onAplicarFiltros}>
            Aplicar y Cerrar
          </button>
        </div>
      </div>
    </>
  );
}
