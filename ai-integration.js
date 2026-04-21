/**
 * Enhanced AI Integration System
 * Consolidates and enhances all AI functionality across the application
 */

class AIIntegration {
    constructor() {
        this.cache = new Map();
        this.analysisQueue = [];
        this.isProcessing = false;
        this.config = {
            maxCacheSize: 1000,
            batchSize: 5,
            processingDelay: 100
        };
        
        // Enhanced keyword analysis
        this.keywords = {
            urgent: ['तुरुन्त', 'अति', 'गम्भीर', 'भ्रष्टाचार', 'घूस', 'ज्यान', 'जोखिम', 'urgent', 'corruption', 'emergency', 'critical'],
            high: ['उच्च', 'गम्भीर', 'झन्झट', 'high', 'serious', 'severe'],
            medium: ['समस्या', 'ढिला', 'अनियमितता', 'गुनासो', 'delay', 'problem', 'issue'],
            categories: {
                'भ्रष्टाचार': ['भ्रष्टाचार', 'घूस', 'corruption', 'bribe'],
                'सुरक्षा': ['ज्यान', 'दुर्घटना', 'accident', 'safety', 'danger'],
                'प्रशासनिक': ['ढिला', 'अनियमितता', 'delay', 'administrative', 'procedural'],
                'वित्त': ['आर्थिक', 'बजेट', 'financial', 'budget', 'payment'],
                'सेवा': ['सेवा', 'गुनासो', 'service', 'complaint', 'quality']
            }
        };
        
        this.initializeEventListeners();
    }

    /**
     * Initialize event listeners for AI integration
     */
    initializeEventListeners() {
        // Listen for analysis updates
        document.addEventListener('nvc.ai.analysis.updated', (event) => {
            const { text, result } = event.detail;
            this.cache.set(text, result);
            this.cleanupCache();
        });

        // Listen for chat requests
        document.addEventListener('nvc.ai.chat.request', (event) => {
            const { input, callback } = event.detail;
            const response = this.getChatResponse(input);
            if (callback) callback(response);
        });
    }

    /**
     * Enhanced complaint analysis with AI integration
     */
    async analyzeComplaint(description, options = {}) {
        if (!description) {
            return this.getDefaultAnalysis();
        }

        const text = String(description).trim();
        const cacheKey = this.generateCacheKey(text, options);
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        // Queue for processing
        return new Promise((resolve) => {
            this.analysisQueue.push({
                text,
                options,
                cacheKey,
                resolve
            });
            
            this.processQueue();
        });
    }

    /**
     * Process analysis queue
     */
    async processQueue() {
        if (this.isProcessing || this.analysisQueue.length === 0) {
            return;
        }

        this.isProcessing = true;
        const batch = this.analysisQueue.splice(0, this.config.batchSize);

        try {
            await Promise.all(batch.map(item => this.processAnalysis(item)));
        } catch (error) {
            console.error('AI batch processing failed:', error);
        } finally {
            this.isProcessing = false;
            
            // Continue processing if more items in queue
            if (this.analysisQueue.length > 0) {
                setTimeout(() => this.processQueue(), this.config.processingDelay);
            }
        }
    }

    /**
     * Process individual analysis
     */
    async processAnalysis(item) {
        const { text, options, cacheKey, resolve } = item;
        
        try {
            // Try advanced AI analysis first
            if (window.NVC && NVC.Api && typeof NVC.Api.analyzeWithGemini === 'function') {
                const aiResult = await NVC.Api.analyzeWithGemini(text);
                if (aiResult && aiResult.success !== false) {
                    const enhancedResult = this.enhanceAIResult(aiResult, text);
                    this.cache.set(cacheKey, enhancedResult);
                    resolve(enhancedResult);
                    this.notifyAnalysisUpdate(text, enhancedResult);
                    return;
                }
            }
        } catch (error) {
            console.warn('Advanced AI analysis failed, using fallback:', error);
        }

        // Fallback to keyword analysis
        const fallbackResult = this.performKeywordAnalysis(text);
        this.cache.set(cacheKey, fallbackResult);
        resolve(fallbackResult);
        this.notifyAnalysisUpdate(text, fallbackResult);
    }

    /**
     * Enhance AI result with additional metadata
     */
    enhanceAIResult(aiResult, text) {
        return {
            ...aiResult,
            timestamp: new Date().toISOString(),
            textLength: text.length,
            wordCount: text.split(/\s+/).length,
            hasUrgentKeywords: this.hasUrgentKeywords(text),
            confidence: aiResult.confidence || 0.8,
            source: 'ai_enhanced'
        };
    }

    /**
     * Perform keyword-based analysis
     */
    performKeywordAnalysis(text) {
        const lower = text.toLowerCase();
        let score = 0;
        let detectedCategories = [];
        
        // Calculate priority score
        this.keywords.urgent.forEach(keyword => {
            if (lower.includes(keyword)) score += 5;
        });
        
        this.keywords.high.forEach(keyword => {
            if (lower.includes(keyword)) score += 3;
        });
        
        this.keywords.medium.forEach(keyword => {
            if (lower.includes(keyword)) score += 1;
        });

        // Detect categories
        Object.entries(this.keywords.categories).forEach(([category, keywords]) => {
            if (keywords.some(keyword => lower.includes(keyword))) {
                detectedCategories.push(category);
            }
        });

        // Determine priority
        const priority = score >= 5 ? 'उच्च' : score >= 3 ? 'मध्यम' : 'साधारण';
        
        // Generate summary
        const summary = this.generateSummary(text);
        
        // Detect sentiment
        const sentiment = this.detectSentiment(text);

        return {
            priority,
            category: detectedCategories[0] || 'अन्य',
            classification: detectedCategories[0] || 'अन्य',
            summary,
            sentiment,
            entities: this.extractEntities(text),
            score,
            detectedCategories,
            source: 'keyword_analysis',
            timestamp: new Date().toISOString(),
            confidence: Math.min(0.9, score / 10)
        };
    }

    /**
     * Generate summary from text
     */
    generateSummary(text) {
        // Try to end at sentence boundary
        const sentences = text.split(/[।?!.]/);
        if (sentences[0] && sentences[0].length > 20) {
            return sentences[0].trim();
        }
        
        // Fallback to character limit
        return text.length > 100 ? text.substring(0, 100) + '...' : text;
    }

    /**
     * Detect sentiment in text
     */
    detectSentiment(text) {
        const positive = ['राम्रो', 'सन्तुष्ट', 'ठीक', 'good', 'satisfied', 'happy'];
        const negative = ['खराब', 'असन्तुष्ट', 'समस्या', 'bad', 'unsatisfied', 'problem', 'angry'];
        
        const lower = text.toLowerCase();
        const positiveCount = positive.filter(word => lower.includes(word)).length;
        const negativeCount = negative.filter(word => lower.includes(word)).length;
        
        if (positiveCount > negativeCount) return 'सकारात्मक';
        if (negativeCount > positiveCount) return 'नकारात्मक';
        return 'तटस्थ';
    }

    /**
     * Extract entities from text
     */
    extractEntities(text) {
        const entities = [];
        
        // Extract dates (simple pattern)
        const datePattern = /\d{4}[-\/]\d{1,2}[-\/]\d{1,2}|\d{1,2}[-\/]\d{1,2}[-\/]\d{4}/g;
        const dates = text.match(datePattern);
        if (dates) entities.push(...dates.map(date => ({ type: 'date', value: date })));
        
        // Extract phone numbers
        const phonePattern = /(\+977)?[9][6-8]\d{8}/g;
        const phones = text.match(phonePattern);
        if (phones) entities.push(...phones.map(phone => ({ type: 'phone', value: phone })));
        
        // Extract emails
        const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const emails = text.match(emailPattern);
        if (emails) entities.push(...emails.map(email => ({ type: 'email', value: email })));
        
        return entities;
    }

    /**
     * Check if text contains urgent keywords
     */
    hasUrgentKeywords(text) {
        const lower = text.toLowerCase();
        return this.keywords.urgent.some(keyword => lower.includes(keyword));
    }

    /**
     * Enhanced chat response system
     */
    getChatResponse(input) {
        input = String(input || '').toLowerCase().trim();
        
        if (!input) return 'कृपया केही लेख्नुहोस्।';
        
        // Greetings
        if (/(नमस्ते|hello|hi|namaste|नमस्कार|good morning|good evening)/.test(input)) {
            return 'नमस्ते! म राष्ट्रिय सतर्कता केन्द्रको AI सहायक हुँ। म तपाईंलाई कसरी सहयोग गर्न सक्छु?';
        }
        
        // Get state information
        const state = NVC.State && NVC.State.state ? NVC.State.state : {};
        const complaints = state.complaints || [];
        
        // Statistics queries
        if (/(कति|how many|count|kati|संख्या|number)/.test(input)) {
            if (/(बाँकी|pending|remaining|banki)/.test(input)) {
                const pending = complaints.filter(c => c.status === 'pending').length;
                return `हाल प्रणालीमा <strong>${pending}</strong> वटा उजुरी फछ्रयौट हुन बाँकी छन्।`;
            }
            
            if (/(सम्पन्न|resolved|completed|sampurna)/.test(input)) {
                const resolved = complaints.filter(c => c.status === 'resolved').length;
                return `<strong>${resolved}</strong> वटा उजुरी सम्पन्न भएका छन्।`;
            }
            
            if (/(जम्मा|total|jamma)/.test(input)) {
                return `जम्मा <strong>${complaints.length}</strong> वटा उजुरी दर्ता भएका छन्।`;
            }
        }
        
        // Priority queries
        if (/(उच्च|high priority|urgent|गम्भीर)/.test(input)) {
            const highPriority = complaints.filter(c => 
                c.priority === 'उच्च' || c.priority === 'urgent'
            ).length;
            return `<strong>${highPriority}</strong> वटा उच्च प्राथमिकताका उजुरीहरू छन्।`;
        }
        
        // Help queries
        if (/(मद्दत|help|सहयोग|सिकानु|how to|कसरी)/.test(input)) {
            return `म तपाईंलाई यी कुराहरूमा सहयोग गर्न सक्छु:\n• उजुरी दर्ता गर्ने\n• उजुरीको अवस्था जाँच्ने\n• प्रणालीको बारेमा जानकारी\n• तथ्याङ्क र विश्लेषण\n\nके तपाईं विशेष जान्न चाहनुहुन्छ?`;
        }
        
        // System status
        if (/(प्रणाली|system|status|अवस्था)/.test(input)) {
            const now = new Date();
            const uptime = performance.now();
            return `प्रणाली सञ्चालनमा छ।\n• समय: ${now.toLocaleTimeString('ne-NP')}\n• क्यास आकार: ${this.cache.size}\n• AI विश्लेषण: ${this.analysisQueue.length} कतारमा`;
        }
        
        // Default response
        return 'माफ गर्नुहोस् — म त्यो प्रश्न बुझ्न सकेन। कृपया "मद्दत" लेखेर मेरो सेवाहरू हेर्नुहोस्।';
    }

    /**
     * Get default analysis result
     */
    getDefaultAnalysis() {
        return {
            priority: 'साधारण',
            category: 'अन्य',
            classification: 'अन्य',
            summary: '',
            sentiment: 'तटस्थ',
            entities: [],
            score: 0,
            source: 'default',
            timestamp: new Date().toISOString(),
            confidence: 0.1
        };
    }

    /**
     * Generate cache key
     */
    generateCacheKey(text, options) {
        const optionsStr = JSON.stringify(options || {});
        return `${text.substring(0, 100)}_${optionsStr}`;
    }

    /**
     * Clean up cache to prevent memory issues
     */
    cleanupCache() {
        if (this.cache.size > this.config.maxCacheSize) {
            const entries = Array.from(this.cache.entries());
            const toDelete = entries.slice(0, Math.floor(this.config.maxCacheSize * 0.2));
            toDelete.forEach(([key]) => this.cache.delete(key));
        }
    }

    /**
     * Notify listeners of analysis updates
     */
    notifyAnalysisUpdate(text, result) {
        try {
            document.dispatchEvent(new CustomEvent('nvc.ai.analysis.updated', {
                detail: { text, result }
            }));
        } catch (error) {
            console.warn('Failed to dispatch analysis update event:', error);
        }
    }

    /**
     * Get AI system statistics
     */
    getStatistics() {
        return {
            cacheSize: this.cache.size,
            queueLength: this.analysisQueue.length,
            isProcessing: this.isProcessing,
            config: { ...this.config },
            uptime: performance.now()
        };
    }

    /**
     * Clear all caches and reset system
     */
    reset() {
        this.cache.clear();
        this.analysisQueue = [];
        this.isProcessing = false;
    }
}

// Create global instance and integrate with existing AI_SYSTEM
window.aiIntegration = new AIIntegration();

// Enhance existing AI_SYSTEM
if (window.NVC && NVC.Chatbot && NVC.Chatbot.AI_SYSTEM) {
    // Backup original methods
    const originalAnalyze = NVC.Chatbot.AI_SYSTEM.analyzeComplaint;
    const originalChat = NVC.Chatbot.AI_SYSTEM.getChatResponse;
    
    // Enhance analyzeComplaint
    NVC.Chatbot.AI_SYSTEM.analyzeComplaint = function(description, options) {
        return window.aiIntegration.analyzeComplaint(description, options);
    };
    
    // Enhance getChatResponse
    NVC.Chatbot.AI_SYSTEM.getChatResponse = function(input) {
        return window.aiIntegration.getChatResponse(input);
    };
    
    // Add new methods
    NVC.Chatbot.AI_SYSTEM.getStatistics = function() {
        return window.aiIntegration.getStatistics();
    };
    
    NVC.Chatbot.AI_SYSTEM.reset = function() {
        window.aiIntegration.reset();
    };
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIIntegration;
}
