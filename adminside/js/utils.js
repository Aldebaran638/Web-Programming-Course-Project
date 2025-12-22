// 通用工具函数库 - 优化合并版
const Utils = {
    // ==================== 核心工具函数 ====================
    
    /**
     * 防抖函数 - 优化版
     * @param {Function} func 需要防抖的函数
     * @param {number} wait 等待时间(毫秒)
     * @param {boolean} immediate 是否立即执行
     * @returns {Function} 防抖处理后的函数
     */
    debounce: function(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const context = this;
            const later = () => {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    },

    /**
     * 节流函数 - 优化版
     * @param {Function} func 需要节流的函数
     * @param {number} limit 时间间隔(毫秒)
     * @param {boolean} trailing 是否在结束后再执行一次
     * @returns {Function} 节流处理后的函数
     */
    throttle: function(func, limit, trailing = true) {
        let inThrottle, lastFunc, lastRan;
        return function(...args) {
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                lastRan = Date.now();
                inThrottle = true;
            } else {
                if (trailing) {
                    clearTimeout(lastFunc);
                    lastFunc = setTimeout(function() {
                        if ((Date.now() - lastRan) >= limit) {
                            func.apply(context, args);
                            lastRan = Date.now();
                        }
                    }, limit - (Date.now() - lastRan));
                }
            }
        };
    },

    // ==================== 日期时间处理 ====================
    
    /**
     * 格式化日期 - 增强版
     * @param {Date|string|number} date 日期对象、字符串或时间戳
     * @param {string} format 格式字符串，支持：YYYY-MM-DD HH:mm:ss
     * @returns {string} 格式化后的日期字符串
     */
    formatDate: function(date, format = 'YYYY-MM-DD HH:mm:ss') {
        if (!date) return '';
        
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');
        const week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];

        return format
            .replace('YYYY', year)
            .replace('YY', String(year).slice(2))
            .replace('MM', month)
            .replace('M', d.getMonth() + 1)
            .replace('DD', day)
            .replace('D', d.getDate())
            .replace('HH', hours)
            .replace('H', d.getHours())
            .replace('mm', minutes)
            .replace('m', d.getMinutes())
            .replace('ss', seconds)
            .replace('s', d.getSeconds())
            .replace('WW', week)
            .replace('Q', Math.floor((d.getMonth() + 3) / 3)); // 季度
    },

    /**
     * 获取相对时间描述
     * @param {Date|string|number} date 日期
     * @returns {string} 相对时间描述
     */
    getRelativeTime: function(date) {
        const now = new Date();
        const d = new Date(date);
        const diff = now - d;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return '刚刚';
        if (minutes < 60) return `${minutes}分钟前`;
        if (hours < 24) return `${hours}小时前`;
        if (days < 7) return `${days}天前`;
        return this.formatDate(d, 'YYYY-MM-DD');
    },

    // ==================== 数据处理 ====================
    
    /**
     * 深度克隆对象
     * @param {*} obj 要克隆的对象
     * @returns {*} 克隆后的对象
     */
    deepClone: function(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof RegExp) return new RegExp(obj);
        if (obj instanceof Map) return new Map(Array.from(obj.entries()));
        if (obj instanceof Set) return new Set(Array.from(obj.values()));
        
        const clone = Array.isArray(obj) ? [] : {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clone[key] = this.deepClone(obj[key]);
            }
        }
        return clone;
    },

    /**
     * 安全获取对象属性 - 增强版
     * @param {Object} obj 对象
     * @param {string|Array} path 属性路径
     * @param {*} defaultValue 默认值
     * @returns {*} 属性值或默认值
     */
    get: function(obj, path, defaultValue) {
        if (!obj || typeof obj !== 'object') return defaultValue;
        
        const keys = Array.isArray(path) ? path : path.replace(/\[(\w+)\]/g, '.$1').split('.');
        let result = obj;
        
        for (const key of keys) {
            if (result === null || result === undefined || !result.hasOwnProperty(key)) {
                return defaultValue;
            }
            result = result[key];
        }
        
        return result === undefined ? defaultValue : result;
    },

    // ==================== 数据验证 ====================
    
    /**
     * 验证邮箱格式
     * @param {string} email 邮箱地址
     * @returns {boolean} 是否有效
     */
    isValidEmail: function(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    /**
     * 验证手机号格式（中国）
     * @param {string} phone 手机号
     * @returns {boolean} 是否有效
     */
    isValidPhone: function(phone) {
        const re = /^1[3-9]\d{9}$/;
        return re.test(phone);
    },

    /**
     * 验证身份证格式
     * @param {string} idCard 身份证号
     * @returns {boolean} 是否有效
     */
    validateIDCard: function(idCard) {
        const re = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
        return re.test(idCard);
    },

    /**
     * 验证密码强度
     * @param {string} password 密码
     * @param {Object} options 配置选项
     * @returns {Object} 验证结果
     */
    validatePassword: function(password, options = {}) {
        const defaults = {
            minLength: 8,
            requireUpperCase: true,
            requireLowerCase: true,
            requireNumbers: true,
            requireSpecialChars: true
        };
        const config = { ...defaults, ...options };
        
        const validations = {
            length: password.length >= config.minLength,
            upperCase: !config.requireUpperCase || /[A-Z]/.test(password),
            lowerCase: !config.requireLowerCase || /[a-z]/.test(password),
            numbers: !config.requireNumbers || /\d/.test(password),
            specialChars: !config.requireSpecialChars || /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };
        
        const isValid = Object.values(validations).every(v => v);
        const strength = Object.values(validations).filter(v => v).length / Object.keys(validations).length;
        
        return {
            isValid,
            strength,
            validations
        };
    },

    // ==================== 本地存储操作 ====================
    
    /**
     * 存储到本地存储 - 增强版
     * @param {string} key 键名
     * @param {*} value 值
     * @param {Object} options 选项
     * @returns {boolean} 是否成功
     */
    setStorage: function(key, value, options = {}) {
        try {
            const defaults = {
                expire: null, // 过期时间（毫秒）
                isJson: true
            };
            const config = { ...defaults, ...options };
            
            const data = {
                value: config.isJson ? value : value.toString(),
                timestamp: Date.now(),
                expire: config.expire
            };
            
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('存储失败:', error);
            return false;
        }
    },

    /**
     * 从本地存储读取 - 增强版
     * @param {string} key 键名
     * @param {Object} options 选项
     * @returns {*} 存储的值或null
     */
    getStorage: function(key, options = {}) {
        try {
            const defaults = {
                isJson: true,
                removeIfExpired: true
            };
            const config = { ...defaults, ...options };
            
            const dataStr = localStorage.getItem(key);
            if (!dataStr) return null;
            
            const data = JSON.parse(dataStr);
            
            // 检查是否过期
            if (data.expire && Date.now() - data.timestamp > data.expire) {
                if (config.removeIfExpired) {
                    localStorage.removeItem(key);
                }
                return null;
            }
            
            return config.isJson ? data.value : data.value.toString();
        } catch (error) {
            console.error('读取失败:', error);
            return null;
        }
    },

    /**
     * 从本地存储删除
     * @param {string} key 键名
     * @returns {boolean} 是否成功
     */
    removeStorage: function(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('删除失败:', error);
            return false;
        }
    },

    /**
     * 清空所有本地存储
     * @param {Array} excludeKeys 要排除的键名数组
     */
    clearStorage: function(excludeKeys = []) {
        try {
            if (excludeKeys.length === 0) {
                localStorage.clear();
            } else {
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (!excludeKeys.includes(key)) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(key => localStorage.removeItem(key));
            }
            return true;
        } catch (error) {
            console.error('清空失败:', error);
            return false;
        }
    },

    // ==================== UI相关工具 ====================
    
    /**
     * 显示消息通知 - 优化版
     * @param {string} message 消息内容
     * @param {string} type 通知类型: success|error|warning|info
     * @param {Object} options 选项
     * @returns {HTMLElement} 通知元素
     */
    showNotification: function(message, type = 'info', options = {}) {
        const defaults = {
            duration: 3000,
            position: 'top-right',
            closable: true,
            autoClose: true,
            icon: true
        };
        const config = { ...defaults, ...options };
        
        // 创建通知容器
        const containerId = `notification-container-${config.position}`;
        let container = document.getElementById(containerId);
        if (!container) {
            container = document.createElement('div');
            container.id = containerId;
            container.className = 'notification-container';
            container.style.cssText = `
                position: fixed;
                ${config.position.includes('top') ? 'top: 20px;' : 'bottom: 20px;'}
                ${config.position.includes('left') ? 'left: 20px;' : 'right: 20px;'}
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 400px;
            `;
            document.body.appendChild(container);
        }

        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-width: 300px;
            animation: slideIn 0.3s ease;
            margin-bottom: 10px;
        `;

        // 创建内容
        const content = document.createElement('div');
        content.className = 'notification-content';
        content.style.cssText = 'display: flex; align-items: center; flex: 1;';
        
        if (config.icon) {
            const icon = document.createElement('i');
            icon.className = `fas ${this.getNotificationIcon(type)}`;
            icon.style.marginRight = '10px';
            content.appendChild(icon);
        }
        
        const text = document.createElement('span');
        text.textContent = message;
        content.appendChild(text);
        
        notification.appendChild(content);

        // 添加关闭按钮
        if (config.closable) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'notification-close';
            closeBtn.style.cssText = `
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                margin-left: 15px;
                opacity: 0.8;
                padding: 0;
                min-width: auto;
            `;
            
            const closeIcon = document.createElement('i');
            closeIcon.className = 'fas fa-times';
            closeBtn.appendChild(closeIcon);
            
            closeBtn.addEventListener('click', () => {
                this.removeNotification(notification, container);
            });
            
            notification.appendChild(closeBtn);
        }

        // 添加到容器
        container.appendChild(notification);

        // 自动关闭
        if (config.autoClose && config.duration > 0) {
            setTimeout(() => {
                this.removeNotification(notification, container);
            }, config.duration);
        }

        return notification;
    },

    /**
     * 移除通知
     * @param {HTMLElement} notification 通知元素
     * @param {HTMLElement} container 容器元素
     */
    removeNotification: function(notification, container) {
        notification.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
                // 如果容器为空，移除容器
                if (container && container.children.length === 0) {
                    container.parentNode.removeChild(container);
                }
            }
        }, 300);
    },

    /**
     * 确认对话框
     * @param {string} message 消息内容
     * @param {Object} options 选项
     * @returns {Promise<boolean>} 用户选择结果
     */
    confirmDialog: function(message, options = {}) {
        return new Promise((resolve) => {
            const defaults = {
                title: '确认',
                confirmText: '确定',
                cancelText: '取消',
                type: 'warning'
            };
            const config = { ...defaults, ...options };
            
            // 创建遮罩层
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.3s ease;
            `;
            
            // 创建对话框
            const dialog = document.createElement('div');
            dialog.style.cssText = `
                background: white;
                border-radius: 8px;
                box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
                width: 90%;
                max-width: 400px;
                overflow: hidden;
                animation: slideUp 0.3s ease;
            `;
            
            // 对话框内容
            dialog.innerHTML = `
                <div style="padding: 20px;">
                    <h3 style="margin: 0 0 10px 0; color: #333; display: flex; align-items: center; gap: 10px;">
                        <i class="fas ${this.getNotificationIcon(config.type)}" 
                           style="color: ${this.getNotificationColor(config.type).split('gradient')[0] || '#f39c12'}"></i>
                        ${config.title}
                    </h3>
                    <p style="margin: 0; color: #666; line-height: 1.5;">${message}</p>
                </div>
                <div style="padding: 15px 20px; background: #f8f9fa; display: flex; justify-content: flex-end; gap: 10px;">
                    <button class="cancel-btn" style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        ${config.cancelText}
                    </button>
                    <button class="confirm-btn" style="padding: 8px 16px; background: ${this.getNotificationColor(config.type).split('gradient')[0] || '#007bff'}; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        ${config.confirmText}
                    </button>
                </div>
            `;
            
            overlay.appendChild(dialog);
            document.body.appendChild(overlay);
            
            // 添加动画样式
            if (!document.querySelector('#dialog-animations')) {
                const style = document.createElement('style');
                style.id = 'dialog-animations';
                style.textContent = `
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes slideUp {
                        from { transform: translateY(50px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                `;
                document.head.appendChild(style);
            }
            
            // 绑定事件
            dialog.querySelector('.cancel-btn').addEventListener('click', () => {
                document.body.removeChild(overlay);
                resolve(false);
            });
            
            dialog.querySelector('.confirm-btn').addEventListener('click', () => {
                document.body.removeChild(overlay);
                resolve(true);
            });
            
            // 点击遮罩层关闭
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    document.body.removeChild(overlay);
                    resolve(false);
                }
            });
        });
    },

    /**
     * 显示加载动画
     * @param {string} text 加载文本
     * @param {Object} options 选项
     * @returns {HTMLElement} 加载动画元素
     */
    showLoading: function(text = '加载中...', options = {}) {
        const defaults = {
            background: 'rgba(255, 255, 255, 0.8)',
            zIndex: 9998
        };
        const config = { ...defaults, ...options };
        
        // 移除现有的加载动画
        this.hideLoading();
        
        // 创建遮罩层
        const overlay = document.createElement('div');
        overlay.id = 'global-loading';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: ${config.background};
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: ${config.zIndex};
        `;
        
        // 创建加载动画
        const spinner = document.createElement('div');
        spinner.style.cssText = `
            text-align: center;
            padding: 30px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        spinner.innerHTML = `
            <div style="width: 50px; height: 50px; border: 5px solid #f3f3f3; border-top: 5px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 15px;"></div>
            <div style="color: #333; font-weight: 600;">${text}</div>
        `;
        
        overlay.appendChild(spinner);
        document.body.appendChild(overlay);
        
        // 添加动画样式
        if (!document.querySelector('#spinner-animation')) {
            const style = document.createElement('style');
            style.id = 'spinner-animation';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
        
        return overlay;
    },

    /**
     * 隐藏加载动画
     */
    hideLoading: function() {
        const loading = document.getElementById('global-loading');
        if (loading) {
            document.body.removeChild(loading);
        }
    },

    // ==================== URL处理 ====================
    
    /**
     * 获取URL查询参数
     * @param {string} name 参数名
     * @param {string} url URL地址，默认使用当前URL
     * @returns {string|null} 参数值
     */
    getQueryParam: function(name, url = window.location.href) {
        const param = new URLSearchParams(new URL(url).search);
        return param.get(name);
    },

    /**
     * 设置URL查询参数
     * @param {string} name 参数名
     * @param {string} value 参数值
     * @param {string} url 基础URL，默认使用当前URL
     * @returns {string} 新的URL
     */
    setQueryParam: function(name, value, url = window.location.href) {
        const urlObj = new URL(url);
        urlObj.searchParams.set(name, value);
        return urlObj.toString();
    },

    /**
     * 移除URL查询参数
     * @param {string} name 参数名
     * @param {string} url 基础URL，默认使用当前URL
     * @returns {string} 新的URL
     */
    removeQueryParam: function(name, url = window.location.href) {
        const urlObj = new URL(url);
        urlObj.searchParams.delete(name);
        return urlObj.toString();
    },

    /**
     * 获取所有URL查询参数
     * @param {string} url URL地址，默认使用当前URL
     * @returns {Object} 参数对象
     */
    getAllQueryParams: function(url = window.location.href) {
        const params = new URLSearchParams(new URL(url).search);
        const result = {};
        for (const [key, value] of params) {
            result[key] = value;
        }
        return result;
    },

    // ==================== 文件处理 ====================
    
    /**
     * 导出数据为CSV文件
     * @param {Array} data 数据数组
     * @param {string} filename 文件名
     * @param {Object} options 选项
     */
    exportToCSV: function(data, filename = 'data.csv', options = {}) {
        const defaults = {
            headers: null,
            delimiter: ',',
            quote: '"'
        };
        const config = { ...defaults, ...options };
        
        if (!data || data.length === 0) {
            console.warn('没有数据可以导出');
            return;
        }
        
        // 确定表头
        const headers = config.headers || Object.keys(data[0]);
        
        // 构建CSV内容
        const csvRows = [];
        
        // 添加表头
        csvRows.push(headers.map(header => 
            config.quote + header.replace(new RegExp(config.quote, 'g'), config.quote + config.quote) + config.quote
        ).join(config.delimiter));
        
        // 添加数据行
        data.forEach(row => {
            const values = headers.map(header => {
                const value = row[header];
                const strValue = value === null || value === undefined ? '' : String(value);
                return config.quote + strValue.replace(new RegExp(config.quote, 'g'), config.quote + config.quote) + config.quote;
            });
            csvRows.push(values.join(config.delimiter));
        });
        
        const csvContent = csvRows.join('\n');
        
        // 创建下载链接
        const blob = new Blob(['\ufeff' + csvContent], { 
            type: 'text/csv;charset=utf-8;' 
        });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.href = url;
        link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 释放URL对象
        setTimeout(() => URL.revokeObjectURL(url), 100);
    },

    /**
     * 导出数据为Excel文件（使用CSV模拟）
     * @param {Array} data 数据数组
     * @param {string} filename 文件名
     */
    exportToExcel: function(data, filename = 'data.xlsx') {
        this.exportToCSV(data, filename.replace('.xlsx', '.csv'));
    },

    /**
     * 读取文件内容
     * @param {File} file 文件对象
     * @param {string} type 读取类型：text|arrayBuffer|dataURL
     * @returns {Promise} 文件内容
     */
    readFile: function(file, type = 'text') {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('没有提供文件'));
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('文件读取失败'));
            
            switch (type) {
                case 'text':
                    reader.readAsText(file);
                    break;
                case 'arrayBuffer':
                    reader.readAsArrayBuffer(file);
                    break;
                case 'dataURL':
                    reader.readAsDataURL(file);
                    break;
                default:
                    reject(new Error('不支持的读取类型'));
            }
        });
    },

    // ==================== 其他工具函数 ====================
    
    /**
     * 生成唯一ID
     * @param {number} length ID长度
     * @returns {string} 唯一ID
     */
    generateId: function(length = 16) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },

    /**
     * 复制文本到剪贴板
     * @param {string} text 要复制的文本
     * @returns {Promise} 复制结果
     */
    copyToClipboard: function(text) {
        return new Promise((resolve, reject) => {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(resolve).catch(reject);
            } else {
                // 降级方案
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    document.execCommand('copy');
                    resolve();
                } catch (err) {
                    reject(err);
                } finally {
                    document.body.removeChild(textarea);
                }
            }
        });
    },

    /**
     * 检测设备类型
     * @returns {string} 设备类型：mobile|tablet|desktop
     */
    getDeviceType: function() {
        const ua = navigator.userAgent;
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
            return "tablet";
        }
        if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
            return "mobile";
        }
        return "desktop";
    },

    /**
     * 加载脚本
     * @param {string} url 脚本URL
     * @returns {Promise} 加载结果
     */
    loadScript: function(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },

    /**
     * 加载CSS
     * @param {string} url CSS URL
     * @returns {Promise} 加载结果
     */
    loadCSS: function(url) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = url;
            link.onload = resolve;
            link.onerror = reject;
            document.head.appendChild(link);
        });
    },

    /**
     * 生成随机颜色
     * @param {string} type 颜色类型：hex|rgb|rgba
     * @returns {string} 颜色值
     */
    getRandomColor: function(type = 'hex') {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        const a = Math.random().toFixed(2);
        
        switch (type) {
            case 'rgb':
                return `rgb(${r}, ${g}, ${b})`;
            case 'rgba':
                return `rgba(${r}, ${g}, ${b}, ${a})`;
            case 'hex':
            default:
                return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        }
    },

    /**
     * 计算字符串的哈希值
     * @param {string} str 字符串
     * @returns {number} 哈希值
     */
    hashString: function(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash;
    },

    /**
     * HTML安全编码
     * @param {string} text 要编码的文本
     * @returns {string} 编码后的文本
     */
    escapeHtml: function(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    },

    /**
     * 获取通知图标
     * @param {string} type 通知类型
     * @returns {string} 图标类名
     */
    getNotificationIcon: function(type) {
        switch(type) {
            case 'success': return 'fa-check-circle';
            case 'error': return 'fa-exclamation-circle';
            case 'warning': return 'fa-exclamation-triangle';
            default: return 'fa-info-circle';
        }
    },

    /**
     * 获取通知颜色
     * @param {string} type 通知类型
     * @returns {string} 颜色值
     */
    getNotificationColor: function(type) {
        switch(type) {
            case 'success': return '#27ae60';
            case 'error': return '#e74c3c';
            case 'warning': return '#f39c12';
            default: return '#3498db';
        }
    }
};

// 导出到全局作用域
window.Utils = Utils;

// 自动添加必要的CSS样式
if (!document.querySelector('#utils-global-styles')) {
    const style = document.createElement('style');
    style.id = 'utils-global-styles';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slideUp {
            from { transform: translateY(50px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
}
// 在Utils对象中添加以下方法：

Utils.api = {
    /**
     * 发起API请求
     * @param {string} endpoint API端点
     * @param {Object} options 请求选项
     * @returns {Promise} 请求结果
     */
    request: async function(endpoint, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        // 添加认证token
        const token = localStorage.getItem('teaching_admin_token');
        if (token) {
            defaultOptions.headers['Authorization'] = `Bearer ${token}`;
        }
        
        const finalOptions = { ...defaultOptions, ...options };
        
        try {
            const response = await fetch(`/api/v1/${endpoint}`, finalOptions);
            
            // 处理HTTP错误状态
            if (!response.ok) {
                if (response.status === 401) {
                    // Token过期，跳转到登录页
                    localStorage.removeItem('teaching_admin_token');
                    window.location.href = '/login.html';
                    throw new Error('认证已过期，请重新登录');
                } else if (response.status === 403) {
                    throw new Error('无权访问该资源');
                } else if (response.status === 404) {
                    throw new Error('请求的资源不存在');
                } else if (response.status === 500) {
                    throw new Error('服务器内部错误');
                } else {
                    throw new Error(`请求失败: ${response.status} ${response.statusText}`);
                }
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || '请求失败');
            }
            
            return data;
        } catch (error) {
            console.error('API请求失败:', error);
            throw error;
        }
    },
    
    /**
     * GET请求
     * @param {string} endpoint API端点
     * @param {Object} params 查询参数
     * @returns {Promise} 请求结果
     */
    get: function(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'GET' });
    },
    
    /**
     * POST请求
     * @param {string} endpoint API端点
     * @param {Object} data 请求数据
     * @returns {Promise} 请求结果
     */
    post: function(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    /**
     * PUT请求
     * @param {string} endpoint API端点
     * @param {Object} data 请求数据
     * @returns {Promise} 请求结果
     */
    put: function(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    /**
     * DELETE请求
     * @param {string} endpoint API端点
     * @returns {Promise} 请求结果
     */
    delete: function(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    },
    
    /**
     * 上传文件
     * @param {string} endpoint API端点
     * @param {File} file 文件对象
     * @param {Object} formData 其他表单数据
     * @returns {Promise} 上传结果
     */
    upload: async function(endpoint, file, formData = {}) {
        const data = new FormData();
        data.append('file', file);
        
        for (const [key, value] of Object.entries(formData)) {
            data.append(key, value);
        }
        
        const token = localStorage.getItem('teaching_admin_token');
        
        try {
            const response = await fetch(`/api/v1/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: data
            });
            
            return await response.json();
        } catch (error) {
            console.error('文件上传失败:', error);
            throw error;
        }
    },
    
    /**
     * 下载文件
     * @param {string} endpoint API端点
     * @param {string} filename 文件名
     * @param {Object} params 查询参数
     */
    download: async function(endpoint, filename = 'download', params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = `/api/v1/${endpoint}${queryString ? '?' + queryString : ''}`;
        
        const token = localStorage.getItem('teaching_admin_token');
        
        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`下载失败: ${response.status} ${response.statusText}`);
            }
            
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('文件下载失败:', error);
            throw error;
        }
    }
};