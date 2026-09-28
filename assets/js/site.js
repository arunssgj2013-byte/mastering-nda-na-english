// V57 navigation bridge + clickable NDA English core areas
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
        ['nda-english-comprehension.html','NDA English Comprehension'],
        ['nda-english-cohesion.html','Cohesion & Sentence Sense'],
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

  // Turn the four syllabus core areas into colourful, fully clickable learning cards.
  const page=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  if(page==='nda-english-syllabus.html'){
    const heading=[...document.querySelectorAll('.seo-guide-section h2')].find(h=>h.textContent.trim().toLowerCase()==='core areas to prepare');
    const grid=heading?.parentElement?.querySelector('.seo-guide-grid');
    const cards=grid?[...grid.querySelectorAll('.seo-guide-card')]:[];
    const destinations=[
      ['nda-english-grammar.html','grammar','Open Grammar & Usage materials'],
      ['nda-english-vocabulary.html','vocabulary','Open Vocabulary materials'],
      ['nda-english-comprehension.html','comprehension','Open Comprehension materials'],
      ['nda-english-cohesion.html','cohesion','Open Cohesion & Sentence Sense materials']
    ];
    if(cards.length>=4){
      grid.classList.add('seo-core-grid');
      cards.slice(0,4).forEach((card,i)=>{
        const [href,theme,label]=destinations[i];
        const link=document.createElement('a');
        link.href=href;
        link.className=`seo-guide-card seo-core-card ${theme}`;
        link.setAttribute('aria-label',label);
        link.innerHTML=card.innerHTML;
        card.replaceWith(link);
      });
    }
  }

  // Run the original site behaviour unchanged after the navigation/page enhancement.
  const core=document.createElement('script');
  core.src='assets/js/site-core-v55.js?v=55r1';
  core.async=false;
  document.head.appendChild(core);
})();
