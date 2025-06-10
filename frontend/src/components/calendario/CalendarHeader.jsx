import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import './styles/Calendar.css';

export default function CalendarHeader({ fechas }) {
  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <thead>
      <tr>
        <th className="orden-col calendar-table">N°</th>
        <th className="horario-col calendar-table">Horario</th>
        {fechas.map(
          ({ fecha, diaNombre, diaNumero, esHoy, esSeleccionado }) => (
            <th
              key={fecha}
              className={`calendar-header-cell ${esHoy ? 'hoy' : ''} ${esSeleccionado ? 'seleccionado' : ''}`}
            >
              <div className="calendar-header-day">
                <div className="day-name">{diaNombre}</div>
                <div className="day-number">{diaNumero}</div>
              </div>
            </th>
          )
        )}
      </tr>
    </thead>
  );
}
