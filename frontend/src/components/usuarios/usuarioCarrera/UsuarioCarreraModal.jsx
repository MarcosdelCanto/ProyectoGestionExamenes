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
} from 'react-bootstrap'; // Asegúrate de importar todo lo de react-bootstrap

// Nombres de roles para el filtro interno del modal
const COORDINADOR_ROLE_NAME = 'COORDINADOR CARRERA';
const COORDINADOR_DOCENTE_ROLE_NAME = 'COORDINADOR DOCENTE';
const DIRECTOR_ROLE_NAME = 'JEFE CARRERA';

function UsuarioCarreraModal({
  show,
  onHide,
  onSubmit, // Cambiado de handleAddAssociation para claridad y consistencia
  editingUser,
  allRoles,
  eligibleUsers,
  // renombré 'carreras' a 'allCarreras' y 'escuelas' a 'allEscuelas' para claridad al recibir como prop
  allCarreras,
  allEscuelas,
  selectedUsuarioId,
  setSelectedUsuarioId,
  selectedCarreraIds,
  setSelectedCarreraIds, // Renombrado de handleCarreraSelection para pasar el setter directamente
  processing,
  // Props para los filtros (estados y setters del padre)
  searchTermUser,
  setSearchTermUser,
  filterRoleUser,
  setFilterRoleUser,
  filterEscuelaCarrera,
  setFilterEscuelaCarrera,
}) {
  // Filtra la lista de 'eligibleUsers' (que ya son Coordinadores/Directores/etc.)
  // basado en el searchTermUser y filterRoleUser que vienen como props del padre.
  const filteredEligibleUsersInModal = Array.isArray(eligibleUsers)
    ? eligibleUsers.filter((user) => {
        const searchTermMatch =
          !searchTermUser || // si searchTermUser es vacío, no filtrar por texto
          (user.NOMBRE_USUARIO &&
            user.NOMBRE_USUARIO.toLowerCase().includes(
              searchTermUser.toLowerCase()
            )) ||
          (user.EMAIL_USUARIO &&
            user.EMAIL_USUARIO.toLowerCase().includes(
              searchTermUser.toLowerCase()
            ));

        const roleMatch =
          !filterRoleUser || // si filterRoleUser es vacío, no filtrar por rol
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
        <h5>
          Seleccionar Usuario (Coordinador/Jefe de Carrera/Coordinador Docente)
        </h5>
        <Row className="mb-3">
          <Col md={6}>
            <BootstrapForm.Group>
              <BootstrapForm.Label>Buscar Usuario:</BootstrapForm.Label>
              <BootstrapForm.Control
                type="text"
                placeholder="Nombre o email..."
                value={searchTermUser}
                onChange={(e) => setSearchTermUser(e.target.value)}
                disabled={processing || !!editingUser}
              />
            </BootstrapForm.Group>
          </Col>
          <Col md={6}>
            <BootstrapForm.Group>
              <BootstrapForm.Label>Filtrar por Rol:</BootstrapForm.Label>
              <BootstrapForm.Select
                value={filterRoleUser}
                onChange={(e) => setFilterRoleUser(e.target.value)}
                disabled={processing || !!editingUser}
              >
                <option value="">Todos los Roles Elegibles</option>
                {/* Filtramos allRoles para mostrar solo los que definimos como elegibles */}
                {Array.isArray(allRoles) &&
                  allRoles
                    .filter(
                      (r) =>
                        r.NOMBRE_ROL === COORDINADOR_ROLE_NAME ||
                        r.NOMBRE_ROL === DIRECTOR_ROLE_NAME ||
                        r.NOMBRE_ROL === COORDINADOR_DOCENTE_ROLE_NAME
                    )
                    .map((rol) => (
                      <option key={rol.ID_ROL} value={rol.ID_ROL.toString()}>
                        {rol.NOMBRE_ROL}
                      </option>
                    ))}
              </BootstrapForm.Select>
            </BootstrapForm.Group>
          </Col>
        </Row>

        <BootstrapForm.Label>Usuario a Asociar:</BootstrapForm.Label>
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
                checked={selectedUsuarioId === user.ID_USUARIO.toString()}
                onChange={(e) => setSelectedUsuarioId(e.target.value)}
                disabled={processing || !!editingUser}
              />
            ))
          ) : (
            <p className="text-muted m-0">
              No hay usuarios que coincidan con los filtros o no hay usuarios
              elegibles cargados.
            </p>
          )}
        </div>
        <hr />
        <h5>Seleccionar Carreras a Asignar</h5>
        <BootstrapForm.Group className="mb-3">
          <BootstrapForm.Label>
            Filtrar Carreras por Escuela:
          </BootstrapForm.Label>
          <BootstrapForm.Select
            value={filterEscuelaCarrera}
            onChange={(e) => setFilterEscuelaCarrera(e.target.value)}
            disabled={processing}
          >
            <option value="">Todas las Escuelas</option>
            {Array.isArray(allEscuelas) &&
              allEscuelas.map((escuela) => (
                <option
                  key={escuela.ID_ESCUELA}
                  value={escuela.ID_ESCUELA.toString()}
                >
                  {escuela.NOMBRE_ESCUELA}
                </option>
              ))}
          </BootstrapForm.Select>
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
                // value no es necesario si onChange maneja el ID directamente
                checked={selectedCarreraIds.includes(
                  carrera.ID_CARRERA.toString()
                )}
                onChange={() =>
                  handleCarreraCheckboxChange(carrera.ID_CARRERA.toString())
                }
                disabled={processing}
              />
            ))
          ) : (
            <p className="text-muted m-0">
              No hay carreras para la escuela seleccionada o no hay carreras
              cargadas.
            </p>
          )}
        </div>
        <BootstrapForm.Text>
          {selectedCarreraIds.length} carrera(s) seleccionada(s).
        </BootstrapForm.Text>
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
