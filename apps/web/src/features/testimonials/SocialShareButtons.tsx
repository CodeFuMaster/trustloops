import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

interface SocialShareButtonsProps {
  testimonialId: string;
  customMessage?: string;
  className?: string;
}

interface SocialPlatform {
  name: string;
  icon: string;
  color: string;
  key: string;
}

const SOCIAL_PLATFORMS: SocialPlatform[] = [
  { name: 'Twitter', icon: '🐦', color: '#1DA1F2', key: 'twitter' },
  { name: 'LinkedIn', icon: '💼', color: '#0077B5', key: 'linkedin' },
  { name: 'Facebook', icon: '👥', color: '#4267B2', key: 'facebook' },
  { name: 'Reddit', icon: '🤖', color: '#FF4500', key: 'reddit' },
  { name: 'WhatsApp', icon: '💬', color: '#25D366', key: 'whatsapp' },
  { name: 'Telegram', icon: '✈️', color: '#0088CC', key: 'telegram' }
];

export default function SocialShareButtons({ 
  testimonialId, 
  customMessage = '',
  className = '' 
}: SocialShareButtonsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shareCount, setShareCount] = useState<Record<string, number>>({});

  const { data: shareUrls = {}, isLoading } = useQuery({
    queryKey: ['share-urls', testimonialId, customMessage],
    queryFn: async (): Promise<Record<string, string>> => {
      const params = new URLSearchParams();
      if (customMessage) params.append('customMessage', customMessage);
      
      const response = await fetch(
        `/api/social/testimonial/${testimonialId}/share-urls?${params}`
      );
      if (!response.ok) throw new Error('Failed to fetch share URLs');
      return response.json();
    }
  });

  const handleShare = async (platform: string, url: string) => {
    // Track the share
    try {
      await fetch(`/api/analytics/testimonial/${testimonialId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 'unknown', // You'd need to pass this in
          platform,
          visitorId: localStorage.getItem('visitorId') || undefined
        })
      });
    } catch (error) {
      console.warn('Failed to track share:', error);
    }

    // Update local share count
    setShareCount(prev => ({
      ...prev,
      [platform]: (prev[platform] || 0) + 1
    }));

    // Open share window
    const width = 600;
    const height = 400;
    const left = (window.innerWidth / 2) - (width / 2);
    const top = (window.innerHeight / 2) - (height / 2);
    
    window.open(
      url,
      'share-window',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );
  };

  const copyToClipboard = async () => {
    try {
      const testimonialUrl = `${window.location.origin}/testimonials/${testimonialId}`;
      await navigator.clipboard.writeText(testimonialUrl);
      
      // Show temporary success message
      const button = document.getElementById('copy-button');
      if (button) {
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="animate-pulse flex gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-8 h-8 bg-gray-300 rounded-full"></div>
          ))}
        </div>
        <span className="text-sm text-gray-500">Loading share options...</span>
      </div>
    );
  }

  const visiblePlatforms = isExpanded ? SOCIAL_PLATFORMS : SOCIAL_PLATFORMS.slice(0, 3);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Share Buttons */}
      <div className="flex items-center gap-1">
        {visiblePlatforms.map((platform) => {
          const url = shareUrls[platform.key];
          const count = shareCount[platform.key] || 0;
          
          if (!url) return null;

          return (
            <button
              key={platform.key}
              onClick={() => handleShare(platform.key, url)}
              className="relative group flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1"
              style={{ 
                backgroundColor: platform.color
              }}
              title={`Share on ${platform.name}`}
            >
              <span className="text-white text-sm">{platform.icon}</span>
              
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {count}
                </span>
              )}
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {platform.name}
              </div>
            </button>
          );
        })}

        {/* Expand/Collapse Button */}
        {SOCIAL_PLATFORMS.length > 3 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
            title={isExpanded ? 'Show less' : 'Show more'}
          >
            <span className="text-xs">
              {isExpanded ? '−' : '+'}
            </span>
          </button>
        )}
      </div>

      {/* Copy Link Button */}
      <button
        id="copy-button"
        onClick={copyToClipboard}
        className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        title="Copy link to clipboard"
      >
        <span className="text-sm">📋</span>
        Copy Link
      </button>

      {/* Share Count */}
      {Object.values(shareCount).some(count => count > 0) && (
        <span className="text-sm text-gray-500 ml-2">
          {Object.values(shareCount).reduce((a, b) => a + b, 0)} shares
        </span>
      )}
    </div>
  );
}

// Enhanced Social Share Modal Component
interface SocialShareModalProps {
  testimonialId: string;
  isOpen: boolean;
  onClose: () => void;
  testimonialData?: {
    customerName: string;
    quote: string;
    rating: number;
    projectName: string;
  };
}

export function SocialShareModal({ 
  testimonialId, 
  isOpen, 
  onClose, 
  testimonialData 
}: SocialShareModalProps) {
  const [customMessage, setCustomMessage] = useState('');
  
  const { data: defaultContent } = useQuery({
    queryKey: ['share-content', testimonialId],
    queryFn: async (): Promise<{ content: string }> => {
      const response = await fetch(`/api/social/testimonial/${testimonialId}/share-content`);
      if (!response.ok) throw new Error('Failed to fetch share content');
      return response.json();
    },
    enabled: isOpen
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Share Testimonial</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>
          </div>

          {/* Testimonial Preview */}
          {testimonialData && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <strong>{testimonialData.customerName}</strong>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(star => (
                    <span 
                      key={star} 
                      className={star <= testimonialData.rating ? 'text-yellow-400' : 'text-gray-300'}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-700 italic">"{testimonialData.quote}"</p>
              <p className="text-xs text-gray-500 mt-1">for {testimonialData.projectName}</p>
            </div>
          )}

          {/* Custom Message */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customize your message (optional)
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder={defaultContent?.content || 'Loading default message...'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={4}
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to use the auto-generated message
            </p>
          </div>

          {/* Share Buttons */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Choose platform:</h4>
            
            <div className="grid grid-cols-2 gap-3">
              {SOCIAL_PLATFORMS.map((platform) => (
                <button
                  key={platform.key}
                  onClick={() => {
                    // Use the SocialShareButtons component logic here
                    onClose();
                  }}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors"
                  style={{ borderColor: platform.color + '20' }}
                >
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                    style={{ backgroundColor: platform.color }}
                  >
                    {platform.icon}
                  </div>
                  <span className="text-sm font-medium">{platform.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <SocialShareButtons 
              testimonialId={testimonialId}
              customMessage={customMessage}
              className="justify-center"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
