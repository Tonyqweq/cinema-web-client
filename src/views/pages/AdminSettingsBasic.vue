<template>
  <div class="admin-settings-basic">
    <h1>个人信息</h1>
    
    <!-- 账号信息 -->
    <el-card class="account-info" shadow="always">
      <template #header>
        <div class="card-header">
          <span>账号信息</span>
        </div>
      </template>
      <div class="info-item">
        <span class="label">用户名：</span>
        <span>{{ userInfo.username }}</span>
      </div>
      <div class="info-item">
        <span class="label">邮箱：</span>
        <span>{{ userInfo.email }}</span>
      </div>
      <div class="info-item">
        <span class="label">手机号：</span>
        <span>{{ userInfo.phone }}</span>
      </div>
      <div class="info-item">
        <span class="label">角色：</span>
        <span>{{ userInfo.roles.join(', ') }}</span>
      </div>
      <div class="info-item">
        <span class="label">创建时间：</span>
        <span>{{ formatDate(userInfo.createdAt) }}</span>
      </div>
    </el-card>

    <!-- 修改密码 -->
    <el-card class="change-password" shadow="always">
      <template #header>
        <div class="card-header">
          <span>修改密码</span>
        </div>
      </template>
      <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="100px">
        <el-form-item label="旧密码" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" type="password" placeholder="请输入旧密码" />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="请确认新密码" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleChangePassword" :loading="loading.password">确认修改</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 修改手机号 -->
    <el-card class="change-phone" shadow="always">
      <template #header>
        <div class="card-header">
          <span>修改手机号</span>
        </div>
      </template>
      <el-form ref="phoneFormRef" :model="phoneForm" :rules="phoneRules" label-width="100px">
        <el-form-item label="新手机号" prop="phone">
          <el-input v-model="phoneForm.phone" placeholder="请输入新手机号" />
        </el-form-item>
        <el-form-item label="验证码" prop="verificationCode">
          <el-input v-model="phoneForm.verificationCode" placeholder="请输入验证码">
            <template #append>
              <el-button :loading="loading.sendCode" :disabled="countdown > 0" @click="openCodeDialog('phone')">
                {{ countdown > 0 ? `${countdown}s` : '发送验证码' }}
              </el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleChangePhone" :loading="loading.phone">确认修改</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 修改邮箱 -->
    <el-card class="change-email" shadow="always">
      <template #header>
        <div class="card-header">
          <span>修改邮箱</span>
        </div>
      </template>
      <el-form ref="emailFormRef" :model="emailForm" :rules="emailRules" label-width="100px">
        <el-form-item label="新邮箱" prop="email">
          <el-input v-model="emailForm.email" placeholder="请输入新邮箱" />
        </el-form-item>
        <el-form-item label="验证码" prop="verificationCode">
          <el-input v-model="emailForm.verificationCode" placeholder="请输入验证码">
            <template #append>
              <el-button :loading="loading.sendCode" :disabled="countdown > 0" @click="openCodeDialog('email')">
                {{ countdown > 0 ? `${countdown}s` : '发送验证码' }}
              </el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleChangeEmail" :loading="loading.email">确认修改</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 验证码弹窗 -->
    <el-dialog
      v-model="codeDialogVisible"
      title="发送验证码"
      width="400px"
    >
      <el-form ref="codeDialogFormRef" :model="codeDialogForm" :rules="codeDialogRules" label-width="80px">
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="codeDialogForm.email" placeholder="请输入邮箱" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="codeDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="sendVerificationCode" :loading="loading.sendCode">发送验证码</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

// 用户信息
const userInfo = reactive({
  username: '',
  email: '',
  phone: '',
  roles: [],
  createdAt: ''
})

// 加载状态
const loading = reactive({
  user: false,
  password: false,
  phone: false,
  email: false,
  sendCode: false
})

// 倒计时
const countdown = ref(0)
let countdownTimer = null

// 验证码弹窗
const codeDialogVisible = ref(false)
const codeDialogForm = reactive({
  email: ''
})
const codeDialogRules = {
  email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }, { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }]
}
const codeDialogFormRef = ref(null)
const codeDialogType = ref('') // 'phone' 或 'email'

// 密码表单
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const passwordFormRef = ref(null)
const passwordRules = {
  oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '新密码长度至少为6位', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value === passwordForm.oldPassword) {
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
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 手机号表单
const phoneForm = reactive({
  phone: '',
  verificationCode: ''
})
const phoneFormRef = ref(null)
const phoneRules = {
  phone: [{ required: true, message: '请输入新手机号', trigger: 'blur' }, { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }],
  verificationCode: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
}

// 邮箱表单
const emailForm = reactive({
  email: '',
  verificationCode: ''
})
const emailFormRef = ref(null)
const emailRules = {
  email: [{ required: true, message: '请输入新邮箱', trigger: 'blur' }, { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }],
  verificationCode: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
}

// 加载用户信息
const loadUserInfo = async () => {
  loading.user = true
  try {
    const response = await request.get('/sessions/current')
    if (response.data.code === 200 && response.data.data) {
      const data = response.data.data
      userInfo.username = data.user?.username || ''
      userInfo.email = data.user?.email || ''
      userInfo.phone = data.user?.phone || ''
      userInfo.roles = data.roles || []
      userInfo.createdAt = data.user?.createdAt || ''
    }
  } catch (error) {
    console.error('加载用户信息失败:', error)
    ElMessage.error('加载用户信息失败')
  } finally {
    loading.user = false
  }
}

// 打开验证码弹窗
const openCodeDialog = (type) => {
  codeDialogType.value = type
  if (type === 'phone') {
    codeDialogForm.email = userInfo.email
  } else if (type === 'email') {
    codeDialogForm.email = emailForm.email
  }
  codeDialogVisible.value = true
}

// 发送验证码
const sendVerificationCode = async () => {
  if (!codeDialogFormRef.value) return
  
  codeDialogFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.sendCode = true
      try {
        const response = await request.post('/sessions/verification-code', codeDialogForm.email, {
          headers: {
            'Content-Type': 'text/plain'
          }
        })
        if (response.data.code === 200) {
          ElMessage.success('验证码已发送')
          startCountdown()
          codeDialogVisible.value = false
        } else {
          ElMessage.error(response.data.message || '发送失败')
        }
      } catch (error) {
        console.error('发送验证码失败:', error)
        ElMessage.error('发送验证码失败')
      } finally {
        loading.sendCode = false
      }
    }
  })
}

// 开始倒计时
const startCountdown = () => {
  countdown.value = 60
  if (countdownTimer) clearInterval(countdownTimer)
  countdownTimer = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value--
    } else {
      if (countdownTimer) clearInterval(countdownTimer)
      countdownTimer = null
    }
  }, 1000)
}

// 修改密码
const handleChangePassword = async () => {
  if (!passwordFormRef.value) return
  
  passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.password = true
      try {
        const response = await request.put('/admin/users/password', {
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword
        })
        if (response.data.code === 200) {
          ElMessage.success('密码修改成功')
          passwordForm.oldPassword = ''
          passwordForm.newPassword = ''
          passwordForm.confirmPassword = ''
        } else {
          ElMessage.error(response.data.message || '密码修改失败')
        }
      } catch (error) {
        console.error('修改密码失败:', error)
        ElMessage.error('修改密码失败')
      } finally {
        loading.password = false
      }
    }
  })
}

// 修改手机号
const handleChangePhone = async () => {
  if (!phoneFormRef.value) return
  
  phoneFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.phone = true
      try {
        const response = await request.put('/admin/users/phone', {
          phone: phoneForm.phone,
          verificationCode: phoneForm.verificationCode
        })
        if (response.data.code === 200) {
          ElMessage.success('手机号修改成功')
          phoneForm.phone = ''
          phoneForm.verificationCode = ''
          await loadUserInfo()
        } else {
          ElMessage.error(response.data.message || '手机号修改失败')
        }
      } catch (error) {
        console.error('修改手机号失败:', error)
        ElMessage.error('修改手机号失败')
      } finally {
        loading.phone = false
      }
    }
  })
}

// 修改邮箱
const handleChangeEmail = async () => {
  if (!emailFormRef.value) return
  
  emailFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.email = true
      try {
        const response = await request.put('/admin/users/email', {
          email: emailForm.email,
          verificationCode: emailForm.verificationCode
        })
        if (response.data.code === 200) {
          ElMessage.success('邮箱修改成功')
          emailForm.email = ''
          emailForm.verificationCode = ''
          await loadUserInfo()
        } else {
          ElMessage.error(response.data.message || '邮箱修改失败')
        }
      } catch (error) {
        console.error('修改邮箱失败:', error)
        ElMessage.error('修改邮箱失败')
      } finally {
        loading.email = false
      }
    }
  })
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString()
}

// 初始化
onMounted(async () => {
  await loadUserInfo()
})
</script>

<style scoped>
.admin-settings-basic {
  padding: 20px;
}

h1 {
  font-size: 24px;
  margin-bottom: 20px;
}

.card-header {
  font-size: 16px;
  font-weight: 600;
}

.account-info,
.change-password,
.change-phone,
.change-email {
  margin-bottom: 20px;
}

.info-item {
  margin-bottom: 10px;
}

.label {
  font-weight: 600;
  margin-right: 10px;
}
</style>
