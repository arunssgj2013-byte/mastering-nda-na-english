const menuBtn=document.querySelector('.menu-btn');
const nav=document.querySelector('.nav');
menuBtn?.addEventListener('click',()=>{const o=nav.classList.toggle('open');menuBtn.setAttribute('aria-expanded',o)});
document.querySelectorAll('.nav a').forEach(a=>a.addEventListener('click',()=>nav?.classList.remove('open')));

const fb=document.getElementById('feedback');
document.querySelectorAll('[data-answer]').forEach(btn=>btn.addEventListener('click',()=>{
  document.querySelectorAll('[data-answer]').forEach(x=>x.classList.remove('correct','wrong'));
  if(btn.dataset.answer==='correct'){
    btn.classList.add('correct');
    if(fb)fb.innerHTML='<strong>Correct.</strong> “Accommodation” is spelt with double <em>c</em> and double <em>m</em>.';
  }else{
    btn.classList.add('wrong');
    if(fb)fb.innerHTML='<strong>Try again.</strong> Check the double letters in the word.';
  }
}));

const queryForm=document.getElementById('queryForm');
queryForm?.addEventListener('submit',e=>{
  e.preventDefault();
  const d=new FormData(queryForm);
  const subject=encodeURIComponent('Website Query - '+(d.get('topic')||'General'));
  const body=encodeURIComponent('Name: '+d.get('name')+'\nEmail: '+d.get('email')+'\nTopic: '+d.get('topic')+'\n\nMessage:\n'+d.get('message'));
  window.location.href='mailto:masteringndaenglish@gmail.com?subject='+subject+'&body='+body;
});

document.getElementById('year')?.append(new Date().getFullYear());

// Premium homepage slideshow
(function(){
  const slider=document.getElementById('heroSlider');
  if(!slider) return;
  const slides=[...slider.querySelectorAll('.hero-slide')];
  const dots=[...slider.querySelectorAll('[data-slide-to]')];
  const prev=slider.querySelector('[data-slide="prev"]');
  const next=slider.querySelector('[data-slide="next"]');
  let current=0; let auto;
  const show=(idx)=>{
    current=(idx+slides.length)%slides.length;
    slides.forEach((slide,i)=>slide.classList.toggle('active',i===current));
    dots.forEach((dot,i)=>dot.classList.toggle('active',i===current));
  };
  const play=()=>{clearInterval(auto);auto=setInterval(()=>show(current+1),4200)};
  prev?.addEventListener('click',()=>{show(current-1);play()});
  next?.addEventListener('click',()=>{show(current+1);play()});
  dots.forEach((dot,i)=>dot.addEventListener('click',()=>{show(i);play()}));
  show(0);play();
})();

function shuffleArray(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a;}
function localDateKey(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function hashString(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function seededRandom(seed){let x=seed||123456789;return ()=>{x+=0x6D2B79F5;let t=x;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
function seededShuffle(arr,seed){const a=[...arr];const rand=seededRandom(seed);for(let i=a.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}

const quizContainer=document.getElementById('quizQuestions');
if(typeof QUIZ_BANK!=='undefined' && quizContainer){
  const PROFILE_KEY='mceStudentProfileV2';
  const ATTEMPTS_KEY='mceQuizAttempts';
  const scoreBox=document.getElementById('quizScoreBox');
  const submitBtn=document.getElementById('submitQuizBtn');
  const resetBtn=document.getElementById('resetQuizBtn');
  const regenBtns=[document.getElementById('regenQuizBtn'),document.getElementById('regenQuizBtnAlt')].filter(Boolean);
  const selectedQuizLabel=document.getElementById('selectedQuizLabel');
  const quizModeBadge=document.getElementById('quizModeBadge');
  const timerDisplay=document.getElementById('quizTimerDisplay');
  const startTimerBtn=document.getElementById('startTimerBtn');
  const pauseTimerBtn=document.getElementById('pauseTimerBtn');
  const resetTimerBtn=document.getElementById('resetTimerBtn');
  const paperModeButtons=[...document.querySelectorAll('.launch-paper-mode')];
  const omrGrid=document.getElementById('omrGrid');
  const omrAnsweredCount=document.getElementById('omrAnsweredCount');
  let activeQuiz=[];
  let currentModeLabel='Daily Mixed NDA Set';
  let currentSeed=hashString(localDateKey());
  let timerSeconds=50*60;
  let timerInterval=null;
  let isSubmitted=false;

  const sectionPlan=[
    {title:'Section I – Synonyms',types:['Synonym'],count:5},
    {title:'Section II – Antonyms',types:['Antonym'],count:5},
    {title:'Section III – Idioms & Phrases',types:['Idiom'],count:5},
    {title:'Section IV – One-Word Substitution',types:['OWS'],count:5},
    {title:'Section V – Fill in the Blanks / Usage',types:['Fill in the Blanks'],count:8},
    {title:'Section VI – Grammar, Errors & Improvement',types:['Grammar','Spotting Errors','Sentence Improvement'],count:10},
    {title:'Section VII – Ordering of Words / Sentences',types:['Ordering'],count:5},
    {title:'Section VIII – Spelling & Vocabulary',types:['Spelling','Vocabulary'],count:7}
  ];

  const formatTime=(secs)=>`${String(Math.floor(secs/60)).padStart(2,'0')}:${String(secs%60).padStart(2,'0')}`;
  const updateTimerDisplay=()=>{if(timerDisplay)timerDisplay.textContent=formatTime(timerSeconds)};
  const stopTimer=()=>{clearInterval(timerInterval);timerInterval=null};
  const resetTimer=(secs=50*60)=>{stopTimer();timerSeconds=secs;updateTimerDisplay()};
  const startTimer=()=>{
    if(timerInterval||isSubmitted)return;
    timerInterval=setInterval(()=>{
      timerSeconds--;updateTimerDisplay();
      if(timerSeconds<=0){stopTimer();timerSeconds=0;updateTimerDisplay();if(!isSubmitted)submitQuiz(true)}
    },1000);
  };

  function pickQuestions(types,count,seed){
    const pool=QUIZ_BANK.filter(q=>types.includes(q.type));
    return seededShuffle(pool,seed).slice(0,count);
  }
  function setModeLabel(label){
    currentModeLabel=label;
    if(selectedQuizLabel)selectedQuizLabel.textContent=label;
    if(quizModeBadge)quizModeBadge.textContent=label;
  }
  function renderOmr(){
    if(!omrGrid)return;
    omrGrid.innerHTML=Array.from({length:50},(_,i)=>`<button type="button" class="omr-q" data-q="${i+1}">${i+1}</button>`).join('');
    omrGrid.querySelectorAll('.omr-q').forEach(btn=>btn.addEventListener('click',()=>{
      const q=Number(btn.dataset.q);
      document.querySelector(`.quiz-card[data-qindex="${q-1}"]`)?.scrollIntoView({behavior:'smooth',block:'center'});
    }));
    updateOmr();
  }
  function updateOmr(){
    if(!omrGrid)return;
    let answered=0;
    for(let q=1;q<=50;q++){
      const btn=omrGrid.querySelector(`[data-q="${q}"]`);
      const selected=document.querySelector(`input[name="q${q}"]:checked`);
      btn?.classList.toggle('answered',!!selected);
      if(selected)answered++;
    }
    if(omrAnsweredCount)omrAnsweredCount.textContent=`${answered} / 50 answered`;
  }
  function markOmrAfterSubmit(){
    if(!omrGrid)return;
    activeQuiz.forEach(q=>{
      const btn=omrGrid.querySelector(`[data-q="${q.qno}"]`);
      const selected=document.querySelector(`input[name="q${q.qno}"]:checked`);
      btn?.classList.remove('correct','wrong','unattempted');
      if(!selected)btn?.classList.add('unattempted');
      else if(Number(selected.value)===q.answer)btn?.classList.add('correct');
      else btn?.classList.add('wrong');
    });
  }
  function bindQuestionEvents(){
    document.querySelectorAll('#quizQuestions input[type="radio"]').forEach(input=>input.addEventListener('change',updateOmr));
    if('IntersectionObserver' in window && omrGrid){
      const obs=new IntersectionObserver(entries=>entries.forEach(entry=>{
        if(entry.isIntersecting){
          const idx=Number(entry.target.dataset.qindex)+1;
          omrGrid.querySelectorAll('.omr-q').forEach(b=>b.classList.remove('current'));
          omrGrid.querySelector(`[data-q="${idx}"]`)?.classList.add('current');
        }
      }),{rootMargin:'-38% 0px -52% 0px',threshold:0});
      document.querySelectorAll('.quiz-card').forEach(card=>obs.observe(card));
    }
  }
  function buildQuiz(modeLabel=currentModeLabel,seed=currentSeed){
    setModeLabel(modeLabel);
    currentSeed=seed;
    activeQuiz=[];isSubmitted=false;quizContainer.innerHTML='';
    let running=1;let offset=0;
    sectionPlan.forEach(section=>{
      const chosen=pickQuestions(section.types,section.count,seed+offset+97);
      offset+=113;
      quizContainer.insertAdjacentHTML('beforeend',`<div class="quiz-section-head"><span>${section.title}</span><small>${section.count} Questions</small></div>`);
      chosen.forEach(q=>{
        const qno=running++;
        const question={...q,sectionTitle:section.title,qno};activeQuiz.push(question);
        const opts=q.options.map((opt,i)=>`<label class="quiz-option"><input type="radio" name="q${qno}" value="${i}"><span><b>${String.fromCharCode(65+i)}.</b> ${opt}</span></label>`).join('');
        quizContainer.insertAdjacentHTML('beforeend',`<article class="quiz-card" data-qindex="${qno-1}"><div class="quiz-card-top"><span class="quiz-type">${q.type}</span><span class="quiz-num">Q${qno}</span></div><h3>${q.question}</h3><div class="quiz-options">${opts}</div><div class="quiz-explainer hidden" id="exp${qno}"></div></article>`);
      });
    });
    resetTimer();renderOmr();bindQuestionEvents();
    if(scoreBox){scoreBox.classList.add('hidden');scoreBox.innerHTML=''}
  }
  function saveAttempt(result){
    let profile=null;let attempts=[];
    try{profile=JSON.parse(localStorage.getItem(PROFILE_KEY)||'null')}catch{}
    try{attempts=JSON.parse(localStorage.getItem(ATTEMPTS_KEY)||'[]')}catch{}
    if(!profile)return;
    attempts.push({name:profile.name,studentId:profile.studentId,className:profile.className,institution:profile.institution,state:profile.state,setLabel:currentModeLabel,date:localDateKey(),iso:new Date().toISOString(),...result});
    localStorage.setItem(ATTEMPTS_KEY,JSON.stringify(attempts.slice(-250)));
  }
  function submitQuiz(auto=false){
    stopTimer();isSubmitted=true;
    let correct=0,attempted=0;const sectionStats={};
    activeQuiz.forEach(q=>{
      if(!sectionStats[q.sectionTitle])sectionStats[q.sectionTitle]={total:0,correct:0};
      sectionStats[q.sectionTitle].total++;
      const selected=document.querySelector(`input[name="q${q.qno}"]:checked`);
      const exp=document.getElementById(`exp${q.qno}`);
      document.querySelectorAll(`input[name="q${q.qno}"]`).forEach((input,i)=>{
        input.closest('.quiz-option').classList.remove('correct','wrong');
        if(i===q.answer)input.closest('.quiz-option').classList.add('correct');
      });
      if(selected){attempted++;if(Number(selected.value)===q.answer){correct++;sectionStats[q.sectionTitle].correct++}else selected.closest('.quiz-option').classList.add('wrong')}
      if(exp){exp.classList.remove('hidden');exp.innerHTML=`<strong>Answer:</strong> ${String.fromCharCode(65+q.answer)}. ${q.options[q.answer]}<br><strong>Explanation:</strong> ${q.explanation}`}
    });
    const total=activeQuiz.length,incorrect=attempted-correct,unattempted=total-attempted;
    const accuracy=attempted?(correct/attempted)*100:0,overall=(correct/total)*100;
    const marks=Number(((correct*4)-(incorrect*1.33)).toFixed(2));
    let grade='Needs More Practice';if(overall>=80)grade='Excellent';else if(overall>=65)grade='Very Good';else if(overall>=50)grade='Good';else if(overall>=35)grade='Keep Improving';
    const sectionHtml=Object.entries(sectionStats).map(([title,stat])=>{const pct=Math.round((stat.correct/stat.total)*100);return `<div class="section-score"><strong>${title}</strong><div class="mini-progress"><span style="width:${pct}%"></span></div><small>${stat.correct} / ${stat.total} correct (${pct}%)</small></div>`}).join('');
    if(scoreBox){
      scoreBox.classList.remove('hidden');
      scoreBox.innerHTML=`<div class="score-headline"><div class="score-title"><h3>Scorecard & Result Summary</h3><p>${auto?'Time is over — your quiz was auto-submitted. ':'Assessment completed successfully. '}Set attempted: <b>${currentModeLabel}</b></p></div><div class="score-badge">${grade}</div></div><div class="score-grid"><div class="score-card"><b>${correct}</b><span>Correct</span></div><div class="score-card"><b>${incorrect}</b><span>Incorrect</span></div><div class="score-card"><b>${unattempted}</b><span>Unattempted</span></div><div class="score-card"><b>${accuracy.toFixed(1)}%</b><span>Accuracy</span></div><div class="score-card"><b>${overall.toFixed(1)}%</b><span>Overall Score</span></div><div class="score-card"><b>${marks}</b><span>Estimated Marks</span></div></div><div class="section-head" style="margin-top:10px"><div><div class="section-kicker">Section-wise Performance</div><h2 class="section-title" style="font-size:28px">How you performed across the paper</h2></div><p>Use this summary to identify the strongest and weakest areas for your next revision cycle.</p></div><div class="section-score-grid">${sectionHtml}</div><div class="result-actions"><a class="btn btn-primary" href="dashboard.html">View User Dashboard</a><button class="btn btn-outline" type="button" id="printResultBtn">Print Result</button></div>`;
      scoreBox.scrollIntoView({behavior:'smooth',block:'start'});
      document.getElementById('printResultBtn')?.addEventListener('click',()=>window.print());
    }
    markOmrAfterSubmit();
    saveAttempt({correct,incorrect,unattempted,accuracy:Number(accuracy.toFixed(1)),overall:Number(overall.toFixed(1)),marks});
  }
  function resetQuiz(){
    document.querySelectorAll('#quizQuestions input[type="radio"]').forEach(x=>x.checked=false);
    document.querySelectorAll('.quiz-option').forEach(x=>x.classList.remove('correct','wrong'));
    document.querySelectorAll('.quiz-explainer').forEach(x=>{x.classList.add('hidden');x.innerHTML='' });
    if(scoreBox){scoreBox.classList.add('hidden');scoreBox.innerHTML=''}
    isSubmitted=false;renderOmr();resetTimer();
  }

  const params=new URLSearchParams(location.search);
  const paperParam=params.get('paper');
  if(paperParam){currentModeLabel=paperParam+' • NDA-style practice';currentSeed=hashString(paperParam+'|'+localDateKey())}
  else{currentModeLabel='Daily Quiz • '+localDateKey();currentSeed=hashString('daily|'+localDateKey())}

  paperModeButtons.forEach(btn=>btn.addEventListener('click',()=>{
    paperModeButtons.forEach(x=>x.closest('.pyq-quiz-card')?.classList.remove('active-paper'));
    btn.closest('.pyq-quiz-card')?.classList.add('active-paper');
    const label=btn.dataset.paper+' • NDA-style practice';
    buildQuiz(label,hashString(btn.dataset.paper+'|'+localDateKey()));
    startTimer();document.getElementById('quizArea')?.scrollIntoView({behavior:'smooth'});
  }));

  buildQuiz(currentModeLabel,currentSeed);
  submitBtn?.addEventListener('click',()=>submitQuiz(false));
  resetBtn?.addEventListener('click',resetQuiz);
  regenBtns.forEach(btn=>btn.addEventListener('click',()=>buildQuiz('Daily Quiz • '+localDateKey(),hashString('daily|'+localDateKey()))));
  startTimerBtn?.addEventListener('click',startTimer);
  pauseTimerBtn?.addEventListener('click',stopTimer);
  resetTimerBtn?.addEventListener('click',()=>resetTimer());
}
