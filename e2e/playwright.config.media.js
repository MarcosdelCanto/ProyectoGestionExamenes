import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config({ path: "../.env" });

/**
 * Configuración especial para generar multimedia (screenshots, videos, traces)
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

  /* Configuración global de pruebas - MULTIMEDIA HABILITADO */
  use: {
    /* URL base de la aplicación */
    baseURL: process.env.E2E_BASE_URL || "http://localhost:5174",

    /* Configuración de navegador */
    headless: false, // Navegador visible para ver las pruebas
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,

    /* MULTIMEDIA COMPLETO HABILITADO */
    screenshot: "on", // Capturar TODAS las pruebas
    video: "on", // Grabar TODAS las pruebas
    trace: "on", // Traces para TODAS las pruebas

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
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
    },
  ],

  /* Configuración de servidor local (opcional) */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:5174',
  //   reuseExistingServer: !process.env.CI,
  // },
});
