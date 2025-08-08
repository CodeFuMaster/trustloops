import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../contexts/AuthContext'

interface Testimonial {
  id: string
  projectId: string
  customerName: string
  customerEmail?: string
  customerTitle?: string
  customerCompany?: string
  quote?: string
  videoUrl?: string
  captionsUrl?: string
  sentiment?: string
  tags?: string[]
  rating: number
  approved: boolean
  createdUtc: string
}

interface Project {
  id: string
  name: string
  slug: string
  description?: string
  userId: string
  createdUtc: string
}

interface CreateProjectForm {
  name: string
  description?: string
}

export default function Dashboard() {
  const { user, supabase } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [pendingTestimonials, setPendingTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set())
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creatingProject, setCreatingProject] = useState(false)
  const [upgradePrompt, setUpgradePrompt] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateProjectForm>()
  
  // Get API base URL from environment
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'

  // Helper function to get authorization headers
  const getAuthHeaders = async () => {
    console.log('Getting auth headers...')
    const { data: { session }, error } = await supabase.auth.getSession()
    
    console.log('Session check:', { 
      session: !!session, 
      user: !!session?.user, 
      access_token: !!session?.access_token,
      error 
    })
    
    if (session?.access_token) {
      console.log('Access token preview:', session.access_token.substring(0, 50) + '...')
    }
    
    if (!session?.access_token) {
      console.log('No valid session or access token found')
      throw new Error('User not authenticated - please log in again')
    }
    
    console.log('Session found, access_token exists:', !!session.access_token)
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    }
  }

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const headers = await getAuthHeaders()
      
      // Fetch user projects
      const projectsResponse = await fetch(`${apiBaseUrl}/api/projects`, { headers })
      
      if (projectsResponse.ok) {
        const userProjects = await projectsResponse.json()
        setProjects(userProjects)
        
        // Fetch pending testimonials for all projects
        if (userProjects.length > 0) {
          const allPendingTestimonials: Testimonial[] = []
          for (const project of userProjects) {
            const response = await fetch(`${apiBaseUrl}/api/testimonials/${project.id}?approved=false`, { headers })
            if (response.ok) {
              const testimonials = await response.json()
              allPendingTestimonials.push(...testimonials)
            }
          }
          setPendingTestimonials(allPendingTestimonials)
        }
      } else if (projectsResponse.status === 401) {
        console.error('Authentication failed - user needs to log in again')
        // Handle authentication error - could redirect to login
      } else {
        console.error('Failed to fetch projects:', projectsResponse.status)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      if (error instanceof Error && error.message.includes('not authenticated')) {
        // Handle authentication error
        console.log('User needs to authenticate')
      }
    } finally {
      setLoading(false)
    }
  }

  const createProject = async (data: CreateProjectForm) => {
    setCreatingProject(true)
    try {
      const headers = await getAuthHeaders()
      
      const response = await fetch(`${apiBaseUrl}/api/projects`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      })

      if (response.ok) {
        const newProject = await response.json()
        setProjects(prev => [...prev, newProject])
        setShowCreateModal(false)
        reset()
        
        // Show success message with collection link
        const collectUrl = `${window.location.origin}/record/${newProject.slug}`
        alert(`Project created! Collection link: ${collectUrl}`)
      } else {
        alert('Failed to create project')
      }
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Failed to create project')
    } finally {
      setCreatingProject(false)
    }
  }

  const approveTestimonial = async (testimonialId: string) => {
    setApprovingIds(prev => new Set(prev).add(testimonialId))
    
    try {
      const headers = await getAuthHeaders()
      
      const response = await fetch(`${apiBaseUrl}/api/testimonials/${testimonialId}/approve`, {
        method: 'PUT',
        headers
      })

      if (response.ok) {
        // Remove from pending list
        setPendingTestimonials(prev => 
          prev.filter(t => t.id !== testimonialId)
        )
      } else {
        alert('Failed to approve testimonial')
      }
    } catch (error) {
      console.error('Error approving testimonial:', error)
      alert('Failed to approve testimonial')
    } finally {
      setApprovingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(testimonialId)
        return newSet
      })
    }
  }

  const runAi = async (testimonialId: string) => {
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`${apiBaseUrl}/api/testimonials/${testimonialId}/ai/process`, {
        method: 'POST',
        headers
      })
      if (res.status === 202) {
        alert('AI processing started. Check back in a minute.')
      } else if (res.status === 402) {
        setUpgradePrompt('AI enrichment is a Pro feature. Please upgrade to use this.')
      } else {
        const msg = await res.text()
        alert(`Failed to start AI processing: ${msg}`)
      }
    } catch (e) {
      console.error('AI enqueue failed', e)
      alert('Failed to start AI processing')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTestimonialUrl = (projectSlug: string) => {
    return `${window.location.origin}/record/${projectSlug}`
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Link copied to clipboard!')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Dashboard
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your testimonial collection projects
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create New Project
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Your Projects</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div key={project.id} className="bg-white rounded-lg shadow-md p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-2">{project.name}</h4>
              <p className="text-sm text-gray-600 mb-4">
                {project.description || 'No description'}
              </p>
              
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>{pendingTestimonials.filter(t => t.projectId === project.id).length} pending</span>
                <span>Created {formatDate(project.createdUtc)}</span>
              </div>
              
              <div className="space-y-2">
                <button
                  onClick={() => copyToClipboard(getTestimonialUrl(project.slug))}
                  className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                >
                  Copy Collection Link
                </button>
                
                <a
                  href={`/wall/${project.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors text-center"
                >
                  View Wall
                </a>
              </div>
            </div>
          ))}

          {/* Create Project Card */}
          <div className="bg-white rounded-lg shadow-md p-6 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center">
            <div className="text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Create New Project
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Start collecting testimonials
              </p>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Testimonials */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Pending Approval ({pendingTestimonials.length})
        </h3>
        
        {pendingTestimonials.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-500">No testimonials pending approval.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="divide-y divide-gray-200">
              {pendingTestimonials.map((testimonial) => (
                <div key={testimonial.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h4 className="text-lg font-medium text-gray-900">
                          {testimonial.customerName}
                        </h4>
                        {testimonial.customerTitle && testimonial.customerCompany && (
                          <span className="ml-2 text-sm text-gray-600">
                            {testimonial.customerTitle} at {testimonial.customerCompany}
                          </span>
                        )}
                      </div>
                      
                      {testimonial.customerEmail && (
                        <p className="text-sm text-gray-600 mb-2">{testimonial.customerEmail}</p>
                      )}
                      
                      {testimonial.quote && (
                        <blockquote className="text-gray-800 mb-4 italic">
                          "{testimonial.quote}"
                        </blockquote>
                      )}
                      
                      {testimonial.videoUrl && (
                        <div className="mb-4">
                          <video
                            src={testimonial.videoUrl}
                            controls
                            className="w-full max-w-md rounded-lg"
                          >
                            {testimonial.captionsUrl && (
                              <track kind="captions" src={testimonial.captionsUrl} srcLang="en" label="English" default />
                            )}
                          </video>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {testimonial.sentiment && (
                              <span className="px-2 py-1 text-xs rounded bg-gray-100">{testimonial.sentiment}</span>
                            )}
                            {testimonial.tags?.map(tag => (
                              <span key={tag} className="px-2 py-1 text-xs rounded bg-gray-100">#{tag}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <svg
                              key={i}
                              className="w-4 h-4 text-yellow-400 fill-current"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span>Submitted {formatDate(testimonial.createdUtc)}</span>
                      </div>
                    </div>
                    
                    <div className="ml-6 flex-shrink-0">
                      <button
                        onClick={() => approveTestimonial(testimonial.id)}
                        disabled={approvingIds.has(testimonial.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        {approvingIds.has(testimonial.id) ? 'Approving...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => runAi(testimonial.id)}
                        className="ml-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                      >
                        Run AI
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Create New Project
              </h3>
              
              <form onSubmit={handleSubmit(createProject)} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Project Name *
                  </label>
                  <input
                    {...register('name', { required: 'Project name is required' })}
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="My Awesome Product"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Brief description of your project..."
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false)
                      reset()
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingProject}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                  >
                    {creatingProject ? 'Creating...' : 'Create Project'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {upgradePrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2">Upgrade required</h3>
            <p className="text-gray-700 mb-4">{upgradePrompt}</p>
            <div className="flex justify-end gap-2">
              <button className="px-3 py-2 rounded bg-gray-200" onClick={() => setUpgradePrompt(null)}>Close</button>
              <a className="px-3 py-2 rounded bg-purple-600 text-white" href="/billing" onClick={() => setUpgradePrompt(null)}>Upgrade</a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
