import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('../pages/HomePage.vue'),
    },
    {
      path: '/auth/login',
      component: () => import('../pages/LoginPage.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/auth/register',
      component: () => import('../pages/RegisterPage.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/opportunity/:id',
      component: () => import('../pages/OpportunityPage.vue'),
    },
    {
      path: '/dashboard',
      redirect: () => {
        const auth = useAuthStore()
        if (auth.role === 'employer') return '/dashboard/employer'
        if (auth.role === 'curator') return '/dashboard/curator'
        return '/dashboard/seeker'
      },
    },
    {
      path: '/dashboard/seeker',
      component: () => import('../pages/dashboard/SeekerDashboard.vue'),
      meta: { requiresAuth: true, roles: ['seeker'] },
    },
    {
      path: '/dashboard/employer',
      component: () => import('../pages/dashboard/EmployerDashboard.vue'),
      meta: { requiresAuth: true, roles: ['employer'] },
    },
    {
      path: '/dashboard/curator',
      component: () => import('../pages/dashboard/CuratorDashboard.vue'),
      meta: { requiresAuth: true, roles: ['curator'] },
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (auth.token && !auth.user) {
    await auth.fetchUser()
  }

  if (to.meta.requiresAuth && !auth.isAuth) {
    return '/auth/login'
  }

  if (to.meta.guestOnly && auth.isAuth) {
    return '/dashboard'
  }

  if (to.meta.roles && auth.user && !(to.meta.roles as string[]).includes(auth.role!)) {
    return '/dashboard'
  }
})

export default router
