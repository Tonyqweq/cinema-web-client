import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import Movies from '@/views/Movies.vue'
import MovieDetail from '@/views/MovieDetail.vue'
import Profile from '@/views/Profile.vue'
import MovieTicketBooking from '@/views/MovieTicketBooking.vue'
import TicketRecords from '@/views/TicketRecords.vue'
import AdminLogin from '@/views/admin/AdminLogin.vue'
import AdminRegister from '@/views/admin/AdminRegister.vue'
import AdminLayout from '@/views/admin/AdminLayout.vue'
import AdminDashboard from '@/views/pages/AdminDashboard.vue'
import AdminSettingsBasic from '@/views/pages/AdminSettingsBasic.vue'
import MoviesList from '@/views/pages/MoviesList.vue'
import CinemasList from '@/views/pages/CinemasList.vue'
import HallsList from '@/views/pages/HallsList.vue'
import UsersList from '@/views/pages/UsersList.vue'
import CinemaMoviesBind from '@/views/pages/CinemaMoviesBind.vue'
import ShowtimesList from '@/views/pages/ShowtimesList.vue'
import TicketBooking from '@/views/pages/TicketBooking.vue'
import OrdersList from '@/views/pages/OrdersList.vue'
import MyOrders from '@/views/pages/MyOrders.vue'
import Pay from '@/views/pages/Pay.vue'
import request from '@/utils/request'
import { persistSessionPayload, canAccessAny } from '@/utils/auth'
import {
  CINEMA_PAGE_ROLES,
  MOVIE_PAGE_ROLES,
  ORDER_PAGE_ROLES,
  USER_PAGE_ROLES,
  SETTINGS_PAGE_ROLES
} from '@/constants/adminAccess'
import { ElMessage } from 'element-plus'

const routes = [
  { path: '/', component: Home },
  { path: '/movies', component: Movies },
  { path: '/movies/:id', component: MovieDetail },
  { path: '/movies/:movieId/book', component: MovieTicketBooking },
  { path: '/profile', component: Profile },
  { path: '/ticket-records', component: TicketRecords },
  { path: '/admin/login', component: AdminLogin },
  { path: '/admin/register', component: AdminRegister },
  {
    path: '/admin',
    component: AdminLayout,
    children: [
      { path: '', redirect: '/admin/dashboard' },
      { path: 'dashboard', component: AdminDashboard },
      {
        path:'cinemas/list',
        component:CinemasList,
        meta: { roles: CINEMA_PAGE_ROLES }
      },
      {
        path:'halls/list',
        component:HallsList,
        meta: { roles: CINEMA_PAGE_ROLES }
      },
      {
        path: 'movies/list',
        component: MoviesList,
        meta: { roles: MOVIE_PAGE_ROLES }
      },
      {
        path: 'movies/schedule',
        component: ShowtimesList,
        meta: { roles: MOVIE_PAGE_ROLES }
      },
      {
        path: 'orders',
        component: OrdersList,
        meta: { roles: ORDER_PAGE_ROLES }
      },
      {
        path: 'users',
        component: UsersList,
        meta: { roles: USER_PAGE_ROLES }
      },
      {
        path: 'cinema-movies/bind',
        component: CinemaMoviesBind,
        meta: { roles: CINEMA_PAGE_ROLES }
      },
      {
        path: 'settings/basic',
        component: AdminSettingsBasic,
        meta: { roles: SETTINGS_PAGE_ROLES }
      },
      {
        path: 'settings/role',
        component: AdminDashboard,
        meta: { roles: SETTINGS_PAGE_ROLES }
      },
      {
        path: 'ticket-booking',
        component: TicketBooking,
        meta: { roles: [] } // 所有用户都可以访问购票功能
      },
      {
        path: 'my-orders',
        component: MyOrders,
        meta: { roles: [] } // 所有用户都可以访问我的订单
      },
      {
        path: 'pay/:id',
        component: Pay,
        meta: { roles: [] } // 所有用户都可以访问支付页面
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

let isCheckingSession = false
let lastCheckTime = 0
const CHECK_INTERVAL = 30 * 1000

function denyRole(next) {
  ElMessage.warning('当前账号无权访问该页面')
  next('/admin/dashboard')
}

router.beforeEach(async (to, from, next) => {
  const isAuthPage = to.path === '/admin/login' || to.path === '/admin/register'

  if (isAuthPage) {
    return next()
  }

  const token = localStorage.getItem('token')
  if (!token) {
    return next('/admin/login')
  }

  const needRoleCheck = to.meta.roles && to.meta.roles.length > 0

  const now = Date.now()
  if (now - lastCheckTime < CHECK_INTERVAL || isCheckingSession) {
    if (needRoleCheck && !canAccessAny(to.meta.roles)) {
      return denyRole(next)
    }
    return next()
  }

  isCheckingSession = true
  try {
    const res = await request.get('/sessions/current')
    if (res.data?.code === 200 && res.data?.data) {
      persistSessionPayload(res.data.data)
      lastCheckTime = Date.now()
    }
    if (needRoleCheck && !canAccessAny(to.meta.roles)) {
      return denyRole(next)
    }
    next()
  } catch (e) {
    localStorage.removeItem('token')
    localStorage.removeItem('admin_login_username')
    localStorage.removeItem('admin_roles')
    localStorage.removeItem('admin_permissions')
    next('/admin/login')
  } finally {
    isCheckingSession = false
  }
})

export default router
