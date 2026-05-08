import { createRouter, createWebHistory } from 'vue-router'
import MainPage from '../components/Home/MainPage.vue'
import MenuPage from '../components/Menu/MenuPage.vue'
import AcercaDePage from '../components/AcercaDe/AcercaDePage.vue'


const routes = [
    {path: '/', name: 'Main', component: MainPage},
    {path: '/menu', name: 'Menu', component: MenuPage},
    {path: '/acerca', name: 'AcercaDe', component: AcercaDePage}

    
]

const router = createRouter({
  history: createWebHistory('/SaborCaribe-o/'),
  routes
})

export default router