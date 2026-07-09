import { parseText } from './text.parser';
import { parseMarkdown } from './markdown.parser';
import { parsePdf } from './pdf.parser';

export const SUPPORTED_MIME_TYPES = [
  'text/plain',
  'text/markdown',
  'text/x-markdown',
  'application/pdf',
] as const;

export type SupportedMimeType = (typeof SUPPORTED_MIME_TYPES)[number];

export function isSupportedMimeType(mime: string): mime is SupportedMimeType {
  return (SUPPORTED_MIME_TYPES as readonly string[]).includes(mime);
}

export async function parseDocument(
  mime: string,
  buffer: Buffer,
): Promise<string> {
  switch (mime) {
    case 'text/plain':
      return parseText(buffer);
    case 'text/markdown':
    case 'text/x-markdown':
      return parseMarkdown(buffer);
    case 'application/pdf':
      return parsePdf(buffer);
    default:
      throw new Error(`Unsupported document type: ${mime}`);
  }
}
