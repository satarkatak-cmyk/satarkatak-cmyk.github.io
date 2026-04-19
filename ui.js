(function(){
  if (typeof window === 'undefined') return;
  window.NVC = window.NVC || {};
  NVC.UI = NVC.UI || {};

  // Minimal UI helpers to centralize DOM interactions
  NVC.UI.showToast = function(text, opts){
    if (typeof Toastify === 'function') {
      Toastify({ text: text, duration: (opts && opts.duration) || 3000, gravity: 'top', position: 'right', style: { background: (opts && opts.bg) || '#28a745' } }).showToast();
    } else {
      console.log('TOAST:', text);
    }
  };

  NVC.UI.openModal = function(id){
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('hidden');
  };
  NVC.UI.closeModal = function(id){
    // If no id provided, close the first visible modal on the page
    if (!id) {
      try {
        const openModal = document.querySelector('.modal:not(.hidden)');
        if (openModal) { openModal.classList.add('hidden'); }
        return;
      } catch (e) { return; }
    }
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('hidden');
  };

  // Attach simple event hookup helper
  NVC.UI.on = function(selector, event, handler){
    document.querySelectorAll(selector).forEach(el=>el.addEventListener(event, handler));
  };

  // Open a generic modal with title & HTML content (used across script)
  NVC.UI.openModalContent = function(title, content){
    try {
      const titleEl = document.getElementById('modalTitle');
      const bodyEl = document.getElementById('modalBody');
      const modal = document.getElementById('complaintModal');
      if (titleEl) titleEl.textContent = title || '';
      if (bodyEl) bodyEl.innerHTML = content || '';
      // Attach inline handlers for action buttons inside the modal body so
      // modal-internal actions run reliably and stop propagation to global
      // delegated handlers which may close the modal prematurely.
      try {
        // avoid re-attaching handlers repeatedly
        if (!modal._nvc_contentHandlersAttached) {
          modal._nvc_contentHandlersAttached = true;
        }
        // Attach to any action buttons inside this modal body
        const attachAction = (el) => {
          if (!el) return;
          if (el._nvc_action_handler_attached) return;
          el._nvc_action_handler_attached = true;
          el.addEventListener('click', function(ev){
            try {
              ev.preventDefault();
              ev.stopPropagation();
            } catch(e){}
            const action = el.getAttribute('data-action') || (el.dataset && el.dataset.action) || '';
            const id = el.getAttribute('data-id') || (el.dataset && el.dataset.id) || null;
            const funcName = el.getAttribute('data-func') || (action ? ({view:'viewComplaint',edit:'editComplaint',delete:'deleteComplaint',assign:'assignToShakha'}[action] || action) : null);
            if (funcName && typeof window[funcName] === 'function') {
              try { window[funcName](id); } catch(err){ console.error('modal action handler failed', err); }
            } else if (typeof handleTableActions === 'function') {
              try { handleTableActions({ target: el }); } catch(err){ console.error('modal handleTableActions failed', err); }
            }
          }, false);
        };

        // find buttons and also clickable parents that may carry data-action
        const nodes = bodyEl.querySelectorAll('.action-btn, [data-action]');
        nodes.forEach(n => attachAction(n));

        // Also ensure header close button works reliably for this modal
        const headerClose = modal.querySelector('.modal-header .action-btn');
        if (headerClose && !headerClose._nvc_close_attached) {
          headerClose._nvc_close_attached = true;
          headerClose.addEventListener('click', function(ev){
            try { ev.preventDefault(); ev.stopPropagation(); } catch(e){}
            try { if (typeof closeModal === 'function') closeModal(); else if (window.NVC && NVC.UI && typeof NVC.UI.closeModal === 'function') NVC.UI.closeModal(); } catch(e){ console.error('modal header close failed', e); }
          }, false);
        }
      } catch (err) { console.warn('attach modal content handlers failed', err); }
      if (modal) modal.classList.remove('hidden');
      // mark modal open timestamp to avoid immediate-close race with other handlers
      try { window._nvc_modalJustOpened = Date.now(); } catch (e) {}
      // Ensure modal is on top and visible (fixes stacking/containment issues)
      try {
        if (modal && modal.parentNode !== document.body) {
          document.body.appendChild(modal);
        }
        if (modal) {
          modal.style.setProperty('z-index', '2147483647', 'important');
          modal.style.setProperty('display', 'flex', 'important');
          modal.style.setProperty('visibility', 'visible', 'important');
          try {
            const comp = window.getComputedStyle(modal);
            const rect = modal.getBoundingClientRect();
            console.log('UI.openModalContent visibility debug', { display: comp.display, visibility: comp.visibility, opacity: comp.opacity, rect });
          } catch (e) {}
        }
      } catch (e) { console.warn('openModalContent visibility patch failed', e); }
      // apply Devanagari conversion if available
      if (NVC.Utils && typeof NVC.Utils.applyDevanagariDigits === 'function') {
        try { NVC.Utils.applyDevanagariDigits(modal); } catch (e) {}
      }
      // Initialize datepickers if present on the page
      try { if (typeof initializeDatepickers === 'function') initializeDatepickers(); } catch (e) {}
      try { if (typeof initializeNepaliDropdowns === 'function') initializeNepaliDropdowns(); } catch (e) {}
    } catch (e) { console.error('openModalContent failed', e); }
  };

  // Complaints list rendering moved from script.js
  NVC.UI.showComplaintsView = function(initialFilters = {}) {
    try {
      const stateObj = window.state || (window.NVC && NVC.State && NVC.State.state) || {};
      const AI = window.AI_SYSTEM || (window.NVC && NVC.Chatbot && NVC.Chatbot.AI_SYSTEM) || { analyzeComplaint: () => ({priority: ''}) };

      // Delegate to original global function name where other code expects it
      // This implementation mirrors the former showComplaintsView from script.js
      // and uses globals (state, MINISTRIES, SHAKHA) where available.
      // For brevity this uses existing helpers on the page (renderPagination, buildComplaintsFilterChipsHTML, etc.).

      // If a module-based state manager exists, prefer it
      const stateRef = stateObj;
      // Call the original global show if someone still has it; otherwise render
      if (typeof window.setContentAreaHTML !== 'function') {
        console.warn('setContentAreaHTML missing; showComplaintsView may not render correctly');
      }

      // Call the original implementation from script.js if present (legacy fallback)
      if (typeof window.__legacy_showComplaintsView === 'function') {
        return window.__legacy_showComplaintsView(initialFilters);
      }

      // Otherwise, try to reuse the large implementation by invoking a synthetic event
      // Keep simple: call global showComplaintsView if still defined (no-op here)
      console.log('NVC.UI.showComplaintsView called', initialFilters);
      if (typeof window.showComplaintsView === 'function' && window.showComplaintsView !== NVC.UI.showComplaintsView) {
        return window.showComplaintsView(initialFilters);
      }

      // If we reach here, no legacy renderer found; attempt minimal non-failing behavior
      try { if (typeof filterComplaintsTable === 'function') { filterComplaintsTable(); return; } } catch(e){}
      return;
    } catch (e) {
      console.error('NVC.UI.showComplaintsView failed', e);
    }
  };

  // Setup complaint form handlers (migrated from form1.html inline script)
  NVC.UI.setupComplaintForm = function() {
    try {
      const form = document.getElementById('complaintForm');
      if (form && !form._nvc_setup) {
        form.addEventListener('submit', function(e) {
          try {
            e.preventDefault();
            const successMsg = document.getElementById('registerSuccess');
            if (successMsg) successMsg.classList.add('show');
            this.reset();
            setTimeout(() => { if (successMsg) successMsg.classList.remove('show'); }, 4000);
          } catch (err) { console.error('complaintForm submit handler failed', err); }
        });
        form._nvc_setup = true;
      }

      const checkBtn = document.getElementById('checkStatusBtn');
      if (checkBtn && !checkBtn._nvc_setup) {

  // Delegate modal action buttons: allow buttons inside modal content to close the modal
  document.addEventListener('click', function(e){
    try {
      const btn = e.target.closest('.action-btn');
      if (!btn) return;
      // Only handle buttons that are inside a modal
      const modal = btn.closest('.modal');
      if (!modal) return;

      // Only treat buttons as modal-closing when they are explicitly the
      // header close control or have an explicit `modal-close` class.
      const inHeader = !!btn.closest('.modal-header');
      const isExplicitModalClose = btn.classList.contains('modal-close');
      if (!inHeader && !isExplicitModalClose) return;

      e.preventDefault();
      if (window.NVC && NVC.UI && typeof NVC.UI.closeModal === 'function') {
        if (modal.id) return NVC.UI.closeModal(modal.id);
        return NVC.UI.closeModal();
      }
      modal.classList.add('hidden');
    } catch (err) { /* fail silently */ }
  });

  // Debug: log all clicks inside complaintModal to help trace event flow
  document.addEventListener('click', function(e){
    try {
      const inModal = e.target && e.target.closest && e.target.closest('#complaintModal');
      if (!inModal) return;
      try {
        console.log('UI click inside complaintModal:', e.target.tagName, 'class=', e.target.className || '', 'data-action=', e.target.getAttribute && e.target.getAttribute('data-action'));
      } catch (err) { console.log('UI click inside complaintModal (could not stringify target)'); }
    } catch (err) {}
  }, true);

  // Mark mousedown inside modal so global capture-phase handlers can ignore
  // the subsequent click (prevents race where a capture handler closes the
  // modal before modal-internal handlers run).
  document.addEventListener('mousedown', function(e){
    try {
      const inModal = e.target && e.target.closest && e.target.closest('#complaintModal');
      if (inModal) {
        try { window._nvc_modalInteraction = Date.now(); } catch(e){}
        setTimeout(()=>{ try { delete window._nvc_modalInteraction; } catch(e){} }, 1000);
      }
    } catch (err) {}
  }, true);

  // Ensure clicking the FontAwesome eye icon (including its ::before glyph)
  // inside modal content triggers the associated action button (show detail).
  document.addEventListener('click', function(e){
    try {
      // If user clicked on the pseudo-element (::before) the event target is
      // still the element itself (the <i> with .fa-eye). Use closest to find it.
      const eye = e.target.closest && e.target.closest('.modal .fa-eye');
      if (!eye) return;
      // Find the nearest action button that contains this icon
      const btn = eye.closest('.action-btn') || eye.parentElement && eye.parentElement.closest('.action-btn');
      if (!btn) return;

      // If button is inside a modal, ensure it triggers the same behavior
      if (btn.disabled) return;

      // Prevent other handlers from closing the modal; invoke the action
      // directly (prefer existing mapped function like `viewComplaint`).
      try {
        e.preventDefault();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        if (e.stopPropagation) e.stopPropagation();

            // Walk up from the clicked icon to find any ancestor that carries
            // actionable attributes (data-action/data-id/data-func) or is an
            // .action-btn. This covers cases where chart/table markup puts the
            // attributes on <td> or the icon itself.
            let walker = eye;
            let actionEl = null;
            while (walker && walker !== document.body) {
              if (walker.classList && walker.classList.contains('action-btn')) { actionEl = walker; break; }
              if (walker.getAttribute && (walker.getAttribute('data-action') || walker.getAttribute('data-id') || walker.getAttribute('data-func'))) { actionEl = walker; break; }
              walker = walker.parentElement;
            }
            if (!actionEl) return;

            const action = actionEl.getAttribute('data-action') || (actionEl.dataset && actionEl.dataset.action) || null;
            const id = actionEl.getAttribute('data-id') || (actionEl.dataset && actionEl.dataset.id) || null;
            const funcName = actionEl.getAttribute('data-func') || (action ? ({view:'viewComplaint',edit:'editComplaint',delete:'deleteComplaint',assign:'assignToShakha'}[action] || action) : null);

        if (funcName && typeof window[funcName] === 'function') {
          try {
            console.log('UI modal-eye -> calling', funcName, 'id=', id, 'actionEl=', actionEl);
            window[funcName](id);
          } catch (err) { console.error('modal eye handler error', err); }
        } else if (typeof handleTableActions === 'function') {
          try { console.log('UI modal-eye -> delegating to handleTableActions', { target: actionEl }); handleTableActions({ target: actionEl }); } catch (err) { console.error('handleTableActions fallback failed', err); }
        } else {
          // As a last resort, trigger click but keep it synchronous and stopped
          try { console.log('UI modal-eye -> fallback click on', actionEl); actionEl.click(); } catch (err) {
            const ev = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
            actionEl.dispatchEvent(ev);
          }
        }
      } catch (err) { /* ignore */ }
    } catch (err) { /* ignore */ }
  });
        checkBtn.addEventListener('click', function() {
          try {
            const searchValue = (document.getElementById('searchComplaint') || {}).value || '';
            if (searchValue.trim() === '') {
              alert('कृपया उजुरी दर्ता नं. टाइप गर्नुहोस्');
              return;
            }

            const statusDisplay = document.getElementById('statusDisplay');
            if (statusDisplay) statusDisplay.classList.add('active');

            const titleEl = document.getElementById('complaintTitle');
            if (titleEl) titleEl.textContent = `उजुरी नं: ${searchValue}`;

            const statuses = ['pending', 'progress', 'resolved'];
            const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

            const badge = document.getElementById('statusBadge');
            if (badge) {
              badge.className = 'status-badge';
              if (randomStatus === 'pending') {
                badge.classList.add('pending');
                badge.textContent = 'छानविन भैरहेको';
                document.getElementById('complaintDesc').textContent = 'तपाईंको उजुरी दर्ता भई छानविनको अवस्थामा छ।';
              } else if (randomStatus === 'progress') {
                badge.classList.add('progress');
                badge.textContent = 'प्रक्रियामा';
                document.getElementById('complaintDesc').textContent = 'तपाईंको उजुरी उपर छानविन भइरहेको छ।';
              } else {
                badge.classList.add('resolved');
                badge.textContent = 'समाधान भयो';
                document.getElementById('complaintDesc').textContent = 'तपाईंको उजुरीको फछ्र्यौट भइसकेको छ।';
              }
            }
          } catch (err) { console.error('checkStatusBtn handler failed', err); }
        });
        checkBtn._nvc_setup = true;
      }
    } catch (e) { console.error('NVC.UI.setupComplaintForm failed', e); }
  };

  // Validate new complaint form fields. Returns { valid: boolean, message?: string }
  NVC.UI.validateNewComplaint = function() {
    try {
      const date = document.getElementById('complaintDate')?.value;
      const name = document.getElementById('complainantName')?.value;
      const desc = document.getElementById('complaintDescription')?.value;
      if (!date) return { valid: false, message: 'कृपया दर्ता मिति भर्नुहोस्' };
      if (!name) return { valid: false, message: 'कृपया उजुरकर्ताको नाम भर्नुहोस्' };
      if (!desc) return { valid: false, message: 'कृपया उजुरीको विवरण भर्नुहोस्' };
      if (!window.state || !window.state.currentUser) return { valid: false, message: 'कृपया पहिला लगइन गर्नुहोस्' };
      return { valid: true };
    } catch (e) {
      console.error('validateNewComplaint failed', e);
      return { valid: true };
    }
  };

  // Prefill complaint form or edit modal. `prefix` is '' for main form, 'edit' for edit modal
  NVC.UI.prefillComplaintForm = function(data = {}, prefix = '') {
    try {
      if (!data || typeof data !== 'object') return;
      const map = {
        date: 'Date', complainant: 'Complainant', accused: 'Accused', description: 'Description', remarks: 'Remarks', status: 'Status', ministry: 'Ministry', province: 'Province', district: 'District', localLevel: 'Local', ward: 'Ward'
      };
      // Direct mappings
      if (data.date && document.getElementById(prefix + (prefix === 'edit' ? 'Date' : 'complaintDate'))) {
        const id = prefix === 'edit' ? 'editDate' : 'complaintDate';
        const el = document.getElementById(id);
        if (el) el.value = data.date;
      }

      const setIf = (id, value) => { try { const el = document.getElementById(id); if (el) { el.value = value; if (el.tagName === 'SELECT') { try { el.dispatchEvent(new Event('change', { bubbles: true })); } catch(e){} } } } catch(e){} };

      if (data.complainant) setIf(prefix === 'edit' ? 'editComplainant' : 'complainantName', data.complainant);
      if (data.accused) setIf(prefix === 'edit' ? 'editAccused' : 'accusedName', data.accused);
      if (data.description) setIf(prefix === 'edit' ? 'editDescription' : 'complaintDescription', data.description);
      if (data.remarks) setIf(prefix === 'edit' ? 'editRemarks' : 'complaintRemarks', data.remarks);
      if (data.status) setIf(prefix === 'edit' ? 'editStatus' : 'complaintStatus', data.status);
      if (data.ministry) setIf(prefix === 'edit' ? 'editMinistry' : 'complaintMinistry', data.ministry);
      if (data.province) setIf(prefix === 'edit' ? 'editProvince' : 'complaintProvince', data.province);
      if (data.district) setIf(prefix === 'edit' ? 'editDistrict' : 'complaintDistrict', data.district);
      if (data.localLevel) {
        const localSel = document.getElementById(prefix === 'edit' ? 'editLocalLevel' : 'complaintLocal');
        if (localSel) {
          try { localSel.dataset.selected = data.localLevel; localSel.setAttribute('data-selected', data.localLevel); } catch(e){}
        }
      }
      if (data.ward) setIf(prefix === 'edit' ? 'editWard' : 'complaintWard', data.ward);

      // After setting province/district, try to populate dependent selects if helpers exist
      try { if (typeof loadComplaintLocals === 'function') loadComplaintLocals(); } catch (e) {}
      try { if (typeof loadEditLocals === 'function') loadEditLocals(); } catch (e) {}
    } catch (e) { console.error('prefillComplaintForm failed', e); }
  };

  // Dashboard form handlers (centralized)
  NVC.UI.saveDashboardEdit = function() {
    try {
      if (typeof window.saveDashboardEdit === 'function') return window.saveDashboardEdit();
      // Minimal default: find form and serialize to console, then toast
      const form = document.querySelector('.dashboard-form');
      if (!form) { if (typeof NVC.UI.showToast === 'function') NVC.UI.showToast('Save handler not available', 'warning'); return; }
      const data = {};
      Array.from(form.querySelectorAll('input,select,textarea')).forEach(el => { if (el.id) data[el.id] = el.value; });
      console.log('Dashboard save payload (UI fallback):', data);
      if (typeof NVC.UI.showToast === 'function') NVC.UI.showToast('Dashboard saved (local preview)', 'success');
      return data;
    } catch (e) { console.error('NVC.UI.saveDashboardEdit failed', e); }
  };

  NVC.UI.cancelDashboardEdit = function() {
    try {
      if (typeof window.cancelDashboardEdit === 'function') return window.cancelDashboardEdit();
      const form = document.querySelector('.dashboard-form');
      if (form) form.reset();
      if (typeof NVC.UI.showToast === 'function') NVC.UI.showToast('Cancelled', 'info');
    } catch (e) { console.error('NVC.UI.cancelDashboardEdit failed', e); }
  };

  // Technical Inspectors View
  NVC.UI.showTechnicalInspectorsView = function() {
    try {
      const stateObj = window.state || (window.NVC && NVC.State && NVC.State.state) || {};
      const inspectors = stateObj.technicalInspectors || [];
      
      // Create HTML for the technical inspectors table
      let html = `
        <div class="content-header">
          <h2>प्राविधिक परीक्षक सूची</h2>
          <div class="header-actions">
            <button class="btn btn-primary" onclick="showAddTechnicalInspectorForm()">
              <i class="fas fa-plus"></i> नयाँ प्राविधिक परीक्षक थप्नुहोस्
            </button>
          </div>
        </div>
        
        <div class="table-container">
          <table class="table table-striped">
            <thead>
              <tr>
                <th>क्र.सं.</th>
                <th>प्राविधिक परीक्षकको नाम</th>
                <th>NEC दर्ता नं.</th>
                <th>प्राविधिक परीक्षक तालिम लिएको वर्ष</th>
                <th>प्राविधिक परीक्षक प्रमाणपत्र नं</th>
                <th>प्राविधिक परीक्षण गरेका आयोजना</th>
                <th>कैफियत</th>
                <th>कार्य</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      if (inspectors.length === 0) {
        html += `
          <tr>
            <td colspan="8" class="text-center">कुनै प्राविधिक परीक्षकहरू फेला परेनन्</td>
          </tr>
        `;
      } else {
        inspectors.forEach((inspector, index) => {
          html += `
            <tr>
              <td>${index + 1}</td>
              <td>${inspector.name || ''}</td>
              <td>${inspector.necRegistrationNo || ''}</td>
              <td>${inspector.trainingYear || ''}</td>
              <td>${inspector.certificateNo || ''}</td>
              <td>${inspector.inspectedProjects || ''}</td>
              <td>${inspector.remarks || ''}</td>
              <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editTechnicalInspector('${inspector.id}')">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteTechnicalInspector('${inspector.id}')">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          `;
        });
      }
      
      html += `
            </tbody>
          </table>
        </div>
      `;
      
      // Set the content
      const contentArea = document.getElementById('contentArea');
      if (contentArea) {
        contentArea.innerHTML = html;
      }
      
    } catch (e) {
      console.error('NVC.UI.showTechnicalInspectorsView failed', e);
      if (typeof NVC.UI.showToast === 'function') {
        NVC.UI.showToast('प्राविधिक परीक्षकहरू लोड गर्न सकिएन', 'error');
      }
    }
  };

})();
