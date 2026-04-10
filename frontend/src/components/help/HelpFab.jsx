import React from 'react';
import HelpModal from './HelpModal';

/**
 * HelpFab — Botón flotante de ayuda (Fixed Action Button).
 * Se posiciona en la esquina inferior derecha de la página.
 *
 * Uso en una página principal:
 *   <HelpFab helpKey="gestion_reservas" />
 *
 * Props:
 *   helpKey   {string} — clave en helpConfig.js
 *   bottom    {number} — distancia desde abajo en px (default: 28)
 *   right     {number} — distancia desde la derecha en px (default: 28)
 */
export default function HelpFab({ helpKey, bottom = 28, right = 28 }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom,
        right,
        zIndex: 1040,
      }}
    >
      <HelpModal
        helpKey={helpKey}
        showLabel
        size="md"
        variant="warning"
        className="rounded-pill shadow px-3 py-2 fw-semibold"
      />
    </div>
  );
}
