/**
 * @fileoverview Configuración de Mock Service Worker para Node.js
 * @description Configura MSW para interceptar requests HTTP en el entorno de testing
 */

import { setupServer } from 'msw/node'
import { handlers } from './handlers.js'

// Configura el servidor mock
export const server = setupServer(...handlers)
