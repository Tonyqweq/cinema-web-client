<template>
  <div class="movie-detail-page">
    <!-- 导航栏 -->
    <nav class="navbar">
      <div class="nav-content">
        <div class="logo">
          <h1>🎬 影院之家</h1>
        </div>
        <div class="nav-links">
          <router-link to="/" class="nav-link">首页</router-link>
          <router-link to="/movies" class="nav-link">电影库</router-link>
          <router-link to="/ticket-records" class="nav-link">购票记录</router-link>
          <router-link v-if="!isUserRole" to="/admin" class="nav-link">管理后台</router-link>
        </div>
        <div class="user-actions">
          <el-button type="primary" @click="goToProfile">个人中心</el-button>
        </div>
      </div>
    </nav>

    <!-- 电影详情区域 -->
    <section class="movie-detail-section" v-if="movie">
      <div class="detail-container">
        <!-- 左侧海报 -->
        <div class="movie-poster-section">
          <div class="poster-wrapper">
            <img v-if="movie.posterUrl" :src="proxyImageUrl(movie.posterUrl)" :alt="movie.title" @error="handleImageError" class="poster-image">
            <div v-else class="poster-placeholder">{{ movie.title.charAt(0) }}</div>
          </div>
        </div>

        <!-- 右侧信息 -->
        <div class="movie-info-section">
          <div class="info-header">
            <h1 class="movie-title">{{ movie.title }}</h1>
            <div class="movie-rating" v-if="movie.rating">
              <span class="rating-star">⭐</span>
              <span class="rating-value">{{ movie.rating }}</span>
            </div>
          </div>

          <div class="info-tags">
            <el-tag v-if="movie.genre" type="info" effect="plain">{{ movie.genre }}</el-tag>
            <el-tag v-if="movie.country" type="info" effect="plain">{{ movie.country }}</el-tag>
            <el-tag v-if="movie.language" type="info" effect="plain">{{ movie.language }}</el-tag>
            <el-tag v-if="movie.durationMin" type="info" effect="plain">{{ movie.durationMin }}分钟</el-tag>
          </div>

          <div class="info-description" v-if="movie.description">
            <h3>剧情简介</h3>
            <p>{{ movie.description }}</p>
          </div>

          <div class="info-meta">
            <div class="meta-item" v-if="movie.releaseDate">
              <span class="meta-label">上映日期</span>
              <span class="meta-value">{{ formatDate(movie.releaseDate) }}</span>
            </div>
            <div class="meta-item" v-if="movie.director">
              <span class="meta-label">导演</span>
              <span class="meta-value">{{ movie.director }}</span>
            </div>
            <div class="meta-item" v-if="movie.actor">
              <span class="meta-label">主演</span>
              <span class="meta-value">{{ movie.actor }}</span>
            </div>
          </div>

          <div class="info-actions">
            <el-button type="primary" size="large" class="book-btn" @click="goToTicketBooking">
              <el-icon><Tickets /></el-icon>
              立即购票
            </el-button>
          </div>
        </div>
      </div>
    </section>

    <!-- 加载状态 -->
    <section class="loading-section" v-if="loading">
      <el-icon class="loading-icon"><Loading /></el-icon>
      <p>加载中...</p>
    </section>

    <!-- 电影不存在 -->
    <section class="not-found-section" v-if="!loading && !movie">
      <div class="not-found-content">
        <h2>电影不存在</h2>
        <p>抱歉，找不到该电影的信息</p>
        <el-button type="primary" @click="goBack">返回电影库</el-button>
      </div>
    </section>

    <!-- 页脚 -->
    <footer class="footer">
      <div class="footer-content">
        <p>© 2024 影院之家 - 您的专属影院体验</p>
        <p>技术支持：Spring Boot + Vue 3 + Element Plus</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Tickets, Loading } from '@element-plus/icons-vue'
import request from '../utils/request'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const movie = ref<any>(null)

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

function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('admin_login_username')
  localStorage.removeItem('admin_roles')
  localStorage.removeItem('admin_permissions')
  ElMessage.success('退出登录成功')
  router.push('/admin/login')
}

function proxyImageUrl(url: string) {
  if (!url) return ''
  return `/api/movies/proxy-image?url=${encodeURIComponent(url)}`
}

function handleImageError(e: Event) {
  const target = e.target as HTMLImageElement
  console.error('图片加载失败:', target.src)
  target.src = 'https://via.placeholder.com/400x600?text=电影海报'
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

async function loadMovieDetail() {
  const movieId = route.params.id
  if (!movieId) {
    ElMessage.error('电影ID不存在')
    router.push('/movies')
    return
  }

  loading.value = true
  try {
    const res = await request.get(`/movies/${movieId}`)
    if (res.data?.code === 200 && res.data?.data) {
      movie.value = res.data.data
    } else {
      movie.value = null
    }
  } catch (e: any) {
    console.error('加载电影详情失败:', e)
    ElMessage.error('加载电影详情失败')
    movie.value = null
  } finally {
    loading.value = false
  }
}

function goToTicketBooking() {
  router.push(`/movies/${movie.value.id}/book`)
}

function goBack() {
  router.push('/movies')
}

function goToProfile() {
  router.push('/profile')
}

onMounted(() => {
  loadMovieDetail()
})
</script>

<style scoped>
.movie-detail-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.navbar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.nav-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo h1 {
  margin: 0;
  font-size: 1.8rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-links {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.nav-link {
  text-decoration: none;
  color: #333;
  font-weight: 500;
  transition: all 0.3s ease;
  position: relative;
}

.nav-link:hover,
.nav-link.active {
  color: #667eea;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
}

.nav-link:hover::after,
.nav-link.active::after {
  width: 100%;
}

.movie-detail-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 2rem;
}

.detail-container {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 4rem;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 30px;
  padding: 3rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.poster-wrapper {
  width: 100%;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
}

.poster-image {
  width: 100%;
  height: auto;
  display: block;
}

.poster-placeholder {
  width: 100%;
  aspect-ratio: 2/3;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 6rem;
  color: white;
  font-weight: bold;
}

.movie-info-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.movie-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #333;
  margin: 0;
  line-height: 1.2;
}

.movie-rating {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #f39c12, #e74c3c);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  flex-shrink: 0;
}

.rating-star {
  font-size: 1.2rem;
}

.rating-value {
  color: white;
  font-weight: 700;
  font-size: 1.1rem;
}

.info-tags {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.info-tags :deep(.el-tag) {
  border-radius: 15px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  border: none;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  color: #667eea;
}

.info-description h3 {
  font-size: 1.2rem;
  color: #333;
  margin: 0 0 0.75rem 0;
}

.info-description p {
  font-size: 1rem;
  color: #666;
  line-height: 1.8;
  margin: 0;
}

.info-meta {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05));
  border-radius: 15px;
}

.meta-item {
  display: flex;
  gap: 1rem;
}

.meta-label {
  color: #999;
  font-size: 0.95rem;
  min-width: 70px;
}

.meta-value {
  color: #333;
  font-size: 0.95rem;
}

.info-actions {
  margin-top: auto;
  padding-top: 1rem;
}

.book-btn {
  padding: 1rem 3rem;
  font-size: 1.1rem;
  border-radius: 50px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.book-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
}

.loading-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  color: white;
  gap: 1rem;
}

.loading-icon {
  font-size: 3rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.not-found-section {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.not-found-content {
  text-align: center;
  background: rgba(255, 255, 255, 0.95);
  padding: 4rem;
  border-radius: 30px;
}

.not-found-content h2 {
  margin: 0 0 1rem 0;
  color: #333;
}

.not-found-content p {
  margin: 0 0 2rem 0;
  color: #666;
}

.footer {
  background: rgba(0, 0, 0, 0.3);
  color: white;
  text-align: center;
  padding: 2rem;
  margin-top: 2rem;
}

.footer-content p {
  margin: 0.5rem 0;
  opacity: 0.8;
}

@media (max-width: 768px) {
  .nav-links {
    display: none;
  }

  .detail-container {
    grid-template-columns: 1fr;
    gap: 2rem;
    padding: 2rem;
  }

  .poster-wrapper {
    max-width: 300px;
    margin: 0 auto;
  }

  .movie-title {
    font-size: 1.8rem;
  }

  .info-header {
    flex-direction: column;
  }
}
</style>
