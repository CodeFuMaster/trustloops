import { useState, useRef } from 'react'
import { useParams } from 'react-router-dom'

interface CustomerInfo {
  name: string
  email: string
  title: string
  company: string
  quote: string
  rating: number
}

export default function VideoRecorder() {
  const { projectId } = useParams<{ projectId: string }>()
  
  const [isRecording, setIsRecording] = useState(false)
  const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    email: '',
    title: '',
    company: '',
    quote: '',
    rating: 5
  })

  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 }, 
        audio: true 
      })
      
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      })
      mediaRecorderRef.current = mediaRecorder
      
      const chunks: Blob[] = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        
        setRecordedVideo(blob)
        setVideoUrl(url)
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Unable to access camera. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const resetRecording = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl)
    }
    setRecordedVideo(null)
    setVideoUrl(null)
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const submitTestimonial = async () => {
    if (!projectId || !customerInfo.name.trim()) {
      alert('Please fill in required fields')
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('projectId', projectId)
      formData.append('customerName', customerInfo.name)
      formData.append('customerEmail', customerInfo.email)
      formData.append('customerTitle', customerInfo.title)
      formData.append('customerCompany', customerInfo.company)
      formData.append('quote', customerInfo.quote)
      formData.append('rating', customerInfo.rating.toString())
      
      if (recordedVideo) {
        formData.append('video', recordedVideo, 'testimonial.webm')
      }

      const response = await fetch('/api/testimonials', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        setShowSuccess(true)
        // Reset form after 3 seconds
        setTimeout(() => {
          setShowSuccess(false)
          setCustomerInfo({
            name: '',
            email: '',
            title: '',
            company: '',
            quote: '',
            rating: 5
          })
          resetRecording()
        }, 3000)
      } else {
        const error = await response.text()
        alert(`Failed to submit testimonial: ${error}`)
      }
    } catch (error) {
      console.error('Error submitting testimonial:', error)
      alert('Failed to submit testimonial. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateCustomerInfo = (field: keyof CustomerInfo, value: string | number) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }))
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h1>
          <p className="text-gray-600">
            Your testimonial has been submitted successfully and is pending approval.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Share Your Experience
          </h1>

          {/* Customer Information Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name *
              </label>
              <input
                type="text"
                value={customerInfo.name}
                onChange={(e) => updateCustomerInfo('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={customerInfo.email}
                onChange={(e) => updateCustomerInfo('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Title
              </label>
              <input
                type="text"
                value={customerInfo.title}
                onChange={(e) => updateCustomerInfo('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company
              </label>
              <input
                type="text"
                value={customerInfo.company}
                onChange={(e) => updateCustomerInfo('company', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Text Testimonial */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Testimonial
            </label>
            <textarea
              value={customerInfo.quote}
              onChange={(e) => updateCustomerInfo('quote', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tell us about your experience..."
            />
          </div>

          {/* Rating */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating
            </label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => updateCustomerInfo('rating', star)}
                  className={`w-8 h-8 ${
                    star <= customerInfo.rating ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                >
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* Video Recording Section */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Optional: Record a Video Testimonial
            </h3>
            
            <div className="bg-gray-100 rounded-lg p-6">
              {!recordedVideo && !isRecording && (
                <div className="text-center">
                  <div className="w-32 h-32 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-16 h-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <button
                    onClick={startRecording}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Start Recording
                  </button>
                </div>
              )}

              {isRecording && (
                <div className="text-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    className="w-full max-w-md mx-auto rounded-lg mb-4"
                  />
                  <button
                    onClick={stopRecording}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Stop Recording
                  </button>
                </div>
              )}

              {recordedVideo && videoUrl && (
                <div className="text-center">
                  <video
                    src={videoUrl}
                    controls
                    className="w-full max-w-md mx-auto rounded-lg mb-4"
                  />
                  <div className="space-x-4">
                    <button
                      onClick={resetRecording}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Record Again
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <button
              onClick={submitTestimonial}
              disabled={isSubmitting || !customerInfo.name.trim()}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Testimonial'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
