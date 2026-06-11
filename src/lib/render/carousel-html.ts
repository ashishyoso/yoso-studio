import type { CarouselPlan, Slide, Span } from '@/lib/types';

// ── Fifty+ brand renderer ─────────────────────────────────────────────────────
// Pure string building (no DOM) so the SAME output drives both the live preview
// (iframe srcDoc) and the PNG export (Puppeteer). Every token below is the
// single source of truth from FIFTY-PLUS-DESIGN-GUIDELINES.md §9.
//
// Deviation flags vs the build-kit CSS:
//  - card fill uses a slightly lighter ivory (#F7EFE4) than the build-kit token
//    (#F1E8DE) so the staggered cards read as cards, matching design-bible §5.4
//    prose ("one step lighter than the bg"). Flagged per the doc's own rule.
//  - cover/save headline sizes auto-shrink with copy length (base ~104px, floor
//    64px) to stay inside the 1350px canvas; spec nominal is 110–117px.

export interface AssetMeta { label?: string; path?: string }
export type AssetMap = Record<string, AssetMeta>;

const TOKENS = {
  bg: '#F1E8DE',
  card: '#F7EFE4',
  terracotta: '#D14124',
  alarm: '#D14124',
  ink: '#1A1A1A',
  white: '#FFFFFF',
  shadow: '0 12px 40px rgba(208,64,36,0.12)',
  margin: 48,
};

const FONT_LINK =
  'https://fonts.googleapis.com/css2?family=Mulish:wght@400;700;800&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;1,9..144,500&family=Inter:wght@300;400;600&family=Playwrite+US+Modern&display=swap';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function toneColor(tone: Span['tone']): string {
  return tone === 'ink' ? TOKENS.ink : TOKENS.terracotta;
}

function renderSpans(spans: Span[]): string {
  return spans
    .map((s) => `<span style="color:${toneColor(s.tone)}">${esc(s.text)}</span>`)
    .join('');
}

function nl2br(s: string): string {
  return esc(s).replace(/\n/g, '<br>');
}

function headlineSize(spans: Span[], base: number, floor: number): number {
  const len = spans.reduce((n, s) => n + s.text.length, 0);
  const size = base - Math.max(0, len - 60) * 0.55;
  return Math.max(floor, Math.round(size));
}

function logoPill(): string {
  return `<div class="logo">FIFTY<span class="plus">+</span></div>`;
}

function navPill(right = false): string {
  return `<div class="nav" style="${right ? 'left:auto;right:48px' : ''}">→</div>`;
}

function heroImage(slide: Slide, assets: AssetMap, element?: string): string {
  const img = slide.image;
  if (!img || img.mode === 'none' || img.placement === 'none') return '';

  const place: Record<string, string> = {
    'bottom-right': 'right:0;bottom:0;width:58%;height:46%;border-top-left-radius:36px;',
    bottom: 'left:0;right:0;bottom:0;height:38%;border-top-left-radius:36px;border-top-right-radius:36px;',
    right: 'right:0;top:24%;width:46%;height:52%;border-top-left-radius:36px;border-bottom-left-radius:36px;',
  };
  const box = place[img.placement] || place['bottom-right'];

  // 1) Generated element (Nano Banana) for this slide → composite it in.
  if (img.source === 'generate' && element) {
    return `<img class="hero" src="${element}" style="${box}object-fit:cover" alt="">`;
  }

  // 2) Real asset file present → use it.
  const asset = img.assetId ? assets[img.assetId] : undefined;
  if (img.source === 'asset' && asset?.path) {
    return `<img class="hero" src="${esc(asset.path)}" style="${box}object-fit:cover" alt="">`;
  }

  // Otherwise a branded placeholder showing exactly what should fill this slot.
  const kindLabel =
    img.source === 'asset'
      ? `ASSET · ${esc(asset?.label || img.assetId || 'brand asset')}`
      : `GENERATE · ${img.mode}`;
  const detail = img.source === 'generate' && img.genPrompt ? esc(img.genPrompt) : (asset?.label ? esc(asset.label) : '');
  return `<div class="hero placeholder" style="${box}">
      <div class="ph-mode">${kindLabel}</div>
      <div class="ph-detail">${detail}</div>
    </div>`;
}

function slideBody(slide: Slide, assets: AssetMap, element?: string): string {
  switch (slide.layout) {
    case 'cover': {
      const spans = slide.headline || [];
      const size = headlineSize(spans, 104, 66);
      return `
        ${logoPill()}
        <h1 class="h-cover" style="font-size:${size}px">${renderSpans(spans)}</h1>
        ${slide.subhead ? `<p class="subhead">${nl2br(slide.subhead)}</p>` : ''}
        ${heroImage(slide, assets, element)}
        ${slide.navPill ? navPill() : ''}`;
    }
    case 'section': {
      const body = (slide.body || [])
        .map((l) => {
          const cls = l.highlight === 'topic' ? ' class="t"' : l.highlight === 'alarm' ? ' class="r"' : '';
          return `<span${cls}>${esc(l.text)}</span>`;
        })
        .join('<br><br>');
      // Keep text out of the image: narrow the text column when the image sits
      // on the right; leave headroom above a bottom-bleeding image.
      const place = slide.image?.placement;
      const hasImg = !!slide.image && slide.image.mode !== 'none' && place !== 'none';
      const colStyle =
        hasImg && place === 'right' ? 'width:52%' : hasImg && place === 'bottom' ? 'width:100%;padding-bottom:42%' : '';
      return `
        ${logoPill()}
        <div class="col" style="${colStyle}">
          ${slide.sectionHeader ? `<h2 class="h-section">${esc(slide.sectionHeader)}</h2>` : ''}
          ${slide.thesis ? `<p class="thesis">${esc(slide.thesis)}</p>` : ''}
          ${body ? `<p class="body">${body}</p>` : ''}
        </div>
        ${heroImage(slide, assets, element)}
        ${slide.navPill ? navPill() : ''}`;
    }
    case 'check-do': {
      const list = (items: string[] | null) =>
        (items || []).map((i) => `<li>${esc(i)}</li>`).join('');
      return `
        ${logoPill()}
        ${slide.sectionHeader ? `<h2 class="h-section">${esc(slide.sectionHeader)}</h2>` : ''}
        <div class="card" style="width:78%;margin-top:30px">
          <h3>${esc(slide.checkTitle || "Here's what to check:")}</h3>
          <ul class="list">${list(slide.checkItems)}</ul>
        </div>
        <div class="card" style="width:78%;margin:36px 0 0 22%">
          <h3>${esc(slide.helpsTitle || "Here's what helps:")}</h3>
          <ul class="list">${list(slide.helpsItems)}</ul>
        </div>
        ${slide.navPill ? navPill(true) : ''}`;
    }
    case 'save': {
      const spans = slide.headline || [];
      const size = headlineSize(spans, 88, 60);
      const kw = slide.commentKeyword ? esc(slide.commentKeyword) : 'SAVE';
      return `
        ${logoPill()}
        <h1 class="h-cover" style="font-size:${size}px">${renderSpans(spans)}</h1>
        <p class="body" style="margin-top:28px"><span class="t" style="font-weight:600">Comment ${kw}</span> below.</p>
        ${slide.offer ? `<p class="body">${esc(slide.offer)}</p>` : ''}
        <span class="save-btn">Save This Post</span>
        ${heroImage(slide, assets, element)}`;
    }
    default:
      return logoPill();
  }
}

export function slideToHtml(slide: Slide, assets: AssetMap = {}, element?: string): string {
  return `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${FONT_LINK}" rel="stylesheet">
<style>
  :root{
    --bg:${TOKENS.bg};--card:${TOKENS.card};--terracotta:${TOKENS.terracotta};
    --alarm:${TOKENS.alarm};--ink:${TOKENS.ink};--white:${TOKENS.white};
    --shadow:${TOKENS.shadow};--margin:${TOKENS.margin}px;
    --font-display:"Mulish","Hanken Grotesk",Verdana,sans-serif;
    --font-serif:"Fraunces","Source Serif 4","PT Serif",serif;
    --font-body:"Inter","Helvetica Neue",Arial,sans-serif;
    --font-hand:"Playwrite US Modern",cursive;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{margin:0;padding:0}
  .slide{width:1080px;height:1350px;background:var(--bg);position:relative;
    padding:var(--margin);overflow:hidden;font-family:var(--font-body);color:var(--ink)}
  .logo{display:inline-flex;align-items:baseline;gap:2px;background:var(--terracotta);
    color:#fff;font-family:var(--font-display);font-weight:800;font-size:30px;
    padding:11px 26px;border-radius:999px;letter-spacing:.5px}
  .logo .plus{font-size:20px;position:relative;top:-8px;font-weight:700}
  .col{position:relative;z-index:2}
  .h-cover{font-family:var(--font-display);line-height:1.02;font-weight:400;margin:26px 0}
  .h-section{font-family:var(--font-serif);font-size:80px;line-height:1.05;color:var(--terracotta);font-weight:500}
  .subhead{font-family:var(--font-body);font-weight:300;font-size:37px;line-height:1.3;margin-top:8px}
  .body{font-family:var(--font-body);font-weight:300;font-size:35px;line-height:1.35;margin-top:30px}
  .t{color:var(--terracotta)}
  .r{color:var(--alarm)}
  .thesis{display:inline-block;background:var(--terracotta);color:#fff;font-style:italic;
    font-family:var(--font-body);font-weight:300;font-size:33px;line-height:1.2;padding:10px 18px;margin-top:24px}
  .card{background:var(--card);border-radius:24px;box-shadow:var(--shadow);padding:34px 38px;position:relative;z-index:2}
  .card h3{font-family:var(--font-serif);color:var(--terracotta);font-size:50px;margin-bottom:18px;font-weight:500}
  .list{list-style:none;font-size:31px;line-height:1.3}
  .list li{position:relative;padding-left:42px;margin-bottom:14px}
  .list li::before{content:"\\2192";position:absolute;left:0;color:var(--terracotta)}
  .nav{position:absolute;bottom:var(--margin);left:var(--margin);width:110px;height:56px;background:#fff;
    border-radius:999px;display:flex;align-items:center;justify-content:center;font-size:34px;color:#1a1a1a}
  .save-btn{display:inline-block;background:var(--terracotta);color:#fff;font-style:italic;
    font-size:34px;padding:14px 24px;border-radius:4px;margin-top:26px}
  .hero{position:absolute;overflow:hidden}
  .hero.placeholder{background:linear-gradient(135deg,rgba(209,65,36,.92),rgba(209,65,36,.62));
    color:#fff;display:flex;flex-direction:column;justify-content:flex-end;padding:26px}
  .ph-mode{font-family:var(--font-body);font-weight:600;font-size:20px;letter-spacing:.12em;
    text-transform:uppercase;opacity:.9}
  .ph-detail{font-family:var(--font-body);font-weight:300;font-size:24px;line-height:1.25;margin-top:8px}
</style></head>
<body><div class="slide">${slideBody(slide, assets, element)}</div></body></html>`;
}

export function renderCarouselSlides(
  plan: CarouselPlan,
  assets: AssetMap = {},
  /** slide index → generated element data URI (Nano Banana). */
  elements: Record<number, string> = {},
): { index: number; layout: string; html: string }[] {
  return (plan.slides || []).map((s) => ({
    index: s.index,
    layout: s.layout,
    html: slideToHtml(s, assets, elements[s.index]),
  }));
}
