import type { DownloadAnomaly } from './download-anomalies'

export const DOWNLOAD_ANOMALIES: DownloadAnomaly[] = [
  // vite rogue CI spike
  {
    packageName: 'vite',
    start: { date: '2025-08-04', weeklyDownloads: 33_913_132 },
    end: { date: '2025-09-08', weeklyDownloads: 38_665_727 },
  },
]
