import { Controller, Get, Patch, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
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
  updateUserRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @Req() req: any, // Injetando a requisição para pegar o admin logado
  ) {
    return this.admin.updateUserRole(id, dto.role, req.user.id);
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
    let n = limit ? parseInt(limit, 10) : 20;
    
    // Correção 32.3: Garante que o limite esteja entre 1 e 100.
    if (isNaN(n) || n < 1) {
      n = 20;
    } else if (n > 100) {
      n = 100;
    }
    
    return this.admin.getTopTracks(n);
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