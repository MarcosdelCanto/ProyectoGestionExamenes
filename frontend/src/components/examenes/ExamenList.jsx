// src/components/examenes/ExamenList.jsx
import React from 'react';

function ExamenList({ examenes, selectedExamenId, onSelectExamen, loading }) {
  // Si está cargando y no hay exámenes aún (primera carga), muestra 'Cargando...'
  // Si no está cargando pero no hay exámenes, muestra otro mensaje.
  if (loading && (!examenes || examenes.length === 0)) {
    return <div className="text-center p-3">Cargando exámenes...</div>;
  }

  // Asegurarse de que examenes sea un array antes de mapear
  if (!Array.isArray(examenes) || examenes.length === 0) {
    return (
      <div className="alert alert-info text-center">
        No hay exámenes para mostrar.
      </div>
    );
  }

  return (
    <div
      className="table-responsive border mb-3" // Eliminados maxHeight y overflowY. mb-3 para espaciado.
    >
      <table className="table table-hover table-bordered mb-0">
        <thead className="table-light sticky-top">
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Inscritos</th>
            <th>Tipo Procesamiento</th>
            <th>Plataforma</th>
            <th>Situación Evaluativa</th>
            <th>Módulos</th>
            <th>Sección</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {examenes.map((examen) => (
            <tr
              key={examen.ID_EXAMEN} // Usar ID_EXAMEN directamente
              onClick={() => onSelectExamen(examen.ID_EXAMEN)}
              className={
                examen.ID_EXAMEN === selectedExamenId ? 'table-primary' : ''
              }
              style={{ cursor: 'pointer' }}
            >
              <td>{examen.ID_EXAMEN || 'N/A'}</td>
              <td>{examen.NOMBRE_EXAMEN || 'N/A'}</td>
              <td>{examen.INSCRITOS_EXAMEN || 'N/A'}</td>
              <td>{examen.TIPO_PROCESAMIENTO_EXAMEN || 'N/A'}</td>
              <td>{examen.PLATAFORMA_PROSE_EXAMEN || 'N/A'}</td>
              <td>{examen.SITUACION_EVALUATIVA_EXAMEN || 'N/A'}</td>
              <td>{examen.CANTIDAD_MODULOS_EXAMEN || 'N/A'}</td>
              <td>
                {examen.NOMBRE_SECCION || examen.SECCION_ID_SECCION || 'N/A'}
              </td>
              <td>
                {examen.NOMBRE_ESTADO || 'N/A'}
                {/* <-- CAMBIO AQUÍ: Usar NOMBRE_ESTADO */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ExamenList;
