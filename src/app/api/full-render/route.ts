import { NextResponse } from 'next/server';
import { generateFullSlides } from '@/lib/render/full-slide-gen';
import { getBackend } from '@/lib/render/backend';
import { providerAvailable, providerEnvVar, DEFAULT_PROVIDER, type ImageProvider } from '@/lib/render/element-gen';
import type { CarouselPlan } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Full-image mode: generate each slide entirely with the chosen image model,
// then normalize each result to an exact 1080x1350 (4:5) PNG via the template
// backend (full-bleed image → screenshot). Falls back to the raw image if
// Puppeteer is unavailable.
export async function POST(req: Request) {
  try {
    const { plan, provider = DEFAULT_PROVIDER } = (await req.json()) as {
      plan: CarouselPlan;
      provider?: ImageProvider;
    };
    if (!plan?.slides?.length) {
      return NextResponse.json({ error: 'A plan with slides is required.' }, { status: 400 });
    }
    if (!providerAvailable(provider)) {
      const label = provider === 'openai' ? 'OpenAI' : 'Nano Banana';
      return NextResponse.json(
        { error: `${label} unavailable — set ${providerEnvVar(provider)} in .env.local and restart.`, available: false },
        { status: 503 },
      );
    }

    const results = await generateFullSlides(plan, provider);
    const generated = results.filter((r) => r.status === 'generated' && r.dataUri);

    let assets: { index: number; pngBase64: string }[] = [];
    const backend = getBackend('template-html');
    if (generated.length && (await backend.available())) {
      const htmls = generated.map(
        (g) =>
          `<!doctype html><html><head><style>html,body{margin:0;padding:0}.f{width:1080px;height:1350px;overflow:hidden;background:#F1E8DE;display:flex;align-items:center;justify-content:center}.f img{max-width:100%;max-height:100%;object-fit:contain;display:block}</style></head><body><div class="f"><img src="${g.dataUri}"></div></body></html>`,
      );
      const rendered = await backend.render({ htmls, width: 1080, height: 1350 });
      assets = generated.map((g, i) => ({ index: g.index, pngBase64: rendered[i].pngBase64 }));
    } else {
      // No Puppeteer → return the raw model output (may not be exactly 4:5).
      assets = generated.map((g) => ({ index: g.index, pngBase64: (g.dataUri || '').split(',')[1] || '' }));
    }

    return NextResponse.json({
      assets,
      results: results.map(({ index, status, error }) => ({ index, status, error })),
      provider,
      available: true,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Full-slide render failed.' }, { status: 500 });
  }
}
