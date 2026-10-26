import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { applySearch, ListQueryDto, ListResult, paginate } from '../common/pagination';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto';
import { Client, Company } from './entities/client.entity';

@Injectable()
export class ClientsService {
  constructor(@InjectRepository(Client) private readonly clients: Repository<Client>) {}

  create(dto: CreateClientDto) {
    return this.clients.save(this.clients.create(dto));
  }

  findAll(query: ListQueryDto): Promise<ListResult<Client>> {
    const qb = this.clients.createQueryBuilder('c').orderBy('c.createdAt', 'DESC');
    return paginate(applySearch(qb, ['c.client_name'], query.search), query);
  }

  /** Flattens every client's companies for the public "our clients" section, sorted by company name. */
  async findAllCompanies(): Promise<Array<Company & { client_name: string }>> {
    const clients = await this.clients.find({ where: { is_active: true }, select: { client_name: true, companies: true } });
    return clients
      .flatMap((client) => client.companies.map((company) => ({ ...company, client_name: client.client_name })))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async findOne(id: string) {
    const client = await this.clients.findOneBy({ id });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async update(id: string, dto: UpdateClientDto) {
    const client = await this.findOne(id);
    return this.clients.save(Object.assign(client, dto));
  }

  /** Fails with 409 (via the exception filter) while projects still reference this client. */
  async remove(id: string) {
    await this.clients.remove(await this.findOne(id));
  }

  /** A reviewer counts as a verified client when their email or company matches a client record. */
  async isKnownClient(email: string, companyName?: string): Promise<boolean> {
    const query = this.clients.createQueryBuilder('c').where(':email = ANY(c.client_emails)', { email });
    if (companyName) query.orWhere('c.companies @> CAST(:company AS jsonb)', { company: JSON.stringify([{ name: companyName }]) });
    return (await query.getCount()) > 0;
  }
}
