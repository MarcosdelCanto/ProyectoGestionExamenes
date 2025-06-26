#!/usr/bin/env node

// Script para abrir reporte HTML en navegador predeterminado
import { exec } from "child_process";
import fs from "fs";
import path from "path";

const reportPath = path.join(process.cwd(), "playwright-report", "index.html");

if (!fs.existsSync(reportPath)) {
  console.log("❌ No se encontró el reporte HTML");
  console.log("💡 Ejecuta las pruebas primero: npm test");
  process.exit(1);
}

const fullPath = path.resolve(reportPath);

console.log("🌐 Abriendo reporte HTML en el navegador...");
console.log(`📄 Archivo: ${fullPath}`);

// Determinar comando según el OS
let command;
switch (process.platform) {
  case "darwin": // macOS
    command = `open "${fullPath}"`;
    break;
  case "win32": // Windows
    command = `start "${fullPath}"`;
    break;
  default: // Linux
    command = `xdg-open "${fullPath}"`;
    break;
}

exec(command, (error) => {
  if (error) {
    console.error("❌ Error al abrir el navegador:", error.message);
    console.log(`💡 Abre manualmente: ${fullPath}`);
  } else {
    console.log("✅ Reporte abierto en el navegador");
  }
});
