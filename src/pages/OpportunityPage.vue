<template>
  <div class="opp-page">
    <div v-if="loading" class="state-msg">Загрузка...</div>
    <div v-else-if="error" class="state-msg error">{{ error }}</div>

    <template v-else-if="opp">
      <div class="opp-header">
        <RouterLink to="/" class="back-link">На главную</RouterLink>
        <div class="header-badges">
          <span class="badge" :class="`type-${opp.op_type}`">{{ typeLabel }}</span>
          <span class="badge format-badge">{{ formatLabel }}</span>
          <span v-if="!opp.is_active" class="badge inactive-badge">Архив</span>
        </div>
      </div>

      <div class="opp-layout">
        <div class="opp-main">
          <h1 class="opp-title">{{ opp.title }}</h1>
          <p class="opp-company">{{ opp.company_name }}</p>

          <div class="opp-meta">
            <span v-if="opp.city"><MapPin :size="15" /> {{ opp.city }}<span v-if="opp.address">, {{ opp.address }}</span></span>
            <span v-if="salaryLabel"><CircleDollarSign :size="15" /> {{ salaryLabel }}</span>
            <span v-if="opp.deadline"><CalendarDays :size="15" /> до {{ formatDate(opp.deadline) }}</span>
            <span><CalendarDays :size="15" /> опубликовано {{ formatDate(opp.published_at) }}</span>
          </div>

          <div class="section">
            <h3>Описание</h3>
            <p class="opp-desc">{{ opp.description }}</p>
          </div>

          <div v-if="tags.length" class="section">
            <h3>Навыки и теги</h3>
            <div class="tags-list">
              <span v-for="tag in tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
          </div>
        </div>

        <aside class="opp-sidebar">
          <div class="sidebar-card">
            <button class="btn-favorite" type="button" @click="toggleFavorite">
              <Heart :size="16" :fill="isFavorite ? 'currentColor' : 'none'" />
              {{ isFavorite ? 'В избранном' : 'Добавить в избранное' }}
            </button>

            <template v-if="auth.isAuth && auth.role === 'seeker'">
              <p v-if="applySuccess" class="success-msg"><CheckCircle2 :size="15" /> Заявка отправлена!</p>
              <p v-else-if="applyError" class="error-msg">{{ applyError }}</p>
              <button
                v-else
                class="btn-apply"
                :disabled="applying"
                @click="handleApply"
              >
                {{ applying ? 'Отправляем...' : 'Откликнуться' }}
              </button>
            </template>
            <template v-else-if="!auth.isAuth">
              <RouterLink to="/auth/login" class="btn-apply-link">Войдите, чтобы откликнуться</RouterLink>
            </template>

            <div class="sidebar-details">
              <div class="detail-row">
                <span class="detail-label">Тип</span>
                <span>{{ typeLabel }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Формат</span>
                <span>{{ formatLabel }}</span>
              </div>
              <div v-if="opp.city" class="detail-row">
                <span class="detail-label">Город</span>
                <span>{{ opp.city }}</span>
              </div>
              <div v-if="salaryLabel" class="detail-row">
                <span class="detail-label">Зарплата</span>
                <span>{{ salaryLabel }}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { MapPin, CircleDollarSign, CalendarDays, CheckCircle2, Heart } from 'lucide-vue-next'
import { getOpportunity, applyToOpportunity } from '../api'
import { useAuthStore } from '../stores/auth'
import type { Opportunity } from '../types'
import {
  isOpportunityFavorite,
  subscribeFavoritesUpdated,
  toggleOpportunityFavorite,
} from '../utils/favorites'

const route = useRoute()
const auth = useAuthStore()

const opp = ref<Opportunity | null>(null)
const loading = ref(false)
const error = ref('')
const applying = ref(false)
const applySuccess = ref(false)
const applyError = ref('')
const isFavorite = ref(false)
let unsubscribeFavorites: (() => void) | null = null

const typeMap: Record<string, string> = {
  internship: 'Стажировка',
  vacancy: 'Вакансия',
  mentorship: 'Менторство',
  event: 'Мероприятие',
}
const formatMap: Record<string, string> = {
  office: 'Офис',
  hybrid: 'Гибрид',
  remote: 'Удалённо',
}

const typeLabel = computed(() => (opp.value ? typeMap[opp.value.op_type] ?? opp.value.op_type : ''))
const formatLabel = computed(() => (opp.value ? formatMap[opp.value.work_format] ?? opp.value.work_format : ''))
const tags = computed(() => {
  if (!opp.value) return []
  if (opp.value.tags?.length) return opp.value.tags.map((t) => t.name)
  if (opp.value.tag_names?.length) return opp.value.tag_names
  return []
})
const salaryLabel = computed(() => {
  if (!opp.value) return null
  const { salary_min, salary_max } = opp.value
  if (salary_min && salary_max) return `${salary_min.toLocaleString()} – ${salary_max.toLocaleString()} ₽`
  if (salary_min) return `от ${salary_min.toLocaleString()} ₽`
  if (salary_max) return `до ${salary_max.toLocaleString()} ₽`
  return null
})

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function syncFavoriteState() {
  if (!opp.value) {
    isFavorite.value = false
    return
  }
  isFavorite.value = isOpportunityFavorite(opp.value.id)
}

function toggleFavorite() {
  if (!opp.value) return
  isFavorite.value = toggleOpportunityFavorite(opp.value.id)
}

async function handleApply() {
  if (!opp.value) return
  applying.value = true
  applyError.value = ''
  try {
    await applyToOpportunity(opp.value.id)
    applySuccess.value = true
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'response' in e) {
      const resp = (e as { response?: { data?: { detail?: string } } }).response
      applyError.value = resp?.data?.detail ?? 'Ошибка при отклике'
    } else {
      applyError.value = 'Ошибка подключения'
    }
  } finally {
    applying.value = false
  }
}

onMounted(async () => {
  loading.value = true
  try {
    opp.value = await getOpportunity(Number(route.params.id))
    syncFavoriteState()
  } catch {
    error.value = 'Объявление не найдено'
  } finally {
    loading.value = false
  }
})

onMounted(() => {
  unsubscribeFavorites = subscribeFavoritesUpdated(() => syncFavoriteState())
})

onBeforeUnmount(() => {
  unsubscribeFavorites?.()
})
</script>

<style scoped>
.opp-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  background: var(--bg);
  min-height: calc(100vh - 60px);
}
.state-msg { text-align: center; padding: 4rem; color: var(--text-muted); }
.state-msg.error { color: #ef4444; }

.opp-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}
.back-link {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s;
}
.back-link:hover { color: var(--primary); }
.header-badges { display: flex; gap: 0.5rem; }

.badge {
  display: inline-block;
  padding: 0.25rem 0.7rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}
.type-vacancy { background: #e0f2fe; color: #0369a1; }
.type-internship { background: #d1fae5; color: #065f46; }
.type-mentorship { background: #ede9fe; color: #5b21b6; }
.type-event { background: #fff7ed; color: #b45309; }
.format-badge { background: var(--bg-card); color: var(--text-muted); border: 1px solid var(--border); }
.inactive-badge { background: #fee2e2; color: #b91c1c; }

.opp-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 2rem;
  align-items: flex-start;
}
.opp-title { font-size: 1.8rem; font-weight: 700; margin: 0 0 0.5rem; }
.opp-company { font-size: 1rem; color: var(--primary); margin: 0 0 1rem; }

.opp-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-bottom: 2rem;
}

.section { margin-bottom: 2rem; }
.section h3 { font-size: 1rem; font-weight: 600; margin: 0 0 0.75rem; color: var(--text); }
.opp-desc { color: var(--text-muted); line-height: 1.7; white-space: pre-wrap; }

.tags-list { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.tag {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 0.25rem 0.65rem;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.sidebar-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.btn-favorite {
  width: 100%;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 0.45rem;
  padding: 0.65rem 0.75rem;
  border-radius: 8px;
  border: 1px solid #fecaca;
  background: #fff1f2;
  color: #be123c;
  font-size: 0.92rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: none;
}
.btn-favorite:hover {
  background: #ffe4e6;
  box-shadow: none;
}
.btn-apply {
  width: 100%;
  padding: 0.75rem;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-apply:hover:not(:disabled) { background: var(--primary-dark); }
.btn-apply:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-apply-link {
  display: block;
  text-align: center;
  padding: 0.75rem;
  background: var(--primary);
  color: #fff;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
}
.success-msg { color: #065f46; background: #d1fae5; padding: 0.65rem 0.85rem; border-radius: 8px; font-size: 0.9rem; }
.error-msg { color: #b91c1c; background: #fee2e2; padding: 0.65rem 0.85rem; border-radius: 8px; font-size: 0.9rem; }

.sidebar-details { display: flex; flex-direction: column; gap: 0.6rem; }
.detail-row { display: flex; justify-content: space-between; font-size: 0.88rem; }
.detail-label { color: var(--text-muted); }

@media (max-width: 768px) {
  .opp-layout { grid-template-columns: 1fr; }
  .opp-sidebar { order: -1; }
}
</style>


