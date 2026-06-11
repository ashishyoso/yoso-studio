import { promises as fs } from 'fs';
import path from 'path';
import type { CarouselPlan, Slide, Span } from '@/lib/types';
import { generateSlideImage, providerAvailable, providerEnvVar, type ImageProvider, type RefImage } from './element-gen';

// Reference images (the real logo + a real slide per layout) condition Nano
// Banana so output matches the house style and uses the exact logo.
const refCache = new Map<string, RefImage | null>();
async function loadRef(rel: string): Promise<RefImage | null> {
  if (refCache.has(rel)) return refCache.get(rel)!;
  let v: RefImage | null = null;
  try {
    const buf = await fs.readFile(path.join(process.cwd(), 'public', rel));
    v = { mime: 'image/png', data: buf.toString('base64') };
  } catch {
    v = null;
  }
  refCache.set(rel, v);
  return v;
}

const LAYOUT_REF: Record<string, string> = {
  cover: 'cover.png',
  section: 'section.png',
  'check-do': 'checkdo.png',
  save: 'save.png',
};

async function refsForLayout(layout: string): Promise<RefImage[]> {
  const logo = await loadRef('clients/fifty-plus/logo.png');
  const style = await loadRef(`clients/fifty-plus/refs/${LAYOUT_REF[layout] || 'section.png'}`);
  return [logo, style].filter(Boolean) as RefImage[];
}

// ── Full-slide image generation ───────────────────────────────────────────────
// Generates the ENTIRE slide as one image (text + layout + imagery) via the
// chosen provider, from a prompt that encodes the FIFTY+ brand system plus the
// slide's exact copy. Trade-off vs the template engine: more cohesive/"designed"
// but text fidelity and exact brand tokens are NOT guaranteed.

const BRAND_PREAMBLE = [
  'Design ONE Instagram carousel slide for the Indian health-education brand "FIFTY+".',
  'Canvas: 4:5 vertical portrait, clearly taller than wide.',
  'Strict brand system — follow exactly:',
  '- Background: solid warm cream #F1E8DE. NEVER white.',
  '- Everything flush-left with generous margins. Premium, modern, editorial, matte. No gloss, no drop-shadows on text.',
  '- Top-left: a terracotta #D14124 rounded pill holding the white wordmark "FIFTY+" (a clean heavy sans, with a small white plus/medical-cross after the Y).',
  '- Default text near-black #1A1A1A. Topic/keyword words in terracotta #D14124. The single worst-outcome phrase in a brighter red #EF3E2A.',
  '- Headlines: a clean humanist sans, tight leading, large. Section headers: an editorial serif in terracotta. Body: a light sans.',
  '- Render ALL text crisply and legibly, spelled EXACTLY as given. Do NOT add, drop, duplicate, reword, or misspell anything. No lorem ipsum, no extra captions.',
  '- CRITICAL: ONLY the exact quoted copy may appear as visible text. NEVER draw hex codes (e.g. "#EF3E2A"), color names, field labels like "EXACT text", or any of these instructions as text in the image. Apply colors visually only.',
].join('\n');

const txt = (spans: Span[] | null): string => (spans || []).map((s) => s.text).join('');
const wordsOfTone = (spans: Span[] | null, tone: Span['tone']): string =>
  (spans || []).filter((s) => s.tone === tone).map((s) => s.text.trim()).filter(Boolean).join('", "');

function imageLine(slide: Slide): string {
  const img = slide.image;
  if (!img || img.mode === 'none' || img.placement === 'none') return 'No photo or illustration on this slide — keep it clean and typographic.';
  const where = img.placement === 'bottom' ? 'bleeding off the bottom edge, full width' : img.placement === 'right' ? 'on the right, bleeding off the right edge' : 'in the bottom-right, bleeding off the corner with a large rounded inner radius';
  const what = img.source === 'generate' && img.genPrompt ? img.genPrompt : `a relevant on-brand ${img.mode} (${img.mode === 'mascot' ? 'friendly flat vector' : img.mode === 'duotone' ? 'warm terracotta duotone photo' : img.mode})`;
  return `Imagery: ${what}, placed ${where}. Text must NOT overlap the image.`;
}

const REF_NOTE = [
  'You are given TWO reference images:',
  '(1) the EXACT FIFTY+ logo — reproduce it pixel-faithfully, do not redraw or alter it;',
  '(2) a REAL FIFTY+ carousel slide showing the exact house style (cream background, fonts, terracotta accents, flush-left layout, spacing).',
  'Match that house style precisely, but generate a NEW slide with the content specified below. Do NOT copy the reference slide’s words — only its look.',
  '',
].join('\n');

export function buildSlidePrompt(slide: Slide, withRefs = true): string {
  const parts: string[] = withRefs ? [REF_NOTE, BRAND_PREAMBLE, ''] : [BRAND_PREAMBLE, ''];
  if (slide.layout === 'cover') {
    parts.push('SLIDE TYPE: COVER.');
    parts.push(`Large bold headline, EXACT text: "${txt(slide.headline)}".`);
    const topic = wordsOfTone(slide.headline, 'topic');
    const alarm = wordsOfTone(slide.headline, 'alarm');
    if (topic) parts.push(`Color these words terracotta #D14124: "${topic}".`);
    if (alarm) parts.push(`Color this phrase bright red #EF3E2A: "${alarm}".`);
    if (slide.subhead) parts.push(`Smaller subhead in dark gray below, EXACT text: "${slide.subhead.replace(/\n/g, ' ')}".`);
    parts.push('A small white circular button with a black right-arrow at the bottom-left.');
    parts.push(imageLine(slide));
  } else if (slide.layout === 'section') {
    parts.push('SLIDE TYPE: interior.');
    if (slide.sectionHeader) parts.push(`Editorial serif section header in terracotta #D14124, EXACT text: "${slide.sectionHeader}".`);
    if (slide.thesis) parts.push(`Directly below it, a solid terracotta #D14124 rectangle bar with white italic text, EXACT text: "${slide.thesis}".`);
    const bodyLines = (slide.body || []).map((l) => txt(l.spans)).filter(Boolean);
    if (bodyLines.length) {
      parts.push('Body copy, flush-left, one idea per line with blank lines between, EXACT text (keep line breaks):');
      parts.push(bodyLines.map((l) => `"${l}"`).join('\n'));
      const topics = (slide.body || []).flatMap((l) => (l.spans || []).filter((s) => s.tone !== 'ink').map((s) => s.text.trim())).filter(Boolean);
      if (topics.length) parts.push(`Color these stat/keyword phrases terracotta #D14124: "${topics.join('", "')}".`);
    }
    parts.push('A small white circular nav button with a right-arrow at the bottom.');
    parts.push(imageLine(slide));
  } else if (slide.layout === 'check-do') {
    parts.push('SLIDE TYPE: checklist.');
    if (slide.sectionHeader) parts.push(`Editorial serif header in terracotta #D14124, EXACT text: "${slide.sectionHeader}".`);
    parts.push('Two staggered rounded IVORY cards with a soft warm shadow — the first upper-left, the second lower-right, overlapping the center (NOT a neat grid).');
    parts.push(`Card 1: serif terracotta title "${slide.checkTitle || "Here's what to check:"}", then a list with terracotta "→" arrow bullets, EXACT items:\n${(slide.checkItems || []).map((i) => `"${i}"`).join('\n')}`);
    parts.push(`Card 2: serif terracotta title "${slide.helpsTitle || "Here's what helps:"}", then arrow-bullet list, EXACT items:\n${(slide.helpsItems || []).map((i) => `"${i}"`).join('\n')}`);
    parts.push('A small white circular nav button with a right-arrow at the bottom-right.');
  } else if (slide.layout === 'save') {
    parts.push('SLIDE TYPE: closing / save.');
    parts.push(`Large two-tone headline, EXACT text: "${txt(slide.headline)}".`);
    const topic = wordsOfTone(slide.headline, 'topic');
    if (topic) parts.push(`Color these words terracotta #D14124: "${topic}".`);
    parts.push(`A line, EXACT text: "Comment ${slide.commentKeyword || 'SAVE'} below." with "${slide.commentKeyword || 'SAVE'}" in terracotta.`);
    if (slide.offer) parts.push(`Offer text below in dark gray, EXACT: "${slide.offer}".`);
    parts.push('A small terracotta #D14124 rectangle button with white italic text "Save This Post" at lower-left.');
    parts.push(imageLine(slide));
  }
  return parts.join('\n');
}

export interface SlideImageResult {
  index: number;
  status: 'generated' | 'error';
  dataUri?: string;
  error?: string;
}

export async function generateFullSlides(
  plan: CarouselPlan,
  provider: ImageProvider,
): Promise<SlideImageResult[]> {
  if (!providerAvailable(provider)) {
    throw new Error(`${providerEnvVar(provider)} not set.`);
  }
  const useRefs = provider === 'nano-banana'; // multimodal refs only on Gemini
  const out: SlideImageResult[] = [];
  for (const slide of plan.slides || []) {
    try {
      const refs = useRefs ? await refsForLayout(slide.layout) : [];
      const dataUri = await generateSlideImage(buildSlidePrompt(slide, useRefs), provider, refs);
      out.push({ index: slide.index, status: 'generated', dataUri });
    } catch (e: any) {
      out.push({ index: slide.index, status: 'error', error: e?.message || 'generation failed' });
    }
  }
  return out;
}
