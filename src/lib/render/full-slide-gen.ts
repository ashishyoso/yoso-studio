import type { CarouselPlan, Slide, Span } from '@/lib/types';
import { generateSlideImage, providerAvailable, providerEnvVar, type ImageProvider } from './element-gen';

// ── Full-slide image generation (Nano Banana / OpenAI) ────────────────────────
// Generates the ENTIRE slide as one image (text + layout + diagrams) from a
// prompt that encodes the wellbeing-nutrition archetype + the Fifty+ brand and
// the slide's exact copy. Trade-off vs the template engine: more "designed" but
// text/diagram fidelity is not guaranteed. The template (carousel-html) stays the
// brand-faithful path; this is the "full image" alternative the studio offers.

const txt = (s: Span[] | null): string => (s || []).map((x) => x.text).join('');
const accent = (s: Span[] | null): string =>
  (s || []).filter((x) => x.tone !== 'ink').map((x) => x.text.trim()).filter(Boolean).join('", "');

function brand(n: string): string {
  return [
    'A single 4:5 vertical Instagram carousel slide for "Fifty+ Clinic", an Indian health brand, in a clean clinical "wellbeing.nutrition" infographic style.',
    'STRICT BRAND: warm cream #F2E9E2 background, deep ink #1A1A1A text, warm terracotta-orange #F36937 accent ONLY on key words.',
    'Headlines and section headers in Aeonik (a clean geometric grotesque, regular/medium weight, NOT bold and NOT a serif); body in Archivo light.',
    'Generous margins, calm negative space, premium and uncluttered.',
    `Top-left a tiny grey letter-spaced corner tag "FIFTY+ · CLINIC"; top-right a small dark rounded pill with white text "${n}"; a thin outline circle with a right-arrow low-centre.`,
    'All text in English, perfectly spelled, crisp, high contrast. No watermark.',
  ].join(' ');
}

export function buildSlidePrompt(slide: Slide): string {
  const s = slide;
  const n = s.counter || '';
  const B = brand(n);
  switch (s.type) {
    case 'cover':
      return `${B} CONTENT: upper-left a large two-tone Aeonik headline "${txt(s.headline)}" with "${accent(s.headline)}" in #F36937; below a smaller grey line "${s.sub || ''}". The lower ~45% is a warm documentary photo bleeding to the bottom edge with a rounded top: ${s.image?.genPrompt || 'a relevant on-brand photo'}.`;
    case 'stats':
      return `${B} CONTENT: a small #F36937 Aeonik header "${s.kicker}"; a line "${s.lead}"; then big bold stat blocks stacked with the numbers in #F36937: ${(s.stats || []).map((x) => `"${x.n}" labelled "${x.label}"`).join(', ')}. A tiny grey footnote "${s.foot || ''}". Plain cream background, no photo.`;
    case 'flow':
      return `${B} CONTENT: a #F36937 Aeonik header "${s.kicker}"; a line "${s.lead}"; four small rounded outline pills in a 2x2 grid, each a tiny #F36937 line icon + label: ${(s.pills || []).map((p) => `"${p.label}"`).join(', ')}; a downward #F36937 arrow to a bold line "${txt(s.removes)}"; then a cascade in bold ink with #F36937 arrows "${s.cascade}". Tiny footnote "${s.foot || ''}". Clean diagram-like cream slide.`;
    case 'statHero':
      return `${B} CONTENT: rendered on a SOLID #F36937 background with cream/white text. A large headline "${s.head} ${s.big} ${s.tail}" with "${s.big}" huge; a sub-line "${s.sub}"; a simple descending white bar chart (bars shortening left to right) labelled ${(s.xlabels || []).join(', ')}; tiny footnote "${s.foot || ''}".`;
    case 'mechanism':
      return `${B} CONTENT: a small #F36937 Aeonik header "${s.kicker}"; a very large ink word "${s.word}" with a small rounded outline pill "${s.phon}"; an italic one-line definition "${s.def}"; three small #F36937 line-icon items with labels: ${(s.signs || []).map((g) => `"${g.label}"`).join(', ')}; a warm semi-realistic muscle-fibre illustration on the right; a grey closing line "${s.foot || ''}".`;
    case 'cycle':
      return `${B} CONTENT: a #F36937 Aeonik header "${s.kicker}"; a clean circular cycle diagram of ${(s.nodes || []).length} small #F36937 dots on a dotted ring with clockwise arrows, labelled "${(s.nodes || []).join('", "')}"; below it a two-tone line "${txt(s.close)}" with the second sentence in #F36937. Clean vector-style cream slide.`;
    case 'protocol':
      return `${B} CONTENT: a #F36937 Aeonik header "${s.kicker}"; a vertical list of four items, each a #F36937 "›" + a bold ink action + a thin grey why-line: ${(s.items || []).map((it) => `"${it.act}" / "${it.why}"`).join('; ')}. On the right third a warm photo bleeding off the right edge: ${s.image?.genPrompt || 'a relevant photo'}.`;
    case 'save':
      return `A 4:5 vertical SAVE slide for "Fifty+ Clinic". Background: a warm, gently darkened photo (${s.image?.genPrompt || 'a dignified older Indian couple by a window'}). White Aeonik text: top-left a "FIFTY+ · CLINIC" tag and a "${n}" pill top-right; a headline "${txt(s.headline)}" with "${accent(s.headline)}" in warm #F36937; a line "${s.sub || ''}"; then "${txt(s.cta)}" with the comment keyword in #F36937; a solid #F36937 rounded button "${s.button || 'Save This Post'}" at the lower-left. All text in English, crisp, high contrast. No watermark.`;
    default:
      return B;
  }
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
  const out: SlideImageResult[] = [];
  for (const slide of plan.slides || []) {
    try {
      const dataUri = await generateSlideImage(buildSlidePrompt(slide), provider, []);
      out.push({ index: slide.index, status: 'generated', dataUri });
    } catch (e: any) {
      out.push({ index: slide.index, status: 'error', error: e?.message || 'generation failed' });
    }
  }
  return out;
}
