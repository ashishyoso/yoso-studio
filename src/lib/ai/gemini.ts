// Structured-text generation via Google Gemini (JSON mode). Lets the carousel
// planner run on the same GEMINI_API_KEY used for Nano Banana image generation —
// so the whole studio needs only one key.

const BASE = process.env.GEMINI_API_BASE || 'https://generativelanguage.googleapis.com/v1beta';
const MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash';

export const hasGemini = (): boolean => Boolean(process.env.GEMINI_API_KEY);

export async function geminiJson<T>(system: string, user: string, maxOutputTokens = 9000): Promise<T> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY not set.');
  const res = await fetch(`${BASE}/models/${MODEL}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.7, maxOutputTokens },
    }),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Gemini: ${data?.error?.message || `HTTP ${res.status}`}`);
  const text: string = (data?.candidates?.[0]?.content?.parts || []).map((p: any) => p?.text || '').join('').trim();
  if (!text) throw new Error('Gemini returned no text.');
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // salvage the outermost JSON object if the model wrapped it in prose
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]) as T;
    throw new Error('Gemini did not return valid JSON.');
  }
}
