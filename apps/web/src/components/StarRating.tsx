import { useState } from 'react'

interface StarRatingProps {
  rating: number
  onChange?: (rating: number) => void
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

export const StarRating = ({ rating, onChange, size = 'md', disabled = false }: StarRatingProps) => {
  const [hoveredRating, setHoveredRating] = useState(0)

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  const handleClick = (starRating: number) => {
    if (!disabled && onChange) {
      onChange(starRating)
    }
  }

  const handleMouseEnter = (starRating: number) => {
    if (!disabled) {
      setHoveredRating(starRating)
    }
  }

  const handleMouseLeave = () => {
    if (!disabled) {
      setHoveredRating(0)
    }
  }

  const getStarFill = (starIndex: number) => {
    const activeRating = hoveredRating || rating
    return starIndex <= activeRating ? 'text-yellow-400' : 'text-gray-300'
  }

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((starIndex) => (
        <button
          key={starIndex}
          type="button"
          className={`
            ${sizeClasses[size]} 
            ${getStarFill(starIndex)} 
            ${disabled ? 'cursor-default' : 'cursor-pointer hover:scale-110'} 
            transition-all duration-200
          `}
          onClick={() => handleClick(starIndex)}
          onMouseEnter={() => handleMouseEnter(starIndex)}
          onMouseLeave={handleMouseLeave}
          disabled={disabled}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 24 24"
            className="w-full h-full drop-shadow-sm"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
      <span className="ml-2 text-sm text-gray-600 font-medium">
        {rating > 0 ? `${rating} star${rating !== 1 ? 's' : ''}` : 'No rating'}
      </span>
    </div>
  )
}
