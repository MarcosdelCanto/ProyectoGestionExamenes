import React from 'react';
import { Table } from 'react-bootstrap';

function CarreraList({
  carreras,
  selectedCarreras, // Cambiado de selectedCarrera a selectedCarreras (array)
  onToggleCarreraSelection, // Nueva función para manejar la selección individual
  onToggleSelectAll, // Nueva función para seleccionar/deseleccionar todo
  loading,
}) {
  if (loading) {
    return <div>Cargando carreras...</div>;
  }

  if (!carreras || carreras.length === 0) {
    return <div>No hay carreras para mostrar.</div>;
  }

  return (
    <div className="table-responsive border mb-3">
      {' '}
      {/* Eliminado maxHeight y overflowY de un estilo inline si existiera, añadido mb-3 */}
      <Table bordered hover responsive="sm" className="mb-0">
        {' '}
        {/* mb-0 en la tabla si el div wrapper maneja el margen inferior */}
        <thead className="table-light">
          <tr>
            <th style={{ width: '5%' }} className="text-center align-middle">
              <input
                type="checkbox"
                className="form-check-input"
                checked={
                  carreras.length > 0 &&
                  selectedCarreras.length === carreras.length
                }
                onChange={onToggleSelectAll}
                disabled={carreras.length === 0}
                aria-label="Seleccionar todas las carreras"
              />
            </th>
            <th className="align-middle">ID</th>
            <th className="align-middle">Código</th>
            <th className="align-middle">Nombre</th>
            <th className="align-middle">Escuela</th>
            {/* Agrega más encabezados si es necesario */}
          </tr>
        </thead>
        <tbody>
          {carreras.map((c) => (
            <tr
              key={`carrera-${c.ID_CARRERA}`}
              onClick={() => onToggleCarreraSelection(c)}
              className={`align-middle ${
                selectedCarreras.find((sc) => sc.ID_CARRERA === c.ID_CARRERA)
                  ? 'table-primary'
                  : ''
              }`}
              style={{ cursor: 'pointer' }}
            >
              <td className="text-center align-middle">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={
                    !!selectedCarreras.find(
                      (sc) => sc.ID_CARRERA === c.ID_CARRERA
                    )
                  }
                  onChange={(e) => {
                    e.stopPropagation();
                    onToggleCarreraSelection(c);
                  }}
                  aria-label={`Seleccionar carrera ${c.NOMBRE_CARRERA || c.ID_CARRERA}`}
                />
              </td>
              <td>{c.ID_CARRERA}</td>
              <td>{c.CODIGO_CARRERA}</td>
              <td>{c.NOMBRE_CARRERA}</td>
              <td>{c.NOMBRE_ESCUELA || c.ESCUELA_ID_ESCUELA}</td>
              {/* Muestra nombre de escuela si está disponible */}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default CarreraList;
