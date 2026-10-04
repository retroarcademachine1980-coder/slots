/** Exact native-page fallback projection of the same runtime ownership registry. */
import { DEFAULT_NATIVE_INPUT, isNativeGeneratorMain, nativeGeneratorOptions, projectLoaderPageOwnership, readNativeBindings, writeNativeOutputs } from './native-bindings.mjs';

export const generateLoaderPageOwnership = projectLoaderPageOwnership;
export function buildLoaderPageOwnership({ input = DEFAULT_NATIVE_INPUT, outputRoot } = {}) {
  const result = generateLoaderPageOwnership(readNativeBindings(input));
  writeNativeOutputs(new Map([['generated/loader-page-ownership.json', JSON.stringify(result, null, 2) + '\n']]), { outputRoot });
  return result;
}
if (isNativeGeneratorMain(import.meta.url)) {
  const result = buildLoaderPageOwnership(nativeGeneratorOptions());
  console.log('Exact native fallback projection ' + result.pageIds.length + ' page IDs, ' + JSON.stringify(result).length + ' chars; native runtime verification pending');
}
