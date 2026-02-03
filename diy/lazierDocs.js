/**
 * 文档全局对象，可以通过修改内部的钩子函数拓展功能，也可以直接完全重写
 */
var LazierDocs = {
    localStorageName: 'LazierDocs-cacheFiles',
    /** 缓存 */
    caches: {
        /** 
         * 临时生成的link标签元素  
         * @type {HTMLLinkElement}
         */
        baseLinkElement: null,
    },
    /** 是否运行markdown中的js脚本 */
    runScript: true,
    /** 容器，默认使用整个 document.body  */
    container: document.body,
    /**
     * 加载单独的css，参数为 ban 的时候禁用主题  
     * 可以重写，和 this.caches.themeList 挂钩，重写时可以将 this.caches.themeList 删除
     * @param {string | 'ban'} cssUrl 主题
     */
    loadSingleCss(cssUrl) {
        if (cssUrl == undefined) cssUrl = new URLSearchParams(location.search).get('theme') || 'ban';
        if (cssUrl == 'ban') return;
        if (!this.caches.baseLinkElement) {
            this.caches.baseLinkElement = document.createElement('link');
            this.caches.baseLinkElement.rel = 'stylesheet';
            document.head.appendChild(this.caches.baseLinkElement);
        }
        this.caches.baseLinkElement.href = cssUrl;
    },
    /**
     * 渲染md
     * @param {string} mdText 
     * @returns {string}
     */
    parseMarkdown(mdText) {
        return window.markdownit({
            html: true,
            linkify: true,
            typographer: true
        }).render(mdText);
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
            this.loadSingleCss();
            this.container.innerHTML = this.parseMarkdown(mdBody);
            if (this.runScript) this.executeScripts(this.container);
        }
    },
    /**
     * 遍历容器内所有script标签，重建执行并删除原无效节点
     * @param {HTMLElement} container 
     */
    executeScripts(container) {
        const scripts = Array.from(container.querySelectorAll('script'));
        scripts.forEach(oldScript => {
            // 创建script元素后复制原script的所有属性与内联脚本代码，这种创建能够执行标签内的js代码
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach(attr => {
                newScript.setAttribute(attr.name, attr.value);
            });
            newScript.textContent = oldScript.textContent;
            // 用新脚本替换原无效脚本（保持DOM结构不变，位置和原script一致）
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
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
    /**
     * 更新缓存指定后缀函数
     */
    updateCacheFiles(data) {
        localStorage.setItem(LazierDocs.localStorageName, JSON.stringify(data));
        fetch('SWAPI/updateCacheFiles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(response => response.json())
            .then(data => console.log('更新结束: ' + data.message))
            .catch(error => alert('更新失败: ' + error.message));
    }
};

// 主函数自运行
(() => {
    // 从window对象和url读取参数，如果存在 bansw 且为真则禁用sw
    let banswQuery = new URLSearchParams(location.search).get('bansw');
    if (banswQuery == null || ['false', 'null', 'undefined', '0', ''].includes(banswQuery.toLowerCase())) banswQuery = false;
    if (!(window.bansw || banswQuery)) {
        registerServiceWorker();
    }
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
    fetch('SWAPI/clearSWCache').then(response => response.json())
        .then(data => {
            alert(data.message);
            if (data.success) {
                // 清理成功后刷新页面
                window.location.reload();
            }
        }).catch(error => alert('清理缓存失败: ' + error.message));
}
