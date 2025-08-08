import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AnalyticsDashboard from '../features/testimonials/AnalyticsDashboard';

export default function Analytics() {
  const { user } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  // For now, we'll use a placeholder project ID
  // In a real app, you'd fetch user's projects and let them select
  const defaultProjectId = '1'; // You'd get this from user's projects

  if (!user) {
    return <div>Please log in to view analytics</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">TestimonialHub - Analytics</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{user.email}</span>
              <button className="btn btn-secondary text-sm">Sign Out</button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
              <p className="text-gray-600">Track performance and insights for your testimonials</p>
            </div>
          </div>

          {/* Project Selector - placeholder for now */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Project
            </label>
            <select 
              value={selectedProjectId || defaultProjectId} 
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={defaultProjectId}>Demo Project</option>
            </select>
          </div>

          {/* Analytics Dashboard */}
          <AnalyticsDashboard projectId={selectedProjectId || defaultProjectId} />
        </div>
      </main>
    </div>
  );
}
