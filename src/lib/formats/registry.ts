import type { FormatDef, FormatId } from '@/lib/types';

// Adding a new format later = adding a row here + (if template-rendered) a
// renderer in src/lib/render/. The pipeline does not change.
export const FORMATS: Record<FormatId, FormatDef> = {
  'instagram-carousel': {
    id: 'instagram-carousel',
    label: 'Instagram Carousel',
    aspect: '4:5',
    width: 1080,
    height: 1350,
    defaultBackend: 'template-html',
    enabled: true,
    description: 'Multi-slide educational carousel. Brand-faithful templated layout.',
  },
  'instagram-post': {
    id: 'instagram-post',
    label: 'Instagram Post',
    aspect: '1:1',
    width: 1080,
    height: 1080,
    defaultBackend: 'template-html',
    enabled: false,
    description: 'Single 1:1 post creative.',
  },
  'linkedin-post': {
    id: 'linkedin-post',
    label: 'LinkedIn Post Creative',
    aspect: '4:5',
    width: 1080,
    height: 1350,
    defaultBackend: 'template-html',
    enabled: false,
    description: 'Professional single creative for LinkedIn.',
  },
  'youtube-thumbnail': {
    id: 'youtube-thumbnail',
    label: 'YouTube Thumbnail',
    aspect: '16:9',
    width: 1280,
    height: 720,
    defaultBackend: 'image-gen',
    enabled: false,
    description: 'High-CTR thumbnail. Hybrid: generated hero + templated text.',
  },
  'twitter-creative': {
    id: 'twitter-creative',
    label: 'Twitter/X Creative',
    aspect: '16:9',
    width: 1600,
    height: 900,
    defaultBackend: 'template-html',
    enabled: false,
    description: 'Creative for an X post or thread.',
  },
  'whatsapp-creative': {
    id: 'whatsapp-creative',
    label: 'WhatsApp Creative',
    aspect: '1:1',
    width: 1080,
    height: 1080,
    defaultBackend: 'template-html',
    enabled: false,
    description: 'Forwardable WhatsApp creative (retention channel).',
  },
  'ad-creative': {
    id: 'ad-creative',
    label: 'Ad Creative',
    aspect: '1:1',
    width: 1080,
    height: 1080,
    defaultBackend: 'image-gen',
    enabled: false,
    description: 'Paid social ad. Hybrid composite.',
  },
  'event-banner': {
    id: 'event-banner',
    label: 'Event Banner',
    aspect: '16:9',
    width: 1920,
    height: 1080,
    defaultBackend: 'template-html',
    enabled: false,
    description: 'Wide event banner.',
  },
};

export const FORMAT_LIST: FormatDef[] = Object.values(FORMATS);
export function getFormat(id: FormatId): FormatDef {
  return FORMATS[id];
}
