// Service Worker برای Shafi Accounting System
// نسخه 1.0.0

const CACHE_NAME = 'shafi-accounting-v1.0.0';
const STATIC_CACHE = 'shafi-static-v1.0.0';
const DYNAMIC_CACHE = 'shafi-dynamic-v1.0.0';

// فایل‌های استاتیک برای کش
const STATIC_FILES = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/js/common.js',
  '/js/Accounting Module.js',
  '/js/Customer Management.js',
  '/js/Invoice Management.js',
  '/js/Product Management.js',
  '/js/Reports & Dashboard.js',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/favicon.ico',
  // فونت‌های محلی در صورت وجود
  '/fonts/vazir.woff2',
  '/fonts/vazir.woff'
];

// API endpoints که نباید کش شوند
const NO_CACHE_ENDPOINTS = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/refresh',
  '/api/reports/live',
  '/api/dashboard/stats'
];

// نصب Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: نصب در حال انجام...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: کش کردن فایل‌های استاتیک');
        return cache.addAll(STATIC_FILES.map(url => new Request(url, {
          cache: 'reload'
        })));
      })
      .catch((error) => {
        console.error('Service Worker: خطا در کش کردن فایل‌های استاتیک:', error);
      })
  );
  
  // فعال‌سازی فوری
  self.skipWaiting();
});

// فعال‌سازی Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: فعال‌سازی در حال انجام...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // حذف کش‌های قدیمی
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== CACHE_NAME) {
              console.log('Service Worker: حذف کش قدیمی:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // کنترل تمام کلاینت‌ها
        return self.clients.claim();
      })
  );
});

// رهگیری درخواست‌ها
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // فقط درخواست‌های HTTP/HTTPS را پردازش کن
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // استراتژی کش برای انواع مختلف درخواست‌ها
  if (isStaticAsset(request)) {
    event.respondWith(cacheFirst(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(networkFirst(request));
  } else if (isHTMLRequest(request)) {
    event.respondWith(staleWhileRevalidate(request));
  } else {
    event.respondWith(networkFirst(request));
  }
});

// بررسی فایل استاتیک
function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/);
}

// بررسی درخواست API
function isAPIRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/');
}

// بررسی درخواست HTML
function isHTMLRequest(request) {
  return request.headers.get('accept').includes('text/html');
}

// بررسی endpoint هایی که نباید کش شوند
function shouldNotCache(request) {
  const url = new URL(request.url);
  return NO_CACHE_ENDPOINTS.some(endpoint => url.pathname.startsWith(endpoint));
}

// استراتژی Cache First (برای فایل‌های استاتیک)
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: خطا در Cache First:', error);
    
    // در صورت عدم دسترسی به شبکه، صفحه آفلاین نمایش داده شود
    if (isHTMLRequest(request)) {
      return caches.match('/offline.html') || new Response(
        getOfflineHTML(),
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }
    
    throw error;
  }
}

// استراتژی Network First (برای API و داده‌های داینامیک)
async function networkFirst(request) {
  try {
    // اگر نباید کش شود، مستقیماً از شبکه دریافت کن
    if (shouldNotCache(request)) {
      return await fetch(request);
    }
    
    const networkResponse = await fetch(request);
    
    if (networkResponse.status === 200 && request.method === 'GET') {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: خطا در شبکه، بررسی کش...', error);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // اضافه کردن هدر برای نشان دادن داده از کش
      const response = cachedResponse.clone();
      response.headers.set('X-Served-By', 'ServiceWorker-Cache');
      return response;
    }
    
    // در صورت عدم وجود در کش، پاسخ خطا برگردان
    if (isAPIRequest(request)) {
      return new Response(
        JSON.stringify({
          error: true,
          message: 'عدم دسترسی به شبکه و داده در کش موجود نیست',
          offline: true
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json; charset=utf-8' }
        }
      );
    }
    
    throw error;
  }
}

// استراتژی Stale While Revalidate (برای HTML)
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);
  
  return cachedResponse || await fetchPromise;
}

// HTML صفحه آفلاین
function getOfflineHTML() {
  return `
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>آفلاین - سیستم حسابداری شافی</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 2rem;
        }
        .offline-container {
            background: rgba(255, 255, 255, 0.95);
            padding: 3rem;
            border-radius: 20px;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            max-width: 500px;
        }
        .offline-icon {
            font-size: 4rem;
            color: #6366f1;
            margin-bottom: 1rem;
        }
        .offline-title {
            font-size: 1.8rem;
            color: #1e293b;
            margin-bottom: 1rem;
            font-weight: 600;
        }
        .offline-message {
            color: #64748b;
            margin-bottom: 2rem;
            line-height: 1.6;
        }
        .retry-btn {
            background: linear-gradient(45deg, #6366f1, #8b5cf6);
            color: white;
            border: none;
            padding: 1rem 2rem;
            border-radius: 10px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .retry-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(99, 102, 241, 0.3);
        }
        .features {
            text-align: right;
            margin-top: 2rem;
            padding: 1rem;
            background: #f8fafc;
            border-radius: 10px;
        }
        .features h4 {
            color: #1e293b;
            margin-bottom: 0.5rem;
        }
        .features ul {
            list-style: none;
            color: #64748b;
        }
        .features li {
            padding: 0.3rem 0;
        }
        .features li::before {
            content: "✓";
            color: #10b981;
            font-weight: bold;
            margin-left: 0.5rem;
        }
    </style>
</head>
<body>
    <div class="offline-container">
        <div class="offline-icon">📡</div>
        <h1 class="offline-title">عدم دسترسی به اینترنت</h1>
        <p class="offline-message">
            در حال حاضر اتصال به اینترنت برقرار نیست، اما می‌توانید از بخش‌هایی از برنامه که قبلاً بارگذاری شده‌اند استفاده کنید.
        </p>
        <button class="retry-btn" onclick="window.location.reload()">
            🔄 تلاش مجدد
        </button>
        
        <div class="features">
            <h4>قابلیت‌های آفلاین:</h4>
            <ul>
                <li>مشاهده داده‌های ذخیره شده</li>
                <li>ایجاد پیش‌نویس فاکتور</li>
                <li>محاسبات محلی</li>
                <li>تبدیل ارز (نرخ‌های ذخیره شده)</li>
            </ul>
        </div>
    </div>
    
    <script>
        // بررسی وضعیت آنلاین
        window.addEventListener('online', () => {
            window.location.reload();
        });
        
        // نمایش وضعیت اتصال
        if (navigator.onLine) {
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    </script>
</body>
</html>
  `;
}

// پیام‌های push notification
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'پیام جدید از سیستم حسابداری شافی',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'مشاهده',
        icon: '/icons/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'بستن'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('سیستم حسابداری شافی', options)
  );
});

// کلیک روی notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// همگام‌سازی پس‌زمینه
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // انجام عملیات همگام‌سازی
      syncOfflineData()
    );
  }
});

// همگام‌سازی داده‌های آفلاین
async function syncOfflineData() {
  try {
    // دریافت داده‌های آفلاین از IndexedDB
    // ارسال به سرور
    // به‌روزرسانی کش
    console.log('Service Worker: همگام‌سازی داده‌های آفلاین');
  } catch (error) {
    console.error('Service Worker: خطا در همگام‌سازی:', error);
  }
}

// مدیریت به‌روزرسانی
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

console.log('Service Worker: بارگذاری کامل - سیستم حسابداری شافی');
