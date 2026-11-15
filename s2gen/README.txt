Item page generator for the Studio Two build. Run on dev machine:
python3 gen_item.py 'packages/site-app/src/pages/<prefix>/[[]blank*' <config.json>
Working binding forms (import-site accepts): text -> fn(textToRichText, ctx(...), {placeholder}); RICH_TEXT field -> ctx(...) direct on richText;
URL -> Button link={ctx(...)} direct; IMAGE -> Image image={ctx(...)}. Fields must be declared in the collection schema.
Not allowed: textEnum arg; webUrlToLink on Button.link; Image border-radius; --border* on InternalContainer.
