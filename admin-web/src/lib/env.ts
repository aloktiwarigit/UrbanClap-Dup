const PLACEHOLDER = 'local-dev-jwt-secret-placeholder-min32chars';

export function getValidatedJwtSecret(): string {
  const secret = process.env['JWT_SECRET'];
  if (!secret || secret.length < 32) {
    throw new Error('[env] JWT_SECRET is missing or too short (min 32 chars)');
  }
  if (secret === PLACEHOLDER) {
    throw new Error(
      '[env] JWT_SECRET is the local-dev placeholder — set a real secret in production',
    );
  }
  return secret;
}
