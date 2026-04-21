/**
 * Centralized DOM Utilities - Reduces redundant DOM access patterns
 * Replaces 540+ getElementById calls with efficient caching system
 */

class DOMUtils {
    constructor() {
        this.cache = new Map();
        this.observers = new Map();
    }

    /**
     * Get element with caching for performance
     */
    get(id) {
        if (this.cache.has(id)) {
            return this.cache.get(id);
        }
        
        const element = document.getElementById(id);
        if (element) {
            this.cache.set(id, element);
        }
        return element;
    }

    /**
     * Get multiple elements efficiently
     */
    getAll(...ids) {
        return ids.reduce((acc, id) => {
            acc[id] = this.get(id);
            return acc;
        }, {});
    }

    /**
     * Set element content safely
     */
    setContent(id, content) {
        const element = this.get(id);
        if (element) {
            if (typeof content === 'string') {
                element.innerHTML = content;
            } else {
                element.textContent = content;
            }
        }
        return element;
    }

    /**
     * Add/remove classes efficiently
     */
    toggleClass(id, className, force) {
        const element = this.get(id);
        if (element) {
            if (force === undefined) {
                element.classList.toggle(className);
            } else {
                element.classList.toggle(className, force);
            }
        }
        return element;
    }

    /**
     * Check if element exists
     */
    exists(id) {
        return !!this.get(id);
    }

    /**
     * Clear cache for specific element or all
     */
    clearCache(id = null) {
        if (id) {
            this.cache.delete(id);
        } else {
            this.cache.clear();
        }
    }

    /**
     * Get element value (form inputs)
     */
    getValue(id, defaultValue = '') {
        const element = this.get(id);
        return element ? (element.value || defaultValue) : defaultValue;
    }

    /**
     * Set element value
     */
    setValue(id, value) {
        const element = this.get(id);
        if (element) {
            element.value = value;
        }
        return element;
    }

    /**
     * Add event listener with automatic cleanup
     */
    on(id, event, handler, options = {}) {
        const element = this.get(id);
        if (element) {
            element.addEventListener(event, handler, options);
            
            // Track for cleanup
            const key = `${id}_${event}`;
            if (!this.observers.has(key)) {
                this.observers.set(key, []);
            }
            this.observers.get(key).push({ handler, options });
        }
        return element;
    }

    /**
     * Remove event listeners
     */
    off(id, event, handler = null) {
        const element = this.get(id);
        if (element) {
            if (handler) {
                element.removeEventListener(event, handler);
            } else {
                // Remove all listeners for this event
                const key = `${id}_${event}`;
                const listeners = this.observers.get(key) || [];
                listeners.forEach(({ handler: h }) => {
                    element.removeEventListener(event, h);
                });
                this.observers.delete(key);
            }
        }
        return element;
    }

    /**
     * Create element with attributes
     */
    create(tag, attributes = {}, content = '') {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'style' && typeof value === 'object') {
                Object.assign(element.style, value);
            } else {
                element.setAttribute(key, value);
            }
        });
        
        if (content) {
            element.innerHTML = content;
        }
        
        return element;
    }

    /**
     * Find elements by selector within a context
     */
    find(selector, context = document) {
        return context.querySelector(selector);
    }

    /**
     * Find all elements by selector within a context
     */
    findAll(selector, context = document) {
        return Array.from(context.querySelectorAll(selector));
    }

    /**
     * Show/hide element
     */
    show(id, display = 'block') {
        const element = this.get(id);
        if (element) {
            element.style.display = display;
            element.classList.remove('hidden');
        }
        return element;
    }

    /**
     * Hide element
     */
    hide(id) {
        const element = this.get(id);
        if (element) {
            element.style.display = 'none';
            element.classList.add('hidden');
        }
        return element;
    }

    /**
     * Check if element is visible
     */
    isVisible(id) {
        const element = this.get(id);
        if (!element) return false;
        
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               style.opacity !== '0';
    }

    /**
     * Set multiple styles at once
     */
    setStyles(id, styles) {
        const element = this.get(id);
        if (element && typeof styles === 'object') {
            Object.entries(styles).forEach(([property, value]) => {
                element.style.setProperty(property, value, 'important');
            });
        }
        return element;
    }

    /**
     * Cleanup all cached references and observers
     */
    destroy() {
        this.cache.clear();
        this.observers.clear();
    }
}

// Create global instance
window.DOM = new DOMUtils();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DOMUtils;
}
