/* V80 — Topic Wise Practice Online engine. Existing PYQ/Sample practice is untouched. */
(function(){
  const series=Array.isArray(window.TOPIC_PRACTICE_SERIES)?window.TOPIC_PRACTICE_SERIES:(typeof TOPIC_PRACTICE_SERIES!=='undefined'&&Array.isArray(TOPIC_PRACTICE_SERIES)?TOPIC_PRACTICE_SERIES:[]);
  const topicGrid=document.getElementById('topicPracticeGrid');
  const setPanel=document.getElementById('topicSetPanel');
  const setGrid=document.getElementById('topicSetGrid');
  const setTitle=document.getElementById('topicSetTitle');
  const testPanel=document.getElementById('topicTestPanel');
  const questionBox=document.getElementById('topicQuestionBox');
  const omr=document.getElementById('topicOmr');
  const timerEl=document.getElementById('topicTimer');
  const scoreBox=document.getElementById('topicScoreBox');
  const btnPrev=document.getElementById('topicPrev');
  const btnNext=document.getElementById('topicNext');
  const btnClear=document.getElementById('topicClear');
  const btnReview=document.getElementById('topicReview');
  const btnSubmit=document.getElementById('topicSubmit');
  let activeSet=null,index=0,answers={},review=new Set(),timerId=null,seconds=0,submitted=false;
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const topics=[...new Set(series.map(s=>s.topic).filter(Boolean))];
  function renderTopics(){
    if(!topicGrid)return;
    if(!topics.length){topicGrid.innerHTML='<div class="topic-empty"><strong>Topic-wise practice is ready.</strong><span>Your first practice set will appear here as soon as it is uploaded.</span></div>';return;}
    topicGrid.innerHTML=topics.map((t,i)=>{const sets=series.filter(s=>s.topic===t);return `<button class="topic-card" data-topic="${esc(t)}" type="button"><small>Topic ${String(i+1).padStart(2,'0')}</small><h3>${esc(t)}</h3><p>Choose a practice set and attempt it online.</p><span class="topic-count">${sets.length} Practice Set${sets.length===1?'':'s'}</span></button>`}).join('');
    topicGrid.querySelectorAll('[data-topic]').forEach(b=>b.addEventListener('click',()=>showSets(b.dataset.topic)));
  }
  function showSets(topic){
    const list=series.filter(s=>s.topic===topic);
    setTitle.textContent=topic;
    setGrid.innerHTML=list.map((s,i)=>`<button class="topic-set-card" type="button" data-set="${esc(s.id)}"><span class="topic-set-no">${String(s.setNo||i+1).padStart(2,'0')}</span><div><h3>${esc(s.label||`${topic} — Practice Set ${i+1}`)}</h3><p>${s.questions?.length||0} Questions • ${s.duration||20} Minutes • Online MCQ Practice</p></div><span class="topic-set-go">Attempt →</span></button>`).join('');
    setPanel.classList.remove('hidden');testPanel.classList.add('hidden');
    setGrid.querySelectorAll('[data-set]').forEach(b=>b.addEventListener('click',()=>prepareSet(b.dataset.set)));
    setPanel.scrollIntoView({behavior:'smooth',block:'start'});
  }
  async function prepareSet(id){
    const s=series.find(x=>x.id===id); if(!s)return;
    if(window.MNEPortal?.requireSession){const ok=await window.MNEPortal.requireSession({mustAuthenticate:true});if(!ok)return;}
    activeSet=s;showInstructions(s);
  }
  function showInstructions(s){
    document.querySelector('.topic-instruction-overlay')?.remove();
    const total=s.questions?.length||0,dur=s.duration||20;
    const o=document.createElement('div');o.className='topic-instruction-overlay';o.innerHTML=`<div class="topic-instruction-card"><div class="topic-instruction-head"><small>Topic Wise Practice Online</small><h2>${esc(s.label||s.topic)}</h2></div><div class="topic-instruction-body"><p><b>${total} Questions</b> • <b>${dur} Minutes</b> • One question at a time</p><ul><li>The timer starts when you begin the test.</li><li>Use Save & Next to record your response and continue.</li><li>Use Skip & Review to mark a question for revisiting.</li><li>Correct answers and explanations appear after submission.</li></ul><div class="topic-instruction-actions"><button class="cancel" type="button">Back</button><button class="start" type="button">START PRACTICE</button></div></div></div>`;
    document.body.appendChild(o);o.querySelector('.cancel').onclick=()=>o.remove();o.querySelector('.start').onclick=()=>{o.remove();startTest()};
  }
  function startTest(){
    if(!activeSet)return;index=0;answers={};review=new Set();submitted=false;seconds=(activeSet.duration||20)*60;scoreBox.classList.add('hidden');setPanel.classList.add('hidden');testPanel.classList.remove('hidden');renderQuestion();renderOmr();updateTimer();clearInterval(timerId);timerId=setInterval(()=>{seconds--;updateTimer();if(seconds<=0){clearInterval(timerId);submitTest(true)}},1000);testPanel.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function updateTimer(){timerEl.textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(Math.max(0,seconds%60)).padStart(2,'0')}`}
  function renderQuestion(){
    const q=activeSet?.questions?.[index];if(!q)return;
    questionBox.innerHTML=`${q.c?`<div class="topic-directions">${esc(q.c)}</div>`:''}<h3>Q${q.n||index+1}. ${esc(q.q).replace(/\n/g,'<br>')}</h3><div class="topic-options">${(q.o||[]).map((op,i)=>`<label class="topic-option"><input type="radio" name="topicAnswer" value="${i}" ${answers[index]===i?'checked':''} ${submitted?'disabled':''}><span><b>${String.fromCharCode(97+i)}.</b> ${esc(op)}</span></label>`).join('')}</div>${submitted?`<div class="topic-score" style="margin-top:16px"><p><b>Correct Answer:</b> ${String.fromCharCode(97+(q.a??0))}. ${esc(q.o?.[q.a]||'')}</p><p><b>Explanation:</b> ${esc(q.e||'')}</p></div>`:''}`;
    questionBox.querySelectorAll('input[name="topicAnswer"]').forEach(r=>r.addEventListener('change',()=>{answers[index]=Number(r.value);renderOmr()}));
    btnPrev.disabled=index===0;btnNext.textContent=index>=activeSet.questions.length-1?'Review OMR':'Save & Next';btnClear.disabled=submitted;btnReview.disabled=submitted;btnReview.textContent=review.has(index)?'Review Marked — Next':'Skip & Review';
  }
  function renderOmr(){
    omr.innerHTML=activeSet.questions.map((q,i)=>`<button type="button" class="topic-bubble ${answers[i]!==undefined?'answered ':''}${review.has(i)?'review ':''}${i===index?'current':''}" data-i="${i}">${q.n||i+1}</button>`).join('');
    omr.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{index=Number(b.dataset.i);renderQuestion();renderOmr()});
  }
  function move(delta){index=Math.max(0,Math.min(activeSet.questions.length-1,index+delta));renderQuestion();renderOmr()}
  function submitTest(auto=false){if(!activeSet||submitted)return;submitted=true;clearInterval(timerId);let correct=0,wrong=0;activeSet.questions.forEach((q,i)=>{if(answers[i]===undefined)return;if(answers[i]===q.a)correct++;else wrong++});const attempted=correct+wrong,unattempted=activeSet.questions.length-attempted;const marksPerCorrect=activeSet.marksPerCorrect??1,negative=activeSet.negativeMark??0;const score=correct*marksPerCorrect-wrong*negative;scoreBox.innerHTML=`<h3>${auto?'Time is over — Test Submitted':'Practice Submitted'}</h3><p><b>Score:</b> ${Number(score.toFixed(2))} &nbsp; | &nbsp; <b>Correct:</b> ${correct} &nbsp; | &nbsp; <b>Wrong:</b> ${wrong} &nbsp; | &nbsp; <b>Unattempted:</b> ${unattempted}</p>`;scoreBox.classList.remove('hidden');renderQuestion();renderOmr();scoreBox.scrollIntoView({behavior:'smooth',block:'start'})}
  document.getElementById('topicBackToTopics')?.addEventListener('click',()=>{setPanel.classList.add('hidden');topicGrid.scrollIntoView({behavior:'smooth'})});
  document.getElementById('topicBackToSets')?.addEventListener('click',()=>{clearInterval(timerId);testPanel.classList.add('hidden');setPanel.classList.remove('hidden')});
  btnPrev?.addEventListener('click',()=>move(-1));btnNext?.addEventListener('click',()=>move(1));btnClear?.addEventListener('click',()=>{delete answers[index];renderQuestion();renderOmr()});btnReview?.addEventListener('click',()=>{review.add(index);move(1)});btnSubmit?.addEventListener('click',()=>submitTest(false));
  renderTopics();
})();
