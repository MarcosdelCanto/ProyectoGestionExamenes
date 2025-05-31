// src/components/reportes/FilterForm.js

import React from 'react';

const FilterForm = ({ config, tempFilters, filterOptions, onFilterChange }) => {
  if (!config || !config.filterFields) {
    return null;
  }

  // Itera sobre los campos definidos en la configuración y crea el input/select correspondiente.
  return config.filterFields.map((fieldKey) => {
    switch (fieldKey) {
      case 'sede':
        return (
          <div className="mb-3" key="sede">
            <label htmlFor="repSede" className="form-label">
              Sede
            </label>
            <select
              id="repSede"
              className="form-select"
              value={tempFilters.sedeId || ''}
              onChange={(e) => onFilterChange('sedeId', e.target.value)}
            >
              <option value="">Todas</option>
              {filterOptions.sedes?.map((s) => (
                <option key={s.ID_SEDE} value={s.ID_SEDE}>
                  {s.NOMBRE_SEDE}
                </option>
              ))}
            </select>
          </div>
        );

      case 'escuela':
        return (
          <div className="mb-3" key="escuela">
            <label htmlFor="repEscuela" className="form-label">
              Escuela
            </label>
            <select
              id="repEscuela"
              className="form-select"
              value={tempFilters.escuelaId || ''}
              onChange={(e) => onFilterChange('escuelaId', e.target.value)}
              disabled={
                !tempFilters.sedeId || filterOptions.escuelas?.length === 0
              }
            >
              <option value="">Todas</option>
              {filterOptions.escuelas?.map((e) => (
                <option key={e.ID_ESCUELA} value={e.ID_ESCUELA}>
                  {e.NOMBRE_ESCUELA}
                </option>
              ))}
            </select>
          </div>
        );

      case 'carrera':
        return (
          <div className="mb-3" key="carrera">
            <label htmlFor="repCarrera" className="form-label">
              Carrera
            </label>
            <select
              id="repCarrera"
              className="form-select"
              value={tempFilters.carreraId || ''}
              onChange={(e) => onFilterChange('carreraId', e.target.value)}
              disabled={
                !tempFilters.escuelaId || filterOptions.carreras?.length === 0
              }
            >
              <option value="">Todas</option>
              {filterOptions.carreras?.map((c) => (
                <option key={c.ID_CARRERA} value={c.ID_CARRERA}>
                  {c.NOMBRE_CARRERA}
                </option>
              ))}
            </select>
          </div>
        );

      case 'asignatura':
        return (
          <div className="mb-3" key="asignatura">
            <label htmlFor="repAsignatura" className="form-label">
              Asignatura
            </label>
            <select
              id="repAsignatura"
              className="form-select"
              value={tempFilters.asignaturaId || ''}
              onChange={(e) => onFilterChange('asignaturaId', e.target.value)}
              disabled={
                !tempFilters.carreraId ||
                filterOptions.asignaturas?.length === 0
              }
            >
              <option value="">Todas</option>
              {filterOptions.asignaturas?.map((a) => (
                <option key={a.ID_ASIGNATURA} value={a.ID_ASIGNATURA}>
                  {a.NOMBRE_ASIGNATURA}
                </option>
              ))}
            </select>
          </div>
        );

      case 'seccion':
        return (
          <div className="mb-3" key="seccion">
            <label htmlFor="repSeccion" className="form-label">
              Sección
            </label>
            <select
              id="repSeccion"
              className="form-select"
              value={tempFilters.seccionId || ''}
              onChange={(e) => onFilterChange('seccionId', e.target.value)}
              disabled={
                !tempFilters.asignaturaId ||
                filterOptions.secciones?.length === 0
              }
            >
              <option value="">Todas</option>
              {filterOptions.secciones?.map((s) => (
                <option key={s.ID_SECCION} value={s.ID_SEccion}>
                  {s.NOMBRE_SECCION}
                </option>
              ))}
            </select>
          </div>
        );

      case 'jornada':
        return (
          <div className="mb-3" key="jornada">
            <label htmlFor="repJornada" className="form-label">
              Jornada
            </label>
            <select
              id="repJornada"
              className="form-select"
              value={tempFilters.jornadaId || ''}
              onChange={(e) => onFilterChange('jornadaId', e.target.value)}
            >
              <option value="">Todas</option>
              {filterOptions.jornadas?.map((j) => (
                <option key={j.ID_JORNADA} value={j.ID_JORNADA}>
                  {j.NOMBRE_JORNADA}
                </option>
              ))}
            </select>
          </div>
        );

      case 'estado':
        return (
          <div className="mb-3" key="estado">
            <label htmlFor="repEstado" className="form-label">
              Estado Examen
            </label>
            <select
              id="repEstado"
              className="form-select"
              value={tempFilters.estadoExamenId || ''}
              onChange={(e) => onFilterChange('estadoExamenId', e.target.value)}
            >
              <option value="">Todos</option>
              {filterOptions.estados?.map((est) => (
                <option key={est.ID_ESTADO} value={est.ID_ESTADO}>
                  {est.NOMBRE_ESTADO}
                </option>
              ))}
            </select>
          </div>
        );

      case 'docente':
        return (
          <div className="mb-3" key="docente">
            <label htmlFor="repDocente" className="form-label">
              Docente
            </label>
            <select
              id="repDocente"
              className="form-select"
              value={tempFilters.docenteId || ''}
              onChange={(e) => onFilterChange('docenteId', e.target.value)}
            >
              <option value="">Todos</option>
              {filterOptions.docentes?.map((d) => (
                <option key={d.ID_USUARIO} value={d.ID_USUARIO}>
                  {d.NOMBRE_USUARIO}
                </option>
              ))}
            </select>
          </div>
        );

      case 'dateRange':
        return (
          <div className="row" key="dateRange">
            <div className="col-md-6 mb-3">
              <label htmlFor="repFechaDesde" className="form-label">
                Fecha Desde
              </label>
              <input
                type="date"
                id="repFechaDesde"
                className="form-control"
                value={tempFilters.fechaDesde || ''}
                onChange={(e) => onFilterChange('fechaDesde', e.target.value)}
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
                value={tempFilters.fechaHasta || ''}
                onChange={(e) => onFilterChange('fechaHasta', e.target.value)}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  });
};

export default FilterForm;
