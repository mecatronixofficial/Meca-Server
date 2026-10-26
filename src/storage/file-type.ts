/** MIME types accepted for upload, keyed by the magic bytes that identify them. */
const SIGNATURES: Array<{ mime: string; matches: (b: Buffer) => boolean }> = [
  { mime: 'image/jpeg', matches: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: 'image/png', matches: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { mime: 'image/gif', matches: (b) => ['GIF87a', 'GIF89a'].includes(b.subarray(0, 6).toString('latin1')) },
  { mime: 'image/webp', matches: (b) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP' },
  { mime: 'application/pdf', matches: (b) => b.subarray(0, 5).toString('latin1') === '%PDF-' },
];

export const ALLOWED_MIME_TYPES = new Set(SIGNATURES.map((s) => s.mime));

/** Detects the real file type from its content; returns null for anything not on the allow-list. */
export function detectFileType(buffer: Buffer): string | null {
  return SIGNATURES.find((s) => s.matches(buffer))?.mime ?? null;
}
