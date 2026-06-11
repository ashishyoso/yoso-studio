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
export type BodyStyle = 'body' | 'hand';
export interface BodyLine {
  /** 'body' = normal body sans; 'hand' = Playwrite handwritten accent line. */
  style: BodyStyle;
  /** Inline two-tone runs so only the stat/keyword is colored, not the line. */
  spans: Span[];
}

export type SlideLayout = 'cover' | 'section' | 'check-do' | 'save';

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
  layout: SlideLayout;
  headline: Span[] | null; // cover + save
  subhead: string | null; // cover
  sectionHeader: string | null; // section + check-do
  thesis: string | null; // highlight bar
  body: BodyLine[] | null; // section
  checkTitle: string | null; // check-do
  checkItems: string[] | null;
  helpsTitle: string | null;
  helpsItems: string[] | null;
  commentKeyword: string | null; // save
  offer: string | null; // save
  image: SlideImage | null;
  navPill: boolean;
}

export interface CarouselPlan {
  format: 'instagram-carousel';
  direction: string;
  slideCount: number;
  slides: Slide[];
  assetsUsed: string[];
  brandConsistencyNotes: string;
}
