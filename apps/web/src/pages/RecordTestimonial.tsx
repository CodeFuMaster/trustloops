import { useState, useRef } from 'react'
import { useParams } from 'react-router-dom'

export default function RecordTestimonial() {
  const { projectSlug } = useParams()
  const [isRecording, setIsRecording] = useState(false)
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null)
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    title: '',
    company: '',
  })
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      
      const chunks: Blob[] = []
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data)
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        setRecordedVideo(url)
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error accessing camera:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const submitTestimonial = async () => {
    // TODO: Implement video upload and testimonial submission
    console.log('Submitting testimonial:', { customerInfo, recordedVideo })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Record Your Testimonial
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Share your experience with {projectSlug}
          </p>
        </div>

        <div className="card p-8 space-y-6">
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
                  <button onClick={() => setRecordedVideo(null)} className="btn btn-secondary">
                    Record Again
                  </button>
                  <button onClick={submitTestimonial} className="btn btn-primary">
                    Submit Testimonial
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
