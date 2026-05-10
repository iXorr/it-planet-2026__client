<template>
  <aside class="filters soft-card">
    <div class="filters-header">
      <h3 class="filters-title">Фильтры</h3>
      <Button label="Сбросить" icon="pi pi-refresh" severity="secondary" text @click="reset" />
    </div>

    <div class="filter-grid">
      <div class="filter-group">
        <label class="filter-label">Город</label>
        <InputText v-model="local.city" placeholder="Москва..." fluid @update:modelValue="emit" />
      </div>

      <div class="filter-group">
        <label class="filter-label">Тип</label>
        <Select
          v-model="local.op_type"
          :options="typeOptions"
          option-label="label"
          option-value="value"
          placeholder="Все типы"
          showClear
          fluid
          @change="emit"
        />
      </div>

      <div class="filter-group">
        <label class="filter-label">Формат</label>
        <Select
          v-model="local.work_format"
          :options="formatOptions"
          option-label="label"
          option-value="value"
          placeholder="Любой"
          showClear
          fluid
          @change="emit"
        />
      </div>

      <div class="filter-group">
        <label class="filter-label">Навыки</label>
        <InputText v-model="local.tags" placeholder="Python, SQL..." fluid @update:modelValue="emit" />
      </div>

      <div class="filter-group">
        <label class="filter-label">Мин. зарплата</label>
        <InputNumber v-model="local.min_salary" :min="0" mode="decimal" fluid @update:modelValue="emit" />
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import type { OpportunityFilters } from '../types'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'

const emits = defineEmits<{
  (e: 'update', filters: OpportunityFilters): void
}>()

const local = reactive<OpportunityFilters>({
  city: '',
  op_type: '',
  work_format: '',
  tags: '',
  min_salary: undefined,
})

const typeOptions = [
  { label: 'Вакансия', value: 'vacancy' },
  { label: 'Стажировка', value: 'internship' },
  { label: 'Менторство', value: 'mentorship' },
  { label: 'Мероприятие', value: 'event' },
]

const formatOptions = [
  { label: 'Офис', value: 'office' },
  { label: 'Гибрид', value: 'hybrid' },
  { label: 'Удаленно', value: 'remote' },
]

function emit() {
  const f: OpportunityFilters = {}
  if (local.city) f.city = local.city
  if (local.op_type) f.op_type = local.op_type
  if (local.work_format) f.work_format = local.work_format
  if (local.tags) f.tags = local.tags
  if (local.min_salary) f.min_salary = local.min_salary
  emits('update', f)
}

function reset() {
  local.city = ''
  local.op_type = ''
  local.work_format = ''
  local.tags = ''
  local.min_salary = undefined
  emits('update', {})
}
</script>

<style scoped>
.filters {
  padding: 1.25rem;
  min-width: 260px;
}
.filters-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}
.filters-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
  margin: 0;
}
.filter-grid {
  display: grid;
  gap: 0.9rem;
}
.filter-group {
  margin-bottom: 0;
}
.filter-label {
  display: block;
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-bottom: 0.35rem;
  font-weight: 500;
}

@media (max-width: 768px) {
  .filters {
    min-width: 100%;
    padding: 1rem;
  }
}
</style>
