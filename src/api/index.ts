import axios from 'axios'
import type {
  Opportunity,
  OpportunityFilters,
  AuthUser,
  SeekerProfile,
  EmployerProfile,
  ApplicationStatus,
} from '../types'

const BASE_URL = 'https://ice-it-planet--api.duckdns.org/'
const YANDEX_GEOCODE_URL = 'https://geocode-maps.yandex.ru/1.x/'
const YANDEX_API_KEY = '0915c3ca-1803-4f94-a76d-ea28ceaf3045'

const api = axios.create({
  baseURL: BASE_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export async function login(email: string, password: string): Promise<{ access_token: string }> {
  const form = new URLSearchParams()
  form.append('username', email)
  form.append('password', password)
  const { data } = await api.post('/auth/login', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return data
}

export async function register(payload: {
  email: string
  password: string
  role: 'seeker' | 'employer'
}): Promise<{ access_token: string }> {
  const { data } = await api.post('/auth/register', payload)
  return data
}

export async function getMe(): Promise<AuthUser> {
  const { data } = await api.get('/users/me')
  return data
}

export async function updateSeekerProfile(profile: Partial<SeekerProfile>): Promise<SeekerProfile> {
  const { data } = await api.put('/users/profile/seeker', profile)
  return data
}

export async function updateEmployerProfile(profile: Partial<EmployerProfile>): Promise<EmployerProfile> {
  const { data } = await api.put('/users/profile/employer', profile)
  return data
}

export async function getOpportunities(filters: OpportunityFilters = {}): Promise<Opportunity[]> {
  const params: Record<string, string | number | boolean> = {}
  if (filters.city) params.city = filters.city
  if (filters.work_format) params.work_format = filters.work_format
  if (filters.tags) params.tags = filters.tags
  if (filters.op_type) params.op_type = filters.op_type
  if (filters.min_salary) params.min_salary = filters.min_salary
  const { data } = await api.get('/opportunities', { params })
  return data
}

export async function getOpportunity(id: number): Promise<Opportunity> {
  const { data } = await api.get(`/opportunities/${id}`)
  return data
}

export async function geocodeAddress(query: string): Promise<{ latitude: number; longitude: number } | null> {
  const trimmed = query.trim()
  if (!trimmed) return null

  try {
    const { data } = await axios.get(YANDEX_GEOCODE_URL, {
      params: {
        apikey: YANDEX_API_KEY,
        geocode: trimmed,
        format: 'json',
      },
    })

    const firstMember = data?.response?.GeoObjectCollection?.featureMember?.[0]
    const pos = firstMember?.GeoObject?.Point?.pos as string | undefined
    if (!pos) return null

    const [lonStr, latStr] = pos.split(' ')
    const longitude = Number(lonStr)
    const latitude = Number(latStr)

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null
    return { latitude, longitude }
  } catch {
    return null
  }
}

export async function createOpportunity(payload: Partial<Opportunity> & { tag_names: string[] }): Promise<Opportunity> {
  const { data } = await api.post('/opportunities', payload)
  return data
}

export async function updateOpportunity(
  id: number,
  payload: Partial<Opportunity> & { tag_names?: string[] },
): Promise<Opportunity> {
  const { data } = await api.put(`/opportunities/${id}`, payload)
  return data
}

export async function deleteOpportunity(id: number): Promise<{ status: string; opportunity_id: number }> {
  const { data } = await api.delete(`/opportunities/${id}`)
  return data
}

export async function applyToOpportunity(id: number): Promise<{ status: string; application_id: number }> {
  const { data } = await api.post(`/opportunities/${id}/apply`)
  return data
}

export async function getMyOpportunities(): Promise<Opportunity[]> {
  const { data } = await api.get('/opportunities/my')
  return data
}

export async function getMyApplications() {
  const { data } = await api.get('/opportunities/my/applications')
  return data
}

export async function updateApplicationStatus(appId: number, status: ApplicationStatus) {
  const { data } = await api.patch(`/opportunities/applications/${appId}/status`, null, {
    params: { new_status: status },
  })
  return data
}

export async function addToFavorites(oppId: number) {
  const { data } = await api.post(`/users/favorites/${oppId}`)
  return data
}

export async function addContact(userId: number) {
  const { data } = await api.post(`/users/contacts/${userId}`)
  return data
}

export async function getContacts() {
  const { data } = await api.get('/users/contacts')
  return data
}

export async function getAllUsers() {
  const { data } = await api.get('/admin/users')
  return data
}

export async function verifyEmployer(userId: number, isVerified: boolean) {
  const { data } = await api.post(`/admin/verify-employer/${userId}`, { is_verified: isVerified })
  return data
}

export async function moderateOpportunity(oppId: number, isActive: boolean) {
  const { data } = await api.post(`/admin/moderate-opportunity/${oppId}`, null, {
    params: { is_active: isActive },
  })
  return data
}

export async function deleteUser(userId: number) {
  const { data } = await api.delete(`/admin/delete-user/${userId}`)
  return data
}

export async function getAllOpportunitiesAdmin(): Promise<Opportunity[]> {
  const { data } = await api.get('/opportunities', { params: { only_active: false } })
  return data
}

export default api
