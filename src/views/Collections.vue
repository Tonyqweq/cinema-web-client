<template>
  <div class="collections-page">
    <Navbar />

    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">我的收藏</h1>
        <p class="page-subtitle">收藏您喜爱的电影</p>
      </div>
    </div>

    <div class="collections-content">
      <div v-loading="loading" class="movies-grid">
        <div v-for="item in collections" :key="item.id" class="movie-card" @click="goToMovieDetail(item.movie_id)">
          <div class="movie-poster">
            <img v-if="item.movie?.posterUrl" :src="proxyImageUrl(item.movie?.posterUrl)" :alt="item.movie?.title" @error="handleImageError">
            <div v-else class="poster-placeholder">{{ item.movie?.title?.charAt(0) || '?' }}</div>
            <div class="movie-overlay">
              <el-button type="primary" circle size="large" @click.stop="removeCollection(item.movie_id)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
          <div class="movie-info">
            <h4 class="movie-title">{{ item.movie?.title }}</h4>
            <p class="movie-meta">{{ item.movie?.country }} · {{ item.movie?.durationMin }}分钟</p>
            <div class="collection-date">
              <span>收藏于 {{ formatDate(item.createdAt) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!loading && collections.length === 0" class="empty-state">
        <div class="empty-icon">📚</div>
        <h3>暂无收藏</h3>
        <p>去电影库发现更多精彩电影吧！</p>
        <el-button type="primary" @click="goToMovies">浏览电影</el-button>
      </div>

      <div class="pagination-container" v-if="total > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[6, 12, 24]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <Footer />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import request from '@/utils/request'
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'

const router = useRouter()
const loading = ref(false)
const collections = ref([])
const currentPage = ref(1)
const pageSize = ref(12)
const total = ref(0)

async function loadCollections() {
  loading.value = true
  try {
    const res = await request.get('/user-collections', {
      params: {
        page: currentPage.value,
        pageSize: pageSize.value
      }
    })
    
    if (res.data?.code === 200 && res.data?.data?.records) {
      const collectionRecords = res.data.data.records
      
      const movieIds = collectionRecords.map(item => item.movie_id)
      if (movieIds.length > 0) {
        const moviesRes = await request.get('/movies/batch', {
          params: {
            ids: movieIds.join(',')
          }
        })
        
        if (moviesRes.data?.code === 200 && moviesRes.data?.data) {
          const moviesMap = {}
          moviesRes.data.data.forEach(movie => {
            moviesMap[movie.id] = movie
          })
          
          collections.value = collectionRecords.map(item => ({
            ...item,
            movie: moviesMap[item.movie_id]
          }))
        }
      }
      
      total.value = res.data.data.total || 0
    }
  } catch (e) {
    console.error('加载收藏列表失败:', e)
    ElMessage.error('加载收藏列表失败')
  } finally {
    loading.value = false
  }
}

async function removeCollection(movieId) {
  try {
    await ElMessageBox.confirm('确定要取消收藏这部电影吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const res = await request.delete(`/user-collections/${movieId}`)
    if (res.data?.code === 200) {
      ElMessage.success('取消收藏成功')
      await loadCollections()
    } else {
      ElMessage.error(res.data?.message || '取消收藏失败')
    }
  } catch (e) {
    if (e !== 'cancel') {
      console.error('取消收藏失败:', e)
      ElMessage.error('取消收藏失败')
    }
  }
}

function handleSizeChange(newSize) {
  pageSize.value = newSize
  currentPage.value = 1
  loadCollections()
}

function handlePageChange(newPage) {
  currentPage.value = newPage
  loadCollections()
}

function goToMovieDetail(movieId) {
  router.push(`/movies/${movieId}`)
}

function goToMovies() {
  router.push('/movies')
}

function proxyImageUrl(url) {
  if (!url) return ''
  return `/api/movies/proxy-image?url=${encodeURIComponent(url)}`
}

function handleImageError(e) {
  const target = e.target
  console.error('图片加载失败:', target.src)
  target.src = 'https://via.placeholder.com/300x400?text=电影海报'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

onMounted(() => {
  loadCollections()
})
</script>

<style scoped>
.collections-page {
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

.collections-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 2rem;
}

.movies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
  min-height: 400px;
}

.movie-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;
}

.movie-card:hover {
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

.movie-card:hover .movie-poster img {
  transform: scale(1.05);
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

.movie-card:hover .movie-overlay {
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

.collection-date {
  font-size: 0.85rem;
  color: #999;
}

.empty-state {
  text-align: center;
  padding: 6rem 2rem;
}

.empty-icon {
  font-size: 6rem;
  margin-bottom: 2rem;
}

.empty-state h3 {
  font-size: 1.8rem;
  color: #333;
  margin: 0 0 1rem 0;
}

.empty-state p {
  color: #666;
  font-size: 1.1rem;
  margin: 0 0 2rem 0;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 3rem;
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

  .collections-content {
    padding: 2rem 1rem;
  }

  .movies-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }
}
</style>