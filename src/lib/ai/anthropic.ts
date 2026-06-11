import Anthropic from '@anthropic-ai/sdk';

export const MODEL = process.env.STUDIO_MODEL || 'claude-opus-4-8';
export const hasApiKey = (): boolean => Boolean(process.env.ANTHROPIC_API_KEY);

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) client = new Anthropic();
  return client;
}

/**
 * Run a single structured-output call via forced tool use.
 *
 * Forced tool use is the most portable way to get schema-constrained JSON out of
 * the API — it works across SDK versions and every tool-capable model, and we
 * never pass raw user input straight to the model: the system prompt carries the
 * brand + design bibles, and the user turn carries the assembled brief.
 *
 * Returns the validated `input` object the model produced for the tool.
 */
export async function runStructured<T>(opts: {
  system: string;
  user: string;
  toolName: string;
  toolDescription: string;
  schema: Record<string, unknown>;
  maxTokens?: number;
}): Promise<T> {
  const res = await getClient().messages.create({
    model: MODEL,
    max_tokens: opts.maxTokens ?? 8000,
    system: [
      // Cache the (large, stable) bible-bearing system prompt across the
      // strategy and plan calls in a session.
      { type: 'text', text: opts.system, cache_control: { type: 'ephemeral' } },
    ],
    messages: [{ role: 'user', content: opts.user }],
    tools: [
      {
        name: opts.toolName,
        description: opts.toolDescription,
        input_schema: opts.schema as Anthropic.Tool.InputSchema,
      },
    ],
    tool_choice: { type: 'tool', name: opts.toolName },
  });

  const block = res.content.find((b) => b.type === 'tool_use');
  if (!block || block.type !== 'tool_use') {
    throw new Error('Model did not return structured tool output.');
  }
  return block.input as T;
}
