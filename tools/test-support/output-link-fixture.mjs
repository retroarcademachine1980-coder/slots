import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

// Windows junctions exercise the same non-regular-output guard without requiring
// elevated symlink privileges. File-target symlinks remain covered on other hosts.
export function createOutputLinkFixture(target, link) {
    let destination = path.resolve(target);
    if (process.platform === 'win32' && !fs.statSync(destination).isDirectory()) {
        destination += '.fixture-directory';
        fs.mkdirSync(destination, { recursive: true });
    }
    fs.symlinkSync(destination, link, process.platform === 'win32' ? 'junction' : undefined);
    assert.equal(fs.lstatSync(link).isSymbolicLink(), true);
}
