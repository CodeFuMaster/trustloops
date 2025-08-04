import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE = import.meta.env.VITE_API_URL || 'https://localhost:65173';

interface Testimonial {
  id: string;
  projectId: string;
  type: 'text' | 'video';
  content?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  customerName: string;
  customerEmail?: string;
  customerTitle?: string;
  customerCompany?: string;
  rating: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
}

interface CreateTestimonialData {
  projectId: string;
  type: 'text' | 'video';
  content?: string;
  customerName: string;
  customerEmail?: string;
  customerTitle?: string;
  customerCompany?: string;
  rating: number;
  video?: File;
}

export function useApprovedTestimonials(projectId: string) {
  return useQuery({
    queryKey: ['testimonials', 'approved', projectId],
    queryFn: async (): Promise<Testimonial[]> => {
      const response = await fetch(`${API_BASE}/api/testimonials/${projectId}?approved=true`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch approved testimonials');
      }
      
      return response.json();
    },
    enabled: !!projectId,
  });
}

export function usePendingTestimonials() {
  return useQuery({
    queryKey: ['testimonials', 'pending'],
    queryFn: async (): Promise<Testimonial[]> => {
      const token = localStorage.getItem('supabase.auth.token');
      const response = await fetch(`${API_BASE}/api/testimonials/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch pending testimonials');
      }
      
      return response.json();
    },
  });
}

export function useCreateTestimonial() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateTestimonialData): Promise<Testimonial> => {
      const formData = new FormData();
      formData.append('projectId', data.projectId);
      formData.append('type', data.type);
      formData.append('customerName', data.customerName);
      formData.append('rating', data.rating.toString());
      
      if (data.content) formData.append('content', data.content);
      if (data.customerEmail) formData.append('customerEmail', data.customerEmail);
      if (data.customerTitle) formData.append('customerTitle', data.customerTitle);
      if (data.customerCompany) formData.append('customerCompany', data.customerCompany);
      if (data.video) formData.append('video', data.video);
      
      const response = await fetch(`${API_BASE}/api/testimonials`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to create testimonial');
      }
      
      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['testimonials', 'approved', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['testimonials', 'pending'] });
    },
  });
}

export function useApproveTestimonial() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (testimonialId: string): Promise<boolean> => {
      const token = localStorage.getItem('supabase.auth.token');
      const response = await fetch(`${API_BASE}/api/testimonials/${testimonialId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to approve testimonial');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all testimonial queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
    },
  });
}
