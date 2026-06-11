'use client';

import { useMemo, useState } from 'react';
import type { ClientSummary, CreativeDirection, StrategyResult, CarouselPlan, FormatId } from '@/lib/types';
import { renderCarouselSlides, type AssetMap } from '@/lib/render/carousel-html';

interface FormatLite { id: FormatId; label: string; aspect: string; enabled: boolean }
type ImageProvider = 'nano-banana' | 'openai';

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
  const [content, setContent] = useState('');
  const [format, setFormat] = useState<FormatId>('instagram-carousel');
  const [faithful, setFaithful] = useState(false);

  const [strategy, setStrategy] = useState<StrategyResult | null>(null);
  const [direction, setDirection] = useState<CreativeDirection | null>(null);
  const [plan, setPlan] = useState<CarouselPlan | null>(null);
  const [assetMap, setAssetMap] = useState<AssetMap>({});
  const [elementMap, setElementMap] = useState<Record<number, string>>({});
  const [provider, setProvider] = useState<ImageProvider>(providers['nano-banana'] ? 'nano-banana' : providers.openai ? 'openai' : 'nano-banana');
  const [renderMode, setRenderMode] = useState<'template' | 'full-image'>('template');
  const [fullSlides, setFullSlides] = useState<{ index: number; pngBase64: string }[] | null>(null);
  const [fullNote, setFullNote] = useState<string | null>(null);

  const [loading, setLoading] = useState<null | 'strategy' | 'plan' | 'elements' | 'render' | 'upload' | 'full'>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadNote, setUploadNote] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [imgNotice, setImgNotice] = useState<string | null>(null);

  const enabledFormats = formats.filter((f) => f.enabled);
  const slides = useMemo(
    () => (plan ? renderCarouselSlides(plan, assetMap, elementMap) : []),
    [plan, assetMap, elementMap],
  );
  const genSlideCount = useMemo(
    () => (plan?.slides || []).filter((s) => s.image?.source === 'generate' && s.image?.genPrompt).length,
    [plan],
  );


  async function call(path: string, body: unknown) {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
    return json;
  }

  async function runStrategy() {
    setError(null);
    setLoading('strategy');
    setStrategy(null);
    setDirection(null);
    setPlan(null);
    try {
      const json = await call('/api/strategy', { clientId, content, format });
      setStrategy(json.strategy);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(null);
    }
  }

  async function runPlan() {
    if (!direction) return;
    setError(null);
    setLoading('plan');
    setPlan(null);
    try {
      const json = await call('/api/plan', { clientId, content, direction });
      setPlan(json.plan);
      setAssetMap(json.assetMap || {});
      setElementMap({});
      setImgNotice(null);
      setFullSlides(null);
      setFullNote(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(null);
    }
  }

  async function onUpload(file: File | undefined) {
    if (!file) return;
    setError(null);
    setUploadNote(null);
    setLoading('upload');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/extract', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Extraction failed.');
      setContent(json.text);
      setFaithful(true); // an uploaded script is finished copy → faithful layout
      setUploadNote(`Loaded ${json.filename} (${json.chars.toLocaleString()} chars). Review below, then "Lay out my copy".`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(null);
    }
  }

  // Faithful mode: user pasted finished slide copy → skip strategy, lay it out.
  async function runFaithful() {
    setError(null);
    setStrategy(null);
    setDirection(null);
    setLoading('plan');
    setPlan(null);
    try {
      const dir: CreativeDirection = {
        id: 'faithful',
        title: 'Faithful layout',
        angle: 'Reproduce the provided slide script exactly in the Fifty+ house style.',
        emotionalDriver: '—',
        visualApproach: 'duotone / anatomical / mascot chosen per slide topic',
        whyItFits: 'User-supplied finished copy — preserve wording, apply design only.',
        track: 'A-acquisition',
      };
      const json = await call('/api/plan', { clientId, content, direction: dir });
      setPlan(json.plan);
      setAssetMap(json.assetMap || {});
      setElementMap({});
      setImgNotice(null);
      setFullSlides(null);
      setFullNote(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(null);
    }
  }

  async function runElements() {
    if (!plan) return;
    setError(null);
    setImgNotice(null);
    setLoading('elements');
    try {
      const json = await call('/api/elements', { plan, provider });
      setElementMap(json.elements || {});
      const r = (json.results || []) as { status: string }[];
      const gen = r.filter((x) => x.status === 'generated').length;
      const errs = r.filter((x) => x.status === 'error').length;
      setImgNotice(`Generated ${gen} element(s) with Nano Banana${errs ? `, ${errs} failed` : ''}.`);
    } catch (e: any) {
      // 503 → no GEMINI_API_KEY; surface gracefully (preview keeps placeholders).
      setImgNotice(e.message);
    } finally {
      setLoading(null);
    }
  }

  async function runFullRender() {
    if (!plan) return;
    setError(null);
    setFullNote(null);
    setLoading('full');
    try {
      const json = await call('/api/full-render', { plan, provider });
      setFullSlides(json.assets || []);
      const errs = (json.results || []).filter((r: any) => r.status === 'error').length;
      setFullNote(`Generated ${json.assets.length} full slide(s) with ${provider === 'openai' ? 'OpenAI' : 'Nano Banana'}${errs ? `, ${errs} failed` : ''}.`);
    } catch (e: any) {
      setFullNote(e.message);
    } finally {
      setLoading(null);
    }
  }

  function downloadPngs(assets: { index: number; pngBase64: string }[], tag: string) {
    for (const a of assets) {
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${a.pngBase64}`;
      link.download = `${clientId}-${tag}-slide-${String(a.index).padStart(2, '0')}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  }

  async function runExport() {
    if (!plan) return;
    setError(null);
    setExportNotice(null);
    setLoading('render');
    try {
      const json = await call('/api/render', { clientId, format, plan, elements: elementMap, provider });
      for (const a of json.assets as { index: number; pngBase64: string }[]) {
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${a.pngBase64}`;
        link.download = `${clientId}-carousel-slide-${String(a.index).padStart(2, '0')}.png`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      setExportNotice(`Exported ${json.assets.length} PNG slide(s).`);
    } catch (e: any) {
      // 503 → backend unavailable; surface gracefully.
      setExportNotice(e.message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <main className="app">
      <div className="topbar">
        <span className="logo-dot">Y</span>
        <div>
          <h1>YOSO Studio</h1>
          <div className="sub">Internal AI design studio · brand-consistent creative generation</div>
        </div>
      </div>

      {mock && (
        <div className="notice warn" style={{ marginBottom: 14 }}>
          MOCK mode — no <code>ANTHROPIC_API_KEY</code> set. Strategy &amp; slide plans return sample data so you can
          exercise the full pipeline and rendering. Add a key in <code>.env.local</code> for real generation.
        </div>
      )}

      {error && <div className="notice err" style={{ marginBottom: 14 }}>{error}</div>}

      {/* Step 1 + 2 */}
      <div className="panel">
        <h2>1 · Client &amp; content</h2>
        <p className="hint">Pick a client workspace, paste the content/copy, choose a format.</p>
        <div className="row">
          <div>
            <label>Client</label>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)}>
              {clients.map((c) => (
                <option key={c.clientId} value={c.clientId}>
                  {c.name} · {c.assetCount} assets
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Format</label>
            <select value={format} onChange={(e) => setFormat(e.target.value as FormatId)}>
              {enabledFormats.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label} ({f.aspect})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <label htmlFor="file" className="btn secondary" style={{ cursor: 'pointer', margin: 0 }}>
            {loading === 'upload' ? <><span className="spinner" /> Extracting…</> : '⬆ Upload script (PDF / TXT / MD)'}
          </label>
          <input
            id="file"
            type="file"
            accept=".pdf,.txt,.md,application/pdf,text/plain"
            style={{ display: 'none' }}
            onChange={(e) => onUpload(e.target.files?.[0])}
          />
          {uploadNote && <span className="sub">{uploadNote}</span>}
        </div>
        <div style={{ marginTop: 14 }}>
          <label>Content / copy (raw idea, OR a finished slide-by-slide script)</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              faithful
                ? 'Paste your finished slide script, e.g.\n\nSLIDE 1 · COVER\nHEADLINE\nWhat happens to sleep after 50...\nSUB-PROMISE\nThe answer is not how long they sleep...\n\nSLIDE 2 · How sleep actually works\n...'
                : 'e.g. Why most Indian parents over 50 are quietly losing muscle, and the simple daily fix their doctor would approve of.'
            }
          />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, cursor: 'pointer' }}>
          <input type="checkbox" style={{ width: 'auto' }} checked={faithful} onChange={(e) => setFaithful(e.target.checked)} />
          I already have the slide-by-slide copy — lay it out faithfully (skip strategy, keep my wording verbatim).
        </label>
        <div className="btn-row">
          {faithful ? (
            <button className="btn" disabled={!content.trim() || loading === 'plan'} onClick={runFaithful}>
              {loading === 'plan' ? <><span className="spinner" /> Laying out slides…</> : 'Lay out my copy →'}
            </button>
          ) : (
            <button className="btn" disabled={!content.trim() || loading === 'strategy'} onClick={runStrategy}>
              {loading === 'strategy' ? <><span className="spinner" /> Analyzing…</> : 'Generate creative strategy →'}
            </button>
          )}
        </div>
      </div>

      {/* Step 3 */}
      {strategy && (
        <div className="panel">
          <h2>2 · Creative strategy</h2>
          <p className="hint">
            <b style={{ color: 'var(--text)' }}>Intent:</b> {strategy.contentIntent}<br />
            <b style={{ color: 'var(--text)' }}>Audience:</b> {strategy.targetAudience}
          </p>
          <div className="cards">
            {strategy.directions.map((d) => (
              <div
                key={d.id}
                className={`dir-card${direction?.id === d.id ? ' selected' : ''}`}
                onClick={() => setDirection(d)}
              >
                <span className="tag">{d.track === 'A-acquisition' ? 'Track A · acquisition' : 'Track B · retention'}</span>
                <h3>{d.title}</h3>
                <p><b>Angle:</b> {d.angle}</p>
                <p><b>Emotion:</b> {d.emotionalDriver}</p>
                <p><b>Visual:</b> {d.visualApproach}</p>
                <p><b>Why it fits:</b> {d.whyItFits}</p>
              </div>
            ))}
          </div>
          <div className="btn-row">
            <button className="btn" disabled={!direction || loading === 'plan'} onClick={runPlan}>
              {loading === 'plan' ? <><span className="spinner" /> Designing slides…</> : 'Generate slide-by-slide design →'}
            </button>
            {direction && <span className="sub">Selected: {direction.title}</span>}
          </div>
        </div>
      )}

      {/* Step 4 */}
      {plan && (
        <div className="panel">
          <h2>3 · Design &amp; export — {plan.direction}</h2>
          <p className="hint">{plan.brandConsistencyNotes}</p>

          {/* Render mode */}
          <div className="btn-row" style={{ marginTop: 0, marginBottom: 12 }}>
            <label style={{ margin: 0 }}>Render mode</label>
            <select value={renderMode} onChange={(e) => setRenderMode(e.target.value as any)} style={{ width: 'auto' }}>
              <option value="template">Template — brand-exact (deterministic)</option>
              <option value="full-image">Full AI image — whole slide by the model</option>
            </select>
            {(renderMode === 'full-image' || genSlideCount > 0) && (
              <select value={provider} onChange={(e) => setProvider(e.target.value as ImageProvider)} style={{ width: 'auto' }} title="Image model">
                <option value="nano-banana" disabled={!providers['nano-banana']}>🍌 Nano Banana (Gemini){providers['nano-banana'] ? '' : ' — no key'}</option>
                <option value="openai" disabled={!providers.openai}>OpenAI (gpt-image-1){providers.openai ? '' : ' — no key'}</option>
              </select>
            )}
          </div>

          {renderMode === 'template' ? (
            <>
              {genSlideCount > 0 && (
                <div className="btn-row" style={{ marginTop: 0, marginBottom: 12 }}>
                  <button className="btn secondary" disabled={loading === 'elements'} onClick={runElements}>
                    {loading === 'elements' ? <><span className="spinner" /> Generating images…</> : `Generate ${genSlideCount} image${genSlideCount > 1 ? 's' : ''} →`}
                  </button>
                  {imgNotice && <span className="sub">{imgNotice}</span>}
                </div>
              )}
              <div className="btn-row" style={{ marginTop: 0, marginBottom: 16 }}>
                <button className="btn" disabled={loading === 'render'} onClick={runExport}>
                  {loading === 'render' ? <><span className="spinner" /> Rendering PNGs…</> : 'Export slides as PNG ↓'}
                </button>
                {exportNotice && <span className="sub">{exportNotice}</span>}
              </div>
            </>
          ) : (
            <>
              <div className="notice warn" style={{ marginBottom: 12 }}>
                Full-image mode lets the model draw the entire slide. Expect a more cohesive look but
                <b> text may be misspelled or off, and exact brand colors / your logo are not guaranteed</b> —
                dense stat/citation slides struggle most. Generation can take 1–3 min for the full set.
              </div>
              <div className="btn-row" style={{ marginTop: 0, marginBottom: 16 }}>
                <button className="btn" disabled={loading === 'full'} onClick={runFullRender}>
                  {loading === 'full' ? <><span className="spinner" /> Generating full slides…</> : `Generate full slides (${provider === 'openai' ? 'OpenAI' : 'Nano Banana'}) →`}
                </button>
                {fullSlides && fullSlides.length > 0 && (
                  <button className="btn secondary" onClick={() => downloadPngs(fullSlides, 'fullimage')}>Download all PNGs ↓</button>
                )}
                {fullNote && <span className="sub">{fullNote}</span>}
              </div>
            </>
          )}

          <div className="slides-grid">
            {renderMode === 'full-image' && fullSlides ? (
              fullSlides.map((a) => (
                <div className="slide-wrap" key={a.index}>
                  <div className="cap"><span>Slide {a.index}</span><span>full-image</span></div>
                  <img className="slide-frame" alt={`slide-${a.index}`} src={`data:image/png;base64,${a.pngBase64}`} />
                </div>
              ))
            ) : (
              slides.map((s) => (
                <div className="slide-wrap" key={s.index}>
                  <div className="cap"><span>Slide {s.index}</span><span>{s.layout}</span></div>
                  <iframe className="slide-frame" title={`slide-${s.index}`} srcDoc={s.html} scrolling="no" />
                </div>
              ))
            )}
          </div>
          <details className="slidespec">
            <summary>View raw slide plan (JSON)</summary>
            <pre>{JSON.stringify(plan, null, 2)}</pre>
          </details>
        </div>
      )}
    </main>
  );
}
