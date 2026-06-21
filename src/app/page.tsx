import { listClients } from '@/lib/clients/registry';
import { hasApiKey } from '@/lib/ai/anthropic';
import { hasGemini } from '@/lib/ai/gemini';
import { FORMAT_LIST } from '@/lib/formats/registry';
import { availableProviders } from '@/lib/render/element-gen';
import Studio from './studio';

export const dynamic = 'force-dynamic';

export default function Page() {
  const clients = listClients();
  const formats = FORMAT_LIST.map((f) => ({ id: f.id, label: f.label, aspect: f.aspect, enabled: f.enabled }));
  // "mock" only when no planner LLM is available at all (Gemini powers planning now).
  return <Studio clients={clients} formats={formats} mock={!hasApiKey() && !hasGemini()} providers={availableProviders()} />;
}
