// src/components/asignaturas/AsignaturaFilter.jsx
import React from 'react';
import Select from 'react-select'; // Importar react-select
import { Card, Form, Row, Col, Button } from 'react-bootstrap';

function AsignaturaFilter({
  escuelas = [],
  carrerasOptions = [], // Carreras filtradas por escuela
  onFilterChange,
  currentFilters,
}) {
  const handleClearFilters = () => {
    onFilterChange({
      nombre: '',
      escuela: '',
      carrera: '',
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
            <Col md={12} lg={4}>
              <Form.Group controlId="filterNombreAsignatura">
                <Form.Label>Buscar por Nombre</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nombre de la asignatura..."
                  value={currentFilters.nombre || ''}
                  onChange={(e) => onFilterChange({ nombre: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={3}>
              <Form.Group controlId="filterEscuelaAsignatura">
                <Form.Label>Escuela</Form.Label>
                <Select
                  inputId="filterEscuelaAsignatura"
                  options={toSelectOptions(
                    escuelas,
                    'ID_ESCUELA',
                    'NOMBRE_ESCUELA',
                    'Todas las escuelas'
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
                    })
                  }
                  placeholder="Todas las escuelas"
                  isClearable
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={3}>
              <Form.Group controlId="filterCarreraAsignatura">
                <Form.Label>Carrera</Form.Label>
                <Select
                  inputId="filterCarreraAsignatura"
                  options={toSelectOptions(
                    carrerasOptions, // Usar carrerasOptions que ya están filtradas
                    'ID_CARRERA',
                    'NOMBRE_CARRERA',
                    'Todas las carreras'
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
                    })
                  }
                  disabled={
                    !currentFilters.escuela // Deshabilitar si no hay escuela seleccionada
                  }
                  placeholder="Todas las carreras"
                  isClearable
                />
              </Form.Group>
            </Col>
            <Col md={12} lg={2} className="d-flex align-items-end">
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

export default AsignaturaFilter;
