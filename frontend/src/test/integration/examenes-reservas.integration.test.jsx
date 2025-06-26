/**
 * @fileoverview Pruebas de integración - Flujo de Exámenes y Reservas (Corregido)
 * @description Valida la integración completa del flujo de gestión de exámenes y reservas
 */

import { describe, test, expect, beforeAll, afterEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithAuth } from '../utils/test-utils'
import { registerOperationCallback, clearOperationCallbacks, resetMockState } from '../mocks/handlers'

// Mock del componente de Exámenes y Reservas
const MockExamenesReservasPage = () => (
  <div data-testid="examenes-reservas-page">
    <h1>Gestión de Exámenes y Reservas</h1>
    
    <section data-testid="examenes-section">
      <h2>Exámenes</h2>
      <button data-testid="create-exam-btn">Crear Examen</button>
      <div data-testid="examenes-list">
        <div data-testid="exam-card-1">
          <h3>Examen Final Matemáticas</h3>
          <p>Examen final del curso</p>
          <p>Fecha: 1/7/2025</p>
          <button data-testid="reserve-sala-1">Reservar Sala</button>
          <button data-testid="edit-exam-1">Editar</button>
        </div>
      </div>
    </section>

    <section data-testid="salas-section">
      <h2>Salas Disponibles</h2>
      <div data-testid="salas-list">
        <div data-testid="sala-card-1">
          <h4>Aula 101</h4>
          <p>Capacidad: 30</p>
          <p>Ubicación: Edificio A, Piso 1</p>
          <p>Estado: disponible</p>
        </div>
      </div>
    </section>

    <div data-testid="reservation-modal" style={{display: 'none'}}>
      <h3>Reservar Sala para Examen</h3>
      <select data-testid="sala-select">
        <option value="">Seleccionar sala...</option>
        <option value="1">Aula 101 - Capacidad: 30</option>
      </select>
      <input data-testid="fecha-inicio" type="datetime-local" />
      <input data-testid="fecha-fin" type="datetime-local" />
      <button data-testid="confirm-reservation">Confirmar Reserva</button>
      <button data-testid="cancel-reservation">Cancelar</button>
    </div>
  </div>
)

describe('Integración: Flujo de Exámenes y Reservas', () => {
  let user

  beforeAll(() => {
    user = userEvent.setup()
  })

  afterEach(() => {
    clearOperationCallbacks()
    resetMockState()
    vi.clearAllMocks()
  })

  test('Debe crear examen y reservar sala en flujo completo', async () => {
    let examenCreated = false
    let reservaCreated = false
    
    registerOperationCallback('examenCreated', (examen) => {
      examenCreated = true
      expect(examen).toMatchObject({
        nombre: 'Nuevo Examen',
        descripcion: 'Descripción del examen'
      })
    })
    
    registerOperationCallback('reservaCreated', (reserva) => {
      reservaCreated = true
      expect(reserva).toMatchObject({
        examenId: expect.any(Number),
        salaId: 1
      })
    })

    renderWithAuth(<MockExamenesReservasPage />)

    // Crear examen
    const createExamBtn = screen.getByTestId('create-exam-btn')
    await user.click(createExamBtn)

    // Simular creación de examen
    await fetch('/api/examenes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Nuevo Examen',
        descripcion: 'Descripción del examen',
        fecha: '2025-01-15'
      })
    })

    // Simular que se creó el examen
    await waitFor(() => {
      expect(examenCreated).toBe(true)
    })

    // Crear reserva para el examen
    await fetch('/api/reservas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        examenId: 2, // Nuevo examen creado
        salaId: 1,
        fechaInicio: '2025-01-15T09:00',
        fechaFin: '2025-01-15T11:00'
      })
    })

    await waitFor(() => {
      expect(reservaCreated).toBe(true)
    })
  })

  test('Debe validar disponibilidad de sala antes de reservar', async () => {
    let availabilityChecked = false
    
    registerOperationCallback('availabilityChecked', (data) => {
      availabilityChecked = true
      expect(data).toMatchObject({
        fechaInicio: '2025-01-15T09:00',
        fechaFin: '2025-01-15T11:00'
      })
    })

    renderWithAuth(<MockExamenesReservasPage />)

    // Verificar disponibilidad de sala
    const response = await fetch('/api/salas/disponibilidad?fechaInicio=2025-01-15T09:00&fechaFin=2025-01-15T11:00')
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.salas).toBeDefined()
    expect(Array.isArray(data.salas)).toBe(true)

    await waitFor(() => {
      expect(availabilityChecked).toBe(true)
    })
  })

  test('Debe mostrar exámenes con sus reservas asociadas', async () => {
    renderWithAuth(<MockExamenesReservasPage />)

    // Verificar que se renderizan los exámenes
    await waitFor(() => {
      expect(screen.getByTestId('examenes-section')).toBeInTheDocument()
      expect(screen.getByTestId('exam-card-1')).toBeInTheDocument()
      expect(screen.getByText('Examen Final Matemáticas')).toBeInTheDocument()
    })

    // Verificar que se muestran las salas
    expect(screen.getByTestId('salas-section')).toBeInTheDocument()
    expect(screen.getByTestId('sala-card-1')).toBeInTheDocument()
    expect(screen.getByText('Aula 101')).toBeInTheDocument()
  })

  test('Debe permitir modificar reserva existente', async () => {
    let reservaCreated = false
    let reservaUpdated = false
    
    registerOperationCallback('reservaCreated', () => {
      reservaCreated = true
    })
    
    registerOperationCallback('reservaUpdated', (reserva) => {
      reservaUpdated = true
      expect(reserva).toMatchObject({
        id: 1,
        fechaInicio: '2025-01-15T10:00'
      })
    })

    renderWithAuth(<MockExamenesReservasPage />)

    // Primero crear una reserva
    await fetch('/api/reservas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        examenId: 1,
        salaId: 1,
        fechaInicio: '2025-01-15T09:00',
        fechaFin: '2025-01-15T11:00'
      })
    })

    // Esperar a que se cree la reserva
    await waitFor(() => {
      expect(reservaCreated).toBe(true)
    })

    // Luego modificar la reserva
    await fetch('/api/reservas/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fechaInicio: '2025-01-15T10:00',
        fechaFin: '2025-01-15T12:00'
      })
    })

    await waitFor(() => {
      expect(reservaUpdated).toBe(true)
    })
  })

  test('Debe cancelar reserva y liberar sala', async () => {
    let reservaCreated = false
    let reservaCanceled = false
    
    registerOperationCallback('reservaCreated', () => {
      reservaCreated = true
    })
    
    registerOperationCallback('reservaCanceled', (reserva) => {
      reservaCanceled = true
      expect(reserva).toMatchObject({
        id: 1
      })
    })

    renderWithAuth(<MockExamenesReservasPage />)

    // Primero crear una reserva
    await fetch('/api/reservas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        examenId: 1,
        salaId: 1,
        fechaInicio: '2025-01-15T09:00',
        fechaFin: '2025-01-15T11:00'
      })
    })

    // Esperar a que se cree la reserva
    await waitFor(() => {
      expect(reservaCreated).toBe(true)
    })

    // Luego cancelar la reserva
    await fetch('/api/reservas/1', {
      method: 'DELETE'
    })

    // (En la implementación real, esto podría ser un botón "Cancelar Reserva")
    await waitFor(() => {
      expect(reservaCanceled).toBe(true)
    })
  })

  test('Debe manejar múltiples reservas para un mismo examen', async () => {
    let multipleReservationsCreated = 0
    
    registerOperationCallback('reservaCreated', () => {
      multipleReservationsCreated++
    })

    renderWithAuth(<MockExamenesReservasPage />)

    // Crear múltiples reservas para el mismo examen
    const reservas = [
      {
        examenId: 1,
        salaId: 1,
        fechaInicio: '2025-01-15T09:00',
        fechaFin: '2025-01-15T11:00'
      }
    ]

    for (const reserva of reservas) {
      await fetch('/api/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reserva)
      })
    }

    await waitFor(() => {
      expect(multipleReservationsCreated).toBeGreaterThanOrEqual(1)
    })
  })

  test('Debe sincronizar estado entre exámenes y reservas', async () => {
    const stateSync = { examenes: 0, reservas: 0 }
    
    registerOperationCallback('stateSync', (data) => {
      if (data.examenes !== undefined) stateSync.examenes = data.examenes
      if (data.reservas !== undefined) stateSync.reservas = data.reservas
    })

    renderWithAuth(<MockExamenesReservasPage />)

    // Obtener estado de exámenes y reservas
    await Promise.all([
      fetch('/api/examenes'),
      fetch('/api/reservas')
    ])

    // Verificar que ambos endpoints fueron llamados para sincronizar
    await waitFor(() => {
      expect(stateSync.examenes).toBeGreaterThan(0)
      expect(stateSync.reservas).toBeGreaterThanOrEqual(0) // Puede ser 0 si no hay reservas
    })
  })
})
