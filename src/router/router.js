import { createRouter, createWebHistory } from 'vue-router'
import MainPage from '../components/Home/MainPage.vue'
import MenuPage from '../components/Menu/MenuPage.vue'


const routes = [
    {path: '/', name: 'Main', component: MainPage},
    {path: '/menu', name: 'Menu', component: MenuPage}
    
]

const router = createRouter({
  history: createWebHistory('/SaborCaribe-o/'),
  routes
})

export default router