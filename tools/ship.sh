#!/bin/sh
# Rebuild the bundles from dist/sr.js, commit everything and push to main. Prints the new short commit hash.
#   sh tools/ship.sh "commit message"
set -e
cd "$(dirname "$0")/.."
python3 tools/size-images.py >/dev/null
python3 tools/split-bundle.py
git add -A
git commit -q -m "$1

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Jj52mpKHjmQzZjeZNRt8Dd"
git fetch -q origin main
git push -q origin HEAD:main
git rev-parse --short HEAD
