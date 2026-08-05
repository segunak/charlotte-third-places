import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import reactCompiler from "eslint-plugin-react-compiler";

export default defineConfig([
  ...nextVitals,
  globalIgnores(["coverage/**", "playwright-report/**", "test-results/**"]),
  {
    plugins: {
      "react-compiler": reactCompiler,
    },
    rules: {
      "react/no-unescaped-entities": "off",
      "react-compiler/react-compiler": "error",
      "react-hooks/purity": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/static-components": "warn",
    },
  },
]);
