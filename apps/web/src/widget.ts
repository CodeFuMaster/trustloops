// TrustLoops Embed Widget
// Injects an iframe showing the testimonial wall for a project

interface TrustLoopsWidgetConfig {
  projectSlug?: string
  projectId?: string // legacy
  container?: string | HTMLElement
  height?: number
  width?: number | string
  theme?: 'light' | 'dark'
  tags?: string[]
  minRating?: number
}

class TrustLoopsWidget {
  private iframe: HTMLIFrameElement
  private container: HTMLElement
  private config: TrustLoopsWidgetConfig

  constructor(config: TrustLoopsWidgetConfig) {
    this.config = {
      height: 600,
      width: '100%',
      theme: 'light',
      ...config
    }
    
    // Find container element
    if (typeof config.container === 'string') {
      const element = document.querySelector(config.container)
      if (!element) {
        throw new Error(`Container element "${config.container}" not found`)
      }
      this.container = element as HTMLElement
    } else if (config.container instanceof HTMLElement) {
      this.container = config.container
    } else {
      // Use the script tag's parent as container
      const currentScript = document.currentScript as HTMLScriptElement
      this.container = currentScript?.parentElement || document.body
    }

    this.iframe = this.createIframe()
    this.setupMessageListener()
    this.render()
  }

  private createIframe(): HTMLIFrameElement {
    const iframe = document.createElement('iframe')
    iframe.src = this.getIframeUrl()
    iframe.style.border = 'none'
    iframe.style.width = typeof this.config.width === 'number' 
      ? `${this.config.width}px` 
      : this.config.width!
    iframe.style.height = `${this.config.height}px`
    iframe.style.display = 'block'
    iframe.setAttribute('allowfullscreen', 'true')
    iframe.setAttribute('title', 'TrustLoops Testimonials')
    
    return iframe
  }

  private getIframeUrl(): string {
    const baseUrl = this.getBaseUrl()
  const params = new URLSearchParams({ theme: this.config.theme!, embed: 'true' })
  if (this.config.tags && this.config.tags.length) params.set('tags', this.config.tags.join(','))
  if (typeof this.config.minRating === 'number') params.set('minRating', String(this.config.minRating))
  const slugOrId = this.config.projectSlug || this.config.projectId
  return `${baseUrl}/wall/${slugOrId}?${params.toString()}`
  }

  private getBaseUrl(): string {
    // Try to detect the base URL from the script source
    const currentScript = document.currentScript as HTMLScriptElement
    if (currentScript?.src) {
      const url = new URL(currentScript.src)
      return `${url.protocol}//${url.host}`
    }
    
    // Fallback to production URL or localhost for development
    return window.location.hostname === 'localhost' 
      ? 'http://localhost:5173'
      : 'https://app.trustloops.com'
  }

  private setupMessageListener(): void {
    window.addEventListener('message', (event) => {
      // Only accept messages from our iframe
      if (event.source !== this.iframe.contentWindow) {
        return
      }

      // Handle height resize messages
      if (event.data?.type === 'trustloops:resize') {
        const newHeight = event.data.height
        if (typeof newHeight === 'number' && newHeight > 0) {
          this.iframe.style.height = `${newHeight}px`
        }
      }
    })
  }

  private render(): void {
    this.container.appendChild(this.iframe)
  }

  public destroy(): void {
    if (this.iframe && this.iframe.parentNode) {
      this.iframe.parentNode.removeChild(this.iframe)
    }
  }

  public updateHeight(height: number): void {
    this.iframe.style.height = `${height}px`
  }
}

// Global API
declare global {
  interface Window {
    TrustLoops: {
      widget: (config: TrustLoopsWidgetConfig) => TrustLoopsWidget
    }
  }
}

window.TrustLoops = window.TrustLoops || {}
window.TrustLoops.widget = (config: TrustLoopsWidgetConfig) => {
  return new TrustLoopsWidget(config)
}

// Auto-initialization from data attributes
document.addEventListener('DOMContentLoaded', () => {
  const scripts = document.querySelectorAll('script[data-trustloops-project-slug], script[data-trustloops-project-id]')
  
  scripts.forEach((script) => {
  const projectSlug = script.getAttribute('data-trustloops-project-slug')
  const projectId = script.getAttribute('data-trustloops-project-id') // legacy
    const container = script.getAttribute('data-container')
    const height = script.getAttribute('data-height')
    const width = script.getAttribute('data-width')
    const theme = script.getAttribute('data-theme') as 'light' | 'dark'
  const tagsAttr = script.getAttribute('data-tags')
  const minRatingAttr = script.getAttribute('data-min-rating')

  if (projectSlug || projectId) {
      const config: TrustLoopsWidgetConfig = {
    projectSlug: projectSlug || undefined,
    projectId: projectId || undefined,
        container: container || script.parentElement!,
        height: height ? parseInt(height) : undefined,
        width: width || undefined,
    theme: theme || undefined,
    tags: tagsAttr ? tagsAttr.split(',').map(t => t.trim()).filter(Boolean) : undefined,
    minRating: minRatingAttr ? parseInt(minRatingAttr) : undefined,
      }

      new TrustLoopsWidget(config)
    }
  })
})

export { TrustLoopsWidget, type TrustLoopsWidgetConfig }
