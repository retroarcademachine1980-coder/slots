#!/usr/bin/env python3
"""Build the authenticated zero-percent-test entry without URL-inferred modes."""
import pathlib
root=pathlib.Path(__file__).resolve().parent.parent
prod=(root/'generated/routes-authority.js').read_text().strip()
test=(root/'generated/routes-authority.test.js').read_text().strip()
core=(root/'dist/sr.core.min.js').read_text()
assert core.count(prod)==1,'core must contain exactly the current production authority'
compiled=core.replace(prod,test,1)
assert compiled.replace(test,prod,1)==core,'test entry may differ only by explicit authority transport mode'
(root/'dist/sr.core.test.min.js').write_text(compiled)
print('Production and test entries differ only by explicit compiled authority transport')
