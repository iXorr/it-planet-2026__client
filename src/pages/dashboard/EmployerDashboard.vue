<template>
  <div class="dashboard">
    <div class="dash-header">
      <h1>Кабинет работодателя</h1>
      <p class="dash-sub">{{ auth.user?.email }}</p>
      <span v-if="isVerified" class="verified-badge"><CheckCircle2 :size="14" /> Верифицирован</span>
      <span v-else class="pending-badge"><Hourglass :size="14" /> Ожидает верификации куратором</span>
    </div>

    <div class="dashboard-layout">
      <aside class="dash-sidebar">
        <nav class="tabs">
          <button
            v-for="t in tabs"
            :key="t.key"
            :class="['tab', activeTab === t.key ? 'active' : '']"
            @click="switchTab(t.key)"
          >
            {{ t.label }}
          </button>
        </nav>
      </aside>

      <section class="dash-main">
        <div v-if="activeTab === 'profile'" class="tab-content">
          <h2 class="section-title">Информация о компании</h2>
          <form @submit.prevent="saveProfile" class="profile-form">
            <div class="form-row">
              <div class="form-group">
                <label>Название компании *</label>
                <input v-model="profile.company_name" required />
              </div>
              <div class="form-group">
                <label>ИНН *</label>
                <input v-model="profile.inn" required />
              </div>
            </div>
            <div class="form-group">
              <label>Описание компании</label>
              <textarea v-model="profile.description" rows="4"></textarea>
            </div>
            <div class="form-group">
              <label>Веб-сайт</label>
              <input v-model="profile.website" type="url" placeholder="https://..." />
            </div>
            <div class="form-group">
              <label>Документы для верификации</label>
              <textarea v-model="profile.verification_docs" rows="3" placeholder="Ссылка на документы или описание..."></textarea>
            </div>
            <p v-if="profileMsg" :class="['msg', profileMsg.type]">{{ profileMsg.text }}</p>
            <button type="submit" class="btn-primary" :disabled="savingProfile">
              {{ savingProfile ? 'Сохранение...' : 'Сохранить' }}
            </button>
          </form>
        </div>

        <div v-else-if="activeTab === 'create'" class="tab-content">
          <h2 class="section-title">Создать объявление</h2>
          <div v-if="!isVerified" class="warn-box">
            <TriangleAlert :size="14" /> Для публикации объявлений необходима верификация куратором. Заполните информацию о компании и дождитесь проверки.
          </div>
          <form v-else @submit.prevent="createOpp" class="profile-form">
            <div class="form-row">
              <div class="form-group">
                <label>Заголовок *</label>
                <input v-model="newOpp.title" required />
              </div>
              <div class="form-group">
                <label>Тип *</label>
                <select v-model="newOpp.op_type" required>
                  <option value="vacancy">Вакансия</option>
                  <option value="internship">Стажировка</option>
                  <option value="mentorship">Менторство</option>
                  <option value="event">Мероприятие</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>Описание *</label>
              <textarea v-model="newOpp.description" rows="5" required></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Формат работы *</label>
                <select v-model="newOpp.work_format" required>
                  <option value="office">Офис</option>
                  <option value="hybrid">Гибрид</option>
                  <option value="remote">Удалённо</option>
                </select>
              </div>
              <div class="form-group">
                <label>Город *</label>
                <input v-model="newOpp.city" required />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Адрес</label>
                <input v-model="newOpp.address" />
              </div>
              <div class="form-group">
                <label>Дедлайн</label>
                <input v-model="newOpp.deadline" type="datetime-local" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Зарплата от (₽)</label>
                <input v-model.number="newOpp.salary_min" type="number" min="0" />
              </div>
              <div class="form-group">
                <label>Зарплата до (₽)</label>
                <input v-model.number="newOpp.salary_max" type="number" min="0" />
              </div>
            </div>
            <div class="form-group">
              <label>Теги / навыки (через запятую)</label>
              <input v-model="newOpp.tag_names_str" placeholder="Python, SQL, Junior" />
            </div>
            <p v-if="createMsg" :class="['msg', createMsg.type]">{{ createMsg.text }}</p>
            <button type="submit" class="btn-primary" :disabled="creatingOpp">
              {{ creatingOpp ? 'Создаём...' : 'Опубликовать' }}
            </button>
          </form>
        </div>

        <div v-else-if="activeTab === 'opportunities'" class="tab-content">
          <h2 class="section-title">Мои объявления</h2>
          <div v-if="loadingOpps" class="state-msg">Загрузка...</div>
          <div v-else-if="myOpps.length === 0" class="state-msg">Объявлений нет</div>
          <div v-else class="opps-list">
            <div v-for="opp in myOpps" :key="opp.id" class="opp-row">
              <div class="opp-row-main">
                <RouterLink :to="`/opportunity/${opp.id}`" class="link">{{ opp.title }}</RouterLink>
                <p class="opp-row-meta">{{ typeMap[opp.op_type] }} · {{ opp.city }}</p>
              </div>

              <div class="opp-row-side">
                <span :class="['status-badge', opp.is_active ? 'active' : 'inactive']">
                  {{ opp.is_active ? 'Активно' : 'Архив' }}
                </span>
                <div class="row-actions">
                  <button class="btn-sm edit" @click="openEditOpp(opp)"><Pencil :size="14" /> Изменить</button>
                  <button class="btn-sm delete" @click="removeOpp(opp)" :disabled="deletingOppId === opp.id">
                    <Trash2 :size="14" /> {{ deletingOppId === opp.id ? 'Удаляем...' : 'Удалить' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="activeTab === 'applications'" class="tab-content">
          <h2 class="section-title">Отклики на мои объявления</h2>
          <div v-if="loadingApps" class="state-msg">Загрузка...</div>
          <div v-else-if="myApplications.length === 0" class="state-msg">Откликов нет</div>
          <div v-else class="table-wrapper">
            <table class="data-table apps-table">
              <colgroup>
                <col class="col-seeker" />
                <col class="col-opp" />
                <col class="col-status" />
                <col class="col-actions" />
              </colgroup>
              <thead><tr><th>Соискатель</th><th>Вакансия</th><th>Статус</th><th>Действия</th></tr></thead>
              <tbody>
                <tr v-for="app in myApplications" :key="app.application_id">
                  <td>
                    <p class="td-name">{{ app.seeker?.profile?.full_name ?? app.seeker?.email }}</p>
                    <p class="td-sub">{{ app.seeker?.email }}</p>
                  </td>
                  <td>
                    <RouterLink :to="`/opportunity/${app.opportunity_id}`" class="link">#{{ app.opportunity_id }}</RouterLink>
                  </td>
                  <td class="status-cell"><span :class="['status-badge', `status-${app.status}`]">{{ statusLabel(app.status) }}</span></td>
                  <td class="actions-cell">
                    <div class="app-actions">
                      <button class="btn-sm profile" @click="openSeekerProfile(app)">Профиль</button>
                      <button class="btn-sm accept" @click="setStatus(app.application_id, 'accepted')" :disabled="app.status === 'accepted'"><Check :size="14" /></button>
                      <button class="btn-sm reserve" @click="setStatus(app.application_id, 'reserve')" :disabled="app.status === 'reserve'"><Bookmark :size="14" /></button>
                      <button class="btn-sm reject" @click="setStatus(app.application_id, 'rejected')" :disabled="app.status === 'rejected'"><X :size="14" /></button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>

    <Dialog
      v-model:visible="profileDialogVisible"
      header="Профиль соискателя"
      modal
      :style="{ width: '95vw', maxWidth: '720px' }"
    >
      <div v-if="selectedApplication" class="profile-dialog-content">
        <div class="profile-grid">
          <div>
            <p class="profile-label">Имя</p>
            <p class="profile-value">{{ selectedApplication.seeker?.profile?.full_name ?? 'Не указано' }}</p>
          </div>
          <div>
            <p class="profile-label">Email</p>
            <p class="profile-value">{{ selectedApplication.seeker?.email ?? 'Не указано' }}</p>
          </div>
          <div>
            <p class="profile-label">Университет</p>
            <p class="profile-value">{{ selectedApplication.seeker?.profile?.university ?? 'Не указано' }}</p>
          </div>
          <div>
            <p class="profile-label">Год выпуска</p>
            <p class="profile-value">{{ selectedApplication.seeker?.profile?.graduation_year ?? 'Не указано' }}</p>
          </div>
        </div>

        <div class="resume-block">
          <p class="profile-label">Резюме</p>
          <div class="resume-text">
            <p v-if="!hasResumeData" class="resume-empty">Резюме не заполнено</p>

            <div v-if="resumeView.summary" class="resume-section">
              <p class="resume-section-title">О себе</p>
              <p class="resume-section-body">{{ resumeView.summary }}</p>
            </div>

            <div v-if="resumeView.skills.length" class="resume-section">
              <p class="resume-section-title">Ключевые навыки</p>
              <div class="resume-chips">
                <span v-for="skill in resumeView.skills" :key="skill" class="resume-chip">{{ skill }}</span>
              </div>
            </div>

            <div v-if="resumeView.experience" class="resume-section">
              <p class="resume-section-title">Опыт и проекты</p>
              <p class="resume-section-body">{{ resumeView.experience }}</p>
            </div>

            <div v-if="resumeView.education" class="resume-section">
              <p class="resume-section-title">Образование и достижения</p>
              <p class="resume-section-body">{{ resumeView.education }}</p>
            </div>

            <div v-if="resumeView.links.length" class="resume-section">
              <p class="resume-section-title">Ссылки</p>
              <ul class="resume-links">
                <li v-for="link in resumeView.links" :key="link">
                  <a :href="link" target="_blank" rel="noopener noreferrer">{{ link }}</a>
                </li>
              </ul>
            </div>

            <div v-if="resumeView.rawText" class="resume-section">
              <p class="resume-section-title">Дополнительно</p>
              <p class="resume-section-body">{{ resumeView.rawText }}</p>
            </div>
          </div>
        </div>
      </div>
    </Dialog>

    <Dialog
      v-model:visible="editDialogVisible"
      header="Редактирование объявления"
      modal
      :style="{ width: '95vw', maxWidth: '760px' }"
    >
      <form @submit.prevent="saveEditedOpp" class="profile-form">
        <div class="form-row">
          <div class="form-group">
            <label>Заголовок *</label>
            <input v-model="editOpp.title" required />
          </div>
          <div class="form-group">
            <label>Тип *</label>
            <select v-model="editOpp.op_type" required>
              <option value="vacancy">Вакансия</option>
              <option value="internship">Стажировка</option>
              <option value="mentorship">Менторство</option>
              <option value="event">Мероприятие</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Описание *</label>
          <textarea v-model="editOpp.description" rows="5" required></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Формат работы *</label>
            <select v-model="editOpp.work_format" required>
              <option value="office">Офис</option>
              <option value="hybrid">Гибрид</option>
              <option value="remote">Удалённо</option>
            </select>
          </div>
          <div class="form-group">
            <label>Город *</label>
            <input v-model="editOpp.city" required />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Адрес</label>
            <input v-model="editOpp.address" />
          </div>
          <div class="form-group">
            <label>Дедлайн</label>
            <input v-model="editOpp.deadline" type="datetime-local" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Зарплата от (₽)</label>
            <input v-model.number="editOpp.salary_min" type="number" min="0" />
          </div>
          <div class="form-group">
            <label>Зарплата до (₽)</label>
            <input v-model.number="editOpp.salary_max" type="number" min="0" />
          </div>
        </div>
        <div class="form-group">
          <label>Теги / навыки (через запятую)</label>
          <input v-model="editOpp.tag_names_str" placeholder="Python, SQL, Junior" />
        </div>

        <p v-if="editMsg" :class="['msg', editMsg.type]">{{ editMsg.text }}</p>
        <button type="submit" class="btn-primary" :disabled="savingEditedOpp">
          {{ savingEditedOpp ? 'Сохраняем...' : 'Сохранить изменения' }}
        </button>
      </form>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import Dialog from 'primevue/dialog'
import { CheckCircle2, Hourglass, TriangleAlert, Check, Bookmark, X, Pencil, Trash2 } from 'lucide-vue-next'
import { useAuthStore } from '../../stores/auth'
import {
  updateEmployerProfile,
  getMyOpportunities,
  getMyApplications,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  updateApplicationStatus,
  geocodeAddress,
} from '../../api'
import type { EmployerProfile, Opportunity } from '../../types'

const auth = useAuthStore()
const activeTab = ref('profile')

const tabs = [
  { key: 'profile', label: 'Компания' },
  { key: 'create', label: 'Создать' },
  { key: 'opportunities', label: 'Объявления' },
  { key: 'applications', label: 'Отклики' },
]

const typeMap: Record<string, string> = {
  internship: 'Стажировка',
  vacancy: 'Вакансия',
  mentorship: 'Менторство',
  event: 'Мероприятие',
}

const existingProfile = auth.user?.profile as EmployerProfile | null
const isVerified = computed(() => (auth.user?.profile as EmployerProfile | null)?.is_verified ?? false)

const profile = reactive({
  company_name: existingProfile?.company_name ?? '',
  inn: existingProfile?.inn ?? '',
  description: existingProfile?.description ?? '',
  website: existingProfile?.website ?? '',
  verification_docs: existingProfile?.verification_docs ?? '',
})
const savingProfile = ref(false)
const profileMsg = ref<{ type: string; text: string } | null>(null)

async function saveProfile() {
  savingProfile.value = true
  profileMsg.value = null
  try {
    await updateEmployerProfile({ ...profile })
    await auth.fetchUser()
    profileMsg.value = { type: 'success', text: 'Профиль компании сохранён!' }
  } catch {
    profileMsg.value = { type: 'error', text: 'Ошибка при сохранении' }
  } finally {
    savingProfile.value = false
  }
}

const newOpp = reactive({
  title: '',
  description: '',
  op_type: 'vacancy' as Opportunity['op_type'],
  work_format: 'office' as Opportunity['work_format'],
  city: '',
  address: '',
  deadline: '',
  salary_min: undefined as number | undefined,
  salary_max: undefined as number | undefined,
  tag_names_str: '',
})
const creatingOpp = ref(false)
const createMsg = ref<{ type: string; text: string } | null>(null)

async function createOpp() {
  creatingOpp.value = true
  createMsg.value = null
  try {
    const tag_names = newOpp.tag_names_str.split(',').map((t) => t.trim()).filter(Boolean)
    const geocodeQuery = [newOpp.city, newOpp.address].filter(Boolean).join(', ')
    const coordinates = await geocodeAddress(geocodeQuery)

    await createOpportunity({
      title: newOpp.title,
      description: newOpp.description,
      op_type: newOpp.op_type,
      work_format: newOpp.work_format,
      city: newOpp.city,
      address: newOpp.address || undefined,
      deadline: newOpp.deadline ? new Date(newOpp.deadline).toISOString() : undefined,
      salary_min: newOpp.salary_min,
      salary_max: newOpp.salary_max,
      latitude: coordinates?.latitude,
      longitude: coordinates?.longitude,
      tag_names,
    })

    createMsg.value = coordinates
      ? { type: 'success', text: 'Объявление опубликовано!' }
      : { type: 'success', text: 'Объявление опубликовано (координаты не удалось определить по адресу).' }
    await loadOpps()
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'response' in e) {
      const resp = (e as { response?: { data?: { detail?: string } } }).response
      createMsg.value = { type: 'error', text: resp?.data?.detail ?? 'Ошибка создания' }
    } else {
      createMsg.value = { type: 'error', text: 'Ошибка подключения' }
    }
  } finally {
    creatingOpp.value = false
  }
}

const myOpps = ref<Opportunity[]>([])
const loadingOpps = ref(false)
async function loadOpps() {
  loadingOpps.value = true
  try {
    myOpps.value = await getMyOpportunities()
  } catch {
    myOpps.value = []
  } finally {
    loadingOpps.value = false
  }
}

const editDialogVisible = ref(false)
const editingOppId = ref<number | null>(null)
const savingEditedOpp = ref(false)
const deletingOppId = ref<number | null>(null)
const editMsg = ref<{ type: string; text: string } | null>(null)
const editOpp = reactive({
  title: '',
  description: '',
  op_type: 'vacancy' as Opportunity['op_type'],
  work_format: 'office' as Opportunity['work_format'],
  city: '',
  address: '',
  deadline: '',
  salary_min: undefined as number | undefined,
  salary_max: undefined as number | undefined,
  tag_names_str: '',
})

function toLocalDatetimeInput(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (v: number) => String(v).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function openEditOpp(opp: Opportunity) {
  editingOppId.value = opp.id
  editMsg.value = null
  editOpp.title = opp.title
  editOpp.description = opp.description
  editOpp.op_type = opp.op_type
  editOpp.work_format = opp.work_format
  editOpp.city = opp.city
  editOpp.address = opp.address ?? ''
  editOpp.deadline = toLocalDatetimeInput(opp.deadline)
  editOpp.salary_min = opp.salary_min ?? undefined
  editOpp.salary_max = opp.salary_max ?? undefined
  editOpp.tag_names_str = (opp.tag_names ?? []).join(', ')
  editDialogVisible.value = true
}

async function saveEditedOpp() {
  if (!editingOppId.value) return
  savingEditedOpp.value = true
  editMsg.value = null

  try {
    const tag_names = editOpp.tag_names_str.split(',').map((t) => t.trim()).filter(Boolean)
    const geocodeQuery = [editOpp.city, editOpp.address].filter(Boolean).join(', ')
    const coordinates = await geocodeAddress(geocodeQuery)

    await updateOpportunity(editingOppId.value, {
      title: editOpp.title,
      description: editOpp.description,
      op_type: editOpp.op_type,
      work_format: editOpp.work_format,
      city: editOpp.city,
      address: editOpp.address || undefined,
      deadline: editOpp.deadline ? new Date(editOpp.deadline).toISOString() : null,
      salary_min: editOpp.salary_min,
      salary_max: editOpp.salary_max,
      latitude: coordinates?.latitude,
      longitude: coordinates?.longitude,
      tag_names,
    })

    await loadOpps()
    editDialogVisible.value = false
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'response' in e) {
      const resp = (e as { response?: { data?: { detail?: string } } }).response
      editMsg.value = { type: 'error', text: resp?.data?.detail ?? 'Ошибка сохранения' }
    } else {
      editMsg.value = { type: 'error', text: 'Ошибка подключения' }
    }
  } finally {
    savingEditedOpp.value = false
  }
}

async function removeOpp(opp: Opportunity) {
  const isConfirmed = confirm(`Удалить объявление "${opp.title}"?`)
  if (!isConfirmed) return

  deletingOppId.value = opp.id
  try {
    await deleteOpportunity(opp.id)
    myOpps.value = myOpps.value.filter((item) => item.id !== opp.id)
  } catch {
    alert('Не удалось удалить объявление')
  } finally {
    deletingOppId.value = null
  }
}

const myApplications = ref<any[]>([])
const loadingApps = ref(false)
const selectedApplication = ref<any | null>(null)
const profileDialogVisible = ref(false)

async function loadApps() {
  loadingApps.value = true
  try {
    myApplications.value = await getMyApplications()
  } catch {
    myApplications.value = []
  } finally {
    loadingApps.value = false
  }
}

function openSeekerProfile(app: any) {
  selectedApplication.value = app
  profileDialogVisible.value = true
}

type ResumeView = {
  summary: string
  skills: string[]
  experience: string
  education: string
  links: string[]
  rawText: string
}

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseResume(rawResume: unknown): ResumeView {
  if (!rawResume) {
    return {
      summary: '',
      skills: [],
      experience: '',
      education: '',
      links: [],
      rawText: '',
    }
  }

  if (typeof rawResume !== 'string') {
    return {
      summary: '',
      skills: [],
      experience: '',
      education: '',
      links: [],
      rawText: String(rawResume),
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
        links: [],
        rawText: '',
      }
    }

    return {
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
      skills: normalizeStringList(parsed.skills),
      experience: typeof parsed.experience === 'string' ? parsed.experience : '',
      education: typeof parsed.education === 'string' ? parsed.education : '',
      links: normalizeStringList(parsed.links),
      rawText: '',
    }
  } catch {
    return {
      summary: rawResume,
      skills: [],
      experience: '',
      education: '',
      links: [],
      rawText: '',
    }
  }
}

const resumeView = computed(() => parseResume(selectedApplication.value?.seeker?.profile?.resume_json))

const hasResumeData = computed(
  () =>
    Boolean(
      resumeView.value.summary ||
      resumeView.value.skills.length ||
      resumeView.value.experience ||
      resumeView.value.education ||
      resumeView.value.links.length ||
      resumeView.value.rawText,
    ),
)

async function setStatus(appId: number, status: 'accepted' | 'rejected' | 'reserve') {
  try {
    await updateApplicationStatus(appId, status)
    const app = myApplications.value.find((a) => a.application_id === appId)
    if (app) app.status = status
  } catch {}
}

function statusLabel(s: string) {
  const map: Record<string, string> = { pending: 'На рассмотрении', accepted: 'Принят', rejected: 'Отклонён', reserve: 'Резерв' }
  return map[s] ?? s
}

function switchTab(tabKey: string) {
  activeTab.value = tabKey
  if (tabKey === 'opportunities') loadOpps()
  if (tabKey === 'applications') loadApps()
}

onMounted(() => {
  loadOpps()
  loadApps()
})
</script>

<style scoped>
.dashboard {
  max-width: 1320px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  min-height: calc(100vh - 60px);
  background: var(--bg);
}
.dash-header { margin-bottom: 1.5rem; }
.dash-header h1 { font-size: 1.7rem; font-weight: 700; margin: 0 0 0.3rem; }
.dash-sub { color: var(--text-muted); margin: 0 0 0.5rem; font-size: 0.95rem; }
.verified-badge { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.2rem 0.7rem; background: #d1fae5; color: #065f46; border-radius: 20px; font-size: 0.82rem; font-weight: 600; }
.pending-badge { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.2rem 0.7rem; background: #fef9c3; color: #854d0e; border-radius: 20px; font-size: 0.82rem; font-weight: 600; }

.dashboard-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 1.25rem;
  align-items: start;
}
.dash-sidebar {
  position: sticky;
  top: 80px;
}
.tabs {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 0.5rem;
}
.tab {
  padding: 0.7rem 0.85rem;
  background: transparent;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--text-muted);
  text-align: left;
  transition: all 0.2s;
}
.tab.active {
  color: var(--primary);
  background: rgba(15, 118, 110, 0.1);
  font-weight: 600;
}
.tab:hover:not(.active) { background: rgba(15, 118, 110, 0.06); color: var(--text); }

.dash-main { min-width: 0; }
.tab-content { animation: fadeIn 0.2s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
.section-title { font-size: 1.2rem; font-weight: 600; margin: 0 0 1.25rem; }

.profile-form { display: flex; flex-direction: column; gap: 1rem; width: 100%; max-width: none; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.35rem; }
.form-group label { font-size: 0.88rem; color: var(--text-muted); font-weight: 500; }
.form-group input, .form-group select, .form-group textarea {
  padding: 0.55rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 0.98rem;
  background: var(--bg-card);
  color: var(--text);
  outline: none;
  font-family: inherit;
  transition: border-color 0.2s;
}
.form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: var(--primary); }

.msg { padding: 0.5rem 0.75rem; border-radius: 6px; font-size: 0.9rem; margin: 0; }
.msg.success { background: #d1fae5; color: #065f46; }
.msg.error { background: #fee2e2; color: #b91c1c; }

.btn-primary { padding: 0.65rem 1.5rem; background: var(--primary); color: #fff; border: none; border-radius: 8px; font-size: 0.96rem; font-weight: 600; cursor: pointer; align-self: flex-start; transition: background 0.2s; }
.btn-primary:hover:not(:disabled) { background: var(--primary-dark); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.warn-box { padding: 1rem; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; color: #854d0e; font-size: 0.92rem; }

.state-msg { text-align: center; padding: 3rem; color: var(--text-muted); }
.opps-list { display: flex; flex-direction: column; gap: 0.75rem; }
.opp-row {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 1rem 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.opp-row-main .link { font-weight: 600; color: var(--text); text-decoration: none; }
.opp-row-main .link:hover { color: var(--primary); }
.opp-row-meta { font-size: 0.86rem; color: var(--text-muted); margin: 0.2rem 0 0; }
.opp-row-side { display: flex; align-items: center; gap: 0.6rem; }
.row-actions { display: flex; gap: 0.45rem; flex-wrap: wrap; }

.status-badge { padding: 0.2rem 0.7rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600; white-space: nowrap; }
.status-badge.active { background: #d1fae5; color: #065f46; }
.status-badge.inactive { background: #fee2e2; color: #b91c1c; }
.status-pending { background: #fef9c3; color: #854d0e; }
.status-accepted { background: #d1fae5; color: #065f46; }
.status-rejected { background: #fee2e2; color: #b91c1c; }
.status-reserve { background: #e0f2fe; color: #0369a1; }

.table-wrapper { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.92rem; }
.data-table th { text-align: left; padding: 0.7rem 1rem; color: var(--text-muted); font-weight: 500; border-bottom: 1px solid var(--border); }
.data-table td { padding: 0.7rem 1rem; border-bottom: 1px solid var(--border); vertical-align: middle; }
.apps-table { table-layout: fixed; min-width: 980px; }
.apps-table .col-seeker { width: 34%; }
.apps-table .col-opp { width: 16%; }
.apps-table .col-status { width: 14%; }
.apps-table .col-actions { width: 36%; }
.apps-table .status-cell { padding-right: 1.5rem; }
.apps-table .actions-cell { padding-left: 1.1rem; }
.apps-table .status-cell .status-badge {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
}
.td-name { margin: 0; font-weight: 600; }
.td-sub { margin: 0; font-size: 0.82rem; color: var(--text-muted); }
.link { color: var(--primary); text-decoration: none; }
.actions-cell { white-space: nowrap; }
.app-actions {
  display: grid;
  grid-template-columns: minmax(110px, 1fr) repeat(3, 40px);
  gap: 0.55rem;
  align-items: center;
}

.btn-sm {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.6rem;
  border: 1px solid var(--border);
  border-radius: 7px;
  cursor: pointer;
  font-size: 0.85rem;
  background: var(--bg-card);
  transition: all 0.15s;
  justify-content: center;
}
.app-actions .btn-sm.profile {
  justify-content: flex-start;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.app-actions .btn-sm.accept,
.app-actions .btn-sm.reserve,
.app-actions .btn-sm.reject {
  width: 40px;
  min-width: 40px;
  padding-left: 0;
  padding-right: 0;
}
.btn-sm:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-sm.accept:not(:disabled):hover { background: #d1fae5; border-color: #6ee7b7; }
.btn-sm.reject:not(:disabled):hover { background: #fee2e2; border-color: #fca5a5; }
.btn-sm.reserve:not(:disabled):hover { background: #e0f2fe; border-color: #7dd3fc; }
.btn-sm.profile:not(:disabled):hover { background: #f1f5f9; border-color: #cbd5e1; }
.btn-sm.edit:not(:disabled):hover { background: #eef2ff; border-color: #a5b4fc; color: #3730a3; }
.btn-sm.delete:not(:disabled):hover { background: #fee2e2; border-color: #fca5a5; color: #b91c1c; }

.profile-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.profile-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem 1rem;
}

.profile-label {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.profile-value {
  margin: 0.25rem 0 0;
  font-size: 0.95rem;
}

.resume-block {
  border-top: 1px solid var(--border);
  padding-top: 0.75rem;
}

.resume-text {
  margin: 0.45rem 0 0;
  max-height: 300px;
  overflow: auto;
  padding: 0.75rem;
  background: #f8fafc;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 0.84rem;
  line-height: 1.45;
}

.resume-empty {
  margin: 0;
  color: var(--text-muted);
}

.resume-section + .resume-section {
  margin-top: 0.7rem;
}

.resume-section-title {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-muted);
}

.resume-section-body {
  margin: 0.25rem 0 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.resume-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.35rem;
}

.resume-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.16rem 0.48rem;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 600;
  background: rgba(15, 118, 110, 0.12);
  color: var(--primary-dark);
}

.resume-links {
  margin: 0.35rem 0 0;
  padding-left: 1rem;
}

.resume-links a {
  color: var(--primary);
  text-decoration: none;
  word-break: break-all;
}

.resume-links a:hover {
  text-decoration: underline;
}

@media (max-width: 980px) {
  .dashboard-layout {
    grid-template-columns: 1fr;
  }

  .dash-sidebar {
    position: static;
  }

  .tabs {
    flex-direction: row;
    overflow-x: auto;
    white-space: nowrap;
  }

  .tab {
    flex: 0 0 auto;
    text-align: center;
  }
}

@media (max-width: 768px) {
  .dashboard {
    padding: 1.2rem 0.75rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .opp-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .opp-row-side {
    width: 100%;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .apps-table {
    min-width: 760px;
  }

  .app-actions {
    grid-template-columns: minmax(90px, 1fr) repeat(3, 36px);
    gap: 0.45rem;
  }

  .app-actions .btn-sm.accept,
  .app-actions .btn-sm.reserve,
  .app-actions .btn-sm.reject {
    width: 36px;
    min-width: 36px;
  }

  .data-table th,
  .data-table td {
    padding: 0.5rem;
    font-size: 0.84rem;
  }

  .profile-grid {
    grid-template-columns: 1fr;
  }
}
</style>
