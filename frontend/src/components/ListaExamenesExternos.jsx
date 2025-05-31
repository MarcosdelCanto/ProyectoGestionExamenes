import React, { useEffect, useRef } from 'react';
import { Card } from 'react-bootstrap';
import { Draggable } from '@fullcalendar/interaction';

function ListaExamenesExternos({ examenes }) {
  const elRef = useRef(null);

  useEffect(() => {
    let draggableInstance = null;
    const currentEl = elRef.current;
    if (currentEl) {
      if (!currentEl.getAttribute('data-draggable-initialized')) {
        draggableInstance = new Draggable(currentEl, {
          itemSelector: '.examen-draggable',
          eventData: function (eventEl) {
            const modulos = parseInt(eventEl.dataset.modulos, 10);
            const duracionMinutos = modulos * 40;
            return {
              title: eventEl.dataset.title,
              duration: { minutes: duracionMinutos },
              backgroundColor: eventEl.dataset.colorhex,
              borderColor: eventEl.dataset.colorhex,
              textColor: eventEl.dataset.textcolorhex,
              create: true,
              extendedProps: {
                examenId: eventEl.dataset.id,
                modulos: modulos,
                origen: 'externo',
              },
            };
          },
        });
        currentEl.setAttribute('data-draggable-initialized', 'true');
      }
    }
    return () => {
      if (draggableInstance) {
        draggableInstance.destroy();
      }
      if (currentEl && currentEl.getAttribute('data-draggable-initialized')) {
        if (draggableInstance) {
          currentEl.removeAttribute('data-draggable-initialized');
        }
      }
    };
  }, [examenes]);

  return (
    <Card className="mb-4 shadow-sm">
      <Card.Header
        style={{
          background: 'linear-gradient(135deg, #6f42c1 0%, #4a2c82 100%)',
          color: 'white',
        }}
      >
        <h5 className="mb-0">Exámenes Disponibles</h5>
        <small>Arrastra un examen al calendario</small>
      </Card.Header>
      <Card.Body
        ref={elRef}
        id="lista-examenes-externos"
        style={{ maxHeight: '250px', overflowY: 'auto', padding: '10px' }}
      >
        {examenes.map((examen) => (
          <div
            className="examen-draggable"
            key={examen.ID_EXAMEN}
            data-id={examen.ID_EXAMEN}
            data-title={examen.NOMBRE_EXAMEN}
            data-modulos={examen.CANTIDAD_MODULOS_EXAMEN}
            data-colorhex={examen.COLOR_HEX || '#0d6efd'}
            data-textcolorhex={examen.TEXT_COLOR_HEX || '#ffffff'}
            style={{
              padding: '10px 12px',
              margin: '8px 0',
              borderRadius: '0.375rem',
              cursor: 'grab',
              backgroundColor: examen.COLOR_HEX || '#0d6efd',
              color: examen.TEXT_COLOR_HEX || '#ffffff',
              fontSize: '0.9rem',
              fontWeight: '500',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              userSelect: 'none',
            }}
          >
            {examen.NOMBRE_EXAMEN} ({examen.CANTIDAD_MODULOS_EXAMEN}
            {examen.CANTIDAD_MODULOS_EXAMEN === 1 ? 'módulo' : 'módulos'})
          </div>
        ))}
      </Card.Body>
    </Card>
  );
}

export default ListaExamenesExternos;
