import React from 'react';

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

  const modalStyle = {
    position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
    backgroundColor: 'white', padding: '25px', borderRadius: '8px',
    boxShadow: '0 5px 15px rgba(0,0,0,0.3)', zIndex: 1050, width: '90%', maxWidth: '500px',
  };
  const backdropStyle = {
    position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040,
  };
  const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' };
  const selectContainerStyle = { display: 'flex', flexDirection: 'column', gap: '15px' };

  return (
    <>
      <div style={backdropStyle} onClick={onClose}></div>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <h5>Filtrar Salas</h5>
          <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
        </div>
        <div style={selectContainerStyle}>
          <div className="form-group">
            <label htmlFor="sedeSelect" className="form-label form-label-sm">Sede:</label>
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
            <label htmlFor="edificioSelect" className="form-label form-label-sm">Edificio:</label>
            <select
              id="edificioSelect"
              className="form-select form-select-sm"
              value={selectedEdificio}
              onChange={(e) => onSetSelectedEdificio(e.target.value)}
              disabled={!selectedSede && edificiosDisponibles.some(e => e.SEDE_ID_SEDE)} // Deshabilitar si no hay sede y los edificios dependen de ella
            >
              <option value="">Todos los Edificios</option>
              {edificiosDisponibles
                .filter(edificio => !selectedSede || edificio.SEDE_ID_SEDE === parseInt(selectedSede)) // Filtrar edificios por sede seleccionada
                .map((edificio) => (
                <option key={edificio.ID_EDIFICIO} value={edificio.ID_EDIFICIO}>
                  {edificio.NOMBRE_EDIFICIO}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3 d-flex justify-content-end">
          <button className="btn btn-primary btn-sm" onClick={onAplicarFiltros}>
            Aplicar y Cerrar
          </button>
        </div>
      </div>
    </>
  );
}