/**
 * Centralized Loading Manager
 * Consolidates all loading spinner functionality into a single, efficient system
 */

class LoadingManager {
    constructor() {
        this.activeLoaders = new Map();
        this.defaultConfig = {
            showOverlay: true,
            overlayClass: 'loading-overlay',
            spinnerClass: 'loading-spinner',
            textClass: 'loading-text',
            minDisplayTime: 300, // Minimum time to show loading
            fadeInTime: 150,
            fadeOutTime: 150
        };
        this.timers = new Map();
    }

    /**
     * Show loading spinner with configuration
     */
    show(message = 'Loading...', config = {}) {
        const options = { ...this.defaultConfig, ...config };
        const loaderId = options.id || 'default';

        // Don't show if already active
        if (this.activeLoaders.has(loaderId)) {
            this.update(loaderId, message);
            return this;
        }

        const loader = this.createLoaderElement(message, options);
        document.body.appendChild(loader);

        // Track loader
        this.activeLoaders.set(loaderId, {
            element: loader,
            startTime: Date.now(),
            message,
            options
        });

        // Fade in
        requestAnimationFrame(() => {
            loader.style.opacity = '1';
        });

        return this;
    }

    /**
     * Hide specific loader or all loaders
     */
    hide(loaderId = null) {
        if (loaderId) {
            this.hideLoader(loaderId);
        } else {
            // Hide all loaders
            this.activeLoaders.forEach((_, id) => this.hideLoader(id));
        }
        return this;
    }

    /**
     * Hide specific loader with minimum display time
     */
    hideLoader(loaderId) {
        const loader = this.activeLoaders.get(loaderId);
        if (!loader) return this;

        const { element, startTime, options } = loader;
        const elapsed = Date.now() - startTime;

        // Ensure minimum display time
        const remainingTime = Math.max(0, options.minDisplayTime - elapsed);
        
        this.timers.set(loaderId, setTimeout(() => {
            // Fade out
            element.style.opacity = '0';
            
            setTimeout(() => {
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
                this.activeLoaders.delete(loaderId);
                this.timers.delete(loaderId);
            }, options.fadeOutTime);
        }, remainingTime));

        return this;
    }

    /**
     * Update loading message
     */
    update(loaderId, message) {
        const loader = this.activeLoaders.get(loaderId);
        if (loader) {
            const textElement = loader.element.querySelector(`.${loader.options.textClass}`);
            if (textElement) {
                textElement.textContent = message;
            }
            loader.message = message;
        }
        return this;
    }

    /**
     * Create loader DOM element
     */
    createLoaderElement(message, options) {
        const loader = document.createElement('div');
        loader.className = options.overlayClass;
        loader.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 999999;
            opacity: 0;
            transition: opacity ${options.fadeInTime}ms ease;
            pointer-events: auto;
        `;

        const spinner = document.createElement('div');
        spinner.className = options.spinnerClass;
        spinner.style.cssText = `
            width: 50px;
            height: 50px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #133f81;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        `;

        const text = document.createElement('div');
        text.className = options.textClass;
        text.textContent = message;
        text.style.cssText = `
            color: white;
            margin-top: 20px;
            font-size: 16px;
            font-weight: 500;
            text-align: center;
        `;

        const container = document.createElement('div');
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
        `;
        container.appendChild(spinner);
        container.appendChild(text);
        loader.appendChild(container);

        // Add CSS animation if not already present
        if (!document.querySelector('#loading-spinner-style')) {
            const style = document.createElement('style');
            style.id = 'loading-spinner-style';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }

        return loader;
    }

    /**
     * Show loading with progress
     */
    showProgress(message = 'Loading...', progress = 0, config = {}) {
        const options = { ...this.defaultConfig, ...config, showProgress: true };
        const loaderId = options.id || 'progress';

        if (this.activeLoaders.has(loaderId)) {
            this.updateProgress(loaderId, message, progress);
            return this;
        }

        const loader = this.createProgressLoaderElement(message, progress, options);
        document.body.appendChild(loader);

        this.activeLoaders.set(loaderId, {
            element: loader,
            startTime: Date.now(),
            message,
            progress,
            options
        });

        requestAnimationFrame(() => {
            loader.style.opacity = '1';
        });

        return this;
    }

    /**
     * Update progress loader
     */
    updateProgress(loaderId, message, progress) {
        const loader = this.activeLoaders.get(loaderId);
        if (loader && loader.options.showProgress) {
            const textElement = loader.element.querySelector(`.${loader.options.textClass}`);
            const progressBar = loader.element.querySelector('.progress-bar');
            
            if (textElement) textElement.textContent = message;
            if (progressBar) {
                progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
            }
            
            loader.message = message;
            loader.progress = progress;
        }
        return this;
    }

    /**
     * Create progress loader element
     */
    createProgressLoaderElement(message, progress, options) {
        const loader = this.createLoaderElement(message, options);

        // Add progress bar
        const progressContainer = document.createElement('div');
        progressContainer.style.cssText = `
            width: 200px;
            height: 4px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 2px;
            margin-top: 15px;
            overflow: hidden;
        `;

        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.style.cssText = `
            height: 100%;
            background: #133f81;
            width: ${Math.min(100, Math.max(0, progress))}%;
            transition: width 0.3s ease;
        `;

        progressContainer.appendChild(progressBar);
        loader.querySelector('div > div').appendChild(progressContainer);

        return loader;
    }

    /**
     * Show inline loading (for specific containers)
     */
    showInline(containerId, message = 'Loading...', config = {}) {
        const container = document.getElementById(containerId);
        if (!container) return this;

        const options = { ...this.defaultConfig, ...config };
        const loaderId = `inline_${containerId}`;

        // Remove existing inline loader
        this.hide(loaderId);

        const loader = document.createElement('div');
        loader.className = 'inline-loading';
        loader.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            color: #666;
            font-size: 14px;
        `;

        const spinner = document.createElement('div');
        spinner.style.cssText = `
            width: 20px;
            height: 20px;
            border: 2px solid #f3f3f3;
            border-top: 2px solid #133f81;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-right: 10px;
        `;

        loader.appendChild(spinner);
        loader.appendChild(document.createTextNode(message));

        // Store original content
        const originalContent = container.innerHTML;
        container.innerHTML = '';
        container.appendChild(loader);

        this.activeLoaders.set(loaderId, {
            element: loader,
            container,
            originalContent,
            startTime: Date.now(),
            message,
            options,
            type: 'inline'
        });

        return this;
    }

    /**
     * Hide inline loading and restore content
     */
    hideInline(containerId) {
        const loaderId = `inline_${containerId}`;
        const loader = this.activeLoaders.get(loaderId);
        
        if (loader && loader.type === 'inline') {
            const { container, originalContent } = loader;
            container.innerHTML = originalContent;
            this.activeLoaders.delete(loaderId);
        }
        
        return this;
    }

    /**
     * Check if any loader is active
     */
    isLoading(loaderId = null) {
        if (loaderId) {
            return this.activeLoaders.has(loaderId);
        }
        return this.activeLoaders.size > 0;
    }

    /**
     * Get active loaders count
     */
    getActiveCount() {
        return this.activeLoaders.size;
    }

    /**
     * Clear all loaders immediately
     */
    clear() {
        // Clear all timers
        this.timers.forEach(timer => clearTimeout(timer));
        this.timers.clear();

        // Remove all loader elements
        this.activeLoaders.forEach(loader => {
            if (loader.element.parentNode) {
                loader.element.parentNode.removeChild(loader.element);
            }
        });
        this.activeLoaders.clear();

        return this;
    }

    /**
     * Get loading statistics
     */
    getStats() {
        return {
            activeLoaders: this.activeLoaders.size,
            activeTimers: this.timers.size,
            loaders: Array.from(this.activeLoaders.entries()).map(([id, loader]) => ({
                id,
                type: loader.type || 'overlay',
                message: loader.message,
                duration: Date.now() - loader.startTime
            }))
        };
    }
}

// Create global instance
window.loadingManager = new LoadingManager();

// Backward compatibility functions
window.showLoadingSpinner = function(message, config) {
    return window.loadingManager.show(message, { id: 'spinner', ...config });
};

window.hideLoadingSpinner = function() {
    return window.loadingManager.hide('spinner');
};

window.showLoadingIndicator = function(show, message, config) {
    if (show) {
        return window.loadingManager.show(message, { id: 'indicator', ...config });
    } else {
        return window.loadingManager.hide('indicator');
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoadingManager;
}
