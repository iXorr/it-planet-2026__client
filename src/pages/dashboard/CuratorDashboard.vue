<template>
  <div class="dashboard">
    <div class="dash-header">
      <h1>Панель куратора</h1>
      <p class="dash-sub">{{ auth.user?.email }}</p>
    </div>

    <div class="dashboard-layout">
      <aside class="dash-sidebar">
        <nav class="tabs">
          <button v-for="t in tabs" :key="t.key" :class="['tab', activeTab === t.key ? 'active' : '']" @click="switchTab(t.key)">
            {{ t.label }}
          </button>
        </nav>
      </aside>

      <section class="dash-main">
        <div v-if="activeTab === 'users'" class="tab-content">
          <h2 class="section-title">Пользователи</h2>
          <div v-if="loadingUsers" class="state-msg">Загрузка...</div>
          <div v-else-if="users.length === 0" class="state-msg">Нет пользователей</div>
          <div v-else class="table-wrapper users-table-wrap">
            <table class="data-table users-table">
              <colgroup>
                <col class="col-id" />
                <col class="col-email" />
                <col class="col-role" />
                <col class="col-status" />
                <col class="col-actions" />
              </colgroup>
              <thead>
                <tr>
                  <th>ID</th><th>Email</th><th>Роль</th><th>Статус</th><th>Действия</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="u in users" :key="u.id">
                  <td>{{ u.id }}</td>
                  <td><span class="email-cell" :title="u.email">{{ u.email }}</span></td>
                  <td>
                    <span :class="['role-badge', `role-${u.role}`]">{{ roleLabel(u.role) }}</span>
                  </td>
                  <td>
                    <span :class="['status-badge', u.is_active ? 'active' : 'inactive']">
                      {{ u.is_active ? 'Активен' : 'Заблокирован' }}
                    </span>
                  </td>
                  <td class="actions-cell">
                    <div class="actions-grid">
                      <button
                        v-if="u.role === 'employer'"
                        class="btn-sm verify"
                        @click="toggleVerify(u)"
                      >
                        {{ getEmployerVerified(u) ? 'Снять верификацию' : 'Верифицировать' }}
                      </button>
                      <span v-else class="btn-slot-empty" aria-hidden="true"></span>

                      <button
                        v-if="u.id !== auth.user?.id"
                        class="btn-sm delete"
                        @click="removeUser(u.id)"
                      >
                        <Trash2 :size="14" /> Удалить
                      </button>
                      <span v-else class="btn-slot-empty" aria-hidden="true"></span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-else-if="activeTab === 'moderation'" class="tab-content">
          <h2 class="section-title">Модерация объявлений</h2>
          <div v-if="loadingOpps" class="state-msg">Загрузка...</div>
          <div v-else-if="allOpps.length === 0" class="state-msg">Объявлений нет</div>
          <div v-else class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr><th>ID</th><th>Название</th><th>Компания</th><th>Тип</th><th>Статус</th><th>Действия</th></tr>
              </thead>
              <tbody>
                <tr v-for="opp in allOpps" :key="opp.id">
                  <td>{{ opp.id }}</td>
                  <td>
                    <RouterLink :to="`/opportunity/${opp.id}`" class="link">{{ opp.title }}</RouterLink>
                  </td>
                  <td>{{ opp.company_name ?? '—' }}</td>
                  <td>{{ typeMap[opp.op_type] }}</td>
                  <td>
                    <span :class="['status-badge', opp.is_active ? 'active' : 'inactive']">
                      {{ opp.is_active ? 'Активно' : 'Архив' }}
                    </span>
                  </td>
                  <td>
                    <button class="btn-sm" @click="toggleOpp(opp)">
                      {{ opp.is_active ? 'Деактивировать' : 'Активировать' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-else-if="activeTab === 'create-curator'" class="tab-content">
          <h2 class="section-title">Создать куратора</h2>
          <form @submit.prevent="createCurator" class="profile-form">
            <div class="form-group">
              <label>Email</label>
              <input v-model="newCurator.email" type="email" required />
            </div>
            <div class="form-group">
              <label>Пароль</label>
              <input v-model="newCurator.password" type="password" required minlength="6" />
            </div>
            <p v-if="curatorMsg" :class="['msg', curatorMsg.type]">{{ curatorMsg.text }}</p>
            <button type="submit" class="btn-primary" :disabled="creatingCurator">
              {{ creatingCurator ? 'Создаём...' : 'Создать куратора' }}
            </button>
          </form>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Trash2 } from 'lucide-vue-next'
import { useAuthStore } from '../../stores/auth'
import { getAllUsers, verifyEmployer, moderateOpportunity, deleteUser, getAllOpportunitiesAdmin } from '../../api'
import api from '../../api'
import type { Opportunity } from '../../types'

const auth = useAuthStore()
const activeTab = ref('users')

const tabs = [
  { key: 'users', label: 'Пользователи' },
  { key: 'moderation', label: 'Модерация' },
  { key: 'create-curator', label: 'Куратор' },
]

const typeMap: Record<string, string> = {
  internship: 'Стажировка', vacancy: 'Вакансия', mentorship: 'Менторство', event: 'Мероприятие',
}

const users = ref<any[]>([])
const loadingUsers = ref(false)

async function loadUsers() {
  loadingUsers.value = true
  try {
    users.value = await getAllUsers()
  } catch {
    users.value = []
  } finally {
    loadingUsers.value = false
  }
}

function roleLabel(r: string) {
  const map: Record<string, string> = { seeker: 'Соискатель', employer: 'Работодатель', curator: 'Куратор' }
  return map[r] ?? r
}

function getEmployerVerified(u: any): boolean {
  return u.profile?.is_verified ?? false
}

async function toggleVerify(u: any) {
  const current = getEmployerVerified(u)
  try {
    await verifyEmployer(u.id, !current)
    if (u.profile) u.profile.is_verified = !current
    else u.profile = { is_verified: !current }
  } catch {}
}

async function removeUser(userId: number) {
  if (!confirm('Удалить пользователя?')) return
  try {
    await deleteUser(userId)
    users.value = users.value.filter((u) => u.id !== userId)
  } catch {}
}

const allOpps = ref<Opportunity[]>([])
const loadingOpps = ref(false)

async function loadOpps() {
  loadingOpps.value = true
  try {
    allOpps.value = await getAllOpportunitiesAdmin()
  } catch {
    allOpps.value = []
  } finally {
    loadingOpps.value = false
  }
}

async function toggleOpp(opp: Opportunity) {
  try {
    await moderateOpportunity(opp.id, !opp.is_active)
    opp.is_active = !opp.is_active
  } catch {}
}

const newCurator = reactive({ email: '', password: '' })
const creatingCurator = ref(false)
const curatorMsg = ref<{ type: string; text: string } | null>(null)

async function createCurator() {
  creatingCurator.value = true
  curatorMsg.value = null
  try {
    await api.post('/admin/create-curator', { ...newCurator })
    curatorMsg.value = { type: 'success', text: `Куратор ${newCurator.email} создан!` }
    newCurator.email = ''
    newCurator.password = ''
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'response' in e) {
      const resp = (e as { response?: { data?: { detail?: string } } }).response
      curatorMsg.value = { type: 'error', text: resp?.data?.detail ?? 'Ошибка' }
    } else {
      curatorMsg.value = { type: 'error', text: 'Ошибка подключения' }
    }
  } finally {
    creatingCurator.value = false
  }
}

function switchTab(key: string) {
  activeTab.value = key
  if (key === 'users') loadUsers()
  if (key === 'moderation') loadOpps()
}

onMounted(() => loadUsers())
</script>

<style scoped>
.dashboard { max-width: 1280px; margin: 0 auto; padding: 2rem 1.5rem; min-height: calc(100vh - 60px); background: var(--bg); }
.dash-header { margin-bottom: 1.5rem; }
.dash-header h1 { font-size: 1.6rem; font-weight: 700; margin: 0 0 0.3rem; }
.dash-sub { color: var(--text-muted); margin: 0; font-size: 0.9rem; }

.dashboard-layout { display: grid; grid-template-columns: 230px 1fr; gap: 1.2rem; align-items: start; }
.dash-sidebar { position: sticky; top: 80px; }
.tabs { display: flex; flex-direction: column; gap: 0.4rem; border: 1px solid var(--border); border-radius: 14px; background: var(--bg-card); padding: 0.5rem; }
.tab { padding: 0.65rem 0.85rem; background: transparent; border: none; border-radius: 10px; cursor: pointer; font-size: 0.9rem; color: var(--text-muted); transition: all 0.2s; text-align: left; }
.tab.active { color: var(--primary); background: rgba(15, 118, 110, 0.1); font-weight: 600; }
.tab:hover:not(.active) { background: rgba(15, 118, 110, 0.06); color: var(--text); }

.tab-content { animation: fadeIn 0.2s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
.section-title { font-size: 1.1rem; font-weight: 600; margin: 0 0 1.5rem; }
.state-msg { text-align: center; padding: 3rem; color: var(--text-muted); }

.table-wrapper { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
.data-table th { text-align: left; padding: 0.65rem 1rem; color: var(--text-muted); font-weight: 500; border-bottom: 2px solid var(--border); }
.data-table td { padding: 0.65rem 1rem; border-bottom: 1px solid var(--border); vertical-align: middle; }
.data-table tbody tr:hover { background: #f8fafc; }
.link { color: var(--primary); text-decoration: none; }
.link:hover { text-decoration: underline; }

.users-table { table-layout: fixed; min-width: 860px; }
.users-table .col-id { width: 72px; }
.users-table .col-email { width: 36%; }
.users-table .col-role { width: 17%; }
.users-table .col-status { width: 19%; }
.users-table .col-actions { width: 28%; }

.email-cell {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.role-badge { padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.78rem; font-weight: 600; }
.role-seeker { background: #e0f2fe; color: #0369a1; }
.role-employer { background: #ede9fe; color: #5b21b6; }
.role-curator { background: #d1fae5; color: #065f46; }

.status-badge { padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.78rem; font-weight: 600; }
.status-badge.active { background: #d1fae5; color: #065f46; }
.status-badge.inactive { background: #fee2e2; color: #b91c1c; }

.users-table td { padding-top: 0.55rem; padding-bottom: 0.55rem; }
.users-table .actions-cell { min-height: 36px; }
.actions-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 0.4rem;
  align-items: center;
}
.actions-grid > * {
  min-width: 0;
}
.btn-slot-empty {
  height: 34px;
  border: 1px solid transparent;
  border-radius: 6px;
  visibility: hidden;
}
.btn-sm { padding: 0.3rem 0.65rem; border: 1px solid var(--border); border-radius: 6px; cursor: pointer; font-size: 0.82rem; background: var(--bg-card); color: var(--text); transition: all 0.15s; white-space: nowrap; max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
.btn-sm:hover { border-color: var(--primary); color: var(--primary); }
.btn-sm.verify:hover { background: #d1fae5; border-color: #6ee7b7; color: #065f46; }
.btn-sm.delete:hover { background: #fee2e2; border-color: #fca5a5; color: #b91c1c; }

.profile-form { display: flex; flex-direction: column; gap: 1rem; max-width: 400px; }
.form-group { display: flex; flex-direction: column; gap: 0.35rem; }
.form-group label { font-size: 0.82rem; color: var(--text-muted); font-weight: 500; }
.form-group input { padding: 0.5rem 0.7rem; border: 1px solid var(--border); border-radius: 8px; font-size: 0.95rem; background: var(--bg-card); color: var(--text); outline: none; transition: border-color 0.2s; }
.form-group input:focus { border-color: var(--primary); }

.msg { padding: 0.5rem 0.75rem; border-radius: 6px; font-size: 0.88rem; margin: 0; }
.msg.success { background: #d1fae5; color: #065f46; }
.msg.error { background: #fee2e2; color: #b91c1c; }

.btn-primary { padding: 0.6rem 1.5rem; background: var(--primary); color: #fff; border: none; border-radius: 8px; font-size: 0.95rem; font-weight: 600; cursor: pointer; align-self: flex-start; transition: background 0.2s; }
.btn-primary:hover:not(:disabled) { background: var(--primary-dark); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

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

  .tabs {
    flex-direction: row;
    overflow-x: auto;
    white-space: nowrap;
  }

  .tab {
    flex: 0 0 auto;
    padding: 0.5rem 0.7rem;
    font-size: 0.8rem;
  }

  .data-table th,
  .data-table td {
    padding: 0.45rem;
    font-size: 0.78rem;
  }

  .users-table {
    min-width: 720px;
  }

  .actions-grid {
    grid-template-columns: 1fr;
  }

  .email-cell {
    white-space: normal;
    word-break: break-word;
  }
}
</style>


