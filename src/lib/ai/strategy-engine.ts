import type { ClientKnowledge, FormatDef, StrategyResult, AssetRef } from '@/lib/types';
import { hasApiKey, runStructured } from './anthropic';
import { STRATEGY_SCHEMA } from './schemas';

function strategySystem(k: ClientKnowledge): string {
  return [
    `You are the Creative Strategy Lead at YOSO Media, a high-end creative agency, working on the client "${k.name}".`,
    `You think like a senior strategist + senior designer. Every decision must be grounded in the client's bibles below — if a direction contradicts them, it is wrong.`,
    `Avoid generic, templated, AI-looking ideas. Output should resemble work from a top agency.`,
    ``,
    `=== BRAND BIBLE (source of truth) ===`,
    k.brandBible,
    ``,
    `=== DESIGN BIBLE (source of truth) ===`,
    k.designBible,
  ].join('\n');
}

function strategyUser(content: string, format: FormatDef, assets: AssetRef[]): string {
  return [
    `CONTENT / COPY TO ADAPT:`,
    content.trim(),
    ``,
    `FORMAT: ${format.label} (${format.aspect}, ${format.width}x${format.height}).`,
    ``,
    `RELEVANT BRAND ASSETS available (prefer these over generated imagery):`,
    assets.length ? assets.map((a) => `- ${a.id} [${a.kind}]: ${a.label} — ${a.description}`).join('\n') : '- (none matched; rely on brand-faithful templated layout)',
    ``,
    `TASK: Analyze content intent, target audience, emotional angle, and the visual storytelling opportunity. Then produce 3–5 distinct creative directions for this format. Each must name which track it serves (A = child-acquisition, B = parent-dignity) and cite a specific brand/design guardrail it honors. Keep directions genuinely different from each other (e.g. minimal founder-led vs data infographic vs bold editorial).`,
  ].join('\n');
}

export async function generateStrategy(
  knowledge: ClientKnowledge,
  content: string,
  format: FormatDef,
  assets: AssetRef[],
): Promise<StrategyResult> {
  if (!hasApiKey()) return mockStrategy(content);
  return runStructured<StrategyResult>({
    system: strategySystem(knowledge),
    user: strategyUser(content, format, assets),
    toolName: 'submit_creative_strategy',
    toolDescription: 'Submit the analyzed creative strategy and 3–5 creative directions.',
    schema: STRATEGY_SCHEMA as unknown as Record<string, unknown>,
    maxTokens: 4000,
  });
}

// ── Mock (no API key) ─────────────────────────────────────────────────────────
function mockStrategy(content: string): StrategyResult {
  const firstLine = content.trim().split('\n')[0]?.slice(0, 80) || 'the supplied content';
  return {
    contentIntent: `Turn "${firstLine}" into a save-worthy education piece that makes parental inaction feel irresponsible — without fear-mongering.`,
    targetAudience: 'Adult millennial child (28–40) worried about a 50+ parent — Track A acquisition.',
    directions: [
      {
        id: 'minimal-founder-led',
        title: 'Minimal Founder-Led',
        angle: 'Navneeth as the industry insider quietly exposing what the protein category skipped for 50+ parents.',
        emotionalDriver: 'Responsible love + trust',
        visualApproach: 'Cream canvas, flush-left, duotone founder portrait bleeding off the bottom-right.',
        whyItFits: 'Leads with physician/insider credibility (non-negotiable #1: credibility first).',
        track: 'A-acquisition',
      },
      {
        id: 'data-infographic',
        title: 'Data-Driven Infographic',
        angle: 'Mechanism-to-India-to-checklist: one body system explained with one cited stat per slide.',
        emotionalDriver: 'Earned agency',
        visualApproach: 'Anatomical illustration on the mechanism slide; terracotta highlight bars carry the stat.',
        whyItFits: 'Matches the 8-slide narrative arc and the "cite a real study" design rule.',
        track: 'A-acquisition',
      },
      {
        id: 'bold-editorial',
        title: 'Bold Editorial',
        angle: 'A single counterintuitive truth, stated plainly, carried by typographic scale.',
        emotionalDriver: 'Alarm without panic',
        visualApproach: 'Oversized two-tone Display Sans hook, minimal imagery, one terracotta accent.',
        whyItFits: 'Uses the headline color logic (topic noun terracotta, worst outcome alarm) sparingly.',
        track: 'A-acquisition',
      },
    ],
  };
}
