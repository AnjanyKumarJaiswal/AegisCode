import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  Res,
  HttpCode,
  HttpStatus,
  UsePipes,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from './user.service';
import { RegisterSchema, type RegisterDto } from './dto/register.dto';
import { LoginSchema, type LoginDto } from './dto/login.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GithubAuthGuard } from './guards/github-auth.guard';
import { ZodValidationPipe } from '../validation.pipe';
import type { Request, Response } from 'express';
import type { User } from '@prisma/client';

@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('register')
  @UsePipes(new ZodValidationPipe(RegisterSchema))
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.password);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(LoginSchema))
  async login(@Req() req: Request) {
    return this.authService.login(req.user as User);
  }

  @Get('github')
  @UseGuards(GithubAuthGuard)
  githubRedirect() {}

  @Get('github/callback')
  @UseGuards(GithubAuthGuard)
  async githubCallback(@Req() req: Request, @Res() res: Response) {
    const result = await this.authService.loginWithGithub(req.user as User);
    
    const params = new URLSearchParams();
    params.append('token', result.token);
    
    if (typeof req.query.source === 'string') {
      params.append('source', req.query.source);
    }
    if (typeof req.query.redirect_uri === 'string') {
      params.append('redirect_uri', req.query.redirect_uri);
    }
    
    const redirectUrl = `${process.env.FRONTEND_BASE_URL}/auth/callback?${params.toString()}`;
    return res.redirect(redirectUrl);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: Request) {
    const user = req.user as User;
    return this.authService.me(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('ide-sync')
  @HttpCode(HttpStatus.OK)
  async syncIde(@Req() req: Request, @Body() body: { ideClient?: unknown }) {
    const user = req.user as User;
    const ideClient =
      typeof body?.ideClient === 'string' ? body.ideClient.trim() : '';

    if (!ideClient) {
      throw new BadRequestException('ideClient is required');
    }

    await this.userService.recordIdeClient(user.id, ideClient);
    return { success: true };
  }
}
