// JSON Schemas used as forced-tool input schemas. These are the authoritative
// contract the model fills; the TS types in types.ts mirror them.

export const STRATEGY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    contentIntent: { type: 'string', description: 'One sentence: what this content is really trying to do.' },
    targetAudience: { type: 'string', description: 'Which audience + track (child-acquisition A, or parent-dignity B).' },
    directions: {
      type: 'array',
      description: '3 to 5 distinct creative directions.',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          id: { type: 'string', description: 'kebab-case slug, e.g. "minimal-founder-led".' },
          title: { type: 'string', description: 'Short name, e.g. "Minimal Founder-Led".' },
          angle: { type: 'string', description: 'The core creative angle in 1–2 sentences.' },
          emotionalDriver: { type: 'string', description: 'Primary emotion (guilt-as-love, earned vitality, trust, etc.).' },
          visualApproach: { type: 'string', description: 'How it looks: imagery mode, composition, hero element.' },
          whyItFits: { type: 'string', description: 'Why this is on-brand per the bibles — cite a specific guardrail or learning.' },
          track: { type: 'string', enum: ['A-acquisition', 'B-retention'] },
        },
        required: ['id', 'title', 'angle', 'emotionalDriver', 'visualApproach', 'whyItFits', 'track'],
      },
    },
  },
  required: ['contentIntent', 'targetAudience', 'directions'],
} as const;

const SPAN = {
  type: 'object',
  additionalProperties: false,
  properties: {
    text: { type: 'string' },
    tone: {
      type: 'string',
      enum: ['ink', 'topic', 'alarm'],
      description: 'ink = default #1A1A1A; topic = terracotta for the topic noun; alarm = terracotta for the single worst-outcome phrase. Max two colors per line.',
    },
  },
  required: ['text', 'tone'],
} as const;

const STAT = {
  type: 'object', additionalProperties: false,
  properties: { n: { type: 'string', description: 'The big number, e.g. "+5–16%".' }, label: { type: 'string' } },
  required: ['n', 'label'],
} as const;
const ICON_ITEM = {
  type: 'object', additionalProperties: false,
  properties: { icon: { type: 'string', enum: ['clock', 'walk', 'brain', 'people', 'grip', 'chair', 'stairs'] }, label: { type: 'string' } },
  required: ['icon', 'label'],
} as const;
const PROTO_ITEM = {
  type: 'object', additionalProperties: false,
  properties: { act: { type: 'string', description: 'Bold action.' }, why: { type: 'string', description: 'One plain why-line.' } },
  required: ['act', 'why'],
} as const;

const SLIDE_IMAGE = {
  type: 'object',
  additionalProperties: false,
  properties: {
    mode: { type: 'string', enum: ['mascot', 'duotone', 'anatomical', '3d', 'none'] },
    source: {
      type: 'string',
      enum: ['asset', 'generate', 'none'],
      description: 'Prefer "asset" (real brand asset) whenever one fits. Only "generate" when nothing in the repository works.',
    },
    assetId: { type: ['string', 'null'], description: 'Asset id from the supplied repository when source=asset.' },
    genPrompt: { type: ['string', 'null'], description: 'Optimized image-model prompt when source=generate (duotone/anatomical/mascot per brand). Element only, never text.' },
    placement: { type: 'string', enum: ['bottom-right', 'bottom', 'right', 'none'] },
  },
  required: ['mode', 'source', 'assetId', 'genPrompt', 'placement'],
} as const;

const SLIDE = {
  type: 'object',
  additionalProperties: false,
  properties: {
    index: { type: 'integer' },
    type: { type: 'string', enum: ['cover', 'stats', 'flow', 'statHero', 'mechanism', 'cycle', 'protocol', 'save'] },
    counter: { type: 'string', description: '"N/total" pill, e.g. "1/8".' },
    kicker: { type: ['string', 'null'], description: 'Section header (orange grotesque). Not on cover.' },
    lead: { type: ['string', 'null'], description: 'Supporting line under the kicker.' },
    foot: { type: ['string', 'null'], description: 'Citation footnote / closing micro-line.' },
    headline: { type: ['array', 'null'], items: SPAN, description: 'Two-tone headline (cover + save).' },
    sub: { type: ['string', 'null'], description: 'Cover subhead.' },
    stats: { type: ['array', 'null'], items: STAT, description: 'stats archetype (2–3).' },
    pills: { type: ['array', 'null'], items: ICON_ITEM, description: 'flow archetype (3–4).' },
    removes: { type: ['array', 'null'], items: SPAN, description: 'flow: "removes them all at once" (two-tone).' },
    cascade: { type: ['string', 'null'], description: 'flow: "A → B → C".' },
    head: { type: ['string', 'null'] }, big: { type: ['string', 'null'], description: 'statHero hero number.' }, tail: { type: ['string', 'null'] },
    bars: { type: ['array', 'null'], items: { type: 'number' }, description: 'statHero descending bar heights 0–100.' },
    xlabels: { type: ['array', 'null'], items: { type: 'string' } },
    word: { type: ['string', 'null'], description: 'mechanism: named term.' }, phon: { type: ['string', 'null'] }, def: { type: ['string', 'null'] },
    signs: { type: ['array', 'null'], items: ICON_ITEM, description: 'mechanism early-signs (2–3).' },
    nodes: { type: ['array', 'null'], items: { type: 'string' }, description: 'cycle node labels (clockwise).' },
    close: { type: ['array', 'null'], items: SPAN, description: 'cycle closing two-tone line.' },
    items: { type: ['array', 'null'], items: PROTO_ITEM, description: 'protocol items.' },
    cta: { type: ['array', 'null'], items: SPAN, description: 'save: "Comment KEYWORD below…".' },
    button: { type: ['string', 'null'], description: 'save button text.' },
    image: { ...SLIDE_IMAGE, type: ['object', 'null'] },
  },
  required: [
    'index', 'type', 'counter', 'kicker', 'lead', 'foot', 'headline', 'sub', 'stats', 'pills', 'removes',
    'cascade', 'head', 'big', 'tail', 'bars', 'xlabels', 'word', 'phon', 'def', 'signs', 'nodes', 'close',
    'items', 'cta', 'button', 'image',
  ],
} as const;

export const CAROUSEL_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    format: { type: 'string', enum: ['instagram-carousel'] },
    direction: { type: 'string' },
    slideCount: { type: 'integer' },
    slides: { type: 'array', items: SLIDE },
    assetsUsed: { type: 'array', items: { type: 'string' }, description: 'Asset ids actually used.' },
    brandConsistencyNotes: { type: 'string', description: 'How this plan honors the design bible (color logic, India anchoring, citations, staggered cards).' },
  },
  required: ['format', 'direction', 'slideCount', 'slides', 'assetsUsed', 'brandConsistencyNotes'],
} as const;
