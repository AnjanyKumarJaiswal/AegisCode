import {
  Controller,
  Post,
  Patch,
  Get,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '@prisma/client';
import { SessionService } from './session.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('api/v1/sessions')
@UseGuards(JwtAuthGuard)
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async startSession(@Req() req: Request) {
    const user = req.user as User;
    return this.sessionService.startSession(user.id);
  }

  @Patch(':id/complete')
  async endSession(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as User;
    return this.sessionService.endSession(id, user.id);
  }

  @Get(':id')
  async getSession(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as User;
    return this.sessionService.getSession(id, user.id);
  }
}
