// src/components/roles/RoleFilter.jsx
import React from 'react';
import { Card, Form, Row, Col, Button } from 'react-bootstrap';

function RoleFilter({ onFilterChange, currentFilters }) {
  const handleClearFilters = () => {
    onFilterChange({
      nombre: '',
    });
  };

  return (
    <Card className="mb-3 shadow-sm">
      <Card.Body>
        <Form>
          <Row className="g-3 align-items-end">
            <Col md={8} lg={9}>
              <Form.Group controlId="filterNombreRol">
                <Form.Label>Buscar por Nombre</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nombre del rol..."
                  value={currentFilters.nombre || ''}
                  onChange={(e) => onFilterChange({ nombre: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={4} lg={3} className="d-flex align-items-end">
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

export default RoleFilter;
