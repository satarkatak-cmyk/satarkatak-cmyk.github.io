(function(){
  if (typeof window === 'undefined') return;
  window.NVC = window.NVC || {};
  NVC.State = NVC.State || {};

  // Central in-memory state object used across modules
  NVC.State.state = NVC.State.state || {
    complaints: [],
    projects: [],
    technicalInspectors: [],
    user: null,
    chatContext: null,
    ui: {}
  };

  // Basic state helpers
  NVC.State.get = function(key){
    return NVC.State.state[key];
  };
  NVC.State.set = function(key, val){
    NVC.State.state[key] = val;
    return val;
  };
  NVC.State.push = function(key, val){
    if (!Array.isArray(NVC.State.state[key])) NVC.State.state[key] = [];
    NVC.State.state[key].push(val);
    return NVC.State.state[key];
  };

})();
