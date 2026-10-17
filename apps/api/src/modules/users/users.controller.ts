import { Body, Controller, Get, Patch } from '@nestjs/common';
import { updateMeSchema, type MeResponse, type UpdateMeInput } from '@huellitas/shared';
import { CurrentUser, type AuthUser } from '../../common/auth.decorators.js';
import { ZodValidationPipe } from '../../common/zod-validation.pipe.js';
import { UsersService } from './users.service.js';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: AuthUser): Promise<MeResponse> {
    return this.users.getMe(user.id);
  }

  @Patch('me')
  updateMe(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(updateMeSchema)) body: UpdateMeInput,
  ): Promise<MeResponse> {
    return this.users.updateMe(user.id, body);
  }
}
