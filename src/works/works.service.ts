import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { applySearch, ListQueryDto, ListResult, paginate } from '../common/pagination';
import { Project } from '../projects/entities/project.entity';
import { CreateWorkDto, UpdateWorkDto } from './dto/work.dto';
import { Work } from './entities/work.entity';

@Injectable()
export class WorksService {
  constructor(
    @InjectRepository(Work) private readonly works: Repository<Work>,
    @InjectRepository(Project) private readonly projects: Repository<Project>,
  ) {}

  async create(dto: CreateWorkDto) {
    await this.assertProject(dto.project_id);
    const saved = await this.works.save(this.works.create(dto));
    return this.findOne(saved.id);
  }

  findAll(query: ListQueryDto): Promise<ListResult<Work>> {
    const qb = this.withProject().orderBy('w.createdAt', 'DESC');
    return paginate(applySearch(qb, ['w.title'], query.search), query);
  }

  async findOne(id: string) {
    const work = await this.withProject().where('w.id = :id', { id }).getOne();
    if (!work) throw new NotFoundException('Work not found');
    return work;
  }

  async update(id: string, dto: UpdateWorkDto) {
    await this.assertProject(dto.project_id);
    const work = await this.works.findOneBy({ id });
    if (!work) throw new NotFoundException('Work not found');
    await this.works.save(Object.assign(work, dto));
    return this.findOne(id);
  }

  async remove(id: string) {
    const work = await this.works.findOneBy({ id });
    if (!work) throw new NotFoundException('Work not found');
    await this.works.remove(work);
  }

  private withProject() {
    return this.works
      .createQueryBuilder('w')
      .leftJoin('w.project', 'project')
      .addSelect(['project.id', 'project.project_name', 'project.short_description']);
  }

  private async assertProject(projectId?: string | null) {
    if (projectId && !(await this.projects.existsBy({ id: projectId }))) throw new BadRequestException('Invalid project reference.');
  }
}
