export default function Dashboard() {
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
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button className="btn btn-primary">
            Create New Project
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Project Cards */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sample Project</h3>
          <p className="text-sm text-gray-600 mb-4">
            Collect testimonials for your product
          </p>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>5 testimonials</span>
            <span>3 pending</span>
          </div>
          <div className="mt-4 flex space-x-2">
            <button className="btn btn-secondary text-xs">View</button>
            <button className="btn btn-primary text-xs">Get Link</button>
          </div>
        </div>

        {/* Empty State */}
        <div className="card p-6 border-dashed border-2 border-gray-300">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Create your first project
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Start collecting testimonials in minutes
            </p>
            <button className="btn btn-primary text-sm">
              Get Started
            </button>
          </div>
        </div>
      </div>

      {/* Recent Testimonials */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Testimonials</h3>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-gray-500">No testimonials yet. Create a project to start collecting!</p>
        </div>
      </div>
    </div>
  )
}
