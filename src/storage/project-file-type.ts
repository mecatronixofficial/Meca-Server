import { detectFileType } from './file-type';

/** Project media excludes PDFs and active document formats. */
export function detectProjectFileType(buffer: Buffer): string | null {
  const image = detectFileType(buffer);
  if (image?.startsWith('image/')) return image;
  // ISO BMFF: require an MP4 brand, rather than accepting HEIC or arbitrary ftyp files.
  if (buffer.length >= 16 && buffer.readUInt32BE(0) >= 16 && buffer.readUInt32BE(0) <= buffer.length && buffer.toString('ascii', 4, 8) === 'ftyp') {
    const brands = [buffer.toString('ascii', 8, 12)];
    for (let offset = 16; offset + 4 <= Math.min(buffer.readUInt32BE(0), 256); offset += 4) brands.push(buffer.toString('ascii', offset, offset + 4));
    if (brands.some((brand) => ['isom', 'iso2', 'mp41', 'mp42', 'avc1', 'M4V '].includes(brand))) return 'video/mp4';
  }
  // EBML with a WebM DocType element; do not accept arbitrary Matroska containers.
  if (buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])) && buffer.subarray(4, 512).includes(Buffer.from([0x42, 0x82, 0x84, 0x77, 0x65, 0x62, 0x6d]))) return 'video/webm';
  return null;
}

