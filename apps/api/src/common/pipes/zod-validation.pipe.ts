import { PipeTransform, ArgumentMetadata, BadRequestException, Injectable } from '@nestjs/common';
import { ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    if (metadata.type !== 'body') {
      return value;
    }

    const result = this.schema.safeParse(value);
    if (!result.success) {
      const errorMap: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path.join('.');
        if (field && !errorMap[field]) {
          errorMap[field] = err.message;
        }
      });

      const firstError = result.error.errors[0]?.message || 'Validation failed';
      throw new BadRequestException({
        statusCode: 400,
        message: firstError,
        errors: errorMap,
      });
    }
    return result.data;
  }
}
