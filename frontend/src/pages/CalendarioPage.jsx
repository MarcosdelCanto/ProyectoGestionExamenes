import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { format, startOfWeek, addDays, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { FaArrowCircleRight, FaCircle } from 'react-icons/fa';
import { useDrag, useDrop } from 'react-dnd';

// Días de lunes a sábado
const DIAS_SEMANA = 6;

export function obtenerFechasDeLaSemana(fechaBase) {
  const fecha = fechaBase instanceof Date ? fechaBase : new Date(fechaBase);
  const inicioSemana = startOfWeek(fecha, { weekStartsOn: 1 });
  return eachDayOfInterval({
    start: inicioSemana,
    end: addDays(inicioSemana, DIAS_SEMANA - 1),
  }).map((d) => ({
    dia: format(d, 'EEEE', { locale: es }).replace(/^./, (c) =>
      c.toUpperCase()
    ),
    fecha: format(d, 'yyyy-MM-dd'),
    fechaMostrar: format(d, 'dd/MM/yyyy'),
  }));
}

// Fila draggable de examen
const DraggableExamRow = ({ exam, onSelect, selectedExam }) => {
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
        exam.ID_EXAMEN === selectedExam?.ID_EXAMEN ? 'fila-seleccionada' : ''
      }
      onClick={() => onSelect(exam)}
    >
      <td>{exam.SECCION?.NOMBRE_SECCION}</td>
      <td>{exam.ASIGNATURA?.NOMBRE_ASIGNATURA}</td>
      <td>{exam.CANTIDAD_MODULOS_EXAMEN}</td>
      <td>
        {exam.ESTADO_ID_ESTADO === 3 ? (
          <FaCircle className="icono-reservado" />
        ) : (
          <FaArrowCircleRight className="icono" />
        )}
      </td>
    </tr>
  );
};

// Celda de calendario con zona de drop
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

  // Buscamos reserva coincidente
  const reserva = reservas.find(
    (r) =>
      r.SALA_ID_SALA === selectedSala?.ID_SALA &&
      // comparo solo fecha YYYY-MM-DD
      r.FECHA_RESERVA?.slice(0, 10) === fecha &&
      // r.Modulos puede venir con [{ ID_MODULO }] o [{ MODULO_ID_MODULO }]
      r.Modulos.some(
        (m) => (m.ID_MODULO || m.MODULO_ID_MODULO) === modulo.ID_MODULO
      )
  );

  if (reserva) {
    return (
      <td ref={dropRef} style={highlight} className="reservado">
        <div>
          <span className="detalle">{reserva.Examen?.NOMBRE_EXAMEN}</span>
          <span className="info-reserva">
            {reserva.Examen?.SECCION?.NOMBRE_SECCION}
          </span>
        </div>
      </td>
    );
  }

  const estaSel = modulosSeleccionados.some(
    (m) => m.fecha === fecha && m.numero === modulo.ORDEN
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
    const fetchData = async () => {
      try {
        const [salasRes, examRes, modRes, resRes] = await Promise.all([
          fetch('/api/salas'),
          fetch('/api/examenes'),
          fetch('/api/modulos'),
          fetch('/api/reservas'),
        ]);
        if (!salasRes.ok || !examRes.ok || !modRes.ok || !resRes.ok) {
          throw new Error('Error en la API');
        }
        const [salasData, examData, modData, resData] = await Promise.all([
          salasRes.json(),
          examRes.json(),
          modRes.json(),
          resRes.json(),
        ]);
        setSalas(salasData);
        setExamenes(examData);
        setModulos(modData);
        setReservas(resData);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const fechasDeLaSemana = useMemo(
    () => obtenerFechasDeLaSemana(fechaSeleccionada),
    [fechaSeleccionada]
  );

  // Filtrado de salas: CORREGIDO EDIFICIO.NOMBRE_EDIFICIO
  const filteredSalas = useMemo(
    () =>
      salas.filter(
        (s) =>
          s.COD_SALA.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.NOMBRE_SALA.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.CAPACIDAD_SALA.toString().includes(searchTerm) ||
          s.EDIFICIO?.NOMBRE_EDIFICIO.toLowerCase().includes(
            searchTerm.toLowerCase()
          )
      ),
    [salas, searchTerm]
  );

  // Filtrado de exámenes: CORREGIDO ESTADO_ID_ESTADO y CANTIDAD_MODULOS_EXAMEN
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
          ex.ESTADO_ID_ESTADO !== 3
      ),
    [examenes, searchTermExamen]
  );

  const handleSearch = (e) => setSearchTerm(e.target.value);
  const handleSearchExamen = (e) => setSearchTermExamen(e.target.value);

  const manejarSeleccionSala = useCallback((sala) => {
    setSelectedSala(sala);
    setModulosSeleccionados([]);
  }, []);

  const manejarSeleccionExamen = useCallback((ex) => {
    setSelectedExam((prev) => (prev?.ID_EXAMEN === ex.ID_EXAMEN ? null : ex));
    setModulosSeleccionados([]);
  }, []);

  const seleccionarModulo = useCallback(
    (fecha, numero) => {
      if (!selectedExam) {
        alert('Selecciona un examen primero');
        return;
      }
      setModulosSeleccionados((prev) => {
        if (prev.length && prev[0].fecha !== fecha) {
          alert('Solo módulos del mismo día. Se reinicia selección.');
          return [{ fecha, numero }];
        }
        const idx = prev.findIndex((m) => m.numero === numero);
        if (idx >= 0) return prev.filter((_, i) => i !== idx);
        if (prev.length >= selectedExam.CANTIDAD_MODULOS_EXAMEN) {
          alert(
            `Este examen requiere ${selectedExam.CANTIDAD_MODULOS_EXAMEN} módulos.`
          );
          return prev;
        }
        const nuevo = [...prev, { fecha, numero }].sort(
          (a, b) => a.numero - b.numero
        );
        if (nuevo.length > 1) {
          for (let i = 0; i < nuevo.length - 1; i++) {
            if (nuevo[i + 1].numero !== nuevo[i].numero + 1) {
              alert('Módulos no consecutivos. Se reinicia selección.');
              return [{ fecha, numero }];
            }
          }
        }
        return nuevo;
      });
    },
    [selectedExam]
  );

  // Construye el payload según tu esquema DB
  const crearEstructuraReserva = useCallback(() => {
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

  // Envía la reserva al back
  const enviarReserva = useCallback(async () => {
    const payload = crearEstructuraReserva();
    if (!payload) return;
    try {
      const res = await fetch('/api/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Error creando reserva');
      const nueva = await res.json();
      setReservas((prev) => [...prev, nueva]);
      setExamenes((prev) =>
        prev.map((e) =>
          e.ID_EXAMEN === nueva.EXAMEN_ID_EXAMEN
            ? { ...e, ESTADO_ID_ESTADO: 3 }
            : e
        )
      );
      setModulosSeleccionados([]);
      setSelectedExam(null);
      alert('Reserva creada exitosamente');
    } catch (err) {
      console.error(err);
      alert('No se pudo crear reserva');
    }
  }, [crearEstructuraReserva]);

  // Render
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
    <div className="agenda-container">
      <aside className="container-lateral">
        {/* … tu panel lateral para buscar sala/examen … */}
        <h2>Seleccionar Sala</h2>
        <input
          type="search"
          placeholder="Buscar Sala…"
          value={searchTerm}
          onChange={handleSearch}
        />
        <div className="search-box">
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
              {filteredSalas.map((s) => (
                <tr
                  key={s.ID_SALA}
                  className={
                    s.ID_SALA === selectedSala?.ID_SALA
                      ? 'fila-seleccionada'
                      : ''
                  }
                  onClick={() => manejarSeleccionSala(s)}
                >
                  <td>{s.COD_SALA}</td>
                  <td>{s.NOMBRE_SALA}</td>
                  <td>{s.EDIFICIO?.NOMBRE_EDIFICIO}</td>
                  <td>
                    <FaArrowCircleRight className="icono" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* … igual para exámenes … */}
      </aside>
      <main className="details-section">
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
                        Examen: {selectedExam.ASIGNATURA?.NOMBRE_ASIGNATURA} –{' '}
                        {selectedExam.SECCION?.NOMBRE_SECCION} (
                        {selectedExam.CANTIDAD_MODULOS_EXAMEN} módulos)
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
                selectedExam.CANTIDAD_MODULOS_EXAMEN && (
                <button onClick={enviarReserva}>Confirmar Reserva</button>
              )}
          </>
        ) : (
          <p className="aviso-seleccion">
            Selecciona una sala para ver disponibilidad.
          </p>
        )}
      </main>
    </div>
  );
}

export default AgendaSemanal;
