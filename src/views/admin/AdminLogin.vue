<template>
  <div class="login-page">
    <div class="login-bg">
      <div class="bg-overlay"></div>
    </div>
    <div class="login-container">
      <div class="login-card">
        <div class="logo-container">
          <h1 class="logo">CineBook</h1>
          <p class="slogan">影院购票管理系统</p>
        </div>
        
        <el-form ref="formRef" :model="form" :rules="rules" size="large" class="login-form">
          <el-form-item prop="username" class="form-item">
            <el-input v-model.trim="form.username" placeholder="用户名" clearable @blur="fetchEmail" class="custom-input">
              <template #prefix>
                <el-icon class="input-icon"><User /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item prop="password" class="form-item">
            <el-input
              v-model="form.password"
              type="password"
              show-password
              placeholder="密码"
              autocomplete="current-password"
              class="custom-input"
            >
              <template #prefix>
                <el-icon class="input-icon"><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item prop="email" class="form-item">
            <el-input v-model.trim="form.email" placeholder="邮箱" clearable class="custom-input">
              <template #prefix>
                <el-icon class="input-icon"><Message /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item prop="verificationCode" class="form-item">
            <el-input v-model.trim="form.verificationCode" placeholder="验证码" clearable class="custom-input">
              <template #prefix>
                <el-icon class="input-icon"><Key /></el-icon>
              </template>
              <template #append>
                <el-button :loading="sendingCode" :disabled="countdown > 0" @click="sendVerificationCode" class="code-btn">
                  {{ countdown > 0 ? `${countdown}s` : '发送验证码' }}
                </el-button>
              </template>
            </el-input>
          </el-form-item>

          <div class="form-actions">
            <el-checkbox v-model="rememberMe" class="remember-checkbox">记住我</el-checkbox>
            <el-link type="primary" @click="goRegister" class="register-link">去注册</el-link>
          </div>

          <el-button type="primary" :loading="loading" class="login-btn" @click="onSubmit">
            登录
          </el-button>
        </el-form>
      </div>
    </div>
  </div>
</template>
  
  <script setup lang="ts">
  import { reactive, ref, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import type { FormInstance, FormRules } from 'element-plus'
  import { ElMessage } from 'element-plus'
  import { User, Lock, Message, Key } from '@element-plus/icons-vue'
  import request from '../../utils/request'
  
  const router = useRouter()
  const formRef = ref<FormInstance>()
  const loading = ref(false)
  const rememberMe = ref(true)
  
  const form = reactive({
    username: '',
    password: '',
    email: '',
    verificationCode: ''
  })

  const rules: FormRules = {
    username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
    password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
    email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }, { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }],
    verificationCode: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
  }

  const sendingCode = ref(false)
  const countdown = ref(0)
  let countdownTimer: number | null = null

  async function fetchEmail() {
    if (!form.username) {
      form.email = ''
      return
    }
    try {
      console.log('获取邮箱：用户名：', form.username)
      const { data } = await request.get('/sessions/email', {
        params: { username: form.username }
      })
      console.log('获取邮箱响应：', data)
      if (data?.code === 200) {
        form.email = data.data || ''
      } else {
        form.email = ''
      }
    } catch (e) {
      console.error('获取邮箱失败', e)
      form.email = ''
    }
  }
  
  onMounted(async () => {
    const saved = localStorage.getItem('admin_login_username')
    if (saved) form.username = saved
    
    // 检查是否存在token，如果存在则尝试自动登录
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const sessionRes = await request.get('/sessions/current')
        if (sessionRes.data?.code === 200 && sessionRes.data?.data) {
          const d = sessionRes.data.data
          if (Array.isArray(d.roles)) localStorage.setItem('admin_roles', JSON.stringify(d.roles))
          if (Array.isArray(d.permissions)) {
            localStorage.setItem('admin_permissions', JSON.stringify(d.permissions))
          }
          ElMessage.success('自动登录成功')
          router.push('/')
        }
      } catch (e) {
        // 自动登录失败，清除token
        localStorage.removeItem('token')
        localStorage.removeItem('admin_roles')
        localStorage.removeItem('admin_permissions')
      }
    }
  })
  
  function goRegister() {
    router.push('/admin/register')
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

  async function sendVerificationCode() {
    if (!form.username) {
      ElMessage.warning('请输入用户名')
      return
    }
    if (!form.email) {
      ElMessage.warning('请输入邮箱')
      return
    }
    sendingCode.value = true
    try {
      // 直接使用form.email发送验证码
      console.log('发送验证码：邮箱：', form.email)
      const { data } = await request.post('/sessions/verification-code', form.email, {
        headers: {
          'Content-Type': 'text/plain'
        }
      })
      console.log('发送验证码响应：', data)
      if (data?.code === 200) {
        ElMessage.success('验证码已发送')
        startCountdown()
      } else {
        ElMessage.error(data?.msg || '发送失败')
      }
    } catch (e: any) {
      console.error('发送验证码失败：', e)
      ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
    } finally {
      sendingCode.value = false
    }
  }
  
  async function onSubmit() {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
      if (!valid) return
  
      loading.value = true
      try {
        // 后端登录接口：POST /api/sessions
        // 前端 axios 的 baseURL 已经是 '/api'，所以这里直接写 '/sessions'
        const { data } = await request.post('/sessions', {
          username: form.username,
          password: form.password,
          email: form.email,
          verificationCode: form.verificationCode
        })

        // 统一返回格式：{ code, msg, data: { token } }
        if (data.code !== 200 || !data.data?.token) {
          ElMessage.error(data.msg || '登录失败')
          return
        }

        const token = data.data.token
        localStorage.setItem('token', token)

        if (rememberMe.value) localStorage.setItem('admin_login_username', form.username)
        else localStorage.removeItem('admin_login_username')

        const sessionRes = await request.get('/sessions/current')
        if (sessionRes.data?.code === 200 && sessionRes.data?.data) {
          const d = sessionRes.data.data as { roles?: string[]; permissions?: string[] }
          if (Array.isArray(d.roles)) localStorage.setItem('admin_roles', JSON.stringify(d.roles))
          if (Array.isArray(d.permissions)) {
            localStorage.setItem('admin_permissions', JSON.stringify(d.permissions))
          }
        }

        ElMessage.success('登录成功')
        router.push('/')
      } catch (e: any) {
        ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
      } finally {
        loading.value = false
      }
    })
  }
  </script>
  
  <style scoped>
  .login-page {
    min-height: 100vh;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .login-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    z-index: 1;
  }
  
  .bg-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtMS42NTYgMC0zIDEuMzQ0LTMgM3M2IDAgNi0zLTYuMS0zLjEtNi4xIDMuMSAwIDYgMyA2eiIvPjwvZz48L3N2Zz4=') repeat;
    opacity: 0.1;
  }
  
  .login-container {
    position: relative;
    z-index: 10;
    width: 100%;
    max-width: 450px;
    padding: 0 20px;
  }
  
  .login-card {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    padding: 40px;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.18);
  }
  
  .logo-container {
    text-align: center;
    margin-bottom: 30px;
  }
  
  .logo {
    font-size: 32px;
    font-weight: 700;
    background: linear-gradient(135deg, #e63946, #457b9d);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0 0 8px 0;
    letter-spacing: 2px;
  }
  
  .slogan {
    font-size: 14px;
    color: #666;
    margin: 0;
  }
  
  .login-form {
    width: 100%;
  }
  
  .form-item {
    margin-bottom: 20px;
  }
  
  .custom-input {
    border-radius: 10px;
    height: 48px;
    border: 1px solid #e1e5e9;
    transition: all 0.3s ease;
  }
  
  .custom-input:focus {
    border-color: #457b9d;
    box-shadow: 0 0 0 2px rgba(69, 123, 157, 0.2);
  }
  
  .input-icon {
    color: #999;
  }
  
  .code-btn {
    border-radius: 8px;
    padding: 0 16px;
  }
  
  .form-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 10px 0 24px;
  }
  
  .remember-checkbox {
    font-size: 14px;
  }
  
  .register-link {
    font-size: 14px;
  }
  
  .login-btn {
    width: 100%;
    height: 48px;
    border-radius: 10px;
    font-size: 16px;
    font-weight: 600;
    background: linear-gradient(135deg, #e63946, #457b9d);
    border: none;
    transition: all 0.3s ease;
  }
  
  .login-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(230, 57, 70, 0.3);
  }
  
  .login-btn:active {
    transform: translateY(0);
  }
  
  @media (max-width: 768px) {
    .login-card {
      padding: 30px 20px;
    }
    
    .logo {
      font-size: 28px;
    }
  }
  </style>