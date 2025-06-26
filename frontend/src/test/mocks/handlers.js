import { http, HttpResponse } from 'msw'

// Estado simulado de la aplicación
let mockState = {
  users: [
    { id: 1, username: 'admin', email: 'admin@test.com', rol: 'admin' },
    { id: 2, username: 'profesor1', email: 'profesor1@test.com', rol: 'profesor' }
  ],
  examenes: [
    { 
      id: 1, 
      nombre: 'Examen Final Matemáticas', 
      descripcion: 'Examen final del curso',
      fecha: '2025-01-07',
      reservas: []
    }
  ],
  salas: [
    { 
      id: 1, 
      nombre: 'Aula 101', 
      capacidad: 30, 
      ubicacion: 'Edificio A, Piso 1',
      estado: 'disponible' 
    }
  ],
  reservas: [],
  nextUserId: 3,
  nextExamenId: 2,
  nextReservaId: 1
}

// Callbacks para tracking de operaciones en tests
let operationCallbacks = {
  userCreated: [],
  userUpdated: [],
  userDeleted: [],
  examenCreated: [],
  reservaCreated: [],
  reservaUpdated: [],
  reservaCanceled: [],
  availabilityChecked: [],
  stateSync: []
}

// Función para registrar callbacks
export const registerOperationCallback = (operation, callback) => {
  if (operationCallbacks[operation]) {
    operationCallbacks[operation].push(callback)
  }
}

// Función para limpiar callbacks
export const clearOperationCallbacks = () => {
  Object.keys(operationCallbacks).forEach(key => {
    operationCallbacks[key] = []
  })
}

// Función para resetear el estado
export const resetMockState = () => {
  mockState = {
    users: [
      { id: 1, username: 'admin', email: 'admin@test.com', rol: 'admin' },
      { id: 2, username: 'profesor1', email: 'profesor1@test.com', rol: 'profesor' }
    ],
    examenes: [
      { 
        id: 1, 
        nombre: 'Examen Final Matemáticas', 
        descripcion: 'Examen final del curso',
        fecha: '2025-01-07',
        reservas: []
      }
    ],
    salas: [
      { 
        id: 1, 
        nombre: 'Aula 101', 
        capacidad: 30, 
        ubicacion: 'Edificio A, Piso 1',
        estado: 'disponible' 
      }
    ],
    reservas: [],
    nextUserId: 3,
    nextExamenId: 2,
    nextReservaId: 1
  }
}

const triggerCallbacks = (operation, data) => {
  operationCallbacks[operation]?.forEach(callback => callback(data))
}

export const handlers = [
  // Autenticación
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json()
    if (body.username === 'admin' && body.password === 'admin') {
      return HttpResponse.json({
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
        user: { id: 1, username: 'admin', rol: 'admin' }
      })
    }
    return new HttpResponse(null, { status: 401 })
  }),

  // Usuarios
  http.get('/api/users', ({ request }) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('search')
    
    let filteredUsers = mockState.users
    if (search) {
      filteredUsers = mockState.users.filter(user => 
        user.username.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
      )
    }
    
    return HttpResponse.json({ users: filteredUsers })
  }),

  http.post('/api/users', async ({ request }) => {
    const body = await request.json()
    const newUser = {
      id: mockState.nextUserId++,
      ...body
    }
    mockState.users.push(newUser)
    
    triggerCallbacks('userCreated', newUser)
    
    return HttpResponse.json(newUser, { status: 201 })
  }),

  http.put('/api/users/:id', async ({ params, request }) => {
    const body = await request.json()
    const userId = parseInt(params.id)
    const userIndex = mockState.users.findIndex(u => u.id === userId)
    
    if (userIndex === -1) {
      return new HttpResponse(null, { status: 404 })
    }
    
    mockState.users[userIndex] = { ...mockState.users[userIndex], ...body }
    
    triggerCallbacks('userUpdated', mockState.users[userIndex])
    
    return HttpResponse.json(mockState.users[userIndex])
  }),

  http.delete('/api/users/:id', ({ params }) => {
    const userId = parseInt(params.id)
    const userIndex = mockState.users.findIndex(u => u.id === userId)
    
    if (userIndex === -1) {
      return new HttpResponse(null, { status: 404 })
    }
    
    const deletedUser = mockState.users.splice(userIndex, 1)[0]
    
    triggerCallbacks('userDeleted', deletedUser)
    
    return HttpResponse.json({ message: 'Usuario eliminado correctamente' })
  }),

  // Exámenes
  http.get('/api/examenes', () => {
    triggerCallbacks('stateSync', { examenes: mockState.examenes.length })
    return HttpResponse.json({ examenes: mockState.examenes })
  }),

  http.post('/api/examenes', async ({ request }) => {
    const body = await request.json()
    const newExamen = {
      id: mockState.nextExamenId++,
      ...body,
      reservas: []
    }
    mockState.examenes.push(newExamen)
    
    triggerCallbacks('examenCreated', newExamen)
    
    return HttpResponse.json(newExamen, { status: 201 })
  }),

  // Salas
  http.get('/api/salas', () => {
    return HttpResponse.json({ salas: mockState.salas })
  }),

  http.get('/api/salas/disponibilidad', ({ request }) => {
    const url = new URL(request.url)
    const fechaInicio = url.searchParams.get('fechaInicio')
    const fechaFin = url.searchParams.get('fechaFin')
    
    triggerCallbacks('availabilityChecked', { fechaInicio, fechaFin })
    
    // Simular verificación de disponibilidad
    const salasDisponibles = mockState.salas.filter(sala => sala.estado === 'disponible')
    
    return HttpResponse.json({ salas: salasDisponibles })
  }),

  // Reservas
  http.get('/api/reservas', () => {
    triggerCallbacks('stateSync', { reservas: mockState.reservas.length })
    return HttpResponse.json({ reservas: mockState.reservas })
  }),

  http.post('/api/reservas', async ({ request }) => {
    const body = await request.json()
    const newReserva = {
      id: mockState.nextReservaId++,
      ...body,
      fechaCreacion: new Date().toISOString()
    }
    mockState.reservas.push(newReserva)
    
    // Actualizar el estado de la sala
    const sala = mockState.salas.find(s => s.id === body.salaId)
    if (sala) {
      sala.estado = 'reservada'
    }
    
    triggerCallbacks('reservaCreated', newReserva)
    
    return HttpResponse.json(newReserva, { status: 201 })
  }),

  http.put('/api/reservas/:id', async ({ params, request }) => {
    const body = await request.json()
    const reservaId = parseInt(params.id)
    const reservaIndex = mockState.reservas.findIndex(r => r.id === reservaId)
    
    if (reservaIndex === -1) {
      return new HttpResponse(null, { status: 404 })
    }
    
    mockState.reservas[reservaIndex] = { ...mockState.reservas[reservaIndex], ...body }
    
    triggerCallbacks('reservaUpdated', mockState.reservas[reservaIndex])
    
    return HttpResponse.json(mockState.reservas[reservaIndex])
  }),

  http.delete('/api/reservas/:id', ({ params }) => {
    const reservaId = parseInt(params.id)
    const reservaIndex = mockState.reservas.findIndex(r => r.id === reservaId)
    
    if (reservaIndex === -1) {
      return new HttpResponse(null, { status: 404 })
    }
    
    const deletedReserva = mockState.reservas.splice(reservaIndex, 1)[0]
    
    // Liberar la sala
    const sala = mockState.salas.find(s => s.id === deletedReserva.salaId)
    if (sala) {
      sala.estado = 'disponible'
    }
    
    triggerCallbacks('reservaCanceled', deletedReserva)
    
    return HttpResponse.json({ message: 'Reserva cancelada correctamente' })
  })
]
