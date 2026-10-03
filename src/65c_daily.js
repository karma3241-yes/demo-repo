// ================================================================
// Daily reward: one claim per local date, a streak of up to 7 days. save.daily={last:'YYYY-MM-DD',streak:0..7}
// A clock moved backwards (today < last) never claims. The pure rules sit between the PURE markers (tested in Node).
// PURE-BEGIN
const dayStr=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); // local date, not UTC
const dayBefore=s=>dayStr(new Date(+s.slice(0,4),+s.slice(5,7)-1,+s.slice(8,10)-1,12)); // noon dodges DST edges; Date rolls month and year
function dailyStep(last,streak,today){if(today===last||today<last)return null;return last&&dayBefore(today)===last?Math.min(streak+1,7):1;} // the new streak, or null for no claim
const dailyReward=n=>n>=7?{xp:500,sp:2}:{xp:150*n,sp:0};
const dailyText=r=>(r.sp?'+'+r.sp+' skill points, ':'')+'+'+r.xp+' XP';
// PURE-END
let dailyPend=false;
function dailyNext(){ // the line for the menus: today's reward if it is not claimed yet, otherwise tomorrow's
  if(!save.character||!save.daily)return '';
  const d=save.daily,n=dailyStep(d.last,d.streak,dayStr(new Date()));
  return n!==null?'Play today: Day '+n+' reward ('+dailyText(dailyReward(n))+')':'Come back tomorrow: Day '+Math.min(d.streak+1,7)+' reward ('+dailyText(dailyReward(Math.min(d.streak+1,7)))+')';
}
function claimDaily(){ // called by startPlay; the claim lands 3 s later, after the welcome toast (and is skipped if you leave before that)
  if(window.__SKYLINE_TEST__||dailyPend||!save.character)return;dailyPend=true;
  later(3,()=>{dailyPend=false;try{
    const d=save.daily,t=dayStr(new Date()),n=dailyStep(d.last,d.streak,t);if(n===null)return;
    d.last=t;d.streak=n;const r=dailyReward(n);
    toast('Day '+n+' reward',dailyText(r),'gold');SFX.chime();
    if(r.sp)save.sp+=r.sp;addXP(r.xp);persist();if(sheetOpen==='skills')renderSheet();
  }catch(e){logErr(e);}});
}
function dailyPause(){const a=$('p-daily'),s=$('p-saved'),t=dailyNext();a.textContent=t;a.hidden=!t;s.hidden=false;} // the pause menu has just saved
