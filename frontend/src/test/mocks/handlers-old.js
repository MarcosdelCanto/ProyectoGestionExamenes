/**
 * @fileoverview Mock Service Worker para interceptar llamadas HTTP en pruebas
 * @description Configura MSW para simular respuestas del backend
 */

import { http, HttpResponse } from 'msw'

const API_BASE_URL = 'http://localhost:3000/api'

export const handlers = [
  // Auth endpoints
  http.post(`${API_BASE_URL}/auth/login`, () => {
    return HttpResponse.json({
      user: {
        id: 1,
        username: 'admin',
        email: 'admin@test.com',
        role: 'admin'
      },
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token'
    })
  }),

  http.post(`${API_BASE_URL}/auth/refresh`, () => {
    return HttpResponse.json({
      accessToken: 'new-mock-access-token'
    })
  }),

  http.post(`${API_BASE_URL}/auth/logout`, () => {
    return HttpResponse.json({ message: 'Logout exitoso' })
  }),

  // Users endpoints
  http.get(`${API_BASE_URL}/users`, () => {
    return HttpResponse.json({
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
      ]
    })
  }),

  http.post(`${API_BASE_URL}/users`, () => {
    return HttpResponse.json({
      message: 'Usuario creado exitosamente',
      userId: 3
    }, { status: 201 })
  }),

  http.put(`${API_BASE_URL}/users/:id`, () => {
    return HttpResponse.json({
      message: 'Usuario actualizado exitosamente'
    })
  }),

  http.delete(`${API_BASE_URL}/users/:id`, () => {
    return HttpResponse.json({
      message: 'Usuario eliminado exitosamente'
    })
  }),

  // Examenes endpoints
  http.get(`${API_BASE_URL}/examenes`, () => {
    return HttpResponse.json({
      examenes: [
        {
          ID_EXAMEN: 1,
          NOMBRE: 'Examen Final Matemáticas',
          DESCRIPCION: 'Examen final del curso',
          FECHA_INICIO: '2025-07-01T09:00:00Z',
          FECHA_FIN: '2025-07-01T11:00:00Z',
          ID_ASIGNATURA: 1,
          NOMBRE_ASIGNATURA: 'Matemáticas',
          ID_SECCION: 1,
          NOMBRE_SECCION: 'A1'
        }
      ]
    })
  }),

  http.post(`${API_BASE_URL}/examenes`, () => {
    return HttpResponse.json({
      message: 'Examen creado exitosamente',
      examenId: 2
    }, { status: 201 })
  }),

  // Salas endpoints
  http.get(`${API_BASE_URL}/salas`, () => {
    return HttpResponse.json({
      salas: [
        {
          ID_SALA: 1,
          NOMBRE: 'Aula 101',
          CAPACIDAD: 30,
          UBICACION: 'Edificio A, Piso 1',
          ESTADO: 'disponible'
        },
        {
          ID_SALA: 2,
          NOMBRE: 'Aula 102',
          CAPACIDAD: 25,
          UBICACION: 'Edificio A, Piso 1',
          ESTADO: 'disponible'
        }
      ]
    })
  }),

  // Reservas endpoints
  http.get(`${API_BASE_URL}/reservas`, () => {
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
  }),

  http.post(`${API_BASE_URL}/reservas`, () => {
    return HttpResponse.json({
      message: 'Reserva creada exitosamente',
      reservaId: 2
    }, { status: 201 })
  }),

  // Roles endpoints
  http.get(`${API_BASE_URL}/roles`, () => {
    return HttpResponse.json({
      roles: [
        { ID_ROL: 1, NOMBRE_ROL: 'admin', DESCRIPCION: 'Administrador del sistema' },
        { ID_ROL: 2, NOMBRE_ROL: 'profesor', DESCRIPCION: 'Profesor' },
        { ID_ROL: 3, NOMBRE_ROL: 'estudiante', DESCRIPCION: 'Estudiante' }
      ]
    })
  }),

  // Asignaturas endpoints
  http.get(`${API_BASE_URL}/asignaturas`, () => {
    return HttpResponse.json({
      asignaturas: [
        {
          ID_ASIGNATURA: 1,
          NOMBRE: 'Matemáticas',
          CODIGO: 'MAT101',
          CREDITOS: 4
        }
      ]
    })
  }),

  // Error handlers
  http.get(`${API_BASE_URL}/error`, () => {
    return new HttpResponse(null, { status: 500 })
  }),

  // Not found handler
  http.get('*', () => {
    return new HttpResponse(null, { status: 404 })
  })
]
