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
              {fechas.map(({ fecha }) => {
                const examenAsignado = obtenerExamenParaCelda(fecha, mod.ORDEN);
                const renderExamen = shouldRenderExamen(
                  fecha,
                  mod,
                  examenAsignado
                );

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
