<template>
  <div class="home-container">
    <!-- 导航栏 -->
    <Navbar />


    <!-- Hero 区域 -->
    <section class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">发现精彩电影</h1>
        <p class="hero-subtitle">最新上映 · 热门推荐 · 优惠活动</p>
        <div class="hero-buttons">
          <el-button type="primary" size="large" @click="goToTicketBooking">立即购票</el-button>
          <el-button size="large" @click="scrollToMovies">浏览电影</el-button>
        </div>
      </div>
      <div class="hero-image">
        <div class="floating-movie-cards">
          <div class="movie-card" style="transform: rotate(-5deg) translateY(-20px);">
            <div class="card-placeholder">🎥</div>
          </div>
          <div class="movie-card" style="transform: rotate(5deg) translateY(20px);">
            <div class="card-placeholder">🎬</div>
          </div>
        </div>
      </div>
    </section>

    <!-- 热门电影区域 -->
    <section class="movies-section" id="movies">
      <div class="section-header">
        <h3 class="section-title">🔥 热门电影</h3>
        <el-button type="text" @click="goToMovies">查看更多 →</el-button>
      </div>
      
      <div v-loading="loading" class="movies-grid">
        <div v-for="movie in movies" :key="movie.id" class="movie-card-item" @click="goToMovieDetail(movie.id)">
          <div class="movie-poster">
            <img v-if="movie.posterUrl" :src="proxyImageUrl(movie.posterUrl)" :alt="movie.title" @error="handleImageError">
            <div v-else class="poster-placeholder">{{ movie.title.charAt(0) }}</div>
            <div class="movie-overlay">
              <el-button type="primary" circle size="large">
                <el-icon><Tickets /></el-icon>
              </el-button>
            </div>
          </div>
          <div class="movie-info">
            <h4 class="movie-title">{{ movie.title }}</h4>
            <p class="movie-meta">{{ movie.country }} · {{ movie.durationMin }}分钟</p>
            <div class="movie-rating">
              <span class="rating">⭐ {{ movie.rating || '暂无评分' }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!loading && movies.length === 0" class="empty-state">
        <p>暂无电影数据</p>
      </div>
    </section>

    <!-- 特色功能区域 -->
    <section class="features-section">
      <div class="feature-item">
        <div class="feature-icon">🎟️</div>
        <h4>在线选座</h4>
        <p>实时查看座位状态，选择心仪座位</p>
      </div>
      <div class="feature-item">
        <div class="feature-icon">💳</div>
        <h4>便捷支付</h4>
        <p>多种支付方式，安全快捷</p>
      </div>
      <div class="feature-item">
        <div class="feature-icon">📱</div>
        <h4>移动优先</h4>
        <p>随时随地，轻松购票</p>
      </div>
    </section>

    <!-- 页脚 -->
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Tickets } from '@element-plus/icons-vue'
import request from '../utils/request'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'


const router = useRouter()
const loading = ref(false)
const movies = ref<any[]>([])

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
  target.src = 'https://via.placeholder.com/300x400?text=电影海报'
}

async function loadMovies() {
  loading.value = true
  try {
    const res = await request.get('/movies?page=1&pageSize=8')
    if (res.data?.code === 200 && res.data?.data?.records) {
      movies.value = res.data.data.records
    }
  } catch (e: any) {
    console.error('加载电影列表失败:', e)
    ElMessage.error('加载电影列表失败')
  } finally {
    loading.value = false
  }
}

function goToTicketBooking() {
  router.push('/admin/ticket-booking')
}

function goToMovies() {
  router.push('/movies')
}

function goToMovieDetail(movieId: number) {
  router.push(`/movies/${movieId}`)
}

function goToProfile() {
  router.push('/profile')
}

function scrollToMovies() {
  const element = document.getElementById('movies')
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}

onMounted(() => {
  loadMovies()
})
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background: #F2F2F7;
}

.navbar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.1);
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
  font-size: 1.5rem;
  font-weight: 600;
  color: #007AFF;
  letter-spacing: -0.5px;
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
  font-size: 0.95rem;
  transition: all 0.2s ease;
  position: relative;
}

.nav-link:hover,
.nav-link.active {
  color: #007AFF;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 0;
  height: 2px;
  background: #007AFF;
  transition: width 0.2s ease;
}

.nav-link:hover::after,
.nav-link.active::after {
  width: 100%;
}

.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 6rem 2rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
  color: white;
}

.hero-content {
  color: white;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  line-height: 1.2;
  color: white;
  animation: fadeInUp 0.8s ease;
}

.hero-subtitle {
  font-size: 1.5rem;
  margin-bottom: 2rem;
  color: rgba(255, 255, 255, 0.9);
  animation: fadeInUp 0.8s ease 0.2s both;
}

.hero-buttons {
  display: flex;
  gap: 1rem;
  animation: fadeInUp 0.8s ease 0.4s both;
}

.hero-buttons .el-button {
  padding: 1rem 2rem;
  font-size: 1.1rem;
  border-radius: 12px;
}

.hero-image {
  position: relative;
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.floating-movie-cards {
  position: relative;
  width: 100%;
  height: 100%;
}

.movie-card {
  position: absolute;
  width: 200px;
  height: 300px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: float 6s ease-in-out infinite;
}

.movie-card:nth-child(2) {
  animation-delay: -3s;
}

.card-placeholder {
  font-size: 4rem;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(5deg);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.movies-section {
  max-width: 1400px;
  margin: 0 auto;
  padding: 4rem 2rem;
  background: white;
  border-radius: 20px 20px 0 0;
  min-height: 600px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.section-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  color: #000;
}

.movies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
}

.movie-card-item {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;
}

.movie-card-item:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.movie-poster {
  position: relative;
  width: 100%;
  height: 375px;
  overflow: hidden;
}

.movie-poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.movie-card-item:hover .movie-poster img {
  transform: scale(1.05);
}

.poster-placeholder {
  width: 100%;
  height: 100%;
  background: #F2F2F7;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4rem;
  color: #007AFF;
  font-weight: bold;
}

.movie-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.movie-card-item:hover .movie-overlay {
  opacity: 1;
}

.movie-info {
  padding: 1.5rem;
}

.movie-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.movie-meta {
  margin: 0 0 0.5rem 0;
  color: #666;
  font-size: 0.9rem;
}

.movie-rating {
  margin: 0;
}

.rating {
  color: #FF9500;
  font-weight: 600;
}

.empty-state {
  text-align: center;
  padding: 4rem;
  color: #999;
}

.features-section {
  max-width: 1400px;
  margin: 0 auto;
  padding: 4rem 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.feature-item {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  color: #333;
  transition: all 0.3s ease;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.feature-item:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-item h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  color: #000;
}

.feature-item p {
  margin: 0;
  color: #666;
}

.footer {
  background: #F2F2F7;
  color: #333;
  text-align: center;
  padding: 2rem;
  margin-top: 2rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.footer-content p {
  margin: 0.5rem 0;
  color: #666;
}

@media (max-width: 768px) {
  .hero-section {
    grid-template-columns: 1fr;
    padding: 3rem 1rem;
  }

  .hero-title {
    font-size: 2.5rem;
  }

  .nav-links {
    display: none;
  }

  .movies-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }
}
</style>
