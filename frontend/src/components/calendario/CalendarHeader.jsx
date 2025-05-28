import React from 'react';

export default function CalendarHeader({ fechas }) {
  return (
    <thead>
      <tr>
        <th className="orden-col">Mód</th>
        <th className="horario-col">Horario</th>
        {fechas.map(({ dia, fechaMostrar }) => (
          <th key={fechaMostrar}>
            {dia}
            <br />
            {fechaMostrar}
          </th>
        ))}
      </tr>
    </thead>
  );
}
