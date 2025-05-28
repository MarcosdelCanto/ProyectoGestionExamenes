import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { format, startOfWeek, addDays, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { FaArrowCircleRight, FaCircle } from 'react-icons/fa';
import { useDrag, useDrop } from 'react-dnd';

// Constante para definir cuántos días incluir en la semana (lunes a sábado)
const DIAS_SEMANA = 6;

/**
 * Obtiene un array de objetos con las fechas de la semana (lunes a sábado)
 * @param {Date | string} fechaBase - Fecha de referencia
 * @returns {Array<{ dia: string, fecha: string, fechaMostrar: string }>}
 */
export function obtenerFechasDeLaSemana(fechaBase) {
  const fecha = fechaBase instanceof Date ? fechaBase : new Date(fechaBase);
  if (isNaN(fecha)) throw new Error(`Fecha inválida: ${fechaBase}`);
  const inicioSemana = startOfWeek(fecha, { weekStartsOn: 1 });
  return eachDayOfInterval({
    start: inicioSemana,
    end: addDays(inicioSemana, DIAS_SEMANA - 1),
  }).map((diaDate) => {
    const nombre = format(diaDate, 'EEEE', { locale: es });
    return {
      dia: nombre.charAt(0).toUpperCase() + nombre.slice(1),
      fecha: format(diaDate, 'yyyy-MM-dd'),
      fechaMostrar: format(diaDate, 'dd/MM/yyyy'),
    };
  });
}

// Helper DnD: filas arrastrables de examen
const DraggableExamRow = ({ exam, onSelect }) => {
  const [{ isDragging }, dragRef] = useDrag(
    () => ({
      type: 'EXAM',
      item: { exam },
      collect: (m) => ({ isDragging: m.isDragging() }),
    }),
    [exam]
  );

  return (
    <tr
      ref={dragRef}
      style={{ opacity: isDragging ? 0.5 : 1, cursor: 'grab' }}
      className={
        exam.ID_Examen === selectedExam?.ID_EXAMEN ? 'fila-seleccionada' : ''
      }
      onClick={() => onSelect(exam)}
    >
      <td>{exam.Seccion?.Nombre_Seccion}</td>
      <td>{exam.Asignatura?.Nombre_Asignatura}</td>
      <td>{exam.Cantidad_Modulos}</td>
      <td>
        {exam.ID_ESTADO === 3 ? (
          <FaCircle className="icono-reservado" />
        ) : (
          <FaArrowCircleRight
            className="icono"
            onClick={() => onSelect(exam)}
          />
        )}
      </td>
    </tr>
  );
};

// Helper DnD: celdas del calendario como zona de drop
const CalendarCell = ({
  fecha,
  modulo,
  selectedSala,
  reservas,
  modulosSeleccionados,
  selectedExam,
  seleccionarModulo,
  setSelectedExam,
  setFechaSeleccionada,
}) => {
  const [{ isOver, canDrop }, dropRef] = useDrop(
    () => ({
      accept: 'EXAM',
      canDrop: () => !!selectedSala,
      drop: ({ exam }) => {
        setSelectedExam(exam);
        setFechaSeleccionada(new Date(fecha));
        seleccionarModulo(fecha, modulo.ORDEN);
      },
      collect: (m) => ({ isOver: m.isOver(), canDrop: m.canDrop() }),
    }),
    [selectedSala, fecha, modulo]
  );

  const highlight = isOver
    ? canDrop
      ? { background: 'lightgreen' }
      : { background: 'lightcoral' }
    : {};

  const reserva = reservas.find(
    (r) =>
      r.ID_SALA === selectedSala?.ID_SALA &&
      r.Fecha === fecha &&
      r.Modulos.some((m) => m.ID_MODULO === modulo.ID_MODULO)
  );
  if (reserva) {
    return (
      <td ref={dropRef} style={highlight} className="reservado">
        <div>
          <span className="detalle">{reserva.Examen?.NOMBRE_EXAMEN}</span>
          <span className="info-reserva">
            {reserva.Examen?.Seccion?.SECCION_ID_SECCION}
          </span>
        </div>
      </td>
    );
  }

  const estaSel = modulosSeleccionados.some(
    (m) => m.fecha === fecha && m.ORDEN === modulo.ORDEN
  );
  return (
    <td ref={dropRef} style={highlight} className="disponible">
      <button
        onClick={() => seleccionarModulo(fecha, modulo.ORDEN)}
        disabled={!selectedSala || !selectedExam}
        className={estaSel ? 'boton-modulo-seleccionado' : ''}
      >
        Seleccionar
      </button>
    </td>
  );
};

export function AgendaSemanal() {
  const [salas, setSalas] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [examenes, setExamenes] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [selectedSala, setSelectedSala] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [modulosSeleccionados, setModulosSeleccionados] = useState([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTermExamen, setSearchTermExamen] = useState('');

  useEffect(() => {
    // Datos simulados para maqueta
    const fetchData = async () => {
      try {
        const [salasRes, examenesRes, modulosRes] = await Promise.all([
          fetch('http://localhost:3000/api/salas'),
          fetch('http://localhost:3000/api/examenes'),
          fetch('http://localhost:3000/api/modulos'),
        ]);

        if (!salasRes.ok || !examenesRes.ok || !modulosRes.ok) {
          throw new Error('Error en alguna respuesta de la API');
        }

        const [salasData, examenesData, modulosData] = await Promise.all([
          salasRes.json(),
          examenesRes.json(),
          modulosRes.json(),
        ]);
        setSalas(salasData);
        setExamenes(examenesData);
        setModulos(modulosData);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        // Datos simulados en caso de error
      }
    };
    const hoy = format(new Date(), 'yyyy-MM-dd');
    const reservasData = [
      {
        ID_Reserva: 1,
        ID_SALA: 3,
        Fecha: hoy,
        Modulos: [{ ID_MODULO: 1 }, { ID_MODULO: 2 }],
      },
    ];
    fetchData();
    setReservas(reservasData);
  }, []);

  const fechasDeLaSemana = useMemo(
    () => obtenerFechasDeLaSemana(fechaSeleccionada),
    [fechaSeleccionada]
  );

  const filteredSalas = useMemo(
    () =>
      salas.filter(
        (s) =>
          s.COD_SALA.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.NOMBRE_SALA.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.CAPACIDAD_SALA.toString().includes(searchTerm) ||
          s.EDIFICIO?.NOMBRE_SALA.toLowerCase().includes(
            searchTerm.toLowerCase()
          )
      ),
    [salas, searchTerm]
  );

  const filteredExamenes = useMemo(
    () =>
      examenes.filter(
        (ex) =>
          (ex.SECCION?.NOMBRE_SECCION.toLowerCase().includes(
            searchTermExamen.toLowerCase()
          ) ||
            ex.ASIGNATURA?.NOMBRE_ASIGNATURA.toLowerCase().includes(
              searchTermExamen.toLowerCase()
            )) &&
          ex.ID_ESTADO !== 3
      ),
    [examenes, searchTermExamen]
  );

  const handleSearch = useCallback((e) => setSearchTerm(e.target.value), []);
  const handleSearchExamen = useCallback(
    (e) => setSearchTermExamen(e.target.value),
    []
  );

  const manejarSeleccionSala = useCallback(
    (sala) => {
      setSalas((prev) =>
        prev.map((s) =>
          s.ID_SALA === sala.ID_SALA
            ? { ...s, ID_ESTADO: 2 }
            : s.ID_SALA === selectedSala?.ID_SALA
              ? { ...s, ID_ESTADO: 1 }
              : s
        )
      );
      setSelectedSala(sala);
      setModulosSeleccionados([]);
    },
    [selectedSala]
  );

  const manejarSeleccionExamen = useCallback((ex) => {
    setSelectedExam((prev) => (prev?.ID_EXAMEN === ex.ID_EXAMEN ? null : ex));
    setModulosSeleccionados([]);
  }, []);

  const seleccionarModulo = useCallback(
    (fecha, numero) => {
      if (!selectedExam) {
        alert('Por favor, selecciona un examen primero.');
        return;
      }
      setModulosSeleccionados((prev) =>
        // lógica de selección consecutiva/mismo día…
        {
          if (prev.length > 0 && prev[0].fecha !== fecha) {
            alert(
              'Solo puedes seleccionar módulos del mismo día. Se limpiará la selección actual.'
            );
            return [{ fecha, numero }];
          }
          const idx = prev.findIndex((m) => m.numero === numero);
          if (idx !== -1) {
            return prev.filter((_, i) => i !== idx);
          }
          if (prev.length >= (selectedExam?.CANTIDAD_MODULOS_EXAMENES || 1)) {
            alert(
              `Este examen requiere ${selectedExam.CANTIDAD_MODULOS_EXAMENES} módulo(s). Ya has seleccionado el máximo.`
            );
            return prev;
          }
          const modulosOrdenados = [...prev, { fecha, numero }].sort(
            (a, b) => a.numero - b.numero
          );
          if (modulosOrdenados.length > 1) {
            for (let i = 0; i < modulosOrdenados.length - 1; i++) {
              if (
                modulosOrdenados[i + 1].numero !==
                modulosOrdenados[i].numero + 1
              ) {
                alert(
                  'Los módulos seleccionados deben ser consecutivos. Se limpiará la selección actual.'
                );
                return [{ fecha, numero }];
              }
            }
          }
          return modulosOrdenados;
        }
      );
    },
    [selectedExam]
  );

  const crearEstructuraReserva = useCallback(() => {
    if (!selectedSala || !selectedExam || modulosSeleccionados.length === 0) {
      alert('Selecciona sala, examen y módulos antes de confirmar.');
      return null;
    }
    return {
      Fecha: modulosSeleccionados[0].fecha,
      ID_SALA: selectedSala.ID_SALA,
      ID_Examen: selectedExam.ID_EXAMEN,
      Modulos: modulosSeleccionados.map((m) => ({
        ID_Modulo: modulos.find((x) => x.Numero === m.numero)?.ID_MODULO,
      })),
    };
  }, [selectedSala, selectedExam, modulosSeleccionados, modulos]);

  const enviarReserva = useCallback(() => {
    const estructura = crearEstructuraReserva();
    if (!estructura) return;
    setExamenes((prev) =>
      prev.map((e) =>
        e.ID_EXAMEN === estructura.ID_EXAMEN ? { ...e, ESTADO_ID_ESTADO: 3 } : e
      )
    );
    setReservas((prev) => [
      ...prev,
      {
        ...estructura,
        ID_RESERVA: Date.now(),
        Examen: examenes.find((e2) => e2.ID_EXAMEN === estructura.ID_EXAMEN),
      },
    ]);
    setModulosSeleccionados([]);
    setSelectedExam(null);
    alert('Reserva creada con éxito (simulación)');
  }, [crearEstructuraReserva, examenes]);

  const renderCabeceraTabla = () => (
    <tr>
      <th colSpan="2">Módulo</th>
      {fechasDeLaSemana.map(({ dia, fechaMostrar }) => (
        <th key={fechaMostrar}>
          {dia}
          <br />
          {fechaMostrar}
        </th>
      ))}
    </tr>
  );

  const renderFilasTabla = () =>
    modulos.map((modulo) => (
      <tr key={modulo.ID_MODULO}>
        <td className="orden-modulo">{modulo.ORDEN}</td>
        <td className="horario-modulo">
          {format(new Date(`1970-01-01T${modulo.INICIO_MODULO}`), 'HH:mm')}
          <br />
          {format(new Date(`1970-01-01T${modulo.FIN_MODULO}`), 'HH:mm')}
        </td>
        {fechasDeLaSemana.map(({ fecha }) => (
          <CalendarCell
            key={`${fecha}-${modulo.ID_MODULO}`}
            fecha={fecha}
            modulo={modulo}
            selectedSala={selectedSala}
            reservas={reservas}
            modulosSeleccionados={modulosSeleccionados}
            selectedExam={selectedExam}
            seleccionarModulo={seleccionarModulo}
            setSelectedExam={setSelectedExam}
            setFechaSeleccionada={setFechaSeleccionada}
          />
        ))}
      </tr>
    ));

  return (
    <>
      <div className="container-lateral">
        {/* … panel lateral idéntico al original … */}
        <div className="search-section">
          <h2>Seleccionar Fecha</h2>
          <input
            type="date"
            value={format(fechaSeleccionada, 'yyyy-MM-dd')}
            onChange={(e) => {
              setFechaSeleccionada(new Date(e.target.value));
              setModulosSeleccionados([]);
            }}
          />
          <h2>Seleccionar Sala</h2>
          <input
            type="search"
            placeholder="Buscar Sala..."
            value={searchTerm}
            onChange={handleSearch}
          />
          <div
            className="search-box"
            style={{ maxHeight: 200, overflowY: 'auto' }}
          >
            {filteredSalas.length ? (
              <table className="tabla-seleccion">
                <thead>
                  <tr>
                    <th>Cód.</th>
                    <th>Nombre</th>
                    <th>Edificio</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSalas
                    .filter(
                      (s) =>
                        s.ID_ESTADO === 1 || s.ID_SALA === selectedSala?.ID_SALA
                    )
                    .map((sala) => (
                      <tr
                        key={sala.ID_SALA}
                        className={
                          sala.ID_SALA === selectedSala?.ID_SALA
                            ? 'fila-seleccionada'
                            : ''
                        }
                      >
                        <td>{sala.COD_SALA}</td>
                        <td>{sala.NOMBRE_SALA}</td>
                        <td>{sala.EDIFICIO?.NOMBRE_EDIFICIO}</td>
                        <td>
                          <FaArrowCircleRight
                            onClick={() => manejarSeleccionSala(sala)}
                            className="icono"
                          />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            ) : (
              <p>No hay salas disponibles.</p>
            )}
          </div>
          <h2>Seleccionar Examen</h2>
          <input
            type="search"
            placeholder="Buscar Examen..."
            value={searchTermExamen}
            onChange={handleSearchExamen}
          />
          <div
            className="search-box"
            style={{ maxHeight: 200, overflowY: 'auto' }}
          >
            {filteredExamenes.length ? (
              <table className="tabla-seleccion">
                <thead>
                  <tr>
                    <th>Sección</th>
                    <th>Asignatura</th>
                    <th>Mód.</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExamenes.map((ex) => (
                    <DraggableExamRow
                      key={ex.ID_EXAMEN}
                      exam={ex}
                      onSelect={manejarSeleccionExamen}
                      selectedExam={selectedExam}
                    />
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No hay exámenes disponibles.</p>
            )}
          </div>
        </div>
      </div>
      <div className="details-section">
        {selectedSala ? (
          <>
            <table>
              <thead>
                <tr>
                  <th colSpan={fechasDeLaSemana.length + 2}>
                    <h2>
                      Sala: {selectedSala.NOMBRE_SALA} (Capacidad:{' '}
                      {selectedSala.CAPACIDAD_SALA})
                    </h2>
                    {selectedExam && (
                      <h3>
                        Examen: {selectedExam.ASIGNATURA?.NOMBRE_ASIGNATURA} -{' '}
                        {selectedExam.SECCION?.NOMBRE_SECCION} (
                        {selectedExam.CANTIDAD_MODULOS_EXAMENES} módulos)
                      </h3>
                    )}
                  </th>
                </tr>
                {renderCabeceraTabla()}
              </thead>
              <tbody>{renderFilasTabla()}</tbody>
            </table>
            {selectedExam &&
              modulosSeleccionados.length ===
                (selectedExam.CANTIDAD_MODULOS_EXAMENES || 0) && (
                <button onClick={enviarReserva}>Confirmar Reserva</button>
              )}
          </>
        ) : (
          <p className="aviso-seleccion">
            Selecciona una sala para ver disponibilidad.
          </p>
        )}
      </div>
    </>
  );
}

export default AgendaSemanal;
