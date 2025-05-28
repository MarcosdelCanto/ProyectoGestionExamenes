import React from 'react';
import { FaArrowCircleRight } from 'react-icons/fa';

export default function SalaSelector({
  salas,
  searchTerm,
  onSearch,
  filteredSalas,
  selectedSala,
  onSelectSala,
}) {
  return (
    <div className="selector-panel">
      <h2>Seleccionar Sala</h2>
      <input
        type="search"
        placeholder="Buscar Sala…"
        value={searchTerm}
        onChange={onSearch}
      />
      <div className="list-container">
        <table className="tabla-seleccion">
          <thead>
            <tr>
              <th>Cód.</th>
              <th>Nombre</th>
              <th>Edificio</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredSalas.map((s) => (
              <tr
                key={s.ID_SALA}
                className={
                  s.ID_SALA === selectedSala?.ID_SALA ? 'fila-seleccionada' : ''
                }
                onClick={() => onSelectSala(s)}
              >
                <td>{s.COD_SALA}</td>
                <td>{s.NOMBRE_SALA}</td>
                <td>{s.EDIFICIO?.NOMBRE_EDIFICIO}</td>
                <td>
                  <FaArrowCircleRight className="icono" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
