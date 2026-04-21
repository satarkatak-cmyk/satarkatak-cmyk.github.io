/**
 * Centralized Utilities System
 * Consolidates all utility functions into a single, organized system
 */

class CentralUtils {
    constructor() {
        this.cache = new Map();
        this.debounceTimers = new Map();
        this.throttleTimers = new Map();
        this.performanceMetrics = {
            cacheHits: 0,
            cacheMisses: 0,
            functionCalls: 0
        };
    }

    // ==================== STRING UTILITIES ====================
    
    /**
     * Convert English digits to Nepali digits
     */
    toNepaliDigits(str) {
        const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
        return str.toString().replace(/\d/g, digit => nepaliDigits[parseInt(digit)]);
    }

    /**
     * Convert Nepali digits to English digits
     */
    toEnglishDigits(str) {
        const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
        return str.replace(/[०१२३४५६७८९]/g, digit => nepaliDigits.indexOf(digit));
    }

    /**
     * Capitalize first letter of each word
     */
    capitalizeWords(str) {
        return str.replace(/\b\w/g, char => char.toUpperCase());
    }

    /**
     * Truncate text with ellipsis
     */
    truncate(text, length = 50, suffix = '...') {
        if (text.length <= length) return text;
        return text.substring(0, length - suffix.length) + suffix;
    }

    /**
     * Generate random string
     */
    randomString(length = 10, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return result;
    }

    // ==================== DATE UTILITIES ====================
    
    /**
     * Format date in Nepali format
     */
    formatNepaliDate(date, format = 'YYYY-MM-DD') {
        if (!date) return '';
        
        // Use NepaliCalendar if available
        if (window.NepaliCalendar) {
            return window.NepaliCalendar.format(date, format);
        }
        
        // Fallback to standard formatting
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        
        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day);
    }

    /**
     * Get relative time (e.g., "2 hours ago")
     */
    getRelativeTime(date) {
        const now = new Date();
        const past = new Date(date);
        const diffMs = now - past;
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSecs < 60) return 'अहिले नै';
        if (diffMins < 60) return `${diffMins} मिनेट अगाडि`;
        if (diffHours < 24) return `${diffHours} घण्टा अगाडि`;
        if (diffDays < 7) return `${diffDays} दिन अगाडि`;
        
        return this.formatNepaliDate(date);
    }

    // ==================== VALIDATION UTILITIES ====================
    
    /**
     * Validate email address
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate Nepali phone number
     */
    isValidNepaliPhone(phone) {
        const phoneRegex = /^(\+977)?[9][6-8]\d{8}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    /**
     * Validate required fields
     */
    validateRequired(obj, requiredFields) {
        const missing = [];
        for (const field of requiredFields) {
            if (!obj[field] || obj[field].toString().trim() === '') {
                missing.push(field);
            }
        }
        return {
            isValid: missing.length === 0,
            missing
        };
    }

    // ==================== DATA TRANSFORMATION UTILITIES ====================
    
    /**
     * Deep clone object
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const cloned = {};
            Object.keys(obj).forEach(key => {
                cloned[key] = this.deepClone(obj[key]);
            });
            return cloned;
        }
    }

    /**
     * Flatten nested object
     */
    flattenObject(obj, prefix = '') {
        const flattened = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const newKey = prefix ? `${prefix}.${key}` : key;
                if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                    Object.assign(flattened, this.flattenObject(obj[key], newKey));
                } else {
                    flattened[newKey] = obj[key];
                }
            }
        }
        return flattened;
    }

    /**
     * Group array of objects by key
     */
    groupBy(array, key) {
        return array.reduce((groups, item) => {
            const group = item[key];
            groups[group] = groups[group] || [];
            groups[group].push(item);
            return groups;
        }, {});
    }

    /**
     * Sort array of objects by key
     */
    sortBy(array, key, direction = 'asc') {
        return [...array].sort((a, b) => {
            const aVal = a[key];
            const bVal = b[key];
            
            if (aVal < bVal) return direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    // ==================== PERFORMANCE UTILITIES ====================
    
    /**
     * Debounce function
     */
    debounce(func, delay = 300, key = 'default') {
        return (...args) => {
            clearTimeout(this.debounceTimers.get(key));
            this.debounceTimers.set(key, setTimeout(() => func.apply(this, args), delay));
        };
    }

    /**
     * Throttle function
     */
    throttle(func, limit = 300, key = 'default') {
        let inThrottle;
        return (...args) => {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Memoize function with cache
     */
    memoize(func, keyGenerator = (...args) => JSON.stringify(args)) {
        return (...args) => {
            const key = keyGenerator(...args);
            
            if (this.cache.has(key)) {
                this.performanceMetrics.cacheHits++;
                return this.cache.get(key);
            }
            
            this.performanceMetrics.cacheMisses++;
            const result = func.apply(this, args);
            this.cache.set(key, result);
            return result;
        };
    }

    /**
     * Measure function performance
     */
    measurePerformance(func, name = 'function') {
        return (...args) => {
            const start = performance.now();
            this.performanceMetrics.functionCalls++;
            
            try {
                const result = func.apply(this, args);
                const end = performance.now();
                console.log(`${name} executed in ${(end - start).toFixed(2)}ms`);
                return result;
            } catch (error) {
                const end = performance.now();
                console.error(`${name} failed after ${(end - start).toFixed(2)}ms:`, error);
                throw error;
            }
        };
    }

    // ==================== STORAGE UTILITIES ====================
    
    /**
     * Safe localStorage set with error handling
     */
    setStorage(key, value, useSession = false) {
        try {
            const storage = useSession ? sessionStorage : localStorage;
            storage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Storage set failed:', error);
            return false;
        }
    }

    /**
     * Safe localStorage get with error handling
     */
    getStorage(key, defaultValue = null, useSession = false) {
        try {
            const storage = useSession ? sessionStorage : localStorage;
            const item = storage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Storage get failed:', error);
            return defaultValue;
        }
    }

    /**
     * Remove from storage
     */
    removeStorage(key, useSession = false) {
        try {
            const storage = useSession ? sessionStorage : localStorage;
            storage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Storage remove failed:', error);
            return false;
        }
    }

    /**
     * Clear all storage
     */
    clearStorage(useSession = false) {
        try {
            const storage = useSession ? sessionStorage : localStorage;
            storage.clear();
            return true;
        } catch (error) {
            console.error('Storage clear failed:', error);
            return false;
        }
    }

    // ==================== URL UTILITIES ====================
    
    /**
     * Get URL parameters as object
     */
    getUrlParams() {
        const params = {};
        const urlParams = new URLSearchParams(window.location.search);
        for (const [key, value] of urlParams) {
            params[key] = value;
        }
        return params;
    }

    /**
     * Set URL parameters
     */
    setUrlParams(params, replaceHistory = false) {
        const url = new URL(window.location);
        Object.keys(params).forEach(key => {
            if (params[key] === null || params[key] === undefined) {
                url.searchParams.delete(key);
            } else {
                url.searchParams.set(key, params[key]);
            }
        });
        
        if (replaceHistory) {
            window.history.replaceState({}, '', url);
        } else {
            window.history.pushState({}, '', url);
        }
    }

    /**
     * Build URL with parameters
     */
    buildUrl(base, params = {}) {
        const url = new URL(base);
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                url.searchParams.set(key, params[key]);
            }
        });
        return url.toString();
    }

    // ==================== FILE UTILITIES ====================
    
    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Get file extension
     */
    getFileExtension(filename) {
        return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
    }

    /**
     * Check if file type is image
     */
    isImageFile(filename) {
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
        const ext = this.getFileExtension(filename).toLowerCase();
        return imageExtensions.includes(ext);
    }

    // ==================== NOTIFICATION UTILITIES ====================
    
    /**
     * Show toast notification
     */
    showToast(message, type = 'info', duration = 3000) {
        if (typeof Toastify === 'function') {
            const colors = {
                success: '#28a745',
                error: '#dc3545',
                warning: '#ffc107',
                info: '#17a2b8'
            };
            
            Toastify({
                text: message,
                duration: duration,
                gravity: "top",
                position: "right",
                style: { background: colors[type] || colors.info }
            }).showToast();
        } else {
            // Fallback to alert
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    /**
     * Show confirmation dialog
     */
    confirm(message, onConfirm, onCancel = null) {
        if (confirm(message)) {
            if (typeof onConfirm === 'function') onConfirm();
        } else {
            if (typeof onCancel === 'function') onCancel();
        }
    }

    // ==================== ERROR HANDLING UTILITIES ====================
    
    /**
     * Safe function execution with error handling
     */
    safeExecute(func, fallback = null, context = null) {
        try {
            return func.apply(context, arguments);
        } catch (error) {
            console.error('Safe execution failed:', error);
            return fallback;
        }
    }

    /**
     * Retry function with exponential backoff
     */
    async retry(func, maxRetries = 3, delay = 1000) {
        let lastError;
        
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await func();
            } catch (error) {
                lastError = error;
                if (i < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
                }
            }
        }
        
        throw lastError;
    }

    // ==================== PERFORMANCE MONITORING ====================
    
    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        const cacheHitRate = this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses > 0
            ? (this.performanceMetrics.cacheHits / (this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses) * 100).toFixed(2)
            : 0;
            
        return {
            ...this.performanceMetrics,
            cacheHitRate: `${cacheHitRate}%`,
            cacheSize: this.cache.size,
            activeDebounceTimers: this.debounceTimers.size,
            activeThrottleTimers: this.throttleTimers.size
        };
    }

    /**
     * Clear performance metrics
     */
    clearPerformanceMetrics() {
        this.performanceMetrics = {
            cacheHits: 0,
            cacheMisses: 0,
            functionCalls: 0
        };
    }

    /**
     * Clear all caches
     */
    clearAllCaches() {
        this.cache.clear();
        this.debounceTimers.forEach(timer => clearTimeout(timer));
        this.debounceTimers.clear();
        this.throttleTimers.clear();
    }
}

// Create global instance
window.utils = new CentralUtils();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CentralUtils;
}

// Backward compatibility aliases
window.nepaliDigits = (str) => window.utils.toNepaliDigits(str);
window.englishDigits = (str) => window.utils.toEnglishDigits(str);
window.validateEmail = (email) => window.utils.isValidEmail(email);
window.showNotification = (message, type, duration) => window.utils.showToast(message, type, duration);
