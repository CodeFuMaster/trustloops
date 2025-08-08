import React, { useState } from 'react'
import { useStatusPage, useIncidents, StatusPage, Incident } from '../../hooks/useStatusPages'

interface PublicStatusPageProps {
  slug: string
}

export const PublicStatusPage: React.FC<PublicStatusPageProps> = ({ slug }) => {
  const [subscribeEmail, setSubscribeEmail] = useState('')
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [subscribeSuccess, setSubscribeSuccess] = useState(false)
  
  const { data: statusPage, isLoading, error } = useStatusPage(slug)
  const { data: incidents = [] } = useIncidents(statusPage?.id || '')

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !statusPage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Status Page Not Found</h1>
          <p className="text-gray-600">The status page you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  const getOverallStatus = () => {
    const activeIncidents = incidents.filter(i => i.status !== 'resolved')
    
    if (activeIncidents.some(i => i.severity === 'critical')) {
      return { status: 'major-outage', label: 'Major Outage', color: 'bg-red-500', textColor: 'text-red-800' }
    }
    if (activeIncidents.some(i => i.severity === 'major')) {
      return { status: 'partial-outage', label: 'Partial Outage', color: 'bg-orange-500', textColor: 'text-orange-800' }
    }
    if (activeIncidents.length > 0) {
      return { status: 'degraded', label: 'Degraded Performance', color: 'bg-yellow-500', textColor: 'text-yellow-800' }
    }
    return { status: 'operational', label: 'All Systems Operational', color: 'bg-green-500', textColor: 'text-green-800' }
  }

  const overallStatus = getOverallStatus()

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!subscribeEmail.trim()) return

    setIsSubscribing(true)
    
    try {
      const response = await fetch(`/api/status-pages/${statusPage.id}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: subscribeEmail.trim() })
      })

      if (response.ok) {
        setSubscribeSuccess(true)
        setSubscribeEmail('')
      } else {
        throw new Error('Failed to subscribe')
      }
    } catch (error) {
      console.error('Error subscribing:', error)
      alert('Failed to subscribe. Please try again.')
    } finally {
      setIsSubscribing(false)
    }
  }

  const pageStyle = {
    backgroundColor: statusPage.branding.backgroundColor,
    color: statusPage.branding.textColor
  }

  const primaryColor = statusPage.branding.primaryColor

  return (
    <div className="min-h-screen" style={pageStyle}>
      {/* Maintenance Banner */}
      {statusPage.settings.maintenanceMode && (
        <div className="bg-yellow-500 text-yellow-900 px-4 py-3 text-center">
          <p className="font-medium">
            ⚠️ Scheduled maintenance is currently in progress. Some services may be temporarily unavailable.
          </p>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          {statusPage.branding.logoUrl && (
            <img
              src={statusPage.branding.logoUrl}
              alt={statusPage.name}
              className="h-16 mx-auto mb-6"
            />
          )}
          <h1 className="text-4xl font-bold mb-4">{statusPage.name}</h1>
          {statusPage.description && (
            <p className="text-xl opacity-75 mb-8">{statusPage.description}</p>
          )}

          {/* Overall Status */}
          <div className="inline-flex items-center space-x-3 px-6 py-3 rounded-lg border-2" style={{ borderColor: primaryColor }}>
            <div className={`w-4 h-4 rounded-full ${overallStatus.color}`}></div>
            <span className="text-xl font-semibold">{overallStatus.label}</span>
          </div>
        </div>

        {/* Active Incidents */}
        {incidents.filter(i => i.status !== 'resolved').length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Current Incidents</h2>
            <div className="space-y-6">
              {incidents
                .filter(i => i.status !== 'resolved')
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((incident) => (
                  <PublicIncidentCard
                    key={incident.id}
                    incident={incident}
                    statusPage={statusPage}
                  />
                ))}
            </div>
          </div>
        )}

        {/* Components Status */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Service Status</h2>
          
          {statusPage.components.length === 0 ? (
            <p className="text-center opacity-75 py-8">No components configured.</p>
          ) : (
            <div className="space-y-3">
              {(() => {
                const groups = statusPage.components.reduce((acc: { [key: string]: typeof statusPage.components }, component) => {
                  const group = component.group || 'Services'
                  if (!acc[group]) acc[group] = []
                  acc[group].push(component)
                  return acc
                }, {})

                return Object.entries(groups).map(([groupName, components]) => (
                  <div key={groupName} className="mb-6">
                    {Object.keys(groups).length > 1 && (
                      <h3 className="text-lg font-semibold mb-3 opacity-75">{groupName}</h3>
                    )}
                    <div className="space-y-3">
                      {components.map((component) => (
                        <ComponentStatus
                          key={component.id}
                          component={component}
                          primaryColor={primaryColor}
                          showUptime={statusPage.settings.showUptime}
                        />
                      ))}
                    </div>
                  </div>
                ))
              })()}
            </div>
          )}
        </div>

        {/* Incident History */}
        {statusPage.settings.showIncidentHistory && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Recent Incidents</h2>
            
            {incidents.filter(i => i.status === 'resolved').length === 0 ? (
              <div className="text-center py-8 opacity-75">
                <p>No recent incidents to display.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {incidents
                  .filter(i => i.status === 'resolved')
                  .sort((a, b) => new Date(b.resolvedAt!).getTime() - new Date(a.resolvedAt!).getTime())
                  .slice(0, 10)
                  .map((incident) => (
                    <PublicIncidentCard
                      key={incident.id}
                      incident={incident}
                      statusPage={statusPage}
                      compact
                    />
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Subscribe */}
        {statusPage.settings.subscribersEnabled && (
          <div className="text-center">
            <div className="max-w-md mx-auto p-6 rounded-lg border-2" style={{ borderColor: primaryColor }}>
              <h3 className="text-xl font-semibold mb-4">Stay Updated</h3>
              
              {subscribeSuccess ? (
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L5.53 12.7a.996.996 0 1 0-1.41 1.41L9 19l11-11a.996.996 0 1 0-1.41-1.41L9 16.17z"/>
                    </svg>
                  </div>
                  <p className="text-green-600 font-medium">Successfully subscribed!</p>
                  <p className="text-sm opacity-75 mt-1">
                    You'll receive email notifications about incidents and maintenance.
                  </p>
                </div>
              ) : (
                <>
                  <p className="opacity-75 mb-4">
                    Get notified when we post updates about incidents and scheduled maintenance.
                  </p>
                  
                  <form onSubmit={handleSubscribe} className="flex space-x-2">
                    <input
                      type="email"
                      value={subscribeEmail}
                      onChange={(e) => setSubscribeEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent text-gray-900"
                      style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                      required
                    />
                    <button
                      type="submit"
                      disabled={isSubscribing || !subscribeEmail.trim()}
                      className="px-6 py-2 text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {isSubscribing ? 'Subscribing...' : 'Subscribe'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-16 pt-8 border-t opacity-50" style={{ borderColor: primaryColor }}>
          <p className="text-sm">
            Powered by StatusLoops • Last updated {new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  )
}

interface ComponentStatusProps {
  component: StatusPage['components'][0]
  primaryColor: string
  showUptime: boolean
}

const ComponentStatus: React.FC<ComponentStatusProps> = ({
  component,
  primaryColor,
  showUptime
}) => {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'operational':
        return { label: 'Operational', color: 'bg-green-500', textColor: 'text-green-800' }
      case 'degraded':
        return { label: 'Degraded Performance', color: 'bg-yellow-500', textColor: 'text-yellow-800' }
      case 'partial-outage':
        return { label: 'Partial Outage', color: 'bg-orange-500', textColor: 'text-orange-800' }
      case 'major-outage':
        return { label: 'Major Outage', color: 'bg-red-500', textColor: 'text-red-800' }
      default:
        return { label: 'Unknown', color: 'bg-gray-500', textColor: 'text-gray-800' }
    }
  }

  const statusInfo = getStatusInfo(component.status)

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border" style={{ borderColor: `${primaryColor}20` }}>
      <div className="flex-1">
        <div className="flex items-center space-x-3">
          <h4 className="font-medium">{component.name}</h4>
          {showUptime && component.uptime !== undefined && (
            <span className="text-sm opacity-75">
              {component.uptime.toFixed(2)}% uptime
            </span>
          )}
        </div>
        {component.description && (
          <p className="text-sm opacity-75 mt-1">{component.description}</p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${statusInfo.color}`}></div>
        <span className="text-sm font-medium">{statusInfo.label}</span>
      </div>
    </div>
  )
}

interface PublicIncidentCardProps {
  incident: Incident
  statusPage: StatusPage
  compact?: boolean
}

const PublicIncidentCard: React.FC<PublicIncidentCardProps> = ({
  incident,
  statusPage,
  compact = false
}) => {
  const [showAllUpdates, setShowAllUpdates] = useState(false)

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

  const sortedUpdates = incident.updates
    ? incident.updates.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : []

  const displayUpdates = showAllUpdates ? sortedUpdates : sortedUpdates.slice(0, 3)

  return (
    <div className="p-6 rounded-lg border" style={{ borderColor: statusPage.branding.primaryColor + '40' }}>
      <div className="mb-4">
        <div className="flex items-center space-x-3 mb-2">
          <h3 className="text-xl font-semibold">{incident.title}</h3>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(incident.severity)}`}>
            {incident.severity}
          </span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(incident.status)}`}>
            {incident.status}
          </span>
        </div>

        {!compact && (
          <p className="opacity-75 mb-3">{incident.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-4 text-sm opacity-75">
          <span>
            {incident.status === 'resolved' ? 'Resolved' : 'Started'}{' '}
            {incident.status === 'resolved' && incident.resolvedAt
              ? new Date(incident.resolvedAt).toLocaleString()
              : new Date(incident.createdAt).toLocaleString()
            }
          </span>
          
          {getAffectedComponents().length > 0 && (
            <span>
              Affects: {getAffectedComponents().map(c => c.name).join(', ')}
            </span>
          )}
        </div>
      </div>

      {/* Updates */}
      {!compact && sortedUpdates.length > 0 && (
        <div className="border-t pt-4" style={{ borderColor: statusPage.branding.primaryColor + '20' }}>
          <h4 className="font-medium mb-3">Updates</h4>
          <div className="space-y-4">
            {displayUpdates.map((update) => (
              <div key={update.id} className="border-l-4 border-gray-300 pl-4">
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(update.status)}`}>
                    {update.status}
                  </span>
                  <span className="text-sm opacity-75">
                    {new Date(update.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm">{update.message}</p>
              </div>
            ))}
          </div>

          {sortedUpdates.length > 3 && !showAllUpdates && (
            <button
              onClick={() => setShowAllUpdates(true)}
              className="text-sm mt-3 hover:underline"
              style={{ color: statusPage.branding.primaryColor }}
            >
              Show {sortedUpdates.length - 3} more updates
            </button>
          )}

          {showAllUpdates && sortedUpdates.length > 3 && (
            <button
              onClick={() => setShowAllUpdates(false)}
              className="text-sm mt-3 hover:underline"
              style={{ color: statusPage.branding.primaryColor }}
            >
              Show fewer updates
            </button>
          )}
        </div>
      )}
    </div>
  )
}
