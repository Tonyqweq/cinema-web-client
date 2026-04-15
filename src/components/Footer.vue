<template>
  <footer class="footer">
    <div class="footer-content">
      <div class="footer-section">
        <h3>🎬 影院之家</h3>
        <p>提供最新、最热的电影资讯和购票服务</p>
      </div>
      <div class="footer-section">
        <h4>快速链接</h4>
        <ul class="footer-links">
          <li><router-link to="/">首页</router-link></li>
          <li><router-link to="/movies">电影库</router-link></li>
          <li><router-link to="/ticket-records">购票记录</router-link></li>
        </ul>
      </div>
      <div class="footer-section">
        <h4>联系我们</h4>
        <p>邮箱: support@cinemahome.com</p>
        <p>电话: 400-123-4567</p>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; 2026 影院之家. 保留所有权利.</p>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: #F2F2F7;
  color: #333;
  padding: 30px 0 20px;
  margin-top: 40px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
}

.footer-section h3 {
  margin: 0 0 15px 0;
  font-size: 1.3rem;
  font-weight: 600;
  color: #007AFF;
}

.footer-section h4 {
  margin: 0 0 15px 0;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
}

.footer-section p {
  margin: 0 0 10px 0;
  color: #666;
  font-size: 0.9rem;
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-links li {
  margin-bottom: 8px;
}

.footer-links a {
  color: #007AFF;
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s ease;
}

.footer-links a:hover {
  color: #0051D5;
}

.footer-bottom {
  max-width: 1200px;
  margin: 20px auto 0;
  padding: 15px 20px;
  text-align: center;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  color: #999;
  font-size: 0.85rem;
}

@media (max-width: 768px) {
  .footer-content {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .footer-section {
    margin-bottom: 20px;
  }
}
</style>