import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import AgendaSemanal from '../components/AgendaSemanal';
import ListaExamenesExternos from '../components/ListaExamenesExternos';

export default function CalendarioPage() {
  const [salas, setSalas] = useState([]);
  const [salaSeleccionada, setSalaSeleccionada] = useState('');
  const [loading, setLoading] = useState(true);
  const [examenes, setExamenes] = useState([]); // <-- Agrega este estado

  useEffect(() => {
    // Cargar las salas desde la API
    fetch('http://localhost:3000/api/sala')
      .then((res) => res.json())
      .then((data) => {
        setSalas(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Cargar los exámenes desde la API
    fetch('http://localhost:3000/api/examen')
      .then((res) => res.json())
      .then((data) => {
        setExamenes(data);
      })
      .catch(() => setExamenes([]));
  }, []);

  return (
    <Layout>
      <style>{`.fc .fc-timegrid-slot { height: 30px !important; }`}</style>
      <div className="container mt-4">
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '2rem',
          }}
        >
          <div style={{ flex: 1 }}>
            {salaSeleccionada && <AgendaSemanal salaId={salaSeleccionada} />}
          </div>
          <div style={{ minWidth: '260px' }}>
            {loading ? (
              <p>Cargando salas...</p>
            ) : (
              <div className="mb-3">
                <label className="form-label">Selecciona una sala:</label>
                <select
                  className="form-select"
                  value={salaSeleccionada}
                  onChange={(e) => setSalaSeleccionada(e.target.value)}
                >
                  <option value="">-- Selecciona --</option>
                  {salas.map((sala) => (
                    <option key={sala.ID_SALA} value={sala.ID_SALA}>
                      {sala.NOMBRE_SALA}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <ListaExamenesExternos examenes={examenes} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
