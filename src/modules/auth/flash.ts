'use client';

export type AuthFlash =
  | { type: 'login-success' }
  | { type: 'logout-success' }
  | { type: 'session-expired' };

const AUTH_FLASH_STORAGE_KEY = 'attendance-tracker:auth-flash';

export function setAuthFlash(flash: AuthFlash) {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(AUTH_FLASH_STORAGE_KEY, JSON.stringify(flash));
}

export function consumeAuthFlash(): AuthFlash | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawValue = window.sessionStorage.getItem(AUTH_FLASH_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  window.sessionStorage.removeItem(AUTH_FLASH_STORAGE_KEY);

  try {
    const parsed = JSON.parse(rawValue) as Partial<AuthFlash>;
    if (
      parsed &&
      (parsed.type === 'login-success' ||
        parsed.type === 'logout-success' ||
        parsed.type === 'session-expired')
    ) {
      return parsed as AuthFlash;
    }
  } catch {
    return null;
  }

  return null;
}
