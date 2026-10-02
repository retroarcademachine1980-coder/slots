/** Compile the one reviewed, versioned manifest input. Does not infer readiness. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRouteContext } from '../src/public/routes/canonicalRoutes.js';

// A conservative engineering budget, not a documented Wix server limit.
export const MAX_MODULE_BYTES = 100_000;
export const CHUNK_DIRECTORY = 'routeManifest.generated';
const ROOT_MODULE = 'routeManifest.generated.js';
const CHUNK_FILE = /^routeManifest\.generated\.part\d{5,}\.js$/;
const HEADER = '// Generated from the reviewed route manifest. Edit its one versioned input, not this module.\n';
const defaultInput = new URL('../config/routes/manifest.json', import.meta.url);
const defaultOutput = new URL('../src/public/routes/', import.meta.url);
const bytes = source => Buffer.byteLength(source, 'utf8');
const node = (expression, dependencies = []) => ({ expression, dependencies: new Set(dependencies) });
const dependenciesOf = nodes => nodes.flatMap(item => [...item.dependencies]);
const propertyName = key => key === '__proto__' ? '["__proto__"]' : JSON.stringify(key);

// JSON object literals need a computed __proto__ key to preserve it as own data.
function literal(value) {
  if (Array.isArray(value)) return '[' + value.map(literal).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.entries(value).map(([key, item]) => propertyName(key) + ':' + literal(item)).join(',') + '}';
  return JSON.stringify(value);
}

/** Return deterministic ES modules without reading, writing, or changing the input. */
export function generateRouteManifestFiles(manifest, { maxModuleBytes = MAX_MODULE_BYTES } = {}) {
  if (!Number.isSafeInteger(maxModuleBytes) || maxModuleBytes < 1024) throw Error('Module byte budget must be an integer of at least 1024');
  const files = new Map();
  let part = 0;
  const fileName = name => 'routeManifest.generated.' + name + '.js';
  function render(value, root = false) {
    const imports = [...value.dependencies].map(name => "import { manifestPart as " + name + " } from 'public/routes/" + CHUNK_DIRECTORY + '/' + fileName(name).slice(0, -3) + "';\n").join('');
    return HEADER + imports + (root ? 'export const routeManifest = Object.freeze(' + value.expression + ');\n' : 'export const manifestPart = ' + value.expression + ';\n');
  }
  // Include root's slightly larger wrapper in every fit check.
  const fits = value => bytes(render(value, true)) <= maxModuleBytes;
  function emit(value) {
    if (!fits(value)) throw Error('Cannot fit generated route manifest module into byte budget');
    const name = 'part' + String(part++).padStart(5, '0');
    files.set(CHUNK_DIRECTORY + '/' + fileName(name), render(value));
    return node(name, [name]);
  }
  function container(items, kind) {
    const expression = kind === 'string' ? items.map(item => item.expression).join('+') :
      (kind === 'array' ? '[' : '{') + items.map(item => item.expression).join(',') + (kind === 'array' ? ']' : '}');
    return node(expression, dependenciesOf(items));
  }
  function pack(items, kind) {
    const groups = [];
    let current = [];
    for (const item of items) {
      if (current.length && !fits(container([...current, item], kind))) {
        groups.push(container(current, kind));
        current = [];
      }
      if (!fits(container([item], kind))) throw Error('Cannot fit structural route manifest item into byte budget');
      current.push(item);
    }
    if (current.length || !groups.length) groups.push(container(current, kind));
    if (groups.length === 1) return groups[0];
    // Intermediate aggregators also stay under budget, even with very many chunks.
    return pack(groups.map(value => {
      const reference = emit(value);
      return kind === 'string' ? reference : node('...' + reference.expression, reference.dependencies);
    }), kind);
  }
  function compile(value) {
    const inline = node(literal(value));
    if (fits(inline)) return inline;
    if (typeof value === 'string') {
      const capacity = maxModuleBytes - bytes(render(node('""'), true));
      const pieces = [];
      let text = '', size = 0;
      // Keep surrogate pairs intact and measure escaped UTF-8, not JS character count.
      for (const character of value) {
        const length = bytes(JSON.stringify(character)) - 2;
        if (size + length > capacity) {
          pieces.push(emit(node(JSON.stringify(text))));
          text = ''; size = 0;
        }
        text += character; size += length;
      }
      if (text) pieces.push(emit(node(JSON.stringify(text))));
      return pack(pieces, 'string');
    }
    if (Array.isArray(value)) {
      return pack(value.map(item => {
        const compiled = compile(item);
        return fits(container([compiled], 'array')) ? compiled : emit(compiled);
      }), 'array');
    }
    if (value && typeof value === 'object') {
      return pack(Object.entries(value).map(([key, item]) => {
        let compiled = compile(item);
        let keyNode = node(propertyName(key));
        const property = () => node(keyNode.expression + ':' + compiled.expression, dependenciesOf([keyNode, compiled]));
        if (!fits(container([property()], 'object'))) compiled = emit(compiled);
        if (!fits(container([property()], 'object'))) {
          const keyReference = emit(compile(key));
          keyNode = node('[' + keyReference.expression + ']', keyReference.dependencies);
        }
        return property();
      }), 'object');
    }
    throw Error('Cannot fit route manifest value into byte budget');
  }
  const root = compile(manifest);
  files.set(ROOT_MODULE, render(root, true));
  return files;
}

/** Replace only this generator's exact filenames; preserve unrelated directory contents. */
export function writeRouteManifestFiles(files, { outputDirectory = defaultOutput } = {}) {
  const directory = outputDirectory instanceof URL ? fileURLToPath(outputDirectory) : path.resolve(outputDirectory);
  const chunkDirectory = path.join(directory, CHUNK_DIRECTORY);
  const assertRegular = file => {
    const stat = fs.lstatSync(file, { throwIfNoEntry: false });
    if (stat && !stat.isFile()) throw Error('Refusing to replace non-regular generated file: ' + file);
  };
  for (const folder of [directory, chunkDirectory]) {
    const stat = fs.lstatSync(folder, { throwIfNoEntry: false });
    if (stat && (!stat.isDirectory() || stat.isSymbolicLink())) throw Error('Refusing non-directory or symlink output: ' + folder);
  }
  const stale = fs.existsSync(chunkDirectory) ? fs.readdirSync(chunkDirectory).filter(name => CHUNK_FILE.test(name) && !files.has(CHUNK_DIRECTORY + '/' + name)) : [];
  for (const name of files.keys()) {
    if (name !== ROOT_MODULE && !(name.startsWith(CHUNK_DIRECTORY + '/') && CHUNK_FILE.test(name.slice(CHUNK_DIRECTORY.length + 1)))) throw Error('Unexpected generated output path: ' + name);
    assertRegular(path.join(directory, name));
  }
  for (const name of stale) assertRegular(path.join(chunkDirectory, name));
  fs.mkdirSync(directory, { recursive: true });
  if (files.size > 1) fs.mkdirSync(chunkDirectory, { recursive: true });
  // Chunks precede the root that imports them; stale cleanup follows the new root.
  for (const [name, source] of files) fs.writeFileSync(path.join(directory, name), source);
  for (const name of stale) fs.unlinkSync(path.join(chunkDirectory, name));
}

function validateNoPrivate(value) {
  if (!value || typeof value !== 'object') return;
  for (const [key, item] of Object.entries(value)) {
    if (['sourceSnapshots', 'sourceRecords', '_owner', 'auditNotes'].includes(key) || /backup/i.test(key)) throw Error('Private source evidence must not enter public route manifest: ' + key);
    validateNoPrivate(item);
  }
}

export function buildRouteManifest({ input = defaultInput, outputDirectory = defaultOutput } = {}) {
  const manifest = JSON.parse(fs.readFileSync(input));
  const context = createRouteContext(manifest);
  if (context.issues.length) throw Error('Invalid route manifest: ' + JSON.stringify(context.issues));
  validateNoPrivate(manifest);
  const files = generateRouteManifestFiles(manifest);
  writeRouteManifestFiles(files, { outputDirectory });
  return { entries: manifest.entries.length, deploymentBlocked: manifest.deploymentBlocked, modules: files.size, maxModuleBytes: Math.max(...[...files.values()].map(bytes)) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = buildRouteManifest({ input: process.argv[2] || defaultInput });
  console.log('Compiled ' + result.entries + ' reviewed bindings into ' + result.modules + ' modules; largest=' + result.maxModuleBytes + ' UTF-8 bytes; deploymentBlocked=' + String(result.deploymentBlocked));
}
