import React, { useState, useEffect } from 'react'
import { useIncidents, useCreateIncident, useUpdateIncident, useUpdateComponentStatus, StatusPage, Incident } from '../../hooks/useStatusPages'
import * as signalR from '@microsoft/signalr'

interface IncidentBoardProps {
  statusPage: StatusPage
}

export const IncidentBoard: React.FC<IncidentBoardProps> = ({ statusPage }) => {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null)

  const { data: incidents = [], isLoading } = useIncidents(statusPage.id)
  const updateIncidentMutation = useUpdateIncident()
  const updateComponentMutation = useUpdateComponentStatus()

  // Setup SignalR connection
  useEffect(() => {
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${import.meta.env.VITE_API_URL}/hubs/status`)
      .withAutomaticReconnect()
      .build()

    setConnection(newConnection)

    return () => {
      newConnection.stop()
    }
  }, [])

  useEffect(() => {
    if (connection) {
      connection.start()
        .then(() => {
          // Join status page group for real-time updates
          connection.invoke('JoinStatusPageGroup', statusPage.id)
          
          // Listen for incident updates
          connection.on('IncidentUpdated', (incident: Incident) => {
            // React Query will automatically update with server state
            console.log('Incident updated:', incident)
          })

          connection.on('ComponentStatusChanged', (componentId: string, status: string) => {
            console.log('Component status changed:', componentId, status)
          })
        })
        .catch((err: any) => console.error('SignalR connection error:', err))
    }

    return () => {
      if (connection) {
        connection.invoke('LeaveStatusPageGroup', statusPage.id)
      }
    }
  }, [connection, statusPage.id])

  const getOverallStatus = () => {
    if (incidents.some(i => i.status !== 'resolved' && i.severity === 'critical')) {
      return { status: 'major-outage', label: 'Major Outage', color: 'bg-red-500' }
    }
    if (incidents.some(i => i.status !== 'resolved' && i.severity === 'major')) {
      return { status: 'partial-outage', label: 'Partial Outage', color: 'bg-orange-500' }
    }
    if (incidents.some(i => i.status !== 'resolved')) {
      return { status: 'degraded', label: 'Degraded Performance', color: 'bg-yellow-500' }
    }
    return { status: 'operational', label: 'All Systems Operational', color: 'bg-green-500' }
  }

  const overallStatus = getOverallStatus()

  const handleComponentStatusChange = async (componentId: string, status: 'operational' | 'degraded' | 'partial-outage' | 'major-outage') => {
    try {
      await updateComponentMutation.mutateAsync({ componentId, status })
    } catch (error) {
      console.error('Error updating component status:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading incidents...</span>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{statusPage.name}</h1>
            <p className="text-gray-600 mt-1">Incident Management Dashboard</p>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            <span>Report Incident</span>
          </button>
        </div>

        {/* Overall Status */}
        <div className="flex items-center space-x-4">
          <div className={`w-4 h-4 rounded-full ${overallStatus.color}`}></div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{overallStatus.label}</h2>
            <p className="text-gray-600 text-sm">
              Last updated {new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Components Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Components</h3>
        
        <div className="space-y-3">
          {statusPage.components.map((component) => (
            <div key={component.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h4 className="font-medium text-gray-900">{component.name}</h4>
                  {component.group && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {component.group}
                    </span>
                  )}
                  {component.uptime && (
                    <span className="text-sm text-gray-600">
                      {component.uptime.toFixed(2)}% uptime
                    </span>
                  )}
                </div>
                {component.description && (
                  <p className="text-sm text-gray-600 mt-1">{component.description}</p>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <select
                  value={component.status}
                  onChange={(e) => handleComponentStatusChange(component.id, e.target.value as any)}
                  disabled={updateComponentMutation.isPending}
                  className={`px-3 py-1 rounded-full text-sm font-medium border-0 focus:ring-2 focus:ring-blue-500 ${
                    component.status === 'operational' ? 'bg-green-100 text-green-800' :
                    component.status === 'degraded' ? 'bg-yellow-100 text-yellow-800' :
                    component.status === 'partial-outage' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}
                >
                  <option value="operational">Operational</option>
                  <option value="degraded">Degraded Performance</option>
                  <option value="partial-outage">Partial Outage</option>
                  <option value="major-outage">Major Outage</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Incidents */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Active Incidents</h3>
          <span className="text-sm text-gray-600">
            {incidents.filter(i => i.status !== 'resolved').length} active
          </span>
        </div>

        {incidents.filter(i => i.status !== 'resolved').length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-green-500 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Active Incidents</h4>
            <p className="text-gray-600">All systems are currently operational.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {incidents
              .filter(i => i.status !== 'resolved')
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((incident) => (
                <IncidentCard
                  key={incident.id}
                  incident={incident}
                  statusPage={statusPage}
                  onUpdate={() => setSelectedIncident(incident)}
                />
              ))}
          </div>
        )}
      </div>

      {/* Recent Incidents */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Incidents</h3>
        
        {incidents.filter(i => i.status === 'resolved').length === 0 ? (
          <p className="text-gray-600 text-center py-4">No recent incidents.</p>
        ) : (
          <div className="space-y-4">
            {incidents
              .filter(i => i.status === 'resolved')
              .sort((a, b) => new Date(b.resolvedAt!).getTime() - new Date(a.resolvedAt!).getTime())
              .slice(0, 5)
              .map((incident) => (
                <IncidentCard
                  key={incident.id}
                  incident={incident}
                  statusPage={statusPage}
                  onUpdate={() => setSelectedIncident(incident)}
                  compact
                />
              ))}
          </div>
        )}
      </div>

      {/* Create Incident Modal */}
      {showCreateModal && (
        <CreateIncidentModal
          statusPage={statusPage}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => setShowCreateModal(false)}
        />
      )}

      {/* Update Incident Modal */}
      {selectedIncident && (
        <UpdateIncidentModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onUpdate={(data) => {
            updateIncidentMutation.mutate({
              id: selectedIncident.id,
              status: data.status,
              message: data.message
            })
            setSelectedIncident(null)
          }}
        />
      )}
    </div>
  )
}

interface IncidentCardProps {
  incident: Incident
  statusPage: StatusPage
  onUpdate: () => void
  compact?: boolean
}

const IncidentCard: React.FC<IncidentCardProps> = ({
  incident,
  statusPage,
  onUpdate,
  compact = false
}) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'major': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'minor': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'investigating': return 'bg-blue-100 text-blue-800'
      case 'identified': return 'bg-yellow-100 text-yellow-800'
      case 'monitoring': return 'bg-purple-100 text-purple-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAffectedComponents = () => {
    return statusPage.components.filter(c => incident.affectedComponents.includes(c.id))
  }

  return (
    <div className={`border border-gray-200 rounded-lg p-4 ${compact ? 'bg-gray-50' : 'bg-white'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h4 className="font-semibold text-gray-900">{incident.title}</h4>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(incident.severity)}`}>
              {incident.severity} severity
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(incident.status)}`}>
              {incident.status}
            </span>
          </div>
          
          {!compact && (
            <p className="text-gray-700 mb-3">{incident.description}</p>
          )}

          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>
              Started {new Date(incident.createdAt).toLocaleString()}
            </span>
            {incident.resolvedAt && (
              <span>
                Resolved {new Date(incident.resolvedAt).toLocaleString()}
              </span>
            )}
            {getAffectedComponents().length > 0 && (
              <span>
                Affects: {getAffectedComponents().map(c => c.name).join(', ')}
              </span>
            )}
          </div>
        </div>

        {!compact && incident.status !== 'resolved' && (
          <button
            onClick={onUpdate}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md font-medium"
          >
            Update
          </button>
        )}
      </div>

      {/* Recent Updates */}
      {!compact && incident.updates && incident.updates.length > 0 && (
        <div className="border-t border-gray-200 pt-3 mt-3">
          <h5 className="text-sm font-medium text-gray-900 mb-2">Latest Updates</h5>
          <div className="space-y-2">
            {incident.updates
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 3)
              .map((update) => (
                <div key={update.id} className="text-sm">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(update.status)}`}>
                      {update.status}
                    </span>
                    <span className="text-gray-500">
                      {new Date(update.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-700">{update.message}</p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface CreateIncidentModalProps {
  statusPage: StatusPage
  onClose: () => void
  onSuccess: () => void
}

const CreateIncidentModal: React.FC<CreateIncidentModalProps> = ({
  statusPage,
  onClose,
  onSuccess
}) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState<'minor' | 'major' | 'critical'>('minor')
  const [affectedComponents, setAffectedComponents] = useState<string[]>([])

  const createIncidentMutation = useCreateIncident()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !description.trim()) return

    try {
      await createIncidentMutation.mutateAsync({
        statusPageId: statusPage.id,
        title: title.trim(),
        description: description.trim(),
        severity,
        affectedComponents,
        status: 'investigating'
      })
      onSuccess()
    } catch (error) {
      console.error('Error creating incident:', error)
    }
  }

  const toggleComponent = (componentId: string) => {
    setAffectedComponents(prev => 
      prev.includes(componentId)
        ? prev.filter(id => id !== componentId)
        : [...prev, componentId]
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Report New Incident</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Incident Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Brief description of the issue"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Detailed description of what's happening"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Severity
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="minor">Minor - Minimal impact</option>
              <option value="major">Major - Significant impact</option>
              <option value="critical">Critical - Service unavailable</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Affected Components
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {statusPage.components.map((component) => (
                <label key={component.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={affectedComponents.includes(component.id)}
                    onChange={() => toggleComponent(component.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700">{component.name}</span>
                  {component.group && (
                    <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {component.group}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createIncidentMutation.isPending || !title.trim() || !description.trim()}
              className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {createIncidentMutation.isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                'Create Incident'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface UpdateIncidentModalProps {
  incident: Incident
  onClose: () => void
  onUpdate: (data: { status: 'investigating' | 'identified' | 'monitoring' | 'resolved'; message: string }) => void
}

const UpdateIncidentModal: React.FC<UpdateIncidentModalProps> = ({
  incident,
  onClose,
  onUpdate
}) => {
  const [status, setStatus] = useState<'investigating' | 'identified' | 'monitoring' | 'resolved'>(incident.status)
  const [message, setMessage] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!message.trim()) return

    onUpdate({ status, message: message.trim() })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-lg w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Update Incident</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">{incident.title}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="investigating">Investigating</option>
              <option value="identified">Identified</option>
              <option value="monitoring">Monitoring</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Update Message *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe the current status and any actions taken..."
              required
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!message.trim()}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Post Update
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
