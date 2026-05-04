const LOCAL_API_BASE_URL = 'http://localhost:7071/api';
const PROD_API_BASE_URL = 'https://func-homeservices-prod.azurewebsites.net/api';

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

export function getDefaultApiBaseUrl(nodeEnv: string | undefined = process.env['NODE_ENV']): string {
  return nodeEnv === 'production' ? PROD_API_BASE_URL : LOCAL_API_BASE_URL;
}

export function getApiBaseUrl(
  env: Record<string, string | undefined> = process.env,
): string {
  return trimTrailingSlash(env['API_BASE_URL'] ?? getDefaultApiBaseUrl(env['NODE_ENV']));
}
