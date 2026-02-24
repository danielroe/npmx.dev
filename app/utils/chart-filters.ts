/**
 * Hampel filter: replaces outlier values with the local median.
 * Uses Median Absolute Deviation (MAD) to detect outliers.
 *
 * @param data - array of objects with a `value` property
 * @param windowSize - half-window size (0 = disabled)
 * @param threshold - number of MADs above which a value is considered an outlier
 * @returns a new array with outlier values replaced by the local median
 */
export function hampelFilter<T extends { value: number }>(
  data: T[],
  windowSize: number,
  threshold: number,
): T[] {
  if (windowSize <= 0 || data.length === 0) return data

  const result = data.map(d => ({ ...d }))
  const n = data.length

  for (let i = 0; i < n; i++) {
    const lo = Math.max(0, i - windowSize)
    const hi = Math.min(n - 1, i + windowSize)

    const windowValues: number[] = []
    for (let j = lo; j <= hi; j++) {
      windowValues.push(data[j]!.value)
    }
    windowValues.sort((a, b) => a - b)

    const median = windowValues[Math.floor(windowValues.length / 2)]!
    const deviations = windowValues.map(v => Math.abs(v - median)).sort((a, b) => a - b)
    const mad = deviations[Math.floor(deviations.length / 2)]!

    // 1.4826 converts MAD to an estimate of the standard deviation
    const scaledMad = 1.4826 * mad

    if (scaledMad > 0 && Math.abs(data[i]!.value - median) > threshold * scaledMad) {
      result[i]!.value = median
    }
  }

  return result
}

/**
 * Low-pass (exponential smoothing) filter.
 *
 * @param data - array of objects with a `value` property
 * @param tau - smoothing time constant (0 = disabled, higher = smoother)
 * @returns a new array with smoothed values
 */
export function lowPassFilter<T extends { value: number }>(data: T[], tau: number): T[] {
  if (tau <= 0 || data.length === 0) return data

  const result = data.map(d => ({ ...d }))
  const alpha = 1 / (1 + tau)

  result[0]!.value = data[0]!.value
  for (let i = 1; i < data.length; i++) {
    result[i]!.value = alpha * data[i]!.value + (1 - alpha) * result[i - 1]!.value
  }

  return result
}

export interface ChartFilterSettings {
  hampelWindow: number
  hampelThreshold: number
  smoothingTau: number
}

/**
 * Applies Hampel filter then low-pass smoothing in sequence.
 */
export function applyDownloadFilter<T extends { value: number }>(
  data: T[],
  settings: ChartFilterSettings,
): T[] {
  if (data.length < 2) return data

  const firstValue = data[0]!.value
  const lastValue = data[data.length - 1]!.value

  let result = data
  result = hampelFilter(result, settings.hampelWindow, settings.hampelThreshold)
  result = lowPassFilter(result, settings.smoothingTau)

  // Preserve original first and last values
  if (result !== data) {
    result[0]!.value = firstValue
    result[result.length - 1]!.value = lastValue
  }

  return result
}
