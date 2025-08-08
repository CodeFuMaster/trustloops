import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useVideoUpload } from '../useVideoUpload'

// Mock uploadWithProgress
vi.mock('../../lib/upload', () => ({
  uploadWithProgress: vi.fn(async (_url: string, _body: FormData, opts: any) => {
    // simulate progress then ok response
    opts?.onProgress?.({ loaded: 50, total: 100, percent: 50 })
    opts?.onProgress?.({ loaded: 100, total: 100, percent: 100 })
    return new Response(JSON.stringify({ id: '123' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }),
}))

// Polyfill for import.meta.env
;(globalThis as any).import = { meta: { env: { VITE_API_URL: 'http://localhost:5000' } } }

describe('useVideoUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uploads and reports progress', async () => {
    const { result } = renderHook(() => useVideoUpload())

    await act(async () => {
      await result.current[1].upload({
        projectId: 'p1',
        payload: { type: 'video', customerName: 'A', rating: 5 },
      })
    })

    const state = result.current[0]
    expect(state.progress).toBe(100)
    expect(state.uploadedId).toBe('123')
    expect(state.error).toBeNull()
  })

  it('supports retry after failure', async () => {
    const { uploadWithProgress } = await import('../../lib/upload') as any
    let first = true
    uploadWithProgress.mockImplementation(async (_url: string, _body: FormData, _opts: any) => {
      if (first) {
        first = false
        return new Response('boom', { status: 500 })
      }
      return new Response(JSON.stringify({ id: '456' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    })

    const { result } = renderHook(() => useVideoUpload())

    await act(async () => {
      await expect(result.current[1].upload({ projectId: 'p1', payload: { type: 'video', customerName: 'A', rating: 5 } })).rejects.toBeDefined()
    })

    expect(result.current[0].error).toBeTruthy()

    await act(async () => {
      await result.current[1].retry()
    })

    expect(result.current[0].uploadedId).toBe('456')
  })
})
