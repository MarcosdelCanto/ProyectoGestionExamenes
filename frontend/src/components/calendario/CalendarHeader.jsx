import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import './styles/Calendar.css';

export default function CalendarHeader({ fechas, feriadosData = [] }) {
  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <thead>
      <tr>
        <th className="orden-col calendar-table">N°</th>
        <th className="horario-col calendar-table">Horario</th>
        {fechas.map(
          ({ fecha, diaNombre, diaNumero, esHoy, esSeleccionado }) => {
            const feriado = feriadosData.find((f) => f.FECHA_FERIADO === fecha);
            return (
              <th
                key={fecha}
                className={`calendar-header-cell ${esHoy ? 'hoy' : ''} ${esSeleccionado ? 'seleccionado' : ''}`}
                title={feriado ? feriado.NOMBRE_FERIADO : undefined}
              >
                <div className="calendar-header-day">
                  <div className="day-name">{diaNombre}</div>
                  <div className="day-number">{diaNumero}</div>
                  {feriado && (
                    <div
                      style={{
                        fontSize: '0.6rem',
                        color:
                          feriado.TIPO_BLOQUEO === 'COMPLETO'
                            ? '#842029'
                            : '#664d03',
                        fontWeight: 600,
                        lineHeight: 1.2,
                        marginTop: 2,
                      }}
                    >
                      <i className="bi bi-calendar-x me-1" />
                      {feriado.NOMBRE_FERIADO.length > 18
                        ? feriado.NOMBRE_FERIADO.slice(0, 16) + '…'
                        : feriado.NOMBRE_FERIADO}
                    </div>
                  )}
                </div>
              </th>
            );
          }
        )}
      </tr>
    </thead>
  );
}
