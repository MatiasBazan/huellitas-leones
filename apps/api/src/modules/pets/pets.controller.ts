import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  createPetSchema,
  updatePetSchema,
  type CreatePetData,
  type PetResponse,
  type UpdatePetData,
} from '@huellitas/shared';
import { CurrentUser, type AuthUser } from '../../common/auth.decorators.js';
import { ZodValidationPipe } from '../../common/zod-validation.pipe.js';
import { PetsService } from './pets.service.js';

@Controller('pets')
export class PetsController {
  constructor(private readonly pets: PetsService) {}

  @Get('mine')
  listMine(@CurrentUser() user: AuthUser): Promise<PetResponse[]> {
    return this.pets.listMine(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createPetSchema)) body: CreatePetData,
  ): Promise<PetResponse> {
    return this.pets.create(user.id, body);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string): Promise<PetResponse> {
    return this.pets.get(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updatePetSchema)) body: UpdatePetData,
  ): Promise<PetResponse> {
    return this.pets.update(user.id, id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.pets.remove(user.id, id);
  }
}
