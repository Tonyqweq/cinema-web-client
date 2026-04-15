<template>
  <div class="movie-reviews-section">
    <div class="section-header">
      <h3 class="section-title">用户评论</h3>
      <div class="rating-summary" v-if="reviewStats">
        <span class="average-rating">{{ reviewStats.averageRating.toFixed(1) }}</span>
        <span class="rating-stars">⭐</span>
        <span class="review-count">{{ reviewStats.reviewCount }} 条评论</span>
      </div>
    </div>

    <div class="review-form-container" v-if="isLoggedIn">
      <div class="review-form">
        <h4>发表评论</h4>
        <div class="rating-input">
          <span>评分：</span>
          <el-rate
            v-model="userReview.rating"
            :max="5"
            show-score
            text-color="#ff9900"
            score-template="{value}"
          />
        </div>
        <el-input
          v-model="userReview.comment"
          type="textarea"
          :rows="4"
          placeholder="分享您的观影体验..."
          maxlength="500"
          show-word-limit
        />
        <div class="form-actions">
          <el-button type="primary" @click="submitReview" :loading="submitting">
            {{ userReview.id ? '更新评论' : '提交评论' }}
          </el-button>
          <el-button v-if="userReview.id" @click="deleteReview" :loading="deleting">
            删除评论
          </el-button>
        </div>
      </div>
    </div>

    <div class="reviews-list">
      <div v-loading="loading" class="reviews-container">
        <div v-if="reviews.length === 0 && !loading" class="empty-state">
          <p>暂无评论，快来发表第一条评论吧！</p>
        </div>
        <div v-for="review in reviews" :key="review.id" class="review-item">
          <div class="review-header">
            <div class="user-info">
              <div class="user-avatar">
                <img 
                  :src="getAvatarUrl(review.avatar)" 
                  :alt="review.username" 
                  class="avatar-image"
                >
              </div>
              <div class="user-details">
                <div class="username">{{ review.username || `用户${review.userId}` }}</div>
                <div class="review-date">{{ formatDate(review.createdAt) }}</div>
              </div>
            </div>
            <div class="review-rating">
              <span class="rating-value">{{ review.rating }}</span>
              <span class="rating-star">⭐</span>
            </div>
          </div>
          <div class="review-content">
            <p>{{ review.comment }}</p>
          </div>
        </div>
      </div>

      <div class="pagination-container" v-if="total > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[5, 10, 20]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const props = defineProps({
  movieId: {
    type: Number,
    required: true
  }
})

const loading = ref(false)
const submitting = ref(false)
const deleting = ref(false)
const reviews = ref([])
const reviewStats = ref(null)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const userReview = ref({
  rating: 5,
  comment: '',
  id: null
})

const isLoggedIn = computed(() => {
  return localStorage.getItem('token') !== null
})

async function loadReviews() {
  loading.value = true
  try {
    const res = await request.get(`/movie-reviews/movie/${props.movieId}`, {
      params: {
        page: currentPage.value,
        pageSize: pageSize.value
      }
    })
    if (res.data?.code === 200 && res.data?.data) {
      reviews.value = res.data.data.records || []
      total.value = res.data.data.total || 0
    }
  } catch (e) {
    console.error('加载评论失败:', e)
    ElMessage.error('加载评论失败')
  } finally {
    loading.value = false
  }
}

async function loadReviewStats() {
  try {
    const res = await request.get(`/movie-reviews/movie/${props.movieId}/stats`)
    if (res.data?.code === 200 && res.data?.data) {
      reviewStats.value = res.data.data
    }
  } catch (e) {
    console.error('加载评论统计失败:', e)
  }
}

async function loadUserReview() {
  if (!isLoggedIn.value) return
  
  try {
    const res = await request.get(`/movie-reviews/user/${props.movieId}`)
    if (res.data?.code === 200 && res.data?.data) {
      userReview.value = {
        rating: res.data.data.rating,
        comment: res.data.data.comment || '',
        id: res.data.data.id
      }
    } else {
      userReview.value = {
        rating: 5,
        comment: '',
        id: null
      }
    }
  } catch (e) {
    console.error('加载用户评论失败:', e)
  }
}

async function submitReview() {
  if (userReview.value.rating < 1 || userReview.value.rating > 5) {
    ElMessage.warning('评分必须在1-5之间')
    return
  }

  submitting.value = true
  try {
    const res = await request.post('/movie-reviews', {
      movieId: props.movieId,
      rating: userReview.value.rating,
      comment: userReview.value.comment
    })
    
    if (res.data?.code === 200) {
      ElMessage.success(userReview.value.id ? '评论更新成功' : '评论提交成功')
      await Promise.all([
        loadReviews(),
        loadReviewStats(),
        loadUserReview()
      ])
    } else {
      ElMessage.error(res.data?.message || '提交失败')
    }
  } catch (e) {
    console.error('提交评论失败:', e)
    ElMessage.error('提交评论失败')
  } finally {
    submitting.value = false
  }
}

async function deleteReview() {
  if (!userReview.value.id) return
  
  deleting.value = true
  try {
    const res = await request.delete(`/movie-reviews/${userReview.value.id}`)
    
    if (res.data?.code === 200) {
      ElMessage.success('评论删除成功')
      userReview.value = {
        rating: 5,
        comment: '',
        id: null
      }
      await Promise.all([
        loadReviews(),
        loadReviewStats()
      ])
    } else {
      ElMessage.error(res.data?.message || '删除失败')
    }
  } catch (e) {
    console.error('删除评论失败:', e)
    ElMessage.error('删除评论失败')
  } finally {
    deleting.value = false
  }
}

function handleSizeChange(newSize) {
  pageSize.value = newSize
  currentPage.value = 1
  loadReviews()
}

function handlePageChange(newPage) {
  currentPage.value = newPage
  loadReviews()
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

function getAvatarUrl(avatar) {
  if (avatar) {
    return avatar
  }
  return '/src/assets/images/7FBBAFD6E8204626A021A8C2132DDC3A.jpg'
}

onMounted(() => {
  loadReviews()
  loadReviewStats()
  loadUserReview()
})
</script>

<style scoped>
.movie-reviews-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 2rem;
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
  color: #333;
}

.rating-summary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.average-rating {
  font-size: 2.5rem;
  font-weight: 700;
  color: #FF9500;
}

.rating-stars {
  font-size: 1.5rem;
}

.review-count {
  color: #666;
  font-size: 0.95rem;
}

.review-form-container {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.review-form h4 {
  margin: 0 0 1.5rem 0;
  font-size: 1.2rem;
  color: #333;
}

.rating-input {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.rating-input span {
  font-weight: 500;
  color: #333;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.reviews-list {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.reviews-container {
  min-height: 200px;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #999;
}

.review-item {
  padding: 1.5rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.review-item:last-child {
  border-bottom: none;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  overflow: hidden;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

.review-date {
  font-size: 0.85rem;
  color: #999;
}

.review-rating {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: linear-gradient(135deg, #f39c12, #e74c3c);
  padding: 0.5rem 1rem;
  border-radius: 20px;
}

.rating-value {
  color: white;
  font-weight: 700;
  font-size: 1.1rem;
}

.rating-star {
  font-size: 1rem;
}

.review-content p {
  margin: 0;
  color: #666;
  line-height: 1.8;
  font-size: 1rem;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

@media (max-width: 768px) {
  .movie-reviews-section {
    padding: 2rem 1rem;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .review-form-container,
  .reviews-list {
    padding: 1.5rem;
  }

  .form-actions {
    flex-direction: column;
  }

  .review-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}
</style>