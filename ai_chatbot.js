(function(){
  if (typeof window === 'undefined') return;
  window.NVC = window.NVC || {};
  NVC.Chatbot = NVC.Chatbot || {};

  // Simple, safer copy of the AI helpers from script.js
  NVC.Chatbot.AI_SYSTEM = NVC.Chatbot.AI_SYSTEM || {
    keywords: {
      high: ['तुरुन्त','अति','गम्भीर','भ्रष्टाचार','घूस','ज्यान','जोखिम','urgent','corruption'],
      medium: ['समस्या','ढिला','अनियमितता','गुनासो','delay']
    },

    analyzeComplaint: function(description){
      if (!description) return { priority: 'साधारण', category: 'अन्य', classification: 'अन्य', summary: '', sentiment: 'तटस्थ', entities: [] };

      // Prefer async Gemini analysis via NVC.Api.analyzeWithGemini; keep sync fallback
      const text = String(description || '');
      window._nvc_ai_cache = window._nvc_ai_cache || {};
      if (window._nvc_ai_cache[text]) return window._nvc_ai_cache[text];

      // Trigger background analysis and cache result when available
      (async () => {
        try {
          if (window.NVC && NVC.Api && typeof NVC.Api.analyzeWithGemini === 'function') {
            const res = await NVC.Api.analyzeWithGemini(text);
            if (res && res.success !== false) {
              window._nvc_ai_cache[text] = res;
              try { document.dispatchEvent(new CustomEvent('nvc.ai.analysis.updated', { detail: { text, result: res } })); } catch(e){}
              return;
            }
          }
        } catch (e) { console.warn('AI analyze failed', e); }

        // Fallback scoring (keeps synchronous behaviour)
        try {
          let score = 0; const lower = text.toLowerCase();
          this.keywords.high.forEach(k=>{ if (lower.includes(k)) score += 3; });
          this.keywords.medium.forEach(k=>{ if (lower.includes(k)) score += 1; });
          const priority = score >= 3 ? 'उच्च' : (score >=1 ? 'मध्यम' : 'साधारण');
          const summary = description.split(/[।?!.]/)[0] || description.substring(0,80);
          const fallback = { priority, category: 'अन्य', classification: 'अन्य', summary, sentiment: 'तटस्थ', entities: [], score, source: 'fallback' };
          window._nvc_ai_cache[text] = fallback;
          try { document.dispatchEvent(new CustomEvent('nvc.ai.analysis.updated', { detail: { text, result: fallback } })); } catch(e){}
        } catch(e){}
      })();

      return { priority: 'साधारण', category: 'अन्य', classification: 'अन्य', summary: description.substring(0,80), sentiment: 'तटस्थ', entities: [], source: 'pending_ai' };
    },

    getChatResponse: function(input){
      input = (input||'').toLowerCase();
      const state = NVC.State && NVC.State.state ? NVC.State.state : {};
      if (!input.trim()) return 'कृपया केही लेख्नुहोस्।';
      if (/(नमस्ते|hello|hi|namaste|नमस्कार)/.test(input)) return 'नमस्ते! म NVC AI सहायक हुँ।';
      if (/(कति|how many|count|kati)/.test(input) && /(बाँकी|pending|remaining|banki)/.test(input)){
        const pending = (state.complaints||[]).filter(c=>c.status==='pending').length;
        return `हाल प्रणालीमा <strong>${pending}</strong> वटा उजुरी फछ्रयौट हुन बाँकी छन्।`;
      }
      return 'माफ गर्नुहोस् — म त्यो प्रश्न बुझ्न सकेन।';
    }
  };

})();
