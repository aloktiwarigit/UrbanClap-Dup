import { describe, it, expect } from 'vitest';
import { z, ZodError } from 'zod';
import { parseBody, zodErrorToHttp } from '../src/shared/zod.js';

const SampleSchema = z.object({ name: z.string(), age: z.number() });

describe('parseBody', () => {
  it('parses valid input and returns the typed value', () => {
    const result = parseBody(SampleSchema, { name: 'Alok', age: 35 });
    expect(result).toEqual({ name: 'Alok', age: 35 });
  });

  it('throws ZodError on invalid input', () => {
    expect(() => parseBody(SampleSchema, { name: 'Alok', age: 'nope' })).toThrow(ZodError);
  });
});

describe('zodErrorToHttp', () => {
  it('converts a ZodError into a 400 response with ValidationError + issues[]', () => {
    try {
      parseBody(SampleSchema, { name: 123 });
      throw new Error('parseBody should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(ZodError);
      const resp = zodErrorToHttp(e as ZodError);
      expect(resp.status).toBe(400);
      expect(resp.body.error).toBe('ValidationError');
      expect(Array.isArray(resp.body.issues)).toBe(true);
      expect(resp.body.issues.length).toBeGreaterThan(0);
    }
  });
});
