import { useQuery } from '@tanstack/react-query'
import { jobsApi } from '@/lib/api'
import type { JobStatus } from '@/types'

export function useJobPoller(jobId: string | null) {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobsApi.status(jobId!).then((r) => r.data as JobStatus),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data) return 2000
      if (data.status === 'complete' || data.status === 'failed') return false
      return 1500
    },
  })
}
