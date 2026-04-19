(function(){
  if (typeof window === 'undefined') return;
  window.NVC = window.NVC || {};
  NVC.Api = NVC.Api || {};

  const cfg = NVC.Config && NVC.Config.GOOGLE_SHEETS_CONFIG;

  // Full-featured JSONP-based GET (moved from script.js)
  NVC.Api.getFromGoogleSheets = async function(action, params = {}) {
    if (!cfg || !cfg.ENABLED) {
      console.log('ℹ️ Google Sheets disabled');
      return { success: false, data: [], message: 'Integration disabled' };
    }
    if (!cfg.API_KEY) return { success: false, data: [], message: 'API Key missing' };
    if (!cfg.WEB_APP_URL || cfg.WEB_APP_URL.includes('script.google.com/macros/s/') === false) {
      return { success: false, data: [], message: 'Invalid Web App URL' };
    }

    let url = cfg.WEB_APP_URL;
    url += `?action=${encodeURIComponent(action)}`;
    url += `&apiKey=${encodeURIComponent(cfg.API_KEY)}`;
    Object.keys(params || {}).forEach(key => {
      const v = params[key];
      if (v !== undefined && v !== null && v !== '') url += `&${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`;
    });
    const callbackName = `jsonp_${action}_${Date.now()}_${Math.floor(Math.random()*1000)}`;
    url += `&callback=${callbackName}`;
    url += `&t=${Date.now()}`;

    const parseResponseText = (text) => {
      const trimmed = String(text).trim();
      
      // Check if response is HTML (error page) instead of JSON
      if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html') || trimmed.startsWith('<')) {
        console.warn('Received HTML response instead of JSON, likely a 404 or error page');
        return { success: false, message: 'Google Apps Script endpoint not available (404 error)', data: [] };
      }
      
      let parsed = null;
      try {
        if (trimmed.startsWith(`${callbackName}(`) && trimmed.endsWith(')')) {
          parsed = JSON.parse(trimmed.substring(callbackName.length + 1, trimmed.length - 1));
        } else {
          parsed = JSON.parse(trimmed);
        }
      } catch (parseError) {
        console.warn('Failed to parse response as JSON:', parseError, 'Response text:', trimmed.substring(0, 200));
        return { success: false, message: 'Invalid JSON response from server', data: [] };
      }
      
      if (Array.isArray(parsed)) {
        return { success: true, data: parsed, count: parsed.length };
      }
      if (parsed && Array.isArray(parsed.data) && parsed.success === undefined) {
        parsed.success = true;
      }
      if (parsed && parsed.success === undefined) {
        parsed.success = !!parsed.data || !!parsed.id;
      }
      return parsed;
    };

    if (typeof fetch === 'function') {
      try {
        const response = await fetch(url, { method: 'GET', credentials: 'omit', cache: 'no-store' });
        
        // Check for HTTP errors
        if (!response.ok) {
          console.warn(`HTTP error: ${response.status} ${response.statusText}`);
          if (response.status === 404) {
            return { success: false, message: 'Google Apps Script endpoint not found (404)', data: [] };
          }
          return { success: false, message: `HTTP ${response.status}: ${response.statusText}`, data: [] };
        }
        
        const text = await response.text();
        return parseResponseText(text);
      } catch (fetchError) {
        console.warn('getFromGoogleSheets fetch failed, using JSONP fallback', fetchError);
      }
    }

    return new Promise((resolve) => {
      try {
        const globalObject = typeof globalThis !== 'undefined' ? globalThis : window;
        let isResolved = false;
        let retryCount = 0;

        const cleanup = (removeCallback = true) => {
          clearTimeout(timeout);
          if (removeCallback) {
            try { if (globalObject[callbackName]) delete globalObject[callbackName]; } catch (e) {}
          }
          try { if (script && script.parentNode) script.parentNode.removeChild(script); } catch (e) {}
        };

        const timeout = setTimeout(() => {
          if (!isResolved) {
            if (retryCount < (cfg.MAX_RETRIES || 3)) {
              retryCount++;
              const newCallback = `${callbackName}_retry${retryCount}`;
              globalObject[newCallback] = globalObject[callbackName];
              cleanup(false);
              setTimeout(() => {
                url = url.replace(/&callback=[^&]+/, `&callback=${newCallback}`);
                url = url.replace(/&t=\d+/, `&t=${Date.now()}`);
                script.src = url;
                document.head.appendChild(script);
              }, (cfg.RETRY_DELAY || 1000) * retryCount);
            } else {
              cleanup();
              resolve({ success: false, data: [], message: 'Timeout after retries', action });
            }
          }
        }, cfg.TIMEOUT || 30000);

        globalObject[callbackName] = function(response) {
          if (isResolved) return;
          isResolved = true; cleanup();
          let formatted = response || { success: false, data: [] };
          if (Array.isArray(formatted)) formatted = { success: true, data: formatted, count: formatted.length };
          else if (formatted.data && Array.isArray(formatted.data) && formatted.success === undefined) formatted.success = true;
          else if (formatted.success === undefined) formatted.success = !!formatted.data || !!formatted.id;
          resolve(formatted);
        };

        const script = document.createElement('script');
        script.src = url; script.async = true;
        script.onerror = function(error) {
          if (isResolved) return;
          if (retryCount < (cfg.MAX_RETRIES || 3)) {
            retryCount++;
            setTimeout(() => {
              try { url = url.replace(/&t=\d+/, `&t=${Date.now()}`); } catch (e) {}
              const newScript = document.createElement('script'); newScript.src = url; newScript.async = true; newScript.onerror = script.onerror;
              document.head.appendChild(newScript);
            }, (cfg.RETRY_DELAY || 1000) * retryCount);
          } else {
            cleanup();
            const fetchUrl = url.replace(/&callback=[^&]+/, '').replace(/&t=\d+/, `&t=${Date.now()}`);
            fetch(fetchUrl, { method: 'GET', credentials: 'omit', cache: 'no-store' })
              .then(resp => resp.text())
              .then(text => resolve(parseResponseText(text)))
              .catch(fetchError => {
                try { if (typeof NVC.UI !== 'undefined' && typeof NVC.UI.showToast === 'function') NVC.UI.showToast('❌ Google Sheets connect हुन सकेन। Apps Script Web App deployment (Anyone access) र URL जाँच गर्नुहोस्।', {bg:'#d32f2f'}); } catch (e) {}
                console.error('❌ Google Sheets Script Load Error: Possible CORS or Permissions issue. Ensure "Who has access" is set to "Anyone". URL:', url, fetchError);
                resolve({ success: false, data: [], message: 'Network error after retries', action });
              });
          }
        };

        document.head.appendChild(script);
      } catch (error) {
        resolve({ success: false, data: [], message: String(error), action });
      }
    });
  };

  // POST helper for large payloads to Google Sheets (avoids long-URL/JSONP truncation)
  NVC.Api.postLargeToGoogleSheets = async function(action, data = {}) {
    if (!cfg || !cfg.ENABLED) {
      return { success: true, message: 'Data saved locally (Google Sheets disabled)', id: data.id || null, local: true };
    }
    try {
      const bodyParams = new URLSearchParams();
      bodyParams.append('action', action);
      bodyParams.append('apiKey', cfg.API_KEY);
      Object.keys(data || {}).forEach(k => {
        const v = data[k];
        if (v !== undefined && v !== null) bodyParams.append(k, String(v));
      });

      const resp = await fetch(cfg.WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: bodyParams.toString(),
        credentials: 'omit',
        cache: 'no-store'
      });
      if (!resp || !resp.ok) return { success: false, message: `HTTP ${resp.status || 'error'}` };
      let json = null;
      try { json = await resp.json(); } catch (e) { json = null; }
      if (!json) return { success: false, message: 'Invalid JSON response' };
      return json;
    } catch (error) {
      console.error('postLargeToGoogleSheets failed', error);
      return { success: false, message: String(error) };
    }
  };

  // Full-featured JSONP POST (moved from script.js)
  NVC.Api.postToGoogleSheets = async function(action, data = {}) {
    if (!cfg || !cfg.ENABLED) {
      return { success: true, message: 'Data saved locally (Google Sheets disabled)', id: data.id || null, local: true };
    }

    // First, try a direct POST (preferred) — faster and avoids JSONP timing issues.
    try {
      if (typeof fetch === 'function') {
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const signal = controller ? controller.signal : undefined;
        const postTimeout = (cfg.POST_TIMEOUT && Number(cfg.POST_TIMEOUT)) ? Number(cfg.POST_TIMEOUT) : 10000;
        const timeoutId = controller ? setTimeout(() => controller.abort(), postTimeout) : null;

        const bodyParams = new URLSearchParams();
        bodyParams.append('action', action);
        bodyParams.append('apiKey', cfg.API_KEY);
        Object.keys(data || {}).forEach(k => {
          const v = data[k]; if (v !== undefined && v !== null) bodyParams.append(k, String(v));
        });

        try {
          const resp = await fetch(cfg.WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: bodyParams.toString(),
            credentials: 'omit',
            cache: 'no-store',
            signal
          });
          if (timeoutId) clearTimeout(timeoutId);
          if (resp && resp.ok) {
            try { const json = await resp.json(); if (json) return json; } catch (e) { /* fallthrough to JSONP */ }
          }
        } catch (postError) {
          if (timeoutId) clearTimeout(timeoutId);
          console.warn('postToGoogleSheets POST attempt failed, falling back to JSONP', postError);
        }
      }
    } catch (e) {
      console.warn('postToGoogleSheets POST probe errored, will use JSONP fallback', e);
    }

    return new Promise((resolve) => {
      try {
        let url = cfg.WEB_APP_URL;
        url += `?action=${encodeURIComponent(action)}`;
        url += `&apiKey=${encodeURIComponent(cfg.API_KEY)}`;
        url += `&t=${Date.now()}`; // Add timestamp to prevent caching

        const enhanced = { ...data };
        try { Object.keys(data || {}).forEach(k => { const v = data[k]; if (v === undefined || v === null) return; const keyStr = String(k); const dateRegex = /date|मिति|दर्ता/i; if (dateRegex.test(keyStr)) { try { if (typeof NVC.Utils !== 'undefined' && typeof NVC.Utils.latinToDevanagari === 'function') enhanced[k] = NVC.Utils.latinToDevanagari(String(v)); else enhanced[k] = String(v); enhanced[`${k}Iso`] = String(v); } catch (e) {} } }); } catch (e) {}

        Object.keys(enhanced).forEach(key => { const value = enhanced[key]; if (value !== undefined && value !== null) { url += `&${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`; } });
        const callbackName = `post_${action}_${Date.now()}`;
        url += `&callback=${callbackName}`;

        let isResolved = false; let didTimeout = false; let lateHandled = false;
        const timeout = setTimeout(() => {
          if (!isResolved) { didTimeout = true; isResolved = true; resolve({ success: false, message: 'Request timed out. Saved locally for later sync.', id: data.id, local: true, timeout: true }); }
        }, cfg.TIMEOUT || 60000);

        window[callbackName] = function(response) {
          if (lateHandled) return;
          if (didTimeout) { lateHandled = true; try { const isSuccess = response && (response.success === true || response.success === 'true'); if (isSuccess) { try { if (typeof NVC.UI !== 'undefined' && typeof NVC.UI.showToast === 'function') NVC.UI.showToast('✅ उजुरी Google Sheet मा सेभ भयो (ढिलो प्रतिक्रिया)', {bg:'#2e7d32'}); } catch (e) {} } } catch (e) {} finally { try { delete window[callbackName]; } catch(e){}; try { if (script && script.parentNode) script.parentNode.removeChild(script); } catch (e) {} } return; }
          if (isResolved) return; isResolved = true; clearTimeout(timeout); try { delete window[callbackName]; } catch (e) {};
          try { if (script && script.parentNode) script.parentNode.removeChild(script); } catch (e) {}
          let formatted = response || { success: false, message: 'No response from server', id: data.id, local: true };
          if (typeof formatted === 'string') { try { formatted = JSON.parse(formatted); } catch (e) { formatted = { success: false, message: formatted, id: data.id, local: true }; } }
          if (formatted.success === undefined) formatted.success = false;
          resolve(formatted);
        };

        const script = document.createElement('script'); script.src = url; script.async = true;
        script.onerror = function(error) {
          if (isResolved) return;
          (async () => {
            try {
              clearTimeout(timeout);
              const bodyParams = new URLSearchParams(); bodyParams.append('action', action); bodyParams.append('apiKey', cfg.API_KEY);
              Object.keys(enhanced || data).forEach(k => { const v = (enhanced && enhanced[k] !== undefined) ? enhanced[k] : data[k]; if (v !== undefined && v !== null) bodyParams.append(k, String(v)); });
              const resp = await fetch(cfg.WEB_APP_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: bodyParams.toString(), credentials: 'omit' });
              let json = null; try { json = await resp.json(); } catch (e) { json = null; }
              if (json && (json.success === true || json.success === 'true')) { isResolved = true; try { delete window[callbackName]; } catch (e) {} try { if (script && script.parentNode) script.parentNode.removeChild(script); } catch (e) {} resolve(json); return; }
            } catch (fetchError) {
              console.error('❌ Google Sheets Fallback Fetch Error:', fetchError);
            }
            if (isResolved) return; isResolved = true; clearTimeout(timeout); try { delete window[callbackName]; } catch (e) {} try { if (script && script.parentNode) script.parentNode.removeChild(script); } catch (e) {} resolve({ success: false, message: 'Network error - saved locally', id: data.id, local: true, error: String(error) });
          })();
        };

        document.head.appendChild(script);
      } catch (error) {
        resolve({ success: false, message: String(error), id: data.id, local: true });
      }
    });
  };

  // Analyze text using configured AI gateway (Gemini). Returns the parsed AI response or { success:false, error }
  NVC.Api.analyzeWithGemini = async function(text) {
    try {
      const aiUrl = (NVC.Config && NVC.Config.AI_GATEWAY_URL) ? NVC.Config.AI_GATEWAY_URL : '';
      if (!aiUrl) return { success: false, error: 'AI_GATEWAY_URL not configured' };

      const resp = await fetch(aiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        cache: 'no-store',
        credentials: 'omit'
      });

      if (!resp || (resp.status && resp.status >= 400)) {
        let txt = '';
        try { txt = await resp.text(); } catch(e){}
        return { success: false, error: `AI gateway error: ${resp.status || 'unknown'}`, raw: txt };
      }

      const data = await resp.json();
      if (!data) return { success: false, error: 'Empty response from AI gateway' };

      // Normalize response into a consistent shape:
      // { success: true, priority, classification, summary, sentiment, raw }
      const provider = (data && data.data) ? data.data : data;

      // Helper to extract main textual output from various provider shapes
      const extractText = (obj) => {
        if (!obj) return null;
        if (typeof obj === 'string') return obj;
        if (typeof obj.outputText === 'string') return obj.outputText;
        if (typeof obj.text === 'string') return obj.text;
        if (Array.isArray(obj.candidates) && obj.candidates.length) {
          const c = obj.candidates[0];
          if (typeof c === 'string') return c;
          if (typeof c.output === 'string') return c.output;
          if (c.content) {
            if (typeof c.content === 'string') return c.content;
            if (Array.isArray(c.content)) return c.content.map(i => (typeof i === 'string' ? i : (i.text || ''))).join(' ');
          }
          if (typeof c.text === 'string') return c.text;
        }
        if (Array.isArray(obj.outputs) && obj.outputs.length) {
          const o = obj.outputs[0];
          if (typeof o === 'string') return o;
          if (o.content) {
            if (typeof o.content === 'string') return o.content;
            if (Array.isArray(o.content)) return o.content.map(i => (typeof i === 'string' ? i : (i.text || ''))).join(' ');
          }
          if (typeof o.text === 'string') return o.text;
        }
        if (Array.isArray(obj.choices) && obj.choices.length) {
          const ch = obj.choices[0];
          if (typeof ch === 'string') return ch;
          if (ch.text) return ch.text;
          if (ch.message && (ch.message.content || ch.message)) return (ch.message.content || ch.message);
        }
        // Try common nested fields
        if (obj.result && typeof obj.result === 'string') return obj.result;
        if (obj.generated_text && typeof obj.generated_text === 'string') return obj.generated_text;
        return null;
      };

      const textOut = extractText(provider) || extractText(data) || '';

      // Try parse JSON body from textual output (some prompts ask model to return JSON)
      let parsed = null;
      try { parsed = textOut && textOut.trim().startsWith('{') ? JSON.parse(textOut) : null; } catch(e) { parsed = null; }

      const result = { success: true, raw: data };

      if (parsed && typeof parsed === 'object') {
        result.priority = parsed.priority || parsed.severity || parsed.level || parsed.importance || null;
        result.classification = parsed.classification || parsed.category || parsed.type || null;
        result.summary = parsed.summary || parsed.excerpt || parsed.description || null;
        result.sentiment = parsed.sentiment || parsed.tone || null;
        result.parsed = parsed;
        return result;
      }

      // Heuristic extraction if no structured JSON returned
      const summary = textOut ? (String(textOut).trim().slice(0, 1000)) : '';

      // Determine priority by keyword heuristics
      const ptxt = (summary || '').toLowerCase();
      let priority = 'न्यून';
      if (/(उच्च|high|critical|urgent|गम्भीर|severe|immediate)/i.test(ptxt)) priority = 'उच्च';
      else if (/(मध्यम|medium|moderate|delay|problem)/i.test(ptxt)) priority = 'मध्यम';

      // Try to infer classification from keywords
      let classification = null;
      if (/(भ्रष्ट|corrupt|bribe|घुस)/i.test(ptxt)) classification = 'भ्रष्टाचार';
      else if (/(खरिद|ठेक्का|procure|tender|bidding|contract)/i.test(ptxt)) classification = 'सार्वजनिक खरिद/ठेक्का';
      else if (/(सडक|भवन|निर्माण|infrastructure|road|bridge)/i.test(ptxt)) classification = 'पूर्वाधार निर्माण';

      result.priority = priority;
      result.classification = classification || 'अन्य';
      result.summary = summary || null;
      result.sentiment = null;

      return result;
    } catch (e) {
      return { success: false, error: String(e) };
    }
  };

  // loadDataFromGoogleSheets: delegate to NVC.Api.getFromGoogleSheets multiple calls and format
  NVC.Api.loadDataFromGoogleSheets = async function(forceReload = false) {
    if (window._isLoadingData && !forceReload) return window._lastLoadResult || false;
    if (!cfg || !cfg.ENABLED) return false;
    window._isLoadingData = true;
    try {
      const response = await NVC.Api.getFromGoogleSheets('getComplaints');
      if (!response || response.success === false) { window._lastLoadResult = false; return false; }
      const complaintsData = Array.isArray(response.data) ? response.data : [];
      const formattedComplaints = (complaintsData || []).map(item => { try { if (typeof formatComplaintFromSheet === 'function') return formatComplaintFromSheet(item); return item; } catch (e) { return null; } }).filter(Boolean);
      NVC.State.set('complaints', formattedComplaints);

      // Also attempt to load technical projects (प्राविधिक परीक्षण/आयोजना अनुगमन) from Sheets
      try {
        const projRes = await NVC.Api.getFromGoogleSheets('getProjects');
        if (projRes && projRes.success !== false) {
          const projectsData = Array.isArray(projRes.data) ? projRes.data : [];
          const formattedProjects = (projectsData || []).map(item => { try { if (typeof formatProjectFromSheet === 'function') return formatProjectFromSheet(item); return item; } catch (e) { return null; } }).filter(Boolean);
          NVC.State.set('projects', formattedProjects);
        }
      } catch (e) {
        console.warn('Projects load failed', e);
      }

      // Load Technical Inspectors
      try {
        const inspectorRes = await NVC.Api.getFromGoogleSheets('getTechnicalInspectors');
        if (inspectorRes && inspectorRes.success !== false) {
          const inspectorData = Array.isArray(inspectorRes.data) ? inspectorRes.data : [];
          const formattedInspectors = (inspectorData || []).map(item => { try { if (typeof formatTechnicalInspectorFromSheet === 'function') return formatTechnicalInspectorFromSheet(item); return item; } catch (e) { return null; } }).filter(Boolean);
          NVC.State.set('technicalInspectors', formattedInspectors);
        }
      } catch (e) {
        console.warn('Technical Inspectors load failed', e);
      }
      
      // Load Employee Monitoring
      try {
        const empRes = await NVC.Api.getFromGoogleSheets('getEmployeeMonitoring');
        if (empRes && empRes.success !== false) {
          const empData = Array.isArray(empRes.data) ? empRes.data : [];
          const formatted = (empData || []).map(item => { try { if (typeof formatEmployeeMonitoringFromSheet === 'function') return formatEmployeeMonitoringFromSheet(item); return item; } catch (e) { return null; } }).filter(Boolean);
          if (NVC.State && typeof NVC.State.set === 'function') NVC.State.set('employeeMonitoring', formatted);
        }
      } catch(e) { console.warn('Employee Monitoring load failed', e); }

      // Load Citizen Charter
      try {
        const ccRes = await NVC.Api.getFromGoogleSheets('getCitizenCharter');
        if (ccRes && ccRes.success !== false) {
          const ccData = Array.isArray(ccRes.data) ? ccRes.data : [];
          const formatted = (ccData || []).map(item => { try { if (typeof formatCitizenCharterFromSheet === 'function') return formatCitizenCharterFromSheet(item); return item; } catch (e) { return null; } }).filter(Boolean);
          if (NVC.State && typeof NVC.State.set === 'function') NVC.State.set('citizenCharters', formatted);
        }
      } catch(e) { console.warn('Citizen Charter load failed', e); }

      // Load Investigations
      try {
        const invRes = await NVC.Api.getFromGoogleSheets('getInvestigations');
        if (invRes && invRes.success !== false) {
          const invData = Array.isArray(invRes.data) ? invRes.data : [];
          const formatted = (invData || []).map(item => { try { if (typeof formatInvestigationFromSheet === 'function') return formatInvestigationFromSheet(item); return item; } catch (e) { return null; } }).filter(Boolean);
          if (NVC.State && typeof NVC.State.set === 'function') NVC.State.set('investigations', formatted);
        }
      } catch(e) { console.warn('Investigations load failed', e); }

      // Load Technical Examiners
      try {
        const examRes = await NVC.Api.getFromGoogleSheets('getTechnicalExaminers');
        if (examRes && examRes.success !== false) {
          const examData = Array.isArray(examRes.data) ? examRes.data : [];
          const formatted = (examData || []).map(item => { try { if (typeof formatTechnicalExaminerFromSheet === 'function') return formatTechnicalExaminerFromSheet(item); return item; } catch (e) { return null; } }).filter(Boolean);
          if (NVC.State && typeof NVC.State.set === 'function') NVC.State.set('technicalExaminers', formatted);
        }
      } catch(e) { console.warn('Technical Examiners load failed', e); }

      window._lastLoadResult = true;
      return true;
    } catch (e) { console.error('Sheets load failed', e); window._lastLoadResult = false; return false; }
    finally { window._isLoadingData = false; }
  };

  // Save a complaint (migrated from script.js)
  NVC.Api.saveComplaintToGoogleSheets = async function(complaintData) {
    const stateObj = window.state || (NVC.State && NVC.State.state) || {};
    if (!cfg || !cfg.ENABLED || stateObj.useLocalData || complaintData?.useLocal) {
      const newComplaint = {
        id: complaintData.id || (typeof generateComplaintId === 'function' ? generateComplaintId() : `local_${Date.now()}`),
        date: complaintData.date || (typeof getCurrentNepaliDate === 'function' ? getCurrentNepaliDate() : ''),
        complainant: complaintData.complainant || '',
        accused: complaintData.accused || '',
        description: complaintData.description || '',
        shakha: complaintData.shakha || stateObj.currentUser?.shakha || '',
        mahashakha: complaintData.mahashakha || '',
        status: complaintData.status || 'pending',
        proposedDecision: complaintData.proposedDecision || '',
        decision: complaintData.decision || '',
        finalDecision: (typeof normalizeFinalDecisionType === 'function') ? normalizeFinalDecisionType(complaintData.finalDecision || '') : (complaintData.finalDecision || ''),
        remarks: complaintData.remarks || '',
        source: complaintData.source || 'internal',
        createdBy: stateObj.currentUser?.name || '',
        createdAt: new Date().toISOString()
      };
      try {
        if (NVC.State && typeof NVC.State.push === 'function') NVC.State.push('complaints', newComplaint);
        else {
          stateObj.complaints = stateObj.complaints || [];
          stateObj.complaints.unshift(newComplaint);
        }
      } catch (e) {}
      return { success: true, message: 'Complaint saved locally', id: newComplaint.id };
    }

    try {
      const payload = {
        id: complaintData.id, date: complaintData.date,
        complainant: complaintData.complainant, accused: complaintData.accused,
        description: complaintData.description,
        shakha: complaintData.shakha || stateObj.currentUser?.shakha,
        mahashakha: complaintData.mahashakha,
        status: complaintData.status || 'pending',
        proposedDecision: complaintData.proposedDecision,
        finalDecision: (typeof normalizeFinalDecisionType === 'function') ? normalizeFinalDecisionType(complaintData.finalDecision || '') : (complaintData.finalDecision || ''),
        remarks: complaintData.remarks,
        source: complaintData.source || 'internal',
        createdBy: stateObj.currentUser?.name
      };
      const result = await NVC.Api.postToGoogleSheets('saveComplaint', payload);

      if (result && result.success) {
        const newComplaint = {
          id: result.id || complaintData.id, date: complaintData.date,
          complainant: complaintData.complainant, accused: complaintData.accused,
          description: complaintData.description,
          shakha: complaintData.shakha || stateObj.currentUser?.shakha,
          mahashakha: complaintData.mahashakha,
          status: complaintData.status || 'pending',
          proposedDecision: complaintData.proposedDecision,
          decision: complaintData.decision,
          finalDecision: (typeof normalizeFinalDecisionType === 'function') ? normalizeFinalDecisionType(complaintData.finalDecision || '') : (complaintData.finalDecision || ''),
          remarks: complaintData.remarks,
          source: complaintData.source || 'internal'
        };
        try {
          if (NVC.State && typeof NVC.State.push === 'function') NVC.State.push('complaints', newComplaint);
          else {
            stateObj.complaints = stateObj.complaints || [];
            stateObj.complaints.unshift(newComplaint);
          }
        } catch(e){}
        return result;
      }

      if (!result || result.success !== true) {
        console.warn('Google Sheets complaint save failed, falling back to local storage', result);
        return NVC.Api.saveComplaintToGoogleSheets({ ...complaintData, useLocal: true });
      }

      return result;
    } catch (error) {
      console.error('Error saving complaint:', error);
      return NVC.Api.saveComplaintToGoogleSheets({ ...complaintData, useLocal: true });
    }
  };

  NVC.Api.updateComplaintInGoogleSheets = async function(complaintId, updateData) {
    const stateObj = window.state || (NVC.State && NVC.State.state) || {};
    if (!cfg || !cfg.ENABLED || stateObj.useLocalData) {
      const index = (stateObj.complaints || []).findIndex(c => c.id === complaintId);
      if (index !== -1) {
        try {
          if (NVC.State && typeof NVC.State.set === 'function') {
            const arr = stateObj.complaints.slice(); arr[index] = { ...arr[index], ...updateData }; NVC.State.set('complaints', arr);
          } else {
            stateObj.complaints[index] = { ...stateObj.complaints[index], ...updateData };
          }
        } catch(e){}
        return { success: true, message: 'Complaint updated locally' };
      }
      return { success: false, message: 'Complaint not found' };
    }

    try {
      const payload = {
        id: complaintId, status: updateData.status,
        finalDecision: (typeof normalizeFinalDecisionType === 'function') ? normalizeFinalDecisionType(updateData.finalDecision || '') : (updateData.finalDecision || ''),
        remarks: updateData.remarks,
        updatedBy: stateObj.currentUser?.name
      };
      const result = await NVC.Api.postToGoogleSheets('updateComplaint', payload);
      if (result && result.success) {
        const index = (stateObj.complaints || []).findIndex(c => c.id === complaintId);
        if (index !== -1) {
          try {
            if (NVC.State && typeof NVC.State.set === 'function') {
              const arr = stateObj.complaints.slice(); arr[index] = { ...arr[index], ...updateData }; NVC.State.set('complaints', arr);
            } else {
              stateObj.complaints[index] = { ...stateObj.complaints[index], ...updateData };
            }
          } catch(e){}
        }
      }
      return result;
    } catch (error) {
      console.error('updateComplaintInGoogleSheets failed', error);
      return { success: false, message: String(error) };
    }
  };

  // Notice Management Functions
  NVC.Api.saveNoticeToGoogleSheets = async function(noticeData) {
    const stateObj = window.state || (NVC.State && NVC.State.state) || {};
    if (!cfg || !cfg.ENABLED || stateObj.useLocalData || noticeData?.useLocal) {
      const newNotice = {
        id: noticeData.id || `notice_${Date.now()}`,
        title: noticeData.title || '',
        description: noticeData.description || '',
        status: noticeData.status || 'active',
        publishDate: noticeData.publishDate || new Date().toISOString().split('T')[0],
        uploadedBy: stateObj.currentUser?.name || 'admin_planning',
        createdAt: new Date().toISOString()
      };
      
      try {
        if (NVC.State && typeof NVC.State.push === 'function') {
          NVC.State.push('notices', newNotice);
        } else {
          stateObj.notices = stateObj.notices || [];
          stateObj.notices.unshift(newNotice);
        }
      } catch (e) {}
      return { success: true, message: 'Notice saved locally', id: newNotice.id };
    }

    try {
      const payload = {
        id: noticeData.id,
        title: noticeData.title,
        description: noticeData.description,
        status: noticeData.status || 'active',
        publishDate: noticeData.publishDate,
        uploadedBy: stateObj.currentUser?.name
      };
      
      const result = await NVC.Api.postToGoogleSheets('saveNotice', payload);
      
      if (result && result.success) {
        const newNotice = {
          id: result.id || noticeData.id,
          title: noticeData.title,
          description: noticeData.description,
          status: noticeData.status || 'active',
          publishDate: noticeData.publishDate,
          uploadedBy: stateObj.currentUser?.name
        };
        
        try {
          if (NVC.State && typeof NVC.State.push === 'function') {
            NVC.State.push('notices', newNotice);
          } else {
            stateObj.notices = stateObj.notices || [];
            stateObj.notices.unshift(newNotice);
          }
        } catch(e) {}
        return result;
      }

      if (!result || result.success !== true) {
        console.warn('Google Sheets notice save failed, falling back to local data', result);
        return NVC.Api.saveNoticeToGoogleSheets({ ...noticeData, useLocal: true });
      }

      return result;
    } catch (error) {
      console.error('Error saving notice:', error);
      return NVC.Api.saveNoticeToGoogleSheets({ ...noticeData, useLocal: true });
    }
  };

  NVC.Api.getNoticesFromGoogleSheets = async function() {
    if (!cfg || !cfg.ENABLED) {
      const stateObj = window.state || (NVC.State && NVC.State.state) || {};
      return { success: true, data: stateObj.notices || [] };
    }

    try {
      const response = await NVC.Api.getFromGoogleSheets('getNotices');
      if (response && response.success && response.data) {
        const stateObj = window.state || (NVC.State && NVC.State.state) || {};
        stateObj.notices = response.data;
        return response;
      }
      return { success: false, data: [], message: 'No notices found' };
    } catch (error) {
      console.error('Error loading notices:', error);
      return { success: false, data: [], message: String(error) };
    }
  };

  NVC.Api.getActiveNoticesFromGoogleSheets = async function() {
    if (!cfg || !cfg.ENABLED) {
      const stateObj = window.state || (NVC.State && NVC.State.state) || {};
      const activeNotices = (stateObj.notices || []).filter(n => n.status === 'active');
      return { success: true, data: activeNotices };
    }

    try {
      const response = await NVC.Api.getFromGoogleSheets('getActiveNotices');
      if (response && response.success && response.data) {
        return response;
      }
      return { success: false, data: [], message: 'No active notices found' };
    } catch (error) {
      console.error('Error loading active notices:', error);
      return { success: false, data: [], message: String(error) };
    }
  };

  NVC.Api.updateNoticeInGoogleSheets = async function(noticeId, updateData) {
    const stateObj = window.state || (NVC.State && NVC.State.state) || {};
    if (!cfg || !cfg.ENABLED || stateObj.useLocalData) {
      const index = (stateObj.notices || []).findIndex(n => n.id === noticeId);
      if (index !== -1) {
        try {
          if (NVC.State && typeof NVC.State.set === 'function') {
            const arr = stateObj.notices.slice(); arr[index] = { ...arr[index], ...updateData }; NVC.State.set('notices', arr);
          } else {
            stateObj.notices[index] = { ...stateObj.notices[index], ...updateData };
          }
        } catch(e){}
        return { success: true, message: 'Notice updated locally' };
      }
      return { success: false, message: 'Notice not found' };
    }

    try {
      const payload = {
        id: noticeId,
        status: updateData.status,
        updatedBy: stateObj.currentUser?.name
      };
      
      const result = await NVC.Api.postToGoogleSheets('updateNotice', payload);
      if (result && result.success) {
        const index = (stateObj.notices || []).findIndex(n => n.id === noticeId);
        if (index !== -1) {
          try {
            if (NVC.State && typeof NVC.State.set === 'function') {
              const arr = stateObj.notices.slice(); arr[index] = { ...arr[index], ...updateData }; NVC.State.set('notices', arr);
            } else {
              stateObj.notices[index] = { ...stateObj.notices[index], ...updateData };
            }
          } catch(e){}
        }
      }
      return result;
    } catch (error) {
      console.error('updateNoticeInGoogleSheets failed', error);
      return { success: false, message: String(error) };
    }
  };

  NVC.Api.deleteNoticeFromGoogleSheets = async function(noticeId) {
    const stateObj = window.state || (NVC.State && NVC.State.state) || {};
    if (!cfg || !cfg.ENABLED || stateObj.useLocalData) {
      const index = (stateObj.notices || []).findIndex(n => n.id === noticeId);
      if (index !== -1) {
        try {
          if (NVC.State && typeof NVC.State.set === 'function') {
            const arr = stateObj.notices.slice(); arr.splice(index, 1); NVC.State.set('notices', arr);
          } else {
            stateObj.notices.splice(index, 1);
          }
        } catch(e){}
        return { success: true, message: 'Notice deleted locally' };
      }
      return { success: false, message: 'Notice not found' };
    }

    try {
      const payload = {
        id: noticeId,
        deletedBy: stateObj.currentUser?.name
      };
      
      const result = await NVC.Api.postToGoogleSheets('deleteNotice', payload);
      if (result && result.success) {
        const index = (stateObj.notices || []).findIndex(n => n.id === noticeId);
        if (index !== -1) {
          try {
            if (NVC.State && typeof NVC.State.set === 'function') {
              const arr = stateObj.notices.slice(); arr.splice(index, 1); NVC.State.set('notices', arr);
            } else {
              stateObj.notices.splice(index, 1);
            }
          } catch(e){}
        }
      }
      return result;
    } catch (error) {
      console.error('deleteNoticeFromGoogleSheets failed', error);
      return { success: false, message: String(error) };
    }
  };

  // ==================== LABORATORY TESTING API FUNCTIONS ====================

  // Save laboratory test data
  NVC.Api.saveLaboratoryTestToGoogleSheets = async function(testData) {
    const stateObj = window.state || (NVC.State && NVC.State.state) || {};
    if (!cfg || !cfg.ENABLED || stateObj.useLocalData || testData?.useLocal) {
      const newTest = {
        id: testData.id || `LAB_${Date.now()}`,
        sampleNumber: testData.sampleNumber || '',
        sampleReceivedDate: testData.sampleReceivedDate || '',
        testRequester: testData.testRequester || '',
        organizationName: testData.organizationName || '',
        ministry: testData.ministry || '',
        testMaterial: testData.testMaterial || '',
        testDate: testData.testDate || '',
        testMethod: testData.testMethod || '',
        testEquipment: testData.testEquipment || '',
        testResult: testData.testResult || '',
        remarks: testData.remarks || '',
        createdBy: stateObj.currentUser?.name || '',
        createdAt: new Date().toISOString()
      };
      
      try {
        if (NVC.State && typeof NVC.State.push === 'function') {
          NVC.State.push('laboratoryTests', newTest);
        } else {
          stateObj.laboratoryTests = stateObj.laboratoryTests || [];
          stateObj.laboratoryTests.unshift(newTest);
        }
      } catch (e) {}
      return { success: true, message: 'Laboratory test saved locally', id: newTest.id };
    }

    try {
      const payload = {
        id: testData.id,
        sampleNumber: testData.sampleNumber,
        sampleReceivedDate: testData.sampleReceivedDate,
        testRequester: testData.testRequester,
        organizationName: testData.organizationName,
        ministry: testData.ministry,
        testMaterial: testData.testMaterial,
        testDate: testData.testDate,
        testMethod: testData.testMethod,
        testEquipment: testData.testEquipment,
        testResult: testData.testResult,
        remarks: testData.remarks,
        createdBy: stateObj.currentUser?.name
      };
      
      const result = await NVC.Api.postToGoogleSheets('saveLaboratoryTest', payload);

      if (result && result.success) {
        const newTest = {
          id: result.id || testData.id,
          sampleNumber: testData.sampleNumber,
          sampleReceivedDate: testData.sampleReceivedDate,
          testRequester: testData.testRequester,
          organizationName: testData.organizationName,
          ministry: testData.ministry,
          testMaterial: testData.testMaterial,
          testDate: testData.testDate,
          testMethod: testData.testMethod,
          testEquipment: testData.testEquipment,
          testResult: testData.testResult,
          remarks: testData.remarks
        };
        
        try {
          if (NVC.State && typeof NVC.State.push === 'function') {
            NVC.State.push('laboratoryTests', newTest);
          } else {
            stateObj.laboratoryTests = stateObj.laboratoryTests || [];
            stateObj.laboratoryTests.unshift(newTest);
          }
        } catch(e) {}
        return result;
      }

      if (!result || result.success !== true) {
        console.warn('Google Sheets laboratory test save failed, falling back to local storage', result);
        return NVC.Api.saveLaboratoryTestToGoogleSheets({ ...testData, useLocal: true });
      }

      return result;
    } catch (error) {
      console.error('Error saving laboratory test:', error);
      return NVC.Api.saveLaboratoryTestToGoogleSheets({ ...testData, useLocal: true });
    }
  };

  // Get laboratory tests from Google Sheets
  NVC.Api.getLaboratoryTestsFromGoogleSheets = async function() {
    if (!cfg || !cfg.ENABLED) {
      const stateObj = window.state || (NVC.State && NVC.State.state) || {};
      return { success: true, data: stateObj.laboratoryTests || [] };
    }

    try {
      const response = await NVC.Api.getFromGoogleSheets('getLaboratoryTests');
      if (response && response.success && response.data) {
        const stateObj = window.state || (NVC.State && NVC.State.state) || {};
        stateObj.laboratoryTests = response.data;
        return response;
      }
      return { success: false, data: [], message: 'No laboratory tests found' };
    } catch (error) {
      console.error('Error loading laboratory tests:', error);
      return { success: false, data: [], message: String(error) };
    }
  };

  // Update laboratory test in Google Sheets
  NVC.Api.updateLaboratoryTestInGoogleSheets = async function(testId, updateData) {
    const stateObj = window.state || (NVC.State && NVC.State.state) || {};
    if (!cfg || !cfg.ENABLED || stateObj.useLocalData) {
      const index = (stateObj.laboratoryTests || []).findIndex(t => t.id === testId);
      if (index !== -1) {
        try {
          if (NVC.State && typeof NVC.State.set === 'function') {
            const arr = stateObj.laboratoryTests.slice(); 
            arr[index] = { ...arr[index], ...updateData }; 
            NVC.State.set('laboratoryTests', arr);
          } else {
            stateObj.laboratoryTests[index] = { ...stateObj.laboratoryTests[index], ...updateData };
          }
        } catch(e) {}
        return { success: true, message: 'Laboratory test updated locally' };
      }
      return { success: false, message: 'Laboratory test not found' };
    }

    try {
      const payload = {
        id: testId,
        sampleNumber: updateData.sampleNumber,
        sampleReceivedDate: updateData.sampleReceivedDate,
        testRequester: updateData.testRequester,
        organizationName: updateData.organizationName,
        ministry: updateData.ministry,
        testMaterial: updateData.testMaterial,
        testDate: updateData.testDate,
        testMethod: updateData.testMethod,
        testEquipment: updateData.testEquipment,
        testResult: updateData.testResult,
        remarks: updateData.remarks,
        updatedBy: stateObj.currentUser?.name
      };
      
      const result = await NVC.Api.postToGoogleSheets('updateLaboratoryTest', payload);
      if (result && result.success) {
        const index = (stateObj.laboratoryTests || []).findIndex(t => t.id === testId);
        if (index !== -1) {
          try {
            if (NVC.State && typeof NVC.State.set === 'function') {
              const arr = stateObj.laboratoryTests.slice(); 
              arr[index] = { ...arr[index], ...updateData }; 
              NVC.State.set('laboratoryTests', arr);
            } else {
              stateObj.laboratoryTests[index] = { ...stateObj.laboratoryTests[index], ...updateData };
            }
          } catch(e) {}
        }
      }
      return result;
    } catch (error) {
      console.error('updateLaboratoryTestInGoogleSheets failed', error);
      return { success: false, message: String(error) };
    }
  };

  // Delete laboratory test from Google Sheets
  NVC.Api.deleteLaboratoryTestFromGoogleSheets = async function(testId) {
    const stateObj = window.state || (NVC.State && NVC.State.state) || {};
    if (!cfg || !cfg.ENABLED || stateObj.useLocalData) {
      const index = (stateObj.laboratoryTests || []).findIndex(t => t.id === testId);
      if (index !== -1) {
        try {
          if (NVC.State && typeof NVC.State.set === 'function') {
            const arr = stateObj.laboratoryTests.slice(); 
            arr.splice(index, 1); 
            NVC.State.set('laboratoryTests', arr);
          } else {
            stateObj.laboratoryTests.splice(index, 1);
          }
        } catch(e) {}
        return { success: true, message: 'Laboratory test deleted locally' };
      }
      return { success: false, message: 'Laboratory test not found' };
    }

    try {
      const payload = {
        id: testId,
        deletedBy: stateObj.currentUser?.name
      };
      
      const result = await NVC.Api.postToGoogleSheets('deleteLaboratoryTest', payload);
      if (result && result.success) {
        const index = (stateObj.laboratoryTests || []).findIndex(t => t.id === testId);
        if (index !== -1) {
          try {
            if (NVC.State && typeof NVC.State.set === 'function') {
              const arr = stateObj.laboratoryTests.slice(); 
              arr.splice(index, 1); 
              NVC.State.set('laboratoryTests', arr);
            } else {
              stateObj.laboratoryTests.splice(index, 1);
            }
          } catch(e) {}
        }
      }
      return result;
    } catch (error) {
      console.error('deleteLaboratoryTestFromGoogleSheets failed', error);
      return { success: false, message: String(error) };
    }
  };

})();
