(function(){
  const API='https://qwpmbrysjxqislxnwwlk.supabase.co/functions/v1/student-portal';
  const ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBiYXNlIiwicmVmIjoicXdwbWJyeXNqeHFpc2x4bnd3bGsiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc5MDI3Mjg5NywiZXhwIjoyMTA1ODQ4ODk3fQ.Ag2YF0Ocn1x9z-fr3CSZLr49XmlAmov2Xa2f7nttFRY';
  const TOKEN_KEY='mneStudentSessionV45', PROFILE_KEY='mceStudentProfileV2', VISITOR_KEY='mneVisitorIdV1', PENDING_KEY='mnePendingAccessV50';
  const STATES=['Andaman and Nicobar Islands','Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chandigarh','Chhattisgarh','Dadra and Nagar Haveli and Daman and Diu','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jammu and Kashmir','Jharkhand','Karnataka','Kerala','Ladakh','Lakshadweep','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Puducherry','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal'];
  const CLASSES=['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const token=()=>localStorage.getItem(TOKEN_KEY)||'';
  function visitorId(){let v=localStorage.getItem(VISITOR_KEY);if(!v){v='v_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,12);localStorage.setItem(VISITOR_KEY,v)}return v}
  async function call(action,payload={},withSession=false){
    const headers={'Content-Type':'application/json','apikey':ANON,'Authorization':'Bearer '+ANON};
    if(withSession&&token())headers['x-student-token']=token();
    const r=await fetch(API,{method:'POST',headers,body:JSON.stringify({action,...payload})});
    let data={};try{data=await r.json()}catch{}
    if(!r.ok){const e=new Error(data.error||'Unable to complete request.');e.status=r.status;e.code=data.code;throw e}
    return data;
  }
  function saveSession(data){
    if(data?.session?.token)localStorage.setItem(TOKEN_KEY,data.session.token);
    const u=data?.user||data?.student;
    if(u)localStorage.setItem(PROFILE_KEY,JSON.stringify({...u,studentId:u.id,userId:u.id}));
  }
  function clearSession(){localStorage.removeItem(TOKEN_KEY);localStorage.removeItem(PROFILE_KEY)}
  function profile(){try{return JSON.parse(localStorage.getItem(PROFILE_KEY)||'null')}catch{return null}}
  let lastVisitorCount=0;
  function setVisitorCount(n){lastVisitorCount=Number(n||0);document.querySelectorAll('[data-visitor-count]').forEach(el=>el.textContent=lastVisitorCount.toLocaleString('en-IN'))}
  async function pingVisitor(){try{const d=await call('visitor_ping',{visitorId:visitorId(),page:location.pathname+location.search});setVisitorCount(d.totalVisitors)}catch{}}
  function visitorBadge(){if(document.getElementById('globalVisitorBadge'))return;const d=document.createElement('div');d.id='globalVisitorBadge';d.className='visitor-live-badge';d.innerHTML='<span>Visitors till now</span><strong data-visitor-count>—</strong>';document.body.appendChild(d)}
  function roleLabel(t){return t==='TEACHER'?'Teacher':t==='OTHER'?'Other User':'Student'}

  function setupSearchSelect(root,input,items){
    const menu=root.querySelector('.search-select-menu'),toggle=root.querySelector('.search-select-toggle');
    let activeIndex=-1,visible=[];
    const render=(query='')=>{const q=query.trim().toLowerCase();visible=items.filter(s=>!q||s.toLowerCase().includes(q));menu.innerHTML=visible.length?visible.map((s,i)=>`<button type="button" role="option" data-index="${i}" class="search-select-option">${esc(s)}</button>`).join(''):'<div class="search-select-empty">No matching State/UT</div>';activeIndex=-1};
    const open=()=>{render(input.value);root.classList.add('open');input.setAttribute('aria-expanded','true')};
    const close=()=>{root.classList.remove('open');input.setAttribute('aria-expanded','false');activeIndex=-1};
    const choose=value=>{input.value=value;input.dataset.selected=value;input.dispatchEvent(new Event('change',{bubbles:true}));close()};
    const setActive=idx=>{const opts=[...menu.querySelectorAll('.search-select-option')];if(!opts.length)return;activeIndex=Math.max(0,Math.min(idx,opts.length-1));opts.forEach((o,i)=>o.classList.toggle('active',i===activeIndex));opts[activeIndex]?.scrollIntoView({block:'nearest'})};
    input.addEventListener('focus',open);input.addEventListener('click',open);input.addEventListener('input',()=>{input.dataset.selected='';render(input.value);root.classList.add('open')});
    input.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();if(!root.classList.contains('open'))open();setActive(activeIndex+1)}else if(e.key==='ArrowUp'){e.preventDefault();setActive(activeIndex-1)}else if(e.key==='Enter'&&root.classList.contains('open')&&activeIndex>=0){e.preventDefault();choose(visible[activeIndex])}else if(e.key==='Escape')close()});
    toggle.addEventListener('click',()=>{if(root.classList.contains('open'))close();else{input.focus();open()}});menu.addEventListener('mousedown',e=>{const b=e.target.closest('.search-select-option');if(!b)return;e.preventDefault();choose(visible[Number(b.dataset.index)])});document.addEventListener('pointerdown',e=>{if(!root.contains(e.target))close()});render('');
  }

  function rememberPending(url){if(url)sessionStorage.setItem(PENDING_KEY,url)}
  function pending(){return sessionStorage.getItem(PENDING_KEY)||''}
  function clearPending(){sessionStorage.removeItem(PENDING_KEY)}
  function finishAuthentication(data){
    saveSession(data);document.getElementById('mneAuthGate')?.remove();document.body.classList.remove('auth-modal-open');addTopSignOut();
    const next=pending();clearPending();
    if(next){location.href=next;return}
    document.dispatchEvent(new CustomEvent('mne-authenticated',{detail:{profile:profile()}}));
  }

  function authGate(options={}){
    if(options.pendingUrl)rememberPending(options.pendingUrl);
    const existing=document.getElementById('mneAuthGate');if(existing)return existing;
    const cls=CLASSES.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join('');
    const gate=document.createElement('div');gate.id='mneAuthGate';gate.className='auth-gate access-auth-gate';
    gate.innerHTML=`<div class="auth-shell"><button class="auth-close" type="button" aria-label="Close registration and continue browsing">×</button><div class="auth-brand"><img src="assets/images/mce-logo.png" alt="Mastering NDA/NA English"><div><b>Mastering NDA/NA English</b><span>User Registration, User Login &amp; Admin Access</span></div></div><div class="auth-visitor"><span>Visitors till now</span><strong data-visitor-count>—</strong></div><div class="access-gate-notice"><b>Free browsing is open to everyone.</b><span>Registration or login is required only when you open downloadable study material, start an online test, or view your personal User Hub.</span></div><div class="auth-tabs auth-tabs-three"><button class="active" data-auth-tab="register">USER REGISTER</button><button data-auth-tab="login">USER LOGIN</button><button data-auth-tab="admin">ADMIN LOGIN</button></div><section data-auth-panel="register"><h2>User Registration</h2><p>Students, teachers and other learners may register once for access to downloadable PDFs, online tests and personal activity/performance records. No OTP or email verification is used for normal users.</p><form id="mneRegisterForm" class="auth-form"><fieldset class="auth-role-section auth-full"><legend>Registering As</legend><div class="auth-role-grid"><label class="auth-role-option"><input type="radio" name="userType" value="STUDENT" required><span><b>AS STUDENT</b><small>School-going learner or NDA/NA aspirant</small></span></label><label class="auth-role-option"><input type="radio" name="userType" value="TEACHER" required><span><b>AS TEACHER</b><small>Teacher, mentor or educator</small></span></label><label class="auth-role-option"><input type="radio" name="userType" value="OTHER" required><span><b>AS OTHER USER</b><small>Parent, guardian or general learner</small></span></label></div></fieldset><label>Full Name<input name="fullName" required autocomplete="name" maxlength="100"></label><label id="mneClassField" class="hidden">Class<select name="className"><option value="">Select Class</option>${cls}</select></label><label>State / UT<div class="search-select" id="mneStateSelect"><div class="search-select-control"><input name="state" required placeholder="Search or choose State/UT" autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="mneStateMenu"><button class="search-select-toggle" type="button" aria-label="Show all States and Union Territories">⌄</button></div><div class="search-select-menu" id="mneStateMenu" role="listbox"></div></div><small class="field-help">Tap the field to see all options, or type a few letters to search.</small></label><label>PIN Code<input name="pincode" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required placeholder="6-digit PIN"></label><label class="auth-full">School / Institution Name<input name="schoolName" id="mneSchoolName" maxlength="180" required placeholder="School or institution name"></label><label class="auth-check auth-full"><input type="checkbox" name="schoolNone" id="mneSchoolNone"> <span>No school / institution / None</span></label><label class="auth-full">Email Address<input name="email" type="email" required autocomplete="email" placeholder="name@example.com"></label><div class="auth-message auth-full" id="mneRegisterMessage"></div><button class="btn btn-primary auth-full" type="submit">Register as User &amp; Continue</button></form></section><section data-auth-panel="login" class="hidden"><h2>User Login</h2><p>Already registered? Enter the same email address used during registration. If the email has not been registered, use User Register first.</p><form id="mneLoginForm" class="auth-form"><label class="auth-full">Registered User Email<input name="email" type="email" required autocomplete="email" placeholder="name@example.com"></label><div class="auth-message auth-full" id="mneLoginMessage"></div><button class="btn btn-primary auth-full" type="submit">Login as User</button></form></section><section data-auth-panel="admin" class="hidden auth-admin-panel"><div class="auth-admin-lock">🔐</div><h2>Admin Login</h2><p>The administrator dashboard is separate from normal user access and is protected by verified email, password and optional authenticator-based two-step verification.</p><a class="btn btn-primary auth-admin-btn" href="admin.html">Open Secure Admin Login</a><small>User registration is not required for administrator access.</small></section><p class="auth-note">Your email address is used as the normal user account identifier. Because OTP verification is intentionally disabled for normal users, the system validates registration and email format but does not independently prove ownership of the email address. Administrator access uses separate secure authentication.</p></div>`;
    document.body.appendChild(gate);document.body.classList.add('auth-modal-open');if(lastVisitorCount)setVisitorCount(lastVisitorCount);
    setupSearchSelect(gate.querySelector('#mneStateSelect'),gate.querySelector('input[name="state"]'),STATES);
    gate.querySelector('.auth-close')?.addEventListener('click',()=>{gate.remove();document.body.classList.remove('auth-modal-open');const must=!!options.mustAuthenticate;clearPending();if(must&&/dashboard\.html$/i.test(location.pathname))location.href='index.html'});
    gate.querySelectorAll('[data-auth-tab]').forEach(b=>b.addEventListener('click',()=>{gate.querySelectorAll('[data-auth-tab]').forEach(x=>x.classList.toggle('active',x===b));gate.querySelectorAll('[data-auth-panel]').forEach(p=>p.classList.toggle('hidden',p.dataset.authPanel!==b.dataset.authTab))}));
    const none=gate.querySelector('#mneSchoolNone'),school=gate.querySelector('#mneSchoolName');none.addEventListener('change',()=>{school.disabled=none.checked;school.required=!none.checked;if(none.checked)school.value=''});
    const classField=gate.querySelector('#mneClassField'),classSelect=classField.querySelector('select[name="className"]');
    gate.querySelectorAll('input[name="userType"]').forEach(r=>r.addEventListener('change',()=>{const isStudent=r.checked&&r.value==='STUDENT';if(r.checked){classField.classList.toggle('hidden',!isStudent);classSelect.required=isStudent;if(!isStudent)classSelect.value=''}}));
    gate.querySelector('#mneRegisterForm').addEventListener('submit',async e=>{e.preventDefault();const f=new FormData(e.currentTarget),msg=gate.querySelector('#mneRegisterMessage'),btn=e.submitter;msg.textContent='Registering…';msg.className='auth-message auth-full';btn.disabled=true;try{const state=String(f.get('state')||'').trim(),userType=String(f.get('userType')||'').trim();if(!STATES.includes(state))throw new Error('Please select a State/UT from the displayed list.');if(!userType)throw new Error('Please choose whether you are registering as Student, Teacher or Other User.');const d=await call('register',{fullName:f.get('fullName'),userType,className:userType==='STUDENT'?f.get('className'):'',state,pincode:f.get('pincode'),schoolName:f.get('schoolName'),schoolNone:f.get('schoolNone')==='on',email:f.get('email'),visitorId:visitorId()});finishAuthentication(d)}catch(err){msg.textContent=err.message;msg.classList.add('error')}finally{btn.disabled=false}});
    gate.querySelector('#mneLoginForm').addEventListener('submit',async e=>{e.preventDefault();const f=new FormData(e.currentTarget),msg=gate.querySelector('#mneLoginMessage'),btn=e.submitter;msg.textContent='Checking registration…';msg.className='auth-message auth-full';btn.disabled=true;try{const d=await call('login',{email:f.get('email'),visitorId:visitorId()});finishAuthentication(d)}catch(err){msg.textContent=err.message;msg.classList.add('error')}finally{btn.disabled=false}});
    return gate;
  }

  function addTopSignOut(){
    if(document.getElementById('mneNavSignOut'))return;const nav=document.querySelector('.site-header .nav');if(!nav)return;const p=profile();const btn=document.createElement('button');btn.id='mneNavSignOut';btn.className='nav-signout';btn.type='button';btn.textContent='Sign Out';if(p?.name)btn.title=`Sign out ${p.name} (${roleLabel(p.userType)})`;nav.appendChild(btn);btn.addEventListener('click',async()=>{btn.disabled=true;try{await call('logout',{},true)}catch{}clearSession();location.href='index.html'});
  }
  async function requireSession(options={}){
    if(token()){
      try{const d=await call('session',{},true);saveSession(d);addTopSignOut();return true}catch{clearSession()}
    }
    authGate(options);return false;
  }
  async function hydrateSession(){if(!token())return false;try{const d=await call('session',{},true);saveSession(d);addTopSignOut();return true}catch{clearSession();return false}}
  function bindProtectedLinks(){
    document.addEventListener('click',async e=>{
      const a=e.target.closest('a[href]');if(!a)return;
      const href=a.getAttribute('href')||'',pdf=/\.pdf(?:$|[?#])/i.test(href),explicit=a.hasAttribute('data-auth-required'),dashboard=/(?:^|\/)dashboard\.html(?:$|[?#])/i.test(href),quizSet=/quizzes\.html\?[^#]*\bset=/i.test(href);if(!pdf&&!explicit&&!dashboard&&!quizSet)return;
      e.preventDefault();
      const ok=await requireSession({pendingUrl:href});if(!ok)return;
      clearPending();
      if(pdf){const title=(a.textContent||href).trim();call('activity',{eventType:'pdf_open',resourceId:href,resourceTitle:title},true).catch(()=>{})}
      location.href=href;
    });
  }
  window.MNEPortal={call,token,profile,visitorId,saveSession,clearSession,requireSession,showAuthGate:authGate,STATES,CLASSES,api:API,roleLabel,logActivity:(eventType,resourceId='',resourceTitle='',metadata={})=>call('activity',{eventType,resourceId,resourceTitle,metadata},true)};
  document.addEventListener('DOMContentLoaded',async()=>{visitorBadge();pingVisitor();bindProtectedLinks();await hydrateSession()});
})();
