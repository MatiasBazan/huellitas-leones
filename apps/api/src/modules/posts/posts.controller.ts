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
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  createPostSchema,
  feedQuerySchema,
  reportLostSchema,
  resolvePostSchema,
  updatePostSchema,
  type ContactResponse,
  type CreatePostData,
  type FeedResponse,
  type PostResponse,
  type ReportLostData,
  type ResolvePostInput,
  type UpdatePostData,
} from '@huellitas/shared';
import type { z } from 'zod';
import { CurrentUser, Public, type AuthUser } from '../../common/auth.decorators.js';
import { ZodValidationPipe } from '../../common/zod-validation.pipe.js';
import { PostsService } from './posts.service.js';

@Controller('posts')
export class PostsController {
  constructor(private readonly posts: PostsService) {}

  @Public()
  @Get()
  feed(
    @Query(new ZodValidationPipe(feedQuerySchema)) query: z.output<typeof feedQuerySchema>,
  ): Promise<FeedResponse> {
    return this.posts.feed(query);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createPostSchema)) body: CreatePostData,
  ): Promise<PostResponse> {
    return this.posts.create(user, body);
  }

  @Get('mine')
  listMine(@CurrentUser() user: AuthUser): Promise<PostResponse[]> {
    return this.posts.listMine(user.id);
  }

  @Public()
  @Get(':shortId')
  getPublic(@Param('shortId') shortId: string): Promise<PostResponse> {
    return this.posts.getPublic(shortId);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updatePostSchema)) body: UpdatePostData,
  ): Promise<PostResponse> {
    return this.posts.update(user, id, body);
  }

  @Post(':id/resolve')
  @HttpCode(200)
  resolve(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(resolvePostSchema)) body: ResolvePostInput,
  ): Promise<PostResponse> {
    return this.posts.resolve(user, id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.posts.remove(user, id);
  }

  /** Público (la web también contacta) pero con límite propio contra scraping de números */
  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Get(':id/contact')
  contact(@Param('id', ParseUUIDPipe) id: string): Promise<ContactResponse> {
    return this.posts.contact(id);
  }
}

@Controller('pets')
export class LostPetController {
  constructor(private readonly posts: PostsService) {}

  @Post(':id/report-lost')
  reportLost(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(reportLostSchema)) body: ReportLostData,
  ): Promise<PostResponse> {
    return this.posts.reportLost(user, id, body);
  }
}
