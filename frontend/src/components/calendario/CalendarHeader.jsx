import React from 'react';

export default function CalendarHeader({ fechas }) {
  if (!fechas || fechas.length === 0) {
    return (
      <thead>
        <tr>
          <th className="orden-col-header">Orden</th>
          <th className="horario-col-header">Horario</th>
          {/* Podrías poner placeholders si las fechas no cargan */}
          <th>Lun</th>
          <th>Mar</th>
          <th>Mié</th>
          <th>Jue</th>
          <th>Vie</th>
          <th>Sáb</th>
          <th>Dom</th>
        </tr>
      </thead>
    );
  }

  return (
    <thead>
      <tr>
        <th className="orden-col-header">Orden</th>
        <th className="horario-col-header">Horario</th>
        {fechas.map(({ fecha, diaNumero, diaNombre, esHoy }) => (
          <th key={fecha} className={esHoy ? 'hoy' : ''}>
            <div>{diaNombre.substring(0, 3)}</div> {/* ej. Lun, Mar */}
            <div>{diaNumero}</div>
          </th>
        ))}
      </tr>
    </thead>
  );
}
