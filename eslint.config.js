const tsParser = require("@typescript-eslint/parser");

module.exports = [
  { ignores: ["dist/**", "node_modules/**"] },
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 2022, sourceType: "commonjs" }
    },
    rules: {
      "no-console": "off",
      "no-unused-vars": "off"
    }
  }
];
