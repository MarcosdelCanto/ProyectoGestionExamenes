import js from "@eslint/js";
import globals from "globals";
import prettier from "eslint-config-prettier";
import { defineConfig } from "eslint/config";

export default defineConfig([
  // 🔹 Reglas recomendadas de JavaScript
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: ["js/recommended"],
  },

  // 🔹 Configuración del entorno Node.js
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      globals: globals.node, // 👈 Cambiado de browser a node
    },
  },

  // 🔹 Integración con Prettier
  {
    name: "prettier",
    rules: prettier.rules,
  },
]);
