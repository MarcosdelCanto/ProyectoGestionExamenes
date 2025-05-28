import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  format,
  startOfWeek,
  addDays,
  eachDayOfInterval,
  isValid,
} from 'date-fns'; // Importa isValid
import { es } from 'date-fns/locale';
import SalaSelector from './SalaSelector';
import CalendarGrid from './CalendarGrid';

const getWeekDates = (currentDate) => {
  // Validación para asegurar que currentDate es una fecha válida
  if (!isValid(new Date(currentDate))) {
    console.error('Fecha inválida proporcionada a getWeekDates:', currentDate);
    // Retorna un array vacío o maneja el error como prefieras
    // para evitar que date-fns lance una excepción.
    // Podrías retornar la semana actual como fallback.
    currentDate = new Date();
  }
  const start = startOfWeek(new Date(currentDate), { locale: es });
  return eachDayOfInterval({ start, end: addDays(start, 6) }).map((date) => ({
    fecha: format(date, 'yyyy-MM-dd'), // String 'yyyy-MM-dd'
    diaNumero: format(date, 'd'), // String '1', '2', ...
    diaNombre: format(date, 'EEEE', { locale: es }), // String 'lunes', 'martes', ...
    esHoy: format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'), // Boolean
  }));
};

export default function AgendaSemanal({
  draggedExamen,
  dropTargetCell,
  onDropProcessed,
}) {
  const [salas, setSalas] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [selectedSala, setSelectedSala] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [modulosSeleccionados, setModulosSeleccionados] = useState([]);
  const [fechaBase, setFechaBase] = useState(new Date()); // Asegúrate que fechaBase sea una fecha válida
  const [searchSala, setSearchSala] = useState('');
  const [isLoadingSalas, setIsLoadingSalas] = useState(true);
  const [isLoadingModulos, setIsLoadingModulos] = useState(true);
  const [isLoadingReservas, setIsLoadingReservas] = useState(true);

  useEffect(() => {
    async function loadSalas() {
      setIsLoadingSalas(true);
      try {
        const res = await fetch('/api/salas'); // <-- TU ENDPOINT REAL
        if (!res.ok) throw new Error('Error al cargar salas');
        const data = await res.json();
        setSalas(data);
      } catch (err) {
        console.error('Error cargando salas:', err);
        setSalas([]);
      } finally {
        setIsLoadingSalas(false);
      }
    }
    async function loadModulos() {
      setIsLoadingModulos(true);
      try {
        const res = await fetch('/api/modulos'); // <-- TU ENDPOINT REAL
        if (!res.ok) throw new Error('Error al cargar módulos');
        const data = await res.json();
        setModulos(data);
      } catch (err) {
        console.error('Error cargando módulos:', err);
        setModulos([]);
      } finally {
        setIsLoadingModulos(false);
      }
    }
    async function loadReservas() {
      setIsLoadingReservas(true);
      try {
        const res = await fetch('/api/reservas'); // <-- TU ENDPOINT REAL
        if (!res.ok) throw new Error('Error al cargar reservas');
        const data = await res.json();
        setReservas(data);
      } catch (err) {
        console.error('Error cargando reservas:', err);
        setReservas([]);
      } finally {
        setIsLoadingReservas(false);
      }
    }
    loadSalas();
    loadModulos();
    loadReservas();
  }, []);

  const fechas = useMemo(() => {
    // console.log("Calculando fechas para la semana con fechaBase:", fechaBase);
    const weekDates = getWeekDates(fechaBase);
    // console.log("Fechas generadas:", weekDates);
    return weekDates;
  }, [fechaBase]);

  const filteredSalas = useMemo(() => {
    if (!searchSala) return salas;
    const term = searchSala.toLowerCase();
    return salas.filter(
      (s) =>
        (s.COD_SALA?.toLowerCase() ?? '').includes(term) ||
        (s.NOMBRE_SALA?.toLowerCase() ?? '').includes(term) ||
        (s.EDIFICIO?.NOMBRE_EDIFICIO?.toLowerCase() ?? '').includes(term) // Asegúrate que EDIFICIO exista
    );
  }, [salas, searchSala]);

  useEffect(() => {
    if (draggedExamen && dropTargetCell && selectedSala) {
      const examenParaReservar = draggedExamen;
      const { fecha: fechaDrop, modulo: moduloDrop } = dropTargetCell;

      // Validar que los datos necesarios existen
      if (
        !examenParaReservar ||
        !examenParaReservar.CANTIDAD_MODULOS_EXAMEN ||
        !moduloDrop ||
        typeof moduloDrop.ORDEN === 'undefined'
      ) {
        console.error('Datos incompletos para procesar el drop:', {
          examenParaReservar,
          moduloDrop,
        });
        alert('Error: Datos incompletos del examen o celda de destino.');
        onDropProcessed();
        return;
      }

      setSelectedExam(examenParaReservar);

      let nuevosModulos = [];
      let seleccionExitosa = true;
      for (let i = 0; i < examenParaReservar.CANTIDAD_MODULOS_EXAMEN; i++) {
        const ordenActual = moduloDrop.ORDEN + i;
        const moduloParaSeleccionar = modulos.find(
          (m) => m.ORDEN === ordenActual
        );

        if (!moduloParaSeleccionar) {
          seleccionExitosa = false;
          break;
        }

        const estaReservado = reservas.some(
          (r) =>
            r.SALA_ID_SALA === selectedSala.ID_SALA &&
            format(new Date(r.FECHA_RESERVA), 'yyyy-MM-dd') === fechaDrop && // Comparar fechas formateadas
            r.Modulos.some(
              (m) => m.MODULO_ID_MODULO === moduloParaSeleccionar.ID_MODULO
            )
        );

        if (estaReservado) {
          seleccionExitosa = false;
          break;
        }
        nuevosModulos.push({ fecha: fechaDrop, numero: ordenActual });
      }

      if (
        seleccionExitosa &&
        nuevosModulos.length === examenParaReservar.CANTIDAD_MODULOS_EXAMEN
      ) {
        setModulosSeleccionados(nuevosModulos);
      } else {
        setModulosSeleccionados([]);
        setSelectedExam(null);
        alert(
          'No se pudieron seleccionar los módulos necesarios (ocupados, fuera de rango o sin sala seleccionada).'
        );
      }
      onDropProcessed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    draggedExamen,
    dropTargetCell,
    selectedSala,
    modulos,
    reservas,
    onDropProcessed,
    // No incluir setSelectedExam ni setModulosSeleccionados para evitar bucles si onDropProcessed los resetea
    // y para asegurar que el efecto se ejecute solo cuando las props de D&D cambian.
  ]);

  const handleSelectSala = useCallback((sala) => {
    setSelectedSala(sala);
    setSelectedExam(null);
    setModulosSeleccionados([]);
  }, []);

  const handleSelectModulo = useCallback(
    // Selección manual
    (fecha, orden) => {
      if (!selectedExam) {
        // Si no hay un examen "activo" (ya sea por drop o selección previa)
        alert('Primero selecciona o arrastra un examen al calendario.');
        return;
      }
      // Tu lógica original de selección manual
      setModulosSeleccionados((prev) => {
        const yaExiste = prev.find(
          (m) => m.fecha === fecha && m.numero === orden
        );
        if (yaExiste) {
          return prev.filter((m) => !(m.fecha === fecha && m.numero === orden));
        }
        if (prev.length > 0 && prev[0].fecha !== fecha) {
          alert('Todos los módulos deben ser del mismo día.');
          return [{ fecha, numero: orden }]; // Inicia nueva selección
        }
        if (prev.length >= selectedExam.CANTIDAD_MODULOS_EXAMEN) {
          alert(
            `Este examen solo requiere ${selectedExam.CANTIDAD_MODULOS_EXAMEN} módulos.`
          );
          return prev;
        }
        const nuevos = [...prev, { fecha, numero: orden }].sort(
          (a, b) => a.numero - b.numero
        );
        // Validar consecutividad
        for (let i = 0; i < nuevos.length - 1; i++) {
          if (nuevos[i + 1].numero !== nuevos[i].numero + 1) {
            alert(
              'Los módulos deben ser consecutivos. Por favor, selecciona nuevamente.'
            );
            return [{ fecha, numero: orden }]; // Reinicia selección con el actual
          }
        }
        return nuevos;
      });
    },
    [selectedExam] // Depende del examen activo
  );

  const payloadForReserva = useCallback(() => {
    if (
      !selectedSala ||
      !selectedExam ||
      !modulosSeleccionados ||
      modulosSeleccionados.length === 0
    ) {
      return null;
    }
    if (modulosSeleccionados.length !== selectedExam.CANTIDAD_MODULOS_EXAMEN) {
      return null;
    }
    // Doble chequeo de consecutividad (aunque debería estar cubierto por la selección)
    const modulosOrdenados = [...modulosSeleccionados].sort(
      (a, b) => a.numero - b.numero
    );
    for (let i = 0; i < modulosOrdenados.length - 1; i++) {
      if (
        modulosOrdenados[i + 1].numero !== modulosOrdenados[i].numero + 1 ||
        modulosOrdenados[i + 1].fecha !== modulosOrdenados[i].fecha
      ) {
        return null; // No son consecutivos o son de diferentes días
      }
    }

    return {
      FECHA_RESERVA: modulosSeleccionados[0].fecha, // yyyy-MM-dd
      SALA_ID_SALA: selectedSala.ID_SALA,
      EXAMEN_ID_EXAMEN: selectedExam.ID_EXAMEN,
      Modulos: modulosSeleccionados
        .map((mSel) => {
          const modOriginal = modulos.find((mod) => mod.ORDEN === mSel.numero);
          return { MODULO_ID_MODULO: modOriginal?.ID_MODULO };
        })
        .filter((m) => m.MODULO_ID_MODULO != null),
    };
  }, [selectedSala, selectedExam, modulosSeleccionados, modulos]);

  const handleConfirmReserva = useCallback(async () => {
    const payload = payloadForReserva();
    if (
      !payload ||
      payload.Modulos.length !== selectedExam.CANTIDAD_MODULOS_EXAMEN
    ) {
      alert(
        'Datos incompletos o incorrectos para la reserva. Verifica los módulos seleccionados.'
      );
      return;
    }
    try {
      const res = await fetch('/api/reservas', {
        // <-- TU ENDPOINT REAL
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ message: 'Error desconocido al crear reserva.' }));
        throw new Error(
          errorData.message || `Error del servidor: ${res.status}`
        );
      }
      const nuevaReserva = await res.json();
      setReservas((prev) => [...prev, nuevaReserva]); // Actualizar estado de reservas
      alert('Reserva creada exitosamente!');
      setSelectedExam(null);
      setModulosSeleccionados([]);
    } catch (err) {
      console.error('Error al crear reserva:', err);
      alert(`Error al crear reserva: ${err.message}`);
    }
  }, [payloadForReserva, selectedExam]); // selectedExam para la validación de cantidad de módulos

  const puedeConfirmar =
    selectedSala &&
    selectedExam &&
    modulosSeleccionados.length > 0 &&
    selectedExam.CANTIDAD_MODULOS_EXAMEN === modulosSeleccionados.length;

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
          isLoadingSalas={isLoadingSalas}
        />
      </aside>
      <main className="details-section">
        {isLoadingModulos || isLoadingReservas || isLoadingSalas ? (
          <p>Cargando datos del calendario...</p>
        ) : selectedSala ? (
          <>
            <CalendarGrid
              fechas={fechas} // Asegúrate que 'fechas' se pasa aquí
              modulos={modulos}
              selectedSala={selectedSala}
              selectedExam={selectedExam}
              reservas={reservas}
              modulosSeleccionados={modulosSeleccionados}
              onSelectModulo={handleSelectModulo}
            />
            {puedeConfirmar && (
              <button
                onClick={handleConfirmReserva}
                className="btn btn-primary mt-3"
              >
                Confirmar Reserva para {selectedExam?.NOMBRE_ASIGNATURA}
              </button>
            )}
          </>
        ) : (
          <p className="aviso-seleccion">
            Selecciona una sala para ver disponibilidad y arrastrar exámenes.
          </p>
        )}
      </main>
    </div>
  );
}
