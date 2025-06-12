// src/components/edificios/EdificioFilter.jsx
import React from 'react';
import Select from 'react-select'; // Importar react-select
import { Card, Form, Row, Col, Button } from 'react-bootstrap';

function EdificioFilter({ sedes = [], onFilterChange, currentFilters }) {
  const handleClearFilters = () => {
    onFilterChange({
      nombre: '',
      sede: '',
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
            <Col md={6} lg={5}>
              <Form.Group controlId="filterNombreEdificio">
                <Form.Label>Buscar por Nombre</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nombre o sigla del edificio..."
                  value={currentFilters.nombre || ''}
                  onChange={(e) => onFilterChange({ nombre: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={4}>
              <Form.Group controlId="filterSedeEdificio">
                <Form.Label>Sede</Form.Label>
                <Select
                  inputId="filterSedeEdificio"
                  options={toSelectOptions(
                    sedes,
                    'ID_SEDE',
                    'NOMBRE_SEDE',
                    'Todas las sedes'
                  )}
                  value={
                    toSelectOptions(sedes, 'ID_SEDE', 'NOMBRE_SEDE').find(
                      (option) => option.value === (currentFilters.sede || '')
                    ) || null
                  }
                  onChange={(selectedOption) =>
                    onFilterChange({
                      sede: selectedOption ? selectedOption.value : '',
                    })
                  }
                  placeholder="Todas las sedes"
                  isClearable
                />
              </Form.Group>
            </Col>
            <Col md={12} lg={3} className="d-flex align-items-end">
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

export default EdificioFilter;
