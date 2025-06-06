import React from 'react';
import CalendarHeader from './CalendarHeader';
import CalendarCell from './CalendarCell';
import './styles/Calendar.css';

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
  onDeleteReserva,
  onCheckConflict,
  draggedExamen = null,
  dropTargetCell = null,
}) {
  if (!modulos || modulos.length === 0) {
    return <p className="aviso-seleccion">No hay módulos para mostrar.</p>;
  }

  // AGREGAR: Set para rastrear exámenes ya renderizados por día
  const examenesRenderizadosPorDia = new Map();

  // MEJORAR: función auxiliar para determinar si una celda debe renderizar un examen
  const shouldRenderExamen = (fecha, modulo, examenAsignado) => {
    if (!examenAsignado) return false;

    const esModuloInicial = examenAsignado.moduloInicial === modulo.ORDEN;

    if (!esModuloInicial) return false;

    const claveExamen = `${fecha}-${examenAsignado.examen.ID_EXAMEN}-${examenAsignado.moduloInicial}`;

    if (examenesRenderizadosPorDia.has(claveExamen)) {
      // console.log('DUPLICADO DETECTADO Y EVITADO:', claveExamen);
      return false;
    }

    examenesRenderizadosPorDia.set(claveExamen, true);
    // console.log('RENDERIZANDO EXAMEN:', claveExamen);

    return true;
  };

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
              {fechas.map(({ fecha, esSeleccionado }) => {
                const examenAsignado = obtenerExamenParaCelda(fecha, mod.ORDEN);
                const renderExamen = shouldRenderExamen(
                  fecha,
                  mod,
                  examenAsignado
                );

                const esDropTarget =
                  dropTargetCell &&
                  dropTargetCell.fecha === fecha &&
                  dropTargetCell.modulo.ORDEN === mod.ORDEN;

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
                    examenAsignado={renderExamen ? examenAsignado : null} // Solo si debe renderizar
                    isPartOfExamen={examenAsignado !== null} // Siempre que haya examen asignado
                    onModulosChange={onModulosChange}
                    onRemoveExamen={onRemoveExamen}
                    onDeleteReserva={onDeleteReserva}
                    onCheckConflict={onCheckConflict}
                    moduloscount={examenAsignado?.moduloscount || 1}
                    esDiaSeleccionado={esSeleccionado}
                    draggedExamen={draggedExamen}
                    esDropTarget={esDropTarget}
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
