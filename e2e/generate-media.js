#!/usr/bin/env node

// Script para generar contenido multimedia de demostración
import { exec } from "child_process";
import fs from "fs";
import path from "path";

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
  `${colors.bold}${colors.blue}🎬 GENERADOR DE MULTIMEDIA PARA PRUEBAS E2E${colors.reset}`
);
console.log("=".repeat(60));

// Limpiar resultados anteriores
console.log(
  `${colors.yellow}🧹 Limpiando resultados anteriores...${colors.reset}`
);
const testResultsDir = "test-results";
if (fs.existsSync(testResultsDir)) {
  fs.rmSync(testResultsDir, { recursive: true, force: true });
}

// Crear directorio de resultados
fs.mkdirSync(testResultsDir, { recursive: true });

console.log(`${colors.green}✅ Directorio limpio${colors.reset}\n`);

// Opciones de ejecución
const mediaOptions = [
  {
    name: "Completo (Screenshots + Videos + Traces)",
    command:
      "npx playwright test --config=playwright.config.media.js --project=chromium",
    description: "Genera todo el contenido multimedia con navegador visible",
  },
  {
    name: "Solo una prueba de demostración",
    command:
      "npx playwright test tests/smoke.spec.js --config=playwright.config.media.js --project=chromium",
    description: "Demo rápido con una sola prueba",
  },
  {
    name: "Pruebas de autenticación con multimedia",
    command:
      "npx playwright test tests/auth.spec.js --config=playwright.config.media.js --project=chromium",
    description: "Videos del proceso de login",
  },
  {
    name: "Todas las pruebas en modo headless",
    command: "npx playwright test --config=playwright.config.js",
    description: "Multimedia solo en fallos (configuración normal)",
  },
];

// Función para ejecutar comando
function runCommand(command, description) {
  return new Promise((resolve, reject) => {
    console.log(`${colors.blue}🚀 Ejecutando: ${description}${colors.reset}`);
    console.log(`${colors.cyan}Comando: ${command}${colors.reset}\n`);

    const process = exec(command, { maxBuffer: 1024 * 1024 * 10 }); // 10MB buffer

    process.stdout.on("data", (data) => {
      process.stdout.write(data);
    });

    process.stderr.on("data", (data) => {
      process.stderr.write(data);
    });

    process.on("close", (code) => {
      console.log(
        `\n${colors.yellow}Proceso terminado con código: ${code}${colors.reset}\n`
      );
      if (code === 0) {
        resolve();
      } else {
        resolve(); // Continuar aunque haya fallos
      }
    });

    process.on("error", (error) => {
      console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
      reject(error);
    });
  });
}

// Función para mostrar archivos generados
function showGeneratedFiles() {
  console.log(
    `${colors.bold}${colors.green}📁 ARCHIVOS GENERADOS:${colors.reset}`
  );
  console.log("-".repeat(40));

  const checkPath = (dirPath, type, extension = "") => {
    if (fs.existsSync(dirPath)) {
      const files = fs
        .readdirSync(dirPath, { withFileTypes: true })
        .filter(
          (dirent) =>
            dirent.isFile() && (!extension || dirent.name.endsWith(extension))
        )
        .map((dirent) => dirent.name);

      if (files.length > 0) {
        console.log(`${colors.cyan}${type}:${colors.reset}`);
        files.forEach((file) => {
          const fullPath = path.join(dirPath, file);
          const stats = fs.statSync(fullPath);
          const size = (stats.size / 1024).toFixed(1);
          console.log(`  📄 ${file} (${size} KB)`);
        });
      }
    }
  };

  // Buscar en test-results y subdirectorios
  if (fs.existsSync("test-results")) {
    const testDirs = fs
      .readdirSync("test-results", { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    testDirs.forEach((dir) => {
      const fullDir = path.join("test-results", dir);
      console.log(`\n${colors.yellow}📂 ${dir}:${colors.reset}`);
      checkPath(fullDir, "  Screenshots", ".png");
      checkPath(fullDir, "  Videos", ".webm");
      checkPath(fullDir, "  Traces", ".zip");
    });
  }

  // Mostrar reporte HTML
  if (fs.existsSync("playwright-report/index.html")) {
    console.log(`\n${colors.green}🌐 Reporte HTML disponible:${colors.reset}`);
    console.log(`  📄 playwright-report/index.html`);
  }
}

// Función principal
async function main() {
  const args = process.argv.slice(2);
  let selectedOption = 0;

  if (args.length > 0) {
    const optionIndex = parseInt(args[0]) - 1;
    if (optionIndex >= 0 && optionIndex < mediaOptions.length) {
      selectedOption = optionIndex;
    }
  }

  if (args.length === 0) {
    console.log(`${colors.bold}Opciones disponibles:${colors.reset}`);
    mediaOptions.forEach((option, index) => {
      console.log(`${colors.cyan}${index + 1}.${colors.reset} ${option.name}`);
      console.log(`   ${option.description}`);
    });
    console.log(
      `\n${colors.yellow}Uso: node generate-media.js [1-${mediaOptions.length}]${colors.reset}`
    );
    console.log(
      `${colors.yellow}Ejemplo: node generate-media.js 1${colors.reset}\n`
    );
    selectedOption = 0; // Por defecto la primera opción
  }

  const option = mediaOptions[selectedOption];
  console.log(`${colors.bold}Ejecutando: ${option.name}${colors.reset}\n`);

  try {
    await runCommand(option.command, option.description);

    console.log(
      `${colors.bold}${colors.green}✅ EJECUCIÓN COMPLETADA${colors.reset}\n`
    );

    showGeneratedFiles();

    console.log(`\n${colors.bold}💡 COMANDOS ÚTILES:${colors.reset}`);
    console.log(
      `${colors.cyan}Ver resumen:${colors.reset} npm run test:summary`
    );
    console.log(
      `${colors.cyan}Abrir reporte:${colors.reset} npm run test:open`
    );
    console.log(
      `${colors.cyan}Ver archivos:${colors.reset} ls -la test-results/`
    );
  } catch (error) {
    console.error(
      `${colors.red}❌ Error durante la ejecución: ${error.message}${colors.reset}`
    );
    process.exit(1);
  }
}

main();
