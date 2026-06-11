import { listClients } from '@/lib/clients/registry';
import { hasApiKey } from '@/lib/ai/anthropic';
import { FORMAT_LIST } from '@/lib/formats/registry';
import Studio from './studio';

export const dynamic = 'force-dynamic';

export default function Page() {
  const clients = listClients();
  const formats = FORMAT_LIST.map((f) => ({ id: f.id, label: f.label, aspect: f.aspect, enabled: f.enabled }));
  return <Studio clients={clients} formats={formats} mock={!hasApiKey()} />;
}
