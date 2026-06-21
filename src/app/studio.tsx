'use client';

import { useState } from 'react';
import type { ClientSummary, CarouselPlan, FormatId } from '@/lib/types';

interface FormatLite { id: FormatId; label: string; aspect: string; enabled: boolean }
type ImageProvider = 'nano-banana' | 'openai';
type Mode = 'angle' | 'script';
type Asset = { index: number; pngBase64: string };

export default function Studio({
  clients,
  formats,
  mock,
  providers,
}: {
  clients: ClientSummary[];
  formats: FormatLite[];
  mock: boolean;
  providers: Record<ImageProvider, boolean>;
}) {
  const [clientId, setClientId] = useState(clients[0]?.clientId || '');
  const [format, setFormat] = useState<FormatId>('instagram-carousel');
  const [mode, setMode] = useState<Mode>('angle');
  const [content, setContent] = useState('');

  const [slides, setSlides] = useState<Asset[] | null>(null);
  const [plan, setPlan] = useState<CarouselPlan | null>(null);
  const [stage, setStage] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const enabledFormats = formats.filter((f) => f.enabled);
  const nbReady = providers['nano-banana'];

  async function call(path: string, body: unknown) {
    const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
    return json;
  }

  async function onUpload(file: File | undefined) {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/extract', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Extraction failed.');
      setContent(json.text);
      setMode('script');
      setNote(`Loaded ${json.filename} (${json.chars.toLocaleString()} chars).`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  // One action: plan the deck (research + copy for an angle, or faithful for a
  // script), then render every slide with Nano Banana.
  async function generate() {
    if (!content.trim()) return;
    setError(null);
    setNote(null);
    setSlides(null);
    setPlan(null);
    setBusy(true);
    try {
      setStage(mode === 'angle' ? 'Researching the angle and writing the deck…' : 'Laying out your script…');
      const p = await call('/api/plan', { clientId, content, mode });
      setPlan(p.plan);
      setStage(`Designing ${p.plan.slides.length} slides with Nano Banana…`);
      const r = await call('/api/full-render', { plan: p.plan, provider: 'nano-banana' });
      setSlides(r.assets || []);
      const errs = (r.results || []).filter((x: any) => x.status === 'error').length;
      setNote(`Done — ${r.assets.length} slide${r.assets.length === 1 ? '' : 's'}${errs ? `, ${errs} failed (retry)` : ''}.`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
      setStage('');
    }
  }

  function downloadAll() {
    if (!slides) return;
    for (const a of slides) {
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${a.pngBase64}`;
      link.download = `${clientId}-slide-${String(a.index).padStart(2, '0')}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  }

  const seg = (m: Mode, label: string, hint: string) => (
    <button
      type="button"
      onClick={() => setMode(m)}
      style={{
        flex: 1, textAlign: 'left', padding: '14px 18px', borderRadius: 12, cursor: 'pointer',
        border: `1.5px solid ${mode === m ? 'var(--accent, #F36937)' : 'var(--line, #2a2a2a)'}`,
        background: mode === m ? 'rgba(243,105,55,0.10)' : 'transparent', color: 'inherit',
      }}
    >
      <div style={{ fontWeight: 600 }}>{label}</div>
      <div className="sub" style={{ marginTop: 2 }}>{hint}</div>
    </button>
  );

  return (
    <main className="app">
      <div className="topbar">
        <span className="logo-dot">Y</span>
        <div>
          <h1>YOSO Studio</h1>
          <div className="sub">Brand-consistent carousels · Nano Banana</div>
        </div>
      </div>

      {error && <div className="notice err" style={{ marginBottom: 14 }}>{error}</div>}
      {!nbReady && (
        <div className="notice warn" style={{ marginBottom: 14 }}>
          Nano Banana needs <code>GEMINI_API_KEY</code> in <code>.env.local</code> to render slides.
        </div>
      )}
      {mock && mode === 'angle' && (
        <div className="notice warn" style={{ marginBottom: 14 }}>
          No <code>ANTHROPIC_API_KEY</code> — angle → copy uses a sample deck. Paste a script for exact copy, or add a key.
        </div>
      )}

      {/* 1 · Setup */}
      <div className="panel">
        <h2>1 · Setup</h2>
        <div className="row">
          <div>
            <label>Client</label>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)}>
              {clients.map((c) => <option key={c.clientId} value={c.clientId}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label>Format</label>
            <select value={format} onChange={(e) => setFormat(e.target.value as FormatId)}>
              {enabledFormats.map((f) => <option key={f.id} value={f.id}>{f.label} ({f.aspect})</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* 2 · Content */}
      <div className="panel">
        <h2>2 · What are we making?</h2>
        <div style={{ display: 'flex', gap: 12, margin: '6px 0 16px' }}>
          {seg('angle', 'An angle', 'We research it and write the copy')}
          {seg('script', 'A script', 'You bring finished slide copy — kept verbatim')}
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={mode === 'script' ? 10 : 4}
          placeholder={
            mode === 'angle'
              ? 'e.g. Why Indian parents quietly lose muscle after they retire — and the simple daily fix.'
              : 'Paste your finished slide-by-slide script here…'
          }
        />
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <label htmlFor="file" className="btn secondary" style={{ cursor: 'pointer', margin: 0 }}>
            {uploading ? <><span className="spinner" /> Extracting…</> : '⬆ Upload script (PDF / TXT / MD)'}
          </label>
          <input id="file" type="file" accept=".pdf,.txt,.md,application/pdf,text/plain" style={{ display: 'none' }} onChange={(e) => onUpload(e.target.files?.[0])} />
          {note && !busy && <span className="sub">{note}</span>}
        </div>
        <div className="btn-row">
          <button className="btn" disabled={!content.trim() || busy || !nbReady} onClick={generate}>
            {busy ? <><span className="spinner" /> {stage || 'Working…'}</> : '✨ Generate carousel →'}
          </button>
        </div>
      </div>

      {/* 3 · Carousel */}
      {(busy || slides) && (
        <div className="panel">
          <h2>3 · Carousel</h2>
          {busy && !slides && <p className="hint"><span className="spinner" /> {stage}</p>}
          {slides && (
            <div className="btn-row" style={{ marginTop: 0, marginBottom: 14 }}>
              <button className="btn" onClick={downloadAll}>Download all PNGs ↓</button>
              {note && <span className="sub">{note}</span>}
            </div>
          )}
          <div className="slides-grid">
            {(slides || []).map((a) => (
              <div className="slide-wrap" key={a.index}>
                <div className="cap"><span>Slide {a.index}</span><span>{plan?.slides?.find((s) => s.index === a.index)?.type}</span></div>
                <img className="slide-frame" alt={`slide-${a.index}`} src={`data:image/png;base64,${a.pngBase64}`} />
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
