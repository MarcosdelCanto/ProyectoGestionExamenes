// src/components/secciones/SeccionFilter.jsx
import React from 'react';
import Select from 'react-select'; // Importar react-select
import { Card, Form, Row, Col, Button } from 'react-bootstrap';

function SeccionFilter({
  escuelas = [],
  carrerasOptions = [], // Carreras filtradas por escuela
  asignaturasOptions = [], // Asignaturas filtradas por carrera
  onFilterChange,
  currentFilters,
}) {
  const handleClearFilters = () => {
    onFilterChange({
      nombre: '',
      escuela: '',
      carrera: '',
      asignatura: '',
    });
  };

  // Helper para convertir arrays de datos a formato de opciones para react-select
  const toSelectOptions = (
    items,
    valueKey,
    labelKey,
    defaultLabel = 'Todas'
  ) => [
    { value: '', label: defaultLabel },
    ...(items
      ? items.map((item) => ({ value: item[valueKey], label: item[labelKey] }))
      : []),
  ];
  return (
    <Card className="mb-3 shadow-sm">
      <Card.Body>
        <Form>
          <Row className="g-3 align-items-end">
            <Col md={12} lg={3}>
              <Form.Group controlId="filterNombreSeccion">
                <Form.Label>Buscar por Nombre/Código</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nombre o código..."
                  value={currentFilters.nombre || ''}
                  onChange={(e) => onFilterChange({ nombre: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={2}>
              <Form.Group controlId="filterEscuelaSeccion">
                <Form.Label>Escuela</Form.Label>
                <Select
                  inputId="filterEscuelaSeccion"
                  options={toSelectOptions(
                    escuelas,
                    'ID_ESCUELA',
                    'NOMBRE_ESCUELA',
                    'Todas'
                  )}
                  value={
                    toSelectOptions(
                      escuelas,
                      'ID_ESCUELA',
                      'NOMBRE_ESCUELA'
                    ).find(
                      (option) =>
                        option.value === (currentFilters.escuela || '')
                    ) || null
                  }
                  onChange={(selectedOption) =>
                    onFilterChange({
                      escuela: selectedOption ? selectedOption.value : '',
                      carrera: '', // Reset carrera
                      asignatura: '', // Reset asignatura
                    })
                  }
                  placeholder="Todas"
                  isClearable
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={3}>
              <Form.Group controlId="filterCarreraSeccion">
                <Form.Label>Carrera</Form.Label>
                <Select
                  inputId="filterCarreraSeccion"
                  options={toSelectOptions(
                    carrerasOptions, // Usar carrerasOptions que ya están filtradas
                    'ID_CARRERA',
                    'NOMBRE_CARRERA',
                    'Todas'
                  )}
                  value={
                    toSelectOptions(
                      carrerasOptions,
                      'ID_CARRERA',
                      'NOMBRE_CARRERA'
                    ).find(
                      (option) =>
                        option.value === (currentFilters.carrera || '')
                    ) || null
                  }
                  onChange={(selectedOption) =>
                    onFilterChange({
                      carrera: selectedOption ? selectedOption.value : '',
                      asignatura: '', // Reset asignatura
                    })
                  }
                  disabled={
                    !currentFilters.escuela // Deshabilitar si no hay escuela seleccionada
                  }
                  placeholder="Todas"
                  isClearable
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={2}>
              <Form.Group controlId="filterAsignaturaSeccion">
                <Form.Label>Asignatura</Form.Label>
                <Select
                  inputId="filterAsignaturaSeccion"
                  options={toSelectOptions(
                    asignaturasOptions, // Usar asignaturasOptions que ya están filtradas
                    'ID_ASIGNATURA',
                    'NOMBRE_ASIGNATURA',
                    'Todas'
                  )}
                  value={
                    toSelectOptions(
                      asignaturasOptions,
                      'ID_ASIGNATURA',
                      'NOMBRE_ASIGNATURA'
                    ).find(
                      (option) =>
                        option.value === (currentFilters.asignatura || '')
                    ) || null
                  }
                  onChange={(selectedOption) =>
                    onFilterChange({
                      asignatura: selectedOption ? selectedOption.value : '',
                    })
                  }
                  disabled={
                    !currentFilters.carrera // Deshabilitar si no hay carrera seleccionada
                  }
                  placeholder="Todas"
                  isClearable
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={2} className="d-flex align-items-end">
              <Button
                variant="outline-secondary"
                onClick={handleClearFilters}
                className="w-100 btn-icon-only-candidate"
                title="Limpiar Filtros"
              >
                <i className="bi bi-arrow-counterclockwise"></i>
                <span className="btn-responsive-text ms-2">Limpiar</span>
              </Button>
            </Col>
          </Row>
        </Form>
      </Card.Body>
    </Card>
  );
}

export default SeccionFilter;
