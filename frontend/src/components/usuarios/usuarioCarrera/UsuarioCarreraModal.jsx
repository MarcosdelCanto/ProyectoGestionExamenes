import React from 'react'; // No necesitas useState, useEffect, useMemo aquí si todos los estados vienen de props
import {
  Modal,
  Button,
  Form as BootstrapForm,
  Spinner,
  FormCheck,
  InputGroup,
  Row,
  Col,
  Card, // Importar Card
} from 'react-bootstrap'; // Asegúrate de importar todo lo de react-bootstrap
import Select from 'react-select'; // Importar react-select

// Nombres de roles para el filtro interno del modal
const COORDINADOR_ROLE_NAME = 'COORDINADOR CARRERA';
const COORDINADOR_DOCENTE_ROLE_NAME = 'COORDINADOR DOCENTE';
const DIRECTOR_ROLE_NAME = 'JEFE CARRERA';

function UsuarioCarreraModal({
  show,
  onHide,
  onSubmit,
  editingUser,
  allRoles,
  eligibleUsers,
  allCarreras,
  allEscuelas,
  selectedUsuarioId,
  setSelectedUsuarioId,
  selectedCarreraIds,
  setSelectedCarreraIds,
  processing,
  searchTermUser,
  setSearchTermUser,
  filterRoleUser,
  setFilterRoleUser,
  filterEscuelaCarrera,
  setFilterEscuelaCarrera,
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

  // Filtra la lista de 'eligibleUsers' (que ya viene pre-filtrada por el padre para "nuevas asociaciones")
  const filteredEligibleUsersInModal = Array.isArray(eligibleUsers)
    ? eligibleUsers.filter((user) => {
        // Filtros existentes
        const searchTermMatch =
          !searchTermUser ||
          (user.NOMBRE_USUARIO &&
            user.NOMBRE_USUARIO.toLowerCase().includes(
              searchTermUser.toLowerCase()
            )) ||
          (user.EMAIL_USUARIO &&
            user.EMAIL_USUARIO.toLowerCase().includes(
              searchTermUser.toLowerCase()
            ));

        const roleMatch =
          !filterRoleUser ||
          (user.ROL_ID_ROL && user.ROL_ID_ROL.toString() === filterRoleUser);

        return searchTermMatch && roleMatch;
      })
    : [];

  // Filtra la lista de 'allCarreras' basado en la escuela seleccionada
  const filteredCarrerasByEscuelaInModal = Array.isArray(allCarreras)
    ? allCarreras.filter((carrera) => {
        return (
          !filterEscuelaCarrera || // si filterEscuelaCarrera es vacío, no filtrar
          (carrera.ESCUELA_ID_ESCUELA &&
            carrera.ESCUELA_ID_ESCUELA.toString() === filterEscuelaCarrera)
        );
      })
    : [];

  // Manejador para los checkboxes de carrera
  const handleCarreraCheckboxChange = (carreraIdStr) => {
    setSelectedCarreraIds((prevSelected) =>
      prevSelected.includes(carreraIdStr)
        ? prevSelected.filter((id) => id !== carreraIdStr)
        : [...prevSelected, carreraIdStr]
    );
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" backdrop="static" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {editingUser
            ? `Editar Asociaciones de Carrera para ${editingUser.NOMBRE_USUARIO}`
            : 'Asociar Usuario a Carrera(s)'}
        </Modal.Title>
      </Modal.Header>
      {/* No se necesita <BootstrapForm> aquí si el Modal.Footer tiene el botón de submit y llamas a onSubmit directamente */}
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
                      <strong>Email:</strong>{' '}
                      {editingUser.EMAIL_USUARIO || 'N/A'}
                    </span>
                    <br />
                    <span>
                      <strong>Rol:</strong>{' '}
                      {allRoles.find((r) => r.ID_ROL === editingUser.ROL_ID_ROL)
                        ?.NOMBRE_ROL || 'N/A'}
                    </span>
                  </div>
                ) : (
                  <>
                    <Row className="mb-3">
                      <Col md={6}>
                        <BootstrapForm.Group>
                          <BootstrapForm.Label>
                            Buscar Usuario:
                          </BootstrapForm.Label>
                          <BootstrapForm.Control
                            type="text"
                            placeholder="Nombre o email..."
                            value={searchTermUser}
                            onChange={(e) => setSearchTermUser(e.target.value)}
                            disabled={processing}
                          />
                        </BootstrapForm.Group>
                      </Col>
                      <Col md={6}>
                        <BootstrapForm.Group>
                          <BootstrapForm.Label>
                            Filtrar por Rol:
                          </BootstrapForm.Label>
                          <Select
                            inputId="filterRoleUser-carrera-select"
                            options={toSelectOptions(
                              Array.isArray(allRoles)
                                ? allRoles.filter(
                                    (r) =>
                                      r.NOMBRE_ROL === COORDINADOR_ROLE_NAME ||
                                      r.NOMBRE_ROL === DIRECTOR_ROLE_NAME ||
                                      r.NOMBRE_ROL ===
                                        COORDINADOR_DOCENTE_ROLE_NAME
                                  )
                                : [],
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
                        </BootstrapForm.Group>
                      </Col>
                    </Row>
                    <BootstrapForm.Label>
                      Usuario a Asociar:
                    </BootstrapForm.Label>
                    <div
                      className="border p-2 rounded mb-3"
                      style={{ maxHeight: '150px', overflowY: 'auto' }}
                    >
                      {filteredEligibleUsersInModal.length > 0 ? (
                        filteredEligibleUsersInModal.map((user) => (
                          <FormCheck // Usando FormCheck importado
                            key={user.ID_USUARIO}
                            type="radio"
                            name="selectedUserRadio" // Para que solo uno pueda ser seleccionado
                            id={`user-carrera-modal-${user.ID_USUARIO}`}
                            label={`${user.NOMBRE_USUARIO} (${user.EMAIL_USUARIO || 'N/A'}) - ${user.NOMBRE_ROL || 'N/A'}`}
                            value={user.ID_USUARIO.toString()}
                            checked={
                              selectedUsuarioId === user.ID_USUARIO.toString()
                            }
                            onChange={(e) =>
                              setSelectedUsuarioId(e.target.value)
                            }
                            disabled={processing}
                          />
                        ))
                      ) : (
                        <p className="text-muted m-0">
                          No hay usuarios que coincidan con los filtros o no hay
                          usuarios elegibles cargados.
                        </p>
                      )}
                    </div>
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col md={editingUser ? 12 : 6}>
            <Card className="mb-3">
              <Card.Header>
                <Card.Title as="h5">
                  {editingUser
                    ? 'Modificar Carreras Asociadas'
                    : '2. Seleccionar Carreras'}
                </Card.Title>
              </Card.Header>
              <Card.Body>
                <BootstrapForm.Group className="mb-3">
                  <BootstrapForm.Label htmlFor="filterEscuelaCarrera-select">
                    Filtrar Carreras por Escuela:
                  </BootstrapForm.Label>
                  <Select
                    inputId="filterEscuelaCarrera-select"
                    options={toSelectOptions(
                      allEscuelas,
                      'ID_ESCUELA',
                      'NOMBRE_ESCUELA',
                      'Todas las Escuelas'
                    )}
                    value={
                      toSelectOptions(
                        allEscuelas,
                        'ID_ESCUELA',
                        'NOMBRE_ESCUELA'
                      ).find(
                        (option) =>
                          option.value.toString() === filterEscuelaCarrera
                      ) || { value: '', label: 'Todas las Escuelas' }
                    }
                    onChange={(selectedOption) =>
                      setFilterEscuelaCarrera(
                        selectedOption ? selectedOption.value.toString() : ''
                      )
                    }
                    isDisabled={processing}
                    placeholder="Todas las Escuelas"
                  />
                </BootstrapForm.Group>

                <div
                  className="border p-2 rounded"
                  style={{ maxHeight: '200px', overflowY: 'auto' }}
                >
                  {filteredCarrerasByEscuelaInModal.length > 0 ? (
                    filteredCarrerasByEscuelaInModal.map((carrera) => (
                      <FormCheck // Usando FormCheck importado
                        key={carrera.ID_CARRERA}
                        type="checkbox"
                        id={`carrera-modal-${carrera.ID_CARRERA}`}
                        label={carrera.NOMBRE_CARRERA}
                        checked={selectedCarreraIds.includes(
                          carrera.ID_CARRERA.toString()
                        )}
                        onChange={() =>
                          handleCarreraCheckboxChange(
                            carrera.ID_CARRERA.toString()
                          )
                        }
                        disabled={processing}
                      />
                    ))
                  ) : (
                    <p className="text-muted m-0">
                      No hay carreras para la escuela seleccionada o no hay
                      carreras cargadas.
                    </p>
                  )}
                </div>
                <BootstrapForm.Text>
                  {selectedCarreraIds.length} carrera(s) seleccionada(s).
                </BootstrapForm.Text>
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
          onClick={onSubmit} // Llama a la función onSubmit pasada por el padre
          disabled={
            !selectedUsuarioId || selectedCarreraIds.length === 0 || processing
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

export default UsuarioCarreraModal;
