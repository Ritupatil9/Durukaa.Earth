module.exports = {
  root: true,
  env: { browser: true, es2021: true, node: true },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "prettier",
  ],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  settings: { react: { version: "detect" } },
  plugins: ["react-refresh"],
  rules: {
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
  },
  ignorePatterns: ["dist", "node_modules"],
  overrides: [
    {
      // Context files intentionally export both a Provider component and a
      // matching `useX()` hook from the same file; that's a standard React
      // pattern, so the fast-refresh-only-components rule is relaxed here.
      files: ["src/context/**/*.jsx"],
      rules: { "react-refresh/only-export-components": "off" },
    },
  ],
};
