<template>
  <div class="movie-detail-page">
    <Navbar />

    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">{{ movie?.title }}</h1>
        <p class="page-subtitle">发现精彩电影</p>
      </div>
    </div>

    <div class="content-wrapper">
      <div class="main-content">
        <section class="movie-detail-section" v-if="movie">
          <div class="detail-container">
            <div class="poster-section">
              <div class="poster-wrapper">
                <img v-if="movie.posterUrl" :src="proxyImageUrl(movie.posterUrl)" :alt="movie.title" @error="handleImageError" class="poster-image">
                <div v-else class="poster-placeholder">{{ movie.title.charAt(0) }}</div>
              </div>
              <div class="poster-actions">
                <MovieCollection :movie-id="movie.id" />
              </div>
            </div>

            <div class="movie-info-section">
              <div class="info-tags">
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

        <MovieReviews :movie-id="movieId" v-if="movie" />
      </div>
    </div>

    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Tickets, Loading } from '@element-plus/icons-vue'
import request from '../utils/request'
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
import MovieReviews from '@/components/MovieReviews.vue'
import MovieCollection from '@/components/MovieCollection.vue'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const movie = ref<any>(null)
const movieId = computed(() => parseInt(route.params.id as string))

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
  const id = movieId.value
  if (!id) {
    ElMessage.error('电影ID不存在')
    router.push('/movies')
    return
  }

  loading.value = true
  try {
    const res = await request.get(`/movies/${id}`)
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

onMounted(() => {
  loadMovieDetail()
})
</script>

<style scoped>
.movie-detail-page {
  min-height: 100vh;
  background: #F2F2F7;
}

.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 4rem 2rem;
  text-align: center;
  color: white;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  font-size: 3rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
}

.page-subtitle {
  font-size: 1.2rem;
  margin: 0;
  opacity: 0.9;
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 2rem;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.movie-detail-section {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.detail-container {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 2rem;
}

.poster-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.poster-wrapper {
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
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
  font-size: 4rem;
  color: white;
  font-weight: bold;
}

.poster-actions {
  display: flex;
  justify-content: center;
}

.movie-info-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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

@media (max-width: 768px) {
  .page-header {
    padding: 3rem 1rem;
  }

  .page-title {
    font-size: 2rem;
  }

  .page-subtitle {
    font-size: 1rem;
  }

  .content-wrapper {
    padding: 2rem 1rem;
  }

  .detail-container {
    grid-template-columns: 1fr;
  }

  .poster-wrapper {
    max-width: 300px;
    margin: 0 auto;
  }
}
</style>
