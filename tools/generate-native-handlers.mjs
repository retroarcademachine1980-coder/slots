import { DEFAULT_NATIVE_INPUT, isNativeGeneratorMain, legacyDynamicHookPrefixes, nativeCaptureLabel, nativeGeneratorOptions, readNativeBindings, validateNativeBindings, writeNativeOutputs } from './native-bindings.mjs';

export function generateNativeHandlers(reviewed) {
  const bindings = validateNativeBindings(reviewed);
  let source = '// Generated only from reviewed captured native handler names.\n' +
    '// ' + nativeCaptureLabel(bindings.capture) + '; native runtime acceptance pending.\n' +
    "import { canonicalRouter, canonicalSitemap } from 'backend/nativeRoutingService';\n\n";
  const summaries = [];
  for (const router of bindings.customRouters) {
    if (router.routeRole === 'legacy-alias') {
      source += `export async function ${router.routerFunctionName}(request) { return legacyPathRouter('/${router.prefix}', request); }\n`;
      source += `export function ${router.siteMapFunctionName}() { return []; }\n\n`;
    } else {
      source += `export async function ${router.routerFunctionName}(request) { return canonicalRouter('${router.kind}', request); }\n`;
      source += `export async function ${router.siteMapFunctionName}() { return canonicalSitemap('${router.kind}'); }\n\n`;
    }
    summaries.push({ ...router, status: 'captured-shell-only' });
  }
  source += '// Dynamic hook spellings follow the documented prefix convention; invocation is a native test gate.\n';
  source += "import { foodBeforeRouter, foodCustomizeQuery, foodAfterRouter } from 'backend/dynamicRoutingService';\n";
  source += "import { legacyPathRouter } from 'backend/legacyRoutingService';\n";
  source += 'export function food_and_drink_beforeRouter(request) { return foodBeforeRouter(request); }\n';
  source += 'export function food_and_drink_customizeQuery(request, route, query) { return foodCustomizeQuery(request, route, query); }\n';
  source += 'export function food_and_drink_afterRouter(request, response) { return foodAfterRouter(request, response); }\n';
  for (const prefix of legacyDynamicHookPrefixes()) {
    source += `export function ${prefix.slice(1).replace(/-/g, '_')}_beforeRouter(request) { return legacyPathRouter('${prefix}', request); }\n`;
  }
  return { source, summaries };
}

export function buildNativeHandlers({ input = DEFAULT_NATIVE_INPUT, outputRoot } = {}) {
  const result = generateNativeHandlers(readNativeBindings(input));
  writeNativeOutputs(new Map([
    ['src/backend/routers.js', result.source],
    ['docs/captured-native-handlers.json', JSON.stringify(result.summaries, null, 2) + '\n']
  ]), { outputRoot });
  return result;
}
if (isNativeGeneratorMain(import.meta.url)) {
  const result = buildNativeHandlers(nativeGeneratorOptions());
  console.log('Generated ' + result.summaries.length + ' exact router/sitemap pairs; native runtime verification pending');
}
