import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { applySearch, ListQueryDto, ListResult, paginate } from '../common/pagination';
import { CreateTeamMemberDto, UpdateTeamMemberDto } from './dto/team-member.dto';
import { TeamMember } from './entities/team-member.entity';

@Injectable()
export class TeamService {
  constructor(@InjectRepository(TeamMember) private readonly members: Repository<TeamMember>) {}

  create(dto: CreateTeamMemberDto) {
    return this.members.save(this.members.create(dto));
  }

  /** In display order. `activeOnly` is what the public website sees. */
  findAll(query: ListQueryDto, activeOnly = false): Promise<ListResult<TeamMember>> {
    const qb = this.members.createQueryBuilder('m').orderBy('m.position', 'ASC').addOrderBy('m.createdAt', 'ASC');
    if (activeOnly) qb.where('m.is_active = true');
    return paginate(applySearch(qb, ['m.name', 'm.role'], query.search), query);
  }

  async findOne(id: string) {
    const member = await this.members.findOneBy({ id });
    if (!member) throw new NotFoundException('Team member not found');
    return member;
  }

  async update(id: string, dto: UpdateTeamMemberDto) {
    return this.members.save(Object.assign(await this.findOne(id), dto));
  }

  async remove(id: string) {
    await this.members.remove(await this.findOne(id));
  }
}
