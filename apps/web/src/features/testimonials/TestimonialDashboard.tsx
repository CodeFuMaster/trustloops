import React, { useState, useMemo } from 'react'
import { useTestimonials, useApproveTestimonial, useBulkApproveTestimonials, Testimonial } from '../../hooks/useTestimonials'
import { StarRating } from '../../components/StarRating'

interface TestimonialDashboardProps {
  projectId: string
  userPlan?: string
}

export const TestimonialDashboard: React.FC<TestimonialDashboardProps> = ({
  projectId,
  userPlan = 'free'
}) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all')
  const [selectedTestimonials, setSelectedTestimonials] = useState<Set<string>>(new Set())
  const [showExportModal, setShowExportModal] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  
  const pageSize = 10
  const isPro = userPlan !== 'free'

  const { 
    data: testimonialsData, 
    isLoading, 
    error 
  } = useTestimonials(projectId, {
    page: currentPage,
    pageSize,
    approved: filter === 'all' ? undefined : filter === 'approved'
  })

  const approveTestimonialMutation = useApproveTestimonial()
  const bulkApproveMutation = useBulkApproveTestimonials()

  const testimonials = testimonialsData?.items || []
  const totalCount = testimonialsData?.totalCount || 0
  const totalPages = testimonialsData?.totalPages || 1

  const statistics = useMemo(() => {
    const pending = testimonials.filter((t: Testimonial) => !t.approved).length
    const approved = testimonials.filter((t: Testimonial) => t.approved).length
    const avgRating = testimonials.length > 0 
      ? testimonials.reduce((sum: number, t: Testimonial) => sum + t.rating, 0) / testimonials.length 
      : 0

    return { pending, approved, total: testimonials.length, avgRating }
  }, [testimonials])

  const handleApproveTestimonial = async (id: string) => {
    try {
      await approveTestimonialMutation.mutateAsync(id)
    } catch (error) {
      console.error('Error approving testimonial:', error)
    }
  }

  const handleBulkApprove = async (approved: boolean) => {
    if (!isPro) {
      alert('Bulk approve is a Pro feature. Please upgrade your plan.')
      return
    }

    if (selectedTestimonials.size === 0) {
      alert('Please select testimonials to approve.')
      return
    }

    try {
      await bulkApproveMutation.mutateAsync({
        testimonialIds: Array.from(selectedTestimonials),
        approved
      })
      setSelectedTestimonials(new Set())
    } catch (error) {
      console.error('Error bulk approving testimonials:', error)
    }
  }

  const handleSelectTestimonial = (id: string) => {
    const newSelected = new Set(selectedTestimonials)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedTestimonials(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedTestimonials.size === testimonials.length) {
      setSelectedTestimonials(new Set())
    } else {
      setSelectedTestimonials(new Set(testimonials.map((t: Testimonial) => t.id)))
    }
  }

  const handleExportCSV = async () => {
    if (!isPro) {
      alert('CSV export is a Pro feature. Please upgrade your plan.')
      return
    }

    setIsExporting(true)
    try {
      const response = await fetch(`/api/testimonials/export/${projectId}?approvedOnly=false`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `testimonials-${projectId}-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        setShowExportModal(false)
      } else {
        throw new Error('Export failed')
      }
    } catch (error) {
      console.error('Error exporting testimonials:', error)
      alert('Failed to export testimonials. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading testimonials...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <p className="text-red-800">Error loading testimonials: {error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total</p>
              <p className="text-3xl font-bold">{totalCount}</p>
            </div>
            <div className="w-12 h-12 bg-blue-400 bg-opacity-30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Pending</p>
              <p className="text-3xl font-bold">{statistics.pending}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-400 bg-opacity-30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Approved</p>
              <p className="text-3xl font-bold">{statistics.approved}</p>
            </div>
            <div className="w-12 h-12 bg-green-400 bg-opacity-30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Avg Rating</p>
              <p className="text-3xl font-bold">{statistics.avgRating.toFixed(1)}</p>
            </div>
            <div className="w-12 h-12 bg-purple-400 bg-opacity-30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Filter:</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Testimonials</option>
                <option value="pending">Pending Review</option>
                <option value="approved">Approved</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            {/* Bulk Actions */}
            {selectedTestimonials.size > 0 && (
              <div className="flex items-center space-x-2 bg-blue-50 rounded-lg px-4 py-2">
                <span className="text-sm text-blue-700 font-medium">
                  {selectedTestimonials.size} selected
                </span>
                <button
                  onClick={() => handleBulkApprove(true)}
                  disabled={!isPro || bulkApproveMutation.isPending}
                  className={`text-sm px-3 py-1 rounded-md transition-colors ${
                    isPro 
                      ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  title={!isPro ? 'Pro feature' : 'Approve selected'}
                >
                  Approve
                </button>
                <button
                  onClick={() => handleBulkApprove(false)}
                  disabled={!isPro || bulkApproveMutation.isPending}
                  className={`text-sm px-3 py-1 rounded-md transition-colors ${
                    isPro 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  title={!isPro ? 'Pro feature' : 'Reject selected'}
                >
                  Reject
                </button>
              </div>
            )}

            {/* Export Button */}
            <button
              onClick={() => setShowExportModal(true)}
              disabled={!isPro}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isPro
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              title={!isPro ? 'Pro feature' : 'Export to CSV'}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
              </svg>
              <span>Export CSV</span>
              {!isPro && <span className="text-xs bg-yellow-500 text-white px-1 rounded">PRO</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Testimonials List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {testimonials.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No testimonials found</h3>
            <p className="text-gray-600">
              {filter === 'pending' ? 'No pending testimonials to review.' :
               filter === 'approved' ? 'No approved testimonials yet.' :
               'No testimonials have been submitted yet.'}
            </p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
              <div className="flex items-center">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedTestimonials.size === testimonials.length && testimonials.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-3 text-sm font-medium text-gray-700">
                    Select All
                  </label>
                </div>
              </div>
            </div>

            {/* Testimonials */}
            <div className="divide-y divide-gray-200">
              {testimonials.map((testimonial: Testimonial) => (
                <div key={testimonial.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedTestimonials.has(testimonial.id)}
                      onChange={() => handleSelectTestimonial(testimonial.id)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <h4 className="text-lg font-medium text-gray-900">
                            {testimonial.customerName}
                          </h4>
                          {testimonial.customerTitle && (
                            <span className="text-sm text-gray-600">
                              {testimonial.customerTitle}
                              {testimonial.customerCompany && ` at ${testimonial.customerCompany}`}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <StarRating rating={testimonial.rating} onChange={() => {}} size="sm" disabled />
                          
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            testimonial.approved 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {testimonial.approved ? 'Approved' : 'Pending'}
                          </span>
                          
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            testimonial.type === 'video' 
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {testimonial.type === 'video' ? 'Video' : 'Text'}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="mb-4">
                        {testimonial.type === 'video' && testimonial.videoUrl ? (
                          <div className="relative">
                            <video
                              src={testimonial.videoUrl}
                              controls
                              className="w-full max-w-md rounded-lg shadow-sm"
                              poster={testimonial.thumbnailUrl}
                            />
                          </div>
                        ) : testimonial.quote ? (
                          <blockquote className="text-gray-700 italic border-l-4 border-blue-500 pl-4">
                            "{testimonial.quote}"
                          </blockquote>
                        ) : null}
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                          <span>
                            Submitted {new Date(testimonial.createdUtc).toLocaleDateString()}
                          </span>
                          {testimonial.customerEmail && (
                            <span>{testimonial.customerEmail}</span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {!testimonial.approved && (
                            <>
                              <button
                                onClick={() => handleApproveTestimonial(testimonial.id)}
                                disabled={approveTestimonialMutation.isPending}
                                className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleApproveTestimonial(testimonial.id)}
                                disabled={approveTestimonialMutation.isPending}
                                className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-6 py-3">
          <div className="text-sm text-gray-700">
            Showing page {currentPage} of {totalPages} ({totalCount} total)
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + Math.max(1, currentPage - 2)
              if (page > totalPages) return null
              
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    page === currentPage
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              )
            })}
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Testimonials</h3>
            <p className="text-gray-600 mb-6">
              Export all testimonials for this project as a CSV file. This will include both approved and pending testimonials.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExportCSV}
                disabled={isExporting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isExporting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Exporting...
                  </>
                ) : (
                  'Export CSV'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
