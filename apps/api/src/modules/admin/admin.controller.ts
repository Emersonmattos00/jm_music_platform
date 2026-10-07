import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('dashboard')
  dashboard() {
    return this.admin.getDashboard();
  }

  @Get('users')
  listUsers(@Query() query: ListUsersQueryDto) {
    return this.admin.listUsers(query);
  }

  @Patch('users/:id/role')
  updateUserRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    return this.admin.updateUserRole(id, dto.role);
  }

  @Get('subscriptions')
  listSubscriptions() {
    return this.admin.listSubscriptions();
  }

  @Get('rentals')
  listRentals() {
    return this.admin.listRentals();
  }

  @Get('reports/top-tracks')
  topTracks(@Query('limit') limit?: string) {
    const n = limit ? parseInt(limit, 10) : 20;
    return this.admin.getTopTracks(isNaN(n) ? 20 : Math.min(n, 100));
  }

  @Post('sync-b2')
  syncB2() {
    return {
      ok: true,
      message:
        'Para sincronizar, rode `npm run sync` no terminal do servidor. A execução em background via API será adicionada em breve.',
    };
  }
}