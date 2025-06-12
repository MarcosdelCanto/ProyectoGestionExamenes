// src/components/usuarios/UsuarioFilter.jsx
import React from 'react';
import Select from 'react-select'; // Importar react-select
import { Card, Form, Row, Col, Button } from 'react-bootstrap';

function UsuarioFilter({ roles, onFilterChange, currentFilters }) {
  // console.log('Roles recibidos en UsuarioFilter:', roles);

  // Helper para convertir arrays de datos a formato de opciones para react-select
  const toSelectOptions = (
    items,
    valueKey,
    labelKey,
    defaultLabel = 'Todos'
  ) => [
    { value: '', label: defaultLabel }, // Opción para "Todos"
    ...(items
      ? items.map((item) => ({ value: item[valueKey], label: item[labelKey] }))
      : []),
  ];

  return (
    <Card className="mb-3 shadow-sm">
      <Card.Body>
        <Form>
          <Row className="g-3 align-items-end">
            <Col md>
              <Form.Group controlId="filterText">
                <Form.Label>Buscar Usuario</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nombre o email..."
                  value={currentFilters.text || ''}
                  onChange={(e) => onFilterChange({ text: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md>
              <Form.Group controlId="filterRole">
                <Form.Label>Filtrar por Rol</Form.Label>
                <Select
                  inputId="filterRole"
                  options={toSelectOptions(
                    roles,
                    'ID_ROL',
                    'NOMBRE_ROL',
                    'Todos los roles'
                  )}
                  value={
                    toSelectOptions(roles, 'ID_ROL', 'NOMBRE_ROL').find(
                      (option) => option.value === (currentFilters.role || '')
                    ) || null
                  }
                  onChange={(selectedOption) =>
                    onFilterChange({
                      role: selectedOption ? selectedOption.value : '',
                    })
                  }
                  placeholder="Todos los roles"
                  isClearable
                />
              </Form.Group>
            </Col>
            <Col md="auto">
              <Button
                variant="outline-secondary"
                onClick={() => onFilterChange({ text: '', role: '' })}
                className="w-100 btn-icon-only-candidate" // Añadir btn-icon-only-candidate
                title="Limpiar Filtros" // Añadir title para accesibilidad
              >
                <i className="bi bi-arrow-counterclockwise"></i>
                {/* Icono para limpiar/resetear */}
                <span className="btn-responsive-text ms-2">Limpiar</span>
                {/* Texto responsivo */}
              </Button>
            </Col>
          </Row>
        </Form>
      </Card.Body>
    </Card>
  );
}

export default UsuarioFilter;
