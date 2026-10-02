// V117 navigation bridge + colourful dropdowns/mobile tabs + PWA support
(function(){
  // PWA shell: manifest, theme, install support and service-worker registration.
  if(!document.querySelector('link[rel="manifest"]')){
    const manifest=document.createElement('link');
    manifest.rel='manifest';
    manifest.href='manifest.webmanifest?v=2';
    document.head.appendChild(manifest);
  }
  if(!document.querySelector('meta[name="theme-color"]')){
    const theme=document.createElement('meta');
    theme.name='theme-color';
    theme.content='#071a35';
    document.head.appendChild(theme);
  }
  if(!document.querySelector('link[data-mce-pwa="v117"]')){
    const pwaStyle=document.createElement('link');
    pwaStyle.rel='stylesheet';
    pwaStyle.href='assets/css/pwa-v116.css?v=116';
    pwaStyle.dataset.mcePwa='v117';
    document.head.appendChild(pwaStyle);
  }
  if(!document.querySelector('link[rel="apple-touch-icon"]')){
    const appleIcon=document.createElement('link');
    appleIcon.rel='apple-touch-icon';
    appleIcon.sizes='192x192';
    appleIcon.href='assets/images/app-icon-192.png?v=2';
    document.head.appendChild(appleIcon);
  }
  [
    ['mobile-web-app-capable','yes'],
    ['apple-mobile-web-app-capable','yes'],
    ['apple-mobile-web-app-status-bar-style','black-translucent'],
    ['apple-mobile-web-app-title','NDA English']
  ].forEach(([name,content])=>{
    if(!document.querySelector(`meta[name="${name}"]`)){
      const meta=document.createElement('meta');
      meta.name=name;
      meta.content=content;
      document.head.appendChild(meta);
    }
  });
  if(window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone===true){
    document.documentElement.classList.add('mne-pwa-standalone');
  }
  if('serviceWorker' in navigator){
    window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js?v=2',{scope:'./'}).catch(()=>{}),{once:true});
  }
  let deferredInstallPrompt=null;
  const installBtn=document.createElement('button');
  installBtn.type='button';
  installBtn.className='mne-install-app';
  installBtn.setAttribute('aria-label','Install Mastering NDA/NA English app');
  installBtn.innerHTML='<span class="dot" aria-hidden="true"></span><span>Install App</span>';
  const mountInstallButton=()=>{if(!installBtn.isConnected)document.body.appendChild(installBtn);};
  window.addEventListener('beforeinstallprompt',event=>{
    event.preventDefault();
    deferredInstallPrompt=event;
    mountInstallButton();
    installBtn.classList.add('show');
  });
  installBtn.addEventListener('click',async()=>{
    if(!deferredInstallPrompt)return;
    deferredInstallPrompt.prompt();
    try{await deferredInstallPrompt.userChoice;}catch(e){}
    deferredInstallPrompt=null;
    installBtn.classList.remove('show');
  });
  window.addEventListener('appinstalled',()=>{
    deferredInstallPrompt=null;
    installBtn.classList.remove('show');
  });

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
  const currentPage=(location.pathname.split('/').pop()||'index.html').toLowerCase();

  // Add Topic Wise Practice Online as a dedicated top-level navigation tab after Online PYQs & Sample Practice.
  if(nav && !nav.querySelector('.topic-practice-nav-link')){
    const quizLink=nav.querySelector(':scope > a.quiz-nav-link') || [...nav.querySelectorAll(':scope > a')].find(a=>a.getAttribute('href')==='quizzes.html');
    if(quizLink){
      const topicLink=document.createElement('a');
      topicLink.href='topic-practice.html';
      topicLink.className='topic-practice-nav-link';
      topicLink.innerHTML='Topic Wise Practice Online <span class="nav-flash-badge">NEW</span>';
      if(currentPage==='topic-practice.html')topicLink.classList.add('active');
      quizLink.insertAdjacentElement('afterend',topicLink);
    }
  }

  // Add Vocabulary Practice as a dedicated top-level navigation tab after Topic Wise Practice Online.
  if(nav && !nav.querySelector('.vocabulary-practice-nav-link')){
    const topicLink=nav.querySelector(':scope > a.topic-practice-nav-link') || [...nav.querySelectorAll(':scope > a')].find(a=>a.getAttribute('href')==='topic-practice.html');
    const quizLink=nav.querySelector(':scope > a.quiz-nav-link') || [...nav.querySelectorAll(':scope > a')].find(a=>a.getAttribute('href')==='quizzes.html');
    const vocabLink=document.createElement('a');
    vocabLink.href='vocabulary-practice.html';
    vocabLink.className='vocabulary-practice-nav-link';
    vocabLink.innerHTML='Vocabulary Practice <span class="nav-flash-badge">NEW</span>';
    if(currentPage==='vocabulary-practice.html')vocabLink.classList.add('active');
    if(topicLink)topicLink.insertAdjacentElement('afterend',vocabLink);
    else if(quizLink)quizLink.insertAdjacentElement('afterend',vocabLink);
  }

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
      const onStudyPage=studySectionPages.includes(currentPage);
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
        if(href===currentPage)a.classList.add('active');
        menu.appendChild(a);
      });
      wrap.append(toggle,menu);
      resourceLink.replaceWith(wrap);
    }
  }

  // Give every top-level mobile navigation item a different colour.
  // Practice navigation items receive a soft blinking/glow treatment.
  if(nav){
    [...nav.children].forEach((item,i)=>{
      const control=item.matches('a')?item:item.querySelector(':scope > .nav-dropdown-toggle');
      if(!control)return;
      control.classList.add('mce-topnav',`mce-topnav-theme-${Math.min(i,6)}`);
    });
    nav.querySelector('.study-material-dropdown > .nav-dropdown-toggle')?.classList.add('mce-attention-nav');
    nav.querySelector(':scope > a.quiz-nav-link')?.classList.add('mce-attention-nav');
    nav.querySelector(':scope > a.topic-practice-nav-link')?.classList.add('mce-attention-nav');
    nav.querySelector(':scope > a.vocabulary-practice-nav-link')?.classList.add('mce-attention-nav');
  }

  const page=currentPage;

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
