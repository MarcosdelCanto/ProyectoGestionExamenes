import React, { useRef } from 'react'; // Importar useRef
import { Spinner } from 'react-bootstrap';
import { format, isValid } from 'date-fns'; // Importar isValid para validación de fechas
import html2pdf from 'html2pdf.js'; // Importar html2pdf

import { useDateManagement } from '../../hooks/useDateManagement';
import { useUserReservations } from '../../hooks/useUserReservations';

import CalendarHeader from './CalendarHeader';
import ReservaPostIt from './ReservaPostIt'; // <-- 1. Usar el nuevo componente de solo lectura

import './styles/AgendaSemanal.css'; // Reutilizamos estilos

export default function CalendarioReservas() {
  // Se utiliza el hook dedicado para encapsular toda la lógica de obtención de datos.
  const { reservas, modulos, isLoading, error } = useUserReservations();
  // Referencia para el elemento del DOM que queremos imprimir
  const calendarRef = useRef(null);

  const {
    fechas,
    fechaSeleccionada,
    handleDateChange,
    goToToday,
    weekStartDate,
  } = useDateManagement();

  if (isLoading) {
    return (
      <div className="text-center p-4">
        <Spinner animation="border" />
        <p>Cargando calendario...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger text-center p-4">
        <p>No se pudieron cargar sus reservas. Por favor, intente más tarde.</p>
      </div>
    );
  }

  // Filtrar reservas para la semana actual
  // Se corrige la lógica para evitar problemas de zona horaria.
  // En lugar de comparar objetos Date, se compara el string de la fecha (YYYY-MM-DD).
  const reservasSemanales = reservas.filter((reserva) => {
    // Extrae la parte de la fecha del string ISO (ej: "2025-06-24")
    const fechaReservaString = reserva.FECHA_RESERVA.split('T')[0];
    // Comprueba si esta fecha está presente en los días de la semana que se están mostrando.
    return fechas.some((f) => f.fecha === fechaReservaString);
  });

  // Función para generar el PDF
  const handlePrintPdf = () => {
    const element = calendarRef.current;
    if (!element) {
      console.error('No se encontró el elemento del calendario para imprimir.');
      return;
    }

    // Se busca el contenedor de la tabla para modificar sus estilos temporalmente
    const scrollableContainer = element.querySelector(
      '.table-wrapper-readonly'
    );
    if (!scrollableContainer) {
      console.error('No se encontró el contenedor de la tabla para imprimir.');
      return;
    }

    // Determinar la fecha a usar para el nombre del archivo.
    // Se prefiere weekStartDate, pero si es inválida, se usa fechaSeleccionada como fallback.
    const dateForFilename = isValid(weekStartDate)
      ? weekStartDate
      : fechaSeleccionada;

    // Si ninguna de las fechas es válida, se muestra un error y se detiene la impresión.
    if (!isValid(dateForFilename)) {
      console.error(
        'Error al imprimir: No se pudo obtener una fecha válida para el nombre del archivo PDF.',
        { weekStartDate, fechaSeleccionada } // Loguear ambas para depuración
      );
      alert(
        'No se puede generar el PDF porque la fecha actual o seleccionada es inválida. ' +
          'Por favor, asegúrese de que la fecha en el calendario sea correcta.'
      );
      return;
    }

    const opt = {
      margin: 0.5, // Margen en pulgadas
      filename: `reservas_semanales_${format(dateForFilename, 'yyyy-MM-dd')}.pdf`, // Usar la fecha válida determinada
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, logging: true, dpi: 192, letterRendering: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }, // Orientación horizontal
    };

    // Se añade una clase para anular los estilos de scroll antes de imprimir
    scrollableContainer.classList.add('printing-pdf');

    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .finally(() => {
        // Se elimina la clase para restaurar los estilos de scroll después de imprimir
        scrollableContainer.classList.remove('printing-pdf');
      });
  };

  // Estilos para el contenedor principal, asegurando que esté centrado y con margen.
  const containerStyle = {
    maxWidth: '1200px',
    margin: '2rem auto', // '2rem' para margen vertical, 'auto' para centrado horizontal.
  };

  return (
    <div className="agenda-semanal" style={containerStyle} ref={calendarRef}>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h5 className="mb-0">Mis Próximas Reservas Confirmadas</h5>
        <div className="d-flex align-items-center gap-2">
          {' '}
          {/* Contenedor para agrupar input de fecha y botones */}
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
                const dateString = e.target.value;
                // Se añade T00:00:00 para evitar problemas de zona horaria y se valida
                // que el string no esté vacío antes de crear la fecha.
                if (dateString)
                  handleDateChange(new Date(`${dateString}T00:00:00`));
              }}
            />
            <button className="btn btn-outline-secondary" onClick={goToToday}>
              Hoy
            </button>
          </div>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={handlePrintPdf}
            title="Imprimir en PDF"
          >
            <i className="bi bi-printer"></i> {/* Icono de impresora */}
          </button>
        </div>
      </div>

      <div className="table-wrapper-readonly">
        <table className="calendar-table">
          <CalendarHeader fechas={fechas} />
          <tbody>
            {modulos.map((modulo) => (
              <tr key={modulo.ID_MODULO}>
                <td className="orden-col">{modulo.ORDEN}</td>
                <td className="horario-col">
                  {modulo.INICIO_MODULO} - {modulo.FIN_MODULO}
                </td>
                {fechas.map(({ fecha }) => {
                  const reservaEnCelda = reservasSemanales.find((r) => {
                    // Se corrige la comparación para evitar problemas de zona horaria.
                    // Se compara directamente la parte de la fecha del string.
                    const esMismaFecha =
                      r.FECHA_RESERVA.split('T')[0] === fecha;
                    // La API devuelve los IDs de los módulos como un string separado por comas.
                    // Se convierte a un array de números para poder buscar.
                    const modulosDeReserva = r.MODULOS_IDS
                      ? r.MODULOS_IDS.split(',').map(Number)
                      : [];
                    return (
                      esMismaFecha &&
                      modulosDeReserva.includes(modulo.ID_MODULO)
                    );
                  });

                  if (reservaEnCelda) {
                    // Para dibujar el post-it solo una vez, se obtiene el ID del primer módulo de la reserva.
                    const primerModuloId = reservaEnCelda.MODULOS_IDS
                      ? Number(reservaEnCelda.MODULOS_IDS.split(',')[0])
                      : null;

                    // Si el módulo actual no es el primero de la reserva, se renderiza una celda vacía.
                    if (modulo.ID_MODULO !== primerModuloId)
                      return (
                        <td
                          key={fecha}
                          className="calendar-cell part-of-examen"
                        ></td>
                      );
                  }

                  // Se calcula la cantidad de módulos para determinar la altura del post-it.
                  const modulosCount = reservaEnCelda?.MODULOS_IDS
                    ? reservaEnCelda.MODULOS_IDS.split(',').length
                    : 0;

                  return (
                    <td
                      key={fecha}
                      className={`calendar-cell ${reservaEnCelda ? 'reservado con-examen' : ''}`}
                    >
                      {reservaEnCelda && (
                        <ReservaPostIt // <-- 2. Renderizar el nuevo componente
                          reserva={reservaEnCelda}
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
