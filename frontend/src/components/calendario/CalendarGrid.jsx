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
  onCheckConflict,
  // Nuevas props opcionales para drag & drop
  draggedExamen = null,
  dropTargetCell = null,
}) {
  if (!modulos || modulos.length === 0) {
    return <p className="aviso-seleccion">No hay módulos para mostrar.</p>;
  }

  // funcion auxiliar para determinar si una celda debe renderizar un examen
  const shouldRenderExamen = (fecha, modulo, examenAsignado) => {
    if (!examenAsignado) return false;

    return examenAsignado.moduloInicial === modulo.ORDEN;
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

                // Determinar si esta celda es el target actual del drag
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
                    examenAsignado={renderExamen ? examenAsignado : null}
                    isPartOfExamen={examenAsignado !== null}
                    onModulosChange={onModulosChange}
                    onRemoveExamen={onRemoveExamen}
                    onCheckConflict={onCheckConflict}
                    modulosCount={examenAsignado?.modulosCount || 1}
                    esDiaSeleccionado={esSeleccionado}
                    // Nuevas props para drag & drop
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
