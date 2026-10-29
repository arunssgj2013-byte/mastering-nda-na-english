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
    host.style.cssText='position:fixed;z-index:2147482000;right:16px;bottom:18px;';
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
      '@media(max-width:520px){.launcher{right:12px;bottom:14px;min-height:54px;padding:0 15px}.panel{right:8px;bottom:78px;width:calc(100vw - 16px);height:min(640px,calc(100dvh - 96px));min-height:300px}.bubble{font-size:14px}}@media(prefers-reduced-motion:reduce){.launcher,.dots{animation:none}}@media print{#mneSiteChatRoot{display:none!important}}'+
      '</style>'+
      '<button class="launcher" id="launcher" type="button" aria-label="Open the Mastering NDA AI Study Guide" aria-expanded="false"><span class="spark" aria-hidden="true">✦</span><span>Ask AI</span></button>'+
      '<section class="panel" id="panel" role="dialog" aria-modal="false" aria-labelledby="chatTitle" hidden>'+
      '<header class="top"><div class="brand"><strong id="chatTitle">Mastering NDA Guide</strong><small>AI study assistant</small></div><button class="clear" id="clear" type="button" aria-label="Clear conversation">Clear</button><button class="close" id="close" type="button" aria-label="Close chat">×</button></header>'+
      '<div class="messages" id="messages" role="log" aria-live="polite" aria-relevant="additions text"></div>'+
      '<div class="quick" id="quick"><button class="chip" type="button">Find a practice page</button><button class="chip" type="button">Explain an English topic</button><button class="chip" type="button">How do I practise WAT?</button></div>'+
      '<form class="form" id="form"><textarea class="question" id="question" maxlength="1800" rows="1" aria-label="Type your question" placeholder="Ask about the site or a topic…"></textarea><button class="send" id="send" type="submit">Ask</button></form>'+
      '<div class="note">AI replies may be imperfect. Messages are sent to an AI service; this site logs usage metadata only. Sign-in required · 20 questions per 24 hours. Do not share passwords or private details.</div></section>';
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
    append('assistant','Hello! Ask me about this website, English topics, NDA/NA preparation or SSB practice. Sign in to your free student account to start a chat.');
    function open(){panel.hidden=false;launcher.hidden=true;launcher.setAttribute('aria-expanded','true');question.focus()}
    function close(){panel.hidden=true;launcher.hidden=false;launcher.setAttribute('aria-expanded','false');launcher.focus()}
    launcher.addEventListener('click',open);$('close').addEventListener('click',close);
    $('clear').addEventListener('click',()=>{history.length=0;messages.replaceChildren();append('assistant','Hello! What would you like help with?')});
    root.querySelectorAll('.chip').forEach(chip=>chip.addEventListener('click',()=>{question.value=chip.textContent;form.requestSubmit()}));
    question.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();form.requestSubmit()}});
    root.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden)close()});
    form.addEventListener('submit',async event=>{
      event.preventDefault();const text=question.value.trim();if(!text||send.disabled)return;
      let token='';
      try{token=window.MNEPortal?.token?.()||localStorage.getItem(TOKEN_KEY)||''}catch{}
      append('user',text);question.value='';history.push({role:'user',content:text});
      if(!token){linkBubble();return}
      send.disabled=true;const waiting=append('assistant','Thinking…');
      try{
        const portal=window.MNEPortal,api=portal?.api?portal.api.replace(/student-portal\/?$/,'site-chatbot'):API,key=portal?.apiKey||ANON;
        const response=await fetch(api,{method:'POST',headers:{'Content-Type':'application/json','apikey':key,'Authorization':'Bearer '+key,'x-student-token':token},
          body:JSON.stringify({messages:history.slice(-10),page:location.pathname,title:document.title,description:document.querySelector('meta[name="description"]')?.content||''})});
        let data={};try{data=await response.json()}catch{}
        waiting.remove();
        if(!response.ok){append('assistant',data.error||'I could not answer right now. Please try again.',true);if(response.status===401)linkBubble();return}
        const answer=String(data.answer||'').slice(0,5000);append('assistant',answer||'I could not prepare a reply. Please try a shorter question.');history.push({role:'assistant',content:answer});
      }catch{waiting.remove();append('assistant','Connection problem. Please check your internet and try again.',true)}
      finally{send.disabled=false;question.focus()}
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();