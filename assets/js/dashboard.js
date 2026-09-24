const PROFILE_KEY='mceStudentProfileV2';
const ATTEMPTS_KEY='mceQuizAttempts';
const PENDING_KEY='mnePendingProfileV1';
const getRawProfile=()=>{try{return JSON.parse(localStorage.getItem(PROFILE_KEY)||'null')}catch{return null}};
const validEmail=email=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email||'').trim().toLowerCase());
const isCompleteProfile=p=>!!(p&&p.name&&p.className&&p.state&&validEmail(p.email));
const loginPanel=document.getElementById('studentLoginPanel');
const dashPanel=document.getElementById('studentDashboardPanel');
const form=document.getElementById('studentProfileForm');
const signOut=document.getElementById('signOutStudentBtn');
const errorBox=document.getElementById('registrationError');
const authStatus=document.getElementById('authStatus');
const submitButton=form?.querySelector('button[type="submit"]');
function localDateKey(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function makeStudentId(userId){return userId?`MNE-${userId.replace(/-/g,'').slice(0,8).toUpperCase()}`:'MNE-STUDENT'}
function showMessage(message,type='info'){
  if(!authStatus)return;
  authStatus.textContent=message;authStatus.classList.remove('hidden','success','error');
  if(type==='success')authStatus.classList.add('success');
  if(type==='error')authStatus.classList.add('error');
}
function showError(message){if(errorBox){errorBox.textContent=message;errorBox.classList.remove('hidden')}else showMessage(message,'error')}
function clearError(){if(errorBox){errorBox.classList.add('hidden');errorBox.textContent=''}}
function localAttempts(){try{return JSON.parse(localStorage.getItem(ATTEMPTS_KEY)||'[]')}catch{return []}}
function streakFor(attempts){const dates=[...new Set(attempts.map(a=>a.date||localDateKey(new Date(a.iso||a.attempted_at))))].sort().reverse();if(!dates.length)return 0;let streak=0,cursor=new Date(),set=new Set(dates);while(set.has(localDateKey(cursor))){streak++;cursor.setDate(cursor.getDate()-1)}return streak}
async function cloudAttempts(userId){
  if(!window.mneSupabase||!userId)return null;
  const {data,error}=await window.mneSupabase.from('quiz_attempts').select('id,paper_id,paper_title,paper_type,attempted_at,correct_count,incorrect_count,unattempted_count,total_questions,score,accuracy,duration_seconds').eq('user_id',userId).order('attempted_at',{ascending:false}).limit(200);
  if(error){console.error(error);return null}
  return data.map(a=>({setLabel:a.paper_title,setType:a.paper_type,iso:a.attempted_at,date:localDateKey(new Date(a.attempted_at)),correct:a.correct_count,incorrect:a.incorrect_count,unattempted:a.unattempted_count,marks:Number(a.score),accuracy:Number(a.accuracy),totalQuestions:a.total_questions}));
}
async function renderDashboard(profile,user){
  loginPanel?.classList.add('hidden');dashPanel?.classList.remove('hidden');
  document.getElementById('dashboardStudentName').textContent=profile.name;
  document.getElementById('dashboardStudentMeta').textContent=`${profile.className} • ${profile.state} • ${profile.email}`;
  const cloud=await cloudAttempts(user?.id);const attempts=cloud??localAttempts().filter(a=>a.studentId===profile.studentId);
  const bestCorrect=attempts.length?Math.max(...attempts.map(a=>Number(a.correct||0))):0;
  const bestMarks=attempts.length?Math.max(...attempts.map(a=>Number(a.marks||0))):0;
  const avg=attempts.length?attempts.reduce((s,a)=>s+Number(a.accuracy||0),0)/attempts.length:0;
  document.getElementById('dashAttempts').textContent=attempts.length;
  document.getElementById('dashBestScore').textContent=bestCorrect;
  document.getElementById('dashAccuracy').textContent=avg.toFixed(1)+'%';
  document.getElementById('dashStreak').textContent=streakFor(attempts);
  document.getElementById('dashRank').textContent=bestMarks.toFixed(2).replace(/\.00$/,'');
  const recent=[...attempts].sort((a,b)=>new Date(b.iso)-new Date(a.iso)).slice(0,8);
  document.getElementById('recentAttemptsTable').innerHTML=recent.length?recent.map(a=>`<div class="attempt-row"><div><b>${escapeHtml(a.setLabel)}</b><span>${escapeHtml(a.date)}</span></div><strong>${Number(a.correct||0)}/50</strong><span>${Number(a.accuracy||0).toFixed(1)}%</span><span>${Number(a.marks||0)} marks</span></div>`).join(''):'<div class="empty-state">No attempts yet. Open Online PYQs or Sample Papers and complete your first set.</div>';
  const bestByPaper={};attempts.forEach(a=>{const k=a.setLabel||'Practice Set';if(!bestByPaper[k]||Number(a.marks)>Number(bestByPaper[k].marks))bestByPaper[k]=a});
  const bests=Object.values(bestByPaper).sort((a,b)=>Number(b.marks)-Number(a.marks)).slice(0,10);
  document.getElementById('leaderboardTable').innerHTML=bests.length?bests.map((a,i)=>`<div class="leader-row"><span class="rank-no">${i+1}</span><div><b>${escapeHtml(a.setLabel)}</b><small>${escapeHtml(a.date||'')}</small></div><strong>${Number(a.correct||0)}/50</strong><span>${Number(a.marks||0)}</span></div>`).join(''):'<div class="empty-state">Your personal best scores will appear here after you submit tests.</div>';
}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
async function syncProfile(user){
  if(!user||!window.mneSupabase)return null;
  let pending=null;try{pending=JSON.parse(localStorage.getItem(PENDING_KEY)||'null')}catch{}
  const meta=user.user_metadata||{};
  const desired=pending||{name:meta.name||meta.full_name,className:meta.class_name||meta.className,state:meta.state,email:user.email};
  const {data:existing,error:readError}=await window.mneSupabase.from('student_profiles').select('*').eq('user_id',user.id).maybeSingle();
  if(readError)console.error(readError);
  let row=existing;
  if(desired&&desired.name&&desired.className&&desired.state&&user.email){
    const payload={user_id:user.id,full_name:desired.name,class_name:desired.className,state:desired.state,email:user.email};
    const {data,error}=await window.mneSupabase.from('student_profiles').upsert(payload,{onConflict:'user_id'}).select().single();
    if(!error)row=data;else console.error(error);
  }
  if(!row)return null;
  const profile={name:row.full_name,className:row.class_name,state:row.state,email:row.email,studentId:makeStudentId(user.id),createdAt:row.created_at,userId:user.id,emailVerified:true};
  localStorage.setItem(PROFILE_KEY,JSON.stringify(profile));localStorage.removeItem(PENDING_KEY);
  return profile;
}
async function boot(){
  if(!window.mneSupabase){showError('Secure registration service could not load. Please refresh the page.');return}
  showMessage('Checking secure student session…');
  const {data:{session},error}=await window.mneSupabase.auth.getSession();
  if(error)console.error(error);
  if(!session){
    localStorage.removeItem(PROFILE_KEY);loginPanel?.classList.remove('hidden');dashPanel?.classList.add('hidden');showMessage('Register or sign in with your email. A secure sign-in link will be sent to your inbox.');return;
  }
  const profile=await syncProfile(session.user);
  if(!profile){
    loginPanel?.classList.remove('hidden');dashPanel?.classList.add('hidden');showMessage('Email verified. Please enter your Name, Class and State once to complete your Student Hub profile.','success');
    const emailInput=form?.querySelector('[name="email"]');if(emailInput){emailInput.value=session.user.email||'';emailInput.readOnly=true}
    return;
  }
  showMessage('Email verified • Progress is synced securely across devices.','success');
  await renderDashboard(profile,session.user);
  const params=new URLSearchParams(location.search),ret=params.get('return');
  if((ret==='quizzes.html'||ret==='sample-papers.html')&&!location.hash.includes('stay'))location.href=ret;
}
form?.addEventListener('submit',async e=>{
  e.preventDefault();clearError();
  const data=new FormData(form),name=(data.get('name')||'').trim(),className=(data.get('className')||'').trim(),state=(data.get('state')||'').trim(),email=(data.get('email')||'').trim().toLowerCase();
  if(!name||!className||!state||!validEmail(email)){showError('Please enter Name, Class, State and a valid Email ID. All four fields are compulsory.');return}
  if(!window.mneSupabase){showError('Secure registration service is unavailable. Please refresh and try again.');return}
  submitButton&&(submitButton.disabled=true);submitButton&&(submitButton.textContent='Sending Secure Link…');
  try{
    const {data:{session}}=await window.mneSupabase.auth.getSession();
    if(session){
      localStorage.setItem(PENDING_KEY,JSON.stringify({name,className,state,email}));
      const profile=await syncProfile(session.user);if(profile){showMessage('Profile updated successfully.','success');await renderDashboard(profile,session.user)}
      return;
    }
    localStorage.setItem(PENDING_KEY,JSON.stringify({name,className,state,email}));
    const ret=new URLSearchParams(location.search).get('return');
    const redirect=`${location.origin}/dashboard.html${ret?`?return=${encodeURIComponent(ret)}`:''}`;
    const {error}=await window.mneSupabase.auth.signInWithOtp({email,options:{emailRedirectTo:redirect,shouldCreateUser:true,data:{name,class_name:className,state}}});
    if(error)throw error;
    showMessage(`Secure sign-in link sent to ${email}. Open the email and click the link to verify your address and enter the Student Hub.`,'success');
  }catch(err){console.error(err);showError(err?.message||'Could not send the verification email. Please try again.')}
  finally{submitButton&&(submitButton.disabled=false);submitButton&&(submitButton.textContent='Send Verification Link & Continue')}
});
signOut?.addEventListener('click',async()=>{try{await window.mneSupabase?.auth.signOut()}catch{}localStorage.removeItem(PROFILE_KEY);location.href='dashboard.html'});
window.mneSupabase?.auth.onAuthStateChange((event)=>{if(event==='SIGNED_IN')setTimeout(boot,0)});
boot();
