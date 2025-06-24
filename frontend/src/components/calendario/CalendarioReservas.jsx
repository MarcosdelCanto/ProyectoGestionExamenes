// src/components/calendario/CalendarioReservas.jsx

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Spinner, Alert, Button } from 'react-bootstrap';
import { format, isValid } from 'date-fns';
import html2pdf from 'html2pdf.js';

// --- IMPORTACIONES DE REDUX CORREGIDAS ---
import { useDispatch, useSelector } from 'react-redux';
// 1. Importamos la acción correcta desde el NUEVO archivo de la slice
import { cargarReservasConfirmadas } from '../../store/reservasConfirmadasSlice';

// --- IMPORTACIONES DE SERVICIOS Y HOOKS ---
import { useDateManagement } from '../../hooks/useDateManagement';
import { fetchAllModulos } from '../../services/moduloService';
import CalendarHeader from './CalendarHeader';
import ReservaPostIt from './ReservaPostIt';

// --- IMPORTACIÓN DE ESTILOS ---
import './styles/AgendaSemanal.css';

export default function CalendarioReservas() {
  const dispatch = useDispatch();
  const calendarRef = useRef(null);

  // --- OBTENER DATOS DESDE LA SLICE CORRECTA ---
  // 2. Apuntamos useSelector a 'state.reservasConfirmadas'
  const {
    lista: reservas,
    estadoCarga,
    error: errorReservas,
  } = useSelector((state) => state.reservasConfirmadas);

  // --- ESTADO LOCAL PARA MÓDULOS (sin cambios) ---
  const [modulos, setModulos] = useState([]);
  const [loadingModulos, setLoadingModulos] = useState(true);
  const [errorModulos, setErrorModulos] = useState(null);

  // --- LÓGICA DE CARGA DE DATOS (useEffect MODIFICADO) ---
  useEffect(() => {
    // 3. Despachamos la acción correcta para cargar las reservas confirmadas
    if (estadoCarga === 'idle') {
      dispatch(cargarReservasConfirmadas());
    }

    const cargarModulos = async () => {
      try {
        setLoadingModulos(true);
        const modulosData = await fetchAllModulos();
        setModulos(modulosData || []);
      } catch (err) {
        setErrorModulos('No se pudieron cargar los horarios del calendario.');
        console.error('Error cargando módulos:', err);
      } finally {
        setLoadingModulos(false);
      }
    };

    cargarModulos();
  }, [estadoCarga, dispatch]);

  const {
    fechas,
    fechaSeleccionada,
    handleDateChange,
    goToToday,
    weekStartDate,
  } = useDateManagement();

  const isLoading = estadoCarga === 'loading' || loadingModulos;
  const finalError = errorReservas || errorModulos; // Combinar ambos posibles errores

  if (isLoading) {
    return (
      <div className="text-center p-4">
        <Spinner animation="border" />
        <p>Cargando calendario...</p>
      </div>
    );
  }

  if (finalError) {
    return (
      <div className="alert alert-danger text-center p-4">
        <p>{finalError}</p>
      </div>
    );
  }

  const reservasSemanales = reservas.filter((reserva) => {
    if (!reserva || !reserva.FECHA_RESERVA) return false;
    const fechaReservaString = reserva.FECHA_RESERVA.split('T')[0];
    return fechas.some((f) => f.fecha === fechaReservaString);
  });

  const handlePrintPdf = () => {
    const element = calendarRef.current;
    if (!element) return;
    const scrollableContainer = element.querySelector(
      '.table-wrapper-readonly'
    );
    if (!scrollableContainer) return;
    const dateForFilename = isValid(weekStartDate)
      ? weekStartDate
      : fechaSeleccionada;
    if (!isValid(dateForFilename)) {
      alert('Fecha inválida para generar PDF.');
      return;
    }
    scrollableContainer.classList.add('printing-pdf');
    const contentWidth = element.scrollWidth;
    const contentHeight = element.scrollHeight;
    const printableWidth = (11 - 1) * 192;
    const printableHeight = (8.5 - 1) * 192;
    const scaleX = printableWidth / contentWidth;
    const scaleY = printableHeight / contentHeight;
    const finalScale = Math.min(scaleX, scaleY) * 0.72;
    const opt = {
      margin: 0.5,
      filename: `reservas_semanales_${format(dateForFilename, 'yyyy-MM-dd')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: finalScale,
        logging: true,
        dpi: 192,
        letterRendering: true,
      },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' },
      pagebreak: { mode: 'avoid-all' },
    };
    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .finally(() => {
        scrollableContainer.classList.remove('printing-pdf');
      });
  };

  const containerStyle = {
    maxWidth: '1200px',
    margin: '1rem auto',
  };

  return (
    <div className="agenda-semanal" style={containerStyle} ref={calendarRef}>
      <div className="d-flex justify-content-between align-items-center m-2 mt-0">
        <h3 className="display-7">Mi Calendario de Exámenes</h3>
        <div className="d-flex align-items-center gap-1">
          <div className="input-group input-group-sm w-auto">
            <input
              type="date"
              className="form-control"
              value={
                isValid(fechaSeleccionada)
                  ? format(fechaSeleccionada, 'yyyy-MM-dd')
                  : ''
              }
              onChange={(e) => {
                if (e.target.value)
                  handleDateChange(new Date(`${e.target.value}T00:00:00`));
              }}
            />
            <Button variant="outline-secondary" onClick={goToToday}>
              Hoy
            </Button>
          </div>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={handlePrintPdf}
            title="Imprimir en PDF"
          >
            <i className="bi bi-printer"></i>
          </Button>
        </div>
      </div>

      <div className="table-wrapper-readonly m-2">
        <table className="calendar-table">
          <CalendarHeader fechas={fechas} />
          <tbody>
            {(modulos || []).map((modulo) => (
              <tr key={modulo.ID_MODULO}>
                <td className="orden-col">{modulo.ORDEN}</td>
                <td className="horario-col p-1">
                  {modulo.INICIO_MODULO} - {modulo.FIN_MODULO}
                </td>
                {fechas.map(({ fecha }) => {
                  const reservaEnCelda = reservasSemanales.find((r) => {
                    if (!r || !r.FECHA_RESERVA) return false;
                    const esMismaFecha =
                      r.FECHA_RESERVA.split('T')[0] === fecha;
                    const modulosDeReserva =
                      r.MODULOS?.map((m) => m.ID_MODULO) ||
                      (r.MODULOS_IDS
                        ? r.MODULOS_IDS.split(',').map(Number)
                        : []);
                    return (
                      esMismaFecha &&
                      modulosDeReserva.includes(modulo.ID_MODULO)
                    );
                  });

                  let primerModuloId = null;
                  let modulosCount = 0;

                  if (reservaEnCelda) {
                    const modulosDeReserva = reservaEnCelda.MODULOS
                      ? [...reservaEnCelda.MODULOS].sort(
                          (a, b) => a.ORDEN - b.ORDEN
                        )
                      : [];
                    modulosCount =
                      modulosDeReserva.length ||
                      (reservaEnCelda.MODULOS_IDS
                        ? reservaEnCelda.MODULOS_IDS.split(',').length
                        : 1);

                    if (modulosDeReserva.length > 0) {
                      primerModuloId = modulosDeReserva[0].ID_MODULO;
                    } else if (reservaEnCelda.MODULOS_IDS) {
                      const ordenes = modulos
                        .filter((m) =>
                          reservaEnCelda.MODULOS_IDS.split(',')
                            .map(Number)
                            .includes(m.ID_MODULO)
                        )
                        .sort((a, b) => a.ORDEN - b.ORDEN);
                      if (ordenes.length > 0) {
                        primerModuloId = ordenes[0].ID_MODULO;
                      }
                    }
                  }

                  if (reservaEnCelda && modulo.ID_MODULO !== primerModuloId) {
                    return (
                      <td
                        key={fecha}
                        className="calendar-cell part-of-examen"
                      ></td>
                    );
                  }

                  return (
                    <td
                      key={fecha}
                      className={`calendar-cell ${reservaEnCelda ? 'reservado con-examen' : ''}`}
                    >
                      {reservaEnCelda && (
                        <ReservaPostIt
                          reserva={reservaEnCelda}
                          modulosCount={modulosCount}
                          style={{
                            position: 'absolute',
                            width: '100%',
                            zIndex: 1,
                          }}
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
