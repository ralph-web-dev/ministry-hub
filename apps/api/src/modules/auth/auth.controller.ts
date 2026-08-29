import {
  Controller,
  Post,
  Body,
  Res,
  Get,
  UseGuards,
  Req,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response, Request } from 'express';
import { COOKIE_NAME } from '@ministryhub/auth';
import { JwtAuthGuard } from './jwt-auth.guard';
import { loginSchema } from '@ministryhub/validation';
import { decryptPayload } from '@ministryhub/utils';
import { RateLimiterGuard, RateLimit } from '../../common/guards/rate-limiter.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @UseGuards(RateLimiterGuard)
  @RateLimit({
    limit: 5,
    ttlSeconds: 60,
    message: 'Too many login attempts. Please wait 1 minute before trying again.',
  })
  async login(@Body() body: any, @Res({ passthrough: true }) res: Response) {
    let credentials = body;

    // Check if the payload is encrypted with AES
    const encrypted = body?.payload || body?.encryptedPayload;
    if (encrypted && typeof encrypted === 'string') {
      try {
        credentials = await decryptPayload(encrypted);
      } catch (err) {
        throw new BadRequestException('Invalid encrypted payload format.');
      }
    }

    const parsed = loginSchema.parse(credentials);
    const result = await this.authService.login(parsed);

    res.cookie(COOKIE_NAME, result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      accessToken: result.accessToken,
      user: result.user,
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
