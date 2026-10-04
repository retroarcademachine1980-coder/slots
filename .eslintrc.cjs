module.exports = {
  root: true,
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  env: { es2022: true },
  ignorePatterns: ['node_modules/', 'evidence/', '*.log'],
  overrides: [
    {
      files: ['src/backend/**/*.js', 'src/public/**/*.js', 'src/pages/**/*.js'],
      extends: ['plugin:@wix/cli/recommended'],
      plugins: ['spin-raiders'],
      env: { node: true, browser: true },
      globals: { $w: 'readonly' },
      rules: {
        // Upstream1.0.2 misclassifies the documented Velo runtime modules as npm.
        // Our replacement delegates to that rule for every other module name.
        '@wix/cli/no-wix-extraneous-dependencies': 'off',
        'spin-raiders/no-extraneous-site-dependencies': 'error',
        'spin-raiders/no-relative-site-imports': 'error',
        'no-undef': 'error',
        'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }]
      }
    },
    { files: ['src/runtime/**/*.js', 'dist/**/*.js', 'generated/**/*.js'], env: { browser: true } },
    { files: ['tools/**/*.{js,cjs,mjs}', 'tests/**/*.{js,cjs,mjs}', '*.cjs'], env: { node: true } }
  ]
};
