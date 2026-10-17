import { BadRequestException, PipeTransform } from '@nestjs/common';
import type { ApiError } from '@huellitas/shared';
import type { z } from 'zod';

/** Uso: `@Body(new ZodValidationPipe(schema)) body: Input` */
export class ZodValidationPipe<T extends z.ZodType> implements PipeTransform<unknown, z.output<T>> {
  constructor(private readonly schema: T) {}

  transform(value: unknown): z.output<T> {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const body: ApiError = {
        statusCode: 400,
        message: 'Datos inválidos',
        issues: result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      };
      throw new BadRequestException(body);
    }
    return result.data;
  }
}
