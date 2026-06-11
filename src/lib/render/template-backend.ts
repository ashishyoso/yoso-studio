import type { RenderBackend, RenderInput, RenderedAsset } from './backend';

// Deterministic HTML/CSS → PNG via Puppeteer. This is the brand-faithful
// backend: pixel-perfect typography, exact hex, real fonts, flush-left grid.
// Puppeteer is an OPTIONAL dependency — if it (or its Chromium) is unavailable,
// `available()` returns false and the API responds with a graceful message
// while the live HTML preview keeps working.

let puppeteerMod: any | undefined;
async function loadPuppeteer(): Promise<any | null> {
  if (puppeteerMod !== undefined) return puppeteerMod;
  try {
    // Non-literal specifier → resolved at runtime only (optional dependency),
    // so TS/webpack don't require puppeteer to be installed to build.
    const spec = 'puppeteer';
    // @ts-ignore optional dependency, may be absent
    puppeteerMod = (await import(/* webpackIgnore: true */ spec)).default;
  } catch {
    puppeteerMod = null;
  }
  return puppeteerMod;
}

async function renderAll(input: RenderInput): Promise<RenderedAsset[]> {
  const puppeteer = await loadPuppeteer();
  if (!puppeteer) throw new Error('puppeteer-unavailable');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const out: RenderedAsset[] = [];
    for (let i = 0; i < input.htmls.length; i++) {
      const page = await browser.newPage();
      await page.setViewport({ width: input.width, height: input.height, deviceScaleFactor: 1 });
      await page.setContent(input.htmls[i], { waitUntil: 'networkidle0' });
      // Give web fonts a beat to settle.
      await page.evaluate(async () => {
        // @ts-ignore
        if (document.fonts && document.fonts.ready) await document.fonts.ready;
      });
      // Puppeteer v23+ returns a Uint8Array, not a Buffer — wrap before base64.
      const buf = await page.screenshot({ type: 'png' });
      out.push({ index: i + 1, pngBase64: Buffer.from(buf as Uint8Array).toString('base64') });
      await page.close();
    }
    return out;
  } finally {
    await browser.close();
  }
}

export const templateBackend: RenderBackend = {
  id: 'template-html',
  async available() {
    return (await loadPuppeteer()) !== null;
  },
  render: renderAll,
};
