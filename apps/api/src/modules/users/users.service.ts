import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { MeResponse, UpdateMeInput } from '@huellitas/shared';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

const meInclude = {
  city: { select: { id: true, slug: true, name: true } },
  neighborhood: { select: { id: true, name: true } },
} satisfies Prisma.UserInclude;

type UserWithRelations = Prisma.UserGetPayload<{ include: typeof meInclude }>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string): Promise<MeResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: meInclude });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return this.toMe(user);
  }

  async updateMe(userId: string, input: UpdateMeInput): Promise<MeResponse> {
    if (input.neighborhoodId) {
      const user = await this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { cityId: true },
      });
      const neighborhood = await this.prisma.neighborhood.findFirst({
        where: { id: input.neighborhoodId, cityId: user.cityId },
        select: { id: true },
      });
      if (!neighborhood) throw new BadRequestException('El barrio no pertenece a tu ciudad');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: input,
      include: meInclude,
    });
    return this.toMe(updated);
  }

  toMe(user: UserWithRelations): MeResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      whatsapp: user.whatsapp,
      role: user.role,
      status: user.status,
      notifyLostPets: user.notifyLostPets,
      city: user.city,
      neighborhood: user.neighborhood,
      profileIncomplete: !user.neighborhoodId,
      createdAt: user.createdAt.toISOString(),
    };
  }

  findByIdWithRelations(userId: string): Promise<UserWithRelations> {
    return this.prisma.user.findUniqueOrThrow({ where: { id: userId }, include: meInclude });
  }
}
