/**
 * Centralized Event Management System
 * Optimizes event handling and reduces redundant listeners
 */

class EventManager {
    constructor() {
        this.delegatedEvents = new Map();
        this.directListeners = new Map();
        this.throttledEvents = new Map();
        this.debounceTimers = new Map();
    }

    /**
     * Setup event delegation for dynamic content
     */
    delegate(container, selector, event, handler, options = {}) {
        const key = `${container}_${selector}_${event}`;
        
        // Remove existing delegation if exists
        if (this.delegatedEvents.has(key)) {
            this.removeDelegation(container, selector, event);
        }

        const delegatedHandler = (e) => {
            const target = e.target.closest(selector);
            if (target && container.contains(target)) {
                e.preventDefault();
                e.stopPropagation();
                
                // Apply throttling if specified
                if (options.throttle) {
                    this.throttle(key, () => handler.call(target, e), options.throttle);
                } else if (options.debounce) {
                    this.debounce(key, () => handler.call(target, e), options.debounce);
                } else {
                    handler.call(target, e);
                }
            }
        };

        // Add the listener
        container.addEventListener(event, delegatedHandler, options);
        
        // Store for cleanup
        this.delegatedEvents.set(key, {
            container,
            selector,
            event,
            handler: delegatedHandler,
            originalHandler: handler,
            options
        });

        return this;
    }

    /**
     * Remove event delegation
     */
    removeDelegation(container, selector, event) {
        const key = `${container}_${selector}_${event}`;
        const delegation = this.delegatedEvents.get(key);
        
        if (delegation) {
            container.removeEventListener(event, delegation.handler);
            this.delegatedEvents.delete(key);
        }
        
        return this;
    }

    /**
     * Add direct event listener with tracking
     */
    on(element, event, handler, options = {}) {
        if (!element) return this;
        
        const key = `${element.id || 'unnamed'}_${event}`;
        
        // Store original handler for cleanup
        if (!this.directListeners.has(element)) {
            this.directListeners.set(element, new Map());
        }
        
        element.addEventListener(event, handler, options);
        this.directListeners.get(element).set(event, { handler, options });
        
        return this;
    }

    /**
     * Remove direct event listener
     */
    off(element, event, handler = null) {
        if (!element) return this;
        
        const elementListeners = this.directListeners.get(element);
        if (elementListeners) {
            if (handler) {
                element.removeEventListener(event, handler);
                elementListeners.delete(event);
            } else {
                // Remove all listeners for this event
                const listenerData = elementListeners.get(event);
                if (listenerData) {
                    element.removeEventListener(event, listenerData.handler);
                    elementListeners.delete(event);
                }
            }
        }
        
        return this;
    }

    /**
     * Throttle function execution
     */
    throttle(key, func, delay) {
        if (!this.throttledEvents.has(key)) {
            func();
            this.throttledEvents.set(key, true);
            setTimeout(() => {
                this.throttledEvents.delete(key);
            }, delay);
        }
    }

    /**
     * Debounce function execution
     */
    debounce(key, func, delay) {
        if (this.debounceTimers.has(key)) {
            clearTimeout(this.debounceTimers.get(key));
        }
        
        const timer = setTimeout(() => {
            func();
            this.debounceTimers.delete(key);
        }, delay);
        
        this.debounceTimers.set(key, timer);
    }

    /**
     * Setup common application event delegations
     */
    setupCommonDelegations() {
        // Modal actions
        this.delegate(
            document.body,
            '.action-btn',
            'click',
            function(e) {
                const action = this.getAttribute('data-action') || this.dataset.action;
                const id = this.getAttribute('data-id') || this.dataset.id;
                
                if (action && id) {
                    switch (action) {
                        case 'view':
                            if (typeof viewComplaint === 'function') viewComplaint(id);
                            break;
                        case 'edit':
                            if (typeof editComplaint === 'function') editComplaint(id);
                            break;
                        case 'delete':
                            if (typeof deleteComplaint === 'function') deleteComplaint(id);
                            break;
                        case 'assign':
                            if (typeof assignToShakha === 'function') assignToShakha(id);
                            break;
                        default:
                            if (typeof handleTableActions === 'function') {
                                handleTableActions({ target: this });
                            }
                    }
                } else if (typeof handleTableActions === 'function') {
                    handleTableActions({ target: this });
                }
            },
            { throttle: 100 }
        );

        // Edit buttons with data-json
        this.delegate(
            document.getElementById('contentArea'),
            '.btn-edit',
            'click',
            function(e) {
                const id = this.getAttribute('data-id');
                const rowData = this.getAttribute('data-json');
                
                if (id && typeof openEditModal === 'function') {
                    openEditModal(id, rowData);
                }
            }
        );

        // Delete buttons
        this.delegate(
            document.getElementById('contentArea'),
            '.btn-delete',
            'click',
            function(e) {
                const id = this.getAttribute('data-id');
                
                if (id && confirm('के तपाई यो उजुरी हटाउन चाहनुहुन्छ? यो कार्य फिर्ता लिन सकिँदैन।')) {
                    if (typeof deleteComplaint === 'function') {
                        deleteComplaint(id);
                    }
                }
            }
        );

        // Notification actions
        this.delegate(
            document.body,
            '.notification-item',
            'click',
            function(e) {
                const id = this.getAttribute('onclick')?.match(/markNotificationRead\('([^']+)'\)/)?.[1];
                if (id && typeof markNotificationRead === 'function') {
                    markNotificationRead(id);
                }
            }
        );

        // Sidebar navigation
        this.delegate(
            document.getElementById('sidebarNav'),
            'a',
            'click',
            function(e) {
                const linkText = this.querySelector('.nav-text');
                if (linkText && linkText.innerText.trim() === 'सेटिङहरू') {
                    e.preventDefault();
                    if (typeof openSettings === 'function') openSettings();
                }
            }
        );

        // Form submissions
        this.delegate(
            document.body,
            'form[data-ajax]',
            'submit',
            function(e) {
                e.preventDefault();
                const form = this;
                const url = form.getAttribute('action');
                const method = form.getAttribute('method') || 'POST';
                
                // Handle AJAX form submission
                const formData = new FormData(form);
                // Implementation would depend on specific requirements
            },
            { debounce: 300 }
        );

        return this;
    }

    /**
     * Setup optimized scroll handlers
     */
    setupScrollHandlers() {
        let ticking = false;

        const optimizedScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    // Handle scroll-based animations
                    this.handleScrollEvents();
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', optimizedScroll, { passive: true });
        
        return this;
    }

    /**
     * Handle scroll-based events
     */
    handleScrollEvents() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Hide/show header on scroll
        const header = document.querySelector('.main-header');
        if (header) {
            if (scrollTop > 100) {
                header.style.transform = 'translateY(-100%)';
            } else {
                header.style.transform = 'translateY(0)';
            }
        }

        // Lazy loading for images
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => {
            if (img.getBoundingClientRect().top < window.innerHeight + 200) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            }
        });
    }

    /**
     * Setup resize handlers with debouncing
     */
    setupResizeHandlers() {
        this.on(window, 'resize', () => {
            this.debounce('window_resize', () => {
                this.handleResizeEvents();
            }, 250);
        });

        return this;
    }

    /**
     * Handle resize events
     */
    handleResizeEvents() {
        // Adjust layouts for mobile/desktop
        const isMobile = window.innerWidth < 768;
        document.body.classList.toggle('mobile-view', isMobile);
        
        // Recalculate modal positions
        const modals = document.querySelectorAll('.modal:not(.hidden)');
        modals.forEach(modal => {
            if (typeof modalManager !== 'undefined') {
                modalManager.forceModalVisibility(modal);
            }
        });
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        this.on(document, 'keydown', (e) => {
            // ESC to close modals
            if (e.key === 'Escape' && typeof modalManager !== 'undefined') {
                modalManager.close();
            }
            
            // Ctrl/Cmd + K for search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.getElementById('aiSearchInput');
                if (searchInput) searchInput.focus();
            }
            
            // Ctrl/Cmd + S for save (when in forms)
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                const activeForm = document.querySelector('form:focus-within');
                if (activeForm && typeof activeForm.submit === 'function') {
                    activeForm.submit();
                }
            }
        });

        return this;
    }

    /**
     * Cleanup all event listeners
     */
    cleanup() {
        // Clean up delegated events
        this.delegatedEvents.forEach((delegation, key) => {
            delegation.container.removeEventListener(delegation.event, delegation.handler);
        });
        this.delegatedEvents.clear();

        // Clean up direct listeners
        this.directListeners.forEach((listeners, element) => {
            listeners.forEach((listenerData, event) => {
                element.removeEventListener(event, listenerData.handler);
            });
        });
        this.directListeners.clear();

        // Clear timers
        this.debounceTimers.forEach(timer => clearTimeout(timer));
        this.debounceTimers.clear();

        return this;
    }

    /**
     * Get statistics for debugging
     */
    getStats() {
        return {
            delegatedEvents: this.delegatedEvents.size,
            directListeners: Array.from(this.directListeners.values())
                .reduce((total, listeners) => total + listeners.size, 0),
            activeTimers: this.debounceTimers.size,
            throttledEvents: this.throttledEvents.size
        };
    }
}

// Create global instance
window.eventManager = new EventManager();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.eventManager
            .setupCommonDelegations()
            .setupScrollHandlers()
            .setupResizeHandlers()
            .setupKeyboardShortcuts();
    });
} else {
    // DOM already loaded
    window.eventManager
        .setupCommonDelegations()
        .setupScrollHandlers()
        .setupResizeHandlers()
        .setupKeyboardShortcuts();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EventManager;
}
