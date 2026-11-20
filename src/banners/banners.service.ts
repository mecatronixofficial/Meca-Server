import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { applySearch, ListQueryDto, ListResult, paginate } from '../common/pagination';
import { CreateBannerDto, UpdateBannerDto } from './dto/banner.dto';
import { Banner } from './entities/banner.entity';

@Injectable()
export class BannersService {
  constructor(@InjectRepository(Banner) private readonly banners: Repository<Banner>) {}

  async create(dto: CreateBannerDto) {
    assertButtonComplete(dto.cta_label, dto.cta_link);
    await this.assertPositionFree(dto.position);
    return this.banners.save(this.banners.create(dto));
  }

  findAll(query: ListQueryDto): Promise<ListResult<Banner>> {
    const qb = this.banners.createQueryBuilder('b').orderBy('b.position', 'ASC');
    return paginate(applySearch(qb, ['b.name', 'b.description'], query.search), query);
  }

  async findOne(id: string) {
    const banner = await this.banners.findOneBy({ id });
    if (!banner) throw new NotFoundException('Banner not found');
    return banner;
  }

  async update(id: string, dto: UpdateBannerDto) {
    const banner = await this.findOne(id);
    assertButtonComplete(dto.cta_label === undefined ? banner.cta_label : dto.cta_label, dto.cta_link === undefined ? banner.cta_link : dto.cta_link);
    if (dto.position !== undefined && dto.position !== banner.position) await this.assertPositionFree(dto.position, id);
    return this.banners.save(Object.assign(banner, dto));
  }

  async remove(id: string) {
    await this.banners.remove(await this.findOne(id));
  }

  private async assertPositionFree(position: number, excludingId?: string) {
    const taken = await this.banners.existsBy(excludingId ? { position, id: Not(excludingId) } : { position });
    if (taken) throw new ConflictException('Position already in use, please choose another');
  }
}

/** A banner button needs both its text and its link, or neither. */
function assertButtonComplete(label?: string | null, link?: string | null) {
  if (!!label !== !!link) throw new BadRequestException(label ? 'Add a link for the button' : 'Add text for the button');
}
