import { Check, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { ThirukkuralChapter } from './thirukkural-chapter.entity';

/** One of the 1330 kurals by Thiruvalluvar. Text is seeded by the Thirukkural migration; only `is_highlighted` is editable. */
@Entity('thirukkurals')
@Check('thirukkurals_number_check', '"number" BETWEEN 1 AND 1330')
// Partial index for the highlights list; managed by migrations only.
@Index('thirukkurals_highlighted_idx', { synchronize: false })
export class Thirukkural {
  /** Kural number, 1-1330. */
  @PrimaryColumn('smallint')
  number: number;

  /** Chapter (adhigaram) number, 1-133. */
  @Index('thirukkurals_chapter_idx')
  @Column('smallint')
  chapter_number: number;

  @ManyToOne(() => ThirukkuralChapter, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'chapter_number', referencedColumnName: 'number', foreignKeyConstraintName: 'thirukkurals_chapter_fk' })
  chapter?: ThirukkuralChapter;

  /** First line of the kural (Tamil, 4 words). */
  @Column({ length: 100 })
  line1: string;

  /** Second line of the kural (Tamil, 3 words). */
  @Column({ length: 100 })
  line2: string;

  @Column({ length: 100 })
  transliteration1: string;

  @Column({ length: 100 })
  transliteration2: string;

  /** Short English translation. */
  @Column('text')
  translation: string;

  /** English verse translation (G. U. Pope). */
  @Column('text')
  couplet: string;

  /** English explanation. */
  @Column('text')
  explanation: string;

  /** Tamil explanation (urai) by Mu. Varadarasanar. */
  @Column('text')
  urai_mv: string;

  /** Tamil explanation (urai) by Solomon Pappaiah. */
  @Column('text')
  urai_sp: string;

  /** Tamil explanation (urai) by Kalaignar M. Karunanidhi. */
  @Column('text')
  urai_mk: string;

  /** Featured by an admin; shown in the website's highlights. */
  @Column({ default: false })
  is_highlighted: boolean;
}
