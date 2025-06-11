// src/components/salas/SalaFilter.jsx
import React from 'react';
import { Card, Form, Row, Col, Button } from 'react-bootstrap';

function SalaFilter({
  sedes = [],
  edificiosOptions = [], // Edificios filtrados por sede
  onFilterChange,
  currentFilters,
}) {
  const handleClearFilters = () => {
    onFilterChange({
      sede: '',
      nombre: '', // Añadir para limpiar el filtro de nombre
      edificio: '',
    });
  };

  return (
    <Card className="mb-3 shadow-sm">
      <Card.Body>
        <Form>
          <Row className="g-3 align-items-end">
            <Col md={6} lg={3}>
              <Form.Group controlId="filterNombreSala">
                <Form.Label>Buscar por Nombre</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nombre de la sala..."
                  value={currentFilters.nombre || ''}
                  onChange={(e) => onFilterChange({ nombre: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={3}>
              <Form.Group controlId="filterSedeSala">
                <Form.Label>Sede</Form.Label>
                <Form.Select
                  value={currentFilters.sede || ''}
                  onChange={(e) => onFilterChange({ sede: e.target.value })}
                >
                  <option value="">Todas las sedes</option>
                  {sedes.map((sede) => (
                    <option key={sede.ID_SEDE} value={sede.ID_SEDE}>
                      {sede.NOMBRE_SEDE}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6} lg={3}>
              <Form.Group controlId="filterEdificioSala">
                <Form.Label>Edificio</Form.Label>
                <Form.Select
                  value={currentFilters.edificio || ''}
                  onChange={(e) => onFilterChange({ edificio: e.target.value })}
                  disabled={
                    !currentFilters.sede && edificiosOptions.length === 0
                  } // Deshabilitar si no hay sede o no hay opciones
                >
                  <option value="">Todos los edificios</option>
                  {edificiosOptions.map((edificio) => (
                    <option
                      key={edificio.ID_EDIFICIO}
                      value={edificio.ID_EDIFICIO}
                    >
                      {edificio.SIGLA_EDIFICIO} - {edificio.NOMBRE_EDIFICIO}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={12} lg={3} className="d-flex align-items-end">
              {/* Ajuste para el botón */}
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

export default SalaFilter;
