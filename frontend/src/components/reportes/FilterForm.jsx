// src/components/reportes/FilterForm.jsx

import React from 'react';
import Select from 'react-select';
import {
  duocSelectStyles,
  duocSelectStylesDisabled as disabledStyles,
} from '../../styles/duocSelectStyles';

const toOption = (value, label) => (value ? { value, label } : null);

const FilterForm = ({ config, tempFilters, filterOptions, onFilterChange }) => {
  if (!config || !config.filterFields) {
    return null;
  }

  return config.filterFields.map((fieldKey) => {
    switch (fieldKey) {
      case 'sede': {
        const options = [
          { value: '', label: 'Todas' },
          ...(filterOptions.sedes?.map((s) => ({
            value: s.ID_SEDE,
            label: s.NOMBRE_SEDE,
          })) || []),
        ];
        return (
          <div className="mb-3" key="sede">
            <label className="form-label">Sede</label>
            <Select
              inputId="repSede"
              options={options}
              value={
                options.find(
                  (o) => String(o.value) === String(tempFilters.sedeId || '')
                ) || options[0]
              }
              onChange={(opt) => onFilterChange('sedeId', opt?.value || '')}
              
              menuPortalTarget={document.body}
              menuPosition="fixed"
              placeholder="Todas"
            />
          </div>
        );
      }

      case 'escuela': {
        const isDisabled =
          !tempFilters.sedeId || filterOptions.escuelas?.length === 0;
        const options = [
          { value: '', label: 'Todas' },
          ...(filterOptions.escuelas?.map((e) => ({
            value: e.ID_ESCUELA,
            label: e.NOMBRE_ESCUELA,
          })) || []),
        ];
        return (
          <div className="mb-3" key="escuela">
            <label className="form-label">Escuela</label>
            <Select
              inputId="repEscuela"
              options={options}
              value={
                options.find(
                  (o) => String(o.value) === String(tempFilters.escuelaId || '')
                ) || options[0]
              }
              onChange={(opt) => onFilterChange('escuelaId', opt?.value || '')}
              isDisabled={isDisabled}
              
              menuPortalTarget={document.body}
              menuPosition="fixed"
              placeholder="Todas"
            />
          </div>
        );
      }

      case 'carrera': {
        const isDisabled =
          !tempFilters.escuelaId || filterOptions.carreras?.length === 0;
        const options = [
          { value: '', label: 'Todas' },
          ...(filterOptions.carreras?.map((c) => ({
            value: c.ID_CARRERA,
            label: c.NOMBRE_CARRERA,
          })) || []),
        ];
        return (
          <div className="mb-3" key="carrera">
            <label className="form-label">Carrera</label>
            <Select
              inputId="repCarrera"
              options={options}
              value={
                options.find(
                  (o) => String(o.value) === String(tempFilters.carreraId || '')
                ) || options[0]
              }
              onChange={(opt) => onFilterChange('carreraId', opt?.value || '')}
              isDisabled={isDisabled}
              
              menuPortalTarget={document.body}
              menuPosition="fixed"
              placeholder="Todas"
            />
          </div>
        );
      }

      case 'asignatura': {
        const isDisabled =
          !tempFilters.carreraId || filterOptions.asignaturas?.length === 0;
        const options = [
          { value: '', label: 'Todas' },
          ...(filterOptions.asignaturas?.map((a) => ({
            value: a.ID_ASIGNATURA,
            label: a.NOMBRE_ASIGNATURA,
          })) || []),
        ];
        return (
          <div className="mb-3" key="asignatura">
            <label className="form-label">Asignatura</label>
            <Select
              inputId="repAsignatura"
              options={options}
              value={
                options.find(
                  (o) =>
                    String(o.value) === String(tempFilters.asignaturaId || '')
                ) || options[0]
              }
              onChange={(opt) =>
                onFilterChange('asignaturaId', opt?.value || '')
              }
              isDisabled={isDisabled}
              
              menuPortalTarget={document.body}
              menuPosition="fixed"
              placeholder="Todas"
            />
          </div>
        );
      }

      case 'seccion': {
        const isDisabled =
          !tempFilters.asignaturaId || filterOptions.secciones?.length === 0;
        const options = [
          { value: '', label: 'Todas' },
          ...(filterOptions.secciones?.map((s) => ({
            value: s.ID_SECCION,
            label: s.NOMBRE_SECCION,
          })) || []),
        ];
        return (
          <div className="mb-3" key="seccion">
            <label className="form-label">Sección</label>
            <Select
              inputId="repSeccion"
              options={options}
              value={
                options.find(
                  (o) => String(o.value) === String(tempFilters.seccionId || '')
                ) || options[0]
              }
              onChange={(opt) => onFilterChange('seccionId', opt?.value || '')}
              isDisabled={isDisabled}
              
              menuPortalTarget={document.body}
              menuPosition="fixed"
              placeholder="Todas"
            />
          </div>
        );
      }

      case 'jornada': {
        const options = [
          { value: '', label: 'Todas' },
          ...(filterOptions.jornadas?.map((j) => ({
            value: j.ID_JORNADA,
            label: j.NOMBRE_JORNADA,
          })) || []),
        ];
        return (
          <div className="mb-3" key="jornada">
            <label className="form-label">Jornada</label>
            <Select
              inputId="repJornada"
              options={options}
              value={
                options.find(
                  (o) => String(o.value) === String(tempFilters.jornadaId || '')
                ) || options[0]
              }
              onChange={(opt) => onFilterChange('jornadaId', opt?.value || '')}
              
              menuPortalTarget={document.body}
              menuPosition="fixed"
              placeholder="Todas"
            />
          </div>
        );
      }

      case 'estado': {
        const options = [
          { value: '', label: 'Todos' },
          ...(filterOptions.estados?.map((est) => ({
            value: est.ID_ESTADO,
            label: est.NOMBRE_ESTADO,
          })) || []),
        ];
        return (
          <div className="mb-3" key="estado">
            <label className="form-label">Estado Examen</label>
            <Select
              inputId="repEstado"
              options={options}
              value={
                options.find(
                  (o) =>
                    String(o.value) === String(tempFilters.estadoExamenId || '')
                ) || options[0]
              }
              onChange={(opt) =>
                onFilterChange('estadoExamenId', opt?.value || '')
              }
              
              menuPortalTarget={document.body}
              menuPosition="fixed"
              placeholder="Todos"
            />
          </div>
        );
      }

      case 'docente': {
        const options = [
          { value: '', label: 'Todos' },
          ...(filterOptions.docentes?.map((d) => ({
            value: d.ID_USUARIO,
            label: d.NOMBRE_USUARIO,
          })) || []),
        ];
        return (
          <div className="mb-3" key="docente">
            <label className="form-label">Docente</label>
            <Select
              inputId="repDocente"
              options={options}
              value={
                options.find(
                  (o) => String(o.value) === String(tempFilters.docenteId || '')
                ) || options[0]
              }
              onChange={(opt) => onFilterChange('docenteId', opt?.value || '')}
              
              menuPortalTarget={document.body}
              menuPosition="fixed"
              placeholder="Todos"
            />
          </div>
        );
      }

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
