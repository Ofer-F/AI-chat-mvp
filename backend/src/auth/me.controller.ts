import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { PublicUser } from '../common/types/chat';

@Controller('me')
@UseGuards(JwtAuthGuard)
export class MeController {
  @Get()
  getCurrentUser(@CurrentUser() user: PublicUser): PublicUser {
    return user;
  }
}
