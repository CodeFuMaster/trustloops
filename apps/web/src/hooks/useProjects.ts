import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

interface Project {
  id: string;
  name: string;
  slug: string;
  description?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateProjectRequest {
  name: string;
  description?: string;
}

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async (): Promise<Project[]> => {
      const token = localStorage.getItem('supabase.auth.token');
      const response = await fetch(`${API_BASE}/api/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      
      return response.json();
    },
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateProjectRequest): Promise<Project> => {
      const token = localStorage.getItem('supabase.auth.token');
      const response = await fetch(`${API_BASE}/api/projects`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create project');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate projects query to refetch data
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
