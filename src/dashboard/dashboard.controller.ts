import { Controller, Get } from '@nestjs/common';
import { ok } from '../common/api-response';
import { DashboardService } from './dashboard.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Dashboard')
@Controller('dash')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('all')
  async stats() {
    return ok('Dashboard data fetched successfully', await this.dashboard.stats());
  }
}
