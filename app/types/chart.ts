export type DailyDownloadPoint = { downloads: number; day: string; timestamp: number }
export type WeeklyDownloadPoint = {
  downloads: number
  weekKey: string
  weekStart: string
  weekEnd: string
  timestampStart: number
  timestampEnd: number
}
export type MonthlyDownloadPoint = { downloads: number; month: string; timestamp: number }
export type YearlyDownloadPoint = { downloads: number; year: string; timestamp: number }

export type ChartTimeGranularity = 'daily' | 'weekly' | 'monthly' | 'yearly'

export type EvolutionData =
  | DailyDownloadPoint[]
  | WeeklyDownloadPoint[]
  | MonthlyDownloadPoint[]
  | YearlyDownloadPoint[]

export type DateRangeFields = {
  startDate?: string
  endDate?: string
}
