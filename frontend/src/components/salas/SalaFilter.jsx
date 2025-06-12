// src/components/salas/SalaFilter.jsx
import React from 'react';
import Select from 'react-select'; // Importar react-select
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
                <Select
                  inputId="filterSedeSala"
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
                      edificio: '', // Resetear edificio al cambiar de sede
                    })
                  }
                  placeholder="Todas las sedes"
                  isClearable
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={3}>
              <Form.Group controlId="filterEdificioSala">
                <Form.Label>Edificio</Form.Label>
                <Select
                  inputId="filterEdificioSala"
                  options={toSelectOptions(
                    edificiosOptions, // Usar edificiosOptions que ya están filtradas
                    'ID_EDIFICIO',
                    'NOMBRE_EDIFICIO', // O podrías concatenar SIGLA y NOMBRE si prefieres
                    'Todos los edificios'
                  )}
                  getOptionLabel={(
                    option // Personalizar cómo se muestra la etiqueta
                  ) =>
                    option.value === ''
                      ? option.label // Para la opción "Todos los edificios"
                      : `${option.label}`
                  }
                  value={
                    toSelectOptions(
                      edificiosOptions,
                      'ID_EDIFICIO',
                      'NOMBRE_EDIFICIO'
                    ).find(
                      (option) =>
                        option.value === (currentFilters.edificio || '')
                    ) || null
                  }
                  onChange={(selectedOption) =>
                    onFilterChange({
                      edificio: selectedOption ? selectedOption.value : '',
                    })
                  }
                  disabled={
                    !currentFilters.sede // Deshabilitar si no hay sede seleccionada
                  } // Deshabilitar si no hay sede o no hay opciones
                  placeholder="Todos los edificios"
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

export default SalaFilter;
