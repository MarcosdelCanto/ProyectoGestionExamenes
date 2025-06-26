// Script para probar el endpoint de permisos
import fetch from "node-fetch";

const baseURL = "http://localhost:3001/api";

// Función para hacer login y obtener token
async function login() {
  try {
    const response = await fetch(`${baseURL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email_usuario: "admin@test.com", // Campo correcto del backend
        password_usuario: "admin123", // Campo correcto del backend
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Login exitoso");
      return data.accessToken;
    } else {
      const errorData = await response.text();
      console.log("❌ Error en login:", response.status, errorData);
      return null;
    }
  } catch (error) {
    console.log("❌ Error en login:", error.message);
    return null;
  }
}

// Función para probar el endpoint de permisos
async function testMyPermissions(token) {
  try {
    const response = await fetch(`${baseURL}/usuarios/my-permissions`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const permisos = await response.json();
      console.log("✅ Permisos obtenidos exitosamente:");
      console.log("Total de permisos:", permisos.length);

      // Verificar si existen los permisos que necesitamos para usuarios
      const permisosUsuarios = permisos.filter((p) =>
        p.NOMBRE_PERMISO.includes("USUARIOS")
      );

      console.log("\n🔍 Permisos relacionados con USUARIOS:");
      permisosUsuarios.forEach((p) => {
        console.log(`  - ${p.NOMBRE_PERMISO}: ${p.DESCRIPCION_PERMISO}`);
      });

      // Verificar permisos de CREAR, VER, EDITAR, ELIMINAR
      const actions = ["VER", "CREAR", "EDITAR", "ELIMINAR"];
      console.log("\n📋 Verificación de permisos por acción:");
      actions.forEach((action) => {
        const hasPermission = permisos.some(
          (p) => p.NOMBRE_PERMISO === `${action} USUARIOS`
        );
        console.log(`  ${hasPermission ? "✅" : "❌"} ${action} USUARIOS`);
      });

      return permisos;
    } else {
      console.log("❌ Error obteniendo permisos:", response.status);
      return [];
    }
  } catch (error) {
    console.log("❌ Error en testMyPermissions:", error.message);
    return [];
  }
}

// Función principal
async function main() {
  console.log("🚀 Iniciando prueba de permisos...\n");

  const token = await login();
  if (!token) {
    console.log("❌ No se pudo obtener token, terminando prueba");
    return;
  }

  await testMyPermissions(token);

  console.log("\n✅ Prueba completada");
}

main().catch(console.error);
