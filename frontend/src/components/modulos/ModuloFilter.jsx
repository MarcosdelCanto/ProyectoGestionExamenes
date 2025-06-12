// src/components/modulos/ModuloFilter.jsx
import React from 'react';
import Select from 'react-select'; // Importar react-select
import { Card, Form, Row, Col, Button } from 'react-bootstrap';

function ModuloFilter({ estados = [], onFilterChange, currentFilters }) {
  const handleClearFilters = () => {
    onFilterChange({
      nombre: '',
      horaInicio: '',
      horaFin: '',
      estado: '',
    });
  };

  // Helper para convertir arrays de datos a formato de opciones para react-select
  const toSelectOptions = (
    items,
    valueKey,
    labelKey,
    defaultLabel = 'Todos'
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
            <Col md={6} lg={3}>
              <Form.Group controlId="filterNombreModulo">
                <Form.Label>Buscar por Nombre</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nombre del módulo..."
                  value={currentFilters.nombre || ''}
                  onChange={(e) => onFilterChange({ nombre: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={2}>
              <Form.Group controlId="filterHoraInicioModulo">
                <Form.Label>Hora Inicio Desde</Form.Label>
                <Form.Control
                  type="time"
                  value={currentFilters.horaInicio || ''}
                  onChange={(e) =>
                    onFilterChange({ horaInicio: e.target.value })
                  }
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={2}>
              <Form.Group controlId="filterHoraFinModulo">
                <Form.Label>Hora Fin Hasta</Form.Label>
                <Form.Control
                  type="time"
                  value={currentFilters.horaFin || ''}
                  onChange={(e) => onFilterChange({ horaFin: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={3}>
              <Form.Group controlId="filterEstadoModulo">
                <Form.Label>Estado</Form.Label>
                <Select
                  inputId="filterEstadoModulo"
                  options={toSelectOptions(
                    estados,
                    'ID_ESTADO', // Asumiendo que el valor es ID_ESTADO
                    'NOMBRE_ESTADO',
                    'Todos los estados'
                  )}
                  value={
                    toSelectOptions(estados, 'ID_ESTADO', 'NOMBRE_ESTADO').find(
                      (option) => option.value === (currentFilters.estado || '')
                    ) || null
                  }
                  onChange={(selectedOption) =>
                    onFilterChange({
                      estado: selectedOption ? selectedOption.value : '',
                    })
                  }
                  placeholder="Todos los estados"
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

export default ModuloFilter;
