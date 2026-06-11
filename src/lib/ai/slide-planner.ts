import type { CarouselPlan, ClientKnowledge, CreativeDirection, AssetRef } from '@/lib/types';
import { hasApiKey, runStructured } from './anthropic';
import { CAROUSEL_SCHEMA } from './schemas';

function plannerSystem(k: ClientKnowledge): string {
  return [
    `You are a Staff-level Art Director at YOSO Media building an Instagram carousel for "${k.name}".`,
    `You produce slide-by-slide design instructions that a deterministic HTML/CSS render engine turns into pixel-perfect, brand-faithful slides. Because rendering is deterministic, YOU own typography, hierarchy, color logic, and copy — get them exactly right per the design bible.`,
    ``,
    `INPUT MODES — detect which one the source content is:`,
    `(A) RAW IDEA / post / hook → write the full carousel using the 8-slide arc below.`,
    `(B) FINISHED SLIDE SCRIPT (it contains per-slide markers like "SLIDE 1 · COVER", "HEADLINE", "SUB-PROMISE", "Here's what to check:", "CLOSER", or is clearly already broken into slides) → REPRODUCE IT FAITHFULLY. Map each provided slide to exactly one output slide, in order. Keep the EXACT wording of every headline, line, citation, and list item — do not rewrite, paraphrase, summarize, add, or drop anything. Your job is ONLY design: pick the layout, split copy into two-tone spans, set the thesis bar to the slide's one-line truth, format the check/do lists, and assign image specs. Use the "SLIDE N · <title>" text (minus the "SLIDE N ·" prefix) as the sectionHeader. The cover HEADLINE becomes the two-tone cover headline; SUB-PROMISE becomes the subhead. The CLOSER becomes the save slide (extract the comment KEYWORD and the offer). Preserve the slide count exactly.`,
    ``,
    `HARD RULES (from the design bible):`,
    `- Follow the 8-slide narrative arc (Hook → How it works → What changes after 50 → Why → The Indian picture → Consequences → What to check/what to do → Save). 7 is acceptable; always keep 1 (hook), the check/do slide, and 8 (save). Collapse middle slides if the topic is thin.`,
    `- Headline color logic: default words = ink; the topic noun = "topic" (terracotta); the single worst-outcome phrase = "alarm". Max two colors per line; a line almost never uses all three.`,
    `- Body copy is an array of lines. Each line has \`spans\` (inline two-tone runs) and a \`style\`. Put one idea per line. Color ONLY the stat/keyword within a line (tone "topic" = terracotta; "alarm" = bright red, rare); leave the rest "ink" — never color a whole line. Second person about the parent ("your mother", "she won't feel it").`,
    `- Use style "hand" for an occasional handwritten-accent line (a transitional or closing aphorism, e.g. "More milk hasn't solved it." / "It can still change."). Use it sparingly — at most once or twice across the carousel.`,
    `- Cite real sources in parentheses (First author et al., Journal, Year). Highlight the headline number with highlight="topic". Never invent fake citations — if unsure, use a credible body (ICMR-NIN, LASI, Lancet, BMJ) and keep the claim to what it supports. No em dashes in citations.`,
    `- Anchor to India on at least the hook and the "Indian picture" slide (dal, milk, paneer, floor-sitting, ICMR/LASI).`,
    `- The check/do slide uses two staggered ivory cards (checkTitle "Here's what to check:" + helpsTitle "Here's what helps:").`,
    `- Save slide: aphoristic two-tone headline + "it can still change" reassurance + a single uppercase commentKeyword + free-guide offer. navPill=false on this slide only.`,
    `- Imagery: PREFER a real brand asset (source="asset", set assetId) whenever one fits. Only source="generate" when nothing in the repository works; then write a tight image-model prompt for the ELEMENT only (duotone photo / anatomical illustration / flat mascot per brand) — never put text in a generated image. Images bleed off an edge; text owns the top-left.`,
    `- IMAGE RESTRAINT (critical): text must NEVER share vertical space with an image. A clean text slide beats a crowded one. Set the image to mode/source/placement = "none" on any stat-dense or citation-heavy slide, and on ANY slide whose body is longer than ~4 short lines. Reserve imagery for: the cover, the save slide, and mechanism / "Indian picture" slides that have SHORT copy. The check/do slide never has an image. When in doubt, no image.`,
    `- Non-negotiables: no fear-mongering, no unbacked absolute claims, never portray aging as decline, treat the 50+ parent with dignity.`,
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
    `BRAND ASSETS available (use assetId to reference; prefer over generation):`,
    assets.length ? assets.map((a) => `- ${a.id} [${a.kind}]: ${a.label} — ${a.description}`).join('\n') : '- (none matched)',
    ``,
    `TASK: Produce the full carousel plan. For each slide set layout, all copy (as two-tone spans / body lines per the color logic), the highlight-bar thesis where relevant, the check/do lists, and the image spec (asset vs generate + placement). Populate every field (use null where a field does not apply to that layout). Number slides from 1. Fill brandConsistencyNotes explaining how the plan honors the design bible.`,
  ].join('\n');
}

export async function generateCarouselPlan(
  knowledge: ClientKnowledge,
  content: string,
  direction: CreativeDirection,
  assets: AssetRef[],
): Promise<CarouselPlan> {
  if (!hasApiKey()) return mockPlan(direction);
  const plan = await runStructured<CarouselPlan>({
    system: plannerSystem(knowledge),
    user: plannerUser(content, direction, assets),
    toolName: 'submit_carousel_plan',
    toolDescription: 'Submit the full slide-by-slide carousel design plan.',
    schema: CAROUSEL_SCHEMA as unknown as Record<string, unknown>,
    maxTokens: 9000,
  });
  // Defensive normalization so the renderer never sees undefined.
  plan.slides = (plan.slides || []).map((s, i) => ({ ...s, index: s.index ?? i + 1 }));
  return plan;
}

// ── Mock (no API key): a complete, brand-faithful 8-slide example ─────────────
function mockPlan(direction: CreativeDirection): CarouselPlan {
  return {
    format: 'instagram-carousel',
    direction: direction.title,
    slideCount: 8,
    slides: [
      {
        index: 1,
        layout: 'cover',
        headline: [
          { text: 'What happens to ', tone: 'ink' },
          { text: 'muscle after 50', tone: 'topic' },
          { text: '. The body loses it quietly — until the day she ', tone: 'ink' },
          { text: "can't get up from the floor", tone: 'alarm' },
          { text: '.', tone: 'ink' },
        ],
        subhead: 'The answer is not how much she eats.\nHere is the science and what still helps.',
        sectionHeader: null, thesis: null, body: null,
        checkTitle: null, checkItems: null, helpsTitle: null, helpsItems: null,
        commentKeyword: null, offer: null,
        image: { mode: 'duotone', source: 'asset', assetId: 'parent-messenger', genPrompt: null, placement: 'bottom-right' },
        navPill: true,
      },
      {
        index: 2,
        layout: 'section',
        headline: null, subhead: null,
        sectionHeader: 'How muscle actually works',
        thesis: 'Muscle is living tissue, not a fixed amount.',
        body: [
          { style: 'body', spans: [{ text: 'It is built and broken down every single day.', tone: 'ink' }] },
          { style: 'body', spans: [{ text: 'Protein from food tips the balance toward building.', tone: 'ink' }] },
          { style: 'body', spans: [{ text: 'After 50, the muscle ', tone: 'ink' }, { text: 'resists that signal', tone: 'topic' }, { text: ' and needs more.', tone: 'ink' }] },
        ],
        checkTitle: null, checkItems: null, helpsTitle: null, helpsItems: null,
        commentKeyword: null, offer: null,
        image: { mode: 'anatomical', source: 'generate', assetId: null, genPrompt: 'Semi-realistic medical illustration of skeletal muscle fibers, warm terracotta duotone, on a transparent background, no text', placement: 'right' },
        navPill: true,
      },
      {
        index: 3,
        layout: 'section',
        headline: null, subhead: null,
        sectionHeader: 'What changes after 50',
        thesis: 'Adults can lose up to 1% of muscle a year after 50.',
        body: [
          { style: 'body', spans: [{ text: 'The loss is silent. There is no pain to warn you.', tone: 'ink' }] },
          { style: 'body', spans: [{ text: 'Often the first symptom is a fall ', tone: 'ink' }, { text: '(Cruz-Jentoft et al., Lancet, 2019)', tone: 'topic' }, { text: '.', tone: 'ink' }] },
          { style: 'hand', spans: [{ text: 'The decline is quiet. Only the discovery is sudden.', tone: 'topic' }] },
        ],
        checkTitle: null, checkItems: null, helpsTitle: null, helpsItems: null,
        commentKeyword: null, offer: null,
        image: { mode: 'none', source: 'none', assetId: null, genPrompt: null, placement: 'none' },
        navPill: true,
      },
      {
        index: 4,
        layout: 'section',
        headline: null, subhead: null,
        sectionHeader: 'The Indian picture',
        thesis: 'Most older Indians eat far less protein than they need.',
        body: [
          { style: 'body', spans: [{ text: 'Dal and rice feed the meal but leave a protein gap.', tone: 'ink' }] },
          { style: 'body', spans: [{ text: 'Over ', tone: 'ink' }, { text: '70% of older adults', tone: 'topic' }, { text: ' fall short of the daily target ', tone: 'ink' }, { text: '(ICMR-NIN)', tone: 'topic' }, { text: '.', tone: 'ink' }] },
        ],
        checkTitle: null, checkItems: null, helpsTitle: null, helpsItems: null,
        commentKeyword: null, offer: null,
        image: { mode: 'duotone', source: 'generate', assetId: null, genPrompt: 'Warm terracotta duotone photo of an Indian thali with dal and rice, shot top-down, bleeding off bottom edge, no text', placement: 'bottom' },
        navPill: true,
      },
      {
        index: 5,
        layout: 'check-do',
        headline: null, subhead: null,
        sectionHeader: 'What to check, what to do',
        thesis: null, body: null,
        checkTitle: "Here's what to check:",
        checkItems: [
          'Can she rise from a chair without using her hands?',
          'Has her grip or walking pace slowed this year?',
          'Is she getting under 20g of protein a day?',
        ],
        helpsTitle: "Here's what helps:",
        helpsItems: [
          'A protein target of ~1g per kg body weight, spread across meals',
          'Strength-style movement: sit-to-stands, light weights',
          'A doctor-formulated daily if reports show she is falling short',
        ],
        commentKeyword: null, offer: null,
        image: { mode: 'none', source: 'none', assetId: null, genPrompt: null, placement: 'none' },
        navPill: true,
      },
      {
        index: 6,
        layout: 'save',
        headline: [
          { text: 'The ', tone: 'ink' },
          { text: 'strength your parents have today', tone: 'topic' },
          { text: ' is the strength they built over 50 years. ', tone: 'ink' },
          { text: 'It can still change.', tone: 'topic' },
        ],
        subhead: null, sectionHeader: null, thesis: null, body: null,
        checkTitle: null, checkItems: null, helpsTitle: null, helpsItems: null,
        commentKeyword: 'PROTEIN',
        offer: 'We will send you a free guide on protein targets, simple strength moves, and what to check for after 50.',
        image: { mode: 'mascot', source: 'generate', assetId: null, genPrompt: 'Friendly flat-vector mascot of a strong flexed arm, rounded, single subject, terracotta and cream, no text', placement: 'bottom-right' },
        navPill: false,
      },
    ],
    assetsUsed: ['parent-messenger'],
    brandConsistencyNotes:
      'MOCK PLAN (no ANTHROPIC_API_KEY set). Demonstrates the 8-slide arc collapsed to 6: two-tone headline color logic, terracotta thesis bars carrying cited stats, India anchoring (dal/rice, ICMR-NIN), staggered check/do cards, and the save-slide "it can still change" reassurance with the PROTEIN comment mechanic.',
  };
}
