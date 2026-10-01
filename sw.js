// 修改版本號為 v2，並加入自動更新與 Network First 策略
const CACHE_NAME = 'cyber-snake-v2';
const assets = [
  './',
  './index.html',
  './game.js',
  './style.css'
];

// 1. 安裝階段：強制跳過等待 (skipWaiting)，讓新 SW 立即準備接管
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('【PWA】正在快取賽博蛇 v2 最新資源...');
      return cache.addAll(assets);
    })
  );
});

// 2. 激活階段：立即清理舊版 v1 快取，並宣告接管所有頁面
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('【PWA】清理舊快取：', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. 攔截請求：改用 Network First 策略（有網速時抓最新，沒網速才用快取）
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
