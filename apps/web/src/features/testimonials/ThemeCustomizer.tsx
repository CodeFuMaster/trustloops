import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ThemeCustomizerProps {
  projectId: string;
}

interface ProjectTheme {
  id: string;
  projectId: string;
  themeName: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  fontFamily: string;
  logoUrl?: string;
  customCss?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const PRESET_THEMES = [
  {
    name: 'Professional Blue',
    primaryColor: '#007AFF',
    secondaryColor: '#34C759',
    backgroundColor: '#FFFFFF',
    textColor: '#000000',
    accentColor: '#FF9500',
    fontFamily: 'Inter, system-ui, sans-serif'
  },
  {
    name: 'Modern Dark',
    primaryColor: '#BB86FC',
    secondaryColor: '#03DAC6',
    backgroundColor: '#121212',
    textColor: '#FFFFFF',
    accentColor: '#CF6679',
    fontFamily: 'Roboto, system-ui, sans-serif'
  },
  {
    name: 'Warm Orange',
    primaryColor: '#FF6B35',
    secondaryColor: '#F7931E',
    backgroundColor: '#FFF8F0',
    textColor: '#2C2C2C',
    accentColor: '#FFD23F',
    fontFamily: 'Poppins, system-ui, sans-serif'
  },
  {
    name: 'Nature Green',
    primaryColor: '#2E7D32',
    secondaryColor: '#4CAF50',
    backgroundColor: '#F1F8E9',
    textColor: '#1B5E20',
    accentColor: '#8BC34A',
    fontFamily: 'Nunito, system-ui, sans-serif'
  }
];

export default function ThemeCustomizer({ projectId }: ThemeCustomizerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [themeForm, setThemeForm] = useState({
    themeName: '',
    primaryColor: '#007AFF',
    secondaryColor: '#34C759',
    backgroundColor: '#FFFFFF',
    textColor: '#000000',
    accentColor: '#FF9500',
    fontFamily: 'Inter, system-ui, sans-serif',
    logoUrl: '',
    customCss: ''
  });

  const queryClient = useQueryClient();

  const { data: themes = [], isLoading } = useQuery({
    queryKey: ['themes', projectId],
    queryFn: async (): Promise<ProjectTheme[]> => {
      const response = await fetch(`/api/themes/project/${projectId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch themes');
      return response.json();
    }
  });

  const { data: activeTheme } = useQuery({
    queryKey: ['active-theme', projectId],
    queryFn: async (): Promise<ProjectTheme | null> => {
      const response = await fetch(`/api/themes/project/${projectId}/active`, {
        credentials: 'include'
      });
      if (!response.ok) return null;
      return response.json();
    }
  });

  const createThemeMutation = useMutation({
    mutationFn: async (themeData: any) => {
      const response = await fetch(`/api/themes/project/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...themeData, isActive: true })
      });
      if (!response.ok) throw new Error('Failed to create theme');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['themes', projectId] });
      queryClient.invalidateQueries({ queryKey: ['active-theme', projectId] });
      setIsEditing(false);
    }
  });

  const activateThemeMutation = useMutation({
    mutationFn: async (themeId: string) => {
      const response = await fetch(`/api/themes/${themeId}/activate`, {
        method: 'PUT',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to activate theme');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['themes', projectId] });
      queryClient.invalidateQueries({ queryKey: ['active-theme', projectId] });
    }
  });

  const handlePresetSelect = (preset: any) => {
    setThemeForm({
      ...themeForm,
      ...preset
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createThemeMutation.mutate(themeForm);
  };

  const generatePreviewStyle = (theme: any) => ({
    backgroundColor: theme.backgroundColor,
    color: theme.textColor,
    fontFamily: theme.fontFamily,
    border: `2px solid ${theme.primaryColor}`,
    borderRadius: '8px',
    padding: '16px',
    minHeight: '120px'
  });

  if (isLoading) {
    return <div className="animate-pulse">Loading themes...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Theme Customization</h2>
          <p className="text-gray-600">Customize the appearance of your testimonial wall</p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          {isEditing ? 'Cancel' : 'Create Theme'}
        </button>
      </div>

      {/* Active Theme Preview */}
      {activeTheme && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Current Active Theme: {activeTheme.themeName}</h3>
          <div style={generatePreviewStyle(activeTheme)}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full" style={{ backgroundColor: activeTheme.accentColor }}></div>
              <div>
                <div className="font-semibold">John Smith</div>
                <div className="text-sm opacity-75">CEO, TechCorp</div>
              </div>
            </div>
            <div className="mb-3">
              <div className="flex mb-1">
                {[1,2,3,4,5].map(star => (
                  <span key={star} style={{ color: activeTheme.accentColor }}>★</span>
                ))}
              </div>
              <p className="text-sm">"This product has completely transformed our workflow. Highly recommend!"</p>
            </div>
            <button 
              style={{ 
                background: `linear-gradient(135deg, ${activeTheme.primaryColor}, ${activeTheme.secondaryColor})`,
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              Share Your Experience
            </button>
          </div>
        </div>
      )}

      {/* Theme Editor */}
      {isEditing && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Create New Theme</h3>
          
          {/* Preset Themes */}
          <div className="mb-6">
            <h4 className="font-medium mb-3">Quick Start Presets</h4>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {PRESET_THEMES.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => handlePresetSelect(preset)}
                  className="text-left p-3 border border-gray-200 rounded-md hover:border-gray-300 transition-colors"
                >
                  <div className="text-sm font-medium mb-1">{preset.name}</div>
                  <div className="flex gap-1">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.primaryColor }}></div>
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.secondaryColor }}></div>
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.accentColor }}></div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Theme Name</label>
                  <input
                    type="text"
                    value={themeForm.themeName}
                    onChange={(e) => setThemeForm({...themeForm, themeName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={themeForm.primaryColor}
                        onChange={(e) => setThemeForm({...themeForm, primaryColor: e.target.value})}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={themeForm.primaryColor}
                        onChange={(e) => setThemeForm({...themeForm, primaryColor: e.target.value})}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={themeForm.secondaryColor}
                        onChange={(e) => setThemeForm({...themeForm, secondaryColor: e.target.value})}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={themeForm.secondaryColor}
                        onChange={(e) => setThemeForm({...themeForm, secondaryColor: e.target.value})}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={themeForm.backgroundColor}
                        onChange={(e) => setThemeForm({...themeForm, backgroundColor: e.target.value})}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={themeForm.backgroundColor}
                        onChange={(e) => setThemeForm({...themeForm, backgroundColor: e.target.value})}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={themeForm.textColor}
                        onChange={(e) => setThemeForm({...themeForm, textColor: e.target.value})}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={themeForm.textColor}
                        onChange={(e) => setThemeForm({...themeForm, textColor: e.target.value})}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Font Family</label>
                  <select
                    value={themeForm.fontFamily}
                    onChange={(e) => setThemeForm({...themeForm, fontFamily: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Inter, system-ui, sans-serif">Inter</option>
                    <option value="Roboto, system-ui, sans-serif">Roboto</option>
                    <option value="Poppins, system-ui, sans-serif">Poppins</option>
                    <option value="Nunito, system-ui, sans-serif">Nunito</option>
                    <option value="Open Sans, system-ui, sans-serif">Open Sans</option>
                    <option value="Lato, system-ui, sans-serif">Lato</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL (optional)</label>
                  <input
                    type="url"
                    value={themeForm.logoUrl}
                    onChange={(e) => setThemeForm({...themeForm, logoUrl: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </div>

              {/* Live Preview */}
              <div className="lg:pl-6">
                <h4 className="font-medium mb-3">Live Preview</h4>
                <div style={generatePreviewStyle(themeForm)}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full" style={{ backgroundColor: themeForm.accentColor }}></div>
                    <div>
                      <div className="font-semibold">John Smith</div>
                      <div className="text-sm opacity-75">CEO, TechCorp</div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="flex mb-1">
                      {[1,2,3,4,5].map(star => (
                        <span key={star} style={{ color: themeForm.accentColor }}>★</span>
                      ))}
                    </div>
                    <p className="text-sm">"This product has completely transformed our workflow. Highly recommend!"</p>
                  </div>
                  <button 
                    style={{ 
                      background: `linear-gradient(135deg, ${themeForm.primaryColor}, ${themeForm.secondaryColor})`,
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    Share Your Experience
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Custom CSS (advanced)</label>
              <textarea
                value={themeForm.customCss}
                onChange={(e) => setThemeForm({...themeForm, customCss: e.target.value})}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                placeholder="/* Add custom CSS here... */"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createThemeMutation.isPending}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {createThemeMutation.isPending ? 'Creating...' : 'Create Theme'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Existing Themes */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Available Themes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {themes.map((theme) => (
            <div key={theme.id} className="border border-gray-200 rounded-lg p-4 relative">
              {theme.isActive && (
                <div className="absolute top-2 right-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                  Active
                </div>
              )}
              <div className="mb-3">
                <h4 className="font-medium">{theme.themeName}</h4>
                <div className="flex gap-1 mt-1">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: theme.primaryColor }}></div>
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: theme.secondaryColor }}></div>
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: theme.accentColor }}></div>
                </div>
              </div>
              <div style={generatePreviewStyle(theme)} className="mb-3 scale-75 origin-top-left h-16 overflow-hidden">
                <div className="text-xs">Theme Preview</div>
              </div>
              {!theme.isActive && (
                <button
                  onClick={() => activateThemeMutation.mutate(theme.id)}
                  disabled={activateThemeMutation.isPending}
                  className="w-full px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {activateThemeMutation.isPending ? 'Activating...' : 'Activate'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
