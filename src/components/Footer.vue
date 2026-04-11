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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px 0 20px;
  margin-top: 40px;
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
  font-size: 1.5rem;
  font-weight: 700;
}

.footer-section h4 {
  margin: 0 0 15px 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.footer-section p {
  margin: 0 0 10px 0;
  opacity: 0.9;
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-links li {
  margin-bottom: 10px;
}

.footer-links a {
  color: white;
  text-decoration: none;
  opacity: 0.9;
  transition: opacity 0.3s ease;
}

.footer-links a:hover {
  opacity: 1;
  text-decoration: underline;
}

.footer-bottom {
  max-width: 1200px;
  margin: 30px auto 0;
  padding: 20px;
  text-align: center;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  opacity: 0.8;
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