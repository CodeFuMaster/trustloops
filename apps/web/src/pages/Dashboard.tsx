import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useProjects, useCreateProject } from '../hooks/useProjects'

export default function Dashboard() {
  const { data: projects, isLoading, error } = useProjects()
  const createProjectMutation = useCreateProject()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    callToAction: 'Share your experience'
  })

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProject.name.trim()) return

    try {
      await createProjectMutation.mutateAsync(newProject)
      setNewProject({ name: '', description: '', callToAction: 'Share your experience' })
      setShowCreateForm(false)
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Dashboard
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your testimonial collection projects
          </p>
        </div>
        <div className="mt-4 flex space-x-3 md:mt-0 md:ml-4">
          <Link 
            to="/admin/testimonials"
            className="btn btn-secondary"
          >
            Manage Testimonials
          </Link>
          <button 
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary"
            disabled={createProjectMutation.isPending}
          >
            {createProjectMutation.isPending ? 'Creating...' : 'Create New Project'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading projects
              </h3>
              <div className="mt-2 text-sm text-red-700">
                {error instanceof Error ? error.message : 'An error occurred'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Project</h3>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Project Name</label>
                  <input
                    type="text"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="My Awesome Product"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Tell us about your project..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Call to Action</label>
                  <input
                    type="text"
                    value={newProject.callToAction}
                    onChange={(e) => setNewProject({ ...newProject, callToAction: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Share your experience"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createProjectMutation.isPending}
                    className="btn btn-primary"
                  >
                    {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Project Cards */}
        {projects && projects.length > 0 ? (
          projects.map((project) => (
            <div key={project.id} className="card p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">{project.name}</h3>
              <p className="text-sm text-gray-600 mb-4">
                {project.description || 'No description provided'}
              </p>
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>0 testimonials</span>
                <span>0 pending</span>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => window.open(`/wall/${project.slug}`, '_blank')}
                  className="btn btn-secondary text-xs"
                >
                  View Wall
                </button>
                <button 
                  onClick={() => window.open(`/embed/${project.slug}`, '_blank')}
                  className="btn btn-secondary text-xs"
                >
                  Embed
                </button>
                <button 
                  onClick={() => {
                    const url = `${window.location.origin}/record/${project.slug}`
                    navigator.clipboard.writeText(url)
                    // TODO: Show toast notification
                  }}
                  className="btn btn-primary text-xs"
                >
                  Copy Link
                </button>
              </div>
            </div>
          ))
        ) : (
          /* Empty State */
          <div className="card p-6 border-dashed border-2 border-gray-300">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Create your first project
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Start collecting testimonials in minutes
              </p>
              <button 
                onClick={() => setShowCreateForm(true)}
                className="btn btn-primary text-sm"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recent Testimonials */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Testimonials</h3>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-gray-500">
            {projects && projects.length > 0 
              ? 'No testimonials yet. Share your project links to start collecting!' 
              : 'Create a project to start collecting testimonials!'
            }
          </p>
        </div>
      </div>
    </div>
  )
}
