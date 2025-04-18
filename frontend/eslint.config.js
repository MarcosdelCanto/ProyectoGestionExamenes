import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import prettier from "eslint-config-prettier";
import { defineConfig } from "eslint/config";

export default defineConfig([
  // Configuración básica de JavaScript
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    plugins: { js },
    extends: ["js/recommended"],
  },

  // Configuración del entorno del navegador
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    languageOptions: {
      globals: globals.browser,
      ecmaVersion: 2021,
      sourceType: "module",
    },
  },

  // Configuración para React
  pluginReact.configs.flat.recommended,

  // 👉 Integración con Prettier para evitar conflictos con ESLint
  {
    name: "prettier",
    rules: prettier.rules,
  },
]);
