import { redirect } from 'next/navigation';

export function handleAdminFetchError(response: Response, label: string): never {
  if (response.status === 401) redirect('/login');
  if (response.status === 403) redirect('/not-authorized');

  throw new Error(`${label} failed with HTTP ${response.status}`);
}
