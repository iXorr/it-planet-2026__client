<template>
  <nav class="topbar">
    <div class="page-shell nav-inner">
      <RouterLink to="/" class="brand">
        <img src="/trampolin-logo.svg" alt="Логотип Трамплин" class="brand-logo" />
        <span class="brand-text">Трамплин</span>
      </RouterLink>

      <button class="menu-btn" @click="isOpen = !isOpen" aria-label="Открыть меню">
        <i class="pi" :class="isOpen ? 'pi-times' : 'pi-bars'"></i>
      </button>

      <div class="menu" :class="{ open: isOpen }">
        <RouterLink to="/" class="nav-link" @click="isOpen = false">Возможности</RouterLink>

        <template v-if="auth.isAuth">
          <RouterLink to="/dashboard" class="nav-link" @click="isOpen = false">Кабинет</RouterLink>
          <button class="action-btn outline" @click="handleLogout">Выйти</button>
        </template>
        <template v-else>
          <RouterLink to="/auth/login" class="action-btn outline" @click="isOpen = false">Войти</RouterLink>
          <RouterLink to="/auth/register" class="action-btn primary" @click="isOpen = false">Регистрация</RouterLink>
        </template>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()
const isOpen = ref(false)

function handleLogout() {
  auth.logout()
  isOpen.value = false
  router.push('/')
}
</script>

<style scoped>
.topbar {
  position: sticky;
  top: 0;
  z-index: 120;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(217, 228, 232, 0.9);
}

.nav-inner {
  min-height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.brand {
  color: var(--primary);
  font-weight: 700;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
}

.brand-logo {
  width: 28px;
  height: 28px;
  display: block;
}

.brand-text {
  font-family: 'Exo 2', 'Space Grotesk', 'Manrope', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 0.96rem;
  line-height: 1;
}

.menu {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.menu-btn {
  display: none;
  border: 1px solid var(--border);
  background: #fff;
  width: 40px;
  height: 40px;
  border-radius: 10px;
}

.nav-link {
  color: var(--text);
  border-radius: 999px;
  padding: 0.45rem 0.8rem;
  text-decoration: none;
}

.nav-link.router-link-active,
.nav-link:hover {
  color: var(--primary);
  background: rgba(15, 118, 110, 0.08);
}

.action-btn {
  border-radius: 999px;
  padding: 0.4rem 0.9rem;
  font-size: 0.9rem;
  text-decoration: none;
  border: 1px solid transparent;
}

.action-btn.primary {
  background: var(--primary);
  color: #fff;
}

.action-btn.outline {
  background: transparent;
  color: var(--primary);
  border-color: var(--primary);
}

@media (max-width: 991px) {
  .menu-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .menu {
    position: absolute;
    right: 0.5rem;
    top: 4.2rem;
    width: min(290px, calc(100vw - 1rem));
    display: none;
    flex-direction: column;
    align-items: stretch;
    padding: 0.75rem;
    border: 1px solid var(--border);
    border-radius: 14px;
    background: #fff;
    box-shadow: 0 12px 24px rgba(15, 23, 42, 0.1);
  }

  .menu.open {
    display: flex;
  }

  .action-btn,
  .nav-link {
    width: 100%;
    text-align: center;
  }
}
</style>
