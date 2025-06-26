# 📸 Configuración de Multimedia en Pruebas E2E

## 🎯 **Configuraciones Disponibles**

### **1. Configuración Principal (Eficiente)** - `playwright.config.js`

**Por defecto** - Optimizada para uso regular y CI/CD

```javascript
screenshot: "only-on-failure"; // Solo capturas cuando fallan
video: "retain-on-failure"; // Solo videos cuando fallan
trace: "retain-on-failure"; // Solo traces cuando fallan
headless: true; // Sin navegador visible
```

**✅ Ventajas:**

- ⚡ Ejecución rápida
- 💽 Consume poco espacio en disco
- 🔋 Ahorra recursos del sistema
- 🎯 Solo genera archivos cuando hay problemas

### **2. Configuración Multimedia (Completa)** - `playwright.config.media.js`

**Para demos y análisis** - Genera todo el contenido multimedia

```javascript
screenshot: "on"; // Capturas para TODAS las pruebas
video: "on"; // Videos para TODAS las pruebas
trace: "on"; // Traces para TODAS las pruebas
headless: false; // Navegador visible
```

**✅ Ventajas:**

- 🎬 Videos completos de todas las pruebas
- 📸 Screenshots de cada paso
- 🔍 Traces detallados para análisis
- 👁️ Navegador visible para demostraciones

**⚠️ Consideraciones:**

- 🐌 Ejecución más lenta (2-3x tiempo)
- 💽 Consume más espacio (~50-100MB por ejecución completa)
- 🔋 Usa más recursos (CPU, RAM)

---

## 🚀 **Comandos de Uso**

### **Uso Regular (Configuración Eficiente)**

```bash
# Ejecutar todas las pruebas (solo multimedia en fallos)
npm test

# Ejecutar categorías específicas (eficiente)
npm run test:smoke
npm run test:auth
npm run test:examenes
npm run test:ui-only

# Todos los navegadores (eficiente)
npm run test:all-browsers
```

### **Generar Multimedia Completo (Solo cuando necesites)**

```bash
# Generador interactivo con opciones
npm run test:generate-media

# Scripts específicos con multimedia completo
npm run test:with-media      # Todas las pruebas + multimedia
npm run test:demo            # Demo visual (navegador visible)
npm run test:screenshots     # Solo pruebas smoke + multimedia
npm run test:videos          # Solo pruebas auth + multimedia
```

### **Comandos Directos**

```bash
# Configuración eficiente (por defecto)
npx playwright test

# Configuración multimedia completa
npx playwright test --config=playwright.config.media.js --project=chromium
```

---

## 📊 **Comparación de Rendimiento**

| Aspecto                 | Configuración Eficiente   | Configuración Multimedia   |
| ----------------------- | ------------------------- | -------------------------- |
| **Tiempo de ejecución** | ~4-5 minutos (80 pruebas) | ~8-12 minutos (80 pruebas) |
| **Espacio en disco**    | ~5-10 MB                  | ~50-100 MB                 |
| **Archivos generados**  | Solo en fallos            | 200+ archivos              |
| **Uso recomendado**     | Desarrollo diario, CI/CD  | Demos, debugging, análisis |

---

## 🎯 **Recomendaciones de Uso**

### **Para desarrollo diario:**

✅ Usa la configuración eficiente: `npm test`

### **Para debugging problemas:**

✅ Usa multimedia completo: `npm run test:generate-media`

### **Para demos y presentaciones:**

✅ Usa: `npm run test:demo`

### **Para CI/CD:**

✅ Mantén la configuración eficiente

### **Para análisis profundo:**

✅ Usa multimedia completo y revisa los traces

---

## 📁 **Ubicación de Archivos**

```
test-results/
├── 📊 results.json          # Siempre se genera
├── 📊 results.xml           # Siempre se genera
├── 📸 screenshots/          # Solo en fallos (eficiente) o siempre (multimedia)
├── 🎬 videos/              # Solo en fallos (eficiente) o siempre (multimedia)
└── 🔍 traces/              # Solo en fallos (eficiente) o siempre (multimedia)

playwright-report/
└── 📄 index.html           # Reporte HTML siempre disponible
```

---

## 💡 **Tips para Optimizar Recursos**

1. **Limpia archivos antiguos regularmente:**

   ```bash
   rm -rf test-results/*
   rm -rf playwright-report/*
   ```

2. **Usa solo un navegador para desarrollo:**

   ```bash
   npx playwright test --project=chromium
   ```

3. **Para pruebas rápidas, usa smoke tests:**

   ```bash
   npm run test:smoke
   ```

4. **Genera multimedia solo cuando lo necesites específicamente**

5. **En CI/CD, considera configurar retención de artefactos por tiempo limitado**
