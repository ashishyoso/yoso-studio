import { NextResponse } from 'next/server';
import { loadClientKnowledge, findRelevantAssets } from '@/lib/clients/registry';
import { getFormat } from '@/lib/formats/registry';
import { generateStrategy } from '@/lib/ai/strategy-engine';
import { hasApiKey } from '@/lib/ai/anthropic';
import type { FormatId } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { clientId, content, format } = (await req.json()) as {
      clientId: string;
      content: string;
      format: FormatId;
    };
    if (!clientId || !content?.trim()) {
      return NextResponse.json({ error: 'clientId and content are required.' }, { status: 400 });
    }
    const knowledge = await loadClientKnowledge(clientId);
    const fmt = getFormat(format);
    const assets = findRelevantAssets(knowledge, content, 6);
    const strategy = await generateStrategy(knowledge, content, fmt, assets);
    return NextResponse.json({ strategy, relevantAssets: assets, mock: !hasApiKey() });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Strategy generation failed.' }, { status: 500 });
  }
}
