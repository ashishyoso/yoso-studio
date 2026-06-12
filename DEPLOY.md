# Deploy to Vercel

The repo is deploy-ready (serverless Chromium wired in). Because the repo is
**private** and the API keys are **not** committed, you create the project under
your own Vercel account and add the keys there.

## 1. Import the repo
Go to **https://vercel.com/new** → import **`ashishyoso/yoso-studio`** →
Framework preset: **Next.js** (auto-detected). Don't deploy yet — add env vars first.

## 2. Add Environment Variables (Project → Settings → Environment Variables)
| Name | Value |
|---|---|
| `ANTHROPIC_API_KEY` | your Anthropic key |
| `GEMINI_API_KEY` | your Google AI Studio key (Nano Banana) |
| `OPENAI_API_KEY` | your OpenAI key (optional, for the OpenAI image model) |
| `STUDIO_MODEL` | `claude-opus-4-8` (optional) |

Add them for **Production** (and Preview if you want). Then **Deploy**.

## 3. ⚠️ Use the Pro plan
The AI calls are slow by design:
- Slide planning (Opus) ≈ **50s**
- Image generation + PNG render add more

Vercel **Hobby** caps function duration at **60s**, which the render/full-image
routes will exceed. Deploy on **Pro** (up to 300s). Route limits are already set
(`plan`/`strategy` = 60s, `render` = 120s, `elements` = 180s, `full-render` = 300s).

## What works after deploy
- Client picker, script upload, creative strategy, slide planning, **live preview** — all serverless-native.
- **PNG export & full-image render** run via `@sparticuz/chromium` (serverless Chromium); if Chromium fails to launch, the API returns a clear 503 and the preview still works.

## Deploy via CLI instead (optional)
```bash
npm i -g vercel
vercel login          # opens browser
vercel --prod         # from the repo root; set env vars when prompted
```
