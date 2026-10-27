# DB theme browser checks

Run `npm ci`, `npm run build:db`, then `npm run test:db`. Playwright is a pinned
development dependency. The test uses `CHROMIUM_PATH` when set, system Chromium
at `/usr/bin/chromium` when present, or Playwright's bundled browser otherwise.
For a machine without Chromium, run `npx playwright install chromium` first
(Linux may also need `npx playwright install-deps chromium`). The prepared cloud
environment already includes Chromium.

The test serves the generated `custom-db.css` locally and loads it using a real
CSS `@import`. It checks light and dark modes with the default, blue, and green
accents, text contrast, body-scoped accent inheritance, body-level portal
colors, clickable property/task controls, visible keyboard focus, fixed-height
virtualized table rows, code editor readability, Logseq font preferences, and
mobile overflow. Requests to external font hosts are blocked so the checks do
not depend on an Internet connection.

`db-theme.html` is a focused fixture derived from the DOM/CSS contracts in
[Logseq DB 2.0.2](https://github.com/logseq/logseq/tree/533ac4382a7b69baa98de3a973bff90305b212dc),
particularly `src/main/frontend/components/{theme,table,property,page}.css`,
`resources/css/codemirror.lsradix.css`, and
`deps/shui/src/logseq/shui/components.cljs`. Tailwind utilities relevant to these
contracts are expanded into plain CSS in the fixture. This suite does **not**
boot the complete Logseq application or test its data storage, synchronization,
or actual property editor logic; its small interactions detect CSS that blocks
controls. A final visual check in the user's Logseq DB build remains useful.
