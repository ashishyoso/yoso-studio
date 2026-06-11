import { NextResponse } from 'next/server';
import { loadClientKnowledge, buildAssetMap } from '@/lib/clients/registry';
import { getFormat } from '@/lib/formats/registry';
import { renderCarouselSlides, type AssetMap } from '@/lib/render/carousel-html';
import { getBackend } from '@/lib/render/backend';
import { ensureElements, DEFAULT_PROVIDER, type ImageProvider } from '@/lib/render/element-gen';
import type { CarouselPlan, FormatId } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 180;

export async function POST(req: Request) {
  try {
    const { clientId, format, plan, elements: provided, provider = DEFAULT_PROVIDER } = (await req.json()) as {
      clientId: string;
      format: FormatId;
      plan: CarouselPlan;
      elements?: Record<number, string>;
      provider?: ImageProvider;
    };
    if (!clientId || !plan?.slides?.length) {
      return NextResponse.json({ error: 'clientId and a plan with slides are required.' }, { status: 400 });
    }

    const knowledge = await loadClientKnowledge(clientId);
    const fmt = getFormat(format);

    // Rebuild HTML server-side from the plan (authoritative — never trust client HTML).
    const assetMap: AssetMap = await buildAssetMap(knowledge);

    // Composite Nano Banana elements: reuse any the preview already generated,
    // generate the rest (if GEMINI_API_KEY present). Missing ones fall back to
    // the branded placeholder, so export never blocks on image gen.
    const { map: elements } = await ensureElements(plan, provided || {}, provider);
    const slides = renderCarouselSlides(plan, assetMap, elements);

    const backend = getBackend(fmt.defaultBackend);
    if (!(await backend.available())) {
      return NextResponse.json(
        {
          error:
            'PNG export backend unavailable (Puppeteer/Chromium not installed). The live preview still works — install puppeteer to enable export.',
          backend: backend.id,
          available: false,
        },
        { status: 503 },
      );
    }

    const rendered = await backend.render({
      htmls: slides.map((s) => s.html),
      width: fmt.width,
      height: fmt.height,
    });

    return NextResponse.json({ assets: rendered, backend: backend.id, available: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Render failed.' }, { status: 500 });
  }
}
