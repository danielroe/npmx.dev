/**
 * Format a byte value into a human-readable string.
 * Supports bytes, kilobytes (kB), and megabytes (MB).
 *
 * @param bytes - The byte value to format
 * @returns A formatted string like "1.5 MB" or "1024 B"
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
