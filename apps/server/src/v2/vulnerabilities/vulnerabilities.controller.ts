import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { VulnerabilitiesService } from './vulnerabilities.service';

@Controller('api/v2/vulnerabilities')
@UseGuards(JwtAuthGuard)
export class VulnerabilitiesController {
  constructor(
    private readonly vulnerabilitiesService: VulnerabilitiesService,
  ) {}

  @Get()
  async list(
    @Req() req: Request,
    @Query('q') q?: string,
    @Query('severity') severity?: string,
    @Query('status') status?: string,
  ) {
    const user = req.user as User;
    return this.vulnerabilitiesService.list(user.id, { q, severity, status });
  }

  @Get(':id')
  async getById(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as User;
    return this.vulnerabilitiesService.getById(user.id, id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Req() req: Request,
    @Param('id') id: string,
    @Body('status') status?: string,
  ) {
    const user = req.user as User;
    return this.vulnerabilitiesService.updateStatus(user.id, id, status);
  }
}
