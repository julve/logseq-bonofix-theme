<h1 align="center">
  <br>logseq-bonofix-theme<br>
</h1>

<p align="center">
  <a href="#screenshots">🌠 Screenshots</a>
   | 
  <a href="#install">📦 Install</a>
   | 
  <a href="#whats-different">✨ What's different</a>
   | 
  <a href="#how-to-build">🔨 How to build</a>
</p>


This is a clean theme for [Logseq](https://github.com/logseq/logseq), focusing on bullet journal and long time writing experience.

## Screenshots

The style is strongly inspired by [logseq-bujo-theme](https://github.com/PiotrSss/logseq-bujo-theme ) and [Notion](https://notion.so). The code is mainly based on bujo theme, and you may find the style really notion-like.

![Desktop](./media/Desktop-2022-05-23.jpg)

It partially adapts to the custom accent color in logseq's settings. You can change the default accent(blue) color without obvious style breaking.

## Install

### Logseq DB

Use **`custom-db.css`** for **Logseq DB 2.0.2**. It includes light and
dark modes, your selected accent color, DB tag pills, round checkboxes, property
panels, code blocks, and table styling that preserves virtualized row sizes.
The original `custom.css` below is for file-based graphs.

1. Open your DB graph, then **Settings → General → Custom theme → Edit custom.css**.
2. Put this import at the **top** of the editor, before any other CSS rules:

   ```css
   @import url("https://cdn.jsdelivr.net/gh/julve/logseq-bonofix-theme@bonofix-logseq-db/custom-db.css");
   ```

3. Save the file; reload Logseq if the theme does not appear immediately.

The URL requires the `bonofix-logseq-db` branch and `custom-db.css` to be published
in this public fork. jsDelivr caches branch URLs; for a fixed version, replace
`bonofix-logseq-db` in the URL with the published commit SHA. Use only the DB
stylesheet, rather than also importing the file-graph theme.

For offline use, paste the contents of [`custom-db.css`](custom-db.css) into the
same in-app editor instead of importing it. The optional IBM Plex font still
loads from a CDN, with system-font fallbacks when offline. In DB graphs this
custom.css is stored in the database, so a graph folder is not required. If you
already configured `:custom-css-url` in config.edn, remove that setting to use the
graph's custom.css; the configured URL takes precedence.

Compatibility targets the official [Logseq DB 2.0.2 source](https://github.com/logseq/logseq/tree/533ac4382a7b69baa98de3a973bff90305b212dc).
Browser regression checks cover representative DB markup; this is not a claim
that every Logseq DB release or a running DB graph has been tested.

### File-based Logseq

Here are two ways of installing the original theme in file-based Logseq.

### Install plugin

<img src="./media/plugin.png" alt="Tags" width="450px" />

- Open Logseq → Plugins → Market Place, install **Bonofix Theme** plugin

- Open Logseq → Themes, choose your theme

### Install `custom.css`

- General installation

  Copy the whole content of [custom.css](https://raw.githubusercontent.com/Sansui233/logseq-bonofix-theme/master/custom.css) into your `graphname/logseq/custom.css` file.

- If you are always working online

  Copy this one-line-installation into your logseq/custom.css file

  ```css
  @import url('https://cdn.jsdelivr.net/gh/sansui233/logseq-bonofix-theme/custom.css');
  ```

## What's different

**Functional style**

- Simple but functional colors

- Make tippy window like responsive card instead of filling the screen and obscuring text. (Legacy bcz Logseq default theme has made it)

- Wrap text in query table results to make it easier to read. Table remains to scroll if too many columns

**Additional Styles**

- Calender emoji before journal title  
  <img src="./media/journal-title-emoji.png" alt="Journal Title Emoji" width="600px" />

- Round tags  
  <img src="./media/tag-label.png" alt="Tags" width="300px" />

- Round checkbox 

## How to build

1. Install [node](https://nodejs.org/)
2. Clone repo  
  ```shell
  git clone https://github.com/Sansui233/logseq-bonofix-theme.git && cd logseq-bonofix-theme
  ```
3. Install dependencies  
  ```shell
npm install
  ```
4. Run build  

  ```shell
  npm run build
  ```

For the DB version (Node.js 18 or newer for the browser tests):

```shell
npm ci
npm run build:db       # source/db.scss → custom-db.css (ready to import)
npm run watch:db       # development output: css/db.css
```

Run the DB browser checks with an installed Chromium browser:

```shell
npx playwright install chromium  # once, if Chromium is not already installed
npm run test:db
```

The tests use `/usr/bin/chromium` when available, otherwise Playwright's installed
Chromium. Set `CHROMIUM_PATH` to choose another executable. They cover light/dark
modes and accent colors, menus, property editing controls, task states, tags,
virtualized table geometry, font preferences, and narrow layouts using a DOM
fixture based on upstream DB components. They do not start Logseq itself.

If installation is blocked by the lockfile's old `registry.npmmirror.com` URLs,
cache the same pinned packages from the official registry, then install with the
original lockfile and integrity checks intact:

```shell
for archive in immutable/-/immutable-4.3.4.tgz sass/-/sass-1.69.5.tgz source-map-js/-/source-map-js-1.0.2.tgz; do
  npm cache add "https://registry.npmjs.org/$archive"
done
npm ci --prefer-offline
```

## Thanks

- [Logseq](https://github.com/logseq/logseq)
- [logseq-bujo-theme](https://github.com/PiotrSss/logseq-bujo-theme) by PiotrSss
- Dark mode of [Notion](https://notion.so)
- All feedbacks from github issue, email and discord 
