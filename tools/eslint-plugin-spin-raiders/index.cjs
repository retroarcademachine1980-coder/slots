'use strict';
const wix = require('@wix/eslint-plugin-cli');
const fs = require('node:fs'), path = require('node:path');
// These are platform-provided Velo modules, not npm site dependencies. Keep this
// exact allowlist; an arbitrary wix-* package must still fail upstream validation.
const PLATFORM_MODULES = new Set([
  'wix-data', 'wix-fetch', 'wix-http-functions', 'wix-location-frontend',
  'wix-router', 'wix-seo-frontend', 'wix-web-module', 'wix-window-frontend'
]);
function importValue(node) {
  if (node.source?.type === 'Literal') return node.source.value;
  if (node.type === 'CallExpression' && node.callee?.type === 'Identifier' && node.callee.name === 'require' && node.arguments?.length === 1 && node.arguments[0].type === 'Literal') return node.arguments[0].value;
  return null;
}
const upstream = wix.rules['no-wix-extraneous-dependencies'];
module.exports = {
  rules: {
    'no-private-backend-site-imports': {
      meta: { type: 'problem', schema: [], messages: { private: 'Pages and public modules may import only existing backend .web.js or .jsw web modules.' } },
      create(context) {
        const filename = context.getPhysicalFilename();
        let root = path.dirname(filename);
        while (!fs.existsSync(path.join(root, 'package.json')) && path.dirname(root) !== root) root = path.dirname(root);
        const src = path.join(root, 'src');
        const relative = path.relative(src, filename).replace(/\\/g, '/');
        if (!/^(?:pages|public)\//.test(relative)) return {};
        function check(node) {
          const value = importValue(node);
          if (typeof value !== 'string' || !value.startsWith('backend/')) return;
          const target = /\.(?:web\.js|jsw|js)$/.test(value) ? value : value.endsWith('.web') ? value + '.js' : value + '.jsw';
          if (!/\.(?:web\.js|jsw)$/.test(target) || !fs.existsSync(path.join(src, target))) context.report({ node, messageId: 'private' });
        }
        return { ImportDeclaration: check, ExportNamedDeclaration: check, ExportAllDeclaration: check, ImportExpression: check, CallExpression: check };
      }
    },
    'no-extraneous-site-dependencies': {
      meta: { ...upstream.meta, docs: { description: 'Preserve Wix dependency validation with an exact documented Velo platform-module allowance' } },
      create(context) {
        const visitors = upstream.create(context);
        return Object.fromEntries(Object.entries(visitors).map(([event, visit]) => [event, node => {
          if (PLATFORM_MODULES.has(importValue(node))) return;
          return visit(node);
        }]));
      }
    },
    'no-relative-site-imports': {
      meta: { type: 'problem', schema: [], messages: { relative: 'Use a supported public/... or backend/... Velo alias; repository-relative site imports are not supported.' } },
      create(context) {
        function check(node) { const value = importValue(node); if (typeof value === 'string' && value.startsWith('.')) context.report({ node, messageId: 'relative' }); }
        return { ImportDeclaration: check, ExportNamedDeclaration: check, ExportAllDeclaration: check, ImportExpression: check, CallExpression: check };
      }
    }
  }
};
