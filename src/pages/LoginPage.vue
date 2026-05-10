<template>
  <div class="auth-page">
    <div class="auth-card">
      <h2 class="auth-title">Вход в аккаунт</h2>
      <p class="auth-sub">Нет аккаунта? <RouterLink to="/auth/register">Зарегистрироваться</RouterLink></p>

      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label>Email</label>
          <input v-model="email" type="email" required placeholder="you@example.com" />
        </div>
        <div class="form-group">
          <label>Пароль</label>
          <input v-model="password" type="password" required placeholder="••••••" />
        </div>

        <p v-if="error" class="form-error">{{ error }}</p>

        <button type="submit" class="btn-submit" :disabled="loading">
          {{ loading ? 'Входим...' : 'Войти' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '../api'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  loading.value = true
  error.value = ''
  try {
    const { access_token } = await login(email.value, password.value)
    auth.setToken(access_token)
    await auth.fetchUser()
    router.push('/dashboard')
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'response' in e) {
      const resp = (e as { response?: { data?: { detail?: string } } }).response
      error.value = resp?.data?.detail ?? 'Неверный email или пароль'
    } else {
      error.value = 'Ошибка подключения к серверу'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: calc(100vh - 60px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  padding: 2rem;
}
.auth-card {
  width: 100%;
  max-width: 420px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 2.5rem;
}
.auth-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
  color: var(--text);
}
.auth-sub {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin: 0 0 2rem;
}
.auth-sub a { color: var(--primary); text-decoration: none; }
.auth-form { display: flex; flex-direction: column; gap: 1.1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.35rem; }
.form-group label { font-size: 0.85rem; color: var(--text-muted); font-weight: 500; }
.form-group input,
.form-group select {
  padding: 0.55rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 0.95rem;
  background: var(--bg);
  color: var(--text);
  outline: none;
  transition: border-color 0.2s;
}
.form-group input:focus,
.form-group select:focus {
  border-color: var(--primary);
}
.form-error {
  color: #ef4444;
  font-size: 0.88rem;
  margin: 0;
  padding: 0.5rem 0.75rem;
  background: #fef2f2;
  border-radius: 6px;
}
.btn-submit {
  padding: 0.65rem;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-submit:hover:not(:disabled) { background: var(--primary-dark); }
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
