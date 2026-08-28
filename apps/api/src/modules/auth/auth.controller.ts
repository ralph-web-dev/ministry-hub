import { Controller, Post, Body, Res, Get, UseGuards, Req, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response, Request } from 'express';
import { COOKIE_NAME } from '@ministryhub/auth';
import { JwtAuthGuard } from './jwt-auth.guard';
import { z } from 'zod';
import { loginSchema } from '@ministryhub/validation';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: any, @Res({ passthrough: true }) res: Response) {
    const parsed = loginSchema.parse(body);
    const result = await this.authService.login(parsed);
    
    res.cookie(COOKIE_NAME, result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      accessToken: result.accessToken,
      user: result.user
    };
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(COOKIE_NAME);
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Req() req: Request) {
    return (req as any).user;
  }
}
