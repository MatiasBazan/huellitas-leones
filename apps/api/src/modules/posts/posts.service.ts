import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  contactMessage,
  postTitle,
  type ContactResponse,
  type CreatePostData,
  type FeedQuery,
  type FeedResponse,
  type PostResponse,
  type ReportLostData,
  type ResolvePostInput,
  type UpdatePostData,
} from '@huellitas/shared';
import type { AuthUser } from '../../common/auth.decorators.js';
import { ENV, type Env } from '../../config/env.js';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CitiesService } from '../cities/cities.service.js';
import { MediaService } from '../media/media.service.js';
import { decodeCursor, encodeCursor } from './feed-cursor.js';
import { generateShortId } from './short-id.js';

const photoSelect = { id: true, key: true, width: true, height: true } as const;

const postInclude = {
  city: { select: { slug: true, name: true } },
  neighborhood: { select: { id: true, name: true } },
  photos: { orderBy: { position: 'asc' }, select: photoSelect },
  pet: {
    select: {
      id: true,
      name: true,
      breed: true,
      approxBirthDate: true,
      distinctiveMarks: true,
      photos: { orderBy: { position: 'asc' }, select: photoSelect },
    },
  },
  adoption: true,
  author: {
    select: {
      id: true,
      name: true,
      whatsapp: true,
      avatarUrl: true,
      avatarMedia: { select: photoSelect },
    },
  },
} satisfies Prisma.PostInclude;

type PostWithRelations = Prisma.PostGetPayload<{ include: typeof postInclude }>;

/** Lo que ve el público: ni borradas, ni ocultas por moderación, ni de usuarios bloqueados */
const publicWhere = {
  deletedAt: null,
  status: { in: ['ACTIVA', 'RESUELTA'] },
  author: { status: 'ACTIVE' },
} satisfies Prisma.PostWhereInput;

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
    private readonly cities: CitiesService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  /** Un toque desde el perfil de la mascota: crea la PERDIDA y marca la mascota */
  async reportLost(user: AuthUser, petId: string, input: ReportLostData): Promise<PostResponse> {
    const pet = await this.prisma.pet.findFirst({
      where: { id: petId, ownerId: user.id, deletedAt: null },
    });
    if (!pet) throw new NotFoundException('Mascota no encontrada');
    await this.assertNeighborhood(user.cityId, input.neighborhoodId);

    const postId = await this.prisma.$transaction(async (tx) => {
      // Lock optimista: solo pasa de EN_CASA a PERDIDA una vez aunque lleguen dos requests juntos
      const flipped = await tx.pet.updateMany({
        where: { id: pet.id, status: 'EN_CASA' },
        data: { status: 'PERDIDA' },
      });
      if (!flipped.count) throw new ConflictException(`${pet.name} ya figura como perdida`);

      const post = await tx.post.create({
        data: {
          shortId: generateShortId(),
          type: 'PERDIDA',
          authorId: user.id,
          cityId: user.cityId,
          petId: pet.id,
          species: pet.species,
          sex: pet.sex,
          size: pet.size,
          color: pet.color,
          ...input,
          eventDate: new Date(input.eventDate),
        },
      });
      return post.id;
    });
    return this.getById(postId);
  }

  async create(user: AuthUser, input: CreatePostData): Promise<PostResponse> {
    await this.assertNeighborhood(user.cityId, input.neighborhoodId);
    const { mediaIds, type, ...fields } = input;

    const postId = await this.prisma.$transaction(async (tx) => {
      const base = {
        shortId: generateShortId(),
        authorId: user.id,
        cityId: user.cityId,
        species: fields.species,
        sex: fields.sex,
        size: fields.size,
        color: fields.color,
        neighborhoodId: fields.neighborhoodId,
        zoneText: fields.zoneText,
        description: fields.description,
        showPhone: fields.showPhone,
      };
      const post =
        type === 'ENCONTRADA'
          ? await tx.post.create({
              data: {
                ...base,
                type,
                eventDate: new Date((input as { eventDate: string }).eventDate),
              },
            })
          : await tx.post.create({
              data: {
                ...base,
                type,
                eventDate: new Date(),
                adoption: {
                  create: (input as Extract<CreatePostData, { type: 'ADOPCION' }>).adoption,
                },
              },
            });
      await this.media.setPhotos(tx, user.id, { postId: post.id }, mediaIds);
      return post.id;
    });
    return this.getById(postId);
  }

  async feed(query: FeedQuery & { limit: number }): Promise<FeedResponse> {
    const city = await this.cities.findActiveBySlug(query.city ?? this.env.DEFAULT_CITY_SLUG);
    const cursor = query.cursor ? decodeCursor(query.cursor) : null;

    const posts = await this.prisma.post.findMany({
      where: {
        ...publicWhere,
        status: 'ACTIVA',
        cityId: city.id,
        ...(query.type && { type: query.type }),
        ...(query.species && { species: query.species }),
        ...(query.neighborhoodId && { neighborhoodId: query.neighborhoodId }),
        ...(cursor && {
          OR: [
            { publishedAt: { lt: cursor.publishedAt } },
            { publishedAt: cursor.publishedAt, id: { lt: cursor.id } },
          ],
        }),
      },
      include: postInclude,
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
    });

    const page = posts.slice(0, query.limit);
    const last = page.at(-1);
    return {
      items: page.map((p) => this.toResponse(p)),
      nextCursor: posts.length > query.limit && last ? encodeCursor(last) : null,
    };
  }

  async getPublic(shortId: string): Promise<PostResponse> {
    const post = await this.prisma.post.findFirst({
      where: { ...publicWhere, shortId },
      include: postInclude,
    });
    if (!post) throw new NotFoundException('Publicación no encontrada');
    return this.toResponse(post);
  }

  async listMine(userId: string): Promise<PostResponse[]> {
    const posts = await this.prisma.post.findMany({
      where: { authorId: userId, deletedAt: null },
      include: postInclude,
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
    });
    return posts.map((p) => this.toResponse(p));
  }

  async update(user: AuthUser, postId: string, input: UpdatePostData): Promise<PostResponse> {
    const post = await this.findOwned(user.id, postId);
    if (post.status !== 'ACTIVA')
      throw new ConflictException('Solo se editan publicaciones activas');
    if (post.type === 'PERDIDA' && input.mediaIds) {
      throw new BadRequestException('Las fotos de una mascota perdida se cambian desde su perfil');
    }
    if (post.type !== 'ADOPCION' && input.adoption) {
      throw new BadRequestException('Solo las adopciones tienen esos datos');
    }
    if (input.neighborhoodId) await this.assertNeighborhood(user.cityId, input.neighborhoodId);

    const { mediaIds, adoption, eventDate, ...fields } = input;
    const removedKeys = await this.prisma.$transaction(async (tx) => {
      await tx.post.update({
        where: { id: post.id },
        data: {
          ...fields,
          // En adopción la fecha es la de publicación
          ...(eventDate && post.type !== 'ADOPCION' && { eventDate: new Date(eventDate) }),
          ...(adoption && {
            adoption: { upsert: { create: adoption, update: adoption } },
          }),
        },
      });
      return mediaIds ? this.media.setPhotos(tx, user.id, { postId: post.id }, mediaIds) : [];
    });
    await this.media.deleteObjectsQuietly(removedKeys);
    return this.getById(post.id);
  }

  async resolve(user: AuthUser, postId: string, input: ResolvePostInput): Promise<PostResponse> {
    const post = await this.findOwned(user.id, postId);
    if (post.status !== 'ACTIVA') throw new ConflictException('La publicación no está activa');

    await this.prisma.$transaction(async (tx) => {
      await tx.post.update({
        where: { id: post.id },
        data: { status: 'RESUELTA', resolution: input.resolution, resolvedAt: new Date() },
      });
      if (post.type === 'PERDIDA' && post.petId) {
        await tx.pet.update({ where: { id: post.petId }, data: { status: 'EN_CASA' } });
      }
    });
    return this.getById(post.id);
  }

  /** Borrado lógico; si era una PERDIDA activa, la mascota vuelve a EN_CASA */
  async remove(user: AuthUser, postId: string): Promise<void> {
    const post = await this.findOwned(user.id, postId);
    await this.prisma.$transaction(async (tx) => {
      await tx.post.update({ where: { id: post.id }, data: { deletedAt: new Date() } });
      if (post.type === 'PERDIDA' && post.status === 'ACTIVA' && post.petId) {
        await tx.pet.update({ where: { id: post.petId }, data: { status: 'EN_CASA' } });
      }
    });
  }

  /** El número solo sale por acá (con rate limit), nunca en el listado ni en el HTML */
  async contact(postId: string): Promise<ContactResponse> {
    const post = await this.prisma.post.findFirst({
      where: { ...publicWhere, status: 'ACTIVA', id: postId },
      include: postInclude,
    });
    if (!post) throw new NotFoundException('Publicación no encontrada');
    const phone = post.showPhone ? post.author.whatsapp : null;
    if (!phone) throw new NotFoundException('Quien publicó no dejó un WhatsApp');

    const url = `${this.env.PUBLIC_WEB_URL.replace(/\/$/, '')}/p/${post.shortId}`;
    const text = contactMessage(postTitle(this.toResponse(post)), post.type, url);
    return {
      whatsappUrl: `https://wa.me/${phone.replace('+', '')}?text=${encodeURIComponent(text)}`,
    };
  }

  private async getById(postId: string): Promise<PostResponse> {
    const post = await this.prisma.post.findUniqueOrThrow({
      where: { id: postId },
      include: postInclude,
    });
    return this.toResponse(post);
  }

  private async findOwned(userId: string, postId: string) {
    const post = await this.prisma.post.findFirst({
      where: { id: postId, authorId: userId, deletedAt: null },
    });
    if (!post) throw new NotFoundException('Publicación no encontrada');
    return post;
  }

  private async assertNeighborhood(cityId: string, neighborhoodId: string | null): Promise<void> {
    if (!neighborhoodId) return;
    const found = await this.prisma.neighborhood.count({ where: { id: neighborhoodId, cityId } });
    if (!found) throw new BadRequestException('El barrio no pertenece a tu ciudad');
  }

  private toResponse(post: PostWithRelations): PostResponse {
    // PERDIDA sin fotos propias: se muestran las del perfil de la mascota
    const photos = post.photos.length ? post.photos : (post.pet?.photos ?? []);
    const { author } = post;
    return {
      id: post.id,
      shortId: post.shortId,
      type: post.type,
      status: post.status,
      species: post.species,
      sex: post.sex,
      size: post.size,
      color: post.color,
      city: post.city,
      neighborhood: post.neighborhood,
      zoneText: post.zoneText,
      eventDate: post.eventDate.toISOString(),
      description: post.description,
      showPhone: post.showPhone,
      canContact: post.showPhone && !!author.whatsapp,
      photos: photos.map((m) => this.media.toResponse(m)),
      pet: post.pet && {
        id: post.pet.id,
        name: post.pet.name,
        breed: post.pet.breed,
        approxBirthDate: post.pet.approxBirthDate?.toISOString().slice(0, 10) ?? null,
        distinctiveMarks: post.pet.distinctiveMarks,
      },
      adoption: post.adoption && {
        approxAgeMonths: post.adoption.approxAgeMonths,
        neutered: post.adoption.neutered,
        vaccinated: post.adoption.vaccinated,
        dewormed: post.adoption.dewormed,
        requirements: post.adoption.requirements,
      },
      author: {
        id: author.id,
        name: author.name,
        avatarUrl: author.avatarMedia
          ? this.media.toResponse(author.avatarMedia).url
          : author.avatarUrl,
      },
      resolution: post.resolution,
      resolvedAt: post.resolvedAt?.toISOString() ?? null,
      publishedAt: post.publishedAt.toISOString(),
    };
  }
}
