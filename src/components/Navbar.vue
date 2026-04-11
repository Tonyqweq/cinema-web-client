<template>
  <nav class="navbar">
    <div class="nav-content">
      <div class="logo">
        <h1>🎬 影院之家</h1>
      </div>
      <div class="nav-links">
        <router-link to="/" class="nav-link" :class="{ active: currentRoute === '/' }">首页</router-link>
        <router-link to="/movies" class="nav-link" :class="{ active: currentRoute === '/movies' }">电影库</router-link>
        <router-link to="/ticket-records" class="nav-link" :class="{ active: currentRoute === '/ticket-records' }">购票记录</router-link>
        <router-link v-if="!isUserRole" to="/admin" class="nav-link">管理后台</router-link>
      </div>
      <div class="user-actions">
        <el-button type="primary" @click="goToProfile">个人中心</el-button>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

// 路由
const router = useRouter()
const route = useRoute()

// 当前路由
const currentRoute = computed(() => route.path)

// 用户角色
const isUserRole = computed(() => {
  const roles = localStorage.getItem('admin_roles')
  if (!roles) return false
  try {
    const parsedRoles = JSON.parse(roles)
    return parsedRoles.includes('USER')
  } catch {
    return false
  }
})

// 跳转到个人中心
const goToProfile = () => {
  router.push('/profile')
}
</script>

<style scoped>
.navbar {
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.nav-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 80px;
}

.logo h1 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-links {
  display: flex;
  gap: 20px;
}

.nav-link {
  text-decoration: none;
  color: #333;
  font-size: 1rem;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 20px;
  transition: all 0.3s ease;
}

.nav-link:hover {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.nav-link.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.user-actions {
  display: flex;
  gap: 10px;
}

@media (max-width: 768px) {
  .nav-content {
    flex-direction: column;
    height: auto;
    padding: 15px 20px;
  }

  .nav-links {
    margin: 10px 0;
  }
}
</style>