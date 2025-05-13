import React from 'react';

export default function ModuloTable({ modulos, selectedId, onSelectModule }) {
  const getId = (m) => m.id_modulo ?? m.ID_MODULO;

  return (
    <div
      className="table-responsive"
      style={{
        maxHeight: '600px',
        overflowY: 'auto',
        marginBottom: '1rem',
      }}
    >
      <table className="table table-bordered table-hover table-striped mb-0">
        <thead className="table-light position-sticky top-0">
          <tr>
            <th style={{ top: 0, zIndex: 1 }}>Orden</th>
            <th style={{ top: 0, zIndex: 1 }}>Nombre</th>
            <th style={{ top: 0, zIndex: 1 }}>Inicio</th>
            <th style={{ top: 0, zIndex: 1 }}>Fin</th>
          </tr>
        </thead>
        <tbody>
          {modulos
            .sort((a, b) => (a.orden ?? a.ORDEN) - (b.orden ?? b.ORDEN))
            .map((m) => {
              const id = getId(m);
              const isSel = selectedId === id;
              return (
                <tr
                  key={id}
                  onClick={() => onSelectModule(m)}
                  className={isSel ? 'table-primary text-white' : ''}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{m.orden ?? m.ORDEN}</td>
                  <td>{m.nombre_modulo ?? m.NOMBRE_MODULO}</td>
                  <td>{m.inicio_modulo ?? m.INICIO_MODULO}</td>
                  <td>{m.fin_modulo ?? m.FIN_MODULO}</td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}
