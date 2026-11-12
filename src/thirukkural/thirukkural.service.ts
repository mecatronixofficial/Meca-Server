import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { applySearch, DEFAULT_PAGE_SIZE, paginate, Paginated } from '../common/pagination';
import { indiaDate, kuralNumberForDate, nextChangeAt, TOTAL_KURALS } from './daily-kural';
import { KuralListQueryDto } from './dto/thirukkural.dto';
import { ThirukkuralChapter } from './entities/thirukkural-chapter.entity';
import { Thirukkural } from './entities/thirukkural.entity';

/** Title, author and commentators of the work, shown alongside every kural. */
export const THIRUKKURAL_WORK = {
  title: 'திருக்குறள்',
  title_en: 'Thirukkural',
  author: 'திருவள்ளுவர்',
  author_en: 'Thiruvalluvar',
  total_kurals: TOTAL_KURALS,
  total_chapters: 133,
  total_iyals: 13,
  total_paals: 3,
  /** Who wrote each Tamil explanation field on a kural. */
  urai_authors: {
    urai_mv: { name: 'மு. வரதராசனார்', name_en: 'Mu. Varadarasanar' },
    urai_sp: { name: 'சாலமன் பாப்பையா', name_en: 'Solomon Pappaiah' },
    urai_mk: { name: 'கலைஞர் மு. கருணாநிதி', name_en: 'Kalaignar M. Karunanidhi' },
  },
} as const;

const SEARCH_COLUMNS = [
  'k.line1',
  'k.line2',
  'k.transliteration1',
  'k.transliteration2',
  'k.translation',
  'k.couplet',
  'k.explanation',
  'c.name',
  'c.translation',
];

@Injectable()
export class ThirukkuralService {
  /** Chapters never change after the migration, so they are read once. */
  private chaptersCache?: Promise<ThirukkuralChapter[]>;

  constructor(
    @InjectRepository(Thirukkural) private readonly kurals: Repository<Thirukkural>,
    @InjectRepository(ThirukkuralChapter) private readonly chapters: Repository<ThirukkuralChapter>,
  ) {}

  /** The kural of the day (changes at midnight India time), with its chapter and author. */
  async getDaily(date = indiaDate()) {
    const kural = await this.findOne(kuralNumberForDate(date));
    return { date, next_change_at: nextChangeAt(date), author: THIRUKKURAL_WORK.author, author_en: THIRUKKURAL_WORK.author_en, kural };
  }

  /** Title, author, totals, and the paal → iyal → chapter outline. */
  async getAbout() {
    const paals: Array<{
      number: number;
      name: string;
      transliteration: string;
      translation: string;
      iyals: Array<{ number: number; name: string; transliteration: string; translation: string; chapters: ThirukkuralChapter[] }>;
    }> = [];

    for (const chapter of await this.allChapters()) {
      let paal = paals.find((p) => p.number === chapter.paal_number);
      if (!paal) {
        paal = {
          number: chapter.paal_number,
          name: chapter.paal_name,
          transliteration: chapter.paal_transliteration,
          translation: chapter.paal_translation,
          iyals: [],
        };
        paals.push(paal);
      }
      let iyal = paal.iyals.find((i) => i.number === chapter.iyal_number);
      if (!iyal) {
        iyal = {
          number: chapter.iyal_number,
          name: chapter.iyal_name,
          transliteration: chapter.iyal_transliteration,
          translation: chapter.iyal_translation,
          chapters: [],
        };
        paal.iyals.push(iyal);
      }
      iyal.chapters.push(chapter);
    }
    return { ...THIRUKKURAL_WORK, paals };
  }

  /** A chapter (adhigaram) with its 10 kurals. */
  async findChapter(number: number) {
    const chapter = (await this.allChapters()).find((c) => c.number === number);
    if (!chapter) throw new NotFoundException('Chapter not found. Chapters are numbered 1 to 133.');
    const kurals = await this.kurals.find({ where: { chapter_number: number }, order: { number: 'ASC' } });
    return { ...chapter, kurals };
  }

  /** Paginated kurals, filtered by chapter, paal, highlight or search text / number. */
  findAll(query: KuralListQueryDto): Promise<Paginated<Thirukkural>> {
    const qb = this.kurals.createQueryBuilder('k').innerJoinAndSelect('k.chapter', 'c').orderBy('k.number', 'ASC');
    if (query.chapter) qb.andWhere('k.chapter_number = :chapter', { chapter: query.chapter });
    if (query.paal) qb.andWhere('c.paal_number = :paal', { paal: query.paal });
    if (query.highlighted !== undefined) qb.andWhere('k.is_highlighted = :highlighted', { highlighted: query.highlighted });

    const search = query.search?.trim();
    if (search && /^\d{1,4}$/.test(search)) qb.andWhere('k.number = :number', { number: Number(search) });
    else applySearch(qb, SEARCH_COLUMNS, search);

    // Always paginate: the full text of all 1330 kurals is ~2 MB.
    return paginate(qb, { ...query, page: query.page ?? 1, limit: query.limit ?? DEFAULT_PAGE_SIZE }) as Promise<Paginated<Thirukkural>>;
  }

  async findOne(number: number) {
    const kural = await this.kurals.findOne({ where: { number }, relations: { chapter: true } });
    if (!kural) throw new NotFoundException(`Kural not found. Kurals are numbered 1 to ${TOTAL_KURALS}.`);
    return kural;
  }

  async setHighlight(number: number, isHighlighted: boolean) {
    const kural = await this.findOne(number);
    await this.kurals.update({ number }, { is_highlighted: isHighlighted });
    return { ...kural, is_highlighted: isHighlighted };
  }

  private allChapters() {
    this.chaptersCache ??= this.chapters.find({ order: { number: 'ASC' } }).catch((error: unknown) => {
      this.chaptersCache = undefined; // retry on the next request instead of caching the failure
      throw error;
    });
    return this.chaptersCache;
  }
}
