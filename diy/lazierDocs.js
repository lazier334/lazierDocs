/**
 * 文档全局对象，可以通过修改内部的钩子函数拓展功能，也可以直接完全重写
 */
var LazierDocs = {
    /** 容器，默认使用整个 document.body  */
    container: document.body,
    /**
     * 渲染md
     * @param {string} mdText 
     * @returns {string}
     */
    parseMarkdown(mdText) {
        return window.markdownit().render(mdText);
    },
    /**
     * 不同页面内容使用不同的处理  
     * 目前处理的列表
     * * `.md` 后缀
     * * `/index.html` 主页
     */
    htmlOnload() {
        this.hookWinddowOnloadBefore();
        // 渲染 .md 文件
        if (location.pathname.endsWith('.md')) {
            this.loadMarkdown();
            this.hookLoadedMD()
        }
        // 缓存数据
        if (location.pathname.endsWith('/index.html')) {
            this.hookCacheMdList();
        }
        this.hookWinddowOnloadAfter();
    },
    /**
     * 使用 marked 加载 mdText 字符串到 document.body , 如果没有传递变量则尝试从 window.mdText 读取  
     * 可以进行重写使用自定义的渲染方案
     * @param {string} mdText md字符串内容
     */
    loadMarkdown(mdText) {
        let mdBody = mdText || window.mdText || '';
        if (mdBody != '') {
            mdBody = new TextDecoder().decode(new Uint8Array(mdBody.split(',').map(Number)));
            this.hookMDBody();
            this.container.innerHTML = this.parseMarkdown(mdBody);
        }
    },
    /**
     * 缓存列表。默认不进行任何缓存。外部如果需要缓存则将其重写即可  
     * 只需要使用 fetch('url') 请求所有需要缓存的文件即可进行缓存
     */
    hookCacheMdList() { },
    /** hook 渲染完成md之后 */
    hookLoadedMD() { },
    /** hook 渲染前的md文件内容 */
    hookMDBody() { },
    /** hook 调用window.onload前 */
    hookWinddowOnloadBefore() { },
    /** hook 调用window.onload后 */
    hookWinddowOnloadAfter() { },
};

// 主函数自运行
(() => {
    registerServiceWorker();
    window.onload = () => LazierDocs.htmlOnload();
})();

/**
 * 注册 Service Worker
 * @returns 
 */
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        if (navigator.serviceWorker.controller) {
            return console.log('Service Worker 已处于控制状态');
        }
        // 检查 sw.js 文件是否存在
        fetch('sw.js', { method: 'HEAD' }).then(response => {
            if (response.ok) {
                // 注册 sw
                return navigator.serviceWorker.register('sw.js')
                    .then(registration => console.log('Service Worker 注册成功:', registration))
                    .catch(error => console.log('Service Worker 注册失败:', error));
            }
        }).catch(() => console.log('sw.js 不存在，跳过注册'));
    }
}

/**
 * 清理缓存函数
 */
function clearCache() {
    fetch('clearSWCache').then(response => response.json())
        .then(data => {
            alert(data.message);
            if (data.success) {
                // 清理成功后刷新页面
                window.location.reload();
            }
        }).catch(error => alert('清理缓存失败: ' + error.message));
}