import { Module } from '@nestjs/common';
import { CitiesModule } from '../cities/cities.module.js';
import { MediaModule } from '../media/media.module.js';
import { LostPetController, PostsController } from './posts.controller.js';
import { PostsService } from './posts.service.js';

@Module({
  imports: [MediaModule, CitiesModule],
  controllers: [PostsController, LostPetController],
  providers: [PostsService],
})
export class PostsModule {}
