import { useState, useRef, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useCreateTestimonial } from '../hooks/useTestimonials'
import { StarRating } from '../components/StarRating'
import { useVideoUpload } from '../hooks/useVideoUpload'
import { useToast } from '../components/ui/Toast'

const API_BASE = import.meta.env.VITE_API_URL || 'https://localhost:65173'

interface Project {
  id: string
  name: string
  description: string
  callToAction: string
  slug: string
}

export default function RecordTestimonial() {
  const { projectSlug } = useParams()
  const createTestimonialMutation = useCreateTestimonial()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    title: '',
    company: '',
    testimonialText: '', // For text testimonials
    rating: 5, // Default to 5, but allow user to change
  })
  const [testimonialType, setTestimonialType] = useState<'text' | 'video'>('text')
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [uploadState, uploadApi] = useVideoUpload()
  const { showToast } = useToast()
  const isE2E = typeof window !== 'undefined' && (window as any).__E2E__ === true

  useEffect(() => {
    if (projectSlug) {
      loadProject()
    }
  }, [projectSlug])

  const loadProject = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE}/api/projects/${projectSlug}`)
      if (response.ok) {
        const projectData = await response.json()
        setProject(projectData)
      } else {
        setError('Project not found')
      }
    } catch (err) {
      setError('Failed to load project')
    } finally {
      setLoading(false)
    }
  }

  const startRecording = async () => {
    try {
      // Mobile-friendly constraints: prefer 720p, allow browser to downscale
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, max: 1280 },
          height: { ideal: 720, max: 720 },
          facingMode: 'user'
        },
        audio: true
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      // Safari/iOS may not support vp9; fall back to webm default
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : (MediaRecorder.isTypeSupported('video/webm;codecs=vp8') ? 'video/webm;codecs=vp8' : 'video/webm')
      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      
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
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Error accessing camera:', err)
      setError('Could not access camera. Please check permissions.')
      showToast('error', 'Camera/mic permission denied. Please allow access and try again.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!project) return
    
    // Validation
    if (!customerInfo.name.trim()) {
      setError('Please enter your name')
      return
    }
    
    if (!customerInfo.email.trim()) {
      setError('Please enter your email')
      return
    }
    
    if (testimonialType === 'video' && !recordedBlob) {
      setError('Please record a video testimonial first')
      return
    }
    
    if (testimonialType === 'text' && !customerInfo.testimonialText.trim()) {
      setError('Please write your testimonial')
      return
    }

    setError(null)

    try {
      if (testimonialType === 'video') {
        await uploadApi.upload({
          projectId: project.id,
          file: recordedBlob ?? undefined,
          payload: {
            type: 'video',
            customerName: customerInfo.name,
            customerEmail: customerInfo.email,
            customerTitle: customerInfo.title || undefined,
            customerCompany: customerInfo.company || undefined,
            rating: customerInfo.rating,
          },
        })
      } else {
        await createTestimonialMutation.mutateAsync({
          projectId: project.id,
          type: 'text',
          content: customerInfo.testimonialText,
          customerName: customerInfo.name,
          customerEmail: customerInfo.email,
          customerTitle: customerInfo.title || undefined,
          customerCompany: customerInfo.company || undefined,
          rating: customerInfo.rating,
        })
      }
      setSubmitted(true)
      showToast('success', 'Thanks! Your testimonial was submitted.')
    } catch (err) {
      console.error('Error submitting testimonial:', err)
      setError('Failed to submit testimonial. Please try again.')
      showToast('error', 'Upload failed. Please retry.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {loading ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="mt-6 text-xl text-gray-600 font-medium">Loading project...</p>
          </div>
        ) : error && !project ? (
          <div className="text-center bg-white rounded-2xl shadow-xl p-8">
            <div className="text-red-600 text-2xl font-bold mb-4">{error}</div>
            <p className="text-lg text-gray-600">Please check the project URL and try again.</p>
          </div>
        ) : submitted ? (
          <div className="text-center bg-white rounded-2xl shadow-2xl p-12">
            <div className="mb-6">
              <svg className="w-24 h-24 mx-auto text-green-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <div className="text-green-600 text-3xl font-bold mb-6">Thank You!</div>
            <p className="text-xl text-gray-700 mb-4">
              Your testimonial has been submitted successfully and is being reviewed.
            </p>
            <p className="text-lg text-gray-600">
              You'll receive an email confirmation shortly.
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-12">
              <div className="mb-8">
                <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                  Share Your Story
                </h1>
                <p className="text-2xl text-gray-700 font-medium">
                  {project?.callToAction || 'Your experience matters to us'}
                </p>
              </div>
              {project && (
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 max-w-2xl mx-auto">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">{project.name}</h2>
                  <p className="text-gray-700 leading-relaxed">{project.description}</p>
                </div>
              )}
            </div>

            {error && (
              <div className="mb-8 p-6 bg-red-50 border-2 border-red-200 rounded-2xl shadow-lg">
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-red-600 mr-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                  </svg>
                  <p className="text-red-800 font-medium">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-8 space-y-8 border border-gray-100">
              {/* Testimonial Type Selection */}
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Choose Your Testimonial Type</h3>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    type="button"
                    onClick={() => setTestimonialType('video')}
                    className={`
                      flex items-center justify-center p-6 rounded-xl border-2 transition-all duration-300 transform hover:scale-105
                      ${testimonialType === 'video'
                        ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-lg'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="text-center">
                      <div className="mb-3">
                        <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                      <div className="font-semibold text-lg">Video Testimonial</div>
                      <div className="text-sm opacity-75">Record a video message</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTestimonialType('text')}
                    className={`
                      flex items-center justify-center p-6 rounded-xl border-2 transition-all duration-300 transform hover:scale-105
                      ${testimonialType === 'text'
                        ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 shadow-lg'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="text-center">
                      <div className="mb-3">
                        <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                        </svg>
                      </div>
                      <div className="font-semibold text-lg">Text Testimonial</div>
                      <div className="text-sm opacity-75">Write your feedback</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Customer Information Form */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                  Your Information
                </h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                      required
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                      required
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                      Job Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      value={customerInfo.title}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, title: e.target.value })}
                      placeholder="Your job title"
                    />
                  </div>
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                      Company
                    </label>
                    <input
                      type="text"
                      id="company"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      value={customerInfo.company}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, company: e.target.value })}
                      placeholder="Your company name"
                    />
                  </div>
                </div>
              </div>

              {/* Rating Section */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  Rate Your Experience
                </h3>
                <StarRating
                  rating={customerInfo.rating}
                  onChange={(rating: number) => setCustomerInfo({ ...customerInfo, rating })}
                  size="lg"
                />
              </div>

              {/* Text Testimonial Section */}
              {testimonialType === 'text' && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                    </svg>
                    Write Your Testimonial
                  </h3>
                  <textarea
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 resize-none"
                    rows={6}
                    value={customerInfo.testimonialText}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, testimonialText: e.target.value })}
                    placeholder="Share your experience, what you liked, and how it helped you..."
                    required={testimonialType === 'text'}
                  />
                  <div className="mt-2 text-sm text-gray-600 flex justify-between">
                    <span>Minimum 50 characters recommended</span>
                    <span>{customerInfo.testimonialText.length} characters</span>
                  </div>
                </div>
              )}

              {/* Video Recording Section */}
              {testimonialType === 'video' && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                    Record Your Video
                  </h3>
                  
                  <div className="text-center">
                    <div className="mb-6">
                      {(isRecording || recordedVideo) && (
                        <video
                          ref={videoRef}
                          autoPlay
                          muted
                          className="w-full max-w-lg mx-auto rounded-xl border-4 border-white shadow-2xl"
                          style={{ display: isRecording ? 'block' : 'none' }}
                        />
                      )}
                      {recordedVideo && (
                        <video
                          src={recordedVideo}
                          controls
                          className="w-full max-w-lg mx-auto rounded-xl border-4 border-white shadow-2xl"
                        />
                      )}
                      {!isRecording && !recordedVideo && (
                        <div className="w-full max-w-lg mx-auto h-64 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl border-4 border-white shadow-lg flex items-center justify-center">
                          <div className="text-center text-gray-500">
                            <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                            <p className="text-lg font-medium">Ready to record your testimonial</p>
                            <p className="text-sm">Click "Start Recording" to begin</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-4 justify-center">
            {!isRecording && !recordedVideo && (
                        <button
                          type="button"
              onClick={startRecording}
              disabled={uploadState.isUploading}
                          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center"
                        >
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="8" />
                          </svg>
                          Start Recording
                        </button>
                      )}
                      
                      {isRecording && (
                        <button
                          type="button"
                          onClick={stopRecording}
                          disabled={uploadState.isUploading}
                          className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center animate-pulse"
                        >
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <rect x="6" y="6" width="12" height="12" />
                          </svg>
                          Stop Recording
                        </button>
                      )}
                      
                      {recordedVideo && (
                        <button
                          type="button"
                          onClick={() => {
                            setRecordedVideo(null)
                            setRecordedBlob(null)
                          }}
                          disabled={uploadState.isUploading}
                          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center"
                        >
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                          </svg>
                          Record Again
                        </button>
                      )}

                      {isE2E && !isRecording && !recordedVideo && (
                        <button
                          type="button"
                          onClick={() => {
                            const blob = new Blob(['dummy'], { type: 'video/webm' })
                            setRecordedBlob(blob)
                            const url = URL.createObjectURL(blob)
                            setRecordedVideo(url)
                          }}
                          className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center"
                        >
                          Simulate Recording (E2E)
                        </button>
                      )}
                    </div>

                    {/* Upload progress & controls */}
                    {recordedBlob && (
                      <div className="mt-6 max-w-lg mx-auto">
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full ${uploadState.error ? 'bg-red-500' : 'bg-blue-600'}`}
                            style={{ width: `${uploadState.progress}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
                          <span>{uploadState.isUploading ? `Uploading… ${uploadState.progress}%` : (uploadState.error ? 'Upload failed' : 'Ready to submit')}</span>
                          <div className="space-x-2">
                            {uploadState.isUploading && (
                              <button type="button" onClick={uploadApi.cancel} className="px-3 py-1 rounded border text-gray-700">Cancel</button>
                            )}
                            {!uploadState.isUploading && uploadState.error && (
                              <button type="button" onClick={uploadApi.retry} className="px-3 py-1 rounded border text-blue-700 border-blue-300">Retry</button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="text-center pt-6">
                <button
                  type="submit"
                  disabled={createTestimonialMutation.isPending || uploadState.isUploading || (testimonialType === 'video' && !recordedVideo) || (testimonialType === 'text' && !customerInfo.testimonialText.trim())}
                  className={`
                    bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 
                    disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed
                    text-white font-bold text-lg py-4 px-12 rounded-xl shadow-2xl hover:shadow-3xl 
                    transition-all duration-300 transform hover:scale-105 disabled:transform-none
                    flex items-center justify-center mx-auto min-w-[200px]
                  `}
                >
                  {createTestimonialMutation.isPending || uploadState.isUploading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {uploadState.isUploading ? 'Uploading…' : 'Submitting...'}
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
                      </svg>
                      Submit Testimonial
                    </>
                  )}
                </button>
                
                {(testimonialType === 'video' && !recordedVideo) && (
                  <p className="mt-3 text-sm text-gray-500">Please record a video to submit your testimonial</p>
                )}
                {(testimonialType === 'text' && !customerInfo.testimonialText.trim()) && (
                  <p className="mt-3 text-sm text-gray-500">Please write your testimonial to submit</p>
                )}
              </div>
            </form>
        </>
        )}
      </div>
    </div>
  )
}
