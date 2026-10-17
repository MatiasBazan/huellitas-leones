import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import type {
  AuthResponse,
  GoogleLoginInput,
  LoginInput,
  RegisterInput,
} from '@huellitas/shared';
import { ENV, type Env } from '../../config/env.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CitiesService } from '../cities/cities.service.js';
import { UsersService } from '../users/users.service.js';
import { GoogleVerifierService } from './google-verifier.service.js';
import { TokenService } from './token.service.js';

// Hash fijo para comparar cuando el email no existe y no filtrar por tiempo de respuesta
const DUMMY_HASH = argon2.hash('dummy-password-for-timing');

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly google: GoogleVerifierService,
    private readonly users: UsersService,
    private readonly cities: CitiesService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async register(input: RegisterInput, userAgent?: string): Promise<AuthResponse> {
    const exists = await this.prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });
    if (exists) throw new ConflictException('Ya hay una cuenta con ese email');

    const city = await this.cities.findActiveBySlug(input.citySlug ?? this.env.DEFAULT_CITY_SLUG);
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash: await argon2.hash(input.password),
        cityId: city.id,
      },
    });
    return this.buildResponse(user.id, userAgent);
  }

  async login(input: LoginInput, userAgent?: string): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    const valid = await argon2.verify(user?.passwordHash ?? (await DUMMY_HASH), input.password);
    if (!user?.passwordHash || !valid) throw new UnauthorizedException('Email o contraseña incorrectos');
    this.assertActive(user.status);
    return this.buildResponse(user.id, userAgent);
  }

  /**
   * Busca por googleId; si no, vincula por email; si no, crea la cuenta.
   * Al vincular a una cuenta con email sin verificar se borra la contraseña:
   * quien la registró no demostró ser dueño del email.
   */
  async loginWithGoogle(input: GoogleLoginInput, userAgent?: string): Promise<AuthResponse> {
    const identity = await this.google.verify(input.idToken);

    let user = await this.prisma.user.findUnique({ where: { googleId: identity.googleId } });

    if (!user) {
      const byEmail = await this.prisma.user.findUnique({ where: { email: identity.email } });
      if (byEmail) {
        user = await this.prisma.user.update({
          where: { id: byEmail.id },
          data: {
            googleId: identity.googleId,
            emailVerifiedAt: byEmail.emailVerifiedAt ?? new Date(),
            passwordHash: byEmail.emailVerifiedAt ? byEmail.passwordHash : null,
            avatarUrl: byEmail.avatarUrl ?? identity.avatarUrl,
          },
        });
      }
    }

    if (!user) {
      const city = await this.cities.findActiveBySlug(input.citySlug ?? this.env.DEFAULT_CITY_SLUG);
      user = await this.prisma.user.create({
        data: {
          email: identity.email,
          googleId: identity.googleId,
          emailVerifiedAt: new Date(),
          name: identity.name,
          avatarUrl: identity.avatarUrl,
          cityId: city.id,
        },
      });
    }

    this.assertActive(user.status);
    return this.buildResponse(user.id, userAgent);
  }

  async refresh(refreshToken: string, userAgent?: string): Promise<AuthResponse> {
    const { userId, tokens } = await this.tokens.rotate(refreshToken, userAgent);
    const user = await this.users.findByIdWithRelations(userId);
    return { ...tokens, user: this.users.toMe(user) };
  }

  logout(refreshToken: string, userId: string): Promise<void> {
    return this.tokens.revoke(refreshToken, userId);
  }

  private assertActive(status: string): void {
    if (status !== 'ACTIVE') throw new UnauthorizedException('Cuenta no disponible');
  }

  private async buildResponse(userId: string, userAgent?: string): Promise<AuthResponse> {
    const user = await this.users.findByIdWithRelations(userId);
    const tokens = await this.tokens.issue(user, userAgent);
    return { ...tokens, user: this.users.toMe(user) };
  }
}
