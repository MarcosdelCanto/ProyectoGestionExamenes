import React from 'react';
import Select from 'react-select';
import { Modal, Button } from 'react-bootstrap';
import {
  duocSelectStyles,
  duocSelectStylesDisabled,
} from '../../styles/duocSelectStyles';

export default function FilterModalSalas({
  isOpen,
  onClose,
  sedesDisponibles,
  selectedSede,
  onSetSelectedSede,
  edificiosDisponibles,
  selectedEdificio,
  onSetSelectedEdificio,
  onAplicarFiltros,
}) {
  if (!isOpen) return null;

  const handleApplyAndClose = () => {
    onAplicarFiltros();
    onClose();
  };

  const sedeOptions = sedesDisponibles.map((s) => ({
    value: String(s.ID_SEDE),
    label: s.NOMBRE_SEDE,
  }));
  const edificiosFiltrados = edificiosDisponibles.filter(
    (e) =>
      !selectedSede ||
      (e.SEDE_ID_SEDE && e.SEDE_ID_SEDE.toString() === selectedSede)
  );
  const edificioOptions = edificiosFiltrados.map((e) => ({
    value: String(e.ID_EDIFICIO),
    label: e.NOMBRE_EDIFICIO,
  }));
  const edificiosDisabled =
    !selectedSede && edificiosDisponibles.some((e) => e.SEDE_ID_SEDE);

  return (
    <Modal show={isOpen} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title as="h5">Filtrar Salas</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3">
          <label className="form-label form-label-sm">Sede:</label>
          <Select
            inputId="sedeSelect"
            options={sedeOptions}
            value={sedeOptions.find((o) => o.value === selectedSede) || null}
            onChange={(opt) => onSetSelectedSede(opt ? opt.value : '')}
            placeholder="Todas las Sedes"
            isClearable
            styles={duocSelectStyles}
            menuPortalTarget={document.body}
            menuPosition="fixed"
          />
        </div>
        <div className="mb-3">
          <label className="form-label form-label-sm">Edificio:</label>
          <Select
            inputId="edificioSelect"
            options={edificioOptions}
            value={
              edificioOptions.find((o) => o.value === selectedEdificio) || null
            }
            onChange={(opt) => onSetSelectedEdificio(opt ? opt.value : '')}
            placeholder="Todos los Edificios"
            isClearable
            isDisabled={edificiosDisabled}
            styles={
              edificiosDisabled ? duocSelectStylesDisabled : duocSelectStyles
            }
            menuPortalTarget={document.body}
            menuPosition="fixed"
          />
        </div>
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
