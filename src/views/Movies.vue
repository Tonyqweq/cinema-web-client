<template>
  <div class="movies-page">
    <!-- 导航栏 -->
    <Navbar />


    <!-- 页面标题区域 -->
    <section class="page-header">
      <div class="header-content">
        <p class="page-subtitle">发现更多精彩电影</p>
      </div>
    </section>

    <!-- 搜索和筛选区域 -->
    <section class="filter-section">
      <div class="filter-content">
        <div class="filter-row">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索电影名称..."
            class="search-input"
            clearable
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
        <div class="filter-row">
          <el-select
            v-model="selectedLanguage"
            placeholder="语言"
            class="filter-select"
            clearable
            @change="handleSearch"
          >
            <el-option
              v-for="lang in languages"
              :key="lang"
              :label="lang"
              :value="lang"
            />
          </el-select>
          <el-select
            v-model="selectedCountry"
            placeholder="国家/地区"
            class="filter-select"
            clearable
            @change="handleSearch"
          >
            <el-option
              v-for="country in countries"
              :key="country"
              :label="country"
              :value="country"
            />
          </el-select>
        </div>
      </div>
    </section>

    <!-- 电影列表区域 -->
    <section class="movies-section">
      <div class="movies-container">
        <div v-loading="loading" class="movies-grid">
          <div
            v-for="movie in movies"
            :key="movie.id"
            class="movie-card-item"
            @click="goToMovieDetail(movie.id)"
          >
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
              <p class="movie-genre" v-if="movie.genre">{{ movie.genre }}</p>
            </div>
          </div>
        </div>

        <div v-if="!loading && movies.length === 0" class="empty-state">
          <p>暂无电影数据</p>
        </div>

        <!-- 分页组件 -->
        <div class="pagination-wrapper" v-if="total > 0">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[12, 24, 36, 48]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </section>

    <!-- 页脚 -->
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Star } from '@element-plus/icons-vue'
import request from '../utils/request'
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'

const router = useRouter()
const loading = ref(false)
const movies = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(12)
const total = ref(0)
const searchKeyword = ref('')
const selectedLanguage = ref('')
const selectedCountry = ref('')

const languages = ['英语', '汉语普通话', '粤语', '日语', '韩语', '法语', '西班牙语', '德语', '俄语', '其他']
const countries = ['美国', '中国大陆', '中国香港', '中国台湾', '日本', '韩国', '英国', '法国', '德国', '印度', '其他']

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
    const res = await request.get('/movies', {
      params: {
        page: currentPage.value,
        pageSize: pageSize.value,
        keyword: searchKeyword.value,
        language: selectedLanguage.value || undefined,
        country: selectedCountry.value || undefined
      }
    })
    if (res.data?.code === 200 && res.data?.data) {
      movies.value = res.data.data.records || []
      total.value = res.data.data.total || 0
    }
  } catch (e: any) {
    console.error('加载电影列表失败:', e)
    ElMessage.error('加载电影列表失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  currentPage.value = 1
  loadMovies()
}

function handleSizeChange(val: number) {
  pageSize.value = val
  currentPage.value = 1
  loadMovies()
}

function handlePageChange(val: number) {
  currentPage.value = val
  loadMovies()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function goToTicketBooking(movieId?: number) {
  if (movieId) {
    router.push(`/admin/ticket-booking?movieId=${movieId}`)
  } else {
    router.push('/admin/ticket-booking')
  }
}

function goToMovieDetail(movieId: number) {
  router.push(`/movies/${movieId}`)
}

function goToProfile() {
  router.push('/profile')
}

onMounted(() => {
  loadMovies()
})
</script>

<style scoped>
.movies-page {
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

.page-header {
  max-width: 1400px;
  margin: 0 auto;
  padding: 4rem 2rem 2rem;
  text-align: center;
  color: white;
}

.header-content {
  animation: fadeInUp 0.8s ease;
}

.page-title {
  font-size: 3rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
}

.page-subtitle {
  font-size: 1.2rem;
  margin: 0;
  opacity: 0.9;
}

.filter-section {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem 2rem;
}

.filter-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.filter-row {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.search-input {
  width: 320px;
}

.search-input :deep(.el-input__wrapper),
.filter-select :deep(.el-input__wrapper) {
  border-radius: 20px;
  padding: 8px 15px;
  height: 40px;
}

.filter-select {
  width: 180px;
}

.movies-section {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem 4rem;
}

.movies-container {
  background: white;
  border-radius: 30px;
  padding: 2rem;
  min-height: 600px;
}

.movies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
}

.movie-card-item {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
}

.movie-card-item:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
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
  transform: scale(1.1);
}

.poster-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4rem;
  color: white;
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
  color: #f39c12;
  font-weight: 600;
}

.movie-genre {
  margin: 0.5rem 0 0;
  font-size: 0.85rem;
  color: #888;
}

.empty-state {
  text-align: center;
  padding: 4rem;
  color: #999;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 2rem 0;
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

@media (max-width: 768px) {
  .page-title {
    font-size: 2rem;
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
