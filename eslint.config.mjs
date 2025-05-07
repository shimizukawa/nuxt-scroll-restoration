// @ts-check
import { createConfigForNuxt } from '@nuxt/eslint-config/flat';

export default createConfigForNuxt().append(
  {
    files: ['**/*.ts'],
    rules: {
      "@typescript-eslint/no-unused-vars": "error",
    },
  },
);
