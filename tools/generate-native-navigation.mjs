import { DEFAULT_NATIVE_INPUT, isNativeGeneratorMain, nativeCaptureLabel, nativeGeneratorOptions, readNativeBindings, validateNativeBindings, writeNativeOutputs } from './native-bindings.mjs';

export function generateNativeNavigation(reviewed) {
  const bindings = validateNativeBindings(reviewed);
  const source = '// Reviewed native capture: ' + nativeCaptureLabel(bindings.capture) + '.\n' +
    '// Metadata only. Release gate must verify every final native root before promotion/redirect retirement.\n' +
    'export const NATIVE_STATIC_PATHS = Object.freeze(' + JSON.stringify(bindings.staticPaths, null, 2) + ');\n';
  return { paths: bindings.staticPaths, source };
}
export function buildNativeNavigation({ input = DEFAULT_NATIVE_INPUT, outputRoot } = {}) {
  const result = generateNativeNavigation(readNativeBindings(input));
  writeNativeOutputs(new Map([['src/public/routes/nativeStaticPaths.js', result.source]]), { outputRoot });
  return result;
}
if (isNativeGeneratorMain(import.meta.url)) {
  const result = buildNativeNavigation(nativeGeneratorOptions());
  console.log('Captured ' + Object.keys(result.paths).length + ' exact static/index native bindings, readiness remains separately gated');
}
