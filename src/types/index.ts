export type UserRole = 'seeker' | 'employer' | 'curator'
export type OpportunityType = 'internship' | 'vacancy' | 'mentorship' | 'event'
export type WorkFormat = 'office' | 'hybrid' | 'remote'
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'reserve'

export interface Tag {
  id: number
  name: string
  category: string
}

export interface SeekerProfile {
  id: number
  user_id: number
  full_name: string
  university: string
  graduation_year: number
  resume_json: string | null
  is_public: boolean
}

export interface EmployerProfile {
  id: number
  user_id: number
  company_name: string
  inn: string
  description: string | null
  website: string | null
  is_verified: boolean
  verification_docs: string | null
}

export interface AuthUser {
  id: number
  email: string
  role: UserRole
  is_active: boolean
  profile: SeekerProfile | EmployerProfile | null
}

export interface Opportunity {
  id: number
  owner_id: number
  title: string
  description: string
  op_type: OpportunityType
  work_format: WorkFormat
  city: string
  address: string | null
  latitude: number | null
  longitude: number | null
  salary_min: number | null
  salary_max: number | null
  published_at: string
  deadline: string | null
  is_active: boolean
  company_name: string | null
  tag_names: string[]
  tags?: Tag[]
}

export interface Application {
  application_id: number
  opportunity_id: number
  seeker: {
    id: number
    email: string
    profile: SeekerProfile | null
  }
  status: ApplicationStatus
  applied_at: string
}

export interface OpportunityFilters {
  city?: string
  work_format?: WorkFormat | ''
  tags?: string
  op_type?: OpportunityType | ''
  min_salary?: number
}
