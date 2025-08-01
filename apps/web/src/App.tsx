import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// Lazy load components for better bundle splitting
const Dashboard = lazy(() => import('./features/testimonials/Dashboard'))
const VideoRecorder = lazy(() => import('./features/testimonials/VideoRecorder'))
const EmbedWall = lazy(() => import('./features/testimonials/EmbedWall'))
const Login = lazy(() => import('./pages/Login'))

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Suspense 
          fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
          }
        >
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/record/:projectId" element={<VideoRecorder />} />
            <Route path="/wall/:projectSlug" element={<EmbedWall />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            {/* Redirect root to dashboard */}
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
          </Routes>
        </Suspense>
      </div>
    </AuthProvider>
  )
}

export default App
