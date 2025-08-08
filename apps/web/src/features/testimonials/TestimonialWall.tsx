import React, { useState } from 'react'
import { useApprovedTestimonials, Testimonial } from '../../hooks/useTestimonials'
import { StarRating } from '../../components/StarRating'
import SocialShareButtons from './SocialShareButtons'

interface TestimonialWallProps {
  projectId: string
  theme?: 'light' | 'dark'
  layout?: 'grid' | 'masonry' | 'carousel'
  showFilters?: boolean
  maxItems?: number
  className?: string
}

export const TestimonialWall: React.FC<TestimonialWallProps> = ({
  projectId,
  theme = 'light',
  layout = 'grid',
  showFilters = true,
  maxItems,
  className = ''
}) => {
  const [ratingFilter, setRatingFilter] = useState<number | null>(null)
  const [typeFilter, setTypeFilter] = useState<'all' | 'text' | 'video'>('all')
  
  const { data: testimonials = [], isLoading, error } = useApprovedTestimonials(projectId)

  const filteredTestimonials = testimonials
    .filter((testimonial: Testimonial) => {
      if (ratingFilter && testimonial.rating < ratingFilter) return false
      if (typeFilter !== 'all' && testimonial.type !== typeFilter) return false
      return true
    })
    .slice(0, maxItems)

  const themeClasses = {
    light: {
      container: 'bg-white text-gray-900',
      card: 'bg-white border-gray-200 shadow-sm hover:shadow-md',
      text: 'text-gray-700',
      accent: 'text-blue-600',
      filter: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    },
    dark: {
      container: 'bg-gray-900 text-white',
      card: 'bg-gray-800 border-gray-700 shadow-lg hover:shadow-xl',
      text: 'text-gray-300',
      accent: 'text-blue-400',
      filter: 'bg-gray-700 text-gray-200 hover:bg-gray-600'
    }
  }

  const currentTheme = themeClasses[theme]

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-12 ${currentTheme.container} rounded-lg ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading testimonials...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${currentTheme.container} rounded-lg p-6 ${className}`}>
        <div className="flex items-center text-red-500">
          <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <p>Error loading testimonials</p>
        </div>
      </div>
    )
  }

  if (filteredTestimonials.length === 0) {
    return (
      <div className={`${currentTheme.container} rounded-lg p-12 text-center ${className}`}>
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
        <h3 className="text-xl font-semibold mb-2">No testimonials to display</h3>
        <p className={currentTheme.text}>
          {testimonials.length === 0 
            ? 'No testimonials have been submitted yet.'
            : 'No testimonials match your current filters.'
          }
        </p>
      </div>
    )
  }

  const getLayoutClasses = () => {
    switch (layout) {
      case 'masonry':
        return 'columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6'
      case 'carousel':
        return 'flex gap-6 overflow-x-auto pb-4'
      default:
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
    }
  }

  const getCardClasses = () => {
    const base = `${currentTheme.card} rounded-xl border p-6 transition-all duration-200`
    
    switch (layout) {
      case 'masonry':
        return `${base} break-inside-avoid mb-6`
      case 'carousel':
        return `${base} flex-shrink-0 w-80`
      default:
        return base
    }
  }

  return (
    <div className={`${currentTheme.container} ${className}`}>
      {/* Filters */}
      {showFilters && (
        <div className="mb-8 flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${currentTheme.text}`}>Filter by rating:</span>
            <div className="flex space-x-2">
              <button
                onClick={() => setRatingFilter(null)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  ratingFilter === null ? currentTheme.accent : currentTheme.filter
                }`}
              >
                All
              </button>
              {[5, 4, 3].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setRatingFilter(rating)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors flex items-center space-x-1 ${
                    ratingFilter === rating ? currentTheme.accent : currentTheme.filter
                  }`}
                >
                  <span>{rating}+</span>
                  <svg className="w-3 h-3 text-yellow-400 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${currentTheme.text}`}>Type:</span>
            <div className="flex space-x-2">
              {(['all', 'text', 'video'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors capitalize ${
                    typeFilter === type ? currentTheme.accent : currentTheme.filter
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className={`ml-auto text-sm ${currentTheme.text}`}>
            Showing {filteredTestimonials.length} of {testimonials.length} testimonials
          </div>
        </div>
      )}

      {/* Testimonials */}
      <div className={getLayoutClasses()}>
        {filteredTestimonials.map((testimonial: Testimonial) => (
          <TestimonialCard
            key={testimonial.id}
            testimonial={testimonial}
            theme={theme}
            cardClasses={getCardClasses()}
          />
        ))}
      </div>
    </div>
  )
}

interface TestimonialCardProps {
  testimonial: Testimonial
  theme: 'light' | 'dark'
  cardClasses: string
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({
  testimonial,
  theme,
  cardClasses
}) => {
  const [showFullContent, setShowFullContent] = useState(false)
  
  const themeClasses = {
    light: {
      text: 'text-gray-700',
      accent: 'text-blue-600',
      meta: 'text-gray-500'
    },
    dark: {
      text: 'text-gray-300',
      accent: 'text-blue-400',
      meta: 'text-gray-400'
    }
  }

  const currentTheme = themeClasses[theme]

  const content = testimonial.quote || testimonial.content || ''
  const shouldTruncate = content.length > 150
  const displayContent = shouldTruncate && !showFullContent 
    ? content.substring(0, 150) + '...'
    : content

  return (
    <div className={cardClasses}>
      {/* Rating */}
      <div className="flex items-center justify-between mb-4">
        <StarRating rating={testimonial.rating} size="sm" disabled />
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          testimonial.type === 'video' 
            ? `bg-blue-100 ${theme === 'dark' ? 'bg-blue-900' : ''} text-blue-800 ${theme === 'dark' ? 'text-blue-200' : ''}`
            : `bg-purple-100 ${theme === 'dark' ? 'bg-purple-900' : ''} text-purple-800 ${theme === 'dark' ? 'text-purple-200' : ''}`
        }`}>
          {testimonial.type === 'video' ? 'Video' : 'Text'}
        </span>
      </div>

      {/* Content */}
      <div className="mb-4">
        {testimonial.type === 'video' && testimonial.videoUrl ? (
          <div className="mb-4">
            <video
              src={testimonial.videoUrl}
              controls
              className="w-full rounded-lg shadow-sm"
              poster={testimonial.thumbnailUrl}
            />
          </div>
        ) : null}

        {content && (
          <blockquote className={`${currentTheme.text} italic leading-relaxed`}>
            "{displayContent}"
            {shouldTruncate && (
              <button
                onClick={() => setShowFullContent(!showFullContent)}
                className={`ml-2 ${currentTheme.accent} hover:underline text-sm font-medium`}
              >
                {showFullContent ? 'Show less' : 'Read more'}
              </button>
            )}
          </blockquote>
        )}
      </div>

      {/* Author */}
      <div className="flex items-center">
        <div className="flex-1">
          <p className="font-semibold text-gray-900 dark:text-white">
            {testimonial.customerName}
          </p>
          {(testimonial.customerTitle || testimonial.customerCompany) && (
            <p className={`text-sm ${currentTheme.meta}`}>
              {testimonial.customerTitle}
              {testimonial.customerTitle && testimonial.customerCompany && ' at '}
              {testimonial.customerCompany}
            </p>
          )}
        </div>
        
        <div className={`text-xs ${currentTheme.meta} text-right`}>
          {new Date(testimonial.createdUtc || testimonial.createdAt).toLocaleDateString()}
        </div>
      </div>

      {/* Social Share Buttons */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <SocialShareButtons 
          testimonialId={testimonial.id} 
          className="justify-center"
        />
      </div>
    </div>
  )
}
