
const QUIZ_ATTEMPTS_KEY='mceQuizAttempts';
const QUIZ_PROFILE_KEY='mceStudentProfileV2';
(function(){
  const sets=(window.getStoredQuizSeries?window.getStoredQuizSeries(QUIZ_SERIES):(Array.isArray(QUIZ_SERIES)?JSON.parse(JSON.stringify(QUIZ_SERIES)):[]));
  const kindButtons=[...document.querySelectorAll('[data-series-kind]')];
  const grid=document.getElementById('setSelectorGrid');
  const seriesKicker=document.getElementById('seriesKicker');
  const seriesTitle=document.getElementById('seriesTitle');
  const seriesDescription=document.getElementById('seriesDescription');
  const quizContainer=document.getElementById('seriesQuizQuestions');
  const activeLabel=document.getElementById('activeQuizLabel');
  const activeType=document.getElementById('activeQuizType');
  const activeMeta=document.getElementById('activeQuizMeta');
  const modeBadge=document.getElementById('seriesModeBadge');
  const scoreBox=document.getElementById('seriesScoreBox');
  const submitBtn=document.getElementById('submitSeriesQuizBtn');
  const submitOmrBtn=document.getElementById('submitSeriesQuizOmrBtn');
  const submitMobileBtn=document.getElementById('submitSeriesQuizMobileBtn');
  const resetBtn=document.getElementById('resetSeriesQuizBtn');
  const startTimerBtn=document.getElementById('startSeriesTimerBtn');
  const pauseTimerBtn=document.getElementById('pauseSeriesTimerBtn');
  const resetTimerBtn=document.getElementById('resetSeriesTimerBtn');
  const timerDisplay=document.getElementById('seriesTimerDisplay');
  const stickyTimerDisplay=document.getElementById('seriesStickyTimerDisplay');
  const mobileTimerDisplay=document.getElementById('seriesMobileTimerDisplay');
  const mobileQuestionDisplay=document.getElementById('seriesMobileQuestionDisplay');
  const mobileTestDock=document.getElementById('seriesMobileTestDock');
  const omrGrid=document.getElementById('seriesOmrGrid');
  const answeredCount=document.getElementById('seriesOmrAnsweredCount');
  const leftCount=document.getElementById('seriesOmrLeftCount');
  const questionNav=document.getElementById('seriesQuestionNav');
  const questionProgress=document.getElementById('seriesQuestionProgress');
  const prevQuestionBtn=document.getElementById('prevSeriesQuestionBtn');
  const nextQuestionBtn=document.getElementById('nextSeriesQuestionBtn');
  const clearQuestionBtn=document.getElementById('clearCurrentQuestionBtn');
  const skipReviewBtn=document.getElementById('skipReviewQuestionBtn');
  const omrCurrentLabel=document.getElementById('seriesOmrCurrentLabel');
  const omrRangeLabel=document.getElementById('seriesOmrRangeLabel');
  const practiceGateway=document.getElementById('practiceGateway');
  const setLibrarySection=document.getElementById('setLibrary');
  const quizArenaSection=document.getElementById('quizArena');
  const openPyqLibraryBtn=document.getElementById('openPyqLibraryBtn');
  const openSampleLibraryBtn=document.getElementById('openSampleLibraryBtn');
  const backToPracticeGatewayBtn=document.getElementById('backToPracticeGatewayBtn');
  const backToSetLibraryBtn=document.getElementById('backToSetLibraryBtn');
  let currentKind='pyq', currentSet=null, timerSeconds=50*60, timerId=null, submitted=false, questionObserver=null, currentQuestionIndex=0;
  const reviewQuestions=new Set();
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const dateKey=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const dayNumber=()=>Math.floor(new Date().setHours(0,0,0,0)/86400000);
  const getSet=id=>sets.find(s=>s.id===id);
  const formatTime=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const stopTimer=()=>{clearInterval(timerId);timerId=null};
  function printResultOnly(){
    if(!scoreBox||scoreBox.classList.contains('hidden'))return;
    document.body.classList.add('print-result-only');
    const cleanup=()=>document.body.classList.remove('print-result-only');
    window.addEventListener('afterprint',cleanup,{once:true});
    setTimeout(()=>window.print(),60);
  }
  const updateTimer=()=>{const value=formatTime(timerSeconds);if(timerDisplay)timerDisplay.textContent=value;if(stickyTimerDisplay)stickyTimerDisplay.textContent=value;if(mobileTimerDisplay)mobileTimerDisplay.textContent=value;document.documentElement.classList.toggle('timer-low',timerSeconds<=300&&timerSeconds>0)};
  function resetTimer(){stopTimer();timerSeconds=50*60;updateTimer()}
  function startTimer(){if(!currentSet||submitted||timerId)return;timerId=setInterval(()=>{timerSeconds--;updateTimer();if(timerSeconds<=0){timerSeconds=0;updateTimer();stopTimer();submitQuiz(true)}},1000)}
  function pauseTimer(){stopTimer()}
  function inferCategory(q,lastContext=''){
    const t=((q.c||lastContext||'')+' '+q.q+' '+(q.e||'')).toLowerCase();
    if(t.includes('antonym')||t.includes('opposite in meaning')||t.includes('opposite of')||t.includes('hence the opposite'))return 'Antonyms';
    if(t.includes('synonym')||t.includes('nearest in meaning')||t.includes('closest synonym'))return 'Synonyms';
    if(t.includes('idiom')||t.includes('phrase')||t.includes('foreign phrase'))return 'Idioms & Phrases';
    if(t.includes('one word')||t.includes('one-word'))return 'One-Word Substitution';
    if(t.includes('spotting error')||t.includes('containing an error')||t.includes('find out whether there is any error')||t.includes('error in the sentence')||t.includes('has an error')||t.includes('part of the sentence that has an error'))return 'Spotting Errors';
    if(t.includes('improve')||t.includes('substitution improves')||t.includes('sentence improvement'))return 'Sentence Improvement';
    if(t.includes('blank')||t.includes('complete the sentence'))return 'Fill in the Blanks';
    if(t.includes('voice')||t.includes('passive')||t.includes('active voice'))return 'Voice';
    if(t.includes('direct speech')||t.includes('indirect speech')||t.includes('narration'))return 'Narration';
    if(t.includes('passage')||t.includes('read the following'))return 'Reading Comprehension';
    if(t.includes('arrange')||t.includes('proper order')||t.includes('sequence'))return 'Ordering';
    if(t.includes('word class')||t.includes('part of speech'))return 'Word Class';
    if(t.includes('spelt')||t.includes('spelling'))return 'Spelling';
    return 'Grammar & Usage';
  }

  function isDirectionText(text=''){
    return /^\s*directions?\s*(?:\([^)]*\))?\s*[:.-]/i.test(text)||/^\s*direction\s*[:.-]/i.test(text);
  }
  function defaultDirection(category){
    const map={
      'Synonyms':'In the following questions, choose the word that is nearest in meaning to the highlighted word or expression.',
      'Antonyms':'In the following questions, choose the word that is opposite in meaning to the highlighted word or expression.',
      'Idioms & Phrases':'Choose the alternative that best expresses the meaning of the highlighted idiom, phrase or expression.',
      'One-Word Substitution':'Choose the one word that can correctly substitute the given group of words or description.',
      'Spotting Errors':'Each sentence is divided into parts. Identify the part that contains the grammatical or usage error. If the source provides a “No error” option, choose it when appropriate.',
      'Sentence Improvement':'Choose the alternative that best improves the underlined or indicated part of the sentence without changing its meaning.',
      'Fill in the Blanks':'Choose the most appropriate option to complete the sentence correctly and meaningfully.',
      'Reading Comprehension':'Read the passage carefully and choose the most appropriate answer to each question that follows.',
      'Ordering':'Arrange the given words, phrases or sentence parts in the most logical and grammatically correct order.',
      'Voice':'Choose the option that correctly changes the voice of the given sentence without changing its meaning.',
      'Narration':'Choose the option that correctly changes the sentence between direct and indirect speech.',
      'Word Class':'Identify the correct grammatical class or part of speech of the indicated word.',
      'Spelling':'Choose the correctly spelt word or the option that satisfies the spelling instruction.',
      'Grammar & Usage':'Choose the option that makes the sentence grammatically correct and appropriate in standard English.'
    };
    return map[category]||map['Grammar & Usage'];
  }
  function directionHtml(category,sourceText=''){
    let text=sourceText&&isDirectionText(sourceText)?sourceText.replace(/^\s*directions?\s*[:.-]?\s*/i,''):defaultDirection(category);
    return `<div class="quiz-directions"><span class="directions-label">Directions</span><p>${esc(text)}</p></div>`;
  }
  function highlightQuestionText(q,category){
    const raw=String(q.q||'');
    let target=String(q.t||'').trim();
    const meaningMatch=String(q.e||'').match(/^\s*[\(\[]?([A-Za-z][A-Za-z’' -]{1,42}?)\s+(?:means|refers to|is the opposite|is opposite|is a synonym|is an antonym)/i);
    if(!target && meaningMatch) target=meaningMatch[1].trim();
    if(!target && ['Synonyms','Antonyms'].includes(category)){
      const words=raw.match(/[A-Za-z][A-Za-z’'-]{3,}/g)||[];
      const stop=new Set(['during','trial','witness','deposition','professor','known','characteristic','after','mishap','among','survivors','speaker','tone','became','increasingly','policy','committee','received','artist','professional','approach','reforms','conclusion','somewhat','goods','storage','facility','declared','judge','ruled','violations','human','rights','authorities','ancient','monument','design','nobility']);
      const expl=String(q.e||'').toLowerCase();
      target=[...words].sort((a,b)=>b.length-a.length).find(w=>!stop.has(w.toLowerCase())&&expl.includes(w.toLowerCase()))||'';
    }
    if(!target && ['Idioms & Phrases'].includes(category) && raw.length<=80) target=raw;
    let safe=esc(raw);
    if(target){
      const safeTarget=esc(target);
      const pos=safe.toLowerCase().indexOf(safeTarget.toLowerCase());
      if(pos>=0) safe=safe.slice(0,pos)+`<strong class="target-word">${safe.slice(pos,pos+safeTarget.length)}</strong>`+safe.slice(pos+safeTarget.length);
    }
    return safe.replace(/\n/g,'<br>');
  }
  function showGateway({scroll=false,updateUrl=true}={}){
    stopTimer();
    practiceGateway?.classList.remove('hidden');
    setLibrarySection?.classList.add('hidden');
    quizArenaSection?.classList.add('hidden');
    mobileTestDock?.classList.remove('active');
    document.body.classList.remove('quiz-test-active');
    if(updateUrl)history.replaceState(null,'','quizzes.html');
    if(scroll)practiceGateway?.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function showLibrary(kind,{scroll=true,updateUrl=true}={}){
    if(kind!=='sample')kind='pyq';
    stopTimer();
    renderSetLibrary(kind);
    practiceGateway?.classList.add('hidden');
    setLibrarySection?.classList.remove('hidden');
    quizArenaSection?.classList.add('hidden');
    mobileTestDock?.classList.remove('active');
    document.body.classList.remove('quiz-test-active');
    if(updateUrl)history.replaceState(null,'',`quizzes.html?mode=${encodeURIComponent(kind)}`);
    if(scroll)setLibrarySection?.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function renderSetLibrary(kind){
    currentKind=kind;
    kindButtons.forEach(b=>b.classList.toggle('active',b.dataset.seriesKind===kind));
    const list=sets.filter(s=>s.kind===kind);
    if(seriesKicker)seriesKicker.textContent=kind==='pyq'?'Verified Previous Years Questions':'Verified Sample Papers';
    if(seriesTitle)seriesTitle.textContent=kind==='pyq'?`${list.length} Verified PYQ Practice Set${list.length===1?'':'s'}`:`${list.length} Verified Sample Paper Practice Set${list.length===1?'':'s'}`;
    if(seriesDescription)seriesDescription.textContent=kind==='pyq'?'Only manually corrected PYQ papers are published here. Each set preserves the supplied questions, directions, answer key and explanations.':'Only manually corrected Sample Papers are published here.';
    if(!grid)return;
    if(!list.length){grid.innerHTML='<div class="quiz-empty-state"><strong>No verified set published yet</strong><span>More corrected papers will be added progressively.</span></div>';return;}
    grid.innerHTML=list.map((s,i)=>`<button class="series-set-card" type="button" data-set-id="${esc(s.id)}"><span class="series-set-no">${String(i+1).padStart(2,'0')}</span><div><small>${kind==='pyq'?'MANUALLY VERIFIED PYQ':'SAMPLE PRACTICE PAPER'}</small><h3>${esc(s.label)}</h3><p>50 Questions • 200 Marks • 50 Minutes • ${kind==='pyq'?'Source-corrected':'Exam-oriented practice'}</p></div><span class="series-go">Attempt →</span></button>`).join('');
    grid.querySelectorAll('[data-set-id]').forEach(btn=>btn.addEventListener('click',()=>guardedLoadSet(btn.dataset.setId,true,false)));
  }
  function setCurrentOmr(qNum){
    if(!omrGrid)return;
    omrGrid.querySelectorAll('.omr-q.current').forEach(b=>b.classList.remove('current'));
    const bubble=omrGrid.querySelector(`[data-q="${qNum}"]`);
    if(bubble){
      bubble.classList.add('current');
      bubble.setAttribute('aria-current','true');
      try{bubble.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'})}catch{}
    }
    omrGrid.querySelectorAll('.omr-q:not(.current)').forEach(b=>b.removeAttribute('aria-current'));
  }
  function questionSlides(){
    return [...document.querySelectorAll('#seriesQuizQuestions .question-slide')];
  }
  function updateQuestionNav(){
    const total=currentSet?.questions?.length||0;
    const q=currentSet?.questions?.[currentQuestionIndex];
    const qNum=q?.n??(currentQuestionIndex+1);
    if(questionProgress)questionProgress.textContent=total?`Question ${currentQuestionIndex+1} of ${total}`:'';
    if(mobileQuestionDisplay)mobileQuestionDisplay.textContent=total?`Q${qNum} / ${total}`:'Q–';
    if(omrCurrentLabel)omrCurrentLabel.textContent=total?`Attempting Question ${qNum}`:'Question Navigator';
    if(omrRangeLabel)omrRangeLabel.textContent=total?`Q1–Q${total}`:'';
    if(prevQuestionBtn)prevQuestionBtn.disabled=!total||currentQuestionIndex<=0;
    if(nextQuestionBtn){
      nextQuestionBtn.disabled=!total;
      if(submitted)nextQuestionBtn.textContent=currentQuestionIndex>=total-1?'End of Review':'Next Question';
      else nextQuestionBtn.textContent=currentQuestionIndex>=total-1?'Review OMR':'Save & Next';
    }
    if(clearQuestionBtn)clearQuestionBtn.disabled=!total||submitted;
    if(skipReviewBtn){
      skipReviewBtn.disabled=!total||submitted;
      skipReviewBtn.classList.toggle('is-marked',!!q&&reviewQuestions.has(String(qNum)));
      skipReviewBtn.textContent=!!q&&reviewQuestions.has(String(qNum))?'Review Marked — Next':'Skip & Review';
    }
  }
  function showQuestion(index,{scroll=true,flash=false}={}){
    const slides=questionSlides();
    if(!slides.length||!currentSet)return;
    currentQuestionIndex=Math.max(0,Math.min(slides.length-1,Number(index)||0));
    slides.forEach((slide,i)=>{
      const active=i===currentQuestionIndex;
      slide.classList.toggle('active',active);
      slide.hidden=!active;
      slide.setAttribute('aria-hidden',active?'false':'true');
    });
    const q=currentSet.questions[currentQuestionIndex];
    if(q)setCurrentOmr(q.n);
    updateQuestionNav();
    const active=slides[currentQuestionIndex];
    if(flash&&active){
      active.querySelector('.series-question')?.classList.add('question-jump-flash');
      setTimeout(()=>active.querySelector('.series-question')?.classList.remove('question-jump-flash'),650);
    }
    if(scroll){
      const stage=document.getElementById('seriesQuestionStage')||active;
      try{stage?.scrollIntoView({behavior:'smooth',block:'start'})}catch{}
    }
  }
  function jumpToQuestion(qNum){
    if(!currentSet)return;
    const idx=currentSet.questions.findIndex(q=>String(q.n)===String(qNum));
    if(idx<0)return;
    showQuestion(idx,{scroll:true,flash:true});
  }
  function watchCurrentQuestion(){
    if(questionObserver){questionObserver.disconnect();questionObserver=null}
    // V51 uses a single-question stage, so the active question is controlled directly.
  }
  function renderOmr(){
    if(!omrGrid)return;
    const total=currentSet?.questions?.length||50;
    omrGrid.innerHTML=Array.from({length:total},(_,i)=>`<button type="button" class="omr-q unanswered" data-q="${i+1}" aria-label="Go to question ${i+1}" title="Go to Question ${i+1}">${i+1}</button>`).join('');
    omrGrid.querySelectorAll('.omr-q').forEach(b=>b.addEventListener('click',()=>jumpToQuestion(b.dataset.q)));
    updateOmr();
    setCurrentOmr(currentSet?.questions?.[currentQuestionIndex]?.n||1);
  }
  function updateOmr(){
    const total=currentSet?.questions?.length||50;
    let n=0;
    for(let i=1;i<=total;i++){
      const sel=document.querySelector(`input[name="sq${i}"]:checked`);if(sel)n++;
      const bubble=omrGrid?.querySelector(`[data-q="${i}"]`);
      if(bubble && !submitted){
        const isReview=reviewQuestions.has(String(i));
        bubble.classList.remove('answered','unanswered','correct','wrong','unattempted','review');
        bubble.classList.add(isReview?'review':(sel?'answered':'unanswered'));
        const state=isReview?'Marked for review':(sel?'Answered':'Not answered');
        bubble.setAttribute('aria-label',`${state} — go to question ${i}`);
        bubble.setAttribute('title',`${state} — Question ${i}`);
      }
    }
    if(answeredCount)answeredCount.textContent=String(n);
    if(leftCount)leftCount.textContent=String(Math.max(0,total-n));
  }
  function hasSubstantivePassage(text=''){
    const t=String(text||'');
    return t.length>450 && /passage|read the following|blank spaces|blank space/i.test(t);
  }
  function splitPassageContext(text=''){
    const t=String(text||'').trim();
    if(!t)return {directions:'',passage:'',combined:false};
    const marker=/\bPassage(?:\s*[–—-]?\s*(?:\d+|I{1,3}))?\b[:\s]*/i;
    const m=marker.exec(t);
    if(m){
      const before=t.slice(0,m.index).trim();
      const after=t.slice(m.index+m[0].length).trim();
      if(after.length>120)return {directions:before,passage:after,combined:false};
    }
    return {directions:'',passage:t,combined:true};
  }
  function contextHtml(context,isPassage,titleText=''){
    if(!context)return '';
    const title=titleText||(isPassage?'Reading Passage':'Source Context');
    return `<details class="source-context ${isPassage?'passage-context':''}" ${isPassage?'open':''}><summary>${title}</summary><p>${esc(context)}</p></details>`;
  }
  function loadSet(id,scroll=false){
    const set=getSet(id);if(!set)return;
    currentSet=set;submitted=false;currentQuestionIndex=0;reviewQuestions.clear();stopTimer();resetTimer();
    practiceGateway?.classList.add('hidden');
    setLibrarySection?.classList.add('hidden');
    quizArenaSection?.classList.remove('hidden');
    if(activeLabel)activeLabel.textContent=set.label;
    if(activeType)activeType.textContent=set.kind==='pyq'?'Previous Years Question Practice':'Exam Trend Sample Paper Practice';
    if(modeBadge)modeBadge.textContent=set.label;
    if(activeMeta)activeMeta.textContent=`50 questions • 200 marks • 50 minutes • +4 correct • −1.33 wrong • ${set.kind==='pyq'?'Authentic PYQ':'Source: Practice Book Sample Paper'}`;
    [submitBtn,submitOmrBtn,submitMobileBtn,resetBtn,startTimerBtn,pauseTimerBtn,resetTimerBtn].forEach(b=>{if(b)b.disabled=false});
    mobileTestDock?.classList.add('active');
    document.body.classList.add('quiz-test-active');
    if(questionNav)questionNav.classList.remove('hidden');
    if(scoreBox){scoreBox.classList.add('hidden');scoreBox.innerHTML=''}
    let lastContext='',lastCategory='',carryDirectionBlock='',carryContextBlock='';
    quizContainer.innerHTML=set.questions.map((q,i)=>{
      const sourceContext=q.c||'';
      const sourceDirection=q.d||'';
      if(q.c||q.d)lastContext=[q.d||'',q.c||''].filter(Boolean).join(' ');
      const category=q.cat||inferCategory(q,lastContext);
      const actualPassage=hasSubstantivePassage(sourceContext);
      const sourceIsDirection=(isDirectionText(sourceDirection)||isDirectionText(sourceContext)) && !actualPassage;
      const opts=q.o.map((o,oi)=>`<label class="quiz-option"><input type="radio" name="sq${q.n}" value="${oi}"><span><b>${String.fromCharCode(65+oi)}.</b> ${esc(o)}</span></label>`).join('');
      let directionBlock='';
      let contextBlock='';
      if(actualPassage){
        const parts=splitPassageContext(sourceContext);
        if(sourceDirection){
          directionBlock=directionHtml(category,sourceDirection);
          contextBlock=contextHtml(parts.passage,true,category==='Reading Comprehension'?'Reading Passage':'Passage');
        }else if(parts.directions){
          directionBlock=directionHtml(category,parts.directions);
          contextBlock=contextHtml(parts.passage,true,category==='Reading Comprehension'?'Reading Passage':'Passage');
        }else{
          contextBlock=contextHtml(parts.passage,true,parts.combined?'Directions & Passage':(category==='Reading Comprehension'?'Reading Passage':'Passage'));
        }
      }else{
        const needsDirection=(category!==lastCategory)||sourceIsDirection||!!sourceDirection;
        directionBlock=needsDirection?directionHtml(category,sourceDirection||(sourceIsDirection?sourceContext:'')):'';
        if(q.c && !isDirectionText(sourceContext)) contextBlock=contextHtml(q.c,false,'Source Context');
      }
      if(directionBlock)carryDirectionBlock=directionBlock;
      else if(category!==lastCategory)carryDirectionBlock=directionHtml(category,'');
      if(contextBlock)carryContextBlock=contextBlock;
      else if((q.c||q.d) && !actualPassage)carryContextBlock='';
      const displayDirection=directionBlock||carryDirectionBlock;
      const displayContext=contextBlock||carryContextBlock;
      lastCategory=category;
      return `<section class="question-slide${i===0?' active':''}" data-index="${i}" data-q="${q.n}" ${i===0?'':'hidden'} aria-hidden="${i===0?'false':'true'}">${displayDirection}${displayContext}<article class="quiz-card series-question" data-q="${q.n}" data-index="${i}"><div class="quiz-card-top"><span class="quiz-type">${esc(category)}</span><span class="quiz-num">Question ${q.n} of ${set.questions.length}</span></div>${q.q?`<h3>${highlightQuestionText(q,category)}</h3>`:''}<div class="quiz-options">${opts}</div><div class="quiz-explainer hidden" id="sexp${q.n}"></div></article></section>`;
    }).join('');
    quizContainer.querySelectorAll('input[type="radio"]').forEach(inp=>inp.addEventListener('change',()=>{
      const card=inp.closest('.series-question');
      card?.querySelectorAll('.quiz-option').forEach(o=>o.classList.remove('selected'));
      inp.closest('.quiz-option')?.classList.add('selected');
      updateOmr();
      const q=card?.dataset.q;
      if(q)setCurrentOmr(q);
    }));
    renderOmr();
    watchCurrentQuestion();
    showQuestion(0,{scroll:false});
    history.replaceState(null,'',`quizzes.html?mode=${set.kind}&set=${encodeURIComponent(set.id)}`);
    if(window.MNEPortal)window.MNEPortal.logActivity('quiz_open',set.id,set.label,{kind:set.kind}).catch(()=>{});
    if(scroll)document.getElementById('quizArena')?.scrollIntoView({behavior:'smooth',block:'start'});
  }
  async function guardedLoadSet(id,scroll=false,startAfter=false){
    const set=getSet(id);if(!set)return false;
    const pendingUrl=`quizzes.html?mode=${encodeURIComponent(set.kind)}&set=${encodeURIComponent(set.id)}`;
    if(window.MNEPortal){const ok=await window.MNEPortal.requireSession({pendingUrl});if(!ok)return false}
    loadSet(id,scroll);if(startAfter)startTimer();return true;
  }
  function saveAttempt(result,sectionStats={}){
    let profile=null,attempts=[];try{profile=JSON.parse(localStorage.getItem(QUIZ_PROFILE_KEY)||'null')}catch{};try{attempts=JSON.parse(localStorage.getItem(QUIZ_ATTEMPTS_KEY)||'[]')}catch{};
    if(!profile||!currentSet)return;
    const iso=new Date().toISOString();
    const localRecord={name:profile.name,userId:profile.userId||profile.studentId||profile.id,studentId:profile.studentId||profile.id,userType:profile.userType||'STUDENT',className:profile.className,school:profile.school,state:profile.state,setId:currentSet.id,setLabel:currentSet.label,setType:currentSet.kind,date:dateKey(),iso,...result};
    attempts.push(localRecord);localStorage.setItem(QUIZ_ATTEMPTS_KEY,JSON.stringify(attempts.slice(-400)));
    if(window.MNEPortal){
      const key=`${profile.id||profile.studentId||profile.email}|${currentSet.id}|${iso}`;
      window.MNEPortal.call('submit_attempt',{paperId:currentSet.id,paperTitle:currentSet.label,paperType:currentSet.kind,correct:result.correct,incorrect:result.incorrect,unattempted:result.unattempted,totalQuestions:currentSet.questions.length,score:result.marks,accuracy:result.accuracy,overallPercent:result.overall,durationSeconds:Math.max(0,50*60-timerSeconds),sectionStats,clientAttemptKey:key},true).catch(err=>console.warn('Attempt sync failed',err));
    }
  }
  function submitQuiz(auto=false){
    if(!currentSet||submitted)return;submitted=true;stopTimer();if(submitBtn)submitBtn.disabled=true;if(submitOmrBtn)submitOmrBtn.disabled=true;if(submitMobileBtn)submitMobileBtn.disabled=true;mobileTestDock?.classList.remove('active');document.body.classList.remove('quiz-test-active');
    let correct=0,attempted=0;const cats={};let lastContext='';
    currentSet.questions.forEach(q=>{
      if(q.c)lastContext=q.c;const cat=inferCategory(q,lastContext);if(!cats[cat])cats[cat]={total:0,correct:0};cats[cat].total++;
      const sel=document.querySelector(`input[name="sq${q.n}"]:checked`);const exp=document.getElementById(`sexp${q.n}`);
      const accepted=Array.isArray(q.a)?q.a:[q.a];
      document.querySelectorAll(`input[name="sq${q.n}"]`).forEach((inp,oi)=>{inp.closest('.quiz-option').classList.remove('correct','wrong');if(accepted.includes(oi))inp.closest('.quiz-option').classList.add('correct')});
      if(sel){attempted++;if(accepted.includes(Number(sel.value))){correct++;cats[cat].correct++}else sel.closest('.quiz-option').classList.add('wrong')}
      if(exp){const answerText=accepted.map(ai=>`${String.fromCharCode(65+ai)}. ${esc(q.o[ai])}`).join(' / ');exp.classList.remove('hidden');exp.innerHTML=`<strong>Answer:</strong> ${answerText}<br><strong>Explanation:</strong> ${esc(q.e||'Answer as given in the uploaded source.')}`}
    });
    const total=50,wrong=attempted-correct,unattempted=total-attempted,accuracy=attempted?(correct/attempted)*100:0,overall=correct/total*100,marks=Number((correct*4-wrong*1.33).toFixed(2));
    let grade='Needs More Practice';if(overall>=80)grade='Excellent';else if(overall>=65)grade='Very Good';else if(overall>=50)grade='Good';else if(overall>=35)grade='Keep Improving';
    const catHtml=Object.entries(cats).map(([name,v])=>{const pct=Math.round(v.correct/v.total*100);return `<div class="section-score"><strong>${esc(name)}</strong><div class="mini-progress"><span style="width:${pct}%"></span></div><small>${v.correct} / ${v.total} correct (${pct}%)</small></div>`}).join('');
    if(scoreBox){
      let resultProfile=null;try{resultProfile=JSON.parse(localStorage.getItem(QUIZ_PROFILE_KEY)||'null')}catch{}
      const userName=esc(resultProfile?.name||'Registered User');
      const userType=String(resultProfile?.userType||'STUDENT').toUpperCase();
      const userRole=esc(userType==='TEACHER'?'Teacher':userType==='OTHER'?'Other User':'Student');
      const classMeta=userType==='STUDENT'&&resultProfile?.className?`<span><b>Class:</b> ${esc(resultProfile.className)}</span>`:'';
      const resultDate=esc(new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}));
      scoreBox.classList.remove('hidden');scoreBox.innerHTML=`<div class="print-result-brand"><strong>Mastering NDA/NA English</strong><span>Official Practice Result Sheet</span></div><div class="print-result-meta"><span><b>User:</b> ${userName}</span><span><b>Role:</b> ${userRole}</span>${classMeta}<span><b>Date:</b> ${resultDate}</span></div><div class="score-headline"><div class="score-title"><h3>Scorecard & Result Summary</h3><p>${auto?'Time is over — the paper was auto-submitted. ':'Paper submitted successfully. '}<b>${esc(currentSet.label)}</b></p></div><div class="score-badge">${grade}</div></div><div class="score-grid"><div class="score-card"><b>${correct}</b><span>Correct</span></div><div class="score-card"><b>${wrong}</b><span>Incorrect</span></div><div class="score-card"><b>${unattempted}</b><span>Unattempted</span></div><div class="score-card"><b>${accuracy.toFixed(1)}%</b><span>Accuracy</span></div><div class="score-card"><b>${overall.toFixed(1)}%</b><span>Overall</span></div><div class="score-card"><b>${marks}</b><span>Marks / 200</span></div></div><div class="section-head" style="margin-top:18px"><div><div class="section-kicker">Category-wise Performance</div><h2 class="section-title" style="font-size:28px">Your strengths and revision areas</h2></div></div><div class="section-score-grid">${catHtml}</div><div class="result-actions"><a class="btn btn-primary" href="dashboard.html">User Dashboard</a><button class="btn btn-outline" type="button" id="printSeriesResultBtn">Print Result Sheet</button></div>`;scoreBox.scrollIntoView({behavior:'smooth',block:'start'});document.getElementById('printSeriesResultBtn')?.addEventListener('click',printResultOnly)}
    currentSet.questions.forEach(q=>{const b=omrGrid?.querySelector(`[data-q="${q.n}"]`),sel=document.querySelector(`input[name="sq${q.n}"]:checked`),accepted=Array.isArray(q.a)?q.a:[q.a];b?.classList.remove('answered','unanswered','correct','wrong','unattempted','review');if(!sel)b?.classList.add('unattempted');else if(accepted.includes(Number(sel.value)))b?.classList.add('correct');else b?.classList.add('wrong')});
    if(answeredCount)answeredCount.textContent=String(attempted);if(leftCount)leftCount.textContent=String(unattempted);
    updateQuestionNav();
    saveAttempt({correct,incorrect:wrong,unattempted,accuracy:Number(accuracy.toFixed(1)),overall:Number(overall.toFixed(1)),marks},cats);
  }
  function clearQuiz(){if(!currentSet)return;if(submitBtn)submitBtn.disabled=false;if(submitOmrBtn)submitOmrBtn.disabled=false;if(submitMobileBtn)submitMobileBtn.disabled=false;mobileTestDock?.classList.add('active');document.body.classList.add('quiz-test-active');reviewQuestions.clear();document.querySelectorAll('#seriesQuizQuestions input[type="radio"]').forEach(i=>i.checked=false);document.querySelectorAll('#seriesQuizQuestions .quiz-option').forEach(x=>x.classList.remove('correct','wrong','selected'));document.querySelectorAll('#seriesQuizQuestions .quiz-explainer').forEach(x=>{x.classList.add('hidden');x.innerHTML=''});if(scoreBox){scoreBox.classList.add('hidden');scoreBox.innerHTML=''}submitted=false;currentQuestionIndex=0;resetTimer();renderOmr();showQuestion(0,{scroll:false})}
  prevQuestionBtn?.addEventListener('click',()=>showQuestion(currentQuestionIndex-1,{scroll:true}));
  nextQuestionBtn?.addEventListener('click',()=>{
    if(!currentSet)return;
    const q=currentSet.questions[currentQuestionIndex];
    if(q&&document.querySelector(`input[name="sq${q.n}"]:checked`))reviewQuestions.delete(String(q.n));
    updateOmr();
    if(currentQuestionIndex<currentSet.questions.length-1)showQuestion(currentQuestionIndex+1,{scroll:true});
    else{
      setCurrentOmr(currentSet.questions[currentQuestionIndex]?.n||currentSet.questions.length);
      try{document.getElementById('seriesOmrPanel')?.scrollIntoView({behavior:'smooth',block:'nearest'})}catch{}
    }
  });
  skipReviewBtn?.addEventListener('click',()=>{
    if(!currentSet||submitted)return;
    const q=currentSet.questions[currentQuestionIndex];if(!q)return;
    reviewQuestions.add(String(q.n));
    updateOmr();updateQuestionNav();
    if(currentQuestionIndex<currentSet.questions.length-1)showQuestion(currentQuestionIndex+1,{scroll:true});
    else try{document.getElementById('seriesOmrPanel')?.scrollIntoView({behavior:'smooth',block:'nearest'})}catch{}
  });
  clearQuestionBtn?.addEventListener('click',()=>{
    if(!currentSet||submitted)return;
    const q=currentSet.questions[currentQuestionIndex];if(!q)return;
    document.querySelectorAll(`input[name="sq${q.n}"]`).forEach(inp=>inp.checked=false);
    document.querySelectorAll(`input[name="sq${q.n}"]`).forEach(inp=>inp.closest('.quiz-option')?.classList.remove('selected'));
    reviewQuestions.delete(String(q.n));
    updateOmr();setCurrentOmr(q.n);updateQuestionNav();
  });
  kindButtons.forEach(b=>b.addEventListener('click',()=>showLibrary(b.dataset.seriesKind)));
  openPyqLibraryBtn?.addEventListener('click',()=>showLibrary('pyq'));
  openSampleLibraryBtn?.addEventListener('click',()=>showLibrary('sample'));
  backToPracticeGatewayBtn?.addEventListener('click',()=>showGateway({scroll:true}));
  backToSetLibraryBtn?.addEventListener('click',()=>showLibrary(currentSet?.kind||currentKind,{scroll:true}));
  submitBtn?.addEventListener('click',()=>submitQuiz(false));submitOmrBtn?.addEventListener('click',()=>submitQuiz(false));submitMobileBtn?.addEventListener('click',()=>submitQuiz(false));resetBtn?.addEventListener('click',clearQuiz);startTimerBtn?.addEventListener('click',startTimer);pauseTimerBtn?.addEventListener('click',pauseTimer);resetTimerBtn?.addEventListener('click',resetTimer);
  const params=new URLSearchParams(location.search);let mode=params.get('mode');let setId=params.get('set');
  if(!mode&&setId){const found=getSet(setId);if(found)mode=found.kind}
  if(setId&&getSet(setId)){
    const found=getSet(setId);renderSetLibrary(found.kind);guardedLoadSet(setId,false,false);
  }else if(mode==='sample'||mode==='pyq'){
    showLibrary(mode,{scroll:false,updateUrl:false});
  }else{
    showGateway({scroll:false,updateUrl:false});
  }
})();
