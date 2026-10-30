#!/usr/bin/env python3
"""Check actual HTML source for the semantic native Spin Raiders homepage.

This intentionally DOES NOT execute JavaScript. Text written as JS template strings
inside a Shadow DOM runtime does not satisfy the initial-HTML requirement.

Usage:
    python tools/check-native-homepage-seo.py docs/homepage-native-seo-20261009.html
    python tools/check-native-homepage-seo.py --url https://www.spin-raiders.com/
Exit 0 = pass; exit 1 = fail. Read-only diagnostic.
"""
import argparse
import html
import json
import pathlib
import re
import sys
import urllib.request
from html.parser import HTMLParser

IGNORED = {"head", "script", "style", "template", "noscript", "svg", "iframe"}
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}
REQUIRED_LINKS = {
    "/days-out", "/places-to-stay", "/offers", "/food-and-drink",
    "/attractions", "/plan-a-trip", "/arcade"
}
WORD = re.compile(r"\b[\w]+(?:['’-][\w]+)*\b", re.UNICODE)

def words(value):
    return len(WORD.findall(value))

class SourceProbe(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.headings = []
        self.paragraphs = []
        self.links = []
        self.robots_noindex = False

    def handle_starttag(self, tag, attrs):
        tag = tag.lower()
        a = dict(attrs)
        ancestor_hidden = any(item["hidden"] for item in self.stack)
        styles = (a.get("style") or "").lower().replace(" ", "")
        classes = set((a.get("class") or "").lower().split())
        hidden = (ancestor_hidden or tag in IGNORED or "hidden" in a
                  or a.get("aria-hidden") == "true"
                  or "sr-only" in classes
                  or "display:none" in styles or "visibility:hidden" in styles)
        if tag == "meta" and a.get("name", "").lower() == "robots":
            if "noindex" in (a.get("content") or "").lower():
                self.robots_noindex = True
        if tag == "a" and not hidden and a.get("href"):
            self.links.append(a["href"])
        if tag not in VOID:
            self.stack.append({"tag": tag, "hidden": hidden, "text": []})

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag.lower() not in VOID:
            self.handle_endtag(tag)

    def handle_data(self, data):
        if not data.strip() or any(item["hidden"] for item in self.stack):
            return
        for item in self.stack:
            if item["tag"] in {"h1", "h2", "p"}:
                item["text"].append(data)

    def handle_endtag(self, tag):
        tag = tag.lower()
        idx = next((i for i in range(len(self.stack) - 1, -1, -1)
                    if self.stack[i]["tag"] == tag), None)
        if idx is None:
            return
        for node in reversed(self.stack[idx:]):
            if node["hidden"]:
                continue
            value = html.unescape(" ".join(node["text"]))
            value = " ".join(value.split())
            if node["tag"] in {"h1", "h2"} and value:
                self.headings.append((node["tag"], value))
            if node["tag"] == "p" and value:
                self.paragraphs.append(value)
        del self.stack[idx:]

def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("html_file", nargs="?", help="HTML source file or fragment")
    ap.add_argument("--url", help="Fetch HTML response without executing JS")
    args = ap.parse_args()
    if bool(args.url) == bool(args.html_file):
        ap.error("Specify exactly one HTML file or --url")
    if args.url:
        with urllib.request.urlopen(
            urllib.request.Request(
                args.url, headers={"User-Agent": "SpinRaidersNativeSEOCheck/1.0"}
            ), timeout=25
        ) as response:
            raw = response.read().decode("utf-8", "replace")
    else:
        raw = pathlib.Path(args.html_file).read_text(encoding="utf-8")

    p = SourceProbe()
    p.feed(raw)
    h1 = [text for level, text in p.headings if level == "h1"]
    h2 = [text for level, text in p.headings if level == "h2"]
    body = " ".join(p.paragraphs)
    paths = {x.split("#")[0].split("?")[0].rstrip("/") or "/"
             for x in p.links if x.startswith("/") and not x.startswith("//")}
    unwanted = [x for x in p.links if re.search(r"[?&](?:explore|collection|place|search)=", x)]
    problems = []
    if len(h1) != 1:
        problems.append(f"expected exactly 1 visible H1 in the HTML; found {len(h1)}")
    elif not re.search(r"uk.+days?\s+out", h1[0], re.I):
        problems.append(f"wrong homepage H1: {h1[0]!r}")
    if len(h2) < 5:
        problems.append(f"expected at least 5 visible H2 headings; found {len(h2)}")
    if words(body) < 400:
        problems.append(f"expected at least 400 words in visible paragraphs; found {words(body)}")
    if len(p.paragraphs) < 8:
        problems.append(f"expected 8+ actual HTML paragraphs; found {len(p.paragraphs)}")
    if "casino offers hub" in body.lower() or "best online casino bonuses" in body.lower():
        problems.append("old casino-homepage promotional copy still present")
    missing = sorted(REQUIRED_LINKS - paths)
    if missing:
        problems.append(f"missing important clean internal links: {', '.join(missing)}")
    if unwanted:
        problems.append(f"old query-string links found: {unwanted[:4]}")
    if p.robots_noindex:
        problems.append("homepage contains meta robots noindex")

    print(json.dumps({
        "passed": not problems,
        "html_bytes": len(raw.encode("utf-8")),
        "h1": h1,
        "h2": h2,
        "paragraph_count": len(p.paragraphs),
        "paragraph_words": words(body),
        "clean_paths": sorted(paths),
        "failures": problems
    }, indent=2, ensure_ascii=False))
    return 1 if problems else 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except (OSError, UnicodeError, ValueError) as exc:
        print("SEO source check could not run: " + str(exc), file=sys.stderr)
        sys.exit(2)
