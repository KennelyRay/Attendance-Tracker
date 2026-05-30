import type { SessionUser } from '@/lib/session';

export async function login(email: string, password: string): Promise<SessionUser> {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || 'Login failed');
  }
  return data.user as SessionUser;
}

