import type { INestApplication } from '@nestjs/common';
import type {
  AuthResponse,
  MediaResponse,
  PetResponse,
  PresignMediaResponse,
} from '@huellitas/shared';
import request from 'supertest';
import { MediaService } from '../src/modules/media/media.service.js';
import type { PrismaService } from '../src/prisma/prisma.service.js';
import { createTestApp, resetDb } from './helpers.js';

describe('Mascotas y fotos (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let ana: string;
  let beto: string;
  const api = () => request(app.getHttpServer());
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  async function register(email: string): Promise<string> {
    const res = await api()
      .post('/api/v1/auth/register')
      .send({ email, password: 'clave-segura-1', name: email.split('@')[0] })
      .expect(201);
    return (res.body as AuthResponse).accessToken;
  }

  /** Flujo completo de la app: presign → PUT → confirm */
  async function uploadPhoto(token: string, bytes = 1234): Promise<MediaResponse> {
    const presign = await api()
      .post('/api/v1/media/presign')
      .set(auth(token))
      .send({ contentType: 'image/webp', sizeBytes: bytes, width: 1600, height: 1200 })
      .expect(201);
    const { mediaId, uploadUrl, uploadHeaders } = presign.body as PresignMediaResponse;
    await api()
      .put(`/api/v1${uploadUrl}`)
      .set(uploadHeaders)
      .send(Buffer.alloc(bytes, 7))
      .expect(200);
    const confirm = await api()
      .post(`/api/v1/media/${mediaId}/confirm`)
      .set(auth(token))
      .expect(200);
    return confirm.body as MediaResponse;
  }

  const toby = {
    name: 'Toby',
    species: 'PERRO',
    breed: 'Mestizo',
    color: 'Marrón con blanco',
    sex: 'MACHO',
    size: 'MEDIANO',
    approxBirthDate: '2022-03-01',
    distinctiveMarks: 'Collar rojo con cascabel',
  };

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    await resetDb(prisma);
    ana = await register('ana@leones.com');
    beto = await register('beto@leones.com');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('fotos', () => {
    it('sube, confirma y sirve la foto', async () => {
      const photo = await uploadPhoto(ana);
      expect(photo.url).toMatch(/^\/media\/files\/cities\/.+\.webp$/);
      expect(photo.width).toBe(1600);
      const file = await api().get(`/api/v1${photo.url}`).expect(200);
      expect(file.headers['cross-origin-resource-policy']).toBe('cross-origin');
    });

    it('valida tipo y tamaño antes de firmar', async () => {
      await api()
        .post('/api/v1/media/presign')
        .set(auth(ana))
        .send({ contentType: 'image/gif', sizeBytes: 100 })
        .expect(400);
      await api()
        .post('/api/v1/media/presign')
        .set(auth(ana))
        .send({ contentType: 'image/webp', sizeBytes: 50 * 1024 * 1024 })
        .expect(400);
    });

    it('no confirma una foto que no llegó', async () => {
      const res = await api()
        .post('/api/v1/media/presign')
        .set(auth(ana))
        .send({ contentType: 'image/webp', sizeBytes: 100 })
        .expect(201);
      const { mediaId } = res.body as PresignMediaResponse;
      await api().post(`/api/v1/media/${mediaId}/confirm`).set(auth(ana)).expect(400);
    });

    it('rechaza un archivo distinto al declarado o un token trucho', async () => {
      const res = await api()
        .post('/api/v1/media/presign')
        .set(auth(ana))
        .send({ contentType: 'image/webp', sizeBytes: 100 })
        .expect(201);
      const { uploadUrl } = res.body as PresignMediaResponse;
      await api()
        .put(`/api/v1${uploadUrl}`)
        .set('Content-Type', 'image/webp')
        .send(Buffer.alloc(40))
        .expect(403);
      await api()
        .put(`/api/v1${uploadUrl}`)
        .set('Content-Type', 'image/png')
        .send(Buffer.alloc(100))
        .expect(403);
      await api()
        .put('/api/v1/media/local-upload/no-es-un-token')
        .set('Content-Type', 'image/webp')
        .send(Buffer.alloc(100))
        .expect(403);
    });

    it('no deja confirmar fotos de otro usuario', async () => {
      const res = await api()
        .post('/api/v1/media/presign')
        .set(auth(ana))
        .send({ contentType: 'image/webp', sizeBytes: 100 })
        .expect(201);
      const { mediaId } = res.body as PresignMediaResponse;
      await api().post(`/api/v1/media/${mediaId}/confirm`).set(auth(beto)).expect(404);
    });
  });

  describe('mascotas', () => {
    let pet: PetResponse;
    let photos: MediaResponse[];

    it('crea una mascota con fotos en orden', async () => {
      photos = [await uploadPhoto(ana), await uploadPhoto(ana), await uploadPhoto(ana)];
      const res = await api()
        .post('/api/v1/pets')
        .set(auth(ana))
        .send({ ...toby, mediaIds: photos.map((p) => p.id) })
        .expect(201);
      pet = res.body as PetResponse;
      expect(pet.status).toBe('EN_CASA');
      expect(pet.approxBirthDate).toBe('2022-03-01');
      expect(pet.photos.map((p) => p.id)).toEqual(photos.map((p) => p.id));
    });

    it('crea con lo mínimo y completa los opcionales', async () => {
      const res = await api()
        .post('/api/v1/pets')
        .set(auth(ana))
        .send({ name: 'Mishi', species: 'GATO', color: 'Negro', breed: '  ' })
        .expect(201);
      const mishi = res.body as PetResponse;
      expect(mishi).toMatchObject({ sex: 'DESCONOCIDO', breed: null, size: null, photos: [] });
    });

    it('valida los datos', async () => {
      const res = await api()
        .post('/api/v1/pets')
        .set(auth(ana))
        .send({ ...toby, approxBirthDate: '2999-01-01', species: 'DRAGON' })
        .expect(400);
      const paths = (res.body.issues as { path: string }[]).map((i) => i.path);
      expect(paths).toEqual(expect.arrayContaining(['approxBirthDate', 'species']));
    });

    it('lista solo las mías', async () => {
      const mine = await api().get('/api/v1/pets/mine').set(auth(ana)).expect(200);
      expect((mine.body as PetResponse[]).map((p) => p.name)).toEqual(['Mishi', 'Toby']);
      const others = await api().get('/api/v1/pets/mine').set(auth(beto)).expect(200);
      expect(others.body).toEqual([]);
    });

    it('otro usuario no la ve ni puede usar sus fotos', async () => {
      await api().get(`/api/v1/pets/${pet.id}`).set(auth(beto)).expect(404);
      await api().patch(`/api/v1/pets/${pet.id}`).set(auth(beto)).send({ name: 'X' }).expect(404);
      await api()
        .post('/api/v1/pets')
        .set(auth(beto))
        .send({ ...toby, mediaIds: [photos[0]!.id] })
        .expect(400);
    });

    it('edita, reordena y saca fotos (y las borra del storage)', async () => {
      const [first, second, third] = photos as [MediaResponse, MediaResponse, MediaResponse];
      const res = await api()
        .patch(`/api/v1/pets/${pet.id}`)
        .set(auth(ana))
        .send({ name: 'Toby II', mediaIds: [third.id, first.id] })
        .expect(200);
      const updated = res.body as PetResponse;
      expect(updated.name).toBe('Toby II');
      expect(updated.color).toBe(toby.color);
      expect(updated.photos.map((p) => p.id)).toEqual([third.id, first.id]);
      expect(await prisma.media.findUnique({ where: { id: second.id } })).toBeNull();
      await api().get(`/api/v1${second.url}`).expect(404);
    });

    it('no acepta más de 5 fotos', async () => {
      const ids = Array.from({ length: 6 }, () => crypto.randomUUID());
      await api()
        .patch(`/api/v1/pets/${pet.id}`)
        .set(auth(ana))
        .send({ mediaIds: ids })
        .expect(400);
    });

    it('una foto asignada no se borra suelta', async () => {
      await api().delete(`/api/v1/media/${photos[0]!.id}`).set(auth(ana)).expect(409);
    });

    it('borra la mascota (lógico)', async () => {
      await api().delete(`/api/v1/pets/${pet.id}`).set(auth(ana)).expect(204);
      await api().get(`/api/v1/pets/${pet.id}`).set(auth(ana)).expect(404);
      expect(await prisma.pet.findUnique({ where: { id: pet.id } })).not.toBeNull();
    });
  });

  it('la limpieza borra fotos abandonadas', async () => {
    const orphan = await uploadPhoto(ana);
    const pending = await prisma.media.findFirstOrThrow({ where: { status: 'PENDING' } });
    const inTwoDays = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

    const deleted = await app.get(MediaService).cleanupOrphans(inTwoDays);

    expect(deleted).toBeGreaterThanOrEqual(2);
    expect(await prisma.media.findUnique({ where: { id: orphan.id } })).toBeNull();
    expect(await prisma.media.findUnique({ where: { id: pending.id } })).toBeNull();
    expect(await prisma.media.count({ where: { petId: { not: null } } })).toBe(2);
  });
});
