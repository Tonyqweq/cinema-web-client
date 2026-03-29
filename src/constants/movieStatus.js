export const MOVIE_STATUS_CONFIG = {
    0: { text: '下架', type: 'info' },
    1: { text: '正常', type: 'success' }
  }
  
  export const getMovieStatusText = (status) => {
    return MOVIE_STATUS_CONFIG[status]?.text || '未知'
  }
  
  export const getMovieStatusType = (status) => {
    return MOVIE_STATUS_CONFIG[status]?.type || 'info'
  }