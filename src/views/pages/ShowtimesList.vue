<template>
  <div class="showtimes-management">
    <div class="page-header">
      <h1>排片管理</h1>
      <el-button type="primary" @click="handleAddShowtime">
        <el-icon><Plus /></el-icon>
        添加排片
      </el-button>
    </div>

    <div class="filter-section">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="影院">
          <el-select v-model="searchForm.cinemaId" placeholder="选择影院" @change="handleSearchCinemaChange">
            <el-option
              v-for="cinema in cinemas"
              :key="cinema.id"
              :label="cinema.name"
              :value="cinema.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="影厅">
          <el-select v-model="searchForm.hallId" placeholder="选择影厅">
            <el-option
              v-for="hall in filteredHalls"
              :key="hall.id"
              :label="hall.name"
              :value="hall.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="电影">
          <el-select v-model="searchForm.movieId" placeholder="选择电影">
            <el-option
              v-for="movie in filteredMovies"
              :key="movie.id"
              :label="movie.title"
              :value="movie.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="time-axis-container">
      <div v-if="showtimes.length === 0" class="empty-state">
        <el-empty description="暂无排片数据" />
      </div>
      <div v-else class="time-axis">
        <div
          v-for="(showtime, index) in showtimes"
          :key="showtime.id"
          class="time-axis-item"
          :class="{ 'conflict': false }"
        >
          <div class="time-axis-dot"></div>
          <div class="time-axis-line" v-if="index < showtimes.length - 1"></div>
          <div class="time-axis-content">
            <div class="showtime-card">
              <div class="showtime-header">
                <h3>{{ showtime.movieName }}</h3>
                <span class="status-tag" :class="showtime.status === 1 ? 'status-normal' : 'status-canceled'">
                  {{ showtime.statusText }}
                </span>
              </div>
              <div class="showtime-info">
                <div class="info-item">
                  <span class="label">影院：</span>
                  <span>{{ showtime.cinemaName }}</span>
                </div>
                <div class="info-item">
                  <span class="label">影厅：</span>
                  <span>{{ showtime.hallName }}</span>
                </div>
                <div class="info-item">
                  <span class="label">开始时间：</span>
                  <span>{{ formatDateTime(showtime.startTime) }}</span>
                </div>
                <div class="info-item">
                  <span class="label">结束时间：</span>
                  <span>{{ formatDateTime(showtime.endTime) }}</span>
                </div>
                <div class="info-item">
                  <span class="label">票价：</span>
                  <span class="price">¥{{ showtime.price }}</span>
                </div>
              </div>
              <div class="showtime-actions">
                <el-button type="primary" size="small" @click="handleEditShowtime(showtime)">
                  编辑
                </el-button>
                <el-button type="danger" size="small" @click="handleDeleteShowtime(showtime.id)">
                  删除
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 添加/编辑排片对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
    >
      <el-form :model="showtimeForm" :rules="rules" ref="showtimeFormRef" label-width="100px">
        <el-form-item label="影院" prop="cinemaId">
          <el-select v-model="showtimeForm.cinemaId" placeholder="选择影院" @change="handleCinemaChange">
            <el-option
              v-for="cinema in cinemas"
              :key="cinema.id"
              :label="cinema.name"
              :value="cinema.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="影厅" prop="hallId">
          <el-select v-model="showtimeForm.hallId" placeholder="选择影厅">
            <el-option
              v-for="hall in filteredHalls"
              :key="hall.id"
              :label="hall.name"
              :value="hall.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="电影" prop="movieId">
          <el-select v-model="showtimeForm.movieId" placeholder="选择电影" @change="handleMovieChange">
            <el-option
              v-for="movie in dialogFilteredMovies"
              :key="movie.id"
              :label="movie.title"
              :value="movie.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker
            v-model="showtimeForm.startTime"
            type="datetime"
            placeholder="选择开始时间"
            style="width: 100%"
            @change="handleStartTimeChange"
          />
        </el-form-item>
        <el-form-item label="结束时间" prop="endTime" :disabled="true">
          <el-date-picker
            v-model="showtimeForm.endTime"
            type="datetime"
            placeholder="系统自动计算"
            style="width: 100%"
            disabled
          />
        </el-form-item>
        <el-form-item label="票价" prop="price">
          <el-input-number
            v-model="showtimeForm.price"
            :min="0"
            :step="0.5"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="showtimeForm.status">
            <el-radio :label="1">正常</el-radio>
            <el-radio :label="0">取消</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { Plus } from '@element-plus/icons-vue';
import request from '@/utils/request';
import { ElMessageBox, ElMessage } from 'element-plus';

// 搜索表单
const searchForm = reactive({
  cinemaId: null,
  hallId: null,
  movieId: null
});

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

// 排片列表
const showtimes = ref([]);

// 影院列表
const cinemas = ref([]);

// 影厅列表
const halls = ref([]);

// 过滤后的影厅列表
const filteredHalls = computed(() => {
  if (!searchForm.cinemaId) return halls.value;
  return halls.value.filter(hall => hall.cinemaId === searchForm.cinemaId);
});

// 过滤后的电影列表（搜索表单）
const filteredMovies = ref([]);

// 过滤后的电影列表（对话框）
const dialogFilteredMovies = ref([]);

// 根据影院ID加载绑定的电影列表
const loadMoviesByCinemaId = async (cinemaId) => {
  if (!cinemaId) {
    filteredMovies.value = movies.value;
    dialogFilteredMovies.value = movies.value;
    return;
  }
  
  try {
    const response = await request.get(`/movies/cinema/${cinemaId}`);
    if (response.data.code === 200) {
      filteredMovies.value = response.data.data;
      dialogFilteredMovies.value = response.data.data;
    } else {
      ElMessage.error('获取影院绑定电影失败');
      console.error('获取影院绑定电影失败:', response.data);
      filteredMovies.value = movies.value;
      dialogFilteredMovies.value = movies.value;
    }
  } catch (error) {
    ElMessage.error('加载影院绑定电影失败');
    console.error('加载影院绑定电影失败:', error);
    filteredMovies.value = movies.value;
    dialogFilteredMovies.value = movies.value;
  }
};

// 电影列表
const movies = ref([]);

// 对话框
const dialogVisible = ref(false);
const dialogTitle = ref('添加排片');
const showtimeForm = reactive({
  id: null,
  cinemaId: null,
  hallId: null,
  movieId: null,
  startTime: null,
  endTime: null,
  price: 0,
  status: 0
});

// 表单验证规则
const rules = {
  cinemaId: [{ required: true, message: '请选择影院', trigger: 'blur' }],
  hallId: [{ required: true, message: '请选择影厅', trigger: 'blur' }],
  movieId: [{ required: true, message: '请选择电影', trigger: 'blur' }],
  startTime: [
    { required: true, message: '请选择开始时间', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(0, 0, 0, 0);
          if (new Date(value) < tomorrow) {
            callback(new Error('开始时间必须至少提前一天安排'));
          } else {
            callback();
          }
        } else {
          callback();
        }
      },
      trigger: 'change'
    }
  ],
  endTime: [
    { required: true, message: '请选择开始时间', trigger: 'blur' }
  ],
  price: [{ required: true, message: '请输入票价', trigger: 'blur' }]
};

const showtimeFormRef = ref(null);

// 格式化日期时间
const formatDateTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 当前用户信息
const currentUser = ref(null);
const userRoles = ref([]);

// 加载当前用户信息
const loadCurrentUser = async () => {
  try {
    const userResponse = await request.get('/sessions/current');
    if (userResponse.data.code === 200 && userResponse.data.data) {
      currentUser.value = userResponse.data.data.user;
      userRoles.value = userResponse.data.data.roles || [];
    }
  } catch (error) {
    console.error('加载用户信息失败:', error);
  }
};

// 检查用户是否为SUPER_ADMIN或ADMIN角色
const isAdmin = () => {
  return userRoles.value.includes('SUPER_ADMIN') || userRoles.value.includes('ADMIN');
};

// 加载影院列表
const loadCinemas = async () => {
  try {
    // 先加载用户信息
    await loadCurrentUser();
    
    if (isAdmin()) {
      // SUPER_ADMIN和ADMIN角色可以查看所有影院
      const response = await request.get('/cinemas?page=1&pageSize=100');
      if (response.data.code === 200) {
        cinemas.value = response.data.data.records;
      } else {
        ElMessage.error('获取影院列表失败');
        console.error('获取影院列表失败:', response.data);
      }
    } else {
      // STAFF角色只能查看绑定的影院
      if (currentUser.value) {
        const userId = currentUser.value.id;
        // 获取用户绑定的影院
        const relationResponse = await request.get(`/users/cinema/${userId}`);
        if (relationResponse.data.code === 200 && relationResponse.data.data) {
          const cinemaId = relationResponse.data.data;
          if (cinemaId) {
            // 获取该影院的详细信息
            const cinemaResponse = await request.get(`/cinemas/${cinemaId}`);
            if (cinemaResponse.data.code === 200 && cinemaResponse.data.data) {
              cinemas.value = [cinemaResponse.data.data];
            } else {
              ElMessage.error('获取影院详情失败');
              console.error('获取影院详情失败:', cinemaResponse.data);
            }
          } else {
            ElMessage.warning('当前用户未绑定影院');
          }
        } else {
          ElMessage.error('获取用户绑定影院失败');
          console.error('获取用户绑定影院失败:', relationResponse.data);
        }
      } else {
        // 用户未登录或获取用户信息失败，使用默认数据
        ElMessage.warning('用户未登录，使用默认影院数据');
        cinemas.value = [
          {
            id: 1,
            name: '默认影院'
          }
        ];
      }
    }
  } catch (error) {
    // 发生错误，使用默认数据
    ElMessage.warning('加载影院失败，使用默认数据');
    console.error('加载影院列表失败:', error);
    cinemas.value = [
      {
        id: 1,
        name: '默认影院'
      }
    ];
  }
};

// 加载影厅列表（根据选择的影院加载）
const loadHalls = async (cinemaId) => {
  try {
    if (cinemaId) {
      const response = await request.get(`/halls?page=1&pageSize=1000&cinemaId=${cinemaId}`);
      if (response.data.code === 200) {
        halls.value = response.data.data.records;
      } else {
        ElMessage.warning('获取影厅列表失败，使用默认数据');
        console.error('获取影厅列表失败:', response.data);
        // 使用默认数据
        halls.value = [
          {
            id: 1,
            cinemaId: 1,
            name: '1号厅'
          },
          {
            id: 2,
            cinemaId: 1,
            name: '2号厅'
          }
        ];
      }
    } else {
      halls.value = [];
    }
  } catch (error) {
    ElMessage.warning('加载影厅列表失败，使用默认数据');
    console.error('加载影厅列表失败:', error);
    // 使用默认数据
    halls.value = [
      {
        id: 1,
        cinemaId: 1,
        name: '1号厅'
      },
      {
        id: 2,
        cinemaId: 1,
        name: '2号厅'
      }
    ];
  }
};

// 加载电影列表
const loadMovies = async () => {
  try {
    const response = await request.get('/movies?page=1&pageSize=100');
    if (response.data.code === 200) {
      movies.value = response.data.data.records;
    } else {
      ElMessage.warning('获取电影列表失败，使用默认数据');
      console.error('获取电影列表失败:', response.data);
      // 使用默认数据
      movies.value = [
        {
          id: 1,
          title: '电影1'
        },
        {
          id: 2,
          title: '电影2'
        }
      ];
    }
  } catch (error) {
    ElMessage.warning('加载电影列表失败，使用默认数据');
    console.error('加载电影列表失败:', error);
    // 使用默认数据
    movies.value = [
      {
        id: 1,
        title: '电影1'
      },
      {
        id: 2,
        title: '电影2'
      }
    ];
  }
};

// 加载排片列表
const loadShowtimes = async () => {
  try {
    const response = await request.get('/showtimes', {
      params: {
        page: pagination.currentPage,
        pageSize: pagination.pageSize,
        cinemaId: searchForm.cinemaId,
        hallId: searchForm.hallId,
        movieId: searchForm.movieId
      }
    });
    if (response.data.code === 200) {
      showtimes.value = response.data.data.records;
      pagination.total = response.data.data.total;
    }
  } catch (error) {
    console.error('加载排片列表失败:', error);
  }
};

// 处理搜索
const handleSearch = () => {
  pagination.currentPage = 1;
  loadShowtimes();
};

// 重置表单
const resetForm = () => {
  searchForm.cinemaId = null;
  searchForm.hallId = null;
  searchForm.movieId = null;
  pagination.currentPage = 1;
  loadShowtimes();
};

// 处理分页大小变化
const handleSizeChange = (size) => {
  pagination.pageSize = size;
  loadShowtimes();
};

// 处理页码变化
const handleCurrentChange = (current) => {
  pagination.currentPage = current;
  loadShowtimes();
};

// 处理添加排片
const handleAddShowtime = () => {
  dialogTitle.value = '添加排片';
  showtimeForm.id = null;
  showtimeForm.cinemaId = null;
  showtimeForm.hallId = null;
  showtimeForm.movieId = null;
  showtimeForm.startTime = null;
  showtimeForm.endTime = null;
  showtimeForm.price = 0;
  showtimeForm.status = 0;
  dialogVisible.value = true;
};

// 处理编辑排片
const handleEditShowtime = (showtime) => {
  dialogTitle.value = '编辑排片';
  showtimeForm.id = showtime.id;
  showtimeForm.cinemaId = showtime.cinemaId;
  showtimeForm.hallId = showtime.hallId;
  showtimeForm.movieId = showtime.movieId;
  showtimeForm.startTime = new Date(showtime.startTime);
  showtimeForm.endTime = new Date(showtime.endTime);
  showtimeForm.price = showtime.price;
  showtimeForm.status = showtime.status;
  dialogVisible.value = true;
};

// 处理删除排片
const handleDeleteShowtime = (id) => {
  ElMessageBox.confirm('确定要删除该排片吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const response = await request.delete(`/showtimes/${id}`);
      if (response.data.code === 200) {
        ElMessage.success('删除成功');
        loadShowtimes();
      } else {
        ElMessage.error(response.data.message || '删除失败');
      }
    } catch (error) {
      console.error('删除排片失败:', error);
      ElMessage.error('删除失败');
    }
  }).catch(() => {
    // 取消删除
  });
};

// 处理影院变化
const handleCinemaChange = async () => {
  showtimeForm.hallId = null;
  await loadHalls(showtimeForm.cinemaId);
  await loadMoviesByCinemaId(showtimeForm.cinemaId);
};

// 处理搜索表单中的影院变化
const handleSearchCinemaChange = async () => {
  searchForm.hallId = null;
  await loadHalls(searchForm.cinemaId);
  await loadMoviesByCinemaId(searchForm.cinemaId);
};

// 处理开始时间变化，自动计算结束时间
const handleStartTimeChange = async () => {
  if (showtimeForm.movieId && showtimeForm.startTime) {
    try {
      // 获取电影详情，获取时长
      const movieResponse = await request.get(`/movies/${showtimeForm.movieId}`);
      if (movieResponse.data.code === 200 && movieResponse.data.data) {
        const movie = movieResponse.data.data;
        if (movie.durationMin) {
          // 计算结束时间
          const startTime = new Date(showtimeForm.startTime);
          const endTime = new Date(startTime.getTime() + movie.durationMin * 60 * 1000);
          showtimeForm.endTime = endTime;
          
          // 检查时间冲突
          if (showtimeForm.hallId) {
            const response = await request.post('/showtimes', {
              ...showtimeForm
            });
            if (response.data.code !== 200) {
              ElMessage.warning(response.data.message || '时间设置有误');
            }
          }
        }
      }
    } catch (error) {
      console.error('计算结束时间失败:', error);
      ElMessage.error('计算结束时间失败');
    }
  }
};

// 处理电影选择变化，自动计算结束时间
const handleMovieChange = async () => {
  if (showtimeForm.movieId && showtimeForm.startTime) {
    await handleStartTimeChange();
  }
};

// 处理提交
const handleSubmit = async () => {
  if (!showtimeFormRef.value) return;
  
  showtimeFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const response = await request.post('/showtimes', showtimeForm);
        if (response.data.code === 200) {
          ElMessage.success('保存成功');
          dialogVisible.value = false;
          loadShowtimes();
        } else {
          ElMessage.error(response.data.message || '保存失败');
        }
      } catch (error) {
        console.error('保存排片失败:', error);
        const errorMessage = error.response?.data?.message || error.message || '保存失败';
        ElMessage.error(errorMessage);
      }
    }
  });
};

// 初始化
onMounted(async () => {
  await loadCinemas();
  await loadMovies(); // 加载电影列表，确保movies数组有数据
  // 如果有影院，默认选择第一个，并加载相关数据
  if (cinemas.value.length > 0) {
    searchForm.cinemaId = cinemas.value[0].id;
    showtimeForm.cinemaId = cinemas.value[0].id;
    await loadHalls(cinemas.value[0].id);
    await loadMoviesByCinemaId(cinemas.value[0].id);
  } else {
    halls.value = [];
    filteredMovies.value = movies.value;
    dialogFilteredMovies.value = movies.value;
  }
  loadShowtimes();
});
</script>

<style scoped>
.showtimes-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  font-size: 24px;
  margin: 0;
}

.filter-section {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.search-form {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 延长下拉框长度 */
.el-select {
  min-width: 200px;
}

/* 对话框中的下拉框 */
.el-dialog .el-select {
  min-width: 100%;
}

.time-axis-container {
  margin: 20px 0;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.time-axis {
  position: relative;
  padding-left: 30px;
}

.time-axis::before {
  content: '';
  position: absolute;
  left: 14px;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: #e4e7ed;
}

.time-axis-item {
  position: relative;
  margin-bottom: 30px;
}

.time-axis-dot {
  position: absolute;
  left: -30px;
  top: 10px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #409eff;
  z-index: 1;
}

.time-axis-line {
  position: absolute;
  left: -29px;
  top: 20px;
  bottom: -30px;
  width: 2px;
  background-color: #e4e7ed;
}

.time-axis-content {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
  transition: all 0.3s;
}

.time-axis-content:hover {
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.15);
}

.showtime-card {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.showtime-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e4e7ed;
  padding-bottom: 10px;
}

.showtime-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.status-tag {
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
}

.status-normal {
  background-color: #f0f9eb;
  color: #67c23a;
}

.status-canceled {
  background-color: #fef0f0;
  color: #f56c6c;
}

.showtime-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.info-item .label {
  font-weight: 500;
  color: #606266;
}

.info-item .price {
  font-weight: 600;
  color: #f56c6c;
}

.showtime-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}

.pagination {
  margin-top: 30px;
  display: flex;
  justify-content: flex-end;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
