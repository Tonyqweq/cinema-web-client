<template>
    <el-card class="dashboard" shadow="never" :body-style="{ padding: '16px' }">
      <div class="title-row">
        <h2 class="title">影厅列表</h2>
        <el-button type="primary" @click="openAddDialog" :disabled="!selectedCinema">添加影厅</el-button>
      </div>

      <div class="toolbar">
        <el-select
          v-model="selectedCinema"
          placeholder="选择影院"
          clearable
          style="max-width: 320px"
          @change="onCinemaChange"
        >
          <el-option v-for="cinema in cinemas" :key="cinema.id" :label="cinema.name" :value="cinema.id" />
        </el-select>

        <el-input
          v-model.trim="query.name"
          placeholder="搜索影厅"
          clearable
          style="max-width: 320px"
          @keyup.enter="onSearch"
        />

        <el-button type="primary" @click="onSearch">查询</el-button>
        <el-button @click="onReset">重置</el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="pagedHalls"
        border
        style="width: 100%"
        empty-text="暂无影厅"
      >
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="name" label="影厅名称" min-width="150" />
        <el-table-column prop="cinemaName" label="所属影院" min-width="180" />
        <el-table-column prop="type" label="影厅类型" min-width="120" />
        <el-table-column prop="capacity" label="座位数" min-width="100" />

        <el-table-column label="状态" min-width="90">
          <template #default="{ row }">
            <el-tag :type="getHallStatusType(row.status)">
              {{ getHallStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" fixed="right" min-width="200">
          <template #default="{ row }">
            <el-button size="small" @click="onView(row)">详情</el-button>
            <el-button size="small" type="warning" plain @click="onEdit(row)">修改</el-button>
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

      <el-dialog v-model="detailVisible" title="影厅详情" width="720px">
        <el-descriptions v-if="detail" :column="2" border>
          <el-descriptions-item label="ID">{{ detail.id }}</el-descriptions-item>
          <el-descriptions-item label="影厅名称">{{ detail.name }}</el-descriptions-item>
          <el-descriptions-item label="所属影院">{{ detail.cinemaName }}</el-descriptions-item>
          <el-descriptions-item label="影厅类型">{{ detail.type }}</el-descriptions-item>
          <el-descriptions-item label="座位数">{{ detail.capacity }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ getHallStatusText(detail.status) }}</el-descriptions-item>
          <el-descriptions-item label="创建时间" :span="2">{{ detail.createdAt }}</el-descriptions-item>
          <el-descriptions-item label="更新时间" :span="2">{{ detail.updatedAt }}</el-descriptions-item>
        </el-descriptions>
        <template #footer>
          <el-button @click="detailVisible = false">关闭</el-button>
        </template>
      </el-dialog>

      <!-- 添加影厅对话框 -->
      <el-dialog v-model="addVisible" title="添加影厅" width="640px" destroy-on-close @closed="resetAddForm">
        <el-form ref="addFormRef" :model="addForm" :rules="formRules" label-width="100px">
          <el-form-item label="影院" prop="cinemaId" required>
            <el-select v-model="addForm.cinemaId" placeholder="选择影院" style="width: 100%" :disabled="selectedCinema">
              <el-option v-for="cinema in cinemas" :key="cinema.id" :label="cinema.name" :value="cinema.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="影厅名称" prop="name" required>
            <el-input v-model.trim="addForm.name" placeholder="必填" clearable />
          </el-form-item>
          <el-form-item label="影厅类型" prop="type">
            <el-input v-model.trim="addForm.type" placeholder="如：IMAX、3D、2D、4DX等" clearable />
          </el-form-item>
          <el-form-item label="座位数" prop="capacity" required>
            <el-input v-model.number="addForm.capacity" type="number" placeholder="必填" min="1" />
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-radio-group v-model="addForm.status">
              <el-radio :label="1">正常营业</el-radio>
              <el-radio :label="0">暂停营业</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="addVisible = false">取消</el-button>
          <el-button type="primary" :loading="addSubmitting" @click="submitAdd">保存</el-button>
        </template>
      </el-dialog>

      <!-- 修改对话框 -->
      <el-dialog v-model="editVisible" title="修改影厅" width="640px" destroy-on-close @closed="resetEditForm">
        <el-form ref="editFormRef" :model="editForm" :rules="formRules" label-width="100px">
          <el-form-item label="影院" prop="cinemaId" required>
            <el-select v-model="editForm.cinemaId" placeholder="选择影院" style="width: 100%">
              <el-option v-for="cinema in cinemas" :key="cinema.id" :label="cinema.name" :value="cinema.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="影厅名称" prop="name" required>
            <el-input v-model.trim="editForm.name" placeholder="必填" clearable />
          </el-form-item>
          <el-form-item label="影厅类型" prop="type">
            <el-input v-model.trim="editForm.type" placeholder="如：IMAX、3D、2D、4DX等" clearable />
          </el-form-item>
          <el-form-item label="座位数" prop="capacity" required>
            <el-input v-model.number="editForm.capacity" type="number" placeholder="必填" min="1" />
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-radio-group v-model="editForm.status">
              <el-radio :label="1">正常营业</el-radio>
              <el-radio :label="0">暂停营业</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="editVisible = false">取消</el-button>
          <el-button type="primary" :loading="editSubmitting" @click="submitEdit">保存</el-button>
        </template>
      </el-dialog>
    </el-card>
  </template>

  <script setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import request from '../../utils/request'

  const HALL_STATUS_CONFIG = {
    0: { text: '暂停营业', type: 'info' },
    1: { text: '正常营业', type: 'success' }
  }

  const getHallStatusText = (status) => HALL_STATUS_CONFIG[status]?.text || '未知'
  const getHallStatusType = (status) => HALL_STATUS_CONFIG[status]?.type || 'info'

  const loading = ref(false)
  const currentPage = ref(1)
  const pageSize = ref(10)
  const halls = ref([])
  const total = ref(0)
  const cinemas = ref([])
  const selectedCinema = ref(null)

  const query = ref({
    name: ''
  })

  const detailVisible = ref(false)
  const detail = ref(null)

  const addVisible = ref(false)
  const addSubmitting = ref(false)
  const addFormRef = ref()
  const addForm = ref(emptyHallForm())

  const editVisible = ref(false)
  const editSubmitting = ref(false)
  const editFormRef = ref()
  const editForm = ref(emptyHallForm())
  const editingId = ref(null)

  const formRules = {
    cinemaId: [{ required: true, message: '请选择影院', trigger: 'blur' }],
    name: [{ required: true, message: '请输入影厅名称', trigger: 'blur' }],
    capacity: [{ required: true, message: '请输入座位数', trigger: 'blur' }, { type: 'number', min: 1, message: '座位数必须大于0', trigger: 'blur' }]
  }

  function emptyHallForm() {
    return {
      cinemaId: selectedCinema.value || '',
      name: '',
      type: '',
      capacity: '',
      status: 1
    }
  }

  const pagedHalls = computed(() => halls.value)

  async function fetchCinemas() {
    try {
      const res = await request.get('/cinemas', {
        params: {
          page: 1,
          pageSize: 1000
        }
      })

      if (res.data?.code !== 200) {
        ElMessage.error(res.data?.msg || '获取影院列表失败')
        return
      }

      cinemas.value = res.data?.data?.records || []
    } catch (e) {
      ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
    }
  }

  async function fetchHalls() {
    loading.value = true
    try {
      const res = await request.get('/halls', {
        params: {
          page: currentPage.value,
          pageSize: pageSize.value,
          cinemaId: selectedCinema.value || undefined,
          name: query.value.name || undefined
        }
      })

      if (res.data?.code !== 200) {
        ElMessage.error(res.data?.msg || '获取影厅列表失败')
        return
      }

      const pageData = res.data?.data
      halls.value = pageData?.records || []
      total.value = pageData?.total || 0
    } catch (e) {
      ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    fetchCinemas()
  })

  function handleSizeChange(size) {
    pageSize.value = size
    currentPage.value = 1
    fetchHalls()
  }

  function handleCurrentChange(page) {
    currentPage.value = page
    fetchHalls()
  }

  function onCinemaChange() {
    currentPage.value = 1
    fetchHalls()
  }

  function onSearch() {
    currentPage.value = 1
    fetchHalls()
  }

  function onReset() {
    query.value = { name: '' }
    currentPage.value = 1
    fetchHalls()
  }

  async function onView(hall) {
    try {
      const res = await request.get(`/halls/${hall.id}`)
      if (res.data?.code !== 200) {
        ElMessage.error(res.data?.msg || '获取详情失败')
        return
      }
      detail.value = res.data?.data
      detailVisible.value = true
    } catch (e) {
      ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
    }
  }

  function openAddDialog() {
    addForm.value = emptyHallForm()
    addVisible.value = true
  }

  function resetAddForm() {
    addForm.value = emptyHallForm()
  }

  async function submitAdd() {
    if (!addFormRef.value) return
    await addFormRef.value.validate(async (valid) => {
      if (!valid) return
      addSubmitting.value = true
      try {
        const res = await request.post('/halls', addForm.value)
        if (res.data?.code !== 200) {
          ElMessage.error(res.data?.msg || '添加失败')
          return
        }
        ElMessage.success('添加成功')
        addVisible.value = false
        await fetchHalls()
      } catch (e) {
        ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
      } finally {
        addSubmitting.value = false
      }
    })
  }

  async function onEdit(hall) {
    editingId.value = hall.id
    try {
      const res = await request.get(`/halls/${hall.id}`)
      if (res.data?.code !== 200) {
        ElMessage.error(res.data?.msg || '获取影厅失败')
        return
      }
      const h = res.data?.data

      editForm.value = {
        cinemaId: h.cinemaId || '',
        name: h.name || '',
        type: h.type || '',
        capacity: h.capacity || '',
        status: h.status || 1
      }

      editVisible.value = true
    } catch (e) {
      ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
    }
  }

  async function onDelete(hall) {
    const name = hall?.name || `编号 ${hall?.id}`
    try {
      await ElMessageBox.confirm(`确定要删除影厅「${name}」吗？`, '删除确认', {
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
      const res = await request.delete(`/halls/${hall.id}`)
      if (res.data?.code !== 200) {
        ElMessage.error(res.data?.msg || '删除失败')
        return
      }
      ElMessage.success('已删除')
      await fetchHalls()
    } catch (e) {
      ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
    }
  }

  function resetEditForm() {
    editingId.value = null
    editForm.value = emptyHallForm()
  }

  async function submitEdit() {
    if (!editFormRef.value || editingId.value == null) return
    await editFormRef.value.validate(async (valid) => {
      if (!valid) return
      editSubmitting.value = true
      try {
        const res = await request.put(`/halls/${editingId.value}`, editForm.value)
        if (res.data?.code !== 200) {
          ElMessage.error(res.data?.msg || '保存失败')
          return
        }
        ElMessage.success('已保存')
        editVisible.value = false
        await fetchHalls()
      } catch (e) {
        ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
      } finally {
        editSubmitting.value = false
      }
    })
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
