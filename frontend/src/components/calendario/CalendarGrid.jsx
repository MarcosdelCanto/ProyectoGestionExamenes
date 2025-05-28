import React from 'react';
import CalendarCell from './CalendarCell';
import CalendarHeader from './CalendarHeader'; // Asegúrate de importar CalendarHeader

export default function CalendarGrid({
  fechas, // Esta prop es crucial para CalendarHeader
  modulos,
  selectedSala,
  selectedExam,
  reservas,
  modulosSeleccionados,
  onSelectModulo,
}) {
  if (!modulos || modulos.length === 0) {
    return <p>No hay módulos para mostrar.</p>;
  }
  if (!fechas || fechas.length === 0) {
    // Podrías tener un estado de carga específico para las fechas si vienen de una API
    // o si getWeekDates pudiera fallar, aunque es una función síncrona.
    return <p>Cargando fechas...</p>;
  }

  return (
    <div className="table-wrapper">
      <table className="calendar-table">
        <CalendarHeader fechas={fechas} /> {/* Pasa la prop fechas aquí */}
        <tbody>
          {modulos.map((mod) => (
            <tr key={mod.ID_MODULO}>
              <td className="orden-col">{mod.ORDEN}</td>
              <td className="horario-col">
                {mod.INICIO_MODULO} - {mod.FIN_MODULO}
              </td>
              {fechas.map(
                (
                  { fecha } // Aquí usas 'fecha' del objeto destructurado
                ) => (
                  <CalendarCell
                    key={`${fecha}-${mod.ID_MODULO}`}
                    fecha={fecha} // Pasas la fecha string 'yyyy-MM-dd'
                    modulo={mod}
                    selectedSala={selectedSala}
                    selectedExam={selectedExam}
                    reservas={reservas}
                    modulosSeleccionados={modulosSeleccionados}
                    onSelectModulo={onSelectModulo}
                  />
                )
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
