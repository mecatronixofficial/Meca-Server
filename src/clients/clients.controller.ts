import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { ok } from '../common/api-response';
import { ListQueryDto } from '../common/pagination';
import { Public } from '../common/decorators/auth.decorators';
import { ClientsService } from './clients.service';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Clients')
@Controller('clients')
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}

  @Post('add_client')
  async create(@Body() dto: CreateClientDto) {
    return ok('Client added successfully', await this.clients.create(dto));
  }

  @Get('get_all_clients')
  async findAll(@Query() query: ListQueryDto) {
    return ok('Client(s) fetched successfully', await this.clients.findAll(query));
  }

  @Public()
  @Get('get_all_clients_company')
  async findAllCompanies() {
    return ok('Companies fetched successfully', await this.clients.findAllCompanies());
  }

  @Get('get_client/:id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return ok('Client(s) fetched successfully', await this.clients.findOne(id));
  }

  @Put('edit_client/:id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateClientDto) {
    return ok('Client updated successfully', await this.clients.update(id, dto));
  }

  @Delete('delete_client/:id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.clients.remove(id);
    return ok('Client deleted successfully');
  }
}
