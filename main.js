(function(){
  if (typeof window === 'undefined') return;
  window.NVC = window.NVC || {};

  // Expose compact aliases for convenience
  window.NVC.cfg = NVC.Config;
  window.NVC.api = NVC.Api;
  window.NVC.stateManager = NVC.State;
  window.NVC.ui = NVC.UI;
  window.NVC.utils = NVC.Utils;
  window.NVC.chat = NVC.Chatbot;

  // Initialize: attempt to load initial data if available
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){
      if (NVC.Api && typeof NVC.Api.loadDataFromGoogleSheets === 'function') {
        NVC.Api.loadDataFromGoogleSheets().catch(()=>{});
      }
    });
  } else {
    if (NVC.Api && typeof NVC.Api.loadDataFromGoogleSheets === 'function') {
      NVC.Api.loadDataFromGoogleSheets().catch(()=>{});
    }
  }

})();
