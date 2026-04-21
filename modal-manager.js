/**
 * Centralized Modal Management System
 * Eliminates duplicate modal functions and provides consistent modal behavior
 */

class ModalManager {
    constructor() {
        this.activeModal = null;
        this.modalStack = [];
        this.defaultOptions = {
            backdrop: true,
            keyboard: true,
            focus: true,
            show: true,
            closeOnBackdrop: true,
            preventImmediateClose: true,
            preventCloseTime: 500
        };
        this.listeners = new Map();
    }

    /**
     * Open modal with consistent behavior
     */
    open(title, content, options = {}) {
        const config = { ...this.defaultOptions, ...options };
        
        // Close existing modal if needed
        if (this.activeModal && config.stack !== true) {
            this.close();
        }

        // Try to use NVC.UI.openModalContent first (for compatibility)
        if (window.NVC && NVC.UI && typeof NVC.UI.openModalContent === 'function') {
            try {
                // Set timestamp to prevent immediate close
                if (config.preventImmediateClose) {
                    window._nvc_modalJustOpened = Date.now();
                }
                return NVC.UI.openModalContent(title, content);
            } catch (e) {
                console.warn('NVC.UI.openModalContent failed, using fallback', e);
            }
        }

        // Fallback implementation
        return this.openFallback(title, content, config);
    }

    /**
     * Fallback modal opening implementation
     */
    openFallback(title, content, config) {
        try {
            // Use DOM utilities for efficient access
            const dom = window.DOM || this.getDOM();
            
            // Set modal content
            dom.setContent('modalTitle', title);
            dom.setContent('modalBody', content);
            
            // Show modal
            const modal = dom.get('complaintModal');
            if (modal) {
                dom.toggleClass('complaintModal', 'hidden', false);
                
                // Set timestamp to prevent immediate close
                if (config.preventImmediateClose) {
                    window._nvc_modalJustOpened = Date.now();
                }
                
                // Force modal visibility
                this.forceModalVisibility(modal);
                
                // Setup event listeners if needed
                if (config.backdrop && config.closeOnBackdrop) {
                    this.setupBackdropListener(modal);
                }
                
                if (config.keyboard) {
                    this.setupKeyboardListener(modal);
                }
                
                if (config.focus) {
                    this.setFocus(modal);
                }
                
                this.activeModal = modal;
                this.modalStack.push(modal);
                
                return modal;
            }
        } catch (e) {
            console.error('Modal fallback failed:', e);
        }
        return null;
    }

    /**
     * Force modal visibility with inline styles
     */
    forceModalVisibility(modal) {
        const dom = window.DOM || this.getDOM();
        
        // Set modal styles
        dom.setStyles('complaintModal', {
            'z-index': '2147483647',
            'display': 'flex',
            'visibility': 'visible',
            'opacity': '1'
        });
        
        // Ensure modal-content is also visible
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.setProperty('opacity', '1', 'important');
        }
    }

    /**
     * Get DOM utility instance
     */
    getDOM() {
        if (window.DOM) {
            return window.DOM;
        }
        // Fallback to direct DOM access
        return {
            get: (id) => document.getElementById(id),
            setContent: (id, content) => {
                const el = document.getElementById(id);
                if (el) el.innerHTML = content;
            },
            toggleClass: (id, className, force) => {
                const el = document.getElementById(id);
                if (el) {
                    if (force === undefined) {
                        el.classList.toggle(className);
                    } else {
                        el.classList.toggle(className, force);
                    }
                }
            },
            setStyles: (id, styles) => {
                const el = document.getElementById(id);
                if (el && typeof styles === 'object') {
                    Object.entries(styles).forEach(([prop, val]) => {
                        el.style.setProperty(prop, val, 'important');
                    });
                }
            }
        };
    }

    /**
     * Close modal with safeguards
     */
    close(modalId = null) {
        // Check if we should prevent immediate close
        if (this.defaultOptions.preventImmediateClose) {
            const justOpened = window._nvc_modalJustOpened || 0;
            const timeDiff = Date.now() - justOpened;
            if (justOpened && timeDiff < this.defaultOptions.preventCloseTime) {
                console.log(`Modal close prevented (${timeDiff}ms < ${this.defaultOptions.preventCloseTime}ms)`);
                // Clear flag after preventing once
                try { delete window._nvc_modalJustOpened; } catch(e) {}
                return false;
            }
        }

        // Try NVC.UI.closeModal first
        if (window.NVC && NVC.UI && typeof NVC.UI.closeModal === 'function') {
            try {
                return NVC.UI.closeModal(modalId);
            } catch (e) {
                console.warn('NVC.UI.closeModal failed, using fallback', e);
            }
        }

        // Fallback implementation
        return this.closeFallback(modalId);
    }

    /**
     * Fallback modal closing implementation
     */
    closeFallback(modalId = null) {
        try {
            const dom = window.DOM || this.getDOM();
            let modal = null;
            
            if (modalId) {
                modal = dom.get(modalId);
            } else {
                modal = dom.get('complaintModal') || 
                        document.querySelector('.modal:not(.hidden)');
            }
            
            if (modal) {
                // Hide modal
                dom.toggleClass(modal.id || 'complaintModal', 'hidden', true);
                
                // Remove inline styles
                modal.style.removeProperty('display');
                modal.style.removeProperty('visibility');
                modal.style.removeProperty('opacity');
                modal.style.removeProperty('z-index');
                
                // Clean up listeners
                this.cleanupListeners(modal);
                
                // Update state
                this.activeModal = null;
                const index = this.modalStack.indexOf(modal);
                if (index > -1) {
                    this.modalStack.splice(index, 1);
                }
                
                return true;
            }
        } catch (e) {
            console.error('Modal close fallback failed:', e);
        }
        return false;
    }

    /**
     * Setup backdrop click listener
     */
    setupBackdropListener(modal) {
        const handler = (e) => {
            if (e.target === modal) {
                const justOpened = window._nvc_modalJustOpened || 0;
                const timeDiff = Date.now() - justOpened;
                console.log('Backdrop click timeDiff:', timeDiff);
                
                if (!window._nvc_modalJustOpened || timeDiff > this.defaultOptions.preventCloseTime) {
                    console.log('Backdrop click calling closeModal');
                    this.close();
                } else {
                    console.log('Backdrop click ignored due to recent open');
                }
            }
        };
        
        modal.addEventListener('click', handler);
        this.trackListener(modal, 'click', handler);
    }

    /**
     * Setup keyboard listener (ESC to close)
     */
    setupKeyboardListener(modal) {
        const handler = (e) => {
            if (e.key === 'Escape') {
                this.close();
            }
        };
        
        document.addEventListener('keydown', handler);
        this.trackListener(document, 'keydown', handler);
    }

    /**
     * Set focus to modal for accessibility
     */
    setFocus(modal) {
        setTimeout(() => {
            try {
                const focusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                if (focusable) {
                    focusable.focus();
                }
            } catch (e) {
                // Ignore focus errors
            }
        }, 100);
    }

    /**
     * Track event listeners for cleanup
     */
    trackListener(element, event, handler) {
        if (!this.listeners.has(element)) {
            this.listeners.set(element, []);
        }
        this.listeners.get(element).push({ event, handler });
    }

    /**
     * Cleanup event listeners for an element
     */
    cleanupListeners(element) {
        const elementListeners = this.listeners.get(element);
        if (elementListeners) {
            elementListeners.forEach(({ event, handler }) => {
                element.removeEventListener(event, handler);
            });
            this.listeners.delete(element);
        }
    }

    /**
     * Check if modal is currently open
     */
    isOpen() {
        return !!this.activeModal;
    }

    /**
     * Get current active modal
     */
    getActiveModal() {
        return this.activeModal;
    }

    /**
     * Close all modals in stack
     */
    closeAll() {
        while (this.modalStack.length > 0) {
            this.close();
        }
    }

    /**
     * Show loading spinner in modal
     */
    showLoading(text = 'Loading...') {
        const content = `
            <div style="text-align: center; padding: 2rem;">
                <div class="spinner" style="margin: 0 auto 1rem;"></div>
                <div>${text}</div>
            </div>
        `;
        this.open('', content);
    }

    /**
     * Show error message in modal
     */
    showError(message, title = 'Error') {
        const content = `
            <div style="text-align: center; padding: 2rem;">
                <div style="color: #dc3545; font-size: 2rem; margin-bottom: 1rem;">⚠️</div>
                <div>${message}</div>
                <button class="btn btn-primary" style="margin-top: 1rem;" onclick="modalManager.close()">Close</button>
            </div>
        `;
        this.open(title, content);
    }

    /**
     * Show success message in modal
     */
    showSuccess(message, title = 'Success') {
        const content = `
            <div style="text-align: center; padding: 2rem;">
                <div style="color: #28a745; font-size: 2rem; margin-bottom: 1rem;">✓</div>
                <div>${message}</div>
                <button class="btn btn-primary" style="margin-top: 1rem;" onclick="modalManager.close()">Close</button>
            </div>
        `;
        this.open(title, content);
    }

    /**
     * Cleanup all modal resources
     */
    destroy() {
        this.closeAll();
        this.listeners.forEach((listeners, element) => {
            this.cleanupListeners(element);
        });
        this.listeners.clear();
        this.activeModal = null;
        this.modalStack = [];
    }
}

// Create global instance
window.modalManager = new ModalManager();

// Create backward compatibility functions
window.openModal = function(title, content, options) {
    return window.modalManager.open(title, content, options);
};

window.closeModal = function(modalId) {
    return window.modalManager.close(modalId);
};

window.closeModalRobust = function() {
    // Try multiple times to ensure modal closes
    window.modalManager.close();
    setTimeout(() => window.modalManager.close(), 220);
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModalManager;
}
