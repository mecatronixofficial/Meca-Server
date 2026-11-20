import { detectProjectFileType } from './project-file-type';

describe('project media file validation', () => {
  it('accepts MP4 with a compatible brand and WebM with a DocType', () => {
    expect(detectProjectFileType(Buffer.from('000000186674797069736f6d0000020069736f326d703431', 'hex'))).toBe('video/mp4');
    expect(detectProjectFileType(Buffer.from('1a45dfa3874282847765626d', 'hex'))).toBe('video/webm');
  });
  it('rejects HEIC, generic Matroska, PDFs and renamed executables', () => {
    expect(detectProjectFileType(Buffer.from('000000186674797068656963000000006d69663168656963', 'hex'))).toBeNull();
    expect(detectProjectFileType(Buffer.from('1a45dfa300000000', 'hex'))).toBeNull();
    expect(detectProjectFileType(Buffer.from('%PDF-1.7'))).toBeNull();
    expect(detectProjectFileType(Buffer.from('MZ executable'))).toBeNull();
  });
});

