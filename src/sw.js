// sw.js - Service Worker with dynamic caching and cache management
var indexRequest = null;
const mdFlag = '${MD_TEXT}';
const CACHE_NAME = 'lazier-docs-cache-v1';
const handlerSuffixMap = {
    '.md': processMdResponse
};
const encoder = new TextEncoder();
// 监听安装事件 - 不做预缓存
self.addEventListener('install', (event) => {
    console.log('Service Worker 安装完成');
    // 跳过等待，立即激活
    self.skipWaiting();
});

// 监听激活事件
self.addEventListener('activate', (event) => {
    console.log('Service Worker 激活完成');
    // 立即控制所有页面
    event.waitUntil(self.clients.claim());
});

// 监听fetch事件 - 实现动态缓存策略
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    // 特殊处理clearSWCache请求
    if (url.pathname.endsWith('/clearSWCache')) {
        console.log('清理缓存');
        event.respondWith(clearCacheHandler(event));
        return;
    }

    // 处理.md文件请求
    if (url.pathname.endsWith('.md')) {
        event.respondWith(cacheFirstHandler(event, '.md'));
        return;
    }
    // 缓存模板
    if (url.pathname.endsWith('/index.html')) {
        indexRequest = event.request;
        event.respondWith(cacheFirstHandler(event));
        return;
    }

    // 对于其他请求，使用缓存优先策略
    event.respondWith(cacheFirstHandler(event));
});

// 缓存优先策略处理函数（用于非.md文件）
async function cacheFirstHandler(event, handlerSuffix) {
    const request = event.request;
    const handler = handlerSuffixMap[handlerSuffix] || (r => r);
    try {
        // 首先尝试从缓存中获取
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return handler(cachedResponse.clone());
        }

        // 缓存中没有，则从网络获取
        const networkResponse = await fetch(request);

        // 检查响应是否有效
        if (networkResponse && networkResponse.status === 200) {
            // 克隆响应，因为响应只能读取一次
            const responseToCache = networkResponse.clone();

            // 将响应添加到缓存中
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, responseToCache).catch(err => {
                console.warn('缓存写入失败:', err);
            });
        }

        return handler(networkResponse.clone());
    } catch (error) {
        // 网络请求失败，尝试返回缓存的响应
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return handler(cachedResponse.clone());
        }

        // 如果没有缓存可用，返回错误页面或空响应
        return new Response('网络不可用，且无缓存内容', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' })
        });
    }
}

// 清理缓存处理函数
async function clearCacheHandler(event) {
    try {
        // 获取所有缓存名称
        const cacheNames = await caches.keys();

        // 删除所有缓存
        await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
        );

        console.log('所有缓存已清理完成');

        // 返回成功响应
        return new Response(JSON.stringify({
            success: true,
            message: '所有缓存已清理完成'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('清理缓存时出错:', error);

        // 返回错误响应
        return new Response(JSON.stringify({
            success: false,
            message: '清理缓存失败: ' + error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// 处理.md文件响应内容
async function processMdResponse(response) {
    try {
        // 读取首页
        const indexResponse = await caches.match(indexRequest);
        if (!indexResponse) {
            throw new Error('暂无首页数据');
        }
        // 获取原始文本内容
        const idnexText = await indexResponse.clone().text();
        const mdText = await response.text();

        // 修改内容
        const newMdContent = idnexText.replaceAll(mdFlag, encoder.encode(mdText));

        // 创建新的响应对象
        const modifiedResponse = new Response(newMdContent, {
            status: response.status,
            statusText: response.statusText,
            headers: new Headers({
                'Content-Type': 'text/html; charset=utf-8',
                'Content-Length': newMdContent.length.toString()
            })
        });

        return modifiedResponse;
    } catch (error) {
        console.error('处理.md文件内容时出错:', error);
        // 如果处理失败，返回原始响应
        return response;
    }
}