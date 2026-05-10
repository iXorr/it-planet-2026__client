const FAVORITES_KEY = 'favoriteOpportunityIds'
const FAVORITES_UPDATED_EVENT = 'favorites:updated'

function isBrowser() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
}

export function getFavoriteOpportunityIds(): number[] {
  if (!isBrowser()) return []

  try {
    const raw = localStorage.getItem(FAVORITES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0)
  } catch {
    return []
  }
}

function saveFavoriteOpportunityIds(ids: number[]) {
  if (!isBrowser()) return
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids))
  window.dispatchEvent(new CustomEvent(FAVORITES_UPDATED_EVENT, { detail: ids }))
}

export function isOpportunityFavorite(opportunityId: number): boolean {
  return getFavoriteOpportunityIds().includes(opportunityId)
}

export function toggleOpportunityFavorite(opportunityId: number): boolean {
  const ids = getFavoriteOpportunityIds()
  const exists = ids.includes(opportunityId)

  if (exists) {
    saveFavoriteOpportunityIds(ids.filter((id) => id !== opportunityId))
    return false
  }

  saveFavoriteOpportunityIds([...ids, opportunityId])
  return true
}

export function subscribeFavoritesUpdated(callback: (ids: number[]) => void): () => void {
  if (!isBrowser()) {
    return () => {}
  }

  const handleCustom = (event: Event) => {
    const custom = event as CustomEvent<number[]>
    callback(Array.isArray(custom.detail) ? custom.detail : getFavoriteOpportunityIds())
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== FAVORITES_KEY) return
    callback(getFavoriteOpportunityIds())
  }

  window.addEventListener(FAVORITES_UPDATED_EVENT, handleCustom)
  window.addEventListener('storage', handleStorage)

  return () => {
    window.removeEventListener(FAVORITES_UPDATED_EVENT, handleCustom)
    window.removeEventListener('storage', handleStorage)
  }
}
