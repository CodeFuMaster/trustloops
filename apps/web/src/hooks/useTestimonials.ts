import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'https://localhost:65173';

export interface Testimonial {
  id: string;
  projectId: string;
  type: 'text' | 'video';
  content?: string;
  quote?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  customerName: string;
  customerEmail?: string;
  customerTitle?: string;
  customerCompany?: string;
  rating: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  approved: boolean;
  createdAt: string;
  updatedAt: string;
  createdUtc: string;
  updatedUtc: string;
  approvedAt?: string;
}

export interface TestimonialsResponse {
  items: Testimonial[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export interface UseTestimonialsOptions {
  page?: number;
  pageSize?: number;
  approved?: boolean;
}

export interface BulkApproveRequest {
  testimonialIds: string[];
  approved: boolean;
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
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session?.access_token) {
        throw new Error('User not authenticated');
      }
      
      const response = await fetch(`${API_BASE}/api/testimonials/pending`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
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
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session?.access_token) {
        throw new Error('User not authenticated');
      }
      
      const response = await fetch(`${API_BASE}/api/testimonials/${testimonialId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
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

export function useTestimonials(
  projectId: string, 
  options: UseTestimonialsOptions = {}
) {
  return useQuery({
    queryKey: ['testimonials', projectId, options],
    queryFn: async (): Promise<TestimonialsResponse> => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session?.access_token) {
        throw new Error('User not authenticated');
      }

      const { page = 1, pageSize = 10, approved } = options;
      
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      
      if (approved !== undefined) {
        params.append('approved', approved.toString());
      }
      
      const response = await fetch(`${API_BASE}/api/testimonials/${projectId}?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch testimonials');
      }
      
      return response.json();
    },
    enabled: !!projectId,
  });
}

export function useBulkApproveTestimonials() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: BulkApproveRequest): Promise<void> => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session?.access_token) {
        throw new Error('User not authenticated');
      }
      
      const response = await fetch(`${API_BASE}/api/testimonials/bulk-approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to bulk approve testimonials');
      }
    },
    onSuccess: () => {
      // Invalidate all testimonial queries
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
    },
  });
}
