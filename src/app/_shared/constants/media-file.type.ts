export type MediaType = 'text' | 'image' | 'video';

export interface MediaFileType {
  type: MediaType;
  mimeTypes: string[];
}

export const MEDIA_FILE_TYPES: MediaFileType[] = [
  {
    type: 'text',
    mimeTypes: ['text/plain', 'text/xml', 'text/csv'],
  },
  {
    type: 'image',
    mimeTypes: ['image/jpeg', 'image/png'],
  },
  {
    type: 'video',
    mimeTypes: ['video/mp4', 'video/webm'],
  },
];
