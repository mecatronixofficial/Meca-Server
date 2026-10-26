import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { applySearch, ListQueryDto, ListResult, paginate } from '../common/pagination';
import { Client } from '../clients/entities/client.entity';
import { Work } from '../works/entities/work.entity';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { Project } from './entities/project.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private readonly projects: Repository<Project>,
    @InjectRepository(Client) private readonly clients: Repository<Client>,
    @InjectRepository(Work) private readonly works: Repository<Work>,
  ) {}

  async create(dto: CreateProjectDto) {
    await this.assertReferences(dto);
    const saved = await this.projects.save(this.projects.create(dto));
    return this.findOne(saved.id);
  }

  findAll(query: ListQueryDto): Promise<ListResult<Project>> {
    const qb = this.withRelations().orderBy('p.createdAt', 'DESC');
    return paginate(applySearch(qb, ['p.project_name', 'p.short_description', 'client.client_name'], query.search), query);
  }

  async findOne(id: string) {
    const project = await this.withRelations().where('p.id = :id', { id }).getOne();
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.assertReferences(dto);
    const project = await this.projects.findOneBy({ id });
    if (!project) throw new NotFoundException('Project not found');
    await this.projects.save(Object.assign(project, dto));
    return this.findOne(id);
  }

  async remove(id: string) {
    const project = await this.projects.findOneBy({ id });
    if (!project) throw new NotFoundException('Project not found');
    await this.projects.remove(project);
  }

  /** Joins only public-safe client and work fields; client contact details are never exposed here. */
  private withRelations() {
    return this.projects
      .createQueryBuilder('p')
      .leftJoin('p.client', 'client')
      .addSelect(['client.id', 'client.client_name', 'client.companies'])
      .leftJoin('p.work', 'work')
      .addSelect(['work.id', 'work.title']);
  }

  private async assertReferences(dto: Partial<CreateProjectDto>) {
    if (dto.client_id && !(await this.clients.existsBy({ id: dto.client_id }))) throw new BadRequestException('Invalid client reference');
    if (dto.work_id && !(await this.works.existsBy({ id: dto.work_id }))) throw new BadRequestException('Invalid work reference');
  }
}
