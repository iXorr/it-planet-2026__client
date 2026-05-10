<template>
  <div class="dashboard">
    <div class="dash-header">
      <h1>Кабинет соискателя</h1>
      <p class="dash-sub">{{ auth.user?.email }}</p>
    </div>

    <div class="dashboard-layout">
      <aside class="dash-sidebar">
        <nav class="tabs">
          <button v-for="t in tabs" :key="t.key" :class="['tab', activeTab === t.key ? 'active' : '']" @click="activeTab = t.key">
            {{ t.label }}
          </button>
        </nav>
      </aside>

      <section class="dash-main">
        <div v-if="activeTab === 'profile'" class="tab-content">
          <h2 class="section-title">Профиль</h2>
          <form @submit.prevent="saveProfile" class="profile-form">
            <div class="form-row">
              <div class="form-group">
                <label>Полное имя</label>
                <input v-model="profile.full_name" type="text" required />
              </div>
              <div class="form-group">
                <label>Университет</label>
                <input v-model="profile.university" type="text" required />
              </div>
            </div>
            <div class="form-row form-row-meta">
              <div class="form-group">
                <label>Год выпуска</label>
                <input v-model.number="profile.graduation_year" type="number" min="1990" max="2035" />
              </div>
              <div class="form-group form-check">
                <label class="switch-label">
                  <input v-model="profile.is_public" type="checkbox" class="switch-input" />
                  <span class="switch-track" aria-hidden="true">
                    <span class="switch-thumb"></span>
                  </span>
                  <span>Публичный профиль</span>
                </label>
              </div>
            </div>
            <div class="resume-card">
              <h3 class="resume-title">Резюме</h3>

              <div class="form-group">
                <label>О себе</label>
                <textarea
                  v-model="resumeDraft.summary"
                  rows="4"
                  placeholder="Кратко расскажите о своих сильных сторонах и карьерной цели"
                ></textarea>
              </div>

              <div class="form-group">
                <label>Ключевые навыки</label>
                <div class="skill-input-row">
                  <input
                    v-model="resumeSkillInput"
                    type="text"
                    placeholder="Например: Python, SQL, Vue"
                    @keydown.enter.prevent="addResumeSkill"
                  />
                  <button type="button" class="btn-add-skill" @click="addResumeSkill">Добавить</button>
                </div>
                <div v-if="resumeDraft.skills.length" class="skills-list">
                  <span v-for="skill in resumeDraft.skills" :key="skill" class="skill-chip">
                    {{ skill }}
                    <button type="button" class="chip-remove" @click="removeResumeSkill(skill)">×</button>
                  </span>
                </div>
              </div>

              <div class="form-group">
                <label>Опыт и проекты</label>
                <textarea
                  v-model="resumeDraft.experience"
                  rows="4"
                  placeholder="Опишите стажировки, проекты, соревнования, pet-проекты"
                ></textarea>
              </div>

              <div class="form-group">
                <label>Образование и достижения</label>
                <textarea
                  v-model="resumeDraft.education"
                  rows="3"
                  placeholder="Курсы, сертификаты, олимпиады и другие достижения"
                ></textarea>
              </div>

              <div class="form-group">
                <label>Полезные ссылки (по одной в строке)</label>
                <textarea
                  v-model="resumeDraft.links"
                  rows="3"
                  placeholder="https://github.com/username&#10;https://t.me/username"
                ></textarea>
              </div>
            </div>
            <p v-if="profileMsg" :class="['msg', profileMsg.type]">{{ profileMsg.text }}</p>
            <button type="submit" class="btn-primary" :disabled="savingProfile">
              {{ savingProfile ? 'Сохранение...' : 'Сохранить' }}
            </button>
          </form>
        </div>

        <div v-else-if="activeTab === 'applications'" class="tab-content">
          <h2 class="section-title">Мои отклики</h2>
          <div v-if="loadingApps" class="state-msg">Загрузка...</div>
          <div v-else-if="applications.length === 0" class="state-msg">Откликов пока нет</div>
          <div v-else class="table-wrapper">
            <table class="data-table">
              <thead><tr><th>Вакансия</th><th>Статус</th><th>Дата</th></tr></thead>
              <tbody>
                <tr v-for="app in applications" :key="app.id">
                  <td>
                    <RouterLink :to="`/opportunity/${app.opportunity_id}`" class="link">
                      {{ app.opportunity?.title ?? `#${app.opportunity_id}` }}
                    </RouterLink>
                  </td>
                  <td><span :class="['status-badge', `status-${app.status}`]">{{ statusLabel(app.status) }}</span></td>
                  <td>{{ formatDate(app.created_at) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-else-if="activeTab === 'favorites'" class="tab-content">
          <h2 class="section-title">Избранные вакансии</h2>
          <div v-if="loadingFavorites" class="state-msg">Загрузка...</div>
          <div v-else-if="favoriteOpportunities.length === 0" class="state-msg">Вы пока не добавили вакансии в избранное</div>
          <div v-else class="favorites-grid">
            <OpportunityCard v-for="opp in favoriteOpportunities" :key="opp.id" :opp="opp" />
          </div>
        </div>

        <div v-else-if="activeTab === 'contacts'" class="tab-content">
          <h2 class="section-title">Контакты</h2>
          <div v-if="loadingContacts" class="state-msg">Загрузка...</div>
          <div v-else-if="contacts.length === 0" class="state-msg">Контактов нет. Начните добавлять людей из вакансий!</div>
          <div v-else class="contacts-list">
            <div v-for="c in contacts" :key="c.id" class="contact-card">
              <div class="contact-avatar">{{ (c.profile?.full_name ?? c.email).charAt(0).toUpperCase() }}</div>
              <div>
                <p class="contact-name">{{ c.profile?.full_name ?? '—' }}</p>
                <p class="contact-email">{{ c.email }}</p>
                <p v-if="c.profile?.university" class="contact-uni">{{ c.profile.university }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, onBeforeUnmount } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { updateSeekerProfile, getContacts, getOpportunity } from '../../api'
import api from '../../api'
import type { SeekerProfile, Opportunity } from '../../types'
import OpportunityCard from '../../components/OpportunityCard.vue'
import { getFavoriteOpportunityIds, subscribeFavoritesUpdated } from '../../utils/favorites'

const auth = useAuthStore()
const activeTab = ref('profile')

const tabs = [
  { key: 'profile', label: 'Профиль' },
  { key: 'applications', label: 'Отклики' },
  { key: 'favorites', label: 'Избранное' },
  { key: 'contacts', label: 'Контакты' },
]

const existingProfile = auth.user?.profile as SeekerProfile | null
const profile = reactive({
  full_name: existingProfile?.full_name ?? '',
  university: existingProfile?.university ?? '',
  graduation_year: existingProfile?.graduation_year ?? new Date().getFullYear(),
  is_public: existingProfile?.is_public ?? false,
})

type ResumeDraft = {
  summary: string
  skills: string[]
  experience: string
  education: string
  links: string
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
}

function initResumeDraft(rawResume: string | null | undefined): ResumeDraft {
  if (!rawResume?.trim()) {
    return {
      summary: '',
      skills: [],
      experience: '',
      education: '',
      links: '',
    }
  }

  try {
    const parsed = JSON.parse(rawResume) as Record<string, unknown>
    if (typeof parsed === 'string') {
      return {
        summary: parsed,
        skills: [],
        experience: '',
        education: '',
        links: '',
      }
    }

    const links = toStringArray(parsed.links).join('\n')
    return {
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
      skills: toStringArray(parsed.skills),
      experience: typeof parsed.experience === 'string' ? parsed.experience : '',
      education: typeof parsed.education === 'string' ? parsed.education : '',
      links,
    }
  } catch {
    return {
      summary: rawResume,
      skills: [],
      experience: '',
      education: '',
      links: '',
    }
  }
}

const resumeDraft = reactive<ResumeDraft>(initResumeDraft(existingProfile?.resume_json))
const resumeSkillInput = ref('')

function addResumeSkill() {
  const normalized = resumeSkillInput.value.trim()
  if (!normalized) return
  if (!resumeDraft.skills.some((skill) => skill.toLowerCase() === normalized.toLowerCase())) {
    resumeDraft.skills.push(normalized)
  }
  resumeSkillInput.value = ''
}

function removeResumeSkill(skillToRemove: string) {
  resumeDraft.skills = resumeDraft.skills.filter((skill) => skill !== skillToRemove)
}

function buildResumeJson(): string | null {
  const links = resumeDraft.links
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const payload: Record<string, unknown> = {}
  if (resumeDraft.summary.trim()) payload.summary = resumeDraft.summary.trim()
  if (resumeDraft.skills.length) payload.skills = resumeDraft.skills
  if (resumeDraft.experience.trim()) payload.experience = resumeDraft.experience.trim()
  if (resumeDraft.education.trim()) payload.education = resumeDraft.education.trim()
  if (links.length) payload.links = links

  if (Object.keys(payload).length === 0) return null
  return JSON.stringify(payload)
}

const savingProfile = ref(false)
const profileMsg = ref<{ type: string; text: string } | null>(null)

async function saveProfile() {
  savingProfile.value = true
  profileMsg.value = null
  try {
    await updateSeekerProfile({
      ...profile,
      resume_json: buildResumeJson(),
    })
    await auth.fetchUser()
    profileMsg.value = { type: 'success', text: 'Профиль сохранён!' }
  } catch {
    profileMsg.value = { type: 'error', text: 'Ошибка при сохранении' }
  } finally {
    savingProfile.value = false
  }
}

const applications = ref<any[]>([])
const loadingApps = ref(false)

async function fetchApplications() {
  loadingApps.value = true
  try {
    const { data } = await api.get('/users/me/applications')
    applications.value = data
  } catch {
    applications.value = []
  } finally {
    loadingApps.value = false
  }
}

const favoriteOpportunities = ref<Opportunity[]>([])
const loadingFavorites = ref(false)
let unsubscribeFavorites: (() => void) | null = null

async function fetchFavorites() {
  loadingFavorites.value = true
  try {
    const ids = getFavoriteOpportunityIds()
    if (ids.length === 0) {
      favoriteOpportunities.value = []
      return
    }

    const results = await Promise.allSettled(ids.map((id) => getOpportunity(id)))
    favoriteOpportunities.value = results
      .filter((r): r is PromiseFulfilledResult<Opportunity> => r.status === 'fulfilled')
      .map((r) => r.value)
  } finally {
    loadingFavorites.value = false
  }
}

function statusLabel(s: string) {
  const map: Record<string, string> = {
    pending: 'На рассмотрении',
    accepted: 'Принят',
    rejected: 'Отклонён',
    reserve: 'Резерв',
  }
  return map[s] ?? s
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ru-RU')
}

const contacts = ref<any[]>([])
const loadingContacts = ref(false)

async function fetchContacts() {
  loadingContacts.value = true
  try {
    contacts.value = await getContacts()
  } catch {
    contacts.value = []
  } finally {
    loadingContacts.value = false
  }
}

onMounted(() => {
  fetchApplications()
  fetchFavorites()
  fetchContacts()

  unsubscribeFavorites = subscribeFavoritesUpdated(() => {
    if (activeTab.value === 'favorites') {
      fetchFavorites()
    }
  })
})

watch(activeTab, (tab) => {
  if (tab === 'favorites') {
    fetchFavorites()
  }
})

onBeforeUnmount(() => {
  unsubscribeFavorites?.()
})
</script>

<style scoped>
.dashboard {
  max-width: 1240px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  min-height: calc(100vh - 60px);
  background: var(--bg);
}
.dash-header { margin-bottom: 2rem; }
.dash-header h1 { font-size: 1.6rem; font-weight: 700; margin: 0; }
.dash-sub { color: var(--text-muted); margin: 0.3rem 0 0; font-size: 0.9rem; }

.dashboard-layout { display: grid; grid-template-columns: 230px 1fr; gap: 1.2rem; align-items: start; }
.dash-sidebar { position: sticky; top: 80px; }
.tabs {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  border: 1px solid var(--border);
  background: var(--bg-card);
  border-radius: 14px;
  padding: 0.5rem;
}
.tab {
  padding: 0.65rem 0.85rem;
  background: transparent;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--text-muted);
  text-align: left;
  transition: all 0.2s;
}
.tab.active { color: var(--primary); font-weight: 600; background: rgba(15, 118, 110, 0.1); }
.tab:hover:not(.active) { color: var(--text); background: rgba(15, 118, 110, 0.06); }

.tab-content { animation: fadeIn 0.2s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }

.section-title { font-size: 1.15rem; font-weight: 600; margin: 0 0 1.5rem; }

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: none;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 1rem;
}
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-row-meta { align-items: end; }
.form-group { display: flex; flex-direction: column; gap: 0.35rem; }
.form-group label { font-size: 0.82rem; color: var(--text-muted); font-weight: 500; }
.form-group input,
.form-group textarea {
  padding: 0.5rem 0.7rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 0.95rem;
  background: var(--bg-card);
  color: var(--text);
  outline: none;
  font-family: inherit;
  transition: border-color 0.2s;
}
.form-group input:focus,
.form-group textarea:focus { border-color: var(--primary); }
.form-check { justify-content: flex-end; }
.form-check { justify-content: flex-start; }
.form-check .switch-label {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--text);
  min-height: 42px;
}

.switch-input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.switch-track {
  width: 44px;
  height: 26px;
  border-radius: 999px;
  background: #d7e4e6;
  border: 1px solid #c7d8dc;
  display: inline-flex;
  align-items: center;
  padding: 2px;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.switch-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.18);
  transition: transform 0.2s ease;
}

.switch-input:checked + .switch-track {
  background: rgba(15, 118, 110, 0.26);
  border-color: rgba(15, 118, 110, 0.55);
}

.switch-input:checked + .switch-track .switch-thumb {
  transform: translateX(18px);
}

.switch-input:focus-visible + .switch-track {
  box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.2);
}

.resume-card {
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--bg-card);
  padding: 0.95rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.resume-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
}

.skill-input-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.5rem;
}

.btn-add-skill {
  border: 1px solid var(--primary);
  background: #fff;
  color: var(--primary);
  border-radius: 8px;
  padding: 0.5rem 0.7rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.skills-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.35rem;
}

.skill-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.23rem 0.5rem;
  border-radius: 999px;
  background: rgba(15, 118, 110, 0.12);
  color: var(--primary-dark);
  font-size: 0.78rem;
  font-weight: 600;
}

.chip-remove {
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 0.92rem;
  line-height: 1;
}

.msg { padding: 0.5rem 0.75rem; border-radius: 6px; font-size: 0.88rem; margin: 0; }
.msg.success { background: #d1fae5; color: #065f46; }
.msg.error { background: #fee2e2; color: #b91c1c; }

.btn-primary {
  padding: 0.6rem 1.5rem;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  align-self: flex-start;
  transition: background 0.2s;
}
.btn-primary:hover:not(:disabled) { background: var(--primary-dark); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.state-msg { text-align: center; padding: 3rem; color: var(--text-muted); }

.table-wrapper { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
.data-table th { text-align: left; padding: 0.75rem 1rem; color: var(--text-muted); font-weight: 500; border-bottom: 1px solid var(--border); }
.data-table td { padding: 0.75rem 1rem; border-bottom: 1px solid var(--border); }
.link { color: var(--primary); text-decoration: none; }
.link:hover { text-decoration: underline; }

.status-badge { padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.78rem; font-weight: 600; }
.status-pending { background: #fef9c3; color: #854d0e; }
.status-accepted { background: #d1fae5; color: #065f46; }
.status-rejected { background: #fee2e2; color: #b91c1c; }
.status-reserve { background: #e0f2fe; color: #0369a1; }

.favorites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 0.9rem;
}

.contacts-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; }
.contact-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}
.contact-avatar {
  width: 40px;
  height: 40px;
  background: var(--primary);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  flex-shrink: 0;
}
.contact-name { font-weight: 600; margin: 0 0 0.15rem; font-size: 0.95rem; }
.contact-email { font-size: 0.82rem; color: var(--text-muted); margin: 0; }
.contact-uni { font-size: 0.82rem; color: var(--text-muted); margin: 0.2rem 0 0; }

@media (max-width: 768px) {
  .dashboard {
    padding: 1.25rem 0.75rem;
  }

  .dashboard-layout {
    grid-template-columns: 1fr;
  }

  .dash-sidebar {
    position: static;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .profile-form {
    padding: 0.85rem;
  }

  .form-check {
    justify-content: flex-start;
  }

  .tabs {
    flex-direction: row;
    overflow-x: auto;
    white-space: nowrap;
  }

  .tab {
    flex: 0 0 auto;
    padding: 0.5rem 0.8rem;
    font-size: 0.82rem;
  }

  .data-table th,
  .data-table td {
    padding: 0.5rem;
    font-size: 0.82rem;
  }
}
</style>
