import React, { useState } from 'react';
import * as XLSX from 'xlsx';

export default function ExcelUpload({ onImport }) {
  const [file, setFile] = useState(null);

  const submit = (e) => {
    e.preventDefault();
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      // convierte hoja a JSON; defval:'' para no dejar undefined
      const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      onImport(jsonData);
      setFile(null);
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <form className="d-flex" onSubmit={submit}>
      <input
        type="file"
        accept=".xlsx,.xls"
        className="form-control form-control-sm me-2"
        onChange={(e) => setFile(e.target.files[0] || null)}
      />
      <button
        className="btn btn-sm btn-outline-primary"
        type="submit"
        disabled={!file}
      >
        Importar Excel
      </button>
    </form>
  );
}
