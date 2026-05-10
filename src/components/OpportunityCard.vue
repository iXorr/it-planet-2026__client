<template>
  <RouterLink :to="`/opportunity/${opp.id}`" class="card">
    <button
      class="fav-btn"
      type="button"
      :aria-label="isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'"
      @click.stop.prevent="toggleFavorite"
    >
      <Heart :size="16" :fill="isFavorite ? 'currentColor' : 'none'" />
    </button>

    <div class="card-header">
      <span class="badge" :class="typeBadgeClass">{{ typeLabel }}</span>
      <span class="badge format-badge">{{ formatLabel }}</span>
    </div>

    <h3 class="card-title">{{ opp.title }}</h3>
    <p class="card-company">{{ opp.company_name ?? 'Компания не указана' }}</p>

    <p class="card-desc">{{ truncated }}</p>

    <div class="card-meta">
      <span v-if="opp.city" class="meta-item"><MapPin :size="14" /> {{ opp.city }}</span>
      <span v-if="salaryLabel" class="meta-item"><CircleDollarSign :size="14" /> {{ salaryLabel }}</span>
      <span v-if="opp.deadline" class="meta-item"><CalendarDays :size="14" /> до {{ formatDate(opp.deadline) }}</span>
    </div>

    <div v-if="tags.length" class="card-tags">
      <span v-for="tag in tags.slice(0, 5)" :key="tag" class="tag">{{ tag }}</span>
    </div>
  </RouterLink>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { MapPin, CircleDollarSign, CalendarDays, Heart } from 'lucide-vue-next'
import type { Opportunity } from '../types'
import {
  isOpportunityFavorite,
  subscribeFavoritesUpdated,
  toggleOpportunityFavorite,
} from '../utils/favorites'

const props = defineProps<{ opp: Opportunity }>()
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
const typeBadgeClass = computed(() => `type-${props.opp.op_type}`)
const typeLabel = computed(() => typeMap[props.opp.op_type] ?? props.opp.op_type)
const formatLabel = computed(() => formatMap[props.opp.work_format] ?? props.opp.work_format)

const truncated = computed(() =>
  props.opp.description && props.opp.description.length > 120
    ? props.opp.description.slice(0, 120) + '...'
    : props.opp.description ?? '',
)

const salaryLabel = computed(() => {
  const { salary_min, salary_max } = props.opp
  if (salary_min && salary_max) return `${salary_min.toLocaleString()} – ${salary_max.toLocaleString()} ₽`
  if (salary_min) return `от ${salary_min.toLocaleString()} ₽`
  if (salary_max) return `до ${salary_max.toLocaleString()} ₽`
  return null
})

const tags = computed(() => {
  if (props.opp.tags?.length) return props.opp.tags.map((t) => t.name)
  if (props.opp.tag_names?.length) return props.opp.tag_names
  return []
})

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function syncFavoriteState() {
  isFavorite.value = isOpportunityFavorite(props.opp.id)
}

function toggleFavorite() {
  isFavorite.value = toggleOpportunityFavorite(props.opp.id)
}

onMounted(() => {
  syncFavoriteState()
  unsubscribeFavorites = subscribeFavoritesUpdated(() => syncFavoriteState())
})

onBeforeUnmount(() => {
  unsubscribeFavorites?.()
})
</script>

<style scoped>
.card {
  display: block;
  position: relative;
  background: linear-gradient(180deg, #ffffff 0%, #fbfdfd 100%);
  border: 1px solid #dbe7ea;
  border-radius: 16px;
  padding: 1.25rem;
  text-decoration: none;
  color: var(--text);
  transition: box-shadow 0.2s, transform 0.15s, border-color 0.2s;
  cursor: pointer;
}
.fav-btn {
  position: absolute;
  top: 0.85rem;
  right: 0.85rem;
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.9);
  color: #ef4444;
  cursor: pointer;
  transition: transform 0.15s;
  box-shadow: none;
}
.fav-btn:hover {
  transform: scale(1.04);
  box-shadow: none;
}
.card:hover {
  border-color: rgba(15, 118, 110, 0.35);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.09);
  transform: translateY(-2px);
}
.card-header {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}
.badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}
.type-vacancy { background: #e0f2fe; color: #0369a1; }
.type-internship { background: #d1fae5; color: #065f46; }
.type-mentorship { background: #ede9fe; color: #5b21b6; }
.type-event { background: #fff7ed; color: #b45309; }
.format-badge { background: var(--bg); color: var(--text-muted); }

.card-title {
  font-size: 1.05rem;
  font-weight: 600;
  margin: 0 0 0.2rem;
  color: var(--text);
}
.card-company {
  font-size: 0.9rem;
  color: var(--primary);
  margin: 0 0 0.5rem;
}
.card-desc {
  font-size: 0.88rem;
  color: var(--text-muted);
  margin: 0 0 0.75rem;
  line-height: 1.5;
}
.card-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
  font-size: 0.82rem;
  color: var(--text-muted);
  margin-bottom: 0.75rem;
}
.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.tag {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 0.15rem 0.5rem;
  font-size: 0.78rem;
  color: var(--text-muted);
}

@media (max-width: 768px) {
  .card {
    padding: 1rem;
    border-radius: 14px;
  }

  .card-title {
    font-size: 1rem;
  }
}
</style>


