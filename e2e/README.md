# 🎭 Pruebas de Extremo a Extremo (E2E) - Playwright

Este directorio contiene las pruebas de extremo a extremo (E2E) para el Sistema de Gestión de Exámenes, implementadas con **Playwright**.

## 🎯 ¿Qué son las Pruebas E2E?

Las pruebas E2E simulan interacciones de usuarios reales con la aplicación completa (frontend + backend + base de datos) para verificar que todos los componentes funcionan juntos correctamente.

### Ventajas de Playwright

- ✅ **Multi-navegador**: Chrome, Firefox, Safari, Edge
- ✅ **Rendimiento superior**: Más rápido y estable que Cypress
- ✅ **Soporte nativo TypeScript**: Sin configuración adicional
- ✅ **Mejor debugging**: Herramientas avanzadas de depuración
- ✅ **Auto-wait**: Espera automática por elementos
- ✅ **Parallel execution**: Ejecución en paralelo real
- ✅ **Mobile testing**: Emulación de dispositivos móviles

## 🚀 Configuración Inicial

### 1. Instalar dependencias

```bash
cd e2e
npm install
```

### 2. Instalar navegadores de Playwright

```bash
npm run test:install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tus configuraciones específicas
```

### 4. Asegurar que la aplicación esté ejecutándose

```bash
# Desde el directorio raíz del proyecto
docker-compose up
```

## 📝 Estructura de Pruebas

```
e2e/
├── tests/
│   ├── smoke.spec.js          # Pruebas básicas de funcionamiento
│   ├── auth.spec.js           # Autenticación y autorización
│   ├── examenes.spec.js       # Gestión de exámenes
│   └── navegacion.spec.js     # Navegación y UI
├── utils/
│   └── helpers.js             # Utilidades y funciones comunes
├── playwright.config.js       # Configuración principal
├── package.json              # Dependencias y scripts
└── README.md                 # Esta documentación
```

## 🧪 Tipos de Pruebas Implementadas

### 1. **Smoke Tests** (`smoke.spec.js`)

- ✅ La aplicación se carga correctamente
- ✅ Backend API responde
- ✅ No hay errores JavaScript críticos
- ✅ Navegación básica funciona

### 2. **Autenticación** (`auth.spec.js`)

- 🔐 Login exitoso con credenciales válidas
- ❌ Login falla con credenciales inválidas
- ⚠️ Validación de campos requeridos
- 🔄 Flujos de logout

### 3. **Gestión de Exámenes** (`examenes.spec.js`)

- 📋 Navegar a sección de exámenes
- 🔍 Buscar y filtrar exámenes
- ➕ Crear nuevo examen
- 👁️ Visualizar detalles de examen
- ✏️ Editar examen existente

### 4. **Navegación y UI** (`navegacion.spec.js`)

- 📱 Diseño responsive
- 🧭 Menú de navegación principal
- 🎨 Elementos UI correctamente renderizados
- ✅ Validación de formularios
- ♿ Accesibilidad básica
- 🚨 Manejo de errores

## 🏃‍♂️ Comandos de Ejecución

### Ejecutar todas las pruebas

```bash
npm test
```

### Ejecutar con interfaz visual

```bash
npm run test:headed
```

### Ejecutar en modo debug

```bash
npm run test:debug
```

### Ejecutar con UI de Playwright

```bash
npm run test:ui
```

### Generar código de pruebas automáticamente

```bash
npm run test:codegen
```

### Ver reporte de resultados

```bash
npm run test:report
```

### Ejecutar en Docker (con aplicación)

```bash
npm run test:docker
```

## 🎯 Configuración Avanzada

### Ejecutar en diferentes navegadores

```bash
# Solo Chrome
npx playwright test --project=chromium

# Solo Firefox
npx playwright test --project=firefox

# Solo Safari
npx playwright test --project=webkit

# Solo móvil
npx playwright test --project="Mobile Chrome"
```

### Ejecutar pruebas específicas

```bash
# Solo pruebas de autenticación
npx playwright test auth

# Solo pruebas de exámenes
npx playwright test examenes

# Un archivo específico
npx playwright test tests/smoke.spec.js
```

### Filtrar por etiquetas

```bash
# Solo pruebas críticas
npx playwright test --grep "crítico"

# Excluir pruebas lentas
npx playwright test --grep-invert "lento"
```

## 🐛 Debugging y Troubleshooting

### 1. **Ejecutar en modo debug paso a paso**

```bash
npm run test:debug
```

### 2. **Capturar screenshots automáticamente**

Las screenshots se toman automáticamente cuando fallan las pruebas en `test-results/`

### 3. **Ver trazas de ejecución**

```bash
npx playwright show-trace test-results/trace.zip
```

### 4. **Logs detallados**

```bash
DEBUG=pw:api npm test
```

### 5. **Problemas comunes**

#### La aplicación no se carga

```bash
# Verificar que Docker esté ejecutándose
docker-compose ps

# Verificar conectividad
curl http://localhost:8080
curl http://localhost:3000/api/health
```

#### Timeouts en pruebas

```bash
# Aumentar timeout en playwright.config.js
timeout: 60 * 1000  // 60 segundos
```

#### Elementos no encontrados

```bash
# Usar el selector inspector
npx playwright test --debug
```

## 📊 CI/CD Integration

### GitHub Actions

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: |
          cd e2e
          npm ci
          npx playwright install --with-deps

      - name: Start application
        run: docker-compose up -d

      - name: Run E2E tests
        run: |
          cd e2e
          npm run test:ci

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: e2e/playwright-report/
```

## 📈 Mejores Prácticas

### 1. **Escritura de Pruebas**

- ✅ Usar Page Object Model para componentes complejos
- ✅ Implementar esperas explícitas (`waitFor`)
- ✅ Usar selectores estables (data-testid)
- ✅ Mantener pruebas independientes
- ✅ Usar datos de prueba realistas

### 2. **Mantenimiento**

- 🔄 Revisar pruebas regularmente
- 📝 Documentar cambios en selectores
- 🧹 Limpiar datos de prueba
- 📊 Monitorear tiempos de ejecución

### 3. **Performance**

- ⚡ Ejecutar en paralelo cuando sea posible
- 🎯 Agrupar pruebas relacionadas
- 💾 Reutilizar estados de autenticación
- 🔄 Usar beforeEach para setup común

## 🔧 Personalización

### Agregar nuevas pruebas

1. Crear archivo en `tests/nombre.spec.js`
2. Importar helpers necesarios
3. Seguir estructura de describe/test
4. Usar utilidades de `utils/helpers.js`

### Ejemplo de nueva prueba:

```javascript
import { test, expect } from "@playwright/test";
import { login, testData } from "../utils/helpers.js";

test.describe("Nueva Funcionalidad", () => {
  test.beforeEach(async ({ page }) => {
    await login(
      page,
      testData.usuarios.admin.email,
      testData.usuarios.admin.password
    );
  });

  test("Debe realizar acción específica", async ({ page }) => {
    // Tu lógica de prueba aquí
    await expect(page.locator("selector")).toBeVisible();
  });
});
```

## 📞 Soporte

Para problemas o preguntas sobre las pruebas E2E:

1. 📖 Revisa la [documentación de Playwright](https://playwright.dev/)
2. 🔍 Busca en los issues existentes
3. 💬 Crea un nuevo issue con detalles del problema
4. 📧 Contacta al equipo de desarrollo

---

**¡Las pruebas E2E son cruciales para garantizar la calidad y confiabilidad de nuestra aplicación!** 🚀
