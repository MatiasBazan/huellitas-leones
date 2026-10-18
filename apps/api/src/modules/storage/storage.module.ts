import { Global, Module } from '@nestjs/common';
import { ENV, type Env } from '../../config/env.js';
import { LocalStorageService } from './local-storage.service.js';
import { R2StorageService } from './r2-storage.service.js';
import { StorageService } from './storage.service.js';

@Global()
@Module({
  providers: [
    LocalStorageService,
    {
      provide: StorageService,
      inject: [ENV, LocalStorageService],
      useFactory: (env: Env, local: LocalStorageService) =>
        env.STORAGE_DRIVER === 'r2' ? new R2StorageService(env) : local,
    },
  ],
  exports: [StorageService, LocalStorageService],
})
export class StorageModule {}
