// src/components/secciones/SeccionFilter.jsx
import React from 'react';
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
                <Form.Select
                  value={currentFilters.escuela || ''}
                  onChange={(e) =>
                    onFilterChange({
                      escuela: e.target.value,
                      carrera: '', // Reset carrera
                      asignatura: '', // Reset asignatura
                    })
                  }
                >
                  <option value="">Todas</option>
                  {escuelas.map((escuela) => (
                    <option key={escuela.ID_ESCUELA} value={escuela.ID_ESCUELA}>
                      {escuela.NOMBRE_ESCUELA}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6} lg={3}>
              <Form.Group controlId="filterCarreraSeccion">
                <Form.Label>Carrera</Form.Label>
                <Form.Select
                  value={currentFilters.carrera || ''}
                  onChange={(e) =>
                    onFilterChange({
                      carrera: e.target.value,
                      asignatura: '', // Reset asignatura
                    })
                  }
                  disabled={
                    !currentFilters.escuela && carrerasOptions.length === 0
                  }
                >
                  <option value="">Todas</option>
                  {carrerasOptions.map((carrera) => (
                    <option key={carrera.ID_CARRERA} value={carrera.ID_CARRERA}>
                      {carrera.NOMBRE_CARRERA}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6} lg={2}>
              <Form.Group controlId="filterAsignaturaSeccion">
                <Form.Label>Asignatura</Form.Label>
                <Form.Select
                  value={currentFilters.asignatura || ''}
                  onChange={(e) =>
                    onFilterChange({ asignatura: e.target.value })
                  }
                  disabled={
                    !currentFilters.carrera && asignaturasOptions.length === 0
                  }
                >
                  <option value="">Todas</option>
                  {asignaturasOptions.map((asig) => (
                    <option key={asig.ID_ASIGNATURA} value={asig.ID_ASIGNATURA}>
                      {asig.NOMBRE_ASIGNATURA}
                    </option>
                  ))}
                </Form.Select>
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
