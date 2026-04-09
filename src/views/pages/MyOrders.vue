<template>
  <div class="my-orders">
    <div class="page-header">
      <h1>我的订单</h1>
    </div>

    <div class="filter-section">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="订单状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable>
            <el-option label="待支付" :value="0" />
            <el-option label="已支付" :value="1" />
            <el-option label="已完成" :value="2" />
            <el-option label="已取消" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table
      v-loading="loading"
      :data="filteredOrders"
      border
      style="width: 100%"
      empty-text="暂无订单"
    >
      <el-table-column type="index" label="序号" width="60" />
      <el-table-column prop="id" label="订单ID" min-width="80" />
      <el-table-column prop="showtimeId" label="场次ID" min-width="80" />
      <el-table-column label="订单状态" min-width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.orderStatus)">
            {{ getStatusText(row.orderStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="totalPrice" label="总金额" min-width="100">
        <template #default="{ row }">
          ¥{{ row.totalPrice }}
        </template>
      </el-table-column>
      <el-table-column label="剩余支付时间" min-width="150">
        <template #default="{ row }">
          <span v-if="row.orderStatus === 0" :class="{ 'text-danger': getRemainingTime(row.createdAt) <= 60 }">
            {{ formatRemainingTime(getRemainingTime(row.createdAt)) }}
          </span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" min-width="150">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" min-width="200">
        <template #default="{ row }">
          <el-button size="small" type="primary" plain @click="handleView(row)">查看</el-button>
          <el-button 
            v-if="row.orderStatus === 0 && getRemainingTime(row.createdAt) > 0" 
            size="small" 
            type="success" 
            plain 
            @click="handlePay(row)"
          >
            支付
          </el-button>
          <el-button 
            v-if="row.orderStatus === 0 && getRemainingTime(row.createdAt) > 0" 
            size="small" 
            type="danger" 
            plain 
            @click="handleCancel(row)"
          >
            取消
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-row">
      <el-pagination
        background
        layout="total, sizes, prev, pager, next, jumper"
        :current-page="currentPage"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="pageSize"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 订单详情对话框 -->
    <el-dialog v-model="detailVisible" title="订单详情" width="600px">
      <el-descriptions v-if="currentOrder" :column="2" border>
        <el-descriptions-item label="订单ID">{{ currentOrder.id }}</el-descriptions-item>
        <el-descriptions-item label="用户ID">{{ currentOrder.userId }}</el-descriptions-item>
        <el-descriptions-item label="场次ID">{{ currentOrder.showtimeId }}</el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag :type="getStatusType(currentOrder.orderStatus)">
            {{ getStatusText(currentOrder.orderStatus) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="总金额">¥{{ currentOrder.totalPrice }}</el-descriptions-item>
        <el-descriptions-item label="剩余支付时间">
          <span v-if="currentOrder.orderStatus === 0" :class="{ 'text-danger': getRemainingTime(currentOrder.createdAt) <= 60 }">
            {{ formatRemainingTime(getRemainingTime(currentOrder.createdAt)) }}
          </span>
          <span v-else>--</span>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ formatDate(currentOrder.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="更新时间" :span="2">{{ formatDate(currentOrder.updatedAt) }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button 
          v-if="currentOrder && currentOrder.orderStatus === 0 && getRemainingTime(currentOrder.createdAt) > 0" 
          type="success" 
          @click="handlePay(currentOrder)"
        >
          立即支付
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

// 状态管理
const loading = ref(false)
const orders = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const detailVisible = ref(false)
const currentOrder = ref(null)
const timer = ref(null)

// 搜索表单
const searchForm = ref({
  status: ''
})

// 订单状态配置
const ORDER_STATUS_CONFIG = {
  0: { text: '待支付', type: 'warning' },
  1: { text: '已支付', type: 'success' },
  2: { text: '已完成', type: 'info' },
  3: { text: '已取消', type: 'danger' }
}

const getStatusText = (status) => ORDER_STATUS_CONFIG[status]?.text || '未知'
const getStatusType = (status) => ORDER_STATUS_CONFIG[status]?.type || 'info'

// 计算剩余支付时间（秒）- 5分钟 = 300秒
const getRemainingTime = (createdAt) => {
  if (!createdAt) return 0
  const createdTime = new Date(createdAt).getTime()
  const currentTime = new Date().getTime()
  const elapsedSeconds = Math.floor((currentTime - createdTime) / 1000)
  const remainingSeconds = 300 - elapsedSeconds // 5分钟 = 300秒
  return Math.max(0, remainingSeconds)
}

// 格式化剩余时间
const formatRemainingTime = (seconds) => {
  if (seconds <= 0) return '已过期'
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}分${secs.toString().padStart(2, '0')}秒`
}

// 过滤后的订单列表
const filteredOrders = computed(() => {
  let result = orders.value
  
  // 按状态过滤
  if (searchForm.value.status !== '') {
    result = result.filter(order => order.orderStatus === searchForm.value.status)
  }
  
  return result
})

// 加载订单列表
const loadOrders = async () => {
  loading.value = true
  try {
    const response = await request.get('/orders')
    if (response.data.code === 200) {
      orders.value = response.data.data || []
      total.value = orders.value.length
    } else {
      ElMessage.error(response.data.message || '加载订单失败')
    }
  } catch (error) {
    console.error('加载订单失败:', error)
    ElMessage.error('加载订单失败')
  } finally {
    loading.value = false
  }
}

// 检查并取消超时订单
const checkAndCancelExpiredOrders = async () => {
  const expiredOrders = orders.value.filter(order => {
    return order.orderStatus === 0 && getRemainingTime(order.createdAt) <= 0
  })
  
  for (const order of expiredOrders) {
    try {
      await request.put(`/orders/${order.id}/cancel`)
      console.log(`订单 ${order.id} 已自动取消`)
    } catch (error) {
      console.error(`自动取消订单 ${order.id} 失败:`, error)
    }
  }
  
  if (expiredOrders.length > 0) {
    await loadOrders()
  }
}

// 启动定时器
const startTimer = () => {
  timer.value = setInterval(() => {
    checkAndCancelExpiredOrders()
  }, 10000) // 每10秒检查一次
}

// 停止定时器
const stopTimer = () => {
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
  }
}

// 查看订单详情
const handleView = (row) => {
  currentOrder.value = row
  detailVisible.value = true
}

// 支付订单
const handlePay = async (row) => {
  // 检查是否已过期
  if (getRemainingTime(row.createdAt) <= 0) {
    ElMessage.warning('订单已过期，无法支付')
    await loadOrders()
    return
  }
  
  try {
    await ElMessageBox.confirm('确定要支付该订单吗？', '支付确认', {
      type: 'warning'
    })
    
    const response = await request.put(`/orders/${row.id}/pay`)
    if (response.data.code === 200) {
      ElMessage.success('订单支付成功')
      detailVisible.value = false
      await loadOrders()
    } else {
      ElMessage.error(response.data.message || '支付失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('支付订单失败:', error)
      ElMessage.error('支付订单失败')
    }
  }
}

// 取消订单
const handleCancel = async (row) => {
  try {
    await ElMessageBox.confirm('确定要取消该订单吗？', '取消确认', {
      type: 'warning'
    })
    
    const response = await request.put(`/orders/${row.id}/cancel`)
    if (response.data.code === 200) {
      ElMessage.success('订单取消成功')
      await loadOrders()
    } else {
      ElMessage.error(response.data.message || '取消失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('取消订单失败:', error)
      ElMessage.error('取消订单失败')
    }
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  loadOrders()
}

// 重置
const handleReset = () => {
  searchForm.value = {
    status: ''
  }
  currentPage.value = 1
  loadOrders()
}

// 分页
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page) => {
  currentPage.value = page
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  const dateObj = new Date(date)
  return dateObj.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

onMounted(() => {
  loadOrders()
  startTimer()
})

onUnmounted(() => {
  stopTimer()
})
</script>

<style scoped>
.my-orders {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.filter-section {
  margin-bottom: 20px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.pagination-row {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.text-danger {
  color: #f56c6c;
  font-weight: bold;
}
</style>
