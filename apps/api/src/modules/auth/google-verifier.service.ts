import { Inject, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { ENV, type Env } from '../../config/env.js';

export type GoogleIdentity = {
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
};

/** Verifica el idToken que obtienen la app/web con Google Sign-In */
@Injectable()
export class GoogleVerifierService {
  private readonly client = new OAuth2Client();

  constructor(@Inject(ENV) private readonly env: Env) {}

  async verify(idToken: string): Promise<GoogleIdentity> {
    if (this.env.GOOGLE_CLIENT_IDS.length === 0) {
      throw new ServiceUnavailableException('Login con Google no configurado');
    }

    let payload;
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: this.env.GOOGLE_CLIENT_IDS,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Token de Google inválido');
    }

    if (!payload?.sub || !payload.email || !payload.email_verified) {
      throw new UnauthorizedException('La cuenta de Google no tiene un email verificado');
    }

    return {
      googleId: payload.sub,
      email: payload.email.toLowerCase(),
      name: payload.name ?? payload.email.split('@')[0] ?? 'Vecino',
      avatarUrl: payload.picture ?? null,
    };
  }
}
