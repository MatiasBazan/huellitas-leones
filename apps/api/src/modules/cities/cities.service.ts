import { Injectable, NotFoundException } from '@nestjs/common';
import type { CityResponse, NeighborhoodResponse } from '@huellitas/shared';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class CitiesService {
  constructor(private readonly prisma: PrismaService) {}

  listActive(): Promise<CityResponse[]> {
    return this.prisma.city.findMany({
      where: { isActive: true },
      select: { id: true, slug: true, name: true, province: true },
      orderBy: { name: 'asc' },
    });
  }

  async listNeighborhoods(citySlug: string): Promise<NeighborhoodResponse[]> {
    const city = await this.findActiveBySlug(citySlug);
    return this.prisma.neighborhood.findMany({
      where: { cityId: city.id },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  async findActiveBySlug(slug: string): Promise<{ id: string }> {
    const city = await this.prisma.city.findFirst({
      where: { slug, isActive: true },
      select: { id: true },
    });
    if (!city) throw new NotFoundException('Ciudad no encontrada');
    return city;
  }
}
