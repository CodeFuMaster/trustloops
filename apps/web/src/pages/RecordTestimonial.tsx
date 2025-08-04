import { useState, useRef, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useCreateTestimonial } from '../hooks/useTestimonials'

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
  })
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)

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
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 }, 
        audio: true 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
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
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Error accessing camera:', err)
      setError('Could not access camera. Please check permissions.')
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
    
    if (!recordedBlob || !project) {
      setError('Please record a video testimonial first')
      return
    }

    if (!customerInfo.name || !customerInfo.email) {
      setError('Please fill in your name and email')
      return
    }

    setError(null)

    try {
      await createTestimonialMutation.mutateAsync({
        projectId: project.id,
        type: 'video' as const,
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerTitle: customerInfo.title || undefined,
        customerCompany: customerInfo.company || undefined,
        rating: 5, // Default rating for video testimonials
        video: new File([recordedBlob], 'testimonial.webm', { type: 'video/webm' }),
      })

      setSubmitted(true)
    } catch (err) {
      setError('Failed to submit testimonial. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {loading ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-600">Loading project...</p>
          </div>
        ) : error && !project ? (
          <div className="text-center">
            <div className="text-red-600 text-lg font-medium">{error}</div>
            <p className="mt-2 text-gray-600">Please check the project URL and try again.</p>
          </div>
        ) : submitted ? (
          <div className="text-center">
            <div className="text-green-600 text-2xl font-bold mb-4">Thank You!</div>
            <p className="text-lg text-gray-600">
              Your testimonial has been submitted successfully and is being reviewed.
            </p>
            <p className="mt-2 text-gray-600">
              You'll receive an email confirmation shortly.
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Record Your Testimonial
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                {project?.callToAction || 'Share your experience'}
              </p>
              {project && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h2 className="text-xl font-semibold text-blue-900">{project.name}</h2>
                  <p className="text-blue-700">{project.description}</p>
                </div>
              )}
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="card p-8 space-y-6">
          {/* Customer Information Form */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Your Name *
              </label>
              <input
                type="text"
                id="name"
                className="input mt-1"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="input mt-1"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Job Title
              </label>
              <input
                type="text"
                id="title"
                className="input mt-1"
                value={customerInfo.title}
                onChange={(e) => setCustomerInfo({ ...customerInfo, title: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                Company
              </label>
              <input
                type="text"
                id="company"
                className="input mt-1"
                value={customerInfo.company}
                onChange={(e) => setCustomerInfo({ ...customerInfo, company: e.target.value })}
              />
            </div>
          </div>

          {/* Video Recording Section */}
          <div className="text-center">
            <div className="mb-4">
              <video
                ref={videoRef}
                autoPlay
                muted
                className="w-full max-w-lg mx-auto rounded-lg border"
                style={{ display: isRecording || recordedVideo ? 'block' : 'none' }}
              />
              {recordedVideo && (
                <video
                  src={recordedVideo}
                  controls
                  className="w-full max-w-lg mx-auto rounded-lg border mt-4"
                />
              )}
            </div>

            <div className="space-x-4">
              {!isRecording && !recordedVideo && (
                <button onClick={startRecording} className="btn btn-primary">
                  Start Recording
                </button>
              )}
              {isRecording && (
                <button onClick={stopRecording} className="btn btn-secondary">
                  Stop Recording
                </button>
              )}
              {recordedVideo && (
                <>
                  <button type="button" onClick={() => setRecordedVideo(null)} className="btn btn-secondary">
                    Record Again
                  </button>
                  <button 
                    type="submit" 
                    disabled={createTestimonialMutation.isPending}
                    className={`btn btn-primary ${createTestimonialMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {createTestimonialMutation.isPending ? 'Submitting...' : 'Submit Testimonial'}
                  </button>
                </>
              )}
            </div>
          </div>
        </form>
        </>
        )}
      </div>
    </div>
  )
}
