// filepath: /Users/citt/Documents/GitHub/ProyectoGestionExamenes/frontend/src/test/setup.js
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom'; // Importación correcta

// No es necesario extend porque @testing-library/jest-dom se autoconfigura
// cuando es importado directamente

// Ejecutar limpieza después de cada test
afterEach(() => {
  cleanup();
});
