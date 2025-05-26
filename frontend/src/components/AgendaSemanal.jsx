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
        exam.ID_Examen === onSelect.selectedExam?.ID_Examen
          ? 'fila-seleccionada'
          : ''
      }
      onClick={() => onSelect(exam)}
    >
      <td>{exam.Seccion?.Nombre_Seccion}</td>
      <td>{exam.Asignatura?.Nombre_Asignatura}</td>
      <td>{exam.Cantidad_Modulos}</td>
      <td>
        {exam.ID_Estado === 3 ? (
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
        seleccionarModulo(fecha, modulo.Numero);
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
      r.ID_Sala === selectedSala?.ID_Sala &&
      r.Fecha === fecha &&
      r.Modulos.some((m) => m.ID_Modulo === modulo.ID_Modulo)
  );
  if (reserva) {
    return (
      <td ref={dropRef} style={highlight} className="reservado">
        <div>
          <span className="detalle">{reserva.Examen?.Nombre_Examen}</span>
          <span className="info-reserva">
            {reserva.Examen?.Seccion?.Nombre_Seccion}
          </span>
        </div>
      </td>
    );
  }

  const estaSel = modulosSeleccionados.some(
    (m) => m.fecha === fecha && m.numero === modulo.Numero
  );
  return (
    <td ref={dropRef} style={highlight} className="disponible">
      <button
        onClick={() => seleccionarModulo(fecha, modulo.Numero)}
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
    const salasData = [
      {
        ID_Sala: 1,
        Codigo_sala: 'S101',
        Nombre_sala: 'Sala Alpha',
        Capacidad: 50,
        Edificio: { Nombre_Edificio: 'Edificio Principal' },
        ID_Estado: 1,
      },
      {
        ID_Sala: 2,
        Codigo_sala: 'S102',
        Nombre_sala: 'Sala Beta',
        Capacidad: 30,
        Edificio: { Nombre_Edificio: 'Edificio Anexo' },
        ID_Estado: 1,
      },
      {
        ID_Sala: 3,
        Codigo_sala: 'S201',
        Nombre_sala: 'Sala Gamma',
        Capacidad: 100,
        Edificio: { Nombre_Edificio: 'Edificio Principal' },
        ID_Estado: 2,
      },
    ];
    const examenesData = [
      {
        ID_Examen: 1,
        Nombre_Examen: 'Parcial 1',
        Seccion: {
          Nombre_Seccion: 'Mat-01',
          Usuarios: [{ Nombre: 'Prof. Turing' }],
        },
        Asignatura: { Nombre_Asignatura: 'Cálculo I' },
        ID_Estado: 4,
        Cantidad_Modulos: 2,
      },
      {
        ID_Examen: 2,
        Nombre_Examen: 'Final',
        Seccion: {
          Nombre_Seccion: 'Fis-02',
          Usuarios: [{ Nombre: 'Prof. Newton' }],
        },
        Asignatura: { Nombre_Asignatura: 'Física General' },
        ID_Estado: 3,
        Cantidad_Modulos: 1,
      },
      {
        ID_Examen: 3,
        Nombre_Examen: 'Quiz Semanal',
        Seccion: {
          Nombre_Seccion: 'Qui-03',
          Usuarios: [{ Nombre: 'Prof. Curie' }],
        },
        Asignatura: { Nombre_Asignatura: 'Química Orgánica' },
        ID_Estado: 4,
        Cantidad_Modulos: 1,
      },
    ];
    const modulosData = [
      {
        ID_Modulo: 1,
        Numero: 1,
        Hora_inicio: '08:00:00',
        Hora_final: '09:30:00',
      },
      {
        ID_Modulo: 2,
        Numero: 2,
        Hora_inicio: '09:45:00',
        Hora_final: '11:15:00',
      },
      {
        ID_Modulo: 3,
        Numero: 3,
        Hora_inicio: '11:30:00',
        Hora_final: '13:00:00',
      },
      {
        ID_Modulo: 4,
        Numero: 4,
        Hora_inicio: '14:00:00',
        Hora_final: '15:30:00',
      },
      {
        ID_Modulo: 5,
        Numero: 5,
        Hora_inicio: '15:45:00',
        Hora_final: '17:15:00',
      },
    ];
    const hoy = format(new Date(), 'yyyy-MM-dd');
    const reservasData = [
      {
        ID_Reserva: 1,
        ID_Sala: 3,
        Fecha: hoy,
        Examen: examenesData[1],
        Modulos: [{ ID_Modulo: 1 }, { ID_Modulo: 2 }],
      },
    ];
    setSalas(salasData);
    setExamenes(examenesData);
    setModulos(modulosData);
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
          s.Codigo_sala.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.Nombre_sala.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.Capacidad.toString().includes(searchTerm) ||
          s.Edificio?.Nombre_Edificio.toLowerCase().includes(
            searchTerm.toLowerCase()
          )
      ),
    [salas, searchTerm]
  );

  const filteredExamenes = useMemo(
    () =>
      examenes.filter(
        (ex) =>
          (ex.Seccion?.Nombre_Seccion.toLowerCase().includes(
            searchTermExamen.toLowerCase()
          ) ||
            ex.Asignatura?.Nombre_Asignatura.toLowerCase().includes(
              searchTermExamen.toLowerCase()
            )) &&
          ex.ID_Estado !== 3
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
          s.ID_Sala === sala.ID_Sala
            ? { ...s, ID_Estado: 2 }
            : s.ID_Sala === selectedSala?.ID_Sala
              ? { ...s, ID_Estado: 1 }
              : s
        )
      );
      setSelectedSala(sala);
      setModulosSeleccionados([]);
    },
    [selectedSala]
  );

  const manejarSeleccionExamen = useCallback((ex) => {
    setSelectedExam((prev) => (prev?.ID_Examen === ex.ID_Examen ? null : ex));
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
          if (prev.length >= (selectedExam?.Cantidad_Modulos || 1)) {
            alert(
              `Este examen requiere ${selectedExam.Cantidad_Modulos} módulo(s). Ya has seleccionado el máximo.`
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
      ID_Sala: selectedSala.ID_Sala,
      ID_Examen: selectedExam.ID_Examen,
      Modulos: modulosSeleccionados.map((m) => ({
        ID_Modulo: modulos.find((x) => x.Numero === m.numero)?.ID_Modulo,
      })),
    };
  }, [selectedSala, selectedExam, modulosSeleccionados, modulos]);

  const enviarReserva = useCallback(() => {
    const estructura = crearEstructuraReserva();
    if (!estructura) return;
    setExamenes((prev) =>
      prev.map((e) =>
        e.ID_Examen === estructura.ID_Examen ? { ...e, ID_Estado: 3 } : e
      )
    );
    setReservas((prev) => [
      ...prev,
      {
        ...estructura,
        ID_Reserva: Date.now(),
        Examen: examenes.find((e2) => e2.ID_Examen === estructura.ID_Examen),
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
      <tr key={modulo.ID_Modulo}>
        <td className="numero-modulo">{modulo.Numero}</td>
        <td className="horario-modulo">
          {format(new Date(`1970-01-01T${modulo.Hora_inicio}`), 'HH:mm')}
          <br />
          {format(new Date(`1970-01-01T${modulo.Hora_final}`), 'HH:mm')}
        </td>
        {fechasDeLaSemana.map(({ fecha }) => (
          <CalendarCell
            key={`${fecha}-${modulo.ID_Modulo}`}
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
                        s.ID_Estado === 1 || s.ID_Sala === selectedSala?.ID_Sala
                    )
                    .map((sala) => (
                      <tr
                        key={sala.ID_Sala}
                        className={
                          sala.ID_Sala === selectedSala?.ID_Sala
                            ? 'fila-seleccionada'
                            : ''
                        }
                      >
                        <td>{sala.Codigo_sala}</td>
                        <td>{sala.Nombre_sala}</td>
                        <td>{sala.Edificio?.Nombre_Edificio}</td>
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
                      key={ex.ID_Examen}
                      exam={ex}
                      onSelect={(exam) => manejarSeleccionExamen(exam)}
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
                      Sala: {selectedSala.Nombre_sala} (Capacidad:{' '}
                      {selectedSala.Capacidad})
                    </h2>
                    {selectedExam && (
                      <h3>
                        Examen: {selectedExam.Asignatura?.Nombre_Asignatura} -{' '}
                        {selectedExam.Seccion?.Nombre_Seccion} (
                        {selectedExam.Cantidad_Modulos} módulos)
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
                (selectedExam.Cantidad_Modulos || 0) && (
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
