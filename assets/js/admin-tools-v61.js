(function(){
  const SUPABASE_URL='https://qwpmbrysjxqislxnwwlk.supabase.co';
  const PUBLISHABLE_KEY='sb_publishable_8I7FJTA-VPknW5Ex9voH9Q_EkrDphC_';
  const ADMIN_API=SUPABASE_URL+'/functions/v1/admin-portal';
  const sb=window.supabase.createClient(SUPABASE_URL,PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const $=(s,r=document)=>r.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const fmtDate=v=>v?new Date(v).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'}):'—';
  const fmtDuration=s=>{const n=Math.max(0,Number(s||0));const m=Math.floor(n/60),sec=Math.round(n%60);return m?`${m}m ${sec}s`:`${sec}s`};
  const num=(v,d=1)=>Number(v||0).toFixed(d);
  let catalog=[];
  let resultPayload=null;
  let visibleRows=[];

  async function api(action,payload={}){
    const {data:{session}}=await sb.auth.getSession();
    if(!session?.access_token)throw new Error('Please sign in as administrator.');
    const r=await fetch(ADMIN_API,{method:'POST',headers:{'Content-Type':'application/json','apikey':PUBLISHABLE_KEY,'Authorization':'Bearer '+session.access_token},body:JSON.stringify({action,...payload})});
    let data={};try{data=await r.json()}catch{}
    if(!r.ok)throw new Error(data.error||'Unable to complete request.');
    return data;
  }

  function setStatus(msg,type=''){
    const el=$('#adminTestResultStatus'); if(!el)return;
    el.textContent=msg||''; el.className='admin-result-status '+type;
  }

  function identifyExistingSections(dash){
    const cards=[...dash.querySelectorAll(':scope > section.admin-card')];
    for(const card of cards){
      const h=card.querySelector('h2')?.textContent?.trim().toLowerCase()||'';
      if(h.includes('registration & performance')) card.id='adminUsersSection';
      if(h.includes('recent website & user activity')) card.id='adminActivitySection';
    }
  }

  function injectNav(dash){
    if($('#adminToolsNav'))return;
    identifyExistingSections(dash);
    const stats=$('#adminStats');
    if(!stats)return;
    const box=document.createElement('div');
    box.id='adminToolsNav';box.className='admin-tools-nav';
    box.innerHTML='<strong>Quick Admin Access</strong><div class="admin-tools-nav-buttons"><button class="admin-tools-jump" data-jump="adminStats">Overview</button><button class="admin-tools-jump primary" data-jump="adminTestResultsCentre">Test Results</button><button class="admin-tools-jump" data-jump="adminUsersSection">Users</button><button class="admin-tools-jump" data-jump="adminActivitySection">Activity</button></div>';
    stats.insertAdjacentElement('afterend',box);
    box.addEventListener('click',e=>{const b=e.target.closest('[data-jump]');if(!b)return;const el=document.getElementById(b.dataset.jump);el?.scrollIntoView({behavior:'smooth',block:'start'});});
    const oldExport=$('#exportStudentsBtn'); if(oldExport)oldExport.textContent='Export Users CSV';
  }

  function injectResultsCentre(dash){
    if($('#adminTestResultsCentre'))return;
    const nav=$('#adminToolsNav');if(!nav)return;
    const sec=document.createElement('section');
    sec.id='adminTestResultsCentre';sec.className='admin-card admin-results-card';
    sec.innerHTML=`
      <div class="admin-card-head"><div><div class="section-kicker">Combined Result Sheet</div><h2>Test & PYQ Results <span class="admin-tools-badge">CSV Ready</span></h2><p class="admin-results-intro">Choose one test or PYQ and get one combined result sheet of the users who attempted it.</p></div></div>
      <div class="admin-results-controls">
        <label>Test / PYQ<select id="adminTestSelect"><option value="">Loading tests…</option></select></label>
        <label>Which attempt?<select id="adminAttemptMode"><option value="latest">Latest attempt per user</option><option value="best">Best attempt per user</option><option value="first">First attempt per user</option><option value="all">Every attempt</option></select></label>
        <button id="adminLoadResultsBtn" class="btn btn-primary" type="button">Show Results</button>
        <button id="adminExportResultsBtn" class="btn btn-outline" type="button" disabled>Download CSV</button>
      </div>
      <div id="adminTestResultStatus" class="admin-result-status"></div>
      <div id="adminResultSummary" class="admin-result-summary"></div>
      <div id="adminResultFilters" class="admin-result-filters hidden">
        <label>Search<input id="adminResultSearch" type="search" placeholder="Name, email or school"></label>
        <label>Class<select id="adminResultClass"><option value="">All Classes</option></select></label>
        <label>State / UT<select id="adminResultState"><option value="">All States/UTs</option></select></label>
        <button id="adminClearResultFilters" class="btn btn-outline" type="button">Clear</button>
      </div>
      <div class="admin-result-table-wrap"><table class="admin-result-table"><thead><tr><th>Rank</th><th>User</th><th>Class</th><th>School</th><th>Score</th><th>%</th><th>Correct</th><th>Wrong</th><th>Unattempted</th><th>Accuracy</th><th>Time</th><th>Attempted</th></tr></thead><tbody id="adminResultBody"><tr><td colspan="12" class="admin-result-empty">Choose a test or PYQ and click <b>Show Results</b>.</td></tr></tbody></table></div>
      <div class="admin-result-note">Tip: use “Latest attempt per user” for a normal class result sheet. Use “Best attempt” when you want each learner’s best recorded performance.</div>`;
    nav.insertAdjacentElement('afterend',sec);
    $('#adminLoadResultsBtn').addEventListener('click',loadResults);
    $('#adminExportResultsBtn').addEventListener('click',exportCsv);
    $('#adminResultSearch').addEventListener('input',applyFilters);
    $('#adminResultClass').addEventListener('change',applyFilters);
    $('#adminResultState').addEventListener('change',applyFilters);
    $('#adminClearResultFilters').addEventListener('click',()=>{$('#adminResultSearch').value='';$('#adminResultClass').value='';$('#adminResultState').value='';applyFilters();});
  }

  async function loadCatalog(){
    const sel=$('#adminTestSelect');if(!sel)return;
    setStatus('Loading available tests and PYQs…');
    try{
      const d=await api('test_catalog');catalog=d.tests||[];
      sel.innerHTML='<option value="">Select a test or PYQ</option>'+catalog.map(t=>`<option value="${esc(t.paperId)}">${esc(t.paperTitle)} · ${t.participants} user${t.participants===1?'':'s'} · ${t.attempts} attempt${t.attempts===1?'':'s'}</option>`).join('');
      setStatus(catalog.length?`${catalog.length} test/PYQ record${catalog.length===1?'':'s'} available.`:'No test attempts have been recorded yet.','ok');
    }catch(err){sel.innerHTML='<option value="">Unable to load tests</option>';setStatus(err.message,'error');}
  }

  function renderSummary(s){
    const items=[['Participants',s.participants||0],['Attempts',s.totalAttempts||0],['Average Score',num(s.averageScore,2)],['Average %',num(s.averagePercent,1)+'%'],['Average Accuracy',num(s.averageAccuracy,1)+'%'],['Highest %',num(s.highestPercent,1)+'%']];
    $('#adminResultSummary').innerHTML=items.map(([k,v])=>`<div class="admin-result-stat"><strong>${esc(v)}</strong><span>${esc(k)}</span></div>`).join('');
  }

  function fillResultFilters(d){
    $('#adminResultClass').innerHTML='<option value="">All Classes</option>'+(d.filters?.classes||[]).map(x=>`<option>${esc(x)}</option>`).join('');
    $('#adminResultState').innerHTML='<option value="">All States/UTs</option>'+(d.filters?.states||[]).map(x=>`<option>${esc(x)}</option>`).join('');
    $('#adminResultFilters').classList.remove('hidden');
  }

  async function loadResults(){
    const paperId=$('#adminTestSelect')?.value||'';const attemptMode=$('#adminAttemptMode')?.value||'latest';
    if(!paperId){setStatus('Please choose a test or PYQ first.','error');return;}
    const btn=$('#adminLoadResultsBtn');btn.disabled=true;$('#adminExportResultsBtn').disabled=true;setStatus('Preparing combined result sheet…');
    try{
      const d=await api('test_results',{paperId,attemptMode});resultPayload=d;renderSummary(d.summary||{});fillResultFilters(d);visibleRows=d.rows||[];renderRows();$('#adminExportResultsBtn').disabled=!visibleRows.length;setStatus(`${d.paperTitle}: ${d.summary?.participants||0} participant${(d.summary?.participants||0)===1?'':'s'} found.`,'ok');
    }catch(err){resultPayload=null;visibleRows=[];$('#adminResultSummary').innerHTML='';$('#adminResultBody').innerHTML='<tr><td colspan="12" class="admin-result-empty">Unable to load this result sheet.</td></tr>';setStatus(err.message,'error');}
    finally{btn.disabled=false;}
  }

  function applyFilters(){
    if(!resultPayload)return;
    const q=String($('#adminResultSearch')?.value||'').trim().toLowerCase(),cl=$('#adminResultClass')?.value||'',st=$('#adminResultState')?.value||'';
    visibleRows=(resultPayload.rows||[]).filter(r=>{const hay=[r.full_name,r.email,r.school,r.pincode].join(' ').toLowerCase();return(!q||hay.includes(q))&&(!cl||r.class_name===cl)&&(!st||r.state_ut===st)});
    renderRows();$('#adminExportResultsBtn').disabled=!visibleRows.length;setStatus(`${visibleRows.length} row${visibleRows.length===1?'':'s'} shown from ${resultPayload.rows?.length||0}.`,'ok');
  }

  function renderRows(){
    const body=$('#adminResultBody');if(!body)return;
    body.innerHTML=visibleRows.length?visibleRows.map((r,i)=>`<tr><td class="admin-result-rank">${r.rank??(i+1)}</td><td class="admin-result-name"><b>${esc(r.full_name||'User')}</b><small>${esc(r.email||'')}</small></td><td>${esc(r.user_type==='STUDENT'?(r.class_name||'—'):'—')}</td><td>${esc(r.school||'—')}<br><small>${esc(r.state_ut||'')}</small></td><td><b>${num(r.score,2)}</b></td><td>${num(r.overall_percent,1)}%</td><td>${Number(r.correct_count||0)}</td><td>${Number(r.incorrect_count||0)}</td><td>${Number(r.unattempted_count||0)}</td><td>${num(r.accuracy,1)}%</td><td>${fmtDuration(r.duration_seconds)}</td><td>${fmtDate(r.attempted_at)}<br><small>Attempt ${Number(r.attempt_number||1)}</small></td></tr>`).join(''):'<tr><td colspan="12" class="admin-result-empty">No users match the current filters.</td></tr>';
  }

  function csvCell(v){const s=String(v??'');return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;}
  function exportCsv(){
    if(!resultPayload||!visibleRows.length)return;
    const headers=['Rank','Name','Email','User Type','Class','School','State/UT','PIN Code','Test/PYQ','Paper Type','Attempt No','Score','Percentage','Correct','Wrong','Unattempted','Accuracy','Time Seconds','Attempted At'];
    const lines=[headers.join(',')];
    visibleRows.forEach((r,i)=>lines.push([r.rank??(i+1),r.full_name,r.email,r.user_type,r.class_name,r.school,r.state_ut,r.pincode,resultPayload.paperTitle,r.paper_type,r.attempt_number,r.score,r.overall_percent,r.correct_count,r.incorrect_count,r.unattempted_count,r.accuracy,r.duration_seconds,r.attempted_at].map(csvCell).join(',')));
    const blob=new Blob(['\ufeff'+lines.join('\n')],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);const safe=String(resultPayload.paperTitle||'test-results').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').slice(0,80);a.download=`${safe||'test-results'}-${resultPayload.attemptMode||'latest'}.csv`;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1000);setStatus(`CSV exported with ${visibleRows.length} row${visibleRows.length===1?'':'s'}.`,'ok');
  }

  async function ensure(){
    const dash=$('#adminDashboard');if(!dash||dash.classList.contains('hidden'))return;
    injectNav(dash);injectResultsCentre(dash);
    if(!catalog.length)await loadCatalog();
  }

  const observer=new MutationObserver(()=>ensure());observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  window.addEventListener('load',()=>setTimeout(ensure,500));
  setTimeout(ensure,800);
})();
