import React, { useState } from 'react'

interface Tab {
  id: string
  label: string
  content: React.ReactNode
  disabled?: boolean
  badge?: string | number
}

interface TabsProps {
  tabs: Tab[]
  defaultTab?: string
  onChange?: (tabId: string) => void
  variant?: 'default' | 'pills' | 'underline'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTab,
  onChange,
  variant = 'default',
  size = 'md',
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)

  const handleTabClick = (tabId: string, disabled?: boolean) => {
    if (disabled) return
    
    setActiveTab(tabId)
    onChange?.(tabId)
  }

  const getTabStyles = () => {
    const baseStyles = 'transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
    
    switch (variant) {
      case 'pills':
        return `${baseStyles} px-4 py-2 rounded-full font-medium`
      case 'underline':
        return `${baseStyles} px-1 py-2 border-b-2 font-medium`
      default:
        return `${baseStyles} px-4 py-2 border-b-2 font-medium`
    }
  }

  const getActiveStyles = () => {
    switch (variant) {
      case 'pills':
        return 'bg-blue-600 text-white'
      case 'underline':
        return 'text-blue-600 border-blue-600'
      default:
        return 'text-blue-600 border-blue-600'
    }
  }

  const getInactiveStyles = () => {
    switch (variant) {
      case 'pills':
        return 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      case 'underline':
        return 'text-gray-500 hover:text-gray-700 border-transparent hover:border-gray-300'
      default:
        return 'text-gray-500 hover:text-gray-700 border-transparent hover:border-gray-300'
    }
  }

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'text-sm'
      case 'lg':
        return 'text-lg'
      default:
        return 'text-base'
    }
  }

  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content

  return (
    <div className={className}>
      {/* Tab List */}
      <div className={`flex space-x-1 ${variant === 'underline' ? 'border-b border-gray-200' : ''}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id, tab.disabled)}
            disabled={tab.disabled}
            className={`
              ${getTabStyles()}
              ${getSizeStyles()}
              ${activeTab === tab.id ? getActiveStyles() : getInactiveStyles()}
              ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              flex items-center space-x-2
            `}
          >
            <span>{tab.label}</span>
            {tab.badge && (
              <span className={`
                inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full
                ${activeTab === tab.id 
                  ? 'bg-white text-blue-600' 
                  : 'bg-gray-200 text-gray-600'
                }
              `}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTabContent}
      </div>
    </div>
  )
}

// Convenience hook for tab state management
export const useTabs = (tabs: Tab[], defaultTab?: string) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)

  const getActiveTab = () => tabs.find(tab => tab.id === activeTab)
  
  const setTab = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId)
    if (tab && !tab.disabled) {
      setActiveTab(tabId)
    }
  }

  return {
    activeTab,
    setActiveTab: setTab,
    getActiveTab
  }
}
