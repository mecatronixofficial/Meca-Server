import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { ok } from '../common/api-response';
import { CurrentUser, Roles } from '../common/decorators/auth.decorators';
import { AuthUser } from '../common/guards/jwt-auth.guard';
import { ListQueryDto } from '../common/pagination';
import { AdminsService } from './admins.service';
import { CreateAdminDto, UpdateAdminDto } from './dto/admin.dto';
import { AdminRole } from './entities/admin.entity';
import { ApiTags } from '@nestjs/swagger';

/**
 * Admin account management. Creating, listing and deleting accounts is superadmin-only;
 * any admin may read and update their own profile (role changes stay superadmin-only).
 */
@ApiTags('Admins')
@Controller('admin')
export class AdminsController {
  constructor(private readonly admins: AdminsService) {}

  @Roles(AdminRole.SUPERADMIN)
  @Post('add_admin')
  async create(@Body() dto: CreateAdminDto) {
    return ok('Admin successfully added.', await this.admins.create(dto));
  }

  @Roles(AdminRole.SUPERADMIN)
  @Get('get_all_admins')
  async findAll(@Query() query: ListQueryDto) {
    return ok('Admins retrieved successfully.', await this.admins.findAll(query));
  }

  @Get('get_admin/:id')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return ok('Admin retrieved successfully.', await this.admins.findOne(id, user));
  }

  @Put('update_admin/:id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAdminDto, @CurrentUser() user: AuthUser) {
    return ok('Admin updated successfully.', await this.admins.update(id, dto, user));
  }

  @Roles(AdminRole.SUPERADMIN)
  @Delete('delete_admin/:id')
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    await this.admins.remove(id, user);
    return ok('Admin deleted successfully.');
  }
}
