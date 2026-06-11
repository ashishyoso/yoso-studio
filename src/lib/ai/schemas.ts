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

const BODY_LINE = {
  type: 'object',
  additionalProperties: false,
  properties: {
    text: { type: 'string' },
    highlight: { type: 'string', enum: ['none', 'topic', 'alarm'] },
  },
  required: ['text', 'highlight'],
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
    layout: { type: 'string', enum: ['cover', 'section', 'check-do', 'save'] },
    headline: { type: ['array', 'null'], items: SPAN, description: 'Two-tone headline spans (cover + save slides).' },
    subhead: { type: ['string', 'null'] },
    sectionHeader: { type: ['string', 'null'], description: 'Serif terracotta header (section + check-do).' },
    thesis: { type: ['string', 'null'], description: 'One-line thesis for the terracotta highlight bar.' },
    body: { type: ['array', 'null'], items: BODY_LINE, description: 'Body copy, one idea per line. Stats highlighted. Citations in parens with a real source.' },
    checkTitle: { type: ['string', 'null'] },
    checkItems: { type: ['array', 'null'], items: { type: 'string' } },
    helpsTitle: { type: ['string', 'null'] },
    helpsItems: { type: ['array', 'null'], items: { type: 'string' } },
    commentKeyword: { type: ['string', 'null'], description: 'Single uppercase keyword for the comment mechanic (save slide).' },
    offer: { type: ['string', 'null'], description: 'Free-guide offer line (save slide).' },
    image: { ...SLIDE_IMAGE, type: ['object', 'null'] },
    navPill: { type: 'boolean', description: 'true on slides 1–7, false on the final save slide.' },
  },
  required: [
    'index', 'layout', 'headline', 'subhead', 'sectionHeader', 'thesis', 'body',
    'checkTitle', 'checkItems', 'helpsTitle', 'helpsItems', 'commentKeyword', 'offer', 'image', 'navPill',
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
