import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../contexts/AuthContext'

const API_BASE = import.meta.env.VITE_API_URL || 'https://localhost:65173'

// Types
export interface StatusPage {
  id: string
  name: string
  slug: string
  description?: string
  customDomain?: string
  branding: {
    logoUrl?: string
    primaryColor: string
    backgroundColor: string
    textColor: string
  }
  components: StatusComponent[]
  settings: {
    showUptime: boolean
    showIncidentHistory: boolean
    maintenanceMode: boolean
    subscribersEnabled: boolean
  }
  createdAt: string
  updatedAt: string
}

export interface StatusComponent {
  id: string
  name: string
  description?: string
  group?: string
  status: 'operational' | 'degraded' | 'partial-outage' | 'major-outage'
  uptime?: number
  statusPageId: string
  createdAt: string
  updatedAt: string
}

export interface Incident {
  id: string
  title: string
  description: string
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved'
  severity: 'minor' | 'major' | 'critical'
  affectedComponents: string[]
  statusPageId: string
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  updates: IncidentUpdate[]
}

export interface IncidentUpdate {
  id: string
  incidentId: string
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved'
  message: string
  createdAt: string
}

export interface CreateStatusPageRequest {
  name: string
  slug: string
  description?: string
  customDomain?: string
  branding: {
    logoUrl?: string
    primaryColor: string
    backgroundColor: string
    textColor: string
  }
  components: Omit<StatusComponent, 'id' | 'statusPageId' | 'createdAt' | 'updatedAt'>[]
  settings: {
    showUptime: boolean
    showIncidentHistory: boolean
    maintenanceMode: boolean
    subscribersEnabled: boolean
  }
}

export interface CreateIncidentRequest {
  statusPageId: string
  title: string
  description: string
  severity: 'minor' | 'major' | 'critical'
  affectedComponents: string[]
  status?: 'investigating' | 'identified' | 'monitoring' | 'resolved'
}

export interface UpdateIncidentRequest {
  id: string
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved'
  message: string
}

// API Functions
const fetchStatusPages = async (): Promise<StatusPage[]> => {
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error || !session?.access_token) {
    throw new Error('User not authenticated')
  }

  const response = await fetch(`${API_BASE}/api/status-pages`, {
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch status pages')
  }

  return response.json()
}

const fetchStatusPage = async (slug: string): Promise<StatusPage> => {
  const response = await fetch(`${API_BASE}/api/status-pages/${slug}`)

  if (!response.ok) {
    throw new Error('Failed to fetch status page')
  }

  return response.json()
}

const createStatusPage = async (data: CreateStatusPageRequest): Promise<StatusPage> => {
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error || !session?.access_token) {
    throw new Error('User not authenticated')
  }

  const response = await fetch(`${API_BASE}/api/status-pages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('Failed to create status page')
  }

  return response.json()
}

const updateStatusPage = async (id: string, data: Partial<CreateStatusPageRequest>): Promise<StatusPage> => {
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error || !session?.access_token) {
    throw new Error('User not authenticated')
  }

  const response = await fetch(`${API_BASE}/api/status-pages/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('Failed to update status page')
  }

  return response.json()
}

const deleteStatusPage = async (id: string): Promise<void> => {
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error || !session?.access_token) {
    throw new Error('User not authenticated')
  }

  const response = await fetch(`${API_BASE}/api/status-pages/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to delete status page')
  }
}

const fetchIncidents = async (statusPageId: string): Promise<Incident[]> => {
  const response = await fetch(`${API_BASE}/api/status-pages/${statusPageId}/incidents`)

  if (!response.ok) {
    throw new Error('Failed to fetch incidents')
  }

  return response.json()
}

const createIncident = async (data: CreateIncidentRequest): Promise<Incident> => {
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error || !session?.access_token) {
    throw new Error('User not authenticated')
  }

  const response = await fetch(`${API_BASE}/api/incidents`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('Failed to create incident')
  }

  return response.json()
}

const updateIncident = async (data: UpdateIncidentRequest): Promise<Incident> => {
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error || !session?.access_token) {
    throw new Error('User not authenticated')
  }

  const response = await fetch(`${API_BASE}/api/incidents/${data.id}/updates`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: data.status,
      message: data.message
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to update incident')
  }

  return response.json()
}

const updateComponentStatus = async (componentId: string, status: StatusComponent['status']): Promise<StatusComponent> => {
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error || !session?.access_token) {
    throw new Error('User not authenticated')
  }

  const response = await fetch(`${API_BASE}/api/components/${componentId}/status`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  })

  if (!response.ok) {
    throw new Error('Failed to update component status')
  }

  return response.json()
}

// Hooks
export const useStatusPages = () => {
  return useQuery({
    queryKey: ['status-pages'],
    queryFn: fetchStatusPages,
  })
}

export const useStatusPage = (slug: string) => {
  return useQuery({
    queryKey: ['status-page', slug],
    queryFn: () => fetchStatusPage(slug),
    enabled: !!slug,
  })
}

export const useCreateStatusPage = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createStatusPage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['status-pages'] })
    },
  })
}

export const useUpdateStatusPage = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateStatusPageRequest> }) =>
      updateStatusPage(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['status-pages'] })
      queryClient.invalidateQueries({ queryKey: ['status-page', variables.id] })
    },
  })
}

export const useDeleteStatusPage = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteStatusPage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['status-pages'] })
    },
  })
}

export const useIncidents = (statusPageId: string) => {
  return useQuery({
    queryKey: ['incidents', statusPageId],
    queryFn: () => fetchIncidents(statusPageId),
    enabled: !!statusPageId,
  })
}

export const useCreateIncident = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createIncident,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['incidents', variables.statusPageId] })
      queryClient.invalidateQueries({ queryKey: ['status-page'] })
    },
  })
}

export const useUpdateIncident = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: updateIncident,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['incidents', data.statusPageId] })
      queryClient.invalidateQueries({ queryKey: ['status-page'] })
    },
  })
}

export const useUpdateComponentStatus = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ componentId, status }: { componentId: string; status: StatusComponent['status'] }) =>
      updateComponentStatus(componentId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['status-page'] })
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
    },
  })
}
