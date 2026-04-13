export type ServiceType = 'thumbnail' | 'video_editing' | 'both'
export type GigStatus = 'pending' | 'in_progress' | 'done'
export type ProjectType = 'package' | 'gig' | 'retainer'
export type PaymentStatus = 'paid' | 'pending'

export interface Lead {
  id: string
  channel_name: string
  channel_link: string | null
  subs_k: number | null
  uploads_per_month: number | null
  service_type: ServiceType
  ig_link: string | null
  linkedin: string | null
  x_link: string | null
  email: string | null
  email_2: string | null
  thumbnail_sample: boolean
  before_after_made: boolean
  followed_engaged: boolean
  contacted_ig: boolean
  followup_ig: boolean
  contacted_email: boolean
  followup_email: boolean
  seen: boolean
  responded: boolean
  closed: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  client_name: string
  channel_link: string | null
  channel_link_2: string | null
  email: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  client_id: string | null
  name: string
  service_type: ServiceType
  project_type: ProjectType
  price: number | null
  total_units: number | null
  status: GigStatus | null
  notes: string | null
  due_date: string | null
  unit_price: number | null
  created_at: string
  updated_at: string
  clients?: { client_name: string } | null
  delivery_count?: number
}

export interface Delivery {
  id: string
  project_id: string
  description: string | null
  delivered_at: string
  created_at: string
}

export interface Revenue {
  id: string
  client_id: string | null
  service_type: ServiceType
  amount: number
  status: PaymentStatus
  payment_date: string | null
  description: string | null
  created_at: string
  updated_at: string
  project_id: string | null
  clients?: { client_name: string } | null
  projects?: { name: string } | null
}

export interface Settings {
  id: string
  currency: string
  created_at: string
  updated_at: string
}

export interface DashboardData {
  kpis: {
    totalLeads: number
    conversionRate: string
    activeClients: number
    monthlyRevenue: number
    openProjects: number
  }
  pipeline: {
    sample: number
    beforeAfter: number
    followed: number
    contactedIg: number
    contactedEmail: number
    seen: number
    responded: number
    closed: number
  }
  recentProjects: Project[]
  recentPayments: Revenue[]
}
