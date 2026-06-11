import type { RenderBackend, RenderInput, RenderedAsset } from './backend';

// Image-generation backend (Nano Banana via MCP / OpenAI Images) — stubbed
// behind the same interface as the template backend so model routing is a
// one-line swap. In the hybrid architecture this backend generates only the
// photographic/illustrative ELEMENTS that get composited into a template; it is
// intentionally NOT used to render whole text-heavy creatives.
//
// To implement:
//  - Nano Banana: send `genPrompt`s through the connected MCP image tool.
//  - OpenAI: call the Images API.
// Both return element PNGs that the template backend composites via <img>.

export const imageGenBackend: RenderBackend = {
  id: 'image-gen',
  async available() {
    return false;
  },
  async render(_input: RenderInput): Promise<RenderedAsset[]> {
    throw new Error(
      'image-gen backend not wired in MVP. Hybrid plan: generate elements here, composite via the template backend.',
    );
  },
};
