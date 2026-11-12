import { MigrationInterface, QueryRunner } from 'typeorm';
import { loadThirukkuralData } from '../../thirukkural/thirukkural.data';

const CHAPTER_COLUMNS = [
  'number',
  'name',
  'transliteration',
  'translation',
  'paal_number',
  'paal_name',
  'paal_transliteration',
  'paal_translation',
  'iyal_number',
  'iyal_name',
  'iyal_transliteration',
  'iyal_translation',
  'start_kural',
  'end_kural',
] as const;

const KURAL_COLUMNS = [
  'number',
  'chapter_number',
  'line1',
  'line2',
  'transliteration1',
  'transliteration2',
  'translation',
  'couplet',
  'explanation',
  'urai_mv',
  'urai_sp',
  'urai_mk',
] as const;

/** Inserts rows in batches with bound parameters; skips rows that already exist so a re-run is harmless. */
async function insertAll<R>(q: QueryRunner, table: string, columns: readonly (keyof R & string)[], rows: R[], batchSize = 200) {
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const params: unknown[] = [];
    const values = batch.map((row) => `(${columns.map((column) => `$${params.push(row[column])}`).join(',')})`);
    await q.query(`INSERT INTO ${table}(${columns.join(',')}) VALUES ${values.join(',')} ON CONFLICT (number) DO NOTHING`, params);
  }
}

/** Thirukkural: 133 chapters (adhigaram) and 1330 kurals with explanations, plus an admin "highlight" flag. */
export class Thirukkural1793200000000 implements MigrationInterface {
  name = 'Thirukkural1793200000000';

  async up(q: QueryRunner): Promise<void> {
    await q.query(
      `CREATE TABLE IF NOT EXISTS thirukkural_chapters(
        number smallint PRIMARY KEY CONSTRAINT thirukkural_chapters_number_check CHECK(number BETWEEN 1 AND 133),
        name varchar(100) NOT NULL,
        transliteration varchar(100) NOT NULL,
        translation varchar(150) NOT NULL,
        paal_number smallint NOT NULL,
        paal_name varchar(50) NOT NULL,
        paal_transliteration varchar(50) NOT NULL,
        paal_translation varchar(50) NOT NULL,
        iyal_number smallint NOT NULL,
        iyal_name varchar(50) NOT NULL,
        iyal_transliteration varchar(50) NOT NULL,
        iyal_translation varchar(100) NOT NULL,
        start_kural smallint NOT NULL,
        end_kural smallint NOT NULL
      )`,
    );
    await q.query(
      `CREATE TABLE IF NOT EXISTS thirukkurals(
        number smallint PRIMARY KEY CONSTRAINT thirukkurals_number_check CHECK(number BETWEEN 1 AND 1330),
        chapter_number smallint NOT NULL CONSTRAINT thirukkurals_chapter_fk REFERENCES thirukkural_chapters(number) ON DELETE RESTRICT,
        line1 varchar(100) NOT NULL,
        line2 varchar(100) NOT NULL,
        transliteration1 varchar(100) NOT NULL,
        transliteration2 varchar(100) NOT NULL,
        translation text NOT NULL,
        couplet text NOT NULL,
        explanation text NOT NULL,
        urai_mv text NOT NULL,
        urai_sp text NOT NULL,
        urai_mk text NOT NULL,
        is_highlighted boolean NOT NULL DEFAULT false
      )`,
    );
    await q.query(`CREATE INDEX IF NOT EXISTS thirukkurals_chapter_idx ON thirukkurals(chapter_number)`);
    await q.query(`CREATE INDEX IF NOT EXISTS thirukkurals_highlighted_idx ON thirukkurals(number) WHERE is_highlighted`);

    const { chapters, kurals } = loadThirukkuralData();
    await insertAll(q, 'thirukkural_chapters', CHAPTER_COLUMNS, chapters);
    await insertAll(q, 'thirukkurals', KURAL_COLUMNS, kurals);
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE IF EXISTS thirukkurals`);
    await q.query(`DROP TABLE IF EXISTS thirukkural_chapters`);
  }
}
