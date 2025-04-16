# 📘 Planificador de Exámenes

Proyecto web para la gestión y planificación de exámenes, considerando la disponibilidad de salas, docentes y estudiantes.

---

## 🧱 Estructura del Proyecto

```
planificador-examenes/
├── frontend/    → Aplicación web con React + Vite
├── backend/     → API REST con Node.js + Express
└── .vscode/     → Configuraciones compartidas del equipo
```

---

## 🚀 Tecnologías utilizadas

| Área        | Herramientas                             |
|-------------|------------------------------------------|
| Frontend    | React, Vite                              |
| Backend     | Node.js, Express                         |
| Base de datos | Oracle (conexión en desarrollo)         |
| Estilo de código | ESLint, Prettier                     |
| Control de versiones | Git, GitHub                     |
| Editor recomendado | Visual Studio Code                |

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
- 🟡 Base de datos Oracle: pendiente de conexión

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
