// src/components/reportes/ReportTable.jsx
import React from 'react';

const ReportTable = ({
  isLoading,
  error,
  headers, // Esta prop AHORA contiene SOLO las cabeceras visibles
  data,
  mapper, // La función que transforma un item de 'data'
}) => {
  if (isLoading) {
    return <p className="text-center">Cargando reporte...</p>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (!data || data.length === 0) {
    return (
      <p className="text-center">
        No hay datos para mostrar con los filtros actuales o la configuración de
        columnas.
      </p>
    );
  }

  if (!headers || headers.length === 0) {
    return (
      <p className="text-center">
        No hay columnas seleccionadas para mostrar. Por favor, configure las
        columnas visibles.
      </p>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-striped table-hover table-bordered">
        <thead>
          <tr>
            {/* Renderizamos solo las cabeceras que están en la prop 'headers' (las visibles) */}
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => {
            // Aplicamos el mapper para obtener un objeto con todas las columnas posibles
            const mappedItem = mapper(item);
            // Usamos el 'ID_RESERVA' o 'ID_EXAMEN' o 'ID_USUARIO' si existen, sino el índice como clave
            const rowKey =
              item.ID_RESERVA || item.ID_EXAMEN || item.ID_USUARIO || index;

            return (
              <tr key={rowKey}>
                {/* Iteramos sobre las 'headers' (que son solo las visibles)
                  y usamos cada 'header' como clave para acceder al valor correcto en 'mappedItem'.
                */}
                {headers.map((headerKey) => (
                  <td key={`${rowKey}-${headerKey}`}>
                    {mappedItem[headerKey]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ReportTable;
