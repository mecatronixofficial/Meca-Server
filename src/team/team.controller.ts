import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ok } from '../common/api-response';
import { Public } from '../common/decorators/auth.decorators';
import type { AuthRequest } from '../common/guards/jwt-auth.guard';
import { ListQueryDto } from '../common/pagination';
import { CreateTeamMemberDto, UpdateTeamMemberDto } from './dto/team-member.dto';
import { TeamMember } from './entities/team-member.entity';
import { TeamService } from './team.service';

@ApiTags('Team')
@Controller('team')
export class TeamController {
  constructor(private readonly team: TeamService) {}

  @Post('add')
  async create(@Body() dto: CreateTeamMemberDto) {
    return ok('Team member added successfully', await this.team.create(dto));
  }

  /** Admin list (mec-admin "Team & founders"): every member, hidden ones included, in display order. */
  @Get('all')
  async findAllForAdmin(@Query() query: ListQueryDto) {
    return ok('Team fetched successfully', await this.team.findAll(query));
  }

  /**
   * Admins: every member, hidden ones included. Public website (no admin session):
   * active members only.
   */
  @Public()
  @Get('get')
  async findAll(@Query() query: ListQueryDto, @Req() request: Partial<AuthRequest>) {
    if (request.user) return ok('Team fetched successfully', await this.team.findAll(query));
    const result = await this.team.findAll(query, true);
    const publicFields = ({ is_active: _active, ...member }: TeamMember) => member;
    return ok('Team fetched successfully', Array.isArray(result) ? result.map(publicFields) : { ...result, items: result.items.map(publicFields) });
  }

  @Get('get/:id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return ok('Team member fetched successfully', await this.team.findOne(id));
  }

  @Put('edit/:id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTeamMemberDto) {
    return ok('Team member updated successfully', await this.team.update(id, dto));
  }

  @Delete('delete/:id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.team.remove(id);
    return ok('Team member deleted successfully');
  }
}
