/** Dispatched when an API call returns 401 while the client sent a Bearer token (expired / invalid session). */
export const FARMHOUSE_SESSION_UNAUTHORIZED = 'farmhouse:session-unauthorized';

export function emitSessionUnauthorized(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(FARMHOUSE_SESSION_UNAUTHORIZED));
}
