// src/components/examenes/FilterModalExamenes.jsx

import React from 'react';
import Select from 'react-select';
import {
  duocSelectStyles,
  duocSelectStylesDisabled,
} from '../../styles/duocSelectStyles';
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

  const sedeOptions = sedes.map((s) => ({
    value: String(s.ID_SEDE),
    label: s.NOMBRE_SEDE,
  }));
  const escuelaOptions = escuelasFiltradas.map((e) => ({
    value: String(e.ID_ESCUELA),
    label: e.NOMBRE_ESCUELA,
  }));
  const carreraOptions = carrerasFiltradas.map((c) => ({
    value: String(c.ID_CARRERA),
    label: c.NOMBRE_CARRERA,
  }));
  const asignaturaOptions = asignaturasFiltradas.map((a) => ({
    value: String(a.ID_ASIGNATURA),
    label: a.NOMBRE_ASIGNATURA,
  }));

  const escuelasDisabled =
    !selectedSede && escuelas.some((e) => e.SEDE_ID_SEDE);
  const carrerasDisabled =
    !selectedEscuela && carreras.some((c) => c.ESCUELA_ID_ESCUELA);
  const asignaturasDisabled =
    !selectedCarrera && asignaturas.some((a) => a.CARRERA_ID_CARRERA);

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
            <label className="form-label form-label-sm">Sede:</label>
            <Select
              inputId="sedeFilter"
              options={sedeOptions}
              value={sedeOptions.find((o) => o.value === selectedSede) || null}
              onChange={(opt) => onSetSelectedSede(opt ? opt.value : '')}
              placeholder="Todas las Sedes"
              isClearable
              styles={duocSelectStyles}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          </div>

          {/* Filtro por Escuela */}
          <div className="form-group mb-3">
            <label className="form-label form-label-sm">Escuela:</label>
            <Select
              inputId="escuelaFilter"
              options={escuelaOptions}
              value={
                escuelaOptions.find((o) => o.value === selectedEscuela) || null
              }
              onChange={(opt) => onSetSelectedEscuela(opt ? opt.value : '')}
              placeholder="Todas las Escuelas"
              isClearable
              isDisabled={escuelasDisabled}
              styles={
                escuelasDisabled ? duocSelectStylesDisabled : duocSelectStyles
              }
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          </div>

          {/* Filtro por Carrera */}
          <div className="form-group mb-3">
            <label className="form-label form-label-sm">Carrera:</label>
            <Select
              inputId="carreraFilter"
              options={carreraOptions}
              value={
                carreraOptions.find((o) => o.value === selectedCarrera) || null
              }
              onChange={(opt) => onSetSelectedCarrera(opt ? opt.value : '')}
              placeholder="Todas las Carreras"
              isClearable
              isDisabled={carrerasDisabled}
              styles={
                carrerasDisabled ? duocSelectStylesDisabled : duocSelectStyles
              }
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          </div>

          {/* Filtro por Asignatura */}
          <div className="form-group mb-3">
            <label className="form-label form-label-sm">Asignatura:</label>
            <Select
              inputId="asignaturaFilter"
              options={asignaturaOptions}
              value={
                asignaturaOptions.find((o) => o.value === selectedAsignatura) ||
                null
              }
              onChange={(opt) => onSetSelectedAsignatura(opt ? opt.value : '')}
              placeholder="Todas las Asignaturas"
              isClearable
              isDisabled={asignaturasDisabled}
              styles={
                asignaturasDisabled
                  ? duocSelectStylesDisabled
                  : duocSelectStyles
              }
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
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
