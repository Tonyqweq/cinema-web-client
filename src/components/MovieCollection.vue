<template>
  <div class="movie-collection-section">
    <el-button
      :type="isCollected ? 'danger' : 'primary'"
      :icon="isCollected ? 'Delete' : 'StarFilled'"
      @click="toggleCollection"
      :loading="loading"
      size="large"
      class="collection-button"
    >
      {{ isCollected ? '取消收藏' : '收藏电影' }}
    </el-button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { StarFilled, Delete } from '@element-plus/icons-vue'
import request from '@/utils/request'

const props = defineProps({
  movieId: {
    type: Number,
    required: true
  }
})

const loading = ref(false)
const isCollected = ref(false)

async function checkCollectionStatus() {
  try {
    const res = await request.get(`/user-collections/check/${props.movieId}`)
    if (res.data?.code === 200 && res.data?.data) {
      isCollected.value = res.data.data.isCollected
    }
  } catch (e) {
    console.error('检查收藏状态失败:', e)
  }
}

async function toggleCollection() {
  loading.value = true
  try {
    let res
    if (isCollected.value) {
      res = await request.delete(`/user-collections/${props.movieId}`)
    } else {
      res = await request.post('/user-collections', {
        movieId: props.movieId
      })
    }
    
    if (res.data?.code === 200) {
      isCollected.value = !isCollected.value
      ElMessage.success(isCollected.value ? '收藏成功' : '取消收藏成功')
    } else {
      ElMessage.error(res.data?.message || '操作失败')
    }
  } catch (e) {
    console.error('收藏操作失败:', e)
    ElMessage.error('操作失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  checkCollectionStatus()
})

defineExpose({
  checkCollectionStatus
})
</script>

<style scoped>
.movie-collection-section {
  display: inline-block;
}

.collection-button {
  border-radius: 25px;
  padding: 12px 30px;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.collection-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>