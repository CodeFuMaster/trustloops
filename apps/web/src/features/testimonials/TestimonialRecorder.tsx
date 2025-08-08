import React, { useState, useRef, useCallback } from 'react'
import { useCreateTestimonial } from '../../hooks/useTestimonials'
import { StarRating } from '../../components/StarRating'

interface TestimonialRecorderProps {
  projectId: string
  onSuccess?: () => void
}

export const TestimonialRecorder: React.FC<TestimonialRecorderProps> = ({
  projectId,
  onSuccess
}) => {
  const [step, setStep] = useState<'info' | 'type' | 'record' | 'review' | 'success'>('info')
  const [testimonialType, setTestimonialType] = useState<'video' | 'text'>('video')
  const [isRecording, setIsRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [retryCount, setRetryCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    title: '',
    company: '',
    testimonialText: '',
    rating: 5
  })

  const createTestimonialMutation = useCreateTestimonial()

  const startRecording = useCallback(async () => {
    setError(null)
    setProgress(0)
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      })

      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      })

      const chunks: BlobPart[] = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        setRecordedBlob(blob)
        const url = URL.createObjectURL(blob)
        setRecordedVideo(url)
        
        // Cleanup stream
        stream.getTracks().forEach(track => track.stop())
        setProgress(100)
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)
      
      // Progress simulation
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 1
        })
      }, 100)

    } catch (err) {
      console.error('Error accessing camera:', err)
      
      // Handle different error types
      if (err instanceof DOMException) {
        switch (err.name) {
          case 'NotAllowedError':
            setError('Camera access denied. Please allow camera permissions and try again.')
            break
          case 'NotFoundError':
            setError('No camera found. Please connect a camera and try again.')
            break
          case 'NotReadableError':
            setError('Camera is being used by another application.')
            break
          default:
            setError('Could not access camera. Please check your device settings.')
        }
      } else {
        setError('Could not access camera. Please try again.')
      }
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [isRecording])

  const retryRecording = useCallback(() => {
    setRecordedBlob(null)
    setRecordedVideo(null)
    setProgress(0)
    setRetryCount(prev => prev + 1)
    setError(null)
    
    if (recordedVideo) {
      URL.revokeObjectURL(recordedVideo)
    }
  }, [recordedVideo])

  const handleSubmit = async () => {
    setError(null)
    
    try {
      const testimonialData = {
        projectId,
        type: testimonialType,
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerTitle: customerInfo.title,
        customerCompany: customerInfo.company,
        rating: customerInfo.rating,
        content: testimonialType === 'text' ? customerInfo.testimonialText : undefined,
        video: testimonialType === 'video' && recordedBlob ? 
          new File([recordedBlob], 'testimonial.webm', { type: 'video/webm' }) : undefined
      }

      await createTestimonialMutation.mutateAsync(testimonialData)
      setStep('success')
      onSuccess?.()
    } catch (err) {
      console.error('Error submitting testimonial:', err)
      setError('Failed to submit testimonial. Please try again.')
    }
  }

  const renderStepContent = () => {
    switch (step) {
      case 'info':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Tell us about yourself</h2>
              <p className="text-gray-600">We'd love to know who you are before you share your testimonial</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your full name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title
                </label>
                <input
                  type="text"
                  value={customerInfo.title}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your job title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  value={customerInfo.company}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, company: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your company name"
                />
              </div>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                Rate Your Experience
              </h3>
              <StarRating
                rating={customerInfo.rating}
                onChange={(rating: number) => setCustomerInfo(prev => ({ ...prev, rating }))}
                size="lg"
              />
            </div>
          </div>
        )

      case 'type':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Choose Your Testimonial Type</h2>
              <p className="text-gray-600">How would you like to share your testimonial?</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => setTestimonialType('video')}
                className={`p-8 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                  testimonialType === 'video'
                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-lg'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Video Testimonial</h3>
                  <p className="text-sm opacity-75">Record a personal video message</p>
                  <p className="text-xs mt-2 opacity-60">More engaging and personal</p>
                </div>
              </button>

              <button
                onClick={() => setTestimonialType('text')}
                className={`p-8 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                  testimonialType === 'text'
                    ? 'border-green-500 bg-green-50 text-green-700 shadow-lg'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Text Testimonial</h3>
                  <p className="text-sm opacity-75">Write your feedback</p>
                  <p className="text-xs mt-2 opacity-60">Quick and easy to share</p>
                </div>
              </button>
            </div>
          </div>
        )

      case 'record':
        if (testimonialType === 'text') {
          return (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Write Your Testimonial</h2>
                <p className="text-gray-600">Share your experience in your own words</p>
              </div>
              
              <div>
                <textarea
                  value={customerInfo.testimonialText}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, testimonialText: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  rows={8}
                  placeholder="Tell us about your experience, what you liked, and how it helped you..."
                  required
                />
                <div className="mt-2 text-sm text-gray-600 flex justify-between">
                  <span>Share your honest feedback</span>
                  <span>{customerInfo.testimonialText.length} characters</span>
                </div>
              </div>
            </div>
          )
        }

        return (
          // Video recording UI
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Record Your Video</h2>
              <p className="text-gray-600">Share your experience in a personal video message</p>
              {retryCount > 0 && (
                <p className="text-sm text-blue-600 mt-2">Attempt {retryCount + 1}</p>
              )}
            </div>
            
            <div className="relative">
              {progress > 0 && progress < 100 && (
                <div className="absolute top-4 left-4 right-4 z-10">
                  <div className="bg-black bg-opacity-50 rounded-full p-2">
                    <div className="bg-white rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-gray-900 rounded-xl overflow-hidden aspect-video">
                {(isRecording || recordedVideo) ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    muted={isRecording}
                    controls={!isRecording && !!recordedVideo}
                    src={recordedVideo || undefined}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-white">
                    <div className="text-center">
                      <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                      <p className="text-lg">Ready to record your testimonial</p>
                      <p className="text-sm opacity-75 mt-2">Click "Start Recording" to begin</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile fallback message */}
            {error && error.includes('Camera') && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">Camera Access Issue</h4>
                    <p className="text-sm text-yellow-700 mt-1">{error}</p>
                    <button
                      onClick={() => setStep('type')}
                      className="text-sm text-yellow-800 underline mt-2"
                    >
                      Switch to text testimonial instead
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      case 'review':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Review Your Testimonial</h2>
              <p className="text-gray-600">Please review your testimonial before submitting</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><strong>Name:</strong> {customerInfo.name}</div>
                <div><strong>Email:</strong> {customerInfo.email || 'Not provided'}</div>
                <div><strong>Title:</strong> {customerInfo.title || 'Not provided'}</div>
                <div><strong>Company:</strong> {customerInfo.company || 'Not provided'}</div>
                <div className="md:col-span-2">
                  <strong>Rating:</strong> 
                  <StarRating rating={customerInfo.rating} onChange={() => {}} size="sm" disabled />
                </div>
              </div>
            </div>
            
            {testimonialType === 'text' ? (
              <div className="bg-white border rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-3">Your Testimonial:</h4>
                <p className="text-gray-700 leading-relaxed">{customerInfo.testimonialText}</p>
              </div>
            ) : recordedVideo ? (
              <div className="bg-white border rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-3">Your Video:</h4>
                <video
                  src={recordedVideo}
                  controls
                  className="w-full max-w-md mx-auto rounded-lg"
                />
              </div>
            ) : null}
          </div>
        )

      case 'success':
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Thank You!</h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Your testimonial has been submitted successfully and is being reviewed. 
              You'll receive an email confirmation shortly.
            </p>
          </div>
        )

      default:
        return null
    }
  }

  const renderStepButtons = () => {
    switch (step) {
      case 'info':
        return (
          <button
            onClick={() => setStep('type')}
            disabled={!customerInfo.name.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300"
          >
            Continue
          </button>
        )

      case 'type':
        return (
          <div className="flex space-x-4">
            <button
              onClick={() => setStep('info')}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-all duration-300"
            >
              Back
            </button>
            <button
              onClick={() => setStep('record')}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300"
            >
              {testimonialType === 'video' ? 'Start Recording' : 'Write Testimonial'}
            </button>
          </div>
        )

      case 'record':
        if (testimonialType === 'text') {
          return (
            <div className="flex space-x-4">
              <button
                onClick={() => setStep('type')}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-all duration-300"
              >
                Back
              </button>
              <button
                onClick={() => setStep('review')}
                disabled={!customerInfo.testimonialText.trim()}
                className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300"
              >
                Review
              </button>
            </div>
          )
        }

        return (
          <div className="flex flex-wrap gap-4 justify-center">
            {!isRecording && !recordedVideo && (
              <>
                <button
                  onClick={() => setStep('type')}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-all duration-300"
                >
                  Back
                </button>
                <button
                  onClick={startRecording}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="8" />
                  </svg>
                  Start Recording
                </button>
              </>
            )}
            
            {isRecording && (
              <button
                onClick={stopRecording}
                className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 flex items-center animate-pulse"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" />
                </svg>
                Stop Recording
              </button>
            )}
            
            {recordedVideo && (
              <>
                <button
                  onClick={retryRecording}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                  </svg>
                  Record Again
                </button>
                <button
                  onClick={() => setStep('review')}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300"
                >
                  Continue
                </button>
              </>
            )}
          </div>
        )

      case 'review':
        return (
          <div className="flex space-x-4">
            <button
              onClick={() => setStep('record')}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-all duration-300"
            >
              Back to Edit
            </button>
            <button
              onClick={handleSubmit}
              disabled={createTestimonialMutation.isPending}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center"
            >
              {createTestimonialMutation.isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                'Submit Testimonial'
              )}
            </button>
          </div>
        )

      case 'success':
        return null

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-center space-x-8">
            {['info', 'type', 'record', 'review', 'success'].map((stepName, index) => {
              const stepNumber = index + 1
              const isActive = step === stepName
              const isCompleted = ['info', 'type', 'record', 'review', 'success'].indexOf(step) > index
              
              return (
                <div key={stepName} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                    isActive ? 'bg-blue-600 text-white scale-110' :
                    isCompleted ? 'bg-green-500 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {isCompleted ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      stepNumber
                    )}
                  </div>
                  {index < 4 && (
                    <div className={`w-16 h-0.5 ml-4 transition-all duration-300 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
          {error && step !== 'record' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                <p className="text-red-800 font-medium">{error}</p>
              </div>
            </div>
          )}

          {renderStepContent()}
          
          {step !== 'success' && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              {renderStepButtons()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
