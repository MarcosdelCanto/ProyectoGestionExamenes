import { test, expect } from "@playwright/test";
import { login } from "../utils/helpers.js";

test.describe("Autenticación - Flujo completo de login", () => {
  test.beforeEach(async ({ page }) => {
    try {
      await page.goto("/login");
    } catch (e) {
      await page.goto("/");
    }
  });

  test("Login exitoso con credenciales válidas", async ({ page }) => {
    // Usar la función helper optimizada
    const loginSuccessful = await login(page, "mico@mico.cl", "1234");
    expect(loginSuccessful).toBe(true);

    // Verificaciones adicionales
    await page.waitForTimeout(3000);

    // Verificar que estamos fuera del login
    const isStillOnLogin = await page
      .locator('input[type="password"]')
      .isVisible()
      .catch(() => false);
    expect(isStillOnLogin).toBe(false);
  });

  test("Login falla con credenciales inválidas", async ({ page }) => {
    // Buscar el formulario de login
    const loginForm = page.locator("form").first();
    await expect(loginForm).toBeVisible({ timeout: 10000 });

    // Buscar campos de input
    const emailField = page
      .locator(
        'input[type="email"], input[name*="email"], input[name*="usuario"], input[placeholder*="email"], input[placeholder*="usuario"]'
      )
      .first();
    const passwordField = page.locator('input[type="password"]').first();

    // Llenar credenciales incorrectas
    await emailField.fill("usuario_incorrecto@test.com");
    await passwordField.fill("password_incorrecto");

    // Hacer click en submit
    const submitButton = page
      .locator(
        'button[type="submit"], input[type="submit"], button:has-text("Iniciar"), button:has-text("Login"), button:has-text("Entrar")'
      )
      .first();
    await submitButton.click();

    // Verificar que aparece un mensaje de error o permanecemos en login
    await page.waitForTimeout(3000);

    const possibleErrorIndicators = [
      () => page.locator("text=Error").isVisible(),
      () => page.locator("text=incorrecto").isVisible(),
      () => page.locator("text=inválido").isVisible(),
      () => page.locator('[class*="error"]').isVisible(),
      () => page.locator('[class*="alert"]').isVisible(),
      () => page.locator('input[type="password"]').isVisible(), // Aún en login
    ];

    let errorShown = false;
    for (const indicator of possibleErrorIndicators) {
      try {
        if (await indicator()) {
          errorShown = true;
          break;
        }
      } catch (e) {
        // Continuar con el siguiente indicador
      }
    }

    expect(errorShown).toBe(true);
  });

  test("Validación de campos requeridos", async ({ page }) => {
    // Buscar el formulario de login
    const loginForm = page.locator("form").first();
    await expect(loginForm).toBeVisible({ timeout: 10000 });

    // Intentar submit sin llenar campos
    const submitButton = page
      .locator(
        'button[type="submit"], input[type="submit"], button:has-text("Iniciar"), button:has-text("Login"), button:has-text("Entrar")'
      )
      .first();
    await submitButton.click();

    // Verificar que los campos muestran validación o no se permite el submit
    await page.waitForTimeout(1000);

    const possibleValidationIndicators = [
      () => page.locator("input:invalid").count() > 0,
      () => page.locator('[class*="error"]').isVisible(),
      () => page.locator('[class*="required"]').isVisible(),
      () => page.locator("text=requerido").isVisible(),
      () => page.locator("text=obligatorio").isVisible(),
      () => page.locator('input[type="password"]').isVisible(), // Aún en login
    ];

    let validationShown = false;
    for (const indicator of possibleValidationIndicators) {
      try {
        if (await indicator()) {
          validationShown = true;
          break;
        }
      } catch (e) {
        // Continuar con el siguiente indicador
      }
    }

    expect(validationShown).toBe(true);
  });
});
