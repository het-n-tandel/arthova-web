/**
 * Global App & Backend Configuration
 * Uses private server-side BACKEND_URL to prevent exposing backend endpoints to the browser.
 */
export const BACKEND_URL =
  process.env.BACKEND_URL?.replace(/\/$/, '') || 'http://localhost:8080';

export function getInternalApiSecret(): string {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) {
    throw new Error('INTERNAL_API_SECRET is not configured in server environment');
  }
  return secret;
}
