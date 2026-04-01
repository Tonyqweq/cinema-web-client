<template>
    <el-card class="dashboard" shadow="never" :body-style="{ padding: '16px' }">
      <div class="title-row">
        <h2 class="title">影院列表</h2>
        <el-button type="primary" @click="openAddDialog">添加影院</el-button>
      </div>

      <div class="toolbar">
        <el-input
          v-model.trim="query.name"
          placeholder="搜索电影院"
          clearable
          style="max-width: 320px"
          @keyup.enter="onSearch"
        />

        <el-select
          v-model="query.province"
          placeholder="选择省份"
          clearable
          style="width: 140px"
          @change="onSearch"
        >
          <el-option v-for="p in provinces" :key="p.value" :label="p.label" :value="p.value" />
        </el-select>

        <el-select
          v-model="query.city"
          placeholder="选择城市"
          clearable
          style="width: 140px"
          :disabled="!query.province"
          @change="onSearch"
        >
          <el-option v-for="c in cities" :key="c.value" :label="c.label" :value="c.value" />
        </el-select>

        <el-select
          v-model="query.district"
          placeholder="选择区县"
          clearable
          style="width: 140px"
          :disabled="!query.city"
          @change="onSearch"
        >
          <el-option v-for="d in districts" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>

        <el-button type="primary" @click="onSearch">查询</el-button>
        <el-button @click="onReset">重置</el-button>
      </div>
  
      <el-table
        v-loading="loading"
        :data="pagedCinemas"
        border
        style="width: 100%"
        empty-text="暂无影院"
      >
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="name" label="影院名称" min-width="150" />
        <el-table-column prop="phone" label="电话" min-width="160" />
        <el-table-column prop="province" label="省份" min-width="110" />
        <el-table-column prop="city" label="城市" min-width="110" />
        <el-table-column prop="district" label="区县" min-width="110" />
        <el-table-column prop="address" label="详细地址" min-width="280" />
  
        <el-table-column label="状态" min-width="90">
          <template #default="{ row }">
            <el-tag :type="getCinemaStatusType(row.status)">
              {{ getCinemaStatusText(row.status) }}
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
  
      <el-dialog v-model="detailVisible" title="影院详情" width="720px">
        <el-descriptions v-if="detail" :column="2" border>
          <el-descriptions-item label="ID">{{ detail.id }}</el-descriptions-item>
          <el-descriptions-item label="影院名称">{{ detail.name }}</el-descriptions-item>
          <el-descriptions-item label="电话">{{ detail.phone }}</el-descriptions-item>
          <el-descriptions-item label="省份">{{ detail.province }}</el-descriptions-item>
          <el-descriptions-item label="城市">{{ detail.city }}</el-descriptions-item>
          <el-descriptions-item label="区县">{{ detail.district }}</el-descriptions-item>
          <el-descriptions-item label="详细地址">{{ detail.address }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ getCinemaStatusText(detail.status) }}</el-descriptions-item>
          <el-descriptions-item label="纬度" :span="2">{{ detail.latitude }}</el-descriptions-item>
          <el-descriptions-item label="经度" :span="2">{{ detail.longitude }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ detail.created_at }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ detail.updated_at }}</el-descriptions-item>
        </el-descriptions>
        <template #footer>
          <el-button @click="detailVisible = false">关闭</el-button>
        </template>
      </el-dialog>

      <!-- 添加影院对话框 -->
      <el-dialog v-model="addVisible" title="添加影院" width="640px" destroy-on-close @closed="resetAddForm">
        <el-tabs v-model="addTab">
          <el-tab-pane label="逐条录入" name="single">
            <el-form ref="addFormRef" :model="addForm" :rules="formRules" label-width="100px">
              <el-form-item label="影院名称" prop="name" required>
                <el-input v-model.trim="addForm.name" placeholder="必填" clearable />
              </el-form-item>
              <el-form-item label="电话" prop="phone">
                <el-input v-model.trim="addForm.phone" clearable />
              </el-form-item>
              <el-form-item label="省份" prop="province" required>
                <el-select v-model="addForm.province" placeholder="选择省份" clearable style="width: 100%">
                  <el-option v-for="p in provinces" :key="p.value" :label="p.label" :value="p.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="城市" prop="city" required>
                <el-select v-model="addForm.city" placeholder="选择城市" clearable :disabled="!addForm.province" style="width: 100%">
                  <el-option v-for="c in addCities" :key="c.value" :label="c.label" :value="c.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="区县" prop="district" required>
                <el-select v-model="addForm.district" placeholder="选择区县" clearable :disabled="!addForm.city" style="width: 100%">
                  <el-option v-for="d in addDistricts" :key="d.value" :label="d.label" :value="d.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="详细地址" prop="address" required>
                <el-input v-model="addForm.address" type="textarea" :rows="3" />
              </el-form-item>
              <el-form-item label="纬度" prop="latitude">
                <el-input v-model.trim="addForm.latitude" clearable />
              </el-form-item>
              <el-form-item label="经度" prop="longitude">
                <el-input v-model.trim="addForm.longitude" clearable />
              </el-form-item>
            </el-form>
          </el-tab-pane>
        </el-tabs>
        <template #footer>
          <el-button @click="addVisible = false">取消</el-button>
          <el-button type="primary" :loading="addSubmitting" @click="submitAddSingle">保存</el-button>
        </template>
      </el-dialog>

      <!-- 修改对话框 -->
      <el-dialog v-model="editVisible" title="修改影院" width="640px" destroy-on-close @closed="resetEditForm">
        <el-form ref="editFormRef" :model="editForm" :rules="formRules" label-width="100px">
          <el-form-item label="影院名称" prop="name" required>
          <el-input v-model.trim="editForm.name" placeholder="必填" clearable />
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model.trim="editForm.phone" clearable />
        </el-form-item>
        <el-form-item label="省份" prop="province" required>
          <el-select v-model="editForm.province" placeholder="选择省份" clearable style="width: 100%">
            <el-option v-for="p in provinces" :key="p.value" :label="p.label" :value="p.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="城市" prop="city" required>
          <el-select v-model="editForm.city" placeholder="选择城市" clearable :disabled="!editForm.province" style="width: 100%">
            <el-option v-for="c in editCities" :key="c.value" :label="c.label" :value="c.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="区县" prop="district" required>
          <el-select v-model="editForm.district" placeholder="选择区县" clearable :disabled="!editForm.city" style="width: 100%">
            <el-option v-for="d in editDistricts" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="详细地址" prop="address" required>
          <el-input v-model="editForm.address" type="textarea" :rows="3" />
        </el-form-item>
          <el-form-item label="纬度" prop="latitude">
            <el-input v-model.trim="editForm.latitude" clearable />
          </el-form-item>
          <el-form-item label="经度" prop="longitude">
            <el-input v-model.trim="editForm.longitude" clearable />
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
import { regionData } from '../../utils/regionData'
  
  const CINEMA_STATUS_CONFIG = {
    0: { text: '暂停营业', type: 'info' },
    1: { text: '正常营业', type: 'success' }
  }
  
  const getCinemaStatusText = (status) => CINEMA_STATUS_CONFIG[status]?.text || '未知'
  const getCinemaStatusType = (status) => CINEMA_STATUS_CONFIG[status]?.type || 'info'

  const loading = ref(false)
  const currentPage = ref(1)
  const pageSize = ref(10)
  const cinemas = ref([])
  const total = ref(0)

  const query = ref({
    name: '',
    province: '',
    city: '',
    district: ''
  })

  // 省市区数据
  const provinces = ref(regionData.provinces)
  const cities = ref([])
  const districts = ref([])

  // 城市数据
  const cityData = regionData.cities

  // 区县数据
  const districtData = regionData.districts

  // 监听省份变化
  watch(() => query.value.province, (newProvince) => {
    if (newProvince) {
      cities.value = cityData[newProvince] || []
      query.value.city = ''
      query.value.district = ''
      districts.value = []
    } else {
      cities.value = []
      districts.value = []
    }
  })

  // 监听城市变化
  watch(() => query.value.city, (newCity) => {
    if (newCity) {
      districts.value = districtData[newCity] || []
      query.value.district = ''
    } else {
      districts.value = []
    }
  })

  const detailVisible = ref(false)
  const detail = ref(null)

  const addVisible = ref(false)
  const addTab = ref('single')
  const addSubmitting = ref(false)
  const importSubmitting = ref(false)
  const importFile = ref(null)
  const addFormRef = ref()
  const addForm = ref(emptyCinemaForm())
  const addCities = ref([])
  const addDistricts = ref([])

  const editVisible = ref(false)
  const editSubmitting = ref(false)
  const editFormRef = ref()
  const editForm = ref(emptyCinemaForm())
  const editingId = ref(null)
  const editCities = ref([])
  const editDistricts = ref([])
  const isInitializingEdit = ref(false)

  // 监听修改表单中的省份变化
  watch(() => editForm.value.province, (newProvince) => {
    if (newProvince) {
      editCities.value = cityData[newProvince] || []
      if (!isInitializingEdit.value) {
        editForm.value.city = ''
        editForm.value.district = ''
        editDistricts.value = []
      }
    } else {
      editCities.value = []
      editDistricts.value = []
    }
  })

  // 监听修改表单中的城市变化
  watch(() => editForm.value.city, (newCity) => {
    if (newCity) {
      editDistricts.value = districtData[newCity] || []
      if (!isInitializingEdit.value) {
        editForm.value.district = ''
      }
    } else {
      editDistricts.value = []
    }
  })

  // 监听添加表单中的省份变化
  watch(() => addForm.value.province, (newProvince) => {
    if (newProvince) {
      addCities.value = cityData[newProvince] || []
      addForm.value.city = ''
      addForm.value.district = ''
      addDistricts.value = []
    } else {
      addCities.value = []
      addDistricts.value = []
    }
  })

  // 监听添加表单中的城市变化
  watch(() => addForm.value.city, (newCity) => {
    if (newCity) {
      addDistricts.value = districtData[newCity] || []
      addForm.value.district = ''
    } else {
      addDistricts.value = []
    }
  })

  const formRules = {
    name: [{ required: true, message: '请输入影院名称', trigger: 'blur' }],
    province: [{ required: true, message: '请选择省份', trigger: 'blur' }],
    city: [{ required: true, message: '请选择城市', trigger: 'blur' }],
    district: [{ required: true, message: '请选择区县', trigger: 'blur' }],
    address: [{ required: true, message: '请输入详细地址', trigger: 'blur' }]
  }

  function emptyCinemaForm() {
    return {
      name: '',
      phone: '',
      province: '',
      city: '',
      district: '',
      address: '',
      latitude: '',
      longitude: '',
      status: 1
    }
  }

  const pagedCinemas = computed(() => cinemas.value)

  async function fetchCinemas() {
    loading.value = true
    try {
      const res = await request.get('/cinemas', {
        params: {
          page: currentPage.value,
          pageSize: pageSize.value,
          name: query.value.name || undefined,
          province: query.value.province || undefined,
          city: query.value.city || undefined,
          district: query.value.district || undefined
        }
      })

      if (res.data?.code !== 200) {
        ElMessage.error(res.data?.msg || '获取影院列表失败')
        return
      }

      const pageData = res.data?.data
      cinemas.value = pageData?.records || []
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
    fetchCinemas()
  }

  function handleCurrentChange(page) {
    currentPage.value = page
    fetchCinemas()
  }

  function onSearch() {
    currentPage.value = 1
    fetchCinemas()
  }

  function onReset() {
    query.value = { name: '', province: '', city: '', district: '' }
    currentPage.value = 1
    fetchCinemas()
  }

  async function onView(cinema) {
    try {
      const res = await request.get(`/cinemas/${cinema.id}`)
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
    addTab.value = 'single'
    importFile.value = null
    addForm.value = emptyCinemaForm()
    addVisible.value = true
  }
  
  function resetAddForm() {
    addForm.value = emptyCinemaForm()
    importFile.value = null
    addTab.value = 'single'
  }
  
  function onImportFileChange(uploadFile) {
    importFile.value = uploadFile?.raw || null
  }
  
  function payloadFromForm(f) {
    return {
      title: f.title,
      original_title: f.original_title || undefined,
      language: f.language || undefined,
      country: f.country || undefined,
      duration_min: f.duration_min ?? undefined,
      release_date: f.release_date || undefined,
      description: f.description || undefined,
      poster_url: f.poster_url || undefined,
      trailer_url: f.trailer_url || undefined
    }
  }
  
  async function submitAddSingle() {
    if (!addFormRef.value) return
    await addFormRef.value.validate(async (valid) => {
      if (!valid) return
      addSubmitting.value = true
      try {
        const res = await request.post('/cinemas', addForm.value)
        if (res.data?.code !== 200) {
          ElMessage.error(res.data?.msg || '添加失败')
          return
        }
        ElMessage.success('添加成功')
        addVisible.value = false
        await fetchCinemas()
      } catch (e) {
        ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
      } finally {
        addSubmitting.value = false
      }
    })
  }
  
  async function submitImport() {
    // if (!importFile.value) {
    //   ElMessage.warning('请先选择 Excel 文件')
    //   return
    // }
    // importSubmitting.value = true
    // try {
    //   const fd = new FormData()
    //   fd.append('file', importFile.value)
    //   const res = await request.post('/movies/import', fd)
    //   if (res.data?.code !== 200) {
    //     ElMessage.error(res.data?.msg || '导入失败')
    //     return
    //   }
    //   const r = res.data?.data
    //   const ok = r?.successCount ?? 0
    //   const bad = r?.failCount ?? 0
    //   ElMessage.success(`导入完成：成功 ${ok} 条，失败 ${bad} 条`)
    //   if (r?.errors?.length) {
    //     console.warn(r.errors)
    //   }
    //   addVisible.value = false
    //   await fetchFilters()
    //   await fetchMovies()
    // } catch (e) {
    //   ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
    // } finally {
    //   importSubmitting.value = false
    // }
  }
  
  async function onEdit(cinema) {
    editingId.value = cinema.id
    try {
      const res = await request.get(`/cinemas/${cinema.id}`)
      if (res.data?.code !== 200) {
        ElMessage.error(res.data?.msg || '获取影院失败')
        return
      }
      const c = res.data?.data
      
      // 设置初始化标志
      isInitializingEdit.value = true
      
      // 手动初始化城市和区县数据
      if (c.province) {
        editCities.value = cityData[c.province] || []
        if (c.city) {
          editDistricts.value = districtData[c.city] || []
        }
      }
      
      // 一次性设置所有字段，包括省市区
      editForm.value = {
        name: c.name || '',
        phone: c.phone || '',
        province: c.province || '',
        city: c.city || '',
        district: c.district || '',
        address: c.address || '',
        latitude: c.latitude || '',
        longitude: c.longitude || '',
        status: c.status || 1
      }
      
      editVisible.value = true
      
      // 初始化完成后，重置标志
      setTimeout(() => {
        isInitializingEdit.value = false
      }, 0)
    } catch (e) {
      ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
      // 出错时也要重置标志
      isInitializingEdit.value = false
    }
  }

  async function onDelete(cinema) {
    const name = cinema?.name || `编号 ${cinema?.id}`
    try {
      await ElMessageBox.confirm(`确定要删除影院「${name}」吗？`, '删除确认', {
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
      const res = await request.delete(`/cinemas/${cinema.id}`)
      if (res.data?.code !== 200) {
        ElMessage.error(res.data?.msg || '删除失败')
        return
      }
      ElMessage.success('已删除')
      await fetchCinemas()
    } catch (e) {
      ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
    }
  }
  
  
  function formatDateField(v) {
    // if (!v) return ''
    // if (typeof v === 'string') return v.length >= 10 ? v.slice(0, 10) : v
    // return String(v)
  }
  
  function resetEditForm() {
    editingId.value = null
    editForm.value = emptyCinemaForm()
  }
  
  async function submitEdit() {
    if (!editFormRef.value || editingId.value == null) return
    await editFormRef.value.validate(async (valid) => {
      if (!valid) return
      editSubmitting.value = true
      try {
        const res = await request.put(`/cinemas/${editingId.value}`, editForm.value)
        if (res.data?.code !== 200) {
          ElMessage.error(res.data?.msg || '保存失败')
          return
        }
        ElMessage.success('已保存')
        editVisible.value = false
        await fetchCinemas()
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
  
  .hint {
    margin: 0 0 12px;
    font-size: 13px;
    color: #606266;
    line-height: 1.5;
  }
  
  .hint code {
    font-size: 12px;
    word-break: break-all;
  }
  </style>
  