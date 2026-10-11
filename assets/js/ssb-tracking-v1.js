/* SSB practice: reuse existing student-portal authentication and Admin Hub activity records. */
(function(){
'use strict';
const isHub=/\/ssb-corner\.html$/i.test(location.pathname);
const moduleMap={
'ssb-oir-practice.html':['oir','Officer Intelligence Rating (OIR)'],
'wat-practice.html':['wat','Word Association Test (WAT)'],
'srt-practice.html':['srt','Situation Reaction Test (SRT)'],
'sdt-practice.html':['sdt','Self Description Test (SDT)'],
'tat-practice.html':['tat','Thematic Apperception Test (TAT)'],
'gto-practice.html':['gto','GTO Practice Centre'],
'gto-gd-practice.html':['gto-gd','GTO Group Discussion'],
'gto-gpe-practice.html':['gto-gpe','GTO Group Planning Exercise'],
'gto-lecturette-practice.html':['gto-lecturette','GTO Lecturette'],
'ssb-personal-interview.html':['interview','Personal Interview Practice'],
'ssb-piq-preparation.html':['piq','PIQ Preparation Guide']
};
const path=location.pathname.split('/').pop().toLowerCase();
const moduleInfo=moduleMap[path]||['ssb','SSB Corner Practice'];
let allowed=isHub,booting=null,task=null;
let queueBusy=false;
const queueKey='mneSSBActivityQueueV2';
const getProfile=()=>window.MNEPortal?.profile?.();
const currentId=()=>String(getProfile()?.id||getProfile()?.studentId||'');
function queueRead(){try{const x=JSON.parse(localStorage.getItem(queueKey+':'+currentId())||'[]');return Array.isArray(x)?x:[]}catch{return []}}
function queueWrite(items){try{if(currentId())localStorage.setItem(queueKey+':'+currentId(),JSON.stringify(items.slice(-120)))}catch{}}
function safe(value,max=180){return String(value??'').slice(0,max)}
async function flush(){
 if(queueBusy||!allowed||!window.MNEPortal||!currentId())return;
 queueBusy=true;
 try{
  while(true){
   const list=queueRead();
   if(!list.length)break;
   const next=list[0];
   if(next.studentId!==currentId()){
    queueWrite(list.slice(1));continue;
   }
   if(next.kind==='attempt')await window.MNEPortal.call('submit_attempt',next.payload,true);
   else await window.MNEPortal.logActivity(next.eventType,next.resourceId,next.resourceTitle,next.metadata);
   const latest=queueRead();
   const idx=latest.findIndex(x=>x.queueId===next.queueId);
   if(idx!==-1){latest.splice(idx,1);queueWrite(latest)}
  }
 }catch(e){console.warn('SSB activity will retry next time:',e?.message||e)}
 finally{queueBusy=false}
}
function record(eventType,resourceId,resourceTitle,metadata={}){
 if(!allowed||!window.MNEPortal)return;
 const studentId=currentId();if(!studentId)return;
 const data={eventType:safe(eventType,60),resourceId:safe(resourceId,180),resourceTitle:safe(resourceTitle,220),metadata:{...metadata,section:'SSB Corner',module:moduleInfo[0]},studentId,queueId:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,12)};
 queueWrite([...queueRead(),data]);void flush();
}
function saveAttempt(payload){
 if(!allowed||!window.MNEPortal||!currentId())return;
 if(!payload||!payload.clientAttemptKey||!payload.paperId)return;
 const list=queueRead();
 if(!list.some(x=>x.kind==='attempt'&&x.payload?.clientAttemptKey===payload.clientAttemptKey)){
  queueWrite([...list,{kind:'attempt',studentId:currentId(),payload,queueId:payload.clientAttemptKey}]);
 }
 void flush();
}
function start(id,title,metadata={}){
 if(!allowed)return;
 if(task){end(task.id,task.title,true,{reason:'restarted'})}
 task={id:safe(id||moduleInfo[0]),title:safe(title||moduleInfo[1]),since:Date.now()};
 record('ssb_start',task.id,task.title,metadata);
}
function end(id,title,early=false,metadata={}){
 if(!allowed)return;
 const durationSeconds=task?Math.round((Date.now()-task.since)/1000):null;
 const rid=safe(id||task?.id||moduleInfo[0]);
 const rtitle=safe(title||task?.title||moduleInfo[1]);
 record(early?'ssb_ended_early':'ssb_complete',rid,rtitle,{...metadata,...(durationSeconds!==null?{durationSeconds}:{})});
 task=null;
}
function log(eventType,id,title,metadata={}){
 record(eventType,id||moduleInfo[0],title||moduleInfo[1],metadata);
}
function fail(message){
 document.documentElement.classList.remove('ssb-access-pending');
 const main=document.createElement('div');main.className='ssb-access-error';
 const box=document.createElement('div');const h=document.createElement('h2');h.textContent='Unable to verify SSB practice access';
 const p=document.createElement('p');p.textContent=message;
 const a=document.createElement('a');a.href='ssb-corner.html#procedure';a.textContent='Return to free SSB procedure';
 box.append(h,p,a);main.append(box);document.body.append(main);
}
async function gate({pendingUrl}={}){
 if(!window.MNEPortal){fail('The registration service did not load. Please refresh the page.');return false}
 try{
  const ok=await window.MNEPortal.requireSession({mustAuthenticate:true,pendingUrl:pendingUrl||(location.pathname+location.search+location.hash)});
  if(ok){
   allowed=true;
   document.documentElement.classList.remove('ssb-access-pending');
   void flush();
   return true;
  }
  if(!isHub){
   const panel=document.getElementById('mneAuthGate');
   panel?.querySelector('.access-gate-notice span')?.replaceChildren('SSB practice requires a free registered user login. Procedure and OLQs are available without registration.');
  }
  return false;
 }catch(e){fail('Unable to contact the student login service. Please try again shortly.');return false}
}
function ready(){
 if(isHub)return;
 booting=gate().then(ok=>{
  if(ok){log('ssb_page_open',moduleInfo[0],moduleInfo[1]);}
 });
 document.addEventListener('click',e=>{
  if(!allowed&&e.target.closest?.('#mneAuthGate .auth-close')){
    setTimeout(()=>{if(!allowed)location.href='ssb-corner.html#procedure'},0);
  }
 },true);
}
window.SSBTracker={start,end,log,gate,flush,saveAttempt,get allowed(){return allowed},module:moduleInfo[0],ensure:()=>booting||gate()};
document.addEventListener('DOMContentLoaded',ready);
window.addEventListener('online',()=>{if(allowed)void flush()});
window.addEventListener('pagehide',()=>{if(task&&allowed)end(task.id,task.title,true,{reason:'left_page'});});
})();