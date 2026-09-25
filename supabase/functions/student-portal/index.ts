import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-student-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8'
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const STATES = [
  'Andaman and Nicobar Islands','Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chandigarh','Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jammu and Kashmir',
  'Jharkhand','Karnataka','Kerala','Ladakh','Lakshadweep','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Puducherry','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal'
];
const CLASSES = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
const USER_TYPES = ['STUDENT','TEACHER','OTHER'];

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}
function clean(v: unknown, max = 180) { return String(v ?? '').trim().replace(/\s+/g,' ').slice(0,max); }
function emailOk(v: string) { return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(v) && v.length <= 254; }
function pincodeOk(v: string) { return /^\d{6}$/.test(v); }
function randomToken() {
  const b = new Uint8Array(32); crypto.getRandomValues(b);
  return Array.from(b, x=>x.toString(16).padStart(2,'0')).join('');
}
async function sha256(s: string) {
  const bytes = new TextEncoder().encode(s);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), x=>x.toString(16).padStart(2,'0')).join('');
}
function bearer(req: Request) {
  return (req.headers.get('x-student-token') || '').trim();
}
async function currentUser(req: Request) {
  const token = bearer(req); if (!token) return null;
  const tokenHash = await sha256(token);
  const { data: session } = await db.from('student_sessions').select('student_id, expires_at').eq('token_hash', tokenHash).maybeSingle();
  if (!session || new Date(session.expires_at) <= new Date()) return null;
  await db.from('student_sessions').update({ last_seen_at: new Date().toISOString() }).eq('token_hash', tokenHash);
  const { data: user } = await db.from('students').select('*').eq('id', session.student_id).eq('status','active').maybeSingle();
  return user || null;
}
async function issueSession(userId: string, ua: string | null) {
  const token = randomToken();
  const tokenHash = await sha256(token);
  const expires = new Date(Date.now() + 1000*60*60*24*60).toISOString();
  await db.from('student_sessions').insert({ token_hash: tokenHash, student_id: userId, expires_at: expires, user_agent: clean(ua,400) });
  return { token, expires_at: expires };
}
function publicUser(s: any) {
  return {
    id:s.id,
    name:s.full_name,
    userType:s.user_type || 'STUDENT',
    className:s.class_name || '',
    state:s.state_ut || '',
    pincode:s.pincode || '',
    school:s.school_none?'NONE':(s.school_name||''),
    schoolNone:!!s.school_none,
    email:s.email,
    registeredAt:s.registered_at,
    lastLoginAt:s.last_login_at,
    loginCount:s.login_count
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error:'Method not allowed' },405);
  let body:any={}; try { body = await req.json(); } catch { return json({error:'Invalid request'},400); }
  const action = clean(body.action,50);

  try {
    if (action === 'visitor_ping') {
      const visitorId = clean(body.visitorId,120); if (!visitorId) return json({error:'Missing visitor id'},400);
      const page = clean(body.page,220);
      const { data: existing } = await db.from('site_visitors').select('visit_count').eq('visitor_id', visitorId).maybeSingle();
      if (existing) await db.from('site_visitors').update({ last_seen_at:new Date().toISOString(), visit_count:(existing.visit_count||0)+1, last_page:page }).eq('visitor_id',visitorId);
      else await db.from('site_visitors').insert({visitor_id:visitorId,last_page:page});
      const { count } = await db.from('site_visitors').select('*',{count:'exact',head:true});
      return json({ totalVisitors: count || 0 });
    }
    if (action === 'visitor_count') {
      const { count } = await db.from('site_visitors').select('*',{count:'exact',head:true});
      return json({ totalVisitors: count || 0 });
    }
    if (action === 'register') {
      const fullName=clean(body.fullName,100);
      const userType=clean(body.userType,20).toUpperCase();
      const rawClass=clean(body.className,30).toUpperCase();
      const className=userType==='STUDENT'?rawClass:null;
      const state=clean(body.state,80), pincode=clean(body.pincode,6), email=clean(body.email,254).toLowerCase();
      const schoolNone=!!body.schoolNone, schoolName=schoolNone?null:clean(body.schoolName,180);
      if (fullName.length<2) return json({error:'Please enter your full name.'},400);
      if (!USER_TYPES.includes(userType)) return json({error:'Please choose how you are registering: Student, Teacher or Other User.'},400);
      if (userType==='STUDENT' && !CLASSES.includes(rawClass)) return json({error:'Please choose your class from the list.'},400);
      if (!STATES.includes(state)) return json({error:'Please choose a valid State/UT from the list.'},400);
      if (!pincodeOk(pincode)) return json({error:'PIN code must contain exactly 6 digits.'},400);
      if (!schoolNone && !schoolName) return json({error:'Enter the school/institution name or select None.'},400);
      if (!emailOk(email)) return json({error:'Please enter a valid email address.'},400);
      const { data: exists } = await db.from('students').select('id').ilike('email',email).maybeSingle();
      if (exists) return json({error:'This email is already registered. Please use User Login.'},409);
      const now=new Date().toISOString();
      const { data: user, error } = await db.from('students').insert({full_name:fullName,user_type:userType,class_name:className,state_ut:state,pincode,school_name:schoolName,school_none:schoolNone,email,registered_at:now,updated_at:now,last_login_at:now,login_count:1}).select('*').single();
      if (error) throw error;
      await db.from('student_login_events').insert({student_id:user.id,email,event_type:'register',metadata:{userType,className,state,pincode,school:schoolNone?'NONE':schoolName}});
      const session=await issueSession(user.id,req.headers.get('user-agent'));
      const visitorId=clean(body.visitorId,120); if(visitorId) await db.from('site_visitors').update({registered_student_id:user.id}).eq('visitor_id',visitorId);
      return json({ok:true,student:publicUser(user),user:publicUser(user),session});
    }
    if (action === 'login') {
      const email=clean(body.email,254).toLowerCase();
      if (!emailOk(email)) return json({error:'Please enter a valid registered email address.'},400);
      const { data: user } = await db.from('students').select('*').ilike('email',email).eq('status','active').maybeSingle();
      if (!user) return json({error:'This email is not registered. Please use User Register first.'},404);
      const now=new Date().toISOString();
      const loginCount=(user.login_count||0)+1;
      await db.from('students').update({last_login_at:now,login_count:loginCount,updated_at:now}).eq('id',user.id);
      await db.from('student_login_events').insert({student_id:user.id,email,event_type:'login'});
      const session=await issueSession(user.id,req.headers.get('user-agent'));
      const visitorId=clean(body.visitorId,120); if(visitorId) await db.from('site_visitors').update({registered_student_id:user.id}).eq('visitor_id',visitorId);
      const publicData=publicUser({...user,last_login_at:now,login_count:loginCount});
      return json({ok:true,student:publicData,user:publicData,session});
    }
    if (action === 'session') {
      const user=await currentUser(req); if(!user) return json({error:'Session expired',code:'SESSION_EXPIRED'},401);
      const publicData=publicUser(user);
      return json({ok:true,student:publicData,user:publicData});
    }
    if (action === 'logout') {
      const token=bearer(req);
      if(token){
        const h=await sha256(token);
        const {data:s}=await db.from('student_sessions').select('student_id').eq('token_hash',h).maybeSingle();
        if(s){const {data:st}=await db.from('students').select('email').eq('id',s.student_id).maybeSingle(); await db.from('student_login_events').insert({student_id:s.student_id,email:st?.email||'',event_type:'logout'});}
        await db.from('student_sessions').delete().eq('token_hash',h);
      }
      return json({ok:true});
    }

    const user=await currentUser(req); if(!user) return json({error:'Please login first.',code:'SESSION_EXPIRED'},401);

    if (action === 'activity') {
      const eventType=clean(body.eventType,60); if(!eventType) return json({error:'Missing activity type'},400);
      await db.from('student_activity').insert({student_id:user.id,event_type:eventType,resource_id:clean(body.resourceId,180)||null,resource_title:clean(body.resourceTitle,220)||null,metadata:body.metadata && typeof body.metadata==='object'?body.metadata:{}});
      return json({ok:true});
    }
    if (action === 'submit_attempt') {
      const paperId=clean(body.paperId,120), title=clean(body.paperTitle,220), type=['pyq','sample','other'].includes(body.paperType)?body.paperType:'other';
      if(!paperId||!title)return json({error:'Missing paper information'},400);
      const c=Math.max(0,Number(body.correct)||0), w=Math.max(0,Number(body.incorrect)||0), u=Math.max(0,Number(body.unattempted)||0), total=Math.max(0,Number(body.totalQuestions)||50);
      const score=Number(body.score)||0, accuracy=Math.min(100,Math.max(0,Number(body.accuracy)||0)), overall=Math.min(100,Math.max(0,Number(body.overallPercent)||0));
      const duration=Math.max(0,Number(body.durationSeconds)||0), clientKey=clean(body.clientAttemptKey,180)||null;
      const { count } = await db.from('student_quiz_attempts').select('*',{count:'exact',head:true}).eq('student_id',user.id).eq('paper_id',paperId);
      const attemptNo=(count||0)+1;
      const { data: row, error }=await db.from('student_quiz_attempts').insert({student_id:user.id,paper_id:paperId,paper_title:title,paper_type:type,attempt_number:attemptNo,correct_count:c,incorrect_count:w,unattempted_count:u,total_questions:total,score,accuracy,overall_percent:overall,duration_seconds:duration,section_stats:body.sectionStats&&typeof body.sectionStats==='object'?body.sectionStats:{},client_attempt_key:clientKey}).select('*').single();
      if(error){ if(String(error.code)==='23505') return json({ok:true,deduplicated:true}); throw error; }
      await db.from('student_activity').insert({student_id:user.id,event_type:'quiz_submit',resource_id:paperId,resource_title:title,metadata:{attemptNumber:attemptNo,score,accuracy,correct:c,incorrect:w,unattempted:u}});
      return json({ok:true,attempt:row});
    }
    if (action === 'dashboard') {
      const { data: attempts }=await db.from('student_quiz_attempts').select('*').eq('student_id',user.id).order('attempted_at',{ascending:false}).limit(200);
      const { data: activity }=await db.from('student_activity').select('*').eq('student_id',user.id).order('created_at',{ascending:false}).limit(100);
      const arr=attempts||[];
      const total=arr.length, best=total?Math.max(...arr.map((x:any)=>Number(x.score)||0)):0, avg=total?arr.reduce((s:number,x:any)=>s+(Number(x.accuracy)||0),0)/total:0;
      const byPaper:any={};
      for(const a of [...arr].reverse()){
        const k=a.paper_id;
        if(!byPaper[k])byPaper[k]={paperId:k,paperTitle:a.paper_title,attempts:0,firstAccuracy:Number(a.accuracy)||0,lastAccuracy:Number(a.accuracy)||0,bestScore:Number(a.score)||0,lastAttemptAt:a.attempted_at};
        const p=byPaper[k]; p.attempts++; p.lastAccuracy=Number(a.accuracy)||0;p.bestScore=Math.max(p.bestScore,Number(a.score)||0);p.lastAttemptAt=a.attempted_at;
      }
      const first=total?arr[arr.length-1]:null,last=total?arr[0]:null;
      const growth=first&&last?Number((Number(last.accuracy)-Number(first.accuracy)).toFixed(1)):0;
      const publicData=publicUser(user);
      return json({ok:true,student:publicData,user:publicData,summary:{totalAttempts:total,bestScore:best,averageAccuracy:Number(avg.toFixed(1)),growthPoints:growth,uniquePapers:Object.keys(byPaper).length},attempts:arr,papers:Object.values(byPaper),activity:activity||[]});
    }
    return json({error:'Unknown action'},400);
  } catch (e) {
    console.error(e);
    return json({error:'Unable to complete the request right now.'},500);
  }
});
