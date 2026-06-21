import { NextResponse } from 'next/server';
import { loadClientKnowledge, findRelevantAssets, buildAssetMap } from '@/lib/clients/registry';
import { generateCarouselPlan } from '@/lib/ai/slide-planner';
import { hasApiKey } from '@/lib/ai/anthropic';
import type { CreativeDirection } from '@/lib/types';
import type { AssetMap } from '@/lib/render/carousel-html';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { clientId, content, mode = 'angle', direction } = (await req.json()) as {
      clientId: string;
      content: string;
      mode?: 'angle' | 'script';
      direction?: CreativeDirection;
    };
    if (!clientId || !content?.trim()) {
      return NextResponse.json({ error: 'clientId and content are required.' }, { status: 400 });
    }
    // Streamlined flow: no direction-picking step. Synthesize one from the mode.
    const dir: CreativeDirection = direction ?? {
      id: mode === 'script' ? 'faithful' : 'direct',
      title: mode === 'script' ? 'Faithful layout' : 'Researched',
      angle:
        mode === 'script'
          ? 'Reproduce the provided slide script exactly, in the brand house style.'
          : 'Research the angle, write evidence-backed copy, then design the deck.',
      emotionalDriver: 'responsible love',
      visualApproach: 'wellbeing-nutrition archetypes (cover, stat, flow, cycle, mechanism, protocol, save)',
      whyItFits: 'Clinical, dignified, on-brand.',
      track: 'A-acquisition',
    };
    const knowledge = await loadClientKnowledge(clientId);
    const assets = findRelevantAssets(knowledge, `${content} ${dir.angle}`, 6);
    const plan = await generateCarouselPlan(knowledge, content, dir, assets);

    // Inline assets (logo etc.) as data URIs so they render in preview + export.
    const assetMap: AssetMap = await buildAssetMap(knowledge);

    return NextResponse.json({ plan, assetMap, mock: !hasApiKey() });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Slide planning failed.' }, { status: 500 });
  }
}
