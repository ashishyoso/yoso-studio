import { NextResponse } from 'next/server';
import { ensureElements, isElementGenAvailable } from '@/lib/render/element-gen';
import type { CarouselPlan } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

// Generate Nano Banana elements for every source:'generate' slide in the plan.
// Returns a map (slide index → data URI) plus per-slide status so the UI can
// show what was generated vs skipped vs errored.
export async function POST(req: Request) {
  try {
    const { plan } = (await req.json()) as { plan: CarouselPlan };
    if (!plan?.slides?.length) {
      return NextResponse.json({ error: 'A plan with slides is required.' }, { status: 400 });
    }
    if (!isElementGenAvailable()) {
      return NextResponse.json(
        { error: 'Image generation unavailable — set GEMINI_API_KEY in .env.local and restart.', available: false },
        { status: 503 },
      );
    }
    const { map, results } = await ensureElements(plan);
    return NextResponse.json({ elements: map, results, available: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Element generation failed.' }, { status: 500 });
  }
}
