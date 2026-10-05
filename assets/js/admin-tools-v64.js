(function(){
  const SUPABASE_URL='https://qwpmbrysjxqislxnwwlk.supabase.co';
  const PUBLISHABLE_KEY='sb_publishable_8I7FJTA-VPknW5Ex9voH9Q_EkrDphC_';
  const ADMIN_API=SUPABASE_URL+'/functions/v1/admin-portal';
  const sb=window.supabase.createClient(SUPABASE_URL,PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const fmtDate=v=>v?new Date(v).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'}):'—';
  const fmtDuration=s=>{const n=Math.max(0,Number(s||0));const m=Math.floor(n/60),sec=Math.round(n%60);return m?`${m}m ${sec}s`:`${sec}s`};
  const num=(v,d=1)=>Number(v||0).toFixed(d);

  let catalog=[],catalogLoaded=false,catalogLoading=false,resultPayload=null,visibleRows=[],bound=false;

  async function api(action,payload={}){
    const {data:{session}}=await sb.auth.getSession();
    if(!session?.access_token)throw new Error('Please sign in as administrator.');
    const r=await fetch(ADMIN_API,{method:'POST',headers:{'Content-Type':'application/json','apikey':PUBLISHABLE_KEY,'Authorization':'Bearer '+session.access_token},body:JSON.stringify({action,...payload})});
    let data={};try{data=await r.json()}catch{}
    if(!r.ok)throw new Error(data.error||'Unable to complete request.');
    return data;
  }

  function setStatus(msg,type=''){
    const el=$('#adminTestResultStatus');if(!el)return;
    el.textContent=msg||'';el.className='admin-result-status '+type;
  }

  function switchTab(name,{updateHash=true}={}){
    const valid=['overview','users','results','activity','security'];
    if(!valid.includes(name))name='overview';
    $$('.admin-console-tab').forEach(b=>{
      const active=b.dataset.adminTab===name;
      b.classList.toggle('active',active);
      b.setAttribute('aria-selected',active?'true':'false');
    });
    $$('[data-admin-panel]').forEach(p=>p.classList.toggle('active',p.dataset.adminPanel===name));
    if(updateHash)history.replaceState(null,'',location.pathname+location.search+'#'+name);
    if(name==='results')loadCatalog();
    const panel=$(`[data-admin-panel="${name}"]`);
    if(panel)requestAnimationFrame(()=>panel.scrollIntoView({block:'start'}));
  }

  function bindTabs(){
    $$('.admin-console-tab').forEach(b=>b.addEventListener('click',()=>switchTab(b.dataset.adminTab)));
    const h=location.hash.replace('#','');
    switchTab(['overview','users','results','activity','security'].includes(h)?h:'overview',{updateHash:false});
  }

  function bindQuickUserSearch(){
    const input=$('#adminQuickUserSearch'),btn=$('#adminQuickUserBtn');
    const run=()=>{
      const q=String(input?.value||'').trim();
      switchTab('users');
      const target=$('#adminSearch');
      if(target){target.value=q;target.dispatchEvent(new Event('input',{bubbles:true}));target.focus();}
    };
    btn?.addEventListener('click',run);
    input?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();run();}});
  }

  function bindActivitySearch(){
    const input=$('#adminActivitySearch');
    input?.addEventListener('input',()=>{
      const q=input.value.trim().toLowerCase();
      $$('#adminActivitySection .admin-feed-row').forEach(row=>row.hidden=!!q&&!row.textContent.toLowerCase().includes(q));
    });
  }

  async function loadCatalog(){
    if(catalogLoading||catalogLoaded||!$('#adminTestSelect'))return;
    catalogLoading=true;setStatus('Loading available tests and PYQs…');
    try{
      const d=await api('test_catalog');
      catalog=d.tests||[];catalogLoaded=true;
      $('#adminTestSelect').innerHTML='<option value="">Select a test or practice set</option>'+catalog.map(t=>`<option value="${esc(t.paperId)}">${esc(t.paperTitle)} · ${t.participants} user${t.participants===1?'':'s'} · ${t.attempts} attempt${t.attempts===1?'':'s'}</option>`).join('');
      setStatus(catalog.length?`${catalog.length} test/practice record${catalog.length===1?'':'s'} available.`:'No test attempts have been recorded yet.','ok');
    }catch(err){
      $('#adminTestSelect').innerHTML='<option value="">Unable to load tests</option>';
      setStatus(err.message||'Unable to load tests.','error');
    }finally{catalogLoading=false;}
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
    const paperId=$('#adminTestSelect')?.value||'',attemptMode=$('#adminAttemptMode')?.value||'latest';
    if(!paperId){setStatus('Please choose a test or practice set first.','error');return;}
    const btn=$('#adminLoadResultsBtn'),exp=$('#adminExportResultsBtn'),print=$('#adminPrintResultsBtn');
    if(btn)btn.disabled=true;if(exp)exp.disabled=true;if(print)print.disabled=true;
    setStatus('Preparing result sheet…');
    try{
      const d=await api('test_results',{paperId,attemptMode});
      resultPayload=d;visibleRows=d.rows||[];
      renderSummary(d.summary||{});fillResultFilters(d);renderRows();
      if(exp)exp.disabled=!visibleRows.length;if(print)print.disabled=!visibleRows.length;
      setStatus(`${d.paperTitle}: ${d.summary?.participants||0} participant${(d.summary?.participants||0)===1?'':'s'} found.`,'ok');
    }catch(err){
      resultPayload=null;visibleRows=[];
      $('#adminResultSummary').innerHTML='';
      $('#adminResultBody').innerHTML='<tr><td colspan="13" class="admin-result-empty">Unable to load this result sheet.</td></tr>';
      setStatus(err.message||'Unable to load this result sheet.','error');
    }finally{if(btn)btn.disabled=false;}
  }

  function applyFilters(){
    if(!resultPayload)return;
    const q=String($('#adminResultSearch')?.value||'').trim().toLowerCase(),cl=$('#adminResultClass')?.value||'',st=$('#adminResultState')?.value||'';
    visibleRows=(resultPayload.rows||[]).filter(r=>{const hay=[r.full_name,r.email,r.school,r.pincode].join(' ').toLowerCase();return(!q||hay.includes(q))&&(!cl||r.class_name===cl)&&(!st||r.state_ut===st)});
    renderRows();
    $('#adminExportResultsBtn').disabled=!visibleRows.length;$('#adminPrintResultsBtn').disabled=!visibleRows.length;
    setStatus(`${visibleRows.length} row${visibleRows.length===1?'':'s'} shown from ${resultPayload.rows?.length||0}.`,'ok');
  }

  function renderRows(){
    const body=$('#adminResultBody');if(!body)return;
    body.innerHTML=visibleRows.length?visibleRows.map((r,i)=>`<tr>
      <td class="admin-result-rank">${r.rank??(i+1)}</td>
      <td class="admin-result-name"><b>${esc(r.full_name||'User')}</b><small>${esc(r.email||'')}</small></td>
      <td>${esc(r.user_type==='STUDENT'?(r.class_name||'—'):'—')}</td>
      <td>${esc(r.school||'—')}<br><small>${esc(r.state_ut||'')}</small></td>
      <td><b>${num(r.score,2)}</b></td><td>${num(r.overall_percent,1)}%</td>
      <td>${Number(r.correct_count||0)}</td><td>${Number(r.incorrect_count||0)}</td><td>${Number(r.unattempted_count||0)}</td>
      <td>${num(r.accuracy,1)}%</td><td>${fmtDuration(r.duration_seconds)}</td>
      <td>${fmtDate(r.attempted_at)}<br><small>Attempt ${Number(r.attempt_number||1)}</small></td>
      <td><div class="admin-result-actions"><button class="admin-mini-btn primary" type="button" data-result-sheet="${i}">Result</button><button class="admin-mini-btn" type="button" data-user-email="${esc(r.email||'')}">User</button></div></td>
    </tr>`).join(''):'<tr><td colspan="13" class="admin-result-empty">No users match the current filters.</td></tr>';
    $$('[data-result-sheet]',body).forEach(b=>b.addEventListener('click',()=>{
      const r=visibleRows[Number(b.dataset.resultSheet)];if(!r)return;
      window.MNEAdminCore?.openResultSheet?.({full_name:r.full_name,email:r.email,class_name:r.class_name,school_name:r.school,state_ut:r.state_ut,user_type:r.user_type},{
        ...r,paper_title:resultPayload?.paperTitle||r.paper_title
      });
    }));
    $$('[data-user-email]',body).forEach(b=>b.addEventListener('click',()=>window.MNEAdminCore?.openStudentByEmail?.(b.dataset.userEmail)));
  }

  function csvCell(v){const s=String(v??'');return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;}
  function exportCsv(){
    if(!resultPayload||!visibleRows.length)return;
    const headers=['Rank','Name','Email','User Type','Class','School','State/UT','PIN Code','Test/PYQ','Paper Type','Attempt No','Score','Percentage','Correct','Wrong','Unattempted','Accuracy','Time Seconds','Attempted At'];
    const lines=[headers.join(',')];
    visibleRows.forEach((r,i)=>lines.push([r.rank??(i+1),r.full_name,r.email,r.user_type,r.class_name,r.school,r.state_ut,r.pincode,resultPayload.paperTitle,r.paper_type,r.attempt_number,r.score,r.overall_percent,r.correct_count,r.incorrect_count,r.unattempted_count,r.accuracy,r.duration_seconds,r.attempted_at].map(csvCell).join(',')));
    const blob=new Blob(['\ufeff'+lines.join('\n')],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');
    a.href=URL.createObjectURL(blob);const safe=String(resultPayload.paperTitle||'test-results').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').slice(0,80);
    a.download=`${safe||'test-results'}-${resultPayload.attemptMode||'latest'}.csv`;document.body.appendChild(a);a.click();
    setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1000);setStatus(`CSV exported with ${visibleRows.length} row${visibleRows.length===1?'':'s'}.`,'ok');
  }

  function bindResults(){
    $('#adminLoadResultsBtn')?.addEventListener('click',loadResults);
    $('#adminExportResultsBtn')?.addEventListener('click',exportCsv);
    $('#adminPrintResultsBtn')?.addEventListener('click',()=>{if(visibleRows.length)window.print();});
    $('#adminResultSearch')?.addEventListener('input',applyFilters);
    $('#adminResultClass')?.addEventListener('change',applyFilters);
    $('#adminResultState')?.addEventListener('change',applyFilters);
    $('#adminClearResultFilters')?.addEventListener('click',()=>{
      $('#adminResultSearch').value='';$('#adminResultClass').value='';$('#adminResultState').value='';applyFilters();
    });
  }

  function bind(){
    if(bound)return;bound=true;
    bindTabs();bindQuickUserSearch();bindActivitySearch();bindResults();
    $('#adminOpenUsersBtn')?.addEventListener('click',()=>switchTab('users'));
    $('#adminOpenResultsBtn')?.addEventListener('click',()=>switchTab('results'));
    $('#adminOpenActivityBtn')?.addEventListener('click',()=>switchTab('activity'));
    const oldExport=$('#exportStudentsBtn');if(oldExport)oldExport.textContent='Export Users CSV';
  }

  function ensure(){
    const dash=$('#adminDashboard');if(!dash||dash.classList.contains('hidden'))return;
    bind();
    if(!catalogLoaded&&!catalogLoading)loadCatalog();
  }

  const dash=$('#adminDashboard');
  if(dash){const observer=new MutationObserver(()=>{if(!dash.classList.contains('hidden'))ensure();});observer.observe(dash,{attributes:true,attributeFilter:['class']});}
  window.addEventListener('load',()=>setTimeout(ensure,180));
  setTimeout(ensure,500);
  window.MNEAdminTools={switchTab,loadCatalog,loadResults};
})();