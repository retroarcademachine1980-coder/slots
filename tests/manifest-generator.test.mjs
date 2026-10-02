import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { MAX_MODULE_BYTES, CHUNK_DIRECTORY, generateRouteManifestFiles, writeRouteManifestFiles, buildRouteManifest } from '../tools/build-route-manifest.mjs';

const rootModule = 'routeManifest.generated.js';
const reviewed = JSON.parse(fs.readFileSync(new URL('../config/routes/manifest.json', import.meta.url)));
const generated = generateRouteManifestFiles(reviewed);
const byteLength = source => Buffer.byteLength(source, 'utf8');
async function load(files) {
  const modules = new Map();
  for (const [name, source] of files) modules.set(name, new vm.SourceTextModule(source, { identifier: name }));
  const root = modules.get(rootModule);
  await root.link(specifier => {
    assert.match(specifier, /^public\/routes\/routeManifest\.generated\/routeManifest\.generated\.part\d{5,}$/);
    const dependency = modules.get(specifier.slice('public/routes/'.length) + '.js');
    assert.ok(dependency, 'every static Velo import has a generated target: ' + specifier);
    return dependency;
  });
  await root.evaluate();
  return root.namespace.routeManifest;
}
function temporary(t) {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'route-manifest-generator-'));
  t.after(() => fs.rmSync(folder, { recursive: true, force: true }));
  return folder;
}
function verifySizes(files, limit) {
  for (const [name, source] of files) assert.ok(byteLength(source) <= limit, name + ': ' + byteLength(source));
}

test('reviewed manifest compiles losslessly, in order, with the existing shallow Object.freeze export', async () => {
  const result = await load(generated);
  assert.equal(JSON.stringify(result), JSON.stringify(reviewed));
  assert.deepEqual(Object.keys(result), Object.keys(reviewed));
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.entries), false);
  assert.equal(Object.isFrozen(result.endpoints), false);
  assert.equal(Object.isFrozen(result.sourceGroups), false);
  assert.equal(Object.hasOwn(result, 'identity'), true);
  assert.ok(generated.size > 1);
  verifySizes(generated, MAX_MODULE_BYTES);
});

test('full reviewed rebuilds and written module bytes are deterministic', t => {
  const second = generateRouteManifestFiles(reviewed);
  assert.deepEqual([...second], [...generated]);
  const outputDirectory = temporary(t);
  writeRouteManifestFiles(generated, { outputDirectory });
  writeRouteManifestFiles(second, { outputDirectory });
  for (const [name, source] of generated) assert.equal(fs.readFileSync(path.join(outputDirectory, name), 'utf8'), source);
});

test('small manifests preserve every key and value, including own __proto__, numeric keys and ordered arrays', async () => {
  const input = JSON.parse('{"second":null,"first":{"__proto__":{"retained":true},"constructor":false,"2":"two","1":"one","a":[],"b":{}},"array":[3,1,2,"\\u0000",true],"__proto__":"own-root"}');
  const files = generateRouteManifestFiles(input);
  assert.equal(files.size, 1);
  const result = await load(files);
  assert.equal(JSON.stringify(result), JSON.stringify(input));
  assert.equal(Object.hasOwn(result, '__proto__'), true);
  assert.equal(Object.hasOwn(result.first, '__proto__'), true);
  assert.equal(Object.getPrototypeOf(result.first).retained, undefined);
});

test('non-ASCII and escaped strings use UTF-8 byte limits and reconstruct exact nested data', async () => {
  const input = {
    lastFirst: '☃️🦊漢字é"\\\n\ud800'.repeat(1800),
    entries: Array.from({ length: 750 }, (_, i) => ({ id: i, text: 'café 漢字 🎰'.repeat(8), nested: [false, null, i] })),
    sourceGroups: Array.from({ length: 100 }, (_, i) => ({ title: 'Δ group ' + i, approved: false })),
    endpoints: { native: false, evidence: 'kept' }
  };
  // Include a property name larger than a module, plus prototype-sensitive own data.
  input['非常に長いキー'.repeat(800)] = { value: 'still present' };
  Object.defineProperty(input, '__proto__', { value: { retained: true }, enumerable: true });
  const files = generateRouteManifestFiles(input, { maxModuleBytes: 4096 });
  verifySizes(files, 4096);
  assert.ok([...files.values()].some(source => byteLength(source) > source.length));
  assert.equal(JSON.stringify(await load(files)), JSON.stringify(input));
  assert.deepEqual([...generateRouteManifestFiles(input, { maxModuleBytes: 4096 })], [...files]);
});

test('large dependency graphs have bounded intermediate aggregators and only static supported imports', async () => {
  const input = { entries: Array.from({ length: 450 }, (_, i) => ({ index: i, text: 'é'.repeat(360) })) };
  const files = generateRouteManifestFiles(input, { maxModuleBytes: 1024 });
  verifySizes(files, 1024);
  assert.ok(files.size > 450);
  for (const source of files.values()) {
    assert.doesNotMatch(source, /\b(?:fetch|require)\s*\(|\bimport\s*\(|JSON\.parse|Object\.assign/);
    for (const match of source.matchAll(/from '([^']+)'/g)) assert.match(match[1], /^public\/routes\/routeManifest\.generated\//);
  }
  assert.equal(JSON.stringify(await load(files)), JSON.stringify(input));
});

test('rebuild cleanup removes only obsolete generated chunks inside the scoped directory', t => {
  const outputDirectory = temporary(t);
  const chunkDirectory = path.join(outputDirectory, CHUNK_DIRECTORY);
  writeRouteManifestFiles(generated, { outputDirectory });
  fs.writeFileSync(path.join(chunkDirectory, 'notes.txt'), 'keep unrelated contents');
  fs.mkdirSync(path.join(chunkDirectory, 'manual-subfolder'));
  fs.writeFileSync(path.join(chunkDirectory, 'manual-subfolder', 'routeManifest.generated.part99999.js'), 'keep nested files');
  fs.writeFileSync(path.join(outputDirectory, 'routeManifest.generated.part99999.js'), 'keep outside scoped directory');
  const smaller = generateRouteManifestFiles({ entries: [] });
  writeRouteManifestFiles(smaller, { outputDirectory });
  assert.deepEqual(fs.readdirSync(chunkDirectory).sort(), ['manual-subfolder', 'notes.txt']);
  assert.equal(fs.readFileSync(path.join(chunkDirectory, 'notes.txt'), 'utf8'), 'keep unrelated contents');
  assert.equal(fs.readFileSync(path.join(chunkDirectory, 'manual-subfolder', 'routeManifest.generated.part99999.js'), 'utf8'), 'keep nested files');
  assert.equal(fs.readFileSync(path.join(outputDirectory, 'routeManifest.generated.part99999.js'), 'utf8'), 'keep outside scoped directory');
  assert.equal(fs.readFileSync(path.join(outputDirectory, rootModule), 'utf8'), smaller.get(rootModule));
});

test('output symlinks, non-regular generated targets and traversal are rejected before writes', t => {
  const folder = temporary(t);
  const outside = path.join(folder, 'outside');
  fs.mkdirSync(outside);
  fs.writeFileSync(path.join(outside, 'sentinel'), 'untouched');
  const symlinkOutput = path.join(folder, 'symlink-output');
  fs.mkdirSync(symlinkOutput);
  fs.symlinkSync(outside, path.join(symlinkOutput, CHUNK_DIRECTORY));
  assert.throws(() => writeRouteManifestFiles(generated, { outputDirectory: symlinkOutput }), /symlink output/);
  const rootOutput = path.join(folder, 'root-output');
  fs.mkdirSync(rootOutput);
  fs.symlinkSync(path.join(outside, 'sentinel'), path.join(rootOutput, rootModule));
  assert.throws(() => writeRouteManifestFiles(generated, { outputDirectory: rootOutput }), /non-regular generated file/);
  const staleOutput = path.join(folder, 'stale-output');
  fs.mkdirSync(path.join(staleOutput, CHUNK_DIRECTORY), { recursive: true });
  fs.symlinkSync(path.join(outside, 'sentinel'), path.join(staleOutput, CHUNK_DIRECTORY, 'routeManifest.generated.part99999.js'));
  assert.throws(() => writeRouteManifestFiles(generated, { outputDirectory: staleOutput }), /non-regular generated file/);
  assert.equal(fs.existsSync(path.join(staleOutput, rootModule)), false);
  assert.throws(() => writeRouteManifestFiles(new Map([['../escape.js', 'no']]), { outputDirectory: rootOutput }), /Unexpected generated output path/);
  assert.equal(fs.readFileSync(path.join(outside, 'sentinel'), 'utf8'), 'untouched');
});

test('invalid byte budgets and private input fail without replacing generated output', t => {
  for (const maxModuleBytes of [0, -1, 1023, NaN, Infinity, 4096.5]) assert.throws(() => generateRouteManifestFiles({}, { maxModuleBytes }), /Module byte budget/);
  const folder = temporary(t);
  const input = path.join(folder, 'input.json');
  const outputDirectory = path.join(folder, 'output');
  fs.mkdirSync(outputDirectory);
  fs.writeFileSync(path.join(outputDirectory, rootModule), 'prior output');
  fs.writeFileSync(input, JSON.stringify({ entries: [], nested: { auditNotes: 'private' } }));
  assert.throws(() => buildRouteManifest({ input, outputDirectory }), /Private source evidence/);
  assert.equal(fs.readFileSync(path.join(outputDirectory, rootModule), 'utf8'), 'prior output');
});

test('generated basenames use the existing identity exclusion while the self-contained builder stays fingerprinted', () => {
  const identity = fs.readFileSync(new URL('../tools/compute-release-identity.mjs', import.meta.url), 'utf8');
  assert.ok(identity.includes("!entry.name.includes('routeManifest.generated')"));
  assert.ok(identity.includes("'tools/build-route-manifest.mjs'"));
  for (const name of generated.keys()) assert.ok(path.basename(name).includes('routeManifest.generated'));
});
