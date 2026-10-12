import { useCallback, useEffect, useState } from 'react'
import { ApiError } from './api'

/**
 * Small data-fetching hook: runs `fn` on mount (and whenever deps change),
 * exposing { data, loading, error, reload }.
 */
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '' })

  const run = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: '' }))
    try {
      const data = await fn()
      setState({ data, loading: false, error: '' })
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Something went wrong. Please try again.'
      setState({ data: null, loading: false, error: message })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => { run() }, [run])

  return { ...state, reload: run }
}
