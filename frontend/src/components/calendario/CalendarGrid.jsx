import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
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
  // Filtrar para excluir el domingo (último día de la semana)
  const fechasSinDomingo = fechas.filter(
    (fecha) =>
      format(new Date(fecha.fecha), 'EEEE', { locale: es }) !== 'domingo'
  );

  return (
    <div className="table-wrapper">
      <table className="calendar-table">
        <CalendarHeader fechas={fechasSinDomingo} />
        <tbody>
          {modulos.map((mod) => (
            <tr key={mod.ID_MODULO}>
              <td className="orden-col">{mod.ORDEN}</td>
              <td className="horario-col">
                {mod.INICIO_MODULO} - {mod.FIN_MODULO}
              </td>
              {fechasSinDomingo.map(
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
