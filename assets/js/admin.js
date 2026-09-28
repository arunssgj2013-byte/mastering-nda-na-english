(function(){
  const css=document.createElement('link');
  css.rel='stylesheet';
  css.href='assets/css/admin-tools-v61.css?v=61';
  css.dataset.adminTools='v61';
  document.head.appendChild(css);

  const loadTools=()=>{
    const tools=document.createElement('script');
    tools.src='assets/js/admin-tools-v61.js?v=61';
    document.body.appendChild(tools);
  };

  const core=document.createElement('script');
  core.src='assets/js/admin-core-v50.js?v=50fix1';
  core.onload=()=>{
    // admin-core-v50 was originally written to initialise on DOMContentLoaded.
    // Because it is now loaded dynamically at the end of admin.html, that event
    // may already have fired. Re-fire it only for this private admin page so the
    // original login/dashboard initialisation runs normally.
    if(document.readyState!=='loading'){
      document.dispatchEvent(new Event('DOMContentLoaded'));
    }
    setTimeout(loadTools,100);
  };
  core.onerror=()=>{
    const status=document.getElementById('adminStatus');
    if(status){
      status.textContent='Administrator console could not load. Please refresh once.';
      status.className='admin-status error';
    }
  };
  document.body.appendChild(core);
})();
