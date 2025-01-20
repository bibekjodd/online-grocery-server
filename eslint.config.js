import { FlatCompat } from '@eslint/eslintrc';
import pluginJs from '@eslint/js';
import globals from 'globals';
import { dirname } from 'path';
import tseslint from 'typescript-eslint';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname
});

export default [
  { files: ['**/*.{js,mjs,cjs,ts}'] },
  { languageOptions: { globals: globals.node } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  { ignores: ['dist'] },
  ...compat.plugins('drizzle'),
  {
    rules: {
      'drizzle/enforce-delete-with-where': ['error', { drizzleObjectName: 'db' }],
      'drizzle/enforce-update-with-where': ['error', { drizzleObjectName: 'db' }]
    }
  }
];
