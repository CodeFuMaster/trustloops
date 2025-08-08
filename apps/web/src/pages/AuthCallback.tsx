import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function AuthCallback() {
  const navigate = useNavigate()
  const { supabase } = useAuth()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('AuthCallback: Handling auth callback...')
        
        // Get the session from the URL hash
        const { data, error } = await supabase.auth.getSession()
        
        console.log('AuthCallback: Session data:', data)
        console.log('AuthCallback: Error:', error)
        
        if (error) {
          console.error('AuthCallback: Error getting session:', error)
          navigate('/login?error=' + encodeURIComponent(error.message))
          return
        }
        
        if (data.session) {
          console.log('AuthCallback: Session found, redirecting to dashboard')
          navigate('/dashboard')
        } else {
          console.log('AuthCallback: No session found, redirecting to login')
          navigate('/login')
        }
      } catch (err) {
        console.error('AuthCallback: Exception:', err)
        navigate('/login')
      }
    }

    handleAuthCallback()
  }, [navigate, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  )
}
