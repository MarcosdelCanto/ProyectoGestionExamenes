import React, { useMemo, useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import bootstrap5Plugin from '@fullcalendar/bootstrap5';
import interactionPlugin from '@fullcalendar/interaction';
import { Card } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

// --- Función para generar los businessHours BASADA EN EL PENSUM ---
function getPensumScheduleBlocks() {
  const days = [1, 2, 3, 4, 5, 6];
  const pensumBlocksDefinition = [
    { startTime: '08:01:00', endTime: '08:40:00' },
    { startTime: '08:41:00', endTime: '09:20:00' },
    { startTime: '09:31:00', endTime: '10:10:00' },
    { startTime: '10:11:00', endTime: '10:50:00' },
    { startTime: '11:01:00', endTime: '11:40:00' },
    { startTime: '11:41:00', endTime: '12:20:00' },
    { startTime: '12:31:00', endTime: '13:10:00' },
    { startTime: '13:11:00', endTime: '13:50:00' },
    { startTime: '14:01:00', endTime: '14:40:00' },
    { startTime: '14:41:00', endTime: '15:20:00' },
    { startTime: '15:31:00', endTime: '16:10:00' },
    { startTime: '16:11:00', endTime: '16:50:00' },
    { startTime: '17:01:00', endTime: '17:40:00' },
    { startTime: '17:41:00', endTime: '18:20:00' },
    { startTime: '18:31:00', endTime: '19:00:00' },
    { startTime: '19:11:00', endTime: '19:50:00' },
    { startTime: '19:51:00', endTime: '20:30:00' },
    { startTime: '20:41:00', endTime: '21:20:00' },
    { startTime: '21:21:00', endTime: '22:00:00' },
    { startTime: '22:01:00', endTime: '22:50:00' },
    { startTime: '22:51:00', endTime: '23:30:00' },
  ];
  return pensumBlocksDefinition.map((block) => ({
    daysOfWeek: days,
    startTime: block.startTime,
    endTime: block.endTime,
  }));
}

// Función auxiliar para convertir "HH:MM:SS" a minutos desde la medianoche
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Función auxiliar para obtener la duración de un evento en milisegundos
const getEventDurationMs = (eventInstance, draggedEl) => {
  // Para eventos existentes de FullCalendar que se están moviendo (eventDrop)
  if (eventInstance && eventInstance.end && eventInstance.start) {
    // Asegurarse de que start y end sean objetos Date
    const startDate =
      typeof eventInstance.start === 'string'
        ? new Date(eventInstance.start)
        : eventInstance.start;
    const endDate =
      typeof eventInstance.end === 'string'
        ? new Date(eventInstance.end)
        : eventInstance.end;
    if (
      startDate instanceof Date &&
      endDate instanceof Date &&
      !isNaN(startDate) &&
      !isNaN(endDate)
    ) {
      return endDate.getTime() - startDate.getTime();
    }
  }
  // Para elementos arrastrados externamente (eventReceive)
  if (draggedEl && draggedEl.dataset.modulos) {
    return parseInt(draggedEl.dataset.modulos, 10) * 40 * 60 * 1000;
  }
  // Fallback si el evento ya está en el calendario y tiene la prop modulos (ej. después de un eventReceive)
  if (
    eventInstance &&
    eventInstance.extendedProps &&
    typeof eventInstance.extendedProps.modulos === 'number'
  ) {
    return eventInstance.extendedProps.modulos * 40 * 60 * 1000;
  }
  console.warn(
    'No se pudo determinar la duración del evento para:',
    eventInstance?.title || 'elemento arrastrado'
  );
  return 40 * 60 * 1000; // Fallback a 40 minutos
};

// --- Componente Principal del Calendario ---
export function AgendaSemanal() {
  const businessHoursData = useMemo(getPensumScheduleBlocks, []);
  const calendarRef = useRef(null);

  const [calendarEvents, setCalendarEvents] = useState([]);

  const calendarEventConstraint = {
    startTime: '08:01:00',
    endTime: '23:30:00',
    daysOfWeek: [1, 2, 3, 4, 5, 6],
  };

  const renderSlotLabelContent = (arg) => {
    const slotCellStartDate = arg.date;
    let slotDurationMs = 30 * 60 * 1000;
    if (
      arg.view &&
      arg.view.getCurrentData &&
      arg.view.getCurrentData().options &&
      arg.view.getCurrentData().options.slotDuration
    ) {
      slotDurationMs =
        arg.view.getCurrentData().options.slotDuration.milliseconds;
    }
    const slotCellEndDate = new Date(
      slotCellStartDate.getTime() + slotDurationMs
    );

    for (const pensumBlock of businessHoursData) {
      const [pbStartHour, pbStartMinute] = pensumBlock.startTime
        .split(':')
        .map(Number);
      const pensumBlockStartDate = new Date(slotCellStartDate);
      pensumBlockStartDate.setHours(pbStartHour, pbStartMinute, 0, 0);

      if (
        pensumBlockStartDate >= slotCellStartDate &&
        pensumBlockStartDate < slotCellEndDate
      ) {
        const labelDiv = document.createElement('div');
        labelDiv.className = 'custom-slot-label-range';
        labelDiv.innerText = `${pensumBlock.startTime.substring(0, 5)} - ${pensumBlock.endTime.substring(0, 5)}`;
        return { domNodes: [labelDiv] };
      }
    }
    return null;
  };

  const handleEventReceive = (info) => {
    const { title, backgroundColor, borderColor, textColor, extendedProps } =
      info.event;
    const droppedEventOriginalStart = info.event.start;
    const eventDurationMs = getEventDurationMs(null, info.draggedEl);

    if (
      !droppedEventOriginalStart ||
      isNaN(eventDurationMs) ||
      eventDurationMs <= 0
    ) {
      console.error(
        '[FullCalendar] Error: Datos de evento inválidos para el drop.'
      );
      return;
    }

    const dropHour = droppedEventOriginalStart.getHours();
    const dropMinute = droppedEventOriginalStart.getMinutes();
    const dropTimeInMinutes = dropHour * 60 + dropMinute;
    let adjustedEventStartString = null;

    for (const block of businessHoursData) {
      const blockEndTimeInMinutes = timeToMinutes(block.endTime);
      if (dropTimeInMinutes < blockEndTimeInMinutes) {
        adjustedEventStartString = block.startTime;
        break;
      }
    }
    if (!adjustedEventStartString && businessHoursData.length > 0) {
      adjustedEventStartString =
        businessHoursData[businessHoursData.length - 1].startTime;
    }
    if (!adjustedEventStartString) {
      console.error(
        "No se pudo determinar un 'adjustedEventStartString' para el nuevo evento. El evento no será añadido."
      );
      return;
    }

    const finalStartDate = new Date(droppedEventOriginalStart);
    const [startH, startM, startS] = adjustedEventStartString
      .split(':')
      .map(Number);
    finalStartDate.setHours(startH, startM, startS || 0, 0);
    const finalEndDate = new Date(finalStartDate.getTime() + eventDurationMs);

    const newEvent = {
      id: crypto.randomUUID(),
      title: title,
      start: finalStartDate.toISOString(),
      end: finalEndDate.toISOString(),
      backgroundColor: backgroundColor,
      borderColor: borderColor,
      textColor: textColor,
      extendedProps: extendedProps,
    };
    setCalendarEvents((prevEvents) => [...prevEvents, newEvent]);
  };

  const handleEventClick = (clickInfo) => {
    if (
      window.confirm(
        `¿Estás seguro de que quieres eliminar el evento '${clickInfo.event.title}'?`
      )
    ) {
      setCalendarEvents((prevEvents) =>
        prevEvents.filter((event) => event.id !== clickInfo.event.id)
      );
    }
  };

  const handleEventDrop = (info) => {
    const droppedEvent = info.event; // El evento con su nueva hora de inicio tentativa
    const proposedStartTime = droppedEvent.start;
    const eventDurationMs = getEventDurationMs(info.oldEvent, null); // Obtener duración del evento original

    if (!proposedStartTime || isNaN(eventDurationMs) || eventDurationMs <= 0) {
      console.error('Error: Datos inválidos para el eventDrop.');
      info.revert();
      return;
    }

    const dropHour = proposedStartTime.getHours();
    const dropMinute = proposedStartTime.getMinutes();
    const dropTimeInMinutes = dropHour * 60 + dropMinute;
    let adjustedEventStartString = null;

    for (const block of businessHoursData) {
      const blockEndTimeInMinutes = timeToMinutes(block.endTime);
      if (dropTimeInMinutes < blockEndTimeInMinutes) {
        adjustedEventStartString = block.startTime;
        break;
      }
    }
    if (!adjustedEventStartString && businessHoursData.length > 0) {
      adjustedEventStartString =
        businessHoursData[businessHoursData.length - 1].startTime;
    }

    if (!adjustedEventStartString) {
      console.warn(
        'No se pudo ajustar el evento movido a un bloque del pensum. Revirtiendo.'
      );
      info.revert();
      return;
    }

    const finalStartDate = new Date(proposedStartTime);
    const [startH, startM, startS] = adjustedEventStartString
      .split(':')
      .map(Number);
    finalStartDate.setHours(startH, startM, startS || 0, 0);
    const finalEndDate = new Date(finalStartDate.getTime() + eventDurationMs);

    setCalendarEvents((prevEvents) =>
      prevEvents.map((event) =>
        event.id === droppedEvent.id
          ? {
              ...event,
              start: finalStartDate.toISOString(),
              end: finalEndDate.toISOString(),
            }
          : event
      )
    );
  };

  const handleEventResize = (info) => {
    const eventBeingResized = info.event;
    const originalEventStart = new Date(eventBeingResized.startStr);
    const fcProposedEnd = new Date(eventBeingResized.endStr);

    if (fcProposedEnd <= originalEventStart) {
      console.warn(
        'Redimensión inválida: el fin es anterior o igual al inicio. Revirtiendo.'
      );
      info.revert();
      return;
    }

    const proposedEndInMinutes =
      fcProposedEnd.getHours() * 60 + fcProposedEnd.getMinutes();
    let newEventEndString = null;
    let containingOrPreviousBlockEndTime = null;

    for (const block of businessHoursData) {
      const blockStartTimeInMinutes = timeToMinutes(block.startTime);
      const blockEndTimeInMinutes = timeToMinutes(block.endTime);

      if (
        proposedEndInMinutes >= blockStartTimeInMinutes &&
        proposedEndInMinutes <= blockEndTimeInMinutes
      ) {
        containingOrPreviousBlockEndTime = block.endTime;
        break;
      } else if (proposedEndInMinutes < blockStartTimeInMinutes) {
        break;
      }
      containingOrPreviousBlockEndTime = block.endTime;
    }

    if (!containingOrPreviousBlockEndTime) {
      let foundFallback = false;
      for (const block of businessHoursData) {
        const blockEndTimeInMinutes = timeToMinutes(block.endTime);
        if (proposedEndInMinutes <= blockEndTimeInMinutes) {
          // Asegurarse que el inicio del evento sea antes que este fin de bloque de fallback
          if (
            originalEventStart.getHours() * 60 +
              originalEventStart.getMinutes() <
            blockEndTimeInMinutes
          ) {
            containingOrPreviousBlockEndTime = block.endTime;
            foundFallback = true;
            break;
          }
        }
      }
      if (!foundFallback) {
        console.warn(
          'No se pudo determinar un fin de bloque del pensum para ajustar la redimensión. Revirtiendo.'
        );
        info.revert();
        return;
      }
    }

    newEventEndString = containingOrPreviousBlockEndTime;

    const finalEndDate = new Date(originalEventStart);
    const [endH, endM, endS] = newEventEndString.split(':').map(Number);
    finalEndDate.setHours(endH, endM, endS || 0, 0);

    if (finalEndDate <= originalEventStart) {
      console.warn(
        'La hora de finalización ajustada es anterior o igual a la hora de inicio. Revirtiendo redimensión.'
      );
      info.revert();
      return;
    }

    setCalendarEvents((prevEvents) =>
      prevEvents.map((event) =>
        event.id === eventBeingResized.id
          ? { ...event, end: finalEndDate.toISOString() }
          : event
      )
    );
  };

  return (
    <>
      <Card
        className="mx-auto my-4 shadow-lg"
        style={{ maxWidth: '1024px', borderRadius: '1rem', overflow: 'hidden' }}
      >
        <Card.Header
          className="text-center text-white py-3"
          style={{
            background: 'linear-gradient(135deg, #4e73df 0%, #224abe 100%)',
            borderTopLeftRadius: '1rem',
            borderTopRightRadius: '1rem',
            borderBottom: 'none',
          }}
        >
          <h2 className="mb-1" style={{ fontWeight: '300' }}>
            Reservas Semanales
          </h2>
          <small style={{ fontWeight: '300' }}>
            08:01 – 23:30 | Lunes a Sábado
          </small>
        </Card.Header>
        <Card.Body style={{ padding: '0' }}>
          <FullCalendar
            ref={calendarRef}
            plugins={[timeGridPlugin, bootstrap5Plugin, interactionPlugin]}
            initialView="timeGridWeek"
            locale="es"
            themeSystem="bootstrap5"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'timeGridWeek,timeGridDay',
            }}
            slotDuration="00:30:00"
            slotLabelInterval="00:30:00"
            snapDuration="00:40:00" // Ajuste visual cada 10 min (relativo a 08:01), la lógica de drop/receive ajusta al bloque.
            slotMinTime="08:01:00"
            slotMaxTime="23:30:00"
            allDaySlot={false}
            height={700}
            events={calendarEvents}
            businessHours={businessHoursData}
            editable={true}
            droppable={true}
            eventOverlap={false}
            eventConstraint={calendarEventConstraint}
            eventReceive={handleEventReceive}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            hiddenDays={[0]}
            slotLabelContent={renderSlotLabelContent}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: false,
              hour12: false,
            }}
            eventDurationEditable={true}
            dragScroll={true}
            weekends={true}
          />
        </Card.Body>
      </Card>
    </>
  );
}

export default AgendaSemanal;
