import type { RenderBackend, RenderInput, RenderedAsset } from './backend';

// Deterministic HTML/CSS → PNG via Puppeteer. Brand-faithful: pixel-perfect
// typography, exact hex, real fonts, flush-left grid.
//
// Two launch paths:
//   - Serverless (Vercel/Lambda): puppeteer-core + @sparticuz/chromium
//   - Local dev: the full `puppeteer` package (optional dependency)
// If neither is available, `available()` returns false → API responds 503 and
// the live HTML preview keeps working.

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

let launcher: (() => Promise<any>) | null | undefined;

async function resolveLauncher(): Promise<(() => Promise<any>) | null> {
  if (launcher !== undefined) return launcher;
  try {
    if (isServerless) {
      const chromium = (await import('@sparticuz/chromium')).default;
      const puppeteer = (await import('puppeteer-core')).default;
      launcher = async () =>
        puppeteer.launch({
          args: chromium.args,
          executablePath: await chromium.executablePath(),
          headless: true,
        });
    } else {
      // Non-literal specifier → optional dep, not required to build.
      const spec = 'puppeteer';
      // @ts-ignore optional dependency, may be absent locally
      const puppeteer = (await import(/* webpackIgnore: true */ spec)).default;
      launcher = async () =>
        puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    }
  } catch {
    launcher = null;
  }
  return launcher;
}

async function renderAll(input: RenderInput): Promise<RenderedAsset[]> {
  const launch = await resolveLauncher();
  if (!launch) throw new Error('puppeteer-unavailable');

  const browser = await launch();
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
    return (await resolveLauncher()) !== null;
  },
  render: renderAll,
};
