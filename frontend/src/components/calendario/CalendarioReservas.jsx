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
    console.log('[CalendarioReservas] useEffect ejecutado, estadoCarga:', estadoCarga);
    
    // 3. Despachamos la acción correcta para cargar las reservas confirmadas
    if (estadoCarga === 'idle') {
      console.log('[CalendarioReservas] Despachando cargarReservasConfirmadas...');
      dispatch(cargarReservasConfirmadas());
    }

    const cargarModulos = async () => {
      try {
        setLoadingModulos(true);
        console.log('[CalendarioReservas] Cargando módulos...');
        const modulosData = await fetchAllModulos();
        setModulos(modulosData || []);
        console.log('[CalendarioReservas] Módulos cargados:', modulosData?.length || 0);
      } catch (err) {
        setErrorModulos('No se pudieron cargar los horarios del calendario.');
        console.error('[CalendarioReservas] Error cargando módulos:', err);
      } finally {
        setLoadingModulos(false);
      }
    };

    cargarModulos();
  }, [estadoCarga, dispatch]);

  // useEffect para monitorear cambios en las reservas
  useEffect(() => {
    console.log('[CalendarioReservas] Las reservas han cambiado:', {
      cantidad: reservas.length,
      estadoCarga,
      error: errorReservas,
      reservas: reservas
    });
  }, [reservas, estadoCarga, errorReservas]);

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
    // Manejar errores que pueden ser objetos o strings
    const errorMessage = typeof finalError === 'string' 
      ? finalError 
      : finalError?.message || finalError?.error || 'Error al cargar el calendario';
    
    console.log('[CalendarioReservas] Error detectado:', finalError);
    
    return (
      <div className="alert alert-danger text-center p-4">
        <p>{errorMessage}</p>
      </div>
    );
  }

  const reservasSemanales = reservas.filter((reserva) => {
    if (!reserva || !reserva.FECHA_RESERVA) return false;
    const fechaReservaString = reserva.FECHA_RESERVA.split('T')[0];
    return fechas.some((f) => f.fecha === fechaReservaString);
  });

  // Log de depuración para ver qué datos tenemos
  console.log('Estado de carga:', estadoCarga);
  console.log('Total de reservas:', reservas.length);
  console.log('Reservas semanales:', reservasSemanales.length);
  console.log('Reservas completas:', reservas);
  console.log('Fechas de la semana:', fechas);
  console.log('Token de autenticación:', localStorage.getItem('accessToken') ? 'Presente' : 'Ausente');
  console.log('Error en reservas:', errorReservas);

  const handlePrintPdf = () => {
    const element = calendarRef.current;
    if (!element) return;

    const dateForFilename = isValid(weekStartDate)
      ? weekStartDate
      : fechaSeleccionada;
    if (!isValid(dateForFilename)) {
      alert('Fecha inválida para generar PDF.');
      return;
    }

    // Solo ocultar los controles de navegación, mantener toda la visual original
    const tempStyle = document.createElement('style');
    tempStyle.textContent = `
      .printing-pdf .d-flex.justify-content-between {
        display: none !important;
      }
      .printing-pdf .table-wrapper {
        overflow: visible !important;
        height: auto !important;
        max-height: none !important;
      }
      .printing-pdf .calendar-table {
        table-layout: fixed !important;
        width: 100% !important;
      }
      .printing-pdf .calendar-table thead th {
        position: static !important;
        top: auto !important;
        z-index: auto !important;
        box-shadow: none !important;
      }
      .printing-pdf .orden-col {
        width: 40px !important;
        min-width: 40px !important;
        max-width: 40px !important;
        position: static !important;
        left: auto !important;
        z-index: auto !important;
        box-shadow: none !important;
      }
      .printing-pdf .horario-col {
        width: 80px !important;
        min-width: 80px !important;
        max-width: 80px !important;
        position: static !important;
        left: auto !important;
        z-index: auto !important;
        box-shadow: none !important;
      }
      .printing-pdf .calendar-header-cell {
        width: auto !important;
        max-width: none !important;
      }
      /* Forzar que los post-its ocupen todo el ancho en PDF */
      .printing-pdf .calendar-cell {
        position: relative !important;
        overflow: visible !important;
        padding: 0 !important;
        width: auto !important;
      }
      .printing-pdf .examen-post-it {
        width: 100% !important;
        left: 0 !important;
        right: 0 !important;
        position: absolute !important;
        top: 0 !important;
        bottom: 0 !important;
        box-sizing: border-box !important;
        margin: 0 !important;
        padding: 2px 4px !important;
      }
      .printing-pdf .examen-content {
        width: 100% !important;
        box-sizing: border-box !important;
        padding: 2px 4px !important;
      }
      .printing-pdf .examen-header,
      .printing-pdf .examen-info,
      .printing-pdf .examen-title {
        width: 100% !important;
        text-align: left !important;
      }
    `;
    document.head.appendChild(tempStyle);

    // Preparar el elemento para captura
    element.classList.add('printing-pdf');

    // Esperar un momento para que los estilos se apliquen
    setTimeout(() => {
      // Configuración para capturar exactamente lo que se ve en pantalla
      const opt = {
        margin: [8, 15, 8, 5], // [top, right, bottom, left] - más margen derecho, menos izquierdo
        filename: `calendario_examenes_${format(dateForFilename, 'yyyy-MM-dd')}.pdf`,
        image: {
          type: 'jpeg',
          quality: 0.98, // Alta calidad para conservar la visual
        },
        html2canvas: {
          scale: 1.2, // Escala moderada para mantener proporciones
          logging: false,
          dpi: 150,
          letterRendering: true,
          useCORS: true,
          allowTaint: false,
          scrollX: -10, // Desplazar ligeramente a la derecha
          scrollY: 0,
          foreignObjectRendering: false, // Desactivar para mejor compatibilidad con estilos CSS
          backgroundColor: '#ffffff',
          width: element.scrollWidth + 20, // Añadir un poco más de ancho
          height: element.scrollHeight, // Usar la altura real del elemento
          windowWidth: window.innerWidth + 20,
          windowHeight: window.innerHeight,
          removeContainer: false, // No remover contenedores para mantener estructura
          ignoreElements: function (element) {
            // No ignorar ningún elemento para asegurar captura completa
            return false;
          },
        },
        jsPDF: {
          unit: 'mm',
          format: 'a3', // A3 para que quepa el calendario completo
          orientation: 'landscape',
          compress: true,
        },
        pagebreak: {
          mode: 'avoid-all', // Evitar cortes de página
        },
      };

      html2pdf()
        .set(opt)
        .from(element)
        .save()
        .finally(() => {
          element.classList.remove('printing-pdf');
          document.head.removeChild(tempStyle);
        });
    }, 100); // Esperar 100ms para que los estilos se apliquen
  };

  return (
    <div className="agenda-semanal" ref={calendarRef}>
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
