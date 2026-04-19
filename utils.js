(function(){
  if (typeof window === 'undefined') return;
  window.NVC = window.NVC || {};
  NVC.Utils = NVC.Utils || {};

  // Simple helper: normalize numbers (handles Nepali digits roughly)
  NVC.Utils.toNumber = function(v){
    if (v === null || v === undefined) return 0;
    if (typeof v === 'number') return v;
    v = String(v).replace(/[०-९]/g, function(d){
      const map = { '०':'0','१':'1','२':'2','३':'3','४':'4','५':'5','६':'6','७':'7','८':'8','९':'9' };
      return map[d] || d;
    }).replace(/[,']//g,'');
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  };

  // Date helper: safe parse into JS Date
  NVC.Utils.parseDate = function(s){
    if (!s) return null;
    const d = new Date(s);
    if (!isNaN(d)) return d;
    // try yyyy-mm-dd
    const m = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return new Date(m[1], m[2]-1, m[3]);
    return null;
  };

  // Simple debounce
  NVC.Utils.debounce = function(fn, wait){
    let t;
    return function(){
      const args = arguments;
      clearTimeout(t);
      t = setTimeout(()=> fn.apply(this,args), wait);
    };
  };

  // Map Nepali month name to number
  NVC.Utils.nepaliMonthNameToNumber = function(name) {
    if (!name) return null;
    const m = {
      'बैशाख':1,'जेठ':2,'असार':3,'साउन':4,'भदौ':5,'असोज':6,
      'कार्तिक':7,'मंसिर':8,'पुष':9,'माघ':10,'फागुन':11,'चैत':12
    };
    const key = String(name).replace(/[,\s]/g,'').trim();
    return m[key] || null;
  };

  // Convert Devanagari digits to Latin digits
  NVC.Utils.devanagariToLatin = function(s){
    if (!s && s !== 0) return '';
    return String(s).replace(/[०-९]/g, function(d){
      const map = { '०':'0','१':'1','२':'2','३':'3','४':'4','५':'5','६':'6','७':'7','८':'8','९':'9' };
      return map[d] || d;
    });
  };

  // Convert Latin digits to Devanagari (basic)
  NVC.Utils.latinToDevanagari = function(s){
    if (s === null || s === undefined) return '';
    return String(s).replace(/[0-9]/g, function(d){
      const map = { '0':'०','1':'१','2':'२','3':'३','4':'४','5':'५','6':'६','7':'७','8':'८','9':'९' };
      return map[d] || d;
    });
  };

  // Apply Devanagari conversion to text nodes inside an element
  NVC.Utils.applyDevanagariDigits = function(root){
    try {
      if (!root) return;
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          if (!node || !node.nodeValue) return NodeFilter.FILTER_REJECT;
          // ignore script/style/input/textarea content
          const p = node.parentElement;
          if (!p) return NodeFilter.FILTER_REJECT;
          const tag = (p.tagName||'').toLowerCase();
          if (tag === 'script' || tag === 'style' || tag === 'textarea' || tag === 'input') return NodeFilter.FILTER_REJECT;
          if (/\d/.test(node.nodeValue)) return NodeFilter.FILTER_ACCEPT;
          return NodeFilter.FILTER_REJECT;
        }
      }, false);
      const nodes = [];
      let n;
      while ((n = walker.nextNode())) nodes.push(n);
      for (const tn of nodes) {
        const latin = NVC.Utils.devanagariToLatin(tn.nodeValue);
        tn.nodeValue = NVC.Utils.latinToDevanagari(latin);
      }
    } catch (e) { /* ignore */ }
  };

  // Expose legacy global aliases if absent so older code can call them
  try {
    if (typeof window !== 'undefined') {
      if (typeof window._devnagariToLatin === 'undefined') window._devnagariToLatin = NVC.Utils.devanagariToLatin;
      if (typeof window._latinToDevnagari === 'undefined') window._latinToDevnagari = NVC.Utils.latinToDevanagari;

      // Provide safe global wrappers for inline onclick handlers that may reference legacy globals.
      const legacyFns = [
        'testDataLoad','checkState','openAdminLogin','openShakhaSelection','openReports','openSettings',
        'handleForgotPassword','showPage','logout','toggleNotifications','closeModal','closeShakhaModal',
        'closeSettingsModal','toggleChatbot','sendChatMessage'
      ];
      legacyFns.forEach(name => {
        if (typeof window[name] !== 'function') {
          window[name] = function(){
            try {
              if (window.NVC && NVC.UI && typeof NVC.UI[name] === 'function') return NVC.UI[name].apply(this, arguments);
              // If a legacy implementation exists under __legacy_<name>, call it
              const legacyName = '__legacy_' + name;
              if (typeof window[legacyName] === 'function') return window[legacyName].apply(this, arguments);
              console.warn(`Legacy wrapper: ${name} not implemented`);
            } catch (e) { console.warn('Wrapper '+name+' failed', e); }
          };
        }
      });
    }
  } catch (e) { /* ignore */ }

  // Also expose applyDevanagariDigits globally if a legacy caller expects it
  try {
    if (typeof window !== 'undefined' && typeof window.applyDevanagariDigits === 'undefined') {
      window.applyDevanagariDigits = function(root){
        try { return NVC.Utils.applyDevanagariDigits(root); } catch(e) { /* ignore */ }
      };
    }
  } catch(e) {}

    // Provide a central initializeDatepickers bridge for legacy and modular code
    try {
      NVC.Utils.initializeDatepickers = NVC.Utils.initializeDatepickers || function(){
        if (typeof initializeDatepickers === 'function') return initializeDatepickers.apply(this, arguments);
        // no-op fallback
        return false;
      };
      if (typeof window !== 'undefined' && typeof window.initializeDatepickers === 'undefined') {
        window.initializeDatepickers = function(){
          try { if (NVC && NVC.Utils && typeof NVC.Utils.initializeDatepickers === 'function') return NVC.Utils.initializeDatepickers.apply(this, arguments); } catch(e){}
        };
      }
    } catch(e) {}

})();
