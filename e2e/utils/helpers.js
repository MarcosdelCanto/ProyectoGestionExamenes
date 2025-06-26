/**
 * Utilidades comunes para pruebas E2E
 */

/**
 * Realiza login en la aplicación
 * @param {import('@playwright/test').Page} page
 * @param {string} email
 * @param {string} password
 */
export async function login(page, email = "mico@mico.cl", password = "1234") {
  // Verificar si ya estamos logueados
  if (await isLoggedIn(page)) {
    return true;
  }

  // Ir directamente a la página de login si existe, o a la raíz
  try {
    await page.goto("/login");
  } catch (e) {
    await page.goto("/");
  }

  // Esperar a que la página se cargue completamente
  await page.waitForLoadState("networkidle");

  // Buscar campos de login con los nombres correctos
  const emailField = page
    .locator(
      'input[name="email_usuario"], input[type="email"], input[name*="email"], input[name*="usuario"], input[placeholder*="email"], input[placeholder*="usuario"]'
    )
    .first();
  const passwordField = page
    .locator('input[name="password_usuario"], input[type="password"]')
    .first();

  try {
    // Verificar que los campos sean visibles
    await emailField.waitFor({ state: "visible", timeout: 15000 });
    await passwordField.waitFor({ state: "visible", timeout: 15000 });

    // Limpiar y llenar los campos
    await emailField.clear();
    await emailField.fill(email);
    await passwordField.clear();
    await passwordField.fill(password);

    const submitButton = page
      .locator(
        'button[type="submit"], input[type="submit"], button:has-text("Iniciar"), button:has-text("Login"), button:has-text("Entrar")'
      )
      .first();

    // Esperar a que el botón sea visible y clickeable
    await submitButton.waitFor({ state: "visible", timeout: 10000 });

    // Hacer click de manera más robusta
    await Promise.race([
      submitButton.click({ force: true }),
      submitButton.click(),
    ]);

    // Esperar redirección con más tiempo
    await page.waitForTimeout(8000);

    // Verificar que el login fue exitoso
    return await isLoggedIn(page);
  } catch (e) {
    console.log("Login failed:", e.message);
    return false;
  }
}

/**
 * Verifica si el usuario está autenticado
 * @param {import('@playwright/test').Page} page
 */
export async function isLoggedIn(page) {
  try {
    // Primero verificar si hay token en localStorage
    const hasToken = await page.evaluate(() => {
      return !!(
        localStorage.getItem("accessToken") || localStorage.getItem("token")
      );
    });

    if (hasToken) {
      return true;
    }

    // Verificadores de estado de login
    const loginIndicators = [
      // URLs que indican que estamos logueados
      () => page.url().includes("/dashboard"),
      () => page.url().includes("/home"),
      () => page.url().includes("/main"),

      // Elementos que indican que estamos logueados
      () => page.locator("text=Dashboard").isVisible({ timeout: 2000 }),
      () => page.locator("text=Bienvenido").isVisible({ timeout: 2000 }),
      () => page.locator("text=Cerrar sesión").isVisible({ timeout: 2000 }),
      () =>
        page.locator('button:has-text("Logout")').isVisible({ timeout: 2000 }),
      () =>
        page.locator('button:has-text("Salir")').isVisible({ timeout: 2000 }),

      // Ausencia de elementos de login
      () =>
        !page.locator('input[type="password"]').isVisible({ timeout: 2000 }),
      () =>
        !page
          .locator('input[name="password_usuario"]')
          .isVisible({ timeout: 2000 }),

      // Presencia de navegación sin campo de password
      () =>
        page.locator("nav").isVisible({ timeout: 2000 }) &&
        !page.locator('input[type="password"]').isVisible({ timeout: 1000 }),

      // URL diferente de login
      () =>
        !page.url().includes("/login") &&
        page.url() !== "/" + "login" &&
        !page.url().endsWith("/"),
    ];

    for (const indicator of loginIndicators) {
      try {
        if (await indicator()) {
          return true;
        }
      } catch (e) {
        continue;
      }
    }

    return false;
  } catch (e) {
    return false;
  }
}

/**
 * Espera a que aparezca un elemento con múltiples selectores posibles
 * @param {import('@playwright/test').Page} page
 * @param {string[]} selectors
 * @param {number} timeout
 */
export async function waitForAnyElement(page, selectors, timeout = 10000) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    for (const selector of selectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          return element;
        }
      } catch (e) {
        continue;
      }
    }
    await page.waitForTimeout(500);
  }

  throw new Error(
    `Ningún elemento encontrado para los selectores: ${selectors.join(", ")}`
  );
}

/**
 * Llena un formulario con datos de prueba
 * @param {import('@playwright/test').Page} page
 * @param {Object} data
 */
export async function fillForm(page, data) {
  for (const [field, value] of Object.entries(data)) {
    const selectors = [
      `input[name="${field}"]`,
      `input[id="${field}"]`,
      `input[placeholder*="${field}"]`,
      `textarea[name="${field}"]`,
      `select[name="${field}"]`,
    ];

    try {
      const element = await waitForAnyElement(page, selectors, 3000);

      const tagName = await element.evaluate((el) => el.tagName.toLowerCase());

      if (tagName === "select") {
        await element.selectOption(value);
      } else {
        await element.fill(value);
      }
    } catch (e) {
      console.warn(`No se pudo llenar el campo: ${field}`);
    }
  }
}

/**
 * Toma screenshot con nombre descriptivo
 * @param {import('@playwright/test').Page} page
 * @param {string} name
 */
export async function takeNamedScreenshot(page, name) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  await page.screenshot({
    path: `test-results/screenshots/${name}-${timestamp}.png`,
    fullPage: true,
  });
}

/**
 * Verifica que no hay errores JavaScript críticos
 * @param {import('@playwright/test').Page} page
 */
export function setupErrorHandling(page) {
  const errors = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(msg.text());
    }
  });

  page.on("pageerror", (error) => {
    errors.push(error.message);
  });

  return () => {
    const criticalErrors = errors.filter(
      (error) =>
        !error.includes("favicon") &&
        !error.includes("404") &&
        !error.includes("network") &&
        (error.includes("ReferenceError") ||
          error.includes("TypeError") ||
          error.includes("SyntaxError"))
    );

    if (criticalErrors.length > 0) {
      throw new Error(
        `Errores JavaScript críticos encontrados: ${criticalErrors.join(", ")}`
      );
    }

    return errors;
  };
}

/**
 * Navega a una sección específica de la aplicación
 * @param {import('@playwright/test').Page} page
 * @param {string} section
 */
export async function navigateToSection(page, section) {
  const navigationSelectors = [
    `a:has-text("${section}")`,
    `button:has-text("${section}")`,
    `[href*="${section.toLowerCase()}"]`,
    `nav a[href*="${section.toLowerCase()}"]`,
    `.menu a:has-text("${section}")`,
    `.navbar a:has-text("${section}")`,
  ];

  try {
    const navElement = await waitForAnyElement(page, navigationSelectors, 5000);
    await navElement.click();
    await page.waitForTimeout(2000);
    return true;
  } catch (e) {
    console.warn(`No se pudo navegar a la sección: ${section}`);
    return false;
  }
}

/**
 * Datos de prueba comunes
 */
export const testData = {
  usuarios: {
    admin: {
      email: "mico@mico.cl",
      password: "1234",
    },
    profesor: {
      email: "profesor@test.com",
      password: "profesor123",
    },
    estudiante: {
      email: "estudiante@test.com",
      password: "estudiante123",
    },
  },

  examen: {
    nombre: "Examen de Prueba E2E",
    descripcion: "Descripción de prueba para examen automatizado",
    asignatura: "Matemáticas",
    fecha: "2025-07-01",
    duracion: "120",
  },

  pregunta: {
    texto: "¿Cuál es la capital de Chile?",
    tipo: "multiple",
    opciones: ["Santiago", "Valparaíso", "Concepción", "La Serena"],
    respuestaCorrecta: "Santiago",
  },
};
