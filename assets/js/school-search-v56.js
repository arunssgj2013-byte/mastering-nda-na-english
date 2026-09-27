// V56 India school search for the registration form.
// Uses the read-only school-directory Supabase Edge Function. Manual school entry always remains available.
(function(){
  const API='https://qwpmbrysjxqislxnwwlk.supabase.co/functions/v1/school-directory';
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  let cssAdded=false;
  function addCss(){
    if(cssAdded)return;cssAdded=true;
    const style=document.createElement('style');
    style.textContent=`
      .school-directory-field{position:relative}.school-directory-menu{position:absolute;z-index:10030;left:0;right:0;top:calc(100% + 5px);max-height:290px;overflow:auto;background:#fff;border:1px solid #cbd5e1;border-radius:12px;box-shadow:0 16px 38px rgba(15,23,42,.18);padding:6px;display:none}.school-directory-menu.open{display:block}.school-directory-option{display:block;width:100%;text-align:left;border:0;background:#fff;border-radius:9px;padding:10px 11px;cursor:pointer;color:#0f172a}.school-directory-option:hover,.school-directory-option.active{background:#eff6ff}.school-directory-option strong{display:block;font-size:13px;line-height:1.35}.school-directory-option small{display:block;margin-top:3px;color:#64748b;font-size:11px;line-height:1.35}.school-directory-status{display:block;margin-top:5px;color:#64748b;font-size:11px;line-height:1.35}.school-directory-status.error{color:#b42318}.school-directory-status.ok{color:#166534}.school-directory-badge{display:inline-flex;align-items:center;gap:4px;margin-left:5px;padding:2px 7px;border-radius:999px;background:#ecfdf3;color:#166534;font-size:10px;font-weight:700}.school-district-wrap{position:relative}.school-district-list{position:absolute;z-index:10025;left:0;right:0;top:calc(100% + 5px);max-height:220px;overflow:auto;background:#fff;border:1px solid #cbd5e1;border-radius:10px;box-shadow:0 12px 30px rgba(15,23,42,.15);padding:5px;display:none}.school-district-list.open{display:block}.school-district-list button{display:block;width:100%;border:0;background:#fff;text-align:left;padding:8px 10px;border-radius:7px;cursor:pointer}.school-district-list button:hover{background:#f1f5f9}
    `;
    document.head.appendChild(style);
  }
  async function post(action,payload={}){
    const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...payload})});
    let d={};try{d=await r.json()}catch{}
    if(!r.ok)throw new Error(d.error||'School directory is temporarily unavailable.');
    return d;
  }
  function enhance(gate){
    if(!gate||gate.dataset.schoolDirectoryReady==='1')return;
    const form=gate.querySelector('#mneRegisterForm');
    const state=form?.querySelector('input[name="state"]');
    const school=form?.querySelector('input[name="schoolName"]');
    const none=form?.querySelector('#mneSchoolNone');
    if(!form||!state||!school||!none)return;
    gate.dataset.schoolDirectoryReady='1';addCss();

    // District field: optional, but strongly improves matching where school names repeat.
    const stateLabel=state.closest('label');
    const districtLabel=document.createElement('label');
    districtLabel.innerHTML='District <span style="font-weight:400;color:#64748b">(recommended)</span><div class="school-district-wrap"><input name="schoolDistrict" id="mneSchoolDistrict" autocomplete="off" placeholder="Type or choose district"><div class="school-district-list" id="mneSchoolDistrictList"></div></div><small class="field-help">Select your State/UT first. District narrows the school results.</small>';
    stateLabel?.insertAdjacentElement('afterend',districtLabel);
    const district=districtLabel.querySelector('#mneSchoolDistrict');
    const districtList=districtLabel.querySelector('#mneSchoolDistrictList');
    let districts=[];

    const schoolLabel=school.closest('label');
    schoolLabel?.classList.add('school-directory-field');
    school.autocomplete='off';
    school.placeholder='Type at least 2 letters of your school name';
    const menu=document.createElement('div');menu.className='school-directory-menu';menu.setAttribute('role','listbox');
    const status=document.createElement('small');status.className='school-directory-status';status.innerHTML='Start typing your school name. <b>You can still enter it manually if it is not listed.</b>';
    school.insertAdjacentElement('afterend',menu);menu.insertAdjacentElement('afterend',status);
    const hidden=document.createElement('input');hidden.type='hidden';hidden.name='schoolUdiseCode';schoolLabel?.appendChild(hidden);
    let searchTimer=null,searchSeq=0,active=-1,options=[];

    function closeDistricts(){districtList.classList.remove('open')}
    function showDistricts(filter=''){
      const q=filter.trim().toLowerCase();
      const items=districts.filter(x=>!q||x.toLowerCase().includes(q)).slice(0,80);
      districtList.innerHTML=items.map(x=>`<button type="button" data-district="${esc(x)}">${esc(x)}</button>`).join('');
      districtList.classList.toggle('open',items.length>0);
    }
    async function loadDistricts(){
      const st=state.value.trim();districts=[];district.value='';closeDistricts();
      if(!st)return;
      try{const d=await post('districts',{state:st});districts=Array.isArray(d.districts)?d.districts:[]}
      catch{districts=[]}
    }
    state.addEventListener('change',()=>{loadDistricts();school.value='';hidden.value='';menu.classList.remove('open');status.innerHTML='Start typing your school name. <b>You can still enter it manually if it is not listed.</b>'});
    district.addEventListener('focus',()=>showDistricts(district.value));
    district.addEventListener('input',()=>showDistricts(district.value));
    districtList.addEventListener('mousedown',e=>{const b=e.target.closest('[data-district]');if(!b)return;e.preventDefault();district.value=b.dataset.district||'';closeDistricts();school.focus()});

    function closeMenu(){menu.classList.remove('open');active=-1}
    function renderSchools(rows){
      options=rows||[];active=-1;
      if(!options.length){menu.innerHTML='<div style="padding:10px 11px;color:#64748b;font-size:12px">No matching school found. You may continue with the school name typed above.</div>';menu.classList.add('open');return}
      menu.innerHTML=options.map((s,i)=>`<button type="button" class="school-directory-option" role="option" data-index="${i}"><strong>${esc(s.name)}</strong><small>${esc([s.district,s.block,s.pincode&&('PIN '+s.pincode)].filter(Boolean).join(' • '))}${s.udiseCode?` • UDISE ${esc(s.udiseCode)}`:''}${s.management?` • ${esc(s.management)}`:''}</small></button>`).join('');
      menu.classList.add('open');
    }
    function choose(i){
      const s=options[i];if(!s)return;
      school.value=s.name||'';hidden.value=s.udiseCode||'';
      if(s.district&&!district.value)district.value=s.district;
      closeMenu();status.className='school-directory-status ok';status.innerHTML=`Selected from school directory <span class="school-directory-badge">${s.udiseCode?'UDISE '+esc(s.udiseCode):'matched'}</span>`;
      school.dispatchEvent(new Event('change',{bubbles:true}));
    }
    async function searchSchools(){
      const st=state.value.trim(),q=school.value.trim();
      hidden.value='';
      if(!st){closeMenu();status.className='school-directory-status error';status.textContent='Please select State/UT first.';return}
      if(q.length<2){closeMenu();status.className='school-directory-status';status.textContent='Type at least 2 letters of the school name.';return}
      const seq=++searchSeq;status.className='school-directory-status';status.textContent='Searching schools…';
      try{
        const d=await post('search',{state:st,district:district.value.trim(),q,limit:15});
        if(seq!==searchSeq)return;
        renderSchools(Array.isArray(d.schools)?d.schools:[]);status.className='school-directory-status';status.innerHTML=(d.schools?.length?`${d.schools.length} matching school${d.schools.length===1?'':'s'} found. Choose one, or keep typing.`:'No directory match yet. You may enter the school manually.');
      }catch(err){if(seq!==searchSeq)return;closeMenu();status.className='school-directory-status error';status.textContent='Directory search is temporarily unavailable. You can enter the school name manually and continue.'}
    }
    school.addEventListener('input',()=>{hidden.value='';status.className='school-directory-status';clearTimeout(searchTimer);searchTimer=setTimeout(searchSchools,320)});
    school.addEventListener('focus',()=>{if(options.length&&school.value.trim().length>=2)menu.classList.add('open')});
    school.addEventListener('keydown',e=>{
      const buttons=[...menu.querySelectorAll('.school-directory-option')];
      if(!menu.classList.contains('open')||!buttons.length)return;
      if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();active=e.key==='ArrowDown'?Math.min(active+1,buttons.length-1):Math.max(active-1,0);buttons.forEach((b,i)=>b.classList.toggle('active',i===active));buttons[active]?.scrollIntoView({block:'nearest'})}
      else if(e.key==='Enter'&&active>=0){e.preventDefault();choose(active)}else if(e.key==='Escape')closeMenu();
    });
    menu.addEventListener('mousedown',e=>{const b=e.target.closest('.school-directory-option');if(!b)return;e.preventDefault();choose(Number(b.dataset.index))});
    none.addEventListener('change',()=>{district.disabled=none.checked;if(none.checked){district.value='';hidden.value='';closeMenu();closeDistricts();status.textContent='School selection is disabled because “No school / institution / None” is selected.'}else status.innerHTML='Start typing your school name. <b>You can still enter it manually if it is not listed.</b>'});
    document.addEventListener('pointerdown',e=>{if(!schoolLabel?.contains(e.target))closeMenu();if(!districtLabel.contains(e.target))closeDistricts()});
    if(state.value)loadDistricts();
  }
  const scan=()=>enhance(document.getElementById('mneAuthGate'));
  scan();
  new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
})();
