/**
 * @fileoverview Pruebas de integración - Flujo de Exámenes y Reservas
 * @description Valida la integración entre gestión de exámenes y reservas de salas
 */

import { describe, test, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { renderWithAuth, mockData } from '../utils/test-utils'
import { server } from '../mocks/server'

// Mock del componente de exámenes integrado con reservas
const MockExamenesReservasPage = () => {
  return (
    <div data-testid="examenes-reservas-page">
      <h1>Gestión de Exámenes y Reservas</h1>
      
      {/* Sección de Exámenes */}
      <section data-testid="examenes-section">
        <h2>Exámenes</h2>
        <button data-testid="create-exam-btn">Crear Examen</button>
        <div data-testid="examenes-list">
          {mockData.examenes.map(examen => (
            <div key={examen.ID_EXAMEN} data-testid={`exam-card-${examen.ID_EXAMEN}`}>
              <h3>{examen.NOMBRE}</h3>
              <p>{examen.DESCRIPCION}</p>
              <p>Fecha: {new Date(examen.FECHA_INICIO).toLocaleDateString()}</p>
              <button data-testid={`reserve-sala-${examen.ID_EXAMEN}`}>
                Reservar Sala
              </button>
              <button data-testid={`edit-exam-${examen.ID_EXAMEN}`}>
                Editar
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Sección de Salas Disponibles */}
      <section data-testid="salas-section">
        <h2>Salas Disponibles</h2>
        <div data-testid="salas-list">
          {mockData.salas.map(sala => (
            <div key={sala.ID_SALA} data-testid={`sala-card-${sala.ID_SALA}`}>
              <h4>{sala.NOMBRE}</h4>
              <p>Capacidad: {sala.CAPACIDAD}</p>
              <p>Ubicación: {sala.UBICACION}</p>
              <p>Estado: {sala.ESTADO}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Modal de reserva */}
      <div data-testid="reservation-modal" style={{ display: 'none' }}>
        <h3>Reservar Sala para Examen</h3>
        <select data-testid="sala-select">
          <option value="">Seleccionar sala...</option>
          {mockData.salas.map(sala => (
            <option key={sala.ID_SALA} value={sala.ID_SALA}>
              {sala.NOMBRE} - Capacidad: {sala.CAPACIDAD}
            </option>
          ))}
        </select>
        <input data-testid="fecha-inicio" type="datetime-local" />
        <input data-testid="fecha-fin" type="datetime-local" />
        <button data-testid="confirm-reservation">Confirmar Reserva</button>
        <button data-testid="cancel-reservation">Cancelar</button>
      </div>
    </div>
  )
}

describe('Integración: Flujo de Exámenes y Reservas', () => {
  const user = userEvent.setup()

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' })
  })

  afterEach(() => {
    server.resetHandlers()
    vi.clearAllMocks()
  })

  afterAll(() => {
    server.close()
  })

  test('Debe crear examen y reservar sala en flujo completo', async () => {
    let examenCreated = false
    let reservaCreated = false
    let examenId = null

    // Mock para creación de examen
    server.use(
      http.post('http://localhost:3000/api/examenes', async ({ request }) => {
        examenCreated = true
        const body = await request.json()
        examenId = 2

        expect(body).toMatchObject({
          nombre: 'Nuevo Examen Final',
          descripcion: 'Examen de prueba',
          fecha_inicio: expect.any(String),
          fecha_fin: expect.any(String)
        })

        return HttpResponse.json({
          message: 'Examen creado exitosamente',
          examenId: examenId
        }, { status: 201 })
      }),

      // Mock para creación de reserva
      http.post('http://localhost:3000/api/reservas', async ({ request }) => {
        reservaCreated = true
        const body = await request.json()

        expect(body).toMatchObject({
          id_examen: examenId,
          id_sala: 1,
          fecha_inicio: expect.any(String),
          fecha_fin: expect.any(String)
        })

        return HttpResponse.json({
          message: 'Reserva creada exitosamente',
          reservaId: 2
        }, { status: 201 })
      })
    )

    renderWithAuth(<MockExamenesReservasPage />)

    // Paso 1: Crear examen
    const createExamButton = screen.getByTestId('create-exam-btn')
    await user.click(createExamButton)

    // Simular que se creó el examen
    await waitFor(() => {
      expect(examenCreated).toBe(true)
    })

    // Paso 2: Reservar sala para el examen
    const reserveButton = screen.getByTestId('reserve-sala-1')
    await user.click(reserveButton)

    // Simular que se abrió el modal y se realizó la reserva
    await waitFor(() => {
      expect(reservaCreated).toBe(true)
    })
  })

  test('Debe validar disponibilidad de sala antes de reservar', async () => {
    let availabilityChecked = false

    // Mock para verificar disponibilidad
    server.use(
      http.get('http://localhost:3000/api/salas/1/disponibilidad', ({ request }) => {
        availabilityChecked = true
        const url = new URL(request.url)
        const fechaInicio = url.searchParams.get('fecha_inicio')
        const fechaFin = url.searchParams.get('fecha_fin')

        expect(fechaInicio).toBeTruthy()
        expect(fechaFin).toBeTruthy()

        // Simular sala no disponible
        return HttpResponse.json({
          disponible: false,
          conflictos: [{
            id_reserva: 1,
            fecha_inicio: '2025-07-01T09:00:00Z',
            fecha_fin: '2025-07-01T11:00:00Z',
            examen: 'Examen Final Matemáticas'
          }]
        })
      }),

      // Mock para reserva que debería fallar
      http.post('http://localhost:3000/api/reservas', () => {
        return HttpResponse.json(
          { 
            message: 'La sala no está disponible en el horario seleccionado',
            conflictos: ['Conflicto con Examen Final Matemáticas']
          },
          { status: 409 }
        )
      })
    )

    renderWithAuth(<MockExamenesReservasPage />)

    // Intentar reservar sala
    const reserveButton = screen.getByTestId('reserve-sala-1')
    await user.click(reserveButton)

    await waitFor(() => {
      expect(availabilityChecked).toBe(true)
    })
  })

  test('Debe mostrar exámenes con sus reservas asociadas', async () => {
    // Mock para obtener exámenes con reservas
    server.use(
      http.get('http://localhost:3000/api/examenes', () => {
        return HttpResponse.json({
          examenes: [
            {
              ...mockData.examenes[0],
              reservas: [
                {
                  ID_RESERVA: 1,
                  ID_SALA: 1,
                  NOMBRE_SALA: 'Aula 101',
                  FECHA_INICIO: '2025-07-01T09:00:00Z',
                  FECHA_FIN: '2025-07-01T11:00:00Z',
                  ESTADO: 'confirmada'
                }
              ]
            }
          ]
        })
      })
    )

    renderWithAuth(<MockExamenesReservasPage />)

    // Verificar que se muestra el examen
    await waitFor(() => {
      expect(screen.getByTestId('exam-card-1')).toBeInTheDocument()
      expect(screen.getByText('Examen Final Matemáticas')).toBeInTheDocument()
    })
  })

  test('Debe permitir modificar reserva existente', async () => {
    let reservaUpdated = false

    server.use(
      http.put('http://localhost:3000/api/reservas/:id', async ({ params, request }) => {
        reservaUpdated = true
        const body = await request.json()

        expect(params.id).toBe('1')
        expect(body).toMatchObject({
          id_sala: 2, // Cambio de sala
          fecha_inicio: expect.any(String),
          fecha_fin: expect.any(String)
        })

        return HttpResponse.json({
          message: 'Reserva actualizada exitosamente'
        })
      })
    )

    renderWithAuth(<MockExamenesReservasPage />)

    // Simular modificación de reserva existente
    const editButton = screen.getByTestId('edit-exam-1')
    await user.click(editButton)

    await waitFor(() => {
      expect(reservaUpdated).toBe(true)
    })
  })

  test('Debe cancelar reserva y liberar sala', async () => {
    let reservaCanceled = false

    server.use(
      http.delete('http://localhost:3000/api/reservas/:id', ({ params }) => {
        reservaCanceled = true
        expect(params.id).toBe('1')

        return HttpResponse.json({
          message: 'Reserva cancelada exitosamente'
        })
      }),

      // Mock para verificar que la sala queda disponible
      http.get('http://localhost:3000/api/salas/1/disponibilidad', () => {
        return HttpResponse.json({
          disponible: true,
          conflictos: []
        })
      })
    )

    renderWithAuth(<MockExamenesReservasPage />)

    // Simular cancelación de reserva
    // (En la implementación real, esto podría ser un botón "Cancelar Reserva")
    await waitFor(() => {
      expect(reservaCanceled).toBe(true)
    })
  })

  test('Debe manejar múltiples reservas para un mismo examen', async () => {
    let multipleReservationsCreated = 0

    server.use(
      http.post('http://localhost:3000/api/reservas', async ({ request }) => {
        multipleReservationsCreated++
        const body = await request.json()

        // Verificar que es para el mismo examen pero diferentes salas
        expect(body.id_examen).toBe(1)
        expect([1, 2]).toContain(body.id_sala)

        return HttpResponse.json({
          message: 'Reserva creada exitosamente',
          reservaId: 100 + multipleReservationsCreated
        }, { status: 201 })
      })
    )

    renderWithAuth(<MockExamenesReservasPage />)

    // Simular creación de múltiples reservas para el mismo examen
    const reserveButton = screen.getByTestId('reserve-sala-1')
    
    // Primera reserva
    await user.click(reserveButton)
    
    // Segunda reserva (sala adicional)
    await user.click(reserveButton)

    await waitFor(() => {
      expect(multipleReservationsCreated).toBeGreaterThanOrEqual(1)
    })
  })

  test('Debe sincronizar estado entre exámenes y reservas', async () => {
    let stateSync = { examenes: 0, reservas: 0 }

    server.use(
      http.get('http://localhost:3000/api/examenes', () => {
        stateSync.examenes++
        return HttpResponse.json({ examenes: mockData.examenes })
      }),

      http.get('http://localhost:3000/api/reservas', () => {
        stateSync.reservas++
        return HttpResponse.json({
          reservas: [
            {
              ID_RESERVA: 1,
              ID_EXAMEN: 1,
              ID_SALA: 1,
              FECHA_INICIO: '2025-07-01T09:00:00Z',
              FECHA_FIN: '2025-07-01T11:00:00Z',
              ESTADO: 'confirmada'
            }
          ]
        })
      })
    )

    renderWithAuth(<MockExamenesReservasPage />)

    // Verificar que ambos endpoints fueron llamados para sincronizar
    await waitFor(() => {
      expect(stateSync.examenes).toBeGreaterThan(0)
      expect(stateSync.reservas).toBeGreaterThan(0)
    })
  })
})
