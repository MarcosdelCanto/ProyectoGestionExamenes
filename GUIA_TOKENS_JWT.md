# Guía: Solución para Tokens JWT Expirados

## 🔍 Problema Identificado

El error `TokenExpiredError: jwt expired` es normal en aplicaciones que usan JWT con tiempo de vida limitado. Indica que el access token ha expirado y necesita ser renovado.

## ✅ Soluciones Implementadas

### 1. **Middleware Mejorado** (`auth.middleware.js`)

**Qué hace:**

- Maneja errores de token expirado de forma más granular
- Proporciona códigos de error específicos
- Incluye información de cuándo expiró el token

**Beneficios:**

- Mejor debugging y logs
- Respuestas más informativas al frontend
- Manejo diferenciado por tipo de error

### 2. **Función de Refresh Automático** (`authService.js`)

**Nuevas funciones agregadas:**

```javascript
refreshAccessToken(); // Refresca el access token
fetchWithAuth(); // Fetch con manejo automático de tokens
```

**Cómo funciona:**

1. Detecta token expirado (401 + código 'TOKEN_EXPIRED')
2. Usa refresh token para obtener nuevo access token
3. Reintenta la petición original automáticamente

### 3. **Interceptor de API** (`utils/apiInterceptor.js`)

**Características:**

- Manejo automático de refresh en todas las peticiones
- Cola de peticiones durante el proceso de refresh
- Métodos de conveniencia (get, post, put, delete)
- Logout automático si falla el refresh

**Uso:**

```javascript
import apiClient from "../utils/apiInterceptor";

// En lugar de fetch normal
const response = await apiClient.get("/api/usuarios");
const result = await apiClient.post("/api/examenes", data);
```

### 4. **Componente de Advertencia** (`TokenExpirationWarning.jsx`)

**Funcionalidades:**

- Alerta cuando quedan menos de 2 minutos para expirar
- Cuenta regresiva visual
- Botones para extender sesión o cerrar sesión
- Verificación automática cada 30 segundos

## 🚀 Implementación Paso a Paso

### Paso 1: Integrar el Componente de Advertencia

Agregar al componente principal que contenga las rutas protegidas:

```jsx
// En tu componente principal (ej: App.jsx o Layout.jsx)
import TokenExpirationWarning from "./components/TokenExpirationWarning";

function App() {
  return (
    <>
      <TokenExpirationWarning />
      {/* resto de tu aplicación */}
    </>
  );
}
```

### Paso 2: Migrar Peticiones al Interceptor

**Antes:**

```javascript
const response = await fetch("/api/usuarios", {
  headers: {
    Authorization: `Bearer ${getAccessToken()}`,
    "Content-Type": "application/json",
  },
});
```

**Después:**

```javascript
import apiClient from "../utils/apiInterceptor";

const response = await apiClient.get("/api/usuarios");
```

### Paso 3: Configurar Variables de Entorno JWT

En `backend/.env`:

```bash
JWT_SECRET=tu_jwt_secret_muy_seguro
REFRESH_SECRET=tu_refresh_secret_diferente
JWT_EXPIRES_IN=15m          # Access token expira en 15 minutos
REFRESH_EXPIRES_IN=7d       # Refresh token expira en 7 días
```

## 🛠️ Casos de Uso Específicos

### Caso 1: Usuario Trabajando Activamente

- **Problema:** Token expira mientras usa la aplicación
- **Solución:** Refresh automático + notificación preventiva
- **Experiencia:** Transparente, sin interrupciones

### Caso 2: Usuario Inactivo

- **Problema:** Token expira por inactividad
- **Solución:** Advertencia + opción de extender sesión
- **Experiencia:** Control del usuario sobre su sesión

### Caso 3: Refresh Token Expirado

- **Problema:** Tanto access como refresh tokens expirados
- **Solución:** Logout automático + redirección a login
- **Experiencia:** Sesión limpia, reautenticación requerida

## 📊 Beneficios de la Implementación

### Para Usuarios

- ✅ Experiencia sin interrupciones
- ✅ Control sobre la duración de sesión
- ✅ Advertencias preventivas claras
- ✅ Proceso de reautenticación fluido

### Para Desarrolladores

- ✅ Manejo centralizado de tokens
- ✅ Logs mejorados para debugging
- ✅ Código reutilizable
- ✅ Menos código boilerplate

### Para Seguridad

- ✅ Tokens de corta duración
- ✅ Refresh automático seguro
- ✅ Logout automático en casos críticos
- ✅ Prevención de sesiones zombi

## 🧪 Testing

### Pruebas Recomendadas

1. **Expiración Natural:**

   - Esperar 15 minutos sin actividad
   - Verificar advertencia a los 13 minutos
   - Confirmar refresh automático

2. **Expiración Forzada:**

   - Cambiar JWT_EXPIRES_IN a 1m temporalmente
   - Hacer peticiones y verificar refresh automático

3. **Refresh Token Expirado:**

   - Eliminar refresh token del localStorage
   - Verificar logout automático

4. **Múltiples Peticiones Simultáneas:**
   - Hacer varias peticiones cuando token está por expirar
   - Verificar que solo se hace un refresh

## 🚨 Monitoreo y Alertas

### Métricas Importantes

- Frecuencia de refresh de tokens
- Errores de refresh fallidos
- Tiempo promedio de sesión
- Patrones de expiración

### Logs a Monitorear

```
[INFO] Token refreshed successfully for user: {userId}
[WARN] Refresh token expired for user: {userId}
[ERROR] Failed to refresh token: {error}
```

## 📝 Mantenimiento

### Tareas Periódicas

1. **Revisar logs** de errores de autenticación
2. **Ajustar tiempos** de expiración según uso
3. **Limpiar tokens expirados** de la base de datos
4. **Actualizar credenciales** de JWT secrets

### Mejoras Futuras

1. **Almacenar refresh tokens** en base de datos
2. **Rate limiting** para refresh attempts
3. **Métricas de uso** y analytics
4. **Notificaciones push** para sesiones críticas

---

## 🎯 Estado Actual

✅ **Implementado:**

- Middleware mejorado
- Funciones de refresh automático
- Interceptor de API
- Componente de advertencia

⏳ **Por Integrar:**

- Agregar TokenExpirationWarning al App.jsx
- Migrar peticiones al interceptor
- Configurar variables de entorno

🔧 **Para Producción:**

- Almacenamiento de refresh tokens en BD
- Rate limiting
- Monitoreo avanzado

¿Te gustaría que proceda con la integración de alguna de estas partes específicas?
