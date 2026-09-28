// V70 navigation bridge + colourful dropdowns/mobile tabs + clickable NDA English core areas + homepage practice CTA
(function(){
  // Load the lightweight visual enhancement styles site-wide.
  if(!document.querySelector('link[data-mce-highlights="v58"]')){
    const style=document.createElement('link');
    style.rel='stylesheet';
    style.href='assets/css/highlights-v58.css?v=58';
    style.dataset.mceHighlights='v58';
    document.head.appendChild(style);
  }
  if(!document.querySelector('link[data-mce-about-nav="v59"]')){
    const style=document.createElement('link');
    style.rel='stylesheet';
    style.href='assets/css/about-nav-v59.css?v=59';
    style.dataset.mceAboutNav='v59';
    document.head.appendChild(style);
  }
  if(!document.querySelector('link[data-mce-mobile-nav="v60"]')){
    const style=document.createElement('link');
    style.rel='stylesheet';
    style.href='assets/css/mobile-nav-v60.css?v=60';
    style.dataset.mceMobileNav='v60';
    document.head.appendChild(style);
  }

  const nav=document.querySelector('.site-header .nav');

  // Keep only the first four About NDA Exam items and colour-highlight them.
  if(nav){
    const aboutDrop=[...nav.querySelectorAll('.nav-dropdown')].find(drop=>{
      const toggle=drop.querySelector('.nav-dropdown-toggle');
      return toggle && toggle.textContent.trim().toLowerCase().startsWith('about nda exam');
    });
    if(aboutDrop){
      aboutDrop.classList.add('about-nda-dropdown');
      const aboutLinks=[...aboutDrop.querySelectorAll('.nav-dropdown-menu a')];
      aboutLinks.slice(4).forEach(a=>a.remove());
      aboutLinks.slice(0,4).forEach(a=>a.classList.add('mce-about-nav-color'));
    }
  }

  if(nav && !nav.querySelector('.study-material-dropdown')){
    const resourceLink=[...nav.querySelectorAll('a[href="resources.html"]')][0];
    if(resourceLink){
      // Keep the dropdown focused on core Study Material pages only.
      // PYQs and Mock Tests remain available through their existing pages/cards and the separate Online Practice navigation.
      const studyPages=[
        ['resources.html','Study Material Home'],
        ['nda-english-syllabus.html','NDA English Syllabus'],
        ['nda-english-exam-pattern.html','NDA English Exam Pattern']
      ];
      const studySectionPages=[
        ...studyPages.map(([href])=>href),
        'nda-english-pyq.html',
        'nda-english-mock-test.html',
        'nda-english-grammar.html',
        'nda-english-vocabulary.html',
        'nda-english-comprehension.html',
        'nda-english-cohesion.html'
      ];
      const page=(location.pathname.split('/').pop()||'index.html').toLowerCase();
      const onStudyPage=studySectionPages.includes(page);
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
        a.classList.add('mce-nav-color');
        if(href===page)a.classList.add('active');
        menu.appendChild(a);
      });
      wrap.append(toggle,menu);
      resourceLink.replaceWith(wrap);
    }
  }

  // Give every top-level mobile navigation item a different colour.
  // Study Material and Online PYQs/Sample Practice receive a soft blinking/glow treatment.
  if(nav){
    [...nav.children].forEach((item,i)=>{
      const control=item.matches('a')?item:item.querySelector(':scope > .nav-dropdown-toggle');
      if(!control)return;
      control.classList.add('mce-topnav',`mce-topnav-theme-${Math.min(i,6)}`);
    });
    nav.querySelector('.study-material-dropdown > .nav-dropdown-toggle')?.classList.add('mce-attention-nav');
    nav.querySelector(':scope > a.quiz-nav-link')?.classList.add('mce-attention-nav');
  }

  const page=(location.pathname.split('/').pop()||'index.html').toLowerCase();

  // Homepage: add an attractive free-practice CTA that sends visitors to the test-selection portal.
  if(page==='index.html' || page===''){
    if(!document.querySelector('link[data-mce-home-practice="v65"]')){
      const style=document.createElement('link');
      style.rel='stylesheet';
      style.href='assets/css/home-practice-cta-v65.css?v=65';
      style.dataset.mceHomePractice='v65';
      document.head.appendChild(style);
    }
    const heroLead=document.querySelector('.hero .lead');
    if(heroLead && !document.querySelector('.hero-practice-cta')){
      const cta=document.createElement('a');
      cta.className='hero-practice-cta';
      cta.href='quizzes.html';
      cta.setAttribute('aria-label','Register free and start NDA/NA online PYQ and sample paper practice');
      cta.innerHTML='<span class="hero-practice-badge">FREE PRACTICE</span><strong>Register Free &amp; Start Online Practice</strong><small>Attempt NDA/NA PYQs &amp; Sample Papers with OMR, timer and instant results.</small><span class="hero-practice-action">Choose a Test &amp; Start</span>';
      heroLead.insertAdjacentElement('afterend',cta);
    }
  }

  // Colour the complete Study Material page without changing any resource links or content.
  if(page==='resources.html'){
    document.body.classList.add('resource-colour-theme');
    const selectors=[
      'main article[class*="card"]',
      'main a[class*="card"]',
      'main .resource-tile',
      'main .study-path .step',
      'main .golden-rule-samples > div',
      'main [class*="-grid"] > div[class*="card"]'
    ];
    const cards=[...new Set(selectors.flatMap(sel=>[...document.querySelectorAll(sel)]))];
    cards.forEach((card,i)=>{
      card.classList.add('mce-color-card',`mce-theme-${i%8}`);
    });
  }

  // Turn the four syllabus core areas into colourful, fully clickable learning cards.
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
