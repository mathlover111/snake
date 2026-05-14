const CACHE_NAME = 'cyber-snake-v1';
// 這裡列出所有斷網時需要被死咬在硬碟裡的檔案
const assets = [
  './',
  './index.html',
  './game.js',
  './style.css'
];

// 1. 安裝階段：把上面指定的檔案全部下載並存進瀏覽器的 Cache 空間
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('【PWA】正在快取賽博蛇的所有遊戲資源...');
      return cache.addAll(assets);
    })
  );
});

// 2. 激活階段：清理舊版本的快取（當你以後更新遊戲時會用到）
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
    })
  );
});

// 3. 攔截請求階段：當斷網或連線時，優先從快取拿檔案，拿不到才走網路
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // 如果快取有檔案就直接回傳，沒有就發送網路請求
      return cachedResponse || fetch(event.request);
    })
  );
});
