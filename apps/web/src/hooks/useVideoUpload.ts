import { useCallback, useMemo, useRef, useState } from 'react'
import { uploadWithProgress, UploadProgress } from '../lib/upload'

const API_BASE = import.meta.env.VITE_API_URL || 'https://localhost:65173'

export interface UseVideoUploadState {
  progress: number // 0-100
  isUploading: boolean
  error: string | null
  uploadedId?: string
}

export interface UseVideoUploadApi {
  upload: (args: {
    projectId: string
    file?: Blob
    payload: {
      type: 'text' | 'video'
      content?: string
      customerName: string
      customerEmail?: string
      customerTitle?: string
      customerCompany?: string
      rating: number
    }
  }) => Promise<void>
  cancel: () => void
  retry: () => Promise<void>
}

export function useVideoUpload(): [UseVideoUploadState, UseVideoUploadApi] {
  const [progress, setProgress] = useState(0)
  const [isUploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedId, setUploadedId] = useState<string | undefined>(undefined)
  const lastArgsRef = useRef<Parameters<UseVideoUploadApi['upload']>[0] | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const doUpload = useCallback(async (args: Parameters<UseVideoUploadApi['upload']>[0]) => {
    setError(null)
    setProgress(0)
    setUploading(true)
    abortRef.current = new AbortController()

    const form = new FormData()
    form.append('projectId', args.projectId)
    form.append('type', args.payload.type)
    form.append('customerName', args.payload.customerName)
    form.append('rating', String(args.payload.rating))
    if (args.payload.content) form.append('content', args.payload.content)
    if (args.payload.customerEmail) form.append('customerEmail', args.payload.customerEmail)
    if (args.payload.customerTitle) form.append('customerTitle', args.payload.customerTitle)
    if (args.payload.customerCompany) form.append('customerCompany', args.payload.customerCompany)
    if (args.file) form.append('video', args.file, 'testimonial.webm')

    try {
      const res = await uploadWithProgress(`${API_BASE}/api/testimonials`, form, {
        onProgress: (p: UploadProgress) => setProgress(p.percent),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || 'Upload failed')
      }

      const json = await res.json()
      setUploadedId(json?.id)
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        setError('Upload canceled')
      } else {
        setError(e?.message || 'Upload failed')
      }
      throw e
    } finally {
      setUploading(false)
    }
  }, [])

  const upload = useCallback<UseVideoUploadApi['upload']>(async (args) => {
    lastArgsRef.current = args
    await doUpload(args)
  }, [doUpload])

  const cancel = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const retry = useCallback(async () => {
    if (lastArgsRef.current) {
      await doUpload(lastArgsRef.current)
    }
  }, [doUpload])

  return useMemo(() => ([
    { progress, isUploading: isUploading, error, uploadedId },
    { upload, cancel, retry },
  ]), [progress, isUploading, error, uploadedId, upload, cancel, retry])
}
