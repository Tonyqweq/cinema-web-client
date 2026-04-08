<template>
    <div class="page">
      <el-card class="card" shadow="always">
        <div class="title">管理端登录</div>
  
        <el-form ref="formRef" :model="form" :rules="rules" size="large">
          <el-form-item prop="username">
            <el-input v-model.trim="form.username" placeholder="用户名" clearable @blur="fetchEmail" />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              type="password"
              show-password
              placeholder="密码"
              autocomplete="current-password"
            />
          </el-form-item>

          <el-form-item prop="email">
            <el-input v-model.trim="form.email" placeholder="邮箱" clearable />
          </el-form-item>

          <el-form-item prop="verificationCode">
            <el-input v-model.trim="form.verificationCode" placeholder="验证码" clearable>
              <template #append>
                <el-button :loading="sendingCode" :disabled="countdown > 0" @click="sendVerificationCode">
                  {{ countdown > 0 ? `${countdown}s` : '发送验证码' }}
                </el-button>
              </template>
            </el-input>
          </el-form-item>
  
          <div class="row">
            <el-checkbox v-model="rememberMe">记住我</el-checkbox>
            <el-link type="primary" @click="goRegister">去注册</el-link>
          </div>
  
          <el-button type="primary" :loading="loading" style="width: 100%" @click="onSubmit">
            登录
          </el-button>
        </el-form>
      </el-card>
    </div>
  </template>
  
  <script setup lang="ts">
  import { reactive, ref, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import type { FormInstance, FormRules } from 'element-plus'
  import { ElMessage } from 'element-plus'
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
          router.push('/admin/dashboard')
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
        router.push('/admin/dashboard')
      } catch (e: any) {
        ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
      } finally {
        loading.value = false
      }
    })
  }
  </script>
  
  <style scoped>
  .page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f7fa;
  }
  .card {
    width: 420px;
  }
  .title {
    font-size: 20px;
    font-weight: 600;
    text-align: center;
    margin-bottom: 18px;
  }
  .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 6px 0 14px;
  }
  </style>