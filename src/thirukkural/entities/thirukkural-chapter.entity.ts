import { Check, Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * One of the 133 அதிகாரங்கள் (chapters), each holding 10 kurals. Chapters sit inside an இயல் (iyal, 13 in all),
 * which sit inside a பால் (paal: அறம் / பொருள் / இன்பம்); both are stored on the chapter since they never change.
 * Seeded by the Thirukkural migration; read-only.
 */
@Entity('thirukkural_chapters')
@Check('thirukkural_chapters_number_check', '"number" BETWEEN 1 AND 133')
export class ThirukkuralChapter {
  /** Chapter (adhigaram) number, 1-133. */
  @PrimaryColumn('smallint')
  number: number;

  /** Tamil chapter name, e.g. கடவுள் வாழ்த்து. */
  @Column({ length: 100 })
  name: string;

  @Column({ length: 100 })
  transliteration: string;

  /** English chapter name, e.g. The Praise of God. */
  @Column({ length: 150 })
  translation: string;

  /** பால் number, 1-3 (Virtue, Wealth, Love). */
  @Column('smallint')
  paal_number: number;

  @Column({ length: 50 })
  paal_name: string;

  @Column({ length: 50 })
  paal_transliteration: string;

  @Column({ length: 50 })
  paal_translation: string;

  /** இயல் number, 1-13. */
  @Column('smallint')
  iyal_number: number;

  @Column({ length: 50 })
  iyal_name: string;

  @Column({ length: 50 })
  iyal_transliteration: string;

  @Column({ length: 100 })
  iyal_translation: string;

  /** First kural number in this chapter. */
  @Column('smallint')
  start_kural: number;

  /** Last kural number in this chapter. */
  @Column('smallint')
  end_kural: number;
}
