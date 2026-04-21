/**
 * Nepali Calendar API - Comprehensive Date Management System
 * Replaces AD-to-BS conversion with native Nepali calendar operations
 */

(function(window) {
    'use strict';

    // Nepali Calendar Data
    const NEPALI_CALENDAR = {
        // Days in each month for different years (2080-2090)
        daysInMonth: {
            2080: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
            2081: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
            2082: [30, 31, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
            2083: [30, 31, 32, 31, 31, 30, 30, 30, 29, 30, 29, 31],
            2084: [30, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
            2085: [31, 30, 31, 31, 31, 30, 30, 30, 29, 30, 29, 31],
            2086: [30, 31, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30],
            2087: [30, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
            2088: [31, 30, 31, 31, 31, 30, 30, 30, 29, 30, 29, 31],
            2089: [30, 31, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30],
            2090: [30, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30]
        },
        
        months: [
            "बैशाख", "जेठ", "असार", "साउन", "भदौ", "असोज",
            "कार्तिक", "मंसिर", "पुष", "माघ", "फागुन", "चैत"
        ],
        
        weekdays: ["आइत", "सोम", "मंगल", "बुध", "बिही", "शुक्र", "शनि"],
        
        weekdaysShort: ["आ", "सो", "मं", "बु", "बि", "शु", "श"],
        weekdaysFull: ["आइतबार", "सोमबार", "मंगलबार", "बुधबार", "बिहीबार", "शुक्रबार", "शनिबार"]
    };

    // Core Calendar API
    const NepaliCalendar = {
        
        /**
         * Get current Nepali date
         * @returns {string} Format: YYYY-MM-DD
         */
        getCurrentDate: function() {
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth() + 1;
            const day = today.getDate();
            
            // Use existing conversion as fallback for initial current date
            try {
                if (window.convertADtoBSAccurate) {
                    return window.convertADtoBSAccurate(`${year}-${month}-${day}`);
                }
            } catch (e) {
                console.warn('AD to BS conversion failed, using fallback');
            }
            
            // Fallback calculation
            const bsYear = year + 57;
            const bsMonth = month;
            const bsDay = day;
            return `${bsYear}-${String(bsMonth).padStart(2, '0')}-${String(bsDay).padStart(2, '0')}`;
        },

        /**
         * Validate Nepali date
         * @param {number} year 
         * @param {number} month 
         * @param {number} day 
         * @returns {boolean}
         */
        isValidDate: function(year, month, day) {
            if (!NEPALI_CALENDAR.daysInMonth[year]) return false;
            if (month < 1 || month > 12) return false;
            if (day < 1 || day > NEPALI_CALENDAR.daysInMonth[year][month - 1]) return false;
            return true;
        },

        /**
         * Get days in month
         * @param {number} year 
         * @param {number} month 
         * @returns {number}
         */
        getDaysInMonth: function(year, month) {
            if (!NEPALI_CALENDAR.daysInMonth[year] || month < 1 || month > 12) {
                return 30; // Default fallback
            }
            return NEPALI_CALENDAR.daysInMonth[year][month - 1];
        },

        /**
         * Get month name in Nepali
         * @param {number} month 
         * @returns {string}
         */
        getMonthName: function(month) {
            if (month < 1 || month > 12) return '';
            return NEPALI_CALENDAR.months[month - 1];
        },

        /**
         * Format Nepali date
         * @param {string} dateStr - YYYY-MM-DD
         * @param {string} format - 'YYYY-MM-DD', 'DD MMMM YYYY', etc.
         * @returns {string}
         */
        formatDate: function(dateStr, format = 'YYYY-MM-DD') {
            const parts = dateStr.split('-');
            if (parts.length !== 3) return dateStr;
            
            const year = parseInt(parts[0]);
            const month = parseInt(parts[1]);
            const day = parseInt(parts[2]);
            
            if (!this.isValidDate(year, month, day)) return dateStr;
            
            const yearStr = String(year);
            const monthStr = String(month).padStart(2, '0');
            const dayStr = String(day).padStart(2, '0');
            const monthName = this.getMonthName(month);
            
            return format
                .replace('YYYY', yearStr)
                .replace('MM', monthStr)
                .replace('DD', dayStr)
                .replace('MMMM', monthName);
        },

        /**
         * Parse Nepali date string
         * @param {string} dateStr 
         * @returns {object|null} {year, month, day}
         */
        parseDate: function(dateStr) {
            const parts = dateStr.split('-');
            if (parts.length !== 3) return null;
            
            const year = parseInt(parts[0]);
            const month = parseInt(parts[1]);
            const day = parseInt(parts[2]);
            
            if (!this.isValidDate(year, month, day)) return null;
            
            return { year, month, day };
        },

        /**
         * Get full Nepali weekday name from an AD Date or date string
         * @param {Date|string} adDate
         * @returns {string}
         */
        getWeekdayFullNameFromAD: function(adDate) {
            try {
                let d = adDate;
                if (!(d instanceof Date)) d = new Date(d);
                if (isNaN(d.getTime())) return '';
                const idx = d.getDay();
                return NEPALI_CALENDAR.weekdaysFull[idx] || '';
            } catch (e) { return ''; }
        },

        /**
         * Format a Nepali display string for UI: "YYYY MONTH D, WEEKDAY"
         * Accepts BS string (YYYY-MM-DD), AD Date object, or nothing (current date)
         */
        formatDisplay: function(inputDate) {
            try {
                // If BS format
                if (typeof inputDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(inputDate)) {
                    const formatted = this.formatDate(inputDate, 'YYYY MMMM DD');
                    const ad = this.parseComplaintRegDateToAD({ entryDate: inputDate });
                    const weekday = ad ? this.getWeekdayFullNameFromAD(ad) : '';
                    return weekday ? `${formatted}, ${weekday}` : formatted;
                }

                // If AD Date provided
                if (inputDate instanceof Date) {
                    const ad = inputDate;
                    const bs = this.convertADtoBS(`${ad.getFullYear()}-${String(ad.getMonth()+1).padStart(2,'0')}-${String(ad.getDate()).padStart(2,'0')}`) || this.getCurrentDate();
                    const formatted = this.formatDate(bs, 'YYYY MMMM DD');
                    const weekday = this.getWeekdayFullNameFromAD(ad);
                    return weekday ? `${formatted}, ${weekday}` : formatted;
                }

                // Default: current date
                const cur = this.getCurrentDate();
                const formatted = this.formatDate(cur, 'YYYY MMMM DD');
                const adNow = this.parseComplaintRegDateToAD({ entryDate: cur });
                const weekdayNow = adNow ? this.getWeekdayFullNameFromAD(adNow) : '';
                return weekdayNow ? `${formatted}, ${weekdayNow}` : formatted;
            } catch (e) {
                return this.getCurrentDate();
            }
        },

        /**
         * Get calendar month data for rendering
         * @param {number} year 
         * @param {number} month 
         * @returns {object}
         */
        getMonthData: function(year, month) {
            const daysInMonth = this.getDaysInMonth(year, month);
            const monthName = this.getMonthName(month);
            const firstDayOfWeek = this.getFirstDayOfWeek(year, month);
            
            return {
                year,
                month,
                monthName,
                daysInMonth,
                firstDayOfWeek,
                weeks: this.generateWeeks(year, month, daysInMonth, firstDayOfWeek)
            };
        },

        /**
         * Get first day of week (0=Sunday, 6=Saturday)
         * @param {number} year 
         * @param {number} month 
         * @returns {number}
         */
        getFirstDayOfWeek: function(year, month) {
            // Simplified calculation - can be improved with actual astronomical data
            const totalDays = this.getTotalDaysSinceEpoch(year, month, 1);
            return (totalDays + 4) % 7; // Adjusted to match Nepali calendar
        },

        /**
         * Generate calendar weeks
         * @param {number} year 
         * @param {number} month 
         * @param {number} daysInMonth 
         * @param {number} firstDayOfWeek 
         * @returns {Array}
         */
        generateWeeks: function(year, month, daysInMonth, firstDayOfWeek) {
            const weeks = [];
            let currentWeek = [];
            
            // Add empty cells for days before month starts
            for (let i = 0; i < firstDayOfWeek; i++) {
                currentWeek.push(null);
            }
            
            // Add all days of the month
            for (let day = 1; day <= daysInMonth; day++) {
                currentWeek.push(day);
                
                if (currentWeek.length === 7) {
                    weeks.push(currentWeek);
                    currentWeek = [];
                }
            }
            
            // Add remaining days to last week
            if (currentWeek.length > 0) {
                while (currentWeek.length < 7) {
                    currentWeek.push(null);
                }
                weeks.push(currentWeek);
            }
            
            return weeks;
        },

        /**
         * Get total days since epoch (simplified)
         * @param {number} year 
         * @param {number} month 
         * @param {number} day 
         * @returns {number}
         */
        getTotalDaysSinceEpoch: function(year, month, day) {
            let totalDays = 0;
            
            // Add days for previous years
            for (let y = 2080; y < year; y++) {
                if (NEPALI_CALENDAR.daysInMonth[y]) {
                    totalDays += NEPALI_CALENDAR.daysInMonth[y].reduce((a, b) => a + b, 0);
                }
            }
            
            // Add days for previous months in current year
            for (let m = 1; m < month; m++) {
                totalDays += this.getDaysInMonth(year, m);
            }
            
            // Add current days
            totalDays += day - 1;
            
            return totalDays;
        },

        /**
         * Compare two dates
         * @param {string} date1 
         * @param {string} date2 
         * @returns {number} -1, 0, or 1
         */
        compareDates: function(date1, date2) {
            const d1 = this.parseDate(date1);
            const d2 = this.parseDate(date2);
            
            if (!d1 || !d2) return 0;
            
            if (d1.year !== d2.year) return d1.year < d2.year ? -1 : 1;
            if (d1.month !== d2.month) return d1.month < d2.month ? -1 : 1;
            if (d1.day !== d2.day) return d1.day < d2.day ? -1 : 1;
            return 0;
        },

        /**
         * Check if date is in current month
         * @param {string} dateStr 
         * @returns {boolean}
         */
        isCurrentMonth: function(dateStr) {
            const currentDate = this.getCurrentDate();
            const currentYearMonth = currentDate.substring(0, 7);
            const dateYearMonth = dateStr.substring(0, 7);
            return currentYearMonth === dateYearMonth;
        },

        /**
         * Check if date is today
         * @param {string} dateStr 
         * @returns {boolean}
         */
        isToday: function(dateStr) {
            const currentDate = this.getCurrentDate();
            return currentDate === dateStr;
        }
    };

    // Calendar UI Component
    NepaliCalendar.UI = {
        
        /**
         * Create calendar modal
         * @param {HTMLElement} inputElement 
         * @param {object} options 
         */
        createCalendar: function(inputElement, options = {}) {
            console.log('📅 createCalendar called for:', inputElement);
            console.log('📅 Options:', options);
            
            const modal = this.createModal();
            const calendar = this.createCalendarWidget(options);
            
            modal.appendChild(calendar);
            document.body.appendChild(modal);
            
            console.log('📅 Modal added to body');
            
            this.bindEvents(modal, inputElement, options);
            this.showCalendar(modal, options.initialDate);
            
            console.log('📅 Calendar setup completed');
        },

        /**
         * Create modal container
         * @returns {HTMLElement}
         */
        createModal: function() {
            const modal = document.createElement('div');
            modal.className = 'nepali-calendar-modal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.6);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                font-family: 'Preeti', 'Kantipur', sans-serif;
            `;
            return modal;
        },

        /**
         * Create calendar widget
         * @param {object} options 
         * @returns {HTMLElement}
         */
        createCalendarWidget: function(options) {
            const widget = document.createElement('div');
            widget.className = 'nepali-calendar-widget';
            widget.style.cssText = `
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                min-width: 350px;
                max-width: 90%;
                overflow: hidden;
            `;
            
            widget.innerHTML = `
                <div class="calendar-header" style="
                    background: #0d6efd;
                    color: white;
                    padding: 15px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <button type="button" class="nav-btn prev-btn" style="
                        background: none;
                        border: none;
                        color: white;
                        font-size: 18px;
                        cursor: pointer;
                        padding: 5px 10px;
                        border-radius: 4px;
                    ">‹</button>
                    <div class="month-year-display" style="
                        font-size: 16px;
                        font-weight: bold;
                    "></div>
                    <button type="button" class="nav-btn next-btn" style="
                        background: none;
                        border: none;
                        color: white;
                        font-size: 18px;
                        cursor: pointer;
                        padding: 5px 10px;
                        border-radius: 4px;
                    ">›</button>
                </div>
                <div class="calendar-body" style="padding: 15px;">
                    <div class="weekdays" style="
                        display: grid;
                        grid-template-columns: repeat(7, 1fr);
                        gap: 5px;
                        margin-bottom: 10px;
                    "></div>
                    <div class="days-grid" style="
                        display: grid;
                        grid-template-columns: repeat(7, 1fr);
                        gap: 5px;
                    "></div>
                </div>
                <div class="calendar-footer" style="
                    padding: 10px 15px;
                    border-top: 1px solid #eee;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <button type="button" class="today-btn" style="
                        background: #6c757d;
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                    ">आज</button>
                    <button type="button" class="close-btn" style="
                        background: #dc3545;
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                    ">रद्द गर्नुहोस्</button>
                </div>
            `;
            
            return widget;
        },

        /**
         * Bind calendar events
         * @param {HTMLElement} modal 
         * @param {HTMLElement} inputElement 
         * @param {object} options 
         */
        bindEvents: function(modal, inputElement, options) {
            const widget = modal.querySelector('.nepali-calendar-widget');
            const prevBtn = widget.querySelector('.prev-btn');
            const nextBtn = widget.querySelector('.next-btn');
            const todayBtn = widget.querySelector('.today-btn');
            const closeBtn = widget.querySelector('.close-btn');
            
            let currentYear = parseInt(options.initialDate?.split('-')[0]) || parseInt(NepaliCalendar.getCurrentDate().split('-')[0]);
            let currentMonth = parseInt(options.initialDate?.split('-')[1]) || parseInt(NepaliCalendar.getCurrentDate().split('-')[1]);
            
            const renderCalendar = () => {
                this.renderCalendarWidget(widget, currentYear, currentMonth, options);
            };
            
            prevBtn.addEventListener('click', () => {
                currentMonth--;
                if (currentMonth < 1) {
                    currentMonth = 12;
                    currentYear--;
                }
                renderCalendar();
            });
            
            nextBtn.addEventListener('click', () => {
                currentMonth++;
                if (currentMonth > 12) {
                    currentMonth = 1;
                    currentYear++;
                }
                renderCalendar();
            });
            
            todayBtn.addEventListener('click', () => {
                const today = NepaliCalendar.getCurrentDate();
                if (inputElement) {
                    inputElement.value = today;
                    inputElement.dispatchEvent(new Event('change', { bubbles: true }));
                }
                modal.remove();
                if (options.onSelect) options.onSelect(today);
            });
            
            closeBtn.addEventListener('click', () => {
                modal.remove();
                if (options.onCancel) options.onCancel();
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                    if (options.onCancel) options.onCancel();
                }
            });
        },

        /**
         * Render calendar widget
         * @param {HTMLElement} widget 
         * @param {number} year 
         * @param {number} month 
         * @param {object} options 
         */
        renderCalendarWidget: function(widget, year, month, options) {
            const monthData = NepaliCalendar.getMonthData(year, month);
            const monthYearDisplay = widget.querySelector('.month-year-display');
            const weekdaysContainer = widget.querySelector('.weekdays');
            const daysGrid = widget.querySelector('.days-grid');
            
            // Update header
            monthYearDisplay.textContent = `${monthData.monthName} ${year}`;
            
            // Render weekdays
            weekdaysContainer.innerHTML = NEPALI_CALENDAR.weekdaysShort.map(day => 
                `<div style="text-align: center; font-weight: bold; color: #666; font-size: 12px;">${day}</div>`
            ).join('');
            
            // Render days
            daysGrid.innerHTML = '';
            monthData.weeks.forEach(week => {
                week.forEach(day => {
                    const dayElement = document.createElement('div');
                    dayElement.style.cssText = `
                        text-align: center;
                        padding: 8px;
                        cursor: pointer;
                        border-radius: 4px;
                        font-size: 14px;
                        ${day ? 'background: #f8f9fa; border: 1px solid #dee2e6;' : ''}
                        ${day && NepaliCalendar.isToday(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`) ? 'background: #0d6efd; color: white;' : ''}
                        ${day && !day ? 'cursor: default;' : ''}
                    `;
                    
                    if (day) {
                        dayElement.textContent = day;
                        dayElement.addEventListener('click', () => {
                            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            if (options.inputElement) {
                                options.inputElement.value = dateStr;
                                options.inputElement.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                            if (options.onSelect) options.onSelect(dateStr);
                            
                            // Close modal
                            const modal = widget.closest('.nepali-calendar-modal');
                            if (modal) modal.remove();
                        });
                        
                        dayElement.addEventListener('mouseenter', () => {
                            if (!NepaliCalendar.isToday(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`)) {
                                dayElement.style.background = '#e9ecef';
                            }
                        });
                        
                        dayElement.addEventListener('mouseleave', () => {
                            if (!NepaliCalendar.isToday(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`)) {
                                dayElement.style.background = '#f8f9fa';
                            }
                        });
                    }
                    
                    daysGrid.appendChild(dayElement);
                });
            });
        },

        /**
         * Show calendar with specific date
         * @param {HTMLElement} modal 
         * @param {string} initialDate 
         */
        showCalendar: function(modal, initialDate) {
            const widget = modal.querySelector('.nepali-calendar-widget');
            const date = initialDate || NepaliCalendar.getCurrentDate();
            const parts = date.split('-');
            const year = parseInt(parts[0]);
            const month = parseInt(parts[1]);
            
            this.renderCalendarWidget(widget, year, month, { inputElement: null });
        }
    };

    // Initialize calendar for all date inputs
    NepaliCalendar.init = function() {
        console.log('🔄 Initializing Nepali Calendar API...');
        
        // 1. Replace existing nepali-datepicker-dropdown with calendar API
        document.querySelectorAll('.nepali-datepicker-dropdown').forEach(dropdown => {
            const targetId = dropdown.dataset.target;
            if (!targetId) {
                console.warn('⚠️ Dropdown missing data-target attribute');
                return;
            }
            
            const hiddenInput = document.getElementById(targetId);
            if (!hiddenInput) {
                console.warn(`⚠️ Hidden input not found: ${targetId}`);
                return;
            }
            
            // Create calendar input
            const calendarInput = document.createElement('input');
            calendarInput.type = 'text';
            calendarInput.className = 'form-control nepali-calendar-input';
            calendarInput.placeholder = 'नेपाली मिति छान्नुहोस्';
            calendarInput.readOnly = true;
            calendarInput.value = hiddenInput.value || NepaliCalendar.getCurrentDate();
            
            // Replace dropdown with calendar input
            dropdown.parentNode.replaceChild(calendarInput, dropdown);
            console.log(`✅ Converted dropdown to calendar input: ${targetId}`);
            
            // Bind calendar to input
            calendarInput.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('📅 Calendar input clicked:', targetId);
                console.log('📅 NepaliCalendar available:', !!window.NepaliCalendar);
                console.log('📅 createCalendar function available:', !!(window.NepaliCalendar && window.NepaliCalendar.UI && window.NepaliCalendar.UI.createCalendar));
                
                try {
                    NepaliCalendar.UI.createCalendar(calendarInput, {
                        initialDate: calendarInput.value,
                        onSelect: (dateStr) => {
                            hiddenInput.value = dateStr;
                            calendarInput.value = dateStr;
                            console.log(`📅 Date selected: ${dateStr}`);
                        }
                    });
                } catch (error) {
                    console.error('❌ Error creating calendar:', error);
                }
            });
        });
        
        // 2. Initialize existing nepali-datepicker-input elements
        document.querySelectorAll('.nepali-datepicker-input').forEach(input => {
            if (!input.value) {
                input.value = NepaliCalendar.getCurrentDate();
            }
            
            input.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('📅 nepali-datepicker-input clicked:', input.className);
                
                try {
                    NepaliCalendar.UI.createCalendar(input, {
                        initialDate: input.value || NepaliCalendar.getCurrentDate(),
                        onSelect: (dateStr) => {
                            input.value = dateStr;
                            console.log(`📅 Date selected: ${dateStr}`);
                        }
                    });
                } catch (error) {
                    console.error('❌ Error creating calendar for nepali-datepicker-input:', error);
                }
            });
            console.log('✅ Initialized nepali-datepicker-input element');
        });
        
        // 3. Initialize nepali-calendar-input elements (new class)
        document.querySelectorAll('.nepali-calendar-input').forEach(input => {
            if (!input.value) {
                input.value = NepaliCalendar.getCurrentDate();
            }
            
            input.addEventListener('click', () => {
                NepaliCalendar.UI.createCalendar(input, {
                    initialDate: input.value || NepaliCalendar.getCurrentDate(),
                    onSelect: (dateStr) => {
                        input.value = dateStr;
                        console.log(`📅 Date selected: ${dateStr}`);
                    }
                });
            });
            console.log('✅ Initialized nepali-calendar-input element');
        });
        
        console.log('✅ Nepali Calendar API initialization completed');
        
        // Check for date inputs on current page
        const dropdownCount = document.querySelectorAll('.nepali-datepicker-dropdown').length;
        const inputCount = document.querySelectorAll('.nepali-datepicker-input').length;
        const calendarInputCount = document.querySelectorAll('.nepali-calendar-input').length;
        
        console.log(`📊 Found date inputs: dropdowns=${dropdownCount}, inputs=${inputCount}, calendar-inputs=${calendarInputCount}`);
        
        if (dropdownCount === 0 && inputCount === 0 && calendarInputCount === 0) {
            console.log('ℹ️ No date inputs found on current page');
        }
        
        // Add test function to verify calendar is working
        window.testNepaliCalendar = function() {
            console.log('🧪 Testing Nepali Calendar...');
            
            // Create a temporary input element for testing
            const testInput = document.createElement('input');
            testInput.type = 'text';
            testInput.className = 'form-control';
            testInput.placeholder = 'Test Calendar Input';
            testInput.value = NepaliCalendar.getCurrentDate();
            testInput.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 9999; background: white; padding: 5px; border: 1px solid #ccc;';
            document.body.appendChild(testInput);
            
            try {
                NepaliCalendar.UI.createCalendar(testInput, {
                    initialDate: NepaliCalendar.getCurrentDate(),
                    onSelect: (dateStr) => {
                        console.log('📅 Test date selected:', dateStr);
                        testInput.value = dateStr;
                        // Remove test input after selection
                        setTimeout(() => {
                            if (document.body.contains(testInput)) {
                                document.body.removeChild(testInput);
                            }
                        }, 1000);
                    },
                    onCancel: () => {
                        console.log('❌ Test calendar cancelled');
                        // Remove test input on cancel
                        if (document.body.contains(testInput)) {
                            document.body.removeChild(testInput);
                        }
                    }
                });
                console.log('✅ Test calendar created successfully');
                console.log('💡 Test input added to top-right corner');
            } catch (error) {
                console.error('❌ Test calendar failed:', error);
                // Clean up test input on error
                if (document.body.contains(testInput)) {
                    document.body.removeChild(testInput);
                }
            }
        };
        
        // Add alias for common typo
        window.testNepaliCalender = window.testNepaliCalendar;
        
        console.log('💡 Run testNepaliCalendar() or testNepaliCalender() in console to test');
    };

    // -------------------- Compatibility helpers (migrated from script.js) --------------------
    // Fallback function for Nepali date when libraries are missing
    NepaliCalendar.getFallbackNepaliDate = function() {
        const now = new Date();
        const monthDays = [30, 31, 32, 31, 32, 30, 30, 29, 30, 29, 30, 30];
        const nepaliMonths = ["बैशाख", "जेठ", "असार", "साउन", "भदौ", "असोज", "कार्तिक", "मंसिर", "पुष", "माघ", "फागुन", "चैत"];
        const weekdays = ["आइतबार", "सोमबार", "मंगलबार", "बुधबार", "बिहीबार", "शुक्रबार", "शनिबार"];
        // Reference date: 2025-02-16 = 2081-11-03 (approx)
        const refAD = new Date(2025, 1, 16);
        const refBS = { year: 2081, month: 11, day: 3 };
        const diffTime = now - refAD;
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        let bsYear = refBS.year;
        let bsMonth = refBS.month;
        let bsDay = refBS.day + diffDays;
        while (bsDay > monthDays[bsMonth - 1]) {
            bsDay -= monthDays[bsMonth - 1];
            bsMonth++;
            if (bsMonth > 12) { bsMonth = 1; bsYear++; }
        }
        while (bsDay < 1) {
            bsMonth--;
            if (bsMonth < 1) { bsMonth = 12; bsYear--; }
            bsDay += monthDays[bsMonth - 1];
        }
        const monthName = nepaliMonths[bsMonth - 1] || "बैशाख";
        const dayName = weekdays[now.getDay()];
        return `${bsYear} ${monthName} ${bsDay}, ${dayName}`;
    };

    // Accurate AD -> BS conversion (copied from script.js)
    NepaliCalendar.convertADtoBSAccurate = function(adDateStr) {
        try {
            if (!adDateStr || adDateStr === 'undefined' || adDateStr === '') return '';
            const m = String(adDateStr).trim().match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
            if (m) {
                const parts = [Number(m[1]), Number(m[2]), Number(m[3])];
                if (parts.every(n => !isNaN(n))) {
                    const adYear = parts[0];
                    const adMonth = parts[1];
                    const adDay = parts[2];
                    let bsYear = adYear + 56;
                    let bsMonth = adMonth + 8;
                    let bsDay = adDay + 17;
                    if (bsDay > 30) { bsDay -= 30; bsMonth++; }
                    if (bsMonth > 12) { bsMonth -= 12; bsYear++; }
                    return `${bsYear}-${String(bsMonth).padStart(2,'0')}-${String(bsDay).padStart(2,'0')}`;
                }
            }
            return NepaliCalendar.getFallbackNepaliDate();
        } catch (e) {
            return NepaliCalendar.getFallbackNepaliDate();
        }
    };

    // Simple wrapper: convert AD to BS using accurate method
    NepaliCalendar.convertADtoBS = function(adDateStr) {
        if (!adDateStr) return '';
        try {
            const m = String(adDateStr).trim().match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
            if (m) {
                const y = Number(m[1]);
                if (y >= 2050) return `${m[1]}-${String(m[2]).padStart(2,'0')}-${String(m[3]).padStart(2,'0')}`;
                const parts = [Number(m[1]), Number(m[2]), Number(m[3])];
                if (parts.every(n => !isNaN(n))) return NepaliCalendar.convertADtoBSAccurate(`${m[1]}-${String(m[2]).padStart(2,'0')}-${String(m[3]).padStart(2,'0')}`);
            }
        } catch (e) { /* ignore */ }
        return '';
    };

    // Normalize Nepali display to ISO YYYY-MM-DD (copied/adapted)
    NepaliCalendar.normalizeNepaliDisplayToISO = function(raw) {
        if (!raw) return '';
        let s = String(raw).trim();
        // convert devanagari digits to latin if helper exists
        try { if (window.NVC && NVC.Utils && typeof NVC.Utils.devanagariToLatin === 'function') s = NVC.Utils.devanagariToLatin(s); } catch(e){}
        const dashMatch = s.match(/(\d{4})\D(\d{1,2})\D(\d{1,2})/);
        if (dashMatch) {
            const y = dashMatch[1]; const mo = String(dashMatch[2]).padStart(2,'0'); const d = String(dashMatch[3]).padStart(2,'0');
            return `${y}-${mo}-${d}`;
        }
        const tokens = s.split(/\s+/).filter(Boolean);
        if (tokens.length >= 2) {
            const yearToken = tokens[0].replace(/[^0-9]/g, '');
            let monthToken = tokens[1].replace(/[^\u0900-\u097Fa-zA-Z]/g, '');
            let dayToken = '';
            for (let i=2;i<tokens.length;i++) { const t = tokens[i].replace(/[,\s]/g,''); if (t.match(/\d/)) { dayToken = t.replace(/[^0-9]/g,''); break; } }
            if (!dayToken && tokens[2] && tokens[2].match(/\d/)) dayToken = tokens[2].replace(/[^0-9]/g,'');
            const monthNumber = (window.NepaliCalendar && typeof window.NepaliCalendar.getMonthName === 'function') ? (function(mtok){
                // attempt to map month name -> number
                const map = { 'बैशाख':1,'जेठ':2,'असार':3,'साउन':4,'भदौ':5,'असोज':6,'कार्तिक':7,'मंसिर':8,'पुष':9,'माघ':10,'फागुन':11,'चैत':12 };
                return map[mtok] || (mtok.match(/\d+/) ? Number(mtok) : null);
            })(monthToken) : null;
            if (yearToken && monthNumber && dayToken) return `${yearToken}-${String(monthNumber).padStart(2,'0')}-${String(dayToken).padStart(2,'0')}`;
        }
        const digits = s.replace(/[^0-9]/g,'');
        if (digits.length === 8) return `${digits.slice(0,4)}-${digits.slice(4,6)}-${digits.slice(6,8)}`;
        return s;
    };

    // Parse complaint registration date into an AD Date object when possible
    NepaliCalendar.parseComplaintRegDateToAD = function(complaint) {
        if (!complaint) return null;
        const raw = complaint.entryDate || complaint.date || complaint['दर्ता मिति'] || complaint['Entry Date'] || complaint.createdAt || '';
        if (!raw) return null;
        const iso = NepaliCalendar.normalizeNepaliDisplayToISO(raw);
        if (!iso) return null;
        const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!m) {
            const d = new Date(iso);
            return isNaN(d.getTime()) ? null : d;
        }
        const y = Number(m[1]); const mo = Number(m[2]); const da = Number(m[3]);
        if (!y || !mo || !da) return null;
        const looksBS = y >= 2050;
        if (looksBS) {
            try {
                if (typeof NepaliFunctions !== 'undefined' && typeof NepaliFunctions.BS2AD === 'function') {
                    const adStr = NepaliFunctions.BS2AD(y, mo, da);
                    const d = new Date(NepaliCalendar.normalizeNepaliDisplayToISO(adStr));
                    return isNaN(d.getTime()) ? null : d;
                }
                if (typeof NepaliDatePicker !== 'undefined' && typeof NepaliDatePicker.bs2ad === 'function') {
                    const adStr = NepaliDatePicker.bs2ad(`${y}-${String(mo).padStart(2,'0')}-${String(da).padStart(2,'0')}`);
                    const d = new Date(NepaliCalendar.normalizeNepaliDisplayToISO(adStr));
                    return isNaN(d.getTime()) ? null : d;
                }
                // Approximate fallback using reference
                const refBS = new Date(2081, 0, 1);
                const refAD = new Date(2024, 3, 13);
                const bsDate = new Date(y, mo - 1, da);
                const diffDays = Math.floor((bsDate - refBS) / (1000 * 60 * 60 * 24));
                const approxAD = new Date(refAD.getTime() + diffDays * 24 * 60 * 60 * 1000);
                return isNaN(approxAD.getTime()) ? null : approxAD;
            } catch (e) { return null; }
        }
        const d = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00`);
        return isNaN(d.getTime()) ? null : d;
    };

    // Ensure BS date: normalize and convert AD to BS when needed
    NepaliCalendar.ensureBSDate = function(raw) {
        if (!raw) return '';
        let s = String(raw).trim();
        if (/[\u0900-\u097F]/.test(s) || /[बैशाख|जेठ|फागुन|चैत]/.test(s)) {
            const normalized = NepaliCalendar.normalizeNepaliDisplayToISO(s);
            if (normalized) return normalized;
        }
        const isoMatch = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
        if (isoMatch) {
            const year = Number(isoMatch[1]);
            if (year >= 2050) return `${isoMatch[1]}-${String(isoMatch[2]).padStart(2,'0')}-${String(isoMatch[3]).padStart(2,'0')}`;
            const converted = NepaliCalendar.convertADtoBS(s);
            return converted || `${isoMatch[1]}-${String(isoMatch[2]).padStart(2,'0')}-${String(isoMatch[3]).padStart(2,'0')}`;
        }
        const digits = s.replace(/[^0-9]/g,'');
        if (digits.length === 8) return `${digits.slice(0,4)}-${digits.slice(4,6)}-${digits.slice(6,8)}`;
        return s;
    };

    // Legacy global aliases have been removed — callers should use `NepaliCalendar`.

    // Initialize Nepali Calendar API when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
      // Initialize Nepali Calendar API after a short delay to ensure all scripts are loaded
      setTimeout(() => {
        try {
          if (window.NepaliCalendar && typeof window.NepaliCalendar.init === 'function') {
            window.NepaliCalendar.init();
            console.log('✅ Nepali Calendar API initialized successfully');
          } else {
            console.warn('⚠️ Nepali Calendar API not available, falling back to legacy date pickers');
            // Initialize legacy date pickers as fallback
            if (typeof initializeDatepickers === 'function') {
              initializeDatepickers();
            }
          }
        } catch (e) {
          console.error('❌ Error initializing Nepali Calendar API:', e);
          // Fallback to legacy initialization
          if (typeof initializeDatepickers === 'function') {
            initializeDatepickers();
          }
        }
      }, 500);
    });

    // Export to global scope (only once, outside event listener)
    window.NepaliCalendar = NepaliCalendar;

})(window);
