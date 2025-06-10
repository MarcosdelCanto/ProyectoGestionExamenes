// src/components/examenes/FilterModalExamenes.jsx

import React from 'react';
// Asumiendo que tienes un archivo CSS para tus modales
import '../calendario/styles/Modal.css';

export default function FilterModalExamenes({
  // Props para controlar el modal
  isOpen,
  onClose,
  onAplicarFiltros,

  // Props para los datos de los filtros
  sedes,
  escuelas,
  carreras,
  asignaturas,

  // Props para el estado de los filtros seleccionados
  selectedSede,
  onSetSelectedSede,
  selectedEscuela,
  onSetSelectedEscuela,
  selectedCarrera,
  onSetSelectedCarrera,
  selectedAsignatura,
  onSetSelectedAsignatura,
}) {
  if (!isOpen) return null;

  // Lógica para filtrar las opciones de los dropdowns en cascada
  const escuelasFiltradas = escuelas.filter(
    (escuela) =>
      !selectedSede || escuela.SEDE_ID_SEDE === parseInt(selectedSede)
  );
  const carrerasFiltradas = carreras.filter(
    (carrera) =>
      !selectedEscuela ||
      carrera.ESCUELA_ID_ESCUELA === parseInt(selectedEscuela)
  );
  const asignaturasFiltradas = asignaturas.filter(
    (asignatura) =>
      !selectedCarrera ||
      asignatura.CARRERA_ID_CARRERA === parseInt(selectedCarrera)
  );

  return (
    <>
      <div className="modal-backdrop" onClick={onClose}></div>
      <div className="modal-container">
        <div className="modal-header">
          <h5>Filtrar Exámenes</h5>
          <button
            type="button"
            className="btn-close"
            aria-label="Close"
            onClick={onClose}
          ></button>
        </div>
        <div className="modal-content">
          {/* Filtro por Sede */}
          <div className="form-group mb-3">
            <label htmlFor="sedeFilter" className="form-label form-label-sm">
              Sede:
            </label>
            <select
              id="sedeFilter"
              className="form-select form-select-sm"
              value={selectedSede}
              onChange={(e) => onSetSelectedSede(e.target.value)}
            >
              <option value="">Todas las Sedes</option>
              {sedes.map((sede) => (
                <option key={sede.ID_SEDE} value={sede.ID_SEDE}>
                  {sede.NOMBRE_SEDE}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Escuela */}
          <div className="form-group mb-3">
            <label htmlFor="escuelaFilter" className="form-label form-label-sm">
              Escuela:
            </label>
            <select
              id="escuelaFilter"
              className="form-select form-select-sm"
              value={selectedEscuela}
              onChange={(e) => onSetSelectedEscuela(e.target.value)}
              disabled={!selectedSede && escuelas.some((e) => e.SEDE_ID_SEDE)}
            >
              <option value="">Todas las Escuelas</option>
              {escuelasFiltradas.map((escuela) => (
                <option key={escuela.ID_ESCUELA} value={escuela.ID_ESCUELA}>
                  {escuela.NOMBRE_ESCUELA}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Carrera */}
          <div className="form-group mb-3">
            <label htmlFor="carreraFilter" className="form-label form-label-sm">
              Carrera:
            </label>
            <select
              id="carreraFilter"
              className="form-select form-select-sm"
              value={selectedCarrera}
              onChange={(e) => onSetSelectedCarrera(e.target.value)}
              disabled={
                !selectedEscuela && carreras.some((c) => c.ESCUELA_ID_ESCUELA)
              }
            >
              <option value="">Todas las Carreras</option>
              {carrerasFiltradas.map((carrera) => (
                <option key={carrera.ID_CARRERA} value={carrera.ID_CARRERA}>
                  {carrera.NOMBRE_CARRERA}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Asignatura */}
          <div className="form-group mb-3">
            <label
              htmlFor="asignaturaFilter"
              className="form-label form-label-sm"
            >
              Asignatura:
            </label>
            <select
              id="asignaturaFilter"
              className="form-select form-select-sm"
              value={selectedAsignatura}
              onChange={(e) => onSetSelectedAsignatura(e.target.value)}
              disabled={
                !selectedCarrera &&
                asignaturas.some((a) => a.CARRERA_ID_CARRERA)
              }
            >
              <option value="">Todas las Asignaturas</option>
              {asignaturasFiltradas.map((asignatura) => (
                <option
                  key={asignatura.ID_ASIGNATURA}
                  value={asignatura.ID_ASIGNATURA}
                >
                  {asignatura.NOMBRE_ASIGNATURA}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm me-2" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary btn-sm" onClick={onAplicarFiltros}>
            Aplicar Filtros
          </button>
        </div>
      </div>
    </>
  );
}
