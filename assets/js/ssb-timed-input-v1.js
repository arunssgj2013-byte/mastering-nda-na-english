(function(){
'use strict';
const page=location.pathname.split('/').pop();
const testByPage={'wat-practice.html':'WAT','tat-practice.html':'TAT','srt-practice.html':'SRT','ppdt-practice.html':'PPDT'};
const test=testByPage[page];
if(!test||window.SSBTimedResponseCapture)return;
window.SSBTimedResponseCapture=true;
const answers=new Map();
let activeKey='',activePrompt='',mode='typed',field=null,modeSelect=null,promptAdded=false;
function addStyle(){
 const style=document.createElement('style');
 style.textContent=[
 '.ssb-response-mode{margin:12px 0;padding:12px;border:1px solid #c8d8ea;border-radius:10px;background:#f5f9ff}',
 '.ssb-response-mode label{display:block;font-weight:700;margin-bottom:6px}',
 '.ssb-response-mode select{width:100%;max-width:480px;min-height:44px;padding:8px 10px;border:1px solid #9fb5cc;border-radius:8px;font:inherit;color:#18304e;background:white}',
 '.ssb-inline-field{margin:12px 0;padding:12px;border:1px solid #b9cce2;border-radius:10px;background:#f7faff}',
 '.ssb-inline-field label{display:block;font-weight:750;margin-bottom:7px;color:#173e72}',
 '.ssb-inline-field textarea{display:block;box-sizing:border-box;width:100%;min-height:82px;max-height:170px;resize:vertical;padding:11px;border:1px solid #9fb5cc;border-radius:9px;font:16px/1.45 system-ui,-apple-system,Segoe UI,sans-serif;color:#18304e;background:#fff}',
 '.ssb-inline-field textarea:focus{outline:3px solid #2454a5;outline-offset:1px}',
 '.ssb-inline-hint{display:block;margin-top:7px;color:#536a82;font-size:13px;line-height:1.4}',
 '.ssb-paper-hint{margin:10px 0;padding:11px 12px;border-left:4px solid #2454a5;border-radius:0 8px 8px 0;background:#eef4fc;color:#173e72;line-height:1.45}',
 '.ssb-upload-flash{margin:16px 0;padding:16px;border:2px solid #2454a5;border-radius:13px;background:#eef4fc;color:#173e72;box-shadow:0 0 0 0 #2454a533;animation:ssbUploadFlash 1.5s ease-in-out 3}',
 '.ssb-upload-flash strong{display:block;font-size:18px}.ssb-upload-flash p{margin:8px 0;line-height:1.5}',
 '.ssb-upload-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px}',
 '.ssb-upload-action{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:10px 14px;border:0;border-radius:8px;background:#2454a5;color:white!important;text-decoration:none;font:700 14px system-ui,-apple-system,Segoe UI,sans-serif;cursor:pointer}',
 '.ssb-upload-action:disabled{opacity:.55;cursor:not-allowed}.ssb-upload-action.secondary{background:#fff;color:#2454a5!important;border:1px solid #2454a5}',
 '.ssb-upload-flash small{display:block;margin-top:9px;color:#4e657e;line-height:1.45}',
 '@keyframes ssbUploadFlash{0%,100%{box-shadow:0 0 0 0 #2454a500}50%{box-shadow:0 0 0 8px #2454a533}}',
 '@media(prefers-reduced-motion:reduce){.ssb-upload-flash{animation:none}}',
 '@media(max-width:560px){.ssb-inline-field textarea{font-size:16px}.ssb-upload-actions>*{width:100%}}'
 ].join('');
 document.head.appendChild(style);
}
function capture(key,prompt,value){
 const response=String(value||'').trim();
 if(response)answers.set(String(key),{prompt:String(prompt||test+' response'),response});
 else answers.delete(String(key));
}
function selectMode(host){
 const wrap=document.createElement('div');wrap.className='ssb-response-mode';
 const label=document.createElement('label');label.htmlFor='ssbResponseMode';label.textContent='Choose how to answer';
 const select=document.createElement('select');select.id='ssbResponseMode';
 [['typed','Type responses on this page'],['handwritten','Write on paper; upload a photo or PDF after the test']].forEach(([value,labelText])=>{const option=document.createElement('option');option.value=value;option.textContent=labelText;select.appendChild(option)});
 select.addEventListener('change',()=>{mode=select.value;updateInputVisibility()});
 wrap.append(label,select);host.appendChild(wrap);modeSelect=select;
}
function updateInputVisibility(){
 if(!field)return;
 const typed=mode!=='handwritten';
 field.wrap.classList.toggle('hidden',!typed);
 if(field.paper)field.paper.classList.toggle('hidden',typed);
}
function makeField(id,labelText,hintText,paperText){
 const wrap=document.createElement('div');wrap.className='ssb-inline-field';
 const label=document.createElement('label');label.htmlFor=id;label.textContent=labelText;
 const input=document.createElement('textarea');input.id=id;input.maxLength=1800;input.setAttribute('aria-label',labelText);
 input.placeholder='Type your response before the timer moves to the next stimulus…';
 const hint=document.createElement('small');hint.className='ssb-inline-hint';hint.textContent=hintText;
 wrap.append(label,input,hint);
 let paper=null;
 if(paperText){paper=document.createElement('p');paper.className='ssb-paper-hint hidden';paper.textContent=paperText}
 return{wrap,input,paper};
}
function currentCounter(counterId,promptId){
 const counter=document.getElementById(counterId),prompt=document.getElementById(promptId);
 if(!counter||!prompt)return null;
 const text=counter.textContent||'';
 const match=text.match(/(?:word|situation)\s+(\d+)\s+of\s+(\d+)/i);
 if(!match)return null;
 return{key:String(Number(match[1])-1),prompt:(prompt.textContent||'').trim()};
}
function attachTimedList(kind){
 const ready=document.getElementById('ready');
 const panel=document.getElementById(kind==='WAT'?'running':'test');
 const promptId=kind==='WAT'?'word':'scenario';
 const counterId=kind==='WAT'?'count':'counter';
 if(!ready||!panel)return;
 const readyP=ready.querySelector('p');
 if(readyP)readyP.textContent=kind==='WAT'
  ?'Choose typing or handwritten mode. The 15-second word timer advances automatically; it will not wait for an unfinished response.'
  :'Choose typing or handwritten mode. The 30-second situation timer advances automatically; it will not wait for an unfinished response.';
 selectMode(ready);
 field=makeField('ssbInlineResponse',kind==='WAT'?'Type your sentence for this word':'Type your reaction to this situation','The next prompt appears when its timer expires. Your text stays in this browser until you choose to submit it.',kind==='WAT'?'Handwritten mode: write on your numbered answer sheet. The next word still appears on time.':'Handwritten mode: write on your numbered answer sheet. The next situation still appears on time.');
 const host=kind==='WAT'?panel.querySelector('.timer'):document.getElementById(promptId);
 if(host&&host.parentNode)host.parentNode.insertBefore(field.wrap,host.nextSibling);
 if(field.paper&&field.wrap.parentNode)field.wrap.parentNode.insertBefore(field.paper,field.wrap.nextSibling);
 updateInputVisibility();
 field.input.addEventListener('input',()=>{const now=currentCounter(counterId,promptId);if(now)capture(now.key,now.prompt,field.input.value)});
 const promptNode=document.getElementById(promptId),counterNode=document.getElementById(counterId);
 const sync=()=>{
  const now=currentCounter(counterId,promptId);if(!now)return;
  const token=now.key+'|'+now.prompt;
  if(token===activeKey)return;
  const previous=currentCounter(counterId,promptId);
  if(activeKey)capture(activeKey.split('|')[0],activePrompt,field.input.value);
  activeKey=token;activePrompt=now.prompt;
  field.input.value='';
  field.input.setAttribute('aria-label',(kind==='WAT'?'Response for ':'Reaction to ')+now.prompt);
 };
 const observer=new MutationObserver(sync);
 if(promptNode)observer.observe(promptNode,{childList:true,subtree:true,characterData:true});
 if(counterNode)observer.observe(counterNode,{childList:true,subtree:true,characterData:true});
 const start=panel.querySelector(kind==='WAT'?'#begin':'#begin');
 if(start)start.addEventListener('click',()=>{answers.clear();activeKey='';activePrompt='';field.input.value='';},true);
 const end=document.getElementById(kind==='WAT'?'stop':'end');
 if(end)end.addEventListener('click',()=>{const now=currentCounter(counterId,promptId);if(now)capture(now.key,now.prompt,field.input.value)},true);
}
function currentTat(){
 const writing=document.getElementById('writing'),answer=document.getElementById('answer'),num=document.getElementById('pictureNo');
 if(!writing||!answer||writing.classList.contains('hidden'))return null;
 const t=num?.textContent||'',m=t.match(/picture\s+(\d+)/i);
 const index=m?Number(m[1])-1:0;
 return{key:String(index),prompt:'TAT '+t};
}
function attachTat(){
 const paper=document.getElementById('paperMode'),answer=document.getElementById('answer');
 if(paper){paper.checked=false;paper.dispatchEvent(new Event('change',{bubbles:true}));const small=paper.closest('label')?.querySelector('small');if(small)small.textContent='Type each story on this page during its four-minute timer. The next picture appears automatically. Or select handwritten mode and upload after the test.'}
 if(answer){
  answer.addEventListener('input',()=>{const now=currentTat();if(now)capture(now.key,now.prompt,answer.value)});
  const pic=document.getElementById('pictureNo'),observer=new MutationObserver(()=>{const now=currentTat();if(now){const token=now.key+'|'+now.prompt;if(token!==activeKey){activeKey=token;activePrompt=now.prompt}}});
  if(pic)observer.observe(pic,{childList:true,subtree:true,characterData:true});
  const begin=document.getElementById('begin');
  if(begin)begin.addEventListener('click',()=>{answers.clear();activeKey='';activePrompt=''},true);
 }
}
function attachPpdt(){
 const notes=document.getElementById('notes-stage'),story=document.getElementById('story-stage');
 if(notes){
  const area=makeField('ssbPpdtNotes','Type your perception and character notes here','Use the one-minute notes stage. The timer continues to the story stage automatically.','');
  notes.appendChild(area.wrap);
  area.input.addEventListener('input',()=>capture('0-notes','PPDT perception and character notes',area.input.value));
 }
 if(story){
  const area=makeField('ssbPpdtStory','Type your PPDT story here','Use the four-minute story stage. The timed practice proceeds automatically when time ends.','');
  story.appendChild(area.wrap);
  area.input.addEventListener('input',()=>capture('1-story','PPDT story',area.input.value));
 }
 const reset=()=>answers.clear();
 document.querySelectorAll('#test-list button,#new-attempt').forEach(button=>button.addEventListener('click',reset,true));
 const continueButton=document.getElementById('continue');
 if(continueButton){
  const observer=new MutationObserver(()=>{
   const label=document.getElementById('stage-label')?.textContent||'';
   const review=document.getElementById('review'),status=document.getElementById('status')?.textContent||'';
   if(label==='Story time complete'&&status.includes('timed paper-writing stage is complete')&&review?.classList.contains('hidden')&&!continueButton.disabled){
    setTimeout(()=>{if(!review.classList.contains('hidden'))return;continueButton.click()},0);
   }
  });
  observer.observe(document.getElementById('exam')||document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','disabled']});
 }
}
function answerText(){
 return Array.from(answers.values()).map(item=>item.prompt+'\n'+item.response).join('\n\n').slice(0,15000);
}
function visible(el){return !!el&&!el.classList.contains('hidden')&&!el.closest('.hidden')}
function addUploadPrompt(){
 if(promptAdded)return;
 const section={
  WAT:document.getElementById('complete'),
  TAT:document.getElementById('completed'),
  SRT:document.getElementById('done'),
  PPDT:document.getElementById('review')
 }[test];
 if(!visible(section))return;
 promptAdded=true;
 const card=document.createElement('aside');card.className='ssb-upload-flash';card.id='ssbUploadFlash';card.setAttribute('role','status');card.setAttribute('aria-live','polite');
 const strong=document.createElement('strong');strong.textContent='Timed responses complete — upload handwritten answers for AI feedback.';
 const p=document.createElement('p');p.textContent='Typed answers entered on this page are ready to assess. If you wrote on paper, upload a clear photo or PDF of your answer sheet.';
 const actions=document.createElement('div');actions.className='ssb-upload-actions';
 const typedButton=document.createElement('button');typedButton.type='button';typedButton.className='ssb-upload-action';typedButton.textContent='Assess typed responses';
 const typed=answerText();typedButton.disabled=!typed;
 if(!typed)typedButton.textContent='No typed responses captured';
 typedButton.addEventListener('click',()=>{
  const text=answerText();if(!text)return;
  try{sessionStorage.setItem('mneSsbAssessmentDraftV1',JSON.stringify({test_type:test,mode:'typed',typed_answers:text,context:page+' · '+document.title}))}catch{}
  location.href='ssb-ai-assessor.html?test='+test+'&mode=typed';
 });
 const upload=document.createElement('a');upload.className='ssb-upload-action secondary';upload.href='ssb-ai-assessor.html?test='+test+'&mode=handwritten';upload.textContent='Upload handwritten answers';
 actions.append(typedButton,upload);
 const small=document.createElement('small');small.textContent='The assessor gives educational practice feedback, not an official SSB score or selection prediction. Your typed draft is kept only in this browser until you open the assessor.';
 card.append(strong,p,actions,small);section.prepend(card);
}
function watchCompletion(){
 const target={WAT:document.getElementById('complete'),TAT:document.getElementById('completed'),SRT:document.getElementById('done'),PPDT:document.getElementById('review')}[test];
 if(target)new MutationObserver(addUploadPrompt).observe(target,{attributes:true,attributeFilter:['class'],childList:true});
 setInterval(addUploadPrompt,400);
}
addStyle();
if(test==='WAT'||test==='SRT')attachTimedList(test);
if(test==='TAT')attachTat();
if(test==='PPDT')attachPpdt();
watchCompletion();
})();