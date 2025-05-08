import React, { useState } from 'react';

export default function CSVUpload({ onImport }) {
  const [file, setFile] = useState(null);

  const submit = (e) => {
    e.preventDefault();
    if (!file) return;
    onImport(file);
    setFile(null);
  };

  return (
    <form className="d-flex" onSubmit={submit}>
      <input
        type="file"
        accept=".csv"
        className="form-control form-control-sm me-2"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button className="btn btn-sm btn-outline-primary" type="submit">
        Importar CSV
      </button>
    </form>
  );
}
