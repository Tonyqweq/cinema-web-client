<template>
  <div class="profile-page">
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
        <h2 class="page-title">个人中心</h2>
        <p class="page-subtitle">管理您的账户信息</p>
      </div>
    </section>

    <!-- 个人信息区域 -->
    <section class="profile-section" v-if="userInfo">
      <div class="profile-container">
        <!-- 个人信息卡片 -->
        <div class="profile-card">
          <h3 class="card-title">个人信息</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">用户名</span>
              <span class="info-value">{{ userInfo.username }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">邮箱</span>
              <span class="info-value">{{ userInfo.email }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">手机号</span>
              <span class="info-value">{{ userInfo.phone || '未设置' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">角色</span>
              <span class="info-value">{{ userInfo.roles?.join(', ') || '无' }}</span>
            </div>
          </div>
        </div>

        <!-- 修改密码卡片 -->
        <div class="profile-card">
          <h3 class="card-title">修改密码</h3>
          <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" class="profile-form">
            <el-form-item prop="oldPassword">
              <el-input v-model="passwordForm.oldPassword" type="password" placeholder="旧密码" />
            </el-form-item>
            <el-form-item prop="newPassword">
              <el-input v-model="passwordForm.newPassword" type="password" placeholder="新密码" />
            </el-form-item>
            <el-form-item prop="confirmPassword">
              <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="确认新密码" />
            </el-form-item>
            <el-button type="primary" :loading="loading" @click="updatePassword">
              保存修改
            </el-button>
          </el-form>
        </div>

        <!-- 修改手机号卡片 -->
        <div class="profile-card">
          <h3 class="card-title">修改手机号</h3>
          <el-form ref="phoneFormRef" :model="phoneForm" :rules="phoneRules" class="profile-form">
            <el-form-item prop="phone">
              <el-input v-model="phoneForm.phone" placeholder="新手机号" />
            </el-form-item>
            <el-form-item prop="verificationCode">
              <el-input v-model="phoneForm.verificationCode" placeholder="验证码">
                <template #append>
                  <el-button :loading="sendingCode" :disabled="countdown > 0" @click="sendVerificationCode('phone')">
                    {{ countdown > 0 ? `${countdown}s` : '发送验证码' }}
                  </el-button>
                </template>
              </el-input>
            </el-form-item>
            <el-button type="primary" :loading="loading" @click="updatePhone">
              保存修改
            </el-button>
          </el-form>
        </div>

        <!-- 修改邮箱卡片 -->
        <div class="profile-card">
          <h3 class="card-title">修改邮箱</h3>
          <el-form ref="emailFormRef" :model="emailForm" :rules="emailRules" class="profile-form">
            <el-form-item prop="email">
              <el-input v-model="emailForm.email" placeholder="新邮箱" />
            </el-form-item>
            <el-form-item prop="verificationCode">
              <el-input v-model="emailForm.verificationCode" placeholder="验证码">
                <template #append>
                  <el-button :loading="sendingCode" :disabled="countdown > 0" @click="sendVerificationCode('email')">
                    {{ countdown > 0 ? `${countdown}s` : '发送验证码' }}
                  </el-button>
                </template>
              </el-input>
            </el-form-item>
            <el-button type="primary" :loading="loading" @click="updateEmail">
              保存修改
            </el-button>
          </el-form>
        </div>

        <!-- 退出登录按钮 -->
        <div class="logout-section">
          <el-button type="danger" @click="logout">退出登录</el-button>
        </div>
      </div>
    </section>

    <!-- 加载状态 -->
    <section class="loading-section" v-if="loading">
      <el-icon class="loading-icon"><Loading /></el-icon>
      <p>加载中...</p>
    </section>

    <!-- 页脚 -->
    <footer class="footer">
      <div class="footer-content">
        <p>© 2026 影院之家 - 您的专属影院体验</p>
        <p>by：Tonyqwe</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import request from '../utils/request'

const router = useRouter()
const loading = ref(false)
const userInfo = ref<any>(null)
const sendingCode = ref(false)
const countdown = ref(0)
let countdownTimer: number | null = null

// 表单引用
const passwordFormRef = ref()
const phoneFormRef = ref()
const emailFormRef = ref()

// 表单数据
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const phoneForm = ref({
  phone: '',
  verificationCode: ''
})

const emailForm = ref({
  email: '',
  verificationCode: ''
})

// 表单规则
const passwordRules = {
  oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value === passwordForm.value.oldPassword) {
          callback(new Error('新密码不能与旧密码相同'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== passwordForm.value.newPassword) {
          callback(new Error('两次密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const phoneRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  verificationCode: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
}

const emailRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  verificationCode: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
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

function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('admin_login_username')
  localStorage.removeItem('admin_roles')
  localStorage.removeItem('admin_permissions')
  ElMessage.success('退出登录成功')
  router.push('/admin/login')
}

function startCountdown() {
  countdown.value = 60
  if (countdownTimer) clearInterval(countdownTimer)
  countdownTimer = window.setInterval(() => {
    if (countdown.value > 0) {
      countdown.value--
    } else {
      if (countdownTimer) clearInterval(countdownTimer)
      countdownTimer = null
    }
  }, 1000)
}

async function sendVerificationCode(type: 'password' | 'phone' | 'email') {
  sendingCode.value = true
  try {
    let email = userInfo.value?.email
    if (type === 'email' && emailForm.value.email) {
      email = emailForm.value.email
    }

    const res = await request.post('/sessions/verification-code', email, {
      headers: {
        'Content-Type': 'text/plain'
      }
    })
    if (res.data?.code === 200) {
      ElMessage.success('验证码已发送')
      startCountdown()
    } else {
      ElMessage.error(res.data?.msg || '发送失败')
    }
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
  } finally {
    sendingCode.value = false
  }
}

async function loadUserInfo() {
  loading.value = true
  try {
    const res = await request.get('/sessions/current')
    if (res.data?.code === 200 && res.data?.data) {
      const data = res.data.data
      userInfo.value = {
        username: data.user?.username || '',
        email: data.user?.email || '',
        phone: data.user?.phone || '',
        roles: data.roles || [],
        createdAt: data.user?.createdAt || ''
      }
    }
  } catch (e: any) {
    console.error('加载用户信息失败:', e)
    ElMessage.error('加载用户信息失败')
  } finally {
    loading.value = false
  }
}

async function updatePassword() {
  if (!passwordFormRef.value) return
  await passwordFormRef.value.validate(async (valid: boolean) => {
    if (!valid) return

    loading.value = true
    try {
      const res = await request.put('/admin/users/password', {
        oldPassword: passwordForm.value.oldPassword,
        newPassword: passwordForm.value.newPassword
      })
      if (res.data?.code === 200) {
        ElMessage.success('密码修改成功')
        passwordForm.value = {
          oldPassword: '',
          newPassword: '',
          confirmPassword: '',
          // verificationCode: ''
        }
      } else {
        ElMessage.error(res.data?.msg || '修改失败')
      }
    } catch (e: any) {
      ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
    } finally {
      loading.value = false
    }
  })
}

async function updatePhone() {
  if (!phoneFormRef.value) return
  await phoneFormRef.value.validate(async (valid: boolean) => {
    if (!valid) return

    loading.value = true
    try {
      const res = await request.put('/admin/users/phone', {
        phone: phoneForm.value.phone,
        verificationCode: phoneForm.value.verificationCode
      })
      if (res.data?.code === 200) {
        ElMessage.success('手机号修改成功')
        phoneForm.value = {
          phone: '',
          verificationCode: ''
        }
        // 重新加载用户信息
        loadUserInfo()
      } else {
        ElMessage.error(res.data?.msg || '修改失败')
      }
    } catch (e: any) {
      ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
    } finally {
      loading.value = false
    }
  })
}

async function updateEmail() {
  if (!emailFormRef.value) return
  await emailFormRef.value.validate(async (valid: boolean) => {
    if (!valid) return

    loading.value = true
    try {
      const res = await request.put('/admin/users/email', {
        email: emailForm.value.email,
        verificationCode: emailForm.value.verificationCode
      })
      if (res.data?.code === 200) {
        ElMessage.success('邮箱修改成功')
        emailForm.value = {
          email: '',
          verificationCode: ''
        }
        // 重新加载用户信息
        loadUserInfo()
      } else {
        ElMessage.error(res.data?.msg || '修改失败')
      }
    } catch (e: any) {
      ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
    } finally {
      loading.value = false
    }
  })
}

onMounted(() => {
  loadUserInfo()
})
</script>

<style scoped>
.profile-page {
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

.profile-section {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 2rem 4rem;
}

.profile-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.profile-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.card-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 1.5rem 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-label {
  font-size: 0.9rem;
  color: #999;
}

.info-value {
  font-size: 1rem;
  color: #333;
  font-weight: 500;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.profile-form :deep(.el-form-item) {
  margin-bottom: 0;
}

.profile-form :deep(.el-input__wrapper) {
  border-radius: 10px;
  padding: 8px 15px;
  height: 40px;
}

.logout-section {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

.logout-section :deep(.el-button) {
  padding: 0.75rem 2.5rem;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 600;
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

  .page-title {
    font-size: 2rem;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .profile-card {
    padding: 1.5rem;
  }
}
</style>
