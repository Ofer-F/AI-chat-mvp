import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import type { PublicUser } from '../common/types/chat';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async list(): Promise<{ users: PublicUser[] }> {
    return { users: await this.usersService.listPublic() };
  }
}
