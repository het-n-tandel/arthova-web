/**
 * Global App & Backend Configuration
 * Uses private server-side BACKEND_URL to prevent exposing backend endpoints to the browser.
 */
export const BACKEND_URL =
  process.env.BACKEND_URL?.replace(/\/$/, '') ||
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, '') ||
  'http://localhost:8080';
