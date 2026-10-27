import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  NotImplementedException,
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
  updateUserRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @Req() req: any,
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

  // CORREÇÃO 41.5: A sincronização via API não está implementada.
  // Retorna 501 Not Implemented em vez de fingir sucesso.
  @Post('sync-b2')
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  syncB2() {
    throw new NotImplementedException(
      'A sincronização via API ainda não está disponível. Execute `npm run sync` no terminal do servidor.',
    );
  }
}