import { Link } from 'react-router-dom'

export default function VideoRecorder() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Deprecated Recorder</h1>
        <p className="text-gray-600 mb-6">
          This recorder has been deprecated. Please use the new recording flow.
        </p>
        <Link to="/record/demo" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Go to New Recorder
        </Link>
      </div>
    </div>
  )
}
