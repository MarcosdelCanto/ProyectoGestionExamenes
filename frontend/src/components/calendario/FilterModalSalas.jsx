import React from 'react';
import { Modal, Button, Form } from 'react-bootstrap'; // Importar componentes de react-bootstrap

export default function FilterModalSalas({
  isOpen,
  onClose,
  sedesDisponibles,
  selectedSede,
  onSetSelectedSede,
  edificiosDisponibles,
  selectedEdificio,
  onSetSelectedEdificio,
  onAplicarFiltros, // Para cerrar el modal y aplicar
}) {
  if (!isOpen) return null;

  // La función onAplicarFiltros ahora también cerrará el modal.
  // Si solo quieres aplicar y mantener el modal abierto, necesitarías separar la lógica.
  const handleApplyAndClose = () => {
    onAplicarFiltros(); // Llama a la función original de aplicar filtros
    onClose(); // Cierra el modal
  };

  return (
    <Modal show={isOpen} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title as="h5">Filtrar Salas</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3" controlId="sedeSelect">
            <Form.Label className="form-label-sm">Sede:</Form.Label>
            <Form.Select
              className="form-select form-select-sm"
              value={selectedSede}
              onChange={(e) => onSetSelectedSede(e.target.value)}
            >
              <option value="">Todas las Sedes</option>
              {sedesDisponibles.map((sede) => (
                <option key={sede.ID_SEDE} value={sede.ID_SEDE}>
                  {sede.NOMBRE_SEDE}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3" controlId="edificioSelect">
            <Form.Label className="form-label form-label-sm">
              Edificio:
            </Form.Label>
            <Form.Select
              className="form-select form-select-sm"
              value={selectedEdificio}
              onChange={(e) => onSetSelectedEdificio(e.target.value)}
              disabled={
                !selectedSede &&
                edificiosDisponibles.some((e) => e.SEDE_ID_SEDE)
              }
            >
              <option value="">Todos los Edificios</option>
              {edificiosDisponibles
                .filter(
                  (edificio) =>
                    !selectedSede ||
                    (edificio.SEDE_ID_SEDE &&
                      edificio.SEDE_ID_SEDE.toString() === selectedSede)
                )
                .map((edificio) => (
                  <option
                    key={edificio.ID_EDIFICIO}
                    value={edificio.ID_EDIFICIO}
                  >
                    {edificio.NOMBRE_EDIFICIO}
                  </option>
                ))}
            </Form.Select>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" size="sm" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="primary" size="sm" onClick={handleApplyAndClose}>
          Aplicar Filtros
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
