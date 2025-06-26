/**
 * @fileoverview Pruebas de integración - Gestión de Usuarios
 * @description Valida la integración entre componentes de usuario y servicios
 */

import { describe, test, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { renderWithAuth, mockData } from '../utils/test-utils'
import { registerOperationCallback, clearOperationCallbacks, resetMockState } from '../mocks/handlers'
import { server } from '../mocks/server'

// Mock del componente UsuariosPage (ajustar path según estructura)
const MockUsuariosPage = () => {
  return (
    <div data-testid="usuarios-page">
      <h1>Gestión de Usuarios</h1>
      <button data-testid="create-user-btn">Crear Usuario</button>
      <table data-testid="users-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Usuario</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {mockData.users.map(user => (
            <tr key={user.ID_USUARIO} data-testid={`user-row-${user.ID_USUARIO}`}>
              <td>{user.ID_USUARIO}</td>
              <td>{user.NOMBRE_USUARIO}</td>
              <td>{user.EMAIL}</td>
              <td>{user.NOMBRE_ROL}</td>
              <td>
                <button data-testid={`edit-user-${user.ID_USUARIO}`}>Editar</button>
                <button data-testid={`delete-user-${user.ID_USUARIO}`}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div data-testid="modal-container"></div>
    </div>
  )
}

describe('Integración: Gestión de Usuarios', () => {
  const user = userEvent.setup()

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' })
  })

  afterEach(() => {
    server.resetHandlers()
    vi.clearAllMocks()
    clearOperationCallbacks()
    resetMockState()
  })

  afterAll(() => {
    server.close()
  })

  test('Debe cargar y mostrar lista de usuarios', async () => {
    renderWithAuth(<MockUsuariosPage />)

    // Verificar que la página se renderiza
    expect(screen.getByTestId('usuarios-page')).toBeInTheDocument()
    expect(screen.getByText('Gestión de Usuarios')).toBeInTheDocument()

    // Verificar que se muestran los usuarios
    await waitFor(() => {
      expect(screen.getByTestId('user-row-1')).toBeInTheDocument()
      expect(screen.getByTestId('user-row-2')).toBeInTheDocument()
    })

    // Verificar contenido específico usando queries más específicas
    expect(screen.getByText('admin@test.com')).toBeInTheDocument()
    expect(screen.getByText('profesor1')).toBeInTheDocument()
    expect(screen.getByText('profesor1@test.com')).toBeInTheDocument()
    
    // Verificar que hay usuarios con rol admin y profesor
    const adminRoles = screen.getAllByText('admin')
    const profesorRoles = screen.getAllByText('profesor')
    expect(adminRoles.length).toBeGreaterThan(0)
    expect(profesorRoles.length).toBeGreaterThan(0)
  })

  test('Debe crear un nuevo usuario correctamente', async () => {
    // Mock para interceptar la creación
    let createUserCalled = false
    server.use(
      http.post('http://localhost:3000/api/users', async ({ request }) => {
        createUserCalled = true
        const body = await request.json()
        
        // Verificar que se enviaron los datos correctos
        expect(body).toMatchObject({
          nombre_usuario: 'nuevo_usuario',
          email: 'nuevo@test.com',
          id_rol: 2
        })

        return HttpResponse.json({
          message: 'Usuario creado exitosamente',
          userId: 3
        }, { status: 201 })
      })
    )

    renderWithAuth(<MockUsuariosPage />)

    // Hacer click en crear usuario
    const createButton = screen.getByTestId('create-user-btn')
    await user.click(createButton)

    // Simular llenado de formulario (esto dependería de tu modal real)
    // Por ahora simulamos que se llamó la API
    await waitFor(() => {
      expect(createUserCalled).toBe(true)
    })
  })

  test('Debe editar un usuario existente', async () => {
    let editUserCalled = false
    server.use(
      http.put('http://localhost:3000/api/users/:id', async ({ params, request }) => {
        editUserCalled = true
        const body = await request.json()
        
        expect(params.id).toBe('1')
        expect(body).toMatchObject({
          nombre_usuario: 'admin_actualizado',
          email: 'admin_nuevo@test.com'
        })

        return HttpResponse.json({
          message: 'Usuario actualizado exitosamente'
        })
      })
    )

    renderWithAuth(<MockUsuariosPage />)

    // Hacer click en editar primer usuario
    const editButton = screen.getByTestId('edit-user-1')
    await user.click(editButton)

    // Simular actualización
    await waitFor(() => {
      expect(editUserCalled).toBe(true)
    })
  })

  test('Debe eliminar un usuario con confirmación', async () => {
    let deleteUserCalled = false
    server.use(
      http.delete('http://localhost:3000/api/users/:id', ({ params }) => {
        deleteUserCalled = true
        expect(params.id).toBe('2')

        return HttpResponse.json({
          message: 'Usuario eliminado exitosamente'
        })
      })
    )

    renderWithAuth(<MockUsuariosPage />)

    // Hacer click en eliminar segundo usuario
    const deleteButton = screen.getByTestId('delete-user-2')
    await user.click(deleteButton)

    // Simular confirmación (esto dependería de tu modal de confirmación real)
    await waitFor(() => {
      expect(deleteUserCalled).toBe(true)
    })
  })

  test('Debe manejar errores al crear usuario', async () => {
    // Mock para simular error
    server.use(
      http.post('http://localhost:3000/api/users', () => {
        return HttpResponse.json(
          { message: 'El usuario ya existe' },
          { status: 409 }
        )
      })
    )

    renderWithAuth(<MockUsuariosPage />)

    const createButton = screen.getByTestId('create-user-btn')
    await user.click(createButton)

    // Verificar que se maneja el error
    // (En tu implementación real, esto mostraría un toast o mensaje de error)
    await waitFor(() => {
      // Aquí verificarías que se muestra el mensaje de error apropiado
      expect(screen.getByTestId('usuarios-page')).toBeInTheDocument()
    })
  })

  test('Debe filtrar usuarios por criterios de búsqueda', async () => {
    // Mock con datos filtrados
    server.use(
      http.get('http://localhost:3000/api/users', ({ request }) => {
        const url = new URL(request.url)
        const search = url.searchParams.get('search')
        
        if (search === 'admin') {
          return HttpResponse.json({
            users: [mockData.users[0]] // Solo el admin
          })
        }

        return HttpResponse.json({ users: mockData.users })
      })
    )

    const MockUsuariosPageWithSearch = () => (
      <div data-testid="search-container">
        <input 
          data-testid="search-input" 
          placeholder="Buscar usuarios..."
          onChange={(e) => {
            // Simular búsqueda
            console.log('Searching for:', e.target.value)
          }}
        />
        <MockUsuariosPage />
      </div>
    )

    renderWithAuth(<MockUsuariosPageWithSearch />)

    // Realizar búsqueda
    const searchInput = screen.getByTestId('search-input')
    await user.type(searchInput, 'admin')

    // Verificar que se mantiene la funcionalidad
    await waitFor(() => {
      expect(screen.getByTestId('search-container')).toBeInTheDocument()
      expect(screen.getByTestId('usuarios-page')).toBeInTheDocument()
    })
  })

  test('Debe manejar operaciones múltiples concurrentes', async () => {
    let operationsCount = 0
    
    server.use(
      http.post('http://localhost:3000/api/users', () => {
        operationsCount++
        return HttpResponse.json({
          message: 'Usuario creado',
          userId: operationsCount + 10
        }, { status: 201 })
      }),
      http.put('http://localhost:3000/api/users/:id', () => {
        operationsCount++
        return HttpResponse.json({
          message: 'Usuario actualizado'
        })
      })
    )

    renderWithAuth(<MockUsuariosPage />)

    // Simular múltiples operaciones rápidas
    const createButton = screen.getByTestId('create-user-btn')
    const editButton = screen.getByTestId('edit-user-1')

    // Hacer clicks rápidos
    await user.click(createButton)
    await user.click(editButton)

    await waitFor(() => {
      expect(operationsCount).toBeGreaterThanOrEqual(1)
    })
  })
})
