import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { ApiError } from '@huellitas/shared';
import type { Response } from 'express';
import { Prisma } from '../generated/prisma/client.js';

/** Traduce errores conocidos de Prisma a respuestas HTTP en vez de 500 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(err: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    const map: Record<string, [number, string]> = {
      P2002: [HttpStatus.CONFLICT, 'Ya existe un registro con esos datos'],
      P2025: [HttpStatus.NOT_FOUND, 'No encontrado'],
      P2003: [HttpStatus.BAD_REQUEST, 'Referencia inválida'],
    };
    const [statusCode, message] = map[err.code] ?? [
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Error interno',
    ];
    const body: ApiError = { statusCode, message };
    res.status(statusCode).json(body);
  }
}
