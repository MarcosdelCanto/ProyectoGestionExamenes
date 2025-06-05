import React from 'react';
import { FaArrowCircleRight, FaSearch, FaFilter } from 'react-icons/fa'; // Importar FaFilter
import './styles/SalaSelector.css';

export default function SalaSelector({
  salas, // Lista original de salas, puede ser útil para la lógica de 'listaInicialVacia'
  searchTerm, // Término de búsqueda del padre (AgendaSemanal)
  onSearch, // Función de búsqueda del padre (AgendaSemanal)
  filteredSalas, // La lista ya filtrada por el padre
  selectedSala,
  onSelectSala,
  isLoadingSalas,
  onOpenFilterModal, // Prop para abrir el modal de filtros
}) {
  const tieneSalasParaMostrar = filteredSalas && filteredSalas.length > 0;
  const noHayResultadosDeBusqueda =
    searchTerm && !tieneSalasParaMostrar && !isLoadingSalas;
  const listaInicialVacia =
    !searchTerm &&
    !tieneSalasParaMostrar &&
    !isLoadingSalas &&
    salas &&
    salas.length === 0;

  // Ajustar para el nuevo diseño simplificado

  return (
    <div className="sala-selector-container">
      <div className="sala-search-container">
        <div className="input-group input-group-sm">
          <span className="input-group-text bg-light">
            <FaSearch />
          </span>
          <input
            type="search"
            className="form-control"
            placeholder="Buscar Sala..."
            value={searchTerm}
            onChange={onSearch}
          />
        </div>
        <button
          className="btn btn-light btn-sm"
          onClick={onOpenFilterModal}
          title="Más filtros"
        >
          <FaFilter />
        </button>
      </div>

      <div className="sala-list">
        {isLoadingSalas ? (
          <div className="p-3 text-center text-muted">Cargando salas...</div>
        ) : tieneSalasParaMostrar ? (
          <table
            className="table table-sm tabla-seleccion m-0"
            //style={{ fontSize: '0.6rem' }} // Eliminado maxWidth: '80%' para que use el ancho disponible
          >
            <thead
              className="table-light sticky-top p-0"
              style={{ fontSize: '0.75rem' }}
            >
              <tr>
                <th scope="col" style={{ width: '60%', height: '10px' }}>
                  Nombre
                </th>
                <th
                  scope="col"
                  style={{ width: '10%', fontSize: '0.9rem' }}
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
                  style={{
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    marginLeft: '0.2rem',
                    marginRight: '0.2rem',
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => e.key === 'Enter' && onSelectSala(s)}
                  aria-pressed={s.ID_SALA === selectedSala?.ID_SALA}
                >
                  <td className="text p-0" title={s.NOMBRE_SALA}>
                    {s.NOMBRE_SALA}
                  </td>
                  <td className="text-center m-0 p-0">
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
