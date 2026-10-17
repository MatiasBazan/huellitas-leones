import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AuthTokens, JwtPayload } from '@huellitas/shared';
import { ENV, type Env } from '../../config/env.js';
import { PrismaService } from '../../prisma/prisma.service.js';

type TokenSubject = { id: string; role: JwtPayload['role']; cityId: string };

const hash = (token: string) => createHash('sha256').update(token).digest('hex');

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  /** Emite access + refresh. `familyId` se hereda al rotar. */
  async issue(
    user: TokenSubject,
    userAgent?: string,
    familyId: string = randomUUID(),
  ): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: user.id, role: user.role, cityId: user.cityId };
    const accessToken = await this.jwt.signAsync(payload);

    const refreshToken = randomBytes(32).toString('base64url');
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hash(refreshToken),
        familyId,
        userAgent: userAgent?.slice(0, 255) ?? null,
        expiresAt: new Date(Date.now() + this.env.REFRESH_TTL_DAYS * 86_400_000),
      },
    });

    return { accessToken, refreshToken, expiresIn: this.env.JWT_ACCESS_TTL_SECONDS };
  }

  /**
   * Rotación: el refresh usado se revoca y se emite uno nuevo de la misma familia.
   * Si llega uno ya revocado, alguien lo reusó: se revoca toda la familia.
   */
  async rotate(refreshToken: string, userAgent?: string): Promise<{ userId: string; tokens: AuthTokens }> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hash(refreshToken) },
      include: { user: { select: { id: true, role: true, cityId: true, status: true } } },
    });
    if (!stored) throw new UnauthorizedException('Refresh token inválido');

    if (stored.revokedAt) {
      await this.revokeFamily(stored.familyId);
      throw new UnauthorizedException('Refresh token reutilizado');
    }
    if (stored.expiresAt < new Date() || stored.user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Sesión vencida');
    }

    // updateMany condicional: si dos requests rotan en paralelo, solo una gana
    const { count } = await this.prisma.refreshToken.updateMany({
      where: { id: stored.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (count !== 1) {
      await this.revokeFamily(stored.familyId);
      throw new UnauthorizedException('Refresh token reutilizado');
    }

    const tokens = await this.issue(stored.user, userAgent, stored.familyId);
    return { userId: stored.user.id, tokens };
  }

  async revoke(refreshToken: string, userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hash(refreshToken), userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
