import { useState } from 'react'
import { usePendingTestimonials, useApproveTestimonial } from '../hooks/useTestimonials'

export default function TestimonialManagement() {
  const { data: testimonials, isLoading, error, refetch } = usePendingTestimonials()
  const approveTestimonialMutation = useApproveTestimonial()
  const [processingId, setProcessingId] = useState<string | null>(null)

  const handleApprove = async (testimonialId: string) => {
    setProcessingId(testimonialId)
    try {
      await approveTestimonialMutation.mutateAsync(testimonialId)
    } catch (err) {
      console.error('Failed to approve testimonial:', err)
    } finally {
      setProcessingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-600">Loading testimonials...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="text-red-600 text-lg font-medium">Error loading testimonials</div>
            <button 
              onClick={() => refetch()} 
              className="mt-4 btn btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Testimonial Management
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Review and approve pending testimonials
          </p>
        </div>

        {!testimonials || testimonials.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No pending testimonials</div>
            <p className="text-gray-400 mt-2">All testimonials have been reviewed!</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="card p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {testimonial.customerName}
                        </h3>
                        {testimonial.customerTitle && testimonial.customerCompany && (
                          <p className="text-gray-600">
                            {testimonial.customerTitle} at {testimonial.customerCompany}
                          </p>
                        )}
                        {testimonial.customerEmail && (
                          <p className="text-gray-500 text-sm">{testimonial.customerEmail}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`h-4 w-4 ${
                                i < testimonial.rating ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDate(testimonial.createdAt)}
                        </p>
                      </div>
                    </div>

                    {testimonial.type === 'text' && testimonial.content && (
                      <div className="mb-4">
                        <p className="text-gray-700 italic">"{testimonial.content}"</p>
                      </div>
                    )}

                    {testimonial.type === 'video' && testimonial.videoUrl && (
                      <div className="mb-4">
                        <video 
                          controls 
                          className="max-w-md h-64 rounded-lg"
                          src={testimonial.videoUrl}
                        >
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    )}

                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleApprove(testimonial.id)}
                        disabled={processingId === testimonial.id}
                        className={`btn btn-primary ${
                          processingId === testimonial.id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {processingId === testimonial.id ? 'Approving...' : 'Approve'}
                      </button>
                      <button
                        className="btn btn-secondary"
                        disabled={processingId === testimonial.id}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
