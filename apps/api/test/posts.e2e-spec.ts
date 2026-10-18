import type { INestApplication } from '@nestjs/common';
import type {
  AuthResponse,
  ContactResponse,
  FeedResponse,
  MediaResponse,
  PetResponse,
  PostResponse,
  PresignMediaResponse,
} from '@huellitas/shared';
import request from 'supertest';
import type { PrismaService } from '../src/prisma/prisma.service.js';
import { createTestApp, resetDb } from './helpers.js';

describe('Publicaciones y feed (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let ana: string;
  let beto: string;
  let centroId: string;
  let toby: PetResponse;
  const api = () => request(app.getHttpServer());
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  const now = () => new Date().toISOString();

  async function register(email: string, whatsapp?: string): Promise<string> {
    const res = await api()
      .post('/api/v1/auth/register')
      .send({ email, password: 'clave-segura-1', name: email.split('@')[0] })
      .expect(201);
    const token = (res.body as AuthResponse).accessToken;
    await api()
      .patch('/api/v1/users/me')
      .set(auth(token))
      .send({ neighborhoodId: centroId, ...(whatsapp && { whatsapp }) })
      .expect(200);
    return token;
  }

  async function uploadPhoto(token: string): Promise<MediaResponse> {
    const presign = await api()
      .post('/api/v1/media/presign')
      .set(auth(token))
      .send({ contentType: 'image/webp', sizeBytes: 100 })
      .expect(201);
    const { mediaId, uploadUrl, uploadHeaders } = presign.body as PresignMediaResponse;
    await api().put(`/api/v1${uploadUrl}`).set(uploadHeaders).send(Buffer.alloc(100)).expect(200);
    const res = await api().post(`/api/v1/media/${mediaId}/confirm`).set(auth(token)).expect(200);
    return res.body as MediaResponse;
  }

  const feed = async (query = '') =>
    (await api().get(`/api/v1/posts${query}`).expect(200)).body as FeedResponse;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    await resetDb(prisma);
    centroId = (await prisma.neighborhood.findFirstOrThrow()).id;
    ana = await register('ana@leones.com', '353 4123456');
    beto = await register('beto@leones.com');
    const photo = await uploadPhoto(ana);
    const res = await api()
      .post('/api/v1/pets')
      .set(auth(ana))
      .send({ name: 'Toby', species: 'PERRO', color: 'Marrón', sex: 'MACHO', mediaIds: [photo.id] })
      .expect(201);
    toby = res.body as PetResponse;
  });

  afterAll(async () => {
    await app.close();
  });

  let lost: PostResponse;
  let found: PostResponse;
  let adoption: PostResponse;

  it('reporta perdida con un toque: copia los datos y fotos de la mascota', async () => {
    const res = await api()
      .post(`/api/v1/pets/${toby.id}/report-lost`)
      .set(auth(ana))
      .send({ eventDate: now(), description: 'Se escapó por el portón', neighborhoodId: centroId })
      .expect(201);
    lost = res.body as PostResponse;
    expect(lost).toMatchObject({
      type: 'PERDIDA',
      status: 'ACTIVA',
      species: 'PERRO',
      sex: 'MACHO',
      color: 'Marrón',
      canContact: true,
      neighborhood: { name: 'Centro' },
      pet: { name: 'Toby' },
    });
    expect(lost.shortId).toMatch(/^[a-zA-Z0-9]{8}$/);
    expect(lost.photos.map((p) => p.id)).toEqual(toby.photos.map((p) => p.id));
    expect(JSON.stringify(lost)).not.toContain('4123456');

    const pet = await api().get(`/api/v1/pets/${toby.id}`).set(auth(ana)).expect(200);
    expect(pet.body).toMatchObject({
      status: 'PERDIDA',
      activeLostPost: { shortId: lost.shortId },
    });
  });

  it('no deja reportarla dos veces ni reportar mascotas ajenas', async () => {
    const body = { eventDate: now(), description: 'Otra vez perdida' };
    await api().post(`/api/v1/pets/${toby.id}/report-lost`).set(auth(ana)).send(body).expect(409);
    await api().post(`/api/v1/pets/${toby.id}/report-lost`).set(auth(beto)).send(body).expect(404);
  });

  it('valida fechas futuras y descripciones cortas', async () => {
    const res = await api()
      .post(`/api/v1/pets/${toby.id}/report-lost`)
      .set(auth(ana))
      .send({ eventDate: '2999-01-01T00:00:00Z', description: 'corta' })
      .expect(400);
    const paths = (res.body.issues as { path: string }[]).map((i) => i.path);
    expect(paths).toEqual(expect.arrayContaining(['eventDate', 'description']));
  });

  it('publica una ENCONTRADA (requiere foto)', async () => {
    const base = {
      type: 'ENCONTRADA',
      species: 'GATO',
      sex: 'HEMBRA',
      eventDate: now(),
      description: 'Gatita gris en la plaza, muy mansa',
      zoneText: 'Plaza San Martín',
    };
    await api()
      .post('/api/v1/posts')
      .set(auth(beto))
      .send({ ...base, mediaIds: [] })
      .expect(400);
    const photo = await uploadPhoto(beto);
    const res = await api()
      .post('/api/v1/posts')
      .set(auth(beto))
      .send({ ...base, mediaIds: [photo.id] })
      .expect(201);
    found = res.body as PostResponse;
    expect(found).toMatchObject({ type: 'ENCONTRADA', pet: null, canContact: false });
  });

  it('publica una ADOPCION con sus datos', async () => {
    const photo = await uploadPhoto(ana);
    const res = await api()
      .post('/api/v1/posts')
      .set(auth(ana))
      .send({
        type: 'ADOPCION',
        species: 'PERRO',
        description: 'Cachorrita buscando familia responsable',
        mediaIds: [photo.id],
        adoption: { approxAgeMonths: 3, vaccinated: true, requirements: 'Patio cerrado' },
      })
      .expect(201);
    adoption = res.body as PostResponse;
    expect(adoption.adoption).toMatchObject({
      approxAgeMonths: 3,
      vaccinated: true,
      neutered: null,
      requirements: 'Patio cerrado',
    });
  });

  it('el feed es público, ordenado y filtrable', async () => {
    const all = await feed();
    expect(all.items.map((p) => p.type)).toEqual(['ADOPCION', 'ENCONTRADA', 'PERDIDA']);
    expect((await feed('?type=PERDIDA')).items.map((p) => p.id)).toEqual([lost.id]);
    expect((await feed('?species=GATO')).items.map((p) => p.id)).toEqual([found.id]);
    expect((await feed(`?neighborhoodId=${centroId}`)).items.map((p) => p.id)).toEqual([lost.id]);
    await api().get('/api/v1/posts?type=OTRA').expect(400);
    await api().get('/api/v1/posts?city=no-existe').expect(404);
  });

  it('pagina con cursor sin repetir ni saltear', async () => {
    const first = await feed('?limit=2');
    expect(first.items).toHaveLength(2);
    expect(first.nextCursor).toBeTruthy();
    const second = await feed(`?limit=2&cursor=${first.nextCursor}`);
    expect(second.items.map((p) => p.id)).toEqual([lost.id]);
    expect(second.nextCursor).toBeNull();
    await api().get('/api/v1/posts?cursor=basura').expect(400);
  });

  it('detalle público por shortId', async () => {
    const res = await api().get(`/api/v1/posts/${lost.shortId}`).expect(200);
    expect((res.body as PostResponse).id).toBe(lost.id);
    await api().get('/api/v1/posts/noexiste').expect(404);
  });

  it('contacto: link de WhatsApp con mensaje armado, solo si hay número', async () => {
    const res = await api().get(`/api/v1/posts/${lost.id}/contact`).expect(200);
    const { whatsappUrl } = res.body as ContactResponse;
    expect(whatsappUrl).toMatch(/^https:\/\/wa\.me\/5493534123456\?text=/);
    expect(decodeURIComponent(whatsappUrl)).toContain(`/p/${lost.shortId}`);
    expect(decodeURIComponent(whatsappUrl)).toContain('Toby');
    await api().get(`/api/v1/posts/${found.id}/contact`).expect(404);
  });

  it('solo el autor edita; una PERDIDA no cambia fotos', async () => {
    await api()
      .patch(`/api/v1/posts/${lost.id}`)
      .set(auth(beto))
      .send({ description: 'Hackeado!!!!' })
      .expect(404);
    const res = await api()
      .patch(`/api/v1/posts/${lost.id}`)
      .set(auth(ana))
      .send({ zoneText: 'Cerca del hospital', showPhone: false })
      .expect(200);
    expect(res.body).toMatchObject({ zoneText: 'Cerca del hospital', canContact: false });
    await api()
      .patch(`/api/v1/posts/${lost.id}`)
      .set(auth(ana))
      .send({ mediaIds: [crypto.randomUUID()] })
      .expect(400);
  });

  it('mis publicaciones', async () => {
    const res = await api().get('/api/v1/posts/mine').set(auth(ana)).expect(200);
    expect((res.body as PostResponse[]).map((p) => p.id)).toEqual([adoption.id, lost.id]);
  });

  it('resolver una PERDIDA devuelve la mascota a casa y la saca del feed', async () => {
    const res = await api()
      .post(`/api/v1/posts/${lost.id}/resolve`)
      .set(auth(ana))
      .send({ resolution: 'REENCONTRADA' })
      .expect(200);
    expect(res.body).toMatchObject({ status: 'RESUELTA', resolution: 'REENCONTRADA' });
    const pet = await api().get(`/api/v1/pets/${toby.id}`).set(auth(ana)).expect(200);
    expect(pet.body).toMatchObject({ status: 'EN_CASA', activeLostPost: null });
    expect((await feed()).items.map((p) => p.id)).not.toContain(lost.id);
    // El link compartido sigue andando y muestra que volvió
    await api().get(`/api/v1/posts/${lost.shortId}`).expect(200);
    await api()
      .post(`/api/v1/posts/${lost.id}/resolve`)
      .set(auth(ana))
      .send({ resolution: 'REENCONTRADA' })
      .expect(409);
  });

  it('borrar una PERDIDA activa también devuelve la mascota a casa', async () => {
    const res = await api()
      .post(`/api/v1/pets/${toby.id}/report-lost`)
      .set(auth(ana))
      .send({ eventDate: now(), description: 'Se volvió a escapar' })
      .expect(201);
    const again = res.body as PostResponse;
    await api().delete(`/api/v1/posts/${again.id}`).set(auth(ana)).expect(204);
    const pet = await api().get(`/api/v1/pets/${toby.id}`).set(auth(ana)).expect(200);
    expect(pet.body).toMatchObject({ status: 'EN_CASA' });
    await api().get(`/api/v1/posts/${again.shortId}`).expect(404);
  });

  it('las publicaciones de un usuario bloqueado desaparecen del feed', async () => {
    await prisma.user.update({ where: { email: 'beto@leones.com' }, data: { status: 'BLOCKED' } });
    expect((await feed()).items.map((p) => p.id)).toEqual([adoption.id]);
    await api().get(`/api/v1/posts/${found.shortId}`).expect(404);
  });

  it('foto de perfil subida', async () => {
    const photo = await uploadPhoto(ana);
    const res = await api()
      .patch('/api/v1/users/me')
      .set(auth(ana))
      .send({ avatarMediaId: photo.id })
      .expect(200);
    expect((res.body as AuthResponse['user']).avatarUrl).toBe(photo.url);
    // Ya no se puede usar en otra cosa ni borrar suelta
    await api().delete(`/api/v1/media/${photo.id}`).set(auth(ana)).expect(409);
    // Reemplazarla borra la anterior
    const next = await uploadPhoto(ana);
    await api()
      .patch('/api/v1/users/me')
      .set(auth(ana))
      .send({ avatarMediaId: next.id })
      .expect(200);
    expect(await prisma.media.findUnique({ where: { id: photo.id } })).toBeNull();
    await api()
      .patch('/api/v1/users/me')
      .set(auth(ana))
      .send({ avatarUrl: 'https://malicioso.example/x.png' })
      .expect(200);
    const me = await api().get('/api/v1/users/me').set(auth(ana)).expect(200);
    expect(me.body.avatarUrl).toBe(next.url);
  });
});
