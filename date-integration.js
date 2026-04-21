/**
 * Enhanced Date Integration System
 * Consolidates all date handling using NepaliCalendar API exclusively
 */

class DateIntegration {
    constructor() {
        this.cache = new Map();
        this.formats = {
            NEPALI: 'YYYY-MM-DD',
            NEPALI_LONG: 'DD MMMM YYYY',
            NEPALI_SHORT: 'DD/MM/YYYY',
            DISPLAY: 'DD MMMM YYYY, dddd',
            ISO: 'YYYY-MM-DD',
            TIME: 'YYYY-MM-DD HH:mm:ss'
        };
        
        this.initializeEventListeners();
    }

    /**
     * Initialize event listeners for date integration
     */
    initializeEventListeners() {
        // Listen for date format requests
        document.addEventListener('nvc.date.format', (event) => {
            const { date, format, callback } = event.detail;
            const result = this.formatDate(date, format);
            if (callback) callback(result);
        });

        // Listen for date validation requests
        document.addEventListener('nvc.date.validate', (event) => {
            const { date, callback } = event.detail;
            const result = this.validateDate(date);
            if (callback) callback(result);
        });
    }

    /**
     * Format date using NepaliCalendar API
     */
    formatDate(date, format = this.formats.NEPALI) {
        if (!date) return '';
        
        // Convert to Nepali date if it's not already
        const nepaliDate = this.convertToNepali(date);
        if (!nepaliDate) return '';
        
        // Use NepaliCalendar API for formatting
        if (window.NepaliCalendar && typeof NepaliCalendar.formatDate === 'function') {
            return NepaliCalendar.formatDate(nepaliDate, format);
        }
        
        // Fallback formatting
        return this.fallbackFormatDate(nepaliDate, format);
    }

    /**
     * Convert any date format to Nepali date
     */
    convertToNepali(date) {
        if (!date) return null;
        
        const cacheKey = `convert_${date}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        let nepaliDate;
        
        // If already in Nepali format (YYYY-MM-DD with year > 2000)
        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
            const year = parseInt(date.split('-')[0]);
            if (year > 2000) {
                nepaliDate = date;
            }
        }
        
        // Convert from English/AD date
        if (!nepaliDate) {
            nepaliDate = this.convertADtoBS(date);
        }
        
        // Cache result
        if (nepaliDate) {
            this.cache.set(cacheKey, nepaliDate);
            this.cleanupCache();
        }
        
        return nepaliDate;
    }

    /**
     * Convert AD date to BS using available methods
     */
    convertADtoBS(date) {
        try {
            // Try existing conversion functions
            if (typeof window.convertADtoBSAccurate === 'function') {
                return window.convertADtoBSAccurate(date);
            }
            
            if (typeof window.convertADtoBS === 'function') {
                return window.convertADtoBS(date);
            }
            
            // Try NepaliCalendar API
            if (window.NepaliCalendar && typeof NepaliCalendar.getCurrentDate === 'function') {
                // If it's today, use current date
                const today = new Date().toISOString().split('T')[0];
                if (date === today) {
                    return NepaliCalendar.getCurrentDate();
                }
            }
            
            // Fallback conversion (simplified)
            return this.fallbackADtoBS(date);
            
        } catch (error) {
            console.warn('Date conversion failed:', error);
            return null;
        }
    }

    /**
     * Fallback AD to BS conversion
     */
    fallbackADtoBS(date) {
        try {
            const adDate = new Date(date);
            if (isNaN(adDate.getTime())) return null;
            
            // Very rough approximation (should be replaced with proper conversion)
            const bsYear = adDate.getFullYear() + 57;
            const bsMonth = adDate.getMonth() + 1;
            const bsDay = adDate.getDate();
            
            // Validate using NepaliCalendar if available
            if (window.NepaliCalendar && typeof NepaliCalendar.isValidDate === 'function') {
                if (NepaliCalendar.isValidDate(bsYear, bsMonth, bsDay)) {
                    return `${bsYear}-${String(bsMonth).padStart(2, '0')}-${String(bsDay).padStart(2, '0')}`;
                }
            }
            
            return `${bsYear}-${String(bsMonth).padStart(2, '0')}-${String(bsDay).padStart(2, '0')}`;
            
        } catch (error) {
            return null;
        }
    }

    /**
     * Fallback date formatting
     */
    fallbackFormatDate(dateStr, format) {
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        
        const year = parts[0];
        const month = parts[1];
        const day = parts[2];
        
        // Get month name
        const monthNames = [
            "बैशाख", "जेठ", "असार", "साउन", "भदौ", "असोज",
            "कार्तिक", "मंसिर", "पुष", "माघ", "फागुन", "चैत"
        ];
        const monthName = monthNames[parseInt(month) - 1] || month;
        
        // Get weekday
        const weekdayNames = ["आइत", "सोम", "मंगल", "बुध", "बिही", "शुक्र", "शनि"];
        const weekday = weekdayNames[new Date().getDay()] || '';
        
        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('MMMM', monthName)
            .replace('dddd', weekday);
    }

    /**
     * Validate Nepali date
     */
    validateDate(date) {
        if (!date) return { valid: false, error: 'Empty date' };
        
        // Try NepaliCalendar validation
        if (window.NepaliCalendar && typeof NepaliCalendar.parseDate === 'function') {
            const parsed = NepaliCalendar.parseDate(date);
            return {
                valid: parsed !== null,
                parsed: parsed,
                error: parsed ? null : 'Invalid Nepali date format'
            };
        }
        
        // Basic format validation
        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
            const parts = date.split('-');
            const year = parseInt(parts[0]);
            const month = parseInt(parts[1]);
            const day = parseInt(parts[2]);
            
            if (year < 2000 || year > 2100) {
                return { valid: false, error: 'Year out of range' };
            }
            
            if (month < 1 || month > 12) {
                return { valid: false, error: 'Invalid month' };
            }
            
            if (day < 1 || day > 32) {
                return { valid: false, error: 'Invalid day' };
            }
            
            return { valid: true, parsed: { year, month, day } };
        }
        
        return { valid: false, error: 'Invalid date format' };
    }

    /**
     * Get current Nepali date
     */
    getCurrentDate(format = this.formats.NEPALI) {
        if (window.NepaliCalendar && typeof NepaliCalendar.getCurrentDate === 'function') {
            const currentDate = NepaliCalendar.getCurrentDate();
            return this.formatDate(currentDate, format);
        }
        
        // Fallback
        const today = new Date();
        return this.formatDate(today.toISOString().split('T')[0], format);
    }

    /**
     * Get relative time in Nepali
     */
    getRelativeTime(date) {
        if (!date) return '';
        
        const now = new Date();
        const past = new Date(date);
        
        if (isNaN(past.getTime())) {
            // Try to parse as Nepali date
            const nepaliDate = this.convertToNepali(date);
            if (nepaliDate) {
                return this.formatDate(nepaliDate, this.formats.DISPLAY);
            }
            return date;
        }
        
        const diffMs = now - past;
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSecs < 60) return 'अहिले नै';
        if (diffMins < 60) return `${diffMins} मिनेट अगाडि`;
        if (diffHours < 24) return `${diffHours} घण्टा अगाडि`;
        if (diffDays < 7) return `${diffDays} दिन अगाडि`;
        
        // Convert to Nepali for older dates
        const nepaliDate = this.convertToNepali(date);
        return nepaliDate ? this.formatDate(nepaliDate, this.formats.DISPLAY) : date;
    }

    /**
     * Get date range in Nepali
     */
    getDateRange(startDate, endDate, format = this.formats.NEPALI_SHORT) {
        const start = this.formatDate(startDate, format);
        const end = this.formatDate(endDate, format);
        
        if (start === end) return start;
        return `${start} - ${end}`;
    }

    /**
     * Add days to Nepali date
     */
    addDays(date, days) {
        const parsed = this.validateDate(date);
        if (!parsed.valid) return date;
        
        const { year, month, day } = parsed.parsed;
        let newDay = day + days;
        let newMonth = month;
        let newYear = year;
        
        // Handle month overflow
        while (newDay > this.getDaysInMonth(newYear, newMonth)) {
            newDay -= this.getDaysInMonth(newYear, newMonth);
            newMonth++;
            
            if (newMonth > 12) {
                newMonth = 1;
                newYear++;
            }
        }
        
        // Handle underflow
        while (newDay < 1) {
            newMonth--;
            
            if (newMonth < 1) {
                newMonth = 12;
                newYear--;
            }
            
            newDay += this.getDaysInMonth(newYear, newMonth);
        }
        
        return `${newYear}-${String(newMonth).padStart(2, '0')}-${String(newDay).padStart(2, '0')}`;
    }

    /**
     * Get days in month using NepaliCalendar
     */
    getDaysInMonth(year, month) {
        if (window.NepaliCalendar && typeof NepaliCalendar.getDaysInMonth === 'function') {
            return NepaliCalendar.getDaysInMonth(year, month);
        }
        
        // Fallback
        return 30; // Most Nepali months have 30 days
    }

    /**
     * Get month data for calendar rendering
     */
    getMonthData(year, month) {
        if (window.NepaliCalendar && typeof NepaliCalendar.getMonthData === 'function') {
            return NepaliCalendar.getMonthData(year, month);
        }
        
        // Fallback
        const daysInMonth = this.getDaysInMonth(year, month);
        const monthNames = [
            "बैशाख", "जेठ", "असार", "साउन", "भदौ", "असोज",
            "कार्तिक", "मंसिर", "पुष", "माघ", "फागुन", "चैत"
        ];
        
        return {
            year,
            month,
            monthName: monthNames[month - 1] || '',
            daysInMonth,
            firstDayOfWeek: 0,
            weeks: this.generateWeeksFallback(daysInMonth)
        };
    }

    /**
     * Generate weeks fallback for calendar
     */
    generateWeeksFallback(daysInMonth) {
        const weeks = [];
        let currentWeek = [];
        
        for (let day = 1; day <= daysInMonth; day++) {
            currentWeek.push(day);
            
            if (currentWeek.length === 7) {
                weeks.push(currentWeek);
                currentWeek = [];
            }
        }
        
        if (currentWeek.length > 0) {
            weeks.push(currentWeek);
        }
        
        return weeks;
    }

    /**
     * Format date with Nepali digits
     */
    formatDateWithNepaliDigits(date, format = this.formats.NEPALI) {
        const formatted = this.formatDate(date, format);
        
        if (window.utils && typeof utils.toNepaliDigits === 'function') {
            return utils.toNepaliDigits(formatted);
        }
        
        // Fallback digit conversion
        return formatted.replace(/\d/g, d => '०१२३४५६७८९'[parseInt(d)]);
    }

    /**
     * Clean up cache to prevent memory issues
     */
    cleanupCache() {
        if (this.cache.size > 500) {
            const entries = Array.from(this.cache.entries());
            const toDelete = entries.slice(0, 100);
            toDelete.forEach(([key]) => this.cache.delete(key));
        }
    }

    /**
     * Get date integration statistics
     */
    getStatistics() {
        return {
            cacheSize: this.cache.size,
            formats: Object.keys(this.formats),
            hasNepaliCalendar: !!(window.NepaliCalendar),
            hasConversionFunctions: !!(window.convertADtoBS || window.convertADtoBSAccurate)
        };
    }

    /**
     * Clear all caches
     */
    reset() {
        this.cache.clear();
    }
}

// Create global instance
window.dateIntegration = new DateIntegration();

// Enhance existing date functions and provide backward compatibility
if (window.NepaliCalendar) {
    // Backup original methods
    const originalFormatDate = NepaliCalendar.formatDate;
    
    // Enhance formatDate
    NepaliCalendar.formatDate = function(date, format) {
        return window.dateIntegration.formatDate(date, format);
    };
    
    // Add new convenience methods
    NepaliCalendar.getCurrentDateFormatted = function(format) {
        return window.dateIntegration.getCurrentDate(format);
    };
    
    NepaliCalendar.getRelativeTime = function(date) {
        return window.dateIntegration.getRelativeTime(date);
    };
    
    NepaliCalendar.formatWithNepaliDigits = function(date, format) {
        return window.dateIntegration.formatDateWithNepaliDigits(date, format);
    };
}

// Global convenience functions
window.formatNepaliDate = (date, format) => window.dateIntegration.formatDate(date, format);
window.getCurrentNepaliDate = (format) => window.dateIntegration.getCurrentDate(format);
window.validateNepaliDate = (date) => window.dateIntegration.validateDate(date);
window.getRelativeTime = (date) => window.dateIntegration.getRelativeTime(date);

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DateIntegration;
}
