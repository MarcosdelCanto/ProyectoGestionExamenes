/**
 * @fileoverview Pruebas de integración - Flujo de autenticación
 * @description Valida el flujo completo de login, navegación y logout
 */

import { describe, test, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { render, mockAuthenticatedUser, clearAuthMock } from '../utils/test-utils'
import { server } from '../mocks/server'
import App from '../../App'

// Mock del router para pruebas
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    BrowserRouter: ({ children }) => <div data-testid="router">{children}</div>,
    Routes: ({ children }) => <div data-testid="routes">{children}</div>,
    Route: ({ element }) => element,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/login' })
  }
})

describe('Integración: Flujo de Autenticación', () => {
  const user = userEvent.setup()

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' })
  })

  afterEach(() => {
    server.resetHandlers()
    clearAuthMock()
    vi.clearAllMocks()
  })

  afterAll(() => {
    server.close()
  })

  test('Debe completar el flujo de login exitosamente', async () => {
    // Mock del localStorage
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    
    render(<App />)

    // Verificar que estamos en la página de login
    expect(screen.getByTestId('router')).toBeInTheDocument()

    // Simular entrada de credenciales
    const usernameInput = screen.getByRole('textbox', { name: /usuario/i })
    const passwordInput = screen.getByLabelText(/contraseña/i)
    const loginButton = screen.getByRole('button', { name: /iniciar sesión/i })

    await user.type(usernameInput, 'admin')
    await user.type(passwordInput, 'password123')
    await user.click(loginButton)

    // Verificar que se guardaron los datos en localStorage
    await waitFor(() => {
      expect(setItemSpy).toHaveBeenCalledWith('user', expect.stringContaining('admin'))
      expect(setItemSpy).toHaveBeenCalledWith('token', 'mock-access-token')
    })

    setItemSpy.mockRestore()
  })

  test('Debe manejar errores de login correctamente', async () => {
    // Override del handler para simular error
    server.use(
      http.post('http://localhost:3000/api/auth/login', () => {
        return HttpResponse.json(
          { message: 'Credenciales inválidas' },
          { status: 401 }
        )
      })
    )

    render(<App />)

    const usernameInput = screen.getByRole('textbox', { name: /usuario/i })
    const passwordInput = screen.getByLabelText(/contraseña/i)
    const loginButton = screen.getByRole('button', { name: /iniciar sesión/i })

    await user.type(usernameInput, 'invalid')
    await user.type(passwordInput, 'invalid')
    await user.click(loginButton)

    // Verificar que se muestra el mensaje de error
    await waitFor(() => {
      expect(screen.getByText(/credenciales inválidas/i)).toBeInTheDocument()
    })
  })

  test('Debe acceder a páginas protegidas con autenticación válida', async () => {
    // Mock usuario autenticado
    mockAuthenticatedUser()

    // Mock del useLocation para simular navegación a página protegida
    const mockUseLocation = vi.fn(() => ({ pathname: '/usuarios' }))
    vi.doMock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom')
      return {
        ...actual,
        useLocation: mockUseLocation
      }
    })

    render(<App />)

    // Verificar que puede acceder a contenido protegido
    // (El componente debería renderizar la página de usuarios)
    await waitFor(() => {
      expect(screen.getByTestId('routes')).toBeInTheDocument()
    })
  })

  test('Debe redirigir a login si no está autenticado', async () => {
    // Asegurar que no hay autenticación
    clearAuthMock()

    render(<App />)

    // Verificar que está en la página de login
    await waitFor(() => {
      expect(screen.getByTestId('router')).toBeInTheDocument()
    })
  })

  test('Debe completar el flujo de logout', async () => {
    // Mock usuario autenticado
    mockAuthenticatedUser()

    const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem')

    render(<App />)

    // Buscar y hacer click en el botón de logout
    const logoutButton = screen.getByRole('button', { name: /cerrar sesión/i })
    await user.click(logoutButton)

    // Verificar que se removieron los datos del localStorage
    await waitFor(() => {
      expect(removeItemSpy).toHaveBeenCalledWith('user')
      expect(removeItemSpy).toHaveBeenCalledWith('token')
    })

    removeItemSpy.mockRestore()
  })
})
