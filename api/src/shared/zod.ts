import type { ZodError, ZodSchema } from 'zod';

export function parseBody<T>(schema: ZodSchema<T>, raw: unknown): T {
  return schema.parse(raw);
}

export interface ValidationErrorResponse {
  status: 400;
  body: {
    error: 'ValidationError';
    issues: ReadonlyArray<{
      path: ReadonlyArray<string | number>;
      message: string;
      code: string;
    }>;
  };
}

export function zodErrorToHttp(err: ZodError): ValidationErrorResponse {
  return {
    status: 400,
    body: {
      error: 'ValidationError',
      issues: err.issues.map((i) => ({
        path: i.path,
        message: i.message,
        code: i.code,
      })),
    },
  };
}
