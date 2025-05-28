import React, { useState } from 'react';
import Papa from 'papaparse';

export default function CSVUpload({ onImport }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const handlePreview = () => {
    if (!file) return;
    Papa.parse(file, {
      header: true,
      complete: (results) => setPreview(results.data.slice(0, 5)), // Muestra solo las primeras 5 filas
    });
  };

  const submit = (e) => {
    e.preventDefault();
    if (!file) return;
    onImport(file);
    setFile(null);
    setPreview(null);
  };

  return (
    <form className="d-flex align-items-center gap-2" onSubmit={submit}>
      <input
        type="file"
        accept=".csv"
        className="form-control form-control-sm csv-input"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button
        className="btn btn-sm btn-outline-primary"
        type="button"
        onClick={handlePreview}
      >
        Previsualizar
      </button>
      <button className="btn btn-sm btn-outline-success" type="submit">
        Importar CSV
      </button>
      {preview && (
        <div className="mt-3 w-100">
          <table className="table table-bordered table-sm">
            <thead>
              <tr>
                {Object.keys(preview[0] || {}).map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.map((row, idx) => (
                <tr key={idx}>
                  {Object.values(row).map((val, i) => (
                    <td key={i}>{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </form>
  );
}
