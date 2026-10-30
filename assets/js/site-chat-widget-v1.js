(function(){
  if(window.__MNE_SITE_CHAT_WIDGET__)return;
  window.__MNE_SITE_CHAT_WIDGET__=true;
  const API='https://qwpmbrysjxqislxnwwlk.supabase.co/functions/v1/site-chatbot';
  const ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBiYXNlIiwicmVmIjoicXdwbWJyeXNqeHFpc2x4bnd3bGsiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc5MDI3Mjg5NywiZXhwIjoyMTA1ODQ4ODk3fQ.Ag2YF0Ocn1x9z-fr3CSZLr49XmlAmov2Xa2f7nttFRY';
  const TOKEN_KEY='mneStudentSessionV45';
  function init(){
    if(!document.body||document.getElementById('mneSiteChatRoot'))return;
    const host=document.createElement('div');
    host.id='mneSiteChatRoot';
    host.style.cssText='position:fixed;z-index:2147482000;right:8px;bottom:4px;';
    document.body.appendChild(host);
    const root=host.attachShadow({mode:'open'});
    root.innerHTML='<style>'+
      ':host{all:initial;font-family:Arial,Helvetica,sans-serif;color:#18304e}'+
      '.launcher{position:fixed;right:16px;bottom:18px;z-index:2147482000;border:0;border-radius:999px;background:#123861;color:#fff;min-height:56px;padding:0 18px;display:flex;align-items:center;gap:10px;box-shadow:0 5px 20px #0b224966;cursor:pointer;font:700 15px Arial,sans-serif;animation:chatPulse 2.8s ease-out infinite}'+
      '.launcher:hover{background:#2454a5;transform:translateY(-1px)}.launcher:focus-visible,.close:focus-visible,.send:focus-visible,.clear:focus-visible,.chip:focus-visible{outline:3px solid #f3bd55;outline-offset:3px}'+
      '.spark{font-size:22px;line-height:1}.panel{position:fixed;right:16px;bottom:88px;z-index:2147482000;width:min(380px,calc(100vw - 28px));height:min(590px,calc(100dvh - 118px));min-height:330px;background:#fff;border:1px solid #c7d6e8;border-radius:18px;box-shadow:0 12px 38px #102f5840;display:flex;flex-direction:column;overflow:hidden}'+
      '.panel[hidden]{display:none}.top{padding:14px 16px;background:#123861;color:#fff;display:flex;align-items:center;gap:10px}.brand{flex:1}.brand strong{display:block;font-size:16px}.brand small{display:block;margin-top:3px;font-size:12px;opacity:.85}.clear,.close{border:0;background:transparent;color:white;cursor:pointer;font:600 13px Arial,sans-serif;padding:8px}.close{font-size:20px;line-height:1}'+
      '.messages{flex:1;overflow:auto;padding:14px;background:#f4f7fb;display:flex;flex-direction:column;gap:10px;overscroll-behavior:contain}.bubble{max-width:90%;padding:10px 12px;border-radius:13px;font-size:14px;line-height:1.45;white-space:pre-wrap;overflow-wrap:anywhere}.assistant{align-self:flex-start;background:#fff;border:1px solid #dbe5f0;color:#233c5c;border-top-left-radius:4px}.user{align-self:flex-end;background:#2454a5;color:#fff;border-top-right-radius:4px}.error{border-color:#f0c6bb;background:#fff4f1;color:#803522}.quick{display:flex;flex-wrap:wrap;gap:7px;padding:0 12px 10px;background:#f4f7fb}.chip{border:1px solid #b9cce2;background:white;color:#234d7d;border-radius:999px;padding:7px 10px;font-size:12px;cursor:pointer}'+
      '.form{padding:10px 11px 8px;border-top:1px solid #dbe5f0;background:#fff;display:flex;gap:8px;align-items:flex-end}.question{flex:1;resize:none;min-height:42px;max-height:108px;border:1px solid #b9c9dc;border-radius:10px;padding:10px;font:14px Arial,sans-serif;color:#18304e;box-sizing:border-box}.question:focus{outline:2px solid #2454a5;border-color:#2454a5}.send{border:0;border-radius:10px;background:#2454a5;color:#fff;padding:0 14px;height:42px;font:700 14px Arial,sans-serif;cursor:pointer}.send:disabled{opacity:.55;cursor:wait}.note{font:11px/1.4 Arial,sans-serif;color:#64758a;text-align:center;padding:0 12px 10px;background:white}.note a{color:#2454a5}.dots{animation:dots 1s steps(3,end) infinite}'+
      '@keyframes chatPulse{0%{box-shadow:0 5px 20px #0b224966,0 0 0 0 #2454a566}70%{box-shadow:0 5px 20px #0b224966,0 0 0 12px #2454a500}100%{box-shadow:0 5px 20px #0b224966,0 0 0 0 #2454a500}}@keyframes dots{0%{opacity:.3}50%{opacity:1}100%{opacity:.3}}'+
      '@media(max-width:520px){.launcher{right:8px;bottom:4px;min-height:48px;padding:0 13px;font-size:14px}.panel{right:8px;bottom:68px;width:calc(100vw - 16px);height:min(640px,calc(100dvh - 86px));min-height:300px}.bubble{font-size:14px}}@media(prefers-reduced-motion:reduce){.launcher,.dots{animation:none}}@media print{#mneSiteChatRoot{display:none!important}}'+
      '</style>'+
      '<button class="launcher" id="launcher" type="button" aria-label="Open the Mastering NDA AI Study Guide" aria-expanded="false"><span class="spark" aria-hidden="true">✦</span><span>Study Help</span></button>'+
      '<section class="panel" id="panel" role="dialog" aria-modal="false" aria-labelledby="chatTitle" hidden>'+
      '<header class="top"><div class="brand"><strong id="chatTitle">Mastering NDA Guide</strong><small>Free website study help</small></div><button class="clear" id="clear" type="button" aria-label="Clear conversation">Clear</button><button class="close" id="close" type="button" aria-label="Close chat">×</button></header>'+
      '<div class="messages" id="messages" role="log" aria-live="polite" aria-relevant="additions text"></div>'+
      '<div class="quick" id="quick"><button class="chip" type="button">Find a practice page</button><button class="chip" type="button">Explain an English topic</button><button class="chip" type="button">How do I practise WAT?</button></div>'+
      '<form class="form" id="form"><textarea class="question" id="question" maxlength="1800" rows="1" aria-label="Type your question" placeholder="Ask about the site or a topic…"></textarea><button class="send" id="send" type="submit">Ask</button></form>'+
      '<div class="note">Free automated help using prepared guidance; not a live generative AI service. Do not share private details.</div></section>';
    const $=id=>root.getElementById(id);
    const launcher=$('launcher'),panel=$('panel'),messages=$('messages'),form=$('form'),question=$('question'),send=$('send');
    const history=[];
    function append(role,text,error){
      const bubble=document.createElement('div');bubble.className='bubble '+role+(error?' error':'');bubble.textContent=text;messages.appendChild(bubble);messages.scrollTop=messages.scrollHeight;return bubble;
    }
    function linkBubble(){
      const bubble=document.createElement('div');bubble.className='bubble assistant';
      bubble.appendChild(document.createTextNode('Please sign in or register through the User Hub, then return here to chat. '));
      const link=document.createElement('a');link.href='dashboard.html';link.textContent='Open User Hub';link.style.color='#2454a5';link.style.fontWeight='700';bubble.appendChild(link);
      messages.appendChild(bubble);messages.scrollTop=messages.scrollHeight;
    }
    append('assistant','Hello! I can guide you to website resources, English practice, and SSB preparation. This is a free automated help tool.');
    function open(){panel.hidden=false;launcher.hidden=true;launcher.setAttribute('aria-expanded','true');question.focus()}
    function close(){panel.hidden=true;launcher.hidden=false;launcher.setAttribute('aria-expanded','false');launcher.focus()}
    launcher.addEventListener('click',open);$('close').addEventListener('click',close);
    $('clear').addEventListener('click',()=>{history.length=0;messages.replaceChildren();append('assistant','Hello! What would you like help with?')});
    root.querySelectorAll('.chip').forEach(chip=>chip.addEventListener('click',()=>{question.value=chip.textContent;form.requestSubmit()}));
    question.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();form.requestSubmit()}});
    root.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden)close()});
    function guide(text){
      const q=text.toLowerCase();
      const link=(page,label)=>'Open '+label+': '+page;
      if(/wat|word association/.test(q))return 'For WAT, write a short, constructive sentence for each displayed word within the timer. '+link('wat-practice.html','WAT Practice')+'. You may submit your completed responses for administrator review; individual feedback is not guaranteed.';
      if(/tat|thematic apperception/.test(q))return 'For TAT, observe the picture, identify a realistic situation and write a clear story with constructive action. '+link('tat-practice.html','TAT Practice')+'.';
      if(/srt|situation reaction/.test(q))return 'For SRT, respond briefly and practically to each situation within the time limit. '+link('srt-practice.html','SRT Practice')+'.';
      if(/ppdt|picture perception/.test(q))return 'For PPDT, observe the picture, write a coherent story and practise narration and group discussion. '+link('ppdt-practice.html','PPDT Practice')+'.';
      if(/ssb|interview|lecturette|gpe|group discussion/.test(q))return 'Explore WAT, TAT, SRT, PPDT, interview and GTO practice in '+link('ssb-corner.html','SSB Corner')+'. These are educational practice resources, not official SSB assessments.';
      if(/vocab|synonym|antonym|word bank/.test(q))return 'Build vocabulary using '+link('vocabulary-practice.html','Vocabulary Practice')+' and the vocabulary bank. Revise meanings, synonyms and example sentences daily.';
      if(/grammar|error|tense|preposition|article|voice|narration|subject.verb/.test(q))return 'Use '+link('topic-practice.html','Topic-wise English Practice')+' and '+link('golden-rules-practice.html','Grammar Mastery Challenge')+'. For detailed explanations, consult the relevant grammar rules before attempting timed quizzes.';
      if(/pyq|previous.year|sample paper|mock|quiz|test/.test(q))return 'Try '+link('quizzes.html','PYQs and Quizzes')+' or '+link('topic-practice.html','Topic-wise Practice')+'. Review mistakes after each attempt.';
      if(/login|log in|sign in|register|account|password|dashboard/.test(q))return 'Open '+link('dashboard.html','User Hub')+' to register or sign in. Never share your password or OTP in chat.';
      if(/nda|naval academy|exam|syllabus|preparation/.test(q))return 'Start with '+link('nda-english-preparation.html','NDA/NA English Preparation')+', then practise PYQs and timed quizzes regularly.';
      if(/upload|submit|response|answer sheet/.test(q))return 'After completing WAT, TAT, SRT or PPDT practice, use the Submit Responses option to send typed answers or a PDF/photo for administrator review. Individual feedback is not guaranteed.';
      return 'I provide free prepared guidance rather than live AI-generated answers. Try asking about WAT, TAT, SRT, PPDT, grammar, vocabulary, PYQs, registration or answer submission. For practice resources, open ssb-corner.html or topic-practice.html.';
    }
    form.addEventListener('submit',event=>{
      event.preventDefault();const text=question.value.trim();if(!text)return;
      append('user',text);question.value='';append('assistant',guide(text));question.focus();
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();