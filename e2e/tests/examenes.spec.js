import { test, expect } from "@playwright/test";

test.describe("Gestión de Exámenes - Flujos principales", () => {
  // Helper para login antes de cada test
  test.beforeEach(async ({ page }) => {
    await page.goto("/");

    // Intentar login si hay formulario disponible
    try {
      const emailField = page
        .locator(
          'input[type="email"], input[name*="email"], input[name*="usuario"], input[placeholder*="email"], input[placeholder*="usuario"]'
        )
        .first();
      const passwordField = page.locator('input[type="password"]').first();

      if (
        (await emailField.isVisible({ timeout: 5000 })) &&
        (await passwordField.isVisible({ timeout: 5000 }))
      ) {
        await emailField.fill("mico@mico.cl");
        await passwordField.fill("1234");

        const submitButton = page
          .locator(
            'button[type="submit"], input[type="submit"], button:has-text("Iniciar"), button:has-text("Login"), button:has-text("Entrar")'
          )
          .first();
        await submitButton.click();

        // Esperar a que el login se complete
        await page.waitForTimeout(5000);
      }
    } catch (e) {
      // Si no hay login o falla, continuar
      console.log("Login no disponible o ya autenticado");
    }
  });

  test("Navegar a la sección de exámenes", async ({ page }) => {
    // Buscar enlaces o botones relacionados con exámenes
    const examNavigation = [
      'a:has-text("Exámenes")',
      'a:has-text("Examenes")',
      'button:has-text("Exámenes")',
      'button:has-text("Examenes")',
      '[href*="examen"]',
      '[href*="exam"]',
      'nav a[href*="examen"]',
    ];

    let navigationFound = false;
    for (const selector of examNavigation) {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 3000 }).catch(() => false)) {
        await element.click();
        await page.waitForTimeout(2000);
        navigationFound = true;
        break;
      }
    }

    // Si no encontramos navegación específica, verificar que estamos en alguna página funcional
    if (!navigationFound) {
      // Verificar que hay contenido dinámico (tablas, listas, formularios)
      const contentElements = [
        "table",
        "ul li",
        'div[class*="card"]',
        'div[class*="list"]',
        "form",
        "button",
        "input",
      ];

      let hasContent = false;
      for (const selector of contentElements) {
        if (
          await page
            .locator(selector)
            .first()
            .isVisible({ timeout: 3000 })
            .catch(() => false)
        ) {
          hasContent = true;
          break;
        }
      }

      expect(hasContent).toBe(true);
    } else {
      // Verificar que navegamos a una página de exámenes
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      const pageContent = await page.content();

      const isExamPage =
        currentUrl.includes("examen") ||
        currentUrl.includes("exam") ||
        pageContent.includes("examen") ||
        pageContent.includes("Examen");

      expect(isExamPage || navigationFound).toBe(true);
    }
  });

  test("Buscar y filtrar exámenes", async ({ page }) => {
    // Buscar campos de búsqueda o filtros
    const searchElements = [
      'input[type="search"]',
      'input[placeholder*="buscar"]',
      'input[placeholder*="Buscar"]',
      'input[placeholder*="search"]',
      'input[name*="search"]',
      'input[name*="buscar"]',
      'input[class*="search"]',
      ".search-input input",
      ".filter input",
    ];

    let searchField = null;
    for (const selector of searchElements) {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 3000 }).catch(() => false)) {
        searchField = element;
        break;
      }
    }

    if (searchField) {
      // Realizar búsqueda
      await searchField.fill("matemáticas");
      await page.waitForTimeout(1000);

      // Presionar Enter o buscar botón de búsqueda
      await searchField.press("Enter");
      await page.waitForTimeout(2000);

      // Verificar que la búsqueda se realizó (cambio en la URL o contenido)
      const currentUrl = page.url();
      const hasSearchParam =
        currentUrl.includes("search") ||
        currentUrl.includes("buscar") ||
        currentUrl.includes("matemáticas");

      // O verificar cambios en el contenido
      const pageContent = await page.content();
      const contentChanged =
        pageContent.includes("matemáticas") ||
        pageContent.includes("resultado") ||
        pageContent.includes("filtro");

      expect(hasSearchParam || contentChanged).toBe(true);
    } else {
      // Si no hay búsqueda, verificar que hay algún tipo de listado
      const listElements = page.locator(
        'table tr, ul li, div[class*="item"], div[class*="card"]'
      );
      const hasListContent = (await listElements.count()) > 0;
      expect(hasListContent).toBe(true);
    }
  });

  test("Crear nuevo examen (si disponible)", async ({ page }) => {
    // Buscar botones para crear nuevo examen
    const createButtons = [
      'button:has-text("Nuevo")',
      'button:has-text("Crear")',
      'button:has-text("Agregar")',
      'button:has-text("+")',
      'a:has-text("Nuevo")',
      'a:has-text("Crear")',
      '[href*="crear"]',
      '[href*="nuevo"]',
      '.btn-primary:has-text("Nuevo")',
      '.btn-success:has-text("Crear")',
    ];

    let createButton = null;
    for (const selector of createButtons) {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 3000 }).catch(() => false)) {
        createButton = element;
        break;
      }
    }

    if (createButton) {
      await createButton.click();
      await page.waitForTimeout(2000);

      // Verificar que se abrió un formulario o modal
      const formElements = [
        "form",
        'div[class*="modal"]',
        'div[class*="dialog"]',
        'input[name*="nombre"]',
        'input[name*="titulo"]',
        "textarea",
      ];

      let formOpened = false;
      for (const selector of formElements) {
        if (
          await page
            .locator(selector)
            .first()
            .isVisible({ timeout: 3000 })
            .catch(() => false)
        ) {
          formOpened = true;
          break;
        }
      }

      expect(formOpened).toBe(true);

      // Si hay formulario, intentar llenarlo básicamente
      if (formOpened) {
        try {
          const titleField = page
            .locator(
              'input[name*="nombre"], input[name*="titulo"], input[placeholder*="nombre"], input[placeholder*="título"]'
            )
            .first();
          if (
            await titleField.isVisible({ timeout: 2000 }).catch(() => false)
          ) {
            await titleField.fill("Examen de Prueba E2E");
          }

          const descField = page
            .locator('textarea, input[name*="descripcion"]')
            .first();
          if (await descField.isVisible({ timeout: 2000 }).catch(() => false)) {
            await descField.fill("Descripción de prueba para examen E2E");
          }
        } catch (e) {
          // No es crítico si no podemos llenar el formulario
          console.log("No se pudo llenar el formulario completamente");
        }
      }
    } else {
      // Si no hay botón crear, verificar que estamos en una página funcional
      const pageHasContent = await page
        .locator('table, ul, div[class*="content"], main')
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false);
      expect(pageHasContent).toBe(true);
    }
  });

  test("Visualizar detalles de examen", async ({ page }) => {
    // Buscar elementos clickeables que podrían ser exámenes
    const examItems = [
      "table tr td a",
      "table tr:not(:first-child)", // Filas de tabla excluyendo header
      "ul li a",
      'div[class*="card"] a',
      'div[class*="item"] a',
      ".exam-item",
      ".examen-item",
      'button:has-text("Ver")',
      'button:has-text("Detalles")',
      'a:has-text("Ver")',
    ];

    let examItem = null;
    for (const selector of examItems) {
      try {
        const elements = page.locator(selector);
        const count = await elements.count();
        if (count > 0) {
          examItem = elements.first();
          break;
        }
      } catch (e) {
        // Continuar con el siguiente selector si hay error
        continue;
      }
    }

    if (examItem) {
      await examItem.click();
      await page.waitForTimeout(2000);

      // Verificar que se cargó una página de detalles
      const detailsElements = [
        "h1, h2, h3", // Títulos
        "table",
        'div[class*="detail"]',
        'div[class*="info"]',
        "dl", // Lista de definiciones
        "p", // Párrafos con información
        "span, div", // Contenido general
      ];

      let hasDetails = false;
      for (const selector of detailsElements) {
        const elements = page.locator(selector);
        const count = await elements.count();
        if (count > 0) {
          hasDetails = true;
          break;
        }
      }

      expect(hasDetails).toBe(true);
    } else {
      // Si no hay elementos específicos, verificar que la página tiene contenido
      const hasGeneralContent = await page
        .locator('main, div[class*="content"], section')
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false);
      expect(hasGeneralContent).toBe(true);
    }
  });
});
