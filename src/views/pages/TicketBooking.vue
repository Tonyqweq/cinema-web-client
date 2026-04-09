<template>
  <div class="ticket-booking">
    <h2>电影购票系统</h2>
    
    <!-- 电影选择 -->
    <el-card class="mb-4">
      <template #header>
        <div class="card-header">
          <span>选择电影</span>
        </div>
      </template>
      <el-form :inline="true" class="demo-form-inline">
        <el-form-item label="电影">
          <el-input
            v-model="movieSearchKeyword"
            placeholder="搜索电影"
            style="width: 200px; margin-right: 10px;"
            @input="handleMovieSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-select v-model="selectedMovie" placeholder="请选择电影" @change="handleMovieChange" style="width: 300px;">
            <el-option
              v-for="movie in filteredMovies"
              :key="movie.id"
              :label="`${movie.title} (${movie.durationMin}分钟)`"
              :value="movie.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 影院选择 -->
    <el-card v-if="selectedMovie" class="mb-4">
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

    <!-- 日期选择 -->
    <el-card v-if="selectedCinema" class="mb-4">
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
        </div>
      </template>
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
          <span>{{ getMovieInfo(selectedMovie) }}</span>
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
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import request from '@/utils/request'

// 状态管理
const movies = ref([])
const cinemas = ref([])
const showtimes = ref([])
const seats = ref([])
const selectedMovie = ref('')
const selectedCinema = ref('')
const selectedDate = ref('')
const selectedShowtime = ref(null)
const selectedSeats = ref([])
const loading = ref(false)
const movieSearchKeyword = ref('')

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

// 过滤后的电影列表
const filteredMovies = computed(() => {
  if (!movieSearchKeyword.value) return movies.value
  return movies.value.filter(movie => 
    movie.title.toLowerCase().includes(movieSearchKeyword.value.toLowerCase())
  )
})

// 过滤后的影院列表
const filteredCinemas = computed(() => {
  if (!selectedMovie.value) return cinemas.value
  // 筛选有对应场次的影院
  const cinemaIds = new Set()
  showtimes.value.forEach(showtime => {
    if (showtime.movieId === selectedMovie.value && showtime.status === 1) {
      cinemaIds.add(showtime.cinemaId)
    }
  })
  return cinemas.value.filter(cinema => cinemaIds.has(cinema.id))
})

// 过滤后的场次列表
const filteredShowtimes = computed(() => {
  if (!selectedDate.value) return []
  
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

// 禁用日期：只允许选择今天及之后的日期
const disabledDate = (time) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return time.getTime() < today.getTime()
}

// 加载电影列表
const loadMovies = async () => {
  try {
    const response = await request.get('/movies?page=1&pageSize=100')
    if (response.data.code === 200) {
      movies.value = response.data.data.records
    }
  } catch (error) {
    console.error('加载电影列表失败:', error)
    ElMessage.error('加载电影列表失败')
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
const loadAllShowtimes = async (movieId) => {
  try {
    const response = await request.get('/showtimes', {
      params: {
        movieId: movieId,
        page: 1,
        pageSize: 1000
      }
    })
    if (response.data.code === 200) {
      showtimes.value = response.data.data.records.map(showtime => ({
        ...showtime,
        hallName: showtime.hall?.name || showtime.hallName || '未知影厅'
      }))
    }
  } catch (error) {
    console.error('加载场次信息失败:', error)
    ElMessage.error('加载场次信息失败')
  }
}

// 处理电影搜索
const handleMovieSearch = () => {
  // 搜索逻辑已在 filteredMovies 计算属性中实现
}

// 处理电影选择
const handleMovieChange = async () => {
  selectedCinema.value = ''
  selectedDate.value = ''
  selectedShowtime.value = null
  selectedSeats.value = []
  showtimes.value = []
  
  if (selectedMovie.value) {
    // 先加载所有影院
    await loadCinemas()
    // 再加载所有与该电影相关的场次
    await loadAllShowtimes(selectedMovie.value)
  }
}

// 处理影院选择
const handleCinemaChange = async () => {
  selectedDate.value = ''
  selectedShowtime.value = null
  selectedSeats.value = []
  // 场次信息已在选择电影时加载
}

// 处理日期选择
const handleDateChange = async () => {
  selectedShowtime.value = null
  selectedSeats.value = []
  // 场次信息已在选择电影时加载，过滤逻辑在 filteredShowtimes 计算属性中实现
}

// 选择场次
const selectShowtime = async (showtime) => {
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
const selectSeat = (seat) => {
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

// 计算总价（座位价格优先，如果座位没有设置价格则使用场次统一价格）
const calculateTotalPrice = () => {
  if (!selectedShowtime.value || selectedSeats.value.length === 0) return 0
  
  let total = 0
  selectedSeats.value.forEach(seatId => {
    const seat = seats.value.find(s => s.id === seatId)
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
      ElMessage.success('订单提交成功')
      // 重置选择
      selectedSeats.value = []
      // 重新加载座位信息
      await loadSeats()
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
const formatTime = (time) => {
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
const formatDate = (date) => {
  if (!date) return ''
  const dateObj = new Date(date)
  return dateObj.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 获取电影信息
const getMovieInfo = (movieId) => {
  const movie = movies.value.find(m => m.id === movieId)
  return movie ? movie.title : ''
}

// 获取影院信息
const getCinemaInfo = (cinemaId) => {
  const cinema = cinemas.value.find(c => c.id === cinemaId)
  return cinema ? cinema.name : ''
}

// 获取座位信息
const getSeatInfo = (seatId) => {
  const seat = seats.value.find(s => s.id === seatId)
  if (!seat) return ''
  return seat.seatNumber || `${seat.seatRow || seat.rowNumber}${seat.seatCol || seat.columnNumber}`
}

// 获取座位Tooltip内容
const getSeatTooltip = (seat) => {
  const seatTypeText = seat.seatTypeText || getSeatTypeText(seat.seatType)
  const seatPrice = seat.price ? `¥${seat.price}` : `¥${selectedShowtime.value?.price || 0}`
  return `${seatTypeText} - ${seatPrice}`
}

// 获取座位类型文本
const getSeatTypeText = (seatType) => {
  switch (seatType) {
    case 1: return '普通座'
    case 2: return 'VIP座'
    case 3: return '情侣座'
    case 4: return '轮椅座'
    default: return '未知'
  }
}

// 初始化
onMounted(async () => {
  await loadMovies()
})
</script>

<style scoped>
.ticket-booking {
  padding: 20px;
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
</style>