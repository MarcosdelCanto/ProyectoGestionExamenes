import React from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';

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
    <Modal show={show} onHide={onHide} size="xl">
      <Modal.Header closeButton>
        <Modal.Title>
          {editingUser ? 'Editar Asociaciones de' : 'Asociar Usuario a'} Sección
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <h5>Seleccionar Usuario (Alumno/Docente)</h5>
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
                    r.NOMBRE_ROL === ALUMNO_ROLE_NAME ||
                    r.NOMBRE_ROL === DOCENTE_ROLE_NAME
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
                id={`user-seccion-${user.ID_USUARIO}`}
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
          <h5>Seleccionar Secciones</h5>
          <Form.Group className="mb-3">
            <Form.Label>Filtrar Secciones por Asignatura:</Form.Label>
            <Form.Select
              value={filterAsignaturaSeccion}
              onChange={(e) => setFilterAsignaturaSeccion(e.target.value)}
              disabled={processing}
            >
              <option value="">Todas las Asignaturas</option>
              {asignaturas.map((asignatura) => (
                <option
                  key={asignatura.ID_ASIGNATURA}
                  value={asignatura.ID_ASIGNATURA}
                >
                  {asignatura.NOMBRE_ASIGNATURA}
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
            {filteredSeccionesInModal.map((seccion) => (
              <Form.Check
                key={seccion.ID_SECCION}
                type="checkbox"
                id={`seccion-${seccion.ID_SECCION}`}
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
              />
            ))}
            {filteredSeccionesInModal.length === 0 && (
              <p className="text-muted">
                No hay secciones que coincidan con el filtro o no hay secciones
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
            !selectedUsuarioId || selectedSeccionIds.length === 0 || processing
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
