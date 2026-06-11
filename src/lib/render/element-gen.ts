import type { CarouselPlan } from '@/lib/types';

// ── Nano Banana element generation ────────────────────────────────────────────
// Hybrid pipeline: the slide planner marks some images as source:'generate' with
// an optimized `genPrompt`. This module turns each such prompt into a single
// ELEMENT image (photo / illustration / mascot) via Google's gemini-2.5-flash-
// image ("Nano Banana"), which the template renderer then composites into the
// slide. Text/layout stay deterministic — only the imagery is generated.
//
// Direct REST call (no SDK dependency) so it's robust in the server render path.
// Model + endpoint are env-configurable in case the model id changes.

const MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
const API_BASE = process.env.GEMINI_API_BASE || 'https://generativelanguage.googleapis.com/v1beta';

export function isElementGenAvailable(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

// Keep elements on-brand and compositable regardless of the per-slide prompt.
const STYLE_SUFFIX =
  ' Single isolated subject on a clean solid or transparent background, suitable for compositing into a layout. Absolutely no text, words, letters, numbers, logos, or watermarks. Premium, matte, editorial. Not a full poster — just the element.';

// In-process cache so identical prompts in one render aren't paid for twice.
const cache = new Map<string, string>();

async function callGemini(prompt: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY not set.');

  const url = `${API_BASE}/models/${MODEL}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt + STYLE_SUFFIX }] }],
      generationConfig: { responseModalities: ['IMAGE'] },
    }),
  });

  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message || `HTTP ${res.status}`;
    throw new Error(`Nano Banana error: ${msg}`);
  }
  const parts: any[] = data?.candidates?.[0]?.content?.parts || [];
  const imgPart = parts.find((p) => p?.inlineData?.data);
  if (!imgPart) {
    throw new Error(`Nano Banana returned no image (model="${MODEL}"). ${JSON.stringify(data).slice(0, 200)}`);
  }
  const mime = imgPart.inlineData.mimeType || 'image/png';
  return `data:${mime};base64,${imgPart.inlineData.data}`;
}

export async function generateElement(prompt: string): Promise<string> {
  const cached = cache.get(prompt);
  if (cached) return cached;
  const dataUri = await callGemini(prompt);
  cache.set(prompt, dataUri);
  return dataUri;
}

export interface ElementResult {
  index: number;
  status: 'generated' | 'reused' | 'skipped' | 'error';
  dataUri?: string;
  error?: string;
}

/**
 * Generate (or reuse already-supplied) elements for every slide whose image is
 * source:'generate'. `provided` lets the export step reuse what preview already
 * made, avoiding double spend. Errors are per-slide and non-fatal — that slide
 * falls back to the branded placeholder.
 */
export async function ensureElements(
  plan: CarouselPlan,
  provided: Record<number, string> = {},
): Promise<{ map: Record<number, string>; results: ElementResult[] }> {
  const map: Record<number, string> = { ...provided };
  const results: ElementResult[] = [];

  for (const slide of plan.slides || []) {
    const img = slide.image;
    if (!img || img.source !== 'generate' || !img.genPrompt) continue;
    if (map[slide.index]) {
      results.push({ index: slide.index, status: 'reused', dataUri: map[slide.index] });
      continue;
    }
    if (!isElementGenAvailable()) {
      results.push({ index: slide.index, status: 'skipped', error: 'GEMINI_API_KEY not set' });
      continue;
    }
    try {
      const dataUri = await generateElement(img.genPrompt);
      map[slide.index] = dataUri;
      results.push({ index: slide.index, status: 'generated', dataUri });
    } catch (e: any) {
      results.push({ index: slide.index, status: 'error', error: e?.message || 'generation failed' });
    }
  }
  return { map, results };
}
