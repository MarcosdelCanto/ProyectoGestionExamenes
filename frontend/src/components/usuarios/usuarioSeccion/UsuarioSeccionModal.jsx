import React from 'react';
import { Modal, Button, Form, Spinner, Row, Col, Card } from 'react-bootstrap';
import Select from 'react-select'; // Importar react-select

const ALUMNO_ROLE_NAME = 'ALUMNO';
const DOCENTE_ROLE_NAME = 'DOCENTE';

function UsuarioSeccionModal({
  show,
  onHide,
  editingUser,
  allRoles,
  eligibleUsers,
  secciones,
  asignaturas,
  selectedUsuarioId,
  setSelectedUsuarioId,
  selectedSeccionIds,
  handleSeccionSelection,
  handleAddAssociation,
  processing,
  searchTermUser,
  setSearchTermUser,
  filterRoleUser,
  setFilterRoleUser,
  filterAsignaturaSeccion,
  setFilterAsignaturaSeccion,
}) {
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

  const filteredEligibleUsersInModal = eligibleUsers.filter((user) => {
    const searchTermMatch =
      searchTermUser === '' ||
      user.NOMBRE_USUARIO.toLowerCase().includes(
        searchTermUser.toLowerCase()
      ) ||
      user.EMAIL_USUARIO.toLowerCase().includes(searchTermUser.toLowerCase());
    const roleMatch =
      filterRoleUser === '' || user.ROL_ID_ROL === parseInt(filterRoleUser);
    return searchTermMatch && roleMatch;
  });

  const filteredSeccionesInModal = secciones.filter((seccion) => {
    return (
      filterAsignaturaSeccion === '' ||
      seccion.ASIGNATURA_ID_ASIGNATURA === parseInt(filterAsignaturaSeccion)
    );
  });

  return (
    <Modal show={show} onHide={onHide} size="xl" backdrop="static" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {editingUser
            ? `Editar Asociaciones de Sección para ${editingUser.NOMBRE_USUARIO}`
            : 'Asociar Usuario a Sección(es)'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row>
          <Col md={editingUser ? 12 : 6}>
            <Card className="mb-3">
              <Card.Header
                style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
              >
                <Card.Title as="h5">
                  {editingUser
                    ? 'Información del Usuario'
                    : '1. Seleccionar Usuario'}
                </Card.Title>
              </Card.Header>
              <Card.Body
                style={
                  editingUser
                    ? {
                        fontSize: '0.9em',
                        paddingTop: '0.5rem',
                        paddingBottom: '0.5rem',
                      }
                    : {}
                }
              >
                {editingUser ? (
                  <div>
                    <span>
                      <strong>Nombre:</strong> {editingUser.NOMBRE_USUARIO}
                    </span>
                    <br />
                    <span>
                      <strong>Email:</strong>
                      {editingUser.EMAIL_USUARIO || 'N/A'}
                    </span>
                    <br />
                    <span>
                      <strong>Rol:</strong>
                      {allRoles.find((r) => r.ID_ROL === editingUser.ROL_ID_ROL)
                        ?.NOMBRE_ROL || 'N/A'}
                    </span>
                  </div>
                ) : (
                  <Form>
                    {/* Modificado: Usar Row/Col para poner los filtros en la misma fila */}
                    <Row className="mb-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Buscar Usuario:</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Buscar por nombre o email..."
                            value={searchTermUser}
                            onChange={(e) => setSearchTermUser(e.target.value)}
                            disabled={processing}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Filtrar por Rol:</Form.Label>
                          <Select
                            inputId="filterRoleUser-select"
                            options={toSelectOptions(
                              allRoles.filter(
                                (r) =>
                                  r.NOMBRE_ROL === ALUMNO_ROLE_NAME ||
                                  r.NOMBRE_ROL === DOCENTE_ROLE_NAME
                              ),
                              'ID_ROL',
                              'NOMBRE_ROL',
                              'Todos los Roles Elegibles'
                            )}
                            value={
                              toSelectOptions(
                                allRoles,
                                'ID_ROL',
                                'NOMBRE_ROL'
                              ).find(
                                (option) =>
                                  option.value.toString() === filterRoleUser
                              ) || {
                                value: '',
                                label: 'Todos los Roles Elegibles',
                              }
                            }
                            onChange={(selectedOption) =>
                              setFilterRoleUser(
                                selectedOption
                                  ? selectedOption.value.toString()
                                  : ''
                              )
                            }
                            isDisabled={processing}
                            placeholder="Todos los Roles Elegibles"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Label>Usuario a Asociar:</Form.Label>
                    <div // Contenedor para los radio buttons con scroll
                      style={{ maxHeight: '150px', overflowY: 'auto' }}
                      className="mb-3 border p-2 rounded" // Añadimos algo de padding y borde
                    >
                      {filteredEligibleUsersInModal.map((user) => (
                        <Form.Check
                          key={user.ID_USUARIO}
                          type="radio"
                          id={`user-radio-${user.ID_USUARIO}`}
                          label={`${user.NOMBRE_USUARIO} (${user.EMAIL_USUARIO}) - ${user.NOMBRE_ROL}`}
                          value={user.ID_USUARIO.toString()}
                          checked={
                            selectedUsuarioId === user.ID_USUARIO.toString()
                          }
                          onChange={(e) => {
                            if (!processing) {
                              setSelectedUsuarioId(e.target.value);
                            }
                          }}
                          disabled={processing}
                          className="mb-2" // Espacio entre radios
                        />
                      ))}
                    </div>
                    {filteredEligibleUsersInModal.length === 0 && (
                      <p className="text-muted">
                        No hay usuarios que coincidan con los filtros.
                      </p>
                    )}
                  </Form>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col md={editingUser ? 12 : 6}>
            <Card className="mb-3">
              <Card.Header>
                <Card.Title as="h5">
                  {editingUser
                    ? 'Modificar Secciones Asociadas'
                    : '2. Seleccionar Secciones'}
                </Card.Title>
              </Card.Header>
              <Card.Body>
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label htmlFor="filterAsignaturaSeccion-select">
                      Filtrar por Asignatura:
                    </Form.Label>
                    <Select
                      inputId="filterAsignaturaSeccion-select"
                      options={toSelectOptions(
                        asignaturas,
                        'ID_ASIGNATURA',
                        'NOMBRE_ASIGNATURA',
                        'Todas las Asignaturas'
                      )}
                      value={
                        toSelectOptions(
                          asignaturas,
                          'ID_ASIGNATURA',
                          'NOMBRE_ASIGNATURA'
                        ).find(
                          (option) =>
                            option.value.toString() === filterAsignaturaSeccion
                        ) || { value: '', label: 'Todas las Asignaturas' }
                      }
                      onChange={(selectedOption) =>
                        setFilterAsignaturaSeccion(
                          selectedOption ? selectedOption.value.toString() : ''
                        )
                      }
                      isDisabled={processing}
                      placeholder="Todas las Asignaturas"
                    />
                  </Form.Group>
                  <div // Cambiado de ListGroup a div
                    style={{ maxHeight: '200px', overflowY: 'auto' }}
                    className="border p-2 rounded mb-2" // Mantenemos clases para el borde y scroll
                  >
                    {filteredSeccionesInModal.map((seccion) => (
                      <Form.Check // Form.Check directamente en el div
                        key={seccion.ID_SECCION}
                        type="checkbox"
                        id={`seccion-modal-${seccion.ID_SECCION}`}
                        label={
                          seccion.NOMBRE_SECCION ||
                          seccion.CODIGO_SECCION ||
                          `ID: ${seccion.ID_SECCION}`
                        }
                        value={seccion.ID_SECCION.toString()}
                        checked={selectedSeccionIds.includes(
                          seccion.ID_SECCION.toString()
                        )}
                        onChange={() =>
                          handleSeccionSelection(seccion.ID_SECCION.toString())
                        }
                        disabled={processing}
                        className="mb-2" // Añadido para espaciado, como en los radio buttons
                      />
                    ))}
                  </div>
                  {filteredSeccionesInModal.length === 0 && (
                    <p className="text-muted mt-2">
                      No hay secciones que coincidan con el filtro o no hay
                      secciones cargadas.
                    </p>
                  )}
                  {/* Añadido: Contador de secciones seleccionadas */}
                  <Form.Text>
                    {selectedSeccionIds.length} sección(es) seleccionada(s).
                  </Form.Text>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={processing}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={handleAddAssociation}
          disabled={
            (!selectedUsuarioId && !editingUser) || // Si es nuevo, se necesita usuario
            selectedSeccionIds.length === 0 ||
            processing
          }
        >
          {processing ? (
            <Spinner
              as="span"
              animation="border"
              size="sm"
              role="status"
              aria-hidden="true"
            />
          ) : editingUser ? (
            'Actualizar Asociaciones'
          ) : (
            'Guardar Asociación'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default UsuarioSeccionModal;
