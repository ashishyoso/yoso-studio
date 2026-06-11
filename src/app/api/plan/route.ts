import { NextResponse } from 'next/server';
import { loadClientKnowledge, findRelevantAssets, buildAssetMap } from '@/lib/clients/registry';
import { generateCarouselPlan } from '@/lib/ai/slide-planner';
import { hasApiKey } from '@/lib/ai/anthropic';
import type { CreativeDirection } from '@/lib/types';
import type { AssetMap } from '@/lib/render/carousel-html';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { clientId, content, direction } = (await req.json()) as {
      clientId: string;
      content: string;
      direction: CreativeDirection;
    };
    if (!clientId || !content?.trim() || !direction) {
      return NextResponse.json({ error: 'clientId, content and direction are required.' }, { status: 400 });
    }
    const knowledge = await loadClientKnowledge(clientId);
    const assets = findRelevantAssets(knowledge, `${content} ${direction.angle} ${direction.visualApproach}`, 6);
    const plan = await generateCarouselPlan(knowledge, content, direction, assets);

    // Inline assets (logo etc.) as data URIs so they render in preview + export.
    const assetMap: AssetMap = await buildAssetMap(knowledge);

    return NextResponse.json({ plan, assetMap, mock: !hasApiKey() });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Slide planning failed.' }, { status: 500 });
  }
}
