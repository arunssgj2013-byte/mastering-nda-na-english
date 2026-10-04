(function(){
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const fmtDate=v=>v?new Date(v).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'}):'—';
  const roleLabel=t=>t==='TEACHER'?'Teacher':t==='OTHER'?'Other User':'Student';
  const reattemptHref=(paperId,paperType='')=>String(paperId||'').startsWith('vocab-')?`vocabulary-practice.html?set=${encodeURIComponent(paperId)}`:String(paperType||'').toLowerCase()==='topic'?`topic-practice.html?set=${encodeURIComponent(paperId)}`:`quizzes.html?mode=${encodeURIComponent(paperType||'pyq')}&set=${encodeURIComponent(paperId)}`;
  const attemptAccuracy=a=>Math.max(0,Math.min(100,Number(a?.accuracy||0)));
  const attemptLabel=a=>String(a?.paper_title||a?.paper_id||'Practice').trim();
  const routeInfo=(paperId,paperType='')=>{
    const id=String(paperId||''),type=String(paperType||'').toLowerCase();
    if(id.startsWith('vocab-'))return {label:'Vocabulary Practice',href:reattemptHref(id,type)};
    if(type==='topic')return {label:'Topic-wise Practice',href:reattemptHref(id,type)};
    if(type==='sample')return {label:'Sample Paper Practice',href:reattemptHref(id,type)};
    return {label:'PYQ Practice',href:reattemptHref(id,type||'pyq')};
  };
  function renderProgress(attempts){
    const el=$('progressVisual');if(!el)return;
    const rows=[...attempts].filter(a=>Number.isFinite(Number(a.accuracy))).sort((a,b)=>new Date(a.attempted_at)-new Date(b.attempted_at)).slice(-8);
    if(!rows.length){el.innerHTML='<div class="empty-state">Your progress chart will appear after you complete an online test.</div>';return}
    el.innerHTML=rows.map((a,i)=>{const acc=attemptAccuracy(a),short=attemptLabel(a).replace(/previous years?|question|practice|paper/gi,'').trim()||('Attempt '+(i+1));return `<div class="progress-bar-item" title="${esc(attemptLabel(a))}: ${acc.toFixed(1)}%"><span class="progress-bar-value">${acc.toFixed(0)}%</span><span class="progress-bar-track"><i class="progress-bar-fill" style="height:${acc}%"></i></span><span class="progress-bar-label">${esc(short)}</span></div>`}).join('');
  }
  function renderInsights(papers,attempts){
    const el=$('performanceInsights');if(!el)return;
    const valid=(papers||[]).filter(p=>Number.isFinite(Number(p.lastAccuracy)));
    if(!valid.length){el.innerHTML='<div class="empty-state">Performance insights will appear as your attempt history grows.</div>';return}
    const sorted=[...valid].sort((a,b)=>Number(b.lastAccuracy)-Number(a.lastAccuracy));
    const strongest=sorted[0],weakest=sorted[sorted.length-1];
    const items=[`<div class="insight-item strength"><strong>Strongest recorded set</strong><span>${esc(strongest.paperTitle)} — latest accuracy ${Number(strongest.lastAccuracy).toFixed(1)}%</span></div>`];
    if(sorted.length>1&&weakest.paperId!==strongest.paperId)items.push(`<div class="insight-item improve"><strong>Priority revision set</strong><span>${esc(weakest.paperTitle)} — latest accuracy ${Number(weakest.lastAccuracy).toFixed(1)}%. Reattempting this set can give you a useful comparison.</span></div>`);
    const repeated=valid.filter(p=>Number(p.attempts)>1).sort((a,b)=>(Number(b.lastAccuracy)-Number(b.firstAccuracy))-(Number(a.lastAccuracy)-Number(a.firstAccuracy)))[0];
    if(repeated){const change=Number(repeated.lastAccuracy)-Number(repeated.firstAccuracy);items.push(`<div class="insight-item ${change>=0?'strength':'improve'}"><strong>Repeated-attempt trend</strong><span>${esc(repeated.paperTitle)} — ${change>0?'+':''}${change.toFixed(1)} percentage points from first to latest attempt.</span></div>`)}
    el.innerHTML=items.join('');
  }
  function renderRecommendedNext(papers,attempts){
    const el=$('recommendedNext');if(!el)return;
    const valid=(papers||[]).filter(p=>Number.isFinite(Number(p.lastAccuracy)));
    if(valid.length){
      const target=[...valid].sort((a,b)=>Number(a.lastAccuracy)-Number(b.lastAccuracy))[0];
      const route=routeInfo(target.paperId,target.paperType||target.paper_type);
      el.innerHTML=`<div class="next-route"><div><b>Revisit ${esc(target.paperTitle)}</b><small>This is currently your lowest recorded latest accuracy at ${Number(target.lastAccuracy).toFixed(1)}%. The recommendation uses only your saved performance data.</small></div><a class="btn btn-primary" href="${route.href}">Reattempt →</a></div>`;return;
    }
    if(attempts.length){const a=attempts[0],route=routeInfo(a.paper_id,a.paper_type);el.innerHTML=`<div class="next-route"><div><b>Continue with ${esc(route.label)}</b><small>Continue from your most recent recorded practice route.</small></div><a class="btn btn-primary" href="${route.href}">Continue →</a></div>`;return}
    el.innerHTML='<div class="next-route"><div><b>Start with a verified PYQ</b><small>Your dashboard will become more useful after your first recorded attempt.</small></div><a class="btn btn-primary" href="quizzes.html">Start Practice →</a></div>';
  }
  function render(data){
    const p=data.user||data.student||{},s=data.summary||{};
    $('dashboardStudentName').textContent=p.name||'User';
    const meta=[roleLabel(p.userType),p.userType==='STUDENT'&&p.className?`Class ${p.className}`:'',p.state,p.pincode,p.school&&p.school!=='NONE'?p.school:'No school / institution',p.email].filter(Boolean);
    $('dashboardStudentMeta').textContent=meta.join(' • ');
    $('dashAttempts').textContent=s.totalAttempts||0;
    $('dashBestScore').textContent=Number(s.bestScore||0).toFixed(2).replace(/\.00$/,'');
    $('dashAccuracy').textContent=Number(s.averageAccuracy||0).toFixed(1)+'%';
    $('dashGrowth').textContent=(Number(s.growthPoints||0)>0?'+':'')+Number(s.growthPoints||0).toFixed(1)+' pts';
    $('dashPapers').textContent=s.uniquePapers||0;
    const attempts=data.attempts||[];
    renderProgress(attempts);
    renderInsights(data.papers||[],attempts);
    renderRecommendedNext(data.papers||[],attempts);
    $('recentAttemptsTable').innerHTML=attempts.length?attempts.slice(0,15).map(a=>`<div class="attempt-row"><div><b>${esc(a.paper_title)}</b><span>Attempt ${a.attempt_number} • ${fmtDate(a.attempted_at)}</span></div><strong>${a.correct_count}/${a.total_questions}</strong><span>${Number(a.accuracy||0).toFixed(1)}%</span><span>${Number(a.score||0).toFixed(2)} marks</span><a class="mini-action" href="${reattemptHref(a.paper_id,a.paper_type)}">Reattempt</a></div>`).join(''):'<div class="empty-state">No test attempts yet. Complete an online test to start your performance record.</div>';
    const papers=data.papers||[];
    $('paperPerformanceTable').innerHTML=papers.length?papers.sort((a,b)=>new Date(b.lastAttemptAt)-new Date(a.lastAttemptAt)).map(p=>{const change=Number(p.lastAccuracy||0)-Number(p.firstAccuracy||0);return `<div class="performance-row"><div><b>${esc(p.paperTitle)}</b><small>${p.attempts} attempt${p.attempts===1?'':'s'}</small></div><span>First ${Number(p.firstAccuracy||0).toFixed(1)}%</span><span>Latest ${Number(p.lastAccuracy||0).toFixed(1)}%</span><strong class="${change>0?'growth-up':change<0?'growth-down':''}">${change>0?'+':''}${change.toFixed(1)} pts</strong><a class="mini-action" href="${reattemptHref(p.paperId,p.paperType||p.paper_type)}">Reattempt</a></div>`}).join(''):'<div class="empty-state">Paper-wise progress will appear after your first test.</div>';
    const activity=data.activity||[];
    $('activityTable').innerHTML=activity.length?activity.slice(0,20).map(a=>`<div class="activity-row"><span>${esc((a.event_type||'activity').replaceAll('_',' '))}</span><div><b>${esc(a.resource_title||a.resource_id||'Website activity')}</b><small>${fmtDate(a.created_at)}</small></div></div>`).join(''):'<div class="empty-state">Your recent learning activity will appear here.</div>';
  }
  async function load(){
    const panel=$('studentDashboardPanel');if(!window.MNEPortal)return;
    const ok=await window.MNEPortal.requireSession({pendingUrl:location.pathname+location.search,mustAuthenticate:true});if(!ok)return;
    try{const data=await window.MNEPortal.call('dashboard',{},true);render(data);panel?.classList.remove('dashboard-loading')}catch(e){if(panel)panel.innerHTML=`<div class="dashboard-card"><h3>Unable to load performance</h3><p>${esc(e.message)}</p></div>`}
  }
  document.addEventListener('DOMContentLoaded',load);
})();
