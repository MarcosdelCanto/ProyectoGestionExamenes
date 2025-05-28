import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  format,
  startOfWeek,
  addDays,
  eachDayOfInterval,
  isValid,
} from 'date-fns';
import { es } from 'date-fns/locale';
import SalaSelector from './SalaSelector';
import ExamenSelector from './ExamenSelector'; // Importar ExamenSelector
import CalendarGrid from './CalendarGrid';
import FilterModalSalas from './FilterModalSalas'; // Importar el modal de filtros para salas
// Asegúrate que las rutas de importación sean correctas

const getWeekDates = (currentDate) => {
  if (!isValid(new Date(currentDate))) {
    currentDate = new Date();
  }
  const start = startOfWeek(new Date(currentDate), { locale: es });
  return eachDayOfInterval({ start, end: addDays(start, 6) }).map((date) => ({
    fecha: format(date, 'yyyy-MM-dd'),
    diaNumero: format(date, 'd'),
    diaNombre: format(date, 'EEEE', { locale: es }),
    esHoy: format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'),
  }));
};

export default function AgendaSemanal({
  draggedExamen, // Este es el examen que se está arrastrando (viene de DndContext en CalendarioPage)
  dropTargetCell, // Esta es la celda donde se soltó (viene de DndContext en CalendarioPage)
  onDropProcessed, // Función para limpiar el estado de drag/drop en CalendarioPage
}) {
  // Estados para Salas
  const [salas, setSalas] = useState([]);
  const [selectedSala, setSelectedSala] = useState(null);
  const [searchTermSala, setSearchTermSala] = useState('');
  const [isLoadingSalas, setIsLoadingSalas] = useState(true);
  const [showSalaFilterModal, setShowSalaFilterModal] = useState(false);
  const [selectedSede, setSelectedSede] = useState(''); // Para el filtro de sede en el modal
  const [selectedEdificio, setSelectedEdificio] = useState(''); // Para el filtro de edificio en el modal

  // Estados para las opciones de los filtros de sala
  const [sedesDisponibles, setSedesDisponibles] = useState([]);
  const [edificiosDisponibles, setEdificiosDisponibles] = useState([]);

  // Estados para Exámenes (si ExamenSelector no los carga internamente)
  const [examenes, setExamenes] = useState([]);
  const [isLoadingExamenes, setIsLoadingExamenes] = useState(true);

  // Estados para el Calendario y la lógica de reserva
  const [modulos, setModulos] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [selectedExamInternal, setSelectedExamInternal] = useState(null); // Examen seleccionado para la reserva
  const [modulosSeleccionados, setModulosSeleccionados] = useState([]);
  const [fechaBase, setFechaBase] = useState(new Date());
  const [isLoadingModulos, setIsLoadingModulos] = useState(true);
  const [isLoadingReservas, setIsLoadingReservas] = useState(true);

  // Carga de datos inicial (salas, exámenes, módulos, reservas)
  useEffect(() => {
    async function loadInitialData() {
      setIsLoadingSalas(true);
      setIsLoadingExamenes(true);
      setIsLoadingModulos(true);
      setIsLoadingReservas(true);
      try {
        const [
          salasRes,
          examenesRes,
          modulosRes,
          reservasRes,
          sedesRes,
          edificiosRes,
        ] = await Promise.all([
          fetch('/api/salas'),
          fetch('/api/examenes'),
          fetch('/api/modulos'), // Asegúrate que estos endpoints sean correctos
          fetch('/api/reservas'),
          fetch('/api/sedes'), // Endpoint para obtener sedes
          fetch('/api/edificios'), // Endpoint para obtener edificios
        ]);

        if (!salasRes.ok) throw new Error('Error cargando salas');
        setSalas(await salasRes.json());

        if (!examenesRes.ok) throw new Error('Error cargando exámenes');
        setExamenes(await examenesRes.json());

        if (!modulosRes.ok) throw new Error('Error cargando módulos');
        setModulos(await modulosRes.json());

        if (!reservasRes.ok) throw new Error('Error cargando reservas');
        setReservas(await reservasRes.json());

        if (!sedesRes.ok) throw new Error('Error cargando sedes');
        setSedesDisponibles(await sedesRes.json());

        if (!edificiosRes.ok) throw new Error('Error cargando edificios');
        setEdificiosDisponibles(await edificiosRes.json());
      } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
        // Manejar errores individuales si es necesario
      } finally {
        setIsLoadingSalas(false);
        setIsLoadingExamenes(false);
        setIsLoadingModulos(false);
        setIsLoadingReservas(false);
      }
    }
    loadInitialData();
  }, []);

  const fechas = useMemo(() => getWeekDates(fechaBase), [fechaBase]);

  // Filtrado de salas
  const filteredSalas = useMemo(() => {
    let tempSalas = salas;

    if (selectedSede) {
      // Asumimos que cada objeto 'sala' tiene una propiedad ID_SEDE
      tempSalas = tempSalas.filter((s) => s.ID_SEDE === parseInt(selectedSede));
    }

    if (selectedEdificio) {
      // Asumimos que cada objeto 'sala' tiene una propiedad ID_EDIFICIO
      tempSalas = tempSalas.filter(
        (s) => s.ID_EDIFICIO === parseInt(selectedEdificio)
      );
    }

    if (searchTermSala) {
      const term = searchTermSala.toLowerCase();
      tempSalas = tempSalas.filter(
        (s) =>
          (s.COD_SALA?.toLowerCase() ?? '').includes(term) ||
          (s.NOMBRE_SALA?.toLowerCase() ?? '').includes(term) ||
          // Si las salas tienen nombre de edificio directamente, o si necesitas buscar en una lista aparte:
          (s.NOMBRE_EDIFICIO?.toLowerCase() ?? '').includes(term) // Ejemplo si sala.NOMBRE_EDIFICIO existe
      );
    }
    return tempSalas;
  }, [salas, searchTermSala, selectedSede, selectedEdificio]);

  const handleSelectSala = useCallback((sala) => {
    setSelectedSala(sala);
    setSelectedExamInternal(null); // Limpiar examen seleccionado al cambiar de sala
    setModulosSeleccionados([]); // Limpiar módulos seleccionados
  }, []);

  // Efecto para procesar el drop (cuando draggedExamen y dropTargetCell vienen de CalendarioPage)
  useEffect(() => {
    if (draggedExamen && dropTargetCell && selectedSala) {
      const examenParaReservar = draggedExamen; // Este es el objeto examen completo
      const { fecha: fechaDrop, modulo: moduloDrop } = dropTargetCell;

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
        onDropProcessed(); // Limpiar estado en CalendarioPage
        return;
      }

      setSelectedExamInternal(examenParaReservar); // Guardar el examen que se está intentando reservar

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
            format(new Date(r.FECHA_RESERVA), 'yyyy-MM-dd') === fechaDrop &&
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
        setSelectedExamInternal(null); // Limpiar si no se pudo seleccionar
        alert(
          'No se pudieron seleccionar los módulos necesarios (ocupados o fuera de rango).'
        );
      }
      onDropProcessed(); // Limpiar estado en CalendarioPage
    } else if (draggedExamen && dropTargetCell && !selectedSala) {
      alert('Por favor, selecciona una sala antes de arrastrar un examen.');
      onDropProcessed();
    }
  }, [
    draggedExamen,
    dropTargetCell,
    selectedSala,
    modulos,
    reservas,
    onDropProcessed,
  ]);

  // Selección de módulos en el calendario
  const handleSelectModulo = useCallback(
    (fecha, orden) => {
      // Esta función podría ya no ser necesaria si la selección de módulos
      // se maneja completamente a través del drag-and-drop.
      // Si se mantiene, asegurarse que selectedExamInternal esté seteado.
      if (!selectedExamInternal) {
        alert('Primero arrastra un examen a una celda del calendario.');
        return;
      }
      setModulosSeleccionados((prev) => {
        if (prev.length && prev[0].fecha !== fecha) {
          alert('Módulos deben estar en el mismo día');
          return [{ fecha, numero: orden }];
        }
        if (prev.length > 0 && prev[0].fecha !== fecha) {
          alert('Todos los módulos deben ser del mismo día.');
          return [{ fecha, numero: orden }]; // Inicia nueva selección
        }
        if (prev.length >= selectedExamInternal.CANTIDAD_MODULOS_EXAMEN) {
          alert(
            `Este examen solo requiere ${selectedExamInternal.CANTIDAD_MODULOS_EXAMEN} módulos.`
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
    [selectedExamInternal] // Depende del examen activo
  );

  // Construir payload para reserva
  const payloadForReserva = useCallback(() => {
    if (
      !selectedSala ||
      !selectedExamInternal ||
      !modulosSeleccionados ||
      modulosSeleccionados.length === 0
    ) {
      return null;
    }
    const modulosParaAPI = modulosSeleccionados
      .map((mSel) => {
        const modOriginal = modulos.find((mod) => mod.ORDEN === mSel.numero);
        return modOriginal ? { MODULO_ID_MODULO: modOriginal.ID_MODULO } : null;
      })
      .filter((m) => m !== null);

    if (
      modulosParaAPI.length !== selectedExamInternal.CANTIDAD_MODULOS_EXAMEN
    ) {
      console.error('Discrepancia en la cantidad de módulos para la API');
      return null;
    }

    return {
      FECHA_RESERVA: modulosSeleccionados[0].fecha,
      SALA_ID_SALA: selectedSala.ID_SALA,
      EXAMEN_ID_EXAMEN: selectedExamInternal.ID_EXAMEN,
      Modulos: modulosParaAPI,
    };
  }, [selectedSala, selectedExamInternal, modulosSeleccionados, modulos]);

  // Confirmar reserva al backend
  const handleConfirmReserva = useCallback(async () => {
    const payload = payloadForReserva();
    if (!payload) {
      alert('Error: No se pueden confirmar los datos de la reserva.');
      return;
    }
    try {
      const response = await fetch('/api/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear la reserva');
      }
      const nuevaReserva = await response.json();
      setReservas((prev) => [...prev, nuevaReserva]);
      alert(
        `Reserva para ${selectedExamInternal?.NOMBRE_ASIGNATURA} confirmada!`
      );
      setSelectedExamInternal(null);
      setModulosSeleccionados([]);
    } catch (error) {
      console.error('Error al confirmar reserva:', error);
      alert(`Error al confirmar reserva: ${error.message}`);
    }
  }, [payloadForReserva, selectedExamInternal]);

  const handleAplicarFiltrosSalas = () => {
    setShowSalaFilterModal(false);
    // La re-filtración de salas ocurrirá automáticamente debido a los cambios en selectedSede/selectedEdificio
  };

  const puedeConfirmar =
    selectedSala &&
    selectedExamInternal &&
    modulosSeleccionados.length > 0 &&
    selectedExamInternal.CANTIDAD_MODULOS_EXAMEN ===
      modulosSeleccionados.length;

  // Estilos para la fila superior (SalaSelector y ExamenSelector)
  const topRowStyle = {
    display: 'flex',
    marginBottom: '20px',
    minHeight: '200px', // Altura mínima para la fila superior, ajustar según necesidad
    // alignItems: 'stretch', // Para que los hijos intenten tener la misma altura
  };

  const salaSelectorContainerStyle = {
    flex: '0 0 20%', // SalaSelector ocupa el 20%
    marginRight: '15px', // Espacio entre los selectores
    // Para asegurar que el contenido interno se expanda si es necesario
    display: 'flex',
    flexDirection: 'column', // Para que el contenido interno se apile verticalmente
    // overflowY: 'auto', // Si la lista de salas es muy larga
  };

  const examenSelectorContainerStyle = {
    flex: '1 1 auto', // ExamenSelector ocupa el resto del espacio
    // Para asegurar que el contenido interno se expanda si es necesario
    display: 'flex',
    flexDirection: 'column', // Para que el contenido interno se apile verticalmente
    overflowY: 'auto', // Si la lista de exámenes es muy larga
  };

  return (
    <div
      className="agenda-semanal-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - SOME_HEADER_HEIGHT)',
      }}
    >
      {/* Ajustar SOME_HEADER_HEIGHT */}
      {/* Fila Superior: Selectores */}
      <div style={topRowStyle}>
        <div style={salaSelectorContainerStyle}>
          <SalaSelector
            salas={salas}
            searchTerm={searchTermSala}
            onSearch={(e) => setSearchTermSala(e.target.value)}
            filteredSalas={filteredSalas}
            selectedSala={selectedSala}
            onSelectSala={handleSelectSala}
            isLoadingSalas={isLoadingSalas}
            onOpenFilterModal={() => setShowSalaFilterModal(true)}
            // Aplicar estilos para que ocupe el 100% de la altura de su contenedor
            // style={{ height: '100%' }} // Esto se aplicaría al div raíz de SalaSelector
          />
        </div>
        <div style={examenSelectorContainerStyle}>
          <ExamenSelector
            examenes={examenes} // Pasar los exámenes cargados aquí
            isLoadingExamenes={isLoadingExamenes}
            // Aplicar estilos para que ocupe el 100% de la altura de su contenedor
            // style={{ height: '100%' }} // Esto se aplicaría al div raíz de ExamenSelector
          />
        </div>
      </div>
      {/* Sección del Calendario */}
      <main
        className="details-section"
        style={{ flexGrow: 1, overflowY: 'auto' }}
      >
        {/* Para que el calendario ocupe el resto y tenga scroll si es necesario */}
        {isLoadingModulos || isLoadingReservas || isLoadingSalas ? ( // isLoadingSalas también es relevante aquí
          <p>Cargando datos del calendario...</p>
        ) : selectedSala ? (
          <>
            <CalendarGrid
              fechas={fechas}
              modulos={modulos}
              selectedSala={selectedSala}
              selectedExam={selectedExamInternal} // Pasar el examen que se está intentando reservar
              reservas={reservas}
              modulosSeleccionados={modulosSeleccionados}
              onSelectModulo={handleSelectModulo} // Considerar si esta función sigue siendo necesaria
            />
            {puedeConfirmar && (
              <button
                onClick={handleConfirmReserva}
                className="btn btn-primary mt-3"
              >
                Confirmar Reserva para {selectedExamInternal?.NOMBRE_ASIGNATURA}
              </button>
            )}
          </>
        ) : (
          <p className="aviso-seleccion">
            Selecciona una sala para ver disponibilidad
          </p>
        )}
      </main>

      <FilterModalSalas
        isOpen={showSalaFilterModal}
        onClose={() => setShowSalaFilterModal(false)}
        sedesDisponibles={sedesDisponibles}
        selectedSede={selectedSede}
        onSetSelectedSede={setSelectedSede}
        edificiosDisponibles={edificiosDisponibles}
        selectedEdificio={selectedEdificio}
        onSetSelectedEdificio={setSelectedEdificio}
        onAplicarFiltros={handleAplicarFiltrosSalas}
      />
    </div>
  );
}
