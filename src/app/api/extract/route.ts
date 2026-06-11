import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_BYTES = 25 * 1024 * 1024; // 25MB

// Extract plain text from an uploaded script file (PDF / TXT / MD) so the user
// can upload a finished carousel script instead of pasting it.
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }
    const name = (file as File).name || 'upload';
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large (max 25MB).' }, { status: 413 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const lower = name.toLowerCase();
    let text = '';

    if (lower.endsWith('.pdf') || buf.subarray(0, 5).toString() === '%PDF-') {
      // Import the lib file directly to bypass pdf-parse's index.js debug block
      // (which self-runs on a bundled test PDF and throws).
      const pdf = (await import('pdf-parse/lib/pdf-parse.js')).default;
      const parsed = await pdf(buf);
      text = parsed.text || '';
    } else {
      text = buf.toString('utf8');
    }

    text = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    if (!text) {
      return NextResponse.json({ error: 'Could not extract any text from that file.' }, { status: 422 });
    }
    return NextResponse.json({ text, filename: name, chars: text.length });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Extraction failed.' }, { status: 500 });
  }
}
