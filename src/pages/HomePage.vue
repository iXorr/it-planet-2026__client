<template>
  <div class="home">
    <section class="hero">
      <div class="hero-inner">
        <h1 class="hero-title">Найди путь в карьеру</h1>
        <p class="hero-sub">Стажировки, вакансии, менторство и карьерные события в одном месте.</p>
      </div>
    </section>

    <div id="opportunities" class="main-layout">
      <div class="filters-desktop">
        <OpportunityFilters @update="onFiltersUpdate" />
      </div>

      <div class="content">
        <div class="toolbar">
          <p class="count">Найдено: <strong>{{ opportunities.length }}</strong></p>
          <div class="toolbar-actions">
            <Button
              class="filters-mobile-btn"
              icon="pi pi-sliders-h"
              label="Фильтры"
              severity="secondary"
              outlined
              @click="filtersDialog = true"
            />
            <SelectButton
              v-model="view"
              :options="viewOptions"
              option-label="label"
              option-value="value"
              aria-labelledby="view-switcher"
            />
          </div>
        </div>

        <div v-if="loading" class="state-msg">Загрузка...</div>
        <div v-else-if="error" class="state-msg error">{{ error }}</div>

        <div v-else-if="view === 'list'" class="list-grid">
          <OpportunityCard v-for="opp in opportunities" :key="opp.id" :opp="opp" />
          <div v-if="opportunities.length === 0" class="state-msg">Ничего не найдено</div>
        </div>

        <div v-else class="map-container">
          <yandex-map
            v-model="ymap"
            :settings="{ location: { center: [37.617644, 55.755819], zoom: 5 } }"
            width="100%"
            height="520px"
          >
            <yandex-map-default-scheme-layer />
            <yandex-map-default-features-layer />

            <YandexMapClusterer :grid-size="160" :zoom-on-cluster-click="true">
              <template #cluster="{ length }">
                <div class="cluster-pill">{{ length }}</div>
              </template>

              <yandex-map-default-marker
                v-for="opp in mappedOpps"
                :key="opp.id"
                :settings="{
                  coordinates: [opp.longitude!, opp.latitude!],
                  title: opp.title,
                  onMouseEnter: () => setActiveOpp(opp),
                  onMouseLeave: clearActiveOpp,
                  onClick: () => openOpp(opp.id),
                }"
              />
            </YandexMapClusterer>
          </yandex-map>

          <div v-if="activeOpp" class="map-popup">
            <OpportunityCard :opp="activeOpp" />
          </div>
        </div>
      </div>
    </div>

    <Dialog
      v-model:visible="filtersDialog"
      header="Фильтры"
      modal
      :style="{ width: '95vw', maxWidth: '420px' }"
      class="filters-dialog"
    >
      <OpportunityFilters @update="onMobileFiltersUpdate" />
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import type { YMap } from '@yandex/ymaps3-types'
import {
  YandexMap,
  YandexMapClusterer,
  YandexMapDefaultSchemeLayer,
  YandexMapDefaultFeaturesLayer,
  YandexMapDefaultMarker,
} from 'vue-yandex-maps'
import OpportunityCard from '../components/OpportunityCard.vue'
import OpportunityFilters from '../components/OpportunityFilters.vue'
import { getOpportunities } from '../api'
import type { Opportunity, OpportunityFilters as Filters } from '../types'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import SelectButton from 'primevue/selectbutton'

const router = useRouter()
const ymap = shallowRef<YMap | null>(null)

const view = ref<'list' | 'map'>('list')
const opportunities = ref<Opportunity[]>([])
const loading = ref(false)
const error = ref('')
const activeOpp = ref<Opportunity | null>(null)
const filtersDialog = ref(false)

const viewOptions = [
  { label: 'Список', value: 'list' },
  { label: 'Карта', value: 'map' },
]

const mappedOpps = computed(() =>
  opportunities.value.filter((o) => o.latitude != null && o.longitude != null),
)

async function load(filters: Filters = {}) {
  loading.value = true
  error.value = ''
  try {
    opportunities.value = await getOpportunities(filters)
  } catch (e: unknown) {
    error.value = 'Не удалось загрузить данные. Проверьте подключение к API.'
    console.error(e)
  } finally {
    loading.value = false
  }
}

function onFiltersUpdate(filters: Filters) {
  load(filters)
}

function onMobileFiltersUpdate(filters: Filters) {
  load(filters)
  filtersDialog.value = false
}

function openOpp(id: number) {
  router.push(`/opportunity/${id}`)
}

function setActiveOpp(opp: Opportunity) {
  activeOpp.value = opp
}

function clearActiveOpp() {
  activeOpp.value = null
}

onMounted(() => load())
</script>

<style scoped>
.home { background: var(--bg); min-height: 100vh; }

.hero {
  background: linear-gradient(120deg, #0f5f59 0%, #0f766e 100%);
  color: #fff;
  padding: 1.35rem 1rem 1.15rem;
}
.hero-inner { max-width: 840px; margin: 0 auto; text-align: center; }
.hero-title { font-size: clamp(1.45rem, 3.6vw, 2rem); font-weight: 700; margin: 0 0 0.45rem; line-height: 1.2; }
.hero-sub { font-size: 0.95rem; opacity: 0.93; margin: 0; }

.main-layout {
  max-width: 1280px;
  margin: 2rem auto;
  padding: 0 1.5rem;
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}

.filters-desktop {
  display: block;
}

.content { flex: 1; min-width: 0; }

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}
.count { margin: 0; font-size: 0.9rem; color: var(--text-muted); }
.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.filters-mobile-btn {
  display: none;
}

.list-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.state-msg {
  text-align: center;
  padding: 3rem;
  color: var(--text-muted);
  font-size: 1rem;
}
.state-msg.error { color: #ef4444; }

.map-container { position: relative; border-radius: 12px; overflow: hidden; }
.map-popup {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  width: 320px;
  z-index: 10;
}

.map-popup :deep(.card) {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.cluster-pill {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  background: linear-gradient(135deg, #0f766e, #0b5b55);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255, 255, 255, 0.95);
  box-shadow: 0 6px 16px rgba(15, 118, 110, 0.35);
}

@media (max-width: 768px) {
  .main-layout {
    max-width: none;
    width: 100%;
    padding: 0;
    margin: 1rem 0;
  }

  .main-layout { flex-direction: column; }
  .filters-desktop { display: none; }

  .content {
    width: 100%;
    padding: 0 0.75rem;
  }

  .hero {
    padding: 1rem 0.75rem 0.85rem;
  }

  .hero-title {
    font-size: 1.35rem;
  }

  .hero-sub {
    font-size: 0.88rem;
  }

  .toolbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .toolbar-actions {
    width: 100%;
    justify-content: space-between;
  }

  .filters-mobile-btn {
    display: inline-flex;
  }

  .list-grid {
    grid-template-columns: 1fr;
  }

  .map-popup {
    width: calc(100% - 2rem);
  }

  .map-container {
    width: 100%;
    border-radius: 14px;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
  }

  .map-container :deep(.ymap-container) {
    height: 420px !important;
    border-radius: 14px;
  }
}
</style>
