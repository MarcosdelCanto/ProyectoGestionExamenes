import React, { useState, useRef, useEffect } from 'react';
import { FaSearch, FaFilter, FaChevronDown } from 'react-icons/fa';
import './styles/SalaSelector.css';

export default function SalaSelector({
  salas,
  searchTerm,
  onSearch,
  filteredSalas,
  selectedSala,
  onSelectSala,
  isLoadingSalas,
  onOpenFilterModal,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Actualizar el valor del input cuando se selecciona una sala
  useEffect(() => {
    if (selectedSala) {
      setInputValue(selectedSala.NOMBRE_SALA);
    } else {
      setInputValue('');
    }
  }, [selectedSala]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    onSearch(e); // Llamar a la función de búsqueda del padre
    setIsOpen(true); // Abrir dropdown al escribir
  };

  const handleSelectSala = (sala) => {
    onSelectSala(sala);
    setInputValue(sala.NOMBRE_SALA);
    setIsOpen(false);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleClearSelection = () => {
    setInputValue('');
    onSelectSala(null);
    onSearch({ target: { value: '' } }); // Limpiar búsqueda
    inputRef.current?.focus();
  };

  const tieneSalasParaMostrar = filteredSalas && filteredSalas.length > 0;
  const noHayResultadosDeBusqueda =
    searchTerm && !tieneSalasParaMostrar && !isLoadingSalas;

  // Ajustar para el nuevo diseño simplificado

  return (
    <div className="sala-selector-panel">
      {/* Contenedor para el selector y el botón de filtro */}
      <div className="d-flex mb-2 gap-2 align-items-center">
        <div className="position-relative flex-grow-1" ref={dropdownRef}>
          {/* Input con funcionalidad de búsqueda */}
          <div className="input-group input-group-sm">
            <span className="input-group-text bg-light">
              <FaSearch />
            </span>
            <input
              ref={inputRef}
              type="text"
              className="form-control"
              placeholder="Buscar y seleccionar sala..."
              value={inputValue}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              aria-label="Buscar sala"
              autoComplete="off"
            />
            {/* Botón para limpiar selección */}
            {selectedSala && (
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={handleClearSelection}
                title="Limpiar selección"
              >
                ×
              </button>
            )}
            {/* Indicador de dropdown */}
            <span
              className="input-group-text bg-light"
              style={{ cursor: 'pointer' }}
              onClick={() => setIsOpen(!isOpen)}
            >
              <FaChevronDown
                style={{
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }}
              />
            </span>
          </div>

          {/* Dropdown con opciones */}
          {isOpen && (
            <div
              className="dropdown-menu show w-100 mt-1 shadow-sm"
              style={{
                position: 'absolute',
                zIndex: 1050,
                maxHeight: '200px',
                overflowY: 'auto',
              }}
            >
              {isLoadingSalas ? (
                <div className="dropdown-item-text text-center py-3">
                  <div
                    className="spinner-border spinner-border-sm text-primary"
                    role="status"
                  >
                    <span className="visually-hidden">Cargando salas...</span>
                  </div>
                </div>
              ) : tieneSalasParaMostrar ? (
                filteredSalas.map((sala) => (
                  <button
                    key={sala.ID_SALA}
                    type="button"
                    className={`dropdown-item ${
                      sala.ID_SALA === selectedSala?.ID_SALA ? 'active' : ''
                    }`}
                    onClick={() => handleSelectSala(sala)}
                    style={{ fontSize: '0.875rem' }}
                  >
                    <div>
                      <div className="fw-semibold">{sala.NOMBRE_SALA}</div>
                      {sala.EDIFICIO && (
                        <small className="text-muted">
                          Edificio: {sala.EDIFICIO}
                        </small>
                      )}
                    </div>
                  </button>
                ))
              ) : noHayResultadosDeBusqueda ? (
                <div className="dropdown-item-text text-center text-muted py-3">
                  <small>No se encontraron salas con "{searchTerm}"</small>
                </div>
              ) : (
                <div className="dropdown-item-text text-center text-muted py-3">
                  <small>No hay salas disponibles</small>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Botón de filtro */}
        <button
          className="btn btn-light btn-sm"
          onClick={onOpenFilterModal}
          title="Filtrar salas"
        >
          <FaFilter />
        </button>
      </div>

      {/* Información de la sala seleccionada */}
      {selectedSala && (
        <div
          className="alert alert-info py-2 mb-0"
          style={{ fontSize: '0.875rem' }}
        >
          <strong>Sala seleccionada:</strong> {selectedSala.NOMBRE_SALA}
          {selectedSala.EDIFICIO && (
            <span className="ms-2">
              <small className="text-muted">({selectedSala.EDIFICIO})</small>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
