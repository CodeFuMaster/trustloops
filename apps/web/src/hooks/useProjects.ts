import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'https://localhost:65173';

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
  callToAction?: string;
}

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async (): Promise<Project[]> => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session?.access_token) {
        throw new Error('User not authenticated');
      }
      
      const response = await fetch(`${API_BASE}/api/projects`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
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
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session?.access_token) {
        throw new Error('User not authenticated');
      }
      
      const response = await fetch(`${API_BASE}/api/projects`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
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
