import type { CarouselPlan, Slide, SlideImage, Span, IconItem } from '@/lib/types';

// ── Wellbeing-Nutrition design system, skinned in the Fifty+ Clinic brand ─────
// Clean, clinical, high-contrast. Every slide carries the signature "tells":
// corner brand tag (top-left), baked slide-counter pill (top-right), a swipe
// circle (low-centre, all but the save slide). Pure string building so the same
// output drives the live preview (iframe) and the PNG export (Puppeteer).
// Archetypes: cover · stats · flow · statHero · mechanism · cycle · protocol · save.

export interface AssetMeta { label?: string; src?: string } // src = inlined data URI
export type AssetMap = Record<string, AssetMeta>;

const TOKENS = {
  cream: '#F2E9E2', // warm cream — sampled from the real Praan Fifty+ Clinic deck
  card: '#FBF4ED',
  terra: '#F36937', // brand accent (warm orange)
  alarm: '#E0481C', // single worst-outcome phrase (deeper, same family)
  ink: '#1A1A1A',
  grey: '#8a7b6c',
  line: '#e7dacc',
};

// Aeonik (if installed) → Switzer (free) for display; Archivo (Google) for body.
const FONT_LINK =
  'https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,300;0,400;0,500;0,600;1,300&display=swap';
const FONTSHARE_LINK = 'https://api.fontshare.com/v2/css?f[]=switzer@300,400,500,600&display=swap';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function toneColor(t: Span['tone']): string {
  return t === 'ink' ? TOKENS.ink : t === 'alarm' ? TOKENS.alarm : TOKENS.terra;
}
function spans(s: Span[] | null, warm = false): string {
  return (s || [])
    .map((x) => (x.tone === 'ink' ? esc(x.text) : `<span style="color:${warm ? '#ffb199' : toneColor(x.tone)}">${esc(x.text)}</span>`))
    .join('');
}

const ICONS: Record<string, string> = {
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  walk: '<circle cx="13" cy="4.5" r="1.8"/><path d="M13 8l-3 4 2 3-1 4M13 8l3 2 3-1M10 12l-3 1"/>',
  brain: '<path d="M9 4a4 4 0 0 0-4 4 3.5 3.5 0 0 0-1 5 3.5 3.5 0 0 0 2 5 3 3 0 0 0 5 1V4.5A2.5 2.5 0 0 0 9 4zM15 4a4 4 0 0 1 4 4 3.5 3.5 0 0 1 1 5 3.5 3.5 0 0 1-2 5 3 3 0 0 1-5 1"/>',
  people: '<circle cx="8" cy="8" r="3"/><circle cx="16" cy="9" r="2.5"/><path d="M3 19c0-3 2.5-5 5-5s5 2 5 5M14 19c0-2.5 1.8-4 4-4s4 1.5 4 4"/>',
  grip: '<path d="M8 11V5.5a1.5 1.5 0 0 1 3 0V10m0-1V4.5a1.5 1.5 0 0 1 3 0V10m0-.5V6a1.5 1.5 0 0 1 3 0v7a6 6 0 0 1-6 6h-1a5 5 0 0 1-4-2.5L5 14a1.6 1.6 0 0 1 2.6-1.8L8 13"/>',
  chair: '<path d="M6 20v-6h9v6M6 14l1-5 8-1M15 9V4M9 4h6"/>',
  stairs: '<path d="M3 20h4v-4h4v-4h4v-4h5"/>',
};
function icon(name: string, sz = 46): string {
  return `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="${TOKENS.terra}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
}

// generic N-node clockwise cycle diagram (vector — never AI)
function cycleSVG(nodes: string[]): string {
  const cx = 360, cy = 372, r = 248, N = nodes.length || 1;
  const pt = (i: number, rr: number): [number, number] => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / N;
    return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
  };
  let dots = '', labels = '', arrows = '';
  nodes.forEach((lab, i) => {
    const [x, y] = pt(i, r);
    dots += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="13"/>`;
    const [lx, ly] = pt(i, r + 56);
    const anchor = Math.abs(lx - cx) < 30 ? 'middle' : lx > cx ? 'start' : 'end';
    const w = lab.split(' ');
    const lines = w.length > 1
      ? `<tspan x="${lx.toFixed(0)}">${esc(w[0])}</tspan><tspan x="${lx.toFixed(0)}" dy="38">${esc(w.slice(1).join(' '))}</tspan>`
      : esc(lab);
    labels += `<text x="${lx.toFixed(0)}" y="${(ly - (w.length > 1 ? 18 : 0)).toFixed(0)}" text-anchor="${anchor}">${lines}</text>`;
    const a = -Math.PI / 2 + ((i + 0.5) * 2 * Math.PI) / N;
    const ax = cx + r * Math.cos(a), ay = cy + r * Math.sin(a), t = (a + Math.PI / 2) * 180 / Math.PI;
    arrows += `<path transform="translate(${ax.toFixed(0)},${ay.toFixed(0)}) rotate(${t.toFixed(0)})" d="M-9 -6 L9 0 L-9 6 Z"/>`;
  });
  return `<svg width="720" height="760" viewBox="0 0 720 760" font-family="Archivo,sans-serif">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${TOKENS.line}" stroke-width="3" stroke-dasharray="2 14" stroke-linecap="round"/>
    <g fill="${TOKENS.terra}">${dots}</g><g fill="${TOKENS.terra}">${arrows}</g>
    <g font-size="34" font-weight="600" fill="${TOKENS.ink}">${labels}</g></svg>`;
}

// photo / illustration for image-bearing archetypes
function imgTag(slide: Slide, assets: AssetMap, element: string | undefined, box: string): string {
  const im = slide.image;
  if (!im || im.source === 'none' || im.mode === 'none') return '';
  if (im.source === 'generate' && element) return `<img class="ph" style="${box}" src="${element}" alt="">`;
  const a = im.assetId ? assets[im.assetId] : undefined;
  if (im.source === 'asset' && a?.src) return `<img class="ph" style="${box}" src="${a.src}" alt="">`;
  const detail = im.source === 'generate' && im.genPrompt ? esc(im.genPrompt) : esc(a?.label || im.mode);
  return `<div class="ph placeholder" style="${box}"><span>GENERATE · ${esc(im.mode)}</span><span class="d">${detail}</span></div>`;
}

function renderSlide(slide: Slide, assets: AssetMap, element?: string): string {
  const s = slide;
  switch (s.type) {
    case 'cover':
      return `<h1 class="h-cover">${spans(s.headline)}</h1>${s.sub ? `<p class="lead">${esc(s.sub)}</p>` : ''}
        <div class="cover-grad"></div>${imgTag(s, assets, element, 'left:0;right:0;bottom:0;width:100%;height:58%;object-fit:cover;border-top-left-radius:40px;border-top-right-radius:40px')}`;
    case 'stats':
      return `${s.kicker ? `<h2 class="kicker">${esc(s.kicker)}</h2>` : ''}${s.lead ? `<p class="lead">${esc(s.lead)}</p>` : ''}
        <div class="stats">${(s.stats || []).map((x, i) => `<div class="stat"${i === (s.stats!.length - 1) ? ' style="border-bottom:2px solid var(--line)"' : ''}><div class="n">${esc(x.n)}</div><div class="l">${esc(x.label)}</div></div>`).join('')}</div>
        ${s.foot ? `<div class="foot">${esc(s.foot)}</div>` : ''}`;
    case 'flow':
      return `${s.kicker ? `<h2 class="kicker">${esc(s.kicker)}</h2>` : ''}${s.lead ? `<p class="lead">${esc(s.lead)}</p>` : ''}
        <div class="pills">${(s.pills || []).map((p: IconItem) => `<div class="pill">${icon(p.icon)}<span>${esc(p.label)}</span></div>`).join('')}</div>
        <div class="down"><svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="${TOKENS.terra}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v16M6 14l6 6 6-6"/></svg></div>
        ${s.removes ? `<div class="removes">${spans(s.removes)}</div>` : ''}
        ${s.cascade ? `<div class="cascade">${esc(s.cascade).replace(/→/g, `<span class="t">→</span>`)}</div>` : ''}
        ${s.foot ? `<div class="foot">${esc(s.foot)}</div>` : ''}`;
    case 'statHero':
      return `<div class="hero4">${esc(s.head || '')}<span class="big">${esc(s.big || '')}</span>${esc(s.tail || '')}</div>
        ${s.sub ? `<p class="lead lead-light">${esc(s.sub)}</p>` : ''}
        <div class="bars">${(s.bars || []).map((h) => `<div class="b" style="height:${h}%"></div>`).join('')}</div>
        <div class="bars xl">${(s.xlabels || []).map((x) => `<div class="barlabel">${esc(x)}</div>`).join('')}</div>
        ${s.foot ? `<div class="foot">${esc(s.foot)}</div>` : ''}`;
    case 'mechanism':
      return `${s.kicker ? `<h2 class="kicker">${esc(s.kicker)}</h2>` : ''}
        <div class="word">${esc(s.word || '')} ${s.phon ? `<span class="phon">${esc(s.phon)}</span>` : ''}</div>${s.def ? `<p class="def">${esc(s.def)}</p>` : ''}
        <div class="mrow"><div class="signs">${(s.signs || []).map((g: IconItem) => `<div class="sign">${icon(g.icon, 50)}<span>${esc(g.label)}</span></div>`).join('')}</div>
        ${imgTag(s, assets, element, 'width:430px;height:430px;object-fit:contain;flex:0 0 auto;position:static')}</div>
        ${s.foot ? `<div class="foot">${esc(s.foot)}</div>` : ''}`;
    case 'cycle':
      return `${s.kicker ? `<h2 class="kicker center">${esc(s.kicker)}</h2>` : ''}
        <div class="cyc">${cycleSVG(s.nodes || [])}</div>
        ${s.close ? `<div class="close6">${spans(s.close)}</div>` : ''}`;
    case 'protocol':
      return `${imgTag(s, assets, element, 'right:0;top:0;height:100%;width:430px;object-fit:cover;border-top-left-radius:40px;border-bottom-left-radius:40px')}
        <div class="col">${s.kicker ? `<h2 class="kicker">${esc(s.kicker)}</h2>` : ''}
        ${(s.items || []).map((it, i) => `<div class="item"${i === (s.items!.length - 1) ? ' style="border-bottom:2px solid var(--line)"' : ''}><div class="ar">›</div><div><div class="act">${esc(it.act)}</div><div class="why">${esc(it.why)}</div></div></div>`).join('')}</div>`;
    case 'save':
      return `${imgTag(s, assets, element, 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover')}<div class="scrim"></div>
        <div class="inner"><h1 class="h-save">${spans(s.headline, true)}</h1>${s.sub ? `<p class="ssub">${esc(s.sub)}</p>` : ''}
        ${s.cta ? `<p class="cta">${spans(s.cta, true)}</p>` : ''}<div class="savebtn">${esc(s.button || 'Save This Post')}</div></div>`;
    default:
      return '';
  }
}

export function slideToHtml(slide: Slide, assets: AssetMap = {}, element?: string, _logoSrc?: string): string {
  const isSave = slide.type === 'save';
  const ctag = `<div class="ctag">FIFTY+ · CLINIC</div>`;
  const counter = `<div class="counter">${esc(slide.counter || '')}</div>`;
  const swipe = isSave ? '' : `<div class="swipe"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></div>`;
  return `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${FONT_LINK}" rel="stylesheet"><link href="${FONTSHARE_LINK}" rel="stylesheet">
<style>
  :root{--cream:${TOKENS.cream};--card:${TOKENS.card};--terra:${TOKENS.terra};--alarm:${TOKENS.alarm};--ink:${TOKENS.ink};--grey:${TOKENS.grey};--line:${TOKENS.line};
    --display:"Aeonik","Switzer","Archivo",sans-serif;--body:"Archivo","Helvetica Neue",Arial,sans-serif;}
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{overflow:hidden}
  .slide{width:1080px;height:1350px;background:var(--cream);position:relative;padding:74px;overflow:hidden;font-family:var(--body);color:var(--ink)}
  .ctag{position:absolute;top:56px;left:74px;font-family:var(--display);font-weight:600;font-size:21px;letter-spacing:4px;color:var(--grey)}
  .counter{position:absolute;top:64px;right:74px;background:var(--ink);color:#fff;border-radius:999px;padding:8px 22px;font-weight:600;font-size:26px;font-family:var(--display)}
  .swipe{position:absolute;bottom:54px;left:50%;transform:translateX(-50%);width:78px;height:78px;border:2px solid var(--grey);border-radius:999px;display:flex;align-items:center;justify-content:center;color:var(--ink)}
  .t{color:var(--terra)}
  .kicker{font-family:var(--display);color:var(--terra);font-size:78px;font-weight:500;line-height:1.02;margin:96px 0 0;letter-spacing:-1px}
  .kicker.center{text-align:center}
  .lead{font-family:var(--body);font-weight:300;font-size:38px;line-height:1.32;color:#2c241c;margin:22px 0 0;max-width:880px}
  .lead-light{color:#ffe7df}
  .h-cover{font-family:var(--display);font-weight:500;font-size:92px;line-height:1.06;letter-spacing:-1.5px;margin:96px 0 0}
  .cover-grad{position:absolute;left:0;right:0;bottom:0;height:58%;background:linear-gradient(180deg,var(--cream) 0%,rgba(242,233,226,0) 22%)}
  .ph{position:absolute;overflow:hidden}
  .ph.placeholder{background:linear-gradient(135deg,rgba(243,105,55,.92),rgba(243,105,55,.62));color:#fff;display:flex;flex-direction:column;justify-content:flex-end;padding:28px;font-family:var(--body)}
  .ph.placeholder span{font-weight:600;font-size:20px;letter-spacing:.1em;text-transform:uppercase}.ph.placeholder .d{font-weight:300;font-size:23px;letter-spacing:0;text-transform:none;margin-top:8px;opacity:.92}
  .stats{margin-top:34px}
  .stat{display:flex;align-items:baseline;gap:30px;border-top:2px solid var(--line);padding:30px 0}
  .stat .n{font-family:var(--display);font-weight:600;color:var(--terra);font-size:116px;line-height:.9;letter-spacing:-3px;min-width:360px}
  .stat .l{font-family:var(--body);font-weight:400;font-size:40px;color:#2c241c}
  .pills{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-top:30px}
  .pill{display:flex;align-items:center;gap:20px;border:2px solid var(--line);border-radius:20px;padding:24px 28px;background:var(--card)}
  .pill span{font-size:34px;font-weight:400}
  .down{display:flex;justify-content:center;margin:24px 0 8px}
  .removes{text-align:center;font-family:var(--display);font-weight:500;font-size:48px}
  .cascade{margin-top:30px;font-family:var(--display);font-weight:500;font-size:52px;line-height:1.15}
  .slide.statHero{background:var(--terra);color:#fff}
  .slide.statHero .ctag,.slide.statHero .foot{color:#ffe0d3}.slide.statHero .counter{background:#fff;color:var(--terra)}.slide.statHero .swipe{border-color:#ffd2c3;color:#fff}
  .hero4{font-family:var(--display);font-weight:500;font-size:92px;line-height:1.06;margin:120px 0 0}
  .hero4 .big{display:block;font-size:300px;line-height:.86;letter-spacing:-10px;color:#fff;margin:6px 0;font-weight:600}
  .bars{display:flex;align-items:flex-end;gap:26px;height:280px;margin:28px 0 0}.bars.xl{height:auto;margin-top:0}
  .bars .b{flex:1;background:rgba(255,255,255,.92);border-radius:10px 10px 0 0}
  .barlabel{flex:1;text-align:center;color:#ffe0d3;font-size:26px}
  .word{font-family:var(--display);font-weight:600;font-size:114px;letter-spacing:-3px;line-height:1;display:flex;align-items:center;gap:24px;margin-top:18px}
  .phon{font-family:var(--body);font-weight:400;font-size:28px;color:var(--grey);border:2px solid var(--line);border-radius:999px;padding:8px 22px;white-space:nowrap}
  .def{font-family:var(--body);font-weight:300;font-style:italic;font-size:40px;color:#2c241c;margin:18px 0 0}
  .mrow{display:flex;gap:30px;margin-top:30px;align-items:center}
  .signs{flex:1;display:flex;flex-direction:column;gap:26px}.sign{display:flex;align-items:center;gap:22px}.sign span{font-size:34px;font-weight:400}
  .cyc{display:flex;justify-content:center;margin-top:6px}
  .close6{text-align:center;font-family:var(--display);font-weight:500;font-size:54px;margin-top:0}
  .slide.protocol .col{width:600px}
  .item{display:flex;gap:22px;padding:26px 0;border-top:2px solid var(--line)}
  .item .ar{color:var(--terra);font-family:var(--display);font-weight:600;font-size:46px;line-height:1}
  .item .act{font-family:var(--display);font-weight:500;font-size:42px;line-height:1.1}
  .item .why{font-weight:300;font-size:32px;color:var(--grey);margin-top:6px}
  .slide.save{color:#fff}
  .slide.save .ctag{color:#ffe0d3}.slide.save .counter{background:#fff;color:var(--ink)}
  .slide.save .scrim{position:absolute;inset:0;background:linear-gradient(120deg,rgba(20,12,8,.86) 0%,rgba(20,12,8,.5) 50%,rgba(20,12,8,.2) 100%)}
  .slide.save .inner{position:relative}
  .h-save{font-family:var(--display);font-weight:500;font-size:90px;line-height:1.06;margin:200px 0 0}
  .ssub{font-weight:300;font-size:38px;line-height:1.34;margin:28px 0 0;max-width:760px}
  .cta{font-size:34px;margin:40px 0 0;line-height:1.4;font-weight:300}
  .savebtn{display:inline-block;background:var(--terra);color:#fff;font-family:var(--display);font-weight:600;font-size:34px;padding:20px 36px;border-radius:14px;margin-top:40px}
  .foot{position:absolute;bottom:54px;left:74px;right:74px;color:var(--grey);font-size:23px;font-weight:300}
</style></head>
<body><div class="slide ${slide.type}">${ctag}${counter}${renderSlide(slide, assets, element)}${swipe}</div>
<script>(function(){function fit(){var k=(window.innerWidth||1080)/1080;var s=document.querySelector('.slide');if(!s)return;s.style.transformOrigin='top left';s.style.transform=k===1?'none':'scale('+k+')';document.body.style.height=(1350*k)+'px';}window.addEventListener('resize',fit);fit();})();</script>
</body></html>`;
}

export function renderCarouselSlides(
  plan: CarouselPlan,
  assets: AssetMap = {},
  elements: Record<number, string> = {},
): { index: number; layout: string; html: string }[] {
  return (plan.slides || []).map((s) => ({
    index: s.index,
    layout: s.type,
    html: slideToHtml(s, assets, elements[s.index]),
  }));
}
