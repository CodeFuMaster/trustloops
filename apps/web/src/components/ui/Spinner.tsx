import React from 'react'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'blue' | 'white' | 'gray' | 'green' | 'red'
  className?: string
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'blue',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  const colorClasses = {
    blue: 'border-blue-600',
    white: 'border-white',
    gray: 'border-gray-600',
    green: 'border-green-600',
    red: 'border-red-600'
  }

  return (
    <div
      className={`animate-spin rounded-full border-2 border-t-transparent ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
    />
  )
}

interface LoadingSpinnerProps {
  text?: string
  size?: SpinnerProps['size']
  color?: SpinnerProps['color']
  className?: string
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  text = 'Loading...',
  size = 'md',
  color = 'blue',
  className = ''
}) => {
  return (
    <div className={`flex items-center justify-center space-x-3 ${className}`}>
      <Spinner size={size} color={color} />
      {text && <span className="text-gray-600">{text}</span>}
    </div>
  )
}
