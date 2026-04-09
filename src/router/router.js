import { createRouter, createWebHistory } from 'vue-router'
import MainPage from '../components/Home/MainPage.vue'

const routes = [
    {path: '/', name: 'Main', component: MainPage}
]

const router = createRouter({
  history: createWebHistory('/SaborCaribe-o/'),
  routes
})

export default router