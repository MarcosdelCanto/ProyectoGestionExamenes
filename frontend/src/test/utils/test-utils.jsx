/**
 * @fileoverview Utilidades de testing para React Components
 * @description Wrappers personalizados para Testing Library con providers
 */

import React from 'react'
import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { configureStore } from '@reduxjs/toolkit'

// Import your store slices here (adjust paths as needed)
// import authReducer from '../store/authSlice'
// import usersReducer from '../store/usersSlice'

/**
 * Crea un store mock para testing
 */
function createMockStore(initialState = {}) {
  return configureStore({
    reducer: {
      // Add your reducers here
      auth: (state = { user: null, token: null, isAuthenticated: false }, action) => state,
      users: (state = { users: [], loading: false, error: null }, action) => state,
      examenes: (state = { examenes: [], loading: false, error: null }, action) => state,
      salas: (state = { salas: [], loading: false, error: null }, action) => state,
      reservas: (state = { reservas: [], loading: false, error: null }, action) => state,
      ...initialState
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  })
}

/**
 * Wrapper que incluye todos los providers necesarios
 */
function AllTheProviders({ children, initialState = {}, initialEntries = ['/'] }) {
  const store = createMockStore(initialState)

  return (
    <Provider store={store}>
      <BrowserRouter>
        <DndProvider backend={HTML5Backend}>
          {children}
        </DndProvider>
      </BrowserRouter>
    </Provider>
  )
}

/**
 * Render personalizado que incluye todos los providers
 */
function customRender(ui, options = {}) {
  const { initialState, initialEntries, ...renderOptions } = options

  return render(ui, {
    wrapper: (props) => <AllTheProviders {...props} initialState={initialState} initialEntries={initialEntries} />,
    ...renderOptions,
  })
}

/**
 * Render para componentes que requieren autenticación
 */
function renderWithAuth(ui, options = {}) {
  const authState = {
    auth: {
      user: {
        id: 1,
        username: 'admin',
        email: 'admin@test.com',
        role: 'admin'
      },
      token: 'mock-token',
      isAuthenticated: true
    }
  }

  return customRender(ui, {
    initialState: authState,
    ...options
  })
}

/**
 * Render para casos específicos de páginas
 */
function renderWithStore(ui, { preloadedState = {}, store = createMockStore(preloadedState), ...renderOptions } = {}) {
  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <BrowserRouter>
          <DndProvider backend={HTML5Backend}>
            {children}
          </DndProvider>
        </BrowserRouter>
      </Provider>
    )
  }
  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

/**
 * Espera a que un elemento aparezca con timeout personalizado
 */
async function waitForElementToBeRemoved(element, options = {}) {
  const { timeout = 5000 } = options
  const { waitForElementToBeRemoved: originalWait } = await import('@testing-library/react')
  return originalWait(element, { timeout, ...options })
}

/**
 * Simula un usuario autenticado en localStorage
 */
function mockAuthenticatedUser(user = {
  id: 1,
  username: 'admin',
  email: 'admin@test.com',
  role: 'admin'
}) {
  localStorage.setItem('user', JSON.stringify(user))
  localStorage.setItem('token', 'mock-token')
}

/**
 * Limpia la autenticación mock
 */
function clearAuthMock() {
  localStorage.removeItem('user')
  localStorage.removeItem('token')
}

/**
 * Crea datos mock para testing
 */
const mockData = {
  user: {
    ID_USUARIO: 1,
    NOMBRE_USUARIO: 'admin',
    EMAIL: 'admin@test.com',
    ID_ROL: 1,
    NOMBRE_ROL: 'admin',
    ESTADO: 'activo'
  },
  users: [
    {
      ID_USUARIO: 1,
      NOMBRE_USUARIO: 'admin',
      EMAIL: 'admin@test.com',
      ID_ROL: 1,
      NOMBRE_ROL: 'admin',
      ESTADO: 'activo'
    },
    {
      ID_USUARIO: 2,
      NOMBRE_USUARIO: 'profesor1',
      EMAIL: 'profesor1@test.com',
      ID_ROL: 2,
      NOMBRE_ROL: 'profesor',
      ESTADO: 'activo'
    }
  ],
  examenes: [
    {
      ID_EXAMEN: 1,
      NOMBRE: 'Examen Final Matemáticas',
      DESCRIPCION: 'Examen final del curso',
      FECHA_INICIO: '2025-07-01T09:00:00Z',
      FECHA_FIN: '2025-07-01T11:00:00Z',
      ID_ASIGNATURA: 1,
      NOMBRE_ASIGNATURA: 'Matemáticas'
    }
  ],
  salas: [
    {
      ID_SALA: 1,
      NOMBRE: 'Aula 101',
      CAPACIDAD: 30,
      UBICACION: 'Edificio A, Piso 1',
      ESTADO: 'disponible'
    }
  ]
}

// Re-export everything
export * from '@testing-library/react'

// Override render method
export {
  customRender as render,
  renderWithAuth,
  renderWithStore,
  mockAuthenticatedUser,
  clearAuthMock,
  mockData,
  createMockStore,
  waitForElementToBeRemoved
}
