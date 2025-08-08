import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// Lazy load components for better bundle splitting
const Dashboard = lazy(() => import('./pages/Dashboard'))
const RecordTestimonial = lazy(() => import('./pages/RecordTestimonial'))
const TestimonialManagement = lazy(() => import('./pages/TestimonialManagement'))
const EmbedCode = lazy(() => import('./pages/EmbedCode'))
const EmbedWall = lazy(() => import('./features/testimonials/EmbedWall'))
const Login = lazy(() => import('./pages/Login'))
const AuthCallback = lazy(() => import('./pages/AuthCallback'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Theming = lazy(() => import('./pages/Theming'))

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
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/record/:projectSlug" element={<RecordTestimonial />} />
            {/* Alias to support /record/:slug as requested */}
            <Route path="/record/:slug" element={<RecordTestimonial />} />
            <Route path="/wall/:projectSlug" element={<EmbedWall />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/testimonials" element={
              <ProtectedRoute>
                <TestimonialManagement />
              </ProtectedRoute>
            } />
            
            <Route path="/embed/:projectSlug" element={
              <ProtectedRoute>
                <EmbedCode />
              </ProtectedRoute>
            } />
            
            <Route path="/analytics" element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            } />
            
            <Route path="/theming" element={
              <ProtectedRoute>
                <Theming />
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
