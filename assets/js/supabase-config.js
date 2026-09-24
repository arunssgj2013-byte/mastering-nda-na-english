// Supabase browser client for masteringndaenglish.com
// The publishable key below is intentionally safe for browser use. Security is enforced by RLS.
(function(){
  const SUPABASE_URL="https://qwpmbrysjxqislxnwwlk.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY="sb_publishable_8I7FJTA-VPknW5Ex9voH9Q_EkrDphC_";
  if(!window.supabase || !window.supabase.createClient){
    console.error('Supabase library did not load.');
    return;
  }
  const client=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{
    auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
  });
  window.mneSupabase=client;
  window.MNEBackend={
    client,
    async session(){
      const {data,error}=await client.auth.getSession();
      if(error) throw error;
      return data.session||null;
    },
    async user(){
      const {data,error}=await client.auth.getUser();
      if(error) return null;
      return data.user||null;
    },
    async saveAttempt(payload){
      const user=await this.user();
      if(!user) return {ok:false,reason:'not-authenticated'};
      const row={
        user_id:user.id,
        paper_id:String(payload.paperId||payload.setId||payload.setLabel||'unknown'),
        paper_title:String(payload.setLabel||payload.paperTitle||'Practice Set'),
        paper_type:['pyq','sample','other'].includes(payload.setType)?payload.setType:'other',
        correct_count:Number(payload.correct||0),
        incorrect_count:Number(payload.incorrect||0),
        unattempted_count:Number(payload.unattempted||0),
        total_questions:Number(payload.totalQuestions||50),
        score:Number(payload.marks||0),
        accuracy:Number(payload.accuracy||0),
        duration_seconds:Number.isFinite(Number(payload.durationSeconds))?Number(payload.durationSeconds):null,
        client_attempt_key:payload.clientAttemptKey||null
      };
      const {error}=await client.from('quiz_attempts').insert(row);
      if(error){
        if(error.code==='23505') return {ok:true,deduplicated:true};
        console.error('Could not save attempt to Supabase:',error);
        return {ok:false,error};
      }
      return {ok:true};
    }
  };
})();
