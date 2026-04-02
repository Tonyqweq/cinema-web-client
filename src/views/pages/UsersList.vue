<template>
  <el-card class="dashboard" shadow="never" :body-style="{ padding: '16px' }">
    <div class="title-row">
      <h2 class="title">用户管理</h2>
    </div>

    <div class="toolbar">
      <el-input
        v-model.trim="query.username"
        placeholder="搜索用户名"
        clearable
        style="max-width: 320px"
        @keyup.enter="onSearch"
      />

      <el-select
        v-model="query.status"
        placeholder="选择状态"
        clearable
        style="width: 140px"
        @change="onSearch"
      >
        <el-option label="启用" :value="1" />
        <el-option label="禁用" :value="0" />
      </el-select>

      <el-button type="primary" @click="onSearch">查询</el-button>
      <el-button @click="onReset">重置</el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="pagedUsers"
      border
      style="width: 100%"
      empty-text="暂无用户"
    >
      <el-table-column type="index" label="序号" width="60" />
      <el-table-column prop="username" label="用户名" min-width="150" />
      <el-table-column prop="email" label="邮箱" min-width="160" />
      <el-table-column label="性别" min-width="90">
        <template #default="{ row }">
          {{ getGenderText(row.gender) }}
        </template>
      </el-table-column>
      <el-table-column label="状态" min-width="90">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="角色" min-width="120">
        <template #default="{ row }">
          {{ getRoleDescription(row.roles) }}
        </template>
      </el-table-column>
      <!-- <el-table-column prop="createdAt" label="创建时间" min-width="180" />
      <el-table-column prop="updateTime" label="更新时间" min-width="180" /> -->

      <el-table-column label="操作" fixed="right" min-width="200">
        <template #default="{ row }">
          <el-button size="small" @click="onView(row)">详情</el-button>
          <el-button size="small" type="warning" plain @click="onEdit(row)">修改</el-button>
          <el-button size="small" type="primary" plain @click="onEditRole(row)">角色</el-button>
          <el-button size="small" type="danger" plain @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-row">
      <el-pagination
        background
        layout="total, sizes, prev, pager, next, jumper"
        :current-page="currentPage"
        :page-sizes="[5, 10, 20, 50]"
        :page-size="pageSize"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <el-dialog v-model="detailVisible" title="用户详情" width="720px">
      <el-descriptions v-if="detail" :column="2" border>
        <el-descriptions-item label="ID">{{ detail.id }}</el-descriptions-item>
        <el-descriptions-item label="用户名">{{ detail.username }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ detail.email }}</el-descriptions-item>
        <el-descriptions-item label="性别">{{ getGenderText(detail.gender) }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ getStatusText(detail.status) }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ detail.createdAt }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ detail.updateTime }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 修改用户对话框 -->
    <el-dialog v-model="editVisible" title="修改用户" width="640px" destroy-on-close @closed="resetEditForm">
      <el-form ref="editFormRef" :model="editForm" :rules="formRules" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model.trim="editForm.username" placeholder="用户名" clearable />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model.trim="editForm.email" type="email" clearable />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="editForm.gender">
            <el-radio :label="0">男</el-radio>
            <el-radio :label="1">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="editForm.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="editSubmitting" @click="submitEdit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 修改角色对话框 -->
    <el-dialog v-model="roleVisible" title="修改用户角色" width="640px" destroy-on-close @closed="resetRoleForm">
      <el-form ref="roleFormRef" :model="roleForm" label-width="100px">
        <el-form-item label="用户名">
          <el-input v-model="roleForm.username" disabled />
        </el-form-item>
        <el-form-item label="角色" prop="roles">
          <el-radio-group v-model="roleForm.roles">
            <el-radio v-for="role in roles" :key="role.id" :label="role.id">
              {{ role.name }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleVisible = false">取消</el-button>
        <el-button type="primary" :loading="roleSubmitting" @click="submitRole">保存</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../../utils/request'

const getGenderText = (gender) => {
  return gender === 0 ? '男' : gender === 1 ? '女' : '未知'
}

const getStatusText = (status) => {
  return status === 1 ? '启用' : '禁用'
}

const getStatusType = (status) => {
  return status === 1 ? 'success' : 'info'
}

const getRoleDescription = (roles) => {
  if (!roles || roles.length === 0) {
    return '无角色'
  }
  return roles.map(role => role.description || role.name).join(', ')
}

const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const users = ref([])
const total = ref(0)
const roles = ref([])

const query = ref({
  username: '',
  status: ''
})

const detailVisible = ref(false)
const detail = ref(null)

const editVisible = ref(false)
const editSubmitting = ref(false)
const editFormRef = ref()
const editForm = ref(emptyUserForm())
const editingId = ref(null)

const roleVisible = ref(false)
const roleSubmitting = ref(false)
const roleFormRef = ref()
const roleForm = ref({ username: '', roles: null })
const editingRoleUserId = ref(null)

const formRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }, { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }]
}

function emptyUserForm() {
  return {
    username: '',
    email: '',
    gender: 0,
    status: 1
  }
}

const pagedUsers = computed(() => users.value)

async function fetchUsers() {
  loading.value = true
  try {
    const res = await request.get('/admin/users/list', {
      params: {
        page: currentPage.value,
        limit: pageSize.value
      }
    })

    if (res.data?.code !== 200) {
      ElMessage.error(res.data?.msg || '获取用户列表失败')
      return
    }

    const pageData = res.data?.data
    users.value = pageData?.records || []
    total.value = pageData?.total || 0
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
  } finally {
    loading.value = false
  }
}

async function fetchRoles() {
  try {
    const res = await request.get('/admin/users/roles')
    if (res.data?.code !== 200) {
      ElMessage.error(res.data?.msg || '获取角色列表失败')
      return
    }
    roles.value = res.data?.data || []
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
  }
}

onMounted(async () => {
  await fetchRoles()
  await fetchUsers()
})

function handleSizeChange(size) {
  pageSize.value = size
  currentPage.value = 1
  fetchUsers()
}

function handleCurrentChange(page) {
  currentPage.value = page
  fetchUsers()
}

function onSearch() {
  currentPage.value = 1
  fetchUsers()
}

function onReset() {
  query.value = { username: '', status: '' }
  currentPage.value = 1
  fetchUsers()
}

async function onView(user) {
  detail.value = user
  detailVisible.value = true
}

async function onEdit(user) {
  editingId.value = user.id
  editForm.value = {
    username: user.username || '',
    email: user.email || '',
    gender: user.gender || 0,
    status: user.status || 1
  }
  editVisible.value = true
}

async function onEditRole(user) {
  editingRoleUserId.value = user.id
  roleForm.value = { username: user.username, roles: null }
  
  // 获取用户当前角色
  try {
    const res = await request.get(`/admin/users/role/${user.id}`)
    if (res.data?.code === 200) {
      const userRoles = res.data?.data || []
      roleForm.value.roles = userRoles.length > 0 ? userRoles[0].roleId : null
    }
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '获取用户角色失败')
  }
  
  roleVisible.value = true
}

async function onDelete(user) {
  const name = user?.username || `用户 ${user?.id}`
  try {
    await ElMessageBox.confirm(`确定要删除用户「${name}」吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '下一步',
      cancelButtonText: '取消',
      closeOnClickModal: false
    })
    await ElMessageBox.confirm(
      '删除后数据不可恢复，请再次确认是否删除。',
      '二次确认',
      {
        type: 'error',
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        closeOnClickModal: false
      }
    )
  } catch {
    return
  }

  try {
    const res = await request.delete(`/admin/users/delete/${user.id}`)
    if (res.data?.code !== 200) {
      ElMessage.error(res.data?.msg || '删除失败')
      return
    }
    ElMessage.success('已删除')
    await fetchUsers()
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
  }
}

function resetEditForm() {
  editingId.value = null
  editForm.value = emptyUserForm()
}

async function submitEdit() {
  if (!editFormRef.value || editingId.value == null) return
  await editFormRef.value.validate(async (valid) => {
    if (!valid) return
    editSubmitting.value = true
    try {
      const res = await request.put('/admin/users/update', {
        id: editingId.value,
        ...editForm.value
      })
      if (res.data?.code !== 200) {
        ElMessage.error(res.data?.msg || '保存失败')
        return
      }
      ElMessage.success('已保存')
      editVisible.value = false
      await fetchUsers()
    } catch (e) {
      ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
    } finally {
      editSubmitting.value = false
    }
  })
}

function resetRoleForm() {
  editingRoleUserId.value = null
  roleForm.value = { username: '', roles: null }
}

async function submitRole() {
  if (!editingRoleUserId.value) return
  roleSubmitting.value = true
  try {
    const res = await request.put('/admin/users/role', {
      userId: editingRoleUserId.value,
      roleId: roleForm.value.roles
    })
    if (res.data?.code !== 200) {
      ElMessage.error(res.data?.msg || '保存失败')
      return
    }
    ElMessage.success('已保存')
    roleVisible.value = false
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
  } finally {
    roleSubmitting.value = false
  }
}
</script>

<style scoped>
.dashboard {
  border-radius: 4px;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-bottom: 12px;
}

.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 12px;
}

.title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.pagination-row {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
</style>
