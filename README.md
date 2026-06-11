# YOSO Studio — internal AI design studio (MVP)

An internal web app for YOSO Media to generate **brand-consistent**, production-ready
creative assets for clients using AI — without the off-brand mush that pure
image-generation produces for text-heavy formats.

First format shipped end-to-end: **Fifty+ Instagram Carousel** (the client whose
bibles are already in the repo).

---

## The core architectural decision: hybrid rendering

AI image models (Nano Banana, DALL·E, Imagen) **cannot** reliably reproduce exact
hex colors, brand fonts, flush-left grids, or legible headlines. The Fifty+ design
bible is a precise typographic system. So the studio is **hybrid**:

| Layer | Engine | Why |
|---|---|---|
| Strategy + slide planning | **Claude** (`claude-opus-4-8`), grounded in the bibles | Senior-designer reasoning, on-brand by construction |
| Layout, typography, color, copy | **Deterministic HTML/CSS → PNG** (Puppeteer) | Pixel-perfect, 100% brand-consistent, reproducible |
| Photographic / illustrative *elements* | **AI image-gen** (Nano Banana / OpenAI), composited into the template | Only where generation actually helps |

The render layer is an abstraction (`RenderBackend`) chosen **per format**, so adding
a backend is a one-line swap and the pipeline upstream never changes.

## Pipeline (identical for every format/model)

```
Select client → Upload content → Pick format
      → Strategy Engine  (Claude → 3–5 creative directions)   [/api/strategy]
      → user picks one
      → Slide Planner    (Claude → slide-by-slide spec)       [/api/plan]
      → Renderer         (template HTML → PNG, or image-gen)  [/api/render]
      → Export PNG
```

The HTML the live preview shows is the **exact same** HTML the PNG export rasterizes
(`src/lib/render/carousel-html.ts` is the single source of truth).

## Run it

```bash
npm install                 # core deps
cp .env.local.example .env.local   # add ANTHROPIC_API_KEY (optional — see MOCK mode)
npm run dev                 # http://localhost:3000

# To enable PNG export (downloads Chromium):
npm install puppeteer
```

**MOCK mode:** with no `ANTHROPIC_API_KEY`, the strategy and slide-plan endpoints
return a complete, brand-faithful sample carousel so you can see the full pipeline
and rendering immediately. Add a key for real generation.

## Where things live

```
src/
  app/
    page.tsx               server: loads clients, renders the studio
    studio.tsx             the 4-step workflow UI + live preview
    api/strategy           POST → creative directions
    api/plan               POST → slide-by-slide carousel plan
    api/render             POST → PNG export (rebuilds HTML server-side from the plan)
  lib/
    types.ts               domain model (formats, knowledge, plan, slides)
    formats/registry.ts    format table — add formats here
    clients/
      registry.ts          client loader + asset-intelligence seam (→ RAG later)
      fifty-plus/knowledge/{brand,design}-bible.md
    ai/
      anthropic.ts         forced-tool-use structured-output helper
      schemas.ts           JSON schemas the model fills
      strategy-engine.ts   content → directions (+ mock)
      slide-planner.ts     direction → slide specs (+ mock)
    render/
      carousel-html.ts     ★ brand tokens → HTML (preview + export share this)
      backend.ts           RenderBackend interface + registry
      template-backend.ts  Puppeteer HTML→PNG (brand-faithful default)
      imagegen-backend.ts  Nano Banana / OpenAI stub (same interface)
```

## Designed-for-extensibility seams

- **New format** → add a row in `formats/registry.ts` (+ a renderer for templated
  formats). Pipeline unchanged.
- **New client** → add a config + bibles in `clients/`. The loader is the seam where
  a Postgres + **pgvector RAG** layer drops in once bibles outgrow a context window
  (MVP keeps them whole in context — retrieval infra would be premature now).
- **New image model** → implement `RenderBackend` (Nano Banana via MCP, OpenAI
  Images). Model routing is a one-line registry change.
- **Asset intelligence** → `findRelevantAssets()` is keyword-scored today; swap for
  embedding search behind the same signature.
- **Future** (Figma/PSD export, batch, A/B, brand-consistency scoring, approvals,
  versioning) all hang off the same `plan` object and backend interface.

## Known MVP limits (honest)

- Only `instagram-carousel` is wired end-to-end; other formats are registered but
  disabled.
- Image-gen backend is stubbed — generated elements render as labelled brand
  placeholders in the preview (the optimized prompt is shown and exported with the
  plan), so layouts are complete and reviewable.
- PNG export requires the optional `puppeteer` dependency; without it the preview
  works and export returns a clear 503.
- Cover/save headline sizes auto-shrink with copy length to stay on-canvas (spec
  nominal 110–117px); card ivory is one step lighter than the build-kit token to
  read as a card. Both flagged in `carousel-html.ts`.
