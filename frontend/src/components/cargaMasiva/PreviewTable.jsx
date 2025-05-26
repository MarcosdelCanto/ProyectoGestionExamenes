import React from 'react';
import { Table } from 'react-bootstrap';

const DEFAULT_MAX_PREVIEW_ROWS = 5;

function PreviewTable({ jsonData, maxRows = DEFAULT_MAX_PREVIEW_ROWS }) {
  if (!jsonData || jsonData.length === 0) {
    return <p>No hay datos para mostrar en la vista previa.</p>;
  }

  const headers = jsonData[0];
  const dataRows = jsonData.slice(1);
  const rowsToDisplay = dataRows.slice(0, maxRows);
  const remainingRows = dataRows.length - rowsToDisplay.length;

  return (
    <div>
      <h5>
        Vista Previa de Datos Extraídos (primeras {rowsToDisplay.length} filas
        de datos):
      </h5>
      <Table striped bordered hover responsive size="sm">
        {headers && headers.length > 0 && (
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th key={`header-${index}`}>{header}</th>
              ))}
            </tr>
          </thead>
        )}
        {rowsToDisplay.length > 0 && (
          <tbody>
            {rowsToDisplay.map((row, rowIndex) => (
              <tr key={`row-${rowIndex}`}>
                {row.map((cell, cellIndex) => (
                  <td key={`cell-${rowIndex}-${cellIndex}`}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        )}
      </Table>
      {remainingRows > 0 && (
        <p className="text-muted small">
          ... y {remainingRows} filas de datos más.
        </p>
      )}
    </div>
  );
}

export default PreviewTable;
