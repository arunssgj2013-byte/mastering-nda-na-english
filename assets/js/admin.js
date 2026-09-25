(function(){
  const SUPABASE_URL='https://qwpmbrysjxqislxnwwlk.supabase.co';
  const PUBLISHABLE_KEY='sb_publishable_8I7FJTA-VPknW5Ex9voH9Q_EkrDphC_';
  const ADMIN_API=SUPABASE_URL+'/functions/v1/admin-portal';
  const APPROVED_ADMIN='masteringndaenglish@gmail.com';
  const sb=window.supabase.createClient(SUPABASE_URL,PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const fmtDate=v=>v?new Date(v).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'}):'—';
  const fmtNum=v=>Number(v||0).toLocaleString('en-IN');
  const pct=v=>Number(v||0).toFixed(1)+'%';
  const mark=(msg,type='')=>{const el=$('#adminStatus');if(!el)return;el.textContent=msg||'';el.className='admin-status '+type};
  const setScreen=id=>$$('[data-admin-screen]').forEach(x=>x.classList.toggle('hidden',x.dataset.adminScreen!==id));
  let dashboardData=null;

  async function api(action,payload={}){
    const {data:{session}}=await sb.auth.getSession();
    if(!session?.access_token)throw Object.assign(new Error('Please sign in as administrator.'),{code:'NO_AUTH'});
    const r=await fetch(ADMIN_API,{method:'POST',headers:{'Content-Type':'application/json','apikey':PUBLISHABLE_KEY,'Authorization':'Bearer '+session.access_token},body:JSON.stringify({action,...payload})});
    let data={};try{data=await r.json()}catch{}
    if(!r.ok){const e=new Error(data.error||'Unable to complete request.');e.status=r.status;e.code=data.code;throw e}
    return data;
  }

  async function signOut(){await sb.auth.signOut();dashboardData=null;setScreen('login');$('#adminLoginForm')?.reset();mark('Signed out.','ok')}

  async function signIn(e){
    e.preventDefault();const f=new FormData(e.currentTarget),email=String(f.get('email')||'').trim().toLowerCase(),password=String(f.get('password')||''),btn=e.submitter;
    mark('Signing in securely…');btn.disabled=true;
    try{
      const {error}=await sb.auth.signInWithPassword({email,password});if(error)throw error;
      await enterAdmin();
    }catch(err){mark(err.message||'Unable to sign in.','error')}finally{btn.disabled=false}
  }

  async function activateAdmin(e){
    e.preventDefault();const f=new FormData(e.currentTarget),email=String(f.get('email')||'').trim().toLowerCase(),password=String(f.get('password')||''),confirm=String(f.get('confirm')||''),btn=e.submitter;
    mark('Creating secure administrator access…');btn.disabled=true;
    try{
      if(email!==APPROVED_ADMIN)throw new Error('This email is not approved for administrator access.');
      if(password.length<10)throw new Error('Use a password of at least 10 characters.');
      if(password!==confirm)throw new Error('The two passwords do not match.');
      const redirectTo=location.origin+location.pathname+'?confirmed=1';
      const {data,error}=await sb.auth.signUp({email,password,options:{emailRedirectTo:redirectTo,data:{role:'admin',display_name:'Arun Kumar'}}});
      if(error)throw error;
      if(data.session){mark('Administrator account is active. Loading dashboard…','ok');await enterAdmin();return}
      mark('Verification email sent. Open the email, confirm your address, then return here and sign in.','ok');
      setScreen('login');$('#adminLoginEmail').value=email;
    }catch(err){const m=String(err.message||'');mark(/already registered|already been registered/i.test(m)?'This admin email already has an account. Use Login or Forgot Password.':m,'error')}finally{btn.disabled=false}
  }

  async function forgotPassword(){
    const email=String($('#adminLoginEmail')?.value||APPROVED_ADMIN).trim().toLowerCase();
    if(email!==APPROVED_ADMIN){mark('Enter the approved administrator email first.','error');return}
    mark('Sending password-reset email…');
    const redirectTo=location.origin+location.pathname+'?recovery=1';
    const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo});
    if(error)mark(error.message,'error');else mark('Password-reset email sent. Check your inbox and follow the secure link.','ok');
  }

  async function updatePassword(e){
    e.preventDefault();const f=new FormData(e.currentTarget),p=String(f.get('password')||''),c=String(f.get('confirm')||''),btn=e.submitter;
    if(p.length<10){mark('Use a password of at least 10 characters.','error');return}if(p!==c){mark('The two passwords do not match.','error');return}
    btn.disabled=true;mark('Updating password…');
    const {error}=await sb.auth.updateUser({password:p});
    btn.disabled=false;if(error){mark(error.message,'error');return}
    history.replaceState({},'',location.pathname);mark('Password updated successfully.','ok');await enterAdmin();
  }

  async function enterAdmin(){
    mark('Verifying administrator access…');
    const {data:{user}}=await sb.auth.getUser();
    if(!user){setScreen('login');return}
    if((user.email||'').toLowerCase()!==APPROVED_ADMIN){await sb.auth.signOut();setScreen('login');mark('This account is not authorised for the administrator dashboard.','error');return}
    try{
      const {data:aal}=await sb.auth.mfa.getAuthenticatorAssuranceLevel();
      if(aal?.currentLevel==='aal1'&&aal?.nextLevel==='aal2'){
        await showMfaChallenge();return;
      }
      await loadDashboard();
    }catch(err){
      if(err.code==='MFA_REQUIRED'){await showMfaChallenge();return}
      if(err.code==='EMAIL_NOT_VERIFIED'){setScreen('login');mark('Please verify the administrator email before signing in.','error');return}
      if(err.code==='NOT_ADMIN'){await sb.auth.signOut();setScreen('login');mark(err.message,'error');return}
      mark(err.message||'Unable to verify administrator access.','error');
    }
  }

  async function showMfaChallenge(){
    const {data,error}=await sb.auth.mfa.listFactors();if(error)throw error;
    const factors=[...(data?.totp||[])].filter(f=>f.status==='verified');
    if(!factors.length){await loadDashboard();return}
    window.__mneMfaFactor=factors[0].id;
    setScreen('mfa');mark('Enter the 6-digit code from your authenticator app.');$('#mfaCode')?.focus();
  }

  async function verifyMfa(e){
    e.preventDefault();const code=String(new FormData(e.currentTarget).get('code')||'').replace(/\D/g,''),btn=e.submitter;if(code.length!==6){mark('Enter the 6-digit authenticator code.','error');return}
    btn.disabled=true;mark('Verifying second factor…');
    const {error}=await sb.auth.mfa.challengeAndVerify({factorId:window.__mneMfaFactor,code});btn.disabled=false;
    if(error){mark(error.message,'error');return}mark('Two-factor verification complete.','ok');await loadDashboard();
  }

  async function beginMfaEnrollment(){
    mark('Preparing two-step verification…');
    const {data,error}=await sb.auth.mfa.enroll({factorType:'totp',friendlyName:'Mastering NDA Admin'});
    if(error){mark(error.message,'error');return}
    window.__mneEnrollFactor=data.id;
    $('#mfaSetupQr').src=data.totp.qr_code;
    $('#mfaSetupSecret').textContent=data.totp.secret;
    $('#mfaSetupBox').classList.remove('hidden');
    $('#mfaSetupCode').focus();
    mark('Scan the QR code with Google Authenticator, Microsoft Authenticator, Authy or a similar app.');
  }

  async function confirmMfaEnrollment(e){
    e.preventDefault();const code=String(new FormData(e.currentTarget).get('code')||'').replace(/\D/g,''),btn=e.submitter;if(code.length!==6){mark('Enter the 6-digit code from the authenticator app.','error');return}
    btn.disabled=true;mark('Confirming two-step verification…');
    const {error}=await sb.auth.mfa.challengeAndVerify({factorId:window.__mneEnrollFactor,code});
    if(error){btn.disabled=false;mark(error.message,'error');return}
    try{await api('set_mfa_requirement');mark('Two-step verification is now required for this administrator account.','ok');$('#mfaSetupBox').classList.add('hidden');await loadDashboard()}catch(err){mark(err.message,'error')}finally{btn.disabled=false}
  }

  function statusLabel(growth){const n=Number(growth||0);return n>2?['Improving','good']:n<-2?['Needs Attention','bad']:['Stable','neutral']}
  function renderSummary(s){
    const cards=[['Total Visitors',s.total_visitors||0],['Total Visits',s.total_visits||0],['Registered Students',s.registeredStudents||0],['Active Students (30d)',s.activeStudents30d||0],['Quiz Attempts',s.totalQuizAttempts||0],['Average Accuracy',pct(s.averageAccuracy||0)]];
    $('#adminStats').innerHTML=cards.map(([k,v])=>`<div class="admin-stat"><strong>${typeof v==='number'?fmtNum(v):v}</strong><span>${esc(k)}</span></div>`).join('');
  }

  function fillFilters(students){
    const cls=[...new Set(students.map(x=>x.class_name).filter(Boolean))].sort();const states=[...new Set(students.map(x=>x.state_ut).filter(Boolean))].sort();
    $('#adminClassFilter').innerHTML='<option value="">All Classes</option>'+cls.map(x=>`<option>${esc(x)}</option>`).join('');
    $('#adminStateFilter').innerHTML='<option value="">All States/UTs</option>'+states.map(x=>`<option>${esc(x)}</option>`).join('');
  }

  function renderStudents(){
    const all=dashboardData?.students||[],q=String($('#adminSearch')?.value||'').trim().toLowerCase(),cl=$('#adminClassFilter')?.value||'',st=$('#adminStateFilter')?.value||'';
    const rows=all.filter(x=>{const hay=[x.full_name,x.email,x.school,x.state_ut,x.pincode].join(' ').toLowerCase();return(!q||hay.includes(q))&&(!cl||x.class_name===cl)&&(!st||x.state_ut===st)});
    $('#adminStudentCountLabel').textContent=`Showing ${rows.length} of ${all.length} students`;
    $('#adminStudentsBody').innerHTML=rows.length?rows.map(x=>{const [label,tone]=statusLabel(x.growth_points);return `<tr><td><b>${esc(x.full_name)}</b><small>${esc(x.email)}</small></td><td>${esc(x.class_name||'—')}</td><td>${esc(x.state_ut||'—')}</td><td>${esc(x.pincode||'—')}</td><td>${esc(x.school||'—')}</td><td>${fmtNum(x.total_attempts)}</td><td>${Number(x.best_score||0).toFixed(2)}</td><td>${pct(x.average_accuracy)}</td><td><span class="perf-pill ${tone}">${esc(label)} ${Number(x.growth_points||0)>0?'+':''}${Number(x.growth_points||0).toFixed(1)} pts</span></td><td>${fmtDate(x.last_activity_at||x.latest_attempt_at||x.last_login_at)}</td><td><button class="table-action" data-student-id="${esc(x.student_id)}">View</button></td></tr>`}).join(''):'<tr><td colspan="11" class="empty-cell">No students match these filters.</td></tr>';
    $$('[data-student-id]',$('#adminStudentsBody')).forEach(b=>b.addEventListener('click',()=>openStudent(b.dataset.studentId)));
  }

  function renderRecent(){
    const logs=dashboardData?.recentLogins||[],acts=dashboardData?.recentActivity||[],atts=dashboardData?.recentAttempts||[];
    $('#recentAdminLogins').innerHTML=logs.slice(0,12).map(x=>`<div class="admin-feed-row"><span>${esc(x.event_type)}</span><div><b>${esc(x.email)}</b><small>${fmtDate(x.created_at)}</small></div></div>`).join('')||'<p class="muted">No login events yet.</p>';
    $('#recentAdminActivity').innerHTML=acts.slice(0,12).map(x=>`<div class="admin-feed-row"><span>${esc(x.event_type)}</span><div><b>${esc(x.full_name||x.email||'Student')}</b><small>${esc(x.resource_title||x.resource_id||'')} · ${fmtDate(x.created_at)}</small></div></div>`).join('')||'<p class="muted">No activity records yet.</p>';
    $('#recentAdminAttempts').innerHTML=atts.slice(0,12).map(x=>`<div class="admin-feed-row"><span>${Number(x.score||0).toFixed(2)}</span><div><b>${esc(x.full_name)} · ${esc(x.paper_title)}</b><small>Attempt ${fmtNum(x.attempt_number)} · ${pct(x.accuracy)} accuracy · ${fmtDate(x.attempted_at)}</small></div></div>`).join('')||'<p class="muted">No quiz attempts yet.</p>';
  }

  async function loadDashboard(){
    setScreen('dashboard');$('#adminDashboard').classList.add('admin-loading');mark('Loading administrator dashboard…');
    try{
      const d=await api('dashboard');dashboardData=d;
      $('#adminIdentity').textContent=d.admin.displayName+' · '+d.admin.email;
      $('#adminMfaState').textContent=d.admin.requireMfa?'2-Step Verification: ON':'2-Step Verification: Optional';
      $('#enableMfaBtn').classList.toggle('hidden',!!d.admin.requireMfa);
      renderSummary(d.summary||{});fillFilters(d.students||[]);renderStudents();renderRecent();
      mark('Dashboard updated.','ok');
    }catch(err){if(err.code==='MFA_REQUIRED'){await showMfaChallenge();return}mark(err.message,'error')}finally{$('#adminDashboard')?.classList.remove('admin-loading')}
  }

  async function openStudent(studentId){
    const modal=$('#studentDetailModal');modal.classList.remove('hidden');$('#studentDetailContent').innerHTML='<div class="admin-detail-loading">Loading student record…</div>';
    try{
      const d=await api('student_detail',{studentId}),s=d.student,attempts=d.attempts||[],logins=d.logins||[],activity=d.activity||[];
      const paperGroups={};attempts.slice().reverse().forEach(a=>{if(!paperGroups[a.paper_id])paperGroups[a.paper_id]=[];paperGroups[a.paper_id].push(a)});
      $('#studentDetailContent').innerHTML=`<div class="student-detail-head"><div><div class="section-kicker">Student Record</div><h2>${esc(s.full_name)}</h2><p>${esc(s.email)}</p></div><button class="modal-close" id="studentModalClose2" aria-label="Close">×</button></div><div class="student-profile-grid"><div><span>Class</span><b>${esc(s.class_name||'—')}</b></div><div><span>State/UT</span><b>${esc(s.state_ut||'—')}</b></div><div><span>PIN Code</span><b>${esc(s.pincode||'—')}</b></div><div><span>School</span><b>${esc(s.school_none?'NONE':(s.school_name||'—'))}</b></div><div><span>Registered</span><b>${fmtDate(s.registered_at)}</b></div><div><span>Last Login</span><b>${fmtDate(s.last_login_at)}</b></div><div><span>Login Count</span><b>${fmtNum(s.login_count)}</b></div></div><div class="admin-detail-section"><h3>Test Attempts (${attempts.length})</h3><div class="detail-table-wrap"><table class="admin-table compact"><thead><tr><th>Paper</th><th>Attempt</th><th>Score</th><th>Accuracy</th><th>Correct</th><th>Wrong</th><th>Left</th><th>Date</th></tr></thead><tbody>${attempts.map(a=>`<tr><td>${esc(a.paper_title)}</td><td>${fmtNum(a.attempt_number)}</td><td>${Number(a.score||0).toFixed(2)}</td><td>${pct(a.accuracy)}</td><td>${fmtNum(a.correct_count)}</td><td>${fmtNum(a.incorrect_count)}</td><td>${fmtNum(a.unattempted_count)}</td><td>${fmtDate(a.attempted_at)}</td></tr>`).join('')||'<tr><td colspan="8">No attempts yet.</td></tr>'}</tbody></table></div></div><div class="admin-detail-columns"><div class="admin-detail-section"><h3>Login History (${logins.length})</h3><div class="admin-feed">${logins.slice(0,50).map(x=>`<div class="admin-feed-row"><span>${esc(x.event_type)}</span><div><b>${esc(x.email)}</b><small>${fmtDate(x.created_at)}</small></div></div>`).join('')||'<p class="muted">No login records.</p>'}</div></div><div class="admin-detail-section"><h3>Learning Activity (${activity.length})</h3><div class="admin-feed">${activity.slice(0,50).map(x=>`<div class="admin-feed-row"><span>${esc(x.event_type)}</span><div><b>${esc(x.resource_title||x.resource_id||'Activity')}</b><small>${fmtDate(x.created_at)}</small></div></div>`).join('')||'<p class="muted">No activity records.</p>'}</div></div></div>`;
      $('#studentModalClose2').addEventListener('click',()=>modal.classList.add('hidden'));
    }catch(err){$('#studentDetailContent').innerHTML=`<p class="admin-error-box">${esc(err.message)}</p>`}
  }

  function exportCsv(){
    const rows=dashboardData?.students||[];if(!rows.length){mark('No student records to export.','error');return}
    const headers=['Name','Email','Class','State/UT','PIN Code','School','Registered At','Last Login','Login Count','Total Attempts','Unique Papers','Average Accuracy','Best Score','First Accuracy','Latest Accuracy','Growth Points','Last Activity'];
    const val=s=>'"'+String(s??'').replace(/"/g,'""')+'"';
    const lines=[headers.map(val).join(',')].concat(rows.map(x=>[x.full_name,x.email,x.class_name,x.state_ut,x.pincode,x.school,x.registered_at,x.last_login_at,x.login_count,x.total_attempts,x.unique_papers_attempted,x.average_accuracy,x.best_score,x.first_accuracy,x.latest_accuracy,x.growth_points,x.last_activity_at].map(val).join(',')));
    const blob=new Blob(['\ufeff'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Mastering-NDA-Student-Performance-'+new Date().toISOString().slice(0,10)+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);mark('Student performance CSV downloaded.','ok');
  }

  function bind(){
    $('#adminLoginForm').addEventListener('submit',signIn);$('#adminActivateForm').addEventListener('submit',activateAdmin);$('#adminRecoveryForm').addEventListener('submit',updatePassword);$('#mfaChallengeForm').addEventListener('submit',verifyMfa);$('#mfaSetupForm').addEventListener('submit',confirmMfaEnrollment);
    $('#forgotPasswordBtn').addEventListener('click',forgotPassword);$('#adminLogoutBtn').addEventListener('click',signOut);$('#adminRefreshBtn').addEventListener('click',loadDashboard);$('#enableMfaBtn').addEventListener('click',beginMfaEnrollment);$('#exportStudentsBtn').addEventListener('click',exportCsv);
    $('#showActivateBtn').addEventListener('click',()=>{setScreen('activate');$('#activateEmail').value=APPROVED_ADMIN;mark('First-time administrator setup requires email verification.')});$('#backToLoginBtn').addEventListener('click',()=>{setScreen('login');mark('')});
    ['#adminSearch','#adminClassFilter','#adminStateFilter'].forEach(sel=>$(sel)?.addEventListener(sel==='#adminSearch'?'input':'change',renderStudents));
    $('#studentDetailModal').addEventListener('click',e=>{if(e.target.id==='studentDetailModal'||e.target.id==='studentModalClose')$('#studentDetailModal').classList.add('hidden')});
  }

  async function init(){
    bind();$('#adminLoginEmail').value=APPROVED_ADMIN;$('#activateEmail').value=APPROVED_ADMIN;
    sb.auth.onAuthStateChange((event)=>{if(event==='PASSWORD_RECOVERY'){setScreen('recovery');mark('Choose a new administrator password.') }});
    if(new URLSearchParams(location.search).get('recovery')==='1'){
      const {data:{session}}=await sb.auth.getSession();if(session){setScreen('recovery');mark('Choose a new administrator password.');return}
    }
    const {data:{session}}=await sb.auth.getSession();
    if(session){await enterAdmin()}else{setScreen('login');if(new URLSearchParams(location.search).get('confirmed')==='1')mark('Email confirmed. Sign in with your administrator password.','ok')}
  }
  document.addEventListener('DOMContentLoaded',init);
})();
