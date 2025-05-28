import React from 'react';
import CalendarHeader from './CalendarHeader';
import CalendarCell from './CalendarCell';

export default function CalendarGrid({
  fechas,
  modulos,
  selectedSala,
  selectedExam,
  reservas,
  modulosSeleccionados,
  onSelectModulo,
}) {
  return (
    <div className="table-wrapper">
      <table className="calendar-table">
        <CalendarHeader fechas={fechas} />
        <tbody>
          {modulos.map((mod) => (
            <tr key={mod.ID_MODULO}>
              <td className="orden-col">{mod.ORDEN}</td>
              <td className="horario-col">
                {mod.INICIO_MODULO} - {mod.FIN_MODULO}
              </td>
              {fechas.map(({ fecha }) => (
                <CalendarCell
                  key={`${fecha}-${mod.ID_MODULO}`}
                  fecha={fecha}
                  modulo={mod}
                  selectedSala={selectedSala}
                  selectedExam={selectedExam}
                  reservas={reservas}
                  modulosSeleccionados={modulosSeleccionados}
                  onSelectModulo={onSelectModulo}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
