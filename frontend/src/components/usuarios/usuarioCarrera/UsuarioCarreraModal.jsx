import React from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';

const COORDINADOR_ROLE_NAME = 'COORDINADOR';
const DIRECTOR_ROLE_NAME = 'DIRECTOR';

function UsuarioCarreraModal({
  show,
  onHide,
  editingUser,
  allRoles,
  eligibleUsers, // Esta será la lista de usuarios ya filtrados por rol elegible
  carreras,
  escuelas,
  selectedUsuarioId,
  setSelectedUsuarioId,
  selectedCarreraIds,
  handleCarreraSelection,
  handleAddAssociation,
  processing,
  searchTermUser,
  setSearchTermUser,
  filterRoleUser,
  setFilterRoleUser,
  filterEscuelaCarrera,
  setFilterEscuelaCarrera,
}) {
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

  const filteredCarrerasByEscuelaInModal = carreras.filter((carrera) => {
    return (
      filterEscuelaCarrera === '' ||
      carrera.ESCUELA_ID_ESCUELA === parseInt(filterEscuelaCarrera)
    );
  });

  return (
    <Modal show={show} onHide={onHide} size="xl">
      <Modal.Header closeButton>
        <Modal.Title>
          {editingUser ? 'Editar Asociaciones de' : 'Asociar Usuario a'} Carrera
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <h5>Seleccionar Usuario (Coordinador/Director)</h5>
          <Form.Group className="mb-2">
            <Form.Control
              type="text"
              placeholder="Buscar usuario por nombre o email..."
              value={searchTermUser}
              onChange={(e) => setSearchTermUser(e.target.value)}
              disabled={processing || !!editingUser}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Filtrar por Rol:</Form.Label>
            <Form.Select
              value={filterRoleUser}
              onChange={(e) => setFilterRoleUser(e.target.value)}
              disabled={processing || !!editingUser}
            >
              <option value="">Todos los Roles Elegibles</option>
              {allRoles
                .filter(
                  (r) =>
                    r.NOMBRE_ROL === COORDINADOR_ROLE_NAME ||
                    r.NOMBRE_ROL === DIRECTOR_ROLE_NAME
                )
                .map((rol) => (
                  <option key={rol.ID_ROL} value={rol.ID_ROL}>
                    {rol.NOMBRE_ROL}
                  </option>
                ))}
            </Form.Select>
          </Form.Group>
          <div
            style={{
              maxHeight: '150px',
              overflowY: 'auto',
              border: '1px solid #ccc',
              marginBottom: '1rem',
              padding: '0.5rem',
            }}
          >
            {filteredEligibleUsersInModal.map((user) => (
              <Form.Check
                key={user.ID_USUARIO}
                type="radio"
                id={`user-carrera-${user.ID_USUARIO}`}
                label={`${user.NOMBRE_USUARIO} (${user.EMAIL_USUARIO}) - ${user.NOMBRE_ROL}`}
                value={user.ID_USUARIO.toString()}
                checked={selectedUsuarioId === user.ID_USUARIO.toString()}
                onChange={(e) => setSelectedUsuarioId(e.target.value)}
                disabled={processing || !!editingUser}
              />
            ))}
            {filteredEligibleUsersInModal.length === 0 && (
              <p className="text-muted">
                No hay usuarios que coincidan con los filtros.
              </p>
            )}
          </div>
          <hr />
          <h5>Seleccionar Carreras</h5>
          <Form.Group className="mb-3">
            <Form.Label>Filtrar Carreras por Escuela:</Form.Label>
            <Form.Select
              value={filterEscuelaCarrera}
              onChange={(e) => setFilterEscuelaCarrera(e.target.value)}
              disabled={processing}
            >
              <option value="">Todas las Escuelas</option>
              {escuelas.map((escuela) => (
                <option key={escuela.ID_ESCUELA} value={escuela.ID_ESCUELA}>
                  {escuela.NOMBRE_ESCUELA}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <div
            style={{
              maxHeight: '200px',
              overflowY: 'auto',
              border: '1px solid #ccc',
              padding: '0.5rem',
            }}
          >
            {filteredCarrerasByEscuelaInModal.map((carrera) => (
              <Form.Check
                key={carrera.ID_CARRERA}
                type="checkbox"
                id={`carrera-${carrera.ID_CARRERA}`}
                label={carrera.NOMBRE_CARRERA}
                value={carrera.ID_CARRERA.toString()}
                checked={selectedCarreraIds.includes(
                  carrera.ID_CARRERA.toString()
                )}
                onChange={() =>
                  handleCarreraSelection(carrera.ID_CARRERA.toString())
                }
                disabled={processing}
              />
            ))}
            {filteredCarrerasByEscuelaInModal.length === 0 && (
              <p className="text-muted">
                No hay carreras que coincidan con el filtro o no hay carreras
                cargadas.
              </p>
            )}
          </div>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={processing}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={handleAddAssociation}
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
