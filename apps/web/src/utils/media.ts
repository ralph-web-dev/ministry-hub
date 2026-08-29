/**
 * Resolves a media or image URL dynamically depending on whether
 * an API URL is configured in environment variables or relative to host.
 */
export function getMediaUrl(path: string | null | undefined): string {
  if (!path) return '';

  // If path is already a full URL or data URI, return as-is
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:') ||
    path.startsWith('blob:')
  ) {
    return path;
  }

  // Check for custom backend URL from environment
  const apiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '';

  if (apiUrl) {
    return `${apiUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  }

  // In development Vite proxy handles /uploads, in production relative path works on same-domain
  return path;
}
