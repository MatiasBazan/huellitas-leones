import { Body, Controller, Headers, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  googleLoginSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  type AuthResponse,
  type GoogleLoginInput,
  type LoginInput,
  type RefreshInput,
  type RegisterInput,
} from '@huellitas/shared';
import { CurrentUser, Public, type AuthUser } from '../../common/auth.decorators.js';
import { ZodValidationPipe } from '../../common/zod-validation.pipe.js';
import { AuthService } from './auth.service.js';

// Más estricto que el límite global: 10 intentos por minuto por IP
@Throttle({ default: { limit: 10, ttl: 60_000 } })
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  register(
    @Body(new ZodValidationPipe(registerSchema)) body: RegisterInput,
    @Headers('user-agent') ua?: string,
  ): Promise<AuthResponse> {
    return this.auth.register(body, ua);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginInput,
    @Headers('user-agent') ua?: string,
  ): Promise<AuthResponse> {
    return this.auth.login(body, ua);
  }

  @Public()
  @Post('google')
  @HttpCode(HttpStatus.OK)
  google(
    @Body(new ZodValidationPipe(googleLoginSchema)) body: GoogleLoginInput,
    @Headers('user-agent') ua?: string,
  ): Promise<AuthResponse> {
    return this.auth.loginWithGoogle(body, ua);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(
    @Body(new ZodValidationPipe(refreshSchema)) body: RefreshInput,
    @Headers('user-agent') ua?: string,
  ): Promise<AuthResponse> {
    return this.auth.refresh(body.refreshToken, ua);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(refreshSchema)) body: RefreshInput,
  ): Promise<void> {
    return this.auth.logout(body.refreshToken, user.id);
  }
}
