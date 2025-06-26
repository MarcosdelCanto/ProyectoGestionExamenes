# 🧪 Guía Completa de Pruebas de Integración

Esta guía te ayudará a entender y ejecutar las pruebas de integración implementadas en tu proyecto de gestión de exámenes.

## 📋 Índice

- [Qué son las Pruebas de Integración](#qué-son-las-pruebas-de-integración)
- [Configuración del Proyecto](#configuración-del-proyecto)
- [Backend - Pruebas de Integración](#backend---pruebas-de-integración)
- [Frontend - Pruebas de Integración](#frontend---pruebas-de-integración)
- [Comandos de Ejecución](#comandos-de-ejecución)
- [Mejores Prácticas](#mejores-prácticas)

## 🎯 Qué son las Pruebas de Integración

Las pruebas de integración verifican que diferentes módulos o servicios de tu aplicación trabajan juntos correctamente. A diferencia de las pruebas unitarias que prueban componentes aislados, las pruebas de integración validan:

- **Flujos completos de usuario**
- **Interacción entre servicios**
- **Integración con APIs**
- **Manejo de estado compartido**
- **Transacciones de base de datos**

## ⚙️ Configuración del Proyecto

### Backend
- **Vitest**: Framework de testing
- **Supertest**: Para probar rutas HTTP
- **Mocks**: Simulación de Oracle DB y dependencias

### Frontend
- **Vitest**: Framework de testing
- **React Testing Library**: Para componentes React
- **MSW (Mock Service Worker)**: Para interceptar llamadas HTTP
- **JSDOM**: Entorno de navegador simulado

## 🔧 Backend - Pruebas de Integración

### Estructura de Archivos

```
backend/test/
├── integration/
│   ├── api.integration.test.js           # Pruebas de API end-to-end
│   ├── database.integration.test.js      # Pruebas de BD complejas
│   └── test-helpers/
│       └── db-operations.js              # Helpers para operaciones de BD
```

### Tipos de Pruebas Implementadas

#### 1. Pruebas de API End-to-End (`api.integration.test.js`)

```javascript
// Ejemplo: Flujo completo de autenticación
test('Debe autenticar usuario y permitir acceso a recursos protegidos', async () => {
  // 1. Login del usuario
  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'password123' })
    .expect(200);

  // 2. Usar token para acceder a recurso protegido
  const usersResponse = await request(app)
    .get('/api/users')
    .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
    .expect(200);
});
```

#### 2. Pruebas de Base de Datos (`database.integration.test.js`)

```javascript
// Ejemplo: Transacción compleja
test('Debe crear examen con múltiples reservas en transacción', async () => {
  const resultado = await crearExamenConReservas({
    examen: { nombre: 'Examen Final', /* ... */ },
    reservas: [
      { id_sala: 1, /* ... */ },
      { id_sala: 2, /* ... */ }
    ]
  });

  expect(resultado.examenId).toBe(101);
  expect(resultado.reservaIds).toEqual([201, 202]);
});
```

### Comandos Backend

```bash
# Todas las pruebas
npm test

# Solo pruebas unitarias
npm run test:unit

# Solo pruebas de integración
npm run test:integration

# Con cobertura
npm run test:coverage

# Modo watch
npm run test:watch
```

## 🎨 Frontend - Pruebas de Integración

### Estructura de Archivos

```
frontend/src/test/
├── integration/
│   ├── auth.integration.test.jsx                    # Flujo de autenticación
│   ├── users.integration.test.jsx                   # Gestión de usuarios
│   └── examenes-reservas.integration.test.jsx      # Flujo exámenes-reservas
├── mocks/
│   ├── handlers.js                                  # Handlers de MSW
│   └── server.js                                    # Configuración del servidor mock
├── utils/
│   └── test-utils.jsx                               # Utilidades de testing
└── setup.js                                        # Configuración global
```

### Tipos de Pruebas Implementadas

#### 1. Flujo de Autenticación (`auth.integration.test.jsx`)

```javascript
test('Debe completar el flujo de login exitosamente', async () => {
  render(<App />);

  // Simular entrada de credenciales
  await user.type(screen.getByRole('textbox', { name: /usuario/i }), 'admin');
  await user.type(screen.getByLabelText(/contraseña/i), 'password123');
  await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

  // Verificar que se guardaron los datos
  await waitFor(() => {
    expect(localStorage.setItem).toHaveBeenCalledWith('user', expect.stringContaining('admin'));
  });
});
```

#### 2. Gestión de Usuarios (`users.integration.test.jsx`)

```javascript
test('Debe crear un nuevo usuario correctamente', async () => {
  renderWithAuth(<UsuariosPage />);

  // Crear usuario
  await user.click(screen.getByTestId('create-user-btn'));
  
  // Verificar que se llamó la API
  await waitFor(() => {
    expect(createUserCalled).toBe(true);
  });
});
```

#### 3. Flujo Exámenes-Reservas (`examenes-reservas.integration.test.jsx`)

```javascript
test('Debe crear examen y reservar sala en flujo completo', async () => {
  renderWithAuth(<ExamenesReservasPage />);

  // Crear examen
  await user.click(screen.getByTestId('create-exam-btn'));
  
  // Reservar sala
  await user.click(screen.getByTestId('reserve-sala-1'));

  // Verificar que ambas operaciones se completaron
  await waitFor(() => {
    expect(examenCreated && reservaCreated).toBe(true);
  });
});
```

### Mock Service Worker (MSW)

MSW intercepta las llamadas HTTP y devuelve respuestas mock:

```javascript
// handlers.js
export const handlers = [
  http.post('/api/auth/login', () => {
    return HttpResponse.json({
      user: { id: 1, username: 'admin' },
      accessToken: 'mock-token'
    });
  }),
  // ... más handlers
];
```

### Comandos Frontend

```bash
# Instalar dependencias primero
npm install

# Todas las pruebas
npm test

# Solo pruebas de integración  
npm test -- integration

# Con cobertura
npm run test:coverage

# Modo watch
npm run test:watch

# UI de Vitest
npm run test:ui
```

## 🚀 Comandos de Ejecución

### Instalación de Dependencias

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd frontend
npm install
```

### Ejecución por Separado

#### Backend
```bash
cd backend

# Todas las pruebas
npm test

# Solo integración
npm run test:integration

# Con cobertura
npm run test:coverage
```

#### Frontend
```bash
cd frontend

# Todas las pruebas
npm test

# Solo integración
npm test -- integration

# Con cobertura
npm run test:coverage
```

### Ejecución en Paralelo (desde raíz del proyecto)

```bash
# Con npm-run-all (si está instalado)
npm-run-all --parallel test:backend test:frontend

# O manualmente en terminales separadas
cd backend && npm test &
cd frontend && npm test &
```

## 📊 Cobertura de Pruebas

### Backend
- ✅ Flujos de autenticación completos
- ✅ Gestión de usuarios con permisos
- ✅ Creación y gestión de exámenes
- ✅ Sistema de reservas de salas
- ✅ Transacciones complejas de BD
- ✅ Manejo de errores y rollbacks

### Frontend
- ✅ Flujo de login/logout
- ✅ Navegación con autenticación
- ✅ CRUD de usuarios con estados
- ✅ Integración exámenes-reservas
- ✅ Manejo de errores en UI
- ✅ Estados de carga y feedback

## 🎯 Mejores Prácticas

### 1. Estructura de Pruebas
- Agrupa pruebas por funcionalidad
- Usa nombres descriptivos
- Separa setup, acción y verificación

### 2. Mocks y Datos
- Usa datos consistentes entre pruebas
- Mock solo lo necesario
- Limpia mocks después de cada prueba

### 3. Assertions
- Verifica comportamientos, no implementación
- Usa `waitFor` para operaciones asíncronas
- Verifica estados finales, no intermedios

### 4. Mantenimiento
- Actualiza pruebas cuando cambies funcionalidad
- Revisa cobertura regularmente
- Documenta casos edge complejos

## 🔍 Debugging de Pruebas

### Ver output detallado
```bash
npm test -- --reporter=verbose
```

### Ejecutar una sola prueba
```bash
npm test -- --grep "nombre de la prueba"
```

### Debug con breakpoints
```bash
npm test -- --inspect-brk
```

### Ver coverage detallado
```bash
npm run test:coverage
# Abre coverage/index.html en navegador
```

## 📝 Estado Final - ¡Completado! ✅

### ✅ Tareas Completadas
1. **Backend**: Todas las pruebas de integración funcionando (3 tests pasando)
2. **Frontend**: Todas las pruebas de integración funcionando (20 tests pasando)
3. **MSW Handlers**: Sistema de callbacks implementado y funcional
4. **Mocks corregidos**: JWT, React Modal, queries duplicadas resueltas
5. **Documentación**: Completa y actualizada

### 🎯 Resultados
- **Backend**: 3/3 tests ✅
- **Frontend**: 20/20 tests ✅ 
  - Autenticación: 6 tests ✅
  - Gestión de Usuarios: 7 tests ✅
  - Exámenes y Reservas: 7 tests ✅

### 🚀 Próximos Pasos Opcionales
1. **Ampliar cobertura** con más casos de prueba específicos
2. **Integrar con CI/CD** para automatización
3. **Medir cobertura** de código con herramientas de coverage
4. **Optimizar rendimiento** de las pruebas si es necesario

¡Las pruebas de integración están completamente funcionales! 🎉

### Comandos Útiles
```bash
# Ejecutar todas las pruebas de integración
cd backend && npm run test:integration
cd frontend && npm test -- src/test/integration/

# Ejecutar pruebas específicas
npm test -- users.integration.test
npm test -- auth.integration.test
npm test -- examenes-reservas.integration.test
```
