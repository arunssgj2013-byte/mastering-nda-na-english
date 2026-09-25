(function(){
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const fmtDate=v=>v?new Date(v).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'}):'—';
  function render(data){
    const p=data.student||{}, s=data.summary||{};
    $('dashboardStudentName').textContent=p.name||'Student';
    $('dashboardStudentMeta').textContent=[p.className?`Class ${p.className}`:'',p.state,p.pincode,p.school&&p.school!=='NONE'?p.school:'No school',p.email].filter(Boolean).join(' • ');
    $('dashAttempts').textContent=s.totalAttempts||0;
    $('dashBestScore').textContent=Number(s.bestScore||0).toFixed(2).replace(/\.00$/,'');
    $('dashAccuracy').textContent=Number(s.averageAccuracy||0).toFixed(1)+'%';
    $('dashGrowth').textContent=(Number(s.growthPoints||0)>0?'+':'')+Number(s.growthPoints||0).toFixed(1)+' pts';
    $('dashPapers').textContent=s.uniquePapers||0;
    const attempts=data.attempts||[];
    $('recentAttemptsTable').innerHTML=attempts.length?attempts.slice(0,15).map(a=>`<div class="attempt-row"><div><b>${esc(a.paper_title)}</b><span>Attempt ${a.attempt_number} • ${fmtDate(a.attempted_at)}</span></div><strong>${a.correct_count}/${a.total_questions}</strong><span>${Number(a.accuracy||0).toFixed(1)}%</span><span>${Number(a.score||0).toFixed(2)} marks</span><a class="mini-action" href="quizzes.html?mode=${encodeURIComponent(a.paper_type||'pyq')}&set=${encodeURIComponent(a.paper_id)}">Reattempt</a></div>`).join(''):'<div class="empty-state">No test attempts yet. Complete a PYQ set to start your performance record.</div>';
    const papers=data.papers||[];
    $('paperPerformanceTable').innerHTML=papers.length?papers.sort((a,b)=>new Date(b.lastAttemptAt)-new Date(a.lastAttemptAt)).map(p=>{const change=Number(p.lastAccuracy||0)-Number(p.firstAccuracy||0);return `<div class="performance-row"><div><b>${esc(p.paperTitle)}</b><small>${p.attempts} attempt${p.attempts===1?'':'s'}</small></div><span>First ${Number(p.firstAccuracy||0).toFixed(1)}%</span><span>Latest ${Number(p.lastAccuracy||0).toFixed(1)}%</span><strong class="${change>0?'growth-up':change<0?'growth-down':''}">${change>0?'+':''}${change.toFixed(1)} pts</strong><a class="mini-action" href="quizzes.html?set=${encodeURIComponent(p.paperId)}">Reattempt</a></div>`}).join(''):'<div class="empty-state">Paper-wise progress will appear after your first test.</div>';
    const activity=data.activity||[];
    $('activityTable').innerHTML=activity.length?activity.slice(0,20).map(a=>`<div class="activity-row"><span>${esc((a.event_type||'activity').replaceAll('_',' '))}</span><div><b>${esc(a.resource_title||a.resource_id||'Website activity')}</b><small>${fmtDate(a.created_at)}</small></div></div>`).join(''):'<div class="empty-state">Your recent learning activity will appear here.</div>';
  }
  async function load(){
    const panel=$('studentDashboardPanel');
    if(!window.MNEPortal)return;
    try{const data=await window.MNEPortal.call('dashboard',{},true);render(data);panel?.classList.remove('dashboard-loading')}catch(e){if(panel)panel.innerHTML=`<div class="dashboard-card"><h3>Unable to load performance</h3><p>${esc(e.message)}</p></div>`}
  }
  document.addEventListener('DOMContentLoaded',load);
})();
