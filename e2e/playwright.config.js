import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config({ path: "../.env" });

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests",

  /* Configuración de timeouts */
  timeout: 60 * 1000, // 60 segundos por test
  expect: {
    timeout: 10 * 1000, // 10 segundos para assertions
  },

  /* Configuración para CI */
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  /* Configuración de reportes */
  reporter: [
    ["html", { open: "never" }],
    ["json", { outputFile: "test-results/results.json" }],
    ["junit", { outputFile: "test-results/results.xml" }],
    ["line"],
  ],

  /* Configuración global de pruebas */
  use: {
    /* URL base de la aplicación */
    baseURL: process.env.E2E_BASE_URL || "http://localhost:5174",

    /* Configuración de navegador */
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,

    /* Captura de pantallas y videos */
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",

    /* Configuración de red */
    actionTimeout: 15 * 1000,
    navigationTimeout: 30 * 1000,
  },

  /* Configuración de proyectos para diferentes navegadores */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },

    /* Pruebas en dispositivos móviles */
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
    },
  ],

  /* Configuración del servidor de desarrollo */
  webServer: process.env.CI
    ? undefined
    : {
        command: "cd ../frontend && npm run dev",
        url: "http://localhost:5174",
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000, // 2 minutos para que levante el servidor
      },
});
