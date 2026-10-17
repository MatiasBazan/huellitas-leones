import { Controller, Get, Param } from '@nestjs/common';
import type { CityResponse, NeighborhoodResponse } from '@huellitas/shared';
import { Public } from '../../common/auth.decorators.js';
import { CitiesService } from './cities.service.js';

@Public()
@Controller('cities')
export class CitiesController {
  constructor(private readonly cities: CitiesService) {}

  @Get()
  list(): Promise<CityResponse[]> {
    return this.cities.listActive();
  }

  @Get(':slug/neighborhoods')
  neighborhoods(@Param('slug') slug: string): Promise<NeighborhoodResponse[]> {
    return this.cities.listNeighborhoods(slug);
  }
}
