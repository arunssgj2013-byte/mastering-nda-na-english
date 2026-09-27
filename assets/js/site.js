// V55R1 navigation bridge: expose the new NDA English guides throughout the main site
(function(){
  const nav=document.querySelector('.site-header .nav');
  if(nav && !nav.querySelector('.study-material-dropdown')){
    const resourceLink=[...nav.querySelectorAll('a[href="resources.html"]')][0];
    if(resourceLink){
      const studyPages=[
        ['resources.html','Study Material Home'],
        ['nda-english-syllabus.html','NDA English Syllabus'],
        ['nda-english-exam-pattern.html','NDA English Exam Pattern'],
        ['nda-english-pyq.html','NDA English PYQs'],
        ['nda-english-mock-test.html','NDA English Mock Tests'],
        ['nda-english-grammar.html','NDA English Grammar'],
        ['nda-english-vocabulary.html','NDA English Vocabulary'],
        ['nda-gat-english.html','NDA GAT English'],
        ['nda-english-preparation.html','NDA English Preparation Strategy']
      ];
      const page=(location.pathname.split('/').pop()||'index.html').toLowerCase();
      const onStudyPage=studyPages.some(([href])=>href===page);
      const wrap=document.createElement('div');
      wrap.className='nav-dropdown study-material-dropdown';
      const toggle=document.createElement('button');
      toggle.className='nav-dropdown-toggle'+(onStudyPage?' active':'');
      toggle.type='button';
      toggle.setAttribute('aria-expanded','false');
      toggle.setAttribute('aria-haspopup','true');
      toggle.innerHTML='NDA/NA Study Material <span aria-hidden="true">⌄</span>';
      const menu=document.createElement('div');
      menu.className='nav-dropdown-menu';
      studyPages.forEach(([href,label])=>{
        const a=document.createElement('a');
        a.href=href;
        a.textContent=label;
        if(href===page)a.classList.add('active');
        menu.appendChild(a);
      });
      wrap.append(toggle,menu);
      resourceLink.replaceWith(wrap);
    }
  }

  // Run the original site behaviour unchanged after the navigation is upgraded.
  const core=document.createElement('script');
  core.src='assets/js/site-core-v55.js?v=55r1';
  core.async=false;
  document.head.appendChild(core);
})();
