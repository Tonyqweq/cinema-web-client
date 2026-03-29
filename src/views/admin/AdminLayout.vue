<template>
  <el-container class="layout">
    <!-- 左侧多级菜单栏 -->
    <el-aside width="220px" class="aside">
      <div class="logo">影院管理系统</div>
      <el-menu
        class="menu"
        background-color="#001529"
        text-color="#ffffffd9"
        active-text-color="#409EFF"
        :default-active="activeMenu"
        router
      >
        <!-- 一级：仪表盘 -->
        <el-menu-item index="/admin/dashboard">
          <span>仪表盘</span>
        </el-menu-item>

        <!-- 一级：电影管理（多级） — 与后端 app.security.movie-api-roles 一致 -->
        <el-sub-menu v-if="showMovieMenu" index="movie">
          <template #title>
            <span>电影管理</span>
          </template>
          <el-menu-item index="/admin/movies/list">影片列表</el-menu-item>
          <el-menu-item index="/admin/movies/schedule">排片管理</el-menu-item>
        </el-sub-menu>

        <!-- 一级：订单 & 用户（多级） -->
        <el-sub-menu v-if="showOrderMenu || showUserMenu" index="order">
          <template #title>
            <span>订单与用户</span>
          </template>
          <el-menu-item v-if="showOrderMenu" index="/admin/orders">订单管理</el-menu-item>
          <el-menu-item v-if="showUserMenu" index="/admin/users">用户管理</el-menu-item>
        </el-sub-menu>

        <!-- 一级：系统设置（多级） -->
        <el-sub-menu v-if="showSettingsMenu" index="system">
          <template #title>
            <span>系统设置</span>
          </template>
          <el-menu-item index="/admin/settings/basic">基础设置</el-menu-item>
          <el-menu-item index="/admin/settings/role">角色权限</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>

    <!-- 右侧顶部 + 内容区域 -->
    <el-container>
      <el-header class="header">
        <div class="header-left">当前管理员：{{ username || '未登录' }}</div>
        <div class="header-right">
          <el-button type="primary" link @click="goHome">返回首页</el-button>
          <el-button type="danger" link @click="logout">退出登录</el-button>
        </div>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import { canAccessAny } from '@/utils/auth'
import {
  MOVIE_PAGE_ROLES,
  ORDER_PAGE_ROLES,
  USER_PAGE_ROLES,
  SETTINGS_PAGE_ROLES
} from '@/constants/adminAccess'

const route = useRoute()
const router = useRouter()

// 当前激活菜单
const activeMenu = computed(() => route.path)

// 依赖 route.path：路由切换后重新读取 localStorage 中的角色
const showMovieMenu = computed(() => {
  void route.path
  return canAccessAny(MOVIE_PAGE_ROLES)
})
const showOrderMenu = computed(() => {
  void route.path
  return canAccessAny(ORDER_PAGE_ROLES)
})
const showUserMenu = computed(() => {
  void route.path
  return canAccessAny(USER_PAGE_ROLES)
})
const showSettingsMenu = computed(() => {
  void route.path
  return canAccessAny(SETTINGS_PAGE_ROLES)
})

// 简单从 localStorage 取用户名（你登录时已经保存了 admin_login_username）
const username = localStorage.getItem('admin_login_username')

const loading = ref(false)

// 登出：调用后端接口（例如 POST /logout），然后清除本地信息并跳回登录页
async function logout() {
  loading.value = true
  try {
    await request.post('/sessions/logout')

    // 清除本地登录信息
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_login_username')
    localStorage.removeItem('admin_roles')
    localStorage.removeItem('admin_permissions')

    ElMessage.success('退出登录')
    router.push('/admin/login')
  } catch (e: unknown) {
    const err = e as any
    ElMessage.error(err?.response?.data?.msg || err?.message || '请求失败')
  } finally {
    loading.value = false
  }
}

function goHome() {
  router.push('/admin/dashboard')
}
</script>

<style scoped>
.layout {
  height: 100vh;
}

.aside {
  background-color: #001529;
  color: #fff;
  display: flex;
  flex-direction: column;
}

.logo {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.menu {
  flex: 1;
  border-right: none;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.main {
  padding: 16px;
  background-color: #f5f7fa;
}
</style>
