// src/components/examenes/ExamenFilter.jsx
import React from 'react';
import Select from 'react-select'; // Importar react-select
import { Card, Form, Row, Col, Button } from 'react-bootstrap';

// Función para normalizar el texto de búsqueda (eliminar tildes, acentos, etc.)
const normalizeText = (text) => {
  return text
    .normalize('NFD') // descomponer caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // eliminar los diacríticos
    .toLowerCase(); // convertir a minúsculas
};

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
    // Al limpiar, onFilterChange debe recibir los valores que el estado espera (strings vacíos)
    onFilterChange({
      text: '',
      escuela: '',
      carrera: '',
      asignatura: '',
      seccion: '',
      estado: '',
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
            <Col md={6} lg={3}>
              <Form.Group controlId="filterTextExamen">
                <Form.Label>Buscar Examen</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nombre del examen..."
                  value={currentFilters.text || ''}
                  onChange={(e) =>
                    onFilterChange({
                      text: e.target.value,
                      normalizedText: normalizeText(e.target.value),
                    })
                  }
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={3}>
              <Form.Group controlId="filterEscuela">
                <Form.Label>Escuela</Form.Label>
                <Select
                  inputId="filterEscuela"
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
                    })
                  }
                  placeholder="Todas las escuelas"
                  isClearable
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={3}>
              <Form.Group controlId="filterCarrera">
                <Form.Label>Carrera</Form.Label>
                <Select
                  inputId="filterCarrera"
                  options={toSelectOptions(
                    carreras,
                    'ID_CARRERA',
                    'NOMBRE_CARRERA',
                    'Todas las carreras'
                  )}
                  value={
                    toSelectOptions(
                      carreras,
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
                  placeholder="Todas las carreras"
                  isClearable
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={3}>
              <Form.Group controlId="filterAsignatura">
                <Form.Label>Asignatura</Form.Label>
                <Select
                  inputId="filterAsignatura"
                  options={toSelectOptions(
                    asignaturas,
                    'ID_ASIGNATURA',
                    'NOMBRE_ASIGNATURA',
                    'Todas las asignaturas'
                  )}
                  value={
                    toSelectOptions(
                      asignaturas,
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
                  placeholder="Todas las asignaturas"
                  isClearable
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={3}>
              <Form.Group controlId="filterSeccion">
                <Form.Label>Sección</Form.Label>
                <Select
                  inputId="filterSeccion"
                  options={[
                    { value: '', label: 'Todas las secciones' },
                    ...(secciones
                      ? secciones.map((sec) => ({
                          value: sec.ID_SECCION,
                          label: `${sec.NOMBRE_SECCION}`,
                        }))
                      : []),
                  ]}
                  value={
                    [
                      { value: '', label: 'Todas las secciones' },
                      ...(secciones
                        ? secciones.map((sec) => ({
                            value: sec.ID_SECCION,
                            label: `${sec.NOMBRE_SECCION}`,
                          }))
                        : []),
                    ].find(
                      (option) =>
                        option.value === (currentFilters.seccion || '')
                    ) || null
                  }
                  onChange={(selectedOption) =>
                    onFilterChange({
                      seccion: selectedOption ? selectedOption.value : '',
                    })
                  }
                  placeholder="Todas las secciones"
                  isClearable
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={3}>
              <Form.Group controlId="filterEstadoExamen">
                <Form.Label>Estado</Form.Label>
                <Select
                  inputId="filterEstadoExamen"
                  options={estados} // Usar directamente el array 'estados' que ya incluye "Todos los estados"
                  value={
                    estados.find(
                      // Buscar en el array 'estados'
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
