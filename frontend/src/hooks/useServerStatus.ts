import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

export function useServerStatus() {
  const { data, isError } = useQuery({
    queryKey: ['server-status'],
    queryFn: async () => {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL ?? 'http://localhost:8000'}/health`,
        { timeout: 3000 }
      )
      return res.data
    },
    refetchInterval: 15_000,
    retry: false,
  })

  return { connected: !isError && !!data }
}
