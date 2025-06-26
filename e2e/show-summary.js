#!/usr/bin/env node

// Script para mostrar resumen de pruebas E2E
import fs from "fs";
import path from "path";

const resultsPath = path.join(process.cwd(), "test-results", "results.json");

if (!fs.existsSync(resultsPath)) {
  console.log("❌ No se encontraron resultados de pruebas");
  console.log("💡 Ejecuta las pruebas primero: npm test");
  process.exit(1);
}

try {
  const data = JSON.parse(fs.readFileSync(resultsPath, "utf8"));

  // Colores para terminal
  const colors = {
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m",
    reset: "\x1b[0m",
    bold: "\x1b[1m",
  };

  console.log(
    `\n${colors.bold}${colors.blue}📊 RESUMEN DE PRUEBAS E2E${colors.reset}`
  );
  console.log("=".repeat(50));

  // Estadísticas globales
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  let skippedTests = 0;
  // Función recursiva para procesar suites anidadas
  function processSuites(suites, results) {
    suites.forEach((suite) => {
      // Procesar specs en esta suite
      if (suite.specs && suite.specs.length > 0) {
        let suitePassed = 0;
        let suiteFailed = 0;
        let suiteSkipped = 0;

        suite.specs.forEach((spec) => {
          spec.tests.forEach((test) => {
            test.results.forEach((result) => {
              totalTests++;
              if (result.status === "passed") {
                passedTests++;
                suitePassed++;
              } else if (result.status === "failed") {
                failedTests++;
                suiteFailed++;
              } else if (result.status === "skipped") {
                skippedTests++;
                suiteSkipped++;
              }
            });
          });
        });

        if (suitePassed + suiteFailed + suiteSkipped > 0) {
          results.push({
            title: suite.title,
            passed: suitePassed,
            failed: suiteFailed,
            skipped: suiteSkipped,
            total: suitePassed + suiteFailed + suiteSkipped,
          });
        }
      }

      // Procesar suites anidadas
      if (suite.suites && suite.suites.length > 0) {
        processSuites(suite.suites, results);
      }
    });
  }

  const suiteResults = [];
  processSuites(data.suites, suiteResults);

  // Mostrar estadísticas globales
  const successRate =
    totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;

  console.log(`${colors.green}✅ Pasadas:  ${passedTests}${colors.reset}`);
  console.log(`${colors.red}❌ Fallidas: ${failedTests}${colors.reset}`);
  console.log(`${colors.yellow}⏭️  Omitidas: ${skippedTests}${colors.reset}`);
  console.log(`${colors.cyan}📊 Total:    ${totalTests}${colors.reset}`);
  console.log(`${colors.bold}🎯 Éxito:    ${successRate}%${colors.reset}\n`);

  // Mostrar resultados por suite
  console.log(`${colors.bold}📋 RESULTADOS POR CATEGORIA:${colors.reset}`);
  console.log("-".repeat(50));

  suiteResults.forEach((suite) => {
    const suiteRate =
      suite.total > 0 ? ((suite.passed / suite.total) * 100).toFixed(1) : 0;
    const status = suite.failed === 0 ? `${colors.green}✅` : `${colors.red}❌`;

    console.log(`${status} ${suite.title}${colors.reset}`);
    console.log(
      `   ${colors.green}✅ ${suite.passed}${colors.reset} | ${colors.red}❌ ${suite.failed}${colors.reset} | ${colors.cyan}📊 ${suiteRate}%${colors.reset}`
    );
  });

  // Mostrar información de archivos
  console.log(`\n${colors.bold}📁 ARCHIVOS GENERADOS:${colors.reset}`);
  console.log("-".repeat(50));
  console.log(
    `${colors.cyan}📄 HTML:${colors.reset} playwright-report/index.html`
  );
  console.log(
    `${colors.cyan}📄 JSON:${colors.reset} test-results/results.json`
  );
  console.log(`${colors.cyan}📄 XML:${colors.reset}  test-results/results.xml`);

  console.log(`\n${colors.bold}🌐 PARA VER REPORTE DETALLADO:${colors.reset}`);
  console.log(`${colors.yellow}npx playwright show-report${colors.reset}`);
  console.log(`${colors.yellow}npm run test:report${colors.reset}`);

  // Mostrar información sobre configuración multimedia
  if (failedTests === 0) {
    console.log(`\n${colors.bold}📸 MULTIMEDIA:${colors.reset}`);
    console.log(
      `${colors.green}✅ Configuración eficiente activa${colors.reset}`
    );
    console.log(
      `${colors.yellow}💡 Sin fallos = Sin archivos multimedia generados${colors.reset}`
    );
    console.log(
      `${colors.cyan}🎬 Para generar multimedia: npm run test:generate-media${colors.reset}`
    );
  } else {
    console.log(`\n${colors.bold}📸 MULTIMEDIA GENERADO:${colors.reset}`);
    console.log(
      `${colors.yellow}🎬 Videos y screenshots disponibles en test-results/${colors.reset}`
    );
  }

  console.log("");

  // Mostrar fallos si los hay
  if (failedTests > 0) {
    console.log(
      `${colors.bold}${colors.red}🚨 PRUEBAS FALLIDAS:${colors.reset}`
    );
    console.log("-".repeat(50));

    function showFailures(suites) {
      suites.forEach((suite) => {
        if (suite.specs && suite.specs.length > 0) {
          suite.specs.forEach((spec) => {
            spec.tests.forEach((test) => {
              test.results.forEach((result) => {
                if (result.status === "failed") {
                  console.log(`${colors.red}❌ ${test.title}${colors.reset}`);
                  if (result.error && result.error.message) {
                    console.log(
                      `   ${colors.yellow}Error: ${
                        result.error.message.split("\n")[0]
                      }${colors.reset}`
                    );
                  }
                }
              });
            });
          });
        }

        if (suite.suites && suite.suites.length > 0) {
          showFailures(suite.suites);
        }
      });
    }

    showFailures(data.suites);
    console.log("");
  }
} catch (error) {
  console.error("❌ Error al leer los resultados:", error.message);
  process.exit(1);
}
