import type { CarouselPlan } from '@/lib/types';

// ── Image-element generation (provider-routed) ────────────────────────────────
// Hybrid pipeline: the slide planner marks some images source:'generate' with an
// optimized `genPrompt`. This module turns each prompt into a single ELEMENT
// image which the template renderer composites into the slide. Text/layout stay
// deterministic — only the imagery is generated.
//
// Two interchangeable providers behind one interface:
//   - 'nano-banana' → Google gemini-2.5-flash-image
//   - 'openai'      → OpenAI Images (gpt-image-1)
// Adding another is one more case in callProvider().

export type ImageProvider = 'nano-banana' | 'openai';
export const DEFAULT_PROVIDER: ImageProvider = 'nano-banana';

const GEMINI_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
const GEMINI_BASE = process.env.GEMINI_API_BASE || 'https://generativelanguage.googleapis.com/v1beta';
const OPENAI_MODEL = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';
const OPENAI_BASE = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';

// Per-mode compositing instructions. NEVER say "transparent" — image models
// draw a literal checkerboard for it. Photos fill edge-to-edge; mascots/
// illustrations sit on the cream slide background so they blend seamlessly.
function elementSuffix(mode: string): string {
  if (mode === 'duotone') {
    return ' — Render as a full-bleed photograph where the SUBJECT IS LARGE and FILLS THE ENTIRE FRAME edge to edge: no border, no padding, no surrounding background, NO checkerboard. Absolutely no text, words, numbers, logos, or watermarks.';
  }
  return ' — A single LARGE subject that FILLS most of the frame, centered, on a SOLID warm cream #F1E8DE background (NOT transparent, NO checkerboard). Friendly flat vector, premium, matte. The subject must be big and prominent, not small or floating. Absolutely no text, words, numbers, logos, or watermarks.';
}

export function providerAvailable(provider: ImageProvider): boolean {
  return provider === 'openai' ? Boolean(process.env.OPENAI_API_KEY) : Boolean(process.env.GEMINI_API_KEY);
}

export function availableProviders(): Record<ImageProvider, boolean> {
  return { 'nano-banana': providerAvailable('nano-banana'), openai: providerAvailable('openai') };
}

export function providerEnvVar(provider: ImageProvider): string {
  return provider === 'openai' ? 'OPENAI_API_KEY' : 'GEMINI_API_KEY';
}

// in-process cache so identical (provider,prompt) pairs aren't paid for twice.
const cache = new Map<string, string>();

export interface RefImage { mime: string; data: string } // base64

async function callGemini(text: string, refs: RefImage[] = []): Promise<string> {
  const key = process.env.GEMINI_API_KEY!;
  const url = `${GEMINI_BASE}/models/${GEMINI_MODEL}:generateContent?key=${key}`;
  const parts = [...refs.map((r) => ({ inlineData: { mimeType: r.mime, data: r.data } })), { text }];
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { responseModalities: ['IMAGE'] },
    }),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Nano Banana error: ${data?.error?.message || `HTTP ${res.status}`}`);
  const part = (data?.candidates?.[0]?.content?.parts || []).find((p: any) => p?.inlineData?.data);
  if (!part) throw new Error(`Nano Banana returned no image (model="${GEMINI_MODEL}").`);
  return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
}

async function callOpenAI(text: string, size = '1024x1024'): Promise<string> {
  const key = process.env.OPENAI_API_KEY!;
  const res = await fetch(`${OPENAI_BASE}/images/generations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: OPENAI_MODEL, prompt: text, size, n: 1 }),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`OpenAI image error: ${data?.error?.message || `HTTP ${res.status}`}`);
  const item = data?.data?.[0];
  if (item?.b64_json) return `data:image/png;base64,${item.b64_json}`;
  if (item?.url) {
    const img = await fetch(item.url);
    const buf = Buffer.from(await img.arrayBuffer());
    return `data:image/png;base64,${buf.toString('base64')}`;
  }
  throw new Error(`OpenAI returned no image (model="${OPENAI_MODEL}").`);
}

// Element: an isolated subject to composite into a template (hybrid mode).
export async function generateElement(prompt: string, provider: ImageProvider): Promise<string> {
  // `prompt` already includes the mode-specific compositing suffix.
  const ck = `el:${provider}:${prompt}`;
  const cached = cache.get(ck);
  if (cached) return cached;
  const dataUri = provider === 'openai' ? await callOpenAI(prompt) : await callGemini(prompt);
  cache.set(ck, dataUri);
  return dataUri;
}

// Full slide: the whole composed creative as one image (full-image mode).
// Portrait size for OpenAI; Nano Banana follows the aspect described in the prompt.
export async function generateSlideImage(prompt: string, provider: ImageProvider, refs: RefImage[] = []): Promise<string> {
  // Nano Banana conditions on reference images (logo + house-style slide);
  // OpenAI generations is text-only here.
  const ck = `slide:${provider}:${refs.length}:${prompt}`;
  const cached = cache.get(ck);
  if (cached) return cached;
  const dataUri = provider === 'openai' ? await callOpenAI(prompt, '1024x1536') : await callGemini(prompt, refs);
  cache.set(ck, dataUri);
  return dataUri;
}

export interface ElementResult {
  index: number;
  status: 'generated' | 'reused' | 'skipped' | 'error';
  dataUri?: string;
  error?: string;
}

export async function ensureElements(
  plan: CarouselPlan,
  provided: Record<number, string> = {},
  provider: ImageProvider = DEFAULT_PROVIDER,
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
    if (!providerAvailable(provider)) {
      results.push({ index: slide.index, status: 'skipped', error: `${providerEnvVar(provider)} not set` });
      continue;
    }
    try {
      const dataUri = await generateElement(img.genPrompt + elementSuffix(img.mode), provider);
      map[slide.index] = dataUri;
      results.push({ index: slide.index, status: 'generated', dataUri });
    } catch (e: any) {
      results.push({ index: slide.index, status: 'error', error: e?.message || 'generation failed' });
    }
  }
  return { map, results };
}
