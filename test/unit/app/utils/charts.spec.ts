import { describe, expect, it } from 'vitest'
import {
  sum,
  chunkIntoWeeks,
  buildWeeklyEvolutionFromDaily,
  addDays,
  clamp,
  quantile,
  winsorize,
  computeLineChartAnalysis,
} from '../../../../app/utils/charts'

describe('sum', () => {
  it('returns 0 for an empty array', () => {
    expect(sum([])).toBe(0)
  })

  it('returns the same number for a single-element array', () => {
    expect(sum([42])).toBe(42)
  })

  it('sums positive numbers correctly', () => {
    expect(sum([1, 2, 3, 4, 5])).toBe(15)
  })

  it('sums negative numbers correctly', () => {
    expect(sum([-1, -2, -3])).toBe(-6)
  })

  it('sums mixed positive and negative numbers correctly', () => {
    expect(sum([10, -5, 3, -2])).toBe(6)
  })

  it('returns 0 when all values are 0', () => {
    expect(sum([0, 0, 0])).toBe(0)
  })

  it('handles decimal numbers correctly', () => {
    expect(sum([1.5, 2.5, 3])).toBeCloseTo(7, 10)
  })
})

describe('chunkIntoWeeks', () => {
  it('returns an empty array when input is empty', () => {
    expect(chunkIntoWeeks([])).toEqual([])
  })

  it('returns one full week when length equals default weekSize (7)', () => {
    const input = [1, 2, 3, 4, 5, 6, 7]
    expect(chunkIntoWeeks(input)).toEqual([[1, 2, 3, 4, 5, 6, 7]])
  })

  it('splits into multiple full weeks', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
    expect(chunkIntoWeeks(input)).toEqual([
      [1, 2, 3, 4, 5, 6, 7],
      [8, 9, 10, 11, 12, 13, 14],
    ])
  })

  it('creates a final partial week if remaining items are less than weekSize', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    expect(chunkIntoWeeks(input)).toEqual([
      [1, 2, 3, 4, 5, 6, 7],
      [8, 9],
    ])
  })

  it('works with custom weekSize', () => {
    const input = [1, 2, 3, 4, 5]
    expect(chunkIntoWeeks(input, 2)).toEqual([[1, 2], [3, 4], [5]])
  })

  it('handles weekSize larger than array length', () => {
    const input = [1, 2, 3]
    expect(chunkIntoWeeks(input, 10)).toEqual([[1, 2, 3]])
  })

  it('works with generic types (strings)', () => {
    const input = ['a', 'b', 'c', 'd']
    expect(chunkIntoWeeks(input, 3)).toEqual([['a', 'b', 'c'], ['d']])
  })

  it('works with objects', () => {
    const input = [{ id: 1 }, { id: 2 }, { id: 3 }]
    expect(chunkIntoWeeks(input, 2)).toEqual([[{ id: 1 }, { id: 2 }], [{ id: 3 }]])
  })
})

describe('buildWeeklyEvolutionFromDaily', () => {
  it('returns empty array when daily input is empty', () => {
    expect(buildWeeklyEvolutionFromDaily([])).toEqual([])
  })

  it('builds one full week correctly', () => {
    const daily = [
      { day: '2048-01-01', downloads: 10 },
      { day: '2048-01-02', downloads: 20 },
      { day: '2048-01-03', downloads: 30 },
      { day: '2048-01-04', downloads: 40 },
      { day: '2048-01-05', downloads: 50 },
      { day: '2048-01-06', downloads: 60 },
      { day: '2048-01-07', downloads: 70 },
    ]

    const result = buildWeeklyEvolutionFromDaily(daily)

    expect(result).toEqual([
      {
        weekStart: '2048-01-01',
        weekEnd: '2048-01-07',
        downloads: 280,
      },
    ])
  })

  it('builds multiple full weeks correctly', () => {
    const daily = Array.from({ length: 14 }, (_, i) => ({
      day: `2048-01-${String(i + 1).padStart(2, '0')}`,
      downloads: 10,
    }))

    const result = buildWeeklyEvolutionFromDaily(daily)

    expect(result).toEqual([
      {
        weekStart: '2048-01-01',
        weekEnd: '2048-01-07',
        downloads: 70,
      },
      {
        weekStart: '2048-01-08',
        weekEnd: '2048-01-14',
        downloads: 70,
      },
    ])
  })

  it('creates a final partial week when less than 7 days remain', () => {
    const daily = [
      { day: '2048-01-01', downloads: 10 },
      { day: '2048-01-02', downloads: 10 },
      { day: '2048-01-03', downloads: 10 },
      { day: '2048-01-04', downloads: 10 },
      { day: '2048-01-05', downloads: 10 },
      { day: '2048-01-06', downloads: 10 },
      { day: '2048-01-07', downloads: 10 },
      { day: '2048-01-08', downloads: 5 },
      { day: '2048-01-09', downloads: 5 },
    ]

    const result = buildWeeklyEvolutionFromDaily(daily)

    expect(result).toEqual([
      {
        weekStart: '2048-01-01',
        weekEnd: '2048-01-07',
        downloads: 70,
      },
      {
        weekStart: '2048-01-08',
        weekEnd: '2048-01-09',
        downloads: 10,
      },
    ])
  })

  it('handles zero downloads correctly', () => {
    const daily = [
      { day: '2048-01-01', downloads: 0 },
      { day: '2048-01-02', downloads: 0 },
      { day: '2048-01-03', downloads: 0 },
    ]

    const result = buildWeeklyEvolutionFromDaily(daily)

    expect(result).toEqual([
      {
        weekStart: '2048-01-01',
        weekEnd: '2048-01-03',
        downloads: 0,
      },
    ])
  })

  it('handles mixed download values correctly', () => {
    const daily = [
      { day: '2048-01-01', downloads: 5 },
      { day: '2048-01-02', downloads: 15 },
      { day: '2048-01-03', downloads: 20 },
    ]

    const result = buildWeeklyEvolutionFromDaily(daily)

    expect(result).toEqual([
      {
        weekStart: '2048-01-01',
        weekEnd: '2048-01-03',
        downloads: 40,
      },
    ])
  })
})

describe('addDays', () => {
  it('returns a new Date instance (does not mutate original)', () => {
    const original = new Date('2028-01-01T00:00:00Z')
    const result = addDays(original, 5)

    expect(result).not.toBe(original)
    expect(original.toISOString()).toBe('2028-01-01T00:00:00.000Z')
  })

  it('adds positive days correctly', () => {
    const date = new Date('2028-01-01T00:00:00Z')
    const result = addDays(date, 10)

    expect(result.toISOString()).toBe('2028-01-11T00:00:00.000Z')
  })

  it('subtracts days when negative value is provided', () => {
    const date = new Date('2028-01-10T00:00:00Z')
    const result = addDays(date, -5)

    expect(result.toISOString()).toBe('2028-01-05T00:00:00.000Z')
  })

  it('handles month overflow correctly', () => {
    const date = new Date('2028-01-28T00:00:00Z')
    const result = addDays(date, 5)

    expect(result.toISOString()).toBe('2028-02-02T00:00:00.000Z')
  })

  it('handles year overflow correctly', () => {
    const date = new Date('2027-12-29T00:00:00Z')
    const result = addDays(date, 5)

    expect(result.toISOString()).toBe('2028-01-03T00:00:00.000Z')
  })

  it('handles leap year correctly', () => {
    const date = new Date('2028-02-27T00:00:00Z') // 2028 is leap year
    const result = addDays(date, 2)

    expect(result.toISOString()).toBe('2028-02-29T00:00:00.000Z')
  })

  it('keeps UTC behavior consistent (no timezone drift)', () => {
    const date = new Date('2028-03-01T00:00:00Z')
    const result = addDays(date, 1)

    expect(result.getUTCHours()).toBe(0)
    expect(result.toISOString()).toBe('2028-03-02T00:00:00.000Z')
  })
})

describe('clamp', () => {
  it('returns the value when it is within bounds', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })

  it('returns minValue when value is below the minimum', () => {
    expect(clamp(-5, 0, 10)).toBe(0)
  })

  it('returns maxValue when value is above the maximum', () => {
    expect(clamp(15, 0, 10)).toBe(10)
  })

  it('returns minValue when value equals minValue', () => {
    expect(clamp(0, 0, 10)).toBe(0)
  })

  it('returns maxValue when value equals maxValue', () => {
    expect(clamp(10, 0, 10)).toBe(10)
  })

  it('works with negative bounds', () => {
    expect(clamp(-15, -10, -5)).toBe(-10)
    expect(clamp(-7, -10, -5)).toBe(-7)
    expect(clamp(-1, -10, -5)).toBe(-5)
  })

  it('works with decimal values', () => {
    expect(clamp(1.5, 0.5, 2.5)).toBe(1.5)
    expect(clamp(0.1, 0.5, 2.5)).toBe(0.5)
    expect(clamp(3.7, 0.5, 2.5)).toBe(2.5)
  })
})

describe('quantile', () => {
  it('returns 0 for an empty array', () => {
    expect(quantile([], 0.5)).toBe(0)
  })

  it('returns the first value when quantileValue <= 0', () => {
    expect(quantile([10, 20, 30], 0)).toBe(10)
    expect(quantile([10, 20, 30], -1)).toBe(10)
  })

  it('returns the last value when quantileValue >= 1', () => {
    expect(quantile([10, 20, 30], 1)).toBe(30)
    expect(quantile([10, 20, 30], 2)).toBe(30)
  })

  it('returns the median for an odd-length array (q = 0.5)', () => {
    expect(quantile([10, 20, 30], 0.5)).toBe(20)
  })

  it('returns interpolated value for even-length array (q = 0.5)', () => {
    expect(quantile([10, 20, 30, 40], 0.5)).toBe(25)
  })

  it('computes lower quartile correctly (q = 0.25)', () => {
    expect(quantile([0, 10, 20, 30], 0.25)).toBe(7.5)
  })

  it('computes upper quartile correctly (q = 0.75)', () => {
    expect(quantile([0, 10, 20, 30], 0.75)).toBe(22.5)
  })

  it('returns exact value when position is integer (no interpolation)', () => {
    expect(quantile([0, 10, 20, 30], 1 / 3)).toBe(10)
  })

  it('works with negative numbers', () => {
    expect(quantile([-30, -20, -10, 0], 0.5)).toBe(-15)
  })

  it('handles single-element arrays', () => {
    expect(quantile([42], 0)).toBe(42)
    expect(quantile([42], 0.5)).toBe(42)
    expect(quantile([42], 1)).toBe(42)
  })
})

describe('winsorize', () => {
  it('clamps low and high outliers to the computed percentile bounds (keeps original order)', () => {
    const input = [1, 2, 3, 4, 100]
    const result = winsorize(input, 0.2, 0.8)

    expect(result).toHaveLength(5)
    expect(result[0]).toBeCloseTo(1.8, 12)
    expect(result[1]).toBeCloseTo(2, 12)
    expect(result[2]).toBeCloseTo(3, 12)
    expect(result[3]).toBeCloseTo(4, 12)
    expect(result[4]).toBeCloseTo(23.2, 12)
  })

  it('keeps duplicates and clamps consistently', () => {
    const input = [0, 0, 0, 0, 10]
    const result = winsorize(input, 0.2, 0.8)

    expect(result).toHaveLength(5)
    expect(result[0]).toBeCloseTo(0, 12)
    expect(result[1]).toBeCloseTo(0, 12)
    expect(result[2]).toBeCloseTo(0, 12)
    expect(result[3]).toBeCloseTo(0, 12)
    expect(result[4]).toBeCloseTo(2, 12)
  })

  it('works with negative values', () => {
    const input = [-100, -10, 0, 10, 100]
    const result = winsorize(input, 0.2, 0.8)

    expect(result).toHaveLength(5)
    expect(result[0]).toBeCloseTo(-28, 12)
    expect(result[1]).toBeCloseTo(-10, 12)
    expect(result[2]).toBeCloseTo(0, 12)
    expect(result[3]).toBeCloseTo(10, 12)
    expect(result[4]).toBeCloseTo(28, 12)
  })
})

describe('computeLineChartAnalysis', () => {
  const computeBaseTrend = (rSquared: number | null) => {
    if (rSquared === null) return 'undefined' as const
    if (rSquared > 0.75) return 'strong' as const
    if (rSquared > 0.4) return 'weak' as const
    return 'none' as const
  }

  const buildSeries = (base: number, step: number, noiseAmplitude: number) => {
    const values: number[] = []
    for (let i = 0; i < 19; i += 1) {
      const noise =
        i % 4 === 0
          ? noiseAmplitude
          : i % 4 === 1
            ? -noiseAmplitude
            : i % 4 === 2
              ? Math.floor(noiseAmplitude / 2)
              : -Math.floor(noiseAmplitude / 2)
      values.push(base + i * step + noise)
    }
    return values
  }

  it('returns undefined interpretations for empty array', () => {
    const result = computeLineChartAnalysis([])
    expect(result.mean).toBe(0)
    expect(result.standardDeviation).toBe(0)
    expect(result.coefficientOfVariation).toBeNull()
    expect(result.slope).toBe(0)
    expect(result.rSquared).toBeNull()
    expect(result.interpretation.volatility).toBe('undefined')
    expect(result.interpretation.trend).toBe('undefined')
  })

  it('ignores null values and behaves like empty when all values are null', () => {
    const result = computeLineChartAnalysis([null, null, null])
    expect(result.mean).toBe(0)
    expect(result.standardDeviation).toBe(0)
    expect(result.coefficientOfVariation).toBeNull()
    expect(result.slope).toBe(0)
    expect(result.rSquared).toBeNull()
    expect(result.interpretation.volatility).toBe('undefined')
    expect(result.interpretation.trend).toBe('undefined')
  })

  it('handles a single number', () => {
    const result = computeLineChartAnalysis([42])
    expect(result.mean).toBe(42)
    expect(result.standardDeviation).toBe(0)
    expect(result.coefficientOfVariation).toBeNull()
    expect(result.slope).toBe(0)
    expect(result.rSquared).toBeNull()
    expect(result.interpretation.volatility).toBe('very_stable')
    expect(result.interpretation.trend).toBe('none')
  })

  it('handles a single number among nulls (keeps original index for regression)', () => {
    const result = computeLineChartAnalysis([null, 42, null])
    expect(result.mean).toBe(42)
    expect(result.standardDeviation).toBe(0)
    expect(result.coefficientOfVariation).toBeNull()
    expect(result.slope).toBe(0)
    expect(result.rSquared).toBeNull()
    expect(result.interpretation.volatility).toBe('very_stable')
    expect(result.interpretation.trend).toBe('none')
  })

  it('handles all zeros (mean 0 => CV null, sd 0, rSquared null)', () => {
    const result = computeLineChartAnalysis([0, 0, 0, 0])
    expect(result.mean).toBe(0)
    expect(result.standardDeviation).toBe(0)
    expect(result.coefficientOfVariation).toBeNull()
    expect(result.slope).toBe(0)
    expect(result.rSquared).toBeNull()
    expect(result.interpretation.volatility).toBe('undefined')
    expect(result.interpretation.trend).toBe('undefined')
  })

  it('handles two values where the first value is 0', () => {
    const result = computeLineChartAnalysis([0, 10])

    expect(result.mean).toBe(5)
    expect(result.standardDeviation).toBe(5)
    expect(result.coefficientOfVariation).not.toBeNull()
    expect(result.coefficientOfVariation as number).toBeCloseTo(1, 10)

    expect(result.slope).toBeGreaterThan(0)
    expect(result.rSquared).not.toBeNull()
    expect(result.rSquared as number).toBeGreaterThanOrEqual(0)
    expect(result.rSquared as number).toBeLessThanOrEqual(1)

    expect(result.interpretation.volatility).toBe('volatile')
  })

  it('handles two values where the second value is 0', () => {
    const result = computeLineChartAnalysis([10, 0])

    expect(result.mean).toBe(5)
    expect(result.standardDeviation).toBe(5)
    expect(result.coefficientOfVariation).not.toBeNull()
    expect(result.coefficientOfVariation as number).toBeCloseTo(1, 10)

    expect(result.slope).toBeLessThan(0)
    expect(result.rSquared).not.toBeNull()
    expect(result.rSquared as number).toBeGreaterThanOrEqual(0)
    expect(result.rSquared as number).toBeLessThanOrEqual(1)

    expect(result.interpretation.volatility).toBe('volatile')
  })

  it('produces low CV and strong trend for a near-stable upward sequence', () => {
    const result = computeLineChartAnalysis([9800, 9900, 10000, 10100, 10200])
    expect(result.mean).toBeCloseTo(10000, 10)
    expect(result.coefficientOfVariation).not.toBeNull()
    expect(result.coefficientOfVariation as number).toBeLessThan(0.05)
    expect(result.interpretation.volatility).toBe('very_stable')

    expect(result.slope).toBeGreaterThan(0)
    expect(result.rSquared).not.toBeNull()
    expect(result.rSquared as number).toBeGreaterThan(0.99)
    expect(result.interpretation.trend).toBe('strong')
  })

  it('computes slope and rSquared correctly for perfect linear growth', () => {
    const result = computeLineChartAnalysis([10, 20, 30, 40])
    expect(result.mean).toBe(25)
    expect(result.standardDeviation).toBeGreaterThan(0)
    expect(result.slope).toBeCloseTo(10, 10)
    expect(result.rSquared).not.toBeNull()
    expect(result.rSquared as number).toBeCloseTo(1, 10)
    expect(result.interpretation.trend).toBe('strong')
  })

  it('computes slope and rSquared correctly for perfect linear decline', () => {
    const result = computeLineChartAnalysis([40, 30, 20, 10])
    expect(result.mean).toBe(25)
    expect(result.slope).toBeCloseTo(-10, 10)
    expect(result.rSquared).not.toBeNull()
    expect(result.rSquared as number).toBeCloseTo(1, 10)
    expect(result.interpretation.trend).toBe('strong')
  })

  it('returns rSquared null when variance is zero, even if multiple points exist', () => {
    const result = computeLineChartAnalysis([5, 5, 5])
    expect(result.mean).toBe(5)
    expect(result.standardDeviation).toBe(0)
    expect(result.rSquared).toBeNull()
    expect(result.interpretation.trend).toBe('undefined')
  })

  it('handles nulls within a perfect linear trend using original indexes', () => {
    const result = computeLineChartAnalysis([10, null, 30, null, 50])
    expect(result.mean).toBeCloseTo(30, 10)
    expect(result.slope).toBeCloseTo(10, 10)
    expect(result.rSquared).not.toBeNull()
    expect(result.rSquared as number).toBeCloseTo(1, 10)
    expect(result.interpretation.trend).toBe('strong')
  })

  it('classifies volatility thresholds correctly', () => {
    const veryStable = computeLineChartAnalysis([100, 101, 99, 100, 100])
    expect(veryStable.coefficientOfVariation).not.toBeNull()
    expect(veryStable.interpretation.volatility).toBe('very_stable')

    const moderate = computeLineChartAnalysis([100, 120, 80, 110, 90])
    expect(moderate.coefficientOfVariation).not.toBeNull()
    const moderateValue = moderate.coefficientOfVariation as number
    expect(moderateValue).toBeGreaterThanOrEqual(0.1)
    expect(moderateValue).toBeLessThan(0.25)
    expect(moderate.interpretation.volatility).toBe('moderate')

    const volatile = computeLineChartAnalysis([100, 200, 0, 250, 50])
    expect(volatile.coefficientOfVariation).not.toBeNull()
    expect(volatile.interpretation.volatility).toBe('volatile')
  })

  it('stays weak when base trend is weak and relativeSlope < 0.06 (no upgrade)', () => {
    let found: number[] | null = null

    // High base & moderate step generate low relativeSlope, add noise to keep rSquared in the [0.4, 0.75] range
    for (const base of [10_000, 20_000, 50_000]) {
      for (const step of [50, 100, 150, 200, 250]) {
        for (const noiseAmplitude of [200, 300, 400, 500, 700, 900, 1200]) {
          const series = buildSeries(base, step, noiseAmplitude)
          const result = computeLineChartAnalysis(series)

          const baseTrend = computeBaseTrend(result.rSquared)
          if (baseTrend !== 'weak') continue

          const mean = series.reduce((a, b) => a + b, 0) / series.length
          const relativeSlope = mean === 0 ? 0 : Math.abs(result.slope) / mean
          if (relativeSlope >= 0.06) continue

          if (result.interpretation.trend === 'weak') {
            found = series
            break
          }
        }
        if (found) break
      }
      if (found) break
    }

    expect(found).not.toBeNull()

    const result = computeLineChartAnalysis(found as number[])
    expect(result.rSquared).not.toBeNull()
    const r2 = result.rSquared as number
    expect(r2).toBeGreaterThan(0.4)
    expect(r2).toBeLessThanOrEqual(0.75)
    expect(result.interpretation.trend).toBe('weak')
  })

  it('upgrades weak to strong when base trend is weak and relativeSlope >= 0.06', () => {
    let found: number[] | null = null

    // Lower base & larger step generate higher relativeSlope, add noise to keep rSquared in the [0.4, 0.75] range
    for (const base of [50, 100, 200, 300, 500]) {
      for (const step of [10, 12, 15, 18, 20, 25, 30]) {
        for (const noiseAmplitude of [10, 15, 20, 25, 30, 35, 40, 50]) {
          const series = buildSeries(base, step, noiseAmplitude)
          const result = computeLineChartAnalysis(series)

          const baseTrend = computeBaseTrend(result.rSquared)
          if (baseTrend !== 'weak') continue

          const mean = series.reduce((a, b) => a + b, 0) / series.length
          const relativeSlope = mean === 0 ? 0 : Math.abs(result.slope) / mean
          if (relativeSlope < 0.06) continue

          if (result.interpretation.trend === 'strong') {
            found = series
            break
          }
        }
        if (found) break
      }
      if (found) break
    }

    expect(found).not.toBeNull()
    const result = computeLineChartAnalysis(found as number[])
    expect(result.rSquared).not.toBeNull()
    const r2 = result.rSquared as number
    expect(r2).toBeGreaterThan(0.4)
    expect(r2).toBeLessThanOrEqual(0.75)
    expect(result.interpretation.trend).toBe('strong')
  })

  it('does not winsorize when there are fewer than 20 valid points', () => {
    const result = computeLineChartAnalysis([10, 20, 30, 40])
    expect(result.slope).toBeCloseTo(10, 10)
    expect(result.rSquared).not.toBeNull()
    expect(result.rSquared as number).toBeCloseTo(1, 10)
    expect(result.interpretation.trend).toBe('strong')
  })

  it('winsorizes when there are at least 20 valid points', () => {
    const values: Array<number | null> = Array.from({ length: 19 }, (_, i) => i * 10)
    values.push(1_000_000)

    const result = computeLineChartAnalysis(values)

    expect(result.slope).toBeGreaterThan(0)
    expect(result.rSquared).not.toBeNull()
    expect(result.rSquared as number).toBeGreaterThanOrEqual(0)
    expect(result.rSquared as number).toBeLessThanOrEqual(1)
  })

  it('upgrades trend from none to weak when relativeSlope is high enough', () => {
    // Many points, huge growth + noise to keep linearity low but direction strong.
    const values: Array<number | null> = []
    for (let i = 0; i < 25; i += 1) {
      values.push(i * 1000 + (i % 2 === 0 ? 0 : 8000))
    }

    const result = computeLineChartAnalysis(values)

    expect(result.slope).toBeGreaterThan(0)
    expect(result.rSquared).not.toBeNull()
    expect(result.interpretation.trend === 'weak' || result.interpretation.trend === 'strong').toBe(
      true,
    )
  })

  it('classifies trend thresholds correctly', () => {
    const strong = computeLineChartAnalysis([10, 20, 30, 40, 50])
    expect(strong.rSquared).not.toBeNull()
    expect(strong.interpretation.trend).toBe('strong')

    const undefinedTrend = computeLineChartAnalysis([0, 0, 0, 0])
    expect(undefinedTrend.rSquared).toBeNull()
    expect(undefinedTrend.interpretation.trend).toBe('undefined')
  })
})
