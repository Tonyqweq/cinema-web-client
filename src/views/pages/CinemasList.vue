<template>
    <el-card class="dashboard" shadow="never" :body-style="{ padding: '16px' }">
      <div class="title-row">
        <h2 class="title">影片列表</h2>
        <el-button type="primary" @click="openAddDialog">添加影片</el-button>
      </div>
  
      <div class="toolbar">
        <el-input
          v-model.trim="query.title"
          placeholder="搜索电影名（title）"
          clearable
          style="max-width: 320px"
          @keyup.enter="onSearch"
        />
  
        <el-select
          v-model="query.language"
          placeholder="语言"
          clearable
          style="width: 160px"
          filterable
          @change="onSearch"
        >
          <el-option v-for="l in languages" :key="l" :label="l" :value="l" />
        </el-select>
  
        <el-select
          v-model="query.country"
          placeholder="国家地区"
          clearable
          style="width: 180px"
          filterable
          @change="onSearch"
        >
          <el-option v-for="c in countries" :key="c" :label="c" :value="c" />
        </el-select>
  
        <el-select v-model="query.sortBy" placeholder="排序字段" clearable style="width: 160px" @change="onSearch">
          <el-option label="时长" value="duration_min" />
          <el-option label="上映日期" value="release_date" />
        </el-select>
  
        <el-select
          v-model="query.sortOrder"
          placeholder="排序方式"
          style="width: 140px"
          :disabled="!query.sortBy"
          @change="onSearch"
        >
          <el-option label="降序" value="desc" />
          <el-option label="升序" value="asc" />
        </el-select>
  
        <el-button type="primary" @click="onSearch">查询</el-button>
        <el-button @click="onReset">重置</el-button>
      </div>
  
      <el-table
        v-loading="loading"
        :data="pagedMovies"
        border
        style="width: 100%"
        empty-text="暂无影片"
      >
        <el-table-column type="index" label="序号" width="80" />
        <el-table-column prop="title" label="电影名称" min-width="140" />
        <el-table-column prop="original_title" label="英文名/原名" min-width="160" />
        <el-table-column prop="language" label="语言" min-width="110" />
        <el-table-column prop="country" label="国家地区" min-width="140" />
        <el-table-column prop="duration_min" label="时长 (分钟)" min-width="120" />
        <el-table-column prop="release_date" label="上映日期" min-width="130" />
  
        <el-table-column label="状态" min-width="90">
          <template #default="{ row }">
            <el-tag :type="getMovieStatusType(row.status)">
              {{ getMovieStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
  
        <el-table-column label="操作" fixed="right" min-width="300">
          <template #default="{ row }">
            <el-button size="small" @click="onView(row)">详情</el-button>
            <el-button size="small" type="warning" plain @click="onEdit(row)">修改</el-button>
            <el-button size="small" type="primary" plain @click="onAction(row)">
              {{ row.status === 1 ? '下架' : '上架' }}
            </el-button>
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
  
      <el-dialog v-model="detailVisible" title="影片详情" width="720px">
        <el-descriptions v-if="detail" :column="2" border>
          <el-descriptions-item label="ID">{{ detail.id }}</el-descriptions-item>
          <el-descriptions-item label="电影名称">{{ detail.title }}</el-descriptions-item>
          <el-descriptions-item label="原名">{{ detail.original_title }}</el-descriptions-item>
          <el-descriptions-item label="语言">{{ detail.language }}</el-descriptions-item>
          <el-descriptions-item label="国家地区">{{ detail.country }}</el-descriptions-item>
          <el-descriptions-item label="时长(分钟)">{{ detail.duration_min }}</el-descriptions-item>
          <el-descriptions-item label="上映日期">{{ detail.release_date }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ getMovieStatusText(detail.status) }}</el-descriptions-item>
          <el-descriptions-item label="海报URL" :span="2">{{ detail.poster_url }}</el-descriptions-item>
          <el-descriptions-item label="预告片URL" :span="2">{{ detail.trailer_url }}</el-descriptions-item>
          <el-descriptions-item label="简介" :span="2">{{ detail.description }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ detail.created_at }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ detail.updated_at }}</el-descriptions-item>
        </el-descriptions>
        <template #footer>
          <el-button @click="detailVisible = false">关闭</el-button>
        </template>
      </el-dialog>
  
      <!-- 添加：单条 / Excel -->
      <el-dialog v-model="addVisible" title="添加影片" width="640px" destroy-on-close @closed="resetAddForm">
        <el-tabs v-model="addTab">
          <el-tab-pane label="逐条录入" name="single">
            <el-form ref="addFormRef" :model="addForm" :rules="formRules" label-width="100px">
              <el-form-item label="电影名称" prop="title">
                <el-input v-model.trim="addForm.title" placeholder="必填" clearable />
              </el-form-item>
              <el-form-item label="原名" prop="original_title">
                <el-input v-model.trim="addForm.original_title" clearable />
              </el-form-item>
              <el-form-item label="语言" prop="language">
                <el-select v-model="addForm.language" placeholder="选择语言" clearable filterable style="width: 100%">
                  <el-option v-for="x in languageOptionsFor(addForm.language)" :key="x" :label="x" :value="x" />
                </el-select>
              </el-form-item>
              <el-form-item label="国家地区" prop="country">
                <el-select v-model="addForm.country" placeholder="选择国家地区" clearable filterable style="width: 100%">
                  <el-option v-for="x in countryOptionsFor(addForm.country)" :key="x" :label="x" :value="x" />
                </el-select>
              </el-form-item>
              <el-form-item label="时长(分)" prop="duration_min">
                <el-input-number v-model="addForm.duration_min" :min="0" :step="1" controls-position="right" style="width: 100%" />
              </el-form-item>
              <el-form-item label="上映日期" prop="release_date">
                <el-input v-model.trim="addForm.release_date" placeholder="yyyy-MM-dd，可选" clearable />
              </el-form-item>
              <el-form-item label="简介" prop="description">
                <el-input v-model="addForm.description" type="textarea" :rows="3" />
              </el-form-item>
              <el-form-item label="海报URL" prop="poster_url">
                <el-input v-model.trim="addForm.poster_url" clearable />
              </el-form-item>
              <el-form-item label="预告片URL" prop="trailer_url">
                <el-input v-model.trim="addForm.trailer_url" clearable />
              </el-form-item>
            </el-form>
          </el-tab-pane>
          <el-tab-pane label="Excel 导入" name="excel">
            <p class="hint">
              支持 .xlsx / .xls。首行可为表头：
              <code>title, original_title, language, country, duration_min, release_date, description, poster_url, trailer_url</code>
              ；也可省略表头，按上述列顺序从第一行开始填写。无需填写 id。
            </p>
            <el-upload
              drag
              :auto-upload="false"
              :limit="1"
              accept=".xlsx,.xls"
              :on-change="onImportFileChange"
              :on-remove="() => (importFile = null)"
            >
              <div class="el-upload__text">将文件拖到此处，或 <em>点击选择</em></div>
            </el-upload>
          </el-tab-pane>
        </el-tabs>
        <template #footer>
          <el-button @click="addVisible = false">取消</el-button>
          <el-button v-if="addTab === 'single'" type="primary" :loading="addSubmitting" @click="submitAddSingle">保存</el-button>
          <el-button v-else type="primary" :loading="importSubmitting" @click="submitImport">开始导入</el-button>
        </template>
      </el-dialog>
  
      <!-- 修改（不可改 id、status） -->
      <el-dialog v-model="editVisible" title="修改影片" width="640px" destroy-on-close @closed="resetEditForm">
        <el-form ref="editFormRef" :model="editForm" :rules="formRules" label-width="100px">
          <el-form-item label="电影名称" prop="title">
            <el-input v-model.trim="editForm.title" placeholder="必填" clearable />
          </el-form-item>
          <el-form-item label="原名" prop="original_title">
            <el-input v-model.trim="editForm.original_title" clearable />
          </el-form-item>
          <el-form-item label="语言" prop="language">
            <el-select v-model="editForm.language" placeholder="选择语言" clearable filterable style="width: 100%">
              <el-option v-for="x in languageOptionsFor(editForm.language)" :key="x" :label="x" :value="x" />
            </el-select>
          </el-form-item>
          <el-form-item label="国家地区" prop="country">
            <el-select v-model="editForm.country" placeholder="选择国家地区" clearable filterable style="width: 100%">
              <el-option v-for="x in countryOptionsFor(editForm.country)" :key="x" :label="x" :value="x" />
            </el-select>
          </el-form-item>
          <el-form-item label="时长(分)" prop="duration_min">
            <el-input-number v-model="editForm.duration_min" :min="0" :step="1" controls-position="right" style="width: 100%" />
          </el-form-item>
          <el-form-item label="上映日期" prop="release_date">
            <el-input v-model.trim="editForm.release_date" placeholder="yyyy-MM-dd，可选" clearable />
          </el-form-item>
          <el-form-item label="简介" prop="description">
            <el-input v-model="editForm.description" type="textarea" :rows="3" />
          </el-form-item>
          <el-form-item label="海报URL" prop="poster_url">
            <el-input v-model.trim="editForm.poster_url" clearable />
          </el-form-item>
          <el-form-item label="预告片URL" prop="trailer_url">
            <el-input v-model.trim="editForm.trailer_url" clearable />
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
  import { computed, onMounted, ref } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import request from '../../utils/request'
  
  const MOVIE_STATUS_CONFIG = {
    0: { text: '下架', type: 'info' },
    1: { text: '正常', type: 'success' }
  }
  
  const getMovieStatusText = (status) => MOVIE_STATUS_CONFIG[status]?.text || '未知'
  const getMovieStatusType = (status) => MOVIE_STATUS_CONFIG[status]?.type || 'info'
  
  const loading = ref(false)
  const currentPage = ref(1)
  const pageSize = ref(10)
  const movies = ref([])
  const total = ref(0)
  const languages = ref([])
  const countries = ref([])
  
  const query = ref({
    title: '',
    language: '',
    country: '',
    sortBy: '',
    sortOrder: 'desc'
  })
  
  const detailVisible = ref(false)
  const detail = ref(null)
  
  const addVisible = ref(false)
  const addTab = ref('single')
  const addSubmitting = ref(false)
  const importSubmitting = ref(false)
  const importFile = ref(null)
  const addFormRef = ref()
  const addForm = ref(emptyMovieForm())
  
  const editVisible = ref(false)
  const editSubmitting = ref(false)
  const editFormRef = ref()
  const editForm = ref(emptyMovieForm())
  const editingId = ref(null)
  
  const formRules = {
    title: [{ required: true, message: '请输入电影名称', trigger: 'blur' }]
  }
  
  function emptyMovieForm() {
    return {
      title: '',
      original_title: '',
      language: '',
      country: '',
      duration_min: undefined,
      release_date: '',
      description: '',
      poster_url: '',
      trailer_url: ''
    }
  }
  
  function languageOptionsFor(current) {
    const s = new Set((languages.value || []).filter(Boolean))
    if (current) s.add(current)
    return [...s]
  }
  
  function countryOptionsFor(current) {
    const s = new Set((countries.value || []).filter(Boolean))
    if (current) s.add(current)
    return [...s]
  }
  
  const pagedMovies = computed(() => movies.value)
  
  async function fetchFilters() {
    try {
      const res = await request.get('/movies/filters')
      if (res.data?.code !== 200) return
      languages.value = res.data?.data?.languages || []
      countries.value = res.data?.data?.countries || []
    } catch {
      // ignore
    }
  }
  
  async function fetchMovies() {
    loading.value = true
    try {
      const res = await request.get('/movies', {
        params: {
          page: currentPage.value,
          pageSize: pageSize.value,
          title: query.value.title || undefined,
          language: query.value.language || undefined,
          country: query.value.country || undefined,
          sortBy: query.value.sortBy || undefined,
          sortOrder: query.value.sortBy ? (query.value.sortOrder || 'desc') : undefined
        }
      })
  
      if (res.data?.code !== 200) {
        ElMessage.error(res.data?.msg || '获取影片列表失败')
        return
      }
  
      const pageData = res.data?.data
      movies.value = pageData?.records || []
      total.value = pageData?.total || 0
    } catch (e) {
      ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
    } finally {
      loading.value = false
    }
  }
  
  onMounted(() => {
    fetchFilters()
    fetchMovies()
  })
  
  function handleSizeChange(size) {
    pageSize.value = size
    currentPage.value = 1
    fetchMovies()
  }
  
  function handleCurrentChange(page) {
    currentPage.value = page
    fetchMovies()
  }
  
  function onSearch() {
    currentPage.value = 1
    fetchMovies()
  }
  
  function onReset() {
    query.value = { title: '', language: '', country: '', sortBy: '', sortOrder: 'desc' }
    currentPage.value = 1
    fetchMovies()
  }
  
  async function onView(movie) {
    try {
      const res = await request.get(`/movies/${movie.id}`)
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
  
  async function onAction(movie) {
    const nextStatus = movie.status === 1 ? 0 : 1
    const actionText = nextStatus === 1 ? '上架' : '下架'
  
    try {
      const res = await request.put(`/movies/${movie.id}/status`, {
        status: nextStatus
      })
      if (res.data?.code !== 200) {
        ElMessage.error(res.data?.msg || '更新状态失败')
        return
      }
      ElMessage.success(`${actionText}成功`)
      await fetchMovies()
    } catch (e) {
      ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
    }
  }
  
  function openAddDialog() {
    addTab.value = 'single'
    importFile.value = null
    addForm.value = emptyMovieForm()
    addVisible.value = true
  }
  
  function resetAddForm() {
    addForm.value = emptyMovieForm()
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
        const res = await request.post('/movies', payloadFromForm(addForm.value))
        if (res.data?.code !== 200) {
          ElMessage.error(res.data?.msg || '添加失败')
          return
        }
        ElMessage.success('添加成功')
        addVisible.value = false
        await fetchFilters()
        await fetchMovies()
      } catch (e) {
        ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
      } finally {
        addSubmitting.value = false
      }
    })
  }
  
  async function submitImport() {
    if (!importFile.value) {
      ElMessage.warning('请先选择 Excel 文件')
      return
    }
    importSubmitting.value = true
    try {
      const fd = new FormData()
      fd.append('file', importFile.value)
      const res = await request.post('/movies/import', fd)
      if (res.data?.code !== 200) {
        ElMessage.error(res.data?.msg || '导入失败')
        return
      }
      const r = res.data?.data
      const ok = r?.successCount ?? 0
      const bad = r?.failCount ?? 0
      ElMessage.success(`导入完成：成功 ${ok} 条，失败 ${bad} 条`)
      if (r?.errors?.length) {
        console.warn(r.errors)
      }
      addVisible.value = false
      await fetchFilters()
      await fetchMovies()
    } catch (e) {
      ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
    } finally {
      importSubmitting.value = false
    }
  }
  
  async function onEdit(movie) {
    editingId.value = movie.id
    try {
      const res = await request.get(`/movies/${movie.id}`)
      if (res.data?.code !== 200) {
        ElMessage.error(res.data?.msg || '获取影片失败')
        return
      }
      const m = res.data?.data
      editForm.value = {
        title: m.title || '',
        original_title: m.original_title || '',
        language: m.language || '',
        country: m.country || '',
        duration_min: m.duration_min ?? undefined,
        release_date: formatDateField(m.release_date),
        description: m.description || '',
        poster_url: m.poster_url || '',
        trailer_url: m.trailer_url || ''
      }
      editVisible.value = true
    } catch (e) {
      ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
    }
  }
  
  async function onDelete(movie) {
    const name = movie?.title || `编号 ${movie?.id}`
    try {
      await ElMessageBox.confirm(`确定要删除影片「${name}」吗？`, '删除确认', {
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
      const res = await request.delete(`/movies/${movie.id}`)
      if (res.data?.code !== 200) {
        ElMessage.error(res.data?.msg || '删除失败')
        return
      }
      ElMessage.success('已删除')
      await fetchFilters()
      await fetchMovies()
    } catch (e) {
      ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
    }
  }
  
  
  function formatDateField(v) {
    if (!v) return ''
    if (typeof v === 'string') return v.length >= 10 ? v.slice(0, 10) : v
    return String(v)
  }
  
  function resetEditForm() {
    editingId.value = null
    editForm.value = emptyMovieForm()
  }
  
  async function submitEdit() {
    if (!editFormRef.value || editingId.value == null) return
    await editFormRef.value.validate(async (valid) => {
      if (!valid) return
      editSubmitting.value = true
      try {
        const res = await request.put(`/movies/${editingId.value}`, payloadFromForm(editForm.value))
        if (res.data?.code !== 200) {
          ElMessage.error(res.data?.msg || '保存失败')
          return
        }
        ElMessage.success('已保存')
        editVisible.value = false
        await fetchFilters()
        await fetchMovies()
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
  