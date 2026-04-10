<template>
    <div class="page">
      <el-card class="card" shadow="always">
        <div class="title">管理端注册</div>
  
        <el-form ref="formRef" :model="form" :rules="rules" size="large">
          <el-form-item prop="username">
            <el-input v-model.trim="form.username" placeholder="用户名" clearable />
          </el-form-item>
  
          <el-form-item prop="password">
            <el-input v-model="form.password" type="password" show-password placeholder="密码" />
          </el-form-item>
  
          <el-form-item prop="confirmPassword">
            <el-input
              v-model="form.confirmPassword"
              type="password"
              show-password
              placeholder="确认密码"
            />
          </el-form-item>
  
          <el-form-item prop="email">
            <el-input v-model.trim="form.email" placeholder="邮箱（必填）" clearable />
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
  
          <el-button type="primary" :loading="loading" style="width: 100%" @click="onSubmit">
            注册
          </el-button>
  
          <div class="footer">
            <span>已有账号？</span>
            <el-link type="primary" @click="goLogin">去登录</el-link>
          </div>
        </el-form>
      </el-card>
    </div>
  </template>
  
  <script setup lang="ts">
  import { reactive, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import type { FormInstance, FormRules } from 'element-plus'
  import { ElMessage } from 'element-plus'
  import request from '../../utils/request'
  
  const router = useRouter()
  const formRef = ref<FormInstance>()
  const loading = ref(false)
  
  const form = reactive({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    verificationCode: ''
  })
  
  const rules: FormRules = {
    username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
    password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
    confirmPassword: [
      { required: true, message: '请确认密码', trigger: 'blur' },
      {
        validator: (_rule, value, callback) => {
          if (value !== form.password) callback(new Error('两次密码不一致'))
          else callback()
        },
        trigger: 'blur'
      }
    ],
    email: [
      { required: true, message: '请输入邮箱', trigger: 'blur' },
      { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
    ],
    verificationCode: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
  }

  const sendingCode = ref(false)
  const countdown = ref(0)
  let countdownTimer: number | null = null
  
  function goLogin() {
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

  async function sendVerificationCode() {
    if (!form.email) {
      ElMessage.warning('请输入邮箱')
      return
    }
    sendingCode.value = true
    try {
      const { data } = await request.post('/sessions/verification-code', form.email, {
        headers: {
          'Content-Type': 'text/plain'
        }
      })
      if (data?.code === 200) {
        ElMessage.success('验证码已发送')
        startCountdown()
      } else {
        ElMessage.error(data?.msg || '发送失败')
      }
    } catch (e: any) {
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
        // 你后端接口示例：POST /api/admin/auth/register
        const { data } = await request.post('/sessions/register', {
          username: form.username,
          password: form.password,
          email: form.email,
          verificationCode: form.verificationCode
        })

        // 统一返回格式：{ code, msg, data: token }
        if (data?.code !== 200 || !data.data) {
          ElMessage.error(data?.msg || '注册失败')
          return
        }

        const token = data.data
        localStorage.setItem('admin_token', token)

        // 获取用户信息和权限
        const sessionRes = await request.get('/sessions/current')
        if (sessionRes.data?.code === 200 && sessionRes.data?.data) {
          const d = sessionRes.data.data as { roles?: string[]; permissions?: string[] }
          if (Array.isArray(d.roles)) localStorage.setItem('admin_roles', JSON.stringify(d.roles))
          if (Array.isArray(d.permissions)) {
            localStorage.setItem('admin_permissions', JSON.stringify(d.permissions))
          }
        }

        ElMessage.success('注册成功')
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
  .footer {
    margin-top: 14px;
    text-align: center;
  }
  </style>