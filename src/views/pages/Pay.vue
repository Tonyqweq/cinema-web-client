<template>
  <div class="pay-page">
    <div class="page-header">
      <h1>订单支付</h1>
      <el-button type="primary" plain @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        返回上一页
      </el-button>
    </div>

    <el-card class="mb-4">
      <template #header>
        <div class="card-header">
          <span>订单信息</span>
        </div>
      </template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="订单编号">{{ orderInfo.id }}</el-descriptions-item>
        <el-descriptions-item label="订单状态">{{ orderStatusText }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDate(orderInfo.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="剩余支付时间">
          <span :class="{ 'text-danger': remainingTime <= 60 }">
            {{ formatRemainingTime(remainingTime) }}
          </span>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card class="mb-4">
      <template #header>
        <div class="card-header">
          <span>支付信息</span>
        </div>
      </template>
      <div class="pay-info">
        <div class="total-amount">
          <span class="label">应付金额：</span>
          <span class="amount">¥{{ orderInfo.totalPrice }}</span>
        </div>
        
        <div class="payment-methods">
          <h3>选择支付方式</h3>
          <el-radio-group v-model="selectedPaymentMethod">
            <el-radio-button label="wechat">
              <div class="payment-option">
                <img src="https://img.icons8.com/color/48/000000/wechat-pay.png" alt="微信支付" class="payment-icon">
                <span>微信支付</span>
              </div>
            </el-radio-button>
            <el-radio-button label="alipay">
              <div class="payment-option">
                <img src="https://img.icons8.com/color/48/000000/alipay.png" alt="支付宝" class="payment-icon">
                <span>支付宝</span>
              </div>
            </el-radio-button>
            <el-radio-button label="card">
              <div class="payment-option">
                <img src="https://img.icons8.com/color/48/000000/bank-card-back-side.png" alt="银行卡" class="payment-icon">
                <span>银行卡</span>
              </div>
            </el-radio-button>
          </el-radio-group>
        </div>
      </div>
    </el-card>

    <div class="action-buttons">
      <el-button @click="goBack">取消支付</el-button>
      <el-button type="primary" @click="handlePay" :loading="loading" :disabled="remainingTime <= 0">
        {{ loading ? '支付中...' : '确认支付' }}
      </el-button>
    </div>

    <!-- 支付成功对话框 -->
    <el-dialog v-model="successDialogVisible" title="支付结果" width="400px" :close-on-click-modal="false" :close-on-press-escape="false">
      <div class="success-content">
        <el-icon class="success-icon"><Check /></el-icon>
        <h3>支付成功</h3>
        <p>订单已完成支付，感谢您的购买！</p>
      </div>
      <template #footer>
        <el-button type="primary" @click="goToOrders">查看订单</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Check } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { useRouter, useRoute } from 'vue-router'

// 路由
const router = useRouter()
const route = useRoute()

// 响应式数据
const orderInfo = ref({})
const loading = ref(false)
const successDialogVisible = ref(false)
const selectedPaymentMethod = ref('wechat')
const remainingTime = ref(0)
const timer = ref(null)

// 订单状态配置
const ORDER_STATUS_CONFIG = {
  0: { text: '待支付', type: 'warning' },
  1: { text: '已支付', type: 'success' },
  2: { text: '已完成', type: 'info' },
  3: { text: '已取消', type: 'danger' }
}

// 计算订单状态文本
const orderStatusText = computed(() => {
  return ORDER_STATUS_CONFIG[orderInfo.value.orderStatus]?.text || '未知'
})

// 加载订单信息
const loadOrderInfo = async () => {
  const orderId = route.params.id
  if (!orderId) {
    ElMessage.error('订单ID不存在')
    goBack()
    return
  }

  loading.value = true
  try {
    const response = await request.get(`/orders/${orderId}`)
    if (response.data.code === 200) {
      orderInfo.value = response.data.data
      // 初始化剩余支付时间
      remainingTime.value = calculateRemainingTime()
      // 检查订单状态
      if (orderInfo.value.orderStatus !== 0) {
        ElMessage.warning('该订单已支付或已取消')
        goBack()
      }
    } else {
      ElMessage.error(response.data.message || '加载订单信息失败')
      goBack()
    }
  } catch (error) {
    console.error('加载订单信息失败:', error)
    ElMessage.error('加载订单信息失败')
    goBack()
  } finally {
    loading.value = false
  }
}

// 计算剩余支付时间（秒）- 5分钟 = 300秒
const calculateRemainingTime = () => {
  if (!orderInfo.value.createdAt) return 0
  const createdTime = new Date(orderInfo.value.createdAt).getTime()
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

// 支付订单
const handlePay = async () => {
  if (remainingTime.value <= 0) {
    ElMessage.warning('订单已过期，无法支付')
    return
  }

  loading.value = true
  try {
    const response = await request.put(`/orders/${orderInfo.value.id}/pay`)
    if (response.data.code === 200) {
      successDialogVisible.value = true
    } else {
      ElMessage.error(response.data.message || '支付失败')
    }
  } catch (error) {
    console.error('支付失败:', error)
    ElMessage.error('支付失败')
  } finally {
    loading.value = false
  }
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 跳转到订单列表
const goToOrders = () => {
  router.push('/admin/my-orders')
}

// 启动定时器
const startTimer = () => {
  timer.value = setInterval(() => {
    remainingTime.value = calculateRemainingTime()
    if (remainingTime.value <= 0) {
      clearInterval(timer.value)
      ElMessage.warning('订单已过期')
    }
  }, 1000)
}

// 停止定时器
const stopTimer = () => {
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
  }
}

onMounted(() => {
  loadOrderInfo()
  startTimer()
})

onUnmounted(() => {
  stopTimer()
})
</script>

<style scoped>
.pay-page {
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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pay-info {
  padding: 20px 0;
}

.total-amount {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
  text-align: center;
}

.total-amount .label {
  font-size: 16px;
  color: #606266;
}

.total-amount .amount {
  font-size: 32px;
  font-weight: bold;
  color: #f56c6c;
  margin-left: 10px;
}

.payment-methods h3 {
  margin-bottom: 20px;
  font-size: 16px;
  font-weight: 600;
}

.payment-option {
  display: flex;
  align-items: center;
  padding: 10px 20px;
}

.payment-icon {
  width: 24px;
  height: 24px;
  margin-right: 10px;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 30px;
}

.success-content {
  text-align: center;
  padding: 30px 0;
}

.success-icon {
  font-size: 64px;
  color: #67c23a;
  margin-bottom: 20px;
}

.success-content h3 {
  margin: 0 0 10px 0;
  font-size: 20px;
  font-weight: 600;
}

.success-content p {
  color: #606266;
  margin: 0;
}

.text-danger {
  color: #f56c6c;
  font-weight: bold;
}
</style>