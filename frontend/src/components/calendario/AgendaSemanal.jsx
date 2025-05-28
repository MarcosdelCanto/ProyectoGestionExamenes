import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { format, startOfWeek, addDays, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import SalaSelector from './SalaSelector';
import ExamenSelector from './ExamenSelector';
import CalendarGrid from './CalendarGrid';

// Obtiene los 6 días de la semana (lunes a sábado)
function getWeekDates(baseDate) {
  const start = startOfWeek(baseDate, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end: addDays(start, 5) }).map((d) => ({
    dia: format(d, 'EEEE', { locale: es }).replace(/^./, (c) =>
      c.toUpperCase()
    ),
    fecha: format(d, 'yyyy-MM-dd'),
    fechaMostrar: format(d, 'dd/MM/yyyy'),
  }));
}

export default function AgendaSemanal() {
  const [salas, setSalas] = useState([]);
  const [examenes, setExamenes] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [selectedSala, setSelectedSala] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [modulosSeleccionados, setModulosSeleccionados] = useState([]);
  const [fechaBase, setFechaBase] = useState(new Date());
  const [searchSala, setSearchSala] = useState('');
  const [searchExamen, setSearchExamen] = useState('');

  // Carga inicial de datos
  useEffect(() => {
    async function loadData() {
      try {
        const [salasRes, examRes, modRes, resRes] = await Promise.all([
          fetch('/api/salas'),
          fetch('/api/examenes'),
          fetch('/api/modulos'),
          fetch('/api/reservas'),
        ]);
        setSalas(await salasRes.json());
        setExamenes(await examRes.json());
        setModulos(await modRes.json());
        setReservas(await resRes.json());
      } catch (err) {
        console.error('Error cargando datos:', err);
      }
    }
    loadData();
  }, []);

  // Computar fechas de la semana
  const fechas = useMemo(() => getWeekDates(fechaBase), [fechaBase]);

  // Filtrado de salas
  const filteredSalas = useMemo(() => {
    const term = searchSala.toLowerCase();
    return salas.filter(
      (s) =>
        (s.COD_SALA?.toLowerCase() ?? '').includes(term) ||
        (s.NOMBRE_SALA?.toLowerCase() ?? '').includes(term) ||
        (s.EDIFICIO?.NOMBRE_EDIFICIO?.toLowerCase() ?? '').includes(term)
    );
  }, [salas, searchSala]);

  // Filtrado de exámenes
  const filteredExamenes = useMemo(() => {
    const term = searchExamen.toLowerCase();
    return examenes.filter(
      (ex) =>
        ((ex.SECCION?.NOMBRE_SECCION?.toLowerCase() ?? '').includes(term) ||
          (ex.ASIGNATURA?.NOMBRE_ASIGNATURA?.toLowerCase() ?? '').includes(
            term
          )) &&
        ex.ESTADO_ID_ESTADO !== 3
    );
  }, [examenes, searchExamen]);

  // Selección de sala
  const handleSelectSala = useCallback((sala) => {
    setSelectedSala(sala);
    setModulosSeleccionados([]);
  }, []);

  // Selección de examen
  const handleSelectExam = useCallback((exam) => {
    setSelectedExam((prev) =>
      prev?.ID_EXAMEN === exam.ID_EXAMEN ? null : exam
    );
    setModulosSeleccionados([]);
  }, []);

  // Selección de módulos en el calendario
  const handleSelectModulo = useCallback(
    (fecha, orden) => {
      if (!selectedExam) {
        alert('Selecciona un examen primero');
        return;
      }
      setModulosSeleccionados((prev) => {
        if (prev.length && prev[0].fecha !== fecha) {
          alert('Módulos deben estar en el mismo día');
          return [{ fecha, numero: orden }];
        }
        const exists = prev.some((m) => m.numero === orden);
        if (exists) return prev.filter((m) => m.numero !== orden);
        if (prev.length >= selectedExam.CANTIDAD_MODULOS_EXAMEN) {
          alert(
            `Este examen requiere ${selectedExam.CANTIDAD_MODULOS_EXAMEN} módulos`
          );
          return prev;
        }
        const nuevos = [...prev, { fecha, numero: orden }].sort(
          (a, b) => a.numero - b.numero
        );
        for (let i = 0; i < nuevos.length - 1; i++) {
          if (nuevos[i + 1].numero !== nuevos[i].numero + 1) {
            alert('Módulos no consecutivos');
            return [{ fecha, numero: orden }];
          }
        }
        return nuevos;
      });
    },
    [selectedExam]
  );

  // Construir payload para reserva
  const payloadForReserva = useCallback(() => {
    if (!selectedSala || !selectedExam || !modulosSeleccionados.length) {
      alert('Sala, examen y módulos son obligatorios');
      return null;
    }
    return {
      FECHA_RESERVA: modulosSeleccionados[0].fecha,
      SALA_ID_SALA: selectedSala.ID_SALA,
      EXAMEN_ID_EXAMEN: selectedExam.ID_EXAMEN,
      Modulos: modulosSeleccionados.map((m) => ({
        MODULO_ID_MODULO: modulos.find((x) => x.ORDEN === m.numero)?.ID_MODULO,
      })),
    };
  }, [selectedSala, selectedExam, modulosSeleccionados, modulos]);

  // Confirmar reserva al backend
  const handleConfirmReserva = useCallback(async () => {
    const payload = payloadForReserva();
    if (!payload) return;
    try {
      const res = await fetch('/api/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      const nueva = await res.json();
      setReservas((prev) => [...prev, nueva]);
      setSelectedExam(null);
      setModulosSeleccionados([]);
      alert('Reserva creada exitosamente');
    } catch (err) {
      console.error(err);
      alert('Error al crear reserva');
    }
  }, [payloadForReserva]);

  return (
    <div className="agenda-container">
      <aside className="container-lateral">
        <SalaSelector
          salas={salas}
          searchTerm={searchSala}
          onSearch={(e) => setSearchSala(e.target.value)}
          filteredSalas={filteredSalas}
          selectedSala={selectedSala}
          onSelectSala={handleSelectSala}
        />
        <ExamenSelector
          examenes={examenes}
          searchTerm={searchExamen}
          onSearch={(e) => setSearchExamen(e.target.value)}
          filteredExamenes={filteredExamenes}
          selectedExam={selectedExam}
          onSelectExam={handleSelectExam}
        />
      </aside>
      <main className="details-section">
        {selectedSala ? (
          <>
            <CalendarGrid
              fechas={fechas}
              modulos={modulos}
              selectedSala={selectedSala}
              selectedExam={selectedExam}
              reservas={reservas}
              modulosSeleccionados={modulosSeleccionados}
              onSelectModulo={handleSelectModulo}
            />
            {selectedExam &&
              modulosSeleccionados.length ===
                selectedExam.CANTIDAD_MODULOS_EXAMEN && (
                <button
                  onClick={handleConfirmReserva}
                  className="btn btn-primary mt-3"
                >
                  Confirmar Reserva
                </button>
              )}
          </>
        ) : (
          <p className="aviso-seleccion">
            Selecciona una sala para ver disponibilidad
          </p>
        )}
      </main>
    </div>
  );
}
