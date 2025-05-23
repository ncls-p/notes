// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import nextPlugin from '@next/eslint-plugin-next'; // For Next.js specific rules
import prettierConfig from 'eslint-config-prettier'; // Turns off ESLint rules that conflict with Prettier
// import prettierPlugin from 'eslint-plugin-prettier'; // If you want ESLint to run Prettier and report issues

export default tseslint.config(
  {
    // Global ignores
    ignores: ['node_modules/', '.next/', 'out/', 'public/build/'],
  },
  // Base ESLint recommended rules
  eslint.configs.recommended,
  // TypeScript specific rules
  ...tseslint.configs.recommendedTypeChecked, // Or .recommended for less strictness
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  // Next.js specific configurations
  // The `eslint-config-next` package usually provides these.
  // For flat config, we might need to configure `nextPlugin` manually or find its flat config equivalent.
  // Let's assume `eslint-config-next` handles its integration or provides a flat config.
  // For now, we'll include the plugin and its recommended rules.
  {
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      // Add any specific Next.js rule overrides here
      // e.g. "@next/next/no-html-link-for-pages": "off",
    },
  },
  // Prettier configuration - must be last to override other formatting rules
  prettierConfig // This effectively disables ESLint formatting rules that Prettier handles
  // If using eslint-plugin-prettier to report Prettier issues as ESLint issues:
  // {
  //   plugins: {
  //     prettier: prettierPlugin,
  //   },
  //   rules: {
  //     'prettier/prettier': 'warn', // or 'error'
  //   },
  // }
);