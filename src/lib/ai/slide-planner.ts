import type { CarouselPlan, ClientKnowledge, CreativeDirection, AssetRef, Slide } from '@/lib/types';
import { hasApiKey, runStructured } from './anthropic';
import { geminiJson, hasGemini } from './gemini';
import { CAROUSEL_SCHEMA } from './schemas';

// ── Wellbeing-Nutrition archetype planner ─────────────────────────────────────
// The model emits a deck of typed archetype slides (cover, stats, flow, statHero,
// mechanism, cycle, protocol, save). A deterministic renderer paints them in the
// Fifty+ brand with the WN signature furniture (corner tag, counter pill, swipe).

function plannerSystem(k: ClientKnowledge): string {
  return [
    `You are a Staff-level Art Director at YOSO Media building an Instagram carousel for "${k.name}" in the "wellbeing.nutrition" clinical-infographic style, skinned in the Fifty+ brand.`,
    `A deterministic renderer paints each slide, so YOU own copy, hierarchy and color logic — get them exactly right.`,
    ``,
    `OUTPUT: a deck of 6–8 typed slides. Each slide has a "type" and only that type's fields (set every other field null). Set "counter" to "N/8" (or N/total). Types:`,
    `- cover: a big two-tone "headline" (the reframe hook, e.g. "It's not X. It's Y.") + short "sub". Optional "image" (mode duotone/mascot, source generate, a metaphor photo bleeding bottom).`,
    `- stats: "kicker" (section header) + "lead" + "stats" (2–3 {n,label}, n is the big number) + "foot" (citation).`,
    `- flow: "kicker" + "lead" + "pills" (3–4 {icon,label}; icon ∈ clock|walk|brain|people) + "removes" (two-tone) + "cascade" ("A → B → C") + "foot".`,
    `- statHero: "head" + "big" (the hero number) + "tail" + "sub" + "bars" (4–6 numbers 0–100, descending) + "xlabels" + "foot". Renders on a solid accent background.`,
    `- mechanism: "kicker" + "word" (a named term) + "phon" (phonetic · noun) + "def" (one line) + "signs" (2–3 {icon,label}; icon ∈ grip|chair|stairs) + optional "image" (anatomical, source generate) + "foot".`,
    `- cycle: "kicker" + "nodes" (4–6 short labels, clockwise self-feeding loop) + "close" (two-tone closing line, often "… But it can be broken.").`,
    `- protocol: "kicker" + "items" (3–4 {act,why}; act = bold action, why = one plain line) + optional "image" (duotone, source generate, on the right).`,
    `- save: two-tone "headline" + "sub" + "cta" ("Comment KEYWORD below. We'll send …", keyword uppercase) + "button" ("Save This Post") + optional "image" (warm photo, full-bleed).`,
    ``,
    `ARC: cover (reframe hook) → stats or statHero (the stakes) → flow or mechanism (why it happens) → cycle (why it compounds) → protocol (what helps) → save. Never repeat the same type on consecutive slides. Make it VISUAL: prefer diagrams (stats blocks, flow, cycle) over walls of text.`,
    ``,
    `RULES:`,
    `- Color logic via span "tone": ink = default; topic = the accent (warm orange) on the topic/keyword; alarm = the single worst-outcome phrase. Max two colors per line.`,
    `- Cite real sources in "foot" (Author/Body, Journal, Year). Never invent citations. No em dashes.`,
    `- INPUT MODE: if the source is a finished slide script, REPRODUCE its copy faithfully (map each provided slide to one output slide, keep exact wording); only choose the archetype + spans. If it is a raw idea, write the deck per the arc.`,
    `- Imagery: source "generate" with a tight element prompt (never text in the image), or "none". Set image null on stats/flow/statHero/cycle.`,
    `- Non-negotiables: no fear-mongering, no unbacked absolutes, never portray aging as decline, treat the 50+ parent with dignity.`,
    ``,
    `=== BRAND BIBLE ===`,
    k.brandBible,
    ``,
    `=== DESIGN BIBLE ===`,
    k.designBible,
  ].join('\n');
}

function plannerUser(content: string, direction: CreativeDirection, assets: AssetRef[]): string {
  return [
    `CHOSEN CREATIVE DIRECTION: ${direction.title} (track ${direction.track})`,
    `Angle: ${direction.angle}`,
    `Emotional driver: ${direction.emotionalDriver}`,
    `Visual approach: ${direction.visualApproach}`,
    ``,
    `SOURCE CONTENT / COPY:`,
    content.trim(),
    ``,
    `BRAND ASSETS (reference by assetId if one fits an image slot):`,
    assets.length ? assets.map((a) => `- ${a.id} [${a.kind}]: ${a.label} — ${a.description}`).join('\n') : '- (none matched)',
    ``,
    `TASK: Produce the full typed-archetype carousel plan. For each slide set "type", "counter", and only that type's fields (null elsewhere). Number slides from 1. Fill brandConsistencyNotes.`,
  ].join('\n');
}

const JSON_SHAPE = `Output ONLY a JSON object (no prose, no code fences) of exactly this shape:
{"format":"instagram-carousel","direction":string,"slideCount":int,"slides":[Slide,...],"assetsUsed":[],"brandConsistencyNotes":string}
Each Slide: {"index":int,"type":"cover"|"stats"|"flow"|"statHero"|"mechanism"|"cycle"|"protocol"|"save","counter":"N/total"} PLUS only that type's fields, with every other field set to null:
- kicker,lead,foot,sub,cascade,head,big,tail,word,phon,def,button: string|null
- headline,removes,close,cta: array of {"text":string,"tone":"ink"|"topic"|"alarm"} | null
- stats: array of {"n":string,"label":string} | null
- pills,signs: array of {"icon":"clock"|"walk"|"brain"|"people"|"grip"|"chair"|"stairs","label":string} | null
- bars: array of number 0-100 | null ; xlabels,nodes: array of string | null
- items: array of {"act":string,"why":string} | null
- image: {"mode":"duotone"|"anatomical"|"mascot"|"3d"|"none","source":"generate"|"none","assetId":null,"genPrompt":string|null,"placement":"bottom"|"right"|"bottom-right"|"none"} | null`;

export async function generateCarouselPlan(
  knowledge: ClientKnowledge,
  content: string,
  direction: CreativeDirection,
  assets: AssetRef[],
): Promise<CarouselPlan> {
  const system = plannerSystem(knowledge);
  const user = plannerUser(content, direction, assets);
  // Prefer Gemini (same key as Nano Banana) so the studio needs only one key.
  if (hasGemini()) {
    return normalize(await geminiJson<CarouselPlan>(system, `${user}\n\n${JSON_SHAPE}`, 9000), direction);
  }
  if (hasApiKey()) {
    const plan = await runStructured<CarouselPlan>({
      system, user,
      toolName: 'submit_carousel_plan',
      toolDescription: 'Submit the full typed-archetype carousel design plan.',
      schema: CAROUSEL_SCHEMA as unknown as Record<string, unknown>,
      maxTokens: 9000,
    });
    return normalize(plan, direction);
  }
  return mockPlan(direction);
}

const SLIDE_DEFAULTS: Omit<Slide, 'index' | 'type' | 'counter'> = {
  kicker: null, lead: null, foot: null, headline: null, sub: null, stats: null,
  pills: null, removes: null, cascade: null, head: null, big: null, tail: null,
  bars: null, xlabels: null, word: null, phon: null, def: null, signs: null,
  nodes: null, close: null, items: null, cta: null, button: null, image: null,
};
// Fill any missing slide fields so the renderer never sees undefined, whatever
// the model returned.
function normalize(plan: CarouselPlan, direction: CreativeDirection): CarouselPlan {
  const slides = plan?.slides || [];
  plan.format = 'instagram-carousel';
  plan.direction = plan.direction || direction.title;
  plan.slides = slides.map((s, i) => ({
    ...SLIDE_DEFAULTS,
    ...s,
    index: s.index ?? i + 1,
    counter: s.counter || `${i + 1}/${slides.length}`,
  }));
  plan.slideCount = plan.slides.length;
  plan.assetsUsed = plan.assetsUsed || [];
  plan.brandConsistencyNotes = plan.brandConsistencyNotes || '';
  return plan;
}

// Fill every Slide field (null where N/A) so the renderer never sees undefined.
function S(p: Partial<Slide> & { index: number; type: Slide['type']; counter: string }): Slide {
  return {
    kicker: null, lead: null, foot: null, headline: null, sub: null, stats: null,
    pills: null, removes: null, cascade: null, head: null, big: null, tail: null,
    bars: null, xlabels: null, word: null, phon: null, def: null, signs: null,
    nodes: null, close: null, items: null, cta: null, button: null,
    image: { mode: 'none', source: 'none', assetId: null, genPrompt: null, placement: 'none' },
    ...p,
  };
}
function gen(mode: NonNullable<Slide['image']>['mode'], placement: NonNullable<Slide['image']>['placement'], genPrompt: string): Slide['image'] {
  return { mode, source: 'generate', assetId: null, genPrompt, placement };
}

// ── Mock (no API key): a complete WN-archetype deck in the Fifty+ brand ───────
function mockPlan(direction: CreativeDirection): CarouselPlan {
  const slides: Slide[] = [
    S({ index: 1, type: 'cover', counter: '1/8',
      headline: [{ text: "Retirement isn't just a life change. It's a ", tone: 'ink' }, { text: 'biological', tone: 'topic' }, { text: ' one.', tone: 'ink' }],
      sub: "What happens to your parents' body when the work stops, and what protects it.",
      image: gen('duotone', 'bottom', 'Warm documentary photo of a content recently-retired Indian couple in their early 60s at home in soft light, calm and still, no text') }),
    S({ index: 2, type: 'stats', counter: '2/8', kicker: 'What retirement does', lead: 'Stopping work is a shift the whole body feels.',
      stats: [{ n: '+5–16%', label: 'more difficulty moving' }, { n: '+5–6%', label: 'more illness conditions' }, { n: '−6–9%', label: 'worse mental health' }],
      foot: 'NBER · Health and Retirement Study (7 longitudinal waves)' }),
    S({ index: 3, type: 'flow', counter: '3/8', kicker: 'Why the body slips', lead: 'Work quietly gave the body four things:',
      pills: [{ icon: 'clock', label: 'A fixed rhythm' }, { icon: 'walk', label: 'Daily movement' }, { icon: 'brain', label: 'Mental engagement' }, { icon: 'people', label: 'Social contact' }],
      removes: [{ text: 'Retirement removes them ', tone: 'ink' }, { text: 'all at once.', tone: 'topic' }],
      cascade: 'Less movement → less muscle → everything follows.', foot: 'Cambridge · Ageing & Society, systematic review, 2025' }),
    S({ index: 4, type: 'statHero', counter: '4/8', head: 'Muscle falls', big: '1–2%', tail: 'every year after 50.',
      sub: 'Inactivity makes it faster. The body loses in months what it built over decades.',
      bars: [100, 84, 70, 57, 45], xlabels: ['50', '55', '60', '65', '70'], foot: 'MDPI · Aging Skeletal Muscle review, 2024' }),
    S({ index: 5, type: 'mechanism', counter: '5/8', kicker: 'The quiet thief has a name',
      word: 'Sarcopenia', phon: 'sar-koh-PEE-nee-uh · noun', def: 'the clinical loss of muscle mass and strength.',
      signs: [{ icon: 'grip', label: 'Grip weakens' }, { icon: 'chair', label: 'Standing up takes effort' }, { icon: 'stairs', label: 'Stairs need the railing' }],
      foot: 'Quiet, long before it is visible.',
      image: gen('anatomical', 'right', 'Semi-realistic medical illustration of healthy human skeletal-muscle fibres and a strong upper-arm muscle, warm terracotta-orange and ochre on cream, no text') }),
    S({ index: 6, type: 'cycle', counter: '6/8', kicker: 'Why it snowballs',
      nodes: ['Less muscle', 'Less movement', 'More weakness', 'Less confidence', 'Less activity'],
      close: [{ text: 'The cycle feeds itself. ', tone: 'ink' }, { text: 'But it can be broken.', tone: 'topic' }] }),
    S({ index: 7, type: 'protocol', counter: '7/8', kicker: 'What actually helps',
      items: [
        { act: 'Lift light weights, 2–3× a week', why: 'even small loads rebuild muscle' },
        { act: 'Protein at every meal', why: 'muscle cannot rebuild without it' },
        { act: 'Walk 30 minutes daily', why: 'maintains lower-body strength' },
        { act: '10 chair stand-ups a day', why: 'proven for leg strength after 60' },
      ],
      image: gen('duotone', 'right', 'Warm photo of a strong smiling Indian woman in her late 50s lifting small dumbbells at home, no text') }),
    S({ index: 8, type: 'save', counter: '8/8',
      headline: [{ text: 'They worked 35 years. ', tone: 'ink' }, { text: 'They earned the rest.', tone: 'topic' }],
      sub: "But the body above 50 doesn't know the difference between rest and retirement.",
      cta: [{ text: 'Comment ', tone: 'ink' }, { text: 'RETIRE', tone: 'topic' }, { text: " below. We'll send a free guide on what Indian parents need to stay strong after retirement.", tone: 'ink' }],
      button: 'Save This Post',
      image: gen('duotone', 'bottom', 'Golden-hour photo of a dignified older Indian couple by a window, looking out hopefully, warm and calm, no text') }),
  ];
  return {
    format: 'instagram-carousel',
    direction: direction.title,
    slideCount: slides.length,
    slides,
    assetsUsed: [],
    brandConsistencyNotes:
      'MOCK PLAN (no ANTHROPIC_API_KEY). Wellbeing-nutrition archetype system in the Fifty+ brand: reframe cover, stat blocks, a flow diagram, a hero stat, the sarcopenia mechanism, a self-feeding cycle diagram, a clean protocol, and the save/CTA — corner tag, counter pill and swipe circle on every slide.',
  };
}
