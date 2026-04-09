<template>
  <el-card class="dashboard" shadow="never" :body-style="{ padding: '16px' }">
    <div class="title-row">
      <h2 class="title">影院电影绑定</h2>
    </div>

    <div class="toolbar">
      <el-select
        v-model="selectedCinemaId"
        placeholder="选择影院"
        style="width: 300px"
        @change="onCinemaChange"
      >
        <el-option v-for="cinema in cinemas" :key="cinema.id" :label="cinema.name" :value="cinema.id" />
      </el-select>
      <el-button type="primary" @click="showBindDialog">添加电影</el-button>
      <el-button @click="onReset">重置</el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="boundMovies"
      border
      style="width: 100%"
      empty-text="暂无绑定电影"
    >
      <el-table-column type="index" label="序号" width="60" />
      <el-table-column prop="title" label="电影标题" min-width="200" />
      <!-- <el-table-column prop="director" label="导演" min-width="150" />
      <el-table-column prop="actors" label="主演" min-width="200" /> -->
      <el-table-column prop="releaseDate" label="上映日期" min-width="150" />
      <el-table-column label="操作" fixed="right" min-width="150">
        <template #default="{ row }">
          <el-button size="small" type="warning" @click="unbindMovie(row)">解除绑定</el-button>
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

    <!-- 绑定电影对话框 -->
    <el-dialog v-model="bindDialogVisible" title="绑定电影" width="800px" destroy-on-close @closed="resetBindForm">
      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索电影标题"
          clearable
          style="width: 400px"
          @keyup.enter="searchMovies"
        />
        <el-button type="primary" @click="searchMovies">搜索</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </div>

      <el-table
        v-loading="searchLoading"
        :data="searchResults"
        border
        style="width: 100%; margin-top: 12px"
        empty-text="暂无搜索结果"
        max-height="400"
      >
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="title" label="电影标题" min-width="200" />
        <!-- <el-table-column prop="director" label="导演" min-width="150" />
        <el-table-column prop="actors" label="主演" min-width="200" /> -->
        <el-table-column prop="releaseDate" label="上映日期" min-width="150" />
        <el-table-column prop="status" label="状态" min-width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '上架' : '下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" min-width="100">
          <template #default="{ row }">
            <el-button 
              size="small" 
              type="primary" 
              @click="bindMovie(row)"
              :disabled="row.status !== 1"
            >
              绑定
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-row">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :current-page="searchCurrentPage"
          :page-sizes="[10, 20, 30, 50]"
          :page-size="searchPageSize"
          :total="searchTotal"
          @size-change="handleSearchSizeChange"
          @current-change="handleSearchCurrentChange"
        />
      </div>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../../utils/request'

const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const boundMovies = ref([])
const total = ref(0)
const cinemas = ref([])
const selectedCinemaId = ref(null)
const boundMovieIds = ref(new Set())

const bindDialogVisible = ref(false)
const searchLoading = ref(false)
const searchKeyword = ref('')
const searchResults = ref([])
const searchCurrentPage = ref(1)
const searchPageSize = ref(50) // 增加默认每页显示数量
const searchTotal = ref(0)

async function fetchCinemas() {
  try {
    const res = await request.get('/cinemas', {
      params: { page: 1, pageSize: 100 }
    })
    if (res.data?.code !== 200) {
      ElMessage.error(res.data?.msg || '获取影院列表失败')
      return
    }
    cinemas.value = res.data?.data?.records || []
    if (cinemas.value.length > 0 && !selectedCinemaId.value) {
      selectedCinemaId.value = cinemas.value[0].id
      await fetchBoundMovies()
    }
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
  }
}

async function fetchBoundMovies() {
  if (!selectedCinemaId.value) return
  loading.value = true
  try {
    // 首先获取影院绑定的电影ID列表
    const res = await request.get(`/admin/cinema-movies/bind/${selectedCinemaId.value}`)
    if (res.data?.code !== 200) {
      ElMessage.error(res.data?.msg || '获取绑定电影失败')
      return
    }
    const movieIds = res.data?.data || []
    boundMovieIds.value = new Set(movieIds)
    
    if (movieIds.length === 0) {
      boundMovies.value = []
      total.value = 0
      return
    }
    
    // 获取所有电影，然后在前端过滤出绑定的电影
    const moviesRes = await request.get('/movies', {
      params: {
        page: 1,
        pageSize: 1000 // 获取足够多的电影，确保能覆盖所有绑定的电影
      }
    })
    if (moviesRes.data?.code !== 200) {
      ElMessage.error(moviesRes.data?.msg || '获取电影详情失败')
      return
    }
    const allMovies = moviesRes.data?.data?.records || []
    
    // 过滤出绑定的电影
    const filteredMovies = allMovies.filter(movie => boundMovieIds.value.has(movie.id))
    
    // 处理分页
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    boundMovies.value = filteredMovies.slice(start, end)
    total.value = filteredMovies.length
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
  } finally {
    loading.value = false
  }
}

function showBindDialog() {
  if (!selectedCinemaId.value) {
    ElMessage.warning('请先选择影院')
    return
  }
  bindDialogVisible.value = true
  searchMovies()
}

async function searchMovies() {
  if (!selectedCinemaId.value) return
  searchLoading.value = true
  try {
    const res = await request.get('/movies', {
      params: {
        page: searchCurrentPage.value,
        pageSize: searchPageSize.value,
        title: searchKeyword.value // 使用title参数进行搜索
      }
    })
    if (res.data?.code !== 200) {
      ElMessage.error(res.data?.msg || '搜索电影失败')
      return
    }
    const pageData = res.data?.data
    // 过滤掉已绑定的电影，只显示状态为上架的电影
    searchResults.value = (pageData?.records || []).filter(movie => {
      return !boundMovieIds.value.has(movie.id) && movie.status === 1
    })
    // 使用后端返回的总数量，而不是过滤后的数量
    searchTotal.value = pageData?.total || 0
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
  } finally {
    searchLoading.value = false
  }
}

async function bindMovie(movie) {
  if (movie.status !== 1) {
    ElMessage.warning('只有上架状态的电影才能绑定')
    return
  }
  
  try {
    await ElMessageBox.confirm(`确定要绑定电影「${movie.title}」吗？`, '绑定确认', {
      type: 'info',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      closeOnClickModal: false
    })
  } catch {
    return
  }

  try {
    const res = await request.put('/admin/cinema-movies/bind', {
      cinemaId: selectedCinemaId.value,
      movieId: movie.id,
      bind: true
    })
    if (res.data?.code !== 200) {
      ElMessage.error(res.data?.msg || '绑定失败')
      return
    }
    ElMessage.success('已绑定')
    bindDialogVisible.value = false
    await fetchBoundMovies()
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
  }
}

async function unbindMovie(movie) {
  try {
    await ElMessageBox.confirm(`确定要解除绑定电影「${movie.title}」吗？`, '解除绑定确认', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      closeOnClickModal: false
    })
  } catch {
    return
  }

  try {
    const res = await request.put('/admin/cinema-movies/bind', {
      cinemaId: selectedCinemaId.value,
      movieId: movie.id,
      bind: false
    })
    if (res.data?.code !== 200) {
      ElMessage.error(res.data?.msg || '解除绑定失败')
      return
    }
    ElMessage.success('已解除绑定')
    await fetchBoundMovies()
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
  }
}

async function onCinemaChange() {
  currentPage.value = 1
  await fetchBoundMovies()
}

function handleSizeChange(size) {
  pageSize.value = size
  currentPage.value = 1
  fetchBoundMovies()
}

function handleCurrentChange(page) {
  currentPage.value = page
  fetchBoundMovies()
}

function handleSearchSizeChange(size) {
  searchPageSize.value = size
  searchCurrentPage.value = 1
  searchMovies()
}

function handleSearchCurrentChange(page) {
  searchCurrentPage.value = page
  searchMovies()
}

function resetSearch() {
  searchKeyword.value = ''
  searchCurrentPage.value = 1
  searchMovies()
}

function resetBindForm() {
  searchKeyword.value = ''
  searchResults.value = []
  searchCurrentPage.value = 1
  searchTotal.value = 0
}

function onReset() {
  if (cinemas.value.length > 0) {
    selectedCinemaId.value = cinemas.value[0].id
  }
  currentPage.value = 1
  fetchBoundMovies()
}

onMounted(async () => {
  await fetchCinemas()
})
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

.search-bar {
  display: flex;
  gap: 10px;
  align-items: center;
}
</style>
