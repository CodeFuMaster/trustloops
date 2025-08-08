import { useParams, useSearchParams } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'https://localhost:65173'

interface Project {
  id: string
  name: string
  slug: string
  description: string
  callToAction: string
  createdAt: string
}

export default function EmbedWall() {
  const { projectSlug } = useParams<{ projectSlug: string }>()
  const [searchParams] = useSearchParams()
  const containerRef = useRef<HTMLDivElement>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [testimonials, setTestimonials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const isEmbedded = searchParams.get('embed') === 'true'
  const tags = searchParams.get('tags') || undefined
  const minRating = searchParams.get('minRating') || searchParams.get('minrating') || undefined

  useEffect(() => {
    const load = async () => {
      if (!projectSlug) return
      try {
        setLoading(true)
        setError(null)
        const params = new URLSearchParams()
        params.set('embed', 'true')
        if (tags) params.set('tags', tags)
        if (minRating) params.set('minRating', minRating)
        const res = await fetch(`${API_BASE}/api/wall/${projectSlug}?${params.toString()}`)
        if (!res.ok) throw new Error('Failed to load wall')
        const json = await res.json()
        setProject(json.project)
        setTestimonials(json.testimonials || [])
      } catch (e: any) {
        setError(e?.message || 'Failed to load wall')
      } finally {
        setLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectSlug, tags, minRating])

  // Handle iframe resizing for embedded mode
  useEffect(() => {
    if (!isEmbedded || !containerRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height
        // Send height to parent window
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({
            type: 'trustloops:resize',
            height: height
          }, '*')
        }
      }
    })

    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [isEmbedded, testimonials]) // Re-observe when testimonials change

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // loading and error already managed locally

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {typeof error === 'string' ? error : 'Project Not Found'}
          </h1>
          <p className="text-gray-600">
            The testimonial wall you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    )
  }

  const approvedTestimonials = testimonials || []
  const averageRating = approvedTestimonials.length > 0 
    ? approvedTestimonials.reduce((sum, t) => sum + t.rating, 0) / approvedTestimonials.length 
    : 0

  return (
    <div 
      ref={containerRef}
      className={isEmbedded ? "bg-white" : "min-h-screen bg-gray-50"}
    >
      {/* Header - Hide in embedded mode if requested */}
      {!isEmbedded && (
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                {project.name} Testimonials
              </h1>
              {project.description && (
                <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                  {project.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Testimonials */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {approvedTestimonials.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.013 8.013 0 01-7-4.618L4 13l3-3 3 3M13 5h.01M9 5h.01M5 5h.01"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No testimonials yet
            </h3>
            <p className="text-gray-600">
              Be the first to share your experience!
            </p>
            <a
              href={`/record/${projectSlug}`}
              className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {project.callToAction || 'Share Your Story'}
            </a>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center space-x-8 bg-white rounded-lg px-8 py-4 shadow-sm">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {approvedTestimonials.length}
                  </div>
                  <div className="text-sm text-gray-600">
                    {approvedTestimonials.length === 1 ? 'Testimonial' : 'Testimonials'}
                  </div>
                </div>
                
                <div className="h-8 w-px bg-gray-200"></div>
                
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {averageRating.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Average Rating
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonials Grid */}
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {approvedTestimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Video */}
                  {testimonial.videoUrl && (
                    <div className="aspect-video">
                      <video
                        src={testimonial.videoUrl}
                        controls
                        className="w-full h-full object-cover"
                        poster="/video-placeholder.jpg"
                      >
                        {testimonial.captionsUrl && (
                          <track kind="captions" src={testimonial.captionsUrl} srcLang="en" label="English" default />
                        )}
                      </video>
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-6">
                    {/* Rating */}
                    <div className="flex items-center mb-3">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <svg
                          key={i}
                          className="w-5 h-5 text-yellow-400 fill-current"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      {[...Array(5 - testimonial.rating)].map((_, i) => (
                        <svg
                          key={i}
                          className="w-5 h-5 text-gray-300 fill-current"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>

                    {/* Quote */}
                    {testimonial.content && (
                      <blockquote className="text-gray-800 mb-4 leading-relaxed">
                        "{testimonial.content}"
                      </blockquote>
                    )}

                    {/* AI info */}
                    {(testimonial as any).sentiment && (
                      <div className="mb-2 text-xs text-gray-600">Sentiment: {(testimonial as any).sentiment}</div>
                    )}
                    {Array.isArray((testimonial as any).tags) && (testimonial as any).tags.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-2">
                        {(testimonial as any).tags.map((t: string) => (
                          <span key={t} className="px-2 py-1 text-xs rounded bg-gray-100">#{t}</span>
                        ))}
                      </div>
                    )}

                    {/* Customer Info */}
                    <div className="border-t pt-4">
                      <div className="font-medium text-gray-900">
                        {testimonial.customerName}
                      </div>
                      {testimonial.customerTitle && testimonial.customerCompany && (
                        <div className="text-sm text-gray-600">
                          {testimonial.customerTitle} at {testimonial.customerCompany}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDate(testimonial.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="text-center mt-12">
              <div className="bg-white rounded-lg shadow-md p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Share Your Experience
                </h3>
                <p className="text-gray-600 mb-6">
                  Have you used {project.name}? We'd love to hear about your experience!
                </p>
                <a
                  href={`/record/${projectSlug}`}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Record Your Testimonial
                </a>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer - Always show but smaller in embedded mode */}
      <footer className={isEmbedded ? "bg-white border-t py-3" : "bg-white border-t mt-12"}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            Powered by{' '}
            <a
              href="https://trustloops.com"
              className="text-blue-600 hover:text-blue-700"
            >
              TrustLoops
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
