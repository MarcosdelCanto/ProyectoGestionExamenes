import React from 'react'; // useState y useMemo ya no son necesarios aquí
import { FaArrowCircleRight, FaSearch, FaFilter } from 'react-icons/fa'; // Importar FaFilter

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

  return (
    <div
      className="sala-selector-panel"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Contenedor para el buscador y el botón de filtro */}
      <div className="d-flex mb-2 gap-2 align-items-center">
        <div className="input-group input-group-sm flex-grow-1">
          <span className="input-group-text bg-light">
            <FaSearch />
          </span>
          <input
            type="search"
            className="form-control"
            placeholder="Buscar Sala por Cód, Nombre, Edificio..."
            value={searchTerm} // Usar el searchTerm del padre
            onChange={onSearch} // Usar onSearch del padre
            aria-label="Buscar sala"
          />
        </div>
        <button
          className="btn btn-light btn-sm"
          onClick={onOpenFilterModal} // Llamar a la función para abrir el modal
          title="Filtrar salas"
        >
          <FaFilter />
        </button>
      </div>

      <div
        className="table-responsive"
        style={{
          maxHeight: '120px', // Ajustado para mostrar ~4-5 filas antes de necesitar scroll
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
