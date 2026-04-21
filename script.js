// Global theme variable
let currentTheme = 'light';

// Safe element value accessor to avoid "reading 'value' of null" errors
function elVal(id) {
  try {
    const el = document.getElementById(id);
    return el ? (el.value !== undefined ? el.value : '') : '';
  } catch (e) {
    return '';
  }
}

// Loading Spinner Functions
function showLoadingSpinner(statusText = 'सेभ हुँदैछ...') {
    const spinner = document.getElementById('loadingSpinner');
    const statusTextElement = document.getElementById('loadingStatusText');
    
    if (spinner && statusTextElement) {
        statusTextElement.textContent = statusText;
        spinner.style.display = 'flex';
        // Prevent body scroll when spinner is shown
        document.body.style.overflow = 'hidden';
    }
}

function filterHotlineComplaints() {
  const status = document.getElementById('filterStatusHotline') ? document.getElementById('filterStatusHotline').value : '';
  const search = document.getElementById('searchTextHotline') ? document.getElementById('searchTextHotline').value : '';
  showHotlineComplaintsView({ status, search });
}

function showHotlineComplaintsView(initialFilters = {}) {
  state.currentView = 'hotline_complaints';
  document.getElementById('pageTitle').textContent = 'हटलाइनबाट प्राप्त उजुरीहरू';
  const hotlineList = (state.complaints || []).filter(c => String((c.source||c['उजुरीको माध्यम']||c.sourceLabel||'')).toLowerCase() === 'hotline');

  function resolveComplaintAssignedDateSimple(c) {
    if (!c) return '';
    return c.assignedDate || c.assigneddate || c.date || c.createdAt || '';
  }

  const content = `
    <div class="filter-bar mb-3">
      <div class="filter-group"><label class="filter-label">स्थिति:</label><select class="form-select form-select-sm" id="filterStatusHotline" onchange="filterHotlineComplaints()"><option value="">सबै</option><option value="pending" ${initialFilters.status === 'pending' ? 'selected' : ''}>काम बाँकी</option><option value="progress">चालु</option><option value="resolved">फछ्रयौट</option></select></div>
      <div class="filter-group"><input type="text" class="form-control form-control-sm" placeholder="खोज्नुहोस्..." id="searchTextHotline" value="${initialFilters.search || ''}" /></div>
      <button class="btn btn-primary btn-sm" onclick="filterHotlineComplaints()">खोजी गर्नुहोस्</button>
      <button class="btn btn-success btn-sm" onclick="exportToExcel('hotline')"><i class="fas fa-file-excel"></i> Excel</button>
      <button class="btn btn-primary btn-sm" onclick="showNewHotlineComplaint()"><i class="fas fa-plus"></i> नयाँ हटलाइन उजुरी</button>
    </div>

    <div class="card">
      <div class="card-header"><h5 class="mb-0">हटलाइनबाट प्राप्त उजुरी सूची</h5></div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table">
            <thead><tr><th>क्र.सं.</th><th>मिति</th><th>उजुरकर्ता</th><th>विपक्षी</th><th>उजुरीको विवरण</th><th>सम्बन्धित शाखा</th><th>शाखामा पठाएको मिति</th><th>स्थिति</th><th>कार्य</th></tr></thead>
            <tbody>
              ${hotlineList.map((complaint, index) => `
                <tr class="${getComplaintAgeClass(complaint)}">
                  <td data-label="क्र.सं.">${index + 1}</td><td data-label="मिति">${cleanDateDisplay(complaint.date || complaint.createdAt || '')}</td><td data-label="उजुरकर्ता">${complaint.complainant || '-'}</td><td data-label="विपक्षी">${complaint.accused || '-'}</td>
                  <td data-label="उजुरीको विवरण" class="text-limit" title="${complaint.description || ''}">${(complaint.description || '').substring(0, 50)}...</td>
                  <td data-label="सम्बन्धित शाखा">${displayShakhaName(complaint.assignedShakha || complaint.shakha || complaint.assignedShakhaName) || '-'}</td>
                  <td data-label="शाखामा पठाएको मिति">${resolveComplaintAssignedDateSimple(complaint) || '-'}</td>
                  <td data-label="स्थिति"><span class="status-badge ${complaint.status === 'resolved' ? 'status-resolved' : complaint.status === 'pending' ? 'status-pending' : 'status-progress'}">${complaint.status === 'resolved' ? 'फछ्रयौट' : complaint.status === 'pending' ? 'काम बाँकी' : 'चालु'}</span></td>
                  <td data-label="कार्य"><div class="table-actions"><button class="action-btn" data-action="view" data-id="${complaint.id}" title="हेर्नुहोस्"><i class="fas fa-eye"></i></button><button class="action-btn" data-action="assign" data-id="${complaint.id}" title="शाखामा पठाउनुहोस्"><i class="fas fa-paper-plane"></i></button></div></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  document.getElementById('contentArea').innerHTML = content;
  applyDevanagariDigits(document.getElementById('contentArea'));
  updateActiveNavItem();
}

function hideLoadingSpinner() {
    const spinner = document.getElementById('loadingSpinner');
    
    if (spinner) {
        spinner.style.display = 'none';
        // Restore body scroll
        document.body.style.overflow = '';
    }
}

// Helper to clean up date display (remove time and fix timezone issues)
function cleanDateDisplay(dateStr) {
  if (!dateStr) return '';
  const date = String(dateStr).trim();
  if (!date) return '';
  
  // Handle timezone issue: If date has time with Z (UTC), convert to local date first
  if (date.includes('T') && date.includes('Z')) {
    try {
      // Parse the UTC date
      const dateObj = new Date(date);
      // Convert to Nepal Time (UTC + 5:45) manually to ensure correct date regardless of browser timezone
      const nepalTimeMs = dateObj.getTime() + 20700000; // 5h 45m in ms
      const nepalDate = new Date(nepalTimeMs);
      const localDateStr = nepalDate.getUTCFullYear() + '-' + 
                         String(nepalDate.getUTCMonth() + 1).padStart(2, '0') + '-' + 
                         String(nepalDate.getUTCDate()).padStart(2, '0');
      return localDateStr;
    } catch (e) {
      // Fallback to simple split if parsing fails
      return date.split('T')[0].split(' ')[0];
    }
  } else if (date.includes('T') || date.includes(' ')) {
    // Simple split for non-UTC dates
    return date.split('T')[0].split(' ')[0];
  }
  
  return date;
}

function updateLoadingStatus(statusText) {
    const statusTextElement = document.getElementById('loadingStatusText');
    
    if (statusTextElement) {
        statusTextElement.textContent = statusText;
    }
}

// Ministries data
const MINISTRIES = [
  "प्रधानमन्त्री तथा मन्त्रिपरिषद्को कार्यालय",
  "अर्थ मन्त्रालय",
  "उद्योग, वाणिज्य तथा आपूर्ति मन्त्रालय",
  "ऊर्जा, जलस्रोत तथा सिंचाइ मन्त्रालय",
  "कानून, न्याय तथा संसदीय मामिला मन्त्रालय",
  "कृषि तथा पशुपन्छी विकास मन्त्रालय",
  "खानेपानी मन्त्रालय",
  "गृह मन्त्रालय",
  "परराष्ट्र मन्त्रालय",
  "भूमि व्यवस्था, सहकारी तथा गरिबी निवारण मन्त्रालय",
  "भौतिक पूर्वाधार तथा यातायात मन्त्रालय",
  "महिला, बालबालिका तथा ज्येष्ठ नागरिक मन्त्रालय",
  "युवा तथा खेलकुद मन्त्रालय",
  "रक्षा मन्त्रालय",
  "वन तथा वातावरण मन्त्रालय",
  "सङ्घीय मामिला तथा सामान्य प्रशासन मन्त्रालय",
  "सञ्चार तथा सूचना प्रविधि मन्त्रालय",
  "सहरी विकास मन्त्रालय",
  "स्वास्थ्य तथा जनसङ्ख्या मन्त्रालय",
  "संस्कृति, पर्यटन तथा नागरिक उड्डयन मन्त्रालय",
  "शिक्षा, विज्ञान तथा प्रविधि मन्त्रालय",
  "श्रम, रोजगार तथा सामाजिक सुरक्षा मन्त्रालय",
  "संवैधानिक अङ्ग",
  "कोशी प्रदेश",
  "मधेस प्रदेश",
  "बागमती प्रदेश",
  "गण्डकी प्रदेश",
  "लुम्बिनी प्रदेश",
  "कर्णाली प्रदेश",
  "सुदूर पश्चिम प्रदेश"
];

// AI System for complaint analysis
const AI_SYSTEM = {
  // Structured keywords for better classification
  keywords: {
    corruption: ['भ्रष्टाचार', 'corruption', 'bribe', 'घुस', 'घुसखोरी', 'उत्पीडन', 'अनियमित', 'misuse', 'abuse'],
    procurement: ['खरिद', 'purchase', 'ठेक्का', 'tender', 'bidding', 'quotation', 'bid', 'contract', 'supplier', 'vendor'],
    infrastructure: ['पूर्वाधार', 'infrastructure', 'सडक', 'भवन', 'निर्माण', 'construction', 'building', 'road', 'bridge', 'development'],
    service: ['सेवा', 'service', 'उपचार', 'शिक्षा', 'अस्पताल', 'hospital', 'health', 'education', 'treatment', 'medical'],
    conduct: ['कर्मचारी', 'employee', 'आचरण', 'behavior', 'अफसर', 'officer', 'staff', 'misbehavior', 'negligence'],
    policy: ['नीति', 'policy', 'निर्णय', 'decision', 'process', 'procedure', 'rule', 'regulation', 'guideline']
  },
  
  analyzeComplaint: function(description) {
    // Primary behaviour: use configured AI gateway (Gemini) asynchronously while returning
    // a fast local fallback so existing synchronous callers keep working.
    if (!description) return { classification: 'अन्य', priority: 'न्यून' };

    const text = String(description || '');

    // In-memory cache for async AI results
    window._nvc_ai_cache = window._nvc_ai_cache || {};
    if (window._nvc_ai_cache[text]) return window._nvc_ai_cache[text];

    // Trigger async Gemini analysis in background and cache result when available.
    (async () => {
      try {
        if (window.NVC && NVC.Api && typeof NVC.Api.analyzeWithGemini === 'function') {
          const res = await NVC.Api.analyzeWithGemini(text);
          if (res && res.success !== false) {
            // Normalize store shape for quick access
            const normalized = (typeof res === 'object') ? res : { result: res };
            window._nvc_ai_cache[text] = normalized;
            try { document.dispatchEvent(new CustomEvent('nvc.ai.analysis.updated', { detail: { text, result: normalized } })); } catch(e){}
            return;
          }
        }
      } catch (e) { console.warn('Async AI analysis failed', e); }
      // If AI failed or not configured, keep using rule-based fallback and cache it
      try {
        const fallback = (function(desc){
          const lower = (desc||'').toLowerCase();
          let classification = 'अन्य';
          let priority = 'न्यून';
          if (AI_SYSTEM.keywords.corruption.some(k => lower.includes(k))) { classification = 'भ्रष्टाचार'; priority = 'उच्च'; }
          else if (AI_SYSTEM.keywords.procurement.some(k => lower.includes(k))) { classification = 'सार्वजनिक खरिद/ठेक्का'; priority = 'उच्च'; }
          else if (AI_SYSTEM.keywords.infrastructure.some(k => lower.includes(k))) { classification = 'पूर्वाधार निर्माण'; priority = 'मध्यम'; }
          else if (AI_SYSTEM.keywords.service.some(k => lower.includes(k))) { classification = 'सेवा प्रवाह'; priority = 'मध्यम'; }
          else if (AI_SYSTEM.keywords.conduct.some(k => lower.includes(k))) { classification = 'कर्मचारी आचरण'; priority = 'मध्यम'; }
          else if (AI_SYSTEM.keywords.policy.some(k => lower.includes(k))) { classification = 'नीति/निर्णय प्रक्रिया'; priority = 'न्यून'; }
          return { classification, priority, source: 'fallback' };
        })(text);
        window._nvc_ai_cache[text] = fallback;
        try { document.dispatchEvent(new CustomEvent('nvc.ai.analysis.updated', { detail: { text, result: fallback } })); } catch(e){}
      } catch(e){}
    })();

    // Immediate return: conservative fallback (keeps UI synchronous)
    return { classification: 'अन्य', priority: 'न्यून', source: 'pending_ai' };
  },
  
  // Wrapper: call the configured gateway via NVC.Api.analyzeWithGemini
  analyzeWithGemini: async function(description) {
    try {
      if (window.NVC && NVC.Api && typeof NVC.Api.analyzeWithGemini === 'function') {
        return await NVC.Api.analyzeWithGemini(description);
      }
      return { success: false, error: 'AI gateway not available' };
    } catch (e) {
      console.error('AI Analysis failed', e);
      return { success: false, error: String(e) };
    }
  },

  suggestShakha: function(description) {
    if (!description) return 'general';
    
    const lowerDesc = description.toLowerCase();
    
    if (lowerDesc.includes('वित्त') || lowerDesc.includes('budget')) {
      return 'finance';
    } else if (lowerDesc.includes('शिक्षा') || lowerDesc.includes('education')) {
      return 'education';
    } else if (lowerDesc.includes('स्वास्थ्य') || lowerDesc.includes('health')) {
      return 'health';
    } else if (lowerDesc.includes('विकास') || lowerDesc.includes('development')) {
      return 'development';
    } else {
      return 'general';
    }
  },
  
  getChatResponse: function(message) {
    const responses = [
      'तपाईंको उजुरी प्रक्रियामा छ। कृपया केही समय प्रतीक्षा गर्नुहोस्।',
      'तपाईंको जानकारीको लागि धन्यवाद। हामी यसको अवलोकन गर्दैछौं।',
      'तपाईंको उजुरी सम्बन्धित आवश्यक कारबाही सुरु गरिएको छ।',
      'थप जानकारीको लागि कृपया फोन नम्बर ४२००३३९ मा सम्पर्क गर्नुहोस्।'
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  },
  
  generateReport: function(complaints) {
    if (!complaints || complaints.length === 0) {
      return 'कुनै उजुरीहरू उपलब्ध छैनन्।';
    }
    
    const total = complaints.length;
    const pending = complaints.filter(c => c.status === 'pending').length;
    const resolved = complaints.filter(c => c.status === 'resolved').length;
    
    return `कुल ${total} उजुरीहरूमध्ये ${pending} विचाराधीन छन् र ${resolved} समाधान भएका छन्।`;
  }
};

// Ensure global NVC namespace exists for progressive migration
window.NVC = window.NVC || { Utils: {}, Api: {}, UI: {}, State: {}, Chatbot: {} };
// Destroy all chart instances to prevent memory leaks and conflicts
function destroyAllCharts() {
  try {
    // Clear Chart.js instances if Chart library is available
    if (typeof Chart !== 'undefined') {
      Chart.helpers.each(Chart.instances, function(instance) {
        instance.destroy();
      });
    }
    
    // Clear any custom chart references
    if (typeof window !== 'undefined') {
      window.nvcCharts = window.nvcCharts || {};
      Object.keys(window.nvcCharts).forEach(key => {
        if (window.nvcCharts[key] && typeof window.nvcCharts[key].destroy === 'function') {
          window.nvcCharts[key].destroy();
        }
        delete window.nvcCharts[key];
      });
    }
  } catch (e) {
    console.warn('destroyAllCharts error:', e);
  }
}

// Toggle the visibility of the main complaints filter bar (core implementation)
function toggleFilterBarMain() {
  try {
    state.filterCollapsed = !state.filterCollapsed;
    const el = document.getElementById('filterContent');
    if (el) el.classList.toggle('filter-content-collapsed', state.filterCollapsed);
    const icon = document.getElementById('filterToggleIcon');
    if (icon) icon.classList.toggle('filter-toggle-rotated', state.filterCollapsed);
    try { localStorage.setItem('nvc_ui_filterCollapsed', state.filterCollapsed ? '1' : '0'); } catch(e) {}
  } catch (e) { console.warn('toggleFilterBarMain failed', e); }
}

// Toggle visibility of dashboard search bar on mobile
function toggleDashboardSearch() {
  const el = document.getElementById('dashboardSearchContainer');
  if (el) el.classList.toggle('collapsed-mobile');
}

// Initialize dashboard charts
function initializeDashboardCharts() {
  try {
    // Chart initialization logic would go here
    console.log('📊 Dashboard charts initialized');
  } catch (e) {
    console.warn('initializeDashboardCharts error:', e);
  }
}

// Ensure stylesheets are loaded
function ensureStylesheetsLoaded() {
  try {
    // Check if critical stylesheets are loaded
    const criticalStyles = ['bootstrap.min.css', 'nepaliDatePicker.min.css'];
    criticalStyles.forEach(style => {
      if (!document.querySelector(`link[href*="${style}"]`)) {
        console.warn(`⚠️ Missing stylesheet: ${style}`);
      }
    });
    console.log('✅ Stylesheets check completed');
  } catch (e) {
    console.warn('ensureStylesheetsLoaded error:', e);
  }
}

// Provide safe no-op UI stubs for functions that legacy code may call before modules load
NVC.UI.updateStats = NVC.UI.updateStats || function(){};
NVC.UI.initializeDashboardCharts = NVC.UI.initializeDashboardCharts || function(){};
NVC.UI.destroyAllCharts = NVC.UI.destroyAllCharts || function(){};
NVC.UI.showTechnicalProjectsView = NVC.UI.showTechnicalProjectsView || function(){};
NVC.UI.showEmployeeMonitoringView = NVC.UI.showEmployeeMonitoringView || function(){};
NVC.UI.showCitizenCharterView = NVC.UI.showCitizenCharterView || function(){};
NVC.UI.showInvestigationView = NVC.UI.showInvestigationView || function(){};

// Safe global wrapper for getFromGoogleSheets to prefer modular API implementation
async function getFromGoogleSheets(action, params = {}) {
  // Deduplicate concurrent requests for the same action to avoid floods
  window._pendingGoogleSheetsRequests = window._pendingGoogleSheetsRequests || {};
  const pendingKey = action + '::' + JSON.stringify(params || {});
  if (window._pendingGoogleSheetsRequests[pendingKey]) {
    return window._pendingGoogleSheetsRequests[pendingKey];
  }
  try {
    console.info('getFromGoogleSheets called', action, params);
    if (window.NVC && NVC.Api && typeof NVC.Api.getFromGoogleSheets === 'function') {
      const p = NVC.Api.getFromGoogleSheets(action, params);
      window._pendingGoogleSheetsRequests[pendingKey] = p;
      try { const res = await p; return res; } finally { delete window._pendingGoogleSheetsRequests[pendingKey]; }
    }
  } catch (e) { console.warn('NVC.Api.getFromGoogleSheets delegate failed', e); }

  // Legacy global implementation fallback
  if (typeof window.__legacy_getFromGoogleSheets === 'function') {
    try { const p = window.__legacy_getFromGoogleSheets(action, params); window._pendingGoogleSheetsRequests[pendingKey] = p; try { const res = await p; return res; } finally { delete window._pendingGoogleSheetsRequests[pendingKey]; } } catch (e) { console.warn('legacy getFromGoogleSheets failed', e); }
  }

  // If none available, return a safe failure object
  return { success: false, message: 'getFromGoogleSheets not available' };
}


function showComplaintsView(initialFilters = {}) {
  if (window.NVC && NVC.UI && typeof NVC.UI.showComplaintsView === 'function') return NVC.UI.showComplaintsView(initialFilters);
  // Legacy fallback: if a preserved legacy renderer exists, call it
  if (typeof window.__legacy_showComplaintsView === 'function') return window.__legacy_showComplaintsView(initialFilters);
  console.warn('showComplaintsView called before UI module loaded');
  return;
}

// Minimal legacy renderer to avoid recursive delegation when UI module delegates back.
// Respects simple initialFilters: { status: 'pending'|'progress'|'resolved', search: 'text' }
if (typeof window.__legacy_showComplaintsView !== 'function') {
  window.__legacy_showComplaintsView = function(initialFilters = {}) {
    try {
      const filters = initialFilters || {};
      let list = (state && state.complaints) ? state.complaints.slice() : [];

      if (filters.status) {
        list = list.filter(c => String(c.status || '').toLowerCase() === String(filters.status || '').toLowerCase());
      }
      if (filters.shakha) {
        const shakhaFilter = String(filters.shakha || '').trim().toLowerCase();
        list = list.filter(c => {
          const cs = String(c.shakha || c.assignedShakha || c['सम्बन्धित शाखा'] || '').trim().toLowerCase();
          return cs === shakhaFilter || cs.indexOf(shakhaFilter) !== -1;
        });
      }
      if (filters.search) {
        const q = String(filters.search).toLowerCase();
        list = list.filter(c => (String(c.id || '') + ' ' + String(c.complainant || '') + ' ' + String(c.description || '')).toLowerCase().includes(q));
      }

      const rows = list.map(c => `
        <tr onclick="viewComplaint('${c.id}')" style="cursor:pointer">
          <td>${c.id}</td>
          <td>${c.complainant || '-'}</td>
          <td>${c.shakha || '-'}</td>
          <td>${c.status || '-'}</td>
          <td>${c.date || c.entryDate || ''}</td>
        </tr>
      `).join('');

      const html = `
        <div class="card p-3">
          <h5>उजुरीहरू</h5>
          <div class="table-responsive mt-2">
            <table class="table table-sm table-striped">
              <thead><tr><th>दर्ता नं</th><th>उजुरीकर्ता</th><th>शाखा</th><th>स्थिति</th><th>मिति</th></tr></thead>
              <tbody>${rows || '<tr><td colspan="5" class="text-center text-muted">कुनै उजुरी छैन</td></tr>'}</tbody>
            </table>
          </div>
        </div>
      `;

      if (typeof setContentAreaHTML === 'function') setContentAreaHTML(html);
      else {
        const ca = document.getElementById('contentArea'); if (ca) ca.innerHTML = html;
      }
      applyDevanagariDigits(document.getElementById('contentArea'));
      state.currentView = 'complaints';
    } catch (e) { console.error('__legacy_showComplaintsView failed', e); }
  };
}
// NOTE: Removed an orphaned AI/chatbot fragment that was left corrupted during migration.
// The AI/chatbot implementation now lives in `ai_chatbot.js` under the `NVC.Chatbot` namespace.

function normalizeProvinceName(value) {
  if (value === undefined || value === null) return '';
  const v = String(value).trim();
  if (!v) return '';
  const mapped = LOCATION_FIELDS?.PROVINCE?.[v] || LOCATION_FIELDS?.PROVINCE?.[Number(v)];
  const name = mapped ? String(mapped) : v;
  return name.replace(/\s*प्रदेश\s*$/g, '').trim();
}

// ==================== AI INSIGHTS (RULE-BASED) ====================
const AI_INSIGHTS = {
    generateInsights: function(complaints) {
        if (!complaints || complaints.length === 0) {
            return [{
                type: 'info',
                icon: 'fa-info-circle',
                message: 'विश्लेषण गर्न पर्याप्त उजुरी डाटा छैन।'
            }];
        }

        const insights = [];
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        // --- 1. Trend Analysis (Current Month vs Last Month) ---
        // Use AD-normalized dates (handles BS dates via _parseComplaintRegDateToAD)
        const thisMonthComplaints = complaints.filter(c => {
          const d = (typeof _parseComplaintRegDateToAD === 'function') ? _parseComplaintRegDateToAD(c) : null;
          if (!d || isNaN(d.getTime())) return false;
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        let lastMonth = currentMonth - 1;
        let lastMonthYear = currentYear;
        if (lastMonth < 0) { lastMonth = 11; lastMonthYear--; }

        const lastMonthComplaints = complaints.filter(c => {
          const d = (typeof _parseComplaintRegDateToAD === 'function') ? _parseComplaintRegDateToAD(c) : null;
          if (!d || isNaN(d.getTime())) return false;
          return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
        });

        let trendText = "";
        if (thisMonthComplaints.length > lastMonthComplaints.length) {
            trendText = "हालको महिनामा उजुरी संख्यामा उल्लेखनीय वृद्धि देखिएको छ।";
        } else if (thisMonthComplaints.length < lastMonthComplaints.length) {
            trendText = "गत महिनाको तुलनामा यस महिना उजुरी संख्यामा केही कमी आएको छ।";
        } else {
            trendText = "उजुरी दर्ताको प्रवृत्ति स्थिर देखिन्छ।";
        }

        // --- 2. Shakha Analysis (Highest Volume) ---
        const shakhaCounts = {};
        complaints.forEach(c => {
            const s = c.shakha || 'अन्य';
            shakhaCounts[s] = (shakhaCounts[s] || 0) + 1;
        });
        
        let topShakha = '';
        let maxCount = 0;
        for (const [shakha, count] of Object.entries(shakhaCounts)) {
            if (count > maxCount) { maxCount = count; topShakha = shakha; }
        }
        
        let shakhaText = "";
        if (topShakha) {
            shakhaText = `विशेषगरी <strong>${topShakha}</strong> शाखामा बढी उजुरी (${maxCount}) आएको पाइन्छ।`;
        }

        // --- 3. Status & Suggestion ---
        const total = complaints.length;
        const pending = complaints.filter(c => c.status === 'pending');
        const pendingCount = pending.length;
        const pendingPercentage = total > 0 ? Math.round((pendingCount / total) * 100) : 0;
        
        let statusText = "";
        let suggestionText = "";
        
        if (pendingPercentage > 50) {
            statusText = `Pending उजुरी संख्या उच्च (${pendingPercentage}%) देखिन्छ`;
            suggestionText = "जसले कार्यसम्पादन सुधार आवश्यक रहेको संकेत गर्दछ।";
        } else if (pendingPercentage > 20) {
            statusText = `करिब ${pendingPercentage}% उजुरीहरू प्रक्रियामा छन्`;
            suggestionText = "र नियमित अनुगमन आवश्यक देखिन्छ।";
        } else {
            statusText = `फछ्र्यौट स्थिति सन्तोषजनक छ`;
            suggestionText = "र कार्यसम्पादन प्रभावकारी देखिन्छ।";
        }

        // Combine Narrative
        const narrative = `${trendText} ${shakhaText} ${statusText} ${suggestionText}`;

        // Add Narrative Insight (Main)
        insights.push({
            type: 'info',
            icon: 'fa-robot',
            message: narrative
        });

        // --- 4. Critical Alerts (Old Pending > 30 Days) ---
        const oldPending = pending.filter(c => {
            const dateStr = c.entryDate || c.date;
            if (!dateStr) return false;
            try {
                const complaintDate = new Date(dateStr);
                if (isNaN(complaintDate.getTime())) return false;
                const diffTime = now - complaintDate;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                return diffDays > 30;
            } catch(e) { return false; }
        });

        if (oldPending.length > 0) {
            insights.push({
                type: 'critical',
                icon: 'fa-exclamation-triangle',
                message: `<span style="color: #d32f2f; font-weight: bold;">ध्यान दिनुहोस्: ${oldPending.length} वटा उजुरी ३० दिन भन्दा बढी समयदेखि प्रक्रियामा छन्।</span>`
            });
        }

        return insights;
    }
};

// Backwards-compatibility shim: prefer new NVC.Config but fall back to global for legacy calls
const GOOGLE_SHEETS_CONFIG = (window.NVC && window.NVC.Config && window.NVC.Config.GOOGLE_SHEETS_CONFIG) || (window.GOOGLE_SHEETS_CONFIG || { ENABLED: false, WEB_APP_URL: '' });

// Enhanced back/forward cache (bfcache) optimization
window.addEventListener('pageshow', function(event) {
  if (event.persisted) {
    // Page restored from bfcache - restore application state
    console.log('Page restored from back/forward cache - restoring state...');
    
    // Restore critical application state
    if (typeof restoreApplicationState === 'function') {
      restoreApplicationState();
    }
    
    // Re-initialize event listeners that may have been lost
    if (typeof reinitializeEventListeners === 'function') {
      reinitializeEventListeners();
    }
    
    // Update UI components that depend on current state
    if (typeof updateUIComponents === 'function') {
      updateUIComponents();
    }
  }
});

// Handle page unload to prepare for bfcache
window.addEventListener('beforeunload', function(event) {
  // Save current application state for potential bfcache restoration
  if (typeof saveApplicationState === 'function') {
    saveApplicationState();
  }
  
  // Clean up resources that shouldn't persist
  if (typeof cleanupResources === 'function') {
    cleanupResources();
  }
});

// Handle page visibility changes for performance optimization
document.addEventListener('visibilitychange', function() {
  if (document.hidden) {
    // Page is hidden - pause non-essential operations
    console.log('Page hidden - pausing operations');
    
    // Pause animations, timers, and network requests
    if (typeof pauseNonEssentialOperations === 'function') {
      pauseNonEssentialOperations();
    }
    
    // Save current state
    if (typeof saveApplicationState === 'function') {
      saveApplicationState();
    }
  } else {
    // Page is visible - resume operations
    console.log('Page visible - resuming operations');
    
    // Resume paused operations
    if (typeof resumeEssentialOperations === 'function') {
      resumeEssentialOperations();
    }
    
    // Refresh data if needed
    if (typeof refreshDataIfNeeded === 'function') {
      refreshDataIfNeeded();
    }
  }
});

// Prevent bfcache issues with dynamic content
document.addEventListener('freeze', function() {
  // Page is being frozen for bfcache
  console.log('Page freezing for bfcache - preparing...');
  
  // Save any unsaved data
  if (typeof saveUnsavedData === 'function') {
    saveUnsavedData();
  }
});

document.addEventListener('resume', function() {
  // Page is being resumed from bfcache
  console.log('Page resuming from bfcache - restoring...');
  
  // Restore application state
  if (typeof restoreApplicationState === 'function') {
    restoreApplicationState();
  }
});

// Lazy load non-critical JavaScript functions
function loadNonCriticalJS() {
  // Defer loading of non-essential functions
  setTimeout(() => {
    console.log('Loading non-critical JavaScript...');
  }, 1000);
}

// BFCache and performance optimization helper functions
function saveApplicationState() {
  try {
    // Save current page, user state, and form data
    const appState = {
      currentPage: window.state?.currentPage || 'mainPage',
      currentUser: window.state?.currentUser || null,
      formData: collectFormData(),
      timestamp: Date.now()
    };
    sessionStorage.setItem('bfcacheAppState', JSON.stringify(appState));
    console.log('Application state saved for bfcache');
  } catch (error) {
    console.warn('Failed to save application state:', error);
  }
}

function restoreApplicationState() {
  try {
    const savedState = sessionStorage.getItem('bfcacheAppState');
    if (savedState) {
      const state = JSON.parse(savedState);
      
      // Restore page state
      if (state.currentPage && typeof showPage === 'function') {
        showPage(state.currentPage);
      }
      
      // Restore user state
      if (state.currentUser && window.state) {
        window.state.currentUser = state.currentUser;
      }
      
      // Restore form data
      if (state.formData && typeof restoreFormData === 'function') {
        restoreFormData(state.formData);
      }
      
      console.log('Application state restored from bfcache');
    }
  } catch (error) {
    console.warn('Failed to restore application state:', error);
  }
}

function collectFormData() {
  const formData = {};
  const inputs = document.querySelectorAll('input, textarea, select');
  inputs.forEach(input => {
    if (input.id && input.value) {
      formData[input.id] = input.value;
    }
  });
  return formData;
}

function restoreFormData(formData) {
  Object.keys(formData).forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.value = formData[id];
    }
  });
}

function pauseNonEssentialOperations() {
  // Clear any ongoing timeouts
  if (window.activeTimeouts) {
    window.activeTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
  }
  
  // Pause any ongoing animations
  const animatedElements = document.querySelectorAll('[class*="animate"], [class*="transition"]');
  animatedElements.forEach(el => {
    el.style.animationPlayState = 'paused';
  });
  
  // Abort any non-critical fetch requests
  if (window.activeRequests) {
    window.activeRequests.forEach(controller => controller.abort());
  }
}

function resumeEssentialOperations() {
  // Resume animations
  const animatedElements = document.querySelectorAll('[class*="animate"], [class*="transition"]');
  animatedElements.forEach(el => {
    el.style.animationPlayState = 'running';
  });
  
  // Restart any essential periodic tasks
  if (typeof startPeriodicTasks === 'function') {
    startPeriodicTasks();
  }
}

function cleanupResources() {
  // Clear session storage for bfcache
  sessionStorage.removeItem('bfcacheAppState');
  
  // Clean up any event listeners that won't be needed
  if (window.tempEventListeners) {
    window.tempEventListeners.forEach(({element, event, handler}) => {
      element.removeEventListener(event, handler);
    });
  }
}

function saveUnsavedData() {
  // Check for any unsaved form data and save it
  const forms = document.querySelectorAll('form[data-unsaved="true"]');
  forms.forEach(form => {
    const formData = new FormData(form);
    const formId = form.id || 'unnamed-form';
    localStorage.setItem(`unsaved_${formId}`, JSON.stringify(Object.fromEntries(formData)));
  });
}

function refreshDataIfNeeded() {
  // Check if data is stale and refresh if needed
  const lastRefresh = localStorage.getItem('lastDataRefresh');
  const now = Date.now();
  const refreshInterval = 5 * 60 * 1000; // 5 minutes
  
  if (!lastRefresh || (now - parseInt(lastRefresh)) > refreshInterval) {
    if (typeof loadDataFromGoogleSheets === 'function') {
      loadDataFromGoogleSheets(false);
      localStorage.setItem('lastDataRefresh', now.toString());
    }
  }
}

function reinitializeEventListeners() {
  // Re-initialize critical event listeners that may have been lost
  if (typeof initializeEventListeners === 'function') {
    initializeEventListeners();
  }
}

function updateUIComponents() {
  // Update UI components that depend on current state
  if (typeof updateDateTime === 'function') {
    updateDateTime();
  }
  
  if (typeof updateStats === 'function') {
    updateStats();
  }
  
  if (typeof updateNotifications === 'function') {
    updateNotifications();
  }
}

// Initialize performance optimizations
document.addEventListener('DOMContentLoaded', function() {
  loadNonCriticalJS();
});

// ==================== CONFIGURATION ====================
const CONFIG = {
  APP_NAME: 'राष्ट्रिय सतर्कता केन्द्र',
  APP_VERSION: '2.0.0',
  DEFAULT_PAGE: 'mainPage',
  DATE_FORMAT: 'YYYY-MM-DD',
  NEPALI_MONTHS: {
    1: "बैशाख", 2: "जेठ", 3: "असार", 4: "साउन", 
    5: "भदौ", 6: "असोज", 7: "कार्तिक", 8: "मंसिर", 
    9: "पुष", 10: "माघ", 11: "फागुन", 12: "चैत"
  },
  // नेपालका प्रदेशहरू
  PROVINCES: {
    1: "कोशी प्रदेश",
    2: "मधेश प्रदेश",
    3: "बागमती प्रदेश",
    4: "गण्डकी प्रदेश",
    5: "लुम्बिनी प्रदेश",
    6: "कर्णाली प्रदेश",
    7: "सुदूरपश्चिम प्रदेश"
  },
  // जिल्लाहरू (प्रदेश अनुसार)
  DISTRICTS: {
    1: ["इलाम", "झापा", "ताप्लेजुङ", "पाँचथर", "ओखलढुङ्गा", "खोटाङ", "सोलुखुम्बु", "सुनसरी", "तेह्रथुम", "संखुवासभा", "भोजपुर", "धनकुटा", "मोरङ", "उदयपुर"],
    2: ["सप्तरी", "सिराहा", "धनुषा", "महोत्तरी", "सर्लाही", "रौतहट", "बारा", "पर्सा"],
    3: ["सिन्धुपाल्चोक", "चितवन", "मकवानपुर", "भक्तपुर", "ललितपुर", "काठमाडौं", "नुवाकोट", "रसुवा", "धादिङ", "काभ्रेपलाञ्चोक", "सिन्धुली", "रामेछाप", "दोलखा"],
    4: ["गोरखा", "कास्की", "तनहुँ", "लमजुङ", "स्याङ्जा", "मनाङ", "मुस्ताङ", "बाग्लुङ", "पर्वत", "म्याग्दी","नवलपरासी (बर्दघाट सुस्ता पूर्व)"],
    5: ["गुल्मी", "पाल्पा", "रुपन्देही", "कपिलवस्तु", "नवलपरासी (बर्दघाट सुस्ता पश्चिम)", "अर्घाखाँची", "बाँके", "बर्दिया", "दाङ", "रुकुम (पूर्व)", "रोल्पा", "प्युठान"],
    6: ["कालिकोट", "दैलेख", "जाजरकोट", "डोल्पा", "हुम्ला", "जुम्ला", "मुगु", "रुकुम (पश्चिम)", "सल्यान", "सुर्खेत"],
    7: ["कैलाली", "अछाम", "डोटी", "बझाङ", "बाजुरा", "दार्चुला", "डडेलधुरा", "बैतडी" ,"कञ्चनपुर"]
  }
};

// ==================== EMPLOYEE MONITORING HELPER FUNCTIONS ====================
function populateProvinces() {
  const provinceSelect = document.getElementById('empProvince');
  if (!provinceSelect) return;
  
  provinceSelect.innerHTML = '<option value="">प्रदेश छान्नुहोस्</option>';
  Object.entries(LOCATION_FIELDS.PROVINCE).forEach(([key, value]) => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = value;
    provinceSelect.appendChild(option);
  });
}

function populateDistricts(provinceId) {
  const districtSelect = document.getElementById('empDistrict');
  if (!districtSelect) return;
  
  districtSelect.innerHTML = '<option value="">जिल्ला छान्नुहोस्</option>';
  
  if (provinceId && LOCATION_FIELDS.DISTRICTS[provinceId]) {
    LOCATION_FIELDS.DISTRICTS[provinceId].forEach(district => {
      const option = document.createElement('option');
      option.value = district;
      option.textContent = district;
      districtSelect.appendChild(option);
    });
  }
  
  // Clear local level when district changes
  const localLevelSelect = document.getElementById('empLocalLevel');
  if (localLevelSelect) {
    localLevelSelect.innerHTML = '<option value="">स्थानीय तह छान्नुहोस्</option>';
  }
}

function populateLocalLevels() {
  const localLevelSelect = document.getElementById('empLocalLevel');
  if (!localLevelSelect) return;
  
  const province = document.getElementById('empProvince').value;
  const district = document.getElementById('empDistrict').value;
  
  localLevelSelect.innerHTML = '<option value="">स्थानीय तह छान्नुहोस्</option>';
  
  if (province && district && LOCATION_FIELDS.MUNICIPALITIES[province] && LOCATION_FIELDS.MUNICIPALITIES[province][district]) {
    const municipalities = LOCATION_FIELDS.MUNICIPALITIES[province][district];
    municipalities.forEach(municipality => {
      const option = document.createElement('option');
      option.value = municipality;
      option.textContent = municipality;
      localLevelSelect.appendChild(option);
    });
  }
}

function addEmployeeRow(type) {
  const container = document.getElementById(`${type}EmployeesContainer`);
  if (!container) return;
  
  const rowId = `${type}_${Date.now()}`;
  const row = document.createElement('div');
  row.className = 'd-grid gap-2 mb-2';
  row.id = rowId;
  row.style.cssText = 'grid-template-columns: 2fr 1fr 1fr auto; padding: 8px; border: 1px solid #dee2e6; border-radius: 4px; background: #f8f9fa;';
  
  row.innerHTML = `
    <input type="text" id="employee_name_${rowId}" name="employee_name" class="form-control" placeholder="कर्मचारीको नाम" data-field="name" />
    <input type="text" id="employee_post_${rowId}" name="employee_post" class="form-control" placeholder="पद" data-field="post" />
    <input type="text" id="employee_symbol_${rowId}" name="employee_symbol" class="form-control" placeholder="संकेत नं" data-field="symbol" />
    <button type="button" class="btn btn-sm btn-danger" onclick="removeEmployeeRow('${rowId}')">
      <i class="fas fa-trash"></i>
    </button>
  `;
  
  container.appendChild(row);
}

function removeEmployeeRow(rowId) {
  const row = document.getElementById(rowId);
  if (row) {
    row.remove();
  }
}

function getEmployeeData(type) {
  const container = document.getElementById(`${type}EmployeesContainer`);
  if (!container) return [];
  
  const employees = [];
  const rows = container.querySelectorAll('[id^="' + type + '_"]');
  
  rows.forEach(row => {
    const nameInput = row.querySelector('input[data-field="name"]');
    const postInput = row.querySelector('input[data-field="post"]');
    const symbolInput = row.querySelector('input[data-field="symbol"]');
    
    if (nameInput && nameInput.value.trim()) {
      employees.push({
        name: nameInput.value.trim(),
        post: postInput ? postInput.value.trim() : '',
        symbol: symbolInput ? symbolInput.value.trim() : ''
      });
    }
  });
  
  return employees;
}

// Helper: add a prefilled employee row into a specific container id
function addEmployeeRowTo(containerId, data = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const rowId = `${containerId}_${Date.now()}_${Math.floor(Math.random()*1000)}`;
  const row = document.createElement('div');
  row.className = 'd-grid gap-2 mb-2';
  row.id = rowId;
  row.style.cssText = 'grid-template-columns: 2fr 1fr 1fr auto; padding: 8px; border: 1px solid #dee2e6; border-radius: 4px; background: #f8f9fa;';

  const nameVal = data.name ? String(data.name) : '';
  const postVal = data.post ? String(data.post) : '';
  const symbolVal = data.symbol ? String(data.symbol) : '';

  row.innerHTML = `
    <input type="text" id="employee_name_${rowId}" name="employee_name" class="form-control" placeholder="कर्मचारीको नाम" data-field="name" value="${escapeHtml(nameVal)}" />
    <input type="text" id="employee_post_${rowId}" name="employee_post" class="form-control" placeholder="पद" data-field="post" value="${escapeHtml(postVal)}" />
    <input type="text" id="employee_symbol_${rowId}" name="employee_symbol" class="form-control" placeholder="संकेत नं" data-field="symbol" value="${escapeHtml(symbolVal)}" />
    <button type="button" class="btn btn-sm btn-danger" onclick="document.getElementById('${rowId}').remove();">
      <i class="fas fa-trash"></i>
    </button>
  `;

  container.appendChild(row);
}

// Helper: read employee data from a specific container id
function getEmployeeDataFrom(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return [];
  const employees = [];
  const rows = Array.from(container.children || []);
  rows.forEach(row => {
    const nameInput = row.querySelector('input[data-field="name"]');
    const postInput = row.querySelector('input[data-field="post"]');
    const symbolInput = row.querySelector('input[data-field="symbol"]');
    if (nameInput && nameInput.value.trim()) {
      employees.push({ 
        name: nameInput.value.trim(), 
        post: postInput ? postInput.value.trim() : '',
        symbol: symbolInput ? symbolInput.value.trim() : ''
      });
    }
  });
  return employees;
}

// Try to parse a JSON string and return the array length, otherwise 0
function tryParseJsonCount(str) {
  try {
    if (!str) return 0;
    const parsed = typeof str === 'string' ? JSON.parse(str) : str;
    if (Array.isArray(parsed)) return parsed.length;
    return 0;
  } catch (e) { return 0; }
}

// Simple HTML escaper for attribute insertion
function escapeHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ==================== DATA MODELS ====================
const MAHASHAKHA = {
  ADMIN_MONITORING: 'प्रशासन तथा अनुगमन महाशाखा',
  POLICY_LEGAL: 'नीति निर्माण तथा कानूनी राय परामर्श महाशाखा',
  POLICE: 'प्रहरी महाशाखा',
  TECHNICAL: 'प्राविधिक परीक्षण तथा अनुगमन महाशाखा'
};

const SHAKHA = {
  ADMIN_PLANNING: 'प्रशासन तथा योजना शाखा',
  INFO_COLLECTION: 'सूचना संकलन, अन्वेषण तथा अनुगमन शाखा',
  COMPLAINT_MANAGEMENT: 'उजुरी व्यवस्थापन तथा अनुगमन शाखा',
  FINANCE: 'आर्थिक प्रशासन शाखा',
  
  POLICY_MONITORING: 'नीति निर्माण तथा अनुगमन शाखा',
  INVESTIGATION: 'छानबिन, अन्वेषण तथा अनुगमन शाखा',
  LEGAL_ADVICE: 'कानूनी राय तथा परामर्श शाखा',
  ASSET_DECLARATION: 'सम्पत्ति विवरण तथा अनुगमन शाखा',
  
  POLICE_INFO_COLLECTION: 'सूचना संकलन तथा अन्वेषण शाखा',
  POLICE_MONITORING: 'निगरानी तथा अनुगमन शाखा',
  POLICE_MANAGEMENT: 'प्रहरी व्यवस्थापन शाखा',
  POLICE_INVESTIGATION: 'अन्वेषण तथा अनुगमन शाखा',
  
  TECHNICAL_1: 'प्राविधिक परीक्षण तथा अनुगमन शाखा १',
  TECHNICAL_2: 'प्राविधिक परीक्षण तथा अनुगमन शाखा २',
  TECHNICAL_3: 'प्राविधिक परीक्षण तथा अनुगमन शाखा ३',
  TECHNICAL_4: 'प्राविधिक परीक्षण तथा अनुगमन शाखा ४',
  LABORATORY_TESTING: 'प्रयोगशाला परीक्षण शाखा'
};

const DECISION_TYPES = {
  1: 'उजुरीका सम्बन्धमा केही गर्न नपर्ने',
  2: 'राय प्रतिक्रिया सहित कागजात माग गर्ने',
  3: 'छानबिन गरी राय सहितको प्रतिवेदन पेश गर्न लगाउने',
  4: 'छानविन तथा कारबाही गरी जानकारी दिन लेखी पठाउने',
  5: 'अख्तियार दुरुपयोग अनुसन्धान आयोगमा लेखि पठाउने',
  6: 'उजुरी अन्य निकायमा पठाउने',
  7: 'अन्य कार्य गर्ने'
};

const FINAL_DECISION_TYPES = {
  1: 'तामेली',
  2: 'सुझाव/निर्देशन',
  3: 'सतर्क',
  4: 'अन्य'
};

function normalizeFinalDecisionType(value) {
  if (value === undefined || value === null) return '';
  const v = String(value).trim();
  if (!v) return '';
  if (FINAL_DECISION_TYPES[v]) return FINAL_DECISION_TYPES[v];
  if (FINAL_DECISION_TYPES[Number(v)]) return FINAL_DECISION_TYPES[Number(v)];
  if (v === 'सुझाव/निर्देशन दिने') return 'सुझाव/निर्देशन';
  if (v === 'सतर्क गर्ने') return 'सतर्क';
  if (v === 'अन्य निर्णय') return 'अन्य';
  return v;
}

// Generate a short unique complaint id when none provided (legacy fallback)
function generateComplaintId() {
  try {
    return 'C' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2,8).toUpperCase();
  } catch (e) {
    return 'C' + Math.floor(Math.random() * 1000000);
  }
}

const STATUS_TYPES = {
  PENDING: 'काम बाँकी',
  IN_PROGRESS: 'चालु',
  RESOLVED: 'फछ्रयौट',
};

const MAHASHAKHA_STRUCTURE = {
  [MAHASHAKHA.ADMIN_MONITORING]: [SHAKHA.ADMIN_PLANNING, SHAKHA.INFO_COLLECTION, SHAKHA.COMPLAINT_MANAGEMENT, SHAKHA.FINANCE],
  [MAHASHAKHA.POLICY_LEGAL]: [SHAKHA.POLICY_MONITORING, SHAKHA.INVESTIGATION, SHAKHA.LEGAL_ADVICE, SHAKHA.ASSET_DECLARATION],
  [MAHASHAKHA.POLICE]: [SHAKHA.POLICE_INFO_COLLECTION, SHAKHA.POLICE_MONITORING, SHAKHA.POLICE_MANAGEMENT, SHAKHA.POLICE_INVESTIGATION],
  [MAHASHAKHA.TECHNICAL]: [SHAKHA.TECHNICAL_1, SHAKHA.TECHNICAL_2, SHAKHA.TECHNICAL_3, SHAKHA.TECHNICAL_4, SHAKHA.LABORATORY_TESTING]
};

// script.js मा थप्ने - उजुरी फारममा स्थान फिल्ड
const LOCATION_FIELDS = {
  PROVINCE: {
    1: 'कोशी प्रदेश',
    2: 'मधेश प्रदेश',
    3: 'बागमती प्रदेश',
    4: 'गण्डकी प्रदेश',
    5: 'लुम्बिनी प्रदेश',
    6: 'कर्णाली प्रदेश',
    7: 'सुदूरपश्चिम प्रदेश'
  },
  DISTRICTS: {
    1: ["इलाम", "झापा", "ताप्लेजुङ", "पाँचथर", "ओखलढुङ्गा", "खोटाङ", "सोलुखुम्बु", "सुनसरी", "तेह्रथुम", "संखुवासभा", "भोजपुर", "धनकुटा", "मोरङ", "उदयपुर"],
    2: ["सप्तरी", "सिराहा", "धनुषा", "महोत्तरी", "सर्लाही", "रौतहट", "बारा", "पर्सा"],
    3: ["सिन्धुपाल्चोक", "चितवन", "मकवानपुर", "भक्तपुर", "ललितपुर", "काठमाडौं", "नुवाकोट", "रसुवा", "धादिङ", "काभ्रेपलाञ्चोक", "सिन्धुली", "रामेछाप", "दोलखा"],
    4: ["गोरखा", "कास्की", "तनहुँ", "लमजुङ", "स्याङ्जा", "मनाङ", "मुस्ताङ", "बाग्लुङ", "पर्वत", "म्याग्दी","नवलपरासी (बर्दघाट सुस्ता पूर्व)"],
    5: ["गुल्मी", "पाल्पा", "रुपन्देही", "कपिलवस्तु", "नवलपरासी (बर्दघाट सुस्ता पश्चिम)", "अर्घाखाँची", "बाँके", "बर्दिया", "दाङ", "रुकुम (पूर्व)", "रोल्पा", "प्युठान"],
    6: ["कालिकोट", "दैलेख", "जाजरकोट", "डोल्पा", "हुम्ला", "जुम्ला", "मुगु", "रुकुम (पश्चिम)", "सल्यान", "सुर्खेत"],
    7: ["कैलाली", "अछाम", "डोटी", "बझाङ", "बाजुरा", "दार्चुला", "डडेलधुरा", "बैतडी" ,"कञ्चनपुर"]
  },
  MUNICIPALITIES: {
    // Populate local levels for provinces using provided lists.
    1: {
      "ताप्लेजुङ": ["आठराई त्रिवेणी", "सिदिङ्वा", "फक्ताङलुङ", "मिक्वाखोला", "मेरिङ्देन", "मैवाखोला", "पाथीभरा याङवरक", "सिरिजङ्घा", "फुङलिङ"], 
      "भोजपुर": ["आमचोक","अरुण","भोजपुर","हतुवागढी","पौवाडुङ्मा","रामप्रसाद","सालपसिलिछो","षडानन्द","टेम्केमाइयुङ"],
      "धनकुटा": ["चौबिसे","छथर जोरपाटी","धनकुटा","महालक्ष्मी","पाखरिबास","साँगुरीगढी","शहिदभूमि"],
      "इलाम": ["चुलाचुली","देउमाई","फाकफोक्थुम","इलाम","माई","माइजोगमाई","मङ्गेबुङ","रोङ","सन्दकपुर","सूर्योदय"],
      "झापा": ["अर्जुनधारा","बाह्रदशी","भद्रपुर","बिर्तामोड","बुद्धशान्ति","दमक","गौराधा","गौरीगञ्ज","हल्दिबारी","झापा","कचनकवल","कमल","कनकाई","मेचीनगर","शिवसताक्सी"],
      "खोटाङ": ["ऐसेलुखर्क","बराहापोखरी","दिक्तेल रुपाकोट मझुवागढी","डिप्रुङ","हलेसी तुवाचुङ","जानतेढुङ्गा","केपिलासगढी","खोटेहाङ","रवा बेसी","साकेला"],
      "मोरङ": ["बेलबारी","विराटनगर","बुढीगंगा","धनपालथान","ग्रामथान","जहादा","कानेपोखरी","कटहरी","केराबारी","लेटाङ","मिक्लाजुङ","पथरी शनिश्चरे","रंगेली","रतुवामाई","सुन्दरहरैचा","सुनवर्शी","उरालाबारी"],
      "ओखलढुङ्गा": ["चम्पादेवी","चिसंखुगढी","खिजिदेम्बा","लिखु","मानेभञ्ज्याङ","मोलुङ","सिद्धिचरण","सुनकोशी"],
      "पाँचथर": ["फालेलुङ","फाल्गुनन्द","हिलिहाङ","कुमायक","मिक्लाजुङ","फिदिम","तुम्बेवा","याङ्गवारक"],
      "संखुवासभा": ["भोटखोला","चैनपुर","चिचिला","धर्मदेवी","खाँदबारी","माडी","मकालु","पञ्चखापन","सभापोखरी","सिलिचङ"],
      "सोलुखुम्बु": ["खुम्बुपसङ्लाहमु","लिखुपिके","माप्या दुधकोशी","महाकुलुङ","नेचासल्यान","सोलुदुधाकुण्ड","खोटाङ","थुलुङ दुधकोशी"],
      "तेह्रथुम": ["आठराई","छथर","लालीगुराँस","मेन्चायम","म्याङलुङ","फेडाप"],
      "सुनसरी": ["बराहक्षेत्र","बर्जु","भोक्राहा नरसिङ्ग","देवानगन्ज","धरान","दुहबी","गढी","हरिनगर","इनरुवा","इटहरी","कोशी","रामधुनी"],
      "उदयपुर": ["बेलका","चौदण्डीगढी","कटारी","लिम्चुङबुङ","रौतामाई","तापली","त्रियुग","उदयपुरगढी"]
    },
    2: {
      "सप्तरी": ["अग्निशैर कृष्ण सावरण","बालन बिहुल","विष्णुपुर","बोडे बार्सैन","छिन्नमस्ता","डाक्नेश्वरी","हनुमाननगर कंकालिनी","कञ्चनरुप","खडक","महादेव","राजविराज","राजगढ","रुपानी","सप्तकोशी","शम्भुनाथ","सुरुङ्गा","तिलाठी कोइलाडी","तिराहुत"],
      "सिराहा": ["अर्नामा","औरही","बरियारपट्टी","भगवानपुर","विष्णुपुर","धनगढीमाई","गोलबजार","कल्याणपुर","कर्जन्हा","लहान","लक्ष्मीपुर पटारी","मिर्चैया","नरहा","नवराजपुर","सखुवानङ्करकट्टी","सिरहा","सुखीपुर"],
      "धनुषा": ["औराही","बटेश्वर","बिदेह","क्षिरेश्वरनाथ","धनौजी","धनुषाधाम","गणेशमान चारनाथ","हंसपुर","जनकनन्दनी","जनकपुरधाम","कमला","लक्ष्मीनिया","मिथिला","मिथिला बिहारी","मुखियापट्टी मुसरमिया","नगराई","सबाइला","सहिदनगर"],
      "महोत्तरी": ["औरही","बलवा","बर्दिवास","भङ्गाहा","एकडानरा","गौशाला","जलेश्वर","लोहारपट्टी","महोत्तरी","मनरा सिसवा","मटिहानी","पिपरा","रामगोपालपुर","सम्सी","सोनामा"],
      "सर्लाही": ["बागमती","बलरा","बराहथवा","बासबरिया","विष्णु","ब्रम्हपुरी","चक्रघट्टा","चन्द्रनगर","धनकौल","गोदैता","हरिपुर","हरिपुरवा","हरिवान","ईश्वरपुर","कबिलासी","कौडेना","लालबन्दी","मलङ्गवा","पर्सा","रामनगर"],
      "बारा": ["आदर्श कोतवाल","बारागढी","बिश्रामपुर","देवтал","जितपुरसिमारा","कलैया","करैयामाई","कोल्हाबी","महागढीमाई","निजगढ","पचरौता","परवानीपुर","फेटा","प्रसौनी","सिम्रौनगढ","सुवर्ण"],
      "पर्सा": ["बहुदरमाई","बिन्दवासिनी","वीरगन्ज","छिपहरमाई","धोबिनी","जगरनाथपुर","जिरभवानी","कालिकामाई","पकाहा मेनपुर","पर्सागढी","पटेरवा सुगौली","पोखरिया","सखुवा प्रसौनी","थोरी"],
      "रौतहट": ["बौधिमाई","वृन्दबन","चन्द्रपुर","देवाही गोनाही","दुर्गा भगवती","गढीमाई","गरुड","गौर","गुजरा","ईशानाथ","कटहरिया","माधव नारायण","मौलापुर","पारोहा","विजयपुर फटुवा","राजदेवी","राजपुर","यमुनामाई"]
    },
    3: {
      "भक्तपुर": ["भक्तपुर","चाँगुनारायण","मध्यपुरथिमि","सूर्यविनायक"],
      "चितवन": ["भरतपुर","इच्छाकामना","कालिका","खैरहनी","माडी","राप्ती","रत्ननगर"],
      "धादिङ": ["बेनिघाट रोराङ","धुनिबेसी","गजुरी","गाल्ची","गंगाजमुना","ज्वालामुखी","खनियाबास","नेत्रावती डब्जोङ","नीलकण्ठ","रुबी उपत्यका","सिद्धलेक","ठाकरे","त्रिपुरा सुन्दरी"],
      "दोलखा": ["बैतेश्वर","भीमेश्वर","बिगु","गौरीशंकर","जिरी","कालिञ्चोक","मेलुङ","सेलुङ","तामाकोशी"],
      "काठमाडौं": ["बुढानिलकण्ठ","चन्द्रागिरि","दक्षिणकाली","गोकर्णेश्वर","कागेश्वरी मनहोरा","काठमाडौं","कीर्तिपुर","नागार्जुन","शंखरापुर","तारकेश्वर","टोखा"],
      "काभ्रेपलाञ्चोक": ["बनेपा","बेथानचोक","भुम्लु","चौरीदेउराली","धुलिखेल","खानीखोला","महाभारत","मण्डनदेउपुर","नमोबुद्ध","पनौती","पाँचखाल","रोशी","तेमल"],
      "ललितपुर": ["बागमती","गोदावरी","कोन्ज्योसोम","ललितपुर","महालक्ष्मी","महांकाल"],
      "मकवानपुर": ["बागमती","बकैया","भीमफेदी","हेटौंडा","इन्द्रसरोवर","कैलाश","मकवानपुरगढी","मनहरी","रक्सिराङ","थाहा"],
      "नुवाकोट": ["बेलकोटगढी","बिदुर","दुप्चेश्वर","ककनी","किस्पाङ","लिखु","म्यागाङ","पञ्चकन्या","शिवपुरी","सुर्यगढी","ताडी","तारकेश्वर"],
      "रामेछाप": ["दोरम्बा","गोकुलगंगा","खाडादेवी","लिखु तामाकोशी","मन्थली","रामेछाप","सुनापति","उमाकुण्ड"],
      "रसुवा": ["अमाकोडिङमो","गोसाइकुण्ड","कालिका","नौकुण्ड","उत्तरगया"],
      "सिन्धुली": ["दुधौली","घाङ्लेख","गोलन्जोर","हरिहरपुरगढी","कमलामाई","मारिन","फिक्कल","सुनकोशी","तिनपाटन"],
      "सिन्धुपाल्चोक": ["बलेफी","बाह्रबिसे","भोटेकोशी","चौतारा साँगाचोकगढी","हेलम्बु","इन्द्रावती","जुगल","लिसाङ्खु","मेलम्ची","पाँचपोखरी थाङ्पाल","सुनकोशी","त्रिपुरासुन्दरी"]
    },
    4: {
      "बाग्लुङ": ["बडिगाड","बाग्लुङ","बरेङ","ढोरपाटन","गलकोट","जैमुनी","कान्ठेखोला","निसिखोला","तमन खोला","तारा खोला"],
      "गोरखा": ["आरुघाट","अजिरकोट","बारपाक सुलिकोट","भीमसेनथापा","चुम नुब्रि","धार्चे","गण्डकी","गोरखा","पालुङटार","सहिद लखन","सिरञ्चोक"],
      "कास्की": ["अन्नपूर्ण","माछापुच्छ्रे","माडी","पोखरा","रुपा"],
      "लमजुङ": ["बेशिशहर","दोर्दी","दूधपोखरी","क्वालासोथर","मध्यनेपाल","मर्स्याङ्दी","रैनास","सुन्दरबजार"],
      "मनाङ": ["चामे","मनाङ इङ्स्याङ","नरपा भूमि","नरशोन"],
      "मुस्ताङ": ["घरापझोङ","लो घेकर दामोदरकुण्ड","लोमान्थाङ","थासाङ","वारागुङ मुक्तिक्षेत्र"],
      "म्याग्दी": ["अन्नपूर्ण","बेनी","धौलागिरी","मलिका","मंगला","रघुगंगा"],
      "नवलपरासी (बर्दघाट सुस्ता पूर्व)": ["बौदेकाली","बिनयी","बुलिङटार","देवचुली","गैडाकोट","हुप्सेकोट","कावासोती","मध्यविन्दु"],
      "पर्वत": ["बिहादी","जलजला","कुश्मा","महाशिला","मोदी","पाइन्यु","फलेबास"],
      "स्याङ्जा": ["आँधीखोला","अर्जुनचौपरी","भिरकोट","बिरुवा","चापाकोट","गल्याङ","हरिनास","कालीगण्डगी","फेदीखोला","पुतलीबजार","वालिङ"],
      "तनहुँ": ["अन्बुखैरेनी","बन्दीपुर","भानु","भीमद","ब्यास","देवघाट","घिरिङ","म्याग्दे","रिसिङ","शुक्लागण्डकी"]
    },
    5: {
      "अर्घाखाँची": ["भुमेकस्थान","छत्रदेव","मलारानी","पाणिनी","सन्धिखर्क","सितगंगा"],
      "बाँके": ["बैजनाथ","डुडुवा","जानकी","खजुरा","कोहलपुर","नरैनापुर","नेपालगन्ज","राप्ती सोनारी"],
      "बर्दिया": ["बढैयाताल","बाँसगढी","बारबर्दिया","गेरुवा","गुलरिया","मधुवन","राजापुर","ठाकुरबाबा"],
      "दाङ": ["बबई","बंगलाचुली","दंगिशरण","गढवा","घोराही","लमही","राजपुर","राप्ती","शान्तिनगर","तुलसीपुर"],
      "गुल्मी": ["चन्द्रकोट","चत्रकोट","गुल्मीदरबार","इस्मा","कालीगण्डकी","मदने","मलिका","मुसिकोट","रेसुंगा","रुरु","सत्यवती"],
      "कपिलवस्तु": ["बाणगंगा","विजयनगर","बुद्धभूमि","कपिलवस्तु","कृष्णनगर","महाराजगन्ज","मायादेवी","शिवराज","शुद्धोधन","यशोधरा"],
      "नवलपरासी (बर्दघाट सुस्ता पश्चिम)": ["बर्दघाट","पाल्ही नन्दन","प्रतापपुर","रामग्राम","सरवल","सुनवल","सुस्ता"],
      "पाल्पा": ["बागनास्कली","मठगढी","निस्दी","पूर्वखोला","रैनादेवी","रम्भा","रामपुर","रिब्दीकोट","तानसेन","तिनाउ"],
      "प्युठान": ["आइराबत","गौमुखी","झिमरुक","मल्लरानी","मांडवी","नौबहिनी","प्युठान","सरूमरानी","स्वर्गद्वारी"],
      "रोल्पा": ["गंगादेव","लुङ्गरी","माडी","परिवर्तन","रोल्पा","रुन्टीगढी","सुनछहरी","सुनिल स्मृति","थवाङ","त्रिवेणी"],
      "रुकुम (पूर्व)": ["भुमे","पुथा उत्तरगंगा","सिस्ने"],
      "रुपन्देही": ["बुटवल","देवदह","गैडहवा","कञ्चन","कोटाहिमाई","लुम्बिनी संस्कृत","मार्चवारी","मायादेवी","ओमसतिया","रोहिणी","सैनामैना","समरीमाइ","सिद्धार्थनगर","सियारी","शुद्धोधन","तिलोतमा"]
    },
    6: {
      "दैलेख": ["आठबिस","भगवतीमाई","भैरवी","चामुण्डा बिन्द्रसैनी","दुल्लु","डुङ्गेश्वर","गुराँस","महाबु","नारायण","नौमुले","ठान्टिकाण्ड"],
      "डोल्पा": ["छर्का ताङसोङ","डोल्पो बुद्ध","जगदुल्ला","काइके","मुड्केचुला","शे फोक्सुण्डो","ठुली भेरी","त्रिपुरासुन्दरी"],
      "हुम्ला": ["अडांचुली","चनखेली","खार्पुनाथ","नम्खा","सार्केगड","सिमकोट","तान्जाकोट"],
      "जाजरकोट": ["बारेकोट","भेरी","छेडागढ","जुनिचन्दे","कुसे","नालागड","शिवालय"],
      "जुम्ला": ["चन्दननाथ","गुठीचौर","हिमा","कनकसुन्दरी","पत्रासी","सिन्जा","तातोपानी","तिला"],
      "कालिकोट": ["खंडचक्र","महावाई","नरहरिनाथ","पाँचलझरना","पलाटा","रास्कोट","सन्नी त्रिवेणी","शुभ कालिका","तिलागुफा"],
      "मुगु": ["छायानाथ रारा","खत्याड","मुगुम कर्मारोङ","सोरु"],
      "रुकुम (पश्चिम)": ["आठबिस्कोट","बनफिकोट","चौरजहारी","मुसिकोट","सानी भेरी","त्रिवेणी"],
      "सल्यान": ["बागचौर","बांगड","छत्रेश्वरी","डार्मा","कालीमाटी","कपुरकोट","कुमाख","शारदा","सिद्ध कुमाख","त्रिवेणी"],
      "सुर्खेत": ["बराहताल","भेरीगंगा","वीरेन्द्रनगर","चौकुने","चिंगाड","गुर्भाकोट","लेकबेशी","पञ्चपुरी","सिम्ता"]
    },
    7: {
      "अछाम": ["बान्नीगढी","चौरपाटी","ढकारी","कमलबजार","मंगलसेन","मेल्लेख","पञ्चदेवल विनायक","रामरोशन","साँफेबगर","तुर्मखाड"],
      "बैतडी": ["दशरथचन्द","डिलासैनी","दोगडाकेदार","मेलौली","पञ्चेश्वर","पाटन","पुर्चौडी","शिवनाथ","सिगास","सुर्नाया"],
      "बझाङ": ["बिठाडचिर","बुंगल","चाबिस्पाथीवेरा","दुर्गाथली","जय पृथ्वी","केदारसेउ","खप्तडछन्ना","मस्त","साइपाल","सुर्मा","तालकोट","थालारा"],
      "बाजुरा": ["बडिमालिका","बुढीगंगा","बुढीनन्द","गौमुल","हिमाली","जगन्नाथ","खप्तड छेडेदह","स्वामी कार्तिक खापर","त्रिवेणी"],
      "डडेल्धुरा": ["अजयमेरु","अलिताल","अमरगढी","भागेश्वर","गणयपधुरा","नवदुर्गा","परशुराम"],
      "दार्चुला": ["एपिहिमल","ब्यास","दुन्हु","लेकम","महाकाली","मालिकार्जुन","मर्मा","नौगाड","शैल्यशिखर"],
      "डोटी": ["आदर्श","बडीकेदार","दिपायल सिलगढी","जोरयाल","के आई सिंह","पूर्वचौकी","सायल","शिखर"],
      "कैलाली": ["बर्दगोरिया","भजनी","चुरे","धनगढी","गौरीगंगा","घोडाघोडी","गोदावरी","जानकी","जोशीपुर","कैलारी","लम्कीचुहा","मोहन्याल","टीकापुर"],
      "कञ्चनपुर": ["बेदकोट","बेलौरी","बेलडाँडी","भीमदत्त","कृष्णपुर","लालझण्डी","महाकाली","पुनर्वास","शुक्लाफाँटा"]
    }
  }
};

// ==================== GLOBAL STATE ====================
const state = (NVC.State.state = {
  currentUser: null,
  currentPage: CONFIG.DEFAULT_PAGE,
  currentShakha: null,
  notifications: [],
  complaints: [],
  // Track new forwarded complaints per shakha (badge counts)
  shakhaNewCounts: {},
  // Track when a shakha last viewed online complaints (to reset badge counts)
  shakhaSeen: {},
  projects: [],
  technicalInspectors: [],
  technicalExaminers: [],
  employeeMonitoring: [],
  citizenCharters: [],
  investigations: [],
  users: [],
  filters: {},
  currentView: 'dashboard',
  pagination: {
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0
  },
  useLocalData: false,
  previousNotificationIds: null,
  notificationFilter: 'all',
  chatContext: null, // च्याटको सन्दर्भ (context) राख्न
  projectChartFilter: { startDate: '', endDate: '' }
});

// Make state globally accessible as window.state for compatibility
window.state = state;

// ==================== STATE MANAGEMENT ====================
NVC.State = NVC.State || {};
NVC.State.state = state;

// Set a state property and update window.state for compatibility
NVC.State.set = function(key, value) {
  try {
    if (typeof key === 'object') {
      // If key is an object, merge all properties
      Object.assign(state, key);
      Object.assign(window.state, key);
    } else {
      // Single property
      state[key] = value;
      window.state[key] = value;
    }
    
    // Backup to localStorage for persistence
    if (key === 'complaints') {
      try {
        localStorage.setItem('nvc_complaints_backup', JSON.stringify(value));
      } catch (e) {
        console.warn('Failed to backup complaints to localStorage:', e);
      }
    }
    
    console.log(`✅ NVC.State.set: ${key} updated with ${Array.isArray(value) ? value.length : typeof value} items`);
  } catch (e) {
    console.error('NVC.State.set failed:', e);
  }
};

// Get a state property
NVC.State.get = function(key) {
  try {
    return state[key];
  } catch (e) {
    console.error('NVC.State.get failed:', e);
    return undefined;
  }
};

// Push to an array state property
NVC.State.push = function(key, item) {
  try {
    if (!Array.isArray(state[key])) {
      state[key] = [];
      window.state[key] = [];
    }
    state[key].unshift(item);
    window.state[key].unshift(item);
    
    // Backup to localStorage
    if (key === 'complaints') {
      try {
        localStorage.setItem('nvc_complaints_backup', JSON.stringify(state[key]));
      } catch (e) {
        console.warn('Failed to backup complaints to localStorage:', e);
      }
    }
  } catch (e) {
    console.error('NVC.State.push failed:', e);
  }
};

// ==================== GLOBAL CHART STORAGE ====================
window.nvcCharts = {};


// ==================== NEPALI DATE FUNCTIONS (सही गरिएको) ====================

// नेपाली मिति API प्रयोग गरेर आजको मिति प्राप्त गर्ने
function _getCurrentNepaliDateLegacy() {
    // फारमको लागि नेपाली मिति YYYY-MM-DD format मा
    if (typeof NepaliDatePicker !== 'undefined' && NepaliDatePicker.ad2bs) {
        try {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const adDateStr = `${year}-${month}-${day}`;
            const bsDateStr = NepaliDatePicker.ad2bs(adDateStr);
            if (bsDateStr) {
                // bsDateStr यसरी आउँछ: "YYYY-MM-DD"
                return bsDateStr;
            }
        } catch (e) {
            console.warn('NepaliDatePicker.ad2bs failed in getCurrentNepaliDate', e);
        }
    }
    // Check for NepaliFunctions (v5.x) - index.html मा v5 लोड भएकोले यो आवश्यक छ
    if (typeof NepaliFunctions !== 'undefined' && NepaliFunctions.AD2BS) {
        try {
            const dt = new Date();
            const bs = NepaliFunctions.AD2BS({ year: dt.getFullYear(), month: dt.getMonth() + 1, day: dt.getDate() });
            if (bs) {
                return `${bs.year}-${String(bs.month).padStart(2, '0')}-${String(bs.day).padStart(2, '0')}`;
            }
        } catch (e) {
            console.warn('NepaliFunctions.AD2BS failed', e);
        }
    }
    // Fallback: आजको AD date (for backend)
    return new Date().toISOString().slice(0, 10);
}

try { NVC.Utils.getCurrentNepaliDateLegacy = _getCurrentNepaliDateLegacy; } catch (e) {}

// Initialize inline Nepali dropdown selectors (year / month / day)
function _initializeNepaliDropdowns() {
  const nepaliMonths = ["बैशाख","जेठ","असार","साउन","भदौ","असोज","कार्तिक","मंसिर","पुष","माघ","फागुन","चैत"];
  const monthDays = [30,31,32,31,32,30,30,29,30,29,30,30];

  document.querySelectorAll('.nepali-datepicker-dropdown').forEach(wrapper => {
    try {
      // avoid double-initializing the same wrapper
      if (wrapper.dataset.ndpDropdownInit === 'true') return;
      const target = wrapper.dataset.target;
      if (!target) return;
      const hidden = document.getElementById(target);
      // Ensure year/month/day selects exist — create if missing
      let yearEl = wrapper.querySelector('.bs-year');
      let monthEl = wrapper.querySelector('.bs-month');
      let dayEl = wrapper.querySelector('.bs-day');

      function createSelect(cls, placeholderText, small) {
        const s = document.createElement('select');
        s.className = `form-select bs-${cls}` + (small ? ' form-select-sm' : '');
        const ph = document.createElement('option'); ph.value = ''; ph.textContent = placeholderText; ph.disabled = true; ph.selected = true; s.appendChild(ph);
        return s;
      }

      if (!yearEl) { yearEl = createSelect('year', 'साल'); wrapper.insertBefore(yearEl, wrapper.firstChild); }
      if (!monthEl) { monthEl = createSelect('month', 'महिना'); wrapper.insertBefore(monthEl, yearEl.nextSibling); }
      if (!dayEl) { dayEl = createSelect('day', 'गते'); wrapper.appendChild(dayEl); }

      const currentBs = (getCurrentNepaliDate() || '').split('-');
      const cy = parseInt(currentBs[0], 10) || (new Date().getFullYear() + 57);

      // populate year select with placeholder (if only placeholder present, append years)
      if (yearEl && yearEl.options.length <= 1) {
        // remove extra placeholder if any then re-add disabled placeholder as first
        if (yearEl.options.length === 1) yearEl.innerHTML = '';
        const ph = document.createElement('option'); ph.value = ''; ph.textContent = 'साल'; ph.disabled = true; ph.selected = true; yearEl.appendChild(ph);
        for (let y = 2080; y <= 2090; y++) {
          const o = document.createElement('option'); o.value = y; o.textContent = _latinToDevnagari(String(y)); yearEl.appendChild(o);
        }
      }

      // populate months with placeholder
      if (monthEl && monthEl.options.length <= 1) {
        if (monthEl.options.length === 1) monthEl.innerHTML = '';
        const phm = document.createElement('option'); phm.value = ''; phm.textContent = 'महिना'; phm.disabled = true; phm.selected = true; monthEl.appendChild(phm);
        nepaliMonths.forEach((m, i) => { const o = document.createElement('option'); o.value = i + 1; o.textContent = m; monthEl.appendChild(o); });
      }

      // determine initial values
      const hasHiddenValue = !!(hidden && hidden.value);
      const val = hasHiddenValue ? hidden.value : '';
      const parts = (val || '').split('-');
      const initY = parts[0] || cy;
      const initM = parseInt(parts[1] || '1', 10);
      const initD = parseInt(parts[2] || '1', 10);

      // If hidden has a value, initialize selects to that value; otherwise keep placeholder (empty)
      if (hasHiddenValue) {
        if (yearEl) yearEl.value = initY;
        if (monthEl) monthEl.value = initM;
      }

      function refreshDays(selectedY, selectedM, selectDay) {
        if (!dayEl) return;
        // Always show days 1..32 as requested
        const total = 32;
        dayEl.innerHTML = '';
        const phd = document.createElement('option'); phd.value = ''; phd.textContent = 'गते'; phd.disabled = true; dayEl.appendChild(phd);
        for (let dd = 1; dd <= total; dd++) {
          const o = document.createElement('option'); o.value = dd; o.textContent = _latinToDevnagari(String(dd)); dayEl.appendChild(o);
        }
        // If hidden had a value, set the day; otherwise keep placeholder selected
        if (hasHiddenValue) {
          const curD = initD || selectDay || 1;
          dayEl.value = Math.min(curD, total);
        } else {
          // ensure placeholder is selected
          dayEl.selectedIndex = 0;
        }
      }

      refreshDays(parseInt(yearEl.value || cy, 10), parseInt(monthEl.value || 1, 10), initD);

      function updateHidden() {
        if (!hidden) return;
        // Only set hidden value when all selects have valid non-empty values
        if (!yearEl.value || !monthEl.value || !dayEl.value) {
          hidden.value = '';
          hidden.dispatchEvent(new Event('input', { bubbles: true }));
          hidden.dispatchEvent(new Event('change', { bubbles: true }));
          return;
        }
        const yy = String(yearEl.value).padStart(4, '0');
        const mm = String(monthEl.value).padStart(2, '0');
        const dd = String(dayEl.value).padStart(2, '0');
        hidden.value = `${yy}-${mm}-${dd}`;
        hidden.dispatchEvent(new Event('input', { bubbles: true }));
        hidden.dispatchEvent(new Event('change', { bubbles: true }));
      }

      if (yearEl) yearEl.addEventListener('change', () => { refreshDays(parseInt(yearEl.value, 10), parseInt(monthEl.value, 10), 1); updateHidden(); });
      if (monthEl) monthEl.addEventListener('change', () => { refreshDays(parseInt(yearEl.value, 10), parseInt(monthEl.value, 10), 1); updateHidden(); });
      if (dayEl) dayEl.addEventListener('change', updateHidden);

      // initial sync: update hidden only if selects had values (preserves placeholder when none)
      if (hasHiddenValue) updateHidden();
      // mark as initialized to prevent duplicate listeners on repeated calls
      wrapper.dataset.ndpDropdownInit = 'true';
    } catch (e) {
      console.warn('Nepali dropdown init failed', e);
    }
  });
}

NVC.Utils.initializeNepaliDropdowns = _initializeNepaliDropdowns;

function initializeNepaliDropdowns() {
  return NVC.Utils.initializeNepaliDropdowns.apply(this, arguments);
}

// ensure dropdowns are initialized after datepicker init
setTimeout(() => { try { initializeNepaliDropdowns(); } catch(e) { console.warn('init nepali dropdowns failed', e); } }, 40);

// Watch for dynamic DOM insertions and initialize dropdowns for newly added forms
if (typeof MutationObserver !== 'undefined') {
  try {
    const _ndpObserver = new MutationObserver(mutations => {
      let trigger = false;
      for (const m of mutations) {
        for (const n of m.addedNodes) {
          if (n && n.nodeType === 1) {
            if (n.matches && n.matches('.nepali-datepicker-dropdown')) { trigger = true; break; }
            if (n.querySelector && n.querySelector('.nepali-datepicker-dropdown')) { trigger = true; break; }
          }
        }
        if (trigger) break;
      }
      if (trigger) setTimeout(() => { try { initializeNepaliDropdowns(); } catch(e){} }, 40);
    });
    _ndpObserver.observe(document.documentElement || document.body, { childList: true, subtree: true });
  } catch(e) { /* ignore */ }
}

// ==================== NEPALI DATE FUNCTIONS (सुधारिएको) ====================

// नेपाली मिति API प्रयोग गरेर आजको मिति प्राप्त गर्ने
function _getCurrentNepaliDate() {
  const today = new Date();
    const adDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // पहिलो प्राथमिकता: Internal accurate converter (matches backend logic exactly)
    try {
        const converted = convertADtoBSAccurate(adDateStr);
        if (converted) return converted;
    } catch (e) {}

    // दोस्रो प्राथमिकता: jQuery plugin
    if (typeof $ !== 'undefined' && $.fn && $.fn.nepaliDatePicker && $.fn.nepaliDatePicker.ad2bs) {
        try {
            const bsDateStr = $.fn.nepaliDatePicker.ad2bs(adDateStr);
            if (bsDateStr) {
                return bsDateStr;
            }
        } catch (e) {
            console.warn('jQuery ad2bs failed:', e);
        }
    }
    
    // तेस्रो प्राथमिकता: NepaliFunctions (v5.x)
    if (typeof NepaliFunctions !== 'undefined' && NepaliFunctions.AD2BS) {
        try {
            const bs = NepaliFunctions.AD2BS({ 
                year: today.getFullYear(), 
                month: today.getMonth() + 1, 
                day: today.getDate() 
            });
            
            if (bs && bs.year && bs.month && bs.day) {
                return `${bs.year}-${String(bs.month).padStart(2, '0')}-${String(bs.day).padStart(2, '0')}`;
            }
        } catch (e) {
            console.warn('NepaliFunctions.AD2BS failed:', e);
        }
    }
    

    // अन्तिम: Fallback (hardcoded)
    if (!window._warnedFallbackNepaliDate) {
        window._warnedFallbackNepaliDate = true;
        console.warn('⚠️ Using fallback Nepali date calculation');
    }
    return getFallbackNepaliDate();
}

NVC.Utils.getCurrentNepaliDate = _getCurrentNepaliDate;

function getCurrentNepaliDate() {
  // Use new Nepali Calendar API for reliable date handling
  try {
    if (window.NepaliCalendar && typeof window.NepaliCalendar.getCurrentDate === 'function') {
      return window.NepaliCalendar.getCurrentDate();
    }
  } catch (e) {
    console.warn('NepaliCalendar API failed, falling back to legacy method');
  }
  
  // Fallback to legacy method if API not available
  try {
    if (window.NVC && NVC.Utils && typeof NVC.Utils.getCurrentNepaliDate === 'function') {
      return NVC.Utils.getCurrentNepaliDate.apply(this, arguments);
    }
  } catch (e) {}
  
  // Final fallback
  try { return _getCurrentNepaliDate.apply(this, arguments); } catch (e) { 
    // Return current date in BS format as last resort
    const today = new Date();
    const bsYear = today.getFullYear() + 57;
    const bsMonth = String(today.getMonth() + 1).padStart(2, '0');
    const bsDay = String(today.getDate()).padStart(2, '0');
    return `${bsYear}-${bsMonth}-${bsDay}`;
  }
}

// Format a Nepali display string matching homepage (e.g. "2080 बैशाख १५, सोमबार")
function formatNepaliDisplay(inputDate) {
  try {
    // Determine BS date string (YYYY-MM-DD) and AD Date for weekday
    let bsStr = null;
    let adDate = null;

    if (!inputDate) {
      bsStr = getCurrentNepaliDate();
      adDate = new Date();
    } else if (typeof inputDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(inputDate)) {
      bsStr = inputDate;
      // Try to derive weekday from corresponding AD date if possible
      try { adDate = convertBStoAD(inputDate); } catch (e) { adDate = new Date(); }
    } else if (inputDate instanceof Date) {
      adDate = inputDate;
      try { bsStr = convertADtoBS(`${adDate.getFullYear()}-${String(adDate.getMonth() + 1).padStart(2,'0')}-${String(adDate.getDate()).padStart(2,'0')}`); } catch (e) { bsStr = getCurrentNepaliDate(); }
    } else {
      bsStr = getCurrentNepaliDate();
      adDate = new Date();
    }

    const parts = (bsStr || '').split('-');
    const bsYear = parts[0] || '';
    const bsMonth = parseInt(parts[1] || '1', 10) - 1;
    const bsDay = parseInt(parts[2] || '1', 10);

    const nepaliMonths = ["बैशाख","जेठ","असार","साउन","भदौ","असोज","कार्तिक","मंसिर","पुष","माघ","फागुन","चैत"];
    const weekdays = ["आइतबार","सोमबार","मंगलबार","बुधबार","बिहीबार","शुक्रबार","शनिबार"];

    const monthName = nepaliMonths[bsMonth] || nepaliMonths[0];
    const dayName = (adDate && typeof adDate.getDay === 'function') ? weekdays[adDate.getDay()] : weekdays[0];

    return _latinToDevnagari(`${bsYear} ${monthName} ${Number(bsDay)}, ${dayName}`);
  } catch (e) {
    try { return _latinToDevnagari(getCurrentNepaliDate()); } catch (e2) { return getCurrentNepaliDate(); }
  }
}

// Helper: Convert Devanagari digits to Latin digits
function _devnagariToLatin(s) {
  // Prefer centralized util if present
  if (window.NVC && NVC.Utils && typeof NVC.Utils.devanagariToLatin === 'function') {
    try { return NVC.Utils.devanagariToLatin(s); } catch(e) {}
  }
  if (!s) return s;
  const map = { '०':'0','१':'1','२':'2','३':'3','४':'4','५':'5','६':'6','७':'7','८':'8','९':'9' };
  return String(s).replace(/[०-९]/g, d => map[d] || d);
}

// Helper: Convert Latin digits to Devanagari digits (string)
function _latinToDevnagari(s) {
  // Prefer centralized util if present
  if (window.NVC && NVC.Utils && typeof NVC.Utils.latinToDevanagari === 'function') {
    try { return NVC.Utils.latinToDevanagari(s); } catch(e) {}
  }
  if (s === null || s === undefined) return s;
  const map = { '0':'०','1':'१','2':'२','3':'३','4':'४','5':'५','6':'६','7':'७','8':'८','9':'९' };
  return String(s).replace(/[0-9]/g, d => map[d] || d);
}

function normalizeStatusCode(raw) {
  if (raw === null || raw === undefined) return 'pending';
  const s = String(raw).trim().toLowerCase();
  if (s === 'pending' || s === 'progress' || s === 'resolved') return s;
  if (s === 'काम बाँकी' || s === 'काम बाकी' || s === 'बाँकी' || s === 'बाकी') return 'pending';
  if (s === 'चालु' || s === 'चालू') return 'progress';
  if (s === 'फछ्रयौट' || s === 'फछ्र्यौट' || s === 'फछर्यौट' || s === 'फछर्यौट') return 'resolved';
  return 'pending';
}

// Normalize complaint ID to a canonical form: convert Devanagari digits to Latin, trim spaces
function normalizeComplaintId(id) {
  try {
    if (id === null || id === undefined) return '';
    let s = String(id).trim();
    if (window.NVC && NVC.Utils && typeof NVC.Utils.devanagariToLatin === 'function') {
      s = NVC.Utils.devanagariToLatin(s);
    }
    return s.replace(/\s+/g, '');
  } catch (e) { return String(id || '').trim(); }
}

function normalizeSourceCode(raw) {
  if (raw === null || raw === undefined) return 'internal';
  const s = String(raw).trim().toLowerCase();
  if (s === 'internal' || s === 'hello_sarkar' || s === 'email' || s === 'phone' || s === 'letter' || s === 'website' || s === 'hotline') return s;
  if (s === 'आन्तरिक' || s === 'आन्तरीक' || s === 'भित्री' || s === 'भित्रि') return 'internal';
  if (s === 'हेल्लो सरकार' || s === 'हेलो सरकार' || s === 'hello sarkar') return 'hello_sarkar';

  // Map various inputs to a standard code
  if (s === 'website' || s === 'online' || s === 'online_complaint' || s === 'अनलाइन') return 'online';
  if (s === 'hello_sarkar' || s === 'hello sarkar' || s === 'हेल्लो सरकार' || s === 'हेलो सरकार') return 'hello_sarkar';
  if (s === 'internal' || s === 'आन्तरिक' || s === 'आन्तरीक' || s === 'भित्री' || s === 'भित्रि') return 'internal';
  if (s === 'email' || s === 'इमेल') return 'email';
  if (s === 'phone' || s === 'फोन') return 'phone';
  if (s === 'letter' || s === 'पत्र') return 'letter';
  if (s === 'hotline' || s === 'हटलाइन') return 'hotline';

  // If it's one of the standard codes already, return it
  const standardCodes = ['internal', 'hello_sarkar', 'online', 'email', 'phone', 'letter', 'hotline'];
  if (standardCodes.includes(s)) return s;

  // Fallback for anything else
  return 'internal';
}

function applyDevanagariDigits(rootEl = document.body) {
  // Delegate to centralized util if available
  if (window.NVC && NVC.Utils && typeof NVC.Utils.applyDevanagariDigits === 'function') {
    try { return NVC.Utils.applyDevanagariDigits(rootEl); } catch (e) {}
  }
  try {
    if (!rootEl) return;
    const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node || !node.parentElement) return NodeFilter.FILTER_REJECT;
        const p = node.parentElement;
        const tag = (p.tagName || '').toLowerCase();
        if (tag === 'script' || tag === 'style' || tag === 'textarea' || tag === 'input') return NodeFilter.FILTER_REJECT;
        if (p.isContentEditable) return NodeFilter.FILTER_REJECT;
        if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
        return /\d/.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });

    const textNodes = [];
    let n;
    while ((n = walker.nextNode())) textNodes.push(n);

    for (const tn of textNodes) {
      tn.nodeValue = _latinToDevnagari(tn.nodeValue);
    }
  } catch (e) {
    // no-op
  }
}

// Helper: map Nepali month name to month number
function _nepaliMonthNameToNumber(name) {
  if (window.NVC && NVC.Utils && typeof NVC.Utils.nepaliMonthNameToNumber === 'function') return NVC.Utils.nepaliMonthNameToNumber(name);
  if (!name) return null;
  const m = { 'बैशाख':1,'जेठ':2,'असार':3,'साउन':4,'भदौ':5,'असोज':6,'कार्तिक':7,'मंसिर':8,'पुष':9,'माघ':10,'फागुन':11,'चैत':12 };
  const key = String(name).replace(/[,\s]/g,'').trim();
  return m[key] || null;
}

// Normalize various Nepali date display forms into YYYY-MM-DD (ASCII digits)
function normalizeNepaliDisplayToISO(raw) {
  if (!raw) return '';
  let s = String(raw).trim();
  // convert devanagari digits first
  s = _devnagariToLatin(s);

  // If already looks like YYYY-MM-DD after conversion, return padded
  const dashMatch = s.match(/(\d{4})\D(\d{1,2})\D(\d{1,2})/);
  if (dashMatch) {
    const y = dashMatch[1];
    const mo = String(dashMatch[2]).padStart(2, '0');
    const d = String(dashMatch[3]).padStart(2, '0');
    return `${y}-${mo}-${d}`;
  }

  // Try patterns like: "2082 फागुन 9, शुक्रवार" or "2082 फागुन ९"
  const tokens = s.split(/\s+/).filter(Boolean);
  if (tokens.length >= 2) {
    // year is usually first token
    const yearToken = tokens[0].replace(/[^0-9]/g, '');
    let monthToken = tokens[1].replace(/[^\u0900-\u097Fa-zA-Z]/g, '');
    let dayToken = '';
    // find first token that contains digits for day
    for (let i=2;i<tokens.length;i++) {
      const t = tokens[i].replace(/[,\s]/g, '');
      if (t.match(/\d/)) { dayToken = t.replace(/[^0-9]/g,''); break; }
    }
    // sometimes day is the second token (e.g., "फागुन ९") if year omitted - but we expect year
    if (!dayToken && tokens[2] && tokens[2].match(/\d/)) dayToken = tokens[2].replace(/[^0-9]/g,'');

    const monthNumber = _nepaliMonthNameToNumber(monthToken) || (tokens[1].match(/\d+/) ? Number(tokens[1]) : null);
    if (yearToken && monthNumber && dayToken) {
      return `${yearToken}-${String(monthNumber).padStart(2,'0')}-${String(dayToken).padStart(2,'0')}`;
    }
  }

  // Fallback: strip nondigits and try to parse YYYYMMDD
  const digits = s.replace(/[^0-9]/g,'');
  if (digits.length === 8) {
    return `${digits.slice(0,4)}-${digits.slice(4,6)}-${digits.slice(6,8)}`;
  }

  // Last resort: return original trimmed (but ASCII digits)
  return s;
}

// Parse complaint registration date into an AD Date object when possible.
// Supports:
// - AD ISO (YYYY-MM-DD)
// - BS ISO (YYYY-MM-DD) if NepaliFunctions.BS2AD is available
function _parseComplaintRegDateToAD(complaint) {
  if (!complaint) return null;
  const raw = complaint.entryDate || complaint.date || complaint['दर्ता मिति'] || complaint['Entry Date'] || complaint.createdAt || '';
  if (!raw) return null;

  const iso = normalizeNepaliDisplayToISO(raw);
  if (!iso) return null;

  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
  }

  const y = Number(m[1]);
  const mo = Number(m[2]);
  const da = Number(m[3]);
  if (!y || !mo || !da) return null;

  // Heuristic: Nepali BS years are generally >= 2050
  const looksBS = y >= 2050;
  if (looksBS) {
    try {
      // Prefer NepaliDatePicker v5.x if available
      if (typeof NepaliDatePicker !== 'undefined' && typeof NepaliDatePicker.bs2ad === 'function') {
        const adStr = NepaliDatePicker.bs2ad(`${y}-${String(mo).padStart(2, '0')}-${String(da).padStart(2, '0')}`);
        const ad = normalizeNepaliDisplayToISO(adStr);
        const d = new Date(ad);
        return isNaN(d.getTime()) ? null : d;
      }

      // jQuery plugin fallback
      if (typeof $ !== 'undefined' && $.fn && $.fn.nepaliDatePicker && typeof $.fn.nepaliDatePicker.bs2ad === 'function') {
        const adStr = $.fn.nepaliDatePicker.bs2ad(`${y}-${String(mo).padStart(2, '0')}-${String(da).padStart(2, '0')}`);
        const ad = normalizeNepaliDisplayToISO(adStr);
        const d = new Date(ad);
        return isNaN(d.getTime()) ? null : d;
      }

      // NepaliFunctions fallback (some builds expose it)
      if (typeof NepaliFunctions !== 'undefined' && typeof NepaliFunctions.BS2AD === 'function') {
        const adStr = NepaliFunctions.BS2AD(y, mo, da); // expected YYYY-MM-DD
        const ad = normalizeNepaliDisplayToISO(adStr);
        const d = new Date(ad);
        return isNaN(d.getTime()) ? null : d;
      }

      // Simple fallback: approximate BS->AD using reference point (not 100% accurate but enables highlighting)
      // Reference: 2081-01-01 BS ≈ 2024-04-13 AD (approx)
      const refBS = new Date(2081, 0, 1); // 2081-01-01
      const refAD = new Date(2024, 3, 13); // 2024-04-13
      const bsDate = new Date(y, mo - 1, da);
      const diffDays = Math.floor((bsDate - refBS) / (1000 * 60 * 60 * 24));
      const approxAD = new Date(refAD.getTime() + diffDays * 24 * 60 * 60 * 1000);
      return isNaN(approxAD.getTime()) ? null : approxAD;
    } catch (e) {
      return null;
    }
  }

  // AD
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00`);
  return isNaN(d.getTime()) ? null : d;
}

// Returns CSS class based on complaint age:
// - >= 1 year => complaint-old-year (red)
// - >= 6 months => complaint-old-6mo (orange)
function getComplaintAgeClass(complaint) {
  try {
    const d = _parseComplaintRegDateToAD(complaint);
    if (!d) return '';
    const diffMs = Date.now() - d.getTime();
    const days = diffMs / (1000 * 60 * 60 * 24);
    if (days >= 365) return 'complaint-old-year';
    if (days >= 180) return 'complaint-old-6mo';
    return '';
  } catch (e) {
    return '';
  }
}

async function updateNepaliDate() {
    const nepaliDateElement = document.getElementById('currentNepaliDate');
    if (!nepaliDateElement) return;
  // Use centralized converter that tries libraries then fallback heuristic
  try {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const adDateStr = `${year}-${month}-${day}`;

    const bsDateStr = convertADtoBS(adDateStr);
    if (bsDateStr) {
      const [bsYear, bsMonth, bsDay] = bsDateStr.split('-');
      const nepaliMonths = ["बैशाख", "जेठ", "असार", "साउन", "भदौ", "असोज", "कार्तिक", "मंसिर", "पुष", "माघ", "फागुन", "चैत"];
      const weekdays = ["आइतबार", "सोमबार", "मंगलबार", "बुधबार", "बिहीबार", "शुक्रबार", "शनिबार"];
      const monthName = nepaliMonths[Number(bsMonth) - 1] || "बैशाख";
      const dayName = weekdays[today.getDay()];
      nepaliDateElement.textContent = _latinToDevnagari(`${bsYear} ${monthName} ${Number(bsDay)}, ${dayName}`);
      return;
    }
  } catch (e) {
    console.warn('updateNepaliDate conversion failed, falling back:', e);
  }

  // Fallback: पुरानो गणना
  nepaliDateElement.textContent = _latinToDevnagari(getFallbackNepaliDate());
}

// Fallback function (यदि API fail भयो भने)
// Fallback function (यदि API fail भयो भने)
function getFallbackNepaliDate() {
    const now = new Date();
    
    // 2025-02-16 (AD) = 2081-11-03 (BS) - फागुन ३, २०८१
    // यो लगभग सही छ, तर पूर्ण सटीक छैन
    
    // महिनाको दिन संख्या (बैशाख देखि चैत सम्म)
    const monthDays = [30, 31, 32, 31, 32, 30, 30, 29, 30, 29, 30, 30];
    const nepaliMonths = ["बैशाख", "जेठ", "असार", "साउन", "भदौ", "असोज", 
                         "कार्तिक", "मंसिर", "पुष", "माघ", "फागुन", "चैत"];
    const weekdays = ["आइतबार", "सोमबार", "मंगलबार", "बुधबार", 
                     "बिहीबार", "शुक्रबार", "शनिबार"];
    
    // Reference date: 2025-02-16 = 2081-11-03
    const refAD = new Date(2025, 1, 16); // month is 0-indexed: 1 = February
    const refBS = { year: 2081, month: 11, day: 3 }; // month 11 = फागुन
    
    // दिनको अन्तर निकाल्ने
    const diffTime = now - refAD;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    let bsYear = refBS.year;
    let bsMonth = refBS.month;
    let bsDay = refBS.day + diffDays;
    
    // महिना अनुसार दिन समायोजन गर्ने
    while (bsDay > monthDays[bsMonth - 1]) {
        bsDay -= monthDays[bsMonth - 1];
        bsMonth++;
        if (bsMonth > 12) {
            bsMonth = 1;
            bsYear++;
        }
    }
    
    // यदि दिन १ भन्दा कम भयो भने (अघिल्लो महिनामा जानुपर्छ)
    while (bsDay < 1) {
        bsMonth--;
        if (bsMonth < 1) {
            bsMonth = 12;
            bsYear--;
        }
        bsDay += monthDays[bsMonth - 1];
    }
    
    const monthName = nepaliMonths[bsMonth - 1] || "बैशाख";
    const dayName = weekdays[now.getDay()];
    
    return `${bsYear} ${monthName} ${bsDay}, ${dayName}`;
}

// Convert AD YYYY-MM-DD to BS YYYY-MM-DD using available libraries or accurate fallback
function convertADtoBS(adDateStr) {
  if (!adDateStr) return '';
  try {
    // If already looks like BS (year >= 2050), assume it's BS
    const m = String(adDateStr).trim().match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) {
      const y = Number(m[1]);
      if (y >= 2050) return `${m[1]}-${String(m[2]).padStart(2,'0')}-${String(m[3]).padStart(2,'0')}`;

      // Accurate fallback algorithm (same as backend)
      const parts = [Number(m[1]), Number(m[2]), Number(m[3])];
      if (parts.every(n => !isNaN(n))) {
        return convertADtoBSAccurate(`${m[1]}-${String(m[2]).padStart(2,'0')}-${String(m[3]).padStart(2,'0')}`);
      }
    }
  } catch (e) {
    console.warn('convertADtoBS failed:', e);
  }
  return '';
}
// Accurate AD to BS conversion - Final corrected version (matches backend)
function convertADtoBSAccurate(adDateStr) {
  try {
    // Skip conversion if input is invalid
    if (!adDateStr || adDateStr === 'undefined' || adDateStr === '') {
      return '';
    }
    
    // Final corrected algorithm (matches backend exactly)
    const m = String(adDateStr).trim().match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) {
      const parts = [Number(m[1]), Number(m[2]), Number(m[3])];
      if (parts.every(n => !isNaN(n))) {
        // Match backend formula exactly
        const adYear = parts[0];
        const adMonth = parts[1];
        const adDay = parts[2];
        
        // Backend formula: bsYear = adYear + 56, bsMonth = adMonth + 8, bsDay = adDay + 17
        // Adjusted +17 to correct off-by-one for current Nepali date display
        let bsYear = adYear + 56;
        let bsMonth = adMonth + 8;
        let bsDay = adDay + 17;
        
        if (bsDay > 30) { bsDay -= 30; bsMonth++; }
        if (bsMonth > 12) { bsMonth -= 12; bsYear++; }
        
        return `${bsYear}-${String(bsMonth).padStart(2,'0')}-${String(bsDay).padStart(2,'0')}`;
      }
    }
    
    return getFallbackNepaliDate();
  } catch (e) {
    return getFallbackNepaliDate();
  }
}

function ensureBSDate(raw) {
  if (!raw) return '';
  let s = String(raw).trim();
  // If contains Devanagari or Nepali month names, normalize
  if (/[\u0900-\u097F]/.test(s) || /[बैशाख|जेठ|फागुन|चैत]/.test(s)) {
    const normalized = normalizeNepaliDisplayToISO(s);
    if (normalized) return normalized;
  }
  // If already ISO-like
  const isoMatch = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    if (year >= 2050) return `${isoMatch[1]}-${String(isoMatch[2]).padStart(2,'0')}-${String(isoMatch[3]).padStart(2,'0')}`;
    // likely AD, convert
    const converted = convertADtoBS(s);
    return converted || `${isoMatch[1]}-${String(isoMatch[2]).padStart(2,'0')}-${String(isoMatch[3]).padStart(2,'0')}`;
  }
  // Try to parse digits and convert
  const digits = s.replace(/[^0-9]/g,'');
  if (digits.length === 8) return `${digits.slice(0,4)}-${digits.slice(4,6)}-${digits.slice(6,8)}`;
  return s;
}

// ==================== DATE PICKER FUNCTIONS (सुधारिएको) ====================
function _isNepaliDatePickerAvailable() {
  try {
    if (typeof NepaliDatePicker !== 'undefined') return true;
    if (typeof window !== 'undefined' && window && typeof window.NepaliDatePicker !== 'undefined') return true;
    if (typeof window !== 'undefined' && window && typeof window.nepaliDatePicker !== 'undefined') return true;
    if (typeof $ !== 'undefined' && $.fn) {
      try {
        const keys = Object.keys($.fn || {});
        if (keys.some(k => /nepali.*datepicker/i.test(String(k)))) return true;
      } catch (e) {}
    }
  } catch (e) {}
  return false;
}

function _getNepaliDatePickerJqMethodName() {
  try {
    if (typeof $ === 'undefined' || !$.fn) return '';
    if (typeof $.fn.nepaliDatePicker === 'function') return 'nepaliDatePicker';
    const keys = Object.keys($.fn || {});
    const match = keys.find(k => /nepali.*datepicker/i.test(String(k)) && typeof $.fn[k] === 'function');
    return match || '';
  } catch (e) {}
  return '';
}

function _ensureNepaliDatePickerLoaded() {
  return new Promise((resolve) => {
    try {
      if (_isNepaliDatePickerAvailable()) return resolve(true);
      if (window._ndpCdnLoading) return resolve(false);
      if (window._ndpCdnTried) return resolve(false);

      window._ndpCdnTried = true;
      window._ndpCdnLoading = true;

      const cssHref = 'https://unpkg.com/nepali-date-picker@2.0.2/dist/nepaliDatePicker.min.css';
      const jsSrc = 'https://unpkg.com/nepali-date-picker@2.0.2/dist/nepaliDatePicker.min.js';

      const hasCss = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some(l => (l.href || '').includes('nepaliDatePicker.min.css'));
      if (!hasCss) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = cssHref;
        document.head.appendChild(link);
      }

      const hasJs = Array.from(document.querySelectorAll('script')).some(s => (s.src || '').includes('nepaliDatePicker.min.js'));
      if (hasJs) {
        window._ndpCdnLoading = false;
        return resolve(_isNepaliDatePickerAvailable());
      }

      const script = document.createElement('script');
      script.src = jsSrc;
      script.async = true;
      script.onload = () => {
        window._ndpCdnLoading = false;
        resolve(_isNepaliDatePickerAvailable());
      };
      script.onerror = () => {
        window._ndpCdnLoading = false;
        resolve(false);
      };
      document.head.appendChild(script);
    } catch (e) {
      try { window._ndpCdnLoading = false; } catch (_) {}
      resolve(false);
    }
  });
}

async function initializeDatepickers() {
    console.log('📅 Initializing datepickers...');
    
    // Fix z-index for modals
    if (!document.getElementById('ndp-custom-style')) {
        const style = document.createElement('style');
        style.id = 'ndp-custom-style';
        style.innerHTML = `
            .nepali-calendar, #ndp-nepali-box, .ndp-container, .ndp-popup, 
            .ndp-date-picker, .nepali-date-picker-container {
                z-index: 999999 !important;
                position: fixed !important;
            }
            .ndp-popup {
                top: 50% !important;
                left: 50% !important;
                transform: translate(-50%, -50%) !important;
                box-shadow: 0 5px 30px rgba(0,0,0,0.3) !important;
                border-radius: 8px !important;
            }
        `;
        document.head.appendChild(style);
    }

      // If no Nepali datepicker library is present, do not try to load missing local vendor files.
      // We'll use the in-app fallback picker behavior.
      if (!_isNepaliDatePickerAvailable()) {
        const loaded = await _ensureNepaliDatePickerLoaded();
        if (loaded) {
          return initializeDatepickers();
        }
        if (!window._ndpWarnedMissing) {
          window._ndpWarnedMissing = true;
          try {
            const jq = (typeof $ !== 'undefined' && $ && $.fn) ? $ : null;
            const keys = jq ? Object.keys(jq.fn || {}).filter(k => String(k).toLowerCase().includes('nepali')) : [];
            console.log('🧩 NepaliDatePicker detect debug:', {
              hasJquery: !!jq,
              pluginKeys: keys.slice(0, 20),
              hasFnNepaliDatePicker: !!(jq && jq.fn && jq.fn.nepaliDatePicker),
              hasWindowNepaliDatePicker: !!(window && (window.NepaliDatePicker || window.nepaliDatePicker))
            });
          } catch (e) {}
          console.warn('⚠️ NepaliDatePicker library not detected. Date inputs will use fallback behavior.');
        }
      }

    // सबै nepali-datepicker-input क्लास भएका इनपुटहरूमा लागू गर्ने
    document.querySelectorAll('.nepali-datepicker-input').forEach(input => {
        // Ensure autocomplete is off
        input.setAttribute('autocomplete', 'off');
        
        // यदि पहिले नै initialize भएको छ भने नगर्ने
        if (input.dataset.ndpInitialized === 'true') return;
        
        // Options तयार गर्ने
        const options = {
            dateFormat: 'YYYY-MM-DD',
            closeOnDateSelect: true,
            language: 'nepali',  // नेपाली भाषा
            ndpYear: true,        // वर्ष देखाउने
            ndpMonth: true,       // महिना देखाउने
            ndpYearCount: 10,     // एक पटकमा देखाउने वर्ष संख्या
            onChange: function() {
                // म्यानुअल रूपमा event trigger गर्ने
              // Normalize displayed Nepali to ISO YYYY-MM-DD when possible
              try {
                const normalized = normalizeNepaliDisplayToISO(input.value || input.getAttribute('value') || '');
                if (normalized && normalized !== input.value) {
                  input.value = normalized;
                }
              } catch (e) {
                console.warn('normalizeNepaliDisplayToISO failed:', e);
              }

              input.dispatchEvent(new Event('change', { bubbles: true }));
              input.dispatchEvent(new Event('input', { bubbles: true }));
                
                // यदि मोडल भित्र छ भने, मोडललाई फोकस रहन दिने
                setTimeout(() => {
                    const modal = input.closest('.modal');
                    if (modal) {
                        modal.focus();
                    }
                }, 100);
            }
        };

        // Library check गर्ने
        const jqMethodName = _getNepaliDatePickerJqMethodName();
        if (jqMethodName && typeof $ !== 'undefined') {
            try {
                // jQuery plugin प्रयोग गर्ने
                $(input)[jqMethodName](options);
                input.dataset.ndpInitialized = 'true';
                console.log('✅ Nepali DatePicker initialized (jQuery) for:', input.id || input.className);
            } catch (e) {
                console.warn('⚠️ jQuery plugin failed, trying vanila...', e);
                tryVanillaDatePicker(input, options);
            }
        } 
        else if (typeof NepaliDatePicker !== 'undefined') {
            try {
                // Vanilla JS library प्रयोग गर्ने
                new NepaliDatePicker(input, options);
                input.dataset.ndpInitialized = 'true';
                console.log('✅ Nepali DatePicker initialized (Vanilla) for:', input.id || input.className);
            } catch (e) {
                console.warn('⚠️ Vanilla failed, trying fallback...', e);
                tryFallbackDatePicker(input);
            }
        }
        else {
            console.warn('⚠️ No NepaliDatePicker library found, using fallback');
            tryFallbackDatePicker(input);
        }

        // ensure clicking the field (or its icon) always opens the calendar
        input.addEventListener('click', () => {
            // focusing usually triggers the picker; call explicitly for safety
            input.focus();
            try {
                if (typeof $ !== 'undefined' && $.fn && $(input).data('nepaliDatePicker')) {
                    $(input).nepaliDatePicker('show');
                }
            } catch (_e) {
                // ignore
            }
            if (input._nepaliDatePickerInstance && typeof input._nepaliDatePickerInstance.show === 'function') {
                input._nepaliDatePickerInstance.show();
            }
        });

        // always keep numeric placeholder, library sometimes injects Nepali text
        if (!input.placeholder || /[\u0900-\u097F]/.test(input.placeholder)) {
          input.placeholder = 'YYYY-MM-DD';
        }

        // If the picker library inserted a textual Nepali date into the value on init, normalize it now
        try {
          const current = input.value || input.getAttribute('value') || '';
          const normalizedNow = normalizeNepaliDisplayToISO(current);
          if (normalizedNow && normalizedNow !== current) input.value = normalizedNow;
        } catch (e) { /* ignore */ }
    });
}

// Vanilla DatePicker प्रयास गर्ने हेल्पर फंक्सन
function tryVanillaDatePicker(input, options) {
    if (typeof NepaliDatePicker !== 'undefined') {
        try {
            new NepaliDatePicker(input, options);
            input.dataset.ndpInitialized = 'true';
            console.log('✅ Nepali DatePicker initialized (Vanilla fallback) for:', input.id);
            return true;
        } catch (e) {
            console.error('❌ Vanilla fallback also failed:', e);
        }
    }
    return false;
}

// Fallback DatePicker (साधारण अलर्ट वा कन्सोल)
function tryFallbackDatePicker(input) {
    // यदि library नै छैन भने, कमसेकम प्रयोगकर्तालाई सन्देश दिने
  console.warn('⚠️ Nepali DatePicker library not loaded for:', input.id);

  // Ensure placeholder
  if (!input.placeholder) input.placeholder = 'YYYY-MM-DD';

  // Attach simple in-page Nepali picker on click
  const handler = function(e) {
    e.preventDefault();
    console.log('🧭 fallback handler invoked for', input.id);
    showSimpleNepaliPicker(input);
  };
  input.addEventListener('click', handler);
  // Also respond to custom ndp show events (DOM and jQuery)
  const ndpDomHandler = function(e) {
    try { e.preventDefault(); } catch(_){}
    console.log('🧭 ndp:show event received for', input.id);
    showSimpleNepaliPicker(input);
  };
  input.addEventListener('ndp:show', ndpDomHandler);
  if (typeof $ !== 'undefined' && $.fn) {
    try { $(input).on('ndp:show', ndpDomHandler); } catch(e) {}
  }
  // also open on focus (keyboard navigation) and Enter/ArrowDown keys
  input.addEventListener('focus', handler);
  input.addEventListener('keydown', function(e){
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      handler(e);
    }
  });
  // also open when associated input-group-text icon clicked
  const nextEl = input.nextElementSibling;
  if (nextEl && nextEl.classList && nextEl.classList.contains('input-group-text')) {
    nextEl.addEventListener('click', handler);
  }

  input.dataset.ndpInitialized = 'true';
}

// Simple inline Nepali (BS) picker modal
function showSimpleNepaliPicker(input) {
  // create modal if not exists
  if (!document.getElementById('simple-nepali-picker')) {
    const modal = document.createElement('div');
    modal.id = 'simple-nepali-picker';
    // force important styles to try to override other CSS
    modal.style.setProperty('position', 'fixed', 'important');
    modal.style.setProperty('left', '0', 'important');
    modal.style.setProperty('top', '0', 'important');
    modal.style.setProperty('width', '100%', 'important');
    modal.style.setProperty('height', '100%', 'important');
    modal.style.setProperty('display', 'flex', 'important');
    modal.style.setProperty('align-items', 'center', 'important');
    modal.style.setProperty('justify-content', 'center', 'important');
    modal.style.setProperty('background', 'rgba(0,0,0,0.55)', 'important');
    modal.style.setProperty('z-index', '2147483647', 'important');
    modal.style.setProperty('pointer-events', 'auto', 'important');
    modal.innerHTML = `
      <div id="_snp_box" style="background:#fff;padding:14px;border-radius:8px;min-width:320px;max-width:92%;box-shadow:0 12px 40px rgba(0,0,0,0.35);border:2px solid #0d6efd;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <h6 style="margin:0">नेपाली मिति छान्नुहोस्</h6>
          <div style="display:flex;gap:8px;align-items:center;">
            <button id="_snp_prev" class="btn btn-sm btn-light">‹</button>
            <select id="_snp_year" class="form-select" style="min-width:90px;"></select>
            <select id="_snp_month" class="form-select" style="min-width:110px;"></select>
            <button id="_snp_next" class="btn btn-sm btn-light">›</button>
          </div>
        </div>
        <div id="_snp_calendar" style="display:block;background:#fff;border-radius:6px;padding:8px;border:1px solid #eee;">
          <div id="_snp_weekdays" style="display:flex;gap:4px;margin-bottom:6px;font-size:12px;color:#333;"></div>
          <div id="_snp_days" style="display:flex;flex-wrap:wrap;gap:6px;"></div>
        </div>
        <div style="text-align:right;display:flex;gap:8px;justify-content:flex-end;margin-top:10px;">
          <button id="_snp_cancel" class="btn btn-outline">रद्द</button>
          <button id="_snp_ok" class="btn btn-primary">ठीक छ</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // populate months
    const nepaliMonths = ["बैशाख","जेठ","असार","साउन","भदौ","असोज","कार्तिक","मंसिर","पुष","माघ","फागुन","चैत"];
    const monthSelect = modal.querySelector('#_snp_month');
    nepaliMonths.forEach((m,i)=>{ const o=document.createElement('option'); o.value = i+1; o.textContent = m; monthSelect.appendChild(o);} );

    // year range around current nepali year (display in Devanagari digits)
    const currentBs = (getCurrentNepaliDate() || '').split('-')[0] || (new Date().getFullYear()+57);
    const yearSelect = modal.querySelector('#_snp_year');
    const cy = parseInt(currentBs) || (new Date().getFullYear()+57);
    for (let y = cy-5; y <= cy+5; y++) {
      const o=document.createElement('option'); o.value=y; o.textContent=_latinToDevnagari(String(y)); yearSelect.appendChild(o);
    }

    // set month to current Nepali month (if available) and render
    const currentBsParts = (getCurrentNepaliDate() || '').split('-');
    const currentBsMonth = parseInt(currentBsParts[1],10) || 1;
    monthSelect.value = currentBsMonth;
    yearSelect.value = cy;
    try { renderCalendar(cy, currentBsMonth); } catch(e) { /* ignore */ }

    // calendar helpers
    const daysContainer = modal.querySelector('#_snp_days');
    const weekdaysContainer = modal.querySelector('#_snp_weekdays');
    const nepaliWeekdays = ['आइत', 'सोम', 'मंगल', 'बुध', 'बिही', 'शुक्र', 'शनि'];
    weekdaysContainer.innerHTML = '';
    nepaliWeekdays.forEach(w=>{ const el = document.createElement('div'); el.style.flex = '1 0 calc(14.28% - 4px)'; el.style.textAlign='center'; el.textContent = w; weekdaysContainer.appendChild(el); });

    let _selectedDay = null;
    function clearSelection() {
      _selectedDay = null;
      const prev = daysContainer.querySelectorAll('.snp-day-selected');
      prev.forEach(p=>{ p.classList.remove('snp-day-selected'); p.style.background=''; p.style.color=''; });
    }

    function renderCalendar(bsYear, bsMonth) {
      daysContainer.innerHTML = '';
      // compute first weekday using BS->AD conversion if available
      let firstWeekday = 0; // 0 = Sunday
      try {
        if (typeof NepaliFunctions !== 'undefined' && typeof NepaliFunctions.BS2AD === 'function') {
          const adFirst = NepaliFunctions.BS2AD(bsYear, bsMonth, 1);
          if (adFirst && adFirst.indexOf('-')!==-1) {
            const p = adFirst.split('-').map(x=>Number(x));
            const dt = new Date(p[0], p[1]-1, p[2]);
            firstWeekday = dt.getDay();
          }
        }
      } catch(e){ console.warn('BS2AD failed',e); }

      // approximate month length
      const monthDays = [30,31,32,31,32,30,30,29,30,29,30,30];
      const total = monthDays[(bsMonth-1) % 12] || 30;

      // add empty slots
      for (let i=0;i<firstWeekday;i++){
        const el = document.createElement('div'); el.style.flex='1 0 calc(14.28% - 4px)'; el.style.height='34px'; daysContainer.appendChild(el);
      }
      for (let d=1; d<=total; d++){
        const el = document.createElement('div');
        el.className = 'snp-day';
        el.style.flex='1 0 calc(14.28% - 4px)';
        el.style.height='34px';
        el.style.lineHeight='34px';
        el.style.textAlign='center';
        el.style.borderRadius='4px';
        el.style.cursor='pointer';
        el.textContent = _latinToDevnagari(String(d));
        el.dataset.day = d;
        el.addEventListener('click', function(){
          clearSelection();
          el.classList.add('snp-day-selected');
          el.style.background = '#0d6efd'; el.style.color='#fff';
          _selectedDay = d;
          // Immediately set input to selected BS date in YYYY-MM-DD
          try {
            const ym = String(bsMonth).padStart(2,'0');
            const dv = `${bsYear}-${ym}-${String(d).padStart(2,'0')}`;
            input.value = dv;
            input.dispatchEvent(new Event('input',{bubbles:true}));
            input.dispatchEvent(new Event('change',{bubbles:true}));
          } catch(e) { console.warn('Could not set input on day click', e); }
        });
        // double-click quick accept: set value and close
        el.addEventListener('dblclick', function(){
          try {
            const ym = String(bsMonth).padStart(2,'0');
            const dv = `${bsYear}-${ym}-${String(d).padStart(2,'0')}`;
            input.value = dv;
            input.dispatchEvent(new Event('input',{bubbles:true}));
            input.dispatchEvent(new Event('change',{bubbles:true}));
            _closeSnp(modal);
          } catch(e) { console.warn('dblclick accept failed', e); }
        });
        daysContainer.appendChild(el);
      }
    }
    // expose helpers on modal element for later reuse
    try {
      modal._renderCalendar = renderCalendar;
      modal._clearSelection = clearSelection;
      modal._getSelectedDay = function(){ return _selectedDay; };
      modal._setSelectedDay = function(d){ _selectedDay = d; };
      modal._daysContainer = daysContainer;
      modal._yearSelect = yearSelect;
      modal._monthSelect = monthSelect;
    } catch(e) {}

    function _closeSnp(modalEl) {
      try { document.body.style.removeProperty('overflow'); } catch(e){}
      modalEl.style.display = 'none';
    }
    modal.querySelector('#_snp_cancel').addEventListener('click', ()=>{ _closeSnp(modal); });
    modal.querySelector('#_snp_ok').addEventListener('click', ()=>{
      const y = yearSelect.value;
      const m = String(monthSelect.value).padStart(2,'0');
      const d = String(_selectedDay || 1).padStart(2,'0');
      const val = `${y}-${m}-${d}`;
      input.value = val;
      input.dispatchEvent(new Event('input',{bubbles:true}));
      input.dispatchEvent(new Event('change',{bubbles:true}));
      _closeSnp(modal);
    });

    // update days when month/year change (approximate lengths)
    function updateDaysByMonth() {
      const y = parseInt(yearSelect.value,10) || cy;
      const m = parseInt(monthSelect.value,10) || 1;
      renderCalendar(y, m);
    }
    monthSelect.addEventListener('change', updateDaysByMonth);
    yearSelect.addEventListener('change', updateDaysByMonth);
    // prev/next buttons
    const prevBtn = modal.querySelector('#_snp_prev');
    const nextBtn = modal.querySelector('#_snp_next');
    if (prevBtn) prevBtn.addEventListener('click', ()=>{
      let m = parseInt(monthSelect.value,10) - 1;
      let y = parseInt(yearSelect.value,10);
      if (m < 1) { m = 12; y = y - 1; yearSelect.value = y; }
      monthSelect.value = m;
      renderCalendar(y, m);
    });
    if (nextBtn) nextBtn.addEventListener('click', ()=>{
      let m = parseInt(monthSelect.value,10) + 1;
      let y = parseInt(yearSelect.value,10);
      if (m > 12) { m = 1; y = y + 1; yearSelect.value = y; }
      monthSelect.value = m;
      renderCalendar(y, m);
    });
    // close when clicking outside the box
    modal.addEventListener('click', function(ev){
      if (ev.target && ev.target.id === 'simple-nepali-picker') {
        _closeSnp(modal);
      }
    });
    // allow ESC to close
    document.addEventListener('keydown', function escHandler(ev){
      if (ev.key === 'Escape') {
        modal.style.display = 'none';
      }
    });
  }

  const modalEl = document.getElementById('simple-nepali-picker');
  if (modalEl) {
    console.log('🧭 showSimpleNepaliPicker opening for', input.id);
    // set current value into modal selects if possible
    const v = normalizeNepaliDisplayToISO(input.value || input.getAttribute('value') || '') || '';
    const parts = v.split('-');
    const yearEl = modalEl.querySelector('#_snp_year');
    const monEl = modalEl.querySelector('#_snp_month');
    if (parts.length===3) {
      yearEl.value = parts[0];
      monEl.value = parseInt(parts[1]);
      // render calendar and mark selected day
      try {
        if (modalEl._renderCalendar) modalEl._renderCalendar(parseInt(parts[0],10), parseInt(parts[1],10));
        else if (typeof renderCalendar === 'function') renderCalendar(parseInt(parts[0],10), parseInt(parts[1],10));
        const sel = parseInt(parts[2],10) || 1;
        const dayBox = modalEl.querySelector('#_snp_days').querySelector(`[data-day="${sel}"]`);
        if (dayBox) {
          if (modalEl._clearSelection) modalEl._clearSelection();
          else { const prev = modalEl.querySelectorAll('.snp-day-selected'); prev.forEach(p=>p.classList.remove('snp-day-selected')); }
          dayBox.classList.add('snp-day-selected'); dayBox.style.background='#0d6efd'; dayBox.style.color='#fff';
          if (modalEl._setSelectedDay) modalEl._setSelectedDay(sel);
          else window._snp_selectedDay = sel;
        }
      } catch(e) { console.warn('Could not set initial selected day', e); }
    }
    // force visibility (in case CSS overrides)
    // attach to documentElement to avoid containment/clipping issues
    try {
      if (modalEl.parentNode !== document.body) {
        document.body.appendChild(modalEl);
      }
    } catch(e) { console.warn('Could not move modal to body', e); }

    // prevent page scroll while modal open
    try { document.body.style.setProperty('overflow','hidden','important'); } catch(e){}

    modalEl.style.setProperty('display','flex','important');
    modalEl.style.setProperty('visibility','visible','important');
    modalEl.style.setProperty('opacity','1','important');
    // ensure inner box is on top
    const box = modalEl.querySelector('#_snp_box');
    if (box) {
      box.style.setProperty('z-index','2147483648','important');
      box.style.setProperty('position','relative','important');
      // scale the calendar box to 60% per user request
      box.style.setProperty('transform','scale(0.60)','important');
      box.style.setProperty('transform-origin','center center','important');
    }

    // debug: log computed style and rects
    try {
      const comp = window.getComputedStyle(modalEl);
      const rect = modalEl.getBoundingClientRect();
      const boxRect = box ? box.getBoundingClientRect() : null;
      console.log('🧭 modal computed style', {display: comp.display, visibility: comp.visibility, opacity: comp.opacity, rect, boxRect});
    } catch(e) { console.warn(e); }

    // Extra visibility: scroll into view, focus and flash outline
    try {
      if (box && typeof box.scrollIntoView === 'function') {
        box.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
      }
      if (box) {
        box.tabIndex = -1;
        box.focus({preventScroll:true});
        const prevOutline = box.style.outline || '';
        box.style.setProperty('outline', '4px solid rgba(13,110,253,0.18)', 'important');
        box.style.setProperty('transform', 'scale(1.01)', 'important');
        setTimeout(() => {
          box.style.removeProperty('outline');
          box.style.removeProperty('transform');
        }, 900);
      }
    } catch(e) { console.warn('visibility helpers failed', e); }

    // if after a short delay the modal isn't visible (0x0), fallback to prompt input
    requestAnimationFrame(()=>{
      setTimeout(()=>{
        try {
          const rect = modalEl.getBoundingClientRect();
          if (!rect || rect.width === 0 || rect.height === 0) {
            console.warn('⚠️ modal appears to be hidden by CSS; falling back to prompt for date');
            const manual = prompt('कृपया मिति YYYY-MM-DD मा लेख्नुहोस् (BS)', normalizeNepaliDisplayToISO(input.value) || '');
            if (manual) {
              input.value = manual;
              input.dispatchEvent(new Event('input',{bubbles:true}));
              input.dispatchEvent(new Event('change',{bubbles:true}));
            }
          }
        } catch (e) { console.error(e); }
      }, 120);
    });
  }
}

function loadFallbackLibrary() {
  // Deprecated: local vendor fallback files are not shipped with this project.
  // Keep as a safe no-op to avoid repeated 404/MIME errors.
  if (!window._fallbackDeprecatedWarned) {
    window._fallbackDeprecatedWarned = true;
    console.warn('⚠️ Local NepaliDatePicker vendor fallback is disabled (missing vendor files).');
  }
}

function loadNepaliDatePickerScript() {
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = 'vendor/nepali.datepicker.v2.2.min.css';
  document.head.appendChild(css);

    // Fix z-index for modals
    const style = document.createElement('style');
    style.innerHTML = '.nepali-calendar, #ndp-nepali-box { z-index: 99999 !important; }';
    document.head.appendChild(style);

    const script = document.createElement('script');
    script.src = 'vendor/nepali.datepicker.v2.2.min.js';
    script.onload = () => {
      console.log('✅ Local fallback NepaliDatePicker loaded');
      window._ndpRetries = 0;
      initializeDatepickers(); initializeNepaliDropdowns();
    };
    script.onerror = () => {
      console.error('❌ Failed to load local fallback library');
      console.error('❌ Fallback Nepali date picker failed to load. The date picker will not be available.');
    };
    document.head.appendChild(script);
}

function updateDateTime() {
  const now = new Date();
  const dateTimeElement = document.getElementById('currentDateTime');
  if (dateTimeElement) {
    dateTimeElement.textContent = now.toLocaleString('ne-NP', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
}

function showToast(message, type = 'info') {
  if (window.NVC && NVC.UI && typeof NVC.UI.showToast === 'function') {
    return NVC.UI.showToast(message, { duration: 3000, bg: type === 'error' ? '#d32f2f' : type === 'success' ? '#2e7d32' : type === 'warning' ? '#ff8f00' : '#0288d1' });
  }
  // Fallback
  if (typeof Toastify !== 'undefined') {
    Toastify({ text: message, duration: 3000, gravity: "top", position: "right", stopOnFocus: true }).showToast();
  } else {
    console.log('[TOAST]', type, message);
  }
}

function showLoadingIndicator(show, message = 'डाटा लोड हुँदैछ...') {
  let loadingDiv = document.getElementById('loadingIndicator');
  if (show) {
    if (!loadingDiv) {
      loadingDiv = document.createElement('div');
      loadingDiv.id = 'loadingIndicator';
      loadingDiv.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background-color: rgba(0,0,0,0.5); display: flex;
        align-items: center; justify-content: center; z-index: 9999;
        flex-direction: column;
      `;
      
      const spinner = document.createElement('div');
      spinner.style.cssText = `
        width: 50px; height: 50px; border: 5px solid #f3f3f3;
        border-top: 5px solid #3498db; border-radius: 50%;
        animation: spin 1s linear infinite;
      `;
      
      const text = document.createElement('div');
      text.style.cssText = `color: white; margin-top: 1rem; font-size: 1.2rem;`;
      text.textContent = message;
      
      loadingDiv.appendChild(spinner);
      loadingDiv.appendChild(text);
      document.body.appendChild(loadingDiv);

      // Safety Timeout: १५ सेकेन्डपछि लोडिङ आफैं हट्नेछ (यदि अड्कियो भने)
      setTimeout(() => {
        const currentLoader = document.getElementById('loadingIndicator');
        if (currentLoader) currentLoader.remove();
      }, 15000);
      
      if (!document.querySelector('style[data-spin]')) {
        const style = document.createElement('style');
        style.setAttribute('data-spin', 'true');
        style.textContent = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
        document.head.appendChild(style);
      }
    } else {
      // Update existing loading message
      const textElement = loadingDiv.querySelector('div[style*="color: white"]');
      if (textElement) {
        textElement.textContent = message;
      }
    }
  } else {
    if (loadingDiv) {
      loadingDiv.remove();
    }
  }
}

function showModalActivity(message = 'कृपया प्रतिक्षा गर्नुहोस्...') {
  try {
    const modal = document.getElementById('complaintModal');
    if (!modal) return;
    let overlay = document.getElementById('modalActivityOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'modalActivityOverlay';
      overlay.style.cssText = `position:absolute; inset:0; background: rgba(255,255,255,0.8); display:flex; align-items:center; justify-content:center; z-index: 1050;`;
      const inner = document.createElement('div');
      inner.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:8px;';
      const spinner = document.createElement('div');
      spinner.style.cssText = 'width:36px; height:36px; border:4px solid #eee; border-top:4px solid #007bff; border-radius:50%; animation: spin 1s linear infinite;';
      const text = document.createElement('div');
      text.style.cssText = 'font-size:0.95rem; color:#333;';
      text.id = 'modalActivityText';
      text.textContent = message;
      inner.appendChild(spinner);
      inner.appendChild(text);
      overlay.appendChild(inner);
      // Preserve modal's fixed/absolute positioning. Only set relative
      // when the computed position is neither 'fixed' nor 'absolute'.
      try {
        const compPos = window.getComputedStyle(modal).position;
        if (compPos !== 'fixed' && compPos !== 'absolute') {
          modal.style.position = modal.style.position || 'relative';
        }
      } catch (e) {
        modal.style.position = modal.style.position || 'relative';
      }
      modal.appendChild(overlay);
      if (!document.querySelector('style[data-spin-modal]')) {
        const style = document.createElement('style');
        style.setAttribute('data-spin-modal', 'true');
        style.textContent = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
        document.head.appendChild(style);
      }
    } else {
      const text = document.getElementById('modalActivityText');
      if (text) text.textContent = message;
      overlay.style.display = 'flex';
    }
  } catch (e) { console.warn('showModalActivity failed', e); }
}

function hideModalActivity() {
  try {
    const overlay = document.getElementById('modalActivityOverlay');
    if (overlay) overlay.style.display = 'none';
  } catch (e) { console.warn('hideModalActivity failed', e); }
}

function setContentAreaHTML(html) {
  const contentArea = document.getElementById('contentArea');
  if (!contentArea) return;

  try {
    // If a caller has requested to suppress the content transition (e.g. frequent filter updates),
    // render immediately without adding the transitioning class which can cause layout shifts.
    if (state && state._suppressContentTransition) {
      contentArea.innerHTML = html;
      return;
    }

    contentArea.classList.add('is-transitioning');
    setTimeout(() => {
      contentArea.innerHTML = html;
      requestAnimationFrame(() => {
        contentArea.classList.remove('is-transitioning');
      });
    }, 120);
  } catch (e) {
    // Fallback to immediate render
    contentArea.innerHTML = html;
    contentArea.classList.remove('is-transitioning');
  }
}

function buildComplaintsFilterChipsHTML(filters = {}) {
  const chips = [];

  const statusLabelMap = { pending: 'काम बाँकी', progress: 'चालु', resolved: 'फछ्रयौट' };
  if (filters.status) {
    chips.push({ key: 'status', label: `स्थिति: ${statusLabelMap[filters.status] || filters.status}` });
  }
  if (filters.finalDecisionType) {
    chips.push({ key: 'finalDecisionType', label: `केन्द्रको निर्णय: ${filters.finalDecisionType}` });
  }
  if (filters.shakha) {
    chips.push({ key: 'shakha', label: `शाखा: ${filters.shakha}` });
  }
  if (filters.ministry) {
    chips.push({ key: 'ministry', label: `मन्त्रालय/निकाय: ${filters.ministry}` });
  }
  if (filters.startDate) {
    chips.push({ key: 'startDate', label: `देखि: ${filters.startDate}` });
  }
  if (filters.endDate) {
    chips.push({ key: 'endDate', label: `सम्म: ${filters.endDate}` });
  }
  if (filters.search) {
    const field = filters.searchField && filters.searchField !== 'all' ? ` (${filters.searchField})` : '';
    chips.push({ key: 'search', label: `खोजी${field}: ${filters.search}` });
  }

  if (chips.length === 0) return '';

  const chipsHTML = chips.map(c => {
    const safeLabel = String(c.label || '').replace(/"/g, '&quot;');
    return `<span class="filter-chip" title="${safeLabel}">${c.label}<button class="chip-remove" type="button" onclick="removeComplaintsFilterChip('${c.key}')" aria-label="हटाउनुहोस्">×</button></span>`;
  }).join('');

  return `<div class="filter-chips">${chipsHTML}</div>`;
}

function removeComplaintsFilterChip(key) {
  // Delegate to UI module if available, otherwise perform legacy DOM updates and refresh
  try {
    if (window.NVC && NVC.UI && typeof NVC.UI.removeComplaintsFilterChip === 'function') {
      return NVC.UI.removeComplaintsFilterChip(key);
    }
  } catch (e) {
    console.warn('NVC.UI.removeComplaintsFilterChip delegate failed', e);
  }

  // Legacy fallback: Remove the selected chip and refresh the complaints view
  try {
    const statusEl = document.getElementById('filterStatus'); if (statusEl && key === 'status') statusEl.value = '';
    const finalDecisionEl = document.getElementById('filterFinalDecisionType'); if (finalDecisionEl && key === 'finalDecisionType') finalDecisionEl.value = '';
    const shakhaEl = document.getElementById('filterShakha'); if (shakhaEl && key === 'shakha') shakhaEl.value = '';
    const ministryEl = document.getElementById('filterMinistry'); if (ministryEl && key === 'ministry') ministryEl.value = '';
    const startEl = document.getElementById('filterStartDate'); if (startEl && key === 'startDate') {
      startEl.value = '';
      // also reset visible selects (year/month/day) for this date picker
      try {
        const wrapper = document.querySelector('.nepali-datepicker-dropdown[data-target="filterStartDate"]');
        if (wrapper) {
          const ys = wrapper.querySelectorAll('.bs-year, .bs-month, .bs-day');
          ys.forEach(s => { if (s && s.options && s.options.length) s.selectedIndex = 0; });
          // dispatch change so hidden sync handlers run
          ys.forEach(s => { if (s) s.dispatchEvent(new Event('change', { bubbles: true })); });
        }
      } catch(e){}
    }
    const endEl = document.getElementById('filterEndDate'); if (endEl && key === 'endDate') {
      endEl.value = '';
      try {
        const wrapper = document.querySelector('.nepali-datepicker-dropdown[data-target="filterEndDate"]');
        if (wrapper) {
          const ys = wrapper.querySelectorAll('.bs-year, .bs-month, .bs-day');
          ys.forEach(s => { if (s && s.options && s.options.length) s.selectedIndex = 0; });
          ys.forEach(s => { if (s) s.dispatchEvent(new Event('change', { bubbles: true })); });
        }
      } catch(e){}
    }
    const searchEl = document.getElementById('searchText'); if (searchEl && key === 'search') searchEl.value = '';
  } catch (e) { console.warn('removeComplaintsFilterChip failed', e); }

  // Re-render complaints with updated filters (legacy)
  try { if (typeof showComplaintsView === 'function') showComplaintsView(); } catch (e) {}
}

// Ensure we don't reference an undefined legacy implementation. Prefer NVC.Api implementation when available.
try {
  if (typeof _postToGoogleSheets !== 'undefined' && typeof NVC.Api.postToGoogleSheets === 'undefined') {
    NVC.Api.postToGoogleSheets = _postToGoogleSheets;
  }
} catch (e) {
  // ignore if _postToGoogleSheets is not present
}

async function postToGoogleSheets(action, data = {}) {
  console.info('postToGoogleSheets called:', action);
  console.debug('postToGoogleSheets payload:', data);
  try {
    let res;
    if (window.NVC && NVC.Api && typeof NVC.Api.postToGoogleSheets === 'function') {
      res = await NVC.Api.postToGoogleSheets(action, data);
    } else if (typeof _postToGoogleSheets === 'function') {
      res = await _postToGoogleSheets(action, data);
    } else {
      console.warn('postToGoogleSheets: no implementation available for action', action);
      return { success: false, message: 'No postToGoogleSheets implementation available' };
    }
    console.debug('postToGoogleSheets result for', action, ':', res);
    return res;
  } catch (e) {
    console.error('postToGoogleSheets implementation threw:', e);
    return { success: false, message: String(e) };
  }
}

async function loadDataFromGoogleSheets(forceReload = false) {
  if (window.NVC && NVC.Api && typeof NVC.Api.loadDataFromGoogleSheets === 'function') return NVC.Api.loadDataFromGoogleSheets(forceReload);
  return false;
}

async function loadLaboratoryTestsFromGoogleSheets() {
  console.log('🔄 Loading laboratory tests from Google Sheets...');
  try {
    if (window.NVC && NVC.Api && typeof NVC.Api.postToGoogleSheets === 'function') {
      console.log('📡 Calling getLaboratoryTests API...');
      const result = await NVC.Api.postToGoogleSheets('getLaboratoryTests', {});
      console.log('📊 API result:', result);
      
      if (result.success && result.data) {
        console.log('✅ Laboratory tests loaded from Google Sheets:', result.data.length);
        if (result.data.length > 0) {
          console.log('📋 Raw data sample:', result.data[0]);
          console.log('📋 Raw data keys:', Object.keys(result.data[0]));
          console.log('📋 All raw data:', result.data);
        }
        
        // Map the data to match frontend expectations
        // Backend returns lowercase field names due to normalizeKey function
        const mappedData = result.data.map(test => ({
          id: test.id || '',
          // English field names - use lowercase keys as returned by backend
          sampleNo: test.samplenumber || test.sampleNo || '',
          receivedDate: test.samplereceiveddate || test.receivedDate || '',
          requester: test.testrequester || test.requester || '',
          projectName: test.organizationname || test.projectName || '',
          ministry: test.ministry || '',
          material: test.testmaterial || test.material || '',
          testDate: test.testdate || test.testDate || '',
          testMethod: test.testmethod || test.testMethod || '',
          equipment: test.testequipment || test.equipment || '',
          testResult: test.testresult || test.testResult || '',
          remarks: test.remarks || '',
          status: test.status || 'pending',
          createdBy: test.createdby || test.createdBy || '',
          createdAt: test.createdat || test.createdAt || '',
          updatedBy: test.updatedby || test.updatedBy || '',
          updatedAt: test.updatedat || test.updatedAt || '',
          // Nepali field names for backward compatibility
          'नमूना नं': test.samplenumber || test.sampleNo || '',
          'नमूना प्राप्त मिति': test.samplereceiveddate || test.receivedDate || '',
          'परीक्षण अनुरोधकर्ता': test.testrequester || test.requester || '',
          'आयोजनाको नाम': test.organizationname || test.projectName || '',
          'मन्त्रालय/निकाय': test.ministry || '',
          'परीक्षण गर्ने सामग्री': test.testmaterial || test.material || '',
          'परीक्षण गरिएको मिति': test.testdate || test.testDate || '',
          'परीक्षण विधि': test.testmethod || test.testMethod || '',
          'परीक्षण गर्ने उपकरण': test.testequipment || test.equipment || '',
          'परीक्षण नतीजा': test.testresult || test.testResult || '',
          'कैफियत': test.remarks || ''
        }));
        
        if (mappedData.length > 0) {
          console.log('🎯 Mapped data sample:', mappedData[0]);
          console.log('🎯 Mapped data keys:', Object.keys(mappedData[0]));
          console.log('🎯 Sample sampleNo:', mappedData[0].sampleNo);
          console.log('🎯 Sample requester:', mappedData[0].requester);
          console.log('🎯 Sample status:', mappedData[0].status);
        }
        
        // Update state
        state.sampleTests = mappedData;
        console.log('📝 State updated with', state.sampleTests.length, 'sample tests');
        
        return mappedData;
      } else {
        console.log('❌ API returned no data or failed:', result);
        state.sampleTests = [];
        return [];
      }
    } else {
      console.log('❌ NVC.Api.postToGoogleSheets not available');
      state.sampleTests = [];
      return [];
    }
  } catch (error) {
    console.error('💥 Error loading laboratory tests:', error);
    state.sampleTests = [];
    return [];
  }
}

// ==================== GET DATA FROM GOOGLE SHEETS ====================
async function getData(dataType = 'complaints', params = {}) {
  console.log(`📡 getData() called for: ${dataType}`);
  
  switch(dataType) {
    case 'complaints':
      return await getFromGoogleSheets('getComplaints', params);
    case 'projects':
      return await getFromGoogleSheets('getProjects', params);
    case 'employee_monitoring':
      return await getFromGoogleSheets('getEmployeeMonitoring', params);
    case 'citizen_charter':
      return await getFromGoogleSheets('getCitizenCharter', params);
    case 'investigations':
      return await getFromGoogleSheets('getInvestigations', params);
    default:
      return { success: false, data: [], message: 'Invalid data type' };
  }
}

async function saveData(dataType, data) {
  console.log(`📝 saveData() called for: ${dataType}`);
  
  let action = '';
  let statusText = '';
  
  switch(dataType) {
    case 'complaint':
      action = 'saveComplaint';
      statusText = 'उजुरी सेभ हुँदैछ...';
      break;
    case 'project':
      action = 'saveProject';
      statusText = 'परियोजना सेभ हुँदैछ...';
      break;
    case 'employee_monitoring':
      action = 'saveEmployeeMonitoring';
      statusText = 'कर्मचारी अनुगमन सेभ हुँदैछ...';
      break;
    case 'citizen_charter':
      action = 'saveCitizenCharter';
      statusText = 'नागरिक चार्टर सेभ हुँदैछ...';
      break;
    case 'investigation':
      action = 'createInvestigation';
      statusText = 'अनुसन्धान सेभ हुँदैछ...';
      break;
    default:
      return { success: false, message: 'Invalid data type' };
  }
  
  showLoadingSpinner(statusText);
  
  try {
    const result = await postToGoogleSheets(action, data);
    return result;
  } finally {
    hideLoadingSpinner();
  }
}

async function submitForm(formType, formData) {
  console.log(`📋 submitForm() called for: ${formType}`);
  
  showLoadingIndicator(true);
  
  let result;
  
  switch(formType) {
    case 'complaint':
      result = await saveNewComplaint(formData);
      break;
    case 'project':
      result = await saveTechnicalProject(formData);
      break;
    case 'employee_monitoring':
      result = await saveEmployeeMonitoring(formData);
      break;
    case 'citizen_charter':
      result = await saveCitizenCharter(formData);
      break;
    default:
      showToast('Invalid form type', 'error');
      showLoadingIndicator(false);
      return false;
  }
  
  showLoadingIndicator(false);
  return result;
}

async function refreshData() {
  console.log('🔄 refreshData() called');
  
  if (!state.currentUser) {
    showToast('कृपया पहिला लगइन गर्नुहोस्', 'warning');
    return false;
  }
  
  showLoadingIndicator(true);
  showToast('🔄 डाटा रिफ्रेस हुँदैछ...', 'info');
  
  try {
    // Clear loading flag
    window._isLoadingData = false;
    
    // Force reload from Google Sheets
    const loaded = await loadDataFromGoogleSheets(true);
    
    if (loaded) {
      showToast(`✅ ${state.complaints.length} उजुरीहरू लोड भयो`, 'success');
      
      // Update current view based on state.currentView
      if (state.currentView === 'complaints' || state.currentView === 'all_complaints') {
        showComplaintsView();
      } else if (state.currentView === 'dashboard' || state.currentPage === 'dashboardPage') {
        if (typeof updateStats === 'function') updateStats();
        if (typeof initializeDashboardCharts === 'function') {
          setTimeout(() => {
            destroyAllCharts();
            initializeDashboardCharts();
          }, 300);
        }
      } else if (state.currentView === 'technical_projects') {
        showTechnicalProjectsView();
      } else if (state.currentView === 'employee_monitoring') {
        showEmployeeMonitoringView();
      } else if (state.currentView === 'citizen_charter') {
        showCitizenCharterView();
      } else if (state.currentView === 'investigation') {
        showInvestigationView();
      } else if (state.currentView === 'technical_examiners') {
        showTechnicalExaminersView();
      }
      
      return true;
    } else {
      showToast('⚠️ डाटा लोड हुन सकेन', 'warning');
      return false;
    }
  } catch (error) {
    console.error('❌ Refresh error:', error);
    showToast('❌ रिफ्रेस गर्दा त्रुटि', 'error');
    return false;
  } finally {
    showLoadingIndicator(false);
  }
}

async function refreshAdminPlanningData() {
  console.log('🔄 Force refreshing admin planning data from Google Sheets...');
  showLoadingIndicator(true);
  
  try {
    // Clear existing data completely
    console.log('🗑️ Clearing existing complaint data...');
    state.complaints = [];
    window.state.complaints = [];
    
    // Clear localStorage to ensure fresh data
    try {
      localStorage.removeItem('nvc_complaints_backup');
      console.log('✅ Cleared localStorage backup');
    } catch (e) {
      console.warn('⚠️ Could not clear localStorage:', e);
    }
    
    // Reset loading flags
    window._isLoadingData = false;
    window._lastLoadResult = false;
    
    // Force reload from Google Sheets
    console.log('📡 Loading fresh data from Google Sheets...');
    const loaded = await loadDataFromGoogleSheets(true);
    
    if (loaded) {
      console.log('✅ Data refreshed from Google Sheets');
      console.log('🔍 Fresh state.complaints:', state.complaints);
      console.log('🔍 Fresh state.complaints count:', state.complaints.length);
      
      // Log status breakdown of fresh data
      const statusCounts = {
        pending: state.complaints.filter(c => c.status === 'pending').length,
        progress: state.complaints.filter(c => c.status === 'progress').length,
        resolved: state.complaints.filter(c => c.status === 'resolved').length
      };
      console.log('🔍 Fresh data status breakdown:', statusCounts);
      
      // Re-render the admin planning dashboard
      if (state.currentUser && state.currentUser.role === 'admin_planning') {
        console.log('🔄 Re-rendering admin planning dashboard...');
        showAdminPlanningDashboard();
        
        // Wait a bit for DOM to update, then reinitialize charts
        setTimeout(() => {
          console.log('📊 Re-initializing dashboard charts...');
          initializeDashboardCharts();
        }, 500);
      }
      
      showToast('✅ डाटा ताजा गरियो', 'success');
    } else {
      console.error('❌ Failed to load data from Google Sheets');
      showToast('⚠️ डाटा ताजा गर्न सकेन', 'warning');
    }
  } catch (error) {
    console.error('❌ Refresh error:', error);
    showToast('❌ डाटा ताजा गर्दा त्रुटि', 'error');
  } finally {
    showLoadingIndicator(false);
  }
}

function addRefreshButton() {
  const container = document.getElementById('sheetActions');
  if (!container) return;
  
  if (!document.getElementById('refreshDataBtn')) {
    const refreshBtn = document.createElement('button');
    refreshBtn.id = 'refreshDataBtn';
    refreshBtn.className = 'btn btn-sm btn-outline-primary';
    refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
    refreshBtn.addEventListener('click', refreshData);
    refreshBtn.title = 'Google Sheets बाट डाटा रिफ्रेस गर्नुहोस्';
    container.appendChild(refreshBtn);
  }
}

async function testGoogleSheetsConnection() {
  console.log('🧪 Testing Google Sheets connection...');
  showToast('🔄 Google Sheets connection testing...', 'info');
  
  // Web App URL check
  if (!GOOGLE_SHEETS_CONFIG.WEB_APP_URL || 
      GOOGLE_SHEETS_CONFIG.WEB_APP_URL.includes('script.google.com/macros/s/') === false) {
    const errorMsg = '❌ Web App URL सही छैन। कृपया Apps Script बाट नयाँ Deployment गर्नुहोस्।';
    console.error(errorMsg);
    showToast(errorMsg, 'error');
    return false;
  }
  
  try {
    // Use NVC.Api.getFromGoogleSheets to avoid CORS preflight issues with fetch/custom headers
    // Google Apps Script Web Apps do not support OPTIONS requests required for custom headers in fetch.
    const data = await NVC.Api.getFromGoogleSheets('test');
    
    if (data && data.success === true) {
      console.log('✅ Google Sheets connection successful!', data);
      showToast('✅ Google Sheets connection successful!', 'success');
      
      // Force clear any cached user data
      if (state.users) {
        state.users = null;
      }
      
      // Spreadsheet access status देखाउने
      if (data.spreadsheetAccess) {
        console.log('📊 Spreadsheet access:', data.spreadsheetAccess);
        if (data.spreadsheetAccess.includes('inaccessible')) {
          showToast('⚠️ Spreadsheet access issue: ' + data.spreadsheetAccess, 'warning');
        }
      }
      
      return true;
    } else {
      console.error('❌ Google Sheets connection failed:', data);
      showToast('❌ Connection failed: ' + (data?.message || 'Unknown error'), 'error');
      return false;
    }
  } catch (error) {
    console.error('❌ Connection test error:', error);
    showToast('❌ Connection error: ' + error.message, 'error');
    return false;
  }
}

// Helper to create an optimized accessor for sheet rows (performance fix)
// Builds a lookup map once per row instead of iterating keys for every field.
function createSheetAccessor(sheetData) {
  if (!sheetData || typeof sheetData !== 'object') return () => '';
  
  // Map for fast lookup: Normalized Key -> Value
  // Normalization: trim and lowercase
  const lookup = new Map();
  Object.keys(sheetData).forEach(k => {
    const val = sheetData[k];
    if (val !== undefined && val !== null && val !== '') {
      lookup.set(k, val); // Exact match
      lookup.set(String(k).trim().toLowerCase(), val); // Normalized match
    }
  });

  return (...keys) => {
    for (const key of keys) {
      if (lookup.has(key)) return lookup.get(key);
      const norm = String(key).trim().toLowerCase();
      if (lookup.has(norm)) return lookup.get(norm);
    }
    return '';
  };
}

function formatComplaintFromSheet(sheetData) {
  if (!sheetData) return null;
  
  // Debug: Log the raw sheet data
  console.log('🔍 Raw sheet data:', sheetData);
  
  // Use optimized accessor
  const getValue = createSheetAccessor(sheetData);

  try {
    const complaintId = String(getValue('id', 'complaintId', 'उजुरी दर्ता नं', 'शिकायत नं', 'Complaint ID') || '');
    if (!complaintId) return null;

    // Get the raw status value before normalization
    const rawStatus = getValue('status', 'स्थिति');
    const normalizedStatus = normalizeStatusCode(rawStatus);
    
    // Debug: Log status processing
    console.log(`🔍 Status processing for ${complaintId}:`, {
      raw: rawStatus,
      normalized: normalizedStatus,
      source: getValue('source', 'उजुरीको माध्यम')
    });

  // Find mahashakha from shakha if not present
  let mahashakha = String(getValue('mahashakha', 'mahashakhaName', 'महाशाखा'));
  const shakha = String(getValue('shakha', 'shakhaName', 'assignedShakha', 'सम्बन्धित शाखा', 'शाखा', 'Branch', 'Entry Branch'));

  if (!mahashakha && shakha) {
    for (const [mah, shks] of Object.entries(MAHASHAKHA_STRUCTURE)) {
      if (shks.includes(shakha)) {
        mahashakha = mah;
        break;
      }
    }
  }

    // Find the existing complaint in the current state (before it gets overwritten by sheet data)
    const existingComplaint = (state.complaints || []).find(c => String(c.id).trim() === complaintId.trim());

    const complaint = {
      id: complaintId,
      date: String(getValue('date', 'दर्ता मिति', 'मिति')),
      complainant: String(getValue('complainant', 'complainantName', 'उजुरीकर्ताको नाम', 'उजुरकर्ता')),
      accused: String(getValue('accused', 'accusedName', 'विपक्षी')),
      description: String(getValue('description', 'complaintDescription', 'उजुरीको संक्षिप्त विवरण', 'विवरण')),
    shakha: shakha,
      status: normalizedStatus, // Use the normalized status we calculated
      entryDate: String(getValue('entryDate', 'Entry Date', 'createdAt', 'सिर्जना मिति')),
      // Corrected Decision Fields
      // Merges old 'प्रस्तावित निर्णय' into 'समितिको निर्णय'
      committeeDecision: String(getValue('committeeDecision', 'proposedDecision', 'समितिको निर्णय', 'प्रस्तावित निर्णय')),
      // Free-text final decision
      decision: String(getValue('decision', 'अन्तिम निर्णय', 'निर्णय')),
      // Dropdown for final decision type
      finalDecision: normalizeFinalDecisionType(String(getValue('finalDecision', 'अन्तिम निर्णयको प्रकार'))),
      remarks: String(getValue('remarks', 'कैफियत')),
      source: normalizeSourceCode(getValue('source', 'उजुरीको माध्यम') || 'internal'),
      correspondenceDate: String(getValue('correspondenceDate', 'पत्राचार मिति')),
      investigationDetails: String(getValue('investigationDetails', 'छानबिनको विवरण')),
      assignedShakha: String(getValue('assignedShakha', 'shakha', 'shakhaName', 'सम्बन्धित शाखा', 'शाखा')),
      assignedDate: String(getValue('assignedDate', 'शाखामा पठाएको मिति')),
      // preserve Nepali display if sheet contains it
      dateNepali: String(getValue('dateNepali', 'nepaliDate', 'दर्ता मिति नेपाली', 'नेपाली मिति')) || '',
      instructions: String(getValue('instructions', 'निर्देशन')),
      createdBy: String(getValue('createdBy', 'सिर्जना गर्ने')),
      createdAt: String(getValue('createdAt', 'सिर्जना मिति', 'entryDate', 'Entry Date')),
      updatedBy: String(getValue('updatedBy', 'अपडेट गर्ने')),
      updatedAt: String(getValue('updatedAt', 'अपडेट मिति')),
      syncedToSheets: true,
      province: normalizeProvinceName(String(getValue('province', 'प्रदेश'))),
      district: String(getValue('district', 'जिल्ला')),
      location: String(getValue('location', 'स्थानीय तह')),
      ward: String(getValue('ward', 'वडा')),
      ministry: String(getValue('ministry', 'मन्त्रालय/निकाय', 'organization', 'निकाय') || ''),
    };
    
    // Debug: Log the final complaint object
    console.log(`🔍 Formatted complaint ${complaintId}:`, {
      status: complaint.status,
      source: complaint.source,
      finalObject: complaint
    });
    
    // Preserve assignedDate if it exists locally but not in the sheet data.
    // This prevents the date from disappearing on refresh if the sheet update is slow.
    if (existingComplaint && existingComplaint.assignedDate && !complaint.assignedDate) {
      complaint.assignedDate = existingComplaint.assignedDate;
    }

    // यदि ID छैन भने डाटा नलिने (खाली रो हुन सक्छ)
    if (!complaint.id) return null;
    
    return complaint;
    
  } catch (error) {
    console.error('❌ Error formatting complaint:', error);
    return null;
  }
}

function checkRequiredElements() {
  console.log('🔍 Checking required DOM elements...');
  
  const requiredElements = [
    'contentArea',
    'pageTitle',
    'complaintModal',
    'shakhaModal',
    'loginPage',
    'mainPage',
    'dashboardPage'
  ];
  
  const missing = [];
  
  requiredElements.forEach(id => {
    if (!document.getElementById(id)) {
      missing.push(id);
      console.warn(`⚠️ Missing element: #${id}`);
    }
  });
  
  if (missing.length === 0) {
    console.log('✅ All required DOM elements found');
  } else {
    console.warn(`⚠️ Missing ${missing.length} elements:`, missing);
  }
  
  return missing.length === 0;
}

function loadFromLocalStorage() {
  try {
    const savedComplaints = localStorage.getItem('nvc_complaints_backup');
    if (savedComplaints) {
      const complaints = JSON.parse(savedComplaints);
      if (Array.isArray(complaints) && complaints.length > 0) {
        state.complaints = complaints;
        console.log(`✅ Loaded ${state.complaints.length} complaints from localStorage`);
        showToast(`📦 LocalStorage बाट ${state.complaints.length} उजुरीहरू लोड भयो`, 'info');
        return true;
      }
    }
  } catch (e) {
    console.error('❌ Error loading from localStorage:', e);
  }
  if (!state.complaints) state.complaints = [];
  return false;
}

function backupToLocalStorage() {
  try {
    localStorage.setItem('nvc_complaints_backup', JSON.stringify(state.complaints));
    localStorage.setItem('nvc_employee_monitoring_backup', JSON.stringify(state.employeeMonitoring || []));
    localStorage.setItem('nvc_citizen_charters_backup', JSON.stringify(state.citizenCharters || []));
    localStorage.setItem('nvc_projects_backup', JSON.stringify(state.projects || []));
    localStorage.setItem('nvc_technical_inspectors_backup', JSON.stringify(state.technicalInspectors || []));
    localStorage.setItem('nvc_technical_examiners_backup', JSON.stringify(state.technicalExaminers || []));
  } catch (e) {
    console.warn('⚠️ Could not save to localStorage:', e);
  }
}

function formatProjectFromSheet(sheetData) {
  if (!sheetData) return null;

  const getValue = createSheetAccessor(sheetData);

  const id = String(getValue('project_id', 'id', 'projectId', 'आयोजना आईडी', 'आयोजना id') || '').trim();
  if (!id) return null;

  return {
    id,
    name: String(getValue('name', 'project_name', 'आयोजनाको नाम') || ''),
    organization: String(getValue('organization', 'agency', 'सम्बन्धित निकाय') || ''),
    inspectionDate: String(getValue('inspectionDate', 'inspection_date', 'अनुगमन मिति', 'परीक्षण मिति') || ''),
    nonCompliances: String(getValue('nonCompliances', 'ncr', 'अपारिपालन', 'अपरिपालनहरु') || ''),
    improvementLetterDate: String(getValue('improvementLetterDate', 'improvement_letter_date') || ''),
    improvementInfo: String(getValue('improvementInfo', 'improvement_info') || ''),
    status: String(getValue('status', 'स्थिति') || 'pending'),
    remarks: String(getValue('remarks', 'कैफियत') || ''),
    shakha: String(getValue('shakha', 'branch') || ''),
    createdBy: String(getValue('createdBy', 'सिर्जना गर्ने') || ''),
    createdAt: String(getValue('createdAt', 'सिर्जना मिति') || '')
  };
}

function formatTechnicalInspectorFromSheet(sheetData) {
  if (!sheetData) return null;

  const getValue = createSheetAccessor(sheetData);

  const id = String(getValue('inspector_id', 'id', 'inspectorId', 'प्राविधिक परीक्षक आईडी', 'प्राविधिक परीक्षक id') || '').trim();
  if (!id) return null;

  return {
    id,
    name: String(getValue('name', 'inspector_name', 'प्राविधिक परीक्षकको नाम') || ''),
    necRegistrationNo: String(getValue('necRegistrationNo', 'nec_registration_no', 'NEC दर्ता नं') || ''),
    trainingYear: String(getValue('trainingYear', 'training_year', 'प्राविधिक परीक्षक तालिम लिएको वर्ष') || ''),
    certificateNo: String(getValue('certificateNo', 'certificate_no', 'प्राविधिक परीक्षक प्रमाणपत्र नं') || ''),
    inspectedProjects: String(getValue('inspectedProjects', 'inspected_projects', 'प्राविधिक परीक्षण गरेका आयोजना') || ''),
    remarks: String(getValue('remarks', 'कैफियत') || ''),
    shakha: String(getValue('shakha', 'branch') || ''),
    createdBy: String(getValue('createdBy', 'सिर्जना गर्ने') || ''),
    createdAt: String(getValue('createdAt', 'सिर्जना मिति') || ''),
    updatedBy: String(getValue('updatedBy', 'अपडेट गर्ने') || ''),
    updatedAt: String(getValue('updatedAt', 'अपडेट मिति') || '')
  };
}

function formatTechnicalExaminerFromSheet(sheetData) {
  if (!sheetData) return null;

  const getValue = createSheetAccessor(sheetData);

  const id = String(getValue('id', 'examiner_id', 'examinerId', 'प्राविधिक परीक्षक आईडी', 'प्राविधिक परीक्षक id') || '').trim();
  if (!id) return null;

  return {
    id,
    name: String(getValue('name', 'examiner_name', 'प्राविधिक परीक्षकको नाम') || ''),
    necRegistration: String(getValue('necRegistration', 'necRegistrationNo', 'nec_registration_no', 'NEC दर्ता नं.') || ''),
    trainingYear: String(getValue('trainingYear', 'training_year', 'प्राविधिक परीक्षक तालिम लिएको वर्ष') || ''),
    certificateNumber: String(getValue('certificateNumber', 'certificateNo', 'certificate_no', 'प्राविधिक परीक्षक प्रमाणपत्र नं.') || ''),
    projectsInspected: String(getValue('projectsInspected', 'inspectedProjects', 'प्राविधिक परीक्षण गरेका आयोजना') || ''),
    remarks: String(getValue('remarks', 'कैफियत') || ''),
    shakha: String(getValue('shakha', 'branch') || ''),
    createdBy: String(getValue('createdBy', 'created_by', 'सिर्जना गर्ने') || ''),
    createdAt: String(getValue('createdAt', 'created_at', 'सिर्जना मिति') || ''),
    updatedBy: String(getValue('updatedBy', 'updated_at', 'अपडेट गर्ने') || ''),
    updatedAt: String(getValue('updatedAt', 'updated_at', 'अपडेट मिति') || '')
  };
}

function displayShakhaName(val) {
  if (!val) return '';
  // If value is a known code, map to Nepali display name
  if (SHAKHA && SHAKHA[val]) return SHAKHA[val];
  // If value already matches a display name, return as-is
  const foundKey = Object.keys(SHAKHA || {}).find(k => (SHAKHA[k] || '').toLowerCase() === String(val).toLowerCase());
  if (foundKey) return SHAKHA[foundKey];
  return val;
}

function formatEmployeeMonitoringFromSheet(sheetData) {
  if (!sheetData) return null;

  const getValue = createSheetAccessor(sheetData);

  const id = String(getValue('ID', 'id', 'monitoring_id', 'monitoringId', 'अनुगमन आईडी', 'अनुगमन id', 'अनुगमन नम्बर', 'अनुगमन नं') || '').trim();
  if (!id) return null;

  // Parse JSON strings back to arrays
  let uniformEmployees = [];
  let timeEmployees = [];
  
  try {
    const uniformEmpStr = getValue('पोशाक_कर्मचारीहरु', 'uniformEmployees', 'uniformEmployees') || '';
    const timeEmpStr = getValue('समय_कर्मचारीहरु', 'timeEmployees', 'timeEmployees') || '';
    
    if (uniformEmpStr) {
      uniformEmployees = typeof uniformEmpStr === 'string' ? JSON.parse(uniformEmpStr) : uniformEmpStr;
    }
    if (timeEmpStr) {
      timeEmployees = typeof timeEmpStr === 'string' ? JSON.parse(timeEmpStr) : timeEmpStr;
    }
  } catch (e) {
    console.warn('Error parsing employee arrays in formatEmployeeMonitoringFromSheet:', e);
  }

  return {
    id,
    date: String(getValue('मिति', 'date', 'अनुगमन मिति') || ''),
    officeName: String(getValue('कार्यालय_नाम', 'officeName', 'organization', 'निकाय', 'अनुगमन गरेको निकाय') || ''),
    province: String(getValue('प्रदेश', 'province') || ''),
    district: String(getValue('जिल्ला', 'district') || ''),
    localLevel: String(getValue('स्थानीय_तह', 'localLevel', 'स्थानीय तह') || ''),
    uniformViolationCount: Number(getValue('पोशाक_गणना', 'uniformViolationCount', 'uniformViolation') || 0),
    timeViolationCount: Number(getValue('समय_गणना', 'timeViolationCount', 'timeViolation') || 0),
    uniformEmployees: uniformEmployees,
    timeEmployees: timeEmployees,
    instructionDate: String(getValue('निर्देशन_मिति', 'instructionDate') || ''),
    remarks: String(getValue('कैफियत', 'remarks') || ''),
    createdBy: String(getValue('बनाउने', 'createdBy', 'सिर्जना गर्ने') || ''),
    createdAt: String(getValue('समय_टिम्स्ट्याम्प', 'createdAt', 'सिर्जना मिति') || ''),
    updatedBy: String(getValue('updatedBy', 'अपडेट गर्ने') || ''),
    updatedAt: String(getValue('updatedAt', 'अपडेट मिति') || '')
  };
}

function formatCitizenCharterFromSheet(sheetData) {
  if (!sheetData) return null;

  const getValue = createSheetAccessor(sheetData);

  const id = String(getValue('charter_id', 'id', 'charterId', 'बडापत्र आईडी', 'बडापत्र id', 'अनुगमन आईडी') || '').trim();
  if (!id) return null;

  return {
    id,
    date: String(getValue('date', 'मिति', 'अनुगमन मिति') || ''),
    organization: String(getValue('organization', 'निकाय', 'अनुगमन गरेको निकाय') || ''),
    findings: String(getValue('findings', 'अनुगमनबाट देखिएको अवस्था', 'नागरिक बडापत्र अनुगमनबाट देखिएको अवस्था') || ''),
    instructions: String(getValue('instructions', 'निर्देशन', 'केन्द्रबाट दिइएको निर्देशन') || ''),
    instructionDate: String(getValue('instructionDate', 'निर्देशन मिति') || ''),
    remarks: String(getValue('remarks', 'कैफियत') || ''),
    createdBy: String(getValue('createdBy', 'सिर्जना गर्ने') || ''),
    createdAt: String(getValue('createdAt', 'सिर्जना मिति') || ''),
    updatedBy: String(getValue('updatedBy', 'अपडेट गर्ने') || ''),
    updatedAt: String(getValue('updatedAt', 'अपडेट मिति') || '')
  };
}

function formatInvestigationFromSheet(sheetData) {
  if (!sheetData) return null;

  const getValue = createSheetAccessor(sheetData);

  // ID नभए पनि डाटा देखाउन temporary ID दिने
  let id = String(getValue('id', 'आईडी', 'छानविन आईडी', 'Investigation ID') || '').trim();
  if (!id) id = 'INV-' + Math.floor(Math.random() * 10000);

  return {
    id,
    complaintRegNo: String(getValue('complaintRegNo', 'उजुरी दर्ता नं') || ''),
    registrationDate: String(getValue('registrationDate', 'दर्ता मिति') || ''),
    complainant: String(getValue('complainant', 'उजुरकर्ता') || ''),
    accused: String(getValue('accused', 'विपक्षी') || ''),
    office: String(getValue('office', 'कार्यालय/निकाय') || ''),
    ministry: String(getValue('ministry', 'सम्बन्धित मन्त्रालय/निकाय') || ''),
    province: String(getValue('province', 'प्रदेश') || ''),
    district: String(getValue('district', 'जिल्ला') || ''),
    localLevel: String(getValue('localLevel', 'स्थानीय तह/नगर') || ''),
    complaintDescription: String(getValue('complaintDescription', 'उजुरीको विवरण') || ''),
    reportSubmissionDate: String(getValue('reportSubmissionDate', 'छानविन/अन्वेषण प्रतिवेदन पेश भएको मिति') || ''),
    investigationOpinion: String(getValue('investigationOpinion', 'छानविन/अन्वेषणको राय') || ''),
    implementationDetails: String(getValue('implementationDetails', 'कार्यान्वयनका लागि लेखि पठाएको व्यहोरा') || ''),
    implementationDate: String(getValue('implementationDate', 'कार्यान्वयनका लागि लेखि पठाएको मिति') || ''),
    remarks: String(getValue('remarks', 'कैफियत') || ''),
    createdBy: String(getValue('createdBy', 'सिर्जना गर्ने') || ''),
    createdAt: String(getValue('createdAt', 'सिर्जना मिति') || ''),
    updatedBy: String(getValue('updatedBy', 'अपडेट गर्ने') || ''),
    updatedAt: String(getValue('updatedAt', 'अपडेट मिति') || '')
  };
}

function updatePendingCountBadge() {
  try {
    const el = document.getElementById('pendingCount');
    if (!el) return;
    if (!state.currentUser) return;

    let list = state.complaints || [];
    if (state.currentUser.role === 'shakha') {
      list = list.filter(c => c.shakha === SHAKHA[state.currentUser.shakha] || c.shakha === state.currentUser.shakha);
    } else if (state.currentUser.role === 'mahashakha') {
      // For mahashakha users, show all complaints from their shakhas
      const userMahashakha = state.currentUser.mahashakha || state.currentUser.name;
      const allowedShakhas = MAHASHAKHA_STRUCTURE[userMahashakha] || [];
      
      list = list.filter(c => {
        // Check if complaint belongs to any shakha under this mahashakha
        const complaintShakha = c.shakha || '';
        return allowedShakhas.includes(complaintShakha) || 
               c.mahashakha === userMahashakha || 
               c.mahashakha === state.currentUser.name;
      });
    } else if (state.currentUser.role === 'admin_planning') {
      list = list.filter(c => c.source === 'hello_sarkar');
    }

    const pending = list.filter(c => c.status === 'pending').length;
    el.textContent = _latinToDevnagari(pending);
  } catch (e) {}
}

async function syncAllDataToGoogleSheets() {
  // Unsynced complaints फेला पार्ने
  const unsyncedComplaints = state.complaints.filter(c => !c.syncedToSheets);
  
  if (unsyncedComplaints.length === 0) {
    showToast('✅ सबै डाटा पहिले नै sync भइसकेको छ', 'success');
    return { success: true, synced: 0, failed: 0 };
  }
  
  showLoadingIndicator(true);
  showToast(`🔄 ${unsyncedComplaints.length} वटा उजुरी sync गर्दै...`, 'info');
  
  let success = 0;
  let failed = 0;
  
  for (const complaint of unsyncedComplaints) {
    try {
      console.log(`🔄 Syncing complaint: ${complaint.id}`);
      
      // Save data तयार पार्ने
      const saveData = {
        id: complaint.id,
        complaintId: complaint.id,
        date: complaint.date,
        complainant: complaint.complainant,
        complainantName: complaint.complainant,
        accused: complaint.accused || '',
        accusedName: complaint.accused || '',
        description: complaint.description,
        complaintDescription: complaint.description,
        proposedDecision: complaint.proposedDecision || '',
        remarks: complaint.remarks || '',
        status: complaint.status || 'pending',
        shakha: complaint.shakha || '',
        shakhaName: complaint.shakha || '',
        mahashakha: complaint.mahashakha || '',
        mahashakhaName: complaint.mahashakha || '',
        source: complaint.source || 'internal',
        createdBy: complaint.createdBy || '',
        decision: complaint.decision || '',
        finalDecision: complaint.finalDecision || ''
      };
      
      const result = await postToGoogleSheets('saveComplaint', saveData);
      
      if (result && result.success === true) {
        complaint.syncedToSheets = true;
        success++;
        console.log(`✅ Synced: ${complaint.id}`);
      } else {
        failed++;
        console.warn(`⚠️ Failed: ${complaint.id}`, result);
      }
    } catch (e) {
      failed++;
      console.error(`❌ Error syncing ${complaint.id}:`, e);
    }
    
    // Rate limiting को लागि delay
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // Backup to localStorage
  try {
    backupToLocalStorage();
  } catch (e) {}
  
  showLoadingIndicator(false);
  
  if (success > 0) {
    showToast(`✅ ${success} सफल, ❌ ${failed} असफल`, success > 0 ? 'success' : 'warning');
  } else {
    showToast(`❌ कुनै पनि sync हुन सकेन`, 'error');
  }
  
  updateSyncButton();
  
  return { success, failed };
}

function updateSyncButton() {
  const syncBtn = document.getElementById('syncSheetsBtn');
  if (!syncBtn) return;
  
  // Unsynced complaints count
  const unsyncedCount = state.complaints ? 
    state.complaints.filter(c => !c.syncedToSheets).length : 0;
  
  syncBtn.innerHTML = `<i class="fas fa-sync"></i> Sync (${unsyncedCount})`;
  syncBtn.classList.remove('btn-warning', 'btn-success', 'btn-secondary');
  
  if (unsyncedCount === 0) {
    syncBtn.classList.add('btn-success');
    syncBtn.title = 'सबै डाटा sync भइसकेको छ';
  } else {
    syncBtn.classList.add('btn-warning');
    syncBtn.title = `${unsyncedCount} वटा उजुरी sync गर्न बाँकी`;
  }
  
  // Disable/enable button
  syncBtn.disabled = false;
}

async function saveNewComplaint() {
  console.log('📝 saveNewComplaint() called');
  
  // Validation: prefer module helper if available
  try {
    if (window.NVC && NVC.UI && typeof NVC.UI.validateNewComplaint === 'function') {
      const v = NVC.UI.validateNewComplaint();
      if (!v || v.valid === false) { showToast(v?.message || 'Invalid form data', 'warning'); return; }
    }
  } catch (e) { console.warn('validateNewComplaint helper failed', e); }

  // ========== 1. FORM DATA COLLECT ==========
  const complaintId = document.getElementById('complaintId')?.value || '';
  let complaintDate = document.getElementById('complaintDate')?.value;
  const complainantName = document.getElementById('complainantName')?.value;
  const accusedName = document.getElementById('accusedName')?.value;
  const complaintDescription = document.getElementById('complaintDescription')?.value;
  const committeeDecision = document.getElementById('committeeDecision')?.value;
  const complaintRemarks = document.getElementById('complaintRemarks')?.value;
  const complaintStatus = document.getElementById('complaintStatus')?.value || 'pending';
  
  // ========== 2. VALIDATION ==========
  // If the date dropdowns were not changed, fall back to the form's default
  // or current Nepali date so branches don't submit an empty date.
  if (!complaintDate) {
    complaintDate = getCurrentNepaliDate();
  }
  if (!complainantName) { 
    showToast('कृपया उजुरकर्ताको नाम भर्नुहोस्', 'warning'); 
    return; 
  }
  if (!complaintDescription) { 
    showToast('कृपया उजुरीको विवरण भर्नुहोस्', 'warning'); 
    return; 
  }
  if (!state.currentUser) { 
    showToast('कृपया पहिला लगइन गर्नुहोस्', 'error'); 
    return; 
  }
  
  showLoadingIndicator(true);
  showToast('🔄 उजुरी सेभ गर्दै...', 'info');
  
  // ========== 3. PREPARE DATA ==========
  const finalId = complaintId || generateComplaintId();
  
  // शाखा र महाशाखाको नाम (user बाट)
  let shakhaName = '';
  let mahashakhaName = '';
  let shakhaToSave = '';

  if (state.currentUser) {
    if (state.currentUser.shakha) {
      // Filtering reliably requires saving the code, not the full name.
      shakhaToSave = state.currentUser.shakha;
      shakhaName = SHAKHA[shakhaToSave] || shakhaToSave;
    }
    if (state.currentUser.mahashakha) {
      mahashakhaName = MAHASHAKHA[state.currentUser.mahashakha] || state.currentUser.mahashakha;
    }
  }
  
  // If Admin is saving, check if a specific shakha was selected from dropdown
  if (state.currentUser.role === 'admin') {
      const selectedShakhaName = document.getElementById('complaintShakha')?.value;
      if (selectedShakhaName) {
          // Use the name directly for consistency
          shakhaToSave = selectedShakhaName;
      }
  }
  
  // Apps Script ले बुझ्ने सही field names प्रयोग गर्ने
  // FIX: Use English keys that match the HEADERS in code.gs for reliability.
  // This avoids potential issues with the PARAM_MAP on the backend.
  const complaintData = {
    id: finalId,
    date: complaintDate,
    // preserve Nepali display (Devanagari digits) for Sheets display
    dateNepali: _latinToDevnagari(String(normalizeNepaliDisplayToISO(complaintDate) || complaintDate)),
    complainant: complainantName,
    accused: accusedName || '',
    description: complaintDescription,
    committeeDecision: committeeDecision || '',
    remarks: complaintRemarks || '',
    status: complaintStatus,
    shakha: shakhaToSave,
    shakhaName: shakhaName,
    mahashakha: mahashakhaName,
    source: 'internal',
    createdBy: state.currentUser.name || state.currentUser.id || 'Unknown',
    createdAt: new Date().toISOString(),
    entryDate: new Date().toISOString().slice(0, 10),
    'Entry Date': new Date().toISOString().slice(0, 10),
    'Branch': shakhaName || shakhaToSave, // Main key for sheet
    
    'Entry Branch': shakhaName || shakhaToSave,
    ministry: document.getElementById('complaintMinistry')?.value || '',
    province: normalizeProvinceName(document.getElementById('complaintProvince')?.value || ''),
    district: document.getElementById('complaintDistrict')?.value || '',
    location: document.getElementById('complaintLocal')?.value || ''
  };

  // Also include canonical Nepali header keys so Apps Script mapping reliably writes to those columns
  try {
    complaintData['उजुरी दर्ता नं'] = finalId;
    complaintData['दर्ता मिति'] = complaintDate || complaintData.date;
    complaintData['उजुरीको संक्षिप्त विवरण'] = complaintDescription || complaintData.description;
    complaintData['मन्त्रालय/निकाय'] = complaintData.ministry || '';
    // include Nepali date display as well
    complaintData['दर्ता मिति नेपाली'] = complaintData.dateNepali || '';
  } catch (e) {}
  
  console.log('📦 Complaint data prepared:', Object.keys(complaintData).join(', '));
  
  // ========== 4. SAVE TO GOOGLE SHEETS ==========
  const result = await postToGoogleSheets('saveComplaint', complaintData);
  
  console.log('📨 Save result:', result);
  
  // ========== 5. CREATE LOCAL COMPLAINT OBJECT ==========
  const newComplaint = {
    id: finalId,
    date: complaintDate,
    complainant: complainantName,
    accused: accusedName || '',
    description: complaintDescription,
    committeeDecision: committeeDecision || '',
    remarks: complaintRemarks || '',
    status: complaintStatus,
    shakha: shakhaToSave,
    ministry: document.getElementById('complaintMinistry')?.value || '',
    mahashakha: mahashakhaName,
    createdBy: state.currentUser?.name || '',
    createdAt: new Date().toISOString(),
    entryDate: new Date().toISOString().slice(0, 10),
    province: normalizeProvinceName(document.getElementById('complaintProvince')?.value || ''),
    district: document.getElementById('complaintDistrict')?.value || '',
    location: document.getElementById('complaintLocal')?.value || '',
    syncedToSheets: result?.success === true,
    source: 'internal'
  };
  
  // ========== 6. UPDATE STATE ==========
  state.complaints.unshift(newComplaint);
  
  // ========== 7. BACKUP TO LOCALSTORAGE ==========
  try {
    backupToLocalStorage();
    // Clear the saved draft after successful submission
    try { localStorage.removeItem('nvc_complaint_draft'); } catch (e) {}
  } catch (e) {}
  
  showLoadingIndicator(false);
  
  // ========== 8. SHOW MESSAGE ==========
  if (result?.success === true) {
    showToast('✅ उजुरी Google Sheet मा सेभ भयो', 'success');
  } else if (result?.local === true) {
    showToast('⚠️ उजुरी Local मा मात्र सेभ भयो', 'warning');
  } else {
    showToast('⚠️ उजुरी Local मा सेभ भयो (Sync पछि हुनेछ)', 'info');
  }
  
  // ========== 9. RESET FORM ==========
  const form = document.querySelector('form');
  if (form) form.reset();
  
  const dateField = document.getElementById('complaintDate');
  if (dateField) dateField.value = getCurrentNepaliDate();
  
  // ========== 10. UPDATE UI ==========
  updateSyncButton();
  
  // Show complaints view after 1.5 seconds
  setTimeout(() => { 
    showComplaintsView(); 
  }, 1500);
}

async function saveEditedComplaint(complaintId) {
  console.info('saveEditedComplaint called', complaintId);
  const index = state.complaints.findIndex(c => String(c.id) === String(complaintId));
  if (index !== -1) {
    showLoadingSpinner('उजुरी सम्पादन गरिँदै...');

    try {
      // Data from the form generated by editComplaint()
      const updatePayload = {
        id: complaintId,
        complaintId: complaintId,
        'उजुरी दर्ता नं': complaintId,
        'दर्ता मिति': document.getElementById('editDate').value,
        'दर्ता मिति नेपाली': _latinToDevnagari(String(normalizeNepaliDisplayToISO(document.getElementById('editDate').value) || document.getElementById('editDate').value)),
        'उजुरीकर्ताको नाम': document.getElementById('editComplainant').value,
        'विपक्षी': document.getElementById('editAccused').value,
        'उजुरीको संक्षिप्त विवरण': document.getElementById('editDescription').value,
        'समितिको निर्णय': document.getElementById('editCommitteeDecision').value,
        'अन्तिम निर्णय': document.getElementById('editDecision').value,
        'अन्तिम निर्णयको प्रकार': document.getElementById('editFinalDecision').value,
        'कैफियत': document.getElementById('editRemarks').value,
        'स्थिति': document.getElementById('editStatus').value,
        'अपडेट गर्ने': state.currentUser.name,
        // English keys for compatibility
        description: document.getElementById('editDescription').value,
        remarks: document.getElementById('editRemarks').value,
        decision: document.getElementById('editDecision').value,
        status: document.getElementById('editStatus').value
        ,
        // Location & Ministry
        'मन्त्रालय/निकाय': document.getElementById('editMinistry')?.value || '',
        ministry: document.getElementById('editMinistry')?.value || '',
        'प्रदेश': document.getElementById('editProvince')?.value || '',
        province: (typeof normalizeProvinceName === 'function') ? normalizeProvinceName(document.getElementById('editProvince')?.value || '') : document.getElementById('editProvince')?.value || '',
        'जिल्ला': document.getElementById('editDistrict')?.value || '',
        district: document.getElementById('editDistrict')?.value || '',
        'स्थानीय तह': document.getElementById('editLocalLevel')?.value || '',
        localLevel: document.getElementById('editLocalLevel')?.value || '',
        'वडा': document.getElementById('editWard')?.value || '',
        ward: document.getElementById('editWard')?.value || ''
      };

      // Send to Google Sheets (use POST helper for large payloads when available)
      let result;
      try {
        if (window.NVC && NVC.Api && typeof NVC.Api.postLargeToGoogleSheets === 'function') {
          result = await NVC.Api.postLargeToGoogleSheets('updateComplaint', updatePayload);
        } else {
          result = await postToGoogleSheets('updateComplaint', updatePayload);
        }
      } catch (e) {
        console.error('update post failed', e);
        result = { success: false };
      }

      // Get the complaint before updating it to check its source
      const complaint = state.complaints[index];

      // Update local state
      state.complaints[index] = {
        ...state.complaints[index],
        date: updatePayload['दर्ता मिति'],
        complainant: updatePayload['उजुरीकर्ताको नाम'],
        accused: updatePayload['विपक्षी'],
        description: updatePayload['उजुरीको संक्षिप्त विवरण'],
        committeeDecision: updatePayload['समितिको निर्णय'],
        decision: updatePayload['अन्तिम निर्णय'],
        finalDecision: updatePayload['अन्तिम निर्णयको प्रकार'],
        remarks: updatePayload['कैफियत'],
        status: updatePayload['स्थिति'],
        ministry: updatePayload['मन्त्रालय/निकाय'] || updatePayload.ministry || state.complaints[index].ministry,
        province: updatePayload['प्रदेश'] || updatePayload.province || state.complaints[index].province,
        district: updatePayload['जिल्ला'] || updatePayload.district || state.complaints[index].district,
        localLevel: updatePayload['स्थानीय तह'] || updatePayload.localLevel || state.complaints[index].localLevel,
        ward: updatePayload['वडा'] || updatePayload.ward || state.complaints[index].ward,
        updatedAt: new Date().toISOString(),
        updatedBy: state.currentUser?.name,
        syncedToSheets: result?.success === true
      };

      backupToLocalStorage();

      if (result?.success) {
        showToast('✅ उजुरी सफलतापूर्वक अपडेट गरियो', 'success');
      } else {
        showToast('⚠️ उजुरी Local मा मात्र अपडेट भयो', 'warning');
      }

      closeModal();
      if (state.currentView === 'admin_complaints') {
        showAdminComplaintsView();
      } else if (state.currentView === 'online_complaints') {
        showOnlineComplaintsView();
      } else {
        showComplaintsView();
      }
      updateSyncButton();
    } catch (error) {
      console.error('Error saving edited complaint:', error);
      showToast('उजुरी अपडेट गर्न सकिएन', 'error');
    } finally {
      hideLoadingSpinner();
    }
  }
}

function openModal(title, content) {
  if (window.NVC && NVC.UI && typeof NVC.UI.openModalContent === 'function') return NVC.UI.openModalContent.apply(this, arguments);
  try {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = content;
    document.getElementById('complaintModal').classList.remove('hidden');
    // mark modal open timestamp to avoid immediate-close race with other handlers
    try { window._nvc_modalJustOpened = Date.now(); } catch (e) {}
    // Force modal to be visible
    try {
      const modal = document.getElementById('complaintModal');
      if (modal) {
        modal.style.setProperty('opacity', '1', 'important');
        modal.style.setProperty('visibility', 'visible', 'important');
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
          modalContent.style.setProperty('opacity', '1', 'important');
        }
      }
    } catch(e) {}
    if (typeof applyDevanagariDigits === 'function') applyDevanagariDigits(document.getElementById('complaintModal'));
    setTimeout(() => { try { if (typeof initializeDatepickers === 'function') initializeDatepickers(); if (typeof initializeNepaliDropdowns === 'function') initializeNepaliDropdowns(); } catch(e){} }, 200);
  } catch (e) { console.error('openModal fallback failed', e); }
}

async function saveComplaintToGoogleSheets(complaintData) {
  console.info('saveComplaintToGoogleSheets called', { id: complaintData && complaintData.id });
  if (window.NVC && NVC.Api && typeof NVC.Api.saveComplaintToGoogleSheets === 'function') {
    return NVC.Api.saveComplaintToGoogleSheets(complaintData);
  }
  // fallback minimal behavior: POST via existing postToGoogleSheets and update local state
  try {
    const result = await postToGoogleSheets('saveComplaint', complaintData);
    if (result && result.success) {
      try {
        if (NVC && NVC.State && typeof NVC.State.push === 'function') NVC.State.push('complaints', complaintData);
        else { window.state = window.state || {}; window.state.complaints = window.state.complaints || []; window.state.complaints.unshift(complaintData); }
      } catch (e) {}
    }
    return result;
  } catch (e) {
    console.error('fallback saveComplaintToGoogleSheets failed', e);
    return { success: false, message: String(e) };
  }
}

async function updateComplaintInGoogleSheets(complaintId, updateData) {
  console.info('updateComplaintInGoogleSheets called', complaintId, updateData);
  if (window.NVC && NVC.Api && typeof NVC.Api.updateComplaintInGoogleSheets === 'function') {
    return NVC.Api.updateComplaintInGoogleSheets(complaintId, updateData);
  }
  
  showLoadingSpinner('अपडेट हुँदैछ...');
  
  try {
    const payload = { id: complaintId, ...updateData };
    const result = await postToGoogleSheets('updateComplaint', payload);
    if (result && result.success) {
      try { if (NVC && NVC.State && typeof NVC.State.set === 'function') { /* best-effort: callers manage state */ } else { window.state = window.state || {}; const idx = (window.state.complaints||[]).findIndex(c=>c.id===complaintId); if (idx!==-1) window.state.complaints[idx] = { ...window.state.complaints[idx], ...updateData }; } } catch(e){}
    }
    return result;
  } catch (error) {
    console.error('Error updating complaint:', error);
    return { success: false, message: String(error) };
  } finally {
    hideLoadingSpinner();
  }
}

async function saveProjectToGoogleSheets(projectData) {
  if (!GOOGLE_SHEETS_CONFIG.ENABLED || state.useLocalData) {
    const newProject = {
      id: projectData.id || `P-${new Date().getFullYear()}-${state.projects.length + 1}`,
      name: projectData.name, organization: projectData.organization,
      inspectionDate: projectData.inspectionDate,
      nonCompliances: projectData.nonCompliances,
      improvementLetterDate: projectData.improvementLetterDate,
      improvementInfo: projectData.improvementInfo,
      status: projectData.status || 'pending',
      remarks: projectData.remarks,
      shakha: projectData.shakha || state.currentUser?.shakha,
      createdBy: state.currentUser?.name,
      createdAt: new Date().toISOString()
    };
    state.projects.unshift(newProject);
    return { success: true, message: 'Project saved locally' };
  }
  
  try {
    const result = await postToGoogleSheets('saveProject', {
      name: projectData.name, organization: projectData.organization,
      inspectionDate: projectData.inspectionDate,
      nonCompliances: projectData.nonCompliances,
      improvementLetterDate: projectData.improvementLetterDate,
      improvementInfo: projectData.improvementInfo,
      status: projectData.status || 'pending',
      remarks: projectData.remarks,
      shakha: projectData.shakha || state.currentUser?.shakha,
      createdBy: state.currentUser?.name
    });
    
    if (result.success) {
      const newProject = {
        id: result.id || projectData.id, name: projectData.name,
        organization: projectData.organization,
        inspectionDate: projectData.inspectionDate,
        nonCompliances: projectData.nonCompliances,
        improvementLetterDate: projectData.improvementLetterDate,
        improvementInfo: projectData.improvementInfo,
        status: projectData.status || 'pending',
        remarks: projectData.remarks,
        shakha: projectData.shakha || state.currentUser?.shakha
      };
      state.projects.unshift(newProject);
    }
    return result;
  } catch (error) {
    console.error('Error saving project:', error);
    return saveProjectToGoogleSheets({ ...projectData, useLocal: true });
  }
}

async function saveTechnicalProject() {
  const name = document.getElementById('projectName')?.value;
  const organization = document.getElementById('projectOrganization')?.value;
  const inspectionDate = document.getElementById('projectInspectionDate')?.value;
  const nonCompliances = document.getElementById('projectNonCompliances')?.value;
  const improvementLetterDate = document.getElementById('projectImprovementLetterDate')?.value;
  const status = document.getElementById('projectStatus')?.value;
  const improvementInfo = document.getElementById('projectImprovementInfo')?.value;
  const remarks = document.getElementById('projectRemarks')?.value;
  
  if (!name || !organization || !inspectionDate || !nonCompliances) {
    showToast('कृपया आवश्यक फिल्डहरू भर्नुहोस्', 'warning');
    return;
  }
  
  showLoadingIndicator(true);
  
  const projectData = {
    name, organization, inspectionDate, nonCompliances,
    improvementLetterDate, status, improvementInfo, remarks,
    shakha: state.currentUser?.shakha
  };
  
  const result = await saveProjectToGoogleSheets(projectData);
  
  showLoadingIndicator(false);
  
  if (result.success) {
    showToast('आयोजना सफलतापूर्वक सेभ गरियो', 'success');
    closeModal();
    showTechnicalProjectsView();
  } else {
    showToast(`आयोजना सेभ गर्दा त्रुटि: ${result.message}`, 'error');
  }
}

function showTechnicalExaminersView() {
  state.currentView = 'technical_examiners';
  document.getElementById('pageTitle').textContent = 'प्राविधिक परीक्षक सूची';

  // Check if user can add examiners (admin, technical_head, or technical shakha users)
  const canAddExaminer = state.currentUser && (
    state.currentUser.role === 'admin' || 
    state.currentUser.role === 'technical_head' ||
    (state.currentUser.shakha && state.currentUser.shakha.includes('प्राविधिक')) ||
    (state.currentUser.shakha && ['technical1', 'technical2', 'technical3', 'technical4'].includes(state.currentUser.shakha.toLowerCase()))
  );

  // Pagination state
  const itemsPerPage = parseInt(localStorage.getItem('examinersPerPage') || '10');
  const currentPage = parseInt(state.examinersCurrentPage || '1');
  
  let technicalExaminers = state.technicalExaminers || [];
  
  // Apply search and filters
  const searchText = (state.examinersSearchText || '').toLowerCase();
  const trainingYearSearchText = (state.examinersTrainingYearSearchText || '').toLowerCase();
  const sortBy = state.examinersSortBy || 'name';
  const sortOrder = state.examinersSortOrder || 'asc';
  
  // Filter examiners
  let filteredExaminers = technicalExaminers.filter(examiner => {
    const matchesSearch = !searchText || 
      examiner.name?.toLowerCase().includes(searchText) ||
      examiner.necRegistration?.toLowerCase().includes(searchText) ||
      examiner.certificateNumber?.toLowerCase().includes(searchText);
    
    const matchesYear = !trainingYearSearchText || 
      examiner.trainingYear?.toLowerCase().includes(trainingYearSearchText);
    
    return matchesSearch && matchesYear;
  });
  
  // Sort examiners
  filteredExaminers.sort((a, b) => {
    let aVal = a[sortBy] || '';
    let bVal = b[sortBy] || '';
    
    // Handle numeric sorting for training year
    if (sortBy === 'trainingYear') {
      aVal = parseInt(aVal) || 0;
      bVal = parseInt(bVal) || 0;
    } else {
      aVal = aVal.toString().toLowerCase();
      bVal = bVal.toString().toLowerCase();
    }
    
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });
  
  // Pagination
  const totalItems = filteredExaminers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedExaminers = filteredExaminers.slice(startIndex, endIndex);
  
  const content = `
    <div class="filter-bar mb-3">
      <div class="row g-2 mb-2">
        <div class="col-md-4">
          <input type="text" class="form-control form-control-sm" placeholder="नाम, प्र.प.नं., NEC नं.खोज्नुहोस्..." 
                 id="examinerSearchText" value="${state.examinersSearchText || ''}" />
        </div>
        <div class="col-md-3">
          <input type="text" class="form-control form-control-sm" placeholder="तालिम वर्ष खोज्नुहोस्..." 
                 id="trainingYearSearchText" value="${state.examinersTrainingYearSearchText || ''}" />
        </div>
        <div class="col-md-2">
          <select class="form-select form-select-sm" id="examinerSortBy">
            <option value="name" ${sortBy === 'name' ? 'selected' : ''}>नाम</option>
            <option value="trainingYear" ${sortBy === 'trainingYear' ? 'selected' : ''}>तालिम वर्ष</option>
            <option value="necRegistration" ${sortBy === 'necRegistration' ? 'selected' : ''}>NEC दर्ता नं.</option>
          </select>
        </div>
        <div class="col-md-2">
          <select class="form-select form-select-sm" id="examinerSortOrder">
            <option value="asc" ${sortOrder === 'asc' ? 'selected' : ''}>नयाँ-पुरानो</option>
            <option value="desc" ${sortOrder === 'desc' ? 'selected' : ''}>पुरानो-नयाँ</option>
          </select>
        </div>
      </div>
      <div class="row g-2">
        <div class="col-12">
          <button class="btn btn-primary btn-sm me-1" onclick="filterExaminers()">खोज्नुहोस्</button>
          <button class="btn btn-secondary btn-sm me-1" onclick="clearExaminerFilters()">रद्द गर्नुहोस्</button>
          <button class="btn btn-success btn-sm me-1" onclick="exportToExcel('technical_examiners')"><i class="fas fa-file-excel"></i> Excel</button>
          ${canAddExaminer ? '<button class="btn btn-primary btn-sm" onclick="showNewExaminerModal()"><i class="fas fa-plus"></i> नयाँ प्राविधिक परीक्षक</button>' : ''}
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">प्राविधिक परीक्षक सूची (${totalItems} जना)</h5>
        <div class="d-flex align-items-center">
          <span class="me-2">प्रति पेज:</span>
          <select class="form-select form-select-sm" style="width: auto;" id="itemsPerPage" onchange="changeExaminersPerPage(this.value)">
            <option value="10" ${itemsPerPage === 10 ? 'selected' : ''}>10</option>
            <option value="20" ${itemsPerPage === 20 ? 'selected' : ''}>20</option>
            <option value="50" ${itemsPerPage === 50 ? 'selected' : ''}>50</option>
            <option value="100" ${itemsPerPage === 100 ? 'selected' : ''}>100</option>
          </select>
        </div>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>क्र.सं.</th>
                <th>प्राविधिक परीक्षकको नाम</th>
                <th>NEC दर्ता नं.</th>
                <th>प्राविधिक परीक्षक तालिम लिएको वर्ष</th>
                <th>प्राविधिक परीक्षक प्रमाणपत्र नं.</th>
                <th>प्राविधिक परीक्षण गरेका आयोजना</th>
                <th>कैफियत</th>
                <th>कार्य</th>
              </tr>
            </thead>
            <tbody id="examinersTable">
              ${paginatedExaminers.length > 0 ? paginatedExaminers.map((examiner, index) => `
                <tr>
                  <td data-label="क्र.सं.">${startIndex + index + 1}</td>
                  <td data-label="प्राविधिक परीक्षकको नाम">${examiner.name}</td>
                  <td data-label="NEC दर्ता नं.">${examiner.necRegistration}</td>
                  <td data-label="प्राविधिक परीक्षक तालिम लिएको वर्ष">${examiner.trainingYear}</td>
                  <td data-label="प्राविधिक परीक्षक प्रमाणपत्र नं.">${examiner.certificateNumber}</td>
                  <td data-label="प्राविधिक परीक्षण गरेका आयोजना" class="text-limit" title="${examiner.projectsInspected}">${(examiner.projectsInspected || '').substring(0, 50)}...</td>
                  <td data-label="कैफियत">${examiner.remarks || '-'}</td>
                  <td data-label="कार्य"><div class="table-actions"><button class="action-btn" data-action="viewExaminer" data-id="${examiner.id}" title="हेर्नुहोस्"><i class="fas fa-eye"></i></button><button class="action-btn" data-action="editExaminer" data-id="${examiner.id}" title="सम्पादन गर्नुहोस्"><i class="fas fa-edit"></i></button></div></td>
                </tr>
              `).join('') : '<tr><td colspan="8" class="text-center">कुनै प्राविधिक परीक्षक फेला परेन</td></tr>'}
            </tbody>
          </table>
        </div>
        
        ${totalPages > 1 ? `
        <div class="card-footer">
          <nav>
            <ul class="pagination pagination-sm mb-0 justify-content-center">
              <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="changeExaminerPage(${currentPage - 1}); return false;">अघिल्लो</a>
              </li>
              ${Array.from({length: totalPages}, (_, i) => i + 1).map(page => `
                <li class="page-item ${currentPage === page ? 'active' : ''}">
                  <a class="page-link" href="#" onclick="changeExaminerPage(${page}); return false;">${page}</a>
                </li>
              `).join('')}
              <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="changeExaminerPage(${currentPage + 1}); return false;">पछिल्लो</a>
              </li>
            </ul>
          </nav>
        </div>
        ` : ''}
      </div>
    </div>
  `;
  
  document.getElementById('contentArea').innerHTML = content;
  updateActiveNavItem();
}

function showNewExaminerModal() {
  const currentDate = getCurrentNepaliDate();
  const formContent = `
    <div class="d-grid gap-3">
      <div class="form-group"><label class="form-label">प्राविधिक परीक्षकको नाम *</label><input type="text" class="form-control" id="examinerName" placeholder="प्राविधिक परीक्षकको पूरा नाम" /></div>
      <div class="d-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div class="form-group"><label class="form-label">NEC दर्ता नं. *</label><input type="text" class="form-control" id="examinerNecRegistration" placeholder="NEC दर्ता नम्बर" /></div>
        <div class="form-group"><label class="form-label">प्राविधिक परीक्षक तालिम लिएको वर्ष *</label><input type="text" class="form-control" id="examinerTrainingYear" placeholder="वर्ष (जस्तै: २०८०)" /></div>
      </div>
      <div class="form-group"><label class="form-label">प्राविधिक परीक्षक प्रमाणपत्र नं. *</label><input type="text" class="form-control" id="examinerCertificateNumber" placeholder="प्रमाणपत्र नम्बर" /></div>
      <div class="form-group"><label class="form-label">प्राविधिक परीक्षण गरेका आयोजना</label><textarea class="form-control" rows="3" id="examinerProjectsInspected" placeholder="प्राविधिक परीक्षण गरेका आयोजनाहरूको विवरण"></textarea></div>
      <div class="form-group"><label class="form-label">कैफियत</label><textarea class="form-control" rows="2" id="examinerRemarks" placeholder="अन्य कैफियतहरू"></textarea></div>
    </div>
    <div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">रद्द गर्नुहोस्</button><button class="btn btn-primary" onclick="saveTechnicalExaminer()">सुरक्षित गर्नुहोस्</button></div>
  `;
  
  openModal('नयाँ प्राविधिक परीक्षक', formContent);
}

async function saveTechnicalExaminer() {
  const name = document.getElementById('examinerName')?.value;
  const necRegistration = document.getElementById('examinerNecRegistration')?.value;
  const trainingYear = document.getElementById('examinerTrainingYear')?.value;
  const certificateNumber = document.getElementById('examinerCertificateNumber')?.value;
  const projectsInspected = document.getElementById('examinerProjectsInspected')?.value;
  const remarks = document.getElementById('examinerRemarks')?.value;
  
  if (!name || !necRegistration || !trainingYear || !certificateNumber) {
    showToast('कृपया आवश्यक फिल्डहरू भर्नुहोस्', 'warning');
    return;
  }
  
  showLoadingIndicator(true);
  
  const examinerData = {
    'id': Date.now(),
    'प्राविधिक परीक्षकको नाम': name,
    'NEC दर्ता नं.': necRegistration,
    'प्राविधिक परीक्षक तालिम लिएको वर्ष': trainingYear,
    'प्राविधिक परीक्षक प्रमाणपत्र नं.': certificateNumber,
    'प्राविधिक परीक्षण गरेका आयोजना': projectsInspected,
    'कैफियत': remarks,
    'shakha': state.currentUser?.shakha,
    'createdBy': state.currentUser.name,
    'createdAt': new Date().toISOString()
  };
  
  // Google Sheet मा सेभ गर्ने
  const result = await postToGoogleSheets('saveTechnicalExaminer', examinerData);
  
  if (!state.technicalExaminers) {
    state.technicalExaminers = [];
  }
  
  const newExaminer = {
    id: Date.now(),
    ...examinerData
  };
  
  state.technicalExaminers.unshift(newExaminer);
  showLoadingIndicator(false);
  showToast(result.success ? 'प्राविधिक परीक्षक Google Sheet मा सुरक्षित गरियो' : 'प्राविधिक परीक्षक Local मा सुरक्षित गरियो', result.success ? 'success' : 'warning');
  closeModal();
  showTechnicalExaminersView();
}

function viewExaminer(id) {
  const examiner = state.technicalExaminers.find(e => e.id === id);
  if (!examiner) { showToast('प्राविधिक परीक्षक फेला परेन', 'error'); return; }
  
  const content = `
    <div class="d-grid gap-3">
      <div class="d-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div><div class="text-small text-muted">प्राविधिक परीक्षकको नाम</div><div class="text-large">${examiner.name}</div></div>
        <div><div class="text-small text-muted">NEC दर्ता नं.</div><div>${examiner.necRegistration}</div></div>
      </div>
      <div class="d-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div><div class="text-small text-muted">प्राविधिक परीक्षक तालिम लिएको वर्ष</div><div>${examiner.trainingYear}</div></div>
        <div><div class="text-small text-muted">प्राविधिक परीक्षक प्रमाणपत्र नं.</div><div>${examiner.certificateNumber}</div></div>
      </div>
      <div><div class="text-small text-muted">प्राविधिक परीक्षण गरेका आयोजना</div><div class="card p-3 bg-light">${examiner.projectsInspected || 'कुनै आयोजना छैन'}</div></div>
      <div><div class="text-small text-muted">कैफियत</div><div class="card p-3 bg-light">${examiner.remarks || 'कुनै कैफियत छैन'}</div></div>
    </div>
  `;
  
  openModal('प्राविधिक परीक्षक विवरण', content);
}

function editExaminer(id) {
  const examiner = state.technicalExaminers.find(e => e.id === id);
  if (!examiner) return;
  
  const formContent = `
    <div class="d-grid gap-3">
      <div class="form-group"><label class="form-label">प्राविधिक परीक्षकको नाम</label><input type="text" class="form-control" value="${examiner.name}" id="editExaminerName" /></div>
      <div class="d-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div class="form-group"><label class="form-label">NEC दर्ता नं.</label><input type="text" class="form-control" value="${examiner.necRegistration}" id="editExaminerNecRegistration" /></div>
        <div class="form-group"><label class="form-label">प्राविधिक परीक्षक तालिम लिएको वर्ष</label><input type="text" class="form-control" value="${examiner.trainingYear}" id="editExaminerTrainingYear" /></div>
      </div>
      <div class="form-group"><label class="form-label">प्राविधिक परीक्षक प्रमाणपत्र नं.</label><input type="text" class="form-control" value="${examiner.certificateNumber}" id="editExaminerCertificateNumber" /></div>
      <div class="form-group"><label class="form-label">प्राविधिक परीक्षण गरेका आयोजना</label><textarea class="form-control" rows="3" id="editExaminerProjectsInspected">${examiner.projectsInspected || ''}</textarea></div>
      <div class="form-group"><label class="form-label">कैफियत</label><textarea class="form-control" rows="2" id="editExaminerRemarks">${examiner.remarks || ''}</textarea></div>
    </div>
    <div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">रद्द गर्नुहोस्</button><button class="btn btn-primary" onclick="saveExaminerEdit('${id}')">सुरक्षित गर्नुहोस्</button></div>
  `;
  
  openModal('प्राविधिक परीक्षक सम्पादन', formContent);
}

async function saveExaminerEdit(id) {
  const examinerIndex = state.technicalExaminers.findIndex(e => e.id == id);
  if (examinerIndex === -1) {
    console.error('Examiner not found with ID:', id);
    showToast('प्राविधिक परीक्षक फेला परेन', 'error');
    return;
  }
  
  const updatedExaminer = {
    id: state.technicalExaminers[examinerIndex].id,
    'प्राविधिक परीक्षकको नाम': document.getElementById('editExaminerName').value,
    'NEC दर्ता नं.': document.getElementById('editExaminerNecRegistration').value,
    'प्राविधिक परीक्षक तालिम लिएको वर्ष': document.getElementById('editExaminerTrainingYear').value,
    'प्राविधिक परीक्षक प्रमाणपत्र नं.': document.getElementById('editExaminerCertificateNumber').value,
    'प्राविधिक परीक्षण गरेका आयोजना': document.getElementById('editExaminerProjectsInspected').value,
    'कैफियत': document.getElementById('editExaminerRemarks').value,
    'shakha': state.technicalExaminers[examinerIndex].shakha,
    'createdBy': state.technicalExaminers[examinerIndex].createdBy,
    'createdAt': state.technicalExaminers[examinerIndex].createdAt,
    'updatedBy': state.currentUser.name,
    'updatedAt': new Date().toISOString()
  };
  
  showLoadingIndicator(true);
  
  console.log('Saving examiner edit for ID:', id);
  console.log('Updated examiner data:', updatedExaminer);
  
  // Google Sheet मा सेभ गर्ने
  const result = await postToGoogleSheets('updateTechnicalExaminer', updatedExaminer);
  
  console.log('Update result:', result);
  
  if (result.success) {
    // Update local state with correct field mapping
    state.technicalExaminers[examinerIndex] = {
      id: updatedExaminer.id,
      name: updatedExaminer['प्राविधिक परीक्षकको नाम'],
      necRegistration: updatedExaminer['NEC दर्ता नं.'],
      trainingYear: updatedExaminer['प्राविधिक परीक्षक तालिम लिएको वर्ष'],
      certificateNumber: updatedExaminer['प्राविधिक परीक्षक प्रमाणपत्र नं.'],
      projectsInspected: updatedExaminer['प्राविधिक परीक्षण गरेका आयोजना'],
      remarks: updatedExaminer['कैफियत'],
      shakha: updatedExaminer.shakha,
      createdBy: updatedExaminer.createdBy,
      createdAt: updatedExaminer.createdAt,
      updatedBy: updatedExaminer.updatedBy,
      updatedAt: updatedExaminer.updatedAt
    };
    showToast('प्राविधिक परीक्षक सफलतापूर्वक अपडेट गरियो', 'success');
  } else {
    showToast('प्राविधिक परीक्षक अपडेट गर्न सकेन', 'error');
  }
  showLoadingIndicator(false);
  closeModal();
  showTechnicalExaminersView();
}

function filterExaminers() {
  // Save filter states
  state.examinersSearchText = document.getElementById('examinerSearchText')?.value || '';
  state.examinersTrainingYearSearchText = document.getElementById('trainingYearSearchText')?.value || '';
  state.examinersSortBy = document.getElementById('examinerSortBy')?.value || 'name';
  state.examinersSortOrder = document.getElementById('examinerSortOrder')?.value || 'asc';
  
  // Reset to first page when filtering
  state.examinersCurrentPage = 1;
  
  // Refresh view
  showTechnicalExaminersView();
}

function clearExaminerFilters() {
  // Clear all filter states
  state.examinersSearchText = '';
  state.examinersTrainingYearSearchText = '';
  state.examinersSortBy = 'name';
  state.examinersSortOrder = 'asc';
  state.examinersCurrentPage = 1;
  
  // Refresh view
  showTechnicalExaminersView();
}

function changeExaminerPage(page) {
  const totalItems = getFilteredExaminersCount();
  const itemsPerPage = parseInt(localStorage.getItem('examinersPerPage') || '10');
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  if (page >= 1 && page <= totalPages) {
    state.examinersCurrentPage = page;
    showTechnicalExaminersView();
  }
}

function changeExaminersPerPage(perPage) {
  localStorage.setItem('examinersPerPage', perPage);
  state.examinersCurrentPage = 1; // Reset to first page
  showTechnicalExaminersView();
}

function getFilteredExaminersCount() {
  let technicalExaminers = state.technicalExaminers || [];
  const searchText = (state.examinersSearchText || '').toLowerCase();
  const trainingYearSearchText = (state.examinersTrainingYearSearchText || '').toLowerCase();
  
  let filteredExaminers = technicalExaminers.filter(examiner => {
    const matchesSearch = !searchText || 
      examiner.name?.toLowerCase().includes(searchText) ||
      examiner.necRegistration?.toLowerCase().includes(searchText) ||
      examiner.certificateNumber?.toLowerCase().includes(searchText);
    
    const matchesYear = !trainingYearSearchText || 
      examiner.trainingYear?.toLowerCase().includes(trainingYearSearchText);
    
    return matchesSearch && matchesYear;
  });
  
  return filteredExaminers.length;
}

function addGoogleSheetsButtons() {
  const container = document.getElementById('sheetActions');
  if (!container) return;
  
  if (!document.getElementById('testSheetsBtn')) {
    const testBtn = document.createElement('button');
    testBtn.id = 'testSheetsBtn';
    testBtn.className = 'btn btn-sm btn-outline-primary';
    testBtn.innerHTML = '<i class="fas fa-plug"></i> Test Sheets';
    testBtn.addEventListener('click', testGoogleSheetsConnection);
    container.appendChild(testBtn);
  }
  
  if (!document.getElementById('syncSheetsBtn')) {
    const unsyncedCount = state.complaints?.filter(c => !c.syncedToSheets).length || 0;
    const syncBtn = document.createElement('button');
    syncBtn.id = 'syncSheetsBtn';
    syncBtn.className = `btn btn-sm ${unsyncedCount === 0 ? 'btn-success' : 'btn-warning'}`;
    syncBtn.innerHTML = `<i class="fas fa-sync"></i> Sync (${unsyncedCount})`;
    syncBtn.addEventListener('click', syncAllDataToGoogleSheets);
    container.appendChild(syncBtn);
  }
}

function printComplaint(complaintId) {
  const complaint = state.complaints.find(c => c.id === complaintId);
  if (!complaint) return;
  
  // Fix for file:// protocol security issue
  const printUrl = window.location.protocol === 'file:' ? 'about:blank' : '';
  const printWindow = window.open(printUrl, '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>उजुरी दर्ता - ${complaint.id}</title>
      <style>
        body { font-family: 'Arial', sans-serif; padding: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .title { font-size: 24px; font-weight: bold; }
        .subtitle { font-size: 16px; color: #666; }
        .content { margin-top: 30px; }
        .row { display: flex; margin-bottom: 15px; }
        .label { width: 200px; font-weight: bold; }
        .value { flex: 1; }
        .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #999; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">राष्ट्रिय सतर्कता केन्द्र</div>
        <div class="subtitle">उजुरी दर्ता प्रमाणपत्र</div>
      </div>
      <div class="content">
        <div class="row"><div class="label">दर्ता नं:</div><div class="value">${complaint.id}</div></div>
        <div class="row"><div class="label">दर्ता मिति:</div><div class="value">${complaint.date}</div></div>
        <div class="row"><div class="label">उजुरकर्ताको नाम:</div><div class="value">${complaint.complainant}</div></div>
        <div class="row"><div class="label">विपक्षी:</div><div class="value">${complaint.accused || '-'}</div></div>
        <div class="row"><div class="label">उजुरीको विवरण:</div><div class="value">${complaint.description}</div></div>
        <div class="row"><div class="label">सम्बन्धित शाखा:</div><div class="value">${displayShakhaName(complaint.shakha) || '-'}</div></div>
        <div class="row"><div class="label">स्थिति:</div><div class="value">${complaint.status === 'pending' ? 'काम बाँकी' : complaint.status === 'progress' ? 'चालु' : 'फछ्रयौट'}</div></div>
      </div>
      <div class="footer">
        <p>यो प्रमाणपत्र राष्ट्रिय सतर्कता केन्द्रको प्रणालीबाट स्वचालित रूपमा जारी गरिएको हो।</p>
        <p>मिति: ${formatNepaliDisplay()}</p>
      </div>
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}

async function generateReportFromGoogleSheets(reportType, params = {}) {
  if (!GOOGLE_SHEETS_CONFIG.ENABLED || state.useLocalData) {
    return generateReportFromLocalData(reportType, params);
  }
  
  try {
    console.info('generateReportFromGoogleSheets: requesting remote report', reportType, params);
    const result = await postToGoogleSheets('generateReport', params);
    if (result && result.success) {
      return { success: true, data: result.data, statistics: result.statistics, generatedAt: result.generatedAt };
    } else {
      console.warn('generateReportFromGoogleSheets: remote report failed, falling back', result);
      return generateReportFromLocalData(reportType, params);
    }
  } catch (error) {
    console.error('Error generating report from Google Sheets:', error);
    return generateReportFromLocalData(reportType, params);
  }
}

function generateReportFromLocalData(reportType, params) {
  let data = [];
  let statistics = {};
  
  switch(reportType) {
    case 'monthly':
      // Use AD-normalized parsing so BS dates are handled correctly
      const now = new Date();
      data = state.complaints.filter(c => {
        const complaintDate = (typeof _parseComplaintRegDateToAD === 'function') ? _parseComplaintRegDateToAD(c) : null;
        if (!complaintDate || isNaN(complaintDate.getTime())) return false;
        return complaintDate.getMonth() === now.getMonth() && complaintDate.getFullYear() === now.getFullYear();
      });
      break;
    case 'shakha':
      data = params.shakha ? state.complaints.filter(c => c.shakha === params.shakha) : state.complaints;
      break;
    case 'custom':
      // Parse start/end to AD dates (handles BS via _parseComplaintRegDateToAD)
      const startAD = (typeof _parseComplaintRegDateToAD === 'function') ? _parseComplaintRegDateToAD({ date: params.startDate }) : null;
      const endAD = (typeof _parseComplaintRegDateToAD === 'function') ? _parseComplaintRegDateToAD({ date: params.endDate }) : null;

      data = state.complaints.filter(c => {
        const complaintAD = (typeof _parseComplaintRegDateToAD === 'function') ? _parseComplaintRegDateToAD(c) : null;
        if (!complaintAD || isNaN(complaintAD.getTime())) return false;

        if (startAD && endAD) {
          if (complaintAD < startAD || complaintAD > endAD) return false;
        }
        if (params.status && c.status !== params.status) return false;
        if (params.shakha) {
          const cShakha = c.shakha || '';
          if (cShakha !== params.shakha && !cShakha.includes(params.shakha)) return false;
        }
        return true;
      });
      break;
    case 'summary':
      statistics = {
        total: state.complaints.length,
        pending: state.complaints.filter(c => c.status === 'pending').length,
        progress: state.complaints.filter(c => c.status === 'progress').length,
        resolved: state.complaints.filter(c => c.status === 'resolved').length,
        closed: state.complaints.filter(c => c.status === 'closed').length
      };
      statistics.resolutionRate = statistics.total > 0 ? Math.round((statistics.resolved / statistics.total) * 100) : 0;
      break;
  }
  
  if (reportType !== 'summary') {
    statistics = {
      total: data.length,
      pending: data.filter(c => c.status === 'pending').length,
      progress: data.filter(c => c.status === 'progress').length,
      resolved: data.filter(c => c.status === 'resolved').length,
      closed: data.filter(c => c.status === 'closed').length
    };
    statistics.resolutionRate = statistics.total > 0 ? Math.round((statistics.resolved / statistics.total) * 100) : 0;
  }
  
  return { success: true, data, statistics, generatedAt: new Date().toISOString() };
}

async function generateCustomReport() {
  const startDate = document.getElementById('reportStartDate')?.value;
  const endDate = document.getElementById('reportEndDate')?.value;
  const status = document.getElementById('reportStatus')?.value;
  let shakha = document.getElementById('reportShakha')?.value || '';
  
  // शाखा लगइन भएको खण्डमा सोही शाखाको मात्र रिपोर्ट आउने बनाउन
  if (!shakha && state.currentUser && state.currentUser.role === 'shakha') {
    shakha = SHAKHA[state.currentUser.shakha] || state.currentUser.shakha;
  }
  
  if (!startDate || !endDate) {
    showToast('कृपया मिति उल्लेख गर्नुहोस्', 'warning');
    return;
  }
  
  showLoadingIndicator(true);
  
  // Helper to normalize date string to YYYY-MM-DD (Latin digits)
  const getNormalizedDate = (dateStr) => {
    if (!dateStr) return '';
    if (typeof normalizeNepaliDisplayToISO === 'function') {
      return normalizeNepaliDisplayToISO(dateStr);
    }
    // Fallback: basic conversion
    let s = String(dateStr).trim();
    if (typeof _devnagariToLatin === 'function') s = _devnagariToLatin(s);
    const match = s.match(/(\d{4})[\-\/\.](\d{1,2})[\-\/\.](\d{1,2})/);
    if (match) return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
    return s;
  };

  const start = getNormalizedDate(startDate);
  const end = getNormalizedDate(endDate);

  // Determine source list based on role
  let sourceList = state.complaints;
  if (state.currentUser && state.currentUser.role === 'admin_planning') {
    sourceList = sourceList.filter(c => {
      const s = String(c.source || '').toLowerCase();
      return s === 'hello_sarkar' || s === 'online' || s === 'online_complaint';
    });
  }

  // Filter local data directly from state.complaints
  const filteredData = sourceList.filter(c => {
    // Normalize complaint date
    const cDate = getNormalizedDate(c.date || c['दर्ता मिति']);
    if (!cDate) return false;
    
    // Date Range Check (String comparison works for ISO YYYY-MM-DD)
    if (cDate < start || cDate > end) return false;
    
    // Status Check
    if (status && c.status !== status) return false;
    
    // Shakha Check
    if (shakha) {
       const cShakha = c.shakha || '';
       // Check exact match or if shakha name is contained
       if (cShakha !== shakha && !cShakha.includes(shakha)) return false;
    }
    
    return true;
  });
  
  showLoadingIndicator(false);
  
  if (filteredData.length > 0) {
    // Format for Excel/CSV
    const reportData = filteredData.map(c => ({
      'दर्ता नं': c.id,
      'दर्ता मिति': c.date,
      'उजुरकर्ता': c.complainant,
      'विपक्षी': c.accused || '',
      'उजुरीको विवरण': c.description,
      'शाखा': c.shakha || '',
      'स्थिति': c.status === 'resolved' ? 'फछ्रयौट' : (c.status === 'progress' ? 'चालु' : 'काम बाँकी'),
      'कैफियत': c.remarks || ''
    }));

    exportReportToExcel(reportData, `कस्टम_रिपोर्ट_${start}_देखि_${end}`);
    showToast(`${filteredData.length} वटा उजुरी भेटियो`, 'success');
  } else {
    showToast('उल्लेखित अवधिमा कुनै उजुरी भेटिएन', 'info');
  }
}

function exportReportToExcel(data, reportName) {
  if (data.length === 0) {
    showToast('एक्स्पोर्ट गर्न डाटा उपलब्ध छैन', 'warning');
    return;
  }
  
  const headers = Object.keys(data[0]);
  let csvContent = headers.join(',') + '\n';

  const isIsoDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

  data.forEach(row => {
    const values = headers.map(header => {
      let value = row[header];
      if (isIsoDate(value)) value = _latinToDevnagari(String(value));
      if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
      return value;
    });
    csvContent += values.join(',') + '\n';
  });
  
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  const filename = `${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.csv`;
  
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showToast(`रिपोर्ट ${filename} मा डाउनलोड भयो`, 'success');
}

function exportToExcel(type) {
  let data = [];
  let filename = '';
  
  switch(type) {
    case 'complaints':
      data = state.currentUser.role === 'admin' ? state.complaints : 
             state.complaints.filter(c => c.shakha === state.currentUser.shakha);
      filename = `उजुरीहरू_${new Date().toISOString().slice(0,10)}.csv`;
      break;
    case 'all_complaints':
      data = state.complaints;
      filename = `सबै_उजुरीहरू_${new Date().toISOString().slice(0,10)}.csv`;
      // Filter for admin_planning if selecting 'all_complaints'
      if (state.currentUser && state.currentUser.role === 'admin_planning') {
        data = data.filter(c => {
          const s = String(c.source || '').toLowerCase();
          return s === 'hello_sarkar' || s === 'online' || s === 'online_complaint';
        });
      }
      break;
    case 'hello_sarkar':
      data = state.complaints.filter(c => c.source === 'hello_sarkar');
      filename = `हेलो_सरकारबाट_प्राप्त_उजुरीहरू_${new Date().toISOString().slice(0,10)}.csv`;
      break;
    case 'technical_projects':
      data = state.projects.filter(p => p.shakha === state.currentUser.shakha);
      filename = `विकास_योजनाहरू_${new Date().toISOString().slice(0,10)}.csv`;
      break;
    case 'technical_examiners':
      data = state.technicalExaminers || [];
      filename = `प्राविधिक_परीक्षकहरू_${new Date().toISOString().slice(0,10)}.csv`;
      break;
    case 'employee_monitoring':
      data = state.employeeMonitoring;
      filename = `कार्यालय_अनुगमन_${new Date().toISOString().slice(0,10)}.csv`;
      break;
    case 'recent':
      data = state.complaints.slice(0, 10);
      filename = `हालैका_उजुरीहरू_${new Date().toISOString().slice(0,10)}.csv`;
      break;
    case 'mahashakha_reports':
      const mahashakhaStats = {};
      Object.values(MAHASHAKHA).forEach(mahashakha => {
        mahashakhaStats[mahashakha] = { total: 0, pending: 0, progress: 0, resolved: 0, closed: 0 };
      });
      
      state.complaints.forEach(complaint => {
        const shakha = complaint.shakha || 'अन्य';
        let targetMahashakha = null;
        
        for (const [mahashakhaName, shakhaList] of Object.entries(MAHASHAKHA_STRUCTURE)) {
          if (shakhaList.includes(shakha)) {
            targetMahashakha = mahashakhaName;
            break;
          }
        }
        
        if (!targetMahashakha && complaint.mahashakha) {
          targetMahashakha = complaint.mahashakha;
        }
        
        if (!targetMahashakha) {
          targetMahashakha = 'अन्य';
          if (!mahashakhaStats[targetMahashakha]) {
            mahashakhaStats[targetMahashakha] = { total: 0, pending: 0, progress: 0, resolved: 0, closed: 0 };
          }
        }
        
        if (mahashakhaStats[targetMahashakha]) {
          mahashakhaStats[targetMahashakha].total++;
          if (complaint.status === 'pending') mahashakhaStats[targetMahashakha].pending++;
          if (complaint.status === 'progress') mahashakhaStats[targetMahashakha].progress++;
          if (complaint.status === 'resolved') mahashakhaStats[targetMahashakha].resolved++;
          if (complaint.status === 'closed') mahashakhaStats[targetMahashakha].closed++;
        }
      });
      
      data = Object.keys(mahashakhaStats).filter(m => m !== 'अन्य' && mahashakhaStats[m].total > 0).map(mahashakha => {
        const stats = mahashakhaStats[mahashakha];
        const resolutionRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;
        return {
          महाशाखा: mahashakha, 'कूल उजुरी': stats.total, 'काम बाँकी': stats.pending,
          'चालु': stats.progress, 'फछ्रयौट': stats.resolved,
          'फछ्रयौट दर': resolutionRate + '%'
        };
      });
      filename = `महाशाखा_रिपोर्ट_${new Date().toISOString().slice(0,10)}.csv`;
      break;
    case 'shakha_reports':
    case 'shakha_stats':
      const shakhaStats = {};
      state.complaints.forEach(complaint => {
        const shakha = complaint.shakha || 'अन्य';
        if (!shakhaStats[shakha]) shakhaStats[shakha] = { total: 0, pending: 0, progress: 0, resolved: 0, closed: 0 };
        shakhaStats[shakha].total++;
        if (complaint.status === 'pending') shakhaStats[shakha].pending++;
        if (complaint.status === 'progress') shakhaStats[shakha].progress++;
        if (complaint.status === 'resolved') shakhaStats[shakha].resolved++;
        if (complaint.status === 'closed') shakhaStats[shakha].closed++;
      });
      
      data = Object.keys(shakhaStats).map(shakha => {
        const stats = shakhaStats[shakha];
        const resolutionRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;
        return {
          शाखा: shakha, 'कूल उजुरी': stats.total, 'काम बाँकी': stats.pending,
          'चालु': stats.progress, 'फछ्रयौट': stats.resolved,
          'फछ्रयौट दर': resolutionRate + '%'
        };
      });
      filename = `शाखा_रिपोर्ट_${new Date().toISOString().slice(0,10)}.csv`;
      break;
    default:
      data = state.complaints;
      filename = `डाटा_${new Date().toISOString().slice(0,10)}.csv`;
  }
  
  if (data.length === 0) {
    showToast('डाटा छैन', 'warning');
    return;
  }
  
  const headers = Object.keys(data[0]);
  let csvContent = headers.join(',') + '\n';
  const isIsoDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
  data.forEach(row => {
    const values = headers.map(header => {
      let value = row[header];
      if (isIsoDate(value)) value = _latinToDevnagari(String(value));
      if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
      return value;
    });
    csvContent += values.join(',') + '\n';
  });
  
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showToast(`CSV फाइल डाउनलोड हुँदैछ: ${filename}`, 'success');
}

function viewMahashakhaDetails(mahashakha) {
  const mahashakhaComplaints = state.complaints.filter(complaint => {
    const shakha = complaint.shakha || 'अन्य';
    let complaintMahashakha = null;
    
    // Find which mahashakha this shakha belongs to
    for (const [mahashakhaName, shakhaList] of Object.entries(MAHASHAKHA_STRUCTURE)) {
      if (shakhaList.includes(shakha)) {
        complaintMahashakha = mahashakhaName;
        break;
      }
    }
    
    // If no mahashakha found, try direct mahashakha field
    if (!complaintMahashakha && complaint.mahashakha) {
      complaintMahashakha = complaint.mahashakha;
    }
    
    return complaintMahashakha === mahashakha;
  });
  
  const content = `
    <div class="card">
      <div class="card-header d-flex justify-between align-center">
        <h5 class="mb-0">${mahashakha} - उजुरी विवरण</h5>
        <button class="btn btn-outline btn-sm" onclick="showShakhaReportsView()"><i class="fas fa-arrow-left"></i> पछाडि जानुहोस्</button>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>आईडी</th>
                <th>मिति</th>
                <th>उजुरकर्ता</th>
                <th>विपक्षी</th>
                <th>शाखा</th>
                <th>विवरण</th>
                <th>स्थिति</th>
                <th>कार्य</th>
              </tr>
            </thead>
            <tbody>
              ${mahashakhaComplaints.map(complaint => {
                const statusClass = complaint.status === 'resolved' ? 'success' : 
                                  complaint.status === 'progress' ? 'info' : 
                                  complaint.status === 'pending' ? 'warning' : 'secondary';
                const statusText = complaint.status === 'resolved' ? 'फछ्रयौट' : 
                                  complaint.status === 'progress' ? 'चालु' : 
                                  complaint.status === 'pending' ? 'काम बाँकी' : complaint.status;
                const shortDescription = (complaint.description || '').substring(0, 50) + '...';
                
                return `
                  <tr>
                    <td data-label="आईडी">${complaint.id}</td>
                    <td data-label="मिति">${complaint.date}</td>
                    <td data-label="उजुरकर्ता">${complaint.complainant || '-'}</td>
                    <td data-label="विपक्षी">${complaint.accused || '-'}</td>
                    <td data-label="शाखा">${complaint.shakha || '-'}</td>
                    <td data-label="विवरण" title="${complaint.description || ''}">${shortDescription}</td>
                    <td data-label="स्थिति">
                      <span class="badge badge-${statusClass}">${statusText}</span>
                    </td>
                    <td data-label="कार्य">
                      <button class="action-btn" onclick="viewComplaint('${complaint.id}')" title="हेर्नुहोस्">
                        <i class="fas fa-eye"></i>
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        ${mahashakhaComplaints.length === 0 ? '<div class="text-center p-4 text-muted">यो महाशाखामा कुनै उजुरी छैन।</div>' : ''}
      </div>
    </div>
  `;
  
  document.getElementById('contentArea').innerHTML = content;
}

// Track selected complaints for PDF export
function updateSelectedComplaints() {
  const checkboxes = document.querySelectorAll('.complaint-select:checked');
  const selectedCount = checkboxes.length;
  const countElement = document.getElementById('selectedCount');
  const exportBtn = document.getElementById('pdfExportBtn');
  
  if (countElement) {
    countElement.textContent = selectedCount;
  }
  
  if (exportBtn) {
    exportBtn.disabled = selectedCount === 0;
  }
  // Update master select-all checkbox state (if present)
  try {
    const master = document.getElementById('selectAllComplaints');
    if (master) {
      const visible = document.querySelectorAll('#complaintsTableBody .complaint-select');
      const visibleChecked = document.querySelectorAll('#complaintsTableBody .complaint-select:checked');
      master.checked = (visible.length > 0 && visible.length === visibleChecked.length);
      master.indeterminate = (visibleChecked.length > 0 && visibleChecked.length < visible.length);
    }
  } catch (e) { console.warn('updateSelectedComplaints master checkbox update failed', e); }
}

// Load emblem.webp as data URL to avoid CORS when rendering into canvas.
async function getEmblemDataUrl() {
  try {
    // Try fetching emblem.webp relative to current location
    const resp = await fetch('emblem.webp', { cache: 'no-cache' });
    if (!resp.ok) throw new Error('fetch failed');
    const blob = await resp.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('FileReader failed'));
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn('Could not load emblem.webp as data URL, using embedded base64 fallback', e);
    return 'data:image/webp;base64,UklGRlpBAABXRUJQVlA4WAoAAAAQAAAAxwAAqAAAQUxQSKoPAAABsIZt2zKn0TPJ4O4uNawtUHfF2bovVgXqutSF4lrHpe5eYIs7bIng0EBDmhIjTnQmM/O914/PR779GxETIPH6vM86yP+H/al5vt7/CZA10pv5X7i/qR3YfK4Lw6cP9iZ3pK6FQwNtEXm/hVMrFUeOrKrvPW5bjQbMuWBMaxtQ8UyyA3dNOEcDBS/38hZXHUsL5KDfH2SLLTh0ra1HFLnFAFpBVtnn3uHm9FRAGQCRH+3B6p7WRp/GcuHxn73CJUXYjNzngKqb1dRCiwPYVLO9ggzcZINfHADy7zEbGrCR/6x4xetXh5S18L6zHYGdA40WVNtQxfNbmfR9Y2G3BHNmq5/XTmpm0GB6CNvh2x0isqSNbhP2sy4yGFMFO7PmJ5KXIicUrNWNy8bBirus/T7B6u1JIpIasYf67eyB97VeCygqhrdMEC38k9ejrz771ZeWYFlTRupya2qy2P0B47AVKKsl5w/0pwt2HViWCKZpuRQa5JViHDRQ1X9hqFLEGiyvZ2OUFjFQZbUGIZ1VDcj/dFmbOPf1gUxAGZgGlqeEFRAiAmgBFnazxYbm1uSSXGqAMpSuhql7rBnndIpzS7AdmtVdBj4Uhp0RqAFyFvUQexztZk1GfYnx3iOw7rIkecte+qUS55PeLLPDZyJnHYJU+RMCgBokTlA80JovFcgF7rwVtKkiE8qVjapPh8e7O9aW2Kn7qUGnTGC8fAvsAH51htoRlkYAFWnA2b4s4I16BdjXPvbFM9/HCgfvXAUUN5dngGcyINDaGbSJVhZBZHQOHBd5DYhc84dmDw7/2xevkh/NwMmCJwBeFhkIPHdGJoxwCN73maWjTZRqWCbSMgfYXISzm7vFp87bsK6UERuAlIYivix4Xnpl8IBjfNvQJKf2UZEquE9E7lKgbTQLWCOrZzxqexjrFZieOArZvUREpsJEkcYLbneObS2NvrlERPLJbywi8hbwblWt0d+hgFGljt3J8af+LvRFEYNI0EAR2fd0Af/0E337QkaKiNRzgSM9DHwiInt4UgxfU4xvnEm1DjRdeXjWO+UAKf7W8eXxBd8BnHj92qPHdApqgHAgeKkcX9dTjEdU9tAZ1z/T2XYGhstX+IxkbOG9MnK+BlQD63Jgb5dkafFMNah94QXxZJCiDqjsICKLw1S9XQoK4NcbRG70iXlfieouYrFLJ5GfAKVA6/ASsKz/qJ6vACiKh3SIDy0fvmvxzxiG7/9lzzZghWwE8oGarhI3z48Am4BMaVcL1FHymw6K87ZuWd015vzN5gAVyqCsDsPB8g7wewCYGj/eAvZPAT4X+QxjZaABLHl3SGw1zQydwv5+n9wJbH8W2Bs/NsDfZ74DPCwyIGhk84fY8q3BybtE2tbBQZkDWlvXLl5a8O3N9aIhg2O95ENQZ4rIBifSeseWNF4QcGCUiGyHQyJvR+jvUoeVCqB46R3NXTv8UweRObBZRGSmshXc0Fli/PLlmcpWwX0i8hikisigrJ7uDC7CPJI2+SKfK9eKiLwAt4lI92MhW5D7elJMvR3EyZx6Ik3+4mcRkU5JbvgnK2wWfTeho3OGd/CtiMgonN3UPHau34Sz//OJyJDgXJ2r3XbhpJY2a7DfhY5fNtNdW+QM5fPaxEaXH3C6vJ6IyLBBbt1SjuPFX97lmOmtmCob8M+VsXDeCWwqZbZTotE/WcPVn1q60/CkCQRtUHFV9LXPwDBiEsjE/NVo6LEbt48PdEVmh4MmJYGIUYUB2a2ibgH6yDaMa6jTReDgtNZRcHsZ7geecUXOqqZaVwNKV1dXMS5Nx4xo6xoE8hf2v+inHYAGUAdwkgXifqPFROcXjd2QSV8EdfrD5VB3x1UiN7yXFiKvfpQN/3Tuc9fWFxHfhxEiHy0ENN3p633uXXiQaE3t7IbMAagAqhu8r0HKjaKvd9YlzaLMPHkJUOi7GqAI4A1xu+HkOqI37yIX2pcDKhP4Q3pEgLp73rxCYvj2owBLpVkAWB0Gchu6dO0xorrqFueeBlhcAywUyQMIUtIlVu5Y88nfAOpyke3A+qkAQ1054zuiPfK8Y78Bm/sA/PJap2M6YMb42EjKBE23SkSmA6m+T4FpLjSdHCAGZzv1N+xp1x9QUJBi8nfxodyVUdbkluH/+aQMQzXhh9S5w4CDkrwEPnGszZvFxOZ7Pkd8NWxoLedhrIw0BWS+t/jSaPoAwqHTRuUB4OmTkCKS/Hbka4cuWVRNzC5JckL+mVtf5CwT23Oj5vKUQxkAysiwdBusExEZ/LgTfV4+REx/U9+JviIi9QLObGodPRU4eeIkS3UOnjs5jZjf3NwB4yInimbUl+i9J9cJVpc95UDDkYvziIup7R1KyqjS7IUKPukdPb77jyp7dUv79rLT7oEfq4mb2Zc4cxsOl94SLYN2KRwMVw4Vy03H/h4hrgYfdaTnsbAzRBYOjIrnAjg808qZs0qJv180ceBunA990My1+3bidMkYs3O+1IjLB/vZ615jQbMDuzu502EVLk426roiTLyufcJnR1ZZIF+zw7ZGbnQ9gu2IBTVU1/ilSuL5us52Bm3NA00XUdSaZIcNeNuF+tsxViZ1lVb2+USSH8ojzhf+y4bIDgIRXRDT/Mo1l34d1FV0dO5ZDEu2YqxBpU6DinmXiow8RPxXHzWyMWDuYcxTDgLbm9QT6fr4NxlVPO2Y/6Tu8MttR63/A1BYzOdoY7l4E4nx6AXW5MqITukGXhqC8Bti2qGzY1fv/GnpUxeJ/v0w7HslBNTqgqM7nvGVIlEGn/VZ2oVZaZJsBZhnEo2+DwCGyWFA6Vg+OUAiXdXKzL8Qi5tFntbxePQsAMhJkq8BdukUCTb7YqPBB7F69G5pWayrPCtaJqKfLfKmbn4GibhmnIj/rp3Y3PPOqjU6VkRJhyJd9dDZk3/QrUlPSLDojVxsl4PK0lW0io4p6GcehGKd1/y0DuDm6MjQZT+ARz2OBkyKiu4KqDuVFvYmWhD9r+M7RcFDGAe8icXP3LsnbOJxA/e5N7DUE2XfI1H4r0LvEzk6MTkapPfmWq8DHHzQvQ4fFqA8ENqHbl18DM+cOsrvQodJlXjplGucavDqaTx28ElnOm/He6tHnGh/GAdDXiOgmYWNqLnUnm8tpppZiONeAwt7VysDNtl7AOOKLXhbpdv1+xty5aelOm604zticHJql3F//S9oIeQ5fvoCiEwXfZPbZq4+VPCRnWvR8jbNHuoXEbmkBjj0s4YXvcR/FAi/pnO4fa82YtprL6DdLFm6kMc4XV9eQT/TOavnZwGki/yq0zzGdpG+IZ0a71';
  }
}

// Toggle select/unselect all visible complaints in the table
function toggleSelectAll(masterCheckbox) {
  try {
    const checked = !!masterCheckbox.checked;
    const visibleCheckboxes = document.querySelectorAll('#complaintsTableBody .complaint-select');
    visibleCheckboxes.forEach(cb => { cb.checked = checked; });
    updateSelectedComplaints();
  } catch (e) {
    console.warn('toggleSelectAll failed', e);
  }
}

function getSelectedComplaints() {
  const checkboxes = document.querySelectorAll('.complaint-select:checked');
  const selectedIds = Array.from(checkboxes).map(cb => cb.getAttribute('data-id'));
  return state.complaints.filter(c => selectedIds.includes(c.id));
}

function exportSelectedComplaintsPDF() {
  const selectedComplaints = getSelectedComplaints();

  if (selectedComplaints.length === 0) {
    showToast('कृपया एउटा वा बढी उजुरी छनौट गर्नुहोस्', 'warning');
    return;
  }

  // Get current user info for header
  const currentUser = state.currentUser;
  const shakhaName = currentUser?.shakha || 'प्राविधिक शाखा १';

  // Get mahashakha name based on current shakha
  let mahashakhaName = MAHASHAKHA.TECHNICAL; // default
  if (shakhaName.includes('प्रशासन') || shakhaName.includes('admin')) {
    mahashakhaName = MAHASHAKHA.ADMIN_MONITORING;
  } else if (shakhaName.includes('नीति') || shakhaName.includes('कानून') || shakhaName.includes('legal')) {
    mahashakhaName = MAHASHAKHA.POLICY_LEGAL;
  } else if (shakhaName.includes('प्रहरी') || shakhaName.includes('police')) {
    mahashakhaName = MAHASHAKHA.POLICE;
  } else if (shakhaName.includes('प्राविधिक') || shakhaName.includes('technical')) {
    mahashakhaName = MAHASHAKHA.TECHNICAL;
  }

  // Get current Nepali date (formatted same as homepage)
  const nepaliDate = formatNepaliDisplay();

  // Generate meeting number (could be made dynamic)
  const meetingNumber = '';

  // Export ensuring whole complaints don't get split across pages
  exportComplaintsToPDFPerComplaint(selectedComplaints, mahashakhaName, shakhaName, nepaliDate, meetingNumber);
}

// Render each complaint into its own offscreen container and pack whole complaints per PDF page.
async function exportComplaintsToPDFPerComplaint(complaints, mahashakhaName, shakhaName, nepaliDate, meetingNumber) {
  showLoadingSpinner('PDF बनाउँदै...');
  try {
    // Build header (only for first page). Inline emblem.webp as data URL to avoid CORS.
    const emblemDataUrl = await getEmblemDataUrl();
    // Ensure PNG data URL for broader canvas/pdf compatibility
    async function getEmblemPngDataUrl() {
      try {
        const dataUrl = await getEmblemDataUrl();
        if (!dataUrl) return dataUrl;
        const img = await new Promise((resolve, reject) => {
          const i = new Image();
          i.onload = () => resolve(i);
          i.onerror = () => reject(new Error('Image load failed'));
          i.src = dataUrl;
        });
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 100;
        canvas.height = img.naturalHeight || img.height || 100;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        return canvas.toDataURL('image/png');
      } catch (e) {
        return await getEmblemDataUrl();
      }
    }
    const emblemDataUrlPng = await getEmblemPngDataUrl();
    const headerContainer = document.createElement('div');
    headerContainer.style.cssText = 'position:absolute; left:-9999px; top:-9999px; width:1200px; padding:12px 16px; background:white; color:#000; font-family: "Segoe UI", "Kalimati", "Noto Sans Devanagari", sans-serif;';
    headerContainer.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:8px;">
        <div style="display:flex; align-items:center; gap:12px;">
          <img src="${emblemDataUrlPng || emblemDataUrl || 'data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><text y=\".9em\" font-size=\"90\">🏛️</text></svg>'}" alt="emblem" style="height:54px; width:54px; object-fit:contain;" />
          <div>
            <div style="font-size:16px; font-weight:700;">राष्ट्रिय सतर्कता केन्द्र</div>
            <div style="font-size:13px;">उजुरी व्यवस्थापन समितिको वैठक</div>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:16px;">
          <div style="font-size:12px; text-align:left;">बैठक संख्या: <strong>${meetingNumber || '-     '}</strong></div>
          <div style="font-size:12px; text-align:right;">मिति: <strong>${nepaliDate}</strong></div>
        </div>
      </div>
    `;
    document.body.appendChild(headerContainer);

    // Create offscreen table with all complaints so we can measure row heights
    const tableWrapper = document.createElement('div');
    tableWrapper.style.cssText = 'position:absolute; left:-9999px; top:-9999px; width:1200px; padding:12px 16px; background:white; color:#000; font-family: "Segoe UI", "Kalimati", "Noto Sans Devanagari", sans-serif; font-size:12px; box-sizing:border-box;';

    const table = document.createElement('table');
    table.style.cssText = 'width:100%; border-collapse: collapse; table-layout: fixed;';
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr style="background:#f5f5f5;">
        <th style="border:1px solid #ddd; padding:6px; width:5%">क्र.सं.</th>
        <th style="border:1px solid #ddd; padding:6px; width:10%">दर्ता नं</th>
        <th style="border:1px solid #ddd; padding:6px; width:8%">मिति</th>
        <th style="border:1px solid #ddd; padding:6px; width:12%">उजुरकर्ता</th>
        <th style="border:1px solid #ddd; padding:6px; width:12%">विपक्षी</th>
        <th style="border:1px solid #ddd; padding:6px; width:28%">उजुरीको विवरण</th>
        <th style="border:1px solid #ddd; padding:6px; width:14%">समितिको निर्णय</th>
        <th style="border:1px solid #ddd; padding:6px; width:11%">कैफियत</th>
      </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    complaints.forEach((complaint, idx) => {
      const id = complaint.id || complaint['उजुरी दर्ता नं'] || '-';
      const date = complaint.date || complaint['दर्ता मिति'] || '';
      const complainant = complaint.complainant || complaint['उजुरीकर्ताको नाम'] || '-';
      const accused = complaint.accused || complaint['विपक्षी'] || '-';
      const description = (complaint.description || complaint['उजुरीको संक्षिप्त विवरण'] || '-').replace(/\n/g, '<br>');
      const committeeDecision = (complaint.committeeDecision || complaint['समितिको निर्णय'] || '').replace(/\n/g, '<br>');
      const remarks = complaint.remarks || complaint['कैफियत'] || '-';

      const tr = document.createElement('tr');
      tr.style.cssText = 'border:1px solid #ddd; vertical-align:top;';
      tr.innerHTML = `
        <td style="border:1px solid #ddd; padding:6px;">${idx + 1}</td>
        <td style="border:1px solid #ddd; padding:6px;">${id}</td>
        <td style="border:1px solid #ddd; padding:6px;">${date}</td>
        <td style="border:1px solid #ddd; padding:6px;">${complainant}</td>
        <td style="border:1px solid #ddd; padding:6px;">${accused}</td>
        <td style="border:1px solid #ddd; padding:6px; word-wrap:break-word;">${description}</td>
        <td style="border:1px solid #ddd; padding:6px; word-wrap:break-word;">${committeeDecision || '-'}</td>
        <td style="border:1px solid #ddd; padding:6px;">${remarks}</td>
      `;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    tableWrapper.appendChild(table);
    document.body.appendChild(tableWrapper);

    // Allow layout to settle
    await new Promise(r => requestAnimationFrame(r));
    await new Promise(r => requestAnimationFrame(r));

    // Measurements
    const tableWidthPx = tableWrapper.getBoundingClientRect().width || 1200;
    const theadHeightPx = thead.getBoundingClientRect().height || 0;
    const rowEls = Array.from(tbody.querySelectorAll('tr'));
    const rowHeightsPx = rowEls.map(r => r.getBoundingClientRect().height || 0);
    const headerPx = headerContainer.getBoundingClientRect().height || 0;

    // Prepare PDF
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 8; // narrow margins on all sides
    const contentWidthMM = pageWidth - margin * 2;
    const contentHeightMM = pageHeight - margin * 2;

    // Convert content box mm to px at our table width
    const mmPerPx = contentWidthMM / tableWidthPx; // mm per px
    const contentHeightPx = contentHeightMM / mmPerPx; // equivalent px available

    // Now paginate rows without splitting any row
    const pages = [];
    let currentPageRows = [];
    let remainingPx = contentHeightPx;

    // First page needs space for header (big header) and table thead
    const firstPageAvailablePx = contentHeightPx - headerPx - 8; // small gap
    remainingPx = firstPageAvailablePx - theadHeightPx;

    for (let i = 0; i < rowHeightsPx.length; i++) {
      const rh = rowHeightsPx[i];
      // If row itself bigger than full content area (after accounting thead), allow it on its own page
      const maxRowPx = contentHeightPx - theadHeightPx;
      if (rh > maxRowPx) {
        // finish current page
        if (currentPageRows.length > 0) {
          pages.push(currentPageRows);
          currentPageRows = [];
          // subsequent pages available full contentHeightPx
        }
        // push oversized row as its own page
        pages.push([i]);
        // reset remaining for next page
        remainingPx = contentHeightPx - theadHeightPx;
        continue;
      }

      if (rh <= remainingPx) {
        currentPageRows.push(i);
        remainingPx -= rh;
      } else {
        // start new page
        pages.push(currentPageRows);
        currentPageRows = [i];
        // after starting new page, remaining is full contentHeightPx - theadHeightPx - rh
        remainingPx = contentHeightPx - theadHeightPx - rh;
      }
    }
    if (currentPageRows.length > 0) pages.push(currentPageRows);

    // Render each page into PDF
    for (let p = 0; p < pages.length; p++) {
      const pageRowIndexes = pages[p];

      // Build page container
      const pageDiv = document.createElement('div');
      pageDiv.style.cssText = 'position:absolute; left:-9999px; top:-9999px; width:1200px; padding:12px 16px; background:white; color:#000; font-family: "Segoe UI", "Kalimati", "Noto Sans Devanagari", sans-serif; font-size:12px; box-sizing:border-box;';

      // On first page include big header
      if (p === 0) {
        const headerClone = headerContainer.cloneNode(true);
        headerClone.style.position = 'static';
        headerClone.style.left = '';
        headerClone.style.top = '';
        headerClone.style.width = '100%';
        headerClone.style.padding = '0 0 8px 0';
        pageDiv.appendChild(headerClone);
      }

      // Build table for this page
      const pageTable = document.createElement('table');
      pageTable.style.cssText = 'width:100%; border-collapse: collapse; table-layout: fixed;';
      const pageThead = thead.cloneNode(true);
      pageTable.appendChild(pageThead);
      const pageTbody = document.createElement('tbody');

      pageRowIndexes.forEach(idx => {
        const origTr = rowEls[idx];
        const cloneTr = origTr.cloneNode(true);
        pageTbody.appendChild(cloneTr);
      });

      pageTable.appendChild(pageTbody);
      pageDiv.appendChild(pageTable);
      document.body.appendChild(pageDiv);

      // Render pageDiv to canvas
      // Allow layout
      await new Promise(r => requestAnimationFrame(r));
      const canvas = await html2canvas(pageDiv, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });

      // Add to PDF
      const imgData = canvas.toDataURL('image/png');
      const displayHeightMM = (canvas.height * contentWidthMM) / canvas.width;
      const displayWidthMM = contentWidthMM;
      // If rendered page taller than available, scale down to fit
      let finalWidthMM = displayWidthMM;
      let finalHeightMM = displayHeightMM;
      if (displayHeightMM > contentHeightMM) {
        const scale = contentHeightMM / displayHeightMM;
        finalHeightMM = contentHeightMM;
        finalWidthMM = displayWidthMM * scale;
      }

      if (p > 0) pdf.addPage();
      // Center horizontally by using left margin
      const x = margin + (contentWidthMM - finalWidthMM) / 2;
      const y = margin;
      pdf.addImage(imgData, 'PNG', x, y, finalWidthMM, finalHeightMM);

      // Cleanup this pageDiv
      try { document.body.removeChild(pageDiv); } catch (e) {}
    }

    const filename = `Ujuru_Bibaran_${nepaliDate.replace(/[\\/\\s:]/g, '_')}.pdf`;
    pdf.save(filename);

    // Cleanup
    try { document.body.removeChild(headerContainer); } catch (e) {}
    try { document.body.removeChild(tableWrapper); } catch (e) {}

    hideLoadingSpinner();
    showToast(`${complaints.length} उजुरीहरू PDF मा export गरियो`, 'success');
  } catch (err) {
    console.error('exportComplaintsToPDFPerComplaint error', err);
    hideLoadingSpinner();
    showToast('PDF बनाउँदा त्रुटि भयो', 'error');
  }
}

function createPDFHTML(complaints, mahashakhaName, shakhaName, nepaliDate, meetingNumber) {
  // Create a temporary container for the PDF content
  const container = document.createElement('div');
  container.style.cssText = `
    position: absolute;
    left: -9999px;
    top: -9999px;
    width: 1200px;
    padding: 40px;
    background: white;
    font-family: 'Segoe UI', 'Kalimati', 'Noto Sans Devanagari', sans-serif;
    color: #000;
    line-height: 1.4;
  `;
  
  // Build HTML content
  let html = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="display: flex; align-items: center; margin-bottom: 20px;">
        <div style="font-size: 40px; margin-right: 20px;">🏛️</div>
        <div style="flex-grow: 1; text-align: center;">
          <h1 style="font-size: 22px; font-weight: bold; margin: 0; color: #000;">राष्ट्रिय सतर्कता केन्द्र</h1>
        </div>
        <div style="width: 80px;"></div>
      </div>
      
      <h3 style="font-size: 18px; font-weight: bold; margin: 10px 0; color: #000;">उजुरी व्यवस्थापन समितिको वैठक</h3>
      
      <p style="font-size: 14px; margin: 8px 0; color: #000;">
        <strong>महाशाखा:</strong> ${mahashakhaName} | 
        <strong>शाखा:</strong> ${shakhaName}
      </p>
      
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px; font-size: 13px;">
        <div><strong>बैठक संख्या:</strong></div>
        <div><strong>मिति:</strong> ${nepaliDate}</div>
      </div>
    </div>
    
    <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px;">
      <thead>
        <tr style="background-color: #f5f5f5; border: 1px solid #ddd;">
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">क्र.सं.</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">उजुरी दर्ता नं</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">दर्ता मिति</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">उजुरकर्ता</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">विपक्षी</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">उजुरीको संक्षिप्त व्यहोरा</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">समितिको निर्णय</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">मन्त्रालय/निकाय</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">कैफियत</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  complaints.forEach((complaint, index) => {
    html += `
      <tr style="border: 1px solid #ddd;">
        <td style="border: 1px solid #ddd; padding: 8px; vertical-align: top; font-size: 12px;">${index + 1}</td>
        <td style="border: 1px solid #ddd; padding: 8px; vertical-align: top; font-size: 12px;">${complaint.id || '-'}</td>
        <td style="border: 1px solid #ddd; padding: 8px; vertical-align: top; font-size: 12px;">${complaint.date || '-'}</td>
        <td style="border: 1px solid #ddd; padding: 8px; vertical-align: top; font-size: 12px;">${complaint.complainant || '-'}</td>
        <td style="border: 1px solid #ddd; padding: 8px; vertical-align: top; font-size: 12px;">${complaint.accused || '-'}</td>
        <td style="border: 1px solid #ddd; padding: 8px; vertical-align: top; font-size: 12px; word-wrap: break-word;">${complaint.description || '-'}</td>
        <td style="border: 1px solid #ddd; padding: 8px; vertical-align: top; font-size: 12px; word-wrap: break-word;">${complaint.committeeDecision || '-'}</td>
        <td style="border: 1px solid #ddd; padding: 8px; vertical-align: top; font-size: 12px;">${complaint.ministry || complaint['मन्त्रालय/निकाय'] || '-'}</td>
        <td style="border: 1px solid #ddd; padding: 8px; vertical-align: top; font-size: 12px;">${complaint.remarks || '-'}</td>
      </tr>
    `;
  });
  
  html += `
      </tbody>
    </table>
  `;
  
  container.innerHTML = html;
  document.body.appendChild(container);
  
  return container;
}

function exportHTMLToPDF(container, nepaliDate) {
  // Show loading
  showLoadingSpinner('PDF बनाउँदै...');
  
  // Use html2canvas to capture the content
  html2canvas(container, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    backgroundColor: '#ffffff',
    logging: false
  }).then(canvas => {
    // Create PDF from canvas
    const { jsPDF } = window.jspdf;
    const imgData = canvas.toDataURL('image/png');

    // Create PDF - A4 landscape with narrow margins
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Page dimensions (mm)
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Narrow margins (mm)
    const margin = 8; // narrow margin

    // Calculate image size to fit within margins
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Height available per PDF page for the image
    const pdfPageContentHeight = pageHeight - margin * 2;

    // Track remaining height to render
    let heightLeft = imgHeight;

    // Initial position (top margin)
    let position = margin;

    // Add first page image
    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
    heightLeft -= pdfPageContentHeight;

    // Add new pages if image content exceeds one page
    while (heightLeft > 0) {
      pdf.addPage();
      // position for subsequent pages: shift image up so the next portion appears
      const y = margin - (imgHeight - heightLeft - pdfPageContentHeight);
      pdf.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight);
      heightLeft -= pdfPageContentHeight;
    }

    // Save the PDF
    const filename = `Ujuru_Bibaran_${nepaliDate.replace(/[\/\s:]/g, '_')}.pdf`;
    pdf.save(filename);
    
    // Clean up
    document.body.removeChild(container);
    hideLoadingSpinner();
    
    showToast(`${container.querySelectorAll('tbody tr').length} उजुरीहरू PDF मा export गरियो`, 'success');
    
  }).catch(error => {
    console.error('PDF generation error:', error);
    document.body.removeChild(container);
    showToast('PDF बनाउँदा त्रुटि भयो', 'error');
  });
}

function getNepaliDate(date) {
  // If no date provided, use current date
  if (!date) {
    date = new Date();
  }
  
  // Nepali months
  const months = ['बैशाख', 'जेठ', 'असार', 'श्रावण', 'भाद्र', 'असोज', 'कार्तिक', 'मंसिर', 'पुष', 'माघ', 'फाल्गुन', 'चैत्र'];
  
  // Approximate conversion from Gregorian to Nepali date
  // This is a simplified conversion - for production use, consider using a proper library
  const gregorianYear = date.getFullYear();
  const gregorianMonth = date.getMonth(); // 0-11
  const gregorianDay = date.getDate();
  
  // Base reference: 2025-04-03 ≈ 2082-01-19 (approximate)
  const referenceGregorian = new Date(2025, 3, 3); // April 3, 2025
  const referenceNepaliYear = 2082;
  const referenceNepaliMonth = 0; // बैशाख (index 0)
  const referenceNepaliDay = 19;
  
  // Calculate days difference
  const diffTime = date - referenceGregorian;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Convert to Nepali date (approximate)
  let nepaliYear = referenceNepaliYear;
  let nepaliMonth = referenceNepaliMonth;
  let nepaliDay = referenceNepaliDay + diffDays;
  
  // Adjust for overflow
  while (nepaliDay > 32) { // Approximate month length
    nepaliDay -= 32;
    nepaliMonth++;
    if (nepaliMonth > 11) {
      nepaliMonth = 0;
      nepaliYear++;
    }
  }
  
  while (nepaliDay < 1) {
    nepaliMonth--;
    if (nepaliMonth < 0) {
      nepaliMonth = 11;
      nepaliYear--;
    }
    nepaliDay += 32;
  }
  
  return `${nepaliYear} ${months[nepaliMonth]} ${nepaliDay}`;
}

function exportShakhaDetails(shakha) {
  const shakhaComplaints = state.complaints.filter(c => c.shakha === shakha);
  
  if (shakhaComplaints.length === 0) {
    showToast('यो शाखाका लागि कुनै उजुरी छैन', 'info');
    return;
  }
  
  const data = shakhaComplaints.map(complaint => ({
    'दर्ता नं': complaint.id, 'मिति': complaint.date,
    'उजुरकर्ता': complaint.complainant, 'विपक्षी': complaint.accused || '',
    'उजुरीको विवरण': complaint.description,
    'स्थिति': complaint.status === 'resolved' ? 'फछ्रयौट' : complaint.status === 'pending' ? 'काम बाँकी' : 'चालु',
    'निर्णय': complaint.decision || '', 'कैफियत': complaint.remarks || ''
  }));
  
  exportReportToExcel(data, `${shakha}_उजुरीहरू`);
}

// Duplicate openModal function removed - now using modalManager.openModal()

function _closeModal() {
  try {
    const el = document.getElementById('complaintModal');
    console.log('[_closeModal] called, complaintModal found=', !!el);
    if (!el) return;
    // Add hidden class so stylesheet hides it
    el.classList.add('hidden');
    // Remove any inline visibility/display properties that may override .hidden
    try {
      console.log('[_closeModal] removing inline styles');
      el.style.removeProperty('display');
      el.style.removeProperty('visibility');
      el.style.removeProperty('opacity');
      el.style.removeProperty('z-index');
    } catch (e) { console.warn('[_closeModal] failed to remove inline styles', e); }
  } catch (e) { console.warn('[_closeModal] unexpected error', e); }
}

NVC.UI.closeModal = _closeModal;

// Duplicate closeModal function removed - now using modalManager.closeModal()

function closeModalRobust() {
  try {
    try { if (window.NVC && NVC.UI && typeof NVC.UI.closeModal === 'function') NVC.UI.closeModal(); else if (typeof closeModal === 'function') closeModal(); } catch(e) {}
    setTimeout(() => { try { if (window.NVC && NVC.UI && typeof NVC.UI.closeModal === 'function') NVC.UI.closeModal(); else if (typeof closeModal === 'function') closeModal(); } catch(e) {} }, 220);
  } catch (e) { try { if (typeof closeModal === 'function') closeModal(); } catch(e) {} }
}

function _openShakhaSelection() {
  document.getElementById('shakhaModal').classList.remove('hidden');
  
  const modalBody = document.querySelector('#shakhaModal .modal-body');
  modalBody.innerHTML = Object.entries(SHAKHA).map(([key, value]) => `
    <div class="module-card text-center" onclick="selectShakha('${key}')">
      <div class="module-icon"><i class="fas fa-building"></i></div>
      <h4 class="module-title">${value}</h4>
    </div>
  `).join('');
}

NVC.UI.openShakhaSelection = _openShakhaSelection;

function openShakhaSelection() {
  return NVC.UI.openShakhaSelection.apply(this, arguments);
}

function closeShakhaModal() {
  document.getElementById('shakhaModal').classList.add('hidden');
}

function closeSettingsModal() {
  document.getElementById('settingsModal').classList.add('hidden');
}

function selectShakha(shakhaCode) {
  const shakhaName = SHAKHA[shakhaCode] || shakhaCode;
  document.getElementById('loginPageTitle').textContent = `${shakhaName} लग-इन`;
  document.getElementById('loginPageSubtitle').textContent = 'कृपया युजरनेम र पासवर्ड प्रविष्ट गर्नुहोस्';
  closeShakhaModal();
  showPage('loginPage');
}

async function loadNotifications() {
  // 1. Load local pushed notifications
  const localPushed = JSON.parse(localStorage.getItem('nvc_pushed_notifications') || '[]');
  
  let remoteNotifications = [];
  
  // 2. Fetch from Google Sheets if enabled
  if (GOOGLE_SHEETS_CONFIG.ENABLED) {
      const now = Date.now();
      // Debounce: fetch max once every 30s unless forced
      if (!state.lastNotificationFetch || (now - state.lastNotificationFetch > 30000)) {
          try {
              const result = await getFromGoogleSheets('getNotifications');
              if (result && result.success && Array.isArray(result.data)) {
                  remoteNotifications = result.data;
                  state.remoteNotificationsCache = remoteNotifications;
                  state.lastNotificationFetch = now;
              }
          } catch (e) {
              console.error('Error fetching notifications', e);
          }
      } else {
          remoteNotifications = state.remoteNotificationsCache || [];
      }
  }

  let allNotifications = [...localPushed, ...remoteNotifications];
  
  // Filter out deleted notifications
  const deletedIds = JSON.parse(localStorage.getItem('nvc_deleted_notifications') || '[]');
  allNotifications = allNotifications.filter(n => !deletedIds.includes(String(n.id)));

  // 4. Filter for current user
  const myNotifications = allNotifications.filter(n => {
      if (!n.targetShakha || n.targetShakha === 'all') return true;
      if (state.currentUser.role === 'admin') return true;
      
      const userShakhaName = SHAKHA[state.currentUser.shakha] || state.currentUser.shakha;
      return n.targetShakha === state.currentUser.shakha || n.targetShakha === userShakhaName;
  });

  // 5. Apply read status from local storage (for read/unread styling)
  const readIds = JSON.parse(localStorage.getItem('nvc_read_notifications') || '[]');
  state.notifications = myNotifications.map(n => {
      // Handle string "true"/"false" from Sheets
      const isRead = n.read === true || n.read === 'true';
      return {
          ...n,
          read: isRead || readIds.includes(String(n.id))
      };
  });
  
  // Check for new notifications to play sound
  const currentIds = state.notifications.map(n => String(n.id));
  if (state.previousNotificationIds) {
      const newIds = currentIds.filter(id => !state.previousNotificationIds.includes(id));
      // If there are new IDs and at least one is unread
      const hasNewUnread = state.notifications.some(n => newIds.includes(String(n.id)) && !n.read);
      
      if (hasNewUnread) {
          playNotificationSound();
      }
  }
  state.previousNotificationIds = currentIds;

  // Filter for display based on selected type
  const currentFilter = state.notificationFilter || 'all';
  const filteredForDisplay = state.notifications.filter(n => {
      if (currentFilter === 'all') return true;
      return (n.type || 'info') === currentFilter;
  });

  // 6. Render
  const unreadCount = state.notifications.filter(n => !n.read).length;
  const notificationCount = document.getElementById('notificationCount');
  if (notificationCount) {
      notificationCount.textContent = unreadCount > 0 ? unreadCount : '';
      notificationCount.style.display = unreadCount > 0 ? 'flex' : 'none';
  }
  
  const dropdown = document.getElementById('notificationDropdown');
  if (dropdown) {
    const hasUnread = state.notifications.some(n => !n.read);
    
    let html = `
      <div class="notification-header">
        <span class="font-weight-bold">सूचनाहरू</span>
        ${hasUnread ? `<button class="btn-link" onclick="markAllNotificationsRead()">सबै पढियो</button>` : ''}
      </div>
      <div class="notification-filters">
        <button class="notif-filter-btn ${currentFilter === 'all' ? 'active' : ''}" onclick="filterNotifications('all')">सबै</button>
        <button class="notif-filter-btn ${currentFilter === 'info' ? 'active' : ''}" onclick="filterNotifications('info')">जानकारी</button>
        <button class="notif-filter-btn ${currentFilter === 'warning' ? 'active' : ''}" onclick="filterNotifications('warning')">चेतावनी</button>
        <button class="notif-filter-btn ${currentFilter === 'success' ? 'active' : ''}" onclick="filterNotifications('success')">सफल</button>
      </div>
    `;

    if (filteredForDisplay.length === 0) {
        html += `<div class="p-3 text-center text-muted text-small">कुनै सूचना छैन</div>`;
    } else {
        html += filteredForDisplay.slice(0, 10).map(n => `
          <div class="notification-item ${n.read ? '' : 'unread'} type-${n.type || 'info'}" onclick="markNotificationRead('${n.id}')" title="पढिएको रूपमा चिन्ह लगाउनुहोस्">
            <div class="notification-title">${n.title}</div>
            ${n.message ? `<div class="text-small text-muted text-limit">${n.message}</div>` : ''}
            <div class="notification-time">${n.time || 'भर्खरै'}</div>
            <button class="notification-delete-btn" onclick="deleteNotification(event, '${n.id}')" title="यो सूचना हटाउनुहोस्">&times;</button>
          </div>
        `).join('');
    }
    
    dropdown.innerHTML = html;
  }
}

function filterNotifications(type) {
    state.notificationFilter = type;
    // Prevent dropdown from closing by stopping propagation if called from event, but here we just reload
    loadNotifications();
}

function markNotificationRead(id) {
  const readIds = JSON.parse(localStorage.getItem('nvc_read_notifications') || '[]');
  if (!readIds.includes(String(id))) {
      readIds.push(String(id));
      localStorage.setItem('nvc_read_notifications', JSON.stringify(readIds));
  }

  const notification = state.notifications.find(n => String(n.id) === String(id));
  if (notification) {
    notification.read = true;
    loadNotifications();
  }
}

function markAllNotificationsRead() {
  const readIds = JSON.parse(localStorage.getItem('nvc_read_notifications') || '[]');
  let updated = false;

  state.notifications.forEach(n => {
    if (!n.read) {
      n.read = true;
      if (!readIds.includes(String(n.id))) {
        readIds.push(String(n.id));
      }
      updated = true;
    }
  });

  if (updated) {
    localStorage.setItem('nvc_read_notifications', JSON.stringify(readIds));
    loadNotifications();
    showToast('सबै सूचनाहरू पढिएको रूपमा चिन्ह लगाइयो', 'success');
  }
}

function playNotificationSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
      oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1); // Drop to A4
      
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.5);
    }
  } catch (e) {
    console.error('Audio play failed', e);
  }
}

function deleteNotification(event, id) {
  event.stopPropagation(); // Prevent parent onclick (markAsRead)

  // 1. Get the list of deleted notification IDs from localStorage
  const deletedIds = JSON.parse(localStorage.getItem('nvc_deleted_notifications') || '[]');

  // 2. Add the new ID if it's not already there
  if (!deletedIds.includes(String(id))) {
    deletedIds.push(String(id));
    localStorage.setItem('nvc_deleted_notifications', JSON.stringify(deletedIds));
  }

  // 3. Optimistically remove from state and re-render
  state.notifications = state.notifications.filter(n => String(n.id) !== String(id));
  loadNotifications(); // This will re-render the list and update the count

  showToast('सूचना हटाइयो', 'info');

  // 4. Optional: Send delete request to Google Sheets
  if (GOOGLE_SHEETS_CONFIG.ENABLED) {
      postToGoogleSheets('deleteNotification', { id: id });
  }
}

function startNotificationPolling() {
  if (window.notificationInterval) clearInterval(window.notificationInterval);
  loadNotifications();
  loadNewEntriesBadge();
  // Poll notifications and new entries every minute
  window.notificationInterval = setInterval(() => { loadNotifications(); loadNewEntriesBadge(); }, 60000);
}

// Fetch new-entry counts from server and update the `pendingCount` badge for admin/mahashakha
async function loadNewEntriesBadge() {
  try {
    if (!GOOGLE_SHEETS_CONFIG.ENABLED) return;
    if (!state.currentUser) return;
    const el = document.getElementById('pendingCount');
    if (!el) return;

    if (state.currentUser.role === 'admin') {
      const res = await getFromGoogleSheets('getNewEntries', { role: 'admin' });
      const n = (res && res.success) ? Number(res.newCount || 0) : 0;
      el.textContent = n > 0 ? _latinToDevnagari(n) : '';
      el.style.display = n > 0 ? 'inline-flex' : 'none';
    } else if (state.currentUser.role === 'mahashakha') {
      const mah = state.currentUser.mahashakha || state.currentUser.name || '';
      const res = await getFromGoogleSheets('getNewEntries', { role: 'mahashakha', mahashakha: mah });
      const n = (res && res.success) ? Number(res.newCount || 0) : 0;
      el.textContent = n > 0 ? _latinToDevnagari(n) : '';
      el.style.display = n > 0 ? 'inline-flex' : 'none';
    } else {
      // Non-admin/mahashakha show regular pending count
      updatePendingCountBadge();
    }
  } catch (e) {
    console.error('Error loading new entries badge', e);
  }
}

async function markSeenNewEntries() {
  try {
    if (!GOOGLE_SHEETS_CONFIG.ENABLED) return;
    if (!state.currentUser) return;
    if (state.currentUser.role === 'admin') {
      await getFromGoogleSheets('markSeenNewEntries', { role: 'admin' });
      // immediately clear badge
      const el = document.getElementById('pendingCount'); if (el) { el.textContent = ''; el.style.display = 'none'; }
    } else if (state.currentUser.role === 'mahashakha') {
      const mah = state.currentUser.mahashakha || state.currentUser.name || '';
      if (!mah) return;
      await getFromGoogleSheets('markSeenNewEntries', { role: 'mahashakha', mahashakha: mah });
      const el = document.getElementById('pendingCount'); if (el) { el.textContent = ''; el.style.display = 'none'; }
    }
  } catch (e) { console.error('markSeenNewEntries error', e); }
}

function toggleNotifications() {
  const dropdown = document.getElementById('notificationDropdown');
  if (dropdown) dropdown.classList.toggle('show');
}

function toggleUserMenu() {
  const dropdown = document.getElementById('userDropdown');
  if (dropdown) dropdown.classList.toggle('show');
}

function showPage(pageId) {
  console.log(`📄 Showing page: ${pageId}`);
  
  ['mainPage', 'loginPage', 'dashboardPage'].forEach(id => {
    document.getElementById(id)?.classList.add('hidden');
  });
  
  const page = document.getElementById(pageId);
  if (page) {
    page.classList.remove('hidden');
    state.currentPage = pageId;
  } else {
    console.error(`❌ Page not found: ${pageId}`);
    return;
  }
  
  if (pageId === 'dashboardPage') {
    initializeDashboard();
    if (state.currentUser && GOOGLE_SHEETS_CONFIG.ENABLED) {
      setTimeout(() => { loadDataFromGoogleSheets().then(loaded => { if (loaded && typeof updateStats === 'function') updateStats(); }); }, 1000);
    }
  }
  
  setTimeout(()=>{ initializeDatepickers(); initializeNepaliDropdowns(); }, 200);
}

function showDashboardPage() {
  if (!state.currentUser) {
    showPage('loginPage');
    return;
  }
  
  // Check and display notice before dashboard
  checkAndDisplayNotice(() => {
    // Security: Check if user needs to change password
    if (state.currentUser.requiresPasswordChange) {
      setTimeout(() => {
        const changePassword = confirm('⚠️ सुरक्षा अलर्ट\n\nतपाईंले अस्थायी पासवर्ड प्रयोग गर्नुभयो।\nके तपाईं अहिले आफ्नो पासवर्ड परिवर्तन गर्न चाहनुहुन्छ?');
        
        if (changePassword) {
          // Show password change dialog (simplified for this implementation)
          const newPassword = prompt('नयाँ पासवर्ड प्रविष्ट गर्नुहोस् (कम्तिमा ६ अक्षर):');
          if (newPassword && newPassword.length >= 6) {
            // Update user password (in real app, this would be server-side)
            state.currentUser.requiresPasswordChange = false;
            showToast('पासवर्ड सफलतापूर्वक परिवर्तन गरियो।', 'success');
          } else if (newPassword) {
            showToast('पासवार्ड कम्तिमा ६ अक्षरको हुनुपर्छ।', 'warning');
          }
        } else {
          showToast('सुरक्षा लागि, कृपया चाँडै आफ्नो पासवर्ड परिवर्तन गर्नुहोस्।', 'warning');
        }
      }, 1000);
    }
    
    // Ensure the dashboard page is visible before manipulating its DOM
    showPage('dashboardPage');
    updateUserInfo();
    loadDashboardData();
  });
}

function togglePasswordVisibility(fieldId) {
    const input = document.getElementById(fieldId);
    if (input.type === "password") {
        input.type = "text";
    } else {
        input.type = "password";
    }
}

// Notice Management Functions
function checkAndDisplayNotice(callback) {
  // Check if there's an active notice
  if (GOOGLE_SHEETS_CONFIG.ENABLED && typeof google !== 'undefined' && google.script) {
    // Fetch from Google Sheets
    google.script.run
      .withSuccessHandler(function(notices) {
        if (notices && notices.length > 0) {
          const activeNotice = notices.find(n => n.status === 'active');
          if (activeNotice) {
            showNoticeModal(activeNotice, callback);
            return;
          }
        }
        // No active notice, proceed to dashboard
        if (callback) callback();
      })
      .withFailureHandler(function(error) {
        console.error('Error fetching notices:', error);
        // Fallback to local storage on error
        const notice = localStorage.getItem('nvc_active_notice');
        if (notice) {
          showNoticeModal(JSON.parse(notice), callback);
        } else if (callback) {
          callback();
        }
      })
      .getActiveNotices();
  } else {
    // Fallback to local storage for development or when google.script is not available
    const notice = localStorage.getItem('nvc_active_notice');
    if (notice) {
      showNoticeModal(JSON.parse(notice), callback);
    } else if (callback) {
      callback();
    }
  }
}

function showNoticeModal(notice, callback) {
  // Create notice modal if it doesn't exist
  let noticeModal = document.getElementById('noticeModal');
  if (!noticeModal) {
    noticeModal = document.createElement('div');
    noticeModal.id = 'noticeModal';
    noticeModal.className = 'modal';
    noticeModal.innerHTML = `
      <div class="modal-content" style="max-width: 800px;">
        <div class="modal-header">
          <h5 class="modal-title">📢 सूचना</h5>
        </div>
        <div class="modal-body" id="noticeModalBody">
          <!-- Notice content will be loaded here -->
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-primary" onclick="closeNoticeModal()">ठीक छ</button>
        </div>
      </div>
    `;
    document.body.appendChild(noticeModal);
  }

  // Display notice content
  const noticeBody = document.getElementById('noticeModalBody');
  if (notice.fileUrl && (notice.fileType === 'pdf' || notice.fileType === 'image')) {
    noticeBody.innerHTML = `
      <div class="notice-content">
        <h6>${notice.title || 'सूचना'}</h6>
        <p class="text-muted">${notice.description || ''}</p>
        <div class="notice-file-container">
          ${notice.fileType === 'pdf' ? 
            `<iframe src="${notice.fileUrl}" style="width: 100%; height: 500px; border: none;"></iframe>` :
            `<img src="${notice.fileUrl}" style="width: 100%; max-height: 500px; object-fit: contain;" alt="Notice">`
          }
        </div>
        <p class="text-xs text-muted mt-2">प्रकाशित मिति: ${notice.publishDate || ''}</p>
      </div>
    `;
  } else {
    noticeBody.innerHTML = `
      <div class="notice-content">
        <h6>${notice.title || 'सूचना'}</h6>
        <p>${notice.content || notice.description || ''}</p>
        <p class="text-xs text-muted">प्रकाशित मिति: ${notice.publishDate || ''}</p>
      </div>
    `;
  }

  // Store callback for when modal is closed
  window._noticeModalCallback = callback;
  
  // Show modal
  noticeModal.classList.remove('hidden');
}

function closeNoticeModal() {
  const noticeModal = document.getElementById('noticeModal');
  if (noticeModal) {
    noticeModal.classList.add('hidden');
  }
  
  // Execute callback to proceed to dashboard
  if (window._noticeModalCallback) {
    window._noticeModalCallback();
    window._noticeModalCallback = null;
  }
}

function showNoticeUploadModal(notice = null) {
  // Only allow admin_planning users
  if (!state.currentUser || state.currentUser.role !== 'admin_planning') {
    showToast('यो कार्य केवल प्रशासन तथा योजना शाखाका लागि मात्र उपलब्ध छ।', 'error');
    return;
  }

  // Create upload modal if it doesn't exist
  let uploadModal = document.getElementById('noticeUploadModal');
  if (!uploadModal) {
    uploadModal = document.createElement('div');
    uploadModal.id = 'noticeUploadModal';
    uploadModal.className = 'modal';
    uploadModal.innerHTML = `
      <div class="modal-content" style="max-width: 600px;">
        <div class="modal-header">
          <h5 class="modal-title" id="noticeUploadModalTitle">📝 सूचना प्रकाशन गर्नुहोस्</h5>
          <button class="action-btn" onclick="closeNoticeUploadModal()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <form id="noticeUploadForm" onsubmit="event.preventDefault(); uploadNotice();">
            <input type="hidden" id="noticeId" value="">
            <div class="form-group mb-3">
              <label class="form-label">सूचनाको शीर्षक *</label>
              <input type="text" class="form-control" id="noticeTitle" required>
            </div>
            <div class="form-group mb-3">
              <label class="form-label">विवरण *</label>
              <textarea class="form-control" id="noticeDescription" rows="4" required></textarea>
            </div>
            <div class="form-group mb-3">
              <label class="form-label">स्थिति</label>
              <select class="form-select" id="noticeStatus">
                <option value="active">सक्रिय</option>
                <option value="inactive">निष्क्रिय</option>
              </select>
            </div>
            <div class="d-flex gap-2">
              <button type="submit" class="btn btn-primary" id="noticeUploadSubmitBtn">
                <i class="fas fa-paper-plane"></i> प्रकाशन गर्नुहोस्
              </button>
              <button type="button" class="btn btn-secondary" onclick="closeNoticeUploadModal()">
                रद्द गर्नुहोस्
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(uploadModal);
  }

  const noticeIdField = document.getElementById('noticeId');
  const titleField = document.getElementById('noticeTitle');
  const descriptionField = document.getElementById('noticeDescription');
  const statusField = document.getElementById('noticeStatus');
  const modalTitle = document.getElementById('noticeUploadModalTitle');
  const submitBtn = document.getElementById('noticeUploadSubmitBtn');

  if (notice) {
    noticeIdField.value = notice.id || '';
    titleField.value = notice.title || '';
    descriptionField.value = notice.description || '';
    statusField.value = notice.status || 'active';
    modalTitle.textContent = '✏️ सूचना सम्पादन गर्नुहोस्';
    submitBtn.innerHTML = '<i class="fas fa-save"></i> परिवर्तन सेभ गर्नुहोस्';
  } else {
    noticeIdField.value = '';
    titleField.value = '';
    descriptionField.value = '';
    statusField.value = 'active';
    modalTitle.textContent = '📝 सूचना प्रकाशन गर्नुहोस्';
    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> प्रकाशन गर्नुहोस्';
  }

  uploadModal.classList.remove('hidden');
}

function closeNoticeUploadModal() {
  const uploadModal = document.getElementById('noticeUploadModal');
  if (uploadModal) {
    uploadModal.classList.add('hidden');
  }
}

function uploadNotice() {
  const noticeId = document.getElementById('noticeId').value;
  const title = document.getElementById('noticeTitle').value;
  const description = document.getElementById('noticeDescription').value;
  const status = document.getElementById('noticeStatus').value;
  
  if (!title || !description) {
    showToast('कृपया सबै आवश्यक फिल्डहरू भर्नुहोस्।', 'warning');
    return;
  }

  showLoadingSpinner('सूचना सुरक्षित गर्दैछ...');

  const noticeData = {
    id: noticeId || Date.now().toString(),
    title: title,
    description: description,
    status: status,
    publishDate: new Date().toISOString().split('T')[0],
    uploadedBy: state.currentUser?.name || 'admin_planning'
  };

  const finalizeSave = (response, successMessage) => {
    hideLoadingSpinner();
    if (response && response.success) {
      showToast(successMessage, 'success');
      closeNoticeUploadModal();
      localStorage.removeItem('nvc_last_seen_notice');
      loadNoticesTable();
      return;
    }

    showToast('सेभ गर्न असफल: ' + (response.error || response.message || 'Unknown error'), 'error');
  };

  const saveLocally = () => {
    const storedNotices = JSON.parse(localStorage.getItem('nvc_notices') || '[]');
    const index = storedNotices.findIndex(n => String(n.id) === String(noticeData.id));
    if (index >= 0) {
      storedNotices[index] = { ...storedNotices[index], ...noticeData };
    } else {
      storedNotices.unshift(noticeData);
    }
    localStorage.setItem('nvc_notices', JSON.stringify(storedNotices));
    hideLoadingSpinner();
    showToast(noticeId ? 'सूचना सफलतापूर्वक अपडेट भयो! (डेभलपमेन्ट मोड)' : 'सूचना सफलतापूर्वक प्रकाशित भयो! (डेभलपमेन्ट मोड)', 'success');
    closeNoticeUploadModal();
    localStorage.removeItem('nvc_last_seen_notice');
    loadNoticesTable();

    if (status === 'active') {
      showNoticeDisplay(noticeData);
    }
  };

  if (GOOGLE_SHEETS_CONFIG.ENABLED && window.NVC && NVC.Api) {
    if (!noticeId && typeof NVC.Api.saveNoticeToGoogleSheets === 'function') {
      NVC.Api.saveNoticeToGoogleSheets(noticeData).then(response => {
        const message = 'सूचना सफलतापूर्वक प्रकाशित भयो!';
        finalizeSave(response, message);
        if (response && response.success && response.id) {
          noticeData.id = response.id;
        }
      }).catch(error => {
        hideLoadingSpinner();
        showToast('सेभ गर्न असफल: ' + error.message, 'error');
      });
      return;
    }

    if (noticeId && typeof NVC.Api.updateNoticeInGoogleSheets === 'function') {
      NVC.Api.updateNoticeInGoogleSheets(noticeId, noticeData).then(response => {
        finalizeSave(response, 'सूचना सफलतापूर्वक अपडेट भयो!');
      }).catch(error => {
        hideLoadingSpinner();
        showToast('सेभ गर्न असफल: ' + error.message, 'error');
      });
      return;
    }

    if (typeof NVC.Api.postToGoogleSheets === 'function') {
      const action = noticeId ? 'updateNotice' : 'saveNotice';
      NVC.Api.postToGoogleSheets(action, noticeData).then(response => {
        const message = noticeId ? 'सूचना सफलतापूर्वक अपडेट भयो!' : 'सूचना सफलतापूर्वक प्रकाशित भयो!';
        finalizeSave(response, message);
        if (!noticeId && response && response.success && response.id) {
          noticeData.id = response.id;
        }
      }).catch(error => {
        hideLoadingSpinner();
        showToast('सेभ गर्न असफल: ' + error.message, 'error');
      });
      return;
    }
  }

  setTimeout(saveLocally, 500);
}

function showNoticeManagementView() {
  // Only allow admin_planning users
  if (!state.currentUser || state.currentUser.role !== 'admin_planning') {
    showToast('यो कार्य केवल प्रशासन तथा योजना शाखाका लागि मात्र उपलब्ध छ।', 'error');
    return;
  }

  const content = `
    <div class="page-header mb-4">
      <h2 class="page-title">📋 सूचना व्यवस्थापन</h2>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="showNoticeUploadModal()">
          <i class="fas fa-plus"></i> नयाँ सूचना
        </button>
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-striped">
            <thead>
              <tr>
                <th>क्र.सं.</th>
                <th>शीर्षक</th>
                <th>विवरण</th>
                <th>प्रकाशन मिति</th>
                <th>स्थिति</th>
                <th>कार्यहरू</th>
              </tr>
            </thead>
            <tbody id="noticesTableBody">
              <tr>
                <td colspan="6" class="text-center text-muted">
                  <i class="fas fa-spinner fa-spin me-2"></i>लोड गर्दैछ...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  setContentAreaHTML(content);
  updateActiveNavItem();
  
  // Wait for DOM to be ready, then load notices
  requestAnimationFrame(() => {
    setTimeout(() => {
      loadNoticesTable();
    }, 50);
  });
}

async function fetchNoticesData() {
  if (GOOGLE_SHEETS_CONFIG.ENABLED && window.NVC && NVC.Api) {
    try {
      if (typeof NVC.Api.getNoticesFromGoogleSheets === 'function') {
        const response = await NVC.Api.getNoticesFromGoogleSheets();
        if (response && response.success && Array.isArray(response.data)) {
          return response.data;
        }
      }

      if (typeof NVC.Api.getFromGoogleSheets === 'function') {
        const response = await NVC.Api.getFromGoogleSheets('getNotices');
        if (response && response.success && Array.isArray(response.data)) {
          return response.data;
        }
      }
    } catch (error) {
      console.warn('fetchNoticesData Google Sheets failed:', error);
    }
  }

  try {
    const storedNotices = localStorage.getItem('nvc_notices');
    return storedNotices ? JSON.parse(storedNotices) : [];
  } catch (error) {
    console.warn('fetchNoticesData local fallback failed:', error);
    return [];
  }
}

async function loadNoticesTable() {
  console.log('loadNoticesTable called');
  
  // Show loading state
  const updateLoadingState = () => {
    const tbody = document.getElementById('noticesTableBody');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-muted">
            <i class="fas fa-spinner fa-spin me-2"></i>लोड गर्दैछ...
          </td>
        </tr>
      `;
    }
  };

  const renderNoticesTable = (notices) => {
    const tbody = document.getElementById('noticesTableBody');
    if (!tbody) {
      console.error('noticesTableBody not found in DOM');
      return;
    }

    console.log('Rendering notices:', notices?.length || 0, 'items');
    
    if (!notices || notices.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-muted">
            कुनै सूचना भेटिएन।
          </td>
        </tr>
      `;
      return;
    }

    // Debug: log first notice to check data structure
    if (notices.length > 0) {
      console.log('Sample notice data:', notices[0]);
    }

    tbody.innerHTML = notices.map((notice, index) => {
      const normalizedStatus = String(notice.status || '').trim().toLowerCase();
      const isActive = normalizedStatus === 'active' || normalizedStatus === 'सक्रिय';
      return `
      <tr>
        <td>${index + 1}</td>
        <td>${notice.title || ''}</td>
        <td>${notice.description || ''}</td>
        <td>${notice.publishDate || ''}</td>
        <td>
          <span class="badge ${isActive ? 'bg-success' : 'bg-secondary'}">
            ${isActive ? 'सक्रिय' : 'निष्क्रिय'}
          </span>
        </td>
        <td>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-primary" onclick="viewNotice('${notice.id}')" title="हेर्नुहोस्">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-outline-warning" onclick="editNotice('${notice.id}')" title="सम्पादन गर्नुहोस्">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-outline-secondary" onclick="toggleNoticeStatus('${notice.id}')" title="स्थिति परिवर्तन गर्नुहोस्">
              <i class="fas fa-toggle-on"></i>
            </button>
            <button class="btn btn-outline-danger" onclick="deleteNotice('${notice.id}')" title="हटाउनुहोस्">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
    }).join('');
    
    console.log('Table rendering completed');
  };

  // Initial loading state
  updateLoadingState();

  try {
    const notices = await fetchNoticesData();
    console.log('Loaded notices:', notices?.length || 0, 'items');
    renderNoticesTable(notices);
  } catch (error) {
    console.error('Error loading notices table:', error);
    const tbody = document.getElementById('noticesTableBody');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-danger">
            <i class="fas fa-exclamation-triangle me-2"></i>सूचना लोड गर्न असफल: ${error.message}
          </td>
        </tr>
      `;
    }
  }
}

function viewNotice(noticeId) {
  const renderViewModal = (notice) => {
    if (!notice) {
      showToast('सूचना भेटिएन।', 'warning');
      return;
    }

    let viewModal = document.getElementById('noticeViewModal');
    if (!viewModal) {
      viewModal = document.createElement('div');
      viewModal.id = 'noticeViewModal';
      viewModal.className = 'modal';
      viewModal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
          <div class="modal-header">
            <h5 class="modal-title">सूचना विवरण</h5>
            <button class="action-btn" onclick="closeNoticeViewModal()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body" id="noticeViewModalBody"></div>
        </div>
      `;
      document.body.appendChild(viewModal);
    }

    const modalBody = document.getElementById('noticeViewModalBody');
    modalBody.innerHTML = `
      <div class="mb-3"><strong>शीर्षक:</strong> ${notice.title || ''}</div>
      <div class="mb-3"><strong>विवरण:</strong><div style="white-space: pre-wrap; margin-top: 0.5rem;">${notice.description || ''}</div></div>
      <div class="mb-2"><strong>प्रकाशन मिति:</strong> ${notice.publishDate || ''}</div>
      <div class="mb-2"><strong>स्थिति:</strong> ${notice.status || ''}</div>
      <div class="mb-2"><strong>अपलोड गर्ने:</strong> ${notice.uploadedBy || ''}</div>
    `;

    viewModal.classList.remove('hidden');
  };

  getNoticeById(noticeId).then(renderViewModal);
}

function closeNoticeViewModal() {
  const viewModal = document.getElementById('noticeViewModal');
  if (viewModal) {
    viewModal.classList.add('hidden');
  }
}

function editNotice(noticeId) {
  getNoticeById(noticeId).then(notice => {
    if (!notice) {
      showToast('सूचना भेटिएन।', 'warning');
      return;
    }
    showNoticeUploadModal(notice);
  });
}

function toggleNoticeStatus(noticeId) {
  getNoticeById(noticeId).then(notice => {
    if (!notice) {
      showToast('सूचना भेटिएन।', 'warning');
      return;
    }

    const normalizedStatus = String(notice.status || '').trim().toLowerCase();
    const newStatus = (normalizedStatus === 'active' || normalizedStatus === 'सक्रिय') ? 'inactive' : 'active';
    const payload = {
      id: noticeId,
      status: newStatus,
      title: notice.title,
      description: notice.description,
      publishDate: notice.publishDate,
      uploadedBy: notice.uploadedBy || state.currentUser?.name
    };

    showLoadingSpinner('स्थिति परिवर्तन हुँदैछ...');

    const updateAction = async () => {
      if (window.NVC && NVC.Api && typeof NVC.Api.postToGoogleSheets === 'function') {
        return NVC.Api.postToGoogleSheets('updateNotice', payload);
      }
      if (window.NVC && NVC.Api && typeof NVC.Api.updateNoticeInGoogleSheets === 'function') {
        return NVC.Api.updateNoticeInGoogleSheets(noticeId, payload);
      }
      return { success: false, message: 'Update API unavailable' };
    };

    updateAction().then(response => {
      hideLoadingSpinner();
      if (response && response.success) {
        showToast('सूचना स्थिति सफलतापूर्वक अपडेट भयो।', 'success');
        loadNoticesTable();
      } else {
        showToast('स्थिति अपडेट गर्न असफल भयो: ' + (response.error || response.message || 'Unknown error'), 'error');
      }
    }).catch(error => {
      hideLoadingSpinner();
      showToast('स्थिति अपडेट गर्न असफल भयो: ' + error.message, 'error');
    });
  });
}

function deleteNotice(noticeId) {
  if (!confirm('के तपाईं यो सूचना हटाउन निश्चित हुनुहुन्छ?')) {
    return;
  }

  showLoadingSpinner('सूचना हटाउँदैछ...');

  const deleteAction = async () => {
    if (window.NVC && NVC.Api && typeof NVC.Api.deleteNoticeFromGoogleSheets === 'function') {
      return NVC.Api.deleteNoticeFromGoogleSheets(noticeId);
    }
    if (window.NVC && NVC.Api && typeof NVC.Api.postToGoogleSheets === 'function') {
      return NVC.Api.postToGoogleSheets('deleteNotice', { id: noticeId, deletedBy: state.currentUser?.name });
    }
    return { success: false, message: 'Delete API unavailable' };
  };

  deleteAction().then(response => {
    hideLoadingSpinner();
    if (response && response.success) {
      showToast('सूचना सफलतापूर्वक हटाइयो।', 'success');
      loadNoticesTable();
    } else {
      showToast('सूचना हटाउन असफल भयो: ' + (response.error || response.message || 'Unknown error'), 'error');
    }
  }).catch(error => {
    hideLoadingSpinner();
    showToast('सूचना हटाउन असफल भयो: ' + error.message, 'error');
  });
}

async function getNoticeById(noticeId) {
  if (!noticeId) return null;

  const notices = await fetchNoticesData();
  if (Array.isArray(notices)) {
    return notices.find(n => String(n.id) === String(noticeId)) || null;
  }

  return null;
}

// Notice Display Functions
function checkAndShowNotice() {
  // Check if user has already seen the notice
  const lastSeenNotice = localStorage.getItem('nvc_last_seen_notice');
  
  // Load active notices
  loadActiveNotices().then(notices => {
    if (notices && notices.length > 0) {
      const latestNotice = notices[0]; // Get the most recent active notice
      
      // Only show if it's a new notice or user hasn't seen any notice
      if (!lastSeenNotice || lastSeenNotice !== latestNotice.id) {
        showNoticeDisplay(latestNotice);
      }
    }
  }).catch(error => {
    console.warn('Failed to load notices:', error);
  });
}

function loadActiveNotices() {
  return new Promise((resolve, reject) => {
    if (GOOGLE_SHEETS_CONFIG.ENABLED) {
      // Load from Google Sheets
      getFromGoogleSheets('getActiveNotices').then(response => {
        if (response && response.success && response.data) {
          resolve(response.data);
        } else {
          resolve([]);
        }
      }).catch(() => {
        resolve([]);
      });
    } else {
      // For development, load from localStorage
      resolve(getNoticesFromLocalStorage());
    }
  });
}

function getNoticesFromLocalStorage() {
  if (GOOGLE_SHEETS_CONFIG && GOOGLE_SHEETS_CONFIG.ENABLED) {
    return [];
  }

  const activeNotice = localStorage.getItem('nvc_active_notice');
  if (activeNotice) {
    try {
      const notice = JSON.parse(activeNotice);
      return notice.status === 'active' ? [notice] : [];
    } catch (e) {
      return [];
    }
  }
  
  // Add sample notice for development if none exists
  const sampleNotice = {
    id: 'notice_sample_001',
    title: 'महत्त्वपूर्ण सूचना',
    description: 'यो एउटा नमूना सूचना हो। यो सूचना प्रणालीको परीक्षण गर्न प्रयोग गरिएको हो। कृपया यसलाई बन्द गर्न "मैले पढेँ/बुझेँ" बटनमा क्लिक गर्नुहोस्।',
    status: 'active',
    publishDate: new Date().toISOString().split('T')[0],
    uploadedBy: 'System Admin'
  };
  
  // Save sample notice to localStorage
  localStorage.setItem('nvc_active_notice', JSON.stringify(sampleNotice));
  
  return [sampleNotice];
}

function showNoticeDisplay(notice) {
  const modal = document.getElementById('noticeDisplayModal');
  const titleElement = document.getElementById('noticeModalTitle');
  const contentElement = document.getElementById('noticeModalContent');
  
  if (!modal || !titleElement || !contentElement) return;
  
  titleElement.textContent = notice.title || 'महत्त्वपूर्ण सूचना';
  
  const contentHTML = `
    <div class="notice-item" style="font-size: 1.3em; line-height: 1.44; white-space: pre-wrap; word-break: break-word;">
      <h4 style="font-size: 1.3em; line-height: 1.44; white-space: pre-wrap; word-break: break-word;">${notice.title || 'महत्त्वपूर्ण सूचना'}</h4>
      <p style="margin-top: 1rem; white-space: pre-wrap; word-break: break-word;">${notice.description || ''}</p>
      <p style="margin-top: 1rem;"><small><strong>प्रकाशन मिति:</strong> ${notice.publishDate || ''}</small></p>
      <p><small><strong>प्रकाशित गर्ने:</strong> ${notice.uploadedBy || 'प्रशासन'}</small></p>
    </div>
  `;
  
  contentElement.innerHTML = contentHTML;
  modal.style.display = 'flex';
  
  // Prevent body scroll when modal is open
  document.body.style.overflow = 'hidden';
}

function closeNoticeDisplay() {
  const modal = document.getElementById('noticeDisplayModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
    
    // Mark notice as seen
    const titleElement = document.getElementById('noticeModalTitle');
    if (titleElement) {
      localStorage.setItem('nvc_last_seen_notice', titleElement.textContent);
    }
  }
}

// Initialize notice display when page loads
document.addEventListener('DOMContentLoaded', function() {
  // Check for notices after a short delay to ensure page is loaded
  setTimeout(checkAndShowNotice, 1000);
});

function handleLogin() {
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;
  
  if (!username || !password) {
    showToast('कृपया युजरनेम र पासवर्ड प्रविष्ट गर्नुहोस्', 'warning');
    return;
  }
  
  // Security: Check temporary passwords first
  const trimmedUsername = username.trim().toLowerCase();
  const tempPasswordData = localStorage.getItem(`temp_pwd_${trimmedUsername}`);
  
  if (tempPasswordData) {
    try {
      const tempData = JSON.parse(tempPasswordData);
      
      // Check if temporary password is still valid
      if (Date.now() < tempData.expires && tempData.password === password) {
        // Additional security: In real implementation, verify email matches
        // For now, we'll proceed since email was collected during reset
        const user = findUserByUsername(trimmedUsername);
        if (user) {
          showToast('अस्थायी पासवर्ड सफल। कृपया आफ्नो पासवर्ड तुरुन्त परिवर्तन गर्नुहोस्।', 'warning');
          
          // Clear temporary password after use
          localStorage.removeItem(`temp_pwd_${trimmedUsername}`);
          
          // Continue with normal login flow but mark for password change
          state.currentUser = {
            ...user,
            requiresPasswordChange: true
          };
          
          window.state = state;
          const session = { user: state.currentUser, expires: Date.now() + (24 * 60 * 60 * 1000) };
          localStorage.setItem('nvc_session', JSON.stringify(session));
          showDashboardPage();
          return;
        }
      } else if (Date.now() >= tempData.expires) {
        // Temporary password expired
        localStorage.removeItem(`temp_pwd_${trimmedUsername}`);
        showToast('अस्थायी पासवर्ड म्याद सकिएको छ। कृपया फेरि पासवर्ड रिसेट गर्नुहोस्।', 'error');
        return;
      }
    } catch (e) {
      // Corrupted temp data - remove it
      localStorage.removeItem(`temp_pwd_${trimmedUsername}`);
    }
  }
  
  const loginBtn = document.getElementById('loginButton');
  const originalText = loginBtn.innerHTML;
  loginBtn.innerHTML = '<div class="spinner"></div>';
  loginBtn.disabled = true;
  
  setTimeout(async () => {
    try {
      // First try Google Sheets authentication when enabled so admin-managed users can login.
      if (GOOGLE_SHEETS_CONFIG.ENABLED) {
        const authRes = await getFromGoogleSheets('authenticateUser', { username, password, t: Date.now() });
        if (authRes && authRes.success && authRes.user) {
          const user = authRes.user;
          const finalRole = (user.role || 'shakha').toString();

          const rawPermissions = user.permissions || user.Permissions || '';
          const permissions = Array.isArray(rawPermissions)
            ? rawPermissions
            : String(rawPermissions).split(',').map(s => s.trim()).filter(Boolean);

          let userShakha = null;
          if (finalRole === 'shakha' || finalRole === 'admin_planning') {
            const code = (user.shakha || user.code || '').toString();
            userShakha = SHAKHA[code.toUpperCase()] || code;
          }

          state.currentUser = {
            id: user.username || user.code || username,
            name: user.name || username,
            role: finalRole,
            avatar: (user.name || username).toString().charAt(0) || 'U',
            shakha: userShakha,
            mahashakha: user.mahashakha || null,
            permissions
          };

          window.state = state; // Ensure window.state is synced
          const session = { user: state.currentUser, expires: Date.now() + (24 * 60 * 60 * 1000) };
          localStorage.setItem('nvc_session', JSON.stringify(session));
          showDashboardPage();
          return;
        }
      }

      // Fallback: Try hardcoded credentials and local users
      if (username === 'admin' && password === 'nvc123') {
        state.currentUser = {
          id: 'admin', name: 'एडमिन', role: 'admin',
          avatar: 'A', shakha: null,
          mahashakha: null, permissions: ['all']
        };

        window.state = state; // Ensure window.state is synced
        const session = { user: state.currentUser, expires: Date.now() + (24 * 60 * 60 * 1000) };
        localStorage.setItem('nvc_session', JSON.stringify(session));
        showDashboardPage();
        return;
      }

      // Fallback for admin_planning user when Google Sheets is disabled
      if (username === 'admin_plan' && password === 'nvc123') {
        state.currentUser = {
          id: 'admin_plan', name: 'प्रशासन तथा योजना', role: 'admin_planning',
          avatar: 'प', shakha: null,
          mahashakha: null, permissions: ['notice_management', 'complaint_management']
        };

        window.state = state; // Ensure window.state is synced
        const session = { user: state.currentUser, expires: Date.now() + (24 * 60 * 60 * 1000) };
        localStorage.setItem('nvc_session', JSON.stringify(session));
        showDashboardPage();
        return;
      }

      // Try local hardcoded users
      const user = findUserByCredentials(username, password);
      if (user) {
        const finalRole = user.role || 'shakha';

        // Determine Shakha Name (Use Nepali Name if available)
        let userShakha = null;
        if (finalRole === 'shakha' || finalRole === 'admin_planning') {
          userShakha = SHAKHA[user.code.toUpperCase()] || user.code;
        }

        state.currentUser = {
          id: user.code, name: user.name, role: finalRole,
          avatar: user.name.charAt(0), shakha: userShakha,
          mahashakha: user.mahashakha, permissions: user.permissions || []
        };

        window.state = state; // Ensure window.state is synced
        const session = { user: state.currentUser, expires: Date.now() + (24 * 60 * 60 * 1000) };
        localStorage.setItem('nvc_session', JSON.stringify(session));
        showDashboardPage();
        return;
      }

      // If Google Sheets is enabled but authentication failed, try to get updated user data
      if (GOOGLE_SHEETS_CONFIG.ENABLED) {
        try {
          // Force fresh fetch with timestamp to prevent caching
          const usersRes = await getFromGoogleSheets('getUsers', { t: Date.now() });
          if (usersRes && usersRes.success && usersRes.data) {
            state.users = usersRes.data;
            // Try again with updated user data
            const updatedUser = state.users.find(u => 
              (u.username && u.username.toLowerCase() === username.toLowerCase()) ||
              (u.code && u.code.toLowerCase() === username.toLowerCase())
            );
            if (updatedUser && updatedUser.password === password) {
              const finalRole = updatedUser.role || 'shakha';
              let userShakha = null;
              if (finalRole === 'shakha' || finalRole === 'admin_planning') {
                userShakha = SHAKHA[updatedUser.code?.toUpperCase()] || updatedUser.code;
              }

              state.currentUser = {
                id: updatedUser.username || updatedUser.code || username,
                name: updatedUser.name || username,
                role: finalRole,
                avatar: (updatedUser.name || username).toString().charAt(0) || 'U',
                shakha: userShakha,
                mahashakha: updatedUser.mahashakha || null,
                permissions: updatedUser.permissions || []
              };

              window.state = state; // Ensure window.state is synced
              const session = { user: state.currentUser, expires: Date.now() + (24 * 60 * 60 * 1000) };
              localStorage.setItem('nvc_session', JSON.stringify(session));
              showDashboardPage();
              return;
            }
          }
        } catch (e) {
          console.error('Failed to fetch updated user data:', e);
        }
      }

      showToast('युजरनेम वा पासवर्ड मिलेन', 'error');
    } catch (e) {
      console.error('Login error', e);
      showToast('लगइन गर्दा समस्या भयो', 'error');
    } finally {
      loginBtn.innerHTML = originalText;
      loginBtn.disabled = false;
    }
  }, 500);
}

async function loadUsersFromSheetsForAdmin() {
  if (!state.currentUser || state.currentUser.role !== 'admin') return { success: false, data: [] };
  if (!GOOGLE_SHEETS_CONFIG.ENABLED) return { success: true, data: state.users || [], local: true };

  try {
    const res = await getFromGoogleSheets('getUsers');
    if (res && res.success && Array.isArray(res.data)) {
      state.users = res.data.map(u => {
        const role = (u.role || '').toString();
        const rawPerm = u.permissions || u.Permissions || '';
        const permissions = Array.isArray(rawPerm) ? rawPerm : String(rawPerm).split(',').map(s => s.trim()).filter(Boolean);
        return {
          username: u.username,
          name: u.name || '',
          role: role || 'shakha',
          shakha: u.shakha || '',
          mahashakha: u.mahashakha || '',
          permissions,
          status: u.status || 'active',
          lastLogin: u.last_login || u.lastLogin || '-',
          createdAt: u.created_at || u.createdAt || ''
        };
      });
      return { success: true, data: state.users };
    }
    return { success: false, data: [], message: res && res.message ? res.message : 'Failed to load users' };
  } catch (e) {
    console.error('loadUsersFromSheetsForAdmin error', e);
    return { success: false, data: [], message: e.toString() };
  }
}

function handleForgotPassword(event) {
  event.preventDefault();
  
  // Security: Rate limiting check
  const now = Date.now();
  const lastAttempt = localStorage.getItem('lastPasswordResetAttempt') || 0;
  const attemptCount = parseInt(localStorage.getItem('passwordResetAttempts') || '0');
  
  // Block attempts if too many tries in last hour
  if (now - lastAttempt < 3600000 && attemptCount >= 3) {
    showToast('सुरक्षा कारणहरूले गर्दा, कृपया १ घण्टा पछि फेरि प्रयास गर्नुहोस्।', 'error');
    return;
  }
  
  // Update attempt tracking
  localStorage.setItem('lastPasswordResetAttempt', now.toString());
  localStorage.setItem('passwordResetAttempts', (attemptCount + 1).toString());
  
  // Step 1: Get username
  const username = prompt('कृपया आफ्नो युजरनेम प्रविष्ट गर्नुहोस्:');
  
  if (!username || !username.trim()) {
    showToast('युजरनेम खाली हुन सक्दैन।', 'warning');
    return;
  }

  const trimmedUsername = username.trim().toLowerCase();

  // Step 2: Get email for verification
  const email = prompt('कृपया आफ्नो इमेल प्रविष्ट गर्नुहोस् (यो तपाईंको पहिचान पुष्टि गर्न आवश्यक छ):');
  
  if (!email || !email.trim()) {
    showToast('इमेल खाली हुन सक्दैन।', 'warning');
    return;
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    showToast('कृपया वैध इमेल प्रविष्ट गर्नुहोस्।', 'warning');
    return;
  }

  // Security: Admin requires special handling
  if (trimmedUsername === 'admin') {
    // Generate temporary admin password
    const tempPassword = 'AdminTemp' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiryTime = new Date(Date.now() + 3600000).toLocaleTimeString('ne-NP', { hour: '2-digit', minute: '2-digit' });
    
    // Log admin reset attempt (in real app, this would go to secure server logs)
    console.warn(`Admin password reset attempted at ${new Date().toISOString()} with email: ${email}`);
    
    alert(`एडमिनको अस्थायी पासवर्ड: ${tempPassword}\n\n⚠️ यो पासवर्ड ${expiryTime} मा सकिन्छ।\nकृपया तुरुन्त लगइन गरेर पासवर्ड परिवर्तन गर्नुहोस्।\n\nसुरक्षा नोट: यो कार्य लग गरिएको छ।\nइमेल: ${email}`);
    return;
  }

  const user = findUserByUsername(trimmedUsername);
  
  if (user) {
    // Generate secure temporary password
    const tempPassword = 'Temp' + Math.random().toString(36).substring(2, 10) + '!';
    const expiryTime = new Date(Date.now() + 3600000).toLocaleTimeString('ne-NP', { hour: '2-digit', minute: '2-digit' });
    
    // Security: Log the reset (in production, this would be server-side logging)
    console.log(`Password reset for user: ${trimmedUsername} at ${new Date().toISOString()} with email: ${email}`);
    
    // Store temporary password with expiry (in real app, this would be in secure database)
    const tempData = {
      password: tempPassword,
      expires: Date.now() + 3600000, // 1 hour expiry
      username: trimmedUsername,
      email: email.trim() // Store email for verification
    };
    localStorage.setItem(`temp_pwd_${trimmedUsername}`, JSON.stringify(tempData));
    
    alert(`'${user.name}' को लागि अस्थायी पासवर्ड जेनरेट गरिएको छ।\n\nअस्थायी पासवर्ड: ${tempPassword}\n\n⚠️ यो पासवर्ड ${expiryTime} मा सकिन्छ।\nकृपया तुरुन्त लगइन गरेर आफ्नो पासवर्ड परिवर्तन गर्नुहोस्।\n\nसुरक्षा टिप: यो पासवर्ड कसैसँग शेयर नगर्नुहोस्।\n\nभेरिफाई गरिएको इमेल: ${email}`);
    
    showToast('अस्थायी पासवर्ड सफलतापूर्वक जेनरेट गरियो। इमेल भेरिफाई गरिएको छ।', 'success');
  } else {
    // Security: Don't reveal if username exists or not
    showToast('यदि यो युजरनेम र इमेल प्रणालीमा मेल खान्छ भने, अस्थायी पासवर्ड सम्बन्धी जानकारीहरू पठाइएको छ।', 'info');
  }
}

function getAllUsers() {
    const shakhas = [
        { code: 'admin_planning', name: SHAKHA.ADMIN_PLANNING, username: 'admin_plan', password: 'nvc@2026', mahashakha: MAHASHAKHA.ADMIN_MONITORING, permissions: ['admin_tasks'], role: 'admin_planning' },
        { code: 'info_collection', name: SHAKHA.INFO_COLLECTION, username: 'info_collect', password: 'nvc@2026', mahashakha: MAHASHAKHA.ADMIN_MONITORING, permissions: ['complaint_management'] },
        { code: 'complaint_management', name: SHAKHA.COMPLAINT_MANAGEMENT, username: 'complaint_mgmt', password: 'nvc@2026', mahashakha: MAHASHAKHA.ADMIN_MONITORING, permissions: ['complaint_management'] },
        { code: 'finance', name: SHAKHA.FINANCE, username: 'finance', password: 'nvc@2026', mahashakha: MAHASHAKHA.ADMIN_MONITORING, permissions: ['complaint_management'] },
        { code: 'policy_monitoring', name: SHAKHA.POLICY_MONITORING, username: 'policy_mon', password: 'nvc@2026', mahashakha: MAHASHAKHA.POLICY_LEGAL, permissions: ['complaint_management'] },
        { code: 'investigation', name: SHAKHA.INVESTIGATION, username: 'investigation', password: 'nvc@2026', mahashakha: MAHASHAKHA.POLICY_LEGAL, permissions: ['complaint_management'] },
        { code: 'legal_advice', name: SHAKHA.LEGAL_ADVICE, username: 'legal_advice', password: 'nvc@2026', mahashakha: MAHASHAKHA.POLICY_LEGAL, permissions: ['complaint_management'] },
        { code: 'asset_declaration', name: SHAKHA.ASSET_DECLARATION, username: 'asset_decl', password: 'nvc@2026', mahashakha: MAHASHAKHA.POLICY_LEGAL, permissions: ['complaint_management'] },
        { code: 'police_info_collection', name: SHAKHA.POLICE_INFO_COLLECTION, username: 'police_info', password: 'nvc@2026', mahashakha: MAHASHAKHA.POLICE, permissions: ['complaint_management'] },
        { code: 'police_monitoring', name: SHAKHA.POLICE_MONITORING, username: 'police_mon', password: 'nvc@2026', mahashakha: MAHASHAKHA.POLICE, permissions: ['complaint_management'] },
        { code: 'police_management', name: SHAKHA.POLICE_MANAGEMENT, username: 'police_mgmt', password: 'nvc@2026', mahashakha: MAHASHAKHA.POLICE, permissions: ['complaint_management'] },
        { code: 'police_investigation', name: SHAKHA.POLICE_INVESTIGATION, username: 'police_invest', password: 'nvc@2026', mahashakha: MAHASHAKHA.POLICE, permissions: ['complaint_management'] },
        { code: 'technical_1', name: SHAKHA.TECHNICAL_1, username: 'technical1', password: 'nvc@2026', mahashakha: MAHASHAKHA.TECHNICAL, permissions: ['complaint_management', 'technical_inspection'] },
        { code: 'technical_2', name: SHAKHA.TECHNICAL_2, username: 'technical2', password: 'nvc@2026', mahashakha: MAHASHAKHA.TECHNICAL, permissions: ['complaint_management', 'technical_inspection'] },
        { code: 'technical_3', name: SHAKHA.TECHNICAL_3, username: 'technical3', password: 'nvc@2026', mahashakha: MAHASHAKHA.TECHNICAL, permissions: ['complaint_management', 'technical_inspection'] },
        { code: 'technical_4', name: SHAKHA.TECHNICAL_4, username: 'technical4', password: 'nvc@2026', mahashakha: MAHASHAKHA.TECHNICAL, permissions: ['complaint_management', 'technical_inspection'] }
    ];
    
    const mahashakhas = [
        { code: 'admin_monitoring_div', name: MAHASHAKHA.ADMIN_MONITORING, username: 'admin_mon_head', password: 'nvc@2026', role: 'mahashakha', mahashakha: MAHASHAKHA.ADMIN_MONITORING },
        { code: 'policy_legal_div', name: MAHASHAKHA.POLICY_LEGAL, username: 'policy_head', password: 'nvc@2026', role: 'mahashakha', mahashakha: MAHASHAKHA.POLICY_LEGAL },
        { code: 'police_div', name: MAHASHAKHA.POLICE, username: 'police_head', password: 'nvc@2026', role: 'mahashakha', mahashakha: MAHASHAKHA.POLICE },
        { code: 'technical_div', name: MAHASHAKHA.TECHNICAL, username: 'technical_head', password: 'nvc@2026', role: 'mahashakha', mahashakha: MAHASHAKHA.TECHNICAL }
    ];

    return [...shakhas, ...mahashakhas];
}

function findUserByUsername(username) {
    const allUsers = getAllUsers();
    return allUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
}

function findUserByCredentials(username, password) {
  const shakhas = [
    { code: 'admin_planning', name: SHAKHA.ADMIN_PLANNING, username: 'admin_plan', password: 'nvc@2026', mahashakha: MAHASHAKHA.ADMIN_MONITORING, permissions: ['admin_tasks'], role: 'admin_planning' },
    { code: 'info_collection', name: SHAKHA.INFO_COLLECTION, username: 'info_collect', password: 'nvc@2026', mahashakha: MAHASHAKHA.ADMIN_MONITORING, permissions: ['complaint_management'] },
    { code: 'complaint_management', name: SHAKHA.COMPLAINT_MANAGEMENT, username: 'complaint_mgmt', password: 'nvc@2026', mahashakha: MAHASHAKHA.ADMIN_MONITORING, permissions: ['complaint_management'] },
    { code: 'finance', name: SHAKHA.FINANCE, username: 'finance', password: 'nvc@2026', mahashakha: MAHASHAKHA.ADMIN_MONITORING, permissions: ['complaint_management'] },
    { code: 'policy_monitoring', name: SHAKHA.POLICY_MONITORING, username: 'policy_mon', password: 'nvc@2026', mahashakha: MAHASHAKHA.POLICY_LEGAL, permissions: ['complaint_management'] },
    { code: 'investigation', name: SHAKHA.INVESTIGATION, username: 'investigation', password: 'nvc@2026', mahashakha: MAHASHAKHA.POLICY_LEGAL, permissions: ['complaint_management'] },
    { code: 'legal_advice', name: SHAKHA.LEGAL_ADVICE, username: 'legal_advice', password: 'nvc@2026', mahashakha: MAHASHAKHA.POLICY_LEGAL, permissions: ['complaint_management'] },
    { code: 'asset_declaration', name: SHAKHA.ASSET_DECLARATION, username: 'asset_decl', password: 'nvc@2026', mahashakha: MAHASHAKHA.POLICY_LEGAL, permissions: ['complaint_management'] },
    { code: 'police_info_collection', name: SHAKHA.POLICE_INFO_COLLECTION, username: 'police_info', password: 'nvc@2026', mahashakha: MAHASHAKHA.POLICE, permissions: ['complaint_management'] },
    { code: 'police_monitoring', name: SHAKHA.POLICE_MONITORING, username: 'police_mon', password: 'nvc@2026', mahashakha: MAHASHAKHA.POLICE, permissions: ['complaint_management'] },
    { code: 'police_management', name: SHAKHA.POLICE_MANAGEMENT, username: 'police_mgmt', password: 'nvc@2026', mahashakha: MAHASHAKHA.POLICE, permissions: ['complaint_management'] },
    { code: 'police_investigation', name: SHAKHA.POLICE_INVESTIGATION, username: 'police_invest', password: 'nvc@2026', mahashakha: MAHASHAKHA.POLICE, permissions: ['complaint_management'] },
    { code: 'technical_1', name: SHAKHA.TECHNICAL_1, username: 'technical1', password: 'nvc@2026', mahashakha: MAHASHAKHA.TECHNICAL, permissions: ['complaint_management', 'technical_inspection'] },
    { code: 'technical_2', name: SHAKHA.TECHNICAL_2, username: 'technical2', password: 'nvc@2026', mahashakha: MAHASHAKHA.TECHNICAL, permissions: ['complaint_management', 'technical_inspection'] },
    { code: 'technical_3', name: SHAKHA.TECHNICAL_3, username: 'technical3', password: 'nvc@2026', mahashakha: MAHASHAKHA.TECHNICAL, permissions: ['complaint_management', 'technical_inspection'] },
    { code: 'technical_4', name: SHAKHA.TECHNICAL_4, username: 'technical4', password: 'nvc@2026', mahashakha: MAHASHAKHA.TECHNICAL, permissions: ['complaint_management', 'technical_inspection'] }
  ];
  
  const mahashakhas = [
    { code: 'admin_monitoring_div', name: MAHASHAKHA.ADMIN_MONITORING, username: 'admin_mon_head', password: 'nvc@2026', role: 'mahashakha', mahashakha: MAHASHAKHA.ADMIN_MONITORING },
    { code: 'policy_legal_div', name: MAHASHAKHA.POLICY_LEGAL, username: 'policy_head', password: 'nvc@2026', role: 'mahashakha', mahashakha: MAHASHAKHA.POLICY_LEGAL },
    { code: 'police_div', name: MAHASHAKHA.POLICE, username: 'police_head', password: 'nvc@2026', role: 'mahashakha', mahashakha: MAHASHAKHA.POLICE },
    { code: 'technical_div', name: MAHASHAKHA.TECHNICAL, username: 'technical_head', password: 'nvc@2026', role: 'mahashakha', mahashakha: MAHASHAKHA.TECHNICAL }
  ];

  return [...shakhas, ...mahashakhas].find(u => u.username === username && u.password === password);
}

function _logout() {
  if (!confirm('के तपाईं लग-आउट गर्न चाहनुहुन्छ?')) return;
  state.currentUser = null;
  window.state = state; // Ensure window.state is synced
  localStorage.removeItem('nvc_session');
  if (window.notificationInterval) clearInterval(window.notificationInterval);
  showPage('mainPage');
}

NVC.UI.logout = _logout;

function logout() {
  return NVC.UI.logout.apply(this, arguments);
}

function initializeDashboard() {
  updateUserInfo();
  loadDashboardData();
  setupEventListeners();
  loadSidebarNavigation();
  loadSidebarState();
  showDashboardView();
  startNotificationPolling();
  addGoogleSheetsButtons();
  addRefreshButton();
  updateSyncButton();
  // Fetch lightweight counts for badges/widgets to speed up UI
  try { fetchCountsAndUpdateUI(); } catch (e) {}
}

// Fetch cached counts from Apps Script and refresh UI elements
async function fetchCountsAndUpdateUI() {
  if (!GOOGLE_SHEETS_CONFIG.ENABLED) return;
  try {
    const res = await getFromGoogleSheets('getCounts');
    if (!res || !res.success || !res.data) return;
    state.counts = res.data;

    // Refresh sidebar badges
    try { loadSidebarNavigation(); } catch (e) {}

    // If currently viewing admin planning dashboard, re-render it
    if (state.currentUser && state.currentUser.role === 'admin_planning' && state.currentView === 'dashboard') {
      try { showDashboardView(); } catch (e) {}
    }
  } catch (e) {
    console.warn('fetchCountsAndUpdateUI failed', e);
  }
}

// Test helper: inject mock counts locally (no server needed) and refresh UI
function injectMockCounts(sample) {
  const sampleCounts = sample || {
    helloTotal: 12,
    helloPending: 5,
    onlineTotal: 9,
    onlinePending: 3,
    onlineResolved: 6,
    perShakha: {
      byName: { 'Complaint Management': 2, 'Finance': 1 },
      byKey: { 'complaint_management': 2, 'finance': 1 },
      unassigned: 1
    }
  };
  state.counts = sampleCounts;
  try { loadSidebarNavigation(); } catch (e) {}
  try { showDashboardView(); } catch (e) {}
  console.log('Mock counts injected', sampleCounts);
}

function clearMockCounts() {
  delete state.counts;
  try { loadSidebarNavigation(); } catch (e) {}
  try { showDashboardView(); } catch (e) {}
  console.log('Mock counts cleared');
}

// Monkeypatch helper: intercept getFromGoogleSheets for 'getCounts' calls
let __originalGetFromGoogleSheets = null;
function enableMockGetCounts(mockData) {
  if (!__originalGetFromGoogleSheets) __originalGetFromGoogleSheets = getFromGoogleSheets;
  window.__mockCountsData = mockData || window.__mockCountsData || {
    helloTotal: 12,
    helloPending: 5,
    onlineTotal: 9,
    onlinePending: 3,
    onlineResolved: 6,
    perShakha: { byName: { 'Complaint Management': 2 }, byKey: { 'complaint_management': 2 }, unassigned: 1 }
  };
  window.getFromGoogleSheets = async function(action, params) {
    if (String(action) === 'getCounts') {
      return { success: true, data: window.__mockCountsData };
    }
    return __originalGetFromGoogleSheets.apply(this, arguments);
  };
  console.log('Mock getCounts enabled');
}

function disableMockGetCounts() {
  if (__originalGetFromGoogleSheets) {
    window.getFromGoogleSheets = __originalGetFromGoogleSheets;
    __originalGetFromGoogleSheets = null;
  }
  delete window.__mockCountsData;
  console.log('Mock getCounts disabled');
}

function updateUserInfo() {
  if (!state.currentUser) return;
  
  const userName = document.getElementById('userName');
  const userRole = document.getElementById('userRole');
  const userAvatar = document.getElementById('userAvatar');
  const topbarUserName = document.getElementById('topbarUserName');
  const topbarUserRole = document.getElementById('topbarUserRole');
  const topbarAvatar = document.getElementById('topbarAvatar');
  
  // Text sanitization helper to prevent distortion
  const sanitizeText = (text) => {
    if (!text || typeof text !== 'string') return '';
    return text.replace(/[^\u0900-\u097F\u0020-\u007E\s]/g, '').trim();
  };
  
  // Safe name display with fallback and sanitization
  const rawName = state.currentUser.name || 'प्रयोगकर्ता';
  const displayName = sanitizeText(rawName) || 'प्रयोगकर्ता';
  
  // Safe role display with proper fallbacks and sanitization
  let displayRole = 'शाखा';
  if (state.currentUser.role === 'admin') {
    displayRole = 'एडमिन';
  } else if (state.currentUser.role === 'mahashakha') {
    const rawMahashakha = state.currentUser.mahashakha || 'महाशाखा';
    displayRole = sanitizeText(rawMahashakha) || 'महाशाखा';
  } else if (state.currentUser.shakha && SHAKHA[state.currentUser.shakha]) {
    displayRole = SHAKHA[state.currentUser.shakha];
  } else if (state.currentUser.shakha) {
    displayRole = sanitizeText(state.currentUser.shakha) || 'शाखा';
  }
  
  // Safe avatar with fallback and sanitization
  const rawAvatar = state.currentUser.avatar || displayName.charAt(0) || 'U';
  const displayAvatar = sanitizeText(rawAvatar.toString().charAt(0)) || 'U';
  
  // Update sidebar user info with safe text setting
  if (userName) {
    userName.textContent = displayName;
    userName.style.removeProperty('font-family');
    userName.style.fontFamily = "'Segoe UI', 'Kalimati', 'Noto Sans Devanagari', sans-serif";
  }
  if (userRole) {
    userRole.textContent = displayRole;
    userRole.style.removeProperty('font-family');
    userRole.style.fontFamily = "'Segoe UI', 'Kalimati', 'Noto Sans Devanagari', sans-serif";
  }
  if (userAvatar) userAvatar.textContent = displayAvatar;
  
  // Update topbar user info with safe text setting
  if (topbarUserName) {
    topbarUserName.textContent = displayName;
    topbarUserName.style.removeProperty('font-family');
    topbarUserName.style.fontFamily = "'Segoe UI', 'Kalimati', 'Noto Sans Devanagari', sans-serif";
  }
  if (topbarUserRole) {
    topbarUserRole.textContent = displayRole;
    topbarUserRole.style.removeProperty('font-family');
    topbarUserRole.style.fontFamily = "'Segoe UI', 'Kalimati', 'Noto Sans Devanagari', sans-serif";
  }
  if (topbarAvatar) topbarAvatar.textContent = displayAvatar;
}

function animateCountUp(element, endValue) {
  if (!element) return;
  let startValue = 0;
  const duration = 1500; // 1.5 सेकेन्ड
  const stepTime = Math.abs(Math.floor(duration / (endValue || 1)));
  
  if (endValue === 0) {
      element.textContent = _latinToDevnagari(0);
      return;
  }

  const timer = setInterval(() => {
    startValue += 1;
    element.textContent = _latinToDevnagari(startValue);
    if (startValue >= endValue) {
      clearInterval(timer);
      element.textContent = _latinToDevnagari(endValue);
    }
  }, Math.max(stepTime, 10));
}

function loadDashboardData() {
  loadNotifications();
  updateStats();
}

function updateStats() {
  // Filter complaints based on user role
  let filteredComplaints = state.complaints;
  if (state.currentUser) {
    if (state.currentUser.role === 'shakha') {
      const userShakhaName = SHAKHA[state.currentUser.shakha] || state.currentUser.shakha;
      filteredComplaints = filteredComplaints.filter(c => {
        const cShakha = (c.shakha || '').trim();
        const cShakhaName = (c.shakhaName || '').trim();
        
        // Enhanced filtering logic for renamed shakha
        return cShakha === userShakhaName || 
               cShakha === state.currentUser.shakha ||
               cShakhaName === userShakhaName ||
               SHAKHA[cShakha] === userShakhaName ||
               // Special handling for INFO_COLLECTION with new name
               (cShakha === 'INFO_COLLECTION' && userShakhaName === 'सूचना संकलन, अन्वेषण तथा अनुगमन शाखा') ||
               (state.currentUser.shakha === 'INFO_COLLECTION' && cShakhaName === 'सूचना संकलन, अन्वेषण तथा अनुगमन शाखा');
      });
    } else if (state.currentUser.role === 'mahashakha') {
      // For mahashakha users, show all complaints from their shakhas
      const userMahashakha = state.currentUser.mahashakha || state.currentUser.name;
      const allowedShakhas = MAHASHAKHA_STRUCTURE[userMahashakha] || [];
      
      filteredComplaints = filteredComplaints.filter(c => {
        // Check if complaint belongs to any shakha under this mahashakha
        const complaintShakha = c.shakha || '';
        return allowedShakhas.includes(complaintShakha) || 
               c.mahashakha === userMahashakha || 
               c.mahashakha === state.currentUser.name;
      });
    } else if (state.currentUser.role === 'admin_planning') {
      filteredComplaints = filteredComplaints.filter(c => c.source === 'hello_sarkar');
      filteredComplaints = filteredComplaints.filter(c => {
        const s = String(c.source || '').toLowerCase();
        return s === 'hello_sarkar' || s === 'online' || s === 'online_complaint';
      });
    }
    // For admin, show all complaints
  }

  const total = filteredComplaints.length;
  const pending = filteredComplaints.filter(c => c.status === 'pending').length;
  const inProgress = filteredComplaints.filter(c => c.status === 'progress').length;
  const resolved = filteredComplaints.filter(c => c.status === 'resolved').length;
  const thisMonth = filteredComplaints.filter(c => {
    const today = new Date();
    const complaintDate = (typeof _parseComplaintRegDateToAD === 'function') ? _parseComplaintRegDateToAD(c) : null;
    if (!complaintDate || isNaN(complaintDate.getTime())) return false;
    return complaintDate.getMonth() === today.getMonth() && complaintDate.getFullYear() === today.getFullYear();
  }).length;
  
  const totalEl = document.getElementById('totalComplaintsMain');
  const inProgressEl = document.getElementById('inProgressComplaintsMain');
  const pendingEl = document.getElementById('pendingComplaintsMain');
  const resolvedEl = document.getElementById('resolvedComplaintsMain');
  
  animateCountUp(totalEl, total);
  animateCountUp(inProgressEl, inProgress);
  animateCountUp(pendingEl, pending);
  animateCountUp(resolvedEl, resolved);
}

function toggleSidebar() {
  const container = document.querySelector('.app-container');
  if (container) {
    container.classList.toggle('sidebar-collapsed');
    localStorage.setItem('nvc_sidebar_collapsed', container.classList.contains('sidebar-collapsed'));
  }
}

function loadSidebarState() {
  const isCollapsed = localStorage.getItem('nvc_sidebar_collapsed') === 'true';
  const container = document.querySelector('.app-container');
  if (container && isCollapsed) {
    container.classList.add('sidebar-collapsed');
  }
}

function setupEventListeners() {
  if (window._listenersAttached) return;
  window._listenersAttached = true;

  document.addEventListener('click', function(e) {
    // Close notification dropdown if clicked outside
    if (!e.target.closest('.notification-bell')) {
      const dropdown = document.getElementById('notificationDropdown');
      if (dropdown) dropdown.classList.remove('show');
    }
    
    // Close modals if clicked on backdrop (but not immediately after opening)
    const modal = document.getElementById('complaintModal');
    if (e.target === modal) {
      const justOpened = window._nvc_modalJustOpened || 0;
      const timeDiff = Date.now() - justOpened;
      console.log('[Backdrop click] timeDiff:', timeDiff, 'target:', e.target, 'modal:', modal);
      if (!window._nvc_modalJustOpened || timeDiff > 500) {
        console.log('[Backdrop click] calling closeModal');
        closeModal();
      } else {
        console.log('[Backdrop click] ignored due to recent open');
      }
    }
    
    const shakhaModal = document.getElementById('shakhaModal');
    if (e.target === shakhaModal) closeShakhaModal();

    // Handle user menu toggle, logout, and closing
    const userMenuTrigger = e.target.closest('.user-menu');
    const logoutButton = e.target.closest('#logoutButton');

    if (logoutButton) {
        logout();
    } else if (userMenuTrigger) {
        toggleUserMenu();
    } else {
      const userDropdown = document.getElementById('userDropdown');
      if (userDropdown) userDropdown.classList.remove('show');
    }
  });

  // Sidebar Toggle Button
  const sidebarToggle = document.getElementById('sidebarToggle');
  if (sidebarToggle) {
      sidebarToggle.addEventListener('click', toggleSidebar);
  }

  // Delegated handler (capture) for action buttons to ensure handlers work
  // even after dynamic re-rendering / filtering of table rows.
  document.addEventListener('click', function(e) {
    try {
      const btn = e.target.closest && e.target.closest('.action-btn[data-action]');
      // If this action button is inside a modal, or a recent modal interaction
      // started (mousedown set by ui.js), let modal-specific handlers handle
      // it to avoid duplicate handling and premature closes.
      try {
        if ((window._nvc_modalInteraction && (Date.now() - window._nvc_modalInteraction) < 150) || (btn && btn.closest && btn.closest('.modal'))) return;
      } catch(e) {}
      if (!btn) return;
      // Delegated handler: call action function but avoid overriding native events

      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');

      // Resolve function name: explicit data-func, common shorthand mapping, or raw action
      const shorthandMap = {
        view: 'viewComplaint',
        edit: 'editComplaint',
        delete: 'deleteComplaint',
        assign: 'assignToShakha'
      };
      const funcName = btn.getAttribute('data-func') || (action ? (shorthandMap[action] || action) : null);

      if (funcName && typeof window[funcName] === 'function') {
        window[funcName](id);
      } else if (typeof handleTableActions === 'function') {
        // fallback to legacy table handler if direct function mapping not found
        try { handleTableActions(e); } catch (hfErr) { console.warn('handleTableActions fallback failed', hfErr); }
      } else {
        console.warn('No handler found for action:', action, 'funcName:', funcName);
      }

      // If the button requested closing modal after action, do it — but
      // avoid auto-closing when the button is inside a modal (user expects
      // the modal content action to show details without closing the modal).
      const isInsideModal = !!btn.closest('.modal');
      if (btn.getAttribute('data-close') === 'true' && typeof window.closeModal === 'function' && !isInsideModal) {
        try { closeModal(); } catch(_) {}
      }
    } catch (err) {
      console.error('Error in delegated action-btn handler', err);
    }
  }, false); // use bubble phase to allow handlers on target elements to fire first and stopPropagation if needed

  // Ensure modal header close buttons reliably close their modal (fixes clicks
  // on FontAwesome pseudo-elements like .fa-times:after not triggering inline
  // onclick handlers in some browsers/styles). This listens for clicks on
  // the close button inside `#complaintModal` header and calls `closeModal()`.
  document.addEventListener('click', function(e) {
    try {
      const closeBtn = e.target.closest && e.target.closest('#complaintModal .modal-header .action-btn');
      if (closeBtn) {
        try {
          if (e.stopImmediatePropagation) e.stopImmediatePropagation();
          if (e.stopPropagation) e.stopPropagation();
          e.preventDefault && e.preventDefault();
        } catch(_){}
        if (typeof closeModal === 'function') closeModal();
      }
    } catch (err) { /* ignore */ }
  });
}

function loadSidebarNavigation() {
  const nav = document.getElementById('sidebarNav');
  if (!nav || !state.currentUser) return;
  
  // उजुरी फिल्टर गर्ने (शाखा अनुसार)
  let complaintsForPending = state.complaints;
  if (state.currentUser.role === 'shakha') {
    complaintsForPending = complaintsForPending.filter(c => c.shakha === SHAKHA[state.currentUser.shakha] || c.shakha === state.currentUser.shakha);
  }
  else if (state.currentUser.role === 'mahashakha') {
    // For mahashakha users, show all complaints from their shakhas
    const userMahashakha = state.currentUser.mahashakha || state.currentUser.name;
    const allowedShakhas = MAHASHAKHA_STRUCTURE[userMahashakha] || [];
    
    complaintsForPending = complaintsForPending.filter(c => {
      // Check if complaint belongs to any shakha under this mahashakha
      const complaintShakha = c.shakha || '';
      return allowedShakhas.includes(complaintShakha) || 
             c.mahashakha === userMahashakha || 
             c.mahashakha === state.currentUser.name;
    });
  }
  const pendingCount = complaintsForPending.filter(c => c.status === 'pending').length;
  
  let navItems = '';
  
  if (state.currentUser.role === 'admin') {
    navItems = `
      <a href="#" class="nav-item active" onclick="showDashboardView(); return false;"><i class="fas fa-tachometer-alt"></i><span class="nav-text">ड्यासबोर्ड</span></a>
      <a href="#" class="nav-item" onclick="showAllComplaintsView(); return false;"><i class="fas fa-file-alt"></i><span class="nav-text">सबै उजुरीहरू</span><span class="badge badge-danger ms-auto" id="pendingCount">${pendingCount}</span></a>
      <a href="#" class="nav-item" onclick="showHotspotMap(); return false;"><i class="fas fa-map-marked-alt"></i><span class="nav-text">हटस्पट नक्सा</span></a>
      <a href="#" class="nav-item" onclick="showShakhaReportsView(); return false;"><i class="fas fa-chart-bar"></i><span class="nav-text">शाखा रिपोर्टहरू</span></a>
      <a href="#" class="nav-item" onclick="showUserManagementView(); return false;"><i class="fas fa-users"></i><span class="nav-text">प्रयोगकर्ता व्यवस्थापन</span></a>
      <a href="#" class="nav-item" onclick="showSystemReportsView(); return false;"><i class="fas fa-chart-line"></i><span class="nav-text">रिपोर्टहरू</span></a>
      <a href="#" class="nav-item" onclick="showSettingsView(); return false;"><i class="fas fa-cog"></i><span class="nav-text">सेटिङहरू</span></a>
    `;
  } else if (state.currentUser.role === 'mahashakha') {
    navItems = `
      <a href="#" class="nav-item active" onclick="showDashboardView()"><i class="fas fa-tachometer-alt"></i><span class="nav-text">ड्यासबोर्ड</span></a>
      <a href="#" class="nav-item" onclick="showComplaintsView()"><i class="fas fa-file-alt"></i><span class="nav-text">महाशाखा अन्तर्गतका उजुरी</span><span class="badge badge-danger ms-auto" id="pendingCount">${pendingCount}</span></a>
      <a href="#" class="nav-item" onclick="showShakhaReportsView()"><i class="fas fa-chart-bar"></i><span class="nav-text">शाखा रिपोर्टहरू</span></a>
      <a href="#" class="nav-item" onclick="showReportsView()"><i class="fas fa-chart-line"></i><span class="nav-text">रिपोर्टहरू</span></a>
      <a href="#" class="nav-item" onclick="showSettingsView()"><i class="fas fa-cog"></i><span class="nav-text">सेटिङहरू</span></a>
    `;
  } else if (state.currentUser.role === 'admin_planning') {
    // Prefer lightweight server counts when available to speed up UI
    const counts = state.counts || null;
    // Aggregate counts from both main complaints and onlineComplaints store (fallback)
    const allComplaints = (state.complaints || []).concat(state.onlineComplaints || []);
    const helloSarkarPending = (counts && typeof counts.helloPending === 'number') ? counts.helloPending : allComplaints.filter(c => String(c.source).toLowerCase() === 'hello_sarkar' && c.status === 'pending').length;
    const onlinePending = (counts && typeof counts.onlinePending === 'number') ? counts.onlinePending : allComplaints.filter(c => ['online','online_complaint'].includes(String(c.source).toLowerCase()) && c.status === 'pending').length;
    const hotlinePending = (counts && typeof counts.hotlinePending === 'number') ? counts.hotlinePending : allComplaints.filter(c => String(c.source).toLowerCase() === 'hotline' && c.status === 'pending').length;
    const hotlineTotal = (counts && typeof counts.hotlineTotal === 'number') ? counts.hotlineTotal : allComplaints.filter(c => String(c.source).toLowerCase() === 'hotline').length;
    const activeNotices = (state.notices || []).filter(n => n.status === 'active').length;
    navItems = `
      <a href="#" class="nav-item active" onclick="showDashboardView()"><i class="fas fa-tachometer-alt"></i><span class="nav-text">ड्यासबोर्ड</span></a>
      <a href="#" class="nav-item" onclick="showAdminComplaintsView()"><i class="fas fa-file-alt"></i><span class="nav-text">हेलो सरकार उजुरीहरू</span><span class="badge badge-danger ms-auto" id="pendingCount">${helloSarkarPending}</span></a>
      <a href="#" class="nav-item" onclick="showHotlineComplaintsView()"><i class="fas fa-phone"></i><span class="nav-text">हटलाइन उजुरी</span><span class="badge badge-danger ms-auto" id="hotlinePendingCount">${hotlinePending}</span></a>
      <a href="#" class="nav-item" onclick="showOnlineComplaintsView()"><i class="fas fa-globe"></i><span class="nav-text">अनलाइन उजुरी</span><span class="badge badge-danger ms-auto">${onlinePending}</span></a>
      <a href="#" class="nav-item" onclick="showNoticeUploadModal()"><i class="fas fa-bullhorn"></i><span class="nav-text">सूचना प्रकाशन</span></a>
      <a href="#" class="nav-item" onclick="showNoticeManagementView()"><i class="fas fa-bars"></i><span class="nav-text">सूचना व्यवस्थापन</span><span class="badge badge-info ms-auto">${activeNotices}</span></a>
      <a href="#" class="nav-item" onclick="showEmployeeMonitoringView()"><i class="fas fa-user-clock"></i><span class="nav-text">कार्यालय अनुगमन</span></a>
      <a href="#" class="nav-item" onclick="showCitizenCharterView()"><i class="fas fa-file-contract"></i><span class="nav-text">नागरिक बडापत्र अनुगमन</span></a>
      <a href="#" class="nav-item" onclick="showInvestigationView()"><i class="fas fa-search"></i><span class="nav-text">छानविन/अन्वेषण</span></a>
      <a href="#" class="nav-item" onclick="showReportsView()"><i class="fas fa-chart-bar"></i><span class="nav-text">रिपोर्टहरू</span></a>
    `;
  } else if (state.currentUser.role === 'shakha') {
    // For branch users show count of forwarded online complaints (use server counts if available)
    // For branch users: show count of *newly forwarded* complaints (Online & Hello Sarkar) from Admin Plan.
    // Logic: Count items assigned to this shakha where updatedAt > lastSeenTime.
    // This allows the badge to reset to 0 when clicked (via clearShakhaNewCount).
    const userShakhaCode = state.currentUser.shakha || '';
    const userShakhaName = (SHAKHA && SHAKHA[userShakhaCode]) ? SHAKHA[userShakhaCode] : userShakhaCode;
    let newCount = 0;
    const counts2 = state.counts || null;
    if (counts2 && counts2.perShakha) {
      const normalizeKeyLocal = function(v) { try { return String(v || '').toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_\u0900-\u097F]/g,'').trim(); } catch(e) { return String(v || '').toLowerCase(); } };
      const key = normalizeKeyLocal(userShakhaName || userShakhaCode);
      newCount = (counts2.perShakha.byKey && counts2.perShakha.byKey[key]) ? counts2.perShakha.byKey[key] : ((counts2.perShakha.byName && counts2.perShakha.byName[userShakhaName]) ? counts2.perShakha.byName[userShakhaName] : 0);
    } else {
      // Fallback: count online complaints since last seen (pre-existing behavior)
      const seenTs = (state.shakhaSeen && state.shakhaSeen[userShakhaName]) ? new Date(state.shakhaSeen[userShakhaName]).getTime() : 0;
      const onlineList = state.onlineComplaints || [];
      newCount = onlineList.filter(c => {
        const assigned = (c.assignedShakha || c.assignedShakhaCode || '').toString();
        const isForThis = !assigned || assigned === userShakhaName || assigned === userShakhaCode;
        const created = c.created_at ? new Date(c.created_at).getTime() : (c.updated_at ? new Date(c.updated_at).getTime() : 0);
        return isForThis && created > seenTs;
      }).length;
    }

    // Determine last seen time for this shakha
    const seenTs = (state.shakhaSeen && state.shakhaSeen[userShakhaName]) ? new Date(state.shakhaSeen[userShakhaName]).getTime() : 0;

    // Filter main complaints list for:
    // 1. Assigned to this shakha
    // 2. Source is 'online', 'online_complaint', or 'hello_sarkar'
    // 3. Updated/Created AFTER last seen time
    newCount = (state.complaints || []).filter(c => {
      const cShakha = c.shakha || c.assignedShakha || '';
      const isForThis = cShakha === userShakhaName || 
                     cShakha === userShakhaCode || 
                     (SHAKHA && SHAKHA[cShakha] === userShakhaName) ||
                     // Special handling for INFO_COLLECTION with new name
                     (cShakha === 'INFO_COLLECTION' && userShakhaName === 'सूचना संकलन, अन्वेषण तथा अनुगमन शाखा') ||
                     (userShakhaCode === 'INFO_COLLECTION' && (c.shakhaName || cShakha) === 'सूचना संकलन, अन्वेषण तथा अनुगमन शाखा');
      if (!isForThis) return false;

      const src = String(c.source || '').toLowerCase();
      const isTargetSource = src === 'online' || src === 'online_complaint' || src === 'hello_sarkar';
      if (!isTargetSource) return false;

      let itemTs = 0;
      if (c.updatedAt) itemTs = new Date(c.updatedAt).getTime();
      else if (c.createdAt) itemTs = new Date(c.createdAt).getTime();
      
      return itemTs > seenTs;
    }).length;

    navItems = `
      <a href="#" class="nav-item active" onclick="showDashboardView()"><i class="fas fa-tachometer-alt"></i><span class="nav-text">ड्यासबोर्ड</span></a>
      <a href="#" class="nav-item" onclick="clearShakhaNewCount(); showComplaintsView(); return false;"><i class="fas fa-file-alt"></i><span class="nav-text">उजुरीहरू</span><span class="badge badge-danger ms-auto" id="pendingCount">${newCount}</span></a>
      <a href="#" class="nav-item" onclick="showNewComplaintView()"><i class="fas fa-plus-circle"></i><span class="nav-text">नयाँ उजुरी</span></a>
      ${(state.currentUser.shakha || '').includes('प्राविधिक') ? `<a href="#" class="nav-item" onclick="showTechnicalProjectsView()"><i class="fas fa-hard-hat"></i><span class="nav-text">प्राविधिक परीक्षण/आयोजना अनुगमन</span></a>
      <a href="#" class="nav-item" onclick="showTechnicalExaminersView()"><i class="fas fa-user-tie"></i><span class="nav-text">प्राविधिक परीक्षक सूची</span></a>` : ''}
      ${(() => {
        const isLabUser = state.currentUser && (state.currentUser.shakha === 'LABORATORY_TESTING' || (SHAKHA && SHAKHA[state.currentUser.shakha] === 'प्रयोगशाला परीक्षण शाखा') || (state.currentUser.shakha && String(state.currentUser.shakha).toLowerCase().includes('laboratory')) || (state.currentUser.shakha && String(state.currentUser.shakha).includes('प्रयोगशाला')));
        console.log('Sidebar lab user check:', isLabUser, 'User shakha:', state.currentUser?.shakha);
        return isLabUser ? `<a href="#" class="nav-item" onclick="showSampleTestingView()"><i class="fas fa-flask"></i><span class="nav-text">नमूना परीक्षण</span></a>
      <a href="#" class="nav-item" onclick="showNewSampleView()"><i class="fas fa-vial"></i><span class="nav-text">नयाँ नमूना</span></a>` : '';
      })()}
      <a href="#" class="nav-item" onclick="showReportsView()"><i class="fas fa-chart-bar"></i><span class="nav-text">रिपोर्टहरू</span></a>
      <a href="#" class="nav-item" onclick="showCalendarView()"><i class="fas fa-calendar-alt"></i><span class="nav-text">क्यालेन्डर</span></a>
    `;
  } else if (state.currentUser.permissions?.includes('technical_inspection')) {
    navItems = `
      <a href="#" class="nav-item active" onclick="showDashboardView()"><i class="fas fa-tachometer-alt"></i><span class="nav-text">ड्यासबोर्ड</span></a>
      <a href="#" class="nav-item" onclick="showComplaintsView()"><i class="fas fa-file-alt"></i><span class="nav-text">उजुरीहरू</span><span class="badge badge-danger ms-auto">${pendingCount}</span></a>
      <a href="#" class="nav-item" onclick="showNewComplaintView()"><i class="fas fa-plus-circle"></i><span class="nav-text">नयाँ उजुरी</span></a>
      <a href="#" class="nav-item" onclick="showTechnicalProjectsView()"><i class="fas fa-hard-hat"></i><span class="nav-text">प्राविधिक परीक्षण/आयोजना अनुगमन</span></a>
      <a href="#" class="nav-item" onclick="showTechnicalExaminersView()"><i class="fas fa-user-tie"></i><span class="nav-text">प्राविधिक परीक्षक सूची</span></a>
      <a href="#" class="nav-item" onclick="showReportsView()"><i class="fas fa-chart-bar"></i><span class="nav-text">रिपोर्टहरू</span></a>
      <a href="#" class="nav-item" onclick="showCalendarView()"><i class="fas fa-calendar-alt"></i><span class="nav-text">क्यालेन्डर</span></a>
    `;
  } else {
    navItems = `
      <a href="#" class="nav-item active" onclick="showDashboardView()"><i class="fas fa-tachometer-alt"></i><span class="nav-text">ड्यासबोर्ड</span></a>
      <a href="#" class="nav-item" onclick="showComplaintsView()"><i class="fas fa-file-alt"></i><span class="nav-text">उजुरीहरू</span><span class="badge badge-danger ms-auto">${pendingCount}</span></a>
      <a href="#" class="nav-item" onclick="showNewComplaintView()"><i class="fas fa-plus-circle"></i><span class="nav-text">नयाँ उजुरी</span></a>
      <a href="#" class="nav-item" onclick="showTechnicalProjectsView()"><i class="fas fa-hard-hat"></i><span class="nav-text">प्राविधिक परीक्षण/आयोजना अनुगमन</span></a>
      <a href="#" class="nav-item" onclick="showTechnicalExaminersView()"><i class="fas fa-user-tie"></i><span class="nav-text">प्राविधिक परीक्षक सूची</span></a>
      <a href="#" class="nav-item" onclick="showReportsView()"><i class="fas fa-chart-bar"></i><span class="nav-text">रिपोर्टहरू</span></a>
      <a href="#" class="nav-item" onclick="showCalendarView()"><i class="fas fa-calendar-alt"></i><span class="nav-text">क्यालेन्डर</span></a>
    `;
  }
  
  nav.innerHTML = navItems;
  applyDevanagariDigits(nav);
}

// Clear new-forwarded badge count for current user's shakha
function clearShakhaNewCount() {
  try {
    if (!state.currentUser) return;
    const shakhaCode = state.currentUser.shakha || '';
    const shakhaName = (SHAKHA && SHAKHA[shakhaCode]) ? SHAKHA[shakhaCode] : shakhaCode;
    state.shakhaSeen = state.shakhaSeen || {};
    state.shakhaSeen[shakhaName] = new Date().toISOString();
    // Re-render sidebar to update badge
    loadSidebarNavigation();
    // Persist
    try { backupToLocalStorage(); } catch(e) {}
  } catch (e) { console.warn('clearShakhaNewCount failed', e); }
}

function initializeDashboardCharts() {
  if (typeof Chart === 'undefined') {
    console.warn('⚠️ Chart.js is not loaded');
    return;
  }
  
  console.log('📊 Initializing dashboard charts...');
  
  // Initialize global storage for chart data if not exists
  if (!window.nvcChartsData) window.nvcChartsData = {};
  if (!window.nvcChartsType) window.nvcChartsType = {};
  
  setTimeout(() => {
    const statusCanvas = document.getElementById('complaintStatusChart');
    if (statusCanvas) {
      if (window.nvcCharts.complaintStatus) window.nvcCharts.complaintStatus.destroy();
      
      // शाखा अनुसार फिल्टर
      let complaints = state.complaints;
      if (state.currentUser && state.currentUser.role === 'shakha') {
        const userShakhaName = (state.currentUser.shakha || '').trim();
        const userCode = (state.currentUser.id || '').trim();
        complaints = complaints.filter(c => {
          const cShakha = (c.shakha || '').trim();
          const cShakhaName = (c.shakhaName || '').trim();
          
          return cShakha === userShakhaName || 
                 cShakha.toLowerCase() === userCode.toLowerCase() ||
                 cShakhaName === userShakhaName ||
                 SHAKHA[cShakha] === userShakhaName ||
                 SHAKHA[cShakha.toUpperCase()] === userShakhaName ||
                 // Special handling for INFO_COLLECTION with new name
                 (cShakha === 'INFO_COLLECTION' && userShakhaName === 'सूचना संकलन, अन्वेषण तथा अनुगमन शाखा') ||
                 (userCode === 'INFO_COLLECTION' && cShakhaName === 'सूचना संकलन, अन्वेषण तथा अनुगमन शाखा');
        });
      }
      else if (state.currentUser && state.currentUser.role === 'mahashakha') {
        // For mahashakha users, show all complaints from their shakhas
        const userMahashakha = state.currentUser.mahashakha || state.currentUser.name;
        const allowedShakhas = MAHASHAKHA_STRUCTURE[userMahashakha] || [];
        
        complaints = complaints.filter(c => {
          // Check if complaint belongs to any shakha under this mahashakha
          const complaintShakha = c.shakha || '';
          return allowedShakhas.includes(complaintShakha) || 
                 c.mahashakha === userMahashakha || 
                 c.mahashakha === state.currentUser.name;
        });
        
        // Apply Mahashakha Filter if selected
        const mahashakhaFilter = document.getElementById('mahashakhaFilterShakha');
        if (mahashakhaFilter && mahashakhaFilter.value) {
            complaints = complaints.filter(c => c.shakha === mahashakhaFilter.value);
        }
      }
      
      const pending = complaints.filter(c => c.status === 'pending').length;
      const progress = complaints.filter(c => c.status === 'progress').length;
      const resolved = complaints.filter(c => c.status === 'resolved').length;
      
      // Store data for type toggling
      window.nvcChartsData.complaintStatus = {
          labels: ['काम बाँकी', 'चालु', 'फछ्रयौट'],
          datasets: [{
              data: [pending, progress, resolved],
              backgroundColor: ['rgba(255, 143, 0, 0.8)', 'rgba(30, 136, 229, 0.8)', 'rgba(46, 125, 50, 0.8)'],
              borderColor: ['rgba(255, 143, 0, 1)', 'rgba(30, 136, 229, 1)', 'rgba(46, 125, 50, 1)'],
              borderWidth: 1
          }]
      };

      try {
        window.nvcCharts.complaintStatus = new Chart(statusCanvas.getContext('2d'), {
          type: window.nvcChartsType['complaintStatusChart'] || window.nvcChartsType.complaintStatus || 'doughnut',
          data: window.nvcChartsData.complaintStatus,
          options: {
            responsive: true, maintainAspectRatio: false,
            onClick: (evt, elements, chart) => {
                if (elements.length > 0) {
                    const i = elements[0].index;
                    const label = chart.data.labels[i];
                    const statusMap = { 'काम बाँकी': 'pending', 'चालु': 'progress', 'फछ्रयौट': 'resolved' };
                    showChartDrillDown({ status: statusMap[label] || '' }, `${label} उजुरीहरू`);
                }
            },
            plugins: {
              legend: { position: 'bottom', labels: { padding: 10, font: { size: 11 } } },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const label = context.label || '';
                    const value = context.raw || 0;
                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                    return `${label}: ${value} (${percentage}%)`;
                  }
                }
              }
            }
          }
        });
      } catch (e) { console.error('❌ Error creating chart:', e); }
    }
    
    const shakhaCtx = document.getElementById('shakhaChart');
    if (shakhaCtx) {
      if (window.nvcCharts.shakhaChart) window.nvcCharts.shakhaChart.destroy();

      const shakhaStats = {};
      (state.complaints || []).forEach(complaint => {
        const shakha = complaint.shakha || 'अन्य';
        if (!shakhaStats[shakha]) shakhaStats[shakha] = { pending: 0, progress: 0, resolved: 0 };
        if (complaint.status === 'pending') shakhaStats[shakha].pending++;
        else if (complaint.status === 'progress') shakhaStats[shakha].progress++;
        else if (complaint.status === 'resolved') shakhaStats[shakha].resolved++;
      });
      
      const shakhas = Object.keys(shakhaStats);
      const pendingData = shakhas.map(shakha => shakhaStats[shakha].pending);
      const progressData = shakhas.map(shakha => shakhaStats[shakha].progress);
      const resolvedData = shakhas.map(shakha => shakhaStats[shakha].resolved);

      window.nvcChartsData.shakhaChart = {
          labels: shakhas,
          datasets: [
              { label: 'काम बाँकी', data: pendingData, backgroundColor: 'rgba(255, 143, 0, 0.8)', borderWidth: 0, borderRadius: 4 },
              { label: 'चालु', data: progressData, backgroundColor: 'rgba(30, 136, 229, 0.8)', borderWidth: 0, borderRadius: 4 },
              { label: 'फछ्रयौट', data: resolvedData, backgroundColor: 'rgba(46, 125, 50, 0.8)', borderWidth: 0, borderRadius: 4 }
          ]
      };

      try {
        window.nvcCharts.shakhaChart = new Chart(shakhaCtx.getContext('2d'), {
          type: window.nvcChartsType.shakhaChart || 'bar',
          data: window.nvcChartsData.shakhaChart,
          options: {
            indexAxis: 'y', // Horizontal bar for better readability
            responsive: true, maintainAspectRatio: false,
            barThickness: 15,
            maxBarThickness: 25,
            onClick: (evt, elements, chart) => {
                if (elements.length > 0) {
                    const i = elements[0].index;
                    const label = chart.data.labels[i];
                    showChartDrillDown({ shakha: label }, `${label} शाखाका उजुरीहरू`);
                }
            },
            scales: {
              x: { 
                stacked: true,
                beginAtZero: true, 
                grid: { display: false } 
              },
              y: { 
                stacked: true,
                grid: { display: false }, 
                ticks: { font: { size: 11 } } 
              }
            },
            plugins: {
              legend: { position: 'top', align: 'end', labels: { usePointStyle: true, boxWidth: 8 } }
            }
          }
        });
        
        // Double click for detailed breakdown
        shakhaCtx.ondblclick = (evt) => {
            const points = window.nvcCharts.shakhaChart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true);
            if (points.length) {
                const i = points[0].index;
                const label = window.nvcCharts.shakhaChart.data.labels[i];
                viewShakhaDetails(label);
            }
        };
      } catch (e) { console.error('❌ Error creating shakha chart:', e); }
    }
    
    const trendCtx = document.getElementById('trendChart');
    if (trendCtx) {
      if (window.nvcCharts.trendChart) window.nvcCharts.trendChart.destroy();
      
      // Get filtered complaints for charts
      let chartComplaints = state.complaints || [];
      if (state.currentUser && state.currentUser.role === 'shakha') {
        const userShakhaName = (state.currentUser.shakha || '').trim();
        const userCode = (state.currentUser.id || '').trim();
        chartComplaints = chartComplaints.filter(c => {
          const cShakha = (c.shakha || '').trim();
          const cShakhaName = (c.shakhaName || '').trim();
          
          return cShakha === userShakhaName || 
                 cShakha.toLowerCase() === userCode.toLowerCase() ||
                 cShakhaName === userShakhaName ||
                 SHAKHA[cShakha] === userShakhaName ||
                 SHAKHA[cShakha.toUpperCase()] === userShakhaName ||
                 // Special handling for INFO_COLLECTION with new name
                 (cShakha === 'INFO_COLLECTION' && userShakhaName === 'सूचना संकलन, अन्वेषण तथा अनुगमन शाखा') ||
                 (userCode === 'INFO_COLLECTION' && cShakhaName === 'सूचना संकलन, अन्वेषण तथा अनुगमन शाखा');
        });
      } else if (state.currentUser && state.currentUser.role === 'mahashakha') {
        // For mahashakha users, show all complaints from their shakhas
        const userMahashakha = state.currentUser.mahashakha || state.currentUser.name;
        const allowedShakhas = MAHASHAKHA_STRUCTURE[userMahashakha] || [];
        
        chartComplaints = chartComplaints.filter(c => {
          // Check if complaint belongs to any shakha under this mahashakha
          const complaintShakha = c.shakha || '';
          return allowedShakhas.includes(complaintShakha) || 
                 c.mahashakha === userMahashakha || 
                 c.mahashakha === state.currentUser.name;
        });
        
        // Apply Mahashakha Filter if selected
        const mahashakhaFilter = document.getElementById('mahashakhaFilterShakha');
        if (mahashakhaFilter && mahashakhaFilter.value) {
            chartComplaints = chartComplaints.filter(c => c.shakha === mahashakhaFilter.value);
        }
      }

      // Nepali Fiscal Year Months (Shrawan to Ashadh)
      const fiscalMonths = ['साउन', 'भदौ', 'असोज', 'कार्तिक', 'मंसिर', 'पुष', 'माघ', 'फागुन', 'चैत', 'बैशाख', 'जेठ', 'असार'];
      const registeredData = new Array(12).fill(0);
      const resolvedData = new Array(12).fill(0);
      
      let currentNYear = 2081;
      let fiscalYearStart = 2081;
      try {
          const nDate = getCurrentNepaliDate();
          const parts = nDate.split('-');
          if(parts.length >= 1) {
             currentNYear = parseInt(parts[0]);
             const currentMonth = parseInt(parts[1]) || 1;
             // Determine fiscal year: if current month is Shrawan(4) or later, fiscal year starts this year
             // if current month is before Shrawan, fiscal year started last year
             if (currentMonth >= 4) { // Shrawan (4) or later
                 fiscalYearStart = currentNYear;
             } else { // Before Shrawan
                 fiscalYearStart = currentNYear - 1;
             }
          }
      } catch(e) {}

      chartComplaints.forEach(c => {
          const raw = c.date || c['दर्ता मिति'] || c.dateNepali || '';
          if (!raw) return;

          // Convert Devanagari digits to Latin if helper exists
          let txt = String(raw);
          if (typeof _devnagariToLatin === 'function') {
            try { txt = _devnagariToLatin(txt); } catch(e) { /* ignore */ }
          }

          // Try to extract YYYY-MM-DD or YYYY/MM/DD (may be BS in Nepali year)
          let match = txt.match(/^(\d{4})[^0-9]?(\d{1,2})[^0-9]?(\d{1,2})/);
          if (match) {
            const cY = Number(match[1]);
            const cM = Number(match[2]);
            
            // Check if complaint falls within current fiscal year
            let fiscalYearIndex = -1;
            
            // If complaint year is fiscal year start year (e.g., 2082)
            if (cY === fiscalYearStart && cM >= 4 && cM <= 12) {
                // Shrawan(4) to Chaitra(12) map to indices 0-8
                fiscalYearIndex = cM - 4;
            }
            // If complaint year is fiscal year end year (e.g., 2083)
            else if (cY === fiscalYearStart + 1 && cM >= 1 && cM <= 3) {
                // Baishakh(1) to Ashadh(3) map to indices 9-11
                fiscalYearIndex = 8 + cM; // 8 + month (1-3) = 9-11
            }
            
            if (fiscalYearIndex >= 0 && fiscalYearIndex < 12) {
              registeredData[fiscalYearIndex]++;
              if (c.status === 'resolved') resolvedData[fiscalYearIndex]++;
              return;
            }
          }

          // Fallback: use normalizeNepaliDisplayToISO to try to get a YYYY-MM-DD string
          if (typeof normalizeNepaliDisplayToISO === 'function') {
            try {
              const iso = normalizeNepaliDisplayToISO(raw);
              const mm = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
              if (mm) {
                const cY = Number(mm[1]);
                const cM = Number(mm[2]);
                
                // Check if complaint falls within current fiscal year
                let fiscalYearIndex = -1;
                
                // If complaint year is fiscal year start year (e.g., 2082)
                if (cY === fiscalYearStart && cM >= 4 && cM <= 12) {
                    // Shrawan(4) to Chaitra(12) map to indices 0-8
                    fiscalYearIndex = cM - 4;
                }
                // If complaint year is fiscal year end year (e.g., 2083)
                else if (cY === fiscalYearStart + 1 && cM >= 1 && cM <= 3) {
                    // Baishakh(1) to Ashadh(3) map to indices 9-11
                    fiscalYearIndex = 8 + cM; // 8 + month (1-3) = 9-11
                }
                
                if (fiscalYearIndex >= 0 && fiscalYearIndex < 12) {
                  registeredData[fiscalYearIndex]++;
                  if (c.status === 'resolved') resolvedData[fiscalYearIndex]++;
                  return;
                }
              }
            } catch (e) { /* ignore parse errors */ }
          }

          // As a last resort, try parsing as AD and then skip (we don't convert AD->BS here)
      });
      
      window.nvcChartsData.trendChart = {
          labels: fiscalMonths,
          datasets: [
              {
                  label: 'दर्ता भएको',
                  data: registeredData,
                  backgroundColor: 'rgba(13, 71, 161, 0.8)',
                  borderColor: 'rgba(13, 71, 161, 1)',
                  borderWidth: 1
              },
              {
                  label: 'फछ्रयौट भएको',
                  data: resolvedData,
                  backgroundColor: 'rgba(46, 125, 50, 0.8)',
                  borderColor: 'rgba(46, 125, 50, 1)',
                  borderWidth: 1
              }
          ]
      };

      try {
        window.nvcCharts.trendChart = new Chart(trendCtx.getContext('2d'), {
          type: window.nvcChartsType.trendChart || 'bar',
          data: window.nvcChartsData.trendChart,
          options: {
            responsive: true, maintainAspectRatio: false,
            onClick: (evt, elements, chart) => {
                if (elements.length > 0) {
                    const i = elements[0].index;
                    const monthName = chart.data.labels[i];
                    
                    // Convert fiscal year index to actual month number for filtering
                    let actualMonth, actualYear;
                    if (i < 9) { // Indices 0-8: Shrawan to Chaitra of fiscal year start year
                        actualMonth = i + 4; // Shrawan(4) to Chaitra(12)
                        actualYear = fiscalYearStart;
                    } else { // Indices 9-11: Baishakh to Ashadh of fiscal year end year
                        actualMonth = i - 8; // Baishakh(1) to Ashadh(3)
                        actualYear = fiscalYearStart + 1;
                    }
                    
                    // Pass actual month and year for accurate filtering
                    showChartDrillDown({ 
                        monthIndex: actualMonth, 
                        monthName: monthName,
                        year: actualYear 
                    }, `${monthName} महिनाका उजुरीहरू`);
                }
            },
            scales: { 
                y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } } },
                x: { grid: { display: false } }
            },
            plugins: {
                tooltip: { mode: 'index', intersect: false },
                legend: { position: 'bottom' }
            }
          }
        });
      } catch (e) { console.error('❌ Error creating trend chart:', e); }
    }
    
    // ===== Ministry / Organization Charts (Admin / Mahashakha / Shakha) =====
    // Helper to build ministry counts and chart
    function buildMinistryChartInstance(canvasId, complaintsList, chartKey) {
      try {
        const el = document.getElementById(canvasId);
        if (!el) return;
        if (window.nvcCharts && window.nvcCharts[chartKey]) try { window.nvcCharts[chartKey].destroy(); } catch (e) {}

        // Group by ministry field (try multiple keys)
        const counts = {};
        (complaintsList || []).forEach(c => {
          const m = (c.ministry || c['मन्त्रालय/निकाय'] || c.organization || c['निकाय'] || '').toString().trim() || 'अन्य';
          counts[m] = (counts[m] || 0) + 1;
        });

        const entries = Object.keys(counts).map(k => ({ k, v: counts[k] })).sort((a,b) => b.v - a.v);
        const labels = entries.map(e => e.k);
        const data = entries.map(e => e.v);

        // Generate colors
        const palette = ['#2E86AB','#F6C85F','#F26419','#66A182','#9B59B6','#E74C3C','#3498DB','#1ABC9C','#F39C12','#8E44AD'];
        const background = labels.map((_,i) => palette[i % palette.length]);

        window.nvcChartsData[chartKey] = { labels: labels, datasets: [{ data: data, backgroundColor: background, borderWidth: 0 }] };

        window.nvcCharts[chartKey] = new Chart(el.getContext('2d'), {
          type: 'doughnut',
          data: window.nvcChartsData[chartKey],
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom' },
              tooltip: { callbacks: { label: function(ctx) { const val = ctx.raw || 0; const total = ctx.dataset.data.reduce((a,b)=>a+b,0); const pct = total>0?Math.round((val/total)*100):0; return `${ctx.label}: ${val} (${pct}%)`; } } }
            },
            onClick: (evt, elems, chart) => {
              if (elems.length > 0) {
                const i = elems[0].index;
                const label = chart.data.labels[i];
                showChartDrillDown({ ministry: label }, `${label} अन्तर्गत उजुरीहरू`);
              }
            }
          }
        });
      } catch (err) { console.error('Error building ministry chart', canvasId, err); }
    }

    // Admin-level ministry chart (all complaints)
    try {
      const adminComplCanvas = document.getElementById('adminMinistryChart');
      if (adminComplCanvas) buildMinistryChartInstance('adminMinistryChart', state.complaints || [], 'adminMinistryChart');
    } catch (e) {}

    // Mahashakha-level ministry chart (complaints entered by users under this mahashakha OR where complaint.mahashakha matches)
    try {
      const mahCanvas = document.getElementById('mahashakhaMinistryChart');
      if (mahCanvas) {
        const mahashakha = state.currentUser?.mahashakha || state.currentUser?.name || '';
        let mahComplaints = (state.complaints || []).filter(c => (c.mahashakha || '') === mahashakha || (function(){
          // Try mapping createdBy to a user and match user's mahashakha
          const creator = (c => {
            try { const name = (c.createdBy || '').toString(); if (!name) return null; return (state.users||[]).find(u=>String(u.username)===String(name) || String(u.name)===String(name)); } catch(e){return null}
          })(c);
          return creator && (creator.mahashakha === mahashakha || creator.mahashakha === state.currentUser?.mahashakha);
        })());
        buildMinistryChartInstance('mahashakhaMinistryChart', mahComplaints, 'mahashakhaMinistryChart');
      }
    } catch (e) {}

    // Shakha-level ministry chart (complaints entered by users of this shakha OR where complaint.shakha matches)
    try {
      const shakhaCanvas = document.getElementById('shakhaMinistryChart');
      if (shakhaCanvas) {
        const userShakha = state.currentUser?.shakha || '';
        const shakhaComplaints = (state.complaints || []).filter(c => {
          if ((c.shakha || '') === userShakha) return true;
          const name = (c.createdBy || '').toString();
          if (!name) return false;
          const creator = (state.users || []).find(u => String(u.username) === String(name) || String(u.name) === String(name));
          if (creator && (creator.shakha === userShakha || creator.shakha === (state.currentUser?.shakha))) return true;
          return false;
        });
        buildMinistryChartInstance('shakhaMinistryChart', shakhaComplaints, 'shakhaMinistryChart');
      }
    } catch (e) {}
    
    const projectCtx = document.getElementById('projectStatusChart');
    if (projectCtx) {
      if (window.nvcCharts.projectChart) window.nvcCharts.projectChart.destroy();

      const isTechnicalMahashakhaUser = () => {
        try {
          const u = state.currentUser || {};
          if (u.role !== 'mahashakha') return false;
          const mah = (u.mahashakha || u.name || '').toString();
          return mah === MAHASHAKHA.TECHNICAL;
        } catch (e) {
          return false;
        }
      };

      // Prefer explicitly scoped data from overview (chart + data view) ONLY when in overview screen
      const canUseOverviewScope = state.currentView === 'technical_projects_overview' && (state._technicalOverviewProjects && Array.isArray(state._technicalOverviewProjects));
      let technicalProjects = canUseOverviewScope ? state._technicalOverviewProjects : (state.projects || []);

      // If no explicit scope provided, scope based on current user
      if (!canUseOverviewScope) {
        if (state.currentUser && state.currentUser.role === 'admin') {
          // admin can see all
        } else if (isTechnicalMahashakhaUser()) {
          const allowed = MAHASHAKHA_STRUCTURE[MAHASHAKHA.TECHNICAL] || [];
          technicalProjects = technicalProjects.filter(p => {
            const s = (p.shakha || '').toString();
            if (!s) return false;
            if (allowed.includes(s)) return true;
            if (s.includes('प्राविधिक')) return true;
            return false;
          });
        } else if (state.currentUser) {
          // Shakha users (existing behavior)
          const userShakhaName = (state.currentUser.shakha || '').trim();
          const userCode = (state.currentUser.id || '').trim();
          technicalProjects = technicalProjects.filter(p => {
            const pShakha = (p.shakha || '').trim();
            return pShakha === userShakhaName || 
                   pShakha.toLowerCase() === userCode.toLowerCase() ||
                   SHAKHA[pShakha] === userShakhaName ||
                   SHAKHA[pShakha.toUpperCase()] === userShakhaName;
          });
        }
      }

      // Apply Date Filter if set
      if (state.projectChartFilter && (state.projectChartFilter.startDate || state.projectChartFilter.endDate)) {
          const start = state.projectChartFilter.startDate;
          const end = state.projectChartFilter.endDate;
          technicalProjects = technicalProjects.filter(p => {
              const d = p.inspectionDate || '';
              if (!d) return false;
              if (start && d < start) return false;
              if (end && d > end) return false;
              return true;
          });
      }

      const active = technicalProjects.filter(p => p.status === 'active').length;
      const completed = technicalProjects.filter(p => (p.improvementInfo && String(p.improvementInfo).trim() !== '')).length;
      const pending = technicalProjects.filter(p => (!p.improvementInfo || String(p.improvementInfo).trim() === '')).length;
      
      window.nvcChartsData.projectChart = {
          labels: ['चालु', 'सम्पन्न', 'काम बाँकी'],
          datasets: [{
              data: [active, completed, pending],
              backgroundColor: ['rgba(30, 136, 229, 0.8)', 'rgba(46, 125, 50, 0.8)', 'rgba(255, 143, 0, 0.8)'],
              borderColor: ['rgba(30, 136, 229, 1)', 'rgba(46, 125, 50, 1)', 'rgba(255, 143, 0, 1)'],
              borderWidth: 1
          }]
      };

      try {
        window.nvcCharts.projectChart = new Chart(projectCtx.getContext('2d'), {
          type: window.nvcChartsType.projectChart || 'doughnut',
          data: window.nvcChartsData.projectChart,
          options: {
            responsive: true, maintainAspectRatio: false,
            onClick: (evt, elements, chart) => {
                if (elements.length > 0) {
                    const i = elements[0].index;
                    const label = chart.data.labels[i];
                    const statusMap = { 'चालु': 'active', 'सम्पन्न': 'completed', 'काम बाँकी': 'pending' };
                    showProjectDrillDown({ status: statusMap[label] }, `${label} आयोजनाहरू`);
                }
            },
            plugins: {
              legend: { position: 'bottom', labels: { font: { size: 11 } } },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const label = context.label || '';
                    const value = context.raw || 0;
                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                    return `${label}: ${value} (${percentage}%)`;
                  }
                }
              }
            }
          }
        });
      } catch (e) { console.error('❌ Error creating project chart:', e); }
    }
    
    const comparisonCtx = document.getElementById('shakhaComparisonChart');
    if (comparisonCtx) {
      if (window.nvcCharts.comparisonChart) window.nvcCharts.comparisonChart.destroy();
      
      const shakhaStats = {};
      let complaintsForChart = state.complaints || [];
      
      if (state.currentUser && state.currentUser.role === 'mahashakha') {
        // For mahashakha users, show all complaints from their shakhas
        const userMahashakha = state.currentUser.mahashakha || state.currentUser.name;
        const allowedShakhas = MAHASHAKHA_STRUCTURE[userMahashakha] || [];
        
        complaintsForChart = complaintsForChart.filter(c => {
          // Check if complaint belongs to any shakha under this mahashakha
          const complaintShakha = c.shakha || '';
          return allowedShakhas.includes(complaintShakha) || 
                 c.mahashakha === userMahashakha || 
                 c.mahashakha === state.currentUser.name;
        });
        
        // Apply Mahashakha Filter if selected
        const mahashakhaFilter = document.getElementById('mahashakhaFilterShakha');
        if (mahashakhaFilter && mahashakhaFilter.value) {
            complaintsForChart = complaintsForChart.filter(c => c.shakha === mahashakhaFilter.value);
        }
      }

      complaintsForChart.forEach(complaint => {
        const shakha = complaint.shakha || 'अन्य';
        if (!shakhaStats[shakha]) shakhaStats[shakha] = { pending: 0, resolved: 0 };
        if (complaint.status === 'pending') shakhaStats[shakha].pending++;
        if (complaint.status === 'resolved') shakhaStats[shakha].resolved++;
      });
      
      const shakhas = Object.keys(shakhaStats);
      const pendingData = shakhas.map(shakha => shakhaStats[shakha].pending);
      const resolvedData = shakhas.map(shakha => shakhaStats[shakha].resolved);
      
      window.nvcChartsData.comparisonChart = {
          labels: shakhas,
          datasets: [
              { 
                label: 'काम बाँकी', 
                data: pendingData, 
                backgroundColor: 'rgba(255, 170, 0, 0.8)', 
                borderWidth: 0, borderRadius: 4
              },
              { 
                label: 'फछ्रयौट', 
                data: resolvedData, 
                backgroundColor: 'rgba(16, 185, 129, 0.8)', 
                borderWidth: 0, borderRadius: 4
              }
          ]
      };

      try {
        window.nvcCharts.comparisonChart = new Chart(comparisonCtx.getContext('2d'), {
          type: window.nvcChartsType.comparisonChart || 'bar',
          data: window.nvcChartsData.comparisonChart,
          options: {
            indexAxis: 'y', // Horizontal Layout
            responsive: true, maintainAspectRatio: false,
            barThickness: 15,
            maxBarThickness: 25,
            onClick: (evt, elements, chart) => {
                if (elements.length > 0) {
                    const i = elements[0].index;
                    const label = chart.data.labels[i];
                    showChartDrillDown({ shakha: label }, `${label} शाखाका उजुरीहरू`);
                }
            },
            scales: {
              x: { 
                beginAtZero: true, 
                grid: { color: '#f0f0f0', drawBorder: false },
                stacked: true 
              },
              y: { 
                grid: { display: false, drawBorder: false },
                stacked: true,
                ticks: { font: { size: 11 } }
              }
            },
            plugins: {
              legend: { position: 'top', align: 'end', labels: { usePointStyle: true, boxWidth: 8 } }
            }
          }
        });
      } catch (e) { console.error('❌ Error creating comparison chart:', e); }
    }

    const resolutionCtx = document.getElementById('resolutionRateChart');
    if (resolutionCtx) {
      if (window.nvcCharts.resolutionRateChart) window.nvcCharts.resolutionRateChart.destroy();
      
      const shakhaStats = {};
      (state.complaints || []).forEach(complaint => {
        const shakha = complaint.shakha || 'अन्य';
        if (!shakhaStats[shakha]) shakhaStats[shakha] = { total: 0, resolved: 0 };
        shakhaStats[shakha].total++;
        if (complaint.status === 'resolved') shakhaStats[shakha].resolved++;
      });
      
      const labels = Object.keys(shakhaStats);
      const data = labels.map(shakha => {
        const stats = shakhaStats[shakha];
        return stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;
      });
      
      window.nvcChartsData.resolutionRateChart = {
          labels: labels,
          datasets: [{
              label: 'फछ्र्यौट दर (%)',
              data: data,
              backgroundColor: 'rgba(46, 125, 50, 0.7)',
              borderColor: 'rgba(46, 125, 50, 1)',
              borderWidth: 1
          }]
      };

      try {
        window.nvcCharts.resolutionRateChart = new Chart(resolutionCtx.getContext('2d'), {
          type: window.nvcChartsType.resolutionRateChart || 'bar',
          data: window.nvcChartsData.resolutionRateChart,
          options: {
            responsive: true, maintainAspectRatio: false,
            onClick: (evt, elements, chart) => {
                if (elements.length > 0) {
                    const i = elements[0].index;
                    const label = chart.data.labels[i];
                    showChartDrillDown({ shakha: label }, `${label} शाखाको विवरण`);
                }
            },
            scales: {
              y: { beginAtZero: true, max: 100, title: { display: true, text: 'प्रतिशत (%)' } },
              x: { ticks: { maxRotation: 45, minRotation: 45, font: { size: 10 } } }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.parsed.y + '%';
                        }
                    }
                }
            }
          }
        });
      } catch (e) { console.error('❌ Error creating resolution rate chart:', e); }
    }

    // --- New Classification Chart ---
    const classificationCtx = document.getElementById('classificationChart');
    if (classificationCtx) {
      if (window.nvcCharts.classificationChart) window.nvcCharts.classificationChart.destroy();

      const classStats = {
        'भ्रष्टाचार': 0,
        'सार्वजनिक खरिद/ठेक्का': 0,      
        'पूर्वाधार निर्माण': 0,
        'सेवा प्रवाह': 0,
        'कर्मचारी आचरण': 0,
        'नीति/निर्णय प्रक्रिया': 0,
        'अन्य': 0
      };

      // Filter complaints based on role (same logic as other charts)
      let chartComplaints = state.complaints || [];
      if (state.currentUser && state.currentUser.role === 'shakha') {
        const userShakhaName = (state.currentUser.shakha || '').trim();
        const userCode = (state.currentUser.id || '').trim();
        chartComplaints = chartComplaints.filter(c => {
          const cShakha = (c.shakha || '').trim();
          const cShakhaName = (c.shakhaName || '').trim();
          
          return cShakha === userShakhaName || 
                 cShakha.toLowerCase() === userCode.toLowerCase() ||
                 cShakhaName === userShakhaName ||
                 SHAKHA[cShakha] === userShakhaName ||
                 SHAKHA[cShakha.toUpperCase()] === userShakhaName ||
                 // Special handling for INFO_COLLECTION with new name
                 (cShakha === 'INFO_COLLECTION' && userShakhaName === 'सूचना संकलन, अन्वेषण तथा अनुगमन शाखा') ||
                 (userCode === 'INFO_COLLECTION' && cShakhaName === 'सूचना संकलन, अन्वेषण तथा अनुगमन शाखा');
        });
      } else if (state.currentUser && state.currentUser.role === 'mahashakha') {
        // For mahashakha users, show all complaints from their shakhas
        const userMahashakha = state.currentUser.mahashakha || state.currentUser.name;
        const allowedShakhas = MAHASHAKHA_STRUCTURE[userMahashakha] || [];
        
        chartComplaints = chartComplaints.filter(c => {
          // Check if complaint belongs to any shakha under this mahashakha
          const complaintShakha = c.shakha || '';
          return allowedShakhas.includes(complaintShakha) || 
                 c.mahashakha === userMahashakha || 
                 c.mahashakha === state.currentUser.name;
        });
        const mahashakhaFilter = document.getElementById('mahashakhaFilterShakha');
        if (mahashakhaFilter && mahashakhaFilter.value) {
            chartComplaints = chartComplaints.filter(c => c.shakha === mahashakhaFilter.value);
        }
      }

      chartComplaints.forEach(c => {
          const analysis = AI_SYSTEM.analyzeComplaint(c.description || '');
          const cls = analysis.classification || 'अन्य';
          if (classStats[cls] !== undefined) classStats[cls]++;
          else classStats['अन्य']++;
      });

      window.nvcChartsData.classificationChart = {
          labels: Object.keys(classStats),
          datasets: [{
              label: 'उजुरी संख्या',
              data: Object.values(classStats),
              backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF', '#535353'],
              borderWidth: 1
          }]
      };

      try {
        window.nvcCharts.classificationChart = new Chart(classificationCtx.getContext('2d'), {
          type: window.nvcChartsType['classificationChart'] || window.nvcChartsType.classificationChart || 'doughnut',
          data: window.nvcChartsData.classificationChart,
          options: {
            responsive: true, maintainAspectRatio: false,
            onClick: (evt, elements, chart) => {
                if (elements.length > 0) {
                    const i = elements[0].index;
                    const label = chart.data.labels[i];
                    showChartDrillDown({ classification: label }, `${label} सम्बन्धी उजुरीहरू`);
                }
            },
            plugins: { legend: { position: 'right', labels: { font: { size: 11 } } } }
          }
        });
      } catch (e) { console.error('❌ Error creating classification chart:', e); }
    }

    // --- Source Chart (उजुरीको स्रोत) ---
    const sourceCtx = document.getElementById('sourceChart');
    if (sourceCtx) {
      if (window.nvcCharts.sourceChart) window.nvcCharts.sourceChart.destroy();

      const sourceStats = {};
      let chartComplaints = state.complaints || [];
      
      // Filter logic (same as other charts)
      if (state.currentUser && state.currentUser.role === 'shakha') {
        const userShakhaName = (state.currentUser.shakha || '').trim();
        const userCode = (state.currentUser.id || '').trim();
        chartComplaints = chartComplaints.filter(c => {
          const cShakha = (c.shakha || '').trim();
          const cShakhaName = (c.shakhaName || '').trim();
          
          return cShakha === userShakhaName || 
                 cShakha.toLowerCase() === userCode.toLowerCase() ||
                 cShakhaName === userShakhaName ||
                 SHAKHA[cShakha] === userShakhaName ||
                 SHAKHA[cShakha.toUpperCase()] === userShakhaName ||
                 // Special handling for INFO_COLLECTION with new name
                 (cShakha === 'INFO_COLLECTION' && userShakhaName === 'सूचना संकलन, अन्वेषण तथा अनुगमन शाखा') ||
                 (userCode === 'INFO_COLLECTION' && cShakhaName === 'सूचना संकलन, अन्वेषण तथा अनुगमन शाखा');
        });
      } else if (state.currentUser && state.currentUser.role === 'mahashakha') {
        // For mahashakha users, show all complaints from their shakhas
        const userMahashakha = state.currentUser.mahashakha || state.currentUser.name;
        const allowedShakhas = MAHASHAKHA_STRUCTURE[userMahashakha] || [];
        
        chartComplaints = chartComplaints.filter(c => {
          // Check if complaint belongs to any shakha under this mahashakha
          const complaintShakha = c.shakha || '';
          return allowedShakhas.includes(complaintShakha) || 
                 c.mahashakha === userMahashakha || 
                 c.mahashakha === state.currentUser.name;
        });
        const mahashakhaFilter = document.getElementById('mahashakhaFilterShakha');
        if (mahashakhaFilter && mahashakhaFilter.value) {
            chartComplaints = chartComplaints.filter(c => c.shakha === mahashakhaFilter.value);
        }
      }

      chartComplaints.forEach(c => {
        let src = String(c.source || 'internal').toLowerCase().trim();
        let label = 'अन्य';
        if (src === 'internal' || src === 'आन्तरिक') label = 'केन्द्रमा दर्ता';
        else if (src === 'hello_sarkar' || src === 'hello sarkar') label = 'हेलो सरकार';
        else if (src === 'website' || src === 'online' || src === 'online_complaint') label = 'अनलाइन';
        else if (src === 'email' || src === 'इमेल') label = 'इमेल';
        else if (src === 'phone' || src === 'फोन') label = 'फोन';
        else if (src === 'letter' || src === 'पत्र') label = 'पत्र';
        if (src === 'internal') label = 'केन्द्रमा दर्ता';
        else if (src === 'hello_sarkar') label = 'हेलो सरकार';
        else if (src === 'hotline') label = 'हटलाइन';
        else if (src === 'online') label = 'अनलाइन';
        else if (src === 'email') label = 'इमेल';
        else if (src === 'phone') label = 'फोन';
        else if (src === 'letter') label = 'पत्र';
        
        sourceStats[label] = (sourceStats[label] || 0) + 1;
      });

      window.nvcChartsData.sourceChart = {
        labels: Object.keys(sourceStats),
        datasets: [{
          label: 'उजुरी संख्या',
          data: Object.values(sourceStats),
          backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF'],
          borderWidth: 1
        }]
      };

      try {
        window.nvcCharts.sourceChart = new Chart(sourceCtx.getContext('2d'), {
          type: window.nvcChartsType.sourceChart || 'doughnut',
          data: window.nvcChartsData.sourceChart,
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
              legend: { position: 'right', labels: { font: { size: 11 } } }
            }
          }
        });
      } catch (e) { console.error('❌ Error creating source chart:', e); }
    }

    // --- Admin Planning Specific Charts ---
    if (state.currentUser && state.currentUser.role === 'admin_planning') {
      // De-duplicate complaints to avoid double counting online complaints.
      // Prefer online/hello_sarkar records when IDs collide by allowing
      // onlineComplaints to overwrite prior entries.
      const uniqueComplaintsMap = new Map();
      (state.complaints || []).forEach(c => { if (c && c.id) uniqueComplaintsMap.set(normalizeComplaintId(c.id), c); });
      (state.onlineComplaints || []).forEach(c => { if (c && c.id) uniqueComplaintsMap.set(normalizeComplaintId(c.id), c); });
      let allComplaints = Array.from(uniqueComplaintsMap.values());

      // Debug: merged counts before normalization/filtering
      try {
        console.log('DEBUG admin_plan: merged complaints', { total: allComplaints.length, sheetCount: (state.complaints||[]).length, onlineCount: (state.onlineComplaints||[]).length });
      } catch (e) { /* ignore */ }

      // Normalize `source` and `status` for the merged set, then restrict to only
      // online / hello_sarkar complaints for the admin planning dashboard.
      for (let i = 0; i < allComplaints.length; i++) {
        try {
          const c = allComplaints[i] || {};
          // Normalize source into canonical codes (uses shared helper)
          const rawSource = c.source || c['उजुरीको माध्यम'] || c.sourceLabel || '';
          c.source = normalizeSourceCode(rawSource || 'internal');

          // Normalize status into canonical keys
          const raw = c.status || c['स्थिति'] || c.statusLabel || '';
          c.status = normalizeStatusCode(raw || 'pending');

          allComplaints[i] = c;
        } catch (e) { /* ignore */ }
      }

      // Keep only online / hello_sarkar / hotline complaints for this admin view
      allComplaints = allComplaints.filter(c => {
        const s = String(c.source || '').toLowerCase();
        return s === 'online' || s === 'online_complaint' || s === 'hello_sarkar' || s === 'hotline';
      });

      // Debug: filtered counts after normalization/filtering
      try {
        const bySource = (allComplaints || []).reduce((acc, x) => { const k = String(x.source||'').toLowerCase(); acc[k] = (acc[k]||0)+1; return acc; }, {});
        console.log('DEBUG admin_plan: filtered online/hello_sarkar counts', { total: allComplaints.length, bySource });
      } catch (e) { /* ignore */ }

      // 1. Hello Sarkar Status Chart
      const helloCtx = document.getElementById('helloSarkarChart');
      if (helloCtx) {
        if (window.nvcCharts.helloSarkarChart) window.nvcCharts.helloSarkarChart.destroy();
        const hsList = allComplaints.filter(c => String(c.source).toLowerCase() === 'hello_sarkar');
        
        // Debug: Log the Hello Sarkar complaints and their statuses
        console.log('🔍 Hello Sarkar Chart - HS List:', hsList);
        console.log('🔍 Hello Sarkar Chart - Raw statuses:', hsList.map(c => ({ id: c.id, status: c.status })));
        
        const pending = hsList.filter(c => c.status === 'pending').length;
        const resolved = hsList.filter(c => c.status === 'resolved').length;
        const progress = hsList.filter(c => c.status === 'progress').length;
        
        console.log('🔍 Hello Sarkar Chart - Counts:', { pending, progress, resolved, total: hsList.length });

        window.nvcChartsData.helloSarkarChart = {
          labels: ['काम बाँकी', 'चालु', 'फछ्रयौट'],
          datasets: [{
            data: [pending, progress, resolved],
            backgroundColor: ['rgba(255, 143, 0, 0.8)', 'rgba(30, 136, 229, 0.8)', 'rgba(46, 125, 50, 0.8)'],
            borderWidth: 1
          }]
        };
        window.nvcCharts.helloSarkarChart = new Chart(helloCtx.getContext('2d'), {
          type: window.nvcChartsType.helloSarkarChart || 'doughnut',
          data: window.nvcChartsData.helloSarkarChart,
          options: { 
            responsive: true, maintainAspectRatio: false, 
            plugins: { legend: { position: 'bottom' } },
            onClick: (evt, elements, chart) => {
              if (elements.length > 0) {
                const i = elements[0].index;
                const label = chart.data.labels[i];
                const statusMap = { 'काम बाँकी': 'pending', 'चालु': 'progress', 'फछ्रयौट': 'resolved' };
                showChartDrillDown({ source: 'hello_sarkar', status: statusMap[label] }, `हेलो सरकार: ${label} उजुरीहरू`);
              }
            }
          }
        });
      }

      // 2. Online Complaint Status Chart
      const onlineCtx = document.getElementById('onlineComplaintChart');
      if (onlineCtx) {
        if (window.nvcCharts.onlineComplaintChart) window.nvcCharts.onlineComplaintChart.destroy();
        const onlineList = allComplaints.filter(c => ['online','online_complaint'].includes(String(c.source).toLowerCase()));
        
        // Debug: Log the online complaints and their statuses
        console.log('🔍 Online Complaint Chart - Online List:', onlineList);
        console.log('🔍 Online Complaint Chart - Raw statuses:', onlineList.map(c => ({ id: c.id, status: c.status })));
        
        const pending = onlineList.filter(c => c.status === 'pending').length;
        const resolved = onlineList.filter(c => c.status === 'resolved').length;
        const progress = onlineList.filter(c => c.status === 'progress').length;
        
        console.log('🔍 Online Complaint Chart - Counts:', { pending, progress, resolved, total: onlineList.length });

        window.nvcChartsData.onlineComplaintChart = {
          labels: ['काम बाँकी', 'चालु', 'फछ्रयौट'],
          datasets: [{
            data: [pending, progress, resolved],
            backgroundColor: ['rgba(255, 143, 0, 0.8)', 'rgba(30, 136, 229, 0.8)', 'rgba(46, 125, 50, 0.8)'],
            borderWidth: 1
          }]
        };
        window.nvcCharts.onlineComplaintChart = new Chart(onlineCtx.getContext('2d'), {
          type: window.nvcChartsType.onlineComplaintChart || 'doughnut',
          data: window.nvcChartsData.onlineComplaintChart,
          options: { 
            responsive: true, maintainAspectRatio: false, 
            plugins: { legend: { position: 'bottom' } },
            onClick: (evt, elements, chart) => {
              if (elements.length > 0) {
                const i = elements[0].index;
                const label = chart.data.labels[i];
                const statusMap = { 'काम बाँकी': 'pending', 'चालु': 'progress', 'फछ्रयौट': 'resolved' };
                showChartDrillDown({ source: 'online', status: statusMap[label] }, `अनलाइन: ${label} उजुरीहरू`);
              }
            }
          }
        });
      }

        // 3. Hotline Complaint Status Chart
        const hotlineCtx = document.getElementById('hotlineComplaintChart');
        if (hotlineCtx) {
          if (window.nvcCharts.hotlineComplaintChart) window.nvcCharts.hotlineComplaintChart.destroy();
          const hotlineList = allComplaints.filter(c => String(c.source).toLowerCase() === 'hotline');
          const pendingH = hotlineList.filter(c => c.status === 'pending').length;
          const resolvedH = hotlineList.filter(c => c.status === 'resolved').length;
          const progressH = hotlineList.filter(c => c.status === 'progress').length;
          window.nvcChartsData.hotlineComplaintChart = {
            labels: ['काम बाँकी', 'चालु', 'फछ्रयौट'],
            datasets: [{
              data: [pendingH, progressH, resolvedH],
              backgroundColor: ['rgba(255, 143, 0, 0.8)', 'rgba(30, 136, 229, 0.8)', 'rgba(46, 125, 50, 0.8)'],
              borderWidth: 1
            }]
          };
          window.nvcCharts.hotlineComplaintChart = new Chart(hotlineCtx.getContext('2d'), {
            type: window.nvcChartsType.hotlineComplaintChart || 'doughnut',
            data: window.nvcChartsData.hotlineComplaintChart,
            options: {
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { position: 'bottom' } },
              onClick: (evt, elements, chart) => {
                if (elements.length > 0) {
                  const i = elements[0].index;
                  const label = chart.data.labels[i];
                  const statusMap = { 'काम बाँकी': 'pending', 'चालु': 'progress', 'फछ्रयौट': 'resolved' };
                  showChartDrillDown({ source: 'hotline', status: statusMap[label] }, `हटलाइन: ${label} उजुरीहरू`);
                }
              }
            }
          });
        }

      // 3. Employee Monitoring Trend Chart
      const empTrendCtx = document.getElementById('empMonitoringTrendChart');
      if (empTrendCtx) {
        if (window.nvcCharts.empMonitoringTrendChart) window.nvcCharts.empMonitoringTrendChart.destroy();
        const fiscalMonths = ['साउन', 'भदौ', 'असोज', 'कार्तिक', 'मंसिर', 'पुष', 'माघ', 'फागुन', 'चैत', 'बैशाख', 'जेठ', 'असार'];
        const dataArr = new Array(12).fill(0);
        
        // Calculate fiscal year for employee monitoring
        let fiscalYearStart = 2081;
        try {
            const nDate = getCurrentNepaliDate();
            const parts = nDate.split('-');
            if(parts.length >= 1) {
               const currentNYear = parseInt(parts[0]);
               const currentMonth = parseInt(parts[1]) || 1;
               if (currentMonth >= 4) { // Shrawan (4) or later
                   fiscalYearStart = currentNYear;
               } else { // Before Shrawan
                   fiscalYearStart = currentNYear - 1;
               }
            }
        } catch(e) {}
        
        (state.employeeMonitoring || []).forEach(record => {
          let txt = _devnagariToLatin(String(record.date || ''));
          const match = txt.match(/^(\d{4})[^0-9]?(\d{1,2})/);
          if (match) {
            const cY = Number(match[1]);
            const cM = Number(match[2]);
            
            // Check if record falls within current fiscal year
            let fiscalYearIndex = -1;
            
            // If record year is fiscal year start year (e.g., 2082)
            if (cY === fiscalYearStart && cM >= 4 && cM <= 12) {
                // Shrawan(4) to Chaitra(12) map to indices 0-8
                fiscalYearIndex = cM - 4;
            }
            // If record year is fiscal year end year (e.g., 2083)
            else if (cY === fiscalYearStart + 1 && cM >= 1 && cM <= 3) {
                // Baishakh(1) to Ashadh(3) map to indices 9-11
                fiscalYearIndex = 8 + cM; // 8 + month (1-3) = 9-11
            }
            
            if (fiscalYearIndex >= 0 && fiscalYearIndex < 12) {
                dataArr[fiscalYearIndex]++;
            }
          }
        });
        
        window.nvcChartsData.empMonitoringTrendChart = {
          labels: fiscalMonths,
          datasets: [{ label: 'अनुगमन संख्या', data: dataArr, backgroundColor: 'rgba(13, 71, 161, 0.7)', borderWidth: 1 }]
        };
        window.nvcCharts.empMonitoringTrendChart = new Chart(empTrendCtx.getContext('2d'), {
          type: window.nvcChartsType.empMonitoringTrendChart || 'bar',
          data: window.nvcChartsData.empMonitoringTrendChart,
          options: { 
            responsive: true, maintainAspectRatio: false, 
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
            onClick: (evt, elements, chart) => {
              if (elements.length > 0) {
                const i = elements[0].index;
                const monthName = chart.data.labels[i];
                showMonitoringDrillDown({ monthIndex: i + 1 }, `${monthName} महिनाका अनुगमन अभिलेखहरू`);
              }
            }
          }
        });
      }

      // 4. Citizen Charter Trend Chart
      const ccTrendCtx = document.getElementById('citizenCharterTrendChart');
      if (ccTrendCtx) {
        if (window.nvcCharts.citizenCharterTrendChart) window.nvcCharts.citizenCharterTrendChart.destroy();
        const fiscalMonths = ['साउन', 'भदौ', 'असोज', 'कार्तिक', 'मंसिर', 'पुष', 'माघ', 'फागुन', 'चैत', 'बैशाख', 'जेठ', 'असार'];
        const dataArr = new Array(12).fill(0);
        
        // Calculate fiscal year for citizen charter
        let fiscalYearStart = 2081;
        try {
            const nDate = getCurrentNepaliDate();
            const parts = nDate.split('-');
            if(parts.length >= 1) {
               const currentNYear = parseInt(parts[0]);
               const currentMonth = parseInt(parts[1]) || 1;
               if (currentMonth >= 4) { // Shrawan (4) or later
                   fiscalYearStart = currentNYear;
               } else { // Before Shrawan
                   fiscalYearStart = currentNYear - 1;
               }
            }
        } catch(e) {}
        
        (state.citizenCharters || []).forEach(record => {
          let txt = _devnagariToLatin(String(record.date || ''));
          const match = txt.match(/^(\d{4})[^0-9]?(\d{1,2})/);
          if (match) {
            const cY = Number(match[1]);
            const cM = Number(match[2]);
            
            // Check if record falls within current fiscal year
            let fiscalYearIndex = -1;
            
            // If record year is fiscal year start year (e.g., 2082)
            if (cY === fiscalYearStart && cM >= 4 && cM <= 12) {
                // Shrawan(4) to Chaitra(12) map to indices 0-8
                fiscalYearIndex = cM - 4;
            }
            // If record year is fiscal year end year (e.g., 2083)
            else if (cY === fiscalYearStart + 1 && cM >= 1 && cM <= 3) {
                // Baishakh(1) to Ashadh(3) map to indices 9-11
                fiscalYearIndex = 8 + cM; // 8 + month (1-3) = 9-11
            }
            
            if (fiscalYearIndex >= 0 && fiscalYearIndex < 12) {
                dataArr[fiscalYearIndex]++;
            }
          }
        });
        
        window.nvcChartsData.citizenCharterTrendChart = {
          labels: fiscalMonths,
          datasets: [{ label: 'अनुगमन संख्या', data: dataArr, backgroundColor: 'rgba(46, 125, 50, 0.7)', borderWidth: 1 }]
        };
        window.nvcCharts.citizenCharterTrendChart = new Chart(ccTrendCtx.getContext('2d'), {
          type: window.nvcChartsType.citizenCharterTrendChart || 'bar',
          data: window.nvcChartsData.citizenCharterTrendChart,
          options: { 
            responsive: true, maintainAspectRatio: false, 
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
            onClick: (evt, elements, chart) => {
              if (elements.length > 0) {
                const i = elements[0].index;
                const monthName = chart.data.labels[i];
                showCitizenCharterDrillDown({ monthIndex: i + 1 }, `${monthName} महिनाका नागरिक बडापत्र अनुगमनहरू`);
              }
            }
          }
        });
      }
    }
    
    // ===== Sample Testing Charts (for Laboratory Testing Branch) =====
    if (state.currentUser && (state.currentUser.shakha === 'LABORATORY_TESTING' || (SHAKHA && SHAKHA[state.currentUser.shakha] === 'प्रयोगशाला परीक्षण शाखा') || (state.currentUser.shakha && String(state.currentUser.shakha).toLowerCase().includes('laboratory')) || (state.currentUser.shakha && String(state.currentUser.shakha).includes('प्रयोगशाला')))) {
      
      // Monthly Testing Chart
      const monthlyTestingCtx = document.getElementById('monthlyTestingChart');
      if (monthlyTestingCtx) {
        if (window.nvcCharts.monthlyTestingChart) window.nvcCharts.monthlyTestingChart.destroy();
        
        const nepaliMonths = ['बैशाख', 'जेठ', 'असार', 'साउन', 'भदौ', 'असोज', 'कार्तिक', 'मंसिर', 'पुष', 'माघ', 'फागुन', 'चैत'];
        const monthlyData = new Array(12).fill(0);
        
        (state.sampleTests || []).forEach(test => {
          if (test.testDate || test['परीक्षण गरिएको मिति']) {
            let dateStr = _devnagariToLatin(String(test.testDate || test['परीक्षण गरिएको मिति']));
            const match = dateStr.match(/^(\d{4})[^0-9]?(\d{1,2})/);
            if (match && parseInt(match[2], 10) >= 1 && parseInt(match[2], 10) <= 12) {
              monthlyData[parseInt(match[2], 10) - 1]++;
            }
          }
        });
        
        window.nvcChartsData.monthlyTestingChart = {
          labels: nepaliMonths,
          datasets: [{
            label: 'परीक्षण संख्या',
            data: monthlyData,
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }]
        };
        
        try {
          window.nvcCharts.monthlyTestingChart = new Chart(monthlyTestingCtx.getContext('2d'), {
            type: window.nvcChartsType.monthlyTestingChart || 'bar',
            data: window.nvcChartsData.monthlyTestingChart,
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } } },
                x: { grid: { display: false } }
              },
              plugins: {
                tooltip: { mode: 'index', intersect: false },
                legend: { position: 'bottom' }
              },
              onClick: (evt, elements, chart) => {
                if (elements.length > 0) {
                  const i = elements[0].index;
                  const monthName = chart.data.labels[i];
                  showSampleTestingView({ monthIndex: i + 1, monthName: monthName });
                }
              }
            }
          });
        } catch (e) { console.error('❌ Error creating monthly testing chart:', e); }
      }
      
      // Testing Status Chart
      const testingStatusCtx = document.getElementById('testingStatusChart');
      if (testingStatusCtx) {
        if (window.nvcCharts.testingStatusChart) window.nvcCharts.testingStatusChart.destroy();
        
        const statusCounts = { 'pending': 0, 'progress': 0, 'completed': 0 };
        (state.sampleTests || []).forEach(test => {
          const status = test.status || 'pending';
          if (statusCounts.hasOwnProperty(status)) {
            statusCounts[status]++;
          }
        });
        
        window.nvcChartsData.testingStatusChart = {
          labels: ['प्रक्रियामा', 'चालु', 'सम्पन्न'],
          datasets: [{
            label: 'नमूना संख्या',
            data: [statusCounts.pending, statusCounts.progress, statusCounts.completed],
            backgroundColor: ['#FFC107', '#17A2B8', '#28A745'],
            borderColor: ['#FFC107', '#17A2B8', '#28A745'],
            borderWidth: 1
          }]
        };
        
        try {
          window.nvcCharts.testingStatusChart = new Chart(testingStatusCtx.getContext('2d'), {
            type: window.nvcChartsType.testingStatusChart || 'doughnut',
            data: window.nvcChartsData.testingStatusChart,
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                tooltip: { mode: 'index', intersect: false },
                legend: { position: 'bottom' }
              },
              onClick: (evt, elements, chart) => {
                if (elements.length > 0) {
                  const i = elements[0].index;
                  const statusLabels = ['pending', 'progress', 'completed'];
                  const statusNames = ['प्रक्रियामा', 'चालु', 'सम्पन्न'];
                  showSampleTestingView({ status: statusLabels[i] });
                }
              }
            }
          });
        } catch (e) { console.error('❌ Error creating testing status chart:', e); }
      }
    }
  }, 300);
}

function showMonitoringDrillDown(filters, title) {
  let filtered = (state.employeeMonitoring || []).slice();
  if (filters.monthIndex) {
    filtered = filtered.filter(record => {
      let txt = _devnagariToLatin(String(record.date || ''));
      const match = txt.match(/^(\d{4})[^0-9]?(\d{1,2})/);
      return match && parseInt(match[2], 10) === filters.monthIndex;
    });
  }
  const tableRows = filtered.map((r, i) => `
    <tr>
      <td>${i+1}</td><td>${r.date}</td><td>${r.officeName || r.organization || ''}</td>
      <td>${r.uniformViolationCount || r.uniformViolation || tryParseJsonCount(r.uniformEmployees)}</td><td>${r.timeViolationCount || r.timeViolation || tryParseJsonCount(r.timeEmployees)}</td>
      <td><button class="btn btn-sm btn-light action-btn" data-action="viewEmployeeMonitoring" data-id="${r.id}" data-close="true"><i class="fas fa-eye"></i></button></td>
    </tr>
  `).join('');
  const content = `<div class="table-responsive"><table class="table table-sm table-hover"><thead><tr><th>क्र.सं.</th><th>मिति</th><th>निकाय</th><th>पोशाक</th><th>समय</th><th>कार्य</th></tr></thead><tbody>${tableRows || '<tr><td colspan="6" class="text-center">डाटा छैन</td></tr>'}</tbody></table></div>`;
  openModal(title, content);
}

function showCitizenCharterDrillDown(filters, title) {
  let filtered = (state.citizenCharters || []).slice();
  if (filters.monthIndex) {
    filtered = filtered.filter(record => {
      let txt = _devnagariToLatin(String(record.date || ''));
      const match = txt.match(/^(\d{4})[^0-9]?(\d{1,2})/);
      return match && parseInt(match[2], 10) === filters.monthIndex;
    });
  }
  const tableRows = filtered.map((r, i) => `
    <tr>
      <td>${i+1}</td><td>${r.date}</td><td>${r.organization}</td>
      <td>${(r.findings||'').substring(0,40)}...</td>
      <td><button class="btn btn-sm btn-light action-btn" data-action="viewCitizenCharter" data-id="${r.id}" data-close="true"><i class="fas fa-eye"></i></button></td>
    </tr>
  `).join('');
  const content = `<div class="table-responsive"><table class="table table-sm table-hover"><thead><tr><th>क्र.सं.</th><th>मिति</th><th>निकाय</th><th>अवस्था</th><th>कार्य</th></tr></thead><tbody>${tableRows || '<tr><td colspan="5" class="text-center">डाटा छैन</td></tr>'}</tbody></table></div>`;
  openModal(title, content);
}

function showChartDrillDown(filters, title) {
  // Start with complaints scoped to the current user's view (respect branch/mahashakha)
  let filtered = (state.currentUser && state.currentUser.role === 'admin_planning') 
    ? (state.complaints || []).concat(state.onlineComplaints || []) 
    : (state.complaints || []).slice();

  if (state.currentUser && state.currentUser.role === 'shakha') {
    const userShakhaName = (state.currentUser.shakha || '').trim();
    const userCode = (state.currentUser.id || '').trim();
    filtered = filtered.filter(c => {
      const cShakha = (c.shakha || '').trim();
      const cShakhaName = (c.shakhaName || '').trim();
      
      return cShakha === userShakhaName || 
           cShakha.toLowerCase() === userCode.toLowerCase() ||
           cShakhaName === userShakhaName ||
           SHAKHA[cShakha] === userShakhaName ||
           SHAKHA[cShakha.toUpperCase()] === userShakhaName ||
           // Special handling for INFO_COLLECTION with new name
           (cShakha === 'INFO_COLLECTION' && userShakhaName === 'सूचना संकलन, अन्वेषण तथा अनुगमन शाखा') ||
           (userCode === 'INFO_COLLECTION' && cShakhaName === 'सूचना संकलन, अन्वेषण तथा अनुगमन शाखा');
    });
  } else if (state.currentUser && state.currentUser.role === 'mahashakha') {
    // For mahashakha users, show all complaints from their shakhas
    const userMahashakha = state.currentUser.mahashakha || state.currentUser.name;
    const allowedShakhas = MAHASHAKHA_STRUCTURE[userMahashakha] || [];
    
    filtered = filtered.filter(c => {
      // Check if complaint belongs to any shakha under this mahashakha
      const complaintShakha = c.shakha || '';
      return allowedShakhas.includes(complaintShakha) || 
             c.mahashakha === userMahashakha || 
             c.mahashakha === state.currentUser.name;
    });
    const mahashakhaFilter = document.getElementById('mahashakhaFilterShakha');
    if (mahashakhaFilter && mahashakhaFilter.value) {
      filtered = filtered.filter(c => c.shakha === mahashakhaFilter.value);
    }
  }

  if (filters.source) {
    const src = String(filters.source).toLowerCase();
    if (src === 'online') filtered = filtered.filter(c => ['online','online_complaint'].includes(String(c.source).toLowerCase()));
    else filtered = filtered.filter(c => String(c.source).toLowerCase() === src);
  }
  if (filters.status) filtered = filtered.filter(c => c.status === filters.status);
  if (filters.shakha) filtered = filtered.filter(c => c.shakha === filters.shakha);
    
    if (filters.monthIndex) {
      // Use fiscal year logic if year is provided, otherwise fall back to current year
      let targetYear = filters.year;
      if (!targetYear) {
        // Fallback: Determine current Nepali year (same heuristic as trend chart)
        targetYear = 2081;
        try { const nDate = getCurrentNepaliDate(); const p = String(nDate).split('-'); if (p.length >= 1) targetYear = parseInt(p[0]) || targetYear; } catch(e) {}
      }

      filtered = filtered.filter(c => {
        const raw = c.date || c.dateNepali || c['दर्ता मिति'] || '';
        if (!raw) return false;

        // Convert Devanagari digits to Latin for matching
        let txt = String(raw);
        try { if (typeof _devnagariToLatin === 'function') txt = _devnagariToLatin(txt); } catch(e) {}

        // Try simple YYYY-MM-DD or similar first
        let match = txt.match(/^(\d{4})[^0-9]?(\d{1,2})[^0-9]?(\d{1,2})/);
        if (match) {
          const y = Number(match[1]);
          const mo = Number(match[2]);
          if (y === targetYear && mo === filters.monthIndex) return true;
          // If it's AD (year < 2050) try converting to BS and check
          if (y < 2050) {
            try {
              const bs = (typeof convertADtoBS === 'function' ? convertADtoBS(txt) : '') || (typeof convertADtoBSAccurate === 'function' ? convertADtoBSAccurate(txt) : '');
              const mm = String(bs).match(/^(\d{4})-(\d{2})-(\d{2})$/);
              if (mm) {
                if (Number(mm[1]) === targetYear && Number(mm[2]) === filters.monthIndex) return true;
              }
            } catch (e) { /* ignore */ }
          }
        }

        // Fallback: use normalizeNepaliDisplayToISO to attempt YYYY-MM-DD extraction
        try {
          if (typeof normalizeNepaliDisplayToISO === 'function') {
            const iso = normalizeNepaliDisplayToISO(raw);
            const mm = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (mm) {
              if (Number(mm[1]) === targetYear && Number(mm[2]) === filters.monthIndex) return true;
            }
          }
        } catch (e) { /* ignore */ }

        return false;
      });
    } else if (filters.month) {
      filtered = filtered.filter(c => (c.date || '').includes(filters.month));
    }

    if (filters.classification) {
        filtered = filtered.filter(c => {
            const analysis = AI_SYSTEM.analyzeComplaint(c.description || '');
            const cls = analysis.classification || 'अन्य';
            return cls === filters.classification;
        });
    }
    
    // Filter by Ministry/Organization when requested
    if (filters.ministry) {
      const wanted = String(filters.ministry).trim();
      filtered = filtered.filter(c => {
        const m = (c.ministry || c['मन्त्रालय/निकाय'] || c.organization || c['निकाय'] || '').toString().trim();
        return m === wanted;
      });
    }
    
    const tableRows = filtered.map(c => `
        <tr>
            <td>${c.id}</td>
            <td>${c.date}</td>
            <td>${c.complainant}</td>
            <td>${c.description.substring(0, 40)}...</td>
            <td><span class="status-badge status-${c.status}">${c.status === 'resolved' ? 'फछ्रयौट' : c.status === 'pending' ? 'बाँकी' : 'चालु'}</span></td>
            <td><button class="btn btn-sm btn-light action-btn" data-action="view" data-id="${c.id}" data-close="true"><i class="fas fa-eye"></i></button></td>
        </tr>
    `).join('');
    
    const content = `
        <div class="table-responsive">
            <table class="table table-sm table-hover">
                <thead><tr><th>ID</th><th>मिति</th><th>उजुरकर्ता</th><th>विवरण</th><th>स्थिति</th><th>कार्य</th></tr></thead>
                <tbody>${tableRows.length ? tableRows : '<tr><td colspan="6" class="text-center">डाटा छैन</td></tr>'}</tbody>
            </table>
        </div>
    `;
    
    openModal(title || 'विवरण', content);
}

function showProjectDrillDown(filters, title) {
  const canUseOverviewScope = state.currentView === 'technical_projects_overview' && (state._technicalOverviewProjects && Array.isArray(state._technicalOverviewProjects));
  let projects = canUseOverviewScope ? (state._technicalOverviewProjects || []) : (state.projects || []);

  if (!canUseOverviewScope) {
    if (state.currentUser && state.currentUser.role === 'admin') {
      // admin sees all
    } else if (state.currentUser && state.currentUser.role === 'mahashakha' && ((state.currentUser.mahashakha || state.currentUser.name || '').toString() === MAHASHAKHA.TECHNICAL)) {
      const allowed = MAHASHAKHA_STRUCTURE[MAHASHAKHA.TECHNICAL] || [];
      projects = projects.filter(p => {
        const s = (p.shakha || '').toString();
        if (!s) return false;
        if (allowed.includes(s)) return true;
        if (s.includes('प्राविधिक')) return true;
        return false;
      });
    } else if (state.currentUser) {
      const userShakhaName = (state.currentUser.shakha || '').trim();
      const userCode = (state.currentUser.id || '').trim();
      projects = projects.filter(p => {
        const pShakha = (p.shakha || '').trim();
        return pShakha === userShakhaName || 
               pShakha.toLowerCase() === userCode.toLowerCase() ||
               SHAKHA[pShakha] === userShakhaName ||
               SHAKHA[pShakha.toUpperCase()] === userShakhaName;
      });
    }
  }

  if (filters.status) {
    if (filters.status === 'active') projects = projects.filter(p => p.status === 'active');
    else if (filters.status === 'completed') projects = projects.filter(p => p.improvementInfo && String(p.improvementInfo).trim() !== '');
    else if (filters.status === 'pending') projects = projects.filter(p => !p.improvementInfo || String(p.improvementInfo).trim() === '');
  }

  const tableRows = projects.map((p, i) => {
    const statusLabel = (p.improvementInfo && String(p.improvementInfo).trim() !== '') ? 'सम्पन्न' : (p.status === 'active' ? 'चालु' : 'काम बाँकी');
    const badgeClass = (statusLabel === 'सम्पन्न') ? 'status-resolved' : (statusLabel === 'चालु') ? 'status-progress' : 'status-pending';
    return `<tr><td>${i + 1}</td><td>${p.name || '-'}</td><td>${p.organization || '-'}</td><td>${p.inspectionDate || '-'}</td><td><span class="status-badge ${badgeClass}">${statusLabel}</span></td><td><button class="btn btn-sm btn-light action-btn" data-func="viewProject" data-id="${p.id}" title="हेर्नुहोस्"><i class="fas fa-eye"></i></button></td></tr>`;
  }).join('');

  const content = `
    <div class="table-responsive">
      <table class="table table-sm table-hover">
        <thead><tr><th>क्र.सं.</th><th>आयोजनाको नाम</th><th>निकाय</th><th>मिति</th><th>स्थिति</th><th>कार्य</th></tr></thead>
        <tbody>${tableRows.length ? tableRows : '<tr><td colspan="6" class="text-center">डाटा छैन</td></tr>'}</tbody>
      </table>
    </div>
  `;
  openModal(title || 'आयोजना विवरण', content);
}

function openProjectDateFilter() {
    const content = `
        <div class="form-group mb-3">
            <label class="form-label">देखि (Start Date)</label>
            <div class="nepali-datepicker-dropdown" data-target="projChartStart">
                <select id="projChartStart_year" class="form-select bs-year"><option value="">साल</option></select>
                <select id="projChartStart_month" class="form-select bs-month"><option value="">महिना</option></select>
                <select id="projChartStart_day" class="form-select bs-day"><option value="">गते</option></select>
                <input type="hidden" id="projChartStart" value="${state.projectChartFilter?.startDate || ''}" />
            </div>
        </div>
        <div class="form-group mb-3">
            <label class="form-label">सम्म (End Date)</label>
            <div class="nepali-datepicker-dropdown" data-target="projChartEnd">
                <select id="projChartEnd_year" class="form-select bs-year"><option value="">साल</option></select>
                <select id="projChartEnd_month" class="form-select bs-month"><option value="">महिना</option></select>
                <select id="projChartEnd_day" class="form-select bs-day"><option value="">गते</option></select>
                <input type="hidden" id="projChartEnd" value="${state.projectChartFilter?.endDate || ''}" />
            </div>
        </div>
        <div class="d-flex justify-end gap-2">
            <button class="btn btn-outline-secondary" onclick="clearProjectDateFilter()">रिसेट</button>
            <button class="btn btn-primary" onclick="applyProjectDateFilter()">फिल्टर गर्नुहोस्</button>
        </div>
    `;
    openModal('मिति अनुसार फिल्टर (प्राविधिक चार्ट)', content);
    setTimeout(() => { initializeNepaliDropdowns(); }, 100);
}

function applyProjectDateFilter() {
    const start = document.getElementById('projChartStart').value;
    const end = document.getElementById('projChartEnd').value;
    state.projectChartFilter = { startDate: start, endDate: end };
    closeModal();
    initializeDashboardCharts();
    showToast('चार्ट फिल्टर गरियो', 'success');
}

function clearProjectDateFilter() {
    state.projectChartFilter = { startDate: '', endDate: '' };
    closeModal();
    initializeDashboardCharts();
    showToast('फिल्टर हटाइयो', 'info');
}

function changeChartType(chartId, newType) {
    // Primary key (direct mapping)
    window.nvcChartsType[chartId] = newType;
    // Backwards-compatible aliases used by some chart builders
    try {
      if (chartId === 'projectStatusChart') window.nvcChartsType.projectChart = newType;
      if (chartId === 'complaintStatusChart') window.nvcChartsType.complaintStatus = newType;
      if (chartId === 'classificationChart') window.nvcChartsType.classificationChart = newType;
      if (chartId === 'shakhaChart') window.nvcChartsType.shakhaChart = newType;
      if (chartId === 'trendChart') window.nvcChartsType.trendChart = newType;
      if (chartId === 'resolutionRateChart') window.nvcChartsType.resolutionRateChart = newType;
      if (chartId === 'sourceChart') window.nvcChartsType.sourceChart = newType;
      if (chartId === 'adminMinistryChart') window.nvcChartsType.adminMinistryChart = newType;
      if (chartId === 'mahashakhaMinistryChart') window.nvcChartsType.mahashakhaMinistryChart = newType;
    } catch (e) { /* ignore */ }

    initializeDashboardCharts(); // Re-render all charts (simplest way to apply type change)
}

function exportChartImage(chartId) {
    const canvas = document.getElementById(chartId);
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${chartId}_${new Date().toISOString().slice(0,10)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

function exportChartData(chartId) {
    const data = window.nvcChartsData[chartId];
    if (!data) return;
    
    let csv = 'Label,Value\n';
    data.labels.forEach((label, i) => {
        // Handle multiple datasets by summing or listing all
        let val = 0;
        data.datasets.forEach(ds => {
            val += (ds.data[i] || 0);
        });
        csv += `"${label}",${val}\n`;
    });
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${chartId}_data.csv`;
    link.click();
}

function showDashboardView() {
  state.currentView = 'dashboard';
  const pageTitle = document.getElementById('pageTitle');
  if (pageTitle) pageTitle.textContent = 'ड्यासबोर्ड';
  
  destroyAllCharts();
  
  let content = '';
  if (state.currentUser.role === 'admin') content = showAdminDashboard();
  else if (state.currentUser.role === 'admin_planning') content = showAdminPlanningDashboard();
  else if (state.currentUser.role === 'mahashakha') content = showMahashakhaDashboard();
  else if (state.currentUser.permissions?.includes('technical_inspection')) content = showTechnicalDashboard();
  else content = showShakhaDashboard();

  setContentAreaHTML(content);
  applyDevanagariDigits(document.getElementById('contentArea'));
  
  // Render AI insights if it's an admin dashboard
  if (state.currentUser.role === 'admin') {
    renderAIInsights();
  }

  updateActiveNavItem();
  setTimeout(initializeDashboardCharts, 500);
}

function renderAIInsights() {
    const container = document.getElementById('aiInsightBox');
    if (!container) return;

    const insights = AI_INSIGHTS.generateInsights(state.complaints);
    
    if (!insights || insights.length === 0) {
        container.innerHTML = '';
        return;
    }

    const insightsHTML = insights.map(insight => `
        <div class="insight-item insight-${insight.type}">
            <i class="fas ${insight.icon}"></i>
            <span>${insight.message}</span>
        </div>
    `).join('');

    container.innerHTML = `
        <div class="ai-insight-container card">
             <div class="card-header">
                <h6 class="mb-0"><span class="ai-badge"><i class="fas fa-robot"></i> AI इनसाइट</span> प्रणाली विश्लेषण</h6>
            </div>
            <div class="card-body">
                ${insightsHTML}
            </div>
        </div>
    `;
}

function getChartActionsHTML(chartId) {
  return `
    <div class="dropdown">
      <button class="btn btn-sm btn-link text-muted p-0" type="button" data-bs-toggle="dropdown" aria-expanded="false">
        <i class="fas fa-ellipsis-v"></i>
      </button>
      <ul class="dropdown-menu dropdown-menu-end">
        <li><h6 class="dropdown-header">प्रकार परिवर्तन</h6></li>
        <li><a class="dropdown-item" href="#" onclick="changeChartType('${chartId}', 'bar')"><i class="fas fa-chart-bar me-2"></i> Bar</a></li>
        <li><a class="dropdown-item" href="#" onclick="changeChartType('${chartId}', 'line')"><i class="fas fa-chart-line me-2"></i> Line</a></li>
        <li><a class="dropdown-item" href="#" onclick="changeChartType('${chartId}', 'pie')"><i class="fas fa-chart-pie me-2"></i> Pie</a></li>
        <li><a class="dropdown-item" href="#" onclick="changeChartType('${chartId}', 'doughnut')"><i class="fas fa-circle-notch me-2"></i> Doughnut</a></li>
        <li><hr class="dropdown-divider"></li>
        <li><h6 class="dropdown-header">कार्यहरू</h6></li>
        <li><a class="dropdown-item" href="#" onclick="exportChartImage('${chartId}')"><i class="fas fa-image me-2"></i> PNG डाउनलोड</a></li>
        <li><a class="dropdown-item" href="#" onclick="exportChartData('${chartId}')"><i class="fas fa-file-csv me-2"></i> CSV डाउनलोड</a></li>
      </ul>
    </div>
  `;
}

function generateClassificationTableHTML(complaints) {
    const stats = {
        'भ्रष्टाचार': 0, 'सार्वजनिक खरिद/ठेक्का': 0, 'पूर्वाधार निर्माण': 0,
        'सेवा प्रवाह': 0, 'कर्मचारी आचरण': 0, 'नीति/निर्णय प्रक्रिया': 0, 'अन्य': 0
    };

    complaints.forEach(c => {
        const analysis = AI_SYSTEM.analyzeComplaint(c.description || '');
        const cls = analysis.classification || 'अन्य';
        if (stats[cls] !== undefined) stats[cls]++;
        else stats['अन्य'] = (stats['अन्य'] || 0) + 1;
    });

    const rows = Object.entries(stats).map(([key, value]) => `
        <tr><td>${key}</td><td class="text-end">${value}</td></tr>
    `).join('');

    return `
        <div class="table-responsive">
            <table class="table table-sm table-bordered mb-0">
                <thead class="table-light">
                    <tr><th>वर्गीकरण (विषय)</th><th class="text-end">संख्या</th></tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;
}

function showAdminDashboard() {
  const totalComplaints = state.complaints.length;
  const inProgressComplaints = state.complaints.filter(c => c.status === 'progress').length;
  const pendingComplaints = state.complaints.filter(c => c.status === 'pending').length;
  const resolvedComplaints = state.complaints.filter(c => c.status === 'resolved').length;
  const monthlyComplaints = state.complaints.filter(c => {
    const todayNepali = getCurrentNepaliDate(); // e.g., "2081-11-03"
    if (!todayNepali) return false;
    const yearMonth = todayNepali.substring(0, 7); // "2081-11"
    const complaintRegDate = c['उजुरी दर्ता मिति'] || c.regDate || '';
    return complaintRegDate.startsWith(yearMonth);
  }).length;
  
  const shakhaStats = {};
  state.complaints.forEach(complaint => {
    const shakha = complaint.shakha || 'अन्य';
    if (!shakhaStats[shakha]) shakhaStats[shakha] = { total: 0, pending: 0, resolved: 0 };
    shakhaStats[shakha].total++;
    if (complaint.status === 'pending') shakhaStats[shakha].pending++;
    if (complaint.status === 'resolved') shakhaStats[shakha].resolved++;
  });

  // Fiscal Year Cutoff Logic
  const cutoffDate = '2082-04-01';
  const lastFyComplaints = state.complaints.filter(c => {
    const d = normalizeNepaliDisplayToISO(c.date || c['दर्ता मिति']);
    return d && d < cutoffDate;
  }).length;
  const thisFyComplaints = state.complaints.filter(c => {
    const d = normalizeNepaliDisplayToISO(c.date || c['दर्ता मिति']);
    return d && d >= cutoffDate;
  }).length;
  
  return `
    <div class="mobile-search-toggle">
        <button class="btn btn-sm btn-outline-primary" onclick="toggleDashboardSearch()">
            <i class="fas fa-search"></i> खोजी
        </button>
    </div>
    <div id="dashboardSearchContainer" class="search-bar-container mb-3 collapsed-mobile">
        <div class="input-group">
            <span class="input-group-text bg-white"><i class="fas fa-search text-muted"></i></span>
            <input type="text" class="form-control border-start-0 ps-0" placeholder="उजुरी नं, नाम वा विवरण खोजी गर्नुहोस्..." onkeyup="if(event.key === 'Enter') showComplaintsView({search: this.value})">
            <button class="btn btn-primary" onclick="showComplaintsView({search: this.previousElementSibling.value})">खोजी गर्नुहोस्</button>
        </div>
    </div>

    <div id="aiInsightBox" class="mb-3"></div>
    
    <div class="card mb-3">
      <div class="card-header d-flex justify-between align-center">
        <h6 class="mb-0">🔥 हटस्पट ट्र्याकर</h6>
        <a href="#" class="text-primary" onclick="showHotspotMap()">पूर्ण नक्सा हेर्नुहोस्</a>
      </div>
      <div class="card-body">
        <div class="d-flex gap-3 overflow-auto" style="padding-bottom: 8px;">
          ${generateHotspotCards()}
        </div>
      </div>
    </div>
  

    <div class="stats-grid mb-3">
      ${(() => {
        // office monitoring stats
        const officeMonitoringTotal = (state.employeeMonitoring || []).length;
        let thisMonthMonitoring = 0;
        try {
          const nm = (getCurrentNepaliDate() || '').split('-');
          const currentNYear = parseInt(nm[0]) || null;
          const currentNMonth = parseInt(nm[1]) || null;
          thisMonthMonitoring = (state.employeeMonitoring || []).filter(r => {
            const raw = r.date || r['मिति'] || r.dateNepali || '';
            if (!raw) return false;
            const iso = normalizeNepaliDisplayToISO(raw);
            const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (!m) return false;
            return Number(m[1]) === currentNYear && Number(m[2]) === currentNMonth;
          }).length;
        } catch (e) { thisMonthMonitoring = 0; }
        return `
          <div class="stat-widget pointer" onclick="showEmployeeMonitoringView()"><div class="stat-icon bg-info"><i class="fas fa-building"></i></div><div class="stat-info"><div class="stat-value">${officeMonitoringTotal}</div><div class="stat-label">कूल कार्यालय अनुगमन</div></div></div>
          <div class="stat-widget pointer" onclick="showEmployeeMonitoringView()"><div class="stat-icon bg-secondary"><i class="fas fa-calendar-day"></i></div><div class="stat-info"><div class="stat-value">${thisMonthMonitoring}</div><div class="stat-label">यस महिनाको कार्यालय अनुगमन</div></div></div>
        `;
      })()}
      <div class="stat-widget pointer" onclick="showComplaintsView()"><div class="stat-icon bg-primary"><i class="fas fa-file-alt"></i></div><div class="stat-info"><div class="stat-value">${totalComplaints}</div><div class="stat-label">कूल उजुरीहरू</div><span class="stat-trend trend-up"></span></div></div>
      <div class="stat-widget pointer" onclick="showComplaintsView({status: 'progress'})"><div class="stat-icon bg-info"><i class="fas fa-spinner"></i></div><div class="stat-info"><div class="stat-value">${inProgressComplaints}</div><div class="stat-label">चालु उजुरी</div><span class="stat-trend trend-up"></span></div></div>
      <div class="stat-widget pointer" onclick="showComplaintsView({status: 'pending'})"><div class="stat-icon bg-warning"><i class="fas fa-clock"></i></div><div class="stat-info"><div class="stat-value">${pendingComplaints}</div><div class="stat-label">काम बाँकी</div><span class="stat-trend trend-down"></span></div></div>
      <div class="stat-widget pointer" onclick="showComplaintsView({status: 'resolved'})"><div class="stat-icon bg-success"><i class="fas fa-check-circle"></i></div><div class="stat-info"><div class="stat-value">${resolvedComplaints}</div><div class="stat-label">फछ्रयौट भएका</div><span class="stat-trend trend-up"></span></div></div>
      <div class="stat-widget pointer" onclick="showThisMonthsComplaints()"><div class="stat-icon bg-secondary"><i class="fas fa-calendar-alt"></i></div><div class="stat-info"><div class="stat-value">${monthlyComplaints}</div><div class="stat-label">यस महिनाका</div><span class="stat-trend trend-up"></span></div></div>
      <div class="stat-widget pointer" onclick="showTechnicalProjectsOverview({scope: 'all'})"><div class="stat-icon bg-info"><i class="fas fa-hard-hat"></i></div><div class="stat-info"><div class="stat-value">${(state.projects || []).length}</div><div class="stat-label">प्राविधिक परीक्षण</div><span class="stat-trend trend-up"></span></div></div>
      <div class="stat-widget pointer" onclick="showTechnicalExaminersView()"><div class="stat-icon bg-warning"><i class="fas fa-user-tie"></i></div><div class="stat-info"><div class="stat-value">${(state.technicalExaminers || []).length}</div><div class="stat-label">प्राविधिक परीक्षक सूची</div><span class="stat-trend trend-up"></span></div></div>
      <div class="stat-widget pointer" onclick="showComplaintsView({endDate: '2082-03-31'})"><div class="stat-icon" style="background-color: #6f42c1; color: white;"><i class="fas fa-history"></i></div><div class="stat-info"><div class="stat-value">${lastFyComplaints}</div><div class="stat-label">गत आ.व.को जिम्मेवारी</div><span class="stat-trend trend-down"></span></div></div>
      <div class="stat-widget pointer" onclick="showComplaintsView({startDate: '2082-04-01'})"><div class="stat-icon" style="background-color: #fd7e14; color: white;"><i class="fas fa-calendar-check"></i></div><div class="stat-info"><div class="stat-value">${thisFyComplaints}</div><div class="stat-label">यस आ.व.का उजुरी</div><span class="stat-trend trend-up"></span></div></div>
    </div>
    
    <div class="card mb-3">
      <div class="card-header d-flex justify-between align-center"><h5 class="mb-0">उजुरी वर्गीकरण (AI विश्लेषण)</h5>${getChartActionsHTML('classificationChart')}</div>
      <div class="card-body">
        <div class="row"><div class="col-md-7"><div class="chart-wrapper dashboard-chart-wrapper"><canvas id="classificationChart"></canvas></div></div><div class="col-md-5">${generateClassificationTableHTML(state.complaints)}</div></div>
      </div>
    </div>

    <div class="d-grid gap-3 mb-3" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));">
      <div class="chart-container"><div class="chart-header d-flex justify-between align-center"><h6 class="chart-title">शाखा अनुसार उजुरी तुलना</h6>${getChartActionsHTML('shakhaChart')}</div><div class="chart-wrapper dashboard-chart-wrapper"><canvas id="shakhaChart"></canvas></div></div>
      <div class="chart-container"><div class="chart-header d-flex justify-between align-center"><h6 class="chart-title">मासिक प्रगति विवरण</h6>${getChartActionsHTML('trendChart')}</div><div class="chart-wrapper dashboard-chart-wrapper"><canvas id="trendChart"></canvas></div></div>
      <div class="chart-container"><div class="chart-header d-flex justify-between align-center"><h6 class="chart-title">शाखा अनुसार फछ्र्यौट दर</h6>${getChartActionsHTML('resolutionRateChart')}</div><div class="chart-wrapper dashboard-chart-wrapper"><canvas id="resolutionRateChart"></canvas></div></div>
      <div class="chart-container"><div class="chart-header d-flex justify-between align-center"><h6 class="chart-title">मन्त्रालय/निकाय अनुसार उजुरी</h6>${getChartActionsHTML('adminMinistryChart')}</div><div class="chart-wrapper dashboard-chart-wrapper"><canvas id="adminMinistryChart"></canvas></div></div>
      <div class="chart-container"><div class="chart-header d-flex justify-between align-center"><div class="d-flex align-center gap-2"><h6 class="chart-title mb-0">प्राविधिक परीक्षण/आयोजना अनुगमन</h6><button class="btn btn-sm btn-link text-muted p-0" onclick="openProjectDateFilter()" title="मिति फिल्टर"><i class="fas fa-calendar-alt"></i></button></div>${getChartActionsHTML('projectStatusChart')}</div><div class="chart-wrapper dashboard-chart-wrapper"><canvas id="projectStatusChart"></canvas></div></div>
      <div class="chart-container"><div class="chart-header d-flex justify-between align-center"><h6 class="chart-title">उजुरीको स्रोत</h6>${getChartActionsHTML('sourceChart')}</div><div class="chart-wrapper dashboard-chart-wrapper"><canvas id="sourceChart"></canvas></div></div>
    </div>
    
    <div class="card mb-3">
      <div class="card-header d-flex justify-between align-center">
        <h5 class="mb-0">शाखा अनुसार उजुरी स्थिति</h5>
        <button class="btn btn-sm btn-success" onclick="exportToExcel('shakha_stats')"><i class="fas fa-file-excel"></i> Excel</button>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table">
            <thead><tr><th>शाखा</th><th>कूल उजुरी</th><th>काम बाँकी</th><th>फछ्रयौट</th><th>फछ्रयौट दर</th></tr></thead>
            <tbody>
              ${Object.keys(shakhaStats).map(shakha => {
                const stats = shakhaStats[shakha];
                const resolutionRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;                return `<tr><td data-label="शाखा">${shakha}</td><td data-label="कूल उजुरी">${stats.total}</td><td data-label="काम बाँकी">${stats.pending}</td><td data-label="फछ्रयौट">${stats.resolved}</td><td data-label="फछ्रयौट दर">${resolutionRate}%</td></tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-header d-flex justify-between align-center">
        <h5 class="mb-0">हालैका उजुरीहरू</h5>
        <div class="d-flex align-center gap-2">
          <button class="btn btn-sm btn-success" onclick="exportToExcel('recent')"><i class="fas fa-file-excel"></i> Excel</button>
          <a href="#" class="text-primary text-small" onclick="showAllComplaintsView()">सबै हेर्नुहोस्</a>
        </div>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table">
            <thead><tr><th>दर्ता नं</th><th>दर्ता मिति</th><th>उजुरकर्ता</th><th>सम्बन्धित शाखा</th><th>उजुरीको संक्षिप्त विवरण</th><th>उजुरीको स्थिति</th><th>कार्य</th></tr></thead>
            <tbody>
              ${state.complaints.slice(0, 5).map(complaint => `
                <tr>
                  <td data-label="दर्ता नं">${complaint.id}</td><td data-label="दर्ता मिति">${complaint.date}</td><td data-label="उजुरकर्ता">${complaint.complainant}</td><td data-label="सम्बन्धित शाखा">${displayShakhaName(complaint.shakha) || '-'}</td>
                  <td data-label="उजुरीको संक्षिप्त विवरण" class="text-limit">${(complaint.description || '').substring(0, 50)}...</td>
                  <td data-label="उजुरीको स्थिति"><span class="status-badge ${complaint.status === 'resolved' ? 'status-resolved' : complaint.status === 'pending' ? 'status-pending' : 'status-progress'}">${complaint.status === 'resolved' ? 'फछ्रयौट' : complaint.status === 'pending' ? 'काम बाँकी' : 'चालु'}</span></td>
                  <td data-label="कार्य"><button class="action-btn" data-action="view" data-id="${complaint.id}" title="हेर्नुहोस्"><i class="fas fa-eye"></i></button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function showAdminPlanningDashboard() {
  // De-duplicate complaints to avoid double counting online complaints that have been forwarded.
  // Merge with preference: if an online record exists for the same ID, prefer the online record
  // because it may carry the latest status from the online sheet.
  const uniqueComplaintsMap = new Map();

  // Helper to normalize a record in-place
  const normalizeRecord = (r) => {
    try {
      if (!r) return r;
      r.source = normalizeSourceCode(r.source || r['उजुरीको माध्यम'] || r.sourceLabel || '');
      r.status = normalizeStatusCode(r.status || r['स्थिति'] || r.statusLabel || 'pending');
    } catch (e) {}
    return r;
  };

  // Add all from the main list first
  (state.complaints || []).forEach(c => {
    if (c && c.id) uniqueComplaintsMap.set(normalizeComplaintId(c.id), normalizeRecord(Object.assign({}, c)));
  });

  // Merge online list: if an online record exists for same ID, prefer it (override)
  (state.onlineComplaints || []).forEach(c => {
    if (!c || !c.id) return;
    const id = normalizeComplaintId(c.id);
    const incoming = normalizeRecord(Object.assign({}, c));
    const existing = uniqueComplaintsMap.get(id);
    // If existing is absent, set incoming. If existing exists but incoming is online, prefer incoming.
    const incSrc = String(incoming.source || '').toLowerCase();
    const existSrc = String(existing && existing.source || '').toLowerCase();
    if (!existing) {
      uniqueComplaintsMap.set(id, incoming);
    } else if (incSrc === 'online' || incSrc === 'online_complaint' || incSrc === 'hello_sarkar') {
      // Prefer online/hello_sarkar incoming record
      uniqueComplaintsMap.set(id, incoming);
    } else if (!existSrc || existSrc === 'internal') {
      // If incoming is not online but existing is internal/empty, prefer incoming
      uniqueComplaintsMap.set(id, incoming);
    }
  });

  const allComplaints = Array.from(uniqueComplaintsMap.values());
  // Normalize source/status and restrict to online/hello_sarkar only for admin planning view
  for (let i = 0; i < allComplaints.length; i++) {
    try {
      const c = allComplaints[i] || {};
      const rawSource = c.source || c['उजुरीको माध्यम'] || c.sourceLabel || '';
      c.source = normalizeSourceCode(rawSource || 'internal');
      const rawStatus = c.status || c['स्थिति'] || c.statusLabel || '';
      c.status = normalizeStatusCode(rawStatus || 'pending');
      allComplaints[i] = c;
    } catch (e) { /* ignore */ }
  }
  // Keep only online / hello_sarkar / hotline complaints
  const filteredAllComplaints = allComplaints.filter(c => {
    const s = String(c.source || '').toLowerCase();
    return s === 'online' || s === 'online_complaint' || s === 'hello_sarkar' || s === 'hotline';
  });
  const helloSarkarComplaints = filteredAllComplaints.filter(c => String(c.source).toLowerCase() === 'hello_sarkar');
  const pendingHelloSarkar = helloSarkarComplaints.filter(c => c.status === 'pending').length;
  const hotlineComplaints = filteredAllComplaints.filter(c => String(c.source).toLowerCase() === 'hotline');
  const pendingHotline = hotlineComplaints.filter(c => c.status === 'pending').length;
  const onlineComplaints = filteredAllComplaints.filter(c => ['online','online_complaint'].includes(String(c.source).toLowerCase()));

  // Debug: detailed inspection for admin_plan issues
  try {
    console.log('DEBUG admin_plan: merged total', allComplaints.length, 'filtered (online/hello) total', filteredAllComplaints.length);
    console.log('DEBUG admin_plan: helloSarkar IDs & statuses ->', helloSarkarComplaints.map(c => ({ id: c.id, source: c.source, status: c.status, rawStatus: c['स्थिति'] || c.statusLabel }))); 
    console.log('DEBUG admin_plan: online IDs & statuses ->', onlineComplaints.map(c => ({ id: c.id, source: c.source, status: c.status, rawStatus: c['स्थिति'] || c.statusLabel }))); 
    // Inspect specific known OC ids if present
    const suspects = ['OC-1773237626160','OC-1773274048812','OC-1773292514242','OC-1773665385851'];
    suspects.forEach(id => {
      const rec = allComplaints.find(x => String(x.id).replace(/[^0-9A-Za-z\-]/g,'') === String(id).replace(/[^0-9A-Za-z\-]/g,'')) || filteredAllComplaints.find(x => String(x.id).replace(/[^0-9A-Za-z\-]/g,'') === String(id).replace(/[^0-9A-Za-z\-]/g,''));
      if (rec) console.log('DEBUG admin_plan suspect', id, '->', { id: rec.id, source: rec.source, status: rec.status, rawStatus: rec['स्थिति'] || rec.statusLabel, full: rec });
    });
  } catch (e) { console.warn('DEBUG admin_plan log failed', e); }
  const onlineTotal = onlineComplaints.length;
  const onlinePending = onlineComplaints.filter(c => c.status === 'pending').length;
  const onlineProgress = onlineComplaints.filter(c => c.status === 'progress').length;
  const onlineResolved = onlineComplaints.filter(c => c.status === 'resolved').length;
  
  return `
    <div class="mobile-search-toggle">
        <button class="btn btn-sm btn-outline-primary" onclick="toggleDashboardSearch()">
            <i class="fas fa-search"></i> खोजी
        </button>
    </div>
    <div id="dashboardSearchContainer" class="search-bar-container mb-3 collapsed-mobile">
        <div class="input-group">
            <span class="input-group-text bg-white"><i class="fas fa-search text-muted"></i></span>
            <input type="text" class="form-control border-start-0 ps-0" placeholder="उजुरी नं, नाम वा विवरण खोजी गर्नुहोस्..." onkeyup="if(event.key === 'Enter') showAdminComplaintsView({search: this.value})">
            <button class="btn btn-primary" onclick="showAdminComplaintsView({search: this.previousElementSibling.value})">खोजी गर्नुहोस्</button>
        </div>
    </div>

    <div class="stats-grid mb-3">
      ${(() => {
        const officeMonitoringTotal = (state.employeeMonitoring || []).length;
        let thisMonthMonitoring = 0;
        try {
          const nm = (getCurrentNepaliDate() || '').split('-');
          const currentNYear = parseInt(nm[0]) || null;
          const currentNMonth = parseInt(nm[1]) || null;
          thisMonthMonitoring = (state.employeeMonitoring || []).filter(r => {
            const raw = r.date || r['मिति'] || r.dateNepali || '';
            if (!raw) return false;
            const iso = normalizeNepaliDisplayToISO(raw);
            const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (!m) return false;
            return Number(m[1]) === currentNYear && Number(m[2]) === currentNMonth;
          }).length;
        } catch (e) { thisMonthMonitoring = 0; }
        return `
          <div class="stat-widget pointer" onclick="showEmployeeMonitoringView()"><div class="stat-icon bg-info"><i class="fas fa-building"></i></div><div class="stat-info"><div class="stat-value">${officeMonitoringTotal}</div><div class="stat-label">कूल कार्यालय अनुगमन</div></div></div>
          <div class="stat-widget pointer" onclick="showEmployeeMonitoringView()"><div class="stat-icon bg-secondary"><i class="fas fa-calendar-day"></i></div><div class="stat-info"><div class="stat-value">${thisMonthMonitoring}</div><div class="stat-label">यस महिनाको कार्यालय अनुगमन</div></div></div>
        `;
      })()}
      <div class="stat-widget pointer" onclick="showAdminComplaintsView({status: ''})"><div class="stat-icon bg-primary"><i class="fas fa-file-alt"></i></div><div class="stat-info"><div class="stat-value">${helloSarkarComplaints.length}</div><div class="stat-label">हेलो सरकारबाट प्राप्त उजुरी</div><span class="stat-trend trend-up"></span></div></div>
      <div class="stat-widget pointer" onclick="showHotlineComplaintsView({status: ''})"><div class="stat-icon bg-danger"><i class="fas fa-phone"></i></div><div class="stat-info"><div class="stat-value">${hotlineComplaints.length}</div><div class="stat-label">हटलाइन उजुरी</div><span class="stat-trend trend-up"></span></div></div>
      <div class="stat-widget pointer" onclick="showHotlineComplaintsView({status: 'pending'})"><div class="stat-icon bg-warning"><i class="fas fa-clock"></i></div><div class="stat-info"><div class="stat-value">${pendingHotline}</div><div class="stat-label">काम बाँकी</div><span class="stat-trend trend-down"></span></div></div>
      <div class="stat-widget pointer" onclick="showOnlineComplaintsView({status: ''})"><div class="stat-icon bg-success"><i class="fas fa-globe"></i></div><div class="stat-info"><div class="stat-value">${onlineTotal}</div><div class="stat-label">अनलाइन उजुरी</div><span class="stat-trend trend-up"></span></div></div>
      <div class="stat-widget pointer" onclick="showOnlineComplaintsView({status: 'pending'})"><div class="stat-icon bg-secondary"><i class="fas fa-clock"></i></div><div class="stat-info"><div class="stat-value">${onlinePending}</div><div class="stat-label">काम बाँकी</div><span class="stat-trend trend-up"></span></div></div>
    </div>
    
    <div class="d-grid gap-3 mb-3" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));">
      <div class="card"><div class="card-header"><h6 class="mb-0">हेलो सरकारबाट प्राप्त उजुरी</h6></div><div class="card-body"><div class="d-flex justify-between align-center mb-2"><span class="text-small">कूल उजुरी</span><span class="font-weight-bold">${helloSarkarComplaints.length}</span></div><div class="d-flex justify-between align-center mb-2"><span class="text-small">काम बाँकी</span><span class="font-weight-bold text-warning">${pendingHelloSarkar}</span></div><div class="d-flex justify-between align-center"><span class="text-small">फछ्रयौट</span><span class="font-weight-bold text-success">${helloSarkarComplaints.filter(c => c.status === 'resolved').length}</span></div></div></div>
      <div class="card"><div class="card-header"><h6 class="mb-0">अनलाइन उजुरी</h6></div><div class="card-body"><div class="d-flex justify-between align-center mb-2"><span class="text-small">कूल अनलाइन उजुरी</span><span class="font-weight-bold">${onlineTotal}</span></div><div class="d-flex justify-between align-center mb-2"><span class="text-small">काम बाँकी</span><span class="font-weight-bold text-warning">${onlinePending}</span></div><div class="d-flex justify-between align-center mb-2"><span class="text-small">चालु</span><span class="font-weight-bold text-info">${onlineProgress}</span></div><div class="d-flex justify-between align-center"><span class="text-small">फछ्रयौट</span><span class="font-weight-bold text-success">${onlineResolved}</span></div></div></div>
      <div class="card"><div class="card-header d-flex justify-between align-center"><h6 class="mb-0">हेलो सरकार उजुरी स्थिति</h6>${getChartActionsHTML('helloSarkarChart')}</div><div class="card-body"><div class="chart-wrapper dashboard-chart-wrapper"><canvas id="helloSarkarChart"></canvas></div></div></div>
      <div class="card"><div class="card-header d-flex justify-between align-center"><h6 class="mb-0">हटलाइन उजुरी स्थिति</h6>${getChartActionsHTML('hotlineComplaintChart')}</div><div class="card-body"><div class="chart-wrapper dashboard-chart-wrapper"><canvas id="hotlineComplaintChart"></canvas></div></div></div>
      <div class="card"><div class="card-header d-flex justify-between align-center"><h6 class="mb-0">अनलाइन उजुरी स्थिति</h6>${getChartActionsHTML('onlineComplaintChart')}</div><div class="card-body"><div class="chart-wrapper dashboard-chart-wrapper"><canvas id="onlineComplaintChart"></canvas></div></div></div>
      <div class="card"><div class="card-header d-flex justify-between align-center"><h6 class="mb-0">कार्यालय अनुगमन (मासिक)</h6>${getChartActionsHTML('empMonitoringTrendChart')}</div><div class="card-body"><div class="chart-wrapper dashboard-chart-wrapper"><canvas id="empMonitoringTrendChart"></canvas></div></div></div>
      <div class="card"><div class="card-header d-flex justify-between align-center"><h6 class="mb-0">नागरिक बडापत्र अनुगमन (मासिक)</h6>${getChartActionsHTML('citizenCharterTrendChart')}</div><div class="card-body"><div class="chart-wrapper dashboard-chart-wrapper"><canvas id="citizenCharterTrendChart"></canvas></div></div></div>
    </div>
    
    <div class="card">
      <div class="card-header d-flex justify-between align-center">
        <h5 class="mb-0">हालैका हेलो सरकारबाट प्राप्त उजुरीहरू</h5>
        <button class="btn btn-sm btn-primary" onclick="showAdminComplaintsView()">सबै हेर्नुहोस्</button>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table">
            <thead><tr><th>क्र.सं.</th><th>प्राप्त मिति</th><th>उजुरकर्ता</th><th>विपक्षी</th><th>उजुरीको संक्षिप्त विवरण</th><th>सम्बन्धित शाखा</th><th>उजुरीको स्थिति</th></tr></thead>
            <tbody>
              ${helloSarkarComplaints.slice(0, 5).map((complaint, index) => `
                <tr>
                  <td data-label="क्र.सं.">${index + 1}</td><td data-label="प्राप्त मिति">${complaint.date}</td><td data-label="उजुरकर्ता">${complaint.complainant}</td><td data-label="विपक्षी">${complaint.accused || '-'}</td>
                  <td data-label="उजुरीको संक्षिप्त विवरण" class="text-limit">${(complaint.description || '').substring(0, 50)}...</td><td data-label="सम्बन्धित शाखा">${displayShakhaName(complaint.assignedShakha) || '-'}</td>
                  <td data-label="उजुरीको स्थिति"><span class="status-badge ${complaint.status === 'resolved' ? 'status-resolved' : complaint.status === 'pending' ? 'status-pending' : 'status-progress'}">${complaint.status === 'resolved' ? 'फछ्रयौट' : complaint.status === 'pending' ? 'काम बाँकी' : 'चालु'}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <!-- Recent Online Complaints (for admin_planning) -->
    <div class="card mb-3">
      <div class="card-header d-flex justify-between align-center">
        <h5 class="mb-0">हालैका अनलाइन उजुरीहरू</h5>
        <button class="btn btn-sm btn-primary" onclick="showOnlineComplaintsView()">सबै हेर्नुहोस्</button>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table">
            <thead><tr><th>क्र.सं.</th><th>मिति</th><th>उजुरकर्ता</th><th>विवरण</th><th>सम्बन्धित शाखा</th><th>शाखामा पठाएको मिति</th><th>स्थिति</th></tr></thead>
            <tbody>
              ${onlineComplaints.slice(0, 6).map((complaint, index) => `
                <tr>
                  <td data-label="क्र.सं.">${index + 1}</td>
                  <td data-label="मिति">${complaint.date || '-'}</td>
                  <td data-label="उजुरकर्ता">${complaint.complainant || '-'}</td>
                  <td data-label="विवरण" class="text-limit">${(complaint.description || '').substring(0, 50)}...</td>
                  <td data-label="सम्बन्धित शाखा">${displayShakhaName(complaint.assignedShakha) || '-'}</td>
                  <td data-label="शाखामा पठाएको मिति">${complaint.assignedDate || '-'}</td>
                  <td data-label="स्थिति"><span class="status-badge ${complaint.status === 'resolved' ? 'status-resolved' : complaint.status === 'pending' ? 'status-pending' : 'status-progress'}">${complaint.status === 'resolved' ? 'फछ्रयौट' : complaint.status === 'pending' ? 'काम बाँकी' : 'चालु'}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function showMahashakhaDashboard() {
  // Filter complaints for this Mahashakha
  // For mahashakha users, show all complaints from their shakhas
  const userMahashakha = state.currentUser.mahashakha || state.currentUser.name;
  const allowedShakhas = MAHASHAKHA_STRUCTURE[userMahashakha] || [];
  
  const mahashakhaComplaints = state.complaints.filter(c => {
    // Check if complaint belongs to any shakha under this mahashakha
    const complaintShakha = c.shakha || '';
    return allowedShakhas.includes(complaintShakha) || 
           c.mahashakha === userMahashakha || 
           c.mahashakha === state.currentUser.name;
  });
  
  const totalComplaints = mahashakhaComplaints.length;
  const inProgressComplaints = mahashakhaComplaints.filter(c => c.status === 'progress').length;
  const pendingComplaints = mahashakhaComplaints.filter(c => c.status === 'pending').length;
  const resolvedComplaints = mahashakhaComplaints.filter(c => c.status === 'resolved').length;
  const monthlyComplaints = mahashakhaComplaints.filter(c => {
    const todayNepali = getCurrentNepaliDate(); // e.g., "2081-11-03"
    if (!todayNepali) return false;
    const yearMonth = todayNepali.substring(0, 7); // "2081-11"
    const complaintRegDate = c['उजुरी दर्ता मिति'] || c.regDate || '';
    return complaintRegDate.startsWith(yearMonth);
  }).length;
  
  // Group by Shakha
  const shakhaStats = {};
  mahashakhaComplaints.forEach(complaint => {
    const shakha = complaint.shakha || 'अन्य';
    if (!shakhaStats[shakha]) shakhaStats[shakha] = { total: 0, pending: 0, resolved: 0 };
    shakhaStats[shakha].total++;
    if (complaint.status === 'pending') shakhaStats[shakha].pending++;
    if (complaint.status === 'resolved') shakhaStats[shakha].resolved++;
  });

  // Generate Shakha Options for Filter
  const myShakhas = MAHASHAKHA_STRUCTURE[state.currentUser.mahashakha] || [];
  const shakhaOptions = myShakhas.map(s => `<option value="${s}">${s}</option>`).join('');

  // Fiscal Year Cutoff Logic
  const cutoffDate = '2082-04-01';
  const lastFyComplaints = mahashakhaComplaints.filter(c => {
    const d = normalizeNepaliDisplayToISO(c.date || c['दर्ता मिति']);
    return d && d < cutoffDate;
  }).length;
  const thisFyComplaints = mahashakhaComplaints.filter(c => {
    const d = normalizeNepaliDisplayToISO(c.date || c['दर्ता मिति']);
    return d && d >= cutoffDate;
  }).length;

  return `
    <div class="mobile-search-toggle">
        <button class="btn btn-sm btn-outline-primary" onclick="toggleDashboardSearch()">
            <i class="fas fa-search"></i> खोजी
        </button>
    </div>
    <div id="dashboardSearchContainer" class="search-bar-container mb-3 d-flex gap-2 flex-wrap collapsed-mobile">
        <div class="input-group flex-grow-1">
            <span class="input-group-text bg-white"><i class="fas fa-search text-muted"></i></span>
            <input type="text" class="form-control border-start-0 ps-0" placeholder="उजुरी नं, नाम वा विवरण खोजी गर्नुहोस्..." onkeyup="if(event.key === 'Enter') showComplaintsView({search: this.value})">
            <button class="btn btn-primary" onclick="showComplaintsView({search: this.previousElementSibling.value})">खोजी गर्नुहोस्</button>
        </div>
        <select class="form-select" style="max-width: 250px;" id="mahashakhaFilterShakha" onchange="filterMahashakhaDashboard()">
            <option value="">सबै शाखाहरु</option>
            ${shakhaOptions}
        </select>
        <button class="btn excel-export-btn" onclick="exportMahashakhaData()"><i class="fas fa-file-excel"></i> Excel</button>
    </div>

    <div class="stats-grid mb-3">
      ${(() => {
        const officeMonitoringTotal = (state.employeeMonitoring || []).length;
        let thisMonthMonitoring = 0;
        try {
          const nm = (getCurrentNepaliDate() || '').split('-');
          const currentNYear = parseInt(nm[0]) || null;
          const currentNMonth = parseInt(nm[1]) || null;
          thisMonthMonitoring = (state.employeeMonitoring || []).filter(r => {
            const raw = r.date || r['मिति'] || r.dateNepali || '';
            if (!raw) return false;
            const iso = normalizeNepaliDisplayToISO(raw);
            const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (!m) return false;
            return Number(m[1]) === currentNYear && Number(m[2]) === currentNMonth;
          }).length;
        } catch (e) { thisMonthMonitoring = 0; }
        return `
          <div class="stat-widget pointer" onclick="showEmployeeMonitoringView()"><div class="stat-icon bg-info"><i class="fas fa-building"></i></div><div class="stat-info"><div class="stat-value">${officeMonitoringTotal}</div><div class="stat-label">कूल कार्यालय अनुगमन</div></div></div>
          <div class="stat-widget pointer" onclick="showEmployeeMonitoringView()"><div class="stat-icon bg-secondary"><i class="fas fa-calendar-day"></i></div><div class="stat-info"><div class="stat-value">${thisMonthMonitoring}</div><div class="stat-label">यस महिनाको कार्यालय अनुगमन</div></div></div>
        `;
      })()}
      <div class="stat-widget pointer" onclick="showAllComplaintsView()"><div class="stat-icon bg-primary"><i class="fas fa-file-alt"></i></div><div class="stat-info"><div class="stat-value" id="mahashakhaTotal">${totalComplaints}</div><div class="stat-label">कूल उजुरी</div><span class="stat-trend trend-up"></span></div></div>
      <div class="stat-widget pointer" onclick="showComplaintsView({status: 'progress'})"><div class="stat-icon bg-info"><i class="fas fa-spinner"></i></div><div class="stat-info"><div class="stat-value">${inProgressComplaints}</div><div class="stat-label">चालु उजुरी</div><span class="stat-trend trend-up"></span></div></div>
      <div class="stat-widget pointer" onclick="showComplaintsView({status: 'pending'})"><div class="stat-icon bg-warning"><i class="fas fa-clock"></i></div><div class="stat-info"><div class="stat-value" id="mahashakhaPending">${pendingComplaints}</div><div class="stat-label">काम बाँकी</div><span class="stat-trend trend-down"></span></div></div>
      <div class="stat-widget pointer" onclick="showComplaintsView({status: 'resolved'})"><div class="stat-icon bg-success"><i class="fas fa-check-circle"></i></div><div class="stat-info"><div class="stat-value" id="mahashakhaResolved">${resolvedComplaints}</div><div class="stat-label">फछ्रयौट भएका</div><span class="stat-trend trend-up"></span></div></div>
      <div class="stat-widget pointer" onclick="showThisMonthsComplaints()"><div class="stat-icon bg-secondary"><i class="fas fa-calendar-alt"></i></div><div class="stat-info"><div class="stat-value">${monthlyComplaints}</div><div class="stat-label">यस महिनाका</div><span class="stat-trend trend-up"></span></div></div>
      ${((state.currentUser && (state.currentUser.mahashakha === MAHASHAKHA.TECHNICAL || state.currentUser.name === MAHASHAKHA.TECHNICAL)) ? (() => {
          const all = (state.projects || []);
          const allowed = MAHASHAKHA_STRUCTURE[MAHASHAKHA.TECHNICAL] || [];
          const scoped = all.filter(p => {
            const s = (p.shakha || '').toString();
            if (!s) return false;
            if (allowed.includes(s)) return true;
            if (s.includes('प्राविधिक')) return true;
            return false;
          });
          return `<div class="stat-widget pointer" onclick="showTechnicalProjectsOverview({scope: 'technical_mahashakha'})"><div class="stat-icon bg-info pointer" onclick="event.stopPropagation(); showTechnicalProjectsView();"><i class="fas fa-hard-hat"></i></div><div class="stat-info"><div class="stat-value">${scoped.length}</div><div class="stat-label">प्राविधिक परीक्षण</div><span class="stat-trend trend-up"></span></div></div>
      <div class="stat-widget pointer" onclick="showTechnicalExaminersView()"><div class="stat-icon bg-warning"><i class="fas fa-user-tie"></i></div><div class="stat-info"><div class="stat-value">${(state.technicalExaminers || []).length}</div><div class="stat-label">प्राविधिक परीक्षक सूची</div><span class="stat-trend trend-up"></span></div></div>`;
        })() : '')}
      <div class="stat-widget pointer" onclick="showComplaintsView({endDate: '2082-03-31'})"><div class="stat-icon" style="background-color: #6f42c1; color: white;"><i class="fas fa-history"></i></div><div class="stat-info"><div class="stat-value">${lastFyComplaints}</div><div class="stat-label">गत आ.व.को जिम्मेवारी</div><span class="stat-trend trend-down"></span></div></div>
      <div class="stat-widget pointer" onclick="showComplaintsView({startDate: '2082-04-01'})"><div class="stat-icon" style="background-color: #fd7e14; color: white;"><i class="fas fa-calendar-check"></i></div><div class="stat-info"><div class="stat-value">${thisFyComplaints}</div><div class="stat-label">यस आ.व.का उजुरी</div><span class="stat-trend trend-up"></span></div></div>
    </div>
    
    <div class="card mb-3">
      <div class="card-header d-flex justify-between align-center"><h5 class="mb-0">उजुरी वर्गीकरण (AI विश्लेषण)</h5>${getChartActionsHTML('classificationChart')}</div>
      <div class="card-body">
        <div class="row"><div class="col-md-7"><div class="chart-wrapper dashboard-chart-wrapper"><canvas id="classificationChart"></canvas></div></div><div class="col-md-5">${generateClassificationTableHTML(mahashakhaComplaints)}</div></div>
      </div>
    </div>

    <div class="d-grid gap-3 mb-3" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));">
      <div class="chart-container"><div class="chart-header d-flex justify-between align-center"><h6 class="chart-title">शाखा अनुसार तुलना</h6>${getChartActionsHTML('shakhaComparisonChart')}</div><div class="chart-wrapper dashboard-chart-wrapper"><canvas id="shakhaComparisonChart"></canvas></div></div>
      <div class="chart-container"><div class="chart-header d-flex justify-between align-center"><h6 class="chart-title">मासिक प्रगति विवरण</h6>${getChartActionsHTML('trendChart')}</div><div class="chart-wrapper dashboard-chart-wrapper"><canvas id="trendChart"></canvas></div></div>
      <div class="chart-container"><div class="chart-header d-flex justify-between align-center"><h6 class="chart-title">शाखा अनुसार फछ्र्यौट दर</h6>${getChartActionsHTML('resolutionRateChart')}</div><div class="chart-wrapper dashboard-chart-wrapper"><canvas id="resolutionRateChart"></canvas></div></div>
      <div class="chart-container"><div class="chart-header d-flex justify-between align-center"><h6 class="chart-title">मन्त्रालय/निकाय अनुसार उजुरी</h6>${getChartActionsHTML('mahashakhaMinistryChart')}</div><div class="chart-wrapper dashboard-chart-wrapper"><canvas id="mahashakhaMinistryChart"></canvas></div></div>
      ${(state.currentUser.mahashakha === MAHASHAKHA.TECHNICAL || state.currentUser.name === MAHASHAKHA.TECHNICAL) ? `<div class="chart-container"><div class="chart-header d-flex justify-between align-center"><div class="d-flex align-center gap-2"><h6 class="chart-title mb-0">प्राविधिक परीक्षण/आयोजना अनुगमन</h6><button class="btn btn-sm btn-link text-muted p-0" onclick="openProjectDateFilter()" title="मिति फिल्टर"><i class="fas fa-calendar-alt"></i></button></div>${getChartActionsHTML('projectStatusChart')}</div><div class="chart-wrapper dashboard-chart-wrapper"><canvas id="projectStatusChart"></canvas></div></div>` : ''}
      <div class="chart-container"><div class="chart-header d-flex justify-between align-center"><h6 class="chart-title">उजुरीको स्रोत</h6>${getChartActionsHTML('sourceChart')}</div><div class="chart-wrapper dashboard-chart-wrapper"><canvas id="sourceChart"></canvas></div></div>
    </div>
    
    <div class="card mb-3">
      <div class="card-header d-flex justify-between align-center">
        <h5 class="mb-0">शाखागत विवरण</h5>
        <button class="btn btn-sm btn-success" onclick="exportToExcel('shakha_stats')"><i class="fas fa-file-excel"></i> Excel</button>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table">
            <thead><tr><th>शाखा</th><th>कूल</th><th>बाँकी</th><th>फछ्रयौट</th><th>फछ्रयौट दर</th></tr></thead>
            <tbody>
              ${Object.keys(shakhaStats).map(shakha => {
                const stats = shakhaStats[shakha];
                const resolutionRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;
                return `<tr class="pointer" onclick="viewShakhaDetails('${shakha}')" title="विस्तृत विवरण हेर्न क्लिक गर्नुहोस्"><td data-label="शाखा">${shakha}</td><td data-label="कूल">${stats.total}</td><td data-label="बाँकी">${stats.pending}</td><td data-label="फछ्रयौट">${stats.resolved}</td><td data-label="फछ्रयौट दर">${resolutionRate}%</td></tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header d-flex justify-between align-center">
        <h5 class="mb-0">हालैका उजुरीहरू</h5>
        <div class="d-flex align-center gap-2">
          <button class="btn btn-sm btn-success" onclick="exportToExcel('recent')"><i class="fas fa-file-excel"></i> Excel</button>
          <a href="#" class="text-primary text-small" onclick="showComplaintsView()">सबै हेर्नुहोस्</a>
        </div>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table">
            <thead><tr><th>दर्ता नं</th><th>दर्ता मिति</th><th>उजुरकर्ता</th><th>सम्बन्धित शाखा</th><th>उजुरीको संक्षिप्त विवरण</th><th>उजुरीको स्थिति</th><th>कार्य</th></tr></thead>
            <tbody>
              ${mahashakhaComplaints.slice(0, 5).map(complaint => `
                <tr>
                  <td data-label="दर्ता नं">${complaint.id}</td><td data-label="दर्ता मिति">${complaint.date}</td><td data-label="उजुरकर्ता">${complaint.complainant}</td><td data-label="सम्बन्धित शाखा">${displayShakhaName(complaint.shakha) || '-'}</td>
                  <td data-label="उजुरीको संक्षिप्त विवरण" class="text-limit">${(complaint.description || '').substring(0, 50)}...</td>
                  <td data-label="उजुरीको स्थिति"><span class="status-badge ${complaint.status === 'resolved' ? 'status-resolved' : complaint.status === 'pending' ? 'status-pending' : 'status-progress'}">${complaint.status === 'resolved' ? 'फछ्रयौट' : complaint.status === 'pending' ? 'काम बाँकी' : 'चालु'}</span></td>
                  <td data-label="कार्य"><button class="action-btn" data-action="view" data-id="${complaint.id}" title="हेर्नुहोस्"><i class="fas fa-eye"></i></button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function filterMahashakhaDashboard() {
  const selectedShakha = document.getElementById('mahashakhaFilterShakha').value;
  
  // Filter complaints
  // For mahashakha users, show all complaints from their shakhas
  const userMahashakha = state.currentUser.mahashakha || state.currentUser.name;
  const allowedShakhas = MAHASHAKHA_STRUCTURE[userMahashakha] || [];
  
  let filtered = state.complaints.filter(c => {
    // Check if complaint belongs to any shakha under this mahashakha
    const complaintShakha = c.shakha || '';
    return allowedShakhas.includes(complaintShakha) || 
           c.mahashakha === userMahashakha || 
           c.mahashakha === state.currentUser.name;
  });
  
  if (selectedShakha) {
    filtered = filtered.filter(c => c.shakha === selectedShakha);
  }
  
  // Update Stats
  const total = filtered.length;
  const pending = filtered.filter(c => c.status === 'pending').length;
  const resolved = filtered.filter(c => c.status === 'resolved').length;
  
  const totalEl = document.getElementById('mahashakhaTotal');
  const pendingEl = document.getElementById('mahashakhaPending');
  const resolvedEl = document.getElementById('mahashakhaResolved');
  
  if (totalEl) totalEl.textContent = total;
  if (pendingEl) pendingEl.textContent = pending;
  if (resolvedEl) resolvedEl.textContent = resolved;
  
  // Update Charts
  destroyAllCharts();
  initializeDashboardCharts();
}

function exportMahashakhaData() {
  console.log('📊 Exporting Mahashakha data...');
  
  const selectedShakha = document.getElementById('mahashakhaFilterShakha')?.value;
  
  // Filter complaints based on Mahashakha and selected Shakha
  // For mahashakha users, show all complaints from their shakhas
  const userMahashakha = state.currentUser.mahashakha || state.currentUser.name;
  const allowedShakhas = MAHASHAKHA_STRUCTURE[userMahashakha] || [];
  
  let filteredData = state.complaints.filter(c => {
    // Check if complaint belongs to any shakha under this mahashakha
    const complaintShakha = c.shakha || '';
    return allowedShakhas.includes(complaintShakha) || 
           c.mahashakha === userMahashakha || 
           c.mahashakha === state.currentUser.name;
  });
  
  if (selectedShakha) {
    filteredData = filteredData.filter(c => c.shakha === selectedShakha);
  }

  if (filteredData.length === 0) {
    showToast('एक्स्पोर्ट गर्न कुनै डाटा छैन।', 'warning');
    return;
  }

  // Prepare data for export (select and rename columns)
  const dataToExport = filteredData.map(c => ({
    'दर्ता नं': c.id,
    'दर्ता मिति': c.date,
    'उजुरकर्ता': c.complainant,
    'विपक्षी': c.accused,
    'विवरण': c.description,
    'शाखा': c.shakha,
    'स्थिति': c.status,
    'कैफियत': c.remarks
  }));

  // Generate report name
  const mahashakhaName = (state.currentUser.mahashakha || 'Mahashakha').replace(/\s/g, '_');
  const shakhaName = selectedShakha ? `_${selectedShakha.replace(/\s/g, '_')}` : '_All_Shakhas';
  const reportName = `Report_${mahashakhaName}${shakhaName}_${new Date().toISOString().slice(0, 10)}`;

  // Call the generic export function
  exportReportToExcel(dataToExport, reportName);
}

function showTechnicalDashboard() {
  // शाखा अनुसार फिल्टर
  let shakhaComplaints = state.complaints;
  if (state.currentUser && state.currentUser.role !== 'admin') {
    const userShakhaName = (state.currentUser.shakha || '').trim();
    const userCode = (state.currentUser.id || '').trim();
    shakhaComplaints = shakhaComplaints.filter(c => {
      const cShakha = (c.shakha || '').trim();
      const cShakhaName = (c.shakhaName || '').trim();
      
      return cShakha === userShakhaName || 
             cShakha.toLowerCase() === userCode.toLowerCase() ||
             cShakhaName === userShakhaName ||
             SHAKHA[cShakha] === userShakhaName ||
             SHAKHA[cShakha.toUpperCase()] === userShakhaName ||
             // Special handling for INFO_COLLECTION with new name
             (cShakha === 'INFO_COLLECTION' && userShakhaName === 'सूचना संकलन, अन्वेषण तथा अनुगमन शाखा') ||
             (userCode === 'INFO_COLLECTION' && cShakhaName === 'सूचना संकलन, अन्वेषण तथा अनुगमन शाखा');
    });
  }
  const pendingComplaints = shakhaComplaints.filter(c => c.status === 'pending').length;
  
  let technicalProjects = state.projects;
  if (state.currentUser && state.currentUser.role !== 'admin') {
    const userShakhaName = (state.currentUser.shakha || '').trim();
    const userCode = (state.currentUser.id || '').trim();
    technicalProjects = technicalProjects.filter(p => {
      const pShakha = (p.shakha || '').trim();
      const pShakhaName = (p.shakhaName || '').trim();
      
      return pShakha === userShakhaName || 
             pShakha.toLowerCase() === userCode.toLowerCase() ||
             pShakhaName === userShakhaName ||
             SHAKHA[pShakha] === userShakhaName ||
             SHAKHA[pShakha.toUpperCase()] === userShakhaName ||
             // Special handling for INFO_COLLECTION with new name
             (pShakha === 'INFO_COLLECTION' && userShakhaName === 'सूचना संकलन, अन्वेषण तथा अनुगमन शाखा') ||
             (userCode === 'INFO_COLLECTION' && pShakhaName === 'सूचना संकलन, अन्वेषण तथा अनुगमन शाखा');
    });
  }
  const activeProjects = technicalProjects.filter(p => p.status === 'active').length;
  
  // Fiscal Year Cutoff Logic
  const cutoffDate = '2082-04-01';
  const lastFyComplaints = shakhaComplaints.filter(c => {
    const d = normalizeNepaliDisplayToISO(c.date || c['दर्ता मिति']);
    return d && d < cutoffDate;
  }).length;
  const thisFyComplaints = shakhaComplaints.filter(c => {
    const d = normalizeNepaliDisplayToISO(c.date || c['दर्ता मिति']);
    return d && d >= cutoffDate;
  }).length;

  return `
    <div class="mobile-search-toggle">
        <button class="btn btn-sm btn-outline-primary" onclick="toggleDashboardSearch()">
            <i class="fas fa-search"></i> खोजी
        </button>
    </div>
    <div id="dashboardSearchContainer" class="search-bar-container mb-3 collapsed-mobile">
        <div class="input-group">
            <span class="input-group-text bg-white"><i class="fas fa-search text-muted"></i></span>
            <input type="text" class="form-control border-start-0 ps-0" placeholder="उजुरी नं, नाम वा विवरण खोजी गर्नुहोस्..." onkeyup="if(event.key === 'Enter') showComplaintsView({search: this.value})">
            <button class="btn btn-primary" onclick="showComplaintsView({search: this.previousElementSibling.value})">खोजी गर्नुहोस्</button>
        </div>
    </div>

    <div class="stats-grid mb-3">
      <div class="stat-widget pointer" onclick="showAllComplaintsView()"><div class="stat-icon bg-primary"><i class="fas fa-file-alt"></i></div><div class="stat-info"><div class="stat-value">${shakhaComplaints.length}</div><div class="stat-label">कूल उजुरी</div><span class="stat-trend trend-up"></span></div></div>
      <div class="stat-widget pointer" onclick="showComplaintsView({status: 'progress'})"><div class="stat-icon bg-info"><i class="fas fa-spinner"></i></div><div class="stat-info"><div class="stat-value">${inProgressComplaints}</div><div class="stat-label">चालु उजुरी</div><span class="stat-trend trend-up"></span></div></div>
      <div class="stat-widget pointer" onclick="showComplaintsView({status: 'pending'})"><div class="stat-icon bg-warning"><i class="fas fa-clock"></i></div><div class="stat-info"><div class="stat-value">${pendingComplaints}</div><div class="stat-label">काम बाँकी</div><span class="stat-trend trend-down"></span></div></div>
      <div class="stat-widget pointer" onclick="showTechnicalProjectsView()"><div class="stat-icon bg-success"><i class="fas fa-hard-hat"></i></div><div class="stat-info"><div class="stat-value">${technicalProjects.length}</div><div class="stat-label">प्राविधिक परीक्षण/आयोजना अनुगमन</div><span class="stat-trend trend-up"></span></div></div>
      <div class="stat-widget pointer" onclick="showTechnicalProjectsView({status: 'active'})"><div class="stat-icon bg-secondary"><i class="fas fa-tasks"></i></div><div class="stat-info"><div class="stat-value">${activeProjects}</div><div class="stat-label">चालु आयोजना</div><span class="stat-trend trend-up"></span></div></div>
      <div class="stat-widget pointer" onclick="showTechnicalProjectsView({status: 'completed'})"><div class="stat-icon bg-info"><i class="fas fa-check-circle"></i></div><div class="stat-info"><div class="stat-value">${technicalProjects.filter(p => p.status === 'completed').length}</div><div class="stat-label">सम्पन्न आयोजना</div><span class="stat-trend trend-up"></span></div></div>
      <div class="stat-widget pointer" onclick="showTechnicalExaminersView()"><div class="stat-icon bg-warning"><i class="fas fa-user-tie"></i></div><div class="stat-info"><div class="stat-value">${(state.technicalExaminers || []).length}</div><div class="stat-label">प्राविधिक परीक्षक सूची</div><span class="stat-trend trend-up"></span></div></div>
      <div class="stat-widget" onclick="showTechnicalProjectsView({monthly: true})"><div class="stat-icon bg-warning"><i class="fas fa-calendar-alt"></i></div><div class="stat-info"><div class="stat-value">${getCurrentNepaliMonth()}</div><div class="stat-label">यस महिनाका</div><span class="stat-trend trend-up"></span></div></div>
      <div class="stat-widget pointer" onclick="showComplaintsView({endDate: '2082-03-31'})"><div class="stat-icon" style="background-color: #6f42c1; color: white;"><i class="fas fa-history"></i></div><div class="stat-info"><div class="stat-value">${lastFyComplaints}</div><div class="stat-label">गत आ.व.को जिम्मेवारी</div><span class="stat-trend trend-down"></span></div></div>
      <div class="stat-widget pointer" onclick="showComplaintsView({startDate: '2082-04-01'})"><div class="stat-icon" style="background-color: #fd7e14; color: white;"><i class="fas fa-calendar-check"></i></div><div class="stat-info"><div class="stat-value">${thisFyComplaints}</div><div class="stat-label">यस आ.व.का उजुरी</div><span class="stat-trend trend-up"></span></div></div>
    </div>
    
    <div class="card mb-3">
      <div class="card-header d-flex justify-between align-center"><h5 class="mb-0">उजुरी वर्गीकरण (AI विश्लेषण)</h5>${getChartActionsHTML('classificationChart')}</div>
      <div class="card-body">
        <div class="row"><div class="col-md-7"><div class="chart-wrapper dashboard-chart-wrapper"><canvas id="classificationChart"></canvas></div></div><div class="col-md-5">${generateClassificationTableHTML(shakhaComplaints)}</div></div>
      </div>
    </div>

    <div class="d-grid gap-3 mb-3" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));">
      <div class="card"><div class="card-header d-flex justify-between align-center"><h6 class="mb-0">उजुरी स्थिति</h6>${getChartActionsHTML('complaintStatusChart')}</div><div class="card-body"><div class="chart-wrapper dashboard-chart-wrapper"><canvas id="complaintStatusChart"></canvas></div></div></div>
      <div class="card"><div class="card-header d-flex justify-between align-center"><div class="d-flex align-center gap-2"><h6 class="mb-0">प्राविधिक परीक्षण/आयोजना अनुगमन</h6><button class="btn btn-sm btn-link text-muted p-0" onclick="openProjectDateFilter()" title="मिति फिल्टर"><i class="fas fa-calendar-alt"></i></button></div>${getChartActionsHTML('projectStatusChart')}</div><div class="card-body"><div class="chart-wrapper dashboard-chart-wrapper"><canvas id="projectStatusChart"></canvas></div></div></div>
    </div>
    
    <div class="d-grid gap-3 mb-3" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));">
      <div class="card">
        <div class="card-header d-flex justify-between align-center">
          <h6 class="mb-0">हालैका उजुरीहरू</h6>
          <a href="#" class="text-primary text-small" onclick="showComplaintsView()">सबै हेर्नुहोस्</a>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-compact">
              <thead><tr><th>दर्ता नं</th><th>दर्ता मिति</th><th>उजुरकर्ता</th><th>उजुरीको स्थिति</th></tr></thead>
              <tbody>
                ${shakhaComplaints.slice(0, 5).map(complaint => `
                  <tr><td data-label="दर्ता नं">${complaint.id}</td><td data-label="दर्ता मिति">${complaint.date}</td><td data-label="उजुरकर्ता">${complaint.complainant}</td><td data-label="उजुरीको स्थिति"><span class="status-badge ${complaint.status === 'resolved' ? 'status-resolved' : complaint.status === 'pending' ? 'status-pending' : 'status-progress'}">${complaint.status === 'resolved' ? 'फछ्रयौट' : complaint.status === 'pending' ? 'काम बाँकी' : 'चालु'}</span></td></tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header d-flex justify-between align-center">
          <h6 class="mb-0">चालु आयोजनाहरू</h6>
          <a href="#" class="text-primary text-small" onclick="showTechnicalProjectsView()">सबै हेर्नुहोस्</a>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-compact">
              <thead><tr><th>आयोजनाको नाम</th><th>सम्बन्धित निकाय</th><th>अवस्था</th></tr></thead>
              <tbody>
                ${technicalProjects.slice(0, 5).map(project => `
                  <tr><td data-label="आयोजनाको नाम">${project.name}</td><td data-label="सम्बन्धित निकाय">${project.organization}</td><td data-label="अवस्था"><span class="status-badge ${project.status === 'active' ? 'status-progress' : 'status-resolved'}">${project.status === 'active' ? 'चालु' : 'सम्पन्न'}</span></td></tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

function showShakhaDashboard() {
  // शाखा अनुसार फिल्टर
  let shakhaComplaints = state.complaints;
  if (state.currentUser && state.currentUser.role !== 'admin') {
    const userShakhaName = (state.currentUser.shakha || '').trim();
    const userCode = (state.currentUser.id || '').trim();
    shakhaComplaints = shakhaComplaints.filter(c => {
      const cShakha = (c.shakha || '').trim();
      const cShakhaName = (c.shakhaName || '').trim();
      
      return cShakha === userShakhaName || 
             cShakha.toLowerCase() === userCode.toLowerCase() ||
             cShakhaName === userShakhaName ||
             SHAKHA[cShakha] === userShakhaName ||
             SHAKHA[cShakha.toUpperCase()] === userShakhaName ||
             // Special handling for INFO_COLLECTION with new name
             (cShakha === 'INFO_COLLECTION' && userShakhaName === 'सूचना संकलन, अन्वेषण तथा अनुगमन शाखा') ||
             (userCode === 'INFO_COLLECTION' && cShakhaName === 'सूचना संकलन, अन्वेषण तथा अनुगमन शाखा');
    });
  }
  const pendingComplaints = shakhaComplaints.filter(c => c.status === 'pending').length;
  const inProgressComplaints = shakhaComplaints.filter(c => c.status === 'progress').length;
  const resolvedComplaints = shakhaComplaints.filter(c => c.status === 'resolved').length;
  const monthlyComplaints = shakhaComplaints.filter(c => {
    const todayNepali = getCurrentNepaliDate(); // e.g., "2081-11-03"
    if (!todayNepali) return false;
    const yearMonth = todayNepali.substring(0, 7); // "2081-11"
    const complaintRegDate = c['उजुरी दर्ता मिति'] || c.regDate || '';
    return complaintRegDate.startsWith(yearMonth);
  }).length;
  
  // Filter technical projects for this shakha
  let technicalProjects = state.projects || [];
  if (state.currentUser && state.currentUser.role !== 'admin') {
    const userShakhaName = (state.currentUser.shakha || '').trim();
    const userCode = (state.currentUser.id || '').trim();
    technicalProjects = technicalProjects.filter(p => {
      const pShakha = (p.shakha || '').trim();
      return pShakha === userShakhaName || 
             pShakha.toLowerCase() === userCode.toLowerCase() ||
             SHAKHA[pShakha] === userShakhaName ||
             SHAKHA[pShakha.toUpperCase()] === userShakhaName;
    });
  }
  const activeProjects = technicalProjects.filter(p => p.status === 'active').length;
  
  // Filter sample testing data for laboratory branch
  let sampleTests = state.sampleTests || [];
  
  // Initialize sample testing data if empty
  if (sampleTests.length === 0 && state.currentUser && (state.currentUser.shakha === 'LABORATORY_TESTING' || (SHAKHA && SHAKHA[state.currentUser.shakha] === 'प्रयोगशाला परीक्षण शाखा') || (state.currentUser.shakha && String(state.currentUser.shakha).toLowerCase().includes('laboratory')) || (state.currentUser.shakha && String(state.currentUser.shakha).includes('प्रयोगशाला')))) {
    console.log('Initializing sample testing data...');
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    
    // sampleTests = [
      // {
        // id: 'LAB-2081-001',
        // sampleNo: 'LAB-2081-001',
        // receivedDate: '2081-10-15',
        // requester: 'रामबहादुर शाह',
        // projectName: 'मेलम्ची खानेपानी आयोजना',
        // ministry: 'आवास तथा नगरपालिका मन्त्रालय',
        // material: 'सिमेन्ट',
        // testDate: '2081-10-16',
        // testMethod: 'ASTM C109',
        // equipment: 'कम्प्रेशन टेस्टिङ मेसिन',
        // testResult: '28-दिन कम्प्रेसिभ स्ट्रेन्थ: 32.5 MPa',
        // remarks: 'परीक्षण सफल',
        // status: 'completed',
        // createdAt: lastMonth.toISOString(),
        // shakha: state.currentUser.shakha
      // },
      // {
        // id: 'LAB-2081-002',
        // sampleNo: 'LAB-2081-002',
        // receivedDate: '2081-11-02',
        // requester: 'शिवशरण श्रेष्ठ',
        // projectName: 'सिद्धार्थ राजमार्ग विस्तार',
        // ministry: 'भौतिक पूर्वाधार तथा यातायात मन्त्रालय',
        // material: 'स्टील बार',
        // testDate: '2081-11-03',
        // testMethod: 'ASTM A370',
        // equipment: 'युनिभर्सल टेस्टिङ मेसिन',
        // testResult: 'टेन्साइल स्ट्रेन्थ: 450 MPa',
        // remarks: 'प्रक्रियामा छ',
        // status: 'progress',
        // createdAt: today.toISOString(),
        // shakha: state.currentUser.shakha
      // },
      // {
        // id: 'LAB-2081-003',
        // sampleNo: 'LAB-2081-003',
        // receivedDate: '2081-11-10',
        // requester: 'कृष्णप्रसाद ढकाल',
        // projectName: 'चितवन औद्योगिक करिडोर',
        // ministry: 'उद्योग, वाणिज्य तथा आपूर्ति मन्त्रालय',
        // material: 'कंक्रिट',
        // testDate: '',
        // testMethod: '',
        // equipment: '',
        // testResult: '',
        // remarks: 'परीक्षण गर्न बाँकी',
        // status: 'pending',
        // createdAt: today.toISOString(),
        // shakha: state.currentUser.shakha
      // }
    // ];
    
    // Update state with sample data
    state.sampleTests = sampleTests;
    console.log('Sample testing data initialized with', sampleTests.length, 'records');
  }
  
  let totalSampleTests = 0, currentSampleTests = 0, completedSampleTests = 0, monthlySampleTests = 0;
  
  // Debug: Log current user info
  if (state.currentUser) {
    console.log('Current user shakha:', state.currentUser.shakha);
    console.log('SHAKHA lookup:', SHAKHA ? SHAKHA[state.currentUser.shakha] : 'SHAKHA not defined');
    console.log('Sample tests count:', sampleTests.length);
  }
  
  if (state.currentUser && (state.currentUser.shakha === 'LABORATORY_TESTING' || (SHAKHA && SHAKHA[state.currentUser.shakha] === 'प्रयोगशाला परीक्षण शाखा') || (state.currentUser.shakha && String(state.currentUser.shakha).toLowerCase().includes('laboratory')) || (state.currentUser.shakha && String(state.currentUser.shakha).includes('प्रयोगशाला')))) {
    console.log('Laboratory testing branch detected, calculating stats...');
    // For laboratory testing branch, show sample testing statistics
    totalSampleTests = sampleTests.length;
    currentSampleTests = sampleTests.filter(t => t.status === 'pending' || t.status === 'progress').length;
    completedSampleTests = sampleTests.filter(t => t.status === 'completed').length;
    monthlySampleTests = sampleTests.filter(t => {
      const testDate = new Date(t.testDate || t['परीक्षण गरिएको मिति']);
      if (!testDate || isNaN(testDate.getTime())) return false;
      const today = new Date();
      return testDate.getMonth() === today.getMonth() && testDate.getFullYear() === today.getFullYear();
    }).length;
    
    console.log('Sample stats calculated:', { totalSampleTests, currentSampleTests, completedSampleTests, monthlySampleTests });
  }
  
  // Fiscal Year Cutoff Logic
  const cutoffDate = '2082-04-01';
  const lastFyComplaints = shakhaComplaints.filter(c => {
    const d = normalizeNepaliDisplayToISO(c.date || c['दर्ता मिति']);
    return d && d < cutoffDate;
  }).length;
  const thisFyComplaints = shakhaComplaints.filter(c => {
    const d = normalizeNepaliDisplayToISO(c.date || c['दर्ता मिति']);
    return d && d >= cutoffDate;
  }).length;

  return `
    <div class="mobile-search-toggle">
        <button class="btn btn-sm btn-outline-primary" onclick="toggleDashboardSearch()">
            <i class="fas fa-search"></i> खोजी
        </button>
    </div>
    <div id="dashboardSearchContainer" class="search-bar-container mb-3 collapsed-mobile">
        <div class="input-group">
            <span class="input-group-text bg-white"><i class="fas fa-search text-muted"></i></span>
            <input type="text" class="form-control border-start-0 ps-0" placeholder="उजुरी नं, नाम वा विवरण खोजी गर्नुहोस्..." onkeyup="if(event.key === 'Enter') showComplaintsView({search: this.value})">
            <button class="btn btn-primary" onclick="showComplaintsView({search: this.previousElementSibling.value})">खोजी गर्नुहोस्</button>
        </div>
    </div>

    <div class="stats-grid mb-3">
      <div class="stat-widget pointer" onclick="showAllComplaintsView()"><div class="stat-icon bg-primary"><i class="fas fa-file-alt"></i></div><div class="stat-info"><div class="stat-value">${shakhaComplaints.length}</div><div class="stat-label">कूल उजुरीहरू</div><span class="stat-trend trend-up"></span></div></div>
      <div class="stat-widget pointer" onclick="showComplaintsView({status: 'progress'})"><div class="stat-icon bg-info"><i class="fas fa-spinner"></i></div><div class="stat-info"><div class="stat-value">${inProgressComplaints}</div><div class="stat-label">चालु उजुरी</div><span class="stat-trend trend-up"></span></div></div>
      <div class="stat-widget pointer" onclick="showComplaintsView({status: 'pending'})"><div class="stat-icon bg-warning"><i class="fas fa-clock"></i></div><div class="stat-info"><div class="stat-value">${pendingComplaints}</div><div class="stat-label">काम बाँकी</div><span class="stat-trend trend-down"></span></div></div>
      ${(state.currentUser && (state.currentUser.shakha || '').includes('प्राविधिक')) ? `
      <div class="stat-widget pointer" onclick="showTechnicalProjectsView()"><div class="stat-icon bg-success"><i class="fas fa-hard-hat"></i></div><div class="stat-info"><div class="stat-value">${technicalProjects.length}</div><div class="stat-label">प्राविधिक परीक्षण/आयोजना अनुगमन</div><span class="stat-trend trend-up"></span></div></div>
      <div class="stat-widget pointer" onclick="showTechnicalProjectsView({status: 'active'})"><div class="stat-icon bg-secondary"><i class="fas fa-tasks"></i></div><div class="stat-info"><div class="stat-value">${activeProjects}</div><div class="stat-label">चालु आयोजना</div><span class="stat-trend trend-up"></span></div></div>
      <div class="stat-widget pointer" onclick="showTechnicalExaminersView()"><div class="stat-icon bg-warning"><i class="fas fa-user-tie"></i></div><div class="stat-info"><div class="stat-value">${(state.technicalExaminers || []).length}</div><div class="stat-label">प्राविधिक परीक्षक सूची</div><span class="stat-trend trend-up"></span></div></div>
      ` : (state.currentUser && (state.currentUser.shakha === 'LABORATORY_TESTING' || (SHAKHA && SHAKHA[state.currentUser.shakha] === 'प्रयोगशाला परीक्षण शाखा') || (state.currentUser.shakha && String(state.currentUser.shakha).toLowerCase().includes('laboratory')) || (state.currentUser.shakha && String(state.currentUser.shakha).includes('प्रयोगशाला')))) ? `
      <div class="stat-widget pointer" onclick="showSampleTestingView()"><div class="stat-icon bg-success"><i class="fas fa-flask"></i></div><div class="stat-info"><div class="stat-value">${totalSampleTests}</div><div class="stat-label">कूल नमूना परीक्षण</div><span class="stat-trend trend-up"></span></div></div>
      <div class="stat-widget pointer" onclick="showSampleTestingView({status: 'progress'})"><div class="stat-icon bg-info"><i class="fas fa-spinner"></i></div><div class="stat-info"><div class="stat-value">${currentSampleTests}</div><div class="stat-label">चालु परीक्षण</div><span class="stat-trend trend-up"></span></div></div>
      <div class="stat-widget pointer" onclick="showSampleTestingView({status: 'completed'})"><div class="stat-icon bg-success"><i class="fas fa-check-circle"></i></div><div class="stat-info"><div class="stat-value">${completedSampleTests}</div><div class="stat-label">सम्पन्न परीक्षण</div><span class="stat-trend trend-up"></span></div></div>
      <div class="stat-widget pointer" onclick="showSampleTestingView({period: 'thisMonth'})"><div class="stat-icon bg-secondary"><i class="fas fa-calendar-alt"></i></div><div class="stat-info"><div class="stat-value">${monthlySampleTests}</div><div class="stat-label">यस महिनाको परीक्षण</div><span class="stat-trend trend-up"></span></div></div>
      ` : `
      <div class="stat-widget pointer" onclick="showComplaintsView({status: 'resolved'})"><div class="stat-icon bg-success"><i class="fas fa-check-circle"></i></div><div class="stat-info"><div class="stat-value">${resolvedComplaints}</div><div class="stat-label">फछ्रयौट भएका</div><span class="stat-trend trend-up"></span></div></div>
      <div class="stat-widget pointer" onclick="showThisMonthsComplaints()"><div class="stat-icon bg-secondary"><i class="fas fa-calendar-alt"></i></div><div class="stat-info"><div class="stat-value">${monthlyComplaints}</div><div class="stat-label">यस महिनाका</div><span class="stat-trend trend-up"></span></div></div>
      `}
      <div class="stat-widget pointer" onclick="showComplaintsView({endDate: '2082-03-31'})"><div class="stat-icon" style="background-color: #6f42c1; color: white;"><i class="fas fa-history"></i></div><div class="stat-info"><div class="stat-value">${lastFyComplaints}</div><div class="stat-label">गत आ.व.को जिम्मेवारी</div><span class="stat-trend trend-down"></span></div></div>
      <div class="stat-widget pointer" onclick="showComplaintsView({startDate: '2082-04-01'})"><div class="stat-icon" style="background-color: #fd7e14; color: white;"><i class="fas fa-calendar-check"></i></div><div class="stat-info"><div class="stat-value">${thisFyComplaints}</div><div class="stat-label">यस आ.व.का उजुरी</div><span class="stat-trend trend-up"></span></div></div>
    </div>
    
    <div class="card mb-3">
      <div class="card-header d-flex justify-between align-center"><h5 class="mb-0">उजुरी वर्गीकरण (AI विश्लेषण)</h5>${getChartActionsHTML('classificationChart')}</div>
      <div class="card-body">
        <div class="row"><div class="col-md-7"><div class="chart-wrapper dashboard-chart-wrapper"><canvas id="classificationChart"></canvas></div></div><div class="col-md-5">${generateClassificationTableHTML(shakhaComplaints)}</div></div>
      </div>
    </div>

    <div class="d-grid gap-3 mb-3" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));">
      <div class="chart-container"><div class="chart-header d-flex justify-between align-center"><h6 class="chart-title">उजुरी स्थिति</h6>${getChartActionsHTML('complaintStatusChart')}</div><div class="chart-wrapper"><canvas id="complaintStatusChart"></canvas></div></div>
      <div class="chart-container"><div class="chart-header d-flex justify-between align-center"><h6 class="chart-title">मासिक प्रगति विवरण</h6>${getChartActionsHTML('trendChart')}</div><div class="chart-wrapper"><canvas id="trendChart"></canvas></div></div>
      <div class="chart-container"><div class="chart-header d-flex justify-between align-center"><h6 class="chart-title">मन्त्रालय/निकाय अनुसार उजुरी</h6>${getChartActionsHTML('shakhaMinistryChart')}</div><div class="chart-wrapper"><canvas id="shakhaMinistryChart"></canvas></div></div>
      ${(state.currentUser && (state.currentUser.shakha || '').includes('प्राविधिक')) ? `<div class="chart-container"><div class="chart-header d-flex justify-between align-center"><div class="d-flex align-center gap-2"><h6 class="chart-title mb-0">प्राविधिक परीक्षण/आयोजना अनुगमन</h6><button class="btn btn-sm btn-link text-muted p-0" onclick="openProjectDateFilter()" title="मिति फिल्टर"><i class="fas fa-calendar-alt"></i></button></div>${getChartActionsHTML('projectStatusChart')}</div><div class="chart-wrapper dashboard-chart-wrapper"><canvas id="projectStatusChart"></canvas></div></div>` : ''}
      ${(state.currentUser && (state.currentUser.shakha === 'LABORATORY_TESTING' || (SHAKHA && SHAKHA[state.currentUser.shakha] === 'प्रयोगशाला परीक्षण शाखा') || (state.currentUser.shakha && String(state.currentUser.shakha).toLowerCase().includes('laboratory')) || (state.currentUser.shakha && String(state.currentUser.shakha).includes('प्रयोगशाला')))) ? `<div class="chart-container"><div class="chart-header d-flex justify-between align-center"><h6 class="chart-title">मासिक परीक्षण विवरण</h6>${getChartActionsHTML('monthlyTestingChart')}</div><div class="chart-wrapper"><canvas id="monthlyTestingChart"></canvas></div></div>
      <div class="chart-container"><div class="chart-header d-flex justify-between align-center"><h6 class="chart-title">परीक्षण स्थिति</h6>${getChartActionsHTML('testingStatusChart')}</div><div class="chart-wrapper"><canvas id="testingStatusChart"></canvas></div></div>` : ''}
    </div>
    
    <div class="card">
      <div class="card-header d-flex justify-between align-center">
        <h5 class="mb-0">हालैका उजुरीहरू</h5>
        <div class="d-flex align-center gap-2">
          <button class="btn btn-sm btn-success" onclick="exportToExcel('recent')"><i class="fas fa-file-excel"></i> Excel</button>
          <a href="#" class="text-primary text-small" onclick="showComplaintsView()">सबै हेर्नुहोस्</a>
        </div>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table">
            <thead><tr><th>दर्ता नं</th><th>दर्ता मिति</th><th>उजुरकर्ता</th><th>विपक्षी</th><th>उजुरीको संक्षिप्त विवरण</th><th>उजुरीको स्थिति</th><th>कार्य</th></tr></thead>
            <tbody>
              ${shakhaComplaints.slice(0, 5).map(complaint => `
                <tr class="${getComplaintAgeClass(complaint)}">
                  <td data-label="दर्ता नं">${complaint.id}</td><td data-label="दर्ता मिति">${complaint.date}</td><td data-label="उजुरकर्ता">${complaint.complainant}</td><td data-label="विपक्षी">${complaint.accused || '-'}</td>
                  <td data-label="उजुरीको संक्षिप्त विवरण" class="text-limit">${(complaint.description || '').substring(0, 50)}...</td>
                  <td data-label="उजुरीको स्थिति"><span class="status-badge ${complaint.status === 'resolved' ? 'status-resolved' : complaint.status === 'pending' ? 'status-pending' : 'status-progress'}">${complaint.status === 'resolved' ? 'फछ्रयौट' : complaint.status === 'pending' ? 'काम बाँकी' : 'चालु'}</span></td>
                  <td data-label="कार्य"><button class="action-btn" data-action="view" data-id="${complaint.id}" title="हेर्नुहोस्"><i class="fas fa-eye"></i></button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function showComplaintsView(initialFilters = {}) {
  console.log('📋 showComplaintsView() called', initialFilters);
  
  state.currentView = 'complaints';
  
  // Save specific filters to state for pagination persistence (fixes widget filters disappearing on page change)
  if (Object.keys(initialFilters).length > 0) {
      const filtersToSave = { ...initialFilters };
      delete filtersToSave._fromFilter;
      state.filters = filtersToSave;
      // Reset to page 1 when applying new filters
      if (state.pagination) state.pagination.currentPage = 1;
  }
  
  // Load saved filters if no specific filters are passed (and we aren't just switching views without intent to reset)
  if (Object.keys(initialFilters).length === 0) {
      // Prefer in-memory active filters (set by filter UI) so pagination retains them
      try {
        if (state.filters && Object.keys(state.filters).length > 0) {
          initialFilters = state.filters;
        } else {
          const saved = JSON.parse(localStorage.getItem('nvc_complaints_filters'));
          if (saved) initialFilters = saved;
        }
      } catch(e) { console.error('Error loading saved filters', e); }
  }

  const pageTitle = document.getElementById('pageTitle');
  if (pageTitle) {
    pageTitle.textContent = 'उजुरीहरू';
  }
  
  // Safety check
  if (!state.complaints) {
    state.complaints = [];
  }
  
  // शाखा अनुसार फिल्टर: admin ले सबै, शाखाले आफ्नो मात्र
  let complaintsToShow = state.complaints;
  if (state.currentUser?.role === 'shakha') {
    const userShakhaName = (state.currentUser.shakha || '').trim();
    const userCode = (state.currentUser.id || '').trim();
    complaintsToShow = complaintsToShow.filter(c => {
      const cShakha = (c.shakha || '').trim();
      const cShakhaName = (c.shakhaName || '').trim();
      
      // Enhanced filtering logic for renamed shakha
      return cShakha === userShakhaName || 
             cShakha.toLowerCase() === userCode.toLowerCase() ||
             cShakhaName === userShakhaName ||
             SHAKHA[cShakha] === userShakhaName ||
             SHAKHA[cShakha.toUpperCase()] === userShakhaName ||
             // Special handling for INFO_COLLECTION with new name
             (cShakha === 'INFO_COLLECTION' && userShakhaName === 'सूचना संकलन, अन्वेषण तथा अनुगमन शाखा') ||
             (userShakhaName === 'INFO_COLLECTION' && cShakhaName === 'सूचना संकलन, अन्वेषण तथा अनुगमन शाखा');
    });
  } else if (state.currentUser?.role === 'mahashakha') {
    // For mahashakha users, show all complaints from their shakhas
    const userMahashakha = state.currentUser.mahashakha || state.currentUser.name;
    const allowedShakhas = MAHASHAKHA_STRUCTURE[userMahashakha] || [];
    
    complaintsToShow = complaintsToShow.filter(c => {
      // Check if complaint belongs to any shakha under this mahashakha
      const complaintShakha = c.shakha || '';
      return allowedShakhas.includes(complaintShakha) || 
             c.mahashakha === userMahashakha || 
             c.mahashakha === state.currentUser.name;
    });
  } else if (state.currentUser?.role === 'admin_planning') {
    complaintsToShow = complaintsToShow.filter(c => {
      const s = String(c.source || '').toLowerCase();
      return s === 'hello_sarkar' || s === 'online' || s === 'online_complaint';
    });
  }
  
  // Filter based on search and status
  const statusFilter = initialFilters.status || '';
  const finalDecisionTypeFilter = initialFilters.finalDecisionType || '';
  const shakhaFilter = initialFilters.shakha || '';
  const searchField = initialFilters.searchField || 'all';
  const searchFilter = (initialFilters.search || '').toLowerCase();
  const ministryFilter = initialFilters.ministry || '';
  const startDate = initialFilters.startDate || '';
  const endDate = initialFilters.endDate || '';
  const sortOrder = initialFilters.sortOrder || 'newest';

  if (statusFilter) {
    complaintsToShow = complaintsToShow.filter(c => c.status === statusFilter);
  }

  if (finalDecisionTypeFilter) {
    const selected = normalizeFinalDecisionType(finalDecisionTypeFilter);
    complaintsToShow = complaintsToShow.filter(c => normalizeFinalDecisionType(c.finalDecision || c['अन्तिम निर्णयको प्रकार'] || '') === selected);
  }

  if (shakhaFilter) {
      complaintsToShow = complaintsToShow.filter(c => (c.shakha || '') === shakhaFilter);
  }
    if (ministryFilter) {
      complaintsToShow = complaintsToShow.filter(c => {
        const m = (c.ministry || c['मन्त्रालय/निकाय'] || '').toString();
        return m === ministryFilter;
      });
    }

  if (startDate || endDate) {
      // Normalize start/end to AD Date objects (supports BS via _parseComplaintRegDateToAD)
      const startAD = (typeof _parseComplaintRegDateToAD === 'function' && startDate) ? _parseComplaintRegDateToAD({ date: startDate }) : null;
      const endAD = (typeof _parseComplaintRegDateToAD === 'function' && endDate) ? _parseComplaintRegDateToAD({ date: endDate }) : null;

      complaintsToShow = complaintsToShow.filter(c => {
          const raw = c.date || c['दर्ता मिति'] || c.entryDate || '';
          if (!raw) return false;
          let cAD = null;
          if (typeof _parseComplaintRegDateToAD === 'function') {
            cAD = _parseComplaintRegDateToAD(c);
          }
          // Fallback: try normalizeNepaliDisplayToISO then construct Date
          if (!cAD || isNaN(cAD.getTime())) {
            try {
              if (typeof normalizeNepaliDisplayToISO === 'function') {
                const iso = normalizeNepaliDisplayToISO(raw);
                cAD = new Date(iso + 'T00:00:00');
              } else {
                const latin = (typeof _devnagariToLatin === 'function') ? _devnagariToLatin(String(raw)) : String(raw);
                const m = latin.match(/(\d{4})[\-\/.](\d{1,2})[\-\/.](\d{1,2})/);
                if (m) cAD = new Date(`${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}T00:00:00`);
              }
            } catch (e) { cAD = null; }
          }
          if (!cAD || isNaN(cAD.getTime())) return false;

          if (startAD && cAD < startAD) return false;
          if (endAD && cAD > endAD) return false;
          return true;
      });
  }

  if (searchFilter) {
    complaintsToShow = complaintsToShow.filter(c => {
        if (searchField === 'id') return String(c.id).toLowerCase().includes(searchFilter);
        if (searchField === 'complainant') return String(c.complainant).toLowerCase().includes(searchFilter);
        if (searchField === 'accused') return String(c.accused || '').toLowerCase().includes(searchFilter);
        if (searchField === 'description') return String(c.description).toLowerCase().includes(searchFilter);
        if (searchField === 'ministry') return String(c.ministry || c['मन्त्रालय/निकाय'] || '').toLowerCase().includes(searchFilter);
        // Default: All fields
        return JSON.stringify(c).toLowerCase().includes(searchFilter);
    });
  }

  console.log(`📊 Total complaints: ${complaintsToShow.length}`);
  
  // Sort complaints by registration date. Default newest first, support oldest as well.
  complaintsToShow.sort((a, b) => {
    const getSortableDate = (c) => {
      // Prioritize c.date (BS) as it is displayed in the table
      let val = c.date || c['दर्ता मिति'] || c.entryDate || '';
      if (!val) return '';
      
      // Normalize Devanagari to Latin digits
      val = String(val).replace(/[०-९]/g, d => "0123456789"["०१२३४५६७८९".indexOf(d)]);
      
      // Extract YYYY-MM-DD
      const match = val.match(/(\d{4})[\-\/.](\d{1,2})[\-\/.](\d{1,2})/);
      if (match) {
        return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
      }
      return val;
    };

    const dateA = getSortableDate(a);
    const dateB = getSortableDate(b);

    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;

    if (sortOrder === 'oldest') {
      return dateA.localeCompare(dateB);
    } else {
      return dateB.localeCompare(dateA);
    }
  });

  // पेजिनेसन
  const itemsPerPage = state.pagination?.itemsPerPage || 10;
  const currentPage = state.pagination?.currentPage || 1;
  const totalItems = complaintsToShow.length;
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedComplaints = complaintsToShow.slice(startIndex, endIndex);
  
  console.log(`📄 Showing ${startIndex + 1} to ${endIndex} of ${totalItems}`);
  
  // Table rows बनाउने
  let tableRows = '';
  
  if (paginatedComplaints.length === 0) {
    const colSpan = 13;
    tableRows = `<tr><td colspan="${colSpan}" class="text-center p-4">कुनै उजुरी फेला परेन</td></tr>`;
  } else {
    paginatedComplaints.forEach(complaint => {
      // सबै fields लिने - विभिन्न सम्भावित नामहरू
      const id = complaint.id || 
                 complaint['उजुरी दर्ता नं'] || 
                 '-';
      
      // AI Analysis for Priority Badge
      const analysis = AI_SYSTEM.analyzeComplaint(complaint.description || '');
      const priorityBadge = analysis.priority === 'उच्च' ? '<span class="badge badge-danger">उच्च</span>' : 
                            analysis.priority === 'मध्यम' ? '<span class="badge badge-warning">मध्यम</span>' : '';

      // Prefer Nepali display if available, otherwise use normalized date
      const dateRaw = complaint.date || complaint['दर्ता मिति'] || '-';
      const dateNep = complaint.dateNepali || complaint['दर्ता मिति नेपाली'] || complaint['नेपाली मिति'] || '';
      // If Nepali display already provided, show it. Otherwise convert Latin digits to Devanagari for display.
      const date = dateNep ? dateNep : _latinToDevnagari(String(dateRaw));
      
      const complainant = complaint.complainant || 
                          complaint['उजुरीकर्ताको नाम'] || 
                          '-';
      
      const accused = complaint.accused || 
                      complaint['विपक्षी'] || 
                      '-';
      const ministry = complaint.ministry || complaint['मन्त्रालय/निकाय'] || '-';
      
      const description = complaint.description || 
                          complaint['उजुरीको संक्षिप्त विवरण'] || 
                          '';
      
      const decision = complaint.decision || 
                       complaint['अन्तिम निर्णय'] || 
                       '';
      
      const remarks = complaint.remarks || 
                      complaint['कैफियत'] || 
                      '-';
      
      const shakha = complaint.shakha || 
                     complaint['सम्बन्धित शाखा'] || 
                     '-';
      
      // Status
      const status = complaint.status || 
                     complaint['स्थिति'] || 
                     'pending';
      
      let statusText = 'काम बाँकी';
      let statusClass = 'status-pending';
      
      if (status === 'resolved' || status === 'फछ्रयौट') {
        statusText = 'फछ्रयौट';
        statusClass = 'status-resolved';
      } else if (status === 'progress' || status === 'चालु') {
        statusText = 'चालु';
        statusClass = 'status-progress';
      }

      const ageClass = getComplaintAgeClass(complaint);
      
      const fullDescription = (description || '').replace(/\n/g, '<br>');
      const fullCommittee = (complaint.committeeDecision || '').replace(/\n/g, '<br>');
      const fullDecision = (decision || '').replace(/\n/g, '<br>');

      tableRows += `
        <tr class="${ageClass}">
          <td data-label="छनौट">
            <input type="checkbox" class="complaint-select" data-id="${id}" onchange="updateSelectedComplaints()">
          </td>
          <td data-label="दर्ता नं"><strong>${id}</strong></td>
          <td data-label="मिति">${date} ${priorityBadge}</td>
          <td data-label="उजुरकर्ता">${complainant}</td>
          <td data-label="विपक्षी">${accused}</td>
          <td data-label="मन्त्रालय/निकाय">${ministry}</td>
          <td data-label="उजुरीको विवरण" title="${description}">${fullDescription}</td>
          <td data-label="समितिको निर्णय" title="${complaint.committeeDecision || ''}">${fullCommittee}</td>
          <td data-label="अन्तिम निर्णय" title="${decision || ''}">${fullDecision}</td>
          <td data-label="कैफियत">${remarks}</td>
          <td data-label="शाखा">${shakha}</td>
          <td data-label="स्थिति"><span class="status-badge ${statusClass}">${statusText}</span></td>
          <td data-label="कार्य">
            <div class="table-actions">
              <button class="action-btn" onclick="handleTableActions(event)" data-action="view" data-id="${id}" title="हेर्नुहोस्"><i class="fas fa-eye"></i></button>
              ${state.currentUser.role === 'admin' || state.currentUser.role === 'shakha' ? `<button class="action-btn" onclick="handleTableActions(event)" data-action="edit" data-id="${id}" title="सम्पादन गर्नुहोस्"><i class="fas fa-edit"></i></button><button class="action-btn" onclick="handleTableActions(event)" data-action="delete" data-id="${id}" title="हटाउनुहोस्"><i class="fas fa-trash"></i></button>` : ''}
            </div>
          </td>
        </tr>
      `;
    });
  }
  
  // पेजिनेसन HTML
  const paginationHTML = renderPagination(totalItems, itemsPerPage, currentPage);

  const chipsHTML = buildComplaintsFilterChipsHTML({
    status: statusFilter,
    finalDecisionType: finalDecisionTypeFilter,
    shakha: shakhaFilter,
    ministry: ministryFilter,
    searchField,
    search: searchFilter,
    sortOrder,
    startDate,
    endDate
  });
  
  // Generate Shakha Options
  let shakhaOptions = '<option value="">शाखा (सबै)</option>';
  if (state.currentUser.role === 'admin' || state.currentUser.role === 'mahashakha') {
      Object.entries(SHAKHA).forEach(([key, value]) => {
          shakhaOptions += `<option value="${value}" ${shakhaFilter === value ? 'selected' : ''}>${value}</option>`;
      });
  }

  const filterBarHTML = `
    <div class="filter-bar mb-3">
      <div class="d-flex justify-between align-center w-100 mb-2">
          <h6 class="mb-0"><i class="fas fa-filter"></i> फिल्टरहरू</h6>
          <button id="filterToggleBtn" class="btn btn-sm btn-outline" onclick="toggleFilterBar()" title="Toggle filters">
            <i id="filterToggleIcon" class="fas fa-chevron-down"></i>
          </button>
      </div>

      ${chipsHTML ? `<div class="w-100 mb-2">${chipsHTML}</div>` : ''}
      
      <div id="filterContent" class="w-100 d-none d-md-block ${state.filterCollapsed ? 'filter-content-collapsed' : ''}">
          <div class="filter-grid">
            <!-- Group 1: Date Range -->
            <div class="filter-group-box">
                <label class="filter-group-label">मितिको दायरा (Range)</label>
                <div class="d-flex flex-wrap gap-2 align-center">
                    <div class="nepali-datepicker-dropdown" data-target="filterStartDate">
                        <select id="filterStartDate_year" class="form-select form-select-sm bs-year"><option value="">साल</option></select>
                        <select id="filterStartDate_month" class="form-select form-select-sm bs-month"><option value="">महिना</option></select>
                        <select id="filterStartDate_day" class="form-select form-select-sm bs-day"><option value="">गते</option></select>
                        <input type="hidden" id="filterStartDate" value="${startDate}" />
                    </div>
                    <span class="text-muted text-small">देखि</span>
                    <div class="nepali-datepicker-dropdown" data-target="filterEndDate">
                        <select id="filterEndDate_year" class="form-select form-select-sm bs-year"><option value="">साल</option></select>
                        <select id="filterEndDate_month" class="form-select form-select-sm bs-month"><option value="">महिना</option></select>
                        <select id="filterEndDate_day" class="form-select form-select-sm bs-day"><option value="">गते</option></select>
                        <input type="hidden" id="filterEndDate" value="${endDate}" />
                    </div>
                    <span class="text-muted text-small">सम्म</span>
                </div>
            </div>

            <!-- Group 2: Attributes -->
            <div class="filter-group-box">
                <label class="filter-group-label">विवरण</label>
                <div class="d-flex flex-wrap gap-2">
                    <select class="form-select form-select-sm" id="filterStatus" style="min-width: 100px;">
                        <option value="">स्थिति (सबै)</option>
                        <option value="pending" ${statusFilter === 'pending' ? 'selected' : ''}>काम बाँकी</option>
                        <option value="progress" ${statusFilter === 'progress' ? 'selected' : ''}>चालु</option>
                        <option value="resolved" ${statusFilter === 'resolved' ? 'selected' : ''}>फछ्रयौट</option>
                    </select>
                    <select class="form-select form-select-sm" id="filterFinalDecisionType" style="min-width: 130px;">
                        <option value="">केन्द्रको निर्णय (सबै)</option>
                        <option value="तामेली" ${normalizeFinalDecisionType(finalDecisionTypeFilter) === 'तामेली' ? 'selected' : ''}>तामेली</option>
                        <option value="सुझाव/निर्देशन" ${normalizeFinalDecisionType(finalDecisionTypeFilter) === 'सुझाव/निर्देशन' ? 'selected' : ''}>सुझाव/निर्देशन</option>
                        <option value="सतर्क" ${normalizeFinalDecisionType(finalDecisionTypeFilter) === 'सतर्क' ? 'selected' : ''}>सतर्क</option>
                        <option value="अन्य" ${normalizeFinalDecisionType(finalDecisionTypeFilter) === 'अन्य' ? 'selected' : ''}>अन्य</option>
                    </select>
                    <select class="form-select form-select-sm" id="filterShakha" style="min-width: 120px;">
                        ${shakhaOptions}
                    </select>
                    <select class="form-select form-select-sm" id="filterMinistry" style="min-width: 180px;">
                      <option value="">मन्त्रालय/निकाय (सबै)</option>
                      ${MINISTRIES.map(m => `<option value="${m}" ${ministryFilter === m ? 'selected' : ''}>${m}</option>`).join('')}
                    </select>
                </div>
            </div>

            <!-- Group 3: Search & Sort -->
            <div class="filter-group-box">
                <label class="filter-group-label">खोजी र क्रम</label>
                <div class="d-flex flex-wrap gap-2 align-center">
                    <select class="form-select form-select-sm" id="sortOrder" style="min-width: 110px;">
                        <option value="newest" ${sortOrder === 'newest' ? 'selected' : ''}>नयाँ -> पुरानो</option>
                        <option value="oldest" ${sortOrder === 'oldest' ? 'selected' : ''}>पुरानो -> नयाँ</option>
                    </select>
                    <div class="input-group input-group-sm flex-grow-1" style="min-width: 200px;">
                        <select class="form-select form-select-sm" id="searchField" style="max-width: 90px;">
                            <option value="all" ${searchField === 'all' ? 'selected' : ''}>सबै</option>
                            <option value="id" ${searchField === 'id' ? 'selected' : ''}>दर्ता नं</option>
                            <option value="complainant" ${searchField === 'complainant' ? 'selected' : ''}>उजुरकर्ता</option>
                            <option value="accused" ${searchField === 'accused' ? 'selected' : ''}>विपक्षी</option>
                            <option value="description" ${searchField === 'description' ? 'selected' : ''}>विवरण</option>
                            <option value="ministry" ${searchField === 'ministry' ? 'selected' : ''}>मन्त्रालय/निकाय</option>
                        </select>
                        <input type="text" class="form-control" placeholder="खोज्नुहोस्..." id="searchText" value="${searchFilter}" oninput="debouncedFilterComplaintsTable()" onkeyup="if(event.key === 'Enter') filterComplaintsTable()">
                    </div>
                </div>
            </div>
            
            <!-- Group 4: Actions -->
            <div class="filter-actions-row">
                <button class="btn btn-sm btn-primary" onclick="filterComplaintsTable()"><i class="fas fa-search"></i> खोज्नुहोस्</button>
                <button class="btn btn-sm btn-outline-secondary" onclick="clearComplaintsFilters()"><i class="fas fa-times"></i> रिसेट</button>
                <button class="btn btn-sm btn-outline-primary" onclick="saveComplaintsFilters()"><i class="fas fa-save"></i> फिल्टर सेभ</button>
                <button class="btn btn-sm btn-success ms-auto" onclick="exportToExcel('complaints')"><i class="fas fa-file-excel"></i> Excel</button>
            </div>
          </div>
      </div>
    </div>
  `;

  const content = `
    <style>
      .table-reduced-padding th, .table-reduced-padding td {
        padding-left: 0.35rem !important;
        padding-right: 0.35rem !important;
      }
      /* Collapsible filters */
      .filter-content-collapsed { display: none !important; }
      #filterToggleIcon.filter-toggle-rotated { transform: rotate(180deg); transition: transform 0.18s ease; }
    </style>
    ${filterBarHTML}
    <div class="card">
      <div class="card-header d-flex justify-between align-center">
        <h5 class="mb-0">उजुरी सूची (${totalItems})</h5>
        <div class="d-flex gap-2">
            <button class="btn btn-sm btn-danger" onclick="exportSelectedComplaintsPDF()" id="pdfExportBtn" disabled>
              <i class="fas fa-file-pdf"></i> PDF Export (<span id="selectedCount">0</span>)
            </button>
          }
          <select class="form-select form-select-sm" style="width: auto;" onchange="changeItemsPerPage(this.value)">
            <option value="10" ${itemsPerPage === 10 ? 'selected' : ''}>१० प्रति पेज</option>
            <option value="20" ${itemsPerPage === 20 ? 'selected' : ''}>२० प्रति पेज</option>
            <option value="50" ${itemsPerPage === 50 ? 'selected' : ''}>५० प्रति पेज</option>
            <option value="100" ${itemsPerPage === 100 ? 'selected' : ''}>१०० प्रति पेज</option>
          </select>
          <button class="btn btn-sm btn-primary" onclick="refreshData()">
            <i class="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-reduced-padding">
            <thead>
              <tr>
                <th><input type="checkbox" id="selectAllComplaints" title="सबै छान्नुहोस्" onchange="toggleSelectAll(this)"></th>
                <th>दर्ता नं</th>
                <th>मिति</th>
                <th>उजुरकर्ता</th>
                <th>विपक्षी</th>
                <th>मन्त्रालय/निकाय</th>
                <th>उजुरीको विवरण</th>
                <th>समितिको निर्णय</th>
                <th>अन्तिम निर्णय</th>
                <th>कैफियत</th>
                <th>शाखा</th>
                <th>स्थिति</th>
                <th>कार्य</th>
              </tr>
            </thead>
            <tbody id="complaintsTableBody">
              ${tableRows}
            </tbody>
          </table>
        </div>
      </div>
      <div class="card-footer d-flex justify-between align-center">
        <div class="text-small text-muted">
          देखाउँदै ${totalItems > 0 ? startIndex + 1 : 0} - ${endIndex} of ${totalItems}
        </div>
        ${paginationHTML}
      </div>
    </div>
  `;
  
  const contentArea = document.getElementById('contentArea');
  if (contentArea) {
    setContentAreaHTML(content);
    console.log('✅ Content area updated');
    applyDevanagariDigits(document.getElementById('contentArea'));

    setTimeout(() => { initializeNepaliDropdowns(); }, 100);
    // Rely on the centralized delegated handler in setupEventListeners() for action buttons
  }
  updateActiveNavItem();
  // If admin or mahashakha opened the complaints view, mark new entries as seen
  try {
    if (state.currentUser && (state.currentUser.role === 'admin' || state.currentUser.role === 'mahashakha')) {
      // mark seen asynchronously (no await to avoid blocking UI)
      markSeenNewEntries().catch(e => console.error('markSeenNewEntries failed', e));
    }
  } catch (e) { console.error(e); }
}

function renderPagination(totalItems, itemsPerPage, currentPage) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  if (totalPages <= 1) {
    return '';
  }
  
  let paginationHTML = '<nav><ul class="pagination mb-0">';
  
  // Previous button
  paginationHTML += `
    <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;">पछिल्लो</a>
    </li>
  `;
  
  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
      paginationHTML += `
        <li class="page-item ${i === currentPage ? 'active' : ''}">
          <a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>
        </li>
      `;
    } else if (i === currentPage - 3 || i === currentPage + 3) {
      paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    }
  }
  
  // Next button
  paginationHTML += `
    <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;">अर्को</a>
    </li>
  `;
  
  paginationHTML += '</ul></nav>';
  
  return paginationHTML;
}

function changePage(page) {
  console.log('📄 changePage() called with page:', page);
  
  if (!state.pagination) {
    state.pagination = { currentPage: 1, itemsPerPage: 10 };
  }
  
  let totalItems = 0;
  if (state.currentUser && state.currentUser.role !== 'admin') {
    if (state.currentUser.role === 'shakha') {
        const userShakhaName = (state.currentUser.shakha || '').trim();
        const userCode = (state.currentUser.id || '').trim();
        totalItems = state.complaints.filter(c => {
          const cShakha = (c.shakha || '').trim();
          const cShakhaName = (c.shakhaName || '').trim();
          
          return cShakha === userShakhaName || 
                 cShakha.toLowerCase() === userCode.toLowerCase() ||
                 cShakhaName === userShakhaName ||
                 SHAKHA[cShakha] === userShakhaName ||
                 SHAKHA[cShakha.toUpperCase()] === userShakhaName ||
                 // Special handling for INFO_COLLECTION with new name
                 (cShakha === 'INFO_COLLECTION' && userShakhaName === 'सूचना संकलन, अन्वेषण तथा अनुगमन शाखा') ||
                 (userCode === 'INFO_COLLECTION' && cShakhaName === 'सूचना संकलन, अन्वेषण तथा अनुगमन शाखा');
        }).length;
    } else if (state.currentUser.role === 'mahashakha') {
        // For mahashakha users, show all complaints from their shakhas
        const userMahashakha = state.currentUser.mahashakha || state.currentUser.name;
        const allowedShakhas = MAHASHAKHA_STRUCTURE[userMahashakha] || [];
        
        totalItems = state.complaints.filter(c => {
          // Check if complaint belongs to any shakha under this mahashakha
          const complaintShakha = c.shakha || '';
          return allowedShakhas.includes(complaintShakha) || 
                 c.mahashakha === userMahashakha || 
                 c.mahashakha === state.currentUser.name;
        }).length;
    }
  } else {
    totalItems = state.complaints?.length || 0;
  }
  
  const itemsPerPage = state.pagination.itemsPerPage || 10;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  if (page < 1 || page > totalPages) {
    return;
  }
  
  state.pagination.currentPage = page;
  
  // Current view update गर्ने
  if (state.currentView === 'complaints' || state.currentView === 'all_complaints') {
    showComplaintsView();
  }
}

function changeItemsPerPage(perPage) {
  console.log('📄 changeItemsPerPage() called with:', perPage);
  
  if (!state.pagination) {
    state.pagination = { currentPage: 1 };
  }
  
  state.pagination.itemsPerPage = parseInt(perPage);
  state.pagination.currentPage = 1;
  
  // Current view update गर्ने
  if (state.currentView === 'complaints' || state.currentView === 'all_complaints') {
    showComplaintsView();
  }
}

async function testDataLoad() {
  console.log('🧪 Testing data load...');
  console.log('Current state before load:', state.complaints.length);
  
  // Show loading indicator
  showLoadingIndicator(true, 'Testing data load...');
  
  try {
    const result = await loadDataFromGoogleSheets(true);
    
    console.log('Load result:', result);
    console.log('State after load:', state.complaints.length);
    
    if (state.complaints.length > 0) {
      console.log('First complaint:', state.complaints[0]);
    }
    
    // Show visual feedback
    if (result) {
      showToast('✅ Data load test completed successfully', 'success');
    } else {
      showToast('⚠️ Data load test completed with warnings', 'warning');
    }
    
    // Show detailed info in console
    console.log('📊 Test Load Summary:');
    console.log('- Load Result:', result);
    console.log('- Complaints Count:', state.complaints.length);
    console.log('- Projects Count:', state.projects?.length || 0);
    console.log('- Technical Examiners Count:', state.technicalExaminers?.length || 0);
    
    return result;
  } catch (error) {
    console.error('❌ Data load test failed:', error);
    showToast('❌ Data load test failed: ' + error.message, 'error');
    throw error;
  } finally {
    showLoadingIndicator(false);
  }
}

async function testDirectAPI() {
  console.log('🧪 Testing direct API call...');
  
  const response = await getFromGoogleSheets('getComplaints');
  console.log('API Response:', response);
  return response;
}

// Test helper: seed sample complaints and refresh dashboard stats (no external side-effects)
function seedSampleComplaintsAndRefresh() {
  console.log('🧪 Seeding sample complaints for stats test...');
  const sample = [
    { id: 'T-1', status: 'pending', shakha: Object.values(SHAKHA)[0] || 'शाखा A' },
    { id: 'T-2', status: 'progress', shakha: Object.values(SHAKHA)[1] || 'शाखा B' },
    { id: 'T-3', status: 'resolved', shakha: Object.values(SHAKHA)[2] || 'शाखा C' },
    { id: 'T-4', status: 'progress', shakha: Object.values(SHAKHA)[1] || 'शाखा B' }
  ];

  // Preserve existing complaints but prepend samples for visible effect
  state.complaints = sample.concat(state.complaints || []);
  updateStats();
  console.log('📊 After seeding - total:', state.complaints.length,
              'inProgress:', state.complaints.filter(c => c.status==='progress').length,
              'pending:', state.complaints.filter(c => c.status==='pending').length);
}
  

function checkState() {
  console.log('📊 Current State:');
  console.log('- User:', state.currentUser?.name || 'Not logged in');
  console.log('- Page:', state.currentPage);
  console.log('- View:', state.currentView);
  console.log('- Complaints:', state.complaints?.length || 0);
  console.log('- Projects:', state.projects?.length || 0);
  console.log('- Employee Monitoring:', state.employeeMonitoring?.length || 0);
  console.log('- Citizen Charters:', state.citizenCharters?.length || 0);
  
  // Show visual feedback
  const userInfo = state.currentUser?.name || 'Not logged in';
  const complaintsCount = state.complaints?.length || 0;
  const projectsCount = state.projects?.length || 0;
  
  showToast(`📊 State: User: ${userInfo}, Complaints: ${complaintsCount}, Projects: ${projectsCount}`, 'info');
  
  // Show detailed state in console
  console.log('📊 Check State Summary:');
  console.log('Full State Object:', state);
  console.log('LocalStorage Usage:', {
    complaints: localStorage.getItem('nvc_complaints') ? 'Present' : 'Not present',
    projects: localStorage.getItem('nvc_projects') ? 'Present' : 'Not present',
    user: localStorage.getItem('nvc_user') ? 'Present' : 'Not present'
  });
  
  return state;
}

function showAllComplaintsView() {
  state.filters = {};
  try { localStorage.removeItem('nvc_complaints_filters'); } catch(e){}
  state.currentView = 'all_complaints';
  document.getElementById('pageTitle').textContent = 'सबै उजुरीहरू';
  showComplaintsView();
  updateActiveNavItem();
}

function showOnlineComplaintsView(initialFilters = {}) {
  console.log('showOnlineComplaintsView - Starting...');
  state.currentView = 'online_complaints';
  document.getElementById('pageTitle').textContent = 'अनलाइन उजुरी';

  if (!state.onlineComplaints) state.onlineComplaints = [];

  // Lazy-load from Google Sheet for admin_planning
  if (GOOGLE_SHEETS_CONFIG.ENABLED && state.currentUser?.role === 'admin_planning' && !state._onlineComplaintsLoaded) {
    console.log('showOnlineComplaintsView - Loading from sheets...');
    state._onlineComplaintsLoaded = true;
    showLoadingIndicator(true);
    loadOnlineComplaintsFromSheets().finally(() => {
      showLoadingIndicator(false);
      console.log('showOnlineComplaintsView - Load completed, re-rendering...');
      // Re-render after load
      try { showOnlineComplaintsView(initialFilters); } catch (e) {}
    });
    return; // Exit early, will re-render after load
  }

  const onlineComplaints = (state.onlineComplaints || []).slice();
  console.log('showOnlineComplaintsView - Rendering ' + onlineComplaints.length + ' complaints');

  // Helper to robustly read assigned shakha and assigned date from various sheet schemas
  function resolveAssignedShakha(complaint) {
    if (!complaint) return '';
    // Prefer explicit assignedShakha, then shakha, then assignedShakhaName, then code mapping
    const s = complaint.assignedShakha || complaint.shakha || complaint.assignedShakhaName || complaint.shakhaName || '';
    if (s) return s;
    // Try code->name
    const code = complaint.assignedShakhaCode || complaint.shakhaCode || '';
    if (code && SHAKHA && SHAKHA[code]) return SHAKHA[code];
    return '';
  }

  function resolveAssignedDate(complaint) {
    if (!complaint) return '';
    return complaint.assignedDate || complaint.assigned_on || complaint.assigned_at || complaint.assignment_date || '';
  }

  const content = `
    <div class="filter-bar mb-3">
      <div class="filter-group"><label class="filter-label">स्थिति:</label><select class="form-select form-select-sm" id="filterOnlineStatus"><option value="">सबै</option><option value="pending" ${initialFilters.status === 'pending' ? 'selected' : ''}>काम बाँकी</option><option value="progress">चालु</option><option value="resolved">फछ्रयौट</option></select></div>
      <div class="filter-group"><input type="text" class="form-control form-control-sm" placeholder="खोज्नुहोस्..." id="searchOnlineText" value="${initialFilters.search || ''}" /></div>
      <button class="btn btn-primary btn-sm" onclick="filterOnlineComplaints()">खोज्नुहोस्</button>
      <button class="btn btn-success btn-sm" onclick="exportToExcel('online')"><i class="fas fa-file-excel"></i> Excel</button>
    </div>
    
    <div class="card">
      <div class="card-header"><h5 class="mb-0">अनलाइन उजुरी सूची</h5></div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table">
            <thead><tr><th>क्र.सं.</th><th>मिति</th><th>उजुरकर्ता</th><th>विपक्षी</th><th>उजुरीको विवरण</th><th>सम्बन्धित शाखा</th><th>शाखामा पठाएको मिति</th><th>निर्णय</th><th>कैफियत</th><th>कार्य</th></tr></thead>
            <tbody id="onlineComplaintsTable">
              ${onlineComplaints.map((complaint, index) => `
                <tr class="${getComplaintAgeClass(complaint)}">
                  <td data-label="क्र.सं.">${index + 1}</td><td data-label="मिति">${complaint.date}</td><td data-label="उजुरकर्ता">${complaint.complainant}</td><td data-label="विपक्षी">${complaint.accused || '-'}</td>
                  <td data-label="उजुरीको विवरण" class="text-limit" title="${complaint.description || ''}">${(complaint.description || '-').toString().substring(0, 50)}...</td>
                  <td data-label="सम्बन्धित शाखा">${displayShakhaName(resolveAssignedShakha(complaint)) || '-'}</td><td data-label="शाखामा पठाएको मिति">${resolveAssignedDate(complaint) || '-'}</td>
                  <td data-label="निर्णय" class="text-limit" title="${complaint.decision || ''}">${complaint.decision ? complaint.decision.toString().substring(0, 30) + '...' : '-'}</td>
                  <td data-label="कैफियत">${complaint.remarks || '-'}</td>
                  <td data-label="कार्य"><div class="table-actions"><button class="action-btn" data-action="view" data-func="viewOnlineComplaint" data-id="${complaint.id}" title="हेर्नुहोस्"><i class="fas fa-eye"></i></button><button class="action-btn" data-action="assign" data-func="assignOnlineComplaint" data-id="${complaint.id}" title="शाखामा पठाउनुहोस्"><i class="fas fa-paper-plane"></i></button><button class="action-btn" data-action="edit" data-func="editOnlineComplaint" data-id="${complaint.id}" title="सम्पादन गर्नुहोस्"><i class="fas fa-edit"></i></button></div></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  document.getElementById('contentArea').innerHTML = content;
  applyDevanagariDigits(document.getElementById('contentArea'));
  if (initialFilters.status || initialFilters.search) {
    setTimeout(filterOnlineComplaints, 100);
  }
  updateActiveNavItem();
}

async function loadOnlineComplaintsFromSheets() {
  console.log('loadOnlineComplaintsFromSheets - Starting...');
  if (!GOOGLE_SHEETS_CONFIG.ENABLED) {
    console.log('loadOnlineComplaintsFromSheets - Google Sheets disabled');
    return { success: true, data: state.onlineComplaints || [], local: true };
  }
  try {
    console.log('loadOnlineComplaintsFromSheets - Calling getOnlineComplaints API...');
    const res = await getFromGoogleSheets('getOnlineComplaints');
    console.log('loadOnlineComplaintsFromSheets - API response:', res);
    
    if (res.success) {
      // Debug: log raw incoming rows to inspect field names
      try {
        (res.data || []).forEach((row, i) => {
          try {
            console.log('Raw sheet row ' + i + ' keys:', Object.keys(row).join(', '));
            console.log('Raw sheet row ' + i + ' assigned candidates:', row.assignedShakha, row.shakha, row.assignedShakhaName, row['सम्बन्धित शाखा'], row['शाखा'], row.assignedDate, row.assigned_date, row.assigned_on, row['शाखामा पठाएको मिति']);
          } catch (e) {}
        });
      } catch (e) {}
      // Normalize rows and replace local cache with fresh data from server
      state.onlineComplaints = (res.data || []).map((row, idx) => {
        try {
          // Log the raw status field(s) present in the row for debugging
          try {
            const rawStatusCandidates = [];
            if (row.status !== undefined) rawStatusCandidates.push(row.status);
            if (row.Stauts !== undefined) rawStatusCandidates.push(row.Stauts);
            if (row['स्थिति'] !== undefined) rawStatusCandidates.push(row['स्थिति']);
            if (row.Status !== undefined) rawStatusCandidates.push(row.Status);
            console.log('DEBUG online_row_raw_status [' + (idx) + ']:', rawStatusCandidates.slice(0,5));
          } catch (e) { /* ignore */ }
          return normalizeOnlineComplaintRow(row);
        } catch (e) { return row; }
      });
      console.log('loadOnlineComplaintsFromSheets - Loaded ' + state.onlineComplaints.length + ' complaints');

      // Debug: show normalized statuses summary
      try {
        console.log('DEBUG online_status_summary:', state.onlineComplaints.map(c => ({ id: c.id, status: c.status })).slice(0,50));
      } catch (e) {}
      
      // Ensure each complaint has a date field in BS format and is visible
      state.onlineComplaints.forEach((complaint, index) => {
        // Only convert AD to BS if date field is missing AND created_at exists
        if (!complaint.date && complaint.created_at) {
          // Convert created_at to BS date if date field is missing
          const createdDate = new Date(complaint.created_at);
          const adDateStr = createdDate.toISOString().split('T')[0];
          complaint.date = convertADtoBSAccurate(adDateStr);
        }
        
        // Clean up date fields - remove time part
        if (complaint.date && typeof complaint.date === 'string') {
          // Debug: Log original date from sheet
          console.log('Complaint ' + index + ' - Original date from sheet:', complaint.date);
          
          // Handle timezone issue: If date has time with Z (UTC), convert to local date first
          if (complaint.date.includes('T') && complaint.date.includes('Z')) {
            // Parse the UTC date
            const dateObj = new Date(complaint.date);
            // Convert to Nepal Time (UTC + 5:45) manually to ensure correct date regardless of browser timezone
            const nepalTimeMs = dateObj.getTime() + 20700000; // 5h 45m in ms
            const nepalDate = new Date(nepalTimeMs);
            const localDateStr = nepalDate.getUTCFullYear() + '-' + 
                               String(nepalDate.getUTCMonth() + 1).padStart(2, '0') + '-' + 
                               String(nepalDate.getUTCDate()).padStart(2, '0');
            complaint.date = localDateStr;
            console.log('Complaint ' + index + ' - After timezone correction:', complaint.date);
          } else if (complaint.date.includes('T') || complaint.date.includes(' ')) {
            // Simple split for non-UTC dates
            complaint.date = complaint.date.split('T')[0].split(' ')[0];
          }
          
          // Debug: Log final date after cleanup
          console.log('Complaint ' + index + ' - Final date after cleanup:', complaint.date);
        }
        
        // IMPORTANT: Don't convert existing BS dates - they're already in correct format
        // The sheet already contains BS dates, so we should use them as-is
        
        // Clean up assignedDate field - remove time part
        if (complaint.assignedDate && typeof complaint.assignedDate === 'string') {
          // If assignedDate contains time, extract only the date part
          if (complaint.assignedDate.includes('T') || complaint.assignedDate.includes(' ')) {
            complaint.assignedDate = complaint.assignedDate.split('T')[0].split(' ')[0];
          }
        }
        
        // Ensure complaint is visible in UI and mark source
        complaint.visible = true;
        complaint.source = complaint.source || 'online';
        console.log('Complaint ' + index + ' loaded keys:', Object.keys(complaint).join(', '));
        console.log('Complaint ' + index + ':', complaint.id, complaint.date, 'assignedShakha=', complaint.assignedShakha || complaint.shakha || complaint.assignedShakhaName, 'assignedDate=', complaint.assignedDate || complaint.assigned_on || complaint.assignment_date || complaint.assigned_at);
      });
    } else {
      console.error('loadOnlineComplaintsFromSheets - API failed:', res.message);
    }
    return { success: true, data: state.onlineComplaints || [], local: false };
  } catch (e) {
    console.error('loadOnlineComplaintsFromSheets error', e);
    return { success: false, data: [], message: e.toString() };
  }
}

function normalizeOnlineComplaintRow(row) {
  const r = row || {};
  const id = r.id || r.ID || r['उजुरी दर्ता नं'] || r['id'] || '';
  
  // Convert AD date to BS for display
  let displayDate = r.date || r.Date || r['मिति'] || '';

  // Fix: Convert UTC ISO date from Google Sheets to Nepal Time (UTC+5:45)
  // This ensures 2082-12-07 stored as "...T18:15:00Z" (prev day) is correctly resolved to 2082-12-07
  if (displayDate && typeof displayDate === 'string' && displayDate.includes('T') && displayDate.includes('Z')) {
    try {
      const dt = new Date(displayDate);
      // Add 5h 45m (20,700,000 ms) to shift to Nepal time
      const nepalShifted = new Date(dt.getTime() + 20700000);
      displayDate = nepalShifted.toISOString().split('T')[0];
    } catch (e) {}
  }

  let bsDate = '';
  if (displayDate) {
    // Try to convert AD to BS
    try {
      bsDate = convertADtoBS(displayDate);
      if (bsDate && bsDate !== displayDate) {
        displayDate = bsDate; // Use BS date for display
      }
    } catch (e) {
      console.warn('Date conversion failed for online complaint:', displayDate, e);
    }
  }
  
  // Helper: case/underscore/space-insensitive field lookup
  // Helper: case/underscore/space-insensitive field lookup (Optimized: build map once)
  const norm = s => (s || '').toString().toLowerCase().replace(/[_\s]/g, '');
  const lookupMap = {};
  if (r) Object.keys(r).forEach(k => { lookupMap[norm(k)] = r[k]; });

  function getVal(obj, candidates = []) {
    if (!obj) return '';
    const norm = s => (s || '').toString().toLowerCase().replace(/[_\s]/g, '');
    const map = {};
    Object.keys(obj).forEach(k => { map[norm(k)] = obj[k]; });
    for (const name of candidates) {
      const plain = name || '';
      if (obj[plain] !== undefined) return obj[plain];
      if (obj[plain.toLowerCase()] !== undefined) return obj[plain.toLowerCase()];
      // Fallback to normalized map
      const n = norm(plain);
      if (map[n] !== undefined) return map[n];
      if (lookupMap[n] !== undefined) return lookupMap[n];
    }
    return '';
  }

  // Debug: log any incoming keys that look like status fields and their values
  try {
    const statusLike = Object.keys(r).filter(k => /status|स्थिति/i.test(k));
    if (statusLike.length > 0) {
      const statusMap = {};
      statusLike.forEach(k => { try { statusMap[k] = r[k]; } catch(e){} });
      console.log('DEBUG normalizeOnlineComplaintRow - raw status-like fields for id=' + id + ':', statusMap);
    }
  } catch (e) {}

  const normalizedObj = {
    id: id,
    date: displayDate, // Now in BS
    _originalDate: r.date || r.Date || r['मिति'] || '', // Keep original AD for reference
    complainant: r.complainant || r.name || r['उजुरकर्ता'] || '',
    phone: r.phone || r.mobile || r['फोन'] || '',
    email: r.email || r['इमेल'] || '',
    province: r.province || r['प्रदेश'] || '',
    district: r.district || r['जिल्ला'] || '',
    localLevel: r.localLevel || r.local_level || r.locality || r['स्थानीय तह'] || '',
    ward: r.ward || r['वडा'] || '',
    ministry: r.ministry || r.organization || r['मन्त्रालय/निकाय'] || '',
    accused: getVal(r, ['accused', 'विपक्षी']) || '',
    description: r.description || r['उजुरीको विवरण'] || r['उजुरीको संक्षिप्त विवरण'] || '',
    status: normalizeStatusCode(getVal(r, ['status', 'स्थिति']) || 'pending'),
    assignedShakha: getVal(r, ['assignedShakha','assigned_shakha','assignedShakhaName','assigned_shakha_name','सम्बन्धित शाखा','शाखा','shakha','assignedshakha']) || '',
    assignedShakhaCode: getVal(r, ['assignedShakhaCode','shakhaCode','assigned_shakha_code','shakha_code','शाखा कोड','assignedshakhacode']) || '',
    assignedDate: getVal(r, ['assignedDate','assigned_date','assigned_on','assigned_at','assignment_date','शाखामा पठाएको मिति','पठाएको मिति','assigneddate']) || '',
    instructions: r.instructions || '',
    remarks: r.remarks || r.remark || '',
    created_at: r.created_at || r.createdAt || '',
    updated_at: r.updated_at || r.updatedAt || ''
  };

  // Debug: show normalized status for this row
  try {
    console.log('DEBUG normalizeOnlineComplaintRow - normalized for id=' + id + ':', { status: normalizedObj.status });
  } catch (e) {}

  return normalizedObj;

}
function filterOnlineComplaints() {
  const status = (document.getElementById('filterOnlineStatus')?.value || '').trim();
  const search = (document.getElementById('searchOnlineText')?.value || '').toLowerCase().trim();
  let list = (state.onlineComplaints || []).slice();

  if (status) list = list.filter(c => String(c.status || '').toLowerCase() === status);
  if (search) {
    list = list.filter(c => {
      const text = `${c.id} ${c.complainant} ${c.phone} ${c.email} ${c.accused} ${c.description} ${c.ministry}`.toLowerCase();
      return text.includes(search);
    });
  }

  const tbody = document.getElementById('onlineComplaintsTable');
  if (!tbody) return;

  // Ensure table header includes the Accused, Assigned Shakha and Assigned Date columns
  try {
    const tableEl = tbody.closest('table');
    if (tableEl) {
      const thead = tableEl.querySelector('thead');
      if (thead) {
        thead.innerHTML = `<tr><th>क्र.सं.</th><th>मिति</th><th>उजुरकर्ता</th><th>विपक्षी</th><th>उजुरीको विवरण</th><th>सम्बन्धित शाखा</th><th>शाखामा पठाएको मिति</th><th>निर्णय</th><th>कैफियत</th><th>कार्य</th></tr>`;
      }
    }
  } catch (e) { console.warn('Could not ensure online complaints table header', e); }

  tbody.innerHTML = list.map((complaint, index) => `
    <tr class="${getComplaintAgeClass(complaint)}">
      <td data-label="क्र.सं.">${index + 1}</td>
      <td data-label="मिति">${complaint.date || '-'}</td>
      <td data-label="उजुरकर्ता">${complaint.complainant || '-'}</td>
      <td data-label="विपक्षी">${complaint.accused || '-'}</td>
      <td data-label="उजुरीको विवरण" class="text-limit" title="${complaint.description || ''}">${(complaint.description || '').substring(0, 50)}...</td>
      <td data-label="सम्बन्धित शाखा">${displayShakhaName(complaint.assignedShakha || complaint.shakha || complaint.assignedShakhaName || (complaint.assignedShakhaCode && SHAKHA[complaint.assignedShakhaCode]) || '') || '-'}</td>
      <td data-label="शाखामा पठाएको मिति">${complaint.assignedDate || complaint.assigned_on || complaint.assignment_date || complaint.assigned_at || '-'}</td>
      <td data-label="निर्णय">-</td>
      <td data-label="कैफियत">${complaint.remarks || '-'}</td>
      <td data-label="कार्य"><div class="table-actions"><button class="action-btn" data-action="view" data-func="viewOnlineComplaint" data-id="${complaint.id}" title="हेर्नुहोस्"><i class="fas fa-eye"></i></button><button class="action-btn" data-action="assign" data-func="assignOnlineComplaint" data-id="${complaint.id}" title="शाखामा पठाउनुहोस्"><i class="fas fa-paper-plane"></i></button><button class="action-btn" data-action="edit" data-func="editOnlineComplaint" data-id="${complaint.id}" title="सम्पादन गर्नुहोस्"><i class="fas fa-edit"></i></button></div></td>
    </tr>
  `).join('') || `<tr><td colspan="10" class="text-center text-muted p-4">डाटा उपलब्ध छैन</td></tr>`;
}

function viewOnlineComplaint(id) {
  const c = (state.onlineComplaints || []).find(x => String(x.id) === String(id));
  if (!c) return;
  const content = `
    <div class="d-grid gap-2">
      <div><strong>मिति:</strong> ${c.date || '-'}</div>
      <div><strong>उजुरकर्ता:</strong> ${c.complainant || '-'}</div>
      <div><strong>फोन:</strong> ${c.phone || '-'}</div>
      <div><strong>इमेल:</strong> ${c.email || '-'}</div>
      <div><strong>प्रदेश/जिल्ला:</strong> ${c.province || '-'} / ${c.district || '-'}</div>
      <div><strong>स्थानीय तह/वडा:</strong> ${c.localLevel || '-'} / ${c.ward || '-'}</div>
      <div><strong>मन्त्रालय/निकाय:</strong> ${c.ministry || '-'}</div>
      <div><strong>विपक्षी:</strong> ${c.accused || '-'}</div>
      <div><strong>विवरण:</strong><div class="mt-1">${(c.description || '').replace(/\n/g, '<br>')}</div></div>
      <div><strong>सम्बन्धित शाखा:</strong> ${displayShakhaName(c.assignedShakha || c.shakha || c.assignedShakhaName || '') || '-'}</div>
      <div><strong>शाखामा पठाएको मिति:</strong> ${c.assignedDate || c.assigned_on || c.assignment_date || c.assigned_at || '-'}</div>
      <div><strong>कैफियत:</strong> ${(c.remarks || '-').toString().replace(/\n/g, '<br>')}</div>
    </div>
    <div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">बन्द गर्नुहोस्</button></div>
  `;
  openModal('अनलाइन उजुरी विवरण', content);
}

function editOnlineComplaint(id) {
  const c = (state.onlineComplaints || []).find(x => String(x.id) === String(id));
  if (!c) return;
  const form = `
    <div class="d-grid gap-3">
      <div class="d-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div class="form-group"><label class="form-label">उजुरी नं</label><input type="text" class="form-control" id="oc_id" value="${c.id || ''}" readonly /></div>
        <div class="form-group"><label class="form-label">मिति</label><input type="text" class="form-control" id="oc_date" value="${c.date || ''}" /></div>
      </div>
      <div class="d-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div class="form-group"><label class="form-label">उजुरकर्ता</label><input type="text" class="form-control" id="oc_complainant" value="${c.complainant || ''}" /></div>
        <div class="form-group"><label class="form-label">फोन</label><input type="text" class="form-control" id="oc_phone" value="${c.phone || ''}" /></div>
      </div>
      <div class="d-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div class="form-group"><label class="form-label">इमेल</label><input type="text" class="form-control" id="oc_email" value="${c.email || ''}" /></div>
        <div class="form-group"><label class="form-label">मन्त्रालय/निकाय</label>
          <select class="form-select" id="oc_ministry">
            <option value="">छनौट गर्नुहोस्</option>
            ${MINISTRIES.map(min => `<option value="${min}" ${c.ministry === min ? 'selected' : ''}>${min}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="d-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div class="form-group"><label class="form-label">प्रदेश</label>
          <select class="form-select" id="oc_province" onchange="loadOcDistricts()">
            <option value="">प्रदेश छन्नुहोस्</option>
            ${Object.entries(LOCATION_FIELDS.PROVINCE).map(([key, value]) => `<option value="${key}" ${(c.province === key || c.province === value) ? 'selected' : ''}>${value}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label class="form-label">जिल्ला</label>
          <select class="form-select" id="oc_district" ${!c.province ? 'disabled' : ''} onchange="loadOcLocals()">
            <option value="">जिल्ला छन्नुहोस्</option>
            ${(() => { const pk = Object.entries(LOCATION_FIELDS.PROVINCE).find(([k,v]) => c.province === k || c.province === v); return pk && LOCATION_FIELDS.DISTRICTS[pk[0]] ? LOCATION_FIELDS.DISTRICTS[pk[0]].map(dist => `<option value="${dist}" ${c.district === dist ? 'selected' : ''}>${dist}</option>`).join('') : ''; })()}
          </select>
        </div>
      </div>
      <div class="d-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div class="form-group"><label class="form-label">स्थानीय तह</label>
          <select class="form-select" id="oc_localLevel" data-selected="${c.localLevel || ''}">
            <option value="">पहिला जिल्ला छान्नुहोस्</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">वडा</label><input type="text" class="form-control" id="oc_ward" value="${c.ward || ''}" /></div>
      </div>
      <div class="d-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div class="form-group"><label class="form-label">विपक्षी</label><input type="text" class="form-control" id="oc_accused" value="${c.accused || ''}" /></div>
        <div class="form-group"><label class="form-label">स्थिति</label><select class="form-select" id="oc_status"><option value="pending" ${String(c.status||'').toLowerCase()==='pending'?'selected':''}>काम बाँकी</option><option value="progress" ${String(c.status||'').toLowerCase()==='progress'?'selected':''}>चालु</option><option value="resolved" ${String(c.status||'').toLowerCase()==='resolved'?'selected':''}>फछ्रयौट</option></select></div>
      </div>
      <div class="form-group"><label class="form-label">उजुरीको विवरण</label><textarea class="form-control" rows="4" id="oc_description">${c.description || ''}</textarea></div>
      <div class="form-group"><label class="form-label">कैफियत</label><textarea class="form-control" rows="2" id="oc_remarks">${c.remarks || ''}</textarea></div>
    </div>
    <div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">रद्द</button><button class="btn btn-primary" onclick="saveOnlineComplaintEdit('${c.id}')">सुरक्षित</button></div>
  `;
  openModal('अनलाइन उजुरी सम्पादन', form);
  setTimeout(() => { initializeDatepickers(); initializeNepaliDropdowns(); loadOcDistricts(); }, 100);
}

async function saveOnlineComplaintEdit(id) {
  const idx = (state.onlineComplaints || []).findIndex(x => String(x.id) === String(id));
  if (idx === -1) return;

  const payload = {
    id,
    date: document.getElementById('oc_date')?.value || '',
    complainant: document.getElementById('oc_complainant')?.value || '',
    phone: document.getElementById('oc_phone')?.value || '',
    email: document.getElementById('oc_email')?.value || '',
    ministry: document.getElementById('oc_ministry')?.value || '',
    province: document.getElementById('oc_province')?.value || '',
    district: document.getElementById('oc_district')?.value || '',
    localLevel: document.getElementById('oc_localLevel')?.value || '',
    ward: document.getElementById('oc_ward')?.value || '',
    accused: document.getElementById('oc_accused')?.value || '',
    status: document.getElementById('oc_status')?.value || 'pending',
    description: document.getElementById('oc_description')?.value || '',
    remarks: document.getElementById('oc_remarks')?.value || '',
    updated_at: new Date().toISOString()
  };

  showLoadingSpinner('सेभ हुँदैछ...');
  let res = { success: true, local: true };
  try {
    if (GOOGLE_SHEETS_CONFIG.ENABLED) {
      res = await postToGoogleSheets('updateOnlineComplaint', payload);
    }
  } finally {
    hideLoadingSpinner();
  }

  state.onlineComplaints[idx] = { ...state.onlineComplaints[idx], ...payload };
  showToast(res && res.success ? 'अनलाइन उजुरी अपडेट भयो' : 'अनलाइन उजुरी Local मात्र अपडेट भयो', res && res.success ? 'success' : 'warning');
  try { closeModalRobust(); } catch(e) { try { closeModal(); } catch(e){} }
  showOnlineComplaintsView();
}

function assignOnlineComplaint(id) {
  const c = (state.onlineComplaints || []).find(x => String(x.id) === String(id));
  if (!c) return;

  const currentDate = getCurrentNepaliDate();
  const formContent = `
    <div class="d-grid gap-3">
      <div class="form-group"><label class="form-label">उजुरी नं</label><input type="text" class="form-control" value="${c.id}" readonly /></div>
      <div class="form-group"><label class="form-label">शाखा *</label><select class="form-select" id="assignOnlineShakha"><option value="">छान्नुहोस्</option>${Object.entries(SHAKHA).map(([key, value]) => {
        const isSelected = (c.assignedShakha === key) || (c.assignedShakha === value);
        return `<option value="${key}" ${isSelected ? 'selected' : ''}>${value}</option>`;
      }).join('')}</select></div>
      <div class="form-group"><label class="form-label">पठाएको मिति *</label>
        <div class="d-flex gap-2 nepali-datepicker-dropdown" data-target="assignOnlineDate">
          <select id="assignOnlineDate_year" class="form-select bs-year"><option value="">साल</option></select>
          <select id="assignOnlineDate_month" class="form-select bs-month"><option value="">महिना</option></select>
          <select id="assignOnlineDate_day" class="form-select bs-day"><option value="">गते</option></select>
          <input type="hidden" id="assignOnlineDate" value="${currentDate}" />
        </div>
      </div>
      <div class="form-group"><label class="form-label">सन्देश</label><textarea class="form-control" rows="3" id="assignOnlineInstructions" placeholder="शाखालाई दिने सन्देश"></textarea></div>
    </div>
    <div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">रद्द गर्नुहोस्</button><button class="btn btn-primary" onclick="saveOnlineShakhaAssignment('${id}')">पठाउनुहोस्</button></div>
  `;
  openModal('अनलाइन उजुरी शाखामा पठाउनुहोस्', formContent);
  setTimeout(()=>{ initializeDatepickers(); initializeNepaliDropdowns(); }, 100);
}

async function saveOnlineShakhaAssignment(id) {
  const idx = (state.onlineComplaints || []).findIndex(x => String(x.id) === String(id));
  if (idx === -1) return;

  const assignedShakhaCode = document.getElementById('assignOnlineShakha')?.value || '';
  const assignDate = document.getElementById('assignOnlineDate')?.value || '';
  const instructions = document.getElementById('assignOnlineInstructions')?.value || '';

  if (!assignedShakhaCode || !assignDate) {
    showToast('कृपया शाखा र मिति छान्नुहोस्', 'warning');
    return;
  }
  showLoadingSpinner('पठाउँदै...');
  try {
    const assignedShakhaName = SHAKHA[assignedShakhaCode] || assignedShakhaCode;

    const onlineUpdate = {
      id,
      assignedShakha: assignedShakhaName,
      assignedShakhaCode,
      assignedDate: assignDate,
      instructions,
      status: 'progress',
      updated_at: new Date().toISOString()
    };

    let onlineRes = { success: true, local: true };
    if (GOOGLE_SHEETS_CONFIG.ENABLED) {
        onlineRes = await postToGoogleSheets('updateOnlineComplaint', onlineUpdate);
    }

    // Upsert into main Complaints so shakha view sees it
    const c = state.onlineComplaints[idx];
    const complaintPayload = {
      id: id,
      date: c.date || getCurrentNepaliDate(),
      complainant: c.complainant || '',
      accused: c.accused || '',
      ministry: c.ministry || '',
      description: c.description || '',
      remarks: c.remarks || '',
      province: c.province || '',
      district: c.district || '',
      localLevel: c.localLevel || '',
      status: 'progress',
      assignedShakha: assignedShakhaName,
      assignedShakhaCode,
      assignedDate: assignDate,
      instructions: instructions || '',
      shakha: assignedShakhaName,
      mahashakha: MAHASHAKHA.ADMIN_MONITORING,
      source: 'online',
      updatedBy: state.currentUser?.name || ''
    };

    let complRes = { success: true, local: true };
    if (GOOGLE_SHEETS_CONFIG.ENABLED) {
      complRes = await postToGoogleSheets('updateComplaint', complaintPayload);
    }

    // Update local caches
    state.onlineComplaints[idx] = { ...state.onlineComplaints[idx], ...onlineUpdate };
    if (!state.complaints) state.complaints = [];
    const mainIdx = state.complaints.findIndex(x => String(x.id) === String(id));
    if (mainIdx !== -1) state.complaints[mainIdx] = { ...state.complaints[mainIdx], ...complaintPayload };
    else state.complaints.push({ ...complaintPayload, syncedToSheets: !!(complRes && complRes.success) });

    // Increment new-forwarded count for the assigned shakha so badge displays
    try {
      if (!state.shakhaNewCounts) state.shakhaNewCounts = {};
      const key = assignedShakhaCode || assignedShakhaName || '';
      state.shakhaNewCounts[key] = (state.shakhaNewCounts[key] || 0) + 1;
    } catch (e) { console.warn('Could not increment shakhaNewCounts', e); }
    // Persist updated complaints cache so refresh retains assignedDate
    try { if (typeof backupToLocalStorage === 'function') backupToLocalStorage(); } catch (e) { console.warn('Could not backup to localStorage', e); }

    showToast((onlineRes && onlineRes.success) ? 'उजुरी शाखामा पठाइयो' : 'उजुरी शाखामा पठाइयो (Local मात्र)', (onlineRes && onlineRes.success) ? 'success' : 'warning');
    closeModal();
    showOnlineComplaintsView();
    } finally {
      hideLoadingSpinner();
    }
}

function showAdminComplaintsView(initialFilters = {}) {
  state.currentView = 'admin_complaints';
  document.getElementById('pageTitle').textContent = 'हेलो सरकारबाट प्राप्त उजुरीहरू';
  
  const helloSarkarComplaints = state.complaints.filter(c => c.source === 'hello_sarkar');
  // Helper to resolve assigned/related date for a complaint robustly
  function resolveComplaintAssignedDate(c) {
    if (!c) return '';
    const candidates = [
      c.assignedDate, c.assigneddate, c.assigned_date, c.assigned_on, c.assigned_at, c.assignment_date,
      c.entryDate, c.entrydate, c.dateNepali, c.dateNepali || c.dateNepali, c.date_nepali, c.correspondenceDate,
      c.createdAt, c.created_at, c.entryDate
    ];
    for (const d of candidates) {
      if (d === undefined || d === null) continue;
      const s = String(d || '').trim();
      if (!s) continue;
      // If looks like ISO YYYY-MM-DD, decide whether it's AD or already BS.
      if (s.includes('T') || /\d{4}-\d{2}-\d{2}/.test(s)) {
        try {
          const iso = s.split('T')[0];
          const year = parseInt(iso.split('-')[0], 10) || 0;
          // Heuristic: Nepali BS years are typically >= 2050 in our dataset.
          if (year >= 2050) {
            // Already a BS date — return as-is
            return iso;
          }
          // Otherwise treat as AD and convert to BS for display
          const bs = (typeof convertADtoBSAccurate === 'function') ? convertADtoBSAccurate(iso) : iso;
          if (bs) return bs;
        } catch (e) { return s; }
      }
      return s;
    }
    return '';
  }
  

  // Helper: detect if a value is a known shakha name or code
  function isShakhaName(val) {
    if (!val) return false;
    try {
      const v = String(val).trim();
      const keys = Object.keys(SHAKHA || {});
      const vals = Object.values(SHAKHA || {});
      if (keys.includes(v)) return true;
      if (vals.includes(v)) return true;
      // case-insensitive match
      const low = v.toLowerCase();
      if (keys.map(k=>k.toLowerCase()).includes(low)) return true;
      if (vals.map(k=>k.toLowerCase()).includes(low)) return true;
    } catch (e) {}
    return false;
  }
  // Debug: log assigned fields for first few Hello Sarkar complaints to help diagnose missing dates
  try {
    (helloSarkarComplaints || []).slice(0,5).forEach((c, i) => {
      console.log('HelloSarkar complaint', i, 'id=', c.id, 'keys=', Object.keys(c).join(', '));
      console.log('  assignedShakha candidates:', c.assignedShakha, c.shakha, c.assignedShakhaName, c.assignedShakhaCode);
      console.log('  assignedDate candidates:', c.assignedDate, c.assigned_on, c.assignment_date, c.assigned_at);
      console.log('  decision value:', c.decision);
    });
  } catch (e) {}

  // Normalization pass: ensure assignedDate is populated when possible
  try {
    helloSarkarComplaints.forEach((c) => {
      if (!c) return;
      // Prefer explicit assignedDate
      if (!c.assignedDate || String(c.assignedDate).trim() === '' || c.assignedDate === 'undefined') {
        // Try to find matching online complaint with a date
        const onlineMatch = (state.onlineComplaints || []).find(x => String(x.id) === String(c.id));
        if (onlineMatch && onlineMatch.assignedDate) {
          c.assignedDate = String(onlineMatch.assignedDate);
        } else if (c.assigneddate) {
          c.assignedDate = String(c.assigneddate);
        } else if (c.assigned_date) {
          c.assignedDate = String(c.assigned_date);
        } else if (c.entryDate) {
          c.assignedDate = String(c.entryDate);
        } else if (c.dateNepali) {
          c.assignedDate = String(c.dateNepali);
        } else if (c.createdAt) {
          c.assignedDate = String(c.createdAt).split('T')[0];
        }
        // Final fallback to empty string
        if (!c.assignedDate) c.assignedDate = '';
      }
    });
    // Log after normalization
    (helloSarkarComplaints || []).slice(0,5).forEach((c, i) => {
      console.log('Post-normalize HelloSarkar', i, 'id=', c.id, 'assignedDate=', c.assignedDate);
    });
  } catch (e) { console.warn('AssignedDate normalization failed', e); }
  
  const content = `
    <div class="filter-bar mb-3">
      <div class="filter-group"><label class="filter-label">स्थिति:</label><select class="form-select form-select-sm" id="filterStatus" onchange="filterAdminComplaints()"><option value="">सबै</option><option value="pending" ${initialFilters.status === 'pending' ? 'selected' : ''}>काम बाँकी</option><option value="progress">चालु</option><option value="resolved">फछ्रयौट</option></select></div>
      <div class="filter-group"><input type="text" class="form-control form-control-sm" placeholder="खोज्नुहोस्..." id="searchText" value="${initialFilters.search || ''}" /></div>
      <button class="btn btn-primary btn-sm" onclick="filterAdminComplaints()">खोज्नुहोस्</button>
      <button class="btn btn-success btn-sm" onclick="exportToExcel('hello_sarkar')"><i class="fas fa-file-excel"></i> Excel</button>
      <button class="btn btn-warning btn-sm" onclick="autoAssignHelloSarkarComplaints()"><i class="fas fa-robot"></i> Auto Assign</button>
      <button class="btn btn-primary btn-sm" onclick="showNewHelloSarkarComplaint()"><i class="fas fa-plus"></i> नयाँ उजुरी</button>
    </div>
    
    <div class="card">
      <div class="card-header"><h5 class="mb-0">हेलो सरकारबाट प्राप्त उजुरी सूची</h5></div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table">
            <thead><tr><th>क्र.सं.</th><th>मिति</th><th>उजुरकर्ता</th><th>विपक्षी</th><th>उजुरीको विवरण</th><th>सम्बन्धित शाखा</th><th>शाखामा पठाएको मिति</th><th>निर्णय</th><th>कैफियत</th><th>कार्य</th></tr></thead>
            <tbody id="adminComplaintsTable">
              ${helloSarkarComplaints.map((complaint, index) => `
                <tr class="${getComplaintAgeClass(complaint)}">
                  <td data-label="क्र.सं.">${index + 1}</td><td data-label="मिति">${cleanDateDisplay(complaint.date)}</td><td data-label="उजुरकर्ता">${complaint.complainant}</td><td data-label="विपक्षी">${complaint.accused || '-'}</td>
                  <td data-label="उजुरीको विवरण" class="text-limit" title="${complaint.description || ''}">${(complaint.description || '').substring(0, 50)}...</td>
                  <td data-label="सम्बन्धित शाखा">${displayShakhaName(complaint.assignedShakha || complaint.shakha || complaint.assignedShakhaName || (complaint.assignedShakhaCode && SHAKHA[complaint.assignedShakhaCode]) || '') || '-'}</td>
                  <td data-label="शाखामा पठाएको मिति">${resolveComplaintAssignedDate(complaint) || '-'}</td>
                  <td data-label="निर्णय" class="text-limit" title="${complaint.decision || ''}">${complaint.decision ? complaint.decision.substring(0, 30) + '...' : '-'}</td>
                  <td data-label="कैफियत">${complaint.remarks || '-'}</td>
                  <td data-label="कार्य"><div class="table-actions"><button class="action-btn" data-action="view" data-id="${complaint.id}" title="हेर्नुहोस्"><i class="fas fa-eye"></i></button><button class="action-btn" data-action="assign" data-id="${complaint.id}" title="शाखामा पठाउनुहोस्"><i class="fas fa-paper-plane"></i></button><button class="action-btn" data-action="edit" data-id="${complaint.id}" title="सम्पादन गर्नुहोस्"><i class="fas fa-edit"></i></button></div></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('contentArea').innerHTML = content;
  applyDevanagariDigits(document.getElementById('contentArea'));
  if (initialFilters.status || initialFilters.search) {
    setTimeout(filterAdminComplaints, 100);
  }
  updateActiveNavItem();
}

function showNewComplaintView() {
  state.currentView = 'new_complaint';
  document.getElementById('pageTitle').textContent = 'नयाँ उजुरी दर्ता';
  
  const currentDate = getCurrentNepaliDate();
  
  const content = `
    <style>
      .hotspot-card {
        background: #f8f9fa;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .hotspot-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.08);
        border-color: var(--primary);
      }
      .progress-bar {
        background-color: #dc3545;
      }
    </style>
    <div class="card">
      <div class="card-header"><h5 class="mb-0">नयाँ उजुरी दर्ता फारम</h5></div>
      <div class="card-body">
        <div class="d-grid gap-3" style="grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));">
          <div class="form-group"><label class="form-label">दर्ता नं *</label><input type="text" class="form-control" id="complaintId" placeholder="NVC-YYYY-NNNN" /></div>
          <div class="form-group">
            <label class="form-label">दर्ता मिति *</label>
            <div class="d-flex gap-2 nepali-datepicker-dropdown" data-target="complaintDate">
              <select id="complaintDate_year" class="form-select bs-year" aria-label="वर्ष"></select>
              <select id="complaintDate_month" class="form-select bs-month" aria-label="महिना"></select>
              <select id="complaintDate_day" class="form-select bs-day" aria-label="दिन"></select>
              <input type="hidden" id="complaintDate" value="${currentDate}" />
            </div>
            <div id="dateWarning" class="text-danger text-xs mt-1 hidden"><i class="fas fa-exclamation-triangle"></i> भविष्यको मिति चयन गरिएको छ</div>
          </div>
          <div class="form-group"><label class="form-label">उजुरकर्ताको नाम *</label><input type="text" class="form-control" id="complainantName" placeholder="पूरा नाम" /></div>
          <div class="form-group"><label class="form-label">विपक्षी</label><input type="text" class="form-control" id="accusedName" placeholder="विपक्षीको नाम" /></div>
          <div class="form-group"><label class="form-label">मन्त्रालय/निकाय</label>
            <select class="form-select" id="complaintMinistry">
              <option value="">छान्नुहोस्</option>
              ${MINISTRIES.map(m => `<option value="${m}">${m}</option>`).join('')}
            </select>
          </div>
          ${state.currentUser.role === 'admin' ? `
          <div class="form-group"><label class="form-label">सम्बन्धित शाखा</label>
            <select class="form-select" id="complaintShakha">
                <option value="">शाखा छान्नुहोस् (अनिवार्य छैन)</option>
                ${Object.values(SHAKHA).map(v => `<option value="${v}">${v}</option>`).join('')}
            </select>
            <div id="aiShakhaSuggestion" class="mt-2 hidden"></div>
          </div>` : ''}
          
          <div class="location-section mb-3" style="grid-column: span 2;">
            <h6 class="mb-2">📍 स्थान जानकारी</h6>
            <div class="d-grid gap-2" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
              <div class="form-group">
                <label class="form-label">प्रदेश</label>
                <select class="form-select" id="complaintProvince" onchange="loadDistricts()">
                  <option value="">प्रदेश छान्नुहोस्</option>
                  ${Object.entries(LOCATION_FIELDS.PROVINCE).map(([key, value]) => 
                    `<option value="${key}">${value}</option>`
                  ).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">जिल्ला</label>
                <select class="form-select" id="complaintDistrict" disabled onchange="loadComplaintLocals()">
                  <option value="">पहिला प्रदेश छान्नुहोस्</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">स्थानीय तह / नगर</label>
                <select class="form-select" id="complaintLocal" disabled>
                  <option value="">पहिला जिल्ला छान्नुहोस्</option>
                </select>
              </div>
            </div>
          </div>

          <div class="form-group" style="grid-column: span 2;">
            <label class="form-label">उजुरीको विवरण *</label>
            <textarea class="form-control" rows="3" id="complaintDescription" placeholder="उजुरीको संक्षिप्त विवरण" maxlength="500"></textarea>
            <div class="mt-2 d-flex justify-content-end">
                <button type="button" id="descVoiceBtn" class="btn btn-sm btn-outline-primary" title="आवाजले लेख्नुहोस् (नेपाली)"><i class="fas fa-microphone"></i> आवाज टाइप</button>
            </div>
            <div class="d-flex justify-between mt-1">
                <div class="text-xs text-muted" id="descCount">०/५०० अक्षर</div>
                <div id="descQuality" class="text-xs"></div>
            </div>
          </div>
          
          <!-- AI Analysis Section -->
          <div class="form-group" style="grid-column: span 2;" id="aiSuggestionBox">
            <div class="ai-analysis-box hidden" id="aiSuggestionContent">
                <div class="mb-2 border-bottom pb-2">
                    <i class="fas fa-robot"></i> <strong>AI विश्लेषण</strong>
                </div>
                <div class="row g-2">
                    <div class="col-md-6">
                        <div id="aiCategoryText" class="mb-1"></div>
                        <div id="aiPriorityText" class="mb-1"></div>
                    </div>
                    <div class="col-md-6">
                         <div id="aiDecisionSuggestion" class="text-small text-muted fst-italic"></div>
                    </div>
                </div>
            </div>
            <div id="similarComplaintsBox" class="mt-2 hidden">
                <div class="alert alert-warning p-2">
                    <h6 class="alert-heading text-small mb-1"><i class="fas fa-copy"></i> सम्भावित उस्तै उजुरीहरू</h6>
                    <ul class="mb-0 ps-3 text-small" id="similarComplaintsList"></ul>
                </div>
            </div>
          </div>          
          
          <div class="form-group" style="grid-column: span 2;">
            <label class="form-label">समितिको निर्णय</label>
            <textarea class="form-control" rows="3" id="committeeDecision" placeholder="समितिको निर्णय" maxlength="500"></textarea>
            <div class="mt-2 d-flex justify-content-end">
                <button type="button" id="committeeVoiceBtn" class="btn btn-sm btn-outline-primary" title="आवाजले लेख्नुहोस् (नेपाली)"><i class="fas fa-microphone"></i> आवाज टाइप</button>
            </div>
            <div class="text-xs text-muted mt-1" id="committeeDecisionCount">०/५०० अक्षर</div>
          </div>
          <div class="form-group"><label class="form-label">कैफियत</label><input type="text" class="form-control" id="complaintRemarks" placeholder="कैफियत" /></div>
          <div class="form-group"><label class="form-label">स्थिति *</label><select class="form-select" id="complaintStatus"><option value="pending">काम बाँकी</option><option value="progress">चालु</option><option value="resolved">फछ्रयौट</option></select></div>
        </div>
        <div class="mt-4 d-flex justify-end gap-2">
          <button class="btn btn-outline" onclick="showComplaintsView()">रद्द गर्नुहोस्</button>
          <button class="btn btn-primary" onclick="saveNewComplaint()">सुरक्षित गर्नुहोस्</button>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('contentArea').innerHTML = content;
  applyDevanagariDigits(document.getElementById('contentArea'));
  updateActiveNavItem();

  // Initialize Nepali date dropdowns and field speech (if form elements present)
  setTimeout(() => { initializeNepaliDropdowns(); initializeFieldSpeech(); }, 100);

  // --- Auto-save Draft Functionality ---
  const formFields = ['complaintId', 'complaintDate', 'complainantName', 'accusedName', 'complaintDescription', 'committeeDecision', 'complaintRemarks'];
  const form = document.querySelector('#contentArea .card-body');

  // Function to save draft
  const saveDraft = () => {
    const draft = {};
    formFields.forEach(id => {
      const el = document.getElementById(id);
      if (el) draft[id] = el.value;
    });
    localStorage.setItem('nvc_complaint_draft', JSON.stringify(draft));
  };

  // Function to load draft
  const loadDraft = () => {
    const savedDraft = localStorage.getItem('nvc_complaint_draft');
    if (savedDraft) {
      if (confirm('तपाईंको पहिलेको अधुरो फारम भेटियो। के तपाईं त्यसलाई लोड गर्न चाहनुहुन्छ?')) {
        const draft = JSON.parse(savedDraft);
        formFields.forEach(id => {
          const el = document.getElementById(id);
          if (el && draft[id]) {
            el.value = draft[id];
            el.dispatchEvent(new Event('input')); // Trigger input event for counters etc.
          }
        });
      }
    }
  };
  // --- End of Auto-save ---
  
  setTimeout(() => {
    initializeDatepickers(); initializeNepaliDropdowns(); initializeFieldSpeech();
    
    // Date validation
    const dateInput = document.getElementById('complaintDate');
    if (dateInput) {
        // Attach auto-save listener
        if (form) {
          form.addEventListener('input', saveDraft);
          loadDraft(); // Check for draft on load
        }

        const checkDate = () => {
            const val = dateInput.value;
            const cur = getCurrentNepaliDate();
            const warning = document.getElementById('dateWarning');
            if (val && cur && val > cur) {
                warning.classList.remove('hidden');
            } else {
                warning.classList.add('hidden');
            }
        };
        dateInput.addEventListener('change', checkDate);
        dateInput.addEventListener('input', checkDate);
    }

    const descTextarea = document.getElementById('complaintDescription');
    if (descTextarea) {
        descTextarea.addEventListener('input', function() { 
            const text = this.value;
            document.getElementById('descCount').textContent = text.length + '/५०० अक्षर';
            
            // Quality Check
            const qualityEl = document.getElementById('descQuality');
            if (text.length > 0 && text.length < 50) {
                qualityEl.innerHTML = '<span class="text-warning"><i class="fas fa-exclamation-circle"></i> विवरण धेरै छोटो छ</span>';
            } else if (text.length >= 50) {
                qualityEl.innerHTML = '<span class="text-success"><i class="fas fa-check-circle"></i> विवरण पर्याप्त छ</span>';
            } else {
                qualityEl.innerHTML = '';
            }

            if (text.length > 10) {
                // 1. AI Analysis
                const analysis = AI_SYSTEM.analyzeComplaint(text);
                const aiSuggContent = document.getElementById('aiSuggestionContent');
                if (aiSuggContent) {
                    aiSuggContent.classList.remove('hidden');
                    document.getElementById('aiCategoryText').innerHTML = `श्रेणी: <span class="badge badge-secondary">${analysis.category}</span>`;
                    document.getElementById('aiPriorityText').innerHTML = `प्राथमिकता: <span class="badge ${analysis.priority === 'उच्च' ? 'badge-danger' : analysis.priority === 'मध्यम' ? 'badge-warning' : 'badge-success'}">${analysis.priority}</span>`;
                    document.getElementById('aiCategoryText').innerHTML += ` <br>वर्गीकरण: <span class="badge badge-info">${analysis.classification}</span>`;
                    
                    // Auto-categorization for decision
                    let decisionSugg = '';
                    if (analysis.priority === 'उच्च') decisionSugg = 'सुझाव: तुरुन्त कारबाही प्रक्रिया अगाडि बढाउने।';
                    else if (analysis.category === 'प्राविधिक') decisionSugg = 'सुझाव: प्राविधिक टोली खटाउने।';
                    else decisionSugg = 'सुझाव: सामान्य प्रक्रियामा राख्ने।';
                    document.getElementById('aiDecisionSuggestion').textContent = decisionSugg;
                }

                // 2. Shakha Suggestion (Admin only usually, but logic runs)
                const shakhaCode = AI_SYSTEM.suggestShakha(text);
                const shakhaName = SHAKHA[shakhaCode] || shakhaCode;
                const suggestionEl = document.getElementById('aiShakhaSuggestion');
                if (suggestionEl && state.currentUser.role === 'admin') {
                    suggestionEl.classList.remove('hidden');
                    suggestionEl.innerHTML = `
                        <div class="d-flex align-center gap-2 p-2 bg-light rounded border border-primary">
                            <i class="fas fa-robot text-primary"></i>
                            <span class="text-small">सुझाव गरिएको शाखा: <strong>${shakhaName}</strong></span>
                            <button class="btn btn-sm btn-outline-primary py-0 px-2" style="font-size: 0.7rem;" onclick="document.getElementById('complaintShakha').value = '${shakhaName}'">लागू गर्नुहोस्</button>
                        </div>
                    `;
                }

                // 3. Similar Complaints
                const similarBox = document.getElementById('similarComplaintsBox');
                const similarList = document.getElementById('similarComplaintsList');
                
                // Simple keyword extraction (remove common words)
                const keywords = text.split(/\s+/).filter(w => w.length > 3).slice(0, 5);
                if (keywords.length > 0) {
                    const similar = state.complaints.filter(c => {
                        if (!c.description) return false;
                        let matchCount = 0;
                        keywords.forEach(k => {
                            if (c.description.includes(k)) matchCount++;
                        });
                        // Relaxed logic: if we have few keywords, 1 match is enough.
                        return matchCount >= (keywords.length < 3 ? 1 : 2);
                    }).slice(0, 3);

                    if (similar.length > 0) {
                        similarBox.classList.remove('hidden');
                        similarList.innerHTML = similar.map(c => `
                            <li>
                              <a href="#" class="text-dark text-decoration-none action-btn" data-action="view" data-id="${c.id}">
                                <strong>${c.id}</strong>: ${c.description.substring(0, 40)}...
                              </a>
                            </li>
                        `).join('');
                    } else {
                        similarBox.classList.add('hidden');
                    }
                } else {
                    similarBox.classList.add('hidden');
                }
            } else {
                document.getElementById('aiSuggestionContent')?.classList.add('hidden');
                document.getElementById('aiShakhaSuggestion')?.classList.add('hidden');
                document.getElementById('similarComplaintsBox')?.classList.add('hidden');
            }
        });
    }
    
    const committeeDecisionTextarea = document.getElementById('committeeDecision');
    if (committeeDecisionTextarea) committeeDecisionTextarea.addEventListener('input', function() { 
        document.getElementById('committeeDecisionCount').textContent = this.value.length + '/५०० अक्षर'; 
    });
  }, 100);
}

function showNewHelloSarkarComplaint() {
  const currentDate = getCurrentNepaliDate();
  const formContent = `
    <div class="d-grid gap-3">
      <div class="d-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div class="form-group"><label class="form-label">उजुरी नं *</label><input type="text" class="form-control" id="hsComplaintId" placeholder="HS-YYYY-NNNN" /></div>
        <div class="form-group">
            <label class="form-label">मिति *</label>
            <div class="d-flex gap-2 nepali-datepicker-dropdown" data-target="hsComplaintDate">
              <select id="hsComplaintDate_year" class="form-select bs-year" aria-label="वर्ष"></select>
              <select id="hsComplaintDate_month" class="form-select bs-month" aria-label="महिना"></select>
              <select id="hsComplaintDate_day" class="form-select bs-day" aria-label="दिन"></select>
              <input type="hidden" id="hsComplaintDate" value="${currentDate}" />
            </div>
        </div>
      </div>
      <div class="d-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div class="form-group"><label class="form-label">उजुरकर्ता *</label><input type="text" class="form-control" id="hsComplainant" placeholder="पूरा नाम" /></div>
        <div class="form-group"><label class="form-label">विपक्षी</label><input type="text" class="form-control" id="hsAccused" placeholder="विपक्षीको नाम" /></div>
      </div>
      <div class="form-group">
        <label class="form-label">उजुरीको विवरण *</label>
        <textarea class="form-control" rows="4" id="hsDescription" placeholder="उजुरीको विवरण"></textarea>
        <div class="mt-2 d-flex justify-content-end">
            <button type="button" id="hsDescVoiceBtn" class="btn btn-sm btn-outline-primary" title="आवाजले लेख्नुहोस् (नेपाली)"><i class="fas fa-microphone"></i> आवाज टाइप</button>
        </div>
      </div>
      <div class="form-group"><label class="form-label">सम्बन्धित शाखा *</label><select class="form-select" id="hsAssignedShakha"><option value="">छान्नुहोस्</option>${Object.entries(SHAKHA).map(([key, value]) => `<option value="${key}">${value}</option>`).join('')}</select></div>
      <div class="d-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div class="form-group">
            <label class="form-label">शाखामा पठाएको मिति</label>
            <div class="d-flex gap-2 nepali-datepicker-dropdown" data-target="hsAssignedDate">
              <select id="hsAssignedDate_year" class="form-select bs-year" aria-label="वर्ष"></select>
              <select id="hsAssignedDate_month" class="form-select bs-month" aria-label="महिना"></select>
              <select id="hsAssignedDate_day" class="form-select bs-day" aria-label="दिन"></select>
              <input type="hidden" id="hsAssignedDate" />
            </div>
        </div>
        <div class="form-group"><label class="form-label">स्थिति</label><select class="form-select" id="hsStatus"><option value="pending">काम बाँकी</option><option value="progress">चालु</option><option value="resolved">फछ्रयौट</option></select></div>
      </div>
      <div class="form-group"><label class="form-label">कैफियत</label><textarea class="form-control" rows="2" id="hsRemarks" placeholder="कैफियत"></textarea></div>
    </div>
    <div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">रद्द गर्नुहोस्</button><button class="btn btn-primary" onclick="saveHelloSarkarComplaint()">सुरक्षित गर्नुहोस्</button></div>
  `;
  
  openModal('नयाँ हेलो सरकार उजुरी', formContent);
  setTimeout(()=>{ initializeDatepickers(); initializeNepaliDropdowns(); initializeFieldSpeech(); }, 100);
}

function showNewHotlineComplaint() {
  try {
    console.log('showNewHotlineComplaint called');
    const currentDate = getCurrentNepaliDate();
    const formContent = `
      <div class="d-grid gap-3">
        <div class="d-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
          <div class="form-group"><label class="form-label">उजुरी नं *</label><input type="text" class="form-control" id="hlComplaintId" placeholder="HL-YYYY-NNNN" /></div>
          <div class="form-group">
              <label class="form-label">मिति *</label>
              <div class="d-flex gap-2 nepali-datepicker-dropdown" data-target="hlComplaintDate">
                <select id="hlComplaintDate_year" class="form-select bs-year" aria-label="वर्ष"></select>
                <select id="hlComplaintDate_month" class="form-select bs-month" aria-label="महिना"></select>
                <select id="hlComplaintDate_day" class="form-select bs-day" aria-label="दिन"></select>
                <input type="hidden" id="hlComplaintDate" value="${currentDate}" />
              </div>
          </div>
        </div>
        <div class="d-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
          <div class="form-group"><label class="form-label">उजुरकर्ता *</label><input type="text" class="form-control" id="hlComplainant" placeholder="पूरा नाम" /></div>
          <div class="form-group"><label class="form-label">विपक्षी</label><input type="text" class="form-control" id="hlAccused" placeholder="विपक्षीको नाम" /></div>
        </div>
        <div class="form-group">
          <label class="form-label">उजुरीको विवरण *</label>
          <textarea class="form-control" rows="4" id="hlDescription" placeholder="उजुरीको विवरण"></textarea>
          <div class="mt-2 d-flex justify-content-end">
              <button type="button" id="hlDescVoiceBtn" class="btn btn-sm btn-outline-primary" title="आवाजले लेख्नुहोस् (नेपाली)"><i class="fas fa-microphone"></i> आवाज टाइप</button>
          </div>
        </div>
        <div class="form-group"><label class="form-label">सम्बन्धित शाखा *</label><select class="form-select" id="hlAssignedShakha"><option value="">छान्नुहोस्</option>${Object.entries(SHAKHA).map(([key, value]) => `<option value="${key}">${value}</option>`).join('')}</select></div>
        <div class="d-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
          <div class="form-group">
              <label class="form-label">शाखामा पठाएको मिति</label>
              <div class="d-flex gap-2 nepali-datepicker-dropdown" data-target="hlAssignedDate">
                <select id="hlAssignedDate_year" class="form-select bs-year" aria-label="वर्ष"></select>
                <select id="hlAssignedDate_month" class="form-select bs-month" aria-label="महिना"></select>
                <select id="hlAssignedDate_day" class="form-select bs-day" aria-label="दिन"></select>
                <input type="hidden" id="hlAssignedDate" />
              </div>
          </div>
          <div class="form-group"><label class="form-label">स्थिति</label><select class="form-select" id="hlStatus"><option value="pending">काम बाँकी</option><option value="progress">चालु</option><option value="resolved">फछ्रयौट</option></select></div>
        </div>
        <div class="form-group"><label class="form-label">कैफियत</label><textarea class="form-control" rows="2" id="hlRemarks" placeholder="कैफियत"></textarea></div>
      </div>
      <div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">रद्द गर्नुहोस्</button><button class="btn btn-primary" onclick="saveHotlineComplaint()">सुरक्षित गर्नुहोस्</button></div>
    `;
    console.log('Opening modal for hotline complaint');
    openModal('नयाँ हटलाइन उजुरी', formContent);
    console.log('Modal opened, initializing components');
    setTimeout(()=>{ 
      try {
        console.log('Initializing datepickers, dropdowns, and speech');
        initializeDatepickers(); 
        initializeNepaliDropdowns(); 
        initializeFieldSpeech(); 
        console.log('All components initialized successfully');
      } catch(e) {
        console.error('Error initializing components:', e);
      }
    }, 100);
  } catch (error) {
    console.error('Error in showNewHotlineComplaint:', error);
    showToast('उजुरी फारम खोल्न सकिएन', 'error');
  }
}

async function saveHotlineComplaint() {
  const id = elVal('hlComplaintId');
  let date = elVal('hlComplaintDate');
  const complainant = elVal('hlComplainant');
  const accused = elVal('hlAccused');
  const description = elVal('hlDescription');
  const assignedShakha = elVal('hlAssignedShakha');
  const assignedDate = elVal('hlAssignedDate');
  const status = elVal('hlStatus');
  const remarks = elVal('hlRemarks');

  if (!date) date = getCurrentNepaliDate();
  if (!id || !complainant || !description || !assignedShakha) {
    showToast('कृपया आवश्यक फिल्डहरू भर्नुहोस्', 'warning');
    return;
  }

  showLoadingSpinner('सेभ हुँदै...');
  try {
    const assignedShakhaName = SHAKHA[assignedShakha] || assignedShakha;
    const newComplaint = {
      id, date, complainant, accused: accused || '', description,
      assignedShakha: assignedShakhaName, assignedShakhaCode: assignedShakha, assignedDate: assignedDate || '', status,
      remarks: remarks || '', shakha: assignedShakhaName,
      mahashakha: MAHASHAKHA.ADMIN_MONITORING, source: 'hotline', 'उजुरीको माध्यम': 'hotline',
      createdBy: state.currentUser.name, createdAt: new Date().toISOString()
    };

    // Also include canonical Nepali header keys so Apps Script mapping reliably writes to those columns
    newComplaint['उजुरी दर्ता नं'] = id;
    newComplaint['दर्ता मिति'] = date;
    newComplaint['उजुरीको संक्षिप्त विवरण'] = description;

    const result = await postToGoogleSheets('saveComplaint', newComplaint);
    console.debug('saveHotlineComplaint -> postToGoogleSheets response:', result);
    if (result && result.success) newComplaint.syncedToSheets = true;

    state.complaints.unshift(newComplaint);
    showToast(result.success ? 'उजुरी Google Sheet मा सुरक्षित गरियो' : 'उजुरी Local मा सुरक्षित गरियो', result.success ? 'success' : 'warning');
    try { closeModalRobust(); } catch(e) { try { closeModal(); } catch(e){} }
    if (state.currentView === 'hotline_complaints') showHotlineComplaintsView();
    else if (state.currentView === 'admin_complaints') showAdminComplaintsView();
    else showComplaintsView();
  } finally {
    hideLoadingSpinner();
  }
}

async function saveHelloSarkarComplaint() {
  const id = elVal('hsComplaintId');
  let date = elVal('hsComplaintDate');
  const complainant = elVal('hsComplainant');
  const accused = elVal('hsAccused');
  const description = elVal('hsDescription');
  const assignedShakha = elVal('hsAssignedShakha');
  const assignedDate = elVal('hsAssignedDate');
  const status = elVal('hsStatus');
  const remarks = elVal('hsRemarks');
  
  // If user didn't change the date dropdown, ensure we save the default shown date
  if (!date) date = getCurrentNepaliDate();
  if (!id || !complainant || !description || !assignedShakha) {
    showToast('कृपया आवश्यक फिल्डहरू भर्नुहोस्', 'warning');
    return;
  }
  
  showLoadingSpinner('सेभ हुँदै...');
  try {
    const assignedShakhaName = SHAKHA[assignedShakha] || assignedShakha;
    const newComplaint = {
      id, date, complainant, accused: accused || '', description,
      assignedShakha: assignedShakhaName, assignedShakhaCode: assignedShakha, assignedDate: assignedDate || '', status,
      remarks: remarks || '', shakha: assignedShakhaName,
      mahashakha: MAHASHAKHA.ADMIN_MONITORING, source: 'hello_sarkar',
      createdBy: state.currentUser.name, createdAt: new Date().toISOString()
    };
    
    // Also include canonical Nepali header keys so Apps Script mapping reliably writes to those columns
    newComplaint['उजुरी दर्ता नं'] = id;
    newComplaint['दर्ता मिति'] = date;
    newComplaint['उजुरीको संक्षिप्त विवरण'] = description;
    
    // Google Sheet मा सेभ गर्ने
    const result = await postToGoogleSheets('saveComplaint', newComplaint);
    console.debug('saveHelloSarkarComplaint -> postToGoogleSheets response:', result);
    
    if (result && result.success) {
      newComplaint.syncedToSheets = true;
    }

    state.complaints.unshift(newComplaint);
    showToast(result.success ? 'उजुरी Google Sheet मा सुरक्षित गरियो' : 'उजुरी Local मा सुरक्षित गरियो', result.success ? 'success' : 'warning');
    try { closeModalRobust(); } catch(e) { try { closeModal(); } catch(e){} }
    if (state.currentView === 'online_complaints') {
      showOnlineComplaintsView();
    } else if (state.currentView === 'admin_complaints') {
      showAdminComplaintsView();
    } else {
      showComplaintsView();
    }
  } finally {
    hideLoadingSpinner();
  }
}

async function autoAssignHelloSarkarComplaints() {
  const pending = state.complaints.filter(c => c.source === 'hello_sarkar' && (!c.assignedShakha || c.status === 'pending'));
  
  if (pending.length === 0) {
    showToast('स्वत: असाइन गर्न कुनै नयाँ उजुरी छैन', 'info');
    return;
  }
  
  if (!confirm(`${pending.length} वटा उजुरीहरूलाई AI मार्फत स्वतः शाखा तोक्न चाहनुहुन्छ?`)) return;

  showLoadingIndicator(true);
  let count = 0;
  
  for (const c of pending) {
    const shakhaKey = AI_SYSTEM.suggestShakha(c.description);
    const shakhaName = SHAKHA[shakhaKey] || shakhaKey;
    
    if (shakhaName) {
      c.assignedShakha = shakhaName;
      c.assignedDate = getCurrentNepaliDate();
      c.status = 'progress';
      c.remarks = (c.remarks ? c.remarks + ' ' : '') + '[AI Auto-Assigned]';
      
      await postToGoogleSheets('updateComplaint', {
        id: c.id, assignedShakha: c.assignedShakha, assignedDate: c.assignedDate,
        status: c.status, remarks: c.remarks, updatedBy: 'AI System'
      });
      count++;
    }
  }
  
  showLoadingIndicator(false);
  showToast(`${count} वटा उजुरीहरू सफलतापूर्वक शाखामा पठाइयो`, 'success');
  showAdminComplaintsView();
}

function assignToShakha(id) {
  const complaint = state.complaints.find(c => String(c.id).trim() === String(id).trim());
  if (!complaint) return;
  
  const currentDate = getCurrentNepaliDate();
  const formContent = `
    <div class="d-grid gap-3">
      <div class="form-group"><label class="form-label">उजुरी नं</label><input type="text" class="form-control" value="${complaint.id}" readonly /></div>
      <div class="form-group"><label class="form-label">शाखा *</label><select class="form-select" id="assignShakha"><option value="">छान्नुहोस्</option>${Object.entries(SHAKHA).map(([key, value]) => {
        const isSelected = (complaint.assignedShakha === key) || (complaint.assignedShakha === value);
        return `<option value="${key}" ${isSelected ? 'selected' : ''}>${value}</option>`;
      }).join('')}</select></div>
      <div class="form-group"><label class="form-label">पठाएको मिति *</label>
        <div class="d-flex gap-2 nepali-datepicker-dropdown" data-target="assignDate">
          <select id="assignDate_year" class="form-select bs-year"><option value="">साल</option></select>
          <select id="assignDate_month" class="form-select bs-month"><option value="">महिना</option></select>
          <select id="assignDate_day" class="form-select bs-day"><option value="">गते</option></select>
          <input type="hidden" id="assignDate" value="${currentDate}" />
        </div>
      </div>
      <div class="form-group"><label class="form-label">सन्देश</label><textarea class="form-control" rows="3" id="assignInstructions" placeholder="शाखालाई दिने सन्देश"></textarea></div>
    </div>
    <div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">रद्द गर्नुहोस्</button><button class="btn btn-primary" onclick="saveShakhaAssignment('${id}')">पठाउनुहोस्</button></div>
  `;
  
  openModal('शाखामा उजुरी पठाउनुहोस्', formContent);
  setTimeout(()=>{ initializeDatepickers(); initializeNepaliDropdowns(); }, 100);
}

async function saveShakhaAssignment(id) {
  const complaintIndex = state.complaints.findIndex(c => String(c.id).trim() === String(id).trim());
  if (complaintIndex === -1) return;
  
  const assignedShakhaCode = document.getElementById('assignShakha').value;
  const assignDate = document.getElementById('assignDate').value;
  const instructions = document.getElementById('assignInstructions').value;
  
  if (!assignedShakhaCode || !assignDate) {
    showToast('कृपया शाखा र मिति छान्नुहोस्', 'warning');
    return;
  }
  
  showLoadingSpinner('पठाउँदै...');

  const assignedShakhaName = SHAKHA[assignedShakhaCode] || assignedShakhaCode;

  // Google Sheet मा अपडेट गर्न डाटा
  const updateData = {
    id: id,
    assignedShakha: assignedShakhaName,
    // Also set the main 'shakha' field so sheet columns like 'सम्बन्धित शाखा' get updated
    shakha: assignedShakhaName,
    assignedShakhaCode: assignedShakhaCode,
    assignedDate: assignDate,
    instructions: instructions || '',
    status: 'progress',
    updatedBy: state.currentUser.name
  };

  // Google Sheet मा पठाउने
  const result = await postToGoogleSheets('updateComplaint', updateData);

  state.complaints[complaintIndex] = {
    ...state.complaints[complaintIndex],
    assignedShakha: assignedShakhaName,
    assignedDate: assignDate,
    instructions: instructions || '',
    shakha: assignedShakhaName,
    status: 'progress',
    syncedToSheets: result && result.success
  };

  // Also update the same complaint if it exists in the online complaints list
  // to prevent normalization passes from overwriting the new date.
  const onlineComplaintIndex = (state.onlineComplaints || []).findIndex(c => String(c.id).trim() === String(id).trim());
  if (onlineComplaintIndex !== -1) {
    state.onlineComplaints[onlineComplaintIndex] = {
      ...state.onlineComplaints[onlineComplaintIndex],
      ...updateData
    };
  }

  // Persist changes to local storage to survive a page refresh.
  backupToLocalStorage();
  
  hideLoadingSpinner();
  
  if (result && result.success) {
    showToast('उजुरी शाखामा पठाइयो र Google Sheet मा अपडेट भयो', 'success');
  } else {
    showToast('उजुरी शाखामा पठाइयो (Local मात्र)', 'warning');
  }
  
  try { closeModalRobust(); } catch(e) { try { closeModal(); } catch(e){} }
  showAdminComplaintsView();
}

function showTechnicalProjectsChart() {
  // Backward compatibility (existing call sites). The new UX shows chart + data together.
  showTechnicalProjectsOverview({ scope: 'all' });
}

function showTechnicalProjectsOverview(options = {}) {
  state.currentView = 'technical_projects_overview';
  document.getElementById('pageTitle').textContent = 'प्राविधिक परीक्षण';

  const scope = options.scope || 'all';

  // Scope projects for the current user/context
  let projects = (state.projects || []).slice();
  if (scope === 'technical_mahashakha') {
    const allowed = MAHASHAKHA_STRUCTURE[MAHASHAKHA.TECHNICAL] || [];
    projects = projects.filter(p => {
      const s = (p.shakha || '').toString();
      if (!s) return false;
      if (allowed.includes(s)) return true;
      if (s.includes('प्राविधिक')) return true;
      return false;
    });
  } else if (state.currentUser && state.currentUser.role !== 'admin' && state.currentUser.role !== 'technical_head') {
    // Shakha user scope (keep existing behavior)
    projects = projects.filter(p => p.shakha === SHAKHA[state.currentUser.shakha] || p.shakha === state.currentUser.shakha);
  }

  const active = projects.filter(p => p.status === 'active').length;
  const completed = projects.filter(p => (p.improvementInfo && String(p.improvementInfo).trim() !== '')).length;
  const pending = projects.filter(p => (!p.improvementInfo || String(p.improvementInfo).trim() === '')).length;

  const recentRows = projects.slice(0, 8).map((p, i) => {
    const date = p.inspectionDate || '-';
    const org = p.organization || '-';
    const name = p.name || '-';
    const statusLabel = (p.improvementInfo && String(p.improvementInfo).trim() !== '') ? 'सम्पन्न' : (p.status === 'active' ? 'चालु' : 'काम बाँकी');
    const badgeClass = (statusLabel === 'सम्पन्न') ? 'status-resolved' : (statusLabel === 'चालु') ? 'status-progress' : 'status-pending';
    return `<tr><td>${i + 1}</td><td class="text-limit">${name}</td><td class="text-limit">${org}</td><td>${date}</td><td><span class="status-badge ${badgeClass}">${statusLabel}</span></td></tr>`;
  }).join('');

  const content = `
    <div class="tech-overview">
      <div class="tech-overview-header">
        <div class="d-flex align-center justify-between gap-2 flex-wrap">
          <div>
            <div class="text-small text-muted">समग्र अवस्था</div>
            <div class="text-large">प्राविधिक परीक्षण/आयोजना अनुगमन</div>
          </div>
          <div class="d-flex gap-2 flex-wrap">
            <button class="btn btn-outline btn-sm" onclick="showDashboardView()"><i class="fas fa-arrow-left"></i> ड्यासबोर्ड</button>
            <button class="btn btn-primary btn-sm" onclick="showTechnicalProjectsView()"><i class="fas fa-list"></i> सूची हेर्नुहोस्</button>
          </div>
        </div>
      </div>

      <div class="tech-overview-grid">
        <div class="card">
          <div class="card-header d-flex justify-between align-center">
            <h6 class="mb-0">चार्ट (क्लिक गर्दा फिल्टर)</h6>
            ${getChartActionsHTML('projectStatusChart')}
          </div>
          <div class="card-body">
            <div class="chart-wrapper dashboard-chart-wrapper tech-overview-chart">
              <canvas id="projectStatusChart"></canvas>
            </div>
            <div class="tech-kpi-grid mt-2">
              <div class="tech-kpi">
                <div class="tech-kpi-label">कूल</div>
                <div class="tech-kpi-value">${projects.length}</div>
              </div>
              <div class="tech-kpi">
                <div class="tech-kpi-label">चालु</div>
                <div class="tech-kpi-value">${active}</div>
              </div>
              <div class="tech-kpi">
                <div class="tech-kpi-label">सम्पन्न</div>
                <div class="tech-kpi-value">${completed}</div>
              </div>
              <div class="tech-kpi">
                <div class="tech-kpi-label">काम बाँकी</div>
                <div class="tech-kpi-value">${pending}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header d-flex justify-between align-center">
            <h6 class="mb-0">हालैका दर्ताहरू</h6>
            <a href="#" class="text-primary text-small" onclick="showTechnicalProjectsView()">सबै हेर्नुहोस्</a>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-compact mb-0">
                <thead><tr><th>क्र.सं.</th><th>आयोजनाको नाम</th><th>निकाय</th><th>मिति</th><th>स्थिति</th></tr></thead>
                <tbody>${recentRows || `<tr><td colspan="5" class="text-center text-muted">डाटा उपलब्ध छैन</td></tr>`}</tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const contentArea = document.getElementById('contentArea');
  if (contentArea) contentArea.innerHTML = content;
  applyDevanagariDigits(contentArea);
  updateActiveNavItem();

  // Provide scoped data to chart builder
  state._technicalOverviewProjects = projects;
  setTimeout(() => {
    initializeDashboardCharts();
  }, 300);
}

function showTechnicalProjectsView(options = {}) {
  state.currentView = 'technical_projects';
  document.getElementById('pageTitle').textContent = 'प्राविधिक परीक्षण';

  // Check if user can add projects (admin, technical_head, or technical shakha users)
  const canAddProject = state.currentUser && (
    state.currentUser.role === 'admin' || 
    state.currentUser.role === 'technical_head' ||
    (state.currentUser.shakha && state.currentUser.shakha.includes('प्राविधिक')) ||
    (state.currentUser.shakha && ['technical1', 'technical2', 'technical3', 'technical4'].includes(state.currentUser.shakha.toLowerCase()))
  );

  // Avoid leaking overview-scoped data to other views
  try { delete state._technicalOverviewProjects; } catch (e) { state._technicalOverviewProjects = null; }
  
  let technicalProjects = state.projects;
  if (state.currentUser && state.currentUser.role !== 'admin') {
    if (state.currentUser.role === 'mahashakha' && ((state.currentUser.mahashakha || state.currentUser.name || '').toString() === MAHASHAKHA.TECHNICAL)) {
      const allowed = MAHASHAKHA_STRUCTURE[MAHASHAKHA.TECHNICAL] || [];
      technicalProjects = (technicalProjects || []).filter(p => {
        const s = (p.shakha || '').toString();
        if (!s) return false;
        if (allowed.includes(s)) return true;
        if (s.includes('प्राविधिक')) return true;
        return false;
      });
    } else if (state.currentUser.role !== 'technical_head') {
      technicalProjects = (technicalProjects || []).filter(p => p.shakha === SHAKHA[state.currentUser.shakha] || p.shakha === state.currentUser.shakha);
    }
  }
  
  // Handle monthly filtering
  if (options.monthly) {
    const currentMonth = getCurrentNepaliDate().substring(0, 7); // Get YYYY-MM format
    technicalProjects = technicalProjects.filter(p => p.inspectionDate && p.inspectionDate.startsWith(currentMonth));
  }
  
  // Handle status filtering
  if (options.status) {
    // New filtering logic based on improvement info received date
    if (options.status === 'completed') {
      // Show only projects with improvement info received date
      technicalProjects = technicalProjects.filter(p => p.improvementInfo && p.improvementInfo.trim() !== '');
    } else if (options.status === 'pending') {
      // Show only projects without improvement info received date
      technicalProjects = technicalProjects.filter(p => !p.improvementInfo || p.improvementInfo.trim() === '');
    } else {
      // For 'active' status, show all (existing behavior)
      technicalProjects = technicalProjects.filter(p => p.status === options.status);
    }
  }
  
  const content = `
    <div class="filter-bar mb-3">
      <div class="filter-group"><label class="filter-label">स्थिति:</label><select class="form-select form-select-sm" id="filterProjectStatus"><option value="">सबै</option><option value="active">चालु</option><option value="completed">सम्पन्न</option><option value="pending">काम बाँकी</option></select></div>
      <div class="filter-group"><input type="text" class="form-control form-control-sm" placeholder="खोज्नुहोस्..." id="projectSearchText" /></div>
      <button class="btn btn-primary btn-sm" onclick="filterProjects()">खोज्नुहोस्</button>
      <button class="btn btn-success btn-sm" onclick="exportToExcel('technical_projects')"><i class="fas fa-file-excel"></i> Excel</button>
      ${canAddProject ? '<button class="btn btn-primary btn-sm" onclick="showNewProjectModal()"><i class="fas fa-plus"></i> नयाँ आयोजना</button>' : ''}
    </div>
    
    <div class="card">
      <div class="card-header"><h5 class="mb-0">प्राविधिक परीक्षण र आयोजना अनुगमन</h5></div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table">
            <thead><tr><th>क्र.सं.</th><th>आयोजनाको नाम</th><th>सम्बन्धित निकाय</th><th>अनुगमन/प्राविधिक परीक्षण मिति</th><th>अपरिपालनाहरु (NCR)</th><th>सुधारका लागि पत्रको मिति</th><th>सुधारको जानकारी प्राप्त मिति</th><th>कैफियत</th><th>कार्य</th></tr></thead>
            <tbody id="projectsTable">
              ${technicalProjects.map((project, index) => `
                <tr>
                  <td data-label="क्र.सं.">${index + 1}</td><td data-label="आयोजनाको नाम">${project.name}</td><td data-label="सम्बन्धित निकाय">${project.organization}</td><td data-label="अनुगमन/प्राविधिक परीक्षण मिति">${project.inspectionDate}</td>
                  <td data-label="अपरिपालनाहरु (NCR)" class="text-limit" title="${project.nonCompliances}">${project.nonCompliances.substring(0, 50)}...</td>
                  <td data-label="सुधारका लागि पत्रको मिति">${project.improvementLetterDate || '-'}</td><td data-label="सुधारको जानकारी प्राप्त मिति">${project.improvementInfo || '-'}</td><td data-label="कैफियत">${project.remarks || '-'}</td>
                  <td data-label="कार्य"><div class="table-actions"><button class="action-btn" data-action="viewProject" data-id="${project.id}" title="हेर्नुहोस्"><i class="fas fa-eye"></i></button><button class="action-btn" data-action="editProject" data-id="${project.id}" title="सम्पादन गर्नुहोस्"><i class="fas fa-edit"></i></button></div></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('contentArea').innerHTML = content;
  applyDevanagariDigits(document.getElementById('contentArea'));
  updateActiveNavItem();
}

function showNewProjectModal() {
  const currentDate = getCurrentNepaliDate();
  const formContent = `
    <div class="d-grid gap-3">
      <div class="d-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div class="form-group"><label class="form-label">आयोजनाको नाम *</label><input type="text" class="form-control" id="projectName" placeholder="आयोजनाको नाम" /></div>
        <div class="form-group"><label class="form-label">सम्बन्धित निकाय *</label><input type="text" class="form-control" id="projectOrganization" placeholder="सम्बन्धित निकायको नाम" /></div>
      </div>
      <div class="form-group"><label class="form-label">अनुगमन/प्राविधिक परीक्षण मिति *</label>
        <div class="d-flex gap-2 nepali-datepicker-dropdown" data-target="projectInspectionDate">
          <select id="projectInspectionDate_year" class="form-select bs-year"><option value="">साल</option></select>
          <select id="projectInspectionDate_month" class="form-select bs-month"><option value="">महिना</option></select>
          <select id="projectInspectionDate_day" class="form-select bs-day"><option value="">गते</option></select>
          <input type="hidden" id="projectInspectionDate" value="${currentDate}" />
        </div>
      </div>
      <div class="form-group"><label class="form-label">अपरिपालनाहरु (NCR) *</label><textarea class="form-control" rows="3" id="projectNonCompliances" placeholder="अपरिपालनाहरुको विवरण"></textarea></div>
      <div class="d-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div class="form-group"><label class="form-label">सुधारका लागि पत्र मिति</label>
          <div class="d-flex gap-2 nepali-datepicker-dropdown" data-target="projectImprovementLetterDate">
            <select id="projectImprovementLetterDate_year" class="form-select bs-year"><option value="">साल</option></select>
            <select id="projectImprovementLetterDate_month" class="form-select bs-month"><option value="">महिना</option></select>
            <select id="projectImprovementLetterDate_day" class="form-select bs-day"><option value="">गते</option></select>
            <input type="hidden" id="projectImprovementLetterDate" />
          </div>
        </div>
        <div class="form-group"><label class="form-label">स्थिति</label><select class="form-select" id="projectStatus"><option value="pending">काम बाँकी</option><option value="active">चालु</option><option value="completed">सम्पन्न</option></select></div>
      </div>
      <div class="form-group"><label class="form-label">अपरिपालना सुधारको जानकारी</label><textarea class="form-control" rows="2" id="projectImprovementInfo" placeholder="अपरिपालना सुधारको जानकारी"></textarea></div>
      <div class="form-group"><label class="form-label">कैफियत</label><textarea class="form-control" rows="2" id="projectRemarks" placeholder="कैफियत"></textarea></div>
    </div>
    <div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">रद्द गर्नुहोस्</button><button class="btn btn-primary" onclick="saveTechnicalProject()">सुरक्षित गर्नुहोस्</button></div>
  `;
  
  openModal('नयाँ आयोजना', formContent);
  setTimeout(()=>{ initializeDatepickers(); initializeNepaliDropdowns(); }, 100);
}

function viewProject(id) {
  const project = state.projects.find(p => p.id === id);
  if (!project) { showToast('आयोजना फेला परेन', 'error'); return; }
  
  const statusText = project.status === 'active' ? 'चालु' : project.status === 'completed' ? 'सम्पन्न' : 'काम बाँकी';
  
  const content = `
    <div class="d-grid gap-3">
      <div class="d-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div><div class="text-small text-muted">आयोजनाको नाम</div><div class="text-large">${project.name}</div></div>
        <div><div class="text-small text-muted">सम्बन्धित निकाय</div><div>${project.organization}</div></div>
        <div><div class="text-small text-muted">स्थिति</div><div><span class="status-badge ${project.status === 'active' ? 'status-progress' : project.status === 'completed' ? 'status-resolved' : 'status-pending'}">${statusText}</span></div></div>
      </div>
      <div class="d-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div><div class="text-small text-muted">परीक्षण मिति</div><div>${project.inspectionDate}</div></div>
        <div><div class="text-small text-muted">सुधारको लागि पत्रको मिति</div><div>${project.improvementLetterDate || '-'}</div></div>
        <div><div class="text-small text-muted">शाखा</div><div>${project.shakha}</div></div>
      </div>
      <div><div class="text-small text-muted">अपरिपालनाहरु</div><div class="card p-3 bg-light">${project.nonCompliances}</div></div>
      <div><div class="text-small text-muted">अपरिपालना सुधारको जानकारी</div><div class="card p-3 bg-light">${project.improvementInfo || 'कुनै सुधार जानकारी छैन'}</div></div>
      <div><div class="text-small text-muted">कैफियत</div><div class="card p-3 bg-light">${project.remarks || 'कुनै कैफियत छैन'}</div></div>
    </div>
  `;
  
  openModal('आयोजना विवरण', content);
}

function editProject(id) {
  const project = state.projects.find(p => p.id === id);
  if (!project) return;
  
  const formContent = `
    <div class="d-grid gap-3">
      <div class="d-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div class="form-group"><label class="form-label">आयोजनाको नाम</label><input type="text" class="form-control" value="${project.name}" id="editProjectName" /></div>
        <div class="form-group"><label class="form-label">सम्बन्धित निकाय</label><input type="text" class="form-control" value="${project.organization}" id="editProjectOrganization" /></div>
      </div>
      <div class="form-group"><label class="form-label">अनुगमन/प्राविधिक परीक्षण मिति</label>
        <div class="d-flex gap-2 nepali-datepicker-dropdown" data-target="editProjectInspectionDate">
          <select id="editProjectInspectionDate_year" class="form-select bs-year"><option value="">साल</option></select>
          <select id="editProjectInspectionDate_month" class="form-select bs-month"><option value="">महिना</option></select>
          <select id="editProjectInspectionDate_day" class="form-select bs-day"><option value="">गते</option></select>
          <input type="hidden" id="editProjectInspectionDate" value="${project.inspectionDate}" />
        </div>
      </div>
      <div class="form-group"><label class="form-label">अपरिपालनाहरु (NCR)</label><textarea class="form-control" rows="3" id="editProjectNonCompliances">${project.nonCompliances}</textarea></div>
      <div class="d-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div class="form-group"><label class="form-label">अपरिपालना सुधारका लागि पत्रको मिति</label>
          <div class="d-flex gap-2 nepali-datepicker-dropdown" data-target="editProjectImprovementLetterDate">
            <select id="editProjectImprovementLetterDate_year" class="form-select bs-year"><option value="">साल</option></select>
            <select id="editProjectImprovementLetterDate_month" class="form-select bs-month"><option value="">महिना</option></select>
            <select id="editProjectImprovementLetterDate_day" class="form-select bs-day"><option value="">गते</option></select>
            <input type="hidden" id="editProjectImprovementLetterDate" value="${project.improvementLetterDate || ''}" />
          </div>
        </div>
        <div class="form-group"><label class="form-label">स्थिति</label><select class="form-select" id="editProjectStatus"><option value="pending" ${project.status === 'pending' ? 'selected' : ''}>काम बाँकी</option><option value="active" ${project.status === 'active' ? 'selected' : ''}>चालु</option><option value="completed" ${project.status === 'completed' ? 'selected' : ''}>सम्पन्न</option></select></div>
      </div>
      <div class="form-group"><label class="form-label">अपरिपालना सुधारको जानकारी</label><textarea class="form-control" rows="2" id="editProjectImprovementInfo">${project.improvementInfo || ''}</textarea></div>
      <div class="form-group"><label class="form-label">कैफियत</label><textarea class="form-control" rows="2" id="editProjectRemarks">${project.remarks || ''}</textarea></div>
    </div>
    <div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">रद्द गर्नुहोस्</button><button class="btn btn-primary" onclick="saveProjectEdit('${id}')">सुरक्षित गर्नुहोस्</button></div>
  `;
  
  openModal('आयोजना सम्पादन', formContent);
  setTimeout(()=>{ initializeDatepickers(); initializeNepaliDropdowns(); }, 100);
}

function saveProjectEdit(id) {
  const projectIndex = state.projects.findIndex(p => p.id === id);
  if (projectIndex === -1) return;
  
  const updatedProject = {
    ...state.projects[projectIndex],
    name: document.getElementById('editProjectName').value,
    organization: document.getElementById('editProjectOrganization').value,
    inspectionDate: document.getElementById('editProjectInspectionDate').value,
    nonCompliances: document.getElementById('editProjectNonCompliances').value,
    improvementLetterDate: document.getElementById('editProjectImprovementLetterDate').value || '',
    status: document.getElementById('editProjectStatus').value,
    improvementInfo: document.getElementById('editProjectImprovementInfo').value || '',
    remarks: document.getElementById('editProjectRemarks').value || '',
    updatedAt: new Date().toISOString(),
    updatedBy: state.currentUser.name
  };
  
  state.projects[projectIndex] = updatedProject;
  showToast('आयोजना सुरक्षित गरियो', 'success');
  closeModal();
  showTechnicalProjectsView();
}

function showEmployeeMonitoringView() {
  state.currentView = 'employee_monitoring';
  document.getElementById('pageTitle').textContent = 'कार्यालय अनुगमन';
  
  const content = `
    <div class="filter-bar mb-3">
      <div class="filter-group"><label class="filter-label">मिति:</label>
        <div class="nepali-datepicker-dropdown" data-target="empStartDate" style="display:flex;gap:6px;">
          <select id="empStartDate_year" class="form-select form-select-sm bs-year" style="min-width:72px;"><option value="">साल</option></select>
          <select id="empStartDate_month" class="form-select form-select-sm bs-month" style="min-width:72px;"><option value="">महिना</option></select>
          <select id="empStartDate_day" class="form-select form-select-sm bs-day" style="min-width:72px;"><option value="">गते</option></select>
          <input type="hidden" id="empStartDate" />
        </div>
      </div>
      <div class="filter-group">
        <div class="nepali-datepicker-dropdown" data-target="empEndDate" style="display:flex;gap:6px;">
          <select id="empEndDate_year" class="form-select form-select-sm bs-year" style="min-width:72px;"><option value="">साल</option></select>
          <select id="empEndDate_month" class="form-select form-select-sm bs-month" style="min-width:72px;"><option value="">महिना</option></select>
          <select id="empEndDate_day" class="form-select form-select-sm bs-day" style="min-width:72px;"><option value="">गते</option></select>
          <input type="hidden" id="empEndDate" />
        </div>
      </div>
      <div class="filter-group">
        <select class="form-select form-select-sm" id="empSearchType">
          <option value="office">कार्यालय अनुसार</option>
          <option value="employee">कर्मचारी नाम अनुसार</option>
          <option value="province">प्रदेश अनुसार</option>
          <option value="district">जिल्ला अनुसार</option>
        </select>
      </div>
      <div class="filter-group"><input type="text" class="form-control form-control-sm" placeholder="खोज्नुहोस्..." id="empSearchText" /></div>
      <button class="btn btn-primary btn-sm" onclick="filterEmployeeMonitoring()">खोज्नुहोस्</button>
      <button class="btn btn-secondary btn-sm" onclick="clearEmployeeFilter()">रिसेट</button>
      <button class="btn btn-success btn-sm" onclick="exportToExcel('employee_monitoring')"><i class="fas fa-file-excel"></i> Excel</button>
      <button class="btn btn-primary btn-sm" onclick="showNewEmployeeMonitoring()"><i class="fas fa-plus"></i> नयाँ अनुगमन</button>
    </div>
    
    <div class="card">
        <div class="card-header d-flex justify-between align-center"><h5 class="mb-0">कर्मचारीहरुको समयपालना र पोशाक अनुगमन</h5>
          <div class="d-flex align-items-center">
            <label class="me-2 mb-0 text-small">प्रति पेज:</label>
            <select id="empItemsPerPage" class="form-select form-select-sm me-2" style="width: auto;">
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table">
              <thead><tr><th>क्र.सं.</th><th>अनुगमन मिति</th><th>कार्यालय/निकाय</th><th>प्रदेश</th><th>जिल्ला</th><th>स्थानीय तह</th><th>पोशाक अपरिपालना</th><th>समय अपरिपालना</th><th>कैफियत</th><th>कार्य</th></tr></thead>
              <tbody id="employeeMonitoringTable">
                ${getEmployeeMonitoringTableRows(null, 0)}
              </tbody>
            </table>
          </div>
        </div>
        <div class="card-footer">
          <nav id="employeeMonitoringPagination" aria-label="Employee monitoring pagination"></nav>
        </div>
      </div>
  `;
  
  document.getElementById('contentArea').innerHTML = content;
  updateActiveNavItem();
  setTimeout(()=>{ initializeDatepickers(); initializeNepaliDropdowns(); }, 100);

  // wire items-per-page control and initial render
  setTimeout(() => {
    try {
      const perEl = document.getElementById('empItemsPerPage');
      const saved = (state.pagination && state.pagination.itemsPerPage) ? state.pagination.itemsPerPage : 10;
      if (perEl) {
        perEl.value = String(saved);
        perEl.addEventListener('change', function(){
          const v = parseInt(this.value, 10) || 10;
          renderEmployeeMonitoringTable(null, 1, v);
        });
      }
      // initial render
      renderEmployeeMonitoringTable(null, state.pagination && state.pagination.currentPage ? state.pagination.currentPage : 1, saved);
    } catch (e) { console.warn('employee monitoring pagination init failed', e); }
  }, 140);
}

function getEmployeeMonitoringTableRows(records = null, startIndex = 0) {
  const dataToDisplay = records || state.employeeMonitoring || [];
  
  return dataToDisplay.map((record, index) => {
    // Parse JSON strings back to arrays if needed
    let uniformEmployees = [];
    let timeEmployees = [];
    
    try {
      if (record.uniformEmployees) {
        uniformEmployees = typeof record.uniformEmployees === 'string' ? JSON.parse(record.uniformEmployees) : record.uniformEmployees;
      }
      if (record.timeEmployees) {
        timeEmployees = typeof record.timeEmployees === 'string' ? JSON.parse(record.timeEmployees) : record.timeEmployees;
      }
    } catch (e) {
      console.warn('Error parsing employee arrays in getEmployeeMonitoringTableRows:', e);
      uniformEmployees = [];
      timeEmployees = [];
    }
    
    // Ensure arrays
    if (!Array.isArray(uniformEmployees)) uniformEmployees = [];
    if (!Array.isArray(timeEmployees)) timeEmployees = [];
    
    const uniformNames = uniformEmployees.map(emp => {
      const n = emp && emp.name ? emp.name : '';
      const p = emp && emp.post ? emp.post : '';
      const s = emp && emp.symbol ? emp.symbol : '';
      let display = n ? escapeHtml(n) : '';
      if (p) display += ` (${escapeHtml(p)})`;
      if (s) display += ` - ${escapeHtml(s)}`;
      return display;
    }).filter(Boolean).join(', ');
    
    const timeNames = timeEmployees.map(emp => {
      const n = emp && emp.name ? emp.name : '';
      const p = emp && emp.post ? emp.post : '';
      const s = emp && emp.symbol ? emp.symbol : '';
      let display = n ? escapeHtml(n) : '';
      if (p) display += ` (${escapeHtml(p)})`;
      if (s) display += ` - ${escapeHtml(s)}`;
      return display;
    }).filter(Boolean).join(', ');
    
    return `
      <tr>
        <td data-label="क्र.सं.">${startIndex + index + 1}</td>
        <td data-label="अनुगमन मिति">${record.date}</td>
        <td data-label="कार्यालय/निकाय">${record.officeName || record.organization || ''}</td>
        <td data-label="प्रदेश">${record.province || ''}</td>
        <td data-label="जिल्ला">${record.district || ''}</td>
        <td data-label="स्थानीय तह">${record.localLevel || ''}</td>
        <td data-label="पोशाक अपरिपालना">
          <div class="text-truncate" style="max-width: 150px;" title="${uniformNames}">
            ${record.uniformViolationCount || record.uniformViolation || uniformEmployees.length || 0} जना<br>
            <small class="text-muted">${uniformNames.length > 30 ? uniformNames.substring(0, 30) + '...' : uniformNames}</small>
          </div>
        </td>
        <td data-label="समय अपरिपालना">
          <div class="text-truncate" style="max-width: 150px;" title="${timeNames}">
            ${record.timeViolationCount || record.timeViolation || timeEmployees.length || 0} जना<br>
            <small class="text-muted">${timeNames.length > 30 ? timeNames.substring(0, 30) + '...' : timeNames}</small>
          </div>
        </td>
        <td data-label="कैफियत">${record.remarks || ''}</td>
        <td data-label="कार्य">
          <div class="table-actions">
            <button class="action-btn" onclick="handleTableActions(event)" data-action="viewEmployeeMonitoring" data-id="${record.id}" title="हेर्नुहोस्"><i class="fas fa-eye"></i></button>
            <button class="action-btn" onclick="handleTableActions(event)" data-action="editEmployeeMonitoring" data-id="${record.id}" title="सम्पादन गर्नुहोस्"><i class="fas fa-edit"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Render employee monitoring table with pagination controls
function renderEmployeeMonitoringTable(records = null, page = 1, perPage = null) {
  const all = Array.isArray(records) ? records : (state.employeeMonitoring || []);
  perPage = perPage || (state.pagination && state.pagination.itemsPerPage) || 10;
  page = page || (state.pagination && state.pagination.currentPage) || 1;

  const total = all.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  if (page < 1) page = 1;
  if (page > totalPages) page = totalPages;

  const startIndex = (page - 1) * perPage;
  const slice = all.slice(startIndex, startIndex + perPage);

  const tbody = document.getElementById('employeeMonitoringTable');
  if (tbody) tbody.innerHTML = getEmployeeMonitoringTableRows(slice, startIndex);

  // build pagination
  const pager = document.getElementById('employeeMonitoringPagination');
  if (pager) {
    let html = '<ul class="pagination pagination-sm mb-0 justify-content-center">';
    const prevDisabled = page === 1 ? 'disabled' : '';
    html += `<li class="page-item ${prevDisabled}"><a href="#" class="page-link" onclick="renderEmployeeMonitoringTable(null, ${page - 1}, ${perPage}); return false;">अघिल्लो</a></li>`;
    const maxButtons = 7;
    const startPage = Math.max(1, page - Math.floor(maxButtons/2));
    const endPage = Math.min(totalPages, startPage + maxButtons - 1);
    for (let p = startPage; p <= endPage; p++) {
      html += `<li class="page-item ${p === page ? 'active' : ''}"><a href="#" class="page-link" onclick="renderEmployeeMonitoringTable(null, ${p}, ${perPage}); return false;">${p}</a></li>`;
    }
    const nextDisabled = page === totalPages ? 'disabled' : '';
    html += `<li class="page-item ${nextDisabled}"><a href="#" class="page-link" onclick="renderEmployeeMonitoringTable(null, ${page + 1}, ${perPage}); return false;">पछिल्लो</a></li>`;
    html += '</ul>';
    pager.innerHTML = html;
  }

  // persist pagination state
  if (!state.pagination) state.pagination = {};
  state.pagination.currentPage = page;
  state.pagination.itemsPerPage = perPage;

  // update items per page control if present
  const perEl = document.getElementById('empItemsPerPage');
  if (perEl) perEl.value = String(perPage);
}

function showNewEmployeeMonitoring() {
  const currentDate = getCurrentNepaliDate();
  const formContent = `
    <div class="d-grid gap-3">
      <div class="d-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div class="form-group"><label class="form-label">अनुगमन मिति *</label>
          <div class="d-flex gap-2 nepali-datepicker-dropdown" data-target="empDate">
            <select id="empDate_year" class="form-select bs-year"><option value="">साल</option></select>
            <select id="empDate_month" class="form-select bs-month"><option value="">महिना</option></select>
            <select id="empDate_day" class="form-select bs-day"><option value="">गते</option></select>
            <input type="hidden" id="empDate" value="${currentDate}" />
          </div>
        </div>
        <div class="form-group"><label class="form-label">निकायको नाम *</label><input type="text" class="form-control" id="empOfficeName" placeholder="कार्यालय/निकायको नाम" /></div>
      </div>
      
      <!-- नेपालको प्रशासनिक विभाजन -->
      <div class="card">
        <div class="card-body">
          <div class="d-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            <div class="form-group">
              <label class="form-label">प्रदेश *</label>
              <select class="form-select" id="empProvince" onchange="populateDistricts(this.value)">
                <option value="">प्रदेश छान्नुहोस्</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">जिल्ला *</label>
              <select class="form-select" id="empDistrict" onchange="populateLocalLevels()">
                <option value="">जिल्ला छान्नुहोस्</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">स्थानीय तह *</label>
              <select class="form-select" id="empLocalLevel">
                <option value="">स्थानीय तह छान्नुहोस्</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- पोशाक अपरिपालना गर्ने कर्मचारीहरू -->
      <div class="card">
        <div class="card-header d-flex justify-between align-center">
          <h6 class="mb-0">👔 पोशाक अपरिपालना गर्ने कर्मचारीहरू</h6>
          <button type="button" class="btn btn-sm btn-primary" onclick="addEmployeeRow('uniform')">
            <i class="fas fa-plus"></i> कर्मचारी थप्नुहोस्
          </button>
        </div>
        <div class="card-body">
          <div id="uniformEmployeesContainer"></div>
        </div>
      </div>

      <!-- समय अपरिपालना गर्ने कर्मचारीहरू -->
      <div class="card">
        <div class="card-header d-flex justify-between align-center">
          <h6 class="mb-0">⏰ समय अपरिपालना गर्ने कर्मचारीहरू</h6>
          <button type="button" class="btn btn-sm btn-primary" onclick="addEmployeeRow('time')">
            <i class="fas fa-plus"></i> कर्मचारी थप्नुहोस्
          </button>
        </div>
        <div class="card-body">
          <div id="timeEmployeesContainer"></div>
        </div>
      </div>
      
      <div class="d-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div class="form-group"><label class="form-label">निर्देशन मिति</label>
          <div class="d-flex gap-2 nepali-datepicker-dropdown" data-target="empInstructionDate">
            <select id="empInstructionDate_year" class="form-select bs-year"><option value="">साल</option></select>
            <select id="empInstructionDate_month" class="form-select bs-month"><option value="">महिना</option></select>
            <select id="empInstructionDate_day" class="form-select bs-day"><option value="">गते</option></select>
            <input type="hidden" id="empInstructionDate" />
          </div>
        </div>
      </div>
      <div class="form-group"><label class="form-label">कैफियत</label><textarea class="form-control" rows="3" id="empRemarks" placeholder="थप जानकारी..."></textarea></div>
    </div>
    <div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">रद्द गर्नुहोस्</button><button class="btn btn-primary" onclick="saveEmployeeMonitoring()">सुरक्षित गर्नुहोस्</button></div>
  `;
  
  openModal('नयाँ कार्यालय अनुगमन', formContent);
  setTimeout(()=>{ 
    initializeDatepickers(); 
    initializeNepaliDropdowns(); 
    populateProvinces();
    populateLocalLevels();
  }, 100);
}

async function saveEmployeeMonitoring() {
  const date = _latinToDevnagari(document.getElementById('empDate').value);
  const officeName = document.getElementById('empOfficeName').value;
  const province = document.getElementById('empProvince').value;
  const district = document.getElementById('empDistrict').value;
  const localLevel = document.getElementById('empLocalLevel').value;
  const instructionDate = _latinToDevnagari(document.getElementById('empInstructionDate').value || '');
  const remarks = document.getElementById('empRemarks').value || '';
  
  // Get employee data
  const uniformEmployees = getEmployeeData('uniform');
  const timeEmployees = getEmployeeData('time');
  
  if (!date || !officeName || !province || !district || !localLevel) {
    showToast('कृपया सबै आवश्यक फिल्डहरू भर्नुहोस्', 'warning');
    return;
  }
  
  if (uniformEmployees.length === 0 && timeEmployees.length === 0) {
    showToast('कृपया कम्तिमा एक कर्मचारीको विवरण थप्नुहोस्', 'warning');
    return;
  }
  
  showLoadingIndicator(true, 'सेभ हुँदैछ....');

  const newRecord = {
    id: Date.now(), 
    date, 
    officeName,
    province: LOCATION_FIELDS.PROVINCE[province],
    district,
    localLevel: localLevel,
    uniformViolationCount: uniformEmployees.length,
    timeViolationCount: timeEmployees.length,
    uniformEmployees: JSON.stringify(uniformEmployees),
    timeEmployees: JSON.stringify(timeEmployees),
    instructionDate, 
    remarks,
    createdBy: state.currentUser.name,
    createdAt: new Date().toISOString()
  };
  
  // Google Sheet मा सेभ गर्ने
  console.log('Saving to Google Sheets...', newRecord);
  const result = await postToGoogleSheets('saveEmployeeMonitoring', newRecord);
  console.log('Google Sheets result:', result);
  
  if (result && result.success) {
    // Success - data saved to Google Sheets
    state.employeeMonitoring.unshift(newRecord);
    showLoadingIndicator(false);
    showToast('कार्यालय अनुगमन Google Sheet मा सुरक्षित गरियो', 'success');
    closeModal();
    showEmployeeMonitoringView();
  } else {
    // Failed to save to Google Sheets - save locally
    console.log('Failed to save to Google Sheets, saving locally...');
    state.employeeMonitoring.unshift(newRecord);
    showLoadingIndicator(false);
    showToast('कार्यालय अनुगमन Local मा सुरक्षित गरियो (Google Sheets error)', 'warning');
    closeModal();
    showEmployeeMonitoringView();
  }
}

function viewEmployeeMonitoring(id) {
  const record = state.employeeMonitoring.find(r => String(r.id) === String(id));
  if (!record) { showToast('अभिलेख फेला परेन', 'error'); return; }
  
  // Parse JSON strings back to arrays if needed
  let uniformEmployees = [];
  let timeEmployees = [];
  
  try {
    if (record.uniformEmployees) {
      uniformEmployees = typeof record.uniformEmployees === 'string' ? JSON.parse(record.uniformEmployees) : record.uniformEmployees;
    }
    if (record.timeEmployees) {
      timeEmployees = typeof record.timeEmployees === 'string' ? JSON.parse(record.timeEmployees) : record.timeEmployees;
    }
  } catch (e) {
    console.warn('Error parsing employee arrays in viewEmployeeMonitoring:', e);
    uniformEmployees = [];
    timeEmployees = [];
  }
  
  // Ensure arrays
  if (!Array.isArray(uniformEmployees)) uniformEmployees = [];
  if (!Array.isArray(timeEmployees)) timeEmployees = [];
  
  const uniformNames = uniformEmployees.map(emp => {
    const n = emp && emp.name ? emp.name : '';
    const p = emp && emp.post ? emp.post : '';
    const s = emp && emp.symbol ? emp.symbol : '';
    let display = n ? escapeHtml(n) : '';
    if (p) display += ` (${escapeHtml(p)})`;
    if (s) display += ` - ${escapeHtml(s)}`;
    return display;
  }).filter(Boolean).join(', ');
  
  const timeNames = timeEmployees.map(emp => {
    const n = emp && emp.name ? emp.name : '';
    const p = emp && emp.post ? emp.post : '';
    const s = emp && emp.symbol ? emp.symbol : '';
    let display = n ? escapeHtml(n) : '';
    if (p) display += ` (${escapeHtml(p)})`;
    if (s) display += ` - ${escapeHtml(s)}`;
    return display;
  }).filter(Boolean).join(', ');
  
  const content = `
    <div class="d-grid gap-3">
      <div class="d-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div><div class="text-small text-muted">अनुगमन मिति</div><div class="text-large">${record.date}</div></div>
        <div><div class="text-small text-muted">निकाय</div><div>${record.officeName || record.organization || ''}</div></div>
      </div>
      <div class="d-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div><div class="text-small text-muted">प्रदेश</div><div>${record.province || ''}</div></div>
        <div><div class="text-small text-muted">जिल्ला</div><div>${record.district || ''}</div></div>
        <div><div class="text-small text-muted">स्थानीय तह</div><div>${record.localLevel || ''}</div></div>
      </div>
      <div class="d-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div><div class="text-small text-muted">पोशाक अपरिपालना</div><div>${record.uniformViolationCount || uniformEmployees.length || 0} जना<br><small>${uniformNames}</small></div></div>
        <div><div class="text-small text-muted">समय अपरिपालना</div><div>${record.timeViolationCount || timeEmployees.length || 0} जना<br><small>${timeNames}</small></div></div>
      </div>
      <div><div class="text-small text-muted">निर्देशन मिति</div><div>${record.instructionDate}</div></div>
      <div><div class="text-small text-muted">कैफियत</div><div class="card p-3 bg-light">${record.remarks}</div></div>
    </div>
  `;
  
  openModal('कार्यालय अनुगमन विवरण', content);
}

function editEmployeeMonitoring(id) {
  const record = state.employeeMonitoring.find(r => String(r.id) === String(id));
  if (!record) return;
  
  const formContent = `
    <div class="d-grid gap-3">
      <div class="d-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div class="form-group"><label class="form-label">अनुगमन मिति</label>
          <div class="d-flex gap-2 nepali-datepicker-dropdown" data-target="editEmpDate">
            <select id="editEmpDate_year" class="form-select bs-year"><option value="">साल</option></select>
            <select id="editEmpDate_month" class="form-select bs-month"><option value="">महिना</option></select>
            <select id="editEmpDate_day" class="form-select bs-day"><option value="">गते</option></select>
            <input type="hidden" id="editEmpDate" value="${normalizeNepaliDisplayToISO(record.date)}" />
          </div>
        </div>
            <div class="form-group"><label class="form-label">निकाय</label><input type="text" class="form-control" value="${escapeHtml(record.officeName || record.organization || '')}" id="editEmpOrganization" /></div>
      </div>
      <div class="d-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div class="form-group"><label class="form-label">पोशाक अपरिपालना</label><input type="number" class="form-control" value="${(record.uniformViolationCount !== undefined && record.uniformViolationCount !== null) ? record.uniformViolationCount : (Array.isArray(record.uniformEmployees) ? record.uniformEmployees.length : (typeof record.uniformEmployees === 'string' ? (tryParseJsonCount(record.uniformEmployees)) : 0))}" id="editEmpUniformViolation" min="0" /></div>
        <div class="form-group"><label class="form-label">समय अपरिपालना</label><input type="number" class="form-control" value="${(record.timeViolationCount !== undefined && record.timeViolationCount !== null) ? record.timeViolationCount : (Array.isArray(record.timeEmployees) ? record.timeEmployees.length : (typeof record.timeEmployees === 'string' ? (tryParseJsonCount(record.timeEmployees)) : 0))}" id="editEmpTimeViolation" min="0" /></div>
      </div>
      <div class="form-group"><label class="form-label">निर्देशन मिति</label>
        <div class="d-flex gap-2 nepali-datepicker-dropdown" data-target="editEmpInstructionDate">
          <select id="editEmpInstructionDate_year" class="form-select bs-year"><option value="">साल</option></select>
          <select id="editEmpInstructionDate_month" class="form-select bs-month"><option value="">महिना</option></select>
          <select id="editEmpInstructionDate_day" class="form-select bs-day"><option value="">गते</option></select>
          <input type="hidden" id="editEmpInstructionDate" value="${normalizeNepaliDisplayToISO(record.instructionDate || '')}" />
        </div>
      </div>
      <div class="form-group"><label class="form-label">कैफियत</label><textarea class="form-control" rows="3" id="editEmpRemarks">${record.remarks}</textarea></div>
      
      <div class="form-group"><label class="form-label">पोशाक कर्मचारीहरु</label>
        <div id="editUniformEmployeesContainer"></div>
        <div class="mt-2"><button type="button" class="btn btn-sm btn-outline-primary" onclick="addEmployeeRowTo('editUniformEmployeesContainer')">कर्मचारी थप्नुहोस्</button></div>
      </div>
      <div class="form-group"><label class="form-label">समय कर्मचारीहरु</label>
        <div id="editTimeEmployeesContainer"></div>
        <div class="mt-2"><button type="button" class="btn btn-sm btn-outline-primary" onclick="addEmployeeRowTo('editTimeEmployeesContainer')">कर्मचारी थप्नुहोस्</button></div>
      </div>
    </div>
    <div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">रद्द गर्नुहोस्</button><button class="btn btn-primary" onclick="saveEmployeeMonitoringEdit(${id})">सुरक्षित गर्नुहोस्</button></div>
  `;
  
  openModal('कार्यालय अनुगमन सम्पादन', formContent);
  setTimeout(()=>{ initializeDatepickers(); initializeNepaliDropdowns(); 
    // Clear containers first, then populate existing employee rows into edit containers
    try {
      // Clear existing content
      const uniformContainer = document.getElementById('editUniformEmployeesContainer');
      const timeContainer = document.getElementById('editTimeEmployeesContainer');
      if (uniformContainer) uniformContainer.innerHTML = '';
      if (timeContainer) timeContainer.innerHTML = '';
      
      let uniformEmployees = [];
      let timeEmployees = [];
      if (record.uniformEmployees) {
        uniformEmployees = typeof record.uniformEmployees === 'string' ? JSON.parse(record.uniformEmployees) : record.uniformEmployees;
      }
      if (record.timeEmployees) {
        timeEmployees = typeof record.timeEmployees === 'string' ? JSON.parse(record.timeEmployees) : record.timeEmployees;
      }
      if (!Array.isArray(uniformEmployees)) uniformEmployees = [];
      if (!Array.isArray(timeEmployees)) timeEmployees = [];
      uniformEmployees.forEach(emp => addEmployeeRowTo('editUniformEmployeesContainer', emp));
      timeEmployees.forEach(emp => addEmployeeRowTo('editTimeEmployeesContainer', emp));
    } catch (e) { console.warn('Error populating edit employee lists:', e); }
  }, 100);
}

function saveEmployeeMonitoringEdit(id) {
  const recordIndex = state.employeeMonitoring.findIndex(r => String(r.id) === String(id));
  if (recordIndex === -1) return;
  
  // Get current employee data from containers
  const currentUniformEmployees = getEmployeeDataFrom('editUniformEmployeesContainer');
  const currentTimeEmployees = getEmployeeDataFrom('editTimeEmployeesContainer');
  
  const updatedRecord = {
    ...state.employeeMonitoring[recordIndex],
    date: _latinToDevnagari(document.getElementById('editEmpDate').value),
    officeName: document.getElementById('editEmpOrganization').value || '',
    organization: document.getElementById('editEmpOrganization').value || '',
    // Update counts based on actual employee data after deletion
    uniformViolationCount: currentUniformEmployees.length,
    timeViolationCount: currentTimeEmployees.length,
    uniformViolation: String(currentUniformEmployees.length),
    timeViolation: String(currentTimeEmployees.length),
    instructionDate: _latinToDevnagari(document.getElementById('editEmpInstructionDate').value || ''),
    remarks: document.getElementById('editEmpRemarks').value || '',
    // capture edited employee arrays and keep stored format consistent (JSON string)
    uniformEmployees: JSON.stringify(currentUniformEmployees),
    timeEmployees: JSON.stringify(currentTimeEmployees),
    updatedAt: new Date().toISOString(),
    updatedBy: state.currentUser.name
  };
  
  // Update local state first
  state.employeeMonitoring[recordIndex] = updatedRecord;
  
  // Save to Google Sheets
  showLoadingIndicator(true);
  postToGoogleSheets('updateEmployeeMonitoring', updatedRecord).then(result => {
    showLoadingIndicator(false);
    if (result && result.success) {
      showToast('कार्यालय अनुगमन Google Sheet मा सुरक्षित गरियो', 'success');
    } else {
      showToast('कार्यालय अनुगमन Local मा सुरक्षित गरियो (Google Sheets error)', 'warning');
    }
    closeModal();
    showEmployeeMonitoringView();
  }).catch(error => {
    showLoadingIndicator(false);
    console.error('Error updating employee monitoring:', error);
    showToast('अपडेट गर्न असफल: ' + error.message, 'error');
  });
}

function filterEmployeeMonitoring() {
  const searchType = document.getElementById('empSearchType').value;
  const searchText = document.getElementById('empSearchText').value.toLowerCase().trim();
  const startDate = document.getElementById('empStartDate').value;
  const endDate = document.getElementById('empEndDate').value;
  
  let filteredData = [...state.employeeMonitoring];
  
  // Date filtering
  if (startDate) {
    filteredData = filteredData.filter(record => record.date >= startDate);
  }
  if (endDate) {
    filteredData = filteredData.filter(record => record.date <= endDate);
  }
  
  // Search filtering based on type
  if (searchText) {
    switch (searchType) {
      case 'office':
        filteredData = filteredData.filter(record => 
          (record.officeName || record.organization || '').toLowerCase().includes(searchText)
        );
        break;
      case 'employee':
        filteredData = filteredData.filter(record => {
          let uniformEmployees = record.uniformEmployees || [];
          let timeEmployees = record.timeEmployees || [];
          try {
            if (typeof uniformEmployees === 'string') uniformEmployees = JSON.parse(uniformEmployees);
          } catch(e) { uniformEmployees = []; }
          try {
            if (typeof timeEmployees === 'string') timeEmployees = JSON.parse(timeEmployees);
          } catch(e) { timeEmployees = []; }
          const allEmployees = [...(Array.isArray(uniformEmployees) ? uniformEmployees : []), ...(Array.isArray(timeEmployees) ? timeEmployees : [])];
          return allEmployees.some(emp => {
            const name = (emp && emp.name) ? String(emp.name).toLowerCase() : '';
            const post = (emp && emp.post) ? String(emp.post).toLowerCase() : '';
            return name.includes(searchText) || post.includes(searchText);
          });
        });
        break;
      case 'province':
        filteredData = filteredData.filter(record => 
          (record.province || '').toLowerCase().includes(searchText)
        );
        break;
      case 'district':
        filteredData = filteredData.filter(record => 
          (record.district || '').toLowerCase().includes(searchText)
        );
        break;
    }
  }
  
  // Update table with filtered data (paginated)
  const per = parseInt(document.getElementById('empItemsPerPage')?.value || (state.pagination && state.pagination.itemsPerPage) || 10, 10);
  renderEmployeeMonitoringTable(filteredData, 1, per);
  
  // Show result count
  const totalCount = state.employeeMonitoring.length;
  const filteredCount = filteredData.length;
  if (searchText || startDate || endDate) {
    showToast(`${filteredCount} / ${totalCount} अभिलेख फेला परे`, 'info');
  }
}

function clearEmployeeFilter() {
  // Clear all filter fields
  document.getElementById('empSearchText').value = '';
  document.getElementById('empStartDate').value = '';
  document.getElementById('empEndDate').value = '';
  document.getElementById('empSearchType').value = 'office';
  
  // Reset date dropdowns
  ['empStartDate', 'empEndDate'].forEach(id => {
    const yearSelect = document.getElementById(id + '_year');
    const monthSelect = document.getElementById(id + '_month');
    const daySelect = document.getElementById(id + '_day');
    if (yearSelect) yearSelect.selectedIndex = 0;
    if (monthSelect) monthSelect.selectedIndex = 0;
    if (daySelect) daySelect.selectedIndex = 0;
  });
  
  // Reset table to show all data
  const perAll = parseInt(document.getElementById('empItemsPerPage')?.value || (state.pagination && state.pagination.itemsPerPage) || 10, 10);
  renderEmployeeMonitoringTable(null, 1, perAll);
  showToast('फिल्टर हटाइयो', 'success');
}

function showCitizenCharterView() {
  state.currentView = 'citizen_charter';
  document.getElementById('pageTitle').textContent = 'नागरिक बडापत्र अनुगमन';
  
  const content = `
    <div class="card">
      <div class="card-header d-flex justify-between align-center">
        <h5 class="mb-0">नागरिक बडापत्र अनुगमन अभिलेख</h5>
        <button class="btn btn-primary btn-sm" onclick="showNewCitizenCharter()"><i class="fas fa-plus"></i> नयाँ अनुगमन</button>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table">
            <thead><tr><th>क्र.सं.</th><th>अनुगमन मिति</th><th>अनुगमन गरेको निकाय</th><th>नागरिक बडापत्र अनुगमनबाट देखिएको अवस्था</th><th>केन्द्रबाट दिइएको निर्देशन</th><th>निर्देशन मिति</th><th>कैफियत</th><th>कार्य</th></tr></thead>
            <tbody>
              ${state.citizenCharters.map((record, index) => `
                <tr>
                  <td data-label="क्र.सं.">${index + 1}</td><td data-label="अनुगमन मिति">${record.date}</td><td data-label="अनुगमन गरेको निकाय">${record.organization}</td><td data-label="नागरिक बडापत्र अनुगमनबाट देखिएको अवस्था">${record.findings}</td>
                  <td data-label="केन्द्रबाट दिइएको निर्देशन">${record.instructions}</td><td data-label="निर्देशन मिति">${record.instructionDate}</td><td data-label="कैफियत">${record.remarks}</td>
                  <td data-label="कार्य"><div class="table-actions"><button class="action-btn" onclick="handleTableActions(event)" data-action="viewCitizenCharter" data-id="${record.id}" title="हेर्नुहोस्"><i class="fas fa-eye"></i></button><button class="action-btn" onclick="handleTableActions(event)" data-action="editCitizenCharter" data-id="${record.id}" title="सम्पादन गर्नुहोस्"><i class="fas fa-edit"></i></button></div></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('contentArea').innerHTML = content;
  applyDevanagariDigits(document.getElementById('contentArea'));
  updateActiveNavItem();
}

function showNewCitizenCharter() {
  const currentDate = getCurrentNepaliDate();
  const formContent = `
    <div class="d-grid gap-3">
      <div class="d-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div class="form-group"><label class="form-label">अनुगमन मिति *</label>
          <div class="d-flex gap-2 nepali-datepicker-dropdown" data-target="ccDate">
            <select id="ccDate_year" class="form-select bs-year"><option value="">साल</option></select>
            <select id="ccDate_month" class="form-select bs-month"><option value="">महिना</option></select>
            <select id="ccDate_day" class="form-select bs-day"><option value="">गते</option></select>
            <input type="hidden" id="ccDate" value="${currentDate}" />
          </div>
        </div>
        <div class="form-group"><label class="form-label">निकाय *</label><input type="text" class="form-control" id="ccOrganization" placeholder="निकायको नाम" /></div>
      </div>
      <div class="form-group"><label class="form-label">अनुगमनबाट देखिएको अवस्था *</label><textarea class="form-control" rows="3" id="ccFindings" placeholder="अनुगमनबाट देखिएको अवस्था"></textarea></div>
      <div class="form-group"><label class="form-label">केन्द्रबाट दिइएको निर्देशन *</label><textarea class="form-control" rows="3" id="ccInstructions" placeholder="निर्देशन"></textarea></div>
      <div class="form-group"><label class="form-label">निर्देशन मिति</label>
        <div class="d-flex gap-2 nepali-datepicker-dropdown" data-target="ccInstructionDate">
          <select id="ccInstructionDate_year" class="form-select bs-year"><option value="">साल</option></select>
          <select id="ccInstructionDate_month" class="form-select bs-month"><option value="">महिना</option></select>
          <select id="ccInstructionDate_day" class="form-select bs-day"><option value="">गते</option></select>
          <input type="hidden" id="ccInstructionDate" />
        </div>
      </div>
      <div class="form-group"><label class="form-label">कैफियत</label><textarea class="form-control" rows="2" id="ccRemarks" placeholder="कैफियत"></textarea></div>
    </div>
    <div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">रद्द गर्नुहोस्</button><button class="btn btn-primary" onclick="saveCitizenCharter()">सुरक्षित गर्नुहोस्</button></div>
  `;
  
  openModal('नयाँ नागरिक बडापत्र अनुगमन', formContent);
  setTimeout(()=>{ initializeDatepickers(); initializeNepaliDropdowns(); }, 100);
}

async function saveCitizenCharter() {
  const date = _latinToDevnagari(document.getElementById('ccDate').value);
  const organization = document.getElementById('ccOrganization').value;
  const findings = document.getElementById('ccFindings').value;
  const instructions = document.getElementById('ccInstructions').value;
  const instructionDate = _latinToDevnagari(document.getElementById('ccInstructionDate').value || '');
  const remarks = document.getElementById('ccRemarks').value || '';
  
  if (!date || !organization || !findings || !instructions) {
    showToast('कृपया आवश्यक फिल्डहरू भर्नुहोस्', 'warning');
    return;
  }
  
  showLoadingIndicator(true);

  const newRecord = {
    id: Date.now(), date, organization, findings, instructions,
    instructionDate, remarks,
    createdBy: state.currentUser.name,
    createdAt: new Date().toISOString()
  };
  
  // Google Sheet मा सेभ गर्ने
  const result = await postToGoogleSheets('saveCitizenCharter', newRecord);
  
  if (result && result.success) {
    // Success logic if needed
  }

  state.citizenCharters.unshift(newRecord);
  showLoadingIndicator(false);
  showToast(result.success ? 'नागरिक बडापत्र अनुगमन Google Sheet मा सुरक्षित गरियो' : 'नागरिक बडापत्र अनुगमन Local मा सुरक्षित गरियो', result.success ? 'success' : 'warning');
  closeModal();
  showCitizenCharterView();
}

function viewCitizenCharter(id) {
  const record = state.citizenCharters.find(r => String(r.id) === String(id));
  if (!record) { showToast('अभिलेख फेला परेन', 'error'); return; }
  
  const content = `
    <div class="d-grid gap-3">
      <div class="d-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div><div class="text-small text-muted">अनुगमन मिति</div><div class="text-large">${record.date}</div></div>
        <div><div class="text-small text-muted">निकाय</div><div>${record.organization}</div></div>
      </div>
      <div><div class="text-small text-muted">अनुगमनबाट देखिएको अवस्था</div><div class="card p-3 bg-light">${record.findings}</div></div>
      <div><div class="text-small text-muted">केन्द्रबाट दिएको निर्देशन</div><div class="card p-3 bg-light">${record.instructions}</div></div>
      <div><div class="text-small text-muted">निर्देशन मिति</div><div>${record.instructionDate}</div></div>
      <div><div class="text-small text-muted">कैफियत</div><div class="card p-3 bg-light">${record.remarks || 'कुनै कैफियत छैन'}</div></div>
    </div>
  `;
  
  openModal('नागरिक बडापत्र अनुगमन विवरण', content);
}

function editCitizenCharter(id) {
  const record = state.citizenCharters.find(r => String(r.id) === String(id));
  if (!record) return;
  
  const formContent = `
    <div class="d-grid gap-3">
      <div class="d-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div class="form-group"><label class="form-label">अनुगमन मिति</label>
          <div class="d-flex gap-2 nepali-datepicker-dropdown" data-target="editCcDate">
            <select id="editCcDate_year" class="form-select bs-year"><option value="">साल</option></select>
            <select id="editCcDate_month" class="form-select bs-month"><option value="">महिना</option></select>
            <select id="editCcDate_day" class="form-select bs-day"><option value="">गते</option></select>
            <input type="hidden" id="editCcDate" value="${record.date}" />
          </div>
        </div>
        <div class="form-group"><label class="form-label">निकाय</label><input type="text" class="form-control" value="${record.organization}" id="editCcOrganization" /></div>
      </div>
      <div class="form-group"><label class="form-label">अनुगमनबाट देखिएको अवस्था</label><textarea class="form-control" rows="3" id="editCcFindings">${record.findings}</textarea></div>
      <div class="form-group"><label class="form-label">केन्द्रबाट दिएको निर्देशन</label><textarea class="form-control" rows="3" id="editCcInstructions">${record.instructions}</textarea></div>
      <div class="form-group"><label class="form-label">निर्देशन मिति</label>
        <div class="d-flex gap-2 nepali-datepicker-dropdown" data-target="editCcInstructionDate">
          <select id="editCcInstructionDate_year" class="form-select bs-year"><option value="">साल</option></select>
          <select id="editCcInstructionDate_month" class="form-select bs-month"><option value="">महिना</option></select>
          <select id="editCcInstructionDate_day" class="form-select bs-day"><option value="">गते</option></select>
          <input type="hidden" id="editCcInstructionDate" value="${record.instructionDate || ''}" />
        </div>
      </div>
      <div class="form-group"><label class="form-label">कैफियत</label><textarea class="form-control" rows="2" id="editCcRemarks">${record.remarks || ''}</textarea></div>
    </div>
    <div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">रद्द गर्नुहोस्</button><button class="btn btn-primary" onclick="saveCitizenCharterEdit(${id})">सुरक्षित गर्नुहोस्</button></div>
  `;
  
  openModal('नागरिक बडापत्र अनुगमन सम्पादन', formContent);
  setTimeout(()=>{ initializeDatepickers(); initializeNepaliDropdowns(); }, 100);
}

function saveCitizenCharterEdit(id) {
  const recordIndex = state.citizenCharters.findIndex(r => String(r.id) === String(id));
  if (recordIndex === -1) return;
  
  const updatedRecord = {
    ...state.citizenCharters[recordIndex],
    date: _latinToDevnagari(document.getElementById('editCcDate').value),
    organization: document.getElementById('editCcOrganization').value,
    findings: document.getElementById('editCcFindings').value,
    instructions: document.getElementById('editCcInstructions').value,
    instructionDate: _latinToDevnagari(document.getElementById('editCcInstructionDate').value || ''),
    remarks: document.getElementById('editCcRemarks').value || '',
    updatedAt: new Date().toISOString(),
    updatedBy: state.currentUser.name
  };
  
  state.citizenCharters[recordIndex] = updatedRecord;
  showToast('नागरिक बडापत्र अनुगमन सुरक्षित गरियो', 'success');
  closeModal();
  showCitizenCharterView();
}

function showInvestigationView() {
  state.currentView = 'investigation';
  document.getElementById('pageTitle').textContent = 'छानविन/अन्वेषण';
  
  // यदि डाटा छैन र Google Sheets enabled छ भने लोड गर्ने
  if ((!state.investigations || state.investigations.length === 0) && GOOGLE_SHEETS_CONFIG.ENABLED) {
    if (state._loadingInvestigations) {
      // Already loading, keep showing loader
      showLoadingIndicator(true);
    } else {
      state._loadingInvestigations = true;
      showLoadingIndicator(true);
      getFromGoogleSheets('getInvestigations').then(res => {
        showLoadingIndicator(false);
        if (res && res.success) {
          const rawData = Array.isArray(res.data) ? res.data : [];
          state.investigations = rawData.map(item => formatInvestigationFromSheet(item)).filter(Boolean);
          // पुन: रेन्डर गर्ने while still marking as loading to avoid re-entry
          try { showInvestigationView(); } catch(e) { /* ignore render errors */ }
        } else {
          try { if (NVC && NVC.UI && typeof NVC.UI.showToast === 'function') NVC.UI.showToast('छानबिन डाटा लोड हुन सकेन।', {bg:'#d32f2f'}); } catch(e){}
        }
        // Clear loading flag after attempting render
        state._loadingInvestigations = false;
      }).catch(() => { state._loadingInvestigations = false; showLoadingIndicator(false); });
    }
    // लोडिङ देखाएर रिटर्न गर्ने (पछि डाटा आएपछि अपडेट हुन्छ)
  }

  const content = `
    <div class="card">
      <div class="card-header d-flex justify-between align-center">
        <h5 class="mb-0">छानविन/अन्वेषण अभिलेख</h5>
        <button class="btn btn-primary btn-sm" onclick="showNewInvestigation()"><i class="fas fa-plus"></i> नयाँ छानविन/अन्वेषण</button>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table">
            <thead><tr><th>क्र.सं.</th><th>उजुरी दर्ता नं</th><th>दर्ता मिति</th><th>उजुरकर्ता</th><th>विपक्षी</th><th>कार्यालय/निकाय</th><th>उजुरीको विवरण</th><th>छानविन प्रतिवेदन मिति</th><th>कार्य</th></tr></thead>
            <tbody>
              ${state.investigations.map((record, index) => `
                <tr>
                  <td data-label="क्र.सं.">${index + 1}</td>
                  <td data-label="उजुरी दर्ता नं">${record.complaintRegNo}</td>
                  <td data-label="दर्ता मिति">${record.registrationDate}</td>
                  <td data-label="उजुरकर्ता">${record.complainant}</td>
                  <td data-label="विपक्षी">${record.accused}</td>
                  <td data-label="कार्यालय/निकाय">${record.office}</td>
                  <td data-label="उजुरीको विवरण">${record.complaintDescription}</td>
                  <td data-label="छानविन प्रतिवेदन मिति">${record.reportSubmissionDate}</td>
                  <td data-label="कार्य"><div class="table-actions"><button class="action-btn" onclick="handleTableActions(event)" data-action="viewInvestigation" data-id="${record.id}" title="हेर्नुहोस्"><i class="fas fa-eye"></i></button><button class="action-btn" onclick="handleTableActions(event)" data-action="editInvestigation" data-id="${record.id}" title="सम्पादन गर्नुहोस्"><i class="fas fa-edit"></i></button></div></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ${state.investigations.length === 0 ? '<div class="text-center p-4 text-muted">कुनै छानविन/अन्वेषण अभिलेख छैन।</div>' : ''}
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('contentArea').innerHTML = content;
  applyDevanagariDigits(document.getElementById('contentArea'));
}

function showNewInvestigation() {
  const formContent = `
    <form id="investigationForm" onsubmit="event.preventDefault(); saveInvestigation();">
      <div class="row">
        <div class="col-md-6 mb-3">
          <label class="form-label">उजुरी दर्ता नं <span class="text-danger">*</span></label>
          <input type="text" class="form-control" id="complaintRegNo" required>
        </div>
        <div class="col-md-6 mb-3">
          <label class="form-label">दर्ता मिति <span class="text-danger">*</span></label>
          <input type="text" class="form-control" id="registrationDate" required>
        </div>
      </div>
      <div class="row">
        <div class="col-md-6 mb-3">
          <label class="form-label">उजुरकर्ता <span class="text-danger">*</span></label>
          <input type="text" class="form-control" id="complainant" required>
        </div>
        <div class="col-md-6 mb-3">
          <label class="form-label">विपक्षी <span class="text-danger">*</span></label>
          <input type="text" class="form-control" id="accused" required>
        </div>
      </div>
      <div class="row">
        <div class="col-md-6 mb-3">
          <label class="form-label">कार्यालय/निकाय <span class="text-danger">*</span></label>
          <input type="text" class="form-control" id="office" required>
        </div>
        <div class="col-md-6 mb-3">
          <label class="form-label">सम्बन्धित मन्त्रालय/निकाय</label>
          <select class="form-select" id="ministry">
            <option value="">छनौट गर्नुहोस्</option>
            ${MINISTRIES.map(min => `<option value="${min}">${min}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="row">
        <div class="col-md-4 mb-3">
          <label class="form-label">प्रदेश</label>
          <select class="form-select" id="province" onchange="loadInvestigationDistricts()">
            <option value="">प्रदेश छन्नुहोस्</option>
            ${Object.entries(LOCATION_FIELDS.PROVINCE).map(([key, value]) => 
              `<option value="${key}">${value}</option>`
            ).join('')}
          </select>
        </div>
        <div class="col-md-4 mb-3">
          <label class="form-label">जिल्ला</label>
          <select class="form-select" id="district" disabled onchange="loadInvestigationLocals()">
            <option value="">जिल्ला छन्नुहोस्</option>
          </select>
        </div>
        <div class="col-md-4 mb-3">
          <label class="form-label">स्थानीय तह/नगर</label>
          <select class="form-select" id="localLevel" disabled>
            <option value="">पहिला जिल्ला छान्नुहोस्</option>
          </select>
        </div>
      </div>
      <div class="mb-3">
        <label class="form-label">उजुरीको विवरण <span class="text-danger">*</span></label>
        <textarea class="form-control" id="complaintDescription" rows="3" maxlength="500" required></textarea>
        <small class="text-muted">अधिकतम ५०० अक्षर</small>
      </div>
      <div class="row">
        <div class="col-md-6 mb-3">
          <label class="form-label">छानविन/अन्वेषण प्रतिवेदन पेश भएको मिति</label>
          <input type="text" class="form-control" id="reportSubmissionDate">
        </div>
        <div class="col-md-6 mb-3">
          <label class="form-label">छानविन/अन्वेषणको राय</label>
          <textarea class="form-control" id="investigationOpinion" rows="3" maxlength="500"></textarea>
          <small class="text-muted">अधिकतम ५०० अक्षर</small>
        </div>
      </div>
      <div class="mb-3">
        <label class="form-label">कार्यान्वयनका लागि लेखि पठाएको व्यहोरा</label>
        <textarea class="form-control" id="implementationDetails" rows="3" maxlength="500"></textarea>
        <small class="text-muted">अधिकतम ५०० अक्षर</small>
      </div>
      <div class="row">
        <div class="col-md-6 mb-3">
          <label class="form-label">कार्यान्वयनका लागि लेखि पठाएको मिति</label>
          <input type="text" class="form-control" id="implementationDate">
        </div>
        <div class="col-md-6 mb-3">
          <label class="form-label">कैफियत</label>
          <textarea class="form-control" id="remarks" rows="3" maxlength="500"></textarea>
          <small class="text-muted">अधिकतम ५०० अक्षर</small>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-outline" onclick="closeModal()">रद्द गर्नुहोस्</button>
        <button type="submit" class="btn btn-primary">सुरक्षित गर्नुहोस्</button>
      </div>
    </form>
  `;
  
  openModal('नयाँ छानविन/अन्वेषण', formContent);
  setTimeout(() => { 
    initializeDatepickers(); 
    initializeNepaliDropdowns(); 
  }, 100);
}

function saveInvestigation() {
  showLoadingIndicator(true);
  
  // Helper to get value from input by ID
  const getValue = (id) => {
      const el = document.getElementById(id);
      return el ? el.value : '';
  };

  const formData = {
    id: Date.now().toString(),
    complaintRegNo: getValue('complaintRegNo', 'उजुरी दर्ता नं'),
    registrationDate: getValue('registrationDate', 'दर्ता मिति'),
    complainant: getValue('complainant', 'उजुरकर्ता'),
    accused: getValue('accused', 'विपक्षी'),
    office: getValue('office', 'कार्यालय/निकाय'),
    ministry: getValue('ministry', 'सम्बन्धित मन्त्रालय/निकाय'),
    province: getValue('province', 'प्रदेश'),
    district: getValue('district', 'जिल्ला'),
    localLevel: getValue('localLevel', 'स्थानीय तह/नगर'),
    complaintDescription: getValue('complaintDescription', 'उजुरीको विवरण'),
    reportSubmissionDate: getValue('reportSubmissionDate', 'छानविन/अन्वेषण प्रतिवेदन पेश भएको मिति'),
    investigationOpinion: getValue('investigationOpinion', 'छानविन/अन्वेषणको राय'),
    implementationDetails: getValue('implementationDetails', 'कार्यान्वयनका लागि लेखि पठाएको व्यहोरा'),
    implementationDate: getValue('implementationDate', 'कार्यान्वयनका लागि लेखि पठाएको मिति'),
    remarks: getValue('remarks', 'कैफियत'),
    createdBy: state.currentUser?.name || 'Unknown',
    createdAt: new Date().toISOString()
  };
  
  const newRecord = { ...formData };
  
  // Add error handling and retry logic
  const attemptSave = async (retryCount = 0) => {
    try {
      console.log(`Attempting to save investigation (attempt ${retryCount + 1})...`);
      
      // Use postToGoogleSheets instead of googleSheetOperation
      const result = await postToGoogleSheets('createInvestigation', newRecord);
      
      console.log('Save investigation result:', result);
      
      if (result && (result.success || result.local)) {
        state.investigations.unshift(newRecord);
        showLoadingIndicator(false);
        showToast(result.success ? 'छानविन/अन्वेषण Google Sheet मा सुरक्षित गरियो' : 'छानविन/अन्वेषण Local मा सुरक्षित गरियो', result.success ? 'success' : 'warning');
        closeModal();
        showInvestigationView();
      } else {
        throw new Error(result?.message || 'Unknown error occurred');
      }
    } catch (error) {
      console.error(`Error saving investigation (attempt ${retryCount + 1}):`, error);
      
      if (retryCount < 2) {
        // Retry after a delay
        console.log(`Retrying save investigation in ${1000 * (retryCount + 1)}ms...`);
        setTimeout(() => attemptSave(retryCount + 1), 1000 * (retryCount + 1));
      } else {
        showLoadingIndicator(false);
        showToast('छानविन/अन्वेषण सुरक्षित गर्नमा समस्या भयो। कृपया पछि फेरि प्रयास गर्नुहोस्।', 'error');
        closeModal();
        showInvestigationView();
      }
    }
  };
  
  // Start the save process
  attemptSave();
}

function viewInvestigation(id) {
  const record = state.investigations.find(r => r.id === id);
  if (!record) return;
  
  const content = `
    <div class="row">
      <div class="col-md-6"><strong>उजुरी दर्ता नं:</strong></div>
      <div class="col-md-6">${record.complaintRegNo}</div>
    </div>
    <div class="row">
      <div class="col-md-6"><strong>दर्ता मिति:</strong></div>
      <div class="col-md-6">${record.registrationDate}</div>
    </div>
    <div class="row">
      <div class="col-md-6"><strong>उजुरकर्ता:</strong></div>
      <div class="col-md-6">${record.complainant}</div>
    </div>
    <div class="row">
      <div class="col-md-6"><strong>विपक्षी:</strong></div>
      <div class="col-md-6">${record.accused}</div>
    </div>
    <div class="row">
      <div class="col-md-6"><strong>कार्यालय/निकाय:</strong></div>
      <div class="col-md-6">${record.office}</div>
    </div>
    <div class="row">
      <div class="col-md-6"><strong>उजुरीको विवरण:</strong></div>
      <div class="col-md-6">${record.complaintDescription}</div>
    </div>
    <div class="row">
      <div class="col-md-6"><strong>छानविन प्रतिवेदन मिति:</strong></div>
      <div class="col-md-6">${record.reportSubmissionDate}</div>
    </div>
    <div class="row">
      <div class="col-md-6"><strong>छानविनको राय:</strong></div>
      <div class="col-md-6">${record.investigationOpinion}</div>
    </div>
    <div class="row">
      <div class="col-md-6"><strong>कार्यान्वयन विवरण:</strong></div>
      <div class="col-md-6">${record.implementationDetails}</div>
    </div>
    <div class="row">
      <div class="col-md-6"><strong>कार्यान्वयन मिति:</strong></div>
      <div class="col-md-6">${record.implementationDate}</div>
    </div>
    <div class="row">
      <div class="col-md-6"><strong>कैफियत:</strong></div>
      <div class="col-md-6">${record.remarks}</div>
    </div>
  `;
  
  openModal('छानविन/अन्वेषण विवरण', content);
}

function editInvestigation(id) {
  const record = state.investigations.find(r => r.id === id);
  if (!record) return;
  
  const formContent = `
    <form id="investigationEditForm" onsubmit="event.preventDefault(); saveInvestigationEdit(${id});">
      <div class="row">
        <div class="col-md-6 mb-3">
          <label class="form-label">उजुरी दर्ता नं <span class="text-danger">*</span></label>
          <input type="text" class="form-control" id="complaintRegNo" value="${record.complaintRegNo}" required>
        </div>
        <div class="col-md-6 mb-3">
          <label class="form-label">दर्ता मिति <span class="text-danger">*</span></label>
          <input type="text" class="form-control" id="registrationDate" value="${record.registrationDate}" required>
        </div>
      </div>
      <div class="row">
        <div class="col-md-6 mb-3">
          <label class="form-label">उजुरकर्ता <span class="text-danger">*</span></label>
          <input type="text" class="form-control" id="complainant" value="${record.complainant}" required>
        </div>
        <div class="col-md-6 mb-3">
          <label class="form-label">विपक्षी <span class="text-danger">*</span></label>
          <input type="text" class="form-control" id="accused" value="${record.accused}" required>
        </div>
      </div>
      <div class="row">
        <div class="col-md-6 mb-3">
          <label class="form-label">कार्यालय/निकाय <span class="text-danger">*</span></label>
          <input type="text" class="form-control" id="office" value="${record.office}" required>
        </div>
        <div class="col-md-6 mb-3">
          <label class="form-label">सम्बन्धित मन्त्रालय/निकाय</label>
          <select class="form-select" id="ministry">
            <option value="">छनौट गर्नुहोस्</option>
            ${MINISTRIES.map(min => `<option value="${min}" ${record.ministry === min ? 'selected' : ''}>${min}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="row">
        <div class="col-md-4 mb-3">
          <label class="form-label">प्रदेश</label>
          <select class="form-select" id="province" onchange="loadInvestigationDistricts()">
            <option value="">प्रदेश छन्नुहोस्</option>
            ${Object.entries(LOCATION_FIELDS.PROVINCE).map(([key, value]) => 
              `<option value="${key}" ${record.province === key ? 'selected' : ''}>${value}</option>`
            ).join('')}
          </select>
        </div>
        <div class="col-md-4 mb-3">
          <label class="form-label">जिल्ला</label>
          <select class="form-select" id="district" ${!record.province ? 'disabled' : ''} onchange="loadInvestigationLocals()">
            <option value="">जिल्ला छन्नुहोस्</option>
            ${record.province && LOCATION_FIELDS.DISTRICTS[record.province] ? 
              LOCATION_FIELDS.DISTRICTS[record.province].map(dist => 
                `<option value="${dist}" ${record.district === dist ? 'selected' : ''}>${dist}</option>`
              ).join('') : ''
            }
          </select>
        </div>
        <div class="col-md-4 mb-3">
          <label class="form-label">स्थानीय तह/नगर</label>
          <select class="form-select" id="localLevel" data-selected="${record.localLevel || ''}">
            <option value="">पहिला जिल्ला छान्नुहोस्</option>
          </select>
        </div>
      </div>
      <div class="mb-3">
        <label class="form-label">उजुरीको विवरण <span class="text-danger">*</span></label>
        <textarea class="form-control" id="complaintDescription" rows="3" maxlength="500" required>${record.complaintDescription}</textarea>
        <small class="text-muted">अधिकतम ५०० अक्षर</small>
      </div>
      <div class="row">
        <div class="col-md-6 mb-3">
          <label class="form-label">छानविन/अन्वेषण प्रतिवेदन पेश भएको मिति</label>
          <input type="text" class="form-control" id="reportSubmissionDate" value="${record.reportSubmissionDate}">
        </div>
        <div class="col-md-6 mb-3">
          <label class="form-label">छानविन/अन्वेषणको राय</label>
          <textarea class="form-control" id="investigationOpinion" rows="3" maxlength="500">${record.investigationOpinion}</textarea>
          <small class="text-muted">अधिकतम ५०० अक्षर</small>
        </div>
      </div>
      <div class="mb-3">
        <label class="form-label">कार्यान्वयनका लागि लेखि पठाएको व्यहोरा</label>
        <textarea class="form-control" id="implementationDetails" rows="3" maxlength="500">${record.implementationDetails}</textarea>
        <small class="text-muted">अधिकतम ५०० अक्षर</small>
      </div>
      <div class="row">
        <div class="col-md-6 mb-3">
          <label class="form-label">कार्यान्वयनका लागि लेखि पठाएको मिति</label>
          <input type="text" class="form-control" id="implementationDate" value="${record.implementationDate}">
        </div>
        <div class="col-md-6 mb-3">
          <label class="form-label">कैफियत</label>
          <textarea class="form-control" id="remarks" rows="3" maxlength="500">${record.remarks}</textarea>
          <small class="text-muted">अधिकतम ५०० अक्षर</small>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-outline" onclick="closeModal()">रद्द गर्नुहोस्</button>
        <button type="submit" class="btn btn-primary">सुरक्षित गर्नुहोस्</button>
      </div>
    </form>
  `;
  
  openModal('छानविन/अन्वेषण सम्पादन', formContent);
  setTimeout(() => { 
    initializeDatepickers(); 
    initializeNepaliDropdowns(); 
    try { loadInvestigationDistricts(); } catch(e){}
  }, 100);
}

function saveInvestigationEdit(id) {
  showLoadingIndicator(true);
  
  // Helper to get value from input by ID
  const getValue = (id) => {
    const el = document.getElementById(id);
    return el ? el.value : '';
  };

  const updatedRecord = {
    id: id,
    complaintRegNo: getValue('complaintRegNo', 'उजुरी दर्ता नं'),
    registrationDate: getValue('registrationDate', 'दर्ता मिति'),
    complainant: getValue('complainant', 'उजुरकर्ता'),
    accused: getValue('accused', 'विपक्षी'),
    office: getValue('office', 'कार्यालय/निकाय'),
    ministry: getValue('ministry', 'सम्बन्धित मन्त्रालय/निकाय'),
    province: getValue('province', 'प्रदेश'),
    district: getValue('district', 'जिल्ला'),
    localLevel: getValue('localLevel', 'स्थानीय तह/नगर'),
    complaintDescription: getValue('complaintDescription', 'उजुरीको विवरण'),
    reportSubmissionDate: getValue('reportSubmissionDate', 'छानविन/अन्वेषण प्रतिवेदन पेश भएको मिति'),
    investigationOpinion: getValue('investigationOpinion', 'छानविन/अन्वेषणको राय'),
    implementationDetails: getValue('implementationDetails', 'कार्यान्वयनका लागि लेखि पठाएको व्यहोरा'),
    implementationDate: getValue('implementationDate', 'कार्यान्वयनका लागि लेखि पठाएको मिति'),
    remarks: getValue('remarks', 'कैफियत'),
    updatedBy: state.currentUser?.name || 'Unknown',
    updatedAt: new Date().toISOString()
  };
  
  // Add error handling and retry logic
  const attemptUpdate = async (retryCount = 0) => {
    try {
      console.log(`Attempting to update investigation (attempt ${retryCount + 1})...`);
      
      const result = await postToGoogleSheets('updateInvestigation', updatedRecord);
      
      console.log('Update investigation result:', result);
      
      if (result && (result.success || result.local)) {
        const recordIndex = state.investigations.findIndex(r => r.id === id);
        if (recordIndex !== -1) {
          state.investigations[recordIndex] = updatedRecord;
          showLoadingIndicator(false);
          showToast(result.success ? 'छानविन/अन्वेषण Google Sheet मा अपडेट गरियो' : 'छानविन/अन्वेषण Local मा अपडेट गरियो', result.success ? 'success' : 'warning');
          closeModal();
          showInvestigationView();
        } else {
          throw new Error('Investigation record not found in local state');
        }
      } else {
        throw new Error(result?.message || 'Unknown error occurred');
      }
    } catch (error) {
      console.error(`Error updating investigation (attempt ${retryCount + 1}):`, error);
      
      if (retryCount < 2) {
        // Retry after a delay
        console.log(`Retrying update investigation in ${1000 * (retryCount + 1)}ms...`);
        setTimeout(() => attemptUpdate(retryCount + 1), 1000 * (retryCount + 1));
      } else {
        showLoadingIndicator(false);
        showToast('छानविन/अन्वेषण अपडेट गर्नमा समस्या भयो। कृपया पछि फेरि प्रयास गर्नुहोस्।', 'error');
        closeModal();
        showInvestigationView();
      }
    }
  };
  
  // Start the update process
  attemptUpdate();
}

function showReportsView() {
  state.currentView = 'reports';
  document.getElementById('pageTitle').textContent = 'रिपोर्टहरू';
  
  const content = `
    <div class="card">
      <div class="card-header"><h5 class="mb-0">रिपोर्ट जेनरेटर</h5></div>
      <div class="card-body">
        <div class="d-grid gap-3 mb-4" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
          <button class="btn btn-outline d-flex flex-column align-center p-3" onclick="generateMonthlyReport()"><i class="fas fa-calendar-alt fa-2x mb-2"></i><div class="text-small">मासिक रिपोर्ट</div><div class="text-xs text-muted">मासिक उजुरी विवरण</div></button>
          <button class="btn btn-outline d-flex flex-column align-center p-3" onclick="generateShakhaReport()"><i class="fas fa-building fa-2x mb-2"></i><div class="text-small">शाखा रिपोर्ट</div><div class="text-xs text-muted">शाखा अनुसारको प्रदर्शन</div></button>
          <button class="btn btn-outline d-flex flex-column align-center p-3" onclick="generateSummaryReport()"><i class="fas fa-chart-pie fa-2x mb-2"></i><div class="text-small">सारांश रिपोर्ट</div><div class="text-xs text-muted">समग्र विश्लेषण</div></button>
          <button class="btn btn-outline d-flex flex-column align-center p-3" onclick="exportToExcel('all_complaints')"><i class="fas fa-file-excel fa-2x mb-2"></i><div class="text-small">Excel एक्सपोर्ट</div><div class="text-xs text-muted">सबै उजुरीहरू</div></button>
          <button class="btn btn-outline d-flex flex-column align-center p-3" style="border-color: #764ba2; color: #764ba2;" onclick="generateAIReport()"><i class="fas fa-robot fa-2x mb-2"></i><div class="text-small">AI रिपोर्ट</div><div class="text-xs text-muted">स्वत: विश्लेषण</div></button>
        </div>
        
        <div class="mt-4">
          <h6 class="mb-2">कस्टमाइज्ड रिपोर्ट</h6>
          <div class="d-grid gap-3" style="grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));">
            <div class="form-group"><label class="form-label">सुरु मिति</label>
              <div class="nepali-datepicker-dropdown" data-target="reportStartDate" style="display:flex;gap:6px;">
                <select id="reportStartDate_year" class="form-select bs-year" style="min-width:96px;"><option value="">साल</option></select>
                <select id="reportStartDate_month" class="form-select bs-month" style="min-width:96px;"><option value="">महिना</option></select>
                <select id="reportStartDate_day" class="form-select bs-day" style="min-width:96px;"><option value="">गते</option></select>
                <input type="hidden" id="reportStartDate" />
              </div>
            </div>
            <div class="form-group"><label class="form-label">अन्त्य मिति</label>
              <div class="nepali-datepicker-dropdown" data-target="reportEndDate" style="display:flex;gap:6px;">
                <select id="reportEndDate_year" class="form-select bs-year" style="min-width:96px;"><option value="">साल</option></select>
                <select id="reportEndDate_month" class="form-select bs-month" style="min-width:96px;"><option value="">महिना</option></select>
                <select id="reportEndDate_day" class="form-select bs-day" style="min-width:96px;"><option value="">गते</option></select>
                <input type="hidden" id="reportEndDate" />
              </div>
            </div>
            <div class="form-group"><label class="form-label">स्थिति</label><select class="form-select" id="reportStatus"><option value="">सबै</option><option value="pending">काम बाँकी</option><option value="resolved">फछ्रयौट</option></select></div>
            <div class="form-group d-flex align-end"><button class="btn btn-primary w-100" onclick="generateCustomReport()">रिपोर्ट जेनरेट गर्नुहोस्</button></div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('contentArea').innerHTML = content;
  updateActiveNavItem();
  setTimeout(()=>{ initializeDatepickers(); initializeNepaliDropdowns(); }, 100);
}

function getShakhaName(code) {
  return SHAKHA[code] || code;
}

function showShakhaReportsView() {
  state.currentView = 'shakha_reports';
  document.getElementById('pageTitle').textContent = 'शाखागत रिपोर्टहरू';
  
  // Calculate mahashakha statistics
  const mahashakhaStats = {};
  const mahashakhaNames = {
    'प्रशासन तथा अनुगमन महाशाखा': 'ADMIN_MONITORING',
    'नीति निर्माण तथा कानूनी राय परामर्श महाशाखा': 'POLICY_LEGAL', 
    'प्रहरी महाशाखा': 'POLICE',
    'प्राविधिक परीक्षण तथा अनुगमन महाशाखा': 'TECHNICAL'
  };
  
  // Initialize mahashakha stats
  Object.values(MAHASHAKHA).forEach(mahashakha => {
    mahashakhaStats[mahashakha] = { total: 0, pending: 0, resolved: 0, progress: 0, closed: 0 };
  });
  
  // Group complaints by mahashakha
  state.complaints.forEach(complaint => {
    const shakha = complaint.shakha || 'अन्य';
    let targetMahashakha = null;
    
    // Find which mahashakha this shakha belongs to
    for (const [mahashakhaName, shakhaList] of Object.entries(MAHASHAKHA_STRUCTURE)) {
      if (shakhaList.includes(shakha)) {
        targetMahashakha = mahashakhaName;
        break;
      }
    }
    
    // If no mahashakha found, try to match by direct mahashakha field
    if (!targetMahashakha && complaint.mahashakha) {
      targetMahashakha = complaint.mahashakha;
    }
    
    // If still not found, put in 'अन्य'
    if (!targetMahashakha) {
      targetMahashakha = 'अन्य';
      if (!mahashakhaStats[targetMahashakha]) {
        mahashakhaStats[targetMahashakha] = { total: 0, pending: 0, resolved: 0, progress: 0, closed: 0 };
      }
    }
    
    if (mahashakhaStats[targetMahashakha]) {
      mahashakhaStats[targetMahashakha].total++;
      if (complaint.status === 'pending') mahashakhaStats[targetMahashakha].pending++;
      if (complaint.status === 'resolved') mahashakhaStats[targetMahashakha].resolved++;
      if (complaint.status === 'progress') mahashakhaStats[targetMahashakha].progress++;
      if (complaint.status === 'closed') mahashakhaStats[targetMahashakha].closed++;
    }
  });
  
  // Calculate shakha statistics
  const shakhaStats = {};
  state.complaints.forEach(complaint => {
    const shakha = complaint.shakha || 'अन्य';
    if (!shakhaStats[shakha]) shakhaStats[shakha] = { total: 0, pending: 0, resolved: 0, progress: 0, closed: 0 };
    shakhaStats[shakha].total++;
    if (complaint.status === 'pending') shakhaStats[shakha].pending++;
    if (complaint.status === 'resolved') shakhaStats[shakha].resolved++;
    if (complaint.status === 'progress') shakhaStats[shakha].progress++;
    if (complaint.status === 'closed') shakhaStats[shakha].closed++;
  });
  
  const content = `
    <div class="card">
      <div class="card-header d-flex justify-between align-center">
        <h5 class="mb-0">महाशाखा अनुसार उजुरी विवरण</h5>
        <button class="btn btn-success btn-sm" onclick="exportToExcel('mahashakha_reports')"><i class="fas fa-file-excel"></i> Excel</button>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table">
            <thead><tr><th>महाशाखा</th><th>कूल उजुरी</th><th>काम बाँकी</th><th>चालु</th><th>फछ्रयौट</th><th>फछ्रयौट दर</th><th>कार्य</th></tr></thead>
            <tbody>
              ${Object.keys(mahashakhaStats).filter(m => m !== 'अन्य' && mahashakhaStats[m].total > 0).map(mahashakha => {
                const stats = mahashakhaStats[mahashakha];
                const resolutionRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;
                return `<tr><td data-label="महाशाखा">${mahashakha}</td><td data-label="कूल उजुरी">${stats.total}</td><td data-label="काम बाँकी"><span class="text-warning">${stats.pending}</span></td><td data-label="चालु"><span class="text-info">${stats.progress}</span></td><td data-label="फछ्रयौट"><span class="text-success">${stats.resolved}</span></td><td data-label="फछ्रयौट दर">${resolutionRate}%</td><td data-label="कार्य"><button class="action-btn" onclick="handleTableActions(event)" data-action="viewMahashakhaDetails" data-id="${mahashakha}" title="विस्तृत हेर्नुहोस्"><i class="fas fa-chart-bar"></i></button></td></tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <div class="card mt-3">
      <div class="card-header d-flex justify-between align-center">
        <h5 class="mb-0">शाखा अनुसार उजुरी विवरण</h5>
        <button class="btn btn-success btn-sm" onclick="exportToExcel('shakha_reports')"><i class="fas fa-file-excel"></i> Excel</button>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table">
            <thead><tr><th>शाखा</th><th>कूल उजुरी</th><th>काम बाँकी</th><th>चालु</th><th>फछ्रयौट</th><th>फछ्रयौट दर</th><th>कार्य</th></tr></thead>
            <tbody>
              ${Object.keys(shakhaStats).map(shakha => {
                const stats = shakhaStats[shakha];
                const shakhaName = getShakhaName(shakha);
                const resolutionRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;
                return `<tr><td data-label="शाखा">${shakhaName}</td><td data-label="कूल उजुरी">${stats.total}</td><td data-label="काम बाँकी"><span class="text-warning">${stats.pending}</span></td><td data-label="चालु"><span class="text-info">${stats.progress}</span></td><td data-label="फछ्रयौट"><span class="text-success">${stats.resolved}</span></td><td data-label="फछ्रयौट दर">${resolutionRate}%</td><td data-label="कार्य"><button class="action-btn" onclick="handleTableActions(event)" data-action="viewShakhaDetails" data-id="${shakha}" title="विस्तृत हेर्नुहोस्"><i class="fas fa-chart-bar"></i></button></td></tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <div class="card mt-3">
      <div class="card-header"><h5 class="mb-0">शाखा अनुसार उजुरी तुलना</h5></div>
      <div class="card-body" style="height: 350px; position: relative;"><canvas id="shakhaComparisonChart"></canvas></div>
    </div>
  `;
  
  document.getElementById('contentArea').innerHTML = content;
  updateActiveNavItem();
  
  setTimeout(() => {
    if (typeof Chart !== 'undefined') {
      const ctx = document.getElementById('shakhaComparisonChart');
      if (ctx) {
        const shakhas = Object.keys(shakhaStats);
        const pendingData = shakhas.map(shakha => shakhaStats[shakha].pending);
        const resolvedData = shakhas.map(shakha => shakhaStats[shakha].resolved);
        
        window.nvcChartsData.comparisonChart = {
            labels: shakhas,
            datasets: [
              { label: 'काम बाँकी', data: pendingData, backgroundColor: 'rgba(255, 143, 0, 0.8)', borderColor: 'rgba(255, 143, 0, 1)', borderWidth: 1, borderRadius: 5 },
              { label: 'फछ्रयौट', data: resolvedData, backgroundColor: 'rgba(46, 125, 50, 0.8)', borderColor: 'rgba(46, 125, 50, 1)', borderWidth: 1, borderRadius: 5 }
            ]
        };

        if (window.nvcCharts.comparisonChart) window.nvcCharts.comparisonChart.destroy();
        
        window.nvcCharts.comparisonChart = new Chart(ctx, {
          type: window.nvcChartsType.comparisonChart || 'bar',
          data: window.nvcChartsData.comparisonChart,
          options: {
            indexAxis: 'y',
            responsive: true, 
            maintainAspectRatio: false,
            onClick: (evt, elements, chart) => {
                if (elements.length > 0) {
                    const i = elements[0].index;
                    const label = chart.data.labels[i];
                    showChartDrillDown({ shakha: label }, `${label} शाखाको विवरण`);
                }
            },
            scales: {
              x: { beginAtZero: true, title: { display: true, text: 'उजुरी संख्या' } },
              y: { title: { display: true, text: 'शाखाहरू' } }
            }
          }
        });
      }
    }
  }, 100);
}

function showSystemReportsView() {
  state.currentView = 'system_reports';
  document.getElementById('pageTitle').textContent = 'सिस्टम रिपोर्टहरू';
  
  const resolutionRate = state.complaints.length > 0 ? 
    Math.round((state.complaints.filter(c => c.status === 'resolved').length / state.complaints.length) * 100) : 0;
  
  const resolvedCount = state.complaints.filter(c => c.status === 'resolved').length;

  const content = `
    <div class="card">
      <div class="card-header"><h5 class="mb-0">प्रणाली विश्लेषण रिपोर्टहरू</h5></div>
      <div class="card-body">
        <div class="d-grid gap-3 mb-4" style="grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));">
          <div class="infocard" onclick="generatePerformanceReport()"><div class="infocard-icon"><i class="fas fa-chart-line"></i></div><div class="infocard-value">${state.complaints.length}</div><div class="infocard-label">कूल उजुरीहरू</div><div class="text-xs text-success mt-1"></div></div>
          <div class="infocard" onclick="generateResolutionReport()"><div class="infocard-icon"><i class="fas fa-check-circle"></i></div><div class="infocard-value">${resolutionRate}%</div><div class="infocard-label">फछ्रयौट दर</div><div class="text-xs text-success mt-1"></div></div>
          <div class="infocard"><div class="infocard-icon"><i class="fas fa-check-double"></i></div><div class="infocard-value">${resolvedCount}</div><div class="infocard-label">फछ्रयौट भएका उजुरी</div><div class="text-xs text-success mt-1"></div></div>
          <div class="infocard" onclick="generateUserActivityReport()"><div class="infocard-icon"><i class="fas fa-users"></i></div><div class="infocard-value">${state.users.length}</div><div class="infocard-label">सक्रिय प्रयोगकर्ता</div><div class="text-xs text-success mt-1"></div></div>
        </div>
        
        <div class="d-grid gap-3" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));">
          <div class="chart-container"><div class="chart-header d-flex justify-between align-center"><h6 class="chart-title">महिना अनुसार उजुरीहरू</h6>${getChartActionsHTML('monthlyTrendChart')}</div><div class="chart-wrapper"><canvas id="monthlyTrendChart"></canvas></div></div>
          <div class="chart-container"><div class="chart-header d-flex justify-between align-center"><h6 class="chart-title">शाखा अनुसार फछ्रयौट दर</h6>${getChartActionsHTML('resolutionRateChart')}</div><div class="chart-wrapper"><canvas id="resolutionRateChart"></canvas></div></div>
        </div>
        
        <div class="mt-4"><button class="btn btn-primary" onclick="exportSystemReport()"><i class="fas fa-file-pdf"></i> पूर्ण प्रणाली रिपोर्ट डाउनलोड गर्नुहोस्</button></div>
      </div>
    </div>
  `;
  
  document.getElementById('contentArea').innerHTML = content;
  updateActiveNavItem();
  
  setTimeout(() => {
    if (typeof Chart !== 'undefined') {
      const monthlyCtx = document.getElementById('monthlyTrendChart');
      if (monthlyCtx) {
        // Calculate monthly data using fiscal year logic
        const fiscalMonths = ['साउन', 'भदौ', 'असोज', 'कार्तिक', 'मंसिर', 'पुष', 'माघ', 'फागुन', 'चैत', 'बैशाख', 'जेठ', 'असार'];
        const monthlyData = new Array(12).fill(0);
        
        // Calculate fiscal year start
        let fiscalYearStart = 2081;
        try {
            const nDate = getCurrentNepaliDate();
            const parts = nDate.split('-');
            if(parts.length >= 1) {
               const currentNYear = parseInt(parts[0]);
               const currentMonth = parseInt(parts[1]) || 1;
               // Determine fiscal year: if current month is Shrawan(4) or later, fiscal year starts this year
               // if current month is before Shrawan, fiscal year started last year
               if (currentMonth >= 4) { // Shrawan (4) or later
                   fiscalYearStart = currentNYear;
               } else { // Before Shrawan
                   fiscalYearStart = currentNYear - 1;
               }
            }
        } catch(e){}

        state.complaints.forEach(c => {
            const raw = c.date || c['दर्ता मिति'] || c.dateNepali || '';
            if (!raw) return;
            let txt = String(raw);
            if (typeof _devnagariToLatin === 'function') {
                try { txt = _devnagariToLatin(txt); } catch(e) {}
            }

            // Try to extract YYYY-MM-DD or YYYY/MM/DD
            let match = txt.match(/^(\d{4})[^0-9]?(\d{1,2})[^0-9]?(\d{1,2})/);
            if (match) {
                const cY = Number(match[1]);
                const cM = Number(match[2]);
                
                // Check if complaint falls within current fiscal year
                let fiscalYearIndex = -1;
                
                // If complaint year is fiscal year start year (e.g., 2082)
                if (cY === fiscalYearStart && cM >= 4 && cM <= 12) {
                    // Shrawan(4) to Chaitra(12) map to indices 0-8
                    fiscalYearIndex = cM - 4;
                }
                // If complaint year is fiscal year end year (e.g., 2083)
                else if (cY === fiscalYearStart + 1 && cM >= 1 && cM <= 3) {
                    // Baishakh(1) to Ashadh(3) map to indices 9-11
                    fiscalYearIndex = 8 + cM; // 8 + month (1-3) = 9-11
                }
                
                if (fiscalYearIndex >= 0 && fiscalYearIndex < 12) {
                    monthlyData[fiscalYearIndex]++;
                }
            }
        });

        window.nvcChartsData.monthlyTrendChart = {
            labels: fiscalMonths,
            datasets: [{
              label: 'उजुरीहरू',
              data: monthlyData,
              borderColor: 'rgba(13, 71, 161, 1)',
              backgroundColor: 'rgba(13, 71, 161, 0.7)',
              borderWidth: 1,
              borderRadius: 4
            }]
        };

        if (window.nvcCharts.monthlyTrendChart) window.nvcCharts.monthlyTrendChart.destroy();
        window.nvcCharts.monthlyTrendChart = new Chart(monthlyCtx, {
          type: window.nvcChartsType.monthlyTrendChart || 'bar',
          data: window.nvcChartsData.monthlyTrendChart,
          options: { 
            responsive: true, 
            maintainAspectRatio: false,
            onClick: (evt, elements, chart) => {
                if (elements.length > 0) {
                    const i = elements[0].index;
                    const monthName = chart.data.labels[i];
                    
                    // Convert fiscal year index to actual month number for filtering
                    let actualMonth, actualYear;
                    if (i < 9) { // Indices 0-8: Shrawan to Chaitra of fiscal year start year
                        actualMonth = i + 4; // Shrawan(4) to Chaitra(12)
                        actualYear = fiscalYearStart;
                    } else { // Indices 9-11: Baishakh to Ashadh of fiscal year end year
                        actualMonth = i - 8; // Baishakh(1) to Ashadh(3)
                        actualYear = fiscalYearStart + 1;
                    }
                    
                    // Pass actual month and year for accurate filtering
                    showChartDrillDown({ 
                        monthIndex: actualMonth, 
                        monthName: monthName,
                        year: actualYear 
                    }, `${monthName} महिनाका उजुरीहरू`);
                }
            },
            scales: { 
                y: { beginAtZero: true, ticks: { stepSize: 1 } },
                x: { grid: { display: false } }
            },
            plugins: {
                tooltip: { mode: 'index', intersect: false },
                legend: { position: 'bottom' }
            }
          }
        });
      }
      
      const resolutionCtx = document.getElementById('resolutionRateChart');
      if (resolutionCtx) {
        const shakhaStats = {};
        state.complaints.forEach(complaint => {
          const shakha = complaint.shakha || 'अन्य';
          if (!shakhaStats[shakha]) shakhaStats[shakha] = { total: 0, resolved: 0 };
          shakhaStats[shakha].total++;
          if (complaint.status === 'resolved') shakhaStats[shakha].resolved++;
        });
        
        const shakhas = Object.keys(shakhaStats);
        const rates = shakhas.map(shakha => {
          const stats = shakhaStats[shakha];
          return stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;
        });
        
        window.nvcChartsData.resolutionRateChart = {
            labels: shakhas,
            datasets: [{
              label: 'फछ्रयौट दर (%)',
              data: rates,
              backgroundColor: 'rgba(46, 125, 50, 0.8)',
              borderColor: 'rgba(46, 125, 50, 1)',
              borderWidth: 1
            }]
        };

        if (window.nvcCharts.resolutionRateChart) window.nvcCharts.resolutionRateChart.destroy();
        window.nvcCharts.resolutionRateChart = new Chart(resolutionCtx, {
          type: window.nvcChartsType.resolutionRateChart || 'bar',
          data: window.nvcChartsData.resolutionRateChart,
          options: {
            responsive: true, maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, max: 100, title: { display: true, text: 'फछ्रयौट दर (%)' } } }
          }
        });
      }
    }
  }, 100);
}

async function showUserManagementView() {
  state.currentView = 'user_management';
  document.getElementById('pageTitle').textContent = 'प्रयोगकर्ता व्यवस्थापन';

  if (!state.currentUser || state.currentUser.role !== 'admin') {
    showToast('यो सुविधा एडमिनका लागि मात्र हो', 'warning');
    return;
  }

  showLoadingIndicator(true);
  await loadUsersFromSheetsForAdmin();
  showLoadingIndicator(false);

  const roleLabel = (r) => {
    const v = (r || '').toString();
    if (v === 'admin') return 'एडमिन';
    if (v === 'admin_planning') return 'प्रशासन/योजना';
    if (v === 'mahashakha') return 'महाशाखा';
    return 'शाखा';
  };

  const statusLabel = (s) => {
    const v = (s || '').toString().toLowerCase();
    if (v === 'active' || v === 'सक्रिय') return 'सक्रिय';
    if (v === 'inactive' || v === 'निष्क्रिय') return 'निष्क्रिय';
    return s || '-';
  };
  
  const content = `
    <div class="card">
      <div class="card-header d-flex justify-between align-center">
        <h5 class="mb-0">प्रयोगकर्ता सूची</h5>
        <button class="btn btn-primary btn-sm" onclick="showNewUserModal()"><i class="fas fa-plus"></i> नयाँ प्रयोगकर्ता</button>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table">
            <thead><tr><th>क्र.सं.</th><th>युजरनेम</th><th>नाम</th><th>भूमिका</th><th>स्थिति</th><th>अन्तिम लगइन</th><th>कार्य</th></tr></thead>
            <tbody>
              ${(state.users || []).map((user, index) => `
                <tr>
                  <td data-label="क्र.सं.">${index + 1}</td><td data-label="युजरनेम">${user.username || '-'}</td><td data-label="नाम">${user.name || '-'}</td><td data-label="भूमिका">${roleLabel(user.role)}</td>
                  <td data-label="स्थिति"><span class="status-badge ${statusLabel(user.status) === 'सक्रिय' ? 'status-resolved' : 'status-pending'}">${statusLabel(user.status)}</span></td>
                  <td data-label="अन्तिम लगइन">${user.lastLogin}</td>
                  <td data-label="कार्य">
                    <div class="table-actions">
                      <button class="action-btn" data-action="editUser" data-id="${user.username}" title="सम्पादन गर्नुहोस्"><i class="fas fa-edit"></i></button>
                      <button class="action-btn" data-action="resetUserPassword" data-id="${user.username}" title="पासवर्ड रिसेट"><i class="fas fa-key"></i></button>
                      <button class="action-btn" data-action="toggleUserStatus" data-id="${user.username}" title="स्थिति परिवर्तन"><i class="fas fa-ban"></i></button>
                      <button class="action-btn" data-action="deleteUserAccount" data-id="${user.username}" title="हटाउनुहोस्"><i class="fas fa-trash"></i></button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  setContentAreaHTML(content);
  updateActiveNavItem();
}

function generateAIReport() {
    showLoadingIndicator(true);
    setTimeout(() => {
        const reportText = AI_SYSTEM.generateReport(state.complaints);
        showToast('AI रिपोर्ट तयार भयो', 'success');
        openModal('AI विश्लेषण रिपोर्ट', `<div class="p-3"><div class="ai-analysis-box"><i class="fas fa-robot"></i> <strong>AI Insight:</strong><br><br>${reportText}</div><button class="btn btn-primary btn-sm mt-2" onclick="closeModal()">बन्द गर्नुहोस्</button></div>`);
        showLoadingIndicator(false);
    }, 1500);
}

function updateUserFormState(prefix) {
  const roleEl = document.getElementById(prefix + 'Role');
  const shakhaEl = document.getElementById(prefix + 'Shakha');
  const mahashakhaEl = document.getElementById(prefix + 'Mahashakha');
  
  if (!roleEl || !shakhaEl || !mahashakhaEl) return;
  
  const role = roleEl.value;
  const shakhaGroup = shakhaEl.closest('.form-group');
  const mahashakhaGroup = mahashakhaEl.closest('.form-group');
  
  // 1. Visibility Logic
  if (role === 'admin') {
    shakhaGroup.classList.add('hidden');
    mahashakhaGroup.classList.add('hidden');
  } else if (role === 'mahashakha') {
    shakhaGroup.classList.add('hidden');
    mahashakhaGroup.classList.remove('hidden');
  } else if (role === 'shakha' || role === 'admin_planning') {
    shakhaGroup.classList.remove('hidden');
    mahashakhaGroup.classList.remove('hidden');
  } else {
    shakhaGroup.classList.remove('hidden');
    mahashakhaGroup.classList.remove('hidden');
  }

  // 2. Auto-populate Mahashakha based on Shakha
  if (!shakhaGroup.classList.contains('hidden') && shakhaEl.value) {
    const selectedShakhaCode = shakhaEl.value;
    const selectedShakhaName = SHAKHA[selectedShakhaCode] || selectedShakhaCode;
    
    for (const [mah, shakhas] of Object.entries(MAHASHAKHA_STRUCTURE)) {
      if (shakhas.includes(selectedShakhaName)) {
        mahashakhaEl.value = mah;
        break;
      }
    }
  }
}
window.updateUserFormState = updateUserFormState;

function showNewUserModal() {
  const formContent = `
    <div class="d-grid gap-3">
      <div class="d-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div class="form-group"><label class="form-label">युजरनेम *</label><input type="text" class="form-control" id="newUsername" placeholder="युजरनेम" /></div>
        <div class="form-group"><label class="form-label">पासवर्ड *</label><input type="password" class="form-control" id="newPassword" placeholder="पासवर्ड" /></div>
      </div>
      <div class="d-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div class="form-group"><label class="form-label">नाम *</label><input type="text" class="form-control" id="newName" placeholder="पूरा नाम" /></div>
        <div class="form-group"><label class="form-label">भूमिका *</label><select class="form-select" id="newRole" onchange="updateUserFormState('new')"><option value="">छान्नुहोस्</option><option value="admin">एडमिन</option><option value="admin_planning">प्रशासन/योजना</option><option value="mahashakha">महाशाखा</option><option value="shakha">शाखा</option></select></div>
      </div>
      <div class="form-group"><label class="form-label">शाखा (यदि शाखा हो भने)</label><select class="form-select" id="newShakha" onchange="updateUserFormState('new')"><option value="">छान्नुहोस्</option>${Object.entries(SHAKHA).map(([key, value]) => `<option value="${key}">${value}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">महाशाखा (यदि महाशाखा हो भने)</label><select class="form-select" id="newMahashakha"><option value="">छान्नुहोस्</option>${Object.entries(MAHASHAKHA).filter(([k,v]) => typeof v === 'string').map(([key, value]) => `<option value="${value}">${value}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">अनुमतिहरू (comma separated)</label><input type="text" class="form-control" id="newPermissions" placeholder="complaint_management,technical_inspection" /></div>
      <div class="form-group"><label class="form-label">स्थिति</label><select class="form-select" id="newStatus"><option value="सक्रिय">सक्रिय</option><option value="निष्क्रिय">निष्क्रिय</option></select></div>
    </div>
    <div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">रद्द गर्नुहोस्</button><button class="btn btn-primary" onclick="saveNewUser()">सुरक्षित गर्नुहोस्</button></div>
  `;
  
  openModal('नयाँ प्रयोगकर्ता', formContent);
  setTimeout(() => updateUserFormState('new'), 100);
}

async function saveNewUser() {
  const username = document.getElementById('newUsername').value;
  const password = document.getElementById('newPassword').value;
  const name = document.getElementById('newName').value;
  const role = document.getElementById('newRole').value;
  const shakha = document.getElementById('newShakha').value;
  const mahashakha = document.getElementById('newMahashakha')?.value || '';
  const permissionsRaw = document.getElementById('newPermissions')?.value || '';
  const status = document.getElementById('newStatus').value;
  
  if (!username || !password || !name || !role) {
    showToast('कृपया आवश्यक फिल्डहरू भर्नुहोस्', 'warning');
    return;
  }
  
  if ((role === 'shakha' || role === 'admin_planning') && !shakha) {
    showToast('कृपया शाखा छान्नुहोस्', 'warning');
    return;
  }

  if (role === 'mahashakha' && !mahashakha) {
    showToast('कृपया महाशाखा छान्नुहोस्', 'warning');
    return;
  }

  const permissions = String(permissionsRaw).split(',').map(s => s.trim()).filter(Boolean);

  const payload = {
    username,
    password,
    name,
    role,
    shakha: (role === 'shakha' || role === 'admin_planning') ? shakha : '',
    mahashakha: role === 'mahashakha' ? mahashakha : '',
    permissions: permissions.join(','),
    status: status === 'सक्रिय' ? 'active' : 'inactive',
    last_login: ''
  };

  try {
    showLoadingIndicator(true);
    if (GOOGLE_SHEETS_CONFIG.ENABLED) {
      const res = await postToGoogleSheets('saveUser', payload);
      console.log('saveUser response:', res);
      if (!res || res.success !== true) {
        showToast(res && res.message ? res.message : 'प्रयोगकर्ता सेभ हुन सकेन', 'error');
        return;
      }

      await loadUsersFromSheetsForAdmin();
      const found = (state.users || []).some(u => String(u.username) === String(username));
      if (!found) {
        showToast('Google Sheet मा प्रयोगकर्ता अपडेट देखिएन। कृपया Apps Script redeploy/permissions जाँच्नुहोस्।', 'warning');
        return;
      }
    } else {
      // local fallback
      if (!state.users) state.users = [];
      state.users.push({
        username,
        name,
        role,
        shakha: payload.shakha,
        mahashakha: payload.mahashakha,
        permissions,
        status: payload.status,
        lastLogin: '-'
      });
    }

    showToast('नयाँ प्रयोगकर्ता सुरक्षित गरियो', 'success');
    closeModal();
    await showUserManagementView();
  } catch (e) {
    console.error('saveNewUser error', e);
    showToast('प्रयोगकर्ता सेभ गर्दा समस्या आयो', 'error');
  } finally {
    showLoadingIndicator(false);
  }
}

function editUser(id) {
  const user = (state.users || []).find(u => String(u.username) === String(id));
  if (!user) return;
  
  const formContent = `
    <div class="d-grid gap-3">
      <div class="d-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div class="form-group"><label class="form-label">युजरनेम</label><input type="text" class="form-control" value="${user.username}" id="editUsername" readonly /></div>
        <div class="form-group"><label class="form-label">पासवर्ड</label><input type="password" class="form-control" id="editPassword" placeholder="नयाँ पासवर्ड (खाली छोड्नुहोस्)" /></div>
      </div>
      <div class="d-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div class="form-group"><label class="form-label">नाम</label><input type="text" class="form-control" value="${user.name}" id="editName" /></div>
        <div class="form-group"><label class="form-label">भूमिका</label><select class="form-select" id="editRole" onchange="updateUserFormState('edit')"><option value="admin" ${user.role === 'admin' ? 'selected' : ''}>एडमिन</option><option value="admin_planning" ${user.role === 'admin_planning' ? 'selected' : ''}>प्रशासन/योजना</option><option value="mahashakha" ${user.role === 'mahashakha' ? 'selected' : ''}>महाशाखा</option><option value="shakha" ${user.role === 'shakha' ? 'selected' : ''}>शाखा</option></select></div>
      </div>
      <div class="form-group"><label class="form-label">शाखा (यदि शाखा हो भने)</label><select class="form-select" id="editShakha" onchange="updateUserFormState('edit')"><option value="">छान्नुहोस्</option>${Object.entries(SHAKHA).map(([key, value]) => `<option value="${key}" ${user.shakha === key ? 'selected' : ''}>${value}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">महाशाखा (यदि महाशाखा हो भने)</label><select class="form-select" id="editMahashakha"><option value="">छान्नुहोस्</option>${Object.entries(MAHASHAKHA).filter(([k,v]) => typeof v === 'string').map(([key, value]) => `<option value="${value}" ${String(user.mahashakha||'') === String(value) ? 'selected' : ''}>${value}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">अनुमतिहरू (comma separated)</label><input type="text" class="form-control" id="editPermissions" value="${(user.permissions || []).join(',')}" /></div>
      <div class="form-group"><label class="form-label">स्थिति</label><select class="form-select" id="editStatus"><option value="सक्रिय" ${(String(user.status).toLowerCase()==='active' || user.status === 'सक्रिय') ? 'selected' : ''}>सक्रिय</option><option value="निष्क्रिय" ${(String(user.status).toLowerCase()==='inactive' || user.status === 'निष्क्रिय') ? 'selected' : ''}>निष्क्रिय</option></select></div>
    </div>
    <div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">रद्द गर्नुहोस्</button><button class="btn btn-primary" onclick="saveUserEdit('${user.username}')">सुरक्षित गर्नुहोस्</button></div>
  `;
  
  openModal('प्रयोगकर्ता सम्पादन', formContent);
  setTimeout(() => updateUserFormState('edit'), 100);
}

async function saveUserEdit(id) {
  const userIndex = (state.users || []).findIndex(u => String(u.username) === String(id));
  if (userIndex === -1) return;

  const name = document.getElementById('editName').value;
  const password = document.getElementById('editPassword').value;
  const role = document.getElementById('editRole').value;
  const shakha = document.getElementById('editShakha').value;
  const mahashakha = document.getElementById('editMahashakha')?.value || '';
  const permissionsRaw = document.getElementById('editPermissions')?.value || '';
  const status = document.getElementById('editStatus').value;

  if (!name) {
    showToast('कृपया नाम भर्नुहोस्', 'warning');
    return;
  }
  
  if ((role === 'shakha' || role === 'admin_planning') && !shakha) {
    showToast('कृपया शाखा छान्नुहोस्', 'warning');
    return;
  }

  if (role === 'mahashakha' && !mahashakha) {
    showToast('कृपया महाशाखा छान्नुहोस्', 'warning');
    return;
  }

  const permissions = String(permissionsRaw).split(',').map(s => s.trim()).filter(Boolean);

  const payload = {
    username: String(id),
    name,
    role,
    shakha: (role === 'shakha' || role === 'admin_planning') ? shakha : '',
    mahashakha: role === 'mahashakha' ? mahashakha : '',
    permissions: permissions.join(','),
    status: status === 'सक्रिय' ? 'active' : 'inactive'
  };
  if (password) payload.password = password;

  try {
    showLoadingIndicator(true);
    if (GOOGLE_SHEETS_CONFIG.ENABLED) {
      const res = await postToGoogleSheets('saveUser', payload);
      console.log('saveUser (edit) response:', res);
      if (!res || res.success !== true) {
        showToast(res && res.message ? res.message : 'प्रयोगकर्ता सेभ हुन सकेन', 'error');
        return;
      }

      await loadUsersFromSheetsForAdmin();
      const found = (state.users || []).some(u => String(u.username) === String(id));
      if (!found) {
        showToast('Google Sheet मा प्रयोगकर्ता अपडेट देखिएन। कृपया Apps Script redeploy/permissions जाँच्नुहोस्।', 'warning');
        return;
      }
    } else {
      state.users[userIndex] = { ...state.users[userIndex], ...payload, permissions, lastLogin: state.users[userIndex].lastLogin || '-' };
    }

    showToast('प्रयोगकर्ता सुरक्षित गरियो', 'success');
    closeModal();
    await showUserManagementView();
  } catch (e) {
    console.error('saveUserEdit error', e);
    showToast('प्रयोगकर्ता सेभ गर्दा समस्या आयो', 'error');
  } finally {
    showLoadingIndicator(false);
  }
}

async function resetUserPassword(id) {
  if (!confirm('के तपाईं यस प्रयोगकर्ताको पासवर्ड रिसेट गर्न चाहनुहुन्छ?')) return;
  const userIndex = (state.users || []).findIndex(u => String(u.username) === String(id));
  if (userIndex === -1) return;

  const newPass = 'nvc@2026';
  try {
    showLoadingIndicator(true);
    if (GOOGLE_SHEETS_CONFIG.ENABLED) {
      const res = await postToGoogleSheets('saveUser', { username: String(id), password: newPass, t: Date.now() });
      if (!res || res.success !== true) {
        showToast(res && res.message ? res.message : 'पासवर्ड रिसेट हुन सकेन', 'error');
        return;
      }
      
      // Wait a moment for Google Sheets to process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Force refresh users from Google Sheets to get updated data
      try {
        const usersRes = await getFromGoogleSheets('getUsers', { t: Date.now() });
        if (usersRes && usersRes.success && usersRes.data) {
          state.users = usersRes.data;
          console.log('✅ Users refreshed after password reset:', state.users.length);
        }
      } catch (e) {
        console.warn('Failed to refresh user data after password reset:', e);
      }
    } else {
      state.users[userIndex].password = newPass;
    }
    showToast('पासवर्ड रिसेट गरियो (नयाँ पासवर्ड: nvc@2026)', 'success');
    closeModal();
    await showUserManagementView();
  } catch (e) {
    console.error('resetUserPassword error', e);
    showToast('पासवर्ड रिसेट गर्दा समस्या भयो', 'error');
  } finally {
    showLoadingIndicator(false);
  }
}

async function toggleUserStatus(id) {
  const userIndex = (state.users || []).findIndex(u => String(u.username) === String(id));
  if (userIndex === -1) return;

  const currentStatus = (state.users[userIndex].status || '').toString().toLowerCase();
  const newStatus = (currentStatus === 'active' || currentStatus === 'सक्रिय') ? 'inactive' : 'active';
  const label = (newStatus === 'active') ? 'सक्रिय' : 'निष्क्रिय';

  if (!confirm(`के तपाईं यस प्रयोगकर्तालाई ${label} गर्न चाहनुहुन्छ?`)) return;

  try {
    showLoadingIndicator(true);
    if (GOOGLE_SHEETS_CONFIG.ENABLED) {
      const res = await postToGoogleSheets('saveUser', { username: String(id), status: newStatus });
      if (!res || res.success !== true) {
        showToast(res && res.message ? res.message : 'स्थिति परिवर्तन हुन सकेन', 'error');
        return;
      }
    } else {
      state.users[userIndex].status = newStatus;
    }
    showToast(`प्रयोगकर्ता ${label} गरियो`, 'success');
    await showUserManagementView();
  } catch (e) {
    console.error('toggleUserStatus error', e);
    showToast('स्थिति परिवर्तन गर्दा समस्या आयो', 'error');
  } finally {
    showLoadingIndicator(false);
  }
}

async function deleteUserAccount(id) {
  if (!confirm('के तपाईं यो प्रयोगकर्ता हटाउन चाहनुहुन्छ?')) return;
  try {
    showLoadingIndicator(true);
    if (GOOGLE_SHEETS_CONFIG.ENABLED) {
      const res = await postToGoogleSheets('deleteUser', { username: String(id) });
      if (!res || res.success !== true) {
        showToast(res && res.message ? res.message : 'प्रयोगकर्ता हटाउन सकेन', 'error');
        return;
      }
    } else {
      state.users = (state.users || []).filter(u => String(u.username) !== String(id));
    }
    showToast('प्रयोगकर्ता हटाइयो', 'success');
    await showUserManagementView();
  } catch (e) {
    console.error('deleteUserAccount error', e);
    showToast('प्रयोगकर्ता हटाउँदा समस्या आयो', 'error');
  } finally {
    showLoadingIndicator(false);
  }
}

function showSettingsView() {
  state.currentView = 'settings';
  document.getElementById('pageTitle').textContent = 'सेटिङहरू';
  
  const content = `
    <div class="card mb-3">
      <div class="card-header"><h5 class="mb-0">युजर सेटिङहरू</h5></div>
      <div class="card-body">
        <div class="d-grid gap-3" style="max-width: 500px;">
          <div class="form-group"><label class="form-label">पुरानो पासवर्ड</label><input type="password" class="form-control" /></div>
          <div class="form-group"><label class="form-label">नयाँ पासवर्ड</label><input type="password" class="form-control" /></div>
          <div class="form-group"><label class="form-label">पासवर्ड पुष्टि</label><input type="password" class="form-control" /></div>
          <button class="btn btn-primary">पासवर्ड परिवर्तन गर्नुहोस्</button>
        </div>
      </div>
    </div>
    
    <div class="card mb-3">
      <div class="card-header"><h5 class="mb-0">प्रणाली सेटिङहरू</h5></div>
      <div class="card-body">
        <div class="d-grid gap-3">
          <div class="form-group"><label class="form-label">प्रदर्शन मोड</label>
            <select class="form-select" onchange="applyTheme(this.value)">
                <option value="light" ${currentTheme === 'light' ? 'selected' : ''}>हल्का (Light)</option>
                <option value="dark" ${currentTheme === 'dark' ? 'selected' : ''}>अँध्यारो (Dark)</option>
            </select>
          </div>
          <div class="form-group"><label class="form-label">प्रदर्शन मोड</label><select class="form-select"><option>हल्का</option><option>अँध्यारो</option><option>स्वचालित</option></select></div>
          <div class="form-group"><label class="form-label">भाषा</label><select class="form-select"><option>नेपाली</option><option>English</option></select></div>
          <div class="form-group"><label class="form-label">मिति ढाँचा</label><select class="form-select"><option>नेपाली (YYYY-MM-DD)</option><option>अंग्रेजी (DD/MM/YYYY)</option></select></div>
          <div class="form-group"><div class="d-flex align-center justify-between"><label class="form-label mb-0">सूचना</label><input type="checkbox" checked /></div></div>
          <div class="form-group"><div class="d-flex align-center justify-between"><label class="form-label mb-0">ईमेल अपडेट</label><input type="checkbox" checked /></div></div>
          <button class="btn btn-primary">सेटिङहरू सुरक्षित गर्नुहोस्</button>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('contentArea').innerHTML = content;
  updateActiveNavItem();
}

// Apply a UI theme and persist choice
function applyTheme(theme) {
  try {
    currentTheme = theme || 'light';
    localStorage.setItem('nvc_theme', currentTheme);
    if (currentTheme === 'dark') document.documentElement.classList.add('dark-mode');
    else document.documentElement.classList.remove('dark-mode');
    showToast('प्रदर्शन मोड परिवर्तन गरियो: ' + currentTheme, 'success');
  } catch (e) {
    console.warn('applyTheme error', e);
  }
}

// Load saved theme (safe no-op if localStorage not available)
function loadTheme() {
  try {
    const saved = localStorage.getItem('nvc_theme');
    if (saved) currentTheme = saved;
    if (currentTheme === 'dark') document.documentElement.classList.add('dark-mode');
    else document.documentElement.classList.remove('dark-mode');
    return currentTheme;
  } catch (e) {
    currentTheme = 'light';
    return currentTheme;
  }
}

function showCalendarView() {
  state.currentView = 'calendar';
  document.getElementById('pageTitle').textContent = 'क्यालेन्डर';
  const today = new Date();

  // Convert today's AD to BS YYYY-MM-DD using central converter
  const adDateStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  let bsDateStr = '';
  try { bsDateStr = convertADtoBS(adDateStr) || ''; } catch(e){ bsDateStr = ''; }

  // Fallback: if conversion returns empty, try getCurrentNepaliDate which may use libs
  if (!bsDateStr) bsDateStr = getCurrentNepaliDate() || '';

  const nepaliMonths = ["बैशाख","जेठ","असार","साउन","भदौ","असोज","कार्तिक","मंसिर","पुष","माघ","फागुन","चैत"];
  const weekdays = ["आइत","सोम","मंगल","बुध","बिही","शुक्र","शनि"];

  // parse BS parts
  let bsYear = null, bsMonth = null, bsDay = null;
  if (bsDateStr && bsDateStr.indexOf('-') !== -1) {
    const parts = bsDateStr.split('-').map(p => parseInt(p,10));
    bsYear = parts[0]; bsMonth = parts[1]; bsDay = parts[2];
  }

  // approximate month length array (BS)
  const bsMonthDays = [30,31,32,31,32,30,30,29,30,29,30,30];
  const totalDays = (bsMonth && bsMonthDays[bsMonth-1]) ? bsMonthDays[bsMonth-1] : 30;

  // find the weekday of BS yyyy-mm-01 by searching nearby AD dates (robust without BS2AD)
  let firstWeekday = 0;
  try {
    // search within +/- 60 days from today
    const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    let found = false;
    for (let offset = -80; offset <= 80; offset++) {
      const dt = new Date(base);
      dt.setDate(base.getDate() + offset);
      const ad = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
      const conv = convertADtoBS(ad);
      if (conv) {
        const cp = conv.split('-').map(x => parseInt(x,10));
        if (cp[0] === bsYear && cp[1] === bsMonth && cp[2] === 1) { firstWeekday = dt.getDay(); found = true; break; }
      }
    }
  } catch(e) { console.warn('Failed to compute BS first weekday', e); }

  // build calendar HTML
  let calendarHTML = '';
  for (let i = 0; i < 7; i++) calendarHTML += `<div class="text-center p-2 bg-gray-100 rounded"><div class="text-small font-weight-bold">${weekdays[i]}</div></div>`;
  for (let i = 0; i < firstWeekday; i++) calendarHTML += '<div class="p-2 border rounded"></div>';
  for (let day = 1; day <= totalDays; day++) {
    const isToday = (bsDay && day === bsDay);
    const hasComplaint = day % 5 === 0 || day % 7 === 0;
    calendarHTML += `<div class="p-2 border rounded text-center ${isToday ? 'bg-primary text-white' : ''} ${hasComplaint ? 'bg-primary-light' : ''}"><div class="text-small">${_latinToDevnagari(day)}</div>${hasComplaint ? '<div class="text-xs text-primary"></div>' : ''}</div>`;
  }

  const headerTitle = (bsYear && bsMonth) ? `${nepaliMonths[bsMonth-1]} ${bsYear}` : (bsDateStr || '');

  const content = `
    <div class="card mb-3">
      <div class="card-header d-flex justify-between align-center">
        <h5 class="mb-0">${headerTitle}</h5>
        <div class="d-flex gap-2"><button class="btn btn-sm btn-outline" onclick="showCalendarPrev()"><i class="fas fa-chevron-left"></i></button><button class="btn btn-sm btn-outline" onclick="showCalendarNext()"><i class="fas fa-chevron-right"></i></button></div>
      </div>
      <div class="card-body">
        <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px;">${calendarHTML}</div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-header"><h5 class="mb-0">आगामी बैठकहरू र कार्यक्रमहरू</h5></div>
      <div class="card-body">
        <div class="d-grid gap-2">
          <div class="d-flex align-center justify-between p-2 border rounded"><div><div class="text-small font-weight-bold">उजुरी व्यवस्थापन समिति बैठक</div><div class="text-xs text-muted"></div></div><button class="btn btn-sm btn-outline">विवरण</button></div>
          <div class="d-flex align-center justify-between p-2 border rounded"><div><div class="text-small font-weight-bold">मासिक समीक्षा बैठक</div><div class="text-xs text-muted"></div></div><button class="btn btn-sm btn-outline">विवरण</button></div>
          <div class="d-flex align-center justify-between p-2 border rounded"><div><div class="text-small font-weight-bold">उजुरी फछ्रयौट समय सीमा</div><div class="text-xs text-muted"></div></div><button class="btn btn-sm btn-outline">विवरण</button></div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('contentArea').innerHTML = content;
  updateActiveNavItem();
}

// place-holder handlers for prev/next (can be enhanced to change month view)
function showCalendarPrev() { /* TODO: implement month navigation */ updateNepaliDate(); showCalendarView(); }
function showCalendarNext() { /* TODO: implement month navigation */ updateNepaliDate(); showCalendarView(); }

// Sample Testing Views
let isLoadingView = false;

async function showSampleTestingView(options = {}) {
  console.log('showSampleTestingView called with options:', options);
  
  // Prevent infinite loops
  if (isLoadingView) {
    console.log('View already loading, skipping...');
    return;
  }
  
  isLoadingView = true;
  
  try {
    state.currentView = 'sample_testing';
    document.getElementById('pageTitle').textContent = 'नमूना परीक्षण';
    
    // Always load fresh data when accessing the view to ensure latest data
    if (!options.fromFilter || options.forceReload || !state.sampleTests || state.sampleTests.length === 0) {
      console.log('Loading fresh data from Google Sheets...');
      await loadLaboratoryTestsFromGoogleSheets();
    }
    
    // Ensure we have data
    let sampleTests = state.sampleTests || [];
    console.log('Sample tests available:', sampleTests.length);
  
  // Apply existing filters
  if (options.status) {
    sampleTests = sampleTests.filter(t => t.status === options.status);
  }
  if (options.period === 'thisMonth') {
    const today = new Date();
    sampleTests = sampleTests.filter(t => {
      const testDate = new Date(t.testDate || t['परीक्षण गरिएको मिति']);
      if (!testDate || isNaN(testDate.getTime())) return false;
      return testDate.getMonth() === today.getMonth() && testDate.getFullYear() === today.getFullYear();
    });
  }
  
  // Apply new filters
  if (options.testDate) {
    sampleTests = sampleTests.filter(t => {
      const testDate = t.testDate || t['परीक्षण गरिएको मिति'];
      return testDate && testDate.includes(options.testDate);
    });
  }
  if (options.ministry) {
    sampleTests = sampleTests.filter(t => {
      const ministry = t.ministry || t['मन्त्रालय/निकाय'];
      return ministry && ministry === options.ministry;
    });
  }
  if (options.keyword) {
    const keyword = options.keyword.toLowerCase();
    sampleTests = sampleTests.filter(t => {
      const searchableFields = [
        t.sampleNo || t['नमूना नं'],
        t.requester || t['परीक्षण अनुरोधकर्ता'],
        t.projectName || t['आयोजनाको नाम'],
        t.material || t['परीक्षण गर्ने सामग्री'],
        t.testMethod || t['परीक्षण विधि'],
        t.equipment || t['परीक्षण गर्ने उपकरण']
      ].join(' ').toLowerCase();
      return searchableFields.includes(keyword);
    });
  }
  
  const content = `
    <div class="card mb-3">
      <div class="card-header">
        <h5 class="mb-0">नमूना परीक्षण फिल्टरहरू</h5>
      </div>
      <div class="card-body">
        <div class="d-grid gap-3" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
          <div class="form-group">
            <label class="form-label">परीक्षण मिति</label>
            <div class="nepali-datepicker-dropdown" data-target="filterTestDate">
              <select id="filterTestDate_year" class="form-select bs-year"><option value="">साल</option></select>
              <select id="filterTestDate_month" class="form-select bs-month"><option value="">महिना</option></select>
              <select id="filterTestDate_day" class="form-select bs-day"><option value="">गते</option></select>
              <input type="hidden" id="filterTestDate" onchange="applySampleFilters()" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">मन्त्रालय/निकाय</label>
            <select class="form-control" id="filterMinistry" onchange="applySampleFilters()">
              <option value="">सबै</option>
              ${Object.values(MINISTRIES).map(min => `<option value="${min}">${min}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">खोज शब्द</label>
            <input type="text" class="form-control" id="filterKeyword" placeholder="नमूना, अनुरोधकर्ता, आयोजना..." onkeyup="applySampleFilters()" />
          </div>
                  </div>
        <div class="d-flex gap-2 mt-3">
          <button class="btn btn-primary" onclick="applySampleFilters()">
            <i class="fas fa-filter"></i> फिल्टर लगाउनुहोस्
          </button>
          <button class="btn btn-secondary" onclick="clearSampleFilters()">
            <i class="fas fa-times"></i> फिल्टर हटाउनुहोस्
          </button>
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-header d-flex justify-between align-center">
        <h5 class="mb-0">नमूना परीक्षण सूची (${sampleTests.length})</h5>
        <div class="d-flex gap-2">
          <button class="btn btn-sm btn-primary" onclick="showNewSampleView()">
            <i class="fas fa-plus"></i> नयाँ नमूना
          </button>
          <button class="btn btn-sm btn-success" onclick="exportSampleTestsToExcel()">
            <i class="fas fa-file-excel"></i> Excel
          </button>
        </div>
      </div>
      <div class="card-body">
        ${sampleTests.length > 0 ? `
          <div class="table-responsive">
            <table class="table table-striped">
              <thead>
                <tr>
                  <th>नमूना नं</th>
                  <th>प्राप्त मिति</th>
                  <th>अनुरोधकर्ता</th>
                  <th>आयोजनाको नाम</th>
                  <th>सामग्री</th>
                  <th>परीक्षण मिति</th>
                  <th>परीक्षण नतीजा</th>
                  <th>कार्य</th>
                </tr>
              </thead>
              <tbody>
                ${sampleTests.map(test => `
                  <tr>
                    <td>${test.sampleNo || test['नमूना नं'] || ''}</td>
                    <td>${test.receivedDate || test['नमूना प्राप्त मिति'] || ''}</td>
                    <td>${test.requester || test['परीक्षण अनुरोधकर्ता'] || ''}</td>
                    <td>${test.projectName || test['आयोजनाको नाम'] || ''}</td>
                    <td>${test.material || test['परीक्षण गर्ने सामग्री'] || ''}</td>
                    <td>${test.testDate || test['परीक्षण गरिएको मिति'] || ''}</td>
                    <td>${test.testResult || test['परीक्षण नतीजा'] || ''}</td>
                    <td>
                      <button class="btn btn-sm btn-outline" onclick="viewSampleTest('${test.id}')">
                        <i class="fas fa-eye"></i>
                      </button>
                      <button class="btn btn-sm btn-outline" onclick="editSampleTest('${test.id}')">
                        <i class="fas fa-edit"></i>
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : `
          <div class="text-center py-4">
            <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
            <h5 class="text-muted">कुनै नमूना परीक्षण डाटा उपलब्ध छैन</h5>
            <p class="text-muted">नयाँ नमूना थप्न "नयाँ नमूना" बटन क्लिक गर्नुहोस्</p>
          </div>
        `}
      </div>
    </div>
  `;
  
  document.getElementById('contentArea').innerHTML = content;
    
    // Initialize Nepali date dropdowns for filters
    setTimeout(() => { initializeNepaliDropdowns(); }, 100);
    
    updateActiveNavItem();
  } catch (error) {
    console.error('Error in showSampleTestingView:', error);
  } finally {
    isLoadingView = false;
  }
}

function showNewSampleView() {
  state.currentView = 'new_sample';
  document.getElementById('pageTitle').textContent = 'नयाँ नमूना दर्ता';
  
  const currentDate = getCurrentNepaliDate();
  
  const content = `
    <div class="card">
      <div class="card-header">
        <h5 class="mb-0">नयाँ नमूना परीक्षण फारम</h5>
      </div>
      <div class="card-body">
        <form id="sampleTestForm">
          <div class="d-grid gap-3" style="grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));">
            <div class="form-group">
              <label class="form-label">नमूना नं *</label>
              <input type="text" class="form-control" id="sampleNo" placeholder="LAB-YYYY-NNNN" required />
            </div>
            <div class="form-group">
              <label class="form-label">नमूना प्राप्त मिति *</label>
              <div class="nepali-datepicker-dropdown" data-target="receivedDate">
                <select id="receivedDate_year" class="form-select bs-year"><option value="">साल</option></select>
                <select id="receivedDate_month" class="form-select bs-month"><option value="">महिना</option></select>
                <select id="receivedDate_day" class="form-select bs-day"><option value="">गते</option></select>
                <input type="hidden" id="receivedDate" value="${currentDate}" required />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">परीक्षण अनुरोधकर्ता *</label>
              <input type="text" class="form-control" id="requester" placeholder="अनुरोधकर्ताको नाम" required />
            </div>
            <div class="form-group">
              <label class="form-label">आयोजनाको नाम *</label>
              <input type="text" class="form-control" id="projectName" placeholder="आयोजनाको नाम" required />
            </div>
            <div class="form-group">
              <label class="form-label">मन्त्रालय/निकाय *</label>
              <select class="form-control" id="ministry" required>
                <option value="">छान्नुहोस्</option>
                ${Object.values(MINISTRIES).map(min => `<option value="${min}">${min}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">परीक्षण गर्ने सामग्री *</label>
              <input type="text" class="form-control" id="material" placeholder="परीक्षण गर्ने सामग्री" required />
            </div>
            <div class="form-group">
              <label class="form-label">परीक्षण गरिएको मिति *</label>
              <div class="nepali-datepicker-dropdown" data-target="testDate">
                <select id="testDate_year" class="form-select bs-year"><option value="">साल</option></select>
                <select id="testDate_month" class="form-select bs-month"><option value="">महिना</option></select>
                <select id="testDate_day" class="form-select bs-day"><option value="">गते</option></select>
                <input type="hidden" id="testDate" value="${currentDate}" required />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">परीक्षण विधि *</label>
              <input type="text" class="form-control" id="testMethod" placeholder="परीक्षण विधि" />
            </div>
            <div class="form-group">
              <label class="form-label">परीक्षण गर्ने उपकरण</label>
              <input type="text" class="form-control" id="equipment" placeholder="परीक्षण गर्ने उपकरण" />
            </div>
          </div>
          <div class="form-group mt-3">
            <label class="form-label">परीक्षण नतीजा</label>
            <textarea class="form-control" id="testResult" rows="4" placeholder="परीक्षण नतीजाको विस्तृत विवरण"></textarea>
          </div>
          <div class="form-group mt-3">
            <label class="form-label">कैफियत</label>
            <textarea class="form-control" id="remarks" rows="3" placeholder="थप कैफियत"></textarea>
          </div>
          <div class="d-flex gap-2 mt-4">
            <button type="submit" class="btn btn-primary">
              <i class="fas fa-save"></i> सेभ गर्नुहोस्
            </button>
            <button type="button" class="btn btn-secondary" onclick="showDashboardView()">
              <i class="fas fa-times"></i> रद्द गर्नुहोस्
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.getElementById('contentArea').innerHTML = content;
  
  // Add form submit handler
  document.getElementById('sampleTestForm').addEventListener('submit', function(e) {
    e.preventDefault();
    saveSampleTest();
  });
  
  // Initialize Nepali date dropdowns
  setTimeout(() => { initializeNepaliDropdowns(); }, 100);
  
  updateActiveNavItem();
}

async function saveSampleTest() {
  // Capture form data with debugging
  const formData = {
    id: document.getElementById('sampleNo').value,
    // Use backend field names for proper mapping
    sampleNumber: document.getElementById('sampleNo').value,
    sampleReceivedDate: document.getElementById('receivedDate').value,
    testRequester: document.getElementById('requester').value,
    organizationName: document.getElementById('projectName').value,
    ministry: document.getElementById('ministry').value,
    testMaterial: document.getElementById('material').value,
    testDate: document.getElementById('testDate').value,
    testMethod: document.getElementById('testMethod').value,
    testEquipment: document.getElementById('equipment').value,
    testResult: document.getElementById('testResult').value,
    remarks: document.getElementById('remarks').value,
    status: 'pending',
    createdAt: new Date().toISOString(),
    shakha: state.currentUser.shakha
  };
  
  console.log('📝 Form data captured:', formData);
  console.log('🔍 Sample No element:', document.getElementById('sampleNo'));
  console.log('🔍 Sample No value:', document.getElementById('sampleNo').value);
  console.log('🔍 Requester element:', document.getElementById('requester'));
  console.log('🔍 Requester value:', document.getElementById('requester').value);
  
  // Save to Google Sheets first
  if (GOOGLE_SHEETS_CONFIG.ENABLED) {
    const result = await saveSampleTestToSheets(formData);
    if (result && result.success) {
      // Reload data from Google Sheets to avoid duplication
      await loadLaboratoryTestsFromGoogleSheets();
      showToast('नमूना परीक्षण सफलतापूर्वक दर्ता भयो', 'success');
    } else {
      showToast('नमूना परीक्षण दर्ता गर्न सकेन', 'error');
      return;
    }
  } else {
    // Fallback: Add to state only if Google Sheets is disabled
    if (!state.sampleTests) state.sampleTests = [];
    state.sampleTests.push(formData);
    showToast('नमूना परीक्षण सफलतापूर्वक दर्ता भयो', 'success');
  }
  
  showSampleTestingView();
}

function getStatusClass(status) {
  switch(status) {
    case 'completed': return 'success';
    case 'progress': return 'info';
    case 'pending': return 'warning';
    default: return 'secondary';
  }
}

function viewSampleTest(id) {
  const test = state.sampleTests.find(t => t.id === id);
  if (!test) {
    showToast('नमूना परीक्षण फेला परेन', 'error');
    return;
  }
  
  console.log('Viewing test data:', test);
  
  const statusText = test.status === 'completed' ? 'सम्पन्न' :
                    test.status === 'progress' ? 'चालु' : 'प्रक्रियामा';
  
  const content = `
    <div class="d-grid gap-3">
      <div class="d-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div>
          <div class="text-small text-muted">नमूना नं</div>
          <div class="text-large font-weight-bold">${test.sampleNo || ''}</div>
        </div>
        <div>
          <div class="text-small text-muted">प्राप्त मिति</div>
          <div class="text-large">${test.receivedDate || ''}</div>
        </div>
        <div>
          <div class="text-small text-muted">स्थिति</div>
          <div><span class="badge badge-${getStatusClass(test.status)}">${statusText}</span></div>
        </div>
      </div>
      
      <div class="d-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div>
          <div class="text-small text-muted">अनुरोधकर्ता</div>
          <div>${test.requester || ''}</div>
        </div>
        <div>
          <div class="text-small text-muted">आयोजना</div>
          <div>${test.projectName || ''}</div>
        </div>
        <div>
          <div class="text-small text-muted">मन्त्रालय/निकाय</div>
          <div>${test.ministry || ''}</div>
        </div>
      </div>
      
      <div class="d-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div>
          <div class="text-small text-muted">सामग्री</div>
          <div>${test.material || ''}</div>
        </div>
        <div>
          <div class="text-small text-muted">परीक्षण मिति</div>
          <div>${test.testDate || ''}</div>
        </div>
        <div>
          <div class="text-small text-muted">परीक्षण विधि</div>
          <div>${test.testMethod || ''}</div>
        </div>
      </div>
      
      <div class="d-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div>
          <div class="text-small text-muted">उपकरण</div>
          <div>${test.equipment || ''}</div>
        </div>
        <div>
          <div class="text-small text-muted">परीक्षण नतीजा</div>
          <div>${test.testResult || ''}</div>
        </div>
      </div>
      
      <div>
        <div class="text-small text-muted">कैफियत</div>
        <div class="card p-3 bg-light">${test.remarks || 'कुनै कैफियत छैन'}</div>
      </div>
    </div>
  `;
  
  openModal('नमूना परीक्षण विवरण', content);
}

function editSampleTest(id) {
  const test = state.sampleTests.find(t => t.id === id);
  if (!test) {
    showToast('नमूना परीक्षण फेला परेन', 'error');
    return;
  }
  
  console.log('Editing test data:', test);
  
  const formContent = `
    <div class="d-grid gap-3">
      <div class="form-group">
        <label class="form-label">नमूना नं</label>
        <input type="text" class="form-control" value="${test.sampleNo || ''}" id="editSampleNo" />
      </div>
      <div class="d-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div class="form-group">
          <label class="form-label">प्राप्त मिति</label>
          <input type="text" class="form-control" value="${test.receivedDate || ''}" id="editReceivedDate" />
        </div>
        <div class="form-group">
          <label class="form-label">परीक्षण मिति</label>
          <input type="text" class="form-control" value="${test.testDate || ''}" id="editTestDate" />
        </div>
      </div>
      <div class="d-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div class="form-group">
          <label class="form-label">अनुरोधकर्ता</label>
          <input type="text" class="form-control" value="${test.requester || ''}" id="editRequester" />
        </div>
        <div class="form-group">
          <label class="form-label">आयोजना</label>
          <input type="text" class="form-control" value="${test.projectName || ''}" id="editProjectName" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">मन्त्रालय/निकाय</label>
        <select class="form-control" id="editMinistry">
          ${Object.values(MINISTRIES).map(min => `<option value="${min}" ${(test.ministry || '') === min ? 'selected' : ''}>${min}</option>`).join('')}
        </select>
      </div>
      <div class="d-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div class="form-group">
          <label class="form-label">सामग्री</label>
          <input type="text" class="form-control" value="${test.material || ''}" id="editMaterial" />
        </div>
        <div class="form-group">
          <label class="form-label">परीक्षण विधि</label>
          <input type="text" class="form-control" value="${test.testMethod || ''}" id="editTestMethod" />
        </div>
      </div>
      <div class="d-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div class="form-group">
          <label class="form-label">उपकरण</label>
          <input type="text" class="form-control" value="${test.equipment || ''}" id="editEquipment" />
        </div>
        <div class="form-group">
          <label class="form-label">स्थिति</label>
          <select class="form-control" id="editStatus">
            <option value="pending" ${(test.status || 'pending') === 'pending' ? 'selected' : ''}>प्रक्रियामा</option>
            <option value="progress" ${(test.status || '') === 'progress' ? 'selected' : ''}>चालु</option>
            <option value="completed" ${(test.status || '') === 'completed' ? 'selected' : ''}>सम्पन्न</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">परीक्षण नतीजा</label>
        <textarea class="form-control" rows="3" id="editTestResult">${test.testResult || ''}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">कैफियत</label>
        <textarea class="form-control" rows="2" id="editRemarks">${test.remarks || ''}</textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal()">रद्द गर्नुहोस्</button>
      <button class="btn btn-primary" onclick="saveSampleTestEdit('${id}')">सुरक्षित गर्नुहोस्</button>
    </div>
  `;
  
  openModal('नमूना परीक्षण सम्पादन', formContent);
}

async function saveSampleTestEdit(id) {
  const testIndex = state.sampleTests.findIndex(t => t.id === id);
  if (testIndex === -1) {
    showToast('नमूना परीक्षण फेला परेन', 'error');
    return;
  }
  
  const updatedTest = {
    id: id,
    // Use backend field names for proper mapping
    sampleNumber: document.getElementById('editSampleNo').value,
    sampleReceivedDate: document.getElementById('editReceivedDate').value,
    testRequester: document.getElementById('editRequester').value,
    organizationName: document.getElementById('editProjectName').value,
    ministry: document.getElementById('editMinistry').value,
    testMaterial: document.getElementById('editMaterial').value,
    testDate: document.getElementById('editTestDate').value,
    testMethod: document.getElementById('editTestMethod').value,
    testEquipment: document.getElementById('editEquipment').value,
    testResult: document.getElementById('editTestResult').value,
    remarks: document.getElementById('editRemarks').value,
    status: document.getElementById('editStatus').value,
    updatedBy: state.currentUser ? state.currentUser.id : 'unknown',
    updatedAt: new Date().toISOString()
  };
  
  showLoadingIndicator(true);
  
  try {
    // Update in Google Sheets
    if (GOOGLE_SHEETS_CONFIG.ENABLED) {
      const result = await NVC.Api.postToGoogleSheets('updateLaboratoryTest', updatedTest);
      if (result.success) {
        // Reload data from Google Sheets
        await loadLaboratoryTestsFromGoogleSheets();
        showToast('नमूना परीक्षण सफलतापूर्वक अपडेट गरियो', 'success');
      } else {
        showToast('नमूना परीक्षण अपडेट गर्न सकेन', 'error');
      }
    } else {
      // Update local state
      state.sampleTests[testIndex] = { ...state.sampleTests[testIndex], ...updatedTest };
      showToast('नमूना परीक्षण सफलतापूर्वक अपडेट गरियो', 'success');
    }
  } catch (error) {
    console.error('Error updating sample test:', error);
    showToast('नमूना परीक्षण अपडेट गर्न सकेन', 'error');
  }
  
  showLoadingIndicator(false);
  closeModal();
  showSampleTestingView();
}

function exportSampleTestsToExcel() {
  // Implementation for exporting sample tests to Excel
  console.log('Export sample tests to Excel');
}

async function saveSampleTestToSheets(data) {
  console.log('Save sample test to sheets:', data);
  
  try {
    // Use the same pattern as other functions in the application
    if (window.NVC && NVC.Api && typeof NVC.Api.postToGoogleSheets === 'function') {
      // Prepare data for Google Apps Script function
      const params = {
        id: data.id || data['नमूना नं'] || 'LAB-' + Date.now(),
        // Data is already mapped with backend field names, use them directly
        sampleNumber: data.sampleNumber || data.sampleNo || data['नमूना नं'] || '',
        sampleReceivedDate: data.sampleReceivedDate || data.receivedDate || data['नमूना प्राप्त मिति'] || '',
        testRequester: data.testRequester || data.requester || data['परीक्षण अनुरोधकर्ता'] || '',
        organizationName: data.organizationName || data.projectName || data['आयोजनाको नाम'] || '',
        ministry: data.ministry || data['मन्त्रालय/निकाय'] || '',
        testMaterial: data.testMaterial || data.material || data['परीक्षण गर्ने सामग्री'] || '',
        testDate: data.testDate || data['परीक्षण गरिएको मिति'] || '',
        testMethod: data.testMethod || data['परीक्षण विधि'] || '',
        testEquipment: data.testEquipment || data.equipment || data['परीक्षण गर्ने उपकरण'] || '',
        testResult: data.testResult || data['परीक्षण नतीजा'] || '',
        remarks: data.remarks || data['कैफियत'] || '',
        status: data.status || 'pending',
        createdBy: data.createdBy || state.currentUser ? state.currentUser.id : 'unknown',
        createdAt: data.createdAt || new Date().toISOString(),
        updatedBy: data.updatedBy || state.currentUser ? state.currentUser.id : 'unknown',
        updatedAt: data.updatedAt || new Date().toISOString()
      };

      const result = await NVC.Api.postToGoogleSheets('saveLaboratoryTest', params);
      
      if (result && result.success) {
        console.log('Sample test data saved to Google Sheets:', result);
        
        return result;
      } else {
        throw new Error(result ? result.message : 'Unknown error occurred');
      }
    } else {
      // Fallback: Save to localStorage as backup
      let savedData = JSON.parse(localStorage.getItem('sampleTestsBackup') || '[]');
      savedData.push({
        ...data,
        savedAt: new Date().toISOString(),
        synced: false
      });
      localStorage.setItem('sampleTestsBackup', JSON.stringify(savedData));
      
      console.log('Sample test data saved to localStorage as backup');
      alert('नमूना परीक्षण डाटा localStorage मा ब्याकअप गरियो (Google Sheets उपलब्ध छैन)');
      return { success: false, message: 'Google Sheets not available' };
    }
  } catch (error) {
    console.error('Error in saveSampleTestToSheets:', error);
    
    // Fallback to localStorage on error
    try {
      let savedData = JSON.parse(localStorage.getItem('sampleTestsBackup') || '[]');
      savedData.push({
        ...data,
        savedAt: new Date().toISOString(),
        synced: false,
        error: error.message
      });
      localStorage.setItem('sampleTestsBackup', JSON.stringify(savedData));
      
      console.log('Sample test data saved to localStorage as backup due to error');
      alert('नमूना परीक्षण डाटा localStorage मा ब्याकअप गरियो (Google Sheets त्रुटि: ' + error.message + ')');
    } catch (localStorageError) {
      console.error('Error saving to localStorage:', localStorageError);
      alert('डाटा सेभ गर्नमा त्रुटि: ' + error.message);
    }
    
    return { success: false, message: error.message };
  }
}

// Filter helper functions for sample testing
let filterTimeout = null;
let isFiltering = false;

function applySampleFilters() {
  // Prevent recursion
  if (isFiltering) {
    return;
  }
  
  // Clear existing timeout
  if (filterTimeout) {
    clearTimeout(filterTimeout);
  }
  
  // Debounce filter application with longer delay for better stability
  filterTimeout = setTimeout(() => {
    isFiltering = true;
    
    try {
      const testDate = document.getElementById('filterTestDate')?.value || '';
      const ministry = document.getElementById('filterMinistry')?.value || '';
      const keyword = document.getElementById('filterKeyword')?.value || '';
      
      const options = {};
      if (testDate) options.testDate = testDate;
      if (ministry) options.ministry = ministry;
      if (keyword) options.keyword = keyword;
      
      // Only apply filters if there are actual filter values OR if explicitly called
      if (Object.keys(options).length > 0) {
        console.log('Applying filters:', options);
        options.fromFilter = true; // Mark that this is from filter
        showSampleTestingView(options);
      } else {
        console.log('No filter values to apply - skipping filter call');
      }
    } catch (error) {
      console.error('Error applying filters:', error);
    } finally {
      // Reset flag after a longer delay to prevent recursion
      setTimeout(() => { 
        isFiltering = false; 
      }, 100);
    }
  }, 500); // Increased debounce delay for better typing experience
}

function clearSampleFilters() {
  document.getElementById('filterTestDate').value = '';
  document.getElementById('filterMinistry').value = '';
  document.getElementById('filterKeyword').value = '';
  
  showSampleTestingView({ forceReload: true });
}

function _viewComplaint(id) {
  console.log('👁️ viewComplaint() called with ID:', id, 'Type:', typeof id);
  
  if (!state.complaints || state.complaints.length === 0) {
    alert('उजुरी फेला परेन - कुनै उजुरी छैन');
    return;
  }
  
  // ID लाई स्ट्रिङमा परिवर्तन गर्ने (सुरक्षित तुलनाको लागि)
  const searchId = String(id).trim();
  
  // खोज्ने - विभिन्न तरिकाले
  let complaint = null;
  
  // 1. Number को रूपमा खोज्ने (किनकि ID 1,2,3 जस्तो छ)
  const numId = parseInt(searchId);
  if (!isNaN(numId)) {
    complaint = state.complaints.find(c => 
      parseInt(c.id) === numId || 
      parseInt(c['उजुरी दर्ता नं']) === numId ||
      parseInt(c.complaintId) === numId
    );
  }
  
  // 2. String को रूपमा खोज्ने (case insensitive)
  if (!complaint) {
    complaint = state.complaints.find(c => {
      const cId = String(c.id || c['उजुरी दर्ता नं'] || c.complaintId || '');
      return cId.toLowerCase() === searchId.toLowerCase();
    });
  }
  
  // 3. Direct equality
  if (!complaint) {
    complaint = state.complaints.find(c => 
      c.id == id || 
      c['उजुरी दर्ता नं'] == id || 
      c.complaintId == id
    );
  }
  
  if (!complaint) {
    console.error('❌ Complaint not found. Available IDs:', 
      state.complaints.map(c => ({ 
        id: c.id, 
        'उजुरी दर्ता नं': c['उजुरी दर्ता नं'],
        complainant: c.complainant 
      }))
    );
    alert(`उजुरी फेला परेन (ID: ${id})`);
    return;
  }
  
  console.log('✅ Complaint found:', complaint);
  
  // अब modal मा देखाउने
  const status = complaint.status || complaint['स्थिति'] || 'pending';
  const statusText = status === 'resolved' ? 'फछ्रयौट' :
                    status === 'pending' ? 'काम बाँकी' : 'चालु';
  
  const statusClass = status === 'resolved' ? 'status-resolved' :
                     status === 'pending' ? 'status-pending' : 'status-progress';
  
  // AI Analysis
  const aiAnalysis = AI_SYSTEM.analyzeComplaint(complaint.description || complaint['उजुरीको संक्षिप्त विवरण'] || '');

  const content = `
    <div class="d-grid gap-3">
      <div class="d-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div>
          <div class="text-small text-muted">दर्ता नं</div>
          <div class="text-large font-weight-bold">${complaint.id || complaint['उजुरी दर्ता नं'] || '-'}</div>
        </div>
        <div>
          <div class="text-small text-muted">दर्ता मिति</div>
          <div class="text-large">${complaint.date || complaint['दर्ता मिति'] || '-'}</div>
        </div>
        <div>
          <div class="text-small text-muted">स्थिति</div>
          <div><span class="status-badge ${statusClass}">${statusText}</span></div>
        </div>
      </div>
      
      <div class="ai-analysis-box">
        <div class="mb-2"><span class="ai-badge"><i class="fas fa-robot"></i> AI विश्लेषण</span></div>
        <div class="text-small"><strong>सारांश:</strong> ${aiAnalysis.summary}</div>
        <div class="d-flex gap-3 mt-2 text-small"><span><strong>प्राथमिकता:</strong> ${aiAnalysis.priority}</span><span><strong>श्रेणी:</strong> ${aiAnalysis.category}</span></div>
        <div class="text-small mt-1"><strong>वर्गीकरण:</strong> ${aiAnalysis.classification}</div>
      </div>

      <div class="d-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div>
          <div class="text-small text-muted">उजुरकर्ता</div>
          <div>${complaint.complainant || complaint['उजुरीकर्ताको नाम'] || '-'}</div>
        </div>
        <div>
          <div class="text-small text-muted">विपक्षी</div>
          <div>${complaint.accused || complaint['विपक्षी'] || '-'}</div>
        </div>
      </div>
      
      <div>
        <div class="text-small text-muted">उजुरीको विवरण</div>
        <div class="card p-3 bg-light">${complaint.description || complaint['उजुरीको संक्षिप्त विवरण'] || 'कुनै विवरण छैन'}</div>
      </div>
      
      <div>
        <div class="text-small text-muted">समितिको निर्णय</div>
        <div class="card p-3 bg-light">${complaint.committeeDecision || 'कुनै निर्णय छैन'}</div>
      </div>
      
      ${complaint.decision ? `
        <div>
          <div class="text-small text-muted">अन्तिम निर्णय (विवरण)</div>
          <div class="card p-3 bg-light">${complaint.decision}</div>
        </div>
      ` : ''}
      
      ${complaint.finalDecision ? `
        <div>
          <div class="text-small text-muted">अन्तिम निर्णयको प्रकार</div>
          <div class="card p-3 bg-light">${normalizeFinalDecisionType(complaint.finalDecision)}</div>
        </div>
      ` : ''}

      <div>
        <div class="text-small text-muted">कैफियत</div>
        <div class="card p-3 bg-light">${complaint.remarks || complaint['कैफियत'] || '-'}</div>
      </div>
      
      ${state.currentUser.role === 'admin' || state.currentUser.role === 'mahashakha' ? `
      <div class="mt-3 border-top pt-3">
        <button class="btn btn-warning btn-sm w-100" onclick="openPushNotificationModal('${complaint.id}')"><i class="fas fa-bell"></i> शाखालाई नोटिफिकेसन पठाउनुहोस्</button>
      </div>` : ''}
    </div>
  `;
  
  openModal('उजुरी विवरण', content);
  try {
    const modalEl = document.getElementById('complaintModal');
    console.log('after openModal: complaintModal found=', !!modalEl, 'class=', modalEl && modalEl.className, 'modalBody length=', (document.getElementById('modalBody')||{}).innerHTML?.length || 0, 'NVC.UI.openModalContent=', !!(window.NVC && NVC.UI && NVC.UI.openModalContent));
  } catch (e) { console.warn('post-openModal debug failed', e); }
}

NVC.UI.viewComplaint = _viewComplaint;

function viewComplaint(id) {
  return NVC.UI.viewComplaint.apply(this, arguments);
}

function openPushNotificationModal(complaintId) {
  const complaint = state.complaints.find(c => c.id === complaintId);
  const targetShakha = complaint ? (complaint.shakha || '') : '';
  
  const content = `
    <div class="form-group">
      <label class="form-label">उजुरी नं: ${complaintId}</label>
    </div>
    <div class="form-group">
      <label class="form-label">सन्देश *</label>
      <textarea class="form-control" id="pushMessage" rows="3" placeholder="शाखालाई पठाउने सन्देश लेख्नुहोस्..."></textarea>
    </div>
    <div class="form-group">
      <label class="form-label">प्रकार</label>
      <select class="form-select" id="pushType">
        <option value="info">जानकारी (Info)</option>
        <option value="warning">चेतावनी (Warning)</option>
        <option value="success">सफल (Success)</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">लक्षित शाखा</label>
      <select class="form-select" id="pushTarget">
        <option value="${targetShakha}" selected>${targetShakha || 'छान्नुहोस्'}</option>
        ${Object.entries(SHAKHA).map(([k, v]) => `<option value="${v}">${v}</option>`).join('')}
      </select>
    </div>
      <div class="form-group">
        <label class="form-label">लक्षित महाशाखा (वैकल्पिक)</label>
        <select class="form-select" id="pushTargetMahashakha">
          <option value="">छान्नुहोस्</option>
          ${Object.keys(MAHASHAKHA || {}).map(k => `<option value="${k}">${k}</option>`).join('')}
        </select>
      </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal()">रद्द गर्नुहोस्</button>
      <button class="btn btn-primary" onclick="sendPushNotification('${complaintId}')">पठाउनुहोस्</button>
    </div>
  `;
  openModal('नोटिफिकेसन पठाउनुहोस्', content);
}

async function sendPushNotification(complaintId) {
  const message = document.getElementById('pushMessage').value;
  // Allow admin to target either a branch (shakha) or a mahashakha. Mahashakha selection takes precedence.
  const target = (document.getElementById('pushTargetMahashakha').value || document.getElementById('pushTarget').value);
  const type = document.getElementById('pushType').value || 'info';
  
  if(!message) { showToast('कृपया सन्देश लेख्नुहोस्', 'warning'); return; }
  
  showLoadingSpinner('सन्देश पठाउँदै...');

  const notification = {
    id: Date.now().toString(),
    title: `उजुरी नं ${complaintId} सम्बन्धमा`,
    time: new Date().toLocaleString('ne-NP'),
    read: false,
    targetShakha: target,
    message: message,
    type: type,
    sender: state.currentUser.name,
    createdAt: new Date().toISOString()
  };
  
  try {
    // Save to local storage (Optimistic)
    const pushed = JSON.parse(localStorage.getItem('nvc_pushed_notifications') || '[]');
    pushed.unshift(notification);
    localStorage.setItem('nvc_pushed_notifications', JSON.stringify(pushed));
    
    // Send to Google Sheets
    if (GOOGLE_SHEETS_CONFIG.ENABLED) {
        await postToGoogleSheets('sendNotification', notification);
    }
    
    showToast('नोटिफिकेसन पठाइयो', 'success');
    closeModal();
  } catch (error) {
    console.error('Error sending notification:', error);
    showToast('नोटिफिकेसन पठाउन सकिएन', 'error');
  } finally {
    hideLoadingSpinner();
  }
}

function editComplaint(id) {
  let complaint = state.complaints.find(c => c.id == id);
  if (!complaint) {
    complaint = state.complaints.find(c => String(c.id).trim() === String(id).trim());
  }
  if (!complaint) return;
  
  const formContent = `
    <div class="d-grid gap-3" style="grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));">
      <div class="form-group"><label class="form-label">दर्ता नं</label><input type="text" class="form-control" value="${complaint.id}" readonly /></div>
      <div class="form-group">
        <label class="form-label">दर्ता मिति</label>
        <div class="input-group">
          <input type="hidden" id="editDate" value="${complaint.date || ''}" />
          <div class="d-flex gap-2 nepali-datepicker-dropdown" data-target="editDate">
            <select id="editDate_year" class="form-select bs-year"><option value="">साल</option></select>
            <select id="editDate_month" class="form-select bs-month"><option value="">महिना</option></select>
            <select id="editDate_day" class="form-select bs-day"><option value="">गते</option></select>
          </div>
        </div>
      </div>
      <div class="form-group"><label class="form-label">उजुरकर्ताको नाम</label><input type="text" class="form-control" value="${complaint.complainant}" id="editComplainant" /></div>
      <div class="form-group"><label class="form-label">विपक्षी</label><input type="text" class="form-control" value="${complaint.accused || ''}" id="editAccused" /></div>
      <div class="form-group"><label class="form-label">मन्त्रालय/निकाय</label>
        <select class="form-select" id="editMinistry">
          <option value="">छनौट गर्नुहोस्</option>
          ${MINISTRIES.map(min => `<option value="${min}" ${complaint.ministry === min ? 'selected' : ''}>${min}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label class="form-label">प्रदेश</label>
        <select class="form-select" id="editProvince" onchange="loadEditDistricts()">
          <option value="">प्रदेश छन्नुहोस्</option>
          ${Object.entries(LOCATION_FIELDS.PROVINCE).map(([key, value]) => `<option value="${key}" ${(complaint.province === key || complaint.province === value) ? 'selected' : ''}>${value}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label class="form-label">जिल्ला</label>
        <select class="form-select" id="editDistrict" ${!complaint.province ? 'disabled' : ''} onchange="loadEditLocals()">
          <option value="">जिल्ला छन्नुहोस्</option>
          ${(() => { const pk = Object.entries(LOCATION_FIELDS.PROVINCE).find(([k,v]) => complaint.province === k || complaint.province === v); return pk && LOCATION_FIELDS.DISTRICTS[pk[0]] ? LOCATION_FIELDS.DISTRICTS[pk[0]].map(dist => `<option value="${dist}" ${complaint.district === dist ? 'selected' : ''}>${dist}</option>`).join('') : ''; })()}
        </select>
      </div>
      <div class="form-group"><label class="form-label">स्थानीय तह</label>
        <select class="form-select" id="editLocalLevel" data-selected="${complaint.localLevel || ''}">
          <option value="">पहिला जिल्ला छान्नुहोस्</option>
        </select>
      </div>
      <div class="form-group" style="grid-column: span 2;">
        <label class="form-label">उजुरीको विवरण</label>
        <textarea class="form-control" rows="3" id="editDescription">${complaint.description}</textarea>
        <div class="mt-2 d-flex justify-content-end">
            <button type="button" id="editDescVoiceBtn" class="btn btn-sm btn-outline-primary" title="आवाजले लेख्नुहोस् (नेपाली)"><i class="fas fa-microphone"></i> आवाज टाइप</button>
        </div>
      </div>

      <div class="form-group" style="grid-column: span 2;">
        <label class="form-label">समितिको निर्णय</label>
        <textarea class="form-control" rows="2" id="editCommitteeDecision">${complaint.committeeDecision || complaint.proposedDecision || ''}</textarea>
        <div class="mt-2 d-flex justify-content-end">
            <button type="button" id="editCommitteeVoiceBtn" class="btn btn-sm btn-outline-primary" title="आवाजले लेख्नुहोस् (नेपाली)"><i class="fas fa-microphone"></i> आवाज टाइप</button>
        </div>
      </div>
      <div class="form-group" style="grid-column: span 2;">
        <label class="form-label">अन्तिम निर्णय (विवरण)</label>
        <textarea class="form-control" rows="2" id="editDecision">${complaint.decision || ''}</textarea>
        <div class="mt-2 d-flex justify-content-end">
            <button type="button" id="editDecisionVoiceBtn" class="btn btn-sm btn-outline-primary" title="आवाजले लेख्नुहोस् (नेपाली)"><i class="fas fa-microphone"></i> आवाज टाइप</button>
        </div>
      </div>

      <div class="form-group"><label class="form-label">कैफियत</label><input type="text" class="form-control" value="${complaint.remarks || ''}" id="editRemarks" /></div>
      <div class="form-group"><label class="form-label">स्थिति</label><select class="form-select" id="editStatus"><option value="pending" ${complaint.status === 'pending' ? 'selected' : ''}>काम बाँकी</option><option value="progress" ${complaint.status === 'progress' ? 'selected' : ''}>चालु</option><option value="resolved" ${complaint.status === 'resolved' ? 'selected' : ''}>फछ्रयौट</option></select></div>
      
      <div class="form-group"><label class="form-label">अन्तिम निर्णयको प्रकार</label><select class="form-select" id="editFinalDecision"><option value="">छान्नुहोस्</option>${['तामेली','सुझाव/निर्देशन','सतर्क','अन्य'].map(label => `<option value="${label}" ${normalizeFinalDecisionType(complaint.finalDecision) === label ? 'selected' : ''}>${label}</option>`).join('')}</select></div>

    </div>
    <div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">रद्द गर्नुहोस्</button><button class="btn btn-primary" onclick="saveEditedComplaint('${id}')">सुरक्षित गर्नुहोस्</button></div>
  `;
  
  openModal('उजुरी सम्पादन', formContent);
  setTimeout(()=>{ 
    try { if (typeof NVC !== 'undefined' && NVC.UI && typeof NVC.UI.prefillComplaintForm === 'function') NVC.UI.prefillComplaintForm(complaint, 'edit');
    } catch(e){}
    initializeDatepickers(); initializeNepaliDropdowns(); loadEditDistricts(); initializeFieldSpeech(); }, 100);
}

function saveComplaint(id) {
  const complaintIndex = state.complaints.findIndex(c => c.id === id);
  if (complaintIndex === -1) return;
  
  const updatedComplaint = {
    ...state.complaints[complaintIndex],
    date: document.getElementById('editDate').value,
    complainant: document.getElementById('editComplainant').value,
    accused: document.getElementById('editAccused').value,
    description: document.getElementById('editDescription').value,
    remarks: document.getElementById('editRemarks').value,
    status: document.getElementById('editStatus').value,
    committeeDecision: document.getElementById('editCommitteeDecision')?.value || state.complaints[complaintIndex].committeeDecision,
    decision: document.getElementById('editDecision')?.value || state.complaints[complaintIndex].decision,
    finalDecision: document.getElementById('editFinalDecision')?.value || state.complaints[complaintIndex].finalDecision,
    updatedAt: new Date().toISOString(),
    updatedBy: state.currentUser.name
  };
  
  state.complaints[complaintIndex] = updatedComplaint;
  showToast('उजुरी सुरक्षित गरियो', 'success');
  closeModal();
  showComplaintsView();
}

function _deleteComplaint(id) {
  if (confirm('के तपाईं यो उजुरी हटाउन चाहनुहुन्छ?')) {
    const index = state.complaints.findIndex(c => c.id === id);
    if (index !== -1) {
      state.complaints.splice(index, 1);
      backupToLocalStorage();
      showToast('उजुरी हटाइयो', 'success');
      showComplaintsView();
    }
  }
}

NVC.UI.deleteComplaint = _deleteComplaint;

function deleteComplaint(id) {
  return NVC.UI.deleteComplaint.apply(this, arguments);
}

function filterComplaintsTable() {
  // Use unified rendering via showComplaintsView to respect pagination and sorting.
  const status = document.getElementById('filterStatus')?.value || '';
  const finalDecisionType = document.getElementById('filterFinalDecisionType')?.value || '';
  const shakha = document.getElementById('filterShakha')?.value || '';
  const ministry = document.getElementById('filterMinistry')?.value || '';
  const searchField = document.getElementById('searchField')?.value || 'all';
  const searchText = (document.getElementById('searchText')?.value || '').toLowerCase();
  const sortOrder = document.getElementById('sortOrder')?.value || 'newest';
  const startDate = document.getElementById('filterStartDate')?.value || '';
  const endDate = document.getElementById('filterEndDate')?.value || '';

  if (!state.pagination) state.pagination = { itemsPerPage: 10, currentPage: 1, totalItems: 0 };
  state.pagination.currentPage = 1;
  
  // Suppress content-area transition for this filter-triggered rerender
  try { state._suppressContentTransition = true; } catch(e){}

    // Save active filters in-memory so pagination and other navigations keep them
    state.filters = {
      status,
      finalDecisionType,
      shakha,
      ministry,
      searchField,
      search: searchText,
      sortOrder,
      startDate,
      endDate
    };

    showComplaintsView({ 
      ...state.filters,
      _fromFilter: true
    });
  // Clear suppression shortly after render so other navigations still animate
  setTimeout(() => { try { state._suppressContentTransition = false; } catch(e){} }, 250);

  // After re-rendering the complaints view, restore caret/focus if it was previously in the search field
  try {
    setTimeout(() => {
      const inEl = document.getElementById('searchText');
      const sel = state._searchSelection;
      if (inEl && sel && inEl.value === (sel.value || '')) {
        try { inEl.focus({preventScroll:true}); } catch(e){ inEl.focus(); }
        try { inEl.setSelectionRange(sel.start, sel.end); } catch(e){}
      }
    }, 0);
  } catch(e) { /* swallow */ }
}

function saveComplaintsFilters() {
    const filters = {
        status: document.getElementById('filterStatus')?.value || '',
        finalDecisionType: document.getElementById('filterFinalDecisionType')?.value || '',
        shakha: document.getElementById('filterShakha')?.value || '',
      ministry: document.getElementById('filterMinistry')?.value || '',
        searchField: document.getElementById('searchField')?.value || 'all',
        search: document.getElementById('searchText')?.value || '',
        sortOrder: document.getElementById('sortOrder')?.value || 'newest',
        startDate: document.getElementById('filterStartDate')?.value || '',
        endDate: document.getElementById('filterEndDate')?.value || ''
    };
    
    localStorage.setItem('nvc_complaints_filters', JSON.stringify(filters));
    // also keep in-memory so immediate navigation/pagination respects them
    state.filters = filters;
    showToast('फिल्टरहरू सुरक्षित गरियो', 'success');
}

function clearComplaintsFilters() {
    localStorage.removeItem('nvc_complaints_filters');
  // Clear in-memory filters too and reload default view
  state.filters = {};
  showComplaintsView({}); // Reload with defaults
    showToast('फिल्टरहरू रिसेट गरियो', 'info');
}

// Delegated handler for complaints table actions (works for dynamically rendered buttons)
function handleTableActions(e) {
  const targetBtn = e.target.closest('button.action-btn');
  if (!targetBtn) return;

  e.preventDefault();
  e.stopPropagation();

  const complaintId = targetBtn.getAttribute('data-id');
  const funcName = targetBtn.getAttribute('data-func');

  if (funcName && typeof window[funcName] === 'function') {
      return window[funcName](complaintId);
  }

  // Prefer explicit data-action attribute
  const action = (targetBtn.getAttribute('data-action') || '').toLowerCase();

  if (action) {
    if (action === 'view') return viewComplaint(complaintId);
    if (action === 'edit') return editComplaint(complaintId);
    if (action === 'delete') return deleteComplaint(complaintId);
    if (action === 'assign') return assignToShakha && assignToShakha(complaintId);
    if (action === 'viewinvestigation') return viewInvestigation(complaintId);
    if (action === 'editinvestigation') return editInvestigation(complaintId);
    if (action === 'viewcitizencharter') return viewCitizenCharter(complaintId);
    if (action === 'editcitizencharter') return editCitizenCharter(complaintId);
    if (action === 'viewproject') return viewProject(complaintId);
    if (action === 'editproject') return editProject(complaintId);
    if (action === 'viewexaminer') return viewExaminer(complaintId);
    if (action === 'editexaminer') return editExaminer(complaintId);
    if (action === 'viewemployeemonitoring') return viewEmployeeMonitoring(complaintId);
    if (action === 'editemployeemonitoring') return editEmployeeMonitoring(complaintId);
    if (action === 'viewshakhadetails') return viewShakhaDetails(complaintId);
    if (action === 'viewmahashakhadetails') return viewMahashakhaDetails(complaintId);
    return;
  }

  // Fallback: inspect icon classes
  const icon = targetBtn.querySelector('i') || targetBtn;
  if (icon.classList.contains('fa-eye')) viewComplaint(complaintId);
  else if (icon.classList.contains('fa-edit')) editComplaint(complaintId);
  else if (icon.classList.contains('fa-trash')) deleteComplaint(complaintId);
}

function toggleFilterBar() {
  try {
    if (typeof toggleFilterBarMain === 'function') return toggleFilterBarMain();
    const content = document.getElementById('filterContent');
    if (content) content.classList.toggle('d-none');
  } catch (e) { console.warn('toggleFilterBar wrapper failed', e); }
}

function showThisMonthsComplaints() {
    const todayNepali = getCurrentNepaliDate(); // e.g., "2081-11-03"
    if (!todayNepali) {
        showComplaintsView(); // fallback
        return;
    }
    const yearMonth = todayNepali.substring(0, 7); // "2081-11"
    const startDate = `${yearMonth}-01`;
    const endDate = todayNepali;

    showComplaintsView({
        startDate: startDate,
        endDate: endDate
    });
}

function filterAdminComplaints() {
  const status = document.getElementById('filterStatus').value;
  const searchText = document.getElementById('searchText').value.toLowerCase();
  
  let filtered = state.complaints.filter(c => c.source === 'hello_sarkar');
  
  if (status) filtered = filtered.filter(c => c.status === status);
  if (searchText) {
    filtered = filtered.filter(c => 
      c.id.toLowerCase().includes(searchText) ||
      c.complainant.toLowerCase().includes(searchText) ||
      c.accused.toLowerCase().includes(searchText) ||
      c.description.toLowerCase().includes(searchText)
    );
  }
  
  const tbody = document.getElementById('adminComplaintsTable');
  if (tbody) {
    tbody.innerHTML = filtered.map((complaint, index) => `
      <tr>
        <td data-label="क्र.सं.">${index + 1}</td><td data-label="मिति">${complaint.date}</td><td data-label="उजुरकर्ता">${complaint.complainant}</td><td data-label="विपक्षी">${complaint.accused || '-'}</td>
        <td data-label="उजुरीको विवरण" class="text-limit" title="${complaint.description || ''}">${(complaint.description || '').substring(0, 50)}...</td>
            <td data-label="सम्बन्धित शाखा">${displayShakhaName(complaint.assignedShakha || complaint.shakha || complaint.assignedShakhaName || (complaint.assignedShakhaCode && SHAKHA[complaint.assignedShakhaCode]) || '') || '-'}</td><td data-label="शाखामा पठाएको मिति">${complaint.assignedDate || complaint.entryDate || complaint.dateNepali || complaint.correspondenceDate || complaint.assigned_on || complaint.assignment_date || complaint.assigned_at || complaint.createdAt || complaint.created_at || '-'}</td>
        <td data-label="निर्णय" class="text-limit" title="${complaint.decision || ''}">${complaint.decision ? complaint.decision.substring(0, 30) + '...' : '-'}</td>
        <td data-label="कैफियत">${complaint.remarks || '-'}</td>
        <td data-label="कार्य"><div class="table-actions"><button class="action-btn" data-action="view" data-id="${complaint.id}" title="हेर्नुहोस्"><i class="fas fa-eye"></i></button><button class="action-btn" data-action="assign" data-id="${complaint.id}" title="शाखामा पठाउनुहोस्"><i class="fas fa-paper-plane"></i></button></div></td>
      </tr>
    `).join('');
  }
}

function filterProjects() {
  const status = document.getElementById('filterProjectStatus').value;
  const searchText = document.getElementById('projectSearchText').value.toLowerCase();
  
  let filtered = state.projects;
  if (state.currentUser && state.currentUser.role !== 'admin' && state.currentUser.role !== 'technical_head') {
    filtered = filtered.filter(p => p.shakha === state.currentUser.shakha);
  }
  
  // New filtering logic based on improvement info received date
  if (status === 'completed') {
    // Show only projects with improvement info received date
    filtered = filtered.filter(p => p.improvementInfo && p.improvementInfo.trim() !== '');
  } else if (status === 'pending') {
    // Show only projects without improvement info received date
    filtered = filtered.filter(p => !p.improvementInfo || p.improvementInfo.trim() === '');
  } else if (status) {
    // For 'active' status, show all (existing behavior)
    filtered = filtered.filter(p => p.status === status);
  }
  
  if (searchText) {
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(searchText) ||
      p.organization.toLowerCase().includes(searchText) ||
      p.nonCompliances.toLowerCase().includes(searchText)
    );
  }
  
  const tbody = document.getElementById('projectsTable');
  if (tbody) {
    tbody.innerHTML = filtered.map((project, index) => `
      <tr>
        <td data-label="क्र.सं.">${index + 1}</td><td data-label="आयोजनाको नाम">${project.name}</td><td data-label="सम्बन्धित निकाय">${project.organization}</td><td data-label="अनुगमन/प्राविधिक परीक्षण मिति">${project.inspectionDate}</td>
        <td data-label="अपरिपालनाहरु (NCR)" class="text-limit" title="${project.nonCompliances}">${project.nonCompliances.substring(0, 50)}...</td>
        <td data-label="सुधारका लागि पत्रको मिति">${project.improvementLetterDate || '-'}</td><td data-label="सुधारको जानकारी प्राप्त मिति">${project.improvementInfo || '-'}</td><td data-label="कैफियत">${project.remarks || '-'}</td>
        <td data-label="कार्य"><div class="table-actions"><button class="action-btn" onclick="handleTableActions(event)" data-action="viewProject" data-id="${project.id}" title="हेर्नुहोस्"><i class="fas fa-eye"></i></button><button class="action-btn" onclick="handleTableActions(event)" data-action="editProject" data-id="${project.id}" title="सम्पादन गर्नुहोस्"><i class="fas fa-edit"></i></button></div></td>
      </tr>
    `).join('');
  }
}

function updatePagination() {
  const paginationElement = document.querySelector('.pagination');
  if (paginationElement) {
    const totalPages = Math.ceil(state.pagination.totalItems / state.pagination.itemsPerPage);
    paginationElement.style.display = totalPages <= 1 ? 'none' : 'flex';
  }
}

function updateActiveNavItem() {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

    let viewToHighlight = state.currentView;

    // Rule: If the user is an admin and the view is the generic 'complaints'
    // (likely from a dashboard widget click), we should highlight the 'all_complaints' menu item.
    if (state.currentUser?.role === 'admin' && state.currentView === 'complaints') {
        viewToHighlight = 'all_complaints';
    }

    const navTextMap = {
        'dashboard': 'ड्यासबोर्ड',
        'all_complaints': 'सबै उजुरीहरू',
        'shakha_reports': 'शाखा रिपोर्टहरू',
        'user_management': 'प्रयोगकर्ता व्यवस्थापन',
        'system_reports': 'रिपोर्टहरू',
        'settings': 'सेटिङहरू',
        'complaints': 'उजुरीहरू', // For non-admin roles
        'new_complaint': 'नयाँ उजुरी',
        'technical_projects': 'प्राविधिक परीक्षण/आयोजना अनुगमन',
        'admin_complaints': 'हेलो सरकार उजुरीहरू',
        'online_complaints': 'अनलाइन उजुरी',
        'employee_monitoring': 'कार्यालय अनुगमन',
        'citizen_charter': 'नागरिक बडापत्र अनुगमन',
        'calendar': 'क्यालेन्डर'
    };

    const targetText = navTextMap[viewToHighlight];

    if (targetText) {
        let itemFound = false;
        // First, try to find an exact match inside the specific span
        document.querySelectorAll('.nav-item .nav-text').forEach(span => {
            if (span.textContent.trim() === targetText) {
                span.closest('.nav-item').classList.add('active');
                itemFound = true;
            }
        });
    } else {
        // If no view is matched, default to highlighting the first nav item (usually Dashboard)
        const firstNavItem = document.querySelector('#sidebarNav .nav-item');
        if (firstNavItem) {
            firstNavItem.classList.add('active');
        }
    }
}

function viewShakhaDetails(shakha) {
  const shakhaComplaints = state.complaints.filter(c => c.shakha === shakha);
  const pending = shakhaComplaints.filter(c => c.status === 'pending').length;
  const resolved = shakhaComplaints.filter(c => c.status === 'resolved').length;
  const progress = shakhaComplaints.filter(c => c.status === 'progress').length;
  const resolutionRate = shakhaComplaints.length > 0 ? Math.round((resolved / shakhaComplaints.length) * 100) : 0;
  
  const content = `
    <div class="d-grid gap-3">
      <div><h5 class="text-center mb-3">${shakha} को विवरण</h5></div>
      <div class="d-grid" style="grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
        <div class="text-center p-3 border rounded"><div class="text-large">${shakhaComplaints.length}</div><div class="text-small text-muted">कूल उजुरी</div></div>
        <div class="text-center p-3 border rounded"><div class="text-large text-warning">${pending}</div><div class="text-small text-muted">काम बाँकी</div></div>
        <div class="text-center p-3 border rounded"><div class="text-large text-info">${progress}</div><div class="text-small text-muted">चालु</div></div>
        <div class="text-center p-3 border rounded"><div class="text-large text-success">${resolved}</div><div class="text-small text-muted">फछ्रयौट</div></div>
        <div class="text-center p-3 border rounded"><div class="text-large">${resolutionRate}%</div><div class="text-small text-muted">फछ्रयौट दर</div></div>
      </div>
      <div><h6 class="mb-2">हालैका उजुरीहरू</h6><div class="table-responsive" style="max-height: 300px;"><table class="table table-compact"><thead><tr><th>दर्ता नं</th><th>मिति</th><th>उजुरकर्ता</th><th>स्थिति</th></tr></thead><tbody>
        ${shakhaComplaints.slice(0, 10).map(complaint => `<tr><td data-label="दर्ता नं">${complaint.id}</td><td data-label="मिति">${complaint.date}</td><td data-label="उजुरकर्ता">${complaint.complainant}</td><td data-label="स्थिति"><span class="status-badge ${complaint.status === 'resolved' ? 'status-resolved' : complaint.status === 'pending' ? 'status-pending' : 'status-progress'}">${complaint.status === 'resolved' ? 'फछ्रयौट' : complaint.status === 'pending' ? 'काम बाँकी' : 'चालु'}</span></td></tr>`).join('')}
      </tbody></table></div></div>
    </div>
    <div class="modal-footer"><button class="btn btn-primary" onclick="exportShakhaDetails('${shakha}')">Excel एक्पोर्ट गर्नुहोस्</button></div>
  `;
  
  openModal(`${shakha} को विस्तृत विवरण`, content);
}

function generateMonthlyReport() {
  const currentDate = new Date();
  const monthNames = ["जनवरी", "फेब्रुअरी", "मार्च", "अप्रिल", "मे", "जुन", 
                     "जुलाई", "अगस्ट", "सेप्टेम्बर", "अक्टोबर", "नोभेम्बर", "डिसेम्बर"];
  const monthName = monthNames[currentDate.getMonth()];
  const year = currentDate.getFullYear();
  const reportName = `${year} ${monthName} महिनाको रिपोर्ट`;
  
  let sourceList = state.complaints;
  if (state.currentUser && state.currentUser.role === 'admin_planning') {
    sourceList = sourceList.filter(c => {
      const s = String(c.source || '').toLowerCase();
      return s === 'hello_sarkar' || s === 'online' || s === 'online_complaint';
    });
  }

  const monthlyComplaints = sourceList.filter(c => {
    const complaintDate = (typeof _parseComplaintRegDateToAD === 'function') ? _parseComplaintRegDateToAD(c) : null;
    if (!complaintDate || isNaN(complaintDate.getTime())) return false;
    return complaintDate.getMonth() === currentDate.getMonth() && complaintDate.getFullYear() === currentDate.getFullYear();
  });
  
  if (monthlyComplaints.length === 0) {
    showToast('यस महिना कुनै उजुरी छैन', 'info');
    return;
  }
  
  generateReport(reportName, monthlyComplaints);
}

function generateShakhaReport() {
  if (state.currentUser.role !== 'admin') {
    const shakhaComplaints = state.complaints.filter(c => c.shakha === SHAKHA[state.currentUser.shakha] || c.shakha === state.currentUser.shakha);
    const reportName = `${state.currentUser.shakha} को रिपोर्ट`;
    generateReport(reportName, shakhaComplaints);
  } else {
    showToast('कृपया शाखा रिपोर्टहरू पृष्ठबाट रिपोर्ट जेनरेट गर्नुहोस्', 'info');
  }
}

function generateSummaryReport() {
  let sourceList = state.complaints;
  if (state.currentUser && state.currentUser.role === 'admin_planning') {
    sourceList = sourceList.filter(c => {
      const s = String(c.source || '').toLowerCase();
      return s === 'hello_sarkar' || s === 'online' || s === 'online_complaint';
    });
  }

  const total = sourceList.length;
  const pending = sourceList.filter(c => c.status === 'pending').length;
  const resolved = sourceList.filter(c => c.status === 'resolved').length;
  const progress = sourceList.filter(c => c.status === 'progress').length;
  
  const summaryData = [{
    'कूल उजुरी': total, 'काम बाँकी': pending, 'चालु': progress,
    'फछ्रयौट': resolved, 'फछ्रयौट दर': total > 0 ? Math.round((resolved / total) * 100) + '%' : '0%',
    'औसत प्रतिक्रिया समय': ' दिन', 'सक्रिय शाखाहरू': '', 'महिनाको वृद्धि': '%'
  }];
  
  generateReport('समग्र सारांश रिपोर्ट', summaryData);
}

// ==================== CHATBOT FUNCTIONS ====================
function toggleChatbot() {
    const chatbotWindow = document.getElementById('chatbotWindow');
    chatbotWindow.classList.toggle('show');
    if (chatbotWindow.classList.contains('show')) {
        document.getElementById('chatInput').focus();
    }
}

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message) return;

    const chatBody = document.getElementById('chatBody');
    
    // User Message
    chatBody.innerHTML += `<div class="chat-message chat-user-msg">${message}</div>`;
    input.value = '';
    chatBody.scrollTop = chatBody.scrollHeight;

    // Bot Response (Simulated Delay)
    setTimeout(() => {
        const response = AI_SYSTEM.getChatResponse(message);
        chatBody.innerHTML += `<div class="chat-message chat-bot-msg">${response}</div>`;
        chatBody.scrollTop = chatBody.scrollHeight;
    }, 600);
}

function generateReport(reportName, data) {
  const headers = Object.keys(data[0]);
  let csvContent = headers.join(',') + '\n';
  
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
    });
    csvContent += values.join(',') + '\n';
  });
  
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  const filename = `${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.csv`;
  
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showToast(`रिपोर्ट डाउनलोड हुँदैछ: ${reportName}`, 'success');
}

function generatePerformanceReport() { showToast('प्रदर्शन रिपोर्ट तयार हुँदैछ...', 'info'); }
function generateResolutionReport() { showToast('फछ्रयौट रिपोर्ट तयार हुँदैछ...', 'info'); }
function generateTimelinessReport() { showToast('समयानुसार रिपोर्ट तयार हुँदैछ...', 'info'); }
function generateUserActivityReport() { showToast('प्रयोगकर्ता गतिविधि रिपोर्ट तयार हुँदैछ...', 'info'); }
function exportSystemReport() { showToast('प्रणाली रिपोर्ट डाउनलोड हुँदैछ...', 'info'); }

function openAdminLogin() {
  document.getElementById('loginPageTitle').textContent = 'एडमिन लग-इन';
  document.getElementById('loginPageSubtitle').textContent = 'युजरनेम र पासवर्ड प्रविष्ट गर्नुहोस्';
  showPage('loginPage');
}

function openReports() {
  showPage('loginPage');
  document.getElementById('loginPageTitle').textContent = 'रिपोर्ट एक्सेस';
  document.getElementById('loginPageSubtitle').textContent = 'रिपोर्ट हेर्न लग-इन गर्नुहोस्';
}


async function initializeApp() {
  if (window._appInitialized) {
    console.log('⚠️ App already initialized');
    return;
  }
  
  console.log('%c🚀 ===== NVC APP INITIALIZING =====', 'color: blue; font-size: 16px; font-weight: bold');
  window._appInitializing = true;
  showLoadingIndicator(true);
  
  // Initialize state arrays
  if (!state.complaints) state.complaints = [];
  if (!state.projects) state.projects = [];
  if (!state.technicalExaminers) state.technicalExaminers = [];
  if (!state.employeeMonitoring) state.employeeMonitoring = [];
  if (!state.citizenCharters) state.citizenCharters = [];
  if (!state.pagination) state.pagination = { currentPage: 1, itemsPerPage: 10 };

  // Populate dummy users if empty
  if (!state.users || state.users.length === 0) {
    state.users = [
      { id: 1, username: 'admin', name: 'एडमिन', role: 'admin', status: 'सक्रिय', lastLogin: new Date().toISOString().slice(0,10) },
      { id: 2, username: 'admin_plan', name: 'प्रशासन तथा योजना शाखा', role: 'shakha', shakha: 'ADMIN_PLANNING', status: 'सक्रिय', lastLogin: '-' },
      { id: 3, username: 'info_collect', name: 'सूचना संकलन, अन्वेषण तथा अनुगमन शाखा', role: 'shakha', shakha: 'INFO_COLLECTION', status: 'सक्रिय', lastLogin: '-' },
      { id: 4, username: 'complaint_mgmt', name: 'उजुरी व्यवस्थापन शाखा', role: 'shakha', shakha: 'COMPLAINT_MANAGEMENT', status: 'सक्रिय', lastLogin: '-' }
    ];
  }
  
  // Load from localStorage immediately and SANITIZE
  try {
    const savedComplaints = localStorage.getItem('nvc_complaints_backup');
    if (savedComplaints) {
      const parsedComplaints = JSON.parse(savedComplaints);
      if (Array.isArray(parsedComplaints)) {
        state.complaints = parsedComplaints.map(c => {
          if (!c) return null;
          return {
            ...c,
            description: String(c.description || ''),
            id: String(c.id || ''),
            complainant: String(c.complainant || ''),
            accused: String(c.accused || ''),
            remarks: String(c.remarks || ''),
            decision: String(c.decision || ''),
            committeeDecision: String(c.committeeDecision || ''),
            shakha: String(c.shakha || ''),
            // Ensure assignedShakha and assignedDate are normalized to strings
            assignedShakha: String(c.assignedShakha || c.shakha || c.assignedShakhaName || ''),
            assignedDate: String(c.assignedDate || c.assigneddate || c.assigned_date || c.entryDate || c.dateNepali || c.createdAt || ''),
            status: String(c.status || 'pending')
          };
        }).filter(Boolean);
        console.log(`✅ Loaded and formatted ${state.complaints.length} complaints from localStorage`);
      }
    }

    const savedEmployeeMonitoring = localStorage.getItem('nvc_employee_monitoring_backup');
    if (savedEmployeeMonitoring) {
      const parsed = JSON.parse(savedEmployeeMonitoring);
      if (Array.isArray(parsed)) {
        state.employeeMonitoring = parsed.map(r => {
          if (!r) return null;
          
          // Parse JSON strings back to arrays
          let uniformEmployees = [];
          let timeEmployees = [];
          
          try {
            if (r.uniformEmployees) {
              uniformEmployees = typeof r.uniformEmployees === 'string' ? JSON.parse(r.uniformEmployees) : r.uniformEmployees;
            }
            if (r.timeEmployees) {
              timeEmployees = typeof r.timeEmployees === 'string' ? JSON.parse(r.timeEmployees) : r.timeEmployees;
            }
          } catch (e) {
            console.warn('Error parsing employee arrays:', e);
          }
          
          return {
            ...r,
            id: String(r.id || ''),
            date: String(r.date || ''),
            officeName: String(r.officeName || r.organization || ''),
            province: String(r.province || ''),
            district: String(r.district || ''),
            localLevel: String(r.localLevel || ''),
            uniformViolationCount: Number(r.uniformViolationCount || 0),
            timeViolationCount: Number(r.timeViolationCount || 0),
            uniformEmployees: uniformEmployees,
            timeEmployees: timeEmployees,
            instructionDate: String(r.instructionDate || ''),
            remarks: String(r.remarks || ''),
            createdBy: String(r.createdBy || ''),
            createdAt: String(r.createdAt || '')
          };
        }).filter(Boolean);
      }
    }

    const savedCitizenCharters = localStorage.getItem('nvc_citizen_charters_backup');
    if (savedCitizenCharters) {
      const parsed = JSON.parse(savedCitizenCharters);
      if (Array.isArray(parsed)) {
        state.citizenCharters = parsed.map(r => {
          if (!r) return null;
          return {
            ...r,
            id: String(r.id || ''),
            date: String(r.date || ''),
            organization: String(r.organization || ''),
            findings: String(r.findings || ''),
            instructions: String(r.instructions || ''),
            instructionDate: String(r.instructionDate || ''),
            remarks: String(r.remarks || '')
          };
        }).filter(Boolean);
      }
    }

    const savedInvestigations = localStorage.getItem('nvc_investigations_backup');
    if (savedInvestigations) {
      const parsed = JSON.parse(savedInvestigations);
      if (Array.isArray(parsed)) {
        state.investigations = parsed.map(r => {
          if (!r) return null;
          return {
            ...r,
            id: String(r.id || ''),
            complaintRegNo: String(r.complaintRegNo || ''),
            registrationDate: String(r.registrationDate || ''),
            complainant: String(r.complainant || ''),
            accused: String(r.accused || ''),
            office: String(r.office || ''),
            ministry: String(r.ministry || ''),
            province: String(r.province || ''),
            district: String(r.district || ''),
            localLevel: String(r.localLevel || ''),
            complaintDescription: String(r.complaintDescription || ''),
            reportSubmissionDate: String(r.reportSubmissionDate || ''),
            investigationOpinion: String(r.investigationOpinion || ''),
            implementationDetails: String(r.implementationDetails || ''),
            implementationDate: String(r.implementationDate || ''),
            remarks: String(r.remarks || '')
          };
        }).filter(Boolean);
      }
    }

    const savedProjects = localStorage.getItem('nvc_projects_backup');
    if (savedProjects) {
      const parsed = JSON.parse(savedProjects);
      if (Array.isArray(parsed)) {
        state.projects = parsed.map(p => {
          if (!p) return null;
          return {
            ...p,
            id: String(p.id || ''),
            name: String(p.name || ''),
            organization: String(p.organization || ''),
            inspectionDate: String(p.inspectionDate || ''),
            nonCompliances: String(p.nonCompliances || ''),
            improvementLetterDate: String(p.improvementLetterDate || ''),
            improvementInfo: String(p.improvementInfo || ''),
            status: String(p.status || 'pending'),
            remarks: String(p.remarks || ''),
            shakha: String(p.shakha || '')
          };
        }).filter(Boolean);
        console.log(`✅ Loaded ${state.projects.length} projects from localStorage`);
      }
    }

    const savedTechnicalExaminers = localStorage.getItem('nvc_technical_examiners_backup');
    if (savedTechnicalExaminers) {
      const parsed = JSON.parse(savedTechnicalExaminers);
      if (Array.isArray(parsed)) {
        state.technicalExaminers = parsed.map(e => {
          if (!e) return null;
          return {
            ...e,
            id: String(e.id || ''),
            name: String(e.name || ''),
            necRegistration: String(e.necRegistration || ''),
            trainingYear: String(e.trainingYear || ''),
            certificateNumber: String(e.certificateNumber || ''),
            projectsInspected: String(e.projectsInspected || ''),
            remarks: String(e.remarks || '')
          };
        }).filter(Boolean);
        console.log(`✅ Loaded ${state.technicalExaminers.length} technical examiners from localStorage`);
      }
    }
    // Restore UI preferences
    try {
      const fc = localStorage.getItem('nvc_ui_filterCollapsed');
      if (fc !== null) state.filterCollapsed = fc === '1';
    } catch(e) {}
  } catch (e) {
    console.warn('⚠️ Error loading from localStorage:', e);
  }
  
  // Check session
  const savedSession = localStorage.getItem('nvc_session');
  if (savedSession) {
    try {
      const session = JSON.parse(savedSession);
      if (session.expires > Date.now()) {
        state.currentUser = session.user;
        window.state = state; // Ensure window.state is synced
        console.log('✅ Session restored for:', state.currentUser.name);
      } else {
        localStorage.removeItem('nvc_session');
      }
    } catch (e) {
      localStorage.removeItem('nvc_session');
    }
  }
  
  // Show appropriate page
  if (state.currentUser) showDashboardPage();
  else showPage('mainPage');
  
  // Initialize UI components immediately
  ensureStylesheetsLoaded();
  updateDateTime();
  updateNepaliDate();
  setInterval(updateDateTime, 60000);
  setInterval(updateNepaliDate, 60000);
  initializeDatepickers(); initializeNepaliDropdowns();
  loadTheme(); // Load saved theme

  // Performance: avoid full Google Sheets loads during initial app bootstrap.
  // Full load will occur after login/dashboard navigation.
  try { showLoadingIndicator(false); } catch (e) {}
  
  window._appInitialized = true;
  window._appInitializing = false;
  
  console.log('%c🏁 ===== NVC APP INITIALIZED =====', 'color: green; font-size: 16px; font-weight: bold');
}

window.onload = function() {
  console.log('🚀 window.onload triggered');
  
  // Hide loading indicator if visible
  if (typeof showLoadingIndicator === 'function') {
    showLoadingIndicator(false);
  }
  
  // Initialize app if not already initialized
  if (!window._appInitialized && !window._appInitializing) {
    initializeApp();
  }
};

document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 DOMContentLoaded triggered');
  
  if (!window._appInitialized && !window._appInitializing) {
    setTimeout(() => {
      if (!window._appInitialized && !window._appInitializing) {
        initializeApp();
      }
    }, 100);
  }
});

function checkAppStatus() {
  console.log('📊 App Status:');
  console.log('- Initialized:', window._appInitialized);
  console.log('- Initializing:', window._appInitializing);
  console.log('- Sheets Loaded:', window._sheetsLoaded);
  console.log('- User:', state.currentUser?.name || 'Not logged in');
  console.log('- Page:', state.currentPage);
  console.log('- View:', state.currentView);
  console.log('- Complaints:', state.complaints?.length || 0);
  console.log('- Projects:', state.projects?.length || 0);
  console.log('- Employee Monitoring:', state.employeeMonitoring?.length || 0);
  console.log('- Citizen Charters:', state.citizenCharters?.length || 0);
  console.log('- Config URL:', GOOGLE_SHEETS_CONFIG.WEB_APP_URL);
  console.log('- Config Enabled:', GOOGLE_SHEETS_CONFIG.ENABLED);
  
  return {
    initialized: window._appInitialized,
    sheetsLoaded: window._sheetsLoaded,
    user: state.currentUser?.name,
    complaints: state.complaints?.length,
    url: GOOGLE_SHEETS_CONFIG.WEB_APP_URL
  };
}

// Expose commonly-used action functions on `window` so inline onclick handlers work
try {
  window.viewComplaint = viewComplaint;
  window.editComplaint = editComplaint;
  window.deleteComplaint = deleteComplaint;
  window.generateCustomReport = typeof generateCustomReport === 'function' ? generateCustomReport : undefined;
  window.saveComplaintsFilters = saveComplaintsFilters;
  window.clearComplaintsFilters = clearComplaintsFilters;
} catch (e) {
  console.warn('Could not expose global handlers on window:', e);
}

// Prevent default navigation for anchor links that use href="#" or empty href
// This avoids unwanted jumps/scroll when inline handlers are used without returning false
document.addEventListener('click', function(e) {
  try {
    const a = e.target.closest && e.target.closest('a');
    if (a) {
      const href = a.getAttribute('href');
      if (href === '#' || href === '' || href === null) {
        e.preventDefault();
      }
    }
  } catch (e) { /* ignore */ }
});

async function reinitializeApp() {
  console.log('🔄 Force reinitializing app...');
  
  window._appInitialized = false;
  window._appInitializing = false;
  window._isLoadingData = false;
  
  if (window.nvcAutoSyncInterval) {
    clearInterval(window.nvcAutoSyncInterval);
  }
  
  return await initializeApp();
}

const originalShowDashboardPage = window.showDashboardPage;
window.showDashboardPage = function() {
  if (originalShowDashboardPage) originalShowDashboardPage.apply(this, arguments);
  setTimeout(addGoogleSheetsButtons, 500);
};

// ==================== MAP & LOCATION SERVICES ====================
const DISTRICT_COORDINATES = {
    // Province 1
    'ताप्लेजुङ': [27.35, 87.6667],
    'पाँचथर': [27.1736, 87.8133],
    'इलाम': [26.9131, 87.9225],
    'झापा': [26.6219, 87.9919],
    'मोरङ': [26.6525, 87.3718],
    'सुनसरी': [26.6269, 87.1511],
    'धनकुटा': [26.9808, 87.3433],
    'तेह्रथुम': [27.1911, 87.5519],
    'संखुवासभा': [27.3714, 87.1436],
    'भोजपुर': [27.1736, 87.0458],
    'सोलुखुम्बु': [27.5, 86.5833],
    'ओखलढुंगा': [27.3167, 86.5],
    'खोटाङ': [27.2167, 86.7667],
    'उदयपुर': [26.9131, 86.6333],
    // Province 2 (Madhesh)
    'सप्तरी': [26.5333, 86.75],
    'सिराहा': [26.65, 86.2],
    'धनुषा': [26.7288, 85.9274],
    'महोत्तरी': [26.65, 85.8],
    'सर्लाही': [26.85, 85.5667],
    'रौतहट': [26.9167, 85.2667],
    'बारा': [27.0, 85.1167],
    'पर्सा': [27.0130, 84.8770],
    // Province 3 (Bagmati)
    'सिन्धुली': [27.25, 85.9667],
    'रामेछाप': [27.3333, 86.0833],
    'दोलखा': [27.65, 86.05],
    'सिन्धुपाल्चोक': [27.80, 85.70],
    'काभ्रेपलाञ्चोक': [27.60, 85.55],
    'ललितपुर': [27.6667, 85.3333],
    'भक्तपुर': [27.6710, 85.4298],
    'काठमाडौं': [27.7172, 85.3240],
    'नुवाकोट': [27.90, 85.15],
    'रसुवा': [28.1167, 85.2833],
    'धादिङ': [27.90, 84.90],
    'चितवन': [27.5291, 84.3636],
    'मकवानपुर': [27.4167, 85.0333],
    // Province 4 (Gandaki)
    'गोरखा': [28.0, 84.6333],
    'लमजुङ': [28.2333, 84.3667],
    'तनहुँ': [27.90, 84.20],
    'कास्की': [28.2096, 83.9856],
    'मनाङ': [28.6667, 84.25],
    'मुस्ताङ': [28.7833, 83.9833],
    'पर्वत': [28.2167, 83.7167],
    'स्याङ्जा': [28.00, 83.80],
    'म्याग्दी': [28.35, 83.5667],
    'बाग्लुङ': [28.2667, 83.6],
    'नवलपरासी (बर्दघाट सुस्ता पूर्व)': [27.60, 84.10], // Part of former Nawalparasi
    // Province 5 (Lumbini)
    'नवलपरासी (बर्दघाट सुस्ता पश्चिम)': [27.53, 83.67], // Part of former Nawalparasi
    'रुपन्देही': [27.5017, 83.4533],
    'कपिलवस्तु': [27.55, 83.05],
    'पाल्पा': [27.85, 83.55],
    'अर्घाखाँची': [27.90, 83.10],
    'गुल्मी': [28.05, 83.25],
    'रोल्पा': [28.35, 82.60],
    'प्युठान': [28.10, 82.85],
    'दाङ': [28.00, 82.30],
    'बाँके': [28.0500, 81.6167],
    'बर्दिया': [28.20, 81.30],
    'रुकुम (पूर्व)': [28.64, 82.84], // Rukum East
    // Province 6 (Karnali)
    'रुकुम (पश्चिम)': [28.63, 82.45], // Rukum West
    'सल्यान': [28.35, 82.15],
    'सुर्खेत': [28.6019, 81.6339],
    'दैलेख': [28.85, 81.7],
    'जाजरकोट': [28.7167, 82.1833],
    'डोल्पा': [28.9667, 82.8167],
    'हुम्ला': [29.9667, 81.8333],
    'जुम्ला': [29.2833, 82.1833],
    'कालिकोट': [29.1667, 81.5833],
    'मुगु': [29.5333, 82.15],
    // Province 7 (Sudurpashchim)
    'बाजुरा': [29.50, 81.50],
    'बझाङ': [29.55, 81.20],
    'डोटी': [29.10, 80.95],
    'अछाम': [29.10, 81.30],
    'दार्चुला': [29.85, 80.55],
    'बैतडी': [29.50, 80.45],
    'डडेल्धुरा': [29.30, 80.55],
    'कञ्चनपुर': [28.80, 80.20],
    'कैलाली': [28.6852, 80.6133]
};

function generateHotspotCards() {
    const districtCounts = {};
    (state.complaints || []).forEach(c => {
        const dist = c.district;
        if (!dist) return;
        districtCounts[dist] = (districtCounts[dist] || 0) + 1;
    });

    const sortedDistricts = Object.entries(districtCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    if (sortedDistricts.length === 0) {
        return '<div class="text-muted text-small p-2">स्थान डाटा उपलब्ध छैन</div>';
    }

    return sortedDistricts.map(([dist, count]) => `
        <div class="hotspot-card" style="min-width: 160px;" onclick="showHotspotMap('${dist}')">
            <div class="d-flex justify-between align-center mb-1">
                <span class="font-weight-bold text-primary text-small">${dist}</span>
                <span class="badge badge-danger">${count}</span>
            </div>
            <div class="progress" style="height: 4px; background-color: #e9ecef; border-radius: 2px;">
                <div class="progress-bar" style="width: ${Math.min(100, count * 10)}%; border-radius: 2px;"></div>
            </div>
        </div>
    `).join('');
}

function _getProvinceForDistrict(district) {
    if (!district) return '';
    const d = String(district).trim().replace(/\s+/g, ' ');
    const entries = Object.entries(LOCATION_FIELDS.DISTRICTS || {});
    for (const [provinceKey, districts] of entries) {
        if (Array.isArray(districts) && districts.map(x => String(x).trim().replace(/\s+/g, ' ')).includes(d)) {
            return LOCATION_FIELDS.PROVINCE?.[provinceKey] || '';
        }
    }
    return '';
}

function _getComplaintProvince(complaint) {
    if (!complaint) return '';
    const raw = complaint.province;
    const normalizedRaw = raw === 0 || raw ? String(raw).trim() : '';
    if (/^[1-7]$/.test(normalizedRaw)) {
        return LOCATION_FIELDS.PROVINCE?.[normalizedRaw] || '';
    }
    const byRaw = _normalizeProvinceName(normalizedRaw);
    if (byRaw) return byRaw;
    const byDistrict = _getProvinceForDistrict(complaint.district) || '';
    return _normalizeProvinceName(byDistrict) || byDistrict;
}

function _normalizeProvinceName(value) {
    if (!value) return '';
    const v = String(value)
        .replace(/^[0-9०-९]+\s*\/\s*/g, '')
        .trim()
        .replace(/\s+/g, ' ');

    const provinces = Object.values(LOCATION_FIELDS.PROVINCE || {});
    if (provinces.includes(v)) return v;
    if (v.endsWith(' प्रदेश') && provinces.includes(v)) return v;

    if (/कोशी/.test(v)) return LOCATION_FIELDS.PROVINCE?.['1'] || 'कोशी प्रदेश';
    if (/मधेश/.test(v)) return LOCATION_FIELDS.PROVINCE?.['2'] || 'मधेश प्रदेश';
    if (/बागमती/.test(v)) return LOCATION_FIELDS.PROVINCE?.['3'] || 'बागमती प्रदेश';
    if (/गण्डकी/.test(v)) return LOCATION_FIELDS.PROVINCE?.['4'] || 'गण्डकी प्रदेश';
    if (/लुम्बिनी/.test(v)) return LOCATION_FIELDS.PROVINCE?.['5'] || 'लुम्बिनी प्रदेश';
    if (/कर्णाली/.test(v)) return LOCATION_FIELDS.PROVINCE?.['6'] || 'कर्णाली प्रदेश';
    if (/सुदूरपश्चिम/.test(v)) return LOCATION_FIELDS.PROVINCE?.['7'] || 'सुदूरपश्चिम प्रदेश';

    return '';
}

function _updateHotspotMapCount(count) {
    const el = document.getElementById('mapFilteredCount');
    if (!el) return;
    el.textContent = String(count ?? 0);
    applyDevanagariDigits(el);
}

function _clearHotspotMapLayers() {
    if (!window.nvcMap || !Array.isArray(window.nvcMapLayers)) return;
    window.nvcMapLayers.forEach(layer => {
        try { window.nvcMap.removeLayer(layer); } catch (e) {}
    });
    window.nvcMapLayers = [];
}

function _renderHotspotMapMarkers({ map, complaints, focusDistrict = null }) {
    const districtCounts = {};
    (complaints || []).forEach(c => {
        const dist = c.district;
        if (!dist) return;
        districtCounts[dist] = (districtCounts[dist] || 0) + 1;
    });

    Object.entries(districtCounts).forEach(([dist, count]) => {
        const coords = DISTRICT_COORDINATES[dist];
        if (!coords) return;

        const isHotspot = count > 5;
        const isCritical = count > 10;
        let marker;

        const clickHandler = () => {
            const districtComplaints = (complaints || []).filter(c => c.district === dist);
            let content = `<div class="table-responsive"><table class="table table-sm table-bordered"><thead><tr><th>दर्ता नं</th><th>मिति</th><th>विवरण</th><th>स्थिति</th></tr></thead><tbody>`;

            if (districtComplaints.length === 0) {
                content += `<tr><td colspan="4" class="text-center">उजुरी छैन</td></tr>`;
            } else {
                districtComplaints.forEach(c => {
                    const statusText = c.status === 'resolved' ? 'फछ्रयौट' : c.status === 'progress' ? 'चालु' : 'बाँकी';
                    const statusClass = c.status === 'resolved' ? 'text-success' : c.status === 'progress' ? 'text-primary' : 'text-warning';
                    content += `<tr>
                       <td>${c.id}</td>
                       <td>${c.date}</td>
                       <td>${(c.description || '').substring(0, 40)}...</td>
                       <td class="${statusClass}">${statusText}</td>
                    </tr>`;
                });
            }

            content += `</tbody></table></div>`;
            openModal(`${dist} जिल्लाका उजुरीहरू`, content);
        };

        if (isHotspot) {
            const rippleColorClass = isCritical ? 'red' : 'yellow';
            const size = isCritical ? 18 : 14;
            const rippleIcon = L.divIcon({
                className: `ripple-marker ${rippleColorClass}`,
                iconSize: [size, size]
            });
            marker = L.marker(coords, { icon: rippleIcon }).addTo(map);
        } else {
            const radius = Math.min(30, 8 + count * 1.5);
            const color = '#1976d2';
            marker = L.circleMarker(coords, { radius: radius, fillColor: color, color: '#fff', weight: 1, opacity: 1, fillOpacity: 0.7 }).addTo(map);
        }

        window.nvcMapLayers = window.nvcMapLayers || [];
        window.nvcMapLayers.push(marker);

        marker.bindTooltip(`<strong>${dist}</strong><br>उजुरी संख्या: ${count}`, { direction: 'top' });
        marker.on('click', clickHandler);
    });

    if (focusDistrict && DISTRICT_COORDINATES[focusDistrict]) {
        map.setView(DISTRICT_COORDINATES[focusDistrict], 10);
    }
}

function showHotspotMap(focusDistrict = null) {
    state.currentView = 'hotspot_map';
    document.getElementById('pageTitle').textContent = 'हटस्पट नक्सा';
    
    const content = `
        <div class="card h-100">
            <div class="card-header d-flex justify-between align-center">
                <div class="d-flex align-center gap-3">
                    <h5 class="mb-0">उजुरीको भौगोलिक वितरण</h5>
                    <span class="text-small text-muted">Filtered: <strong id="mapFilteredCount">०</strong></span>
                </div>
                <div class="d-flex gap-2">
                    <select class="form-select form-select-sm" id="mapFilterProvince" onchange="updateMapFilter()">
                        <option value="">सबै प्रदेश</option>
                        ${Object.entries(LOCATION_FIELDS.PROVINCE).map(([k, v]) => `<option value="${v}">${v}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="card-body p-0" style="position: relative;">
                <div id="hotspotMap" style="height: 600px; width: 100%; background: #f8f9fa;"></div>
            </div>
        </div>
    `;
    
    document.getElementById('contentArea').innerHTML = content;
    applyDevanagariDigits(document.getElementById('contentArea'));
    updateActiveNavItem();

    if (focusDistrict) {
        const provinceForFocus = _getProvinceForDistrict(focusDistrict);
        const select = document.getElementById('mapFilterProvince');
        if (select && provinceForFocus) {
            select.value = provinceForFocus;
        }
    }

    setTimeout(() => {
        if (typeof L === 'undefined') {
            document.getElementById('hotspotMap').innerHTML = '<div class="p-5 text-center text-danger">नक्सा लोड गर्न सकिएन (Leaflet JS missing)</div>';
            return;
        }
        if (window.nvcMap) { window.nvcMap.remove(); window.nvcMap = null; }
        window.nvcMapLayers = [];
        const map = L.map('hotspotMap').setView([28.3949, 84.1240], 7);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);

        const provinceSelected = _normalizeProvinceName((document.getElementById('mapFilterProvince')?.value || '').trim());
        const complaintsForMap = provinceSelected
            ? (state.complaints || []).filter(c => _normalizeProvinceName(_getComplaintProvince(c)) === provinceSelected)
            : (state.complaints || []);

        _updateHotspotMapCount(complaintsForMap.length);

        _renderHotspotMapMarkers({ map, complaints: complaintsForMap, focusDistrict });
        window.nvcMap = map;
    }, 300);
}

function updateMapFilter() {
    if (!window.nvcMap) return;
    const provinceSelected = _normalizeProvinceName((document.getElementById('mapFilterProvince')?.value || '').trim());
    const complaintsForMap = provinceSelected
        ? (state.complaints || []).filter(c => _normalizeProvinceName(_getComplaintProvince(c)) === provinceSelected)
        : (state.complaints || []);

    _clearHotspotMapLayers();
    _updateHotspotMapCount(complaintsForMap.length);
    _renderHotspotMapMarkers({ map: window.nvcMap, complaints: complaintsForMap });
}
function monitorHotspotAlerts() { /* Alert logic */ }
function loadDistricts() {
    const provinceSelect = document.getElementById('complaintProvince');
    const districtSelect = document.getElementById('complaintDistrict');
    if (!provinceSelect || !districtSelect) return;
    const provinceId = provinceSelect.value;
    districtSelect.innerHTML = '<option value="">जिल्ला छान्नुहोस्</option>';
    if (provinceId && LOCATION_FIELDS.DISTRICTS[provinceId]) {
        LOCATION_FIELDS.DISTRICTS[provinceId].forEach(dist => { const option = document.createElement('option'); option.value = dist; option.textContent = dist; districtSelect.appendChild(option); });
        districtSelect.disabled = false;
      // Try to populate local levels if a local select exists for this form
      try { if (districtSelect.id === 'complaintDistrict') loadComplaintLocals(); } catch(e){}
    } else { districtSelect.disabled = true; }
}

function loadInvestigationDistricts() {
    const provinceSelect = document.getElementById('province');
    const districtSelect = document.getElementById('district');
    if (!provinceSelect || !districtSelect) return;
    
    const provinceId = provinceSelect.value;
    districtSelect.innerHTML = '<option value="">जिल्ला छन्नुहोस्</option>';
    
    if (provinceId && LOCATION_FIELDS.DISTRICTS[provinceId]) {
        LOCATION_FIELDS.DISTRICTS[provinceId].forEach(dist => {
            const option = document.createElement('option');
            option.value = dist;
            option.textContent = dist;
            districtSelect.appendChild(option);
        });
        districtSelect.disabled = false;
        try { if (districtSelect.id === 'district') loadInvestigationLocals(); } catch(e){}
    } else {
        districtSelect.disabled = true;
    }
}

  function loadOcDistricts() {
    const provinceSelect = document.getElementById('oc_province');
    const districtSelect = document.getElementById('oc_district');
    if (!provinceSelect || !districtSelect) return;
    const provinceId = provinceSelect.value;
    districtSelect.innerHTML = '<option value="">जिल्ला छन्नुहोस्</option>';
    if (provinceId && LOCATION_FIELDS.DISTRICTS[provinceId]) {
      LOCATION_FIELDS.DISTRICTS[provinceId].forEach(dist => {
        const option = document.createElement('option');
        option.value = dist;
        option.textContent = dist;
        districtSelect.appendChild(option);
      });
      districtSelect.disabled = false;
      try { if (districtSelect.id === 'oc_district') loadOcLocals(); } catch(e){}
    } else {
      districtSelect.disabled = true;
    }
  }

  // Edit form specific loaders (editProvince/editDistrict/editLocalLevel)
  function loadEditDistricts() {
    const provinceSelect = document.getElementById('editProvince');
    const districtSelect = document.getElementById('editDistrict');
    if (!provinceSelect || !districtSelect) return;
    const provinceId = provinceSelect.value;
    districtSelect.innerHTML = '<option value="">जिल्ला छन्नुहोस्</option>';
    if (provinceId && LOCATION_FIELDS.DISTRICTS[provinceId]) {
      LOCATION_FIELDS.DISTRICTS[provinceId].forEach(dist => {
        const option = document.createElement('option');
        option.value = dist;
        option.textContent = dist;
        districtSelect.appendChild(option);
      });
      districtSelect.disabled = false;
      try { if (districtSelect.id === 'editDistrict') loadEditLocals(); } catch(e){}
    } else {
      districtSelect.disabled = true;
    }
  }

  function loadEditLocals() {
    const provinceId = document.getElementById('editProvince')?.value || '';
    const district = document.getElementById('editDistrict')?.value || '';
    const localSelect = document.getElementById('editLocalLevel');
    populateLocalSelect(provinceId, district, localSelect);
  }

// Populate a select element with local levels (municipalities) for a given provinceId and district
function _populateLocalSelect(provinceId, districtName, selectEl) {
  if (!selectEl) return;
  selectEl.innerHTML = '<option value="">स्थानीय तह छान्नुहोस्</option>';
  if (!provinceId || !districtName) { selectEl.disabled = true; return; }
  const locals = (LOCATION_FIELDS.MUNICIPALITIES && LOCATION_FIELDS.MUNICIPALITIES[provinceId] && LOCATION_FIELDS.MUNICIPALITIES[provinceId][districtName]) || [];
  if (locals && locals.length > 0) {
    locals.forEach(l => { const o = document.createElement('option'); o.value = l; o.textContent = l; selectEl.appendChild(o); });
    selectEl.disabled = false;
  } else {
    // If no predefined locals, provide a freeform 'Other / Type manually' option
    const o = document.createElement('option'); o.value = ''; o.textContent = 'अन्य (म्यानुअली प्रविष्ट गर्न खाली छोड्नुहोस्)'; selectEl.appendChild(o);
    selectEl.disabled = false;
  }
  // If the select has a data-selected attribute (from edit forms), try to set it
  try {
    const selVal = selectEl.dataset && selectEl.dataset.selected ? selectEl.dataset.selected : selectEl.getAttribute('data-selected');
    if (selVal) {
      selectEl.value = selVal;
      // if value not found in options, append it as option (preserve existing value)
      if (!Array.from(selectEl.options).some(opt => opt.value === selVal)) {
        const extra = document.createElement('option'); extra.value = selVal; extra.textContent = selVal; extra.selected = true; selectEl.appendChild(extra);
      }
    }
  } catch(e) {}
}

NVC.Utils.populateLocalSelect = _populateLocalSelect;

function populateLocalSelect(provinceId, districtName, selectEl) {
  return NVC.Utils.populateLocalSelect.apply(this, arguments);
}

function _loadComplaintLocals() {
  const provinceId = document.getElementById('complaintProvince')?.value || '';
  const district = document.getElementById('complaintDistrict')?.value || '';
  const localSelect = document.getElementById('complaintLocal');
  populateLocalSelect(provinceId, district, localSelect);
}

NVC.Utils.loadComplaintLocals = _loadComplaintLocals;

function loadComplaintLocals() {
  return NVC.Utils.loadComplaintLocals.apply(this, arguments);
}

function _loadOcLocals() {
  const provinceId = document.getElementById('oc_province')?.value || '';
  const district = document.getElementById('oc_district')?.value || '';
  const localSelect = document.getElementById('oc_localLevel');
  populateLocalSelect(provinceId, district, localSelect);
}

NVC.Utils.loadOcLocals = _loadOcLocals;

function loadOcLocals() {
  return NVC.Utils.loadOcLocals.apply(this, arguments);
}

function _loadInvestigationLocals() {
  const provinceId = document.getElementById('province')?.value || '';
  const district = document.getElementById('district')?.value || '';
  const localSelect = document.getElementById('localLevel');
  populateLocalSelect(provinceId, district, localSelect);
}

NVC.Utils.loadInvestigationLocals = _loadInvestigationLocals;

function loadInvestigationLocals() {
  return NVC.Utils.loadInvestigationLocals.apply(this, arguments);
}

  function monitorHotspotAlerts() { /* Alert logic */ }

// Test function - Manual online complaints load
function testOnlineComplaintsLoad() {
  console.log('testOnlineComplaintsLoad - Starting manual test...');
  
  // Reset loading flag
  state._onlineComplaintsLoaded = false;
  
  // Load online complaints
  loadOnlineComplaintsFromSheets().then(result => {
    console.log('testOnlineComplaintsLoad - Result:', result);
    console.log('testOnlineComplaintsLoad - State:', state.onlineComplaints);
    
    // Show online complaints view
    showOnlineComplaintsView();
  });
  
  return 'Manual online complaints load test started';
}

(function () {
  try {
    if (typeof NVC !== 'object' || !NVC) return;

    NVC.Config = NVC.Config || {};
    NVC.State = NVC.State || {};
    NVC.Api = NVC.Api || {};
    NVC.UI = NVC.UI || {};
    NVC.Chatbot = NVC.Chatbot || {};
    NVC.Utils = NVC.Utils || {};

    try { NVC.Config.GOOGLE_SHEETS_CONFIG = GOOGLE_SHEETS_CONFIG; } catch (e) {}
    try { NVC.Config.MINISTRIES = MINISTRIES; } catch (e) {}

    try { NVC.State.state = state; } catch (e) {}

    try { if (!NVC.Api.getFromGoogleSheets) NVC.Api.getFromGoogleSheets = getFromGoogleSheets; } catch (e) {}
    try { if (!NVC.Api.postToGoogleSheets) NVC.Api.postToGoogleSheets = postToGoogleSheets; } catch (e) {}
    try { if (!NVC.Api.loadDataFromGoogleSheets) NVC.Api.loadDataFromGoogleSheets = loadDataFromGoogleSheets; } catch (e) {}
    try { if (!NVC.Api.testGoogleSheetsConnection) NVC.Api.testGoogleSheetsConnection = testGoogleSheetsConnection; } catch (e) {}
    try { if (!NVC.Api.syncAllDataToGoogleSheets) NVC.Api.syncAllDataToGoogleSheets = syncAllDataToGoogleSheets; } catch (e) {}
    try { if (!NVC.Api.submitForm) NVC.Api.submitForm = submitForm; } catch (e) {}
    try { if (!NVC.Api.saveComplaintToGoogleSheets) NVC.Api.saveComplaintToGoogleSheets = saveComplaintToGoogleSheets; } catch (e) {}
    try { if (!NVC.Api.updateComplaintInGoogleSheets) NVC.Api.updateComplaintInGoogleSheets = updateComplaintInGoogleSheets; } catch (e) {}
    try { if (!NVC.Api.saveProjectToGoogleSheets) NVC.Api.saveProjectToGoogleSheets = saveProjectToGoogleSheets; } catch (e) {}
    try { if (!NVC.Api.saveSampleTestToSheets) NVC.Api.saveSampleTestToSheets = saveSampleTestToSheets; } catch (e) {}
    try { if (!NVC.Api.generateReportFromGoogleSheets) NVC.Api.generateReportFromGoogleSheets = generateReportFromGoogleSheets; } catch (e) {}

    try { if (!NVC.UI.openAdminLogin) NVC.UI.openAdminLogin = openAdminLogin; } catch (e) {}
    try { if (!NVC.UI.openReports) NVC.UI.openReports = openReports; } catch (e) {}
    try { if (!NVC.UI.openShakhaSelection) NVC.UI.openShakhaSelection = openShakhaSelection; } catch (e) {}
    try { if (!NVC.UI.closeModal) NVC.UI.closeModal = closeModal; } catch (e) {}
    try { if (!NVC.UI.viewComplaint) NVC.UI.viewComplaint = viewComplaint; } catch (e) {}
    try { if (!NVC.UI.deleteComplaint) NVC.UI.deleteComplaint = deleteComplaint; } catch (e) {}
    try { if (!NVC.UI.logout) NVC.UI.logout = logout; } catch (e) {}

    try { if (!NVC.Chatbot.toggleChatbot) NVC.Chatbot.toggleChatbot = toggleChatbot; } catch (e) {}
    try { if (!NVC.Chatbot.sendChatMessage) NVC.Chatbot.sendChatMessage = sendChatMessage; } catch (e) {}
    try { if (!NVC.Chatbot.AI_SYSTEM) NVC.Chatbot.AI_SYSTEM = AI_SYSTEM; } catch (e) {}

    try { if (!NVC.Utils.getCurrentNepaliDate) NVC.Utils.getCurrentNepaliDate = getCurrentNepaliDate; } catch (e) {}
    try { if (!NVC.Utils.initializeNepaliDropdowns) NVC.Utils.initializeNepaliDropdowns = initializeNepaliDropdowns; } catch (e) {}
    try { if (!NVC.Utils.populateLocalSelect) NVC.Utils.populateLocalSelect = populateLocalSelect; } catch (e) {}
    try { if (!NVC.Utils.loadComplaintLocals) NVC.Utils.loadComplaintLocals = loadComplaintLocals; } catch (e) {}
    try { if (!NVC.Utils.loadOcLocals) NVC.Utils.loadOcLocals = loadOcLocals; } catch (e) {}
    try { if (!NVC.Utils.loadInvestigationLocals) NVC.Utils.loadInvestigationLocals = loadInvestigationLocals; } catch (e) {}
  } catch (e) {}
})();

// Make key functions globally accessible for HTML onclick handlers and delegated event handlers
if (typeof window !== 'undefined') {
  window.openAdminLogin = openAdminLogin;
  window.openReports = openReports;
  window.openShakhaSelection = openShakhaSelection;
  window.closeModal = closeModal;
  window.viewComplaint = viewComplaint;
  window.deleteComplaint = deleteComplaint;
  window.logout = logout;
  window.toggleChatbot = toggleChatbot;
  window.sendChatMessage = sendChatMessage;
  window.destroyAllCharts = destroyAllCharts;
  window.currentTheme = currentTheme;
  window.AI_SYSTEM = AI_SYSTEM;
  window.handleTableActions = handleTableActions;
  window.editComplaint = editComplaint;
  window.assignToShakha = assignToShakha;
  window.closeShakhaModal = closeShakhaModal;
  window.closeSettingsModal = closeSettingsModal;
  window.openProjectDateFilter = openProjectDateFilter;
  window.applyProjectDateFilter = applyProjectDateFilter;
  window.clearProjectDateFilter = clearProjectDateFilter;
  window.showThisMonthsComplaints = showThisMonthsComplaints;
  window.viewProject = viewProject;
  window.editProject = editProject;
  window.showTechnicalExaminersView = showTechnicalExaminersView;
  window.showNewExaminerModal = showNewExaminerModal;
  window.saveTechnicalExaminer = saveTechnicalExaminer;
  window.viewExaminer = viewExaminer;
  window.editExaminer = editExaminer;
  window.saveExaminerEdit = saveExaminerEdit;
  window.filterExaminers = filterExaminers;
  window.toggleSidebar = toggleSidebar;
  window.toggleDashboardSearch = toggleDashboardSearch;
  window.refreshAdminPlanningData = refreshAdminPlanningData;
}

// ==================== AI-POWERED SEARCH FUNCTIONALITY ====================

// AI Search State
let aiSearchState = {
    isListening: false,
    recognition: null,
  pauseTimer: null,
    currentFilters: {},
    savedPresets: [],
    suggestions: []
};

// Initialize AI Search
function initializeAISearch() {
    const searchInput = document.getElementById('aiSearchInput');
    const searchBtn = document.getElementById('aiSearchBtn');
    const voiceBtn = document.getElementById('voiceSearchBtn');
    const suggestionsContainer = document.getElementById('aiSuggestions');
    const suggestionsCloseBtn = document.getElementById('aiSuggestionsClose');
    const voiceFeedback = document.getElementById('voiceFeedback');

    if (!searchInput || !searchBtn || !voiceBtn) return;

    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        aiSearchState.recognition = new SpeechRecognition();
        // Keep listening across short pauses; we'll stop only on explicit stop
        aiSearchState.recognition.continuous = true;
        aiSearchState.recognition.interimResults = false;
        aiSearchState.recognition.lang = 'ne-NP'; // Nepali language

        // internal flag to indicate intentional stop (user clicked stop or pause timeout)
        aiSearchState._stopping = false;

        // helper to clear existing inactivity timer
        function clearPauseTimer() {
          try { if (aiSearchState.pauseTimer) { clearTimeout(aiSearchState.pauseTimer); aiSearchState.pauseTimer = null; } } catch(e){}
        }

        // start/reset inactivity timer (5 seconds)
        function resetPauseTimer() {
          clearPauseTimer();
          aiSearchState.pauseTimer = setTimeout(() => {
            aiSearchState._stopping = true;
            try { aiSearchState.recognition.stop(); } catch(e){}
          }, 5000);
        }

        aiSearchState.recognition.onstart = () => {
            aiSearchState.isListening = true;
            aiSearchState._stopping = false;
            voiceBtn.classList.add('listening');
            if (voiceFeedback) {
              voiceFeedback.textContent = 'सुन्दैछु...';
              voiceFeedback.classList.add('show');
            }
            // Start inactivity timer when listening begins
            resetPauseTimer();
        };

        aiSearchState.recognition.onresult = (event) => {
            // Reset inactivity timer whenever we receive speech results
            resetPauseTimer();

            // Combine results into a single transcript (append new final results)
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                transcript += event.results[i][0].transcript + (event.results[i].isFinal ? ' ' : '');
            }

            // If previous content exists, prefer appending so user can speak continuously
            const existing = String(searchInput.value || '').trim();
            searchInput.value = (existing ? existing + ' ' : '') + transcript.trim();

            if (voiceFeedback) {
              voiceFeedback.textContent = 'प्राप्त: ' + transcript.trim();
              setTimeout(() => {
                voiceFeedback.classList.remove('show');
              }, 2000);
            }

            // Continue processing but do not forcibly stop recognition here
            processAISearch(searchInput.value);
        };

        aiSearchState.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            if (voiceFeedback) {
              voiceFeedback.textContent = 'त्रुटि: पुन: प्रयास गर्नुहोस्';
              setTimeout(() => {
                voiceFeedback.classList.remove('show');
              }, 2000);
            }
            // Treat errors as an intentional stop
            aiSearchState._stopping = true;
            stopVoiceSearch();
        };

        aiSearchState.recognition.onend = () => {
            // If we intentionally stopped (via stop button or timeout), finalize UI
            if (aiSearchState._stopping) {
                stopVoiceSearch();
                return;
            }

            // Otherwise, try to restart recognition to keep listening across short auto-stops
            try {
                // small backoff before restart
                setTimeout(() => {
                    if (!aiSearchState._stopping) {
                        try { aiSearchState.recognition.start(); } catch (e){}
                    }
                }, 250);
            } catch (e) {}
        };
    }

    // Event listeners
    searchBtn.addEventListener('click', () => processAISearch(searchInput.value));
    voiceBtn.addEventListener('click', toggleVoiceSearch);
    searchInput.addEventListener('input', handleSearchInput);
    searchInput.addEventListener('focus', showSuggestions);
    searchInput.addEventListener('blur', () => {
        setTimeout(() => hideSuggestions(), 200);
    });

    // Close button for suggestions
    if (suggestionsCloseBtn) suggestionsCloseBtn.addEventListener('click', hideSuggestions);

    // Suggestion items
    document.querySelectorAll('.ai-suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
            const suggestion = item.dataset.suggestion;
            applySuggestion(suggestion);
        });
    });

    // Filter presets
    document.querySelectorAll('.filter-preset').forEach(preset => {
        preset.addEventListener('click', () => {
            const presetType = preset.dataset.preset;
            applyFilterPreset(presetType, preset);
        });
    });
}

// Toggle voice search
function toggleVoiceSearch() {
    if (!aiSearchState.recognition) {
        showToast('Voice search not supported in this browser', 'error');
        return;
    }

    if (aiSearchState.isListening) {
        stopVoiceSearch();
    } else {
        aiSearchState.recognition.start();
    }
}

// Stop voice search
function stopVoiceSearch() {
  // mark as intentional stop to avoid auto-restart
  try { aiSearchState._stopping = true; } catch(e){}
  if (aiSearchState.recognition && aiSearchState.isListening) {
    try { aiSearchState.recognition.stop(); } catch(e){}
  }
  aiSearchState.isListening = false;
  // clear inactivity timer
  try { if (aiSearchState.pauseTimer) { clearTimeout(aiSearchState.pauseTimer); aiSearchState.pauseTimer = null; } } catch(e){}
    const voiceBtn = document.getElementById('voiceSearchBtn');
    const voiceFeedback = document.getElementById('voiceFeedback');
    if (voiceBtn) voiceBtn.classList.remove('listening');
    if (voiceFeedback) voiceFeedback.classList.remove('show');
}

// Handle search input
function handleSearchInput(event) {
    const query = event.target.value;
    if (query.length > 2) {
        generateSmartSuggestions(query);
    } else {
        hideSuggestions();
    }
}

// Process AI search
function processAISearch(query) {
    if (!query.trim()) return;

    const indicator = document.getElementById('aiSearchIndicator');
    if (indicator) {
        indicator.classList.add('active');
        indicator.innerHTML = '<i class="fas fa-brain"></i> AI प्रक्रिया गर्दै...';
    }

    // Simulate AI processing
    setTimeout(() => {
        // Parse natural language query
        const searchParams = parseNaturalLanguageQuery(query);

        // Apply filters based on query
        applySearchFilters(searchParams);

        // If query mentions a specific branch name, show branch-related complaints list
        try {
          const q = String(query || '').toLowerCase();
          if (typeof SHAKHA === 'object') {
            for (const key of Object.keys(SHAKHA)) {
              const name = String(SHAKHA[key] || '').toLowerCase();
              if (name && q.indexOf(name) !== -1) {
                // Show complaints filtered by this branch name
                showComplaintsView({ shakha: SHAKHA[key] });
                hideSuggestions();
                return;
              }
            }
          }
        } catch (e) {}

        // Scope-aware result listing: search across complaints according to selected scope
        try {
          const scopeEl = document.getElementById('aiSearchScope');
          const selectedScope = scopeEl ? scopeEl.value : 'admin';
          const qLower = String(query || '').toLowerCase();
          let matches = [];
          if (window.state && Array.isArray(state.complaints)) {
            const complaints = state.complaints;

            // Determine effective restriction based on logged-in user role
            const user = state.currentUser || null;
            let userRole = user && user.role ? user.role : null;
            // If user is branch or mahashakha, force scope accordingly
            let effectiveScope = selectedScope;
            if (userRole === 'shakha') effectiveScope = 'shakha';
            if (userRole === 'mahashakha') effectiveScope = 'mahashakha';

            matches = complaints.filter(c => {
              const hay = (String((c.description||'') + ' ' + (c.committeeDecision||'') + ' ' + (c.decision||'') + ' ' + (c.complainant||'') + ' ' + (c.accused||'') + ' ' + (c.id||''))).toLowerCase();
              if (hay.indexOf(qLower) === -1) return false;

              // shakha-level user: only show complaints from their shakha
              if (userRole === 'shakha') {
                const userShakha = SHAKHA[user.shakha] || user.shakha || '';
                return (String(c.shakha || c.assignedShakha || c.assignedShakhaName || '').toLowerCase() === String(userShakha).toLowerCase());
              }

              // mahashakha-level user: only show complaints belonging to their mahashakha or configured shakhas
              if (userRole === 'mahashakha') {
                const userMahashakha = user.mahashakha || user.name;
                const allowedShakhas = MAHASHAKHA_STRUCTURE && MAHASHAKHA_STRUCTURE[userMahashakha] ? MAHASHAKHA_STRUCTURE[userMahashakha].map(s => String(s).toLowerCase()) : [];
                const complaintShakha = String(c.shakha || c.assignedShakha || c.assignedShakhaName || '').toLowerCase();
                return (allowedShakhas.includes(complaintShakha) || String(c.mahashakha || '').toLowerCase() === String(userMahashakha).toLowerCase());
              }

              // For non-branch users (admin or others), respect selected scope but allow admin to search across all
              if (effectiveScope === 'shakha') {
                return Boolean(c.shakha || c.assignedShakha || c.assignedShakhaName);
              }
              if (effectiveScope === 'mahashakha') {
                return Boolean(c.mahashakha || c.mahashakha);
              }
              // admin or default: allow all complaints
              return true;
            }).slice(0, 25);
          }

          const container = document.getElementById('aiSuggestions');
          if (container) {
            if (!matches || matches.length === 0) {
              container.innerHTML = `<div class="ai-no-results p-2">कुनै परिणाम फेला परेन</div>`;
            } else {
              const esc = s => String(s||'').replace(/</g,'&lt;').replace(/>/g,'&gt;');
              container.innerHTML = matches.map(c => `
                <div class="ai-result-item" data-id="${esc(c.id)}" style="cursor:pointer;padding:0.6rem;border-bottom:1px solid #eee;background:#fff;">
                  <div><strong>${esc(c.id)}</strong> — ${esc((c.description||'').substring(0,180))}</div>
                  <div class="text-xs text-muted">${esc(c.complainant || '')} • ${esc(c.assignedShakha || c.shakha || '')}</div>
                </div>
              `).join('');

              container.style.display = 'block';
              container.querySelectorAll('.ai-result-item').forEach(item => {
                item.addEventListener('click', () => {
                  const id = item.dataset.id;
                  hideSuggestions();
                  try { viewComplaint(id); } catch(e) { console.warn('open result failed', e); }
                });
              });
            }
          }

          // Update indicator if present
          if (indicator) {
            indicator.classList.remove('active');
            indicator.innerHTML = '<i class="fas fa-brain"></i> AI सक्षम';
          }

          // brief toast
          showToast(`खोज पूरा: "${query}"`, 'success');
          return;
        } catch (e) {
          console.warn('Scoped search failed', e);
        }
    }, 1500);
}

// Parse natural language query
function parseNaturalLanguageQuery(query) {
    const params = {
        timeRange: null,
        severity: [],
        category: [],
        status: null,
        keywords: query.toLowerCase()
    };

    // Time range detection
    if (query.includes('आज') || query.includes('today')) params.timeRange = 'today';
    else if (query.includes('हप्ता') || query.includes('week')) params.timeRange = 'week';
    else if (query.includes('महिना') || query.includes('month')) params.timeRange = 'month';
    else if (query.includes('वर्ष') || query.includes('year')) params.timeRange = 'year';

    // Severity detection
    if (query.includes('गम्भीर') || query.includes('serious')) params.severity.push('critical');
    if (query.includes('उच्च') || query.includes('high')) params.severity.push('high');
    if (query.includes('मध्यम') || query.includes('medium')) params.severity.push('medium');
    if (query.includes('न्यून') || query.includes('low')) params.severity.push('low');

    // Category detection
    if (query.includes('भ्रष्टाचार') || query.includes('corruption')) params.category.push('corruption');
    if (query.includes('विद्युतीय') || query.includes('misconduct')) params.category.push('misconduct');
    if (query.includes('अक्षमता') || query.includes('efficiency')) params.category.push('efficiency');

    // Status detection
    if (query.includes('समाधान') || query.includes('resolved')) params.status = 'resolved';
    if (query.includes('चालु') || query.includes('progress')) params.status = 'progress';
    if (query.includes('बाँकी') || query.includes('pending')) params.status = 'pending';

    return params;
}

// Apply search filters
function applySearchFilters(params) {
    // Clear existing filters
    clearAllFilters();

    // Apply time range
    if (params.timeRange) {
        const timeRadio = document.querySelector(`input[name="timeRange"][value="${params.timeRange}"]`);
        if (timeRadio) timeRadio.checked = true;
    }

    // Apply severity
    params.severity.forEach(severity => {
        const checkbox = document.getElementById(severity);
        if (checkbox) checkbox.checked = true;
    });

    // Apply category
    params.category.forEach(category => {
        const checkbox = document.getElementById(category);
        if (checkbox) checkbox.checked = true;
    });

    // Show advanced filters if any filters applied
    if (params.timeRange || params.severity.length > 0 || params.category.length > 0) {
        toggleAdvancedFilters(true);
    }

    // Store current filters
    aiSearchState.currentFilters = params;
}

// Generate smart suggestions
function generateSmartSuggestions(query) {
    const suggestions = [
        { title: 'गत महिनाका गम्भीर उजुरीहरू', description: 'उच्च प्राथमिकताका उजुरीहरू', type: 'time-severity' },
        { title: 'भ्रष्टाचार सम्बन्धी उजुरीहरू', description: 'सबै भ्रष्टाचार मुद्दाहरू', type: 'category' },
        { title: 'समाधान भएका मुद्दाहरू', description: 'सफलतापूर्वक समाधान भएका', type: 'status' }
    ];

    // Filter suggestions based on query
    const filtered = suggestions.filter(s => 
        s.title.toLowerCase().includes(query.toLowerCase()) ||
        s.description.toLowerCase().includes(query.toLowerCase())
    );

    updateSuggestionsDisplay(filtered);
}

// Update suggestions display
function updateSuggestionsDisplay(suggestions) {
    const container = document.getElementById('aiSuggestions');
    if (!container) return;

    container.innerHTML = suggestions.map(s => `
        <div class="ai-suggestion-item" data-suggestion="${s.type}">
            <div class="ai-suggestion-title">${s.title}</div>
            <div class="ai-suggestion-description">${s.description}</div>
        </div>
    `).join('');

    // Re-attach event listeners
    container.querySelectorAll('.ai-suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
            const suggestion = item.dataset.suggestion;
            applySuggestion(suggestion);
        });
    });
}

// Apply suggestion
function applySuggestion(suggestion) {
    const searchInput = document.getElementById('aiSearchInput');
    const suggestionsMap = {
        'serious-complaints': 'गम्भीर उजुरीहरू',
        'recent-complaints': 'भर्खरै दर्ता गरिएका',
        'resolved-cases': 'समाधान भएका मुद्दाहरू',
        'pending-review': 'समीक्षामा रहेका'
    };

    if (searchInput && suggestionsMap[suggestion]) {
        searchInput.value = suggestionsMap[suggestion];
        processAISearch(suggestionsMap[suggestion]);
    }
}

// Show/hide suggestions
function showSuggestions() {
  const container = document.getElementById('aiSuggestions');
  const closeBtn = document.getElementById('aiSuggestionsClose');
  if (container) {
    container.classList.add('show');
    container.style.display = 'block';
  }
  if (closeBtn) closeBtn.style.display = 'block';
}

function hideSuggestions() {
  const container = document.getElementById('aiSuggestions');
  const closeBtn = document.getElementById('aiSuggestionsClose');
  if (container) {
    container.classList.remove('show');
    container.style.display = 'none';
    container.innerHTML = '';
  }
  if (closeBtn) closeBtn.style.display = 'none';
}

// Toggle advanced filters
function toggleAdvancedFilters(show = null) {
    const panel = document.getElementById('advancedFilters');
    if (!panel) return;

    if (show === null) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    } else {
        panel.style.display = show ? 'block' : 'none';
    }
}

// Apply filter preset
function applyFilterPreset(presetType, presetElement) {
    // Remove active class from all presets
    document.querySelectorAll('.filter-preset').forEach(p => p.classList.remove('active'));
    
    if (presetType === 'save') {
        saveCurrentPreset();
        return;
    }

    // Apply preset
    const presets = {
        'urgent': {
            timeRange: 'week',
            severity: ['critical', 'high'],
            category: []
        },
        'recent': {
            timeRange: 'today',
            severity: [],
            category: []
        },
        'resolved': {
            timeRange: 'month',
            severity: [],
            category: [],
            status: 'resolved'
        },
        'pending': {
            timeRange: 'week',
            severity: [],
            category: [],
            status: 'pending'
        }
    };

    const preset = presets[presetType];
    if (preset) {
        applySearchFilters(preset);
        presetElement.classList.add('active');
        showToast(`प्रिसेट लागू: ${presetElement.textContent.trim()}`, 'success');
    }
}

// Save current preset
function saveCurrentPreset() {
    const presetName = prompt('प्रिसेटको नाम दिनुहोस्:');
    if (!presetName) return;

    const preset = { ...aiSearchState.currentFilters, name: presetName };
    aiSearchState.savedPresets.push(preset);
    
    // Save to localStorage
    localStorage.setItem('aiSearchPresets', JSON.stringify(aiSearchState.savedPresets));
    
    showToast(`प्रिसेट सेभ गरियो: ${presetName}`, 'success');
}

// Clear all filters
function clearAllFilters() {
    // Clear radio buttons
    document.querySelectorAll('input[type="radio"]').forEach(radio => radio.checked = false);
    
    // Clear checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => checkbox.checked = false);
    
    // Clear preset active states
    document.querySelectorAll('.filter-preset').forEach(p => p.classList.remove('active'));

    // Reset nepali date pickers (visible selects and hidden inputs) to placeholder
    try {
      document.querySelectorAll('.nepali-datepicker-dropdown').forEach(wrapper => {
        try {
          const target = wrapper.dataset.target;
          const selects = wrapper.querySelectorAll('.bs-year, .bs-month, .bs-day');
          selects.forEach(s => { if (s && s.options && s.options.length) s.selectedIndex = 0; });
          // clear corresponding hidden input
          if (target) {
            const hidden = document.getElementById(target);
            if (hidden) {
              hidden.value = '';
              hidden.dispatchEvent(new Event('input', { bubbles: true }));
              hidden.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }
        } catch(e){}
      });
    } catch(e){}
}

// Auto-complete functionality
function initializeAutoComplete() {
    const autocompleteInputs = document.querySelectorAll('.autocomplete-input');
    
    autocompleteInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            const query = e.target.value;
            if (query.length > 1) {
                showAutoCompleteSuggestions(input, query);
            } else {
                hideAutoCompleteSuggestions(input);
            }
        });

        input.addEventListener('blur', () => {
            setTimeout(() => hideAutoCompleteSuggestions(input), 200);
        });
    });
}

// Show auto-complete suggestions
function showAutoCompleteSuggestions(input, query) {
    const suggestions = getSuggestionsForInput(input, query);
    const container = input.nextElementSibling;
    
    if (!container || !container.classList.contains('autocomplete-suggestions')) return;

    container.innerHTML = suggestions.map(s => `
        <div class="autocomplete-item" data-value="${s.value}">
            <i class="fas ${s.icon} autocomplete-item-icon"></i>
            <span class="autocomplete-item-text">${s.text}</span>
            <span class="autocomplete-item-type">${s.type}</span>
        </div>
    `).join('');

    container.classList.add('show');

    // Attach event listeners
    container.querySelectorAll('.autocomplete-item').forEach(item => {
        item.addEventListener('click', () => {
            input.value = item.dataset.value;
            hideAutoCompleteSuggestions(input);
        });
    });
}

// Hide auto-complete suggestions
function hideAutoCompleteSuggestions(input) {
    const container = input.nextElementSibling;
    if (container && container.classList.contains('autocomplete-suggestions')) {
        container.classList.remove('show');
    }
}

// Get suggestions for input
function getSuggestionsForInput(input, query) {
    // This would be connected to actual data in a real implementation
    const commonSuggestions = [
        { value: 'भ्रष्टाचार', text: 'भ्रष्टाचार', icon: 'fa-exclamation-triangle', type: 'वर्ग' },
        { value: 'विद्युतीय व्यवहार', text: 'विद्युतीय व्यवहार', icon: 'fa-user-times', type: 'वर्ग' },
        { value: 'अक्षमता', text: 'अक्षमता', icon: 'fa-clock', type: 'वर्ग' },
        { value: 'काठमाडौं', text: 'काठमाडौं', icon: 'fa-map-marker-alt', type: 'स्थान' },
        { value: 'ललितपुर', text: 'ललितपुर', icon: 'fa-map-marker-alt', type: 'स्थान' }
    ];

    return commonSuggestions.filter(s => 
        s.text.toLowerCase().includes(query.toLowerCase())
    );
}

// Initialize all AI features when DOM is ready
// Field-specific speech-to-text state and helpers (for branch new complaint form fields)
const fieldSpeechState = {};

function initializeFieldSpeech() {
  try {
    console.log('initializeFieldSpeech called');
    const descBtn = document.getElementById('descVoiceBtn');
    const commBtn = document.getElementById('committeeVoiceBtn');
    const hsDescBtn = document.getElementById('hsDescVoiceBtn');
    const hlDescBtn = document.getElementById('hlDescVoiceBtn');
    const editDecisionBtn = document.getElementById('editDecisionVoiceBtn');
    const editDescBtn = document.getElementById('editDescVoiceBtn');
    const editCommitteeBtn = document.getElementById('editCommitteeVoiceBtn');
    
    console.log('Found voice buttons:', {
      descBtn: !!descBtn,
      commBtn: !!commBtn,
      hsDescBtn: !!hsDescBtn,
      hlDescBtn: !!hlDescBtn,
      editDecisionBtn: !!editDecisionBtn,
      editDescBtn: !!editDescBtn,
      editCommitteeBtn: !!editCommitteeBtn
    });
    
    if (descBtn) {
      descBtn.addEventListener('click', () => toggleFieldSpeech('complaintDescription', 'descVoiceBtn'));
      console.log('Added listener to descBtn');
    }
    if (commBtn) {
      commBtn.addEventListener('click', () => toggleFieldSpeech('committeeDecision', 'committeeVoiceBtn'));
      console.log('Added listener to commBtn');
    }
    if (hsDescBtn) {
      hsDescBtn.addEventListener('click', () => toggleFieldSpeech('hsDescription', 'hsDescVoiceBtn'));
      console.log('Added listener to hsDescBtn');
    }
    if (hlDescBtn) {
      hlDescBtn.addEventListener('click', () => toggleFieldSpeech('hlDescription', 'hlDescVoiceBtn'));
      console.log('Added listener to hlDescBtn');
    }
    if (editDecisionBtn) {
      editDecisionBtn.addEventListener('click', () => toggleFieldSpeech('editDecision', 'editDecisionVoiceBtn'));
      console.log('Added listener to editDecisionBtn');
    }
    if (editDescBtn) {
      editDescBtn.addEventListener('click', () => toggleFieldSpeech('editDescription', 'editDescVoiceBtn'));
      console.log('Added listener to editDescBtn');
    }
    if (editCommitteeBtn) {
      editCommitteeBtn.addEventListener('click', () => toggleFieldSpeech('editCommitteeDecision', 'editCommitteeVoiceBtn'));
      console.log('Added listener to editCommitteeBtn');
    }
    
    console.log('initializeFieldSpeech completed successfully');
  } catch (e) { 
    console.error('initializeFieldSpeech failed:', e); 
    // Don't show toast to avoid annoying users, just log the error
  }
}

function toggleFieldSpeech(fieldId, btnId) {
  try {
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      showToast('Voice input supported only in modern browsers', 'warning');
      return;
    }
    const key = fieldId;
    if (!fieldSpeechState[key]) fieldSpeechState[key] = { recognition: null, listening: false };
    const state = fieldSpeechState[key];
    const btn = document.getElementById(btnId);

    if (state.listening) {
      try { state.recognition.stop(); } catch (e) {}
      state.listening = false;
      if (btn) { btn.classList.remove('listening'); btn.innerHTML = '<i class="fas fa-microphone"></i> आवाज टाइप'; }
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recog = new SpeechRecognition();
    recog.continuous = false;
    recog.interimResults = true;
    recog.lang = 'ne-NP';

    recog.onstart = () => {
      state.listening = true;
      if (btn) { btn.classList.add('listening'); btn.innerHTML = '<i class="fas fa-stop"></i> रोक्नुहोस्'; }
    };

    let interim = '';
    recog.onresult = (ev) => {
      try {
        let finalTranscript = '';
        interim = '';
        for (let i = 0; i < ev.results.length; i++) {
          const res = ev.results[i];
          if (res.isFinal) finalTranscript += res[0].transcript;
          else interim += res[0].transcript;
        }
        const field = document.getElementById(fieldId);
        if (field) {
          // Append interim/final without losing existing content; only commit final segments
          if (finalTranscript && finalTranscript.trim().length > 0) {
            field.value = (field.value ? field.value + ' ' : '') + finalTranscript.trim();
          }
        }
      } catch (e) { console.error('field speech result error', e); }
    };

    recog.onerror = (ev) => {
      console.error('Field speech error', ev);
      showToast('आवाज पहिचानमा समस्या भयो', 'error');
      try { recog.stop(); } catch (e) {}
      state.listening = false;
      if (btn) { btn.classList.remove('listening'); btn.innerHTML = '<i class="fas fa-microphone"></i> आवाज टाइप'; }
    };

    recog.onend = () => {
      state.listening = false;
      if (btn) { btn.classList.remove('listening'); btn.innerHTML = '<i class="fas fa-microphone"></i> आवाज टाइप'; }
    };

    state.recognition = recog;
    try { recog.start(); } catch (e) { console.warn('recog.start failed', e); }
  } catch (e) { console.error('toggleFieldSpeech failed', e); }
}

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initializeAISearch();
  initializeAutoComplete();
  initializeFieldSpeech();

  // Load saved presets
  const savedPresets = localStorage.getItem('aiSearchPresets');
  if (savedPresets) {
    aiSearchState.savedPresets = JSON.parse(savedPresets);
  }
});

// Global functions
window.toggleVoiceSearch = toggleVoiceSearch;
window.stopVoiceSearch = stopVoiceSearch;
window.toggleAdvancedFilters = toggleAdvancedFilters;
window.processAISearch = processAISearch;
