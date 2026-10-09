// Lossless compression of the reviewed inline guard to fit Wix's embed character
// limit. This changes storage only; no resource, check or inline text is lost.
export function packPlan(plan) {
  const input = new TextEncoder().encode(JSON.stringify(plan));
  const dictionary = new Map();
  for (let i = 0; i < 256; i++) dictionary.set(String.fromCharCode(i), i);
  let next = 256, word = '', output = '';
  for (const byte of input) {
    const char = String.fromCharCode(byte), joined = word + char;
    if (dictionary.has(joined)) word = joined;
    else {
      output += String.fromCharCode(4096 + dictionary.get(word));
      if (next >= 49152) throw new Error('Preserved plan exceeds encoding budget');
      dictionary.set(joined, next++); word = char;
    }
  }
  if (word) output += String.fromCharCode(4096 + dictionary.get(word));
  return output;
}

export function unpackPlan(packed) {
  const dictionary = Array.from({ length: 256 }, (_, i) => String.fromCharCode(i));
  let previous = '', output = '';
  for (const char of packed) {
    const code = char.charCodeAt(0) - 4096;
    const word = dictionary[code] ?? (code === dictionary.length && previous ? previous + previous[0] : null);
    if (word === null) throw new Error('Invalid preserved resource plan');
    output += word;
    if (previous) dictionary.push(previous + word[0]);
    previous = word;
  }
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(output, char => char.charCodeAt(0))));
}

