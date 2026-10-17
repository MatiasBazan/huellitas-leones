import { Module } from '@nestjs/common';
import { CitiesModule } from '../cities/cities.module.js';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { GoogleVerifierService } from './google-verifier.service.js';
import { TokenService } from './token.service.js';

@Module({
  imports: [UsersModule, CitiesModule],
  controllers: [AuthController],
  providers: [AuthService, TokenService, GoogleVerifierService],
  exports: [TokenService],
})
export class AuthModule {}
