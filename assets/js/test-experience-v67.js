/* V67 — CBT-style test methodology layer.
   Intentionally does not edit question banks, options, answer keys or explanations. */
(function(){
  let nativeSetClick=false;
  let pendingSetButton=null;
  let pendingSetId='';
  let pendingSetLabel='Selected NDA/NA English Test';
  let pendingAfterAuth=false;
  let syncTimerId=null;

  // Direct deep links must not expose a loaded paper before the instruction/start stage.
  try{
    const u=new URL(location.href);
    if(u.searchParams.has('set')){
      u.searchParams.delete('set');
      history.replaceState(null,'',u.pathname+(u.search?u.search:'')+(u.hash||''));
    }
  }catch{}

  function instructionOverlay(){
    let overlay=document.getElementById('mceTestInstructions');
    if(overlay)return overlay;
    overlay=document.createElement('div');
    overlay.id='mceTestInstructions';
    overlay.className='mce-test-instructions';
    overlay.innerHTML=`
      <div class="mce-test-instruction-card" role="dialog" aria-modal="true" aria-labelledby="mceInstructionTitle">
        <div class="mce-test-instruction-head">
          <small>Online Examination Instructions</small>
          <h2 id="mceInstructionTitle">${escapeHtml(pendingSetLabel)}</h2>
        </div>
        <div class="mce-test-instruction-body">
          <p class="mce-test-facts">Total Questions: 50 | Total Marks: 200 | Time Allowed: 50 Minutes | Correct Answer: +4 Marks | Wrong Answer: −1.33 Marks | Question Type: MCQ | Test Mode: Timed OMR Practice</p>
          <h3>General Instructions</h3>
          <ol class="mce-test-instruction-list">
            <li>The question paper will open only after you click <b>START THE TEST</b>.</li>
            <li>The 50-minute timer will start automatically with Question 1 and will continue without pause.</li>
            <li>Select only one option for each question. Use <b>Save & Next</b> to move ahead.</li>
            <li>Use <b>Skip & Review</b> when you want to revisit a question later.</li>
            <li>The OMR/Question Navigator lets you move directly to any question.</li>
            <li>The test will be submitted automatically when the timer reaches 00:00.</li>
            <li>Correct answers and explanations are available only after submission.</li>
          </ol>
          <div class="mce-test-start-row">
            <div>
              <button class="mce-test-cancel-btn" type="button" id="mceCancelTestBtn">← Back to Papers</button>
              <div class="mce-test-start-note">Once started, the timer runs continuously to provide a realistic mock-test experience.</div>
            </div>
            <button class="mce-start-test-btn" type="button" id="mceStartTestBtn">START THE TEST</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#mceCancelTestBtn')?.addEventListener('click',()=>{overlay.remove();pendingSetButton=null;pendingSetId='';pendingAfterAuth=false});
    overlay.querySelector('#mceStartTestBtn')?.addEventListener('click',startSelectedTest);
    return overlay;
  }

  function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}

  function showInstructions(){
    const old=document.getElementById('mceTestInstructions');
    if(old)old.remove();
    instructionOverlay();
  }

  async function prepareSelectedTest(btn){
    pendingSetButton=btn;
    pendingSetId=btn?.dataset?.setId||'';
    pendingSetLabel=btn?.querySelector('h3')?.textContent?.trim()||'Selected NDA/NA English Test';
    if(!pendingSetButton||!pendingSetId)return;
    if(window.MNEPortal?.requireSession){
      const ok=await window.MNEPortal.requireSession({mustAuthenticate:true});
      if(!ok){pendingAfterAuth=true;return}
    }
    showInstructions();
  }

  function startSelectedTest(){
    if(!pendingSetButton)return;
    document.getElementById('mceTestInstructions')?.remove();
    document.body.classList.add('mce-test-launching','mce-exam-active');
    document.body.classList.remove('mce-mobile-omr-open');
    ensureExamTopbar();
    nativeSetClick=true;
    try{pendingSetButton.click()}finally{setTimeout(()=>{nativeSetClick=false},0)}
    waitForArenaAndStart();
  }

  function waitForArenaAndStart(){
    let tries=0;
    const poll=setInterval(()=>{
      tries++;
      const arena=document.getElementById('quizArena');
      const startBtn=document.getElementById('startSeriesTimerBtn');
      if(arena&&!arena.classList.contains('hidden')&&startBtn&&!startBtn.disabled){
        clearInterval(poll);
        try{startBtn.click()}catch{}
        document.body.classList.remove('mce-test-launching');
        syncExamBar();
        startExamBarSync();
      }else if(tries>120){
        clearInterval(poll);
        document.body.classList.remove('mce-test-launching','mce-exam-active');
      }
    },50);
  }

  function ensureExamTopbar(){
    const arena=document.getElementById('quizArena');
    const container=arena?.querySelector(':scope > .container');
    if(!container||container.querySelector('.mce-exam-topbar'))return;
    const bar=document.createElement('div');
    bar.className='mce-exam-topbar';
    bar.innerHTML=`
      <div class="mce-exam-title"><small>NDA/NA English Online Test</small><strong id="mceExamSetTitle">${escapeHtml(pendingSetLabel)}</strong></div>
      <div class="mce-exam-status">
        <div class="mce-exam-metric"><span>Question</span><strong id="mceExamQuestion">Q1 / 50</strong></div>
        <div class="mce-exam-metric"><span>Time Left</span><strong id="mceExamTimer">50:00</strong></div>
        <button class="mce-exam-omr-toggle" type="button" id="mceExamOmrToggle">OMR</button>
        <button class="mce-exam-submit" type="button" id="mceExamSubmit">SUBMIT TEST</button>
      </div>`;
    container.prepend(bar);
    bar.querySelector('#mceExamSubmit')?.addEventListener('click',()=>document.getElementById('submitSeriesQuizBtn')?.click());
    bar.querySelector('#mceExamOmrToggle')?.addEventListener('click',()=>document.body.classList.toggle('mce-mobile-omr-open'));
    const omr=document.getElementById('seriesOmrPanel');
    if(omr&&!omr.querySelector('.mce-mobile-omr-close')){
      const close=document.createElement('button');
      close.type='button';
      close.className='mce-mobile-omr-close';
      close.textContent='Close OMR ×';
      close.addEventListener('click',()=>document.body.classList.remove('mce-mobile-omr-open'));
      omr.prepend(close);
    }
  }

  function syncExamBar(){
    const title=document.getElementById('mceExamSetTitle');
    const q=document.getElementById('mceExamQuestion');
    const t=document.getElementById('mceExamTimer');
    if(title)title.textContent=pendingSetLabel;
    if(q)q.textContent=document.getElementById('seriesMobileQuestionDisplay')?.textContent||document.getElementById('seriesOmrCurrentLabel')?.textContent||'Q1 / 50';
    if(t)t.textContent=document.getElementById('seriesMobileTimerDisplay')?.textContent||document.getElementById('seriesTimerDisplay')?.textContent||'50:00';
  }

  function startExamBarSync(){
    clearInterval(syncTimerId);
    syncTimerId=setInterval(()=>{
      if(!document.body.classList.contains('mce-exam-active')){clearInterval(syncTimerId);syncTimerId=null;return}
      syncExamBar();
    },250);
  }

  function exitExamMode(){
    document.body.classList.remove('mce-exam-active','mce-test-launching','mce-mobile-omr-open');
    clearInterval(syncTimerId);syncTimerId=null;
  }

  document.addEventListener('DOMContentLoaded',()=>{
    // Capture test-card clicks before the original quiz listener can render questions.
    document.addEventListener('click',e=>{
      const btn=e.target.closest('.series-set-card[data-set-id]');
      if(!btn||nativeSetClick)return;
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      prepareSelectedTest(btn);
    },true);

    document.addEventListener('mne-authenticated',()=>{
      if(!pendingAfterAuth||!pendingSetButton)return;
      pendingAfterAuth=false;
      showInstructions();
    });

    // Submission/result returns to the normal page layout while preserving the existing result UI.
    const score=document.getElementById('seriesScoreBox');
    if(score){
      new MutationObserver(()=>{
        if(document.body.classList.contains('mce-exam-active')&&!score.classList.contains('hidden')){
          exitExamMode();
          setTimeout(()=>score.scrollIntoView({behavior:'smooth',block:'start'}),80);
        }
      }).observe(score,{attributes:true,attributeFilter:['class']});
    }

    document.getElementById('backToSetLibraryBtn')?.addEventListener('click',exitExamMode);
    window.addEventListener('pagehide',()=>{clearInterval(syncTimerId)});
  });
})();
