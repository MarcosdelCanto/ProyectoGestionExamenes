// src/components/examenes/ExamenFilter.jsx
import React from 'react';
import { Card, Form, Row, Col, Button } from 'react-bootstrap';

function ExamenFilter({
  escuelas = [],
  carreras = [],
  asignaturas = [],
  secciones = [],
  estados = [],
  onFilterChange,
  currentFilters,
}) {
  const handleClearFilters = () => {
    onFilterChange({
      text: '',
      escuela: '',
      carrera: '',
      asignatura: '',
      seccion: '',
      estado: '',
    });
  };

  return (
    <Card className="mb-3 shadow-sm">
      <Card.Body>
        <Form>
          <Row className="g-3 align-items-end">
            <Col md={6} lg={3}>
              <Form.Group controlId="filterTextExamen">
                <Form.Label>Buscar Examen</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nombre del examen..."
                  value={currentFilters.text || ''}
                  onChange={(e) => onFilterChange({ text: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={3}>
              <Form.Group controlId="filterEscuela">
                <Form.Label>Escuela</Form.Label>
                <Form.Select
                  value={currentFilters.escuela || ''}
                  onChange={(e) => onFilterChange({ escuela: e.target.value })}
                >
                  <option value="">Todas las escuelas</option>
                  {escuelas.map((escuela) => (
                    <option key={escuela.ID_ESCUELA} value={escuela.ID_ESCUELA}>
                      {escuela.NOMBRE_ESCUELA}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6} lg={3}>
              <Form.Group controlId="filterCarrera">
                <Form.Label>Carrera</Form.Label>
                <Form.Select
                  value={currentFilters.carrera || ''}
                  onChange={(e) => onFilterChange({ carrera: e.target.value })}
                >
                  <option value="">Todas las carreras</option>
                  {carreras.map((carrera) => (
                    <option key={carrera.ID_CARRERA} value={carrera.ID_CARRERA}>
                      {carrera.NOMBRE_CARRERA}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6} lg={3}>
              <Form.Group controlId="filterAsignatura">
                <Form.Label>Asignatura</Form.Label>
                <Form.Select
                  value={currentFilters.asignatura || ''}
                  onChange={(e) =>
                    onFilterChange({ asignatura: e.target.value })
                  }
                >
                  <option value="">Todas las asignaturas</option>
                  {asignaturas.map((asig) => (
                    <option key={asig.ID_ASIGNATURA} value={asig.ID_ASIGNATURA}>
                      {asig.NOMBRE_ASIGNATURA}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6} lg={3}>
              <Form.Group controlId="filterSeccion">
                <Form.Label>Sección</Form.Label>
                <Form.Select
                  value={currentFilters.seccion || ''}
                  onChange={(e) => onFilterChange({ seccion: e.target.value })}
                >
                  <option value="">Todas las secciones</option>
                  {secciones.map((sec) => (
                    <option key={sec.ID_SECCION} value={sec.ID_SECCION}>
                      {sec.CODIGO_SECCION} - {sec.NOMBRE_SECCION}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6} lg={3}>
              <Form.Group controlId="filterEstadoExamen">
                <Form.Label>Estado</Form.Label>
                <Form.Select
                  value={currentFilters.estado || ''}
                  onChange={(e) => onFilterChange({ estado: e.target.value })}
                >
                  {/* <option value="">Todos los estados</option> // Esta es manejada por el array de estados */}
                  {estados.map((estado) => (
                    <option key={estado.value} value={estado.value}>
                      {estado.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={12} lg="auto" className="mt-md-3 mt-lg-0">
              {/* Ajuste para que el botón se alinee bien en desktop y ocupe full width en mobile */}
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

export default ExamenFilter;
