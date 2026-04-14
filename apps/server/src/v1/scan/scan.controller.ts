import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  UsePipes,
} from '@nestjs/common';
import { z } from 'zod';
import type { Request } from 'express';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ScanService } from './scan.service';
import { ZodValidationPipe } from '../../validation.pipe';

const ScanRequestSchema = z.object({
  sessionId: z.uuid(),
  filePath: z.string().min(1),
  languageId: z.string().min(1),
  content: z.string().min(1).max(100_000),
  triggerType: z.enum(['AUTO_INACTIVITY', 'MANUAL']).optional(),
});

type ScanRequestDto = z.infer<typeof ScanRequestSchema>;

@Controller('api/v1/scan')
@UseGuards(JwtAuthGuard)
export class ScanController {
  constructor(private readonly scanService: ScanService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(ScanRequestSchema))
  async scanCode(@Req() req: Request, @Body() body: ScanRequestDto) {
    const user = req.user as User;

    return this.scanService.executeScan(
      user.id,
      body.sessionId,
      body.filePath,
      body.languageId,
      body.content,
      body.triggerType || 'MANUAL',
    );
  }
}
