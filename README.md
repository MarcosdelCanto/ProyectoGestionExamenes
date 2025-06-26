# 📘 Planificador de Exámenes

Proyecto web para la gestión y planificación de exámenes, considerando la disponibilidad de salas, docentes y estudiantes.

---

## 🧱 Estructura del Proyecto

```
planificador-examenes/
├── frontend/    → Aplicación web con React + Vite
├── backend/     → API REST con Node.js + Express
├── e2e/         → Pruebas de extremo a extremo con Playwright
└── .vscode/     → Configuraciones compartidas del equipo
```

---

## 🚀 Tecnologías utilizadas

| Área                 | Herramientas                    |
| -------------------- | ------------------------------- |
| Frontend             | React, Vite                     |
| Backend              | Node.js, Express                |
| Base de datos        | Oracle (conexión en desarrollo) |
| Testing E2E          | Playwright                      |
| Testing Unitario     | Vitest                          |
| Estilo de código     | ESLint, Prettier                |
| Control de versiones | Git, GitHub                     |
| Editor recomendado   | Visual Studio Code, Trae        |

---

## ⚙️ Configuración inicial

### 🔹 Requisitos

- Node.js y npm instalados
- Visual Studio Code (opcional, pero recomendado)
- Oracle Database (en preparación)

### 🔹 Instalación

#### Clonar repositorio

```bash
git clone https://github.com/usuario/proyecto-examenes.git
cd planificador-examenes
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

#### Backend

```bash
cd backend
npm install
touch .env
# Configura tus variables de entorno:
# PORT=3000
# DB_HOST=...
# DB_USER=...
# DB_PASS=...
node index.js
```

#### Pruebas E2E (Extremo a Extremo)

```bash
cd e2e
npm install
npm run test:install  # Instala navegadores de Playwright
cp .env.example .env  # Configura variables de prueba

# Ejecutar pruebas (requiere que la app esté corriendo)
npm test
```

#### Docker (Recomendado)

```bash
# Ejecutar toda la aplicación
docker-compose up

# Ejecutar con pruebas E2E
docker-compose -f docker-compose.yml -f e2e/docker-compose.e2e.yml up
```

---

## 🔧 Configuración de entorno de desarrollo

- Se recomienda instalar las extensiones definidas en `.vscode/extensions.json`.
- El formateo automático y la ejecución de ESLint están configurados en `.vscode/settings.json`.
- Prettier + ESLint están integrados en ambos entornos (`frontend` y `backend`).

---

## 📌 Estado del proyecto (hasta ahora)

- ✅ Estructura general del proyecto creada
- ✅ React + Vite funcionando (frontend)
- ✅ Servidor Express configurado (backend)
- ✅ Simulación de conexión a base de datos lista
- ✅ ESLint + Prettier integrados
- ✅ Extensiones VSCode compartidas
- ✅ Pruebas unitarias con Vitest (frontend/backend)
- ✅ Pruebas de integración implementadas
- ✅ **Pruebas E2E con Playwright configuradas**
- 🟡 Base de datos Oracle: pendiente de conexión

---

## 🧪 Testing Strategy

El proyecto implementa una estrategia de testing completa:

### 1. **Pruebas Unitarias** (Vitest)

- Frontend: Componentes React
- Backend: Controladores y middlewares

### 2. **Pruebas de Integración** (Vitest + Supertest)

- APIs endpoints
- Flujos de datos entre servicios

### 3. **Pruebas E2E** (Playwright) ⭐ **NUEVO**

- Flujos completos de usuario
- Multi-navegador (Chrome, Firefox, Safari)
- Responsive testing
- Smoke tests automáticos

#### Comandos de Testing

```bash
# Frontend
cd frontend
npm test              # Unitarias
npm run test:coverage # Con coverage

# Backend
cd backend
npm test              # Unitarias
npm run test:integration # Integración

# E2E
cd e2e
npm test              # Todas las pruebas E2E
npm run test:ui       # Con interfaz visual
npm run test:debug    # Modo debug
```

---

## 📋 Tareas próximas

- Integrar conexión real con Oracle
- Crear endpoints para gestionar exámenes
- Agregar lógica para validación de horarios y disponibilidad
- Conectar frontend con la API

---

## 🤝 Equipo

- [Tu nombre o grupo] – Desarrollo
- [Compañero que crea la base de datos] – BD Oracle
