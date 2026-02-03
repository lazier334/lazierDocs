(function () {
    'use strict';

    // 创建并插入CSS样式
    const style = document.createElement('style');
    style.textContent = `
        .dynamic-toolbar {
            position: fixed;
            z-index: 10000;
            font-family: Arial, sans-serif;
        }
        
        .toolbar-main-btn {
            background: #4a6ee0;
            color: white;
            border: none;
            padding: 10px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
        }
        
        .toolbar-main-btn:hover {
            background: #3a5ecf;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
        
        .toolbar-dropdown {
            position: absolute;
            background: white;
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            min-width: 150px;
            max-height: 300px;
            overflow-y: auto;
            display: none;
            z-index: 10001;
            border: 1px solid #e0e0e0;
            max-width: 50vw;
            width: max-content;
            white-space: nowrap;
        }
        
        .toolbar-dropdown.show {
            display: block;
            animation: fadeIn 0.2s ease;
        }
        
        .toolbar-item {
            padding: 10px 16px;
            cursor: pointer;
            border-bottom: 1px solid #f0f0f0;
            transition: background 0.2s ease;
            font-size: 14px;
        }
        
        .toolbar-item:last-child {
            border-bottom: none;
        }
        
        .toolbar-item:hover {
            background: #f5f7ff;
        }
        
        .position-top-left {
            top: 20px;
            left: 20px;
        }
        
        .position-top-right {
            top: 20px;
            right: 20px;
        }
        
        .position-bottom-left {
            bottom: 20px;
            left: 20px;
        }
        
        .position-bottom-right {
            bottom: 20px;
            right: 20px;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
            .dynamic-toolbar {
                transform: scale(1);
            }

            .toolbar-main-btn {
                min-height: 44px;
                padding: 12px 16px;
                font-size: 16px;
            }

            .toolbar-dropdown {
                max-width: 80vw;
                width: max-content;
                min-width: 200px;
                max-height: 50vh;
                white-space: normal;
                overflow-y: auto;
            }

            .toolbar-item {
                min-height: 44px;
                padding: 12px 16px;
                font-size: 16px;
                line-height: 1.4;
                white-space: normal;
                word-wrap: break-word;
            }
        }

        @media (max-width: 320px) {
            .toolbar-dropdown {
                max-width: 95vw;
                min-width: 180px;
            }

            .dynamic-toolbar {
                transform: scale(0.95);
            }
        }

        /* 安全区域适配（针对有刘海或圆弧屏幕的设备） */
        @supports (padding: max(0px)) {

            .position-bottom-left,
            .position-bottom-right {
                padding-bottom: env(safe-area-inset-bottom, 0px);
            }

            .position-top-left,
            .position-top-right {
                padding-top: env(safe-area-inset-top, 0px);
            }
        }
    `;
    document.head.appendChild(style);

    // 创建工具栏类
    class DynamicToolbar {

        constructor(options = {}, cssHandler, notInit) {
            this.options = {
                position: 'top-right', // 默认位置
                buttonText: '菜单 ▼',
                items: [
                    { html: '选项1', action: () => alert('选项1被点击') },
                    { html: '选项2', action: () => alert('选项2被点击') },
                    { html: '选项3', action: () => alert('选项3被点击') }
                ],
                ...options
            };

            this.isOpen = false;
            this.instanceId = 'toolbar_' + Math.random().toString(36).substring(2, 9);
            if (typeof cssHandler == 'function') this.style = cssHandler(this.instanceId);
            if (!notInit) this.init();
        }

        init() {
            try {
                this.createToolbar();
                this.bindEvents();
                this.setPosition(this.options.position);
            } catch (err) {
                console.error('err', err)
            }

        }

        createToolbar() {
            // 创建工具栏容器
            this.toolbar = document.createElement('div');
            this.toolbar.className = 'dynamic-toolbar';
            this.toolbar.setAttribute('data-toolbar-id', this.instanceId);

            // 创建并插入CSS样式
            const style = document.createElement('style');
            style.textContent = this.style || '';
            this.toolbar.appendChild(style);
            // 使用后删除
            delete this.style;

            // 创建主按钮
            this.mainButton = document.createElement('button');
            this.mainButton.className = 'toolbar-main-btn';
            this.mainButton.textContent = this.options.buttonText;
            this.mainButton.innerHTML = `${this.options.buttonText}`;

            // 创建下拉菜单
            this.dropdown = document.createElement('div');
            this.dropdown.className = 'toolbar-dropdown';

            // 创建菜单项
            this.options.items.forEach(item => {
                const menuItem = document.createElement('div');
                menuItem.className = 'toolbar-item';
                menuItem.innerHTML = item.html;
                if (typeof item.action == 'function') {
                    menuItem.addEventListener('click', (e) => {
                        e.stopPropagation();
                        item.action();
                        this.hideDropdown();
                    });
                }
                this.dropdown.appendChild(menuItem);
            });

            // 组装工具栏
            this.toolbar.appendChild(this.mainButton);
            this.toolbar.appendChild(this.dropdown);

            // 添加到页面
            document.body.appendChild(this.toolbar);
        }

        bindEvents() {
            // 主按钮点击事件
            this.mainButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown();
            });

            // 点击页面其他区域关闭下拉菜单
            document.addEventListener('click', () => {
                this.hideDropdown();
            });

            // 阻止下拉菜单内部点击事件冒泡
            this.dropdown.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        toggleDropdown() {
            this.isOpen = !this.isOpen;
            if (this.isOpen) {
                this.showDropdown();
            } else {
                this.hideDropdown();
            }
        }

        showDropdown() {
            this.dropdown.classList.add('show');
            this.isOpen = true;

            // 根据位置调整下拉菜单方向
            this.adjustDropdownPosition();
        }

        hideDropdown() {
            this.dropdown.classList.remove('show');
            this.isOpen = false;
        }

        adjustDropdownPosition() {
            const rect = this.toolbar.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;

            // 重置样式
            this.dropdown.style.top = '';
            this.dropdown.style.bottom = '';
            this.dropdown.style.left = '';
            this.dropdown.style.right = '';

            // 移动端特定适配（不改变基本布局逻辑）
            if (viewportWidth <= 480) {
                // 确保下拉菜单不会超出视口右侧
                const dropdownRect = this.dropdown.getBoundingClientRect();
                const maxAllowedWidth = viewportWidth - 20; // 留出边距

                if (dropdownRect.width > maxAllowedWidth) {
                    this.dropdown.style.maxWidth = maxAllowedWidth + 'px';
                }
            }

            if (this.options.position.includes('bottom')) {
                // 如果工具栏在底部，下拉菜单向上展开
                this.dropdown.style.bottom = '100%';
                this.dropdown.style.top = 'auto';
            } else {
                // 默认向下展开
                this.dropdown.style.top = '100%';
                this.dropdown.style.bottom = 'auto';
            }

            if (this.options.position.includes('right')) {
                this.dropdown.style.right = '0';
                this.dropdown.style.left = 'auto';
            } else {
                this.dropdown.style.left = '0';
                this.dropdown.style.right = 'auto';
            }
        }

        setPosition(position) {
            // 移除旧的位置类
            const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
            positions.forEach(pos => {
                this.toolbar.classList.remove(`position-${pos}`);
            });

            // 添加新的位置类
            this.toolbar.classList.add(`position-${position}`);
            this.options.position = position;

            // 调整下拉菜单位置
            if (this.isOpen) {
                this.adjustDropdownPosition();
            }
        }

        updateItems(newItems) {
            // 清空现有菜单项
            this.dropdown.innerHTML = '';

            // 添加新菜单项
            newItems.forEach(item => {
                const menuItem = document.createElement('div');
                menuItem.className = 'toolbar-item';
                menuItem.textContent = item.text;
                menuItem.addEventListener('click', (e) => {
                    e.stopPropagation();
                    item.action();
                    this.hideDropdown();
                });
                this.dropdown.appendChild(menuItem);
            });

            this.options.items = newItems;
        }

        destroy() {
            if (this.toolbar && this.toolbar.parentNode) {
                this.toolbar.parentNode.removeChild(this.toolbar);
            }
        }
    }

    // 将工具栏类暴露给全局作用域
    window.DynamicToolbar = DynamicToolbar;
})();