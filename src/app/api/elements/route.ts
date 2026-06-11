import { NextResponse } from 'next/server';
import { ensureElements, providerAvailable, providerEnvVar, DEFAULT_PROVIDER, type ImageProvider } from '@/lib/render/element-gen';
import type { CarouselPlan } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 180;

// Generate image elements for every source:'generate' slide, using the chosen
// provider ('nano-banana' | 'openai').
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
    const { map, results } = await ensureElements(plan, {}, provider);
    return NextResponse.json({ elements: map, results, provider, available: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Element generation failed.' }, { status: 500 });
  }
}
