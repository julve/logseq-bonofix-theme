/* Browser regression checks for the DB theme. Requires Playwright + Chromium;
 * see tests/README.md. Does not build the complete Logseq application. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const stylesheet = path.join(root, 'custom-db.css');
assert.ok(fs.existsSync(stylesheet), 'Build custom-db.css with npm run build:db before testing.');

function rgb(color) {
  const values = color.match(/[\d.]+/g).map(Number);
  assert.ok(color.startsWith('rgb'), `Expected a resolved RGB color, received ${color}`);
  return values.slice(0, 3);
}
function luminance(color) {
  const channels = rgb(color).map(value => {
    const s = value / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
function contrast(a, b) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}
function assertContrast(foreground, background, description) {
  assert.notEqual(background, 'rgba(0, 0, 0, 0)', `${description}: background is unresolved`);
  const ratio = contrast(foreground, background);
  assert.ok(ratio >= 4.5, `${description}: contrast ${ratio.toFixed(2)} is below 4.5:1 (${foreground} on ${background})`);
}

const resources = new Map([
  ['/tests/db-theme.html', [path.join(__dirname, 'db-theme.html'), 'text/html']],
  ['/custom-db.css', [stylesheet, 'text/css']],
]);
const server = http.createServer((request, response) => {
  const resource = resources.get(new URL(request.url, 'http://localhost').pathname);
  if (!resource) { response.writeHead(404); response.end(); return; }
  response.writeHead(200, { 'content-type': `${resource[1]}; charset=utf-8`, 'cache-control': 'no-store' });
  response.end(fs.readFileSync(resource[0]));
});

async function state(page, theme, accent) {
  await page.evaluate(({ theme, accent }) => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.color = accent;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.body.className = theme === 'dark' ? 'dark-theme' : 'white-theme light-theme';
    document.querySelector('.CodeMirror').className = `CodeMirror cm-s-lsradix cm-s-${theme}`;
  }, { theme, accent });
}
async function style(page, selector) {
  return page.locator(selector).first().evaluate(element => {
    const computed = getComputedStyle(element);
    return Object.fromEntries(['backgroundColor', 'color', 'borderRadius', 'outlineStyle', 'outlineWidth', 'boxShadow', 'fontFamily', 'height', 'whiteSpace', 'overflow', 'position', 'top', 'opacity', 'cursor'].map(key => [key, computed[key]]));
  });
}

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  let checks = 0;
  try {
    const port = server.address().port;
    const executablePath = process.env.CHROMIUM_PATH || (fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
    browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    // Keep the suite offline apart from the local fixture. Font availability
    // must not determine theme layout or the success of these checks.
    await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
    await page.goto(`http://127.0.0.1:${port}/tests/db-theme.html`);
    const imported = await page.evaluate(() => [...document.styleSheets].some(sheet => [...sheet.cssRules].some(rule => rule.type === CSSRule.IMPORT_RULE && rule.styleSheet?.cssRules.length > 0)));
    assert.ok(imported, 'The generated theme must load through a real CSS @import.');
    checks++;

    for (const theme of ['light', 'dark']) {
      for (const accent of ['logseq', 'blue', 'green']) {
        await state(page, theme, accent);
        const label = `${theme}/${accent}`;
        const body = await style(page, 'body');
        assert.equal(body.backgroundColor, theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(32, 32, 36)', `${label}: Bonofix neutral background`);
        assert.equal(body.color, theme === 'light' ? 'rgb(43, 41, 38)' : 'rgb(206, 206, 206)', `${label}: Bonofix text palette`);
        assertContrast(body.color, body.backgroundColor, `${label}: body text`);
        const tag = await style(page, '.block-tag');
        assert.notEqual(tag.backgroundColor, 'rgba(0, 0, 0, 0)', `${label}: DB tag has a pill background`);
        for (const selector of ['.block-tag a.tag', '.block-tag a.hash-symbol']) {
          assert.equal((await style(page, selector)).backgroundColor, 'rgba(0, 0, 0, 0)', `${label}: tag links do not make duplicate pills`);
        }

        const accentValues = await page.locator('body').evaluate(element => {
          const computed = getComputedStyle(element);
          return { primary: computed.getPropertyValue('--primary').trim(), ninth: computed.getPropertyValue('--lx-accent-09').trim() };
        });
        if (accent === 'blue') {
          assert.equal(accentValues.primary, '206 100% 50%', `${label}: preserve custom primary`);
          assert.equal(accentValues.ninth, '#0090ff', `${label}: preserve custom accent palette`);
        } else if (accent === 'green') {
          assert.equal(accentValues.primary, '151 55% 42%', `${label}: preserve custom primary`);
          assert.equal(accentValues.ninth, '#30a46c', `${label}: preserve custom accent palette`);
        } else {
          assert.equal(accentValues.ninth, theme === 'light' ? '#3e8adc' : '#61adea', `${label}: default accent resolves to the Bonofix blue scale`);
        }

        await page.locator('#property-editor').click();
        await page.locator('#property-popup').waitFor({ state: 'visible' });
        const popup = await style(page, '#property-popup');
        assertContrast(popup.color, popup.backgroundColor, `${label}: portal text`);
        await page.locator('#property-input').fill('Ready to write');
        await page.locator('#save-property').click();
        assert.equal(await page.locator('#property-editor').textContent(), 'Ready to write', `${label}: property editor stays usable`);

        await page.locator('#native-task').check();
        assert.ok(await page.locator('#native-task').isChecked(), `${label}: native checkbox is clickable`);
        await page.locator('#native-task').uncheck();
        await page.locator('#db-task').click();
        assert.equal(await page.locator('#db-task').getAttribute('aria-checked'), 'true', `${label}: DB checkbox is clickable`);
        const checkbox = await style(page, '#db-task');
        assert.notEqual(checkbox.backgroundColor, 'rgba(0, 0, 0, 0)', `${label}: checked DB checkbox has a visible fill`);
        assert.ok(checkbox.borderRadius === '50%' || parseFloat(checkbox.borderRadius) >= 8, `${label}: Bonofix round DB checkbox`);
        await page.locator('#db-task').click();
        assert.equal(await page.locator('#disabled-task').isEnabled(), false, `${label}: disabled task stays disabled`);
        const disabled = await style(page, '#disabled-task');
        assert.equal(disabled.opacity, '0.5', `${label}: preserve disabled task dimming`);
        assert.equal(disabled.cursor, 'not-allowed', `${label}: preserve disabled cursor`);
        const inputless = await style(page, '#inputless-task');
        assert.equal(inputless.backgroundColor, checkbox.backgroundColor, `${label}: inputless checked state matches interactive checkbox`);
        assert.equal(inputless.borderRadius, checkbox.borderRadius, `${label}: inputless checkbox uses the round shape`);

        for (const selector of ['.ls-table-row', '.ls-table-rows [data-index]']) {
          const heights = await page.locator(selector).evaluateAll(elements => elements.map(element => element.getBoundingClientRect().height));
          assert.deepEqual(heights, [33, 33], `${label}: preserve virtualized table row measurements`);
        }
        assert.equal((await style(page, '.ls-table-cell .table-block-title')).whiteSpace, 'nowrap', `${label}: virtualized table rows must not wrap`);
        await page.locator('.ls-table-header').evaluate(element => element.classList.add('ls-fixed'));
        assert.equal((await style(page, '.ls-table-header')).position, 'fixed', `${label}: preserve pinned table headers`);
        assert.equal((await style(page, '.ls-table-header')).top, '48px', `${label}: preserve native pinned header offset`);
        await page.locator('.ls-table-header').evaluate(element => element.classList.remove('ls-fixed'));

        const code = await style(page, '.CodeMirror');
        assertContrast(code.color, code.backgroundColor, `${label}: code editor text`);
        assert.equal(code.backgroundColor, theme === 'light' ? 'rgb(247, 246, 243)' : 'rgb(49, 50, 56)', `${label}: Bonofix code surface`);
        assert.equal((await style(page, '.CodeMirror-gutters')).backgroundColor, code.backgroundColor, `${label}: gutters blend into the code surface`);
        checks++;
        console.log(`PASS ${label}: palette, accents, portals, properties, tasks, virtualized table, code`);
      }
    }

    // Keyboard modality is established before focus, so :focus-visible applies.
    await page.keyboard.press('Tab');
    await page.locator('#db-task').focus();
    const focus = await style(page, '#db-task');
    assert.ok((focus.outlineStyle !== 'none' && parseFloat(focus.outlineWidth) > 0) || focus.boxShadow !== 'none', 'DB checkbox needs a visible keyboard focus indicator');
    checks++;

    for (const font of ['serif', 'mono']) {
      await page.evaluate(font => { document.documentElement.dataset.font = font; document.documentElement.dataset.fontGlobal = 'true'; }, font);
      const body = await style(page, 'body');
      const block = await style(page, '#writing-block');
      const expected = font === 'serif' ? 'Georgia' : 'monospace';
      assert.ok(body.fontFamily.includes(expected), `${font}: preserve the global font preference`);
      assert.ok(block.fontFamily.includes(expected), `${font}: preserve the writing font preference`);
      checks++;
    }
    await page.evaluate(() => { document.documentElement.dataset.font = 'default'; document.documentElement.dataset.fontGlobal = 'false'; });

    for (const theme of ['light', 'dark']) {
      await state(page, theme, 'green');
      await page.setViewportSize({ width: 375, height: 812 });
      const bounds = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: window.innerWidth, table: document.querySelector('.ls-table-rows').clientWidth, content: document.querySelector('.ls-table-rows').scrollWidth }));
      assert.ok(bounds.document <= bounds.viewport, `${theme}: theme must not create page-wide overflow on mobile (${bounds.document} > ${bounds.viewport})`);
      assert.ok(bounds.content > bounds.table, `${theme}: wide tables must keep local horizontal scrolling`);
      await page.locator('#property-editor').click();
      await page.locator('#property-input').fill('Mobile edit');
      await page.locator('#save-property').click();
      checks++;
    }
    assert.deepEqual(pageErrors, [], 'No browser JavaScript errors');
    console.log(`PASS ${checks} browser scenarios/check groups. Fixture validation only; the complete Logseq DB app is not exercised.`);
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
