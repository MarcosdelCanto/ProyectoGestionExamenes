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
  obtenerExamenParaCelda,
  onModulosChange,
  onRemoveExamen,
}) {
  if (!modulos || modulos.length === 0) {
    return <p className="aviso-seleccion">No hay módulos para mostrar.</p>;
  }

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
              {fechas.map(({ fecha }) => {
                const examenAsignado = obtenerExamenParaCelda(fecha, mod.ORDEN);

                return (
                  <CalendarCell
                    key={`${fecha}-${mod.ID_MODULO}`}
                    fecha={fecha}
                    modulo={mod}
                    selectedSala={selectedSala}
                    selectedExam={selectedExam}
                    reservas={reservas}
                    modulosSeleccionados={modulosSeleccionados}
                    onSelectModulo={onSelectModulo}
                    examenAsignado={examenAsignado}
                    onModulosChange={onModulosChange}
                    onRemoveExamen={onRemoveExamen}
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
