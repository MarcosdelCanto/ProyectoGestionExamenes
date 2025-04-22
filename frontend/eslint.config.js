import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import prettier from "eslint-config-prettier";
import { defineConfig } from "eslint/config";
import React from "react";

export default defineConfig([
  // Configuración básica de JavaScript
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    languageOptions: { globals: globals.browser},
    plugins: { react: pluginReact },
    settings: {
      react: {version: "detect"}
    },
    extends: [
      "plugin:react/recommended"
    ],
    rules: {
      "react/prop-types": "off", // Desactiva la regla de prop-types
      "react/react-in-jsx-scope": "off", // Desactiva la regla de React en el scope
    },
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
