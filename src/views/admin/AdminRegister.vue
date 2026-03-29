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
            <el-input v-model.trim="form.email" placeholder="邮箱（可选）" clearable />
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
  import request from '@/utils/request'
  
  const router = useRouter()
  const formRef = ref<FormInstance>()
  const loading = ref(false)
  
  const form = reactive({
    username: '',
    password: '',
    confirmPassword: '',
    email: ''
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
      { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
    ]
  }
  
  function goLogin() {
    router.push('/admin/login')
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
          email: form.email || undefined
        })
  
        // 统一返回格式：{ code, msg, data }
        if (data?.code !== 200) {
          ElMessage.error(data?.msg || '注册失败')
          return
        }
  
        ElMessage.success('注册成功，请登录')
        router.push('/admin/login')
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