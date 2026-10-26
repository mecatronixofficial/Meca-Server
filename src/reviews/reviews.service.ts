import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { applySearch, ListResult, paginate } from '../common/pagination';
import { ClientsService } from '../clients/clients.service';
import { CreateReviewDto, ReviewQueryDto, UpdateReviewDto } from './dto/review.dto';
import { Review } from './entities/review.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private readonly reviews: Repository<Review>,
    private readonly clients: ClientsService,
  ) {}

  /** New reviews are auto-verified when the reviewer matches a known client email or company. */
  async create(dto: CreateReviewDto) {
    const is_verified = await this.clients.isKnownClient(dto.user_email, dto.company_name);
    return this.reviews.save(this.reviews.create({ ...dto, is_verified }));
  }

  findAll(query: ReviewQueryDto): Promise<ListResult<Review>> {
    const qb = this.reviews.createQueryBuilder('r').orderBy('r.createdAt', 'DESC');
    if (query.verified) qb.andWhere('r.is_verified = :verified', { verified: query.verified === 'true' });
    return paginate(applySearch(qb, ['r.user_name', 'r.company_name', 'r.comment'], query.search), query);
  }

  async findOne(id: string) {
    const review = await this.reviews.findOneBy({ id });
    if (!review) throw new NotFoundException('Review not found');
    return review;
  }

  async update(id: string, dto: UpdateReviewDto) {
    const review = await this.findOne(id);
    return this.reviews.save(Object.assign(review, dto));
  }

  async remove(id: string) {
    await this.reviews.remove(await this.findOne(id));
  }

  async countByVerification() {
    const [verified, total] = await Promise.all([this.reviews.countBy({ is_verified: true }), this.reviews.count()]);
    return { verified, unverified: total - verified, total };
  }
}
