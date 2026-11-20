import { readFileSync } from 'fs';
import path from 'path';
import type { ThirukkuralChapter } from './entities/thirukkural-chapter.entity';
import type { Thirukkural } from './entities/thirukkural.entity';

export interface ThirukkuralData {
  /** Where the text and commentaries came from. */
  source: string;
  chapters: ThirukkuralChapter[];
  kurals: Omit<Thirukkural, 'is_highlighted' | 'chapter'>[];
}

/**
 * The full Thirukkural (133 chapters, 1330 kurals), used once by the Thirukkural migration to fill the tables.
 * Copied to dist as a Nest asset (nest-cli.json) so `migration:run:prod` can read it too.
 */
export function loadThirukkuralData(): ThirukkuralData {
  return JSON.parse(readFileSync(path.join(__dirname, 'data', 'thirukkural.json'), 'utf8')) as ThirukkuralData;
}
