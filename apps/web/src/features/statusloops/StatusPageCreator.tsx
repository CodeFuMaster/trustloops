import React, { useState } from 'react'
import { useCreateStatusPage } from '../../hooks/useStatusPages'

interface StatusPageCreatorProps {
  onSuccess?: (statusPageId: string) => void
  onCancel?: () => void
}

interface StatusPageData {
  name: string
  slug: string
  description: string
  customDomain?: string
  branding: {
    logoUrl?: string
    primaryColor: string
    backgroundColor: string
    textColor: string
  }
  components: StatusComponent[]
  settings: {
    showUptime: boolean
    showIncidentHistory: boolean
    maintenanceMode: boolean
    subscribersEnabled: boolean
  }
}

interface StatusComponent {
  id?: string
  name: string
  description?: string
  group?: string
  status: 'operational' | 'degraded' | 'partial-outage' | 'major-outage'
  uptime?: number
}

const defaultStatusPage: StatusPageData = {
  name: '',
  slug: '',
  description: '',
  branding: {
    primaryColor: '#3B82F6',
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937'
  },
  components: [],
  settings: {
    showUptime: true,
    showIncidentHistory: true,
    maintenanceMode: false,
    subscribersEnabled: true
  }
}

export const StatusPageCreator: React.FC<StatusPageCreatorProps> = ({
  onSuccess,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [statusPage, setStatusPage] = useState<StatusPageData>(defaultStatusPage)
  const [newComponent, setNewComponent] = useState<StatusComponent>({
    name: '',
    description: '',
    group: '',
    status: 'operational'
  })

  const createStatusPageMutation = useCreateStatusPage()

  const totalSteps = 4

  const updateStatusPage = (updates: Partial<StatusPageData>) => {
    setStatusPage(prev => ({ ...prev, ...updates }))
  }

  const updateBranding = (updates: Partial<StatusPageData['branding']>) => {
    setStatusPage(prev => ({
      ...prev,
      branding: { ...prev.branding, ...updates }
    }))
  }

  const updateSettings = (updates: Partial<StatusPageData['settings']>) => {
    setStatusPage(prev => ({
      ...prev,
      settings: { ...prev.settings, ...updates }
    }))
  }

  const addComponent = () => {
    if (!newComponent.name.trim()) return

    const component: StatusComponent = {
      ...newComponent,
      id: Date.now().toString()
    }

    setStatusPage(prev => ({
      ...prev,
      components: [...prev.components, component]
    }))

    setNewComponent({
      name: '',
      description: '',
      group: '',
      status: 'operational'
    })
  }

  const removeComponent = (componentId: string) => {
    setStatusPage(prev => ({
      ...prev,
      components: prev.components.filter(c => c.id !== componentId)
    }))
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50)
  }

  const handleNameChange = (name: string) => {
    updateStatusPage({ 
      name,
      slug: statusPage.slug || generateSlug(name)
    })
  }

  const handleSubmit = async () => {
    try {
      const result = await createStatusPageMutation.mutateAsync(statusPage)
      onSuccess?.(result.id)
    } catch (error) {
      console.error('Error creating status page:', error)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return statusPage.name.trim() && statusPage.slug.trim()
      case 2:
        return statusPage.components.length > 0
      case 3:
        return true
      case 4:
        return true
      default:
        return false
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return renderBasicInfo()
      case 2:
        return renderComponents()
      case 3:
        return renderBranding()
      case 4:
        return renderSettings()
      default:
        return null
    }
  }

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        <p className="text-gray-600 mb-6">
          Set up the basic details for your status page.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status Page Name *
          </label>
          <input
            type="text"
            value={statusPage.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="My Service Status"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            URL Slug *
          </label>
          <div className="flex items-center">
            <span className="text-gray-500 mr-2">status.yoursite.com/</span>
            <input
              type="text"
              value={statusPage.slug}
              onChange={(e) => updateStatusPage({ slug: e.target.value })}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="my-service"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            This will be your status page URL
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={statusPage.description}
            onChange={(e) => updateStatusPage({ description: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Monitor the status of our services and infrastructure"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Domain (Optional)
          </label>
          <input
            type="text"
            value={statusPage.customDomain || ''}
            onChange={(e) => updateStatusPage({ customDomain: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="status.yoursite.com"
          />
          <p className="text-xs text-gray-500 mt-1">
            Optional: Use your own domain for the status page
          </p>
        </div>
      </div>
    </div>
  )

  const renderComponents = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Components</h3>
        <p className="text-gray-600 mb-6">
          Add the services and components you want to monitor.
        </p>
      </div>

      {/* Add Component Form */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
        <h4 className="font-medium text-gray-900">Add New Component</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Component Name *
            </label>
            <input
              type="text"
              value={newComponent.name}
              onChange={(e) => setNewComponent(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="API Server"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group (Optional)
            </label>
            <input
              type="text"
              value={newComponent.group || ''}
              onChange={(e) => setNewComponent(prev => ({ ...prev, group: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Core Services"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            value={newComponent.description || ''}
            onChange={(e) => setNewComponent(prev => ({ ...prev, description: e.target.value }))}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            placeholder="Main API server handling user requests"
          />
        </div>

        <div className="flex items-center justify-between">
          <select
            value={newComponent.status}
            onChange={(e) => setNewComponent(prev => ({ ...prev, status: e.target.value as any }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="operational">Operational</option>
            <option value="degraded">Degraded Performance</option>
            <option value="partial-outage">Partial Outage</option>
            <option value="major-outage">Major Outage</option>
          </select>

          <button
            onClick={addComponent}
            disabled={!newComponent.name.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            Add Component
          </button>
        </div>
      </div>

      {/* Components List */}
      {statusPage.components.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Added Components</h4>
          
          {statusPage.components.map((component) => (
            <div key={component.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h5 className="font-medium text-gray-900">{component.name}</h5>
                  {component.group && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {component.group}
                    </span>
                  )}
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    component.status === 'operational' ? 'bg-green-100 text-green-800' :
                    component.status === 'degraded' ? 'bg-yellow-100 text-yellow-800' :
                    component.status === 'partial-outage' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {component.status.replace('-', ' ')}
                  </span>
                </div>
                {component.description && (
                  <p className="text-sm text-gray-600 mt-1">{component.description}</p>
                )}
              </div>

              <button
                onClick={() => removeComponent(component.id!)}
                className="text-red-600 hover:text-red-800 p-1"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderBranding = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Branding & Appearance</h3>
        <p className="text-gray-600 mb-6">
          Customize the look and feel of your status page.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo URL (Optional)
            </label>
            <input
              type="url"
              value={statusPage.branding.logoUrl || ''}
              onChange={(e) => updateBranding({ logoUrl: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://yoursite.com/logo.png"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Color
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={statusPage.branding.primaryColor}
                onChange={(e) => updateBranding({ primaryColor: e.target.value })}
                className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={statusPage.branding.primaryColor}
                onChange={(e) => updateBranding({ primaryColor: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Background Color
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={statusPage.branding.backgroundColor}
                onChange={(e) => updateBranding({ backgroundColor: e.target.value })}
                className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={statusPage.branding.backgroundColor}
                onChange={(e) => updateBranding({ backgroundColor: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Text Color
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={statusPage.branding.textColor}
                onChange={(e) => updateBranding({ textColor: e.target.value })}
                className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={statusPage.branding.textColor}
                onChange={(e) => updateBranding({ textColor: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Preview</h4>
          
          <div 
            className="border border-gray-200 rounded-lg p-6 min-h-64"
            style={{ 
              backgroundColor: statusPage.branding.backgroundColor,
              color: statusPage.branding.textColor 
            }}
          >
            <div className="text-center mb-6">
              {statusPage.branding.logoUrl && (
                <img 
                  src={statusPage.branding.logoUrl} 
                  alt="Logo" 
                  className="h-12 mx-auto mb-4"
                />
              )}
              <h2 className="text-2xl font-bold mb-2">{statusPage.name || 'Your Status Page'}</h2>
              {statusPage.description && (
                <p className="opacity-75">{statusPage.description}</p>
              )}
            </div>

            <div className="space-y-3">
              <div 
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ backgroundColor: `${statusPage.branding.primaryColor}10` }}
              >
                <span className="font-medium">Overall Status</span>
                <span 
                  className="px-3 py-1 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: statusPage.branding.primaryColor }}
                >
                  All Systems Operational
                </span>
              </div>

              {statusPage.components.slice(0, 3).map((component, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border opacity-75">
                  <span>{component.name}</span>
                  <span className="text-sm">Operational</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Settings & Features</h3>
        <p className="text-gray-600 mb-6">
          Configure additional features for your status page.
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Show Uptime Statistics</h4>
            <p className="text-sm text-gray-600">Display uptime percentages for each component</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={statusPage.settings.showUptime}
              onChange={(e) => updateSettings({ showUptime: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Show Incident History</h4>
            <p className="text-sm text-gray-600">Display past incidents and maintenance</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={statusPage.settings.showIncidentHistory}
              onChange={(e) => updateSettings({ showIncidentHistory: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Email Subscribers</h4>
            <p className="text-sm text-gray-600">Allow users to subscribe to incident notifications</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={statusPage.settings.subscribersEnabled}
              onChange={(e) => updateSettings({ subscribersEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Maintenance Mode</h4>
            <p className="text-sm text-gray-600">Show maintenance banner on status page</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={statusPage.settings.maintenanceMode}
              onChange={(e) => updateSettings({ maintenanceMode: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4">Summary</h4>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Name:</span>
            <span className="ml-2 font-medium">{statusPage.name}</span>
          </div>
          <div>
            <span className="text-gray-600">URL:</span>
            <span className="ml-2 font-medium">{statusPage.slug}</span>
          </div>
          <div>
            <span className="text-gray-600">Components:</span>
            <span className="ml-2 font-medium">{statusPage.components.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Subscribers:</span>
            <span className="ml-2 font-medium">{statusPage.settings.subscribersEnabled ? 'Enabled' : 'Disabled'}</span>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Create Status Page</h2>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          )}
        </div>

        {/* Progress Steps */}
        <div className="flex items-center space-x-4">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step < currentStep ? 'bg-blue-600 text-white' :
                step === currentStep ? 'bg-blue-100 text-blue-600 border-2 border-blue-600' :
                'bg-gray-200 text-gray-600'
              }`}>
                {step < currentStep ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L5.53 12.7a.996.996 0 1 0-1.41 1.41L9 19l11-11a.996.996 0 1 0-1.41-1.41L9 16.17z"/>
                  </svg>
                ) : (
                  step
                )}
              </div>
              {step < totalSteps && (
                <div className={`w-12 h-0.5 ml-2 ${
                  step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        <div className="mt-4">
          <p className="text-gray-600">
            Step {currentStep} of {totalSteps}: {
              currentStep === 1 ? 'Basic Information' :
              currentStep === 2 ? 'Service Components' :
              currentStep === 3 ? 'Branding & Appearance' :
              'Settings & Features'
            }
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        {renderStep()}
      </div>

      {/* Footer */}
      <div className="px-8 py-6 border-t border-gray-200 flex items-center justify-between">
        <button
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>

        <div className="flex space-x-3">
          {currentStep < totalSteps ? (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceed()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed() || createStatusPageMutation.isPending}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {createStatusPageMutation.isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                'Create Status Page'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
