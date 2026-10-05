/* V104 — English Grammar Mastery Challenge CBT with persistent user/admin attempt records. */
(function(){
  const series=Array.isArray(window.GOLDEN_RULES_SERIES)?window.GOLDEN_RULES_SERIES:(typeof GOLDEN_RULES_SERIES!=='undefined'&&Array.isArray(GOLDEN_RULES_SERIES)?GOLDEN_RULES_SERIES:[]);
  const ATTEMPTS_KEY='mceQuizAttempts',PROFILE_KEY='mceStudentProfileV2';
  const topicGrid=document.getElementById('topicPracticeGrid'),setPanel=document.getElementById('topicSetPanel'),setGrid=document.getElementById('topicSetGrid'),setTitle=document.getElementById('topicSetTitle'),testPanel=document.getElementById('topicTestPanel'),questionBox=document.getElementById('topicQuestionBox'),omr=document.getElementById('topicOmr'),timerEl=document.getElementById('topicTimer'),scoreBox=document.getElementById('topicScoreBox'),btnPrev=document.getElementById('topicPrev'),btnNext=document.getElementById('topicNext'),btnClear=document.getElementById('topicClear'),btnReview=document.getElementById('topicReview'),btnSubmit=document.getElementById('topicSubmit');
  let activeSet=null,index=0,answers={},review=new Set(),timerId=null,seconds=0,submitted=false;
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const topics=[...new Set(series.map(s=>s.topic).filter(Boolean))];
  const totalMarks=s=>(s.questions?.length||0)*(s.marksPerCorrect??4);
  const fmt=n=>Number(Number(n).toFixed(2));
  const dateKey=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};

  function renderTopics(){
    if(!topicGrid)return;
    if(!topics.length){topicGrid.innerHTML='<div class="topic-empty"><strong>Grammar Mastery Challenge practice is ready.</strong><span>The 100-rule mastery test is ready.</span></div>';return;}
    topicGrid.innerHTML=topics.map((t,i)=>{const sets=series.filter(s=>s.topic===t);return `<button class="topic-card" data-topic="${esc(t)}" type="button"><small>Grammar Mastery</small><h3>${esc(t)}</h3><p>Attempt all 100 Golden Rules in one timed online test.</p><span class="topic-count">${sets.length} Practice Set${sets.length===1?'':'s'}</span></button>`}).join('');
    topicGrid.querySelectorAll('[data-topic]').forEach(b=>b.onclick=()=>showSets(b.dataset.topic));
  }

  function showSets(topic){
    const list=series.filter(s=>s.topic===topic);setTitle.textContent=topic;
    setGrid.innerHTML=list.map((s,i)=>`<button class="topic-set-card" type="button" data-set="${esc(s.id)}"><span class="topic-set-no">${String(s.setNo||i+1).padStart(2,'0')}</span><div><h3>${esc(s.label||`${topic} — Practice Set ${i+1}`)}</h3><p>${s.questions?.length||0} Questions • ${fmt(totalMarks(s))} Marks • ${s.duration||50} Minutes • +4 / −1.33</p></div><span class="topic-set-go">Attempt →</span></button>`).join('');
    setPanel.classList.remove('hidden');testPanel.classList.add('hidden');
    setGrid.querySelectorAll('[data-set]').forEach(b=>b.onclick=()=>prepareSet(b.dataset.set));
    setPanel.scrollIntoView({behavior:'smooth',block:'start'});
  }

  async function prepareSet(id){
    const s=series.find(x=>x.id===id);if(!s)return;
    if(window.MNEPortal?.requireSession){const ok=await window.MNEPortal.requireSession({pendingUrl:`golden-rules-practice.html?set=${encodeURIComponent(id)}`,mustAuthenticate:true});if(!ok)return;}
    activeSet=s;
    history.replaceState(null,'',`golden-rules-practice.html?set=${encodeURIComponent(id)}`);
    window.MNEPortal?.logActivity?.('golden_rules_quiz_open',s.id,s.label,{kind:'golden-rules',topic:s.topic}).catch(()=>{});
    showInstructions(s);
  }

  function showInstructions(s){
    document.querySelector('.topic-instruction-overlay')?.remove();
    const total=s.questions?.length||0,marks=fmt(totalMarks(s));
    const o=document.createElement('div');o.className='topic-instruction-overlay';
    o.innerHTML=`<div class="topic-instruction-card" role="dialog" aria-modal="true"><div class="topic-instruction-head"><small>Online Examination Instructions</small><h2>${esc(s.label||s.topic)}</h2></div><div class="topic-instruction-body"><p class="topic-test-facts">Total Questions: ${total} | Total Marks: ${marks} | Time Allowed: ${s.duration||50} Minutes | Correct Answer: +4 Marks | Wrong Answer: −1.33 Marks | Question Type: MCQ | Test Mode: Timed OMR Practice</p><h3>General Instructions</h3><ol class="topic-instruction-list"><li>The question paper will open only after you click <b>START THE TEST</b>.</li><li>The ${s.duration||50}-minute timer will start automatically with Question 1 and will continue without pause.</li><li>Select only one option for each question. Use <b>Save &amp; Next</b> to move ahead.</li><li>Use <b>Skip &amp; Review</b> when you want to revisit a question later.</li><li>The OMR/Question Navigator lets you move directly to any question.</li><li>The test will be submitted automatically when the timer reaches 00:00.</li><li>Correct answers and explanations are available only after submission.</li><li>Your submitted attempt will be saved in your User Dashboard and will also be available to the administrator.</li></ol><div class="topic-instruction-actions"><button class="cancel" type="button">← Back to Sets</button><button class="start" type="button">START THE TEST</button></div></div></div>`;
    document.body.appendChild(o);o.querySelector('.cancel').onclick=()=>o.remove();o.querySelector('.start').onclick=()=>{o.remove();startTest()};
  }

  function ensureTopbar(){
    document.querySelector('.topic-exam-topbar')?.remove();const bar=document.createElement('div');bar.className='topic-exam-topbar';
    bar.innerHTML=`<div class="topic-exam-title"><small>NDA/NA English Online Test</small><strong>${esc(activeSet?.label||'English Grammar Mastery Challenge')}</strong></div><div class="topic-exam-status"><div class="topic-exam-metric"><span>Question</span><strong id="topicTopQuestion">Q1 / ${activeSet?.questions?.length||0}</strong></div><div class="topic-exam-metric"><span>Time Left</span><strong id="topicTopTimer">${String(activeSet?.duration||50).padStart(2,"0")}:00</strong></div><button class="topic-exam-omr-toggle" type="button">OMR</button><button class="topic-exam-submit" type="button">SUBMIT TEST</button></div>`;
    testPanel.prepend(bar);bar.querySelector('.topic-exam-submit').onclick=()=>submitTest(false);bar.querySelector('.topic-exam-omr-toggle').onclick=()=>document.body.classList.toggle('topic-mobile-omr-open');
    if(!document.querySelector('.topic-mobile-omr-close')){const close=document.createElement('button');close.className='topic-mobile-omr-close';close.type='button';close.textContent='Close OMR ×';close.onclick=()=>document.body.classList.remove('topic-mobile-omr-open');document.querySelector('.topic-side')?.prepend(close);}
  }

  function startTest(){
    if(!activeSet)return;index=0;answers={};review=new Set();submitted=false;seconds=(activeSet.duration||50)*60;scoreBox.classList.add('hidden');setPanel.classList.add('hidden');testPanel.classList.remove('hidden');document.body.classList.add('topic-exam-active');document.body.classList.remove('topic-mobile-omr-open');ensureTopbar();renderQuestion();renderOmr();updateTimer();clearInterval(timerId);
    timerId=setInterval(()=>{seconds--;updateTimer();if(seconds<=0){seconds=0;updateTimer();clearInterval(timerId);submitTest(true)}},1000);
  }
  function updateTimer(){const value=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(Math.max(0,seconds%60)).padStart(2,'0')}`;timerEl.textContent=value;const t=document.getElementById('topicTopTimer');if(t)t.textContent=value;}

  function renderQuestion(){
    const q=activeSet?.questions?.[index];if(!q)return;
    const correctIndex=Array.isArray(q.a)?q.a[0]:(q.a??0);
    const result=submitted?`<div class="topic-answer-review"><p><b>Correct Answer:</b> ${String.fromCharCode(97+correctIndex)}. ${esc(q.o?.[correctIndex]||'')}</p><p><b>Explanation:</b> ${esc(q.e||'')}</p></div>`:'';
    questionBox.innerHTML=`${q.c?`<div class="topic-directions">${esc(q.c).replace(/^Directions?:\s*/i,'')}</div>`:''}<h3>Q${q.n||index+1}. ${esc(q.q).replace(/\n/g,'<br>')}</h3><div class="topic-options">${(q.o||[]).map((op,i)=>`<label class="topic-option"><input type="radio" name="topicAnswer" value="${i}" ${answers[index]===i?'checked':''} ${submitted?'disabled':''}><span><b>${String.fromCharCode(97+i)}.</b> ${esc(op)}</span></label>`).join('')}</div>${result}`;
    questionBox.querySelectorAll('input[name="topicAnswer"]').forEach(r=>r.onchange=()=>{answers[index]=Number(r.value);renderOmr()});btnPrev.disabled=index===0;btnNext.textContent=index>=activeSet.questions.length-1?'Review OMR':'Save & Next';btnClear.disabled=submitted;btnReview.disabled=submitted;btnReview.textContent=review.has(index)?'Review Marked — Next':'Skip & Review';const tq=document.getElementById('topicTopQuestion');if(tq)tq.textContent=`Q${q.n||index+1} / ${activeSet.questions.length}`;
  }

  function isCorrect(q,value){const accepted=Array.isArray(q.a)?q.a:[q.a];return accepted.includes(value);}
  function renderOmr(){
    omr.innerHTML=activeSet.questions.map((q,i)=>{let state=answers[i]!==undefined?'answered ':'';if(review.has(i))state+='review ';if(i===index)state+='current ';if(submitted){state='';if(answers[i]===undefined)state='unattempted ';else if(isCorrect(q,answers[i]))state='correct ';else state='wrong ';if(i===index)state+='current ';}return `<button type="button" class="topic-bubble ${state}" data-i="${i}">${q.n||i+1}</button>`}).join('');
    omr.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{index=Number(b.dataset.i);renderQuestion();renderOmr();document.body.classList.remove('topic-mobile-omr-open')});
  }
  function move(delta){index=Math.max(0,Math.min(activeSet.questions.length-1,index+delta));renderQuestion();renderOmr();}
  function resultProfile(){try{return JSON.parse(localStorage.getItem(PROFILE_KEY)||'null')}catch{return null}}
  function printResult(){document.body.classList.add('print-result-only');const clean=()=>document.body.classList.remove('print-result-only');window.addEventListener('afterprint',clean,{once:true});setTimeout(()=>window.print(),60);}

  function saveAttempt(result){
    const profile=resultProfile();if(!profile||!activeSet)return;
    const iso=new Date().toISOString();let attempts=[];try{attempts=JSON.parse(localStorage.getItem(ATTEMPTS_KEY)||'[]')}catch{}
    const localRecord={name:profile.name,userId:profile.userId||profile.studentId||profile.id,studentId:profile.studentId||profile.id,userType:profile.userType||'STUDENT',className:profile.className,school:profile.school,state:profile.state,setId:activeSet.id,setLabel:activeSet.label,setType:'golden-rules',topic:activeSet.topic,date:dateKey(),iso,...result};
    attempts.push(localRecord);localStorage.setItem(ATTEMPTS_KEY,JSON.stringify(attempts.slice(-400)));
    if(window.MNEPortal){
      const key=`${profile.id||profile.studentId||profile.email}|${activeSet.id}|${iso}`;
      const sectionStats={[activeSet.topic]:{total:activeSet.questions.length,correct:result.correct}};
      window.MNEPortal.call('submit_attempt',{paperId:activeSet.id,paperTitle:activeSet.label,paperType:'golden-rules',correct:result.correct,incorrect:result.incorrect,unattempted:result.unattempted,totalQuestions:activeSet.questions.length,score:result.marks,accuracy:result.accuracy,overallPercent:result.overall,durationSeconds:Math.max(0,(activeSet.duration||50)*60-seconds),sectionStats,clientAttemptKey:key},true).catch(err=>console.warn('Topic attempt sync failed',err));
    }
  }

  function submitTest(auto=false){
    if(!activeSet||submitted)return;submitted=true;clearInterval(timerId);let correct=0,wrong=0;
    activeSet.questions.forEach((q,i)=>{if(answers[i]===undefined)return;if(isCorrect(q,answers[i]))correct++;else wrong++;});
    const total=activeSet.questions.length,attempted=correct+wrong,unattempted=total-attempted,accuracy=attempted?correct/attempted*100:0,overall=total?correct/total*100:0,marks=fmt(correct*(activeSet.marksPerCorrect??4)-wrong*(activeSet.negativeMark??1.33)),maxMarks=fmt(totalMarks(activeSet));
    let grade='Needs More Practice';if(overall>=80)grade='Excellent';else if(overall>=65)grade='Very Good';else if(overall>=50)grade='Good';else if(overall>=35)grade='Keep Improving';
    saveAttempt({correct,incorrect:wrong,unattempted,accuracy:Number(accuracy.toFixed(1)),overall:Number(overall.toFixed(1)),marks});
    const p=resultProfile(),userName=esc(p?.name||'Registered User'),userType=String(p?.userType||'STUDENT').toUpperCase(),userRole=esc(userType==='TEACHER'?'Teacher':userType==='OTHER'?'Other User':'Student'),classMeta=userType==='STUDENT'&&p?.className?`<span><b>Class:</b> ${esc(p.className)}</span>`:'',date=esc(new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}));
    document.body.classList.remove('topic-exam-active','topic-mobile-omr-open');document.querySelector('.topic-exam-topbar')?.remove();
    scoreBox.innerHTML=`<div class="print-result-brand"><strong>Mastering NDA/NA English</strong><span>Official Practice Result Sheet</span></div><div class="print-result-meta"><span><b>User:</b> ${userName}</span><span><b>Role:</b> ${userRole}</span>${classMeta}<span><b>Date:</b> ${date}</span></div><div class="score-headline"><div class="score-title"><h3>Scorecard & Result Summary</h3><p>${auto?'Time is over — the test was auto-submitted. ':'Test submitted successfully. '}<b>${esc(activeSet.label)}</b></p></div><div class="score-badge">${grade}</div></div><div class="score-grid"><div class="score-card"><b>${correct}</b><span>Correct</span></div><div class="score-card"><b>${wrong}</b><span>Incorrect</span></div><div class="score-card"><b>${unattempted}</b><span>Unattempted</span></div><div class="score-card"><b>${accuracy.toFixed(1)}%</b><span>Accuracy</span></div><div class="score-card"><b>${overall.toFixed(1)}%</b><span>Overall</span></div><div class="score-card"><b>${marks}</b><span>Marks / ${maxMarks}</span></div></div><div class="section-head" style="margin-top:18px"><div><div class="section-kicker">Topic-wise Performance</div><h2 class="section-title" style="font-size:28px">${esc(activeSet.topic)}</h2></div></div><div class="section-score-grid"><div class="section-score"><strong>${esc(activeSet.topic)}</strong><div class="mini-progress"><span style="width:${overall.toFixed(1)}%"></span></div><small>${correct} / ${total} correct (${overall.toFixed(1)}%)</small></div></div><div class="result-actions"><a class="btn btn-primary" href="dashboard.html">User Dashboard</a><button class="btn btn-outline" type="button" id="printTopicResultBtn">Print Result Sheet</button></div>`;
    scoreBox.classList.remove('hidden');renderQuestion();renderOmr();setTimeout(()=>scoreBox.scrollIntoView({behavior:'smooth',block:'start'}),80);document.getElementById('printTopicResultBtn')?.addEventListener('click',printResult);
  }

  document.getElementById('topicBackToTopics')?.addEventListener('click',()=>{setPanel.classList.add('hidden');history.replaceState(null,'','golden-rules-practice.html');topicGrid.scrollIntoView({behavior:'smooth'});});
  document.getElementById('topicBackToSets')?.addEventListener('click',()=>{clearInterval(timerId);document.body.classList.remove('topic-exam-active','topic-mobile-omr-open');testPanel.classList.add('hidden');setPanel.classList.remove('hidden');});
  btnPrev?.addEventListener('click',()=>move(-1));btnNext?.addEventListener('click',()=>move(1));btnClear?.addEventListener('click',()=>{delete answers[index];renderQuestion();renderOmr()});btnReview?.addEventListener('click',()=>{review.add(index);move(1)});btnSubmit?.addEventListener('click',()=>submitTest(false));
  renderTopics();
  const initialSet=new URLSearchParams(location.search).get('set');if(initialSet&&series.some(s=>s.id===initialSet))prepareSet(initialSet);
})();
