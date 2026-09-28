(function(){
  const css=document.createElement('link');
  css.rel='stylesheet';
  css.href='assets/css/admin-tools-v61.css?v=61';
  css.dataset.adminTools='v61';
  document.head.appendChild(css);

  const core=document.createElement('script');
  core.src='assets/js/admin-core-v50.js?v=50';
  core.onload=()=>{
    const tools=document.createElement('script');
    tools.src='assets/js/admin-tools-v61.js?v=61';
    document.body.appendChild(tools);
  };
  document.body.appendChild(core);
})();
