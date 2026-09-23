/**
 * Global App & Backend Configuration
 * Reads NEXT_PUBLIC_BACKEND_URL in production (Render) with fallback to http://localhost:8080 locally.
 */
export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, '') || 'http://localhost:8080';
