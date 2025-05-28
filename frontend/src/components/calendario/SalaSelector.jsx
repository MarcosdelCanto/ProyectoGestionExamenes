import React, { useState, useMemo } from 'react';
import { FaArrowCircleRight, FaSearch } from 'react-icons/fa';

export default function SalaSelector({
  salas,
  searchTerm,
  onSearch,
  filteredSalas, // La lista ya filtrada por el padre
  selectedSala,
  onSelectSala,
  isLoadingSalas,
}) {
  const [searchTermSala, setSearchTermSala] = useState('');
  const tieneSalasParaMostrar = filteredSalas && filteredSalas.length > 0;
  const noHayResultadosDeBusqueda =
    searchTerm && !tieneSalasParaMostrar && !isLoadingSalas; // Usa la prop searchTerm
  const listaInicialVacia =
    !searchTerm &&
    !tieneSalasParaMostrar &&
    !isLoadingSalas &&
    salas &&
    salas.length === 0;

  const handleSearchSala = (event) => {
    setSearchTermSala(event.target.value);
  };

  return (
    <div className="selector-panel p-3 border rounded shadow-sm">
      <h5 className="mb-3">Seleccionar Sala</h5>

      <div className="input-group input-group-sm mb-2">
        <span className="input-group-text bg-light">
          <FaSearch />
        </span>
        <input
          type="search"
          className="form-control"
          placeholder="Buscar Cód, Nombre, Edificio..."
          value={searchTerm}
          onChange={onSearch}
          aria-label="Buscar sala"
        />
      </div>

      <div
        className="table-responsive"
        style={{
          maxHeight: '500px',
          maxWidth: '100%',
          overflowY: 'auto',
          minHeight: '80px',
          backgroundColor: '#f8f9fa',
        }}
      >
        {isLoadingSalas ? (
          <div className="d-flex justify-content-center align-items-center h-120 p-0.5">
            <div
              className="spinner-border spinner-border-sm text-primary"
              role="status"
            >
              <span className="visually-hidden">Cargando salas...</span>
            </div>
          </div>
        ) : tieneSalasParaMostrar ? (
          <table
            className="table table-hover table-sm table-striped tabla-seleccion mb-0"
            style={{ fontSize: '0.875rem', maxWidth: '80%' }} // Tamaño de fuente más pequeño para la tabla
          >
            <thead className="table-light sticky-top">
              <tr>
                <th scope="col" style={{ width: '15%' }}>
                  Cód.
                </th>
                <th scope="col" style={{ width: '50%' }}>
                  Nombre
                </th>
                <th scope="col" style={{ width: '25%' }}>
                  Edificio
                </th>
                <th
                  scope="col"
                  style={{ width: '10%' }}
                  className="text-center"
                >
                  <span className="visually-hidden">Seleccionar</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSalas.map((s) => (
                <tr
                  key={s.ID_SALA}
                  className={
                    s.ID_SALA === selectedSala?.ID_SALA ? 'table-success' : ''
                  }
                  onClick={() => onSelectSala(s)}
                  style={{ cursor: 'pointer' }}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => e.key === 'Enter' && onSelectSala(s)}
                  aria-pressed={s.ID_SALA === selectedSala?.ID_SALA}
                >
                  <td title={s.COD_SALA}>{s.COD_SALA}</td>
                  <td title={s.NOMBRE_SALA}>{s.NOMBRE_SALA}</td>
                  <td title={s.NOMBRE_EDIFICIO}>{s.NOMBRE_EDIFICIO}</td>
                  <td className="text-center">
                    <FaArrowCircleRight
                      className={`icono ${
                        s.ID_SALA === selectedSala?.ID_SALA
                          ? 'text-white'
                          : 'text-primary'
                      }`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : noHayResultadosDeBusqueda ? (
          <div className="text-center p-3 text-muted fst-italic">
            No se encontraron salas con "{searchTerm}".
          </div>
        ) : listaInicialVacia ? (
          <div className="text-center p-3 text-muted fst-italic">
            No hay salas disponibles.
          </div>
        ) : (
          <div className="text-center p-3 text-muted fst-italic">
            No hay salas para mostrar.
          </div>
        )}
      </div>
    </div>
  );
}
