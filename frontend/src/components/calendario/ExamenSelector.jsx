import React from 'react';
import { FaArrowCircleRight, FaCircle } from 'react-icons/fa';

export default function ExamenSelector({
  examenes,
  searchTerm,
  onSearch,
  filteredExamenes,
  selectedExam,
  onSelectExam,
}) {
  return (
    <div className="selector-panel">
      <h2>Seleccionar Examen</h2>
      <input
        type="search"
        placeholder="Buscar Examen…"
        value={searchTerm}
        onChange={onSearch}
      />
      <div className="list-container">
        <table className="tabla-seleccion">
          <thead>
            <tr>
              <th>Sección</th>
              <th>Asignatura</th>
              <th>Mód.</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredExamenes.map((ex) => (
              <tr
                key={ex.ID_EXAMEN}
                className={
                  ex.ID_EXAMEN === selectedExam?.ID_EXAMEN
                    ? 'fila-seleccionada'
                    : ''
                }
                onClick={() => onSelectExam(ex)}
              >
                <td>{ex.SECCION?.NOMBRE_SECCION}</td>
                <td>{ex.ASIGNATURA?.NOMBRE_ASIGNATURA}</td>
                <td>{ex.CANTIDAD_MODULOS_EXAMEN}</td>
                <td>
                  {ex.ESTADO_ID_ESTADO === 3 ? (
                    <FaCircle className="icono-reservado" />
                  ) : (
                    <FaArrowCircleRight className="icono" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
