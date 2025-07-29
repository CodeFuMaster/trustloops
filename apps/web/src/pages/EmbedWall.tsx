import { useParams } from 'react-router-dom'

export default function EmbedWall() {
  const { projectSlug } = useParams()

  // Sample testimonials data - will be fetched from API
  const testimonials = [
    {
      id: 1,
      type: 'video',
      customerName: 'John Doe',
      customerTitle: 'CEO',
      customerCompany: 'TechCorp',
      content: 'Amazing product! It completely transformed our workflow.',
      videoUrl: 'https://example.com/video1.mp4',
      rating: 5,
    },
    {
      id: 2,
      type: 'text',
      customerName: 'Jane Smith',
      customerTitle: 'Product Manager',
      customerCompany: 'StartupXYZ',
      content: 'The best tool we\'ve used for our team. Highly recommend!',
      rating: 5,
    },
    {
      id: 3,
      type: 'video',
      customerName: 'Mike Johnson',
      customerTitle: 'Developer',
      customerCompany: 'CodeInc',
      content: 'Incredible support team and fantastic features.',
      videoUrl: 'https://example.com/video2.mp4',
      rating: 5,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            What Our Customers Say
          </h1>
          <p className="text-xl text-gray-600">
            Real testimonials from {projectSlug} users
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="card p-6">
              {/* Star Rating */}
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-5 h-5 text-yellow-400 fill-current"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Video or Text Content */}
              {testimonial.type === 'video' ? (
                <div className="mb-4">
                  <video
                    controls
                    className="w-full rounded-lg"
                    poster="https://via.placeholder.com/400x225"
                  >
                    <source src={testimonial.videoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              ) : (
                <blockquote className="text-gray-800 mb-4 text-lg italic">
                  "{testimonial.content}"
                </blockquote>
              )}

              {/* Customer Info */}
              <div className="border-t pt-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-medium">
                      {testimonial.customerName.charAt(0)}
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {testimonial.customerName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {testimonial.customerTitle}
                      {testimonial.customerCompany && ` at ${testimonial.customerCompany}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Powered by TestimonialHub */}
        <div className="text-center mt-12">
          <p className="text-sm text-gray-500">
            Powered by{' '}
            <a
              href="https://testimonialhub.com"
              className="text-primary-600 hover:text-primary-700"
              target="_blank"
              rel="noopener noreferrer"
            >
              TestimonialHub
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
