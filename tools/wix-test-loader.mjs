// Node test adapter only; production uses supported Wix public/backend aliases.
export async function resolve(specifier, context, nextResolve) {
  if (/^(public|backend)\//.test(specifier)) {
    return { url: new URL('../src/' + specifier + '.js', import.meta.url).href, format: 'module', shortCircuit: true };
  }
  const resolved = await nextResolve(specifier, context);
  return resolved.url.startsWith(new URL('../src/',import.meta.url).href) && resolved.url.endsWith('.js') ? {...resolved,format:'module'} : resolved;
}
