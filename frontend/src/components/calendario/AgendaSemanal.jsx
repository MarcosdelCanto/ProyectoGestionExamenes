import React, { useState, useEffect, useMemo, useCallback, use } from 'react';
import {
  format,
  startOfWeek,
  addDays,
  eachDayOfInterval,
  isValid,
  set,
} from 'date-fns';
import { es } from 'date-fns/locale';
import SalaSelector from './SalaSelector';
import ExamenSelector from './ExamenSelector'; // Importar ExamenSelector
import CalendarGrid from './CalendarGrid';
import FilterModalSalas from './FilterModalSalas';
import './CalendarioStyles.css'; // Importar los estilos

//funcion para obtener las fechas de la semana actual
const getWeekDates = (currentDate) => {
  if (!isValid(new Date(currentDate))) {
    currentDate = new Date();
  }
  // Obtener el lunes de la semana
  const start = startOfWeek(new Date(currentDate), {
    weekStartsOn: 1,
    locale: es,
  });

  // Generar 7 días a partir del lunes
  return eachDayOfInterval({
    start,
    end: addDays(start, 6), // 5 días después del lunes = sábado
  }).map((date) => ({
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

  // Nuevo estado para exámenes asignados a la tabla
  const [examenesAsignados, setExamenesAsignados] = useState([]);
  const [examenesConModulosModificados, setExamenesConModulosModificados] =
    useState({});

  // Carga de datos inicial (salas, exámenes, módulos, reservas)
  useEffect(() => {
    async function loadInitialData() {
      setIsLoadingSalas(true);
      setIsLoadingExamenes(true);
      setIsLoadingModulos(true);
      setIsLoadingReservas(true);
      try {
        const [salasRes, examenesRes, modulosRes, sedesRes, edificiosRes] =
          await Promise.all([
            fetch('/api/salas'),
            fetch('/api/examenes'),
            fetch('/api/modulos'), // Asegúrate que estos endpoints sean correctos
            fetch('/api/sede'), // Endpoint para obtener sedes
            fetch('/api/edificio'), // Endpoint para obtener edificios
          ]);

        if (!salasRes.ok) throw new Error('Error cargando salas');
        setSalas(await salasRes.json());

        if (!examenesRes.ok) throw new Error('Error cargando exámenes');
        setExamenes(await examenesRes.json());

        if (!modulosRes.ok) throw new Error('Error cargando módulos');
        setModulos(await modulosRes.json());

        setReservas([]);

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

  // funcion para añadir un examen a la tabla
  const agregarExamenATabla = useCallback(
    (examen, fecha, moduloOrden, cantidadModulos) => {
      console.log('agregando examen a tabla:', {
        examen,
        fecha,
        moduloOrden,
        cantidadModulos,
      });
      setExamenesAsignados((prev) => [
        ...prev,
        {
          id: `${examen.ID_EXAMEN}-${fecha}-${moduloOrden}`,
          examen,
          fecha,
          moduloInicial: moduloOrden,
          modulosCount: cantidadModulos,
        },
      ]);
    },
    []
  );
  // funcion para actualizar modulos de un examen existente
  const actualizarModulosExamen = useCallback(
    (examenId, nuevosCant) => {
      // El estado `examenesConModulos` no está definido en este componente.
      // `examenesConModulosModificados` se usa para rastrear cambios en el ExamenSelector
      // antes de que el examen sea arrastrado.
      // Esta función es para actualizar la cantidad de módulos de un examen
      // que ya ha sido asignado y está en la tabla.
      setExamenesAsignados((prev) =>
        prev.map((asignado) =>
          asignado.examen.ID_EXAMEN === examenId
            ? { ...asignado, modulosCount: nuevosCant }
            : asignado
        )
      );
    },
    [setExamenesAsignados]
  );
  // funcion para eliminar un examen de la tabla
  const eliminarExamen = useCallback((examenId) => {
    setExamenesAsignados((prev) =>
      prev.filter((asignado) => asignado.examen.ID_EXAMEN !== examenId)
    );
  }, []);

  // Funcion para obtener el examen asignado a una celda
  const obtenerExamenParaCelda = useCallback(
    (fecha, ordenModulo) => {
      return examenesAsignados.find(
        (asignado) =>
          asignado.fecha === fecha &&
          ordenModulo >= asignado.moduloInicial &&
          ordenModulo < asignado.moduloInicial + asignado.modulosCount
      );
    },
    [examenesAsignados]
  );

  // Efecto para procesar drops de examenes en la tabla
  useEffect(() => {
    if (draggedExamen && dropTargetCell && selectedSala) {
      console.log('Procesando drop de examen:', {
        draggedExamen,
        dropTargetCell,
      });
      const { fecha, modulo } = dropTargetCell;
      const modulosNecesarios = draggedExamen.CANTIDAD_MODULOS_EXAMEN;

      let hayConflicto = false;

      for (let i = 0; i < modulosNecesarios; i++) {
        const ordenActual = modulo.ORDEN + i;
        // Verificar si el módulo existe
        const moduloExiste = modulos.some((m) => m.ORDEN === ordenActual);
        if (!moduloExiste) {
          hayConflicto = true;
          break;
        }
        // verficar si ya hay un examen asignado
        const hayExamenAsignado = obtenerExamenParaCelda(fecha, ordenActual);
        if (hayExamenAsignado) {
          hayConflicto = true;
          break;
        }
        // Verificar si el módulo ya está reservado
        const estaReservado = reservas.some(
          (r) =>
            r.SALA_ID_SALA === selectedSala.ID_SALA &&
            format(new Date(r.FECHA_RESERVA), 'yyyy-MM-dd') === fecha &&
            r.Modulos.some((m) => {
              const moduloReservado = modulos.find(
                (mod) => mod.ID_MODULO === m.MODULO_ID_MODULO
              );
              return moduloReservado && moduloReservado.ORDEN === ordenActual;
            })
        );
        if (estaReservado) {
          hayConflicto = true;
          break;
        }
      }
      if (!hayConflicto) {
        // Si NO hay conflicto, entonces agregar el examen
        agregarExamenATabla(
          draggedExamen,
          fecha,
          modulo.ORDEN,
          modulosNecesarios
        );
      } else {
        // Si hay conflicto, mostrar alerta
        alert(
          'No se puede colocar el examen aquí. Los módulos están ocupados, fuera de rango o ya existe un examen solapado.'
        );
      }
      if (onDropProcessed) {
        onDropProcessed();
      }
    }
  }, [
    draggedExamen,
    dropTargetCell,
    selectedSala,
    modulos,
    reservas,
    agregarExamenATabla,
    obtenerExamenParaCelda,
    onDropProcessed,
  ]);

  // funcion para modificar los modulos de un examen asignado
  const handleModificarModulos = useCallback((examenId, nuevaCantidad) => {
    setExamenesAsignados((prev) =>
      prev.map((asignado) =>
        asignado.examen.ID_EXAMEN === examenId
          ? { ...asignado, modulosCount: nuevaCantidad }
          : asignado
      )
    );
    setExamenesConModulosModificados((prev) => ({
      ...prev,
      [examenId]: nuevaCantidad,
    }));
  }, []);

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

  // manejo los cambios en los módulos del examen seleccionado
  const handleExamenModulosChange = useCallback((examenId, newModulosCount) => {
    setExamenesConModulosModificados((prev) => ({
      ...prev,
      [examenId]: newModulosCount,
    }));
  }, []);

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
    <div className="agenda-semanal-container">
      {/* Fila Superior: Selectores */}
      <div className="top-row">
        <div className="sala-selector-container">
          <SalaSelector
            salas={salas}
            searchTerm={searchTermSala}
            onSearch={(e) => setSearchTermSala(e.target.value)}
            filteredSalas={filteredSalas}
            selectedSala={selectedSala}
            onSelectSala={handleSelectSala}
            isLoadingSalas={isLoadingSalas}
            onOpenFilterModal={() => setShowSalaFilterModal(true)}
          />
        </div>
        <div className="examen-selector-container">
          <ExamenSelector
            examenes={examenes} // Pasar los exámenes cargados aquí
            isLoadingExamenes={isLoadingExamenes}
            onExamenModulosChange={handleExamenModulosChange}
          />
        </div>
      </div>
      {/* Sección del Calendario */}
      <main className="details-section">
        {isLoadingModulos || isLoadingSalas ? ( // isLoadingSalas también es relevante aquí
          <p className="aviso-seleccion">Cargando datos del calendario...</p>
        ) : selectedSala ? (
          <>
            <CalendarGrid
              fechas={fechas}
              modulos={modulos}
              selectedSala={selectedSala}
              selectedExam={selectedExamInternal} // Pasar el examen que se está intentando reservar
              reservas={reservas}
              modulosSeleccionados={modulosSeleccionados}
              onSelectModulo={handleSelectModulo}
              obtenerExamenParaCelda={obtenerExamenParaCelda}
              onModulosChange={actualizarModulosExamen}
              onRemoveExamen={eliminarExamen}
            />
            {puedeConfirmar && (
              <button
                onClick={handleConfirmReserva}
                className="btn btn-primary btn-confirmar-reserva"
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
