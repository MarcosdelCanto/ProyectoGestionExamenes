/**
 * @fileoverview Configuración global para pruebas de React
 * @description Setup de Testing Library y mocks globales
 */

import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { server } from './mocks/server'

// Configurar MSW
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())
afterEach(() => server.resetHandlers())

// Crear elemento root para React Modal antes de cada test
beforeEach(() => {
  // Crear elemento root si no existe
  if (!document.getElementById('root')) {
    const rootElement = document.createElement('div')
    rootElement.setAttribute('id', 'root')
    document.body.appendChild(rootElement)
  }
})

// Cleanup después de cada prueba
afterEach(() => {
  cleanup()
  // Limpiar el DOM
  const rootElement = document.getElementById('root')
  if (rootElement) {
    rootElement.remove()
  }
})

// Mock de fetch global
global.fetch = vi.fn()

// Mock de localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock

// Mock de sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.sessionStorage = sessionStorageMock

// Mock de window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock de ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock de IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Configurar variables de entorno para testing
beforeAll(() => {
  process.env.NODE_ENV = 'test'
  process.env.VITE_API_BASE_URL = 'http://localhost:3000/api'
})
