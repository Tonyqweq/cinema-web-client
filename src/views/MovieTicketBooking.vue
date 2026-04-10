<template>
  <div class="movie-ticket-booking">
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

    <!-- 页面标题区域 -->
    <section class="page-header">
      <div class="header-content">
        <h2 class="page-title">电影购票</h2>
        <p class="page-subtitle" v-if="currentMovie">{{ currentMovie.title }} - 选择场次与座位</p>
      </div>
    </section>

    <!-- 购票流程区域 -->
    <section class="booking-section" v-if="currentMovie">
      <div class="booking-container">
        <!-- 电影信息卡片 -->
        <div class="movie-info-card">
          <div class="movie-poster">
            <img v-if="currentMovie.posterUrl" :src="proxyImageUrl(currentMovie.posterUrl)" :alt="currentMovie.title" @error="handleImageError">
            <div v-else class="poster-placeholder">{{ currentMovie.title.charAt(0) }}</div>
          </div>
          <div class="movie-details">
            <h3>{{ currentMovie.title }}</h3>
            <div class="movie-meta">
              <!-- <span>{{ currentMovie.genre }}</span> -->
              <span>{{ currentMovie.country }}</span>
              <span>{{ currentMovie.language }}</span>
              <span>{{ currentMovie.durationMin }}分钟</span>
            </div>
            <p class="movie-rating">⭐ {{ currentMovie.rating || '暂无评分' }}</p>
          </div>
        </div>

        <!-- 日期选择 -->
        <el-card v-if="selectedMovie" class="mb-4">
          <template #header>
            <div class="card-header">
              <span>选择日期</span>
            </div>
          </template>
          <el-form :inline="true" class="demo-form-inline">
            <el-form-item label="观看日期">
              <el-date-picker
                v-model="selectedDate"
                type="date"
                placeholder="选择观看日期"
                :disabled-date="disabledDate"
                @change="handleDateChange"
                style="width: 400px;"
              />
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 影院选择 -->
        <el-card v-if="selectedDate" class="mb-4">
          <template #header>
            <div class="card-header">
              <span>选择影院</span>
            </div>
          </template>
          <el-form :inline="true" class="demo-form-inline">
            <el-form-item label="影院">
              <el-select v-model="selectedCinema" placeholder="请选择影院" @change="handleCinemaChange" style="width: 400px;">
                <el-option
                  v-for="cinema in filteredCinemas"
                  :key="cinema.id"
                  :label="`${cinema.name} - ${cinema.address || ''}`"
                  :value="cinema.id"
                />
              </el-select>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 场次选择 -->
        <el-card v-if="selectedDate" class="mb-4">
          <template #header>
            <div class="card-header">
              <span>选择场次</span>
            </div>
          </template>
          <div v-if="filteredShowtimes.length > 0" class="showtimes-container">
            <div v-for="showtime in filteredShowtimes" :key="showtime.id" class="showtime-item">
              <div class="showtime-info">
                <div class="hall-name">{{ showtime.hallName || '未知影厅' }}</div>
                <div class="showtime-time">
                  {{ formatTime(showtime.startTime) }} - {{ formatTime(showtime.endTime) }}
                </div>
                <div class="showtime-price">¥{{ showtime.price }}</div>
              </div>
              <el-button type="primary" @click="selectShowtime(showtime)">选择</el-button>
            </div>
          </div>
          <div v-else class="no-data">
            暂无符合条件的排片信息
          </div>
        </el-card>

        <!-- 座位选择 -->
        <el-card v-if="selectedShowtime" class="mb-4">
          <template #header>
            <div class="card-header">
              <span>选择座位</span>
              <el-button type="info" size="small" @click="refreshSeats" :disabled="!selectedShowtime">
                刷新座位状态
              </el-button>
            </div>
          </template>
          
          <!-- 倒计时提示 -->
          <el-alert
            v-if="showCountdown"
            :title="`预定成功，${countdown}秒后跳转到支付页面`"
            type="success"
            :closable="false"
            show-icon
            style="margin-bottom: 20px;"
          />
          
          <div class="seat-container">
            <div class="screen">屏幕</div>
            <div class="seats-grid" :style="{ gridTemplateColumns: `repeat(${gridColumns}, 36px)` }">
              <el-tooltip
                v-for="seat in seats"
                :key="seat.id"
                :content="getSeatTooltip(seat)"
                placement="top"
                :disabled="seat.status !== 1"
              >
                <div
                  :class="[
                    'seat',
                    { 'seat-occupied': seat.status !== 1 },
                    { 'seat-selected': selectedSeats.includes(seat.id) }
                  ]"
                  @click="selectSeat(seat)"
                >
                  {{ seat.seatNumber || `${seat.seatRow || seat.rowNumber}${seat.seatCol || seat.columnNumber}` }}
                </div>
              </el-tooltip>
            </div>
          </div>
          <div class="selected-seats">
            <span>已选座位：</span>
            <span v-for="seatId in selectedSeats" :key="seatId" class="selected-seat-tag">
              {{ getSeatInfo(seatId) }}
            </span>
          </div>
        </el-card>

        <!-- 确认订单 -->
        <el-card v-if="selectedShowtime && selectedSeats.length > 0">
          <template #header>
            <div class="card-header">
              <span>确认订单</span>
            </div>
          </template>
          <div class="order-info">
            <div class="order-item">
              <span>电影：</span>
              <span>{{ currentMovie.title }}</span>
            </div>
            <div class="order-item">
              <span>影院：</span>
              <span>{{ getCinemaInfo(selectedCinema) }}</span>
            </div>
            <div class="order-item">
              <span>观看日期：</span>
              <span>{{ formatDate(selectedDate) }}</span>
            </div>
            <div class="order-item">
              <span>场次：</span>
              <span>{{ formatTime(selectedShowtime.startTime) }} - {{ formatTime(selectedShowtime.endTime) }}</span>
            </div>
            <div class="order-item">
              <span>影厅：</span>
              <span>{{ selectedShowtime.hallName || '未知影厅' }}</span>
            </div>
            <div class="order-item">
              <span>座位：</span>
              <span>{{ selectedSeats.map(id => getSeatInfo(id)).join(', ') }}</span>
            </div>
            <div class="order-item total">
              <span>总价：</span>
              <span class="total-price">¥{{ calculateTotalPrice() }}</span>
            </div>
          </div>
          <el-button type="primary" :loading="loading" @click="submitOrder">提交订单</el-button>
        </el-card>
      </div>
    </section>

    <!-- 加载状态 -->
    <section class="loading-section" v-if="loading">
      <el-icon class="loading-icon"><Loading /></el-icon>
      <p>加载中...</p>
    </section>

    <!-- 电影不存在 -->
    <section class="not-found-section" v-if="!loading && !currentMovie">
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

  <!-- 确认订单弹窗 -->
  <el-dialog
    v-model="showConfirmDialog"
    title="确认订单"
    width="500px"
    center
  >
    <div class="order-confirm">
      <div class="order-info-item">
        <span class="info-label">电影:</span>
        <span class="info-value">{{ currentMovie.title }}</span>
      </div>
      <div class="order-info-item">
        <span class="info-label">影院:</span>
        <span class="info-value">{{ selectedCinemaName }}</span>
      </div>
      <div class="order-info-item">
        <span class="info-label">观看日期:</span>
        <span class="info-value">{{ formatDate(selectedDate) }}</span>
      </div>
      <div class="order-info-item">
        <span class="info-label">场次:</span>
        <span class="info-value">{{ formatTime(selectedShowtime.startTime) }} - {{ formatTime(selectedShowtime.endTime) }}</span>
      </div>
      <div class="order-info-item">
        <span class="info-label">影厅:</span>
        <span class="info-value">{{ selectedShowtime.hallName }}</span>
      </div>
      <div class="order-info-item">
        <span class="info-label">座位:</span>
        <span class="info-value">{{ selectedSeats.map(id => {
          const seat = seats.value.find(s => s.id === id)
          return seat ? (seat.seatNumber || `${String.fromCharCode(65 + (seat.rowNumber - 1))}${seat.columnNumber}`) : id
        }).join(', ') }}</span>
      </div>
      <div class="order-info-item total-price">
        <span class="info-label">总价:</span>
        <span class="info-value price">{{ totalPrice }}元</span>
      </div>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="showConfirmDialog = false">取消</el-button>
        <el-button type="primary" @click="submitOrder" :loading="loading">提交订单</el-button>
      </span>
    </template>
  </el-dialog>

  <!-- 支付弹窗 -->
  <el-dialog
    v-model="showPayDialog"
    :title="paymentStatus === 'pending' ? '选择支付方式' : paymentStatus === 'processing' ? '支付处理中' : paymentStatus === 'success' ? '支付成功' : '支付失败'"
    width="450px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    custom-class="payment-dialog"
  >
    <!-- 待支付状态 -->
    <div v-if="paymentStatus === 'pending'" class="payment-content">
      <div class="payment-header">
        <div class="movie-info">
          <h3>{{ currentMovie.title }}</h3>
          <p>{{ selectedCinemaName }} · {{ formatDate(selectedDate) }} · {{ formatTime(selectedShowtime?.startTime) }}</p>
        </div>
        <div class="payment-amount">
          <span class="amount-label">支付金额</span>
          <span class="amount-value">¥{{ totalPrice }}</span>
        </div>
      </div>
      
      <div class="payment-methods">
        <h4 class="section-title">选择支付方式</h4>
        <el-radio-group v-model="paymentMethod" class="payment-radio-group">
          <el-radio label="wechat" class="payment-radio-item">
            <div class="payment-method-card">
              <span class="payment-icon">💳</span>
              <div class="payment-method-info">
                <span class="payment-method-name">微信支付</span>
                <span class="payment-method-desc">推荐使用微信支付</span>
              </div>
              <el-icon v-if="paymentMethod === 'wechat'" class="selected-icon"><Check /></el-icon>
            </div>
          </el-radio>
          <el-radio label="alipay" class="payment-radio-item">
            <div class="payment-method-card">
              <span class="payment-icon">💳</span>
              <div class="payment-method-info">
                <span class="payment-method-name">支付宝</span>
                <span class="payment-method-desc">安全便捷的支付方式</span>
              </div>
              <el-icon v-if="paymentMethod === 'alipay'" class="selected-icon"><Check /></el-icon>
            </div>
          </el-radio>
          <el-radio label="credit" class="payment-radio-item">
            <div class="payment-method-card">
              <span class="payment-icon">💳</span>
              <div class="payment-method-info">
                <span class="payment-method-name">银行卡</span>
                <span class="payment-method-desc">支持多种银行卡</span>
              </div>
              <el-icon v-if="paymentMethod === 'credit'" class="selected-icon"><Check /></el-icon>
            </div>
          </el-radio>
        </el-radio-group>
      </div>
      
      <div class="payment-countdown">
        <span>支付剩余时间：</span>
        <span class="countdown-value">{{ formatCountdown(paymentCountdown) }}</span>
      </div>
    </div>
    
    <!-- 支付处理中状态 -->
    <div v-else-if="paymentStatus === 'processing'" class="payment-processing">
      <div class="processing-icon">
        <el-icon class="loading-icon"><Loading /></el-icon>
      </div>
      <p>正在处理支付，请稍候...</p>
    </div>
    
    <!-- 支付成功状态 -->
    <div v-else-if="paymentStatus === 'success'" class="payment-success">
      <div class="success-icon">
        <el-icon class="check-icon"><Check /></el-icon>
      </div>
      <h3>支付成功！</h3>
      <p>您的订单已支付完成</p>
    </div>
    
    <!-- 支付失败状态 -->
    <div v-else-if="paymentStatus === 'failed'" class="payment-failed">
      <div class="failed-icon">
        <el-icon class="error-icon"><Close /></el-icon>
      </div>
      <h3>支付失败</h3>
      <p>请检查支付方式或重试</p>
    </div>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button v-if="paymentStatus === 'pending'" @click="showPayDialog = false; resetPaymentState()">取消</el-button>
        <el-button v-else-if="paymentStatus === 'success'" type="primary" @click="showPayDialog = false; resetPaymentState()">查看订单</el-button>
        <el-button v-else-if="paymentStatus === 'failed'" type="primary" @click="paymentStatus = 'pending'">重新支付</el-button>
        <el-button v-if="paymentStatus === 'pending'" type="primary" @click="handlePayment">确认支付</el-button>
      </span>
    </template>
  </el-dialog>

  <!-- 倒计时弹窗 -->
  <el-dialog
    v-model="showCountdown"
    title="支付成功"
    width="300px"
    center
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <div class="countdown-container">
      <div class="countdown-icon">
        <i class="el-icon-success" style="font-size: 48px; color: #67c23a;"></i>
      </div>
      <p class="countdown-text">支付成功，{{ countdown }}秒后跳转到订单页</p>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading, Search, Check, Close } from '@element-plus/icons-vue'
import request from '../utils/request'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const currentMovie = ref<any>(null)
const selectedMovie = ref('')
const selectedCinema = ref('')
const selectedDate = ref('')
const selectedShowtime = ref<any>(null)
const selectedSeats = ref<number[]>([])
const seats = ref<any[]>([])
const cinemas = ref<any[]>([])
const showtimes = ref<any[]>([])
const countdown = ref(3)
const showCountdown = ref(false)
// 确认订单弹窗
const showConfirmDialog = ref(false)
// 支付弹窗
const showPayDialog = ref(false)
// 支付方式
const paymentMethod = ref('wechat')
// 支付状态
const paymentStatus = ref<'pending' | 'processing' | 'success' | 'failed'>('pending')
// 支付倒计时
const paymentCountdown = ref(900)

// 计算座位网格的列数
const gridColumns = computed(() => {
  if (seats.value.length === 0) return 10
  // 找到最大的列数
  let maxColumn = 0
  seats.value.forEach(seat => {
    if (seat.columnNumber > maxColumn) {
      maxColumn = seat.columnNumber
    }
  })
  return maxColumn
})

// 过滤后的影院列表
const filteredCinemas = computed(() => {
  if (!selectedMovie.value || !selectedDate.value) return cinemas.value
  
  const selectedDateObj = new Date(selectedDate.value)
  // 设置选择的日期的开始时间为00:00:00
  const startOfDay = new Date(selectedDateObj)
  startOfDay.setHours(0, 0, 0, 0)
  
  // 设置选择的日期的结束时间为23:59:59
  const endOfDay = new Date(selectedDateObj)
  endOfDay.setHours(23, 59, 59, 999)
  
  // 筛选有对应场次的影院
  const cinemaIds = new Set()
  showtimes.value.forEach(showtime => {
    const startTime = new Date(showtime.startTime)
    if (showtime.movieId === selectedMovie.value && 
        showtime.status === 1 && 
        startTime >= startOfDay && 
        startTime <= endOfDay) {
      cinemaIds.add(showtime.cinemaId)
    }
  })
  return cinemas.value.filter(cinema => cinemaIds.has(cinema.id))
})

// 过滤后的场次列表
const filteredShowtimes = computed(() => {
  if (!selectedDate.value || !selectedCinema.value) return []
  
  const selectedDateObj = new Date(selectedDate.value)
  
  // 设置选择的日期的开始时间为00:00:00
  const startOfDay = new Date(selectedDateObj)
  startOfDay.setHours(0, 0, 0, 0)
  
  // 设置选择的日期的结束时间为23:59:59
  const endOfDay = new Date(selectedDateObj)
  endOfDay.setHours(23, 59, 59, 999)
  
  return showtimes.value.filter(showtime => {
    const startTime = new Date(showtime.startTime)
    
    // 过滤条件：
    // 1. 状态为1（正常）
    // 2. 开始时间在选择的日期范围内
    // 3. 电影ID和影院ID匹配
    return showtime.status === 1 && 
           showtime.movieId === selectedMovie.value && 
           showtime.cinemaId === selectedCinema.value && 
           startTime >= startOfDay && 
           startTime <= endOfDay
  })
})

// 计算总价（用于弹窗）
const totalPrice = computed(() => {
  if (!selectedShowtime.value) return 0
  return selectedShowtime.value.price * selectedSeats.value.length
})

// 选中的影院名称（用于弹窗）
const selectedCinemaName = computed(() => {
  const cinema = cinemas.value.find(c => c.id === selectedCinema.value)
  return cinema ? cinema.name : ''
})

// 禁用日期：只允许选择今天及之后的日期
const disabledDate = (time: Date) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return time.getTime() < today.getTime()
}

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

function goToProfile() {
  router.push('/profile')
}

function proxyImageUrl(url: string) {
  if (!url) return ''
  return `/api/movies/proxy-image?url=${encodeURIComponent(url)}`
}

function handleImageError(e: Event) {
  const target = e.target as HTMLImageElement
  console.error('图片加载失败:', target.src)
  target.src = 'https://via.placeholder.com/200x300?text=电影海报'
}

// 加载电影详情
async function loadMovieDetail() {
  const movieId = route.params.movieId
  if (!movieId) {
    ElMessage.error('电影ID不存在')
    router.push('/movies')
    return
  }

  loading.value = true
  try {
    const res = await request.get(`/movies/${movieId}`)
    if (res.data?.code === 200 && res.data?.data) {
      currentMovie.value = res.data.data
      selectedMovie.value = currentMovie.value.id
      // 加载影院列表和场次信息
      await Promise.all([
        loadCinemas(),
        loadAllShowtimes(currentMovie.value.id)
      ])
    }
  } catch (e: any) {
    console.error('加载电影详情失败:', e)
    ElMessage.error('加载电影详情失败')
  } finally {
    loading.value = false
  }
}

// 加载影院列表
const loadCinemas = async () => {
  try {
    const response = await request.get('/cinemas?page=1&pageSize=100')
    if (response.data.code === 200) {
      cinemas.value = response.data.data.records
    }
  } catch (error) {
    console.error('加载影院列表失败:', error)
    ElMessage.error('加载影院列表失败')
  }
}

// 加载所有场次信息（用于筛选影院）
const loadAllShowtimes = async (movieId: any) => {
  try {
    const response = await request.get('/showtimes', {
      params: {
        movieId: movieId,
        page: 1,
        pageSize: 1000
      }
    })
    if (response.data.code === 200) {
      showtimes.value = response.data.data.records.map((showtime: any) => ({
        ...showtime,
        hallName: showtime.hall?.name || showtime.hallName || '未知影厅'
      }))
    }
  } catch (error) {
    console.error('加载场次信息失败:', error)
    ElMessage.error('加载场次信息失败')
  }
}

// 处理影院选择
const handleCinemaChange = async () => {
  selectedShowtime.value = null
  selectedSeats.value = []
  // 场次信息已在选择电影时加载
}

// 处理日期选择
const handleDateChange = async () => {
  selectedCinema.value = ''
  selectedShowtime.value = null
  selectedSeats.value = []
  // 场次信息已在选择电影时加载，过滤逻辑在 filteredShowtimes 计算属性中实现
}

// 前往支付
function goToPay() {
  if (!selectedShowtime.value || selectedSeats.value.length === 0) {
    ElMessage.warning('请选择场次和座位')
    return
  }

  // 显示确认订单弹窗
  showConfirmDialog.value = true
}

// 格式化倒计时
function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

// 重置支付状态
function resetPaymentState() {
  paymentStatus.value = 'pending'
  paymentCountdown.value = 900
}

// 处理支付
function handlePayment() {
  // 设置支付状态为处理中
  paymentStatus.value = 'processing'
  
  // 模拟支付处理
  setTimeout(() => {
    // 模拟支付成功
    paymentStatus.value = 'success'
    
    // 显示倒计时
    showCountdown.value = true
    countdown.value = 3
    
    // 启动倒计时
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
        showCountdown.value = false
        // 跳转到订单列表页面
        router.push('/admin/orders')
      }
    }, 1000)
  }, 2000)
}

// 选择场次
const selectShowtime = async (showtime: any) => {
  selectedShowtime.value = showtime
  selectedSeats.value = []
  await loadSeats()
}

// 加载座位信息
const loadSeats = async () => {
  if (!selectedShowtime.value) return
  
  try {
    const response = await request.get('/seats/showtime', {
      params: {
        showtimeId: selectedShowtime.value.id
      }
    })
    if (response.data.code === 200) {
      seats.value = response.data.data
    }
  } catch (error) {
    console.error('加载座位信息失败:', error)
    ElMessage.error('加载座位信息失败')
  }
}

// 选择座位
const selectSeat = (seat: any) => {
  if (seat.status !== 1) {
    ElMessage.warning('该座位已被占用')
    return
  }
  
  const index = selectedSeats.value.indexOf(seat.id)
  if (index > -1) {
    selectedSeats.value.splice(index, 1)
  } else {
    selectedSeats.value.push(seat.id)
  }
}

// 刷新座位状态
const refreshSeats = async () => {
  if (!selectedShowtime.value) return
  
  // 清空已选择的座位，因为座位状态可能已经变化
  selectedSeats.value = []
  // 重新加载座位信息
  await loadSeats()
  ElMessage.success('座位状态已刷新')
}

// 计算总价（座位价格优先，如果座位没有设置价格则使用场次统一价格）
const calculateTotalPrice = () => {
  if (!selectedShowtime.value || selectedSeats.value.length === 0) return 0
  
  let total = 0
  selectedSeats.value.forEach(seatId => {
    const seat = seats.value.find((s: any) => s.id === seatId)
    if (seat) {
      // 如果座位有独立价格，使用座位价格；否则使用场次统一价格
      total += seat.price ? Number(seat.price) : Number(selectedShowtime.value.price)
    }
  })
  return total
}

// 提交订单
const submitOrder = async () => {
  if (!selectedShowtime.value || selectedSeats.value.length === 0) {
    ElMessage.warning('请选择场次和座位')
    return
  }
  
  loading.value = true
  try {
    const orderData = {
      showtimeId: selectedShowtime.value.id,
      seats: selectedSeats.value,
      totalPrice: calculateTotalPrice()
    }
    
    console.log('提交订单数据:', orderData)
    
    const response = await request.post('/orders', orderData)
    
    console.log('订单提交响应:', response.data)
    
    if (response.data.code === 200) {
      // 关闭确认订单弹窗
      showConfirmDialog.value = false
      
      // 显示支付弹窗
      showPayDialog.value = true
    } else {
      ElMessage.error(response.data.message || response.data.msg || '订单提交失败')
    }
  } catch (error) {
    console.error('订单提交失败:', error)
    console.error('错误详情:', error.response?.data)
    ElMessage.error(error.response?.data?.message || error.response?.data?.msg || '订单提交失败')
  } finally {
    loading.value = false
  }
}

// 格式化时间
const formatTime = (time: any) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 格式化日期
const formatDate = (date: any) => {
  if (!date) return ''
  const dateObj = new Date(date)
  return dateObj.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 获取影院信息
const getCinemaInfo = (cinemaId: any) => {
  const cinema = cinemas.value.find((c: any) => c.id === cinemaId)
  return cinema ? cinema.name : ''
}

// 获取座位信息
const getSeatInfo = (seatId: any) => {
  const seat = seats.value.find((s: any) => s.id === seatId)
  if (!seat) return ''
  return seat.seatNumber || `${seat.seatRow || seat.rowNumber}${seat.seatCol || seat.columnNumber}`
}

// 获取座位Tooltip内容
const getSeatTooltip = (seat: any) => {
  const seatTypeText = seat.seatTypeText || getSeatTypeText(seat.seatType)
  const seatPrice = seat.price ? `¥${seat.price}` : `¥${selectedShowtime.value?.price || 0}`
  return `${seatTypeText} - ${seatPrice}`
}

// 获取座位类型文本
const getSeatTypeText = (seatType: any) => {
  switch (seatType) {
    case 1: return '普通座'
    case 2: return 'VIP座'
    case 3: return '情侣座'
    case 4: return '轮椅座'
    default: return '未知'
  }
}

function goBack() {
  router.push('/movies')
}

onMounted(() => {
  loadMovieDetail()
})
</script>

<style scoped>
.movie-ticket-booking {
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

.booking-section {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 2rem 4rem;
}

.booking-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.movie-info-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  display: flex;
  gap: 2rem;
  align-items: center;
}

.movie-poster {
  width: 150px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.movie-poster img {
  width: 100%;
  height: auto;
  display: block;
}

.poster-placeholder {
  width: 150px;
  height: 225px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  color: white;
  font-weight: bold;
}

.movie-details {
  flex: 1;
}

.movie-details h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 1rem 0;
}

.movie-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.movie-meta span {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  color: #667eea;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  white-space: nowrap;
}

.movie-rating {
  font-size: 1rem;
  font-weight: 600;
  color: #ff9800;
  margin: 0;
}

.mb-4 {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.showtimes-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.showtime-item {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 12px;
  width: 300px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.showtime-info {
  flex: 1;
}

.hall-name {
  font-weight: bold;
  margin-bottom: 4px;
}

.showtime-time {
  color: #606266;
  margin-bottom: 4px;
}

.showtime-price {
  color: #f56c6c;
  font-weight: bold;
}

.no-data {
  text-align: center;
  padding: 20px;
  color: #909399;
}

.seat-container {
  margin-bottom: 20px;
}

.screen {
  width: 100%;
  height: 40px;
  background-color: #e4e7ed;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30px;
  font-weight: bold;
}

.seats-grid {
  display: grid;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 4px;
  justify-content: center;
}

.seat {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.seat:hover {
  transform: scale(1.1);
}

.seat-occupied {
  background-color: #909399;
  color: white;
  cursor: not-allowed;
}

.seat-selected {
  background-color: #409EFF;
  color: white;
}

.selected-seats {
  margin-top: 10px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.selected-seat-tag {
  display: inline-block;
  background-color: #ecf5ff;
  color: #409eff;
  padding: 2px 8px;
  border-radius: 10px;
  margin-right: 8px;
  font-size: 12px;
}

.order-info {
  margin-bottom: 20px;
}

.order-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.order-item.total {
  font-weight: bold;
  border-bottom: none;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}

.total-price {
  color: #f56c6c;
  font-size: 18px;
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

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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

/* 支付弹窗样式 */
.payment-dialog {
  border-radius: 20px;
  overflow: hidden;
}

.payment-dialog .el-dialog__header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  text-align: center;
}

.payment-dialog .el-dialog__header .el-dialog__title {
  font-size: 1.2rem;
  font-weight: 600;
  color: white;
}

.payment-content {
  padding: 1.5rem;
}

.payment-header {
  background: rgba(102, 126, 234, 0.1);
  border-radius: 15px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.movie-info h3 {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: #333;
}

.movie-info p {
  font-size: 0.9rem;
  color: #666;
  margin: 0;
}

.payment-amount {
  margin-top: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.amount-label {
  font-size: 1rem;
  color: #666;
}

.amount-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f56c6c;
}

.payment-methods {
  margin-bottom: 1.5rem;
}

.payment-methods .section-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.payment-radio-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.payment-radio-item {
  margin: 0 !important;
}

.payment-method-card {
  background: white;
  border: 2px solid #e4e7ed;
  border-radius: 15px;
  padding: 1.2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
  cursor: pointer;
}

.payment-method-card:hover {
  border-color: #667eea;
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.1);
  transform: translateY(-2px);
}

.payment-icon {
  font-size: 2rem;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  color: white;
}

.payment-method-info {
  flex: 1;
}

.payment-method-name {
  display: block;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
}

.payment-method-desc {
  display: block;
  font-size: 0.8rem;
  color: #909399;
}

.selected-icon {
  font-size: 1.5rem;
  color: #67c23a;
}

.payment-countdown {
  background: rgba(245, 108, 108, 0.1);
  border-radius: 10px;
  padding: 1rem;
  text-align: center;
}

.countdown-value {
  font-size: 1.2rem;
  font-weight: 600;
  color: #f56c6c;
  margin-left: 0.5rem;
}

.payment-processing,
.payment-success,
.payment-failed {
  text-align: center;
  padding: 3rem 1rem;
}

.processing-icon,
.success-icon,
.failed-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  animation: fadeInUp 0.8s ease;
}

.processing-icon {
  background: rgba(102, 126, 234, 0.1);
}

.success-icon {
  background: rgba(103, 194, 58, 0.1);
}

.failed-icon {
  background: rgba(245, 108, 108, 0.1);
}

.loading-icon {
  font-size: 2.5rem;
  color: #667eea;
  animation: spin 1s linear infinite;
}

.check-icon {
  font-size: 2.5rem;
  color: #67c23a;
}

.error-icon {
  font-size: 2.5rem;
  color: #f56c6c;
}

.payment-processing p,
.payment-success p,
.payment-failed p {
  color: #666;
  margin: 0;
}

.payment-success h3,
.payment-failed h3 {
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.payment-success h3 {
  color: #67c23a;
}

.payment-failed h3 {
  color: #f56c6c;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  background: #f9f9f9;
  border-top: 1px solid #e4e7ed;
}

.dialog-footer .el-button {
  border-radius: 25px;
  padding: 0.5rem 1.5rem;
}

.dialog-footer .el-button--primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.dialog-footer .el-button--primary:hover {
  background: linear-gradient(135deg, #5a6fe0 0%, #6a4299 100%);
}

@media (max-width: 768px) {
  .nav-links {
    display: none;
  }

  .page-title {
    font-size: 2rem;
  }

  .movie-info-card {
    flex-direction: column;
    text-align: center;
  }

  .showtimes-container {
    flex-direction: column;
  }

  .showtime-item {
    width: 100%;
  }

  .payment-dialog {
    width: 90% !important;
  }

  .payment-header {
    padding: 1rem;
  }

  .movie-info h3 {
    font-size: 1rem;
  }

  .movie-info p {
    font-size: 0.8rem;
  }

  .amount-value {
    font-size: 1.2rem;
  }

  .payment-method-card {
    padding: 1rem;
  }

  .payment-icon {
    font-size: 1.5rem;
    width: 40px;
    height: 40px;
  }
}

</style>
