import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import './CalendarioStyles.css';

export default function CalendarHeader({ fechas }) {
  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <thead>
      <tr>
        <th className="orden-col">N°</th>
        <th className="horario-col">Horario</th>
        {fechas.map(({ fecha, diaNombre, diaNumero, esHoy }) => (
          <th
            key={fecha}
            className={`calendar-header-cell ${esHoy ? 'today' : ''}`}
          >
            <div className="calendar-header-day">
              <span className="day-name">
                {diaNombre.charAt(0).toUpperCase() + diaNombre.slice(1, 3)}
              </span>
              <span className="day-number">{diaNumero}</span>
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );
}
