import { promises as fs } from 'fs';
import path from 'path';
import type { AssetRef, ClientKnowledge, ClientSummary } from '@/lib/types';

// ── Client configuration ──────────────────────────────────────────────────────
// For the MVP, client knowledge lives on disk as markdown + a static asset
// manifest. The loader is abstracted so this becomes a DB + pgvector RAG layer
// later (see README → "RAG architecture") without touching callers.

interface ClientConfig {
  clientId: string;
  name: string;
  accent: string;
  knowledgeDir: string; // relative to src/lib/clients
  assets: AssetRef[];
}

const FIFTY_PLUS_ASSETS: AssetRef[] = [
  {
    id: 'logo-pill',
    kind: 'logo',
    label: 'FIFTY+ wordmark pill',
    path: '/clients/fifty-plus/logo.png',
    tags: ['logo', 'wordmark', 'brand'],
    description: 'Terracotta rounded pill with white FIFTY+ wordmark and a thin medical-cross "+". Rendered natively in CSS by the template engine; PNG fallback in /public.',
  },
  {
    id: 'founder-navneeth',
    kind: 'founder',
    label: 'Navneeth Ramprasad (founder)',
    tags: ['founder', 'industry-insider', 'navneeth', 'on-camera'],
    description: 'Founder / "industry insider" creator voice. Use for founder-led and thought-leadership directions.',
  },
  {
    id: 'doctor-manthan',
    kind: 'team',
    label: 'Dr. Manthan Mehta (physician)',
    tags: ['doctor', 'physician', 'myth-busting', 'credibility'],
    description: 'Physician face of the myth-busting series. Use for evidence/credibility directions.',
  },
  {
    id: 'parent-messenger',
    kind: 'creative',
    label: '50+ parent messenger imagery',
    tags: ['parent', 'mother', 'father', 'dignity', 'track-b', 'active-aging'],
    description: 'Real 50+ parents living actively, with dignity. Track B / retention. NEVER grey-on-park-bench decline imagery.',
  },
  {
    id: 'product-tub',
    kind: 'product',
    label: 'Fifty+ Daily Protein (1kg tub)',
    tags: ['product', 'protein', 'tub', 'packaging'],
    description: 'Hero SKU. Premium, matte, no gloss/foil. Barrier-packed for Indian heat/humidity.',
  },
];

const CLIENTS: ClientConfig[] = [
  {
    clientId: 'fifty-plus',
    name: 'Fifty+ (Praan Health)',
    accent: '#D14124',
    knowledgeDir: 'fifty-plus/knowledge',
    assets: FIFTY_PLUS_ASSETS,
  },
];

const CLIENTS_ROOT = path.join(process.cwd(), 'src', 'lib', 'clients');

export function listClients(): ClientSummary[] {
  return CLIENTS.map((c) => ({
    clientId: c.clientId,
    name: c.name,
    accent: c.accent,
    assetCount: c.assets.length,
  }));
}

export async function loadClientKnowledge(clientId: string): Promise<ClientKnowledge> {
  const cfg = CLIENTS.find((c) => c.clientId === clientId);
  if (!cfg) throw new Error(`Unknown client: ${clientId}`);

  const dir = path.join(CLIENTS_ROOT, cfg.knowledgeDir);
  const [brandBible, designBible] = await Promise.all([
    fs.readFile(path.join(dir, 'brand-bible.md'), 'utf8'),
    fs.readFile(path.join(dir, 'design-bible.md'), 'utf8'),
  ]);

  return {
    clientId: cfg.clientId,
    name: cfg.name,
    brandBible,
    designBible,
    assets: cfg.assets,
    accent: cfg.accent,
  };
}

/**
 * MVP "asset intelligence": keyword scoring over the manifest. This is the seam
 * where a vector/embedding search drops in later. Returns assets most relevant
 * to the supplied content + direction so they can be injected into generation
 * context and preferred over AI-generated imagery.
 */
export function findRelevantAssets(knowledge: ClientKnowledge, query: string, limit = 5): AssetRef[] {
  const terms = query.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 2);
  const scored = knowledge.assets.map((a) => {
    const hay = `${a.label} ${a.kind} ${a.tags.join(' ')} ${a.description}`.toLowerCase();
    const score = terms.reduce((s, t) => s + (hay.includes(t) ? 1 : 0), 0);
    return { a, score };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((x, y) => y.score - x.score)
    .slice(0, limit)
    .map((s) => s.a);
}
