import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import {
  presignMediaSchema,
  type MediaResponse,
  type PresignMediaInput,
  type PresignMediaResponse,
} from '@huellitas/shared';
import type { Request } from 'express';
import { CurrentUser, Public, type AuthUser } from '../../common/auth.decorators.js';
import { ZodValidationPipe } from '../../common/zod-validation.pipe.js';
import { LocalStorageService } from '../storage/local-storage.service.js';
import { StorageService } from '../storage/storage.service.js';
import { MediaService } from './media.service.js';

@Controller('media')
export class MediaController {
  constructor(
    private readonly media: MediaService,
    private readonly storage: StorageService,
    private readonly local: LocalStorageService,
  ) {}

  @Post('presign')
  presign(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(presignMediaSchema)) body: PresignMediaInput,
  ): Promise<PresignMediaResponse> {
    return this.media.presign(user, body);
  }

  @Post(':id/confirm')
  @HttpCode(200)
  confirm(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MediaResponse> {
    return this.media.confirm(user.id, id);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.media.remove(user.id, id);
  }

  /** Destino de las "URLs firmadas" del storage local. Con R2 no existe. */
  @Public()
  @Put('local-upload/:token')
  @HttpCode(200)
  async localUpload(@Param('token') token: string, @Req() req: Request): Promise<void> {
    if (this.storage !== this.local) throw new NotFoundException();
    const ok = await this.local.acceptUpload(token, req.headers['content-type'], req);
    if (!ok) throw new ForbiddenException('URL de subida inválida o vencida');
  }
}
