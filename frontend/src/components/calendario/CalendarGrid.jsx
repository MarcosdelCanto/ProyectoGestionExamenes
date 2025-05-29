import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import CalendarCell from './CalendarCell';
import CalendarHeader from './CalendarHeader';
import './CalendarioStyles.css'; // Importar los estilos

export default function CalendarGrid({
  fechas,
  modulos,
  selectedSala,
  selectedExam,
  reservas,
  modulosSeleccionados,
  onSelectModulo,
}) {
  if (!modulos || modulos.length === 0) {
    return <p className="aviso-seleccion">No hay módulos para mostrar.</p>;
  }

  // Filtrar fechas si es necesario (por ejemplo, para excluir domingos)
  // const fechasFiltradas = fechas.filter(fecha => {...});

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
