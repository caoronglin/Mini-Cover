import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/cover',
    name: 'Cover',
    component: () => import('@/components/CoverGenerator.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router