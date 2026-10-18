import { Injectable, NotFoundException } from '@nestjs/common';
import type { CreatePetData, PetResponse, UpdatePetData } from '@huellitas/shared';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { MediaService } from '../media/media.service.js';

const petInclude = {
  photos: {
    orderBy: { position: 'asc' },
    select: { id: true, key: true, width: true, height: true },
  },
  posts: {
    where: { type: 'PERDIDA', status: 'ACTIVA', deletedAt: null },
    select: { id: true, shortId: true },
    take: 1,
  },
} satisfies Prisma.PetInclude;

type PetWithPhotos = Prisma.PetGetPayload<{ include: typeof petInclude }>;

const toDate = (d: string | null | undefined) => (d === undefined ? undefined : d && new Date(d));

@Injectable()
export class PetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
  ) {}

  async listMine(userId: string): Promise<PetResponse[]> {
    const pets = await this.prisma.pet.findMany({
      where: { ownerId: userId, deletedAt: null },
      include: petInclude,
      orderBy: { createdAt: 'desc' },
    });
    return pets.map((p) => this.toResponse(p));
  }

  async get(userId: string, petId: string): Promise<PetResponse> {
    return this.toResponse(await this.findOwned(userId, petId));
  }

  async create(userId: string, input: CreatePetData): Promise<PetResponse> {
    const { mediaIds, approxBirthDate, ...fields } = input;
    const petId = await this.prisma.$transaction(async (tx) => {
      const pet = await tx.pet.create({
        data: { ...fields, approxBirthDate: toDate(approxBirthDate), ownerId: userId },
      });
      await this.media.setPhotos(tx, userId, { petId: pet.id }, mediaIds);
      return pet.id;
    });
    return this.get(userId, petId);
  }

  async update(userId: string, petId: string, input: UpdatePetData): Promise<PetResponse> {
    await this.findOwned(userId, petId);
    const { mediaIds, approxBirthDate, ...fields } = input;
    const removedKeys = await this.prisma.$transaction(async (tx) => {
      await tx.pet.update({
        where: { id: petId },
        data: { ...fields, approxBirthDate: toDate(approxBirthDate) },
      });
      return mediaIds ? this.media.setPhotos(tx, userId, { petId }, mediaIds) : [];
    });
    await this.media.deleteObjectsQuietly(removedKeys);
    return this.get(userId, petId);
  }

  /** Borrado lógico: las publicaciones y la moderación pueden seguir referenciándola */
  async remove(userId: string, petId: string): Promise<void> {
    await this.findOwned(userId, petId);
    await this.prisma.pet.update({ where: { id: petId }, data: { deletedAt: new Date() } });
  }

  private async findOwned(userId: string, petId: string): Promise<PetWithPhotos> {
    const pet = await this.prisma.pet.findFirst({
      where: { id: petId, ownerId: userId, deletedAt: null },
      include: petInclude,
    });
    if (!pet) throw new NotFoundException('Mascota no encontrada');
    return pet;
  }

  private toResponse(pet: PetWithPhotos): PetResponse {
    return {
      id: pet.id,
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      color: pet.color,
      sex: pet.sex,
      size: pet.size,
      approxBirthDate: pet.approxBirthDate?.toISOString().slice(0, 10) ?? null,
      distinctiveMarks: pet.distinctiveMarks,
      status: pet.status,
      photos: pet.photos.map((m) => this.media.toResponse(m)),
      activeLostPost: pet.posts[0] ?? null,
      createdAt: pet.createdAt.toISOString(),
      updatedAt: pet.updatedAt.toISOString(),
    };
  }
}
