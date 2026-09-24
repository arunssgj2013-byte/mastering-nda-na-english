const PROFILE_KEY='mceStudentProfileV2';
const ATTEMPTS_KEY='mceQuizAttempts';
const getRawProfile=()=>{try{return JSON.parse(localStorage.getItem(PROFILE_KEY)||'null')}catch{return null}};
const validEmail=email=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email||'').trim().toLowerCase());
const isCompleteProfile=p=>!!(p&&p.name&&p.className&&p.state&&validEmail(p.email));
const getProfile=()=>{const p=getRawProfile();return isCompleteProfile(p)?p:null};
const getAttempts=()=>{try{return JSON.parse(localStorage.getItem(ATTEMPTS_KEY)||'[]')}catch{return []}};
const loginPanel=document.getElementById('studentLoginPanel');
const dashPanel=document.getElementById('studentDashboardPanel');
const form=document.getElementById('studentProfileForm');
const signOut=document.getElementById('signOutStudentBtn');
const errorBox=document.getElementById('registrationError');
function localDateKey(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function makeStudentId(email,name){let s=(email||name||'student').toLowerCase(),h=0;for(let i=0;i<s.length;i++)h=((h<<5)-h)+s.charCodeAt(i),h|=0;return 'MNE-'+Math.abs(h).toString(36).toUpperCase().slice(0,7)}
function streakFor(studentId,attempts){const dates=[...new Set(attempts.filter(a=>a.studentId===studentId).map(a=>a.date))].sort().reverse();if(!dates.length)return 0;let streak=0,cursor=new Date(),set=new Set(dates);while(set.has(localDateKey(cursor))){streak++;cursor.setDate(cursor.getDate()-1)}return streak}
function render(){
 const raw=getRawProfile(), profile=getProfile();
 if(!profile){if(raw)localStorage.removeItem(PROFILE_KEY);loginPanel?.classList.remove('hidden');dashPanel?.classList.add('hidden');return}
 loginPanel?.classList.add('hidden');dashPanel?.classList.remove('hidden');
 document.getElementById('dashboardStudentName').textContent=profile.name;
 document.getElementById('dashboardStudentMeta').textContent=`${profile.className} • ${profile.state} • ${profile.email}`;
 const attempts=getAttempts(),mine=attempts.filter(a=>a.studentId===profile.studentId);
 const best=mine.length?Math.max(...mine.map(a=>a.correct||0)):0;
 const avg=mine.length?mine.reduce((s,a)=>s+(a.accuracy||0),0)/mine.length:0;
 document.getElementById('dashAttempts').textContent=mine.length;
 document.getElementById('dashBestScore').textContent=best;
 document.getElementById('dashAccuracy').textContent=avg.toFixed(1)+'%';
 document.getElementById('dashStreak').textContent=streakFor(profile.studentId,attempts);
 const bestByStudent={};attempts.forEach(a=>{const id=a.studentId||a.name;if(!bestByStudent[id]||a.marks>bestByStudent[id].marks)bestByStudent[id]=a});
 const board=Object.values(bestByStudent).sort((a,b)=>(b.marks||0)-(a.marks||0)||(b.accuracy||0)-(a.accuracy||0));
 const rank=board.findIndex(a=>(a.studentId||a.name)===profile.studentId)+1;document.getElementById('dashRank').textContent=rank?`#${rank}`:'—';
 const recent=[...mine].sort((a,b)=>new Date(b.iso)-new Date(a.iso)).slice(0,8);
 document.getElementById('recentAttemptsTable').innerHTML=recent.length?recent.map(a=>`<div class="attempt-row"><div><b>${a.setLabel}</b><span>${a.date}</span></div><strong>${a.correct}/50</strong><span>${a.accuracy.toFixed(1)}%</span><span>${a.marks} marks</span></div>`).join(''):'<div class="empty-state">No attempts yet. Open Online Practice and complete your first set.</div>';
 document.getElementById('leaderboardTable').innerHTML=board.length?board.slice(0,10).map((a,i)=>`<div class="leader-row ${a.studentId===profile.studentId?'me':''}"><span class="rank-no">${i+1}</span><div><b>${a.name}</b><small>${a.className||'Student'} • ${a.state||''}</small></div><strong>${a.correct}/50</strong><span>${a.marks}</span></div>`).join(''):'<div class="empty-state">Leaderboard will appear after practice submissions on this browser.</div>';
}
form?.addEventListener('submit',e=>{
 e.preventDefault();const data=new FormData(form);
 const name=(data.get('name')||'').trim(),className=(data.get('className')||'').trim(),state=(data.get('state')||'').trim(),email=(data.get('email')||'').trim().toLowerCase();
 if(!name||!className||!state||!validEmail(email)){if(errorBox){errorBox.textContent='Please enter Name, Class, State and a valid Email ID. All four fields are compulsory.';errorBox.classList.remove('hidden')}return}
 if(errorBox){errorBox.classList.add('hidden');errorBox.textContent=''}
 const profile={name,className,state,email,studentId:makeStudentId(email,name),createdAt:new Date().toISOString()};
 localStorage.setItem(PROFILE_KEY,JSON.stringify(profile));
 const params=new URLSearchParams(location.search);const ret=params.get('return');
 if(ret==='quizzes.html'||ret==='quizzes'){location.href='quizzes.html';return}
 render();
});
signOut?.addEventListener('click',()=>{localStorage.removeItem(PROFILE_KEY);render()});
render();