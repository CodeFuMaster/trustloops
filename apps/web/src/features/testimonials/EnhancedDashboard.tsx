import { useState, useEffect } from 'react'
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
  rating: number
  approved: boolean
  createdUtc: string
  type?: 'text' | 'video'
}

interface Project {
  id: string
  name: string
  slug: string
  description?: string
  userId: string
  createdUtc: string
}

interface ProjectStats {
  project: Project
  pendingCount: number
  approvedCount: number
  recentTestimonials: Testimonial[]
}

interface CreateProjectForm {
  name: string
  description?: string
  callToAction?: string
}

export default function EnhancedDashboard() {
  const { user, supabase } = useAuth()
  const [projectStats, setProjectStats] = useState<ProjectStats[]>([])
  const [allPendingTestimonials, setAllPendingTestimonials] = useState<Testimonial[]>([])
  const [recentApprovedTestimonials, setRecentApprovedTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set())
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creatingProject, setCreatingProject] = useState(false)
  const [newProject, setNewProject] = useState<CreateProjectForm>({
    name: '',
    description: '',
    callToAction: ''
  })

  // Get API base URL from environment
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://localhost:65173'

  // Helper function to get authorization headers
  const getAuthHeaders = async () => {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error || !session?.access_token) {
      throw new Error('No valid session')
    }
    
    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    }
  }

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const headers = await getAuthHeaders()
      
      // Fetch projects
      const projectsResponse = await fetch(`${apiBaseUrl}/api/projects`, { headers })
      
      if (projectsResponse.ok) {
        const projects = await projectsResponse.json()
        
        // Fetch statistics for each project
        const projectStatsPromises = projects.map(async (project: Project) => {
          try {
            // Get pending testimonials for this project
            const pendingResponse = await fetch(`${apiBaseUrl}/api/testimonials/${project.id}?approved=false`, { headers })
            const pendingTestimonials = pendingResponse.ok ? await pendingResponse.json() : []
            
            // Get approved testimonials for this project
            const approvedResponse = await fetch(`${apiBaseUrl}/api/testimonials/${project.id}?approved=true`)
            const approvedTestimonials = approvedResponse.ok ? await approvedResponse.json() : []
            
            // Get recent testimonials (last 3)
            const recentTestimonials = [...approvedTestimonials, ...pendingTestimonials]
              .sort((a, b) => new Date(b.createdUtc).getTime() - new Date(a.createdUtc).getTime())
              .slice(0, 3)
            
            return {
              project,
              pendingCount: pendingTestimonials.length,
              approvedCount: approvedTestimonials.length,
              recentTestimonials
            }
          } catch (error) {
            console.error(`Error fetching stats for project ${project.id}:`, error)
            return {
              project,
              pendingCount: 0,
              approvedCount: 0,
              recentTestimonials: []
            }
          }
        })
        
        const statsResults = await Promise.all(projectStatsPromises)
        setProjectStats(statsResults)
        
        // Set global pending testimonials
        const allPending = statsResults.flatMap((stat: ProjectStats) => 
          stat.recentTestimonials.filter((t: Testimonial) => !t.approved)
        )
        setAllPendingTestimonials(allPending)
        
        // Set recent approved testimonials (last 5 across all projects)
        const allApproved = statsResults.flatMap((stat: ProjectStats) => 
          stat.recentTestimonials.filter((t: Testimonial) => t.approved)
        )
        const recentApproved = allApproved
          .sort((a, b) => new Date(b.createdUtc).getTime() - new Date(a.createdUtc).getTime())
          .slice(0, 5)
        setRecentApprovedTestimonials(recentApproved)
        
      } else if (projectsResponse.status === 401) {
        console.error('Authentication failed - user needs to log in again')
      } else {
        console.error('Failed to fetch projects:', projectsResponse.status)
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProject.name.trim()) return
    
    setCreatingProject(true)
    try {
      const headers = await getAuthHeaders()
      
      const response = await fetch(`${apiBaseUrl}/api/projects`, {
        method: 'POST',
        headers,
        body: JSON.stringify(newProject)
      })

      if (response.ok) {
        await response.json() // Project created successfully
        setNewProject({ name: '', description: '', callToAction: '' })
        setShowCreateModal(false)
        await loadDashboardData() // Reload data
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
        // Reload dashboard data to update counts
        await loadDashboardData()
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const totalPending = projectStats.reduce((acc, stat) => acc + stat.pendingCount, 0)
  const totalApproved = projectStats.reduce((acc, stat) => acc + stat.approvedCount, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Dashboard
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                Manage your testimonial collection projects
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <button 
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
              >
                Create New Project
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900">{projectStats.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                <p className="text-2xl font-bold text-gray-900">{totalPending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">{totalApproved}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Testimonials</p>
                <p className="text-2xl font-bold text-gray-900">{totalPending + totalApproved}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Projects</h2>
          {projectStats.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No projects yet</h3>
              <p className="text-gray-600 mb-6">Create your first project to start collecting testimonials</p>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
              >
                Create Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {projectStats.map((stat) => (
                <div key={stat.project.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{stat.project.name}</h3>
                        <p className="text-gray-600 text-sm">{stat.project.description || 'No description'}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                            {stat.pendingCount} pending
                          </span>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            {stat.approvedCount} approved
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <button
                        onClick={() => copyToClipboard(getTestimonialUrl(stat.project.slug))}
                        className="w-full px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                      >
                        📋 Copy Collection Link
                      </button>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={`/wall/${stat.project.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium text-center"
                        >
                          👁️ View Wall
                        </a>
                        <a
                          href={`/admin/testimonials`}
                          className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium text-center"
                        >
                          ⚙️ Manage
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Testimonials */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending Testimonials */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Pending Approval ({allPendingTestimonials.length})
            </h2>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {allPendingTestimonials.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500">No testimonials pending approval.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {allPendingTestimonials.slice(0, 5).map((testimonial) => (
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
                          
                          {testimonial.quote && (
                            <blockquote className="text-gray-700 italic mb-3">
                              "{testimonial.quote}"
                            </blockquote>
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
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                          >
                            {approvingIds.has(testimonial.id) ? 'Approving...' : 'Approve'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Approved Testimonials */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Recent Testimonials ({recentApprovedTestimonials.length})
            </h2>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {recentApprovedTestimonials.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500">No approved testimonials yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {recentApprovedTestimonials.map((testimonial) => (
                    <div key={testimonial.id} className="p-6">
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
                      
                      {testimonial.quote && (
                        <blockquote className="text-gray-700 italic mb-3">
                          "{testimonial.quote}"
                        </blockquote>
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
                        <span>Approved {formatDate(testimonial.createdUtc)}</span>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                          ✓ Live
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Create Project Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-xl p-8 m-4 max-w-md w-full">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Create New Project</h3>
                <p className="text-gray-600">Start collecting testimonials for your product or service</p>
              </div>

              <form onSubmit={createProject} className="space-y-6">
                <div>
                  <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-2">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    id="projectName"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    placeholder="My Amazing Product"
                  />
                </div>

                <div>
                  <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="projectDescription"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    placeholder="Brief description of your product or service"
                  />
                </div>

                <div>
                  <label htmlFor="callToAction" className="block text-sm font-medium text-gray-700 mb-2">
                    Call to Action
                  </label>
                  <input
                    type="text"
                    id="callToAction"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={newProject.callToAction}
                    onChange={(e) => setNewProject({ ...newProject, callToAction: e.target.value })}
                    placeholder="Share your experience with us!"
                  />
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false)
                      setNewProject({ name: '', description: '', callToAction: '' })
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingProject}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {creatingProject ? 'Creating...' : 'Create Project'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
