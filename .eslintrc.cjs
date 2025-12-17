/** @type {import("eslint").Linter.Config} */
const config = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true,
  },
  plugins: ["@typescript-eslint"],
  ignorePatterns: ["src/features/chat/editor/diff.js"],
  extends: [
    "next",
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended-type-checked",
    "plugin:@typescript-eslint/stylistic-type-checked",
  ],
  rules: {
    // These opinionated rules are enabled in stylistic-type-checked above.
    // Feel free to reconfigure them to your own preference.
    "@typescript-eslint/array-type": "off",
    "@typescript-eslint/consistent-type-definitions": "off",
    // no-empty-interface:
    "@typescript-eslint/no-empty-interface": "warn",
    // react/no-unescaped-entities:
    "react/no-unescaped-entities": "off",
    "@typescript-eslint/consistent-type-imports": "off",
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/require-await": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/non-nullable-type-assertion-style": "off",
    // or operator and nullish coalescing operator mean something different
    "@typescript-eslint/prefer-nullish-coalescing": "off",
    // no-unsafe:
    "@typescript-eslint/no-unsafe-assignment": "warn",
    "@typescript-eslint/no-misused-promises": [
      "error",
      {
        checksVoidReturn: { attributes: false },
      },
    ],
  },
};

module.exports = config;
