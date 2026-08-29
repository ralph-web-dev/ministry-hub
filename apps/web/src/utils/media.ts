/**
 * Resolves a media or image URL dynamically depending on whether
 * an API URL is configured in environment variables or relative to host.
 */
export function getMediaUrl(path: string | null | undefined): string {
  if (!path) return '';

  // If path is already a full URL or data/blob URI, return as-is
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:') ||
    path.startsWith('blob:')
  ) {
    return path;
  }

  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // If VITE_API_URL is configured with full protocol, extract origin
  const rawApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') || '';
  if (rawApiUrl && (rawApiUrl.startsWith('http://') || rawApiUrl.startsWith('https://'))) {
    try {
      const urlObj = new URL(rawApiUrl);
      return `${urlObj.origin}${cleanPath}`;
    } catch {
      const hostOnly = rawApiUrl.replace(/\/api(\/v\d+)?$/, '');
      return `${hostOnly}${cleanPath}`;
    }
  }

  // Relative path works with Nginx reverse proxy in production and Vite proxy in dev
  return cleanPath;
}
