function median(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!
}

/**
 * IQR-based outlier filter.
 *
 * 1. Compute Q1, Q3, IQR across all values globally
 * 2. Flag any point outside [Q1 - k×IQR, Q3 + k×IQR] as an outlier
 * 3. Replace each outlier with the median of its non-outlier local neighbors
 *
 * This handles sustained anomalies (multi-week spikes) regardless of
 * their position in the dataset — including at boundaries.
 *
 * @param data - array of objects with a `value` property
 * @param multiplier - IQR multiplier k (0 = disabled, standard: 1.5, less aggressive: 3)
 * @param windowSize - half-window for local median replacement (default: 6)
 */
export function iqrFilter<T extends { value: number }>(
  data: T[],
  multiplier: number,
  windowSize: number = 6,
): T[] {
  if (multiplier <= 0 || data.length < 4) return data

  const sorted = data.map(d => d.value).sort((a, b) => a - b)
  const q1 = median(sorted.slice(0, Math.floor(sorted.length / 2)))
  const q3 = median(sorted.slice(Math.ceil(sorted.length / 2)))
  const iqr = q3 - q1

  if (iqr <= 0) return data

  const lowerBound = q1 - multiplier * iqr
  const upperBound = q3 + multiplier * iqr

  const isOutlier = data.map(d => d.value < lowerBound || d.value > upperBound)
  if (!isOutlier.some(Boolean)) return data

  const result = data.map(d => ({ ...d }))
  const n = data.length

  for (let i = 1; i < n - 1; i++) {
    if (!isOutlier[i]) continue

    // Collect non-outlier neighbors within the window
    const lo = Math.max(0, i - windowSize)
    const hi = Math.min(n - 1, i + windowSize)
    const neighbors: number[] = []
    for (let j = lo; j <= hi; j++) {
      if (!isOutlier[j]) neighbors.push(data[j]!.value)
    }

    if (neighbors.length > 0) {
      neighbors.sort((a, b) => a - b)
      result[i]!.value = median(neighbors)
    }
  }

  return result
}

export interface ChartFilterSettings {
  iqrMultiplier: number
}

/**
 * Applies IQR-based outlier filter to download data.
 */
export function applyDownloadFilter<T extends { value: number }>(
  data: T[],
  settings: ChartFilterSettings,
): T[] {
  return iqrFilter(data, settings.iqrMultiplier)
}
