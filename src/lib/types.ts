// ── Core domain types for the YOSO design studio ──────────────────────────────
// These are intentionally provider-agnostic. The generation pipeline
// (strategy → plan → render) is identical regardless of which image model or
// render backend is finally used; only the backend swaps.

export type FormatId =
  | 'instagram-carousel'
  | 'instagram-post'
  | 'linkedin-post'
  | 'youtube-thumbnail'
  | 'twitter-creative'
  | 'whatsapp-creative'
  | 'ad-creative'
  | 'event-banner';

export interface FormatDef {
  id: FormatId;
  label: string;
  aspect: string; // e.g. "4:5", "1:1", "16:9"
  width: number;
  height: number;
  /** Which render backend produces brand-faithful output for this format. */
  defaultBackend: RenderBackendId;
  /** Whether this format is wired end-to-end in the MVP. */
  enabled: boolean;
  description: string;
}

export type RenderBackendId =
  | 'template-html' // deterministic HTML/CSS → PNG (brand-faithful, default for text-heavy)
  | 'image-gen'; // Nano Banana / OpenAI image API (for photographic/illustrative elements)

// ── Client knowledge ─────────────────────────────────────────────────────────

export interface AssetRef {
  id: string;
  kind: 'logo' | 'product' | 'founder' | 'team' | 'illustration' | 'icon' | 'background' | 'creative';
  label: string;
  path?: string; // public/ path if a real file is present
  tags: string[];
  description: string;
}

export interface ClientKnowledge {
  clientId: string;
  name: string;
  /** Brand bible markdown (positioning, voice, audience, do/don't…). */
  brandBible: string;
  /** Design bible markdown (layouts, tokens, composition rules…). */
  designBible: string;
  /** Searchable asset repository. */
  assets: AssetRef[];
  /** Brand accent for the app UI chrome. */
  accent: string;
}

export interface ClientSummary {
  clientId: string;
  name: string;
  accent: string;
  assetCount: number;
}

// ── Strategy engine output ───────────────────────────────────────────────────

export interface CreativeDirection {
  id: string;
  title: string;
  angle: string;
  emotionalDriver: string;
  visualApproach: string;
  whyItFits: string;
  track: 'A-acquisition' | 'B-retention';
}

export interface StrategyResult {
  contentIntent: string;
  targetAudience: string;
  directions: CreativeDirection[];
}

// ── Slide plan (carousel) ────────────────────────────────────────────────────

export type Tone = 'ink' | 'topic' | 'alarm';
export interface Span {
  text: string;
  tone: Tone;
}
// ── Wellbeing-Nutrition archetype model (skinned in the Fifty+ brand) ──────────
// Each slide is one of 8 archetypes from the replication playbook. Most fields
// are optional and apply only to certain `type`s — set null elsewhere.
export type SlideType = 'cover' | 'stats' | 'flow' | 'statHero' | 'mechanism' | 'cycle' | 'protocol' | 'save';

export interface Stat { n: string; label: string }
/** A line icon + label — used by flow pills and mechanism early-signs. */
export interface IconItem { icon: string; label: string }
export interface ProtocolItem { act: string; why: string }

export interface SlideImage {
  mode: 'mascot' | 'duotone' | 'anatomical' | '3d' | 'none';
  /** Prefer a real brand asset; only generate when none fits. */
  source: 'asset' | 'generate' | 'none';
  assetId: string | null;
  /** Optimized prompt for the image model when source === 'generate'. */
  genPrompt: string | null;
  placement: 'bottom-right' | 'bottom' | 'right' | 'none';
}

export interface Slide {
  index: number;
  type: SlideType;
  counter: string;                 // baked slide-counter pill, e.g. "1/8"
  kicker: string | null;           // section header (orange grotesque); cover uses headline instead
  lead: string | null;             // supporting line under the kicker
  foot: string | null;             // citation footnote / closing micro-line
  headline: Span[] | null;         // cover + save (two-tone)
  sub: string | null;              // cover subhead
  stats: Stat[] | null;            // stats archetype
  pills: IconItem[] | null;        // flow: the things work gave the body
  removes: Span[] | null;          // flow: "removes them all at once"
  cascade: string | null;          // flow: "Less movement → less muscle → …"
  head: string | null;             // statHero pre-number text
  big: string | null;              // statHero hero number
  tail: string | null;             // statHero post-number text
  bars: number[] | null;           // statHero descending bar heights (0–100)
  xlabels: string[] | null;        // statHero x-axis labels
  word: string | null;             // mechanism: the named term
  phon: string | null;             // mechanism: phonetic + part of speech
  def: string | null;              // mechanism: one-line definition
  signs: IconItem[] | null;        // mechanism: early-sign icons
  nodes: string[] | null;          // cycle: node labels (clockwise)
  close: Span[] | null;            // cycle: closing two-tone line
  items: ProtocolItem[] | null;    // protocol: action + why
  cta: Span[] | null;              // save: "Comment KEYWORD below…"
  button: string | null;           // save: button text
  image: SlideImage | null;        // cover / protocol / save / mechanism photo
}

export interface CarouselPlan {
  format: 'instagram-carousel';
  direction: string;
  slideCount: number;
  slides: Slide[];
  assetsUsed: string[];
  brandConsistencyNotes: string;
}
