import type { RenderBackendId } from '@/lib/types';

export interface RenderInput {
  /** Full self-contained HTML documents, one per asset/slide. */
  htmls: string[];
  width: number;
  height: number;
}

export interface RenderedAsset {
  index: number;
  /** PNG bytes, base64-encoded for transport to the client. */
  pngBase64: string;
}

export interface RenderBackend {
  id: RenderBackendId;
  available(): Promise<boolean>;
  render(input: RenderInput): Promise<RenderedAsset[]>;
}

// Registry — chosen per format. Adding a provider = implementing this interface
// and registering it here; the pipeline upstream is unchanged.
import { templateBackend } from './template-backend';
import { imageGenBackend } from './imagegen-backend';

const BACKENDS: Record<RenderBackendId, RenderBackend> = {
  'template-html': templateBackend,
  'image-gen': imageGenBackend,
};

export function getBackend(id: RenderBackendId): RenderBackend {
  return BACKENDS[id];
}
