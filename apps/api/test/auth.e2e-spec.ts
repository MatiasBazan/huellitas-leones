import type { INestApplication } from '@nestjs/common';
import type { AuthResponse } from '@huellitas/shared';
import request from 'supertest';
import type { PrismaService } from '../src/prisma/prisma.service.js';
import { createTestApp, resetDb } from './helpers.js';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const api = () => request(app.getHttpServer());

  const credentials = { email: 'Vecina@Leones.com', password: 'clave-segura-1', name: 'Vecina' };

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    await resetDb(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('registra un usuario en Leones por defecto', async () => {
    const res = await api().post('/api/v1/auth/register').send(credentials).expect(201);
    const body = res.body as AuthResponse;
    expect(body.user.email).toBe('vecina@leones.com');
    expect(body.user.city.slug).toBe('leones-cba');
    expect(body.user.profileIncomplete).toBe(true);
    expect(body.accessToken).toBeTruthy();
    expect(body.refreshToken).toBeTruthy();
  });

  it('rechaza email duplicado', async () => {
    await api().post('/api/v1/auth/register').send(credentials).expect(409);
  });

  it('valida el body con Zod', async () => {
    const res = await api()
      .post('/api/v1/auth/register')
      .send({ email: 'no-es-email', password: '1', name: '' })
      .expect(400);
    expect(res.body.issues.length).toBeGreaterThan(0);
  });

  it('rechaza contraseña incorrecta', async () => {
    await api()
      .post('/api/v1/auth/login')
      .send({ email: credentials.email, password: 'otra-clave' })
      .expect(401);
  });

  it('login → me → completar perfil', async () => {
    const login = await api()
      .post('/api/v1/auth/login')
      .send({ email: credentials.email, password: credentials.password })
      .expect(200);
    const { accessToken } = login.body as AuthResponse;

    await api().get('/api/v1/users/me').expect(401);

    const neighborhoods = await api().get('/api/v1/cities/leones-cba/neighborhoods').expect(200);
    const centro = neighborhoods.body[0];

    const updated = await api()
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ neighborhoodId: centro.id, whatsapp: '0353-15-4123456' })
      .expect(200);
    expect(updated.body.whatsapp).toBe('+5493534123456');
    expect(updated.body.profileIncomplete).toBe(false);
  });

  it('rota el refresh y detecta reuso', async () => {
    const login = await api()
      .post('/api/v1/auth/login')
      .send({ email: credentials.email, password: credentials.password })
      .expect(200);
    const first = (login.body as AuthResponse).refreshToken;

    const rotated = await api()
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: first })
      .expect(200);
    const second = (rotated.body as AuthResponse).refreshToken;
    expect(second).not.toBe(first);

    // Reusar el viejo invalida toda la familia, incluido el nuevo
    await api().post('/api/v1/auth/refresh').send({ refreshToken: first }).expect(401);
    await api().post('/api/v1/auth/refresh').send({ refreshToken: second }).expect(401);
  });

  it('un usuario bloqueado pierde acceso al instante', async () => {
    const login = await api()
      .post('/api/v1/auth/login')
      .send({ email: credentials.email, password: credentials.password })
      .expect(200);
    const { accessToken } = login.body as AuthResponse;

    await prisma.user.update({
      where: { email: 'vecina@leones.com' },
      data: { status: 'BLOCKED' },
    });

    await api().get('/api/v1/users/me').set('Authorization', `Bearer ${accessToken}`).expect(401);
    await api()
      .post('/api/v1/auth/login')
      .send({ email: credentials.email, password: credentials.password })
      .expect(401);
  });

  it('login con Google responde 503 si no está configurado', async () => {
    await api().post('/api/v1/auth/google').send({ idToken: 'x' }).expect(503);
  });

  it('health ok', async () => {
    await api().get('/api/v1/health').expect(200, { status: 'ok' });
  });
});
