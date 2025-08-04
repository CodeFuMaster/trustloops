import { useState } from 'react'
import { useParams } from 'react-router-dom'

interface EmbedCodeGeneratorProps {
  projectSlug: string
}

export function EmbedCodeGenerator({ projectSlug }: EmbedCodeGeneratorProps) {
  const [embedOptions, setEmbedOptions] = useState({
    height: '600',
    theme: 'light' as 'light' | 'dark',
    showHeader: true
  })

  const baseUrl = window.location.origin
  const embedUrl = `${baseUrl}/wall/${projectSlug}?embed=true&theme=${embedOptions.theme}${!embedOptions.showHeader ? '&header=false' : ''}`
  
  const iframeCode = `<iframe 
  src="${embedUrl}" 
  width="100%" 
  height="${embedOptions.height}" 
  frameborder="0" 
  scrolling="no">
</iframe>`

  const scriptCode = `<script src="${baseUrl}/widget.js" data-trustloops-project-slug="${projectSlug}" data-height="${embedOptions.height}" data-theme="${embedOptions.theme}"></script>`

  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyToClipboard = (code: string, type: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(type)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Embed Testimonial Wall
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Copy and paste this code into your website to display your testimonials.
        </p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-1">
            Height
          </label>
          <select
            id="height"
            value={embedOptions.height}
            onChange={(e) => setEmbedOptions({ ...embedOptions, height: e.target.value })}
            className="input"
          >
            <option value="400">400px</option>
            <option value="600">600px</option>
            <option value="800">800px</option>
            <option value="auto">Auto</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="theme" className="block text-sm font-medium text-gray-700 mb-1">
            Theme
          </label>
          <select
            id="theme"
            value={embedOptions.theme}
            onChange={(e) => setEmbedOptions({ ...embedOptions, theme: e.target.value as 'light' | 'dark' })}
            className="input"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <div className="flex items-center">
          <input
            id="showHeader"
            type="checkbox"
            checked={embedOptions.showHeader}
            onChange={(e) => setEmbedOptions({ ...embedOptions, showHeader: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="showHeader" className="ml-2 block text-sm text-gray-700">
            Show header
          </label>
        </div>
      </div>

      {/* Preview */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-2">Preview</h4>
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
          <iframe
            src={embedUrl}
            width="100%"
            height={embedOptions.height === 'auto' ? '400' : embedOptions.height}
            className="border-0"
            title="Testimonial Wall Preview"
          />
        </div>
      </div>

      {/* Embed Codes */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-900">Simple Iframe (Recommended)</h4>
            <button
              onClick={() => copyToClipboard(iframeCode, 'iframe')}
              className="btn btn-secondary text-xs"
            >
              {copiedCode === 'iframe' ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
            <code>{iframeCode}</code>
          </pre>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-900">JavaScript Widget (Advanced)</h4>
            <button
              onClick={() => copyToClipboard(scriptCode, 'script')}
              className="btn btn-secondary text-xs"
            >
              {copiedCode === 'script' ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
            <code>{scriptCode}</code>
          </pre>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Embed Instructions
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                1. Copy the iframe code above<br />
                2. Paste it into your website's HTML where you want the testimonials to appear<br />
                3. The testimonials will automatically update when you approve new ones
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EmbedCodePage() {
  const { projectSlug } = useParams<{ projectSlug: string }>()
  
  if (!projectSlug) {
    return <div>Project not found</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <EmbedCodeGenerator projectSlug={projectSlug} />
        </div>
      </div>
    </div>
  )
}
