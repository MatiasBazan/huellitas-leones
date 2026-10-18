import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module.js';
import { PetsController } from './pets.controller.js';
import { PetsService } from './pets.service.js';

@Module({
  imports: [MediaModule],
  controllers: [PetsController],
  providers: [PetsService],
})
export class PetsModule {}
