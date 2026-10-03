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
// The calendar (a sheet, like Skills): Day 1-7 as cards, claimed ones ticked, today's lit, the rest dimmed. It opens by itself when a reward is
// claimed (the card stamps after half a second, "Nice" closes it and the game carries on), and by hand from the HUD icon (key 5) or the pause menu.
// Your first ever claim only shows the toast, so nothing blocks the opening minutes; the calendar is there from the next session.
let dailyShow=0,dailyResume=false,dailyChime=false; // dailyShow: the day just claimed (its card stamps); dailyResume: close = back into the game
const dailyCanShow=()=>state==='play'&&!paused&&!sheetOpen&&!creating&&!dialOpen&&!P.dead;
function dailyApply(n){const d=save.daily,r=dailyReward(n);d.last=dayStr(new Date());d.streak=n;if(r.sp)save.sp+=r.sp;addXP(r.xp);persist();return r;}
function openDaily(stamp){
  if(state!=='play'||creating)return;
  const d=save.daily,n=dailyStep(d.last,d.streak,dayStr(new Date()));
  if(n!==null){dailyApply(n);stamp=n;} // opened by hand before today's claim landed: claim it now
  dailyShow=stamp||0;dailyChime=!!stamp;dailyResume=!paused&&!sheetOpen;
  openSheet('daily');
}
const dailyCard=r=>(r.sp?'+'+r.sp+' SP\n':'')+'+'+r.xp+' XP';
function renderDaily(){
  const B=sheetBody,d=save.daily,stamp=dailyShow,today=Math.max(1,stamp||d.streak),grid=el('div',{class:'dgrid'});
  for(let i=1;i<=7;i++){const cls=i<today?'got':i===today?(stamp?'today stamp':'today got'):'next';
    grid.appendChild(el('div',{class:'dcard '+cls+(i===7?' d7':'')},el('i',{text:'Day '+i}),el('b',{text:dailyCard(dailyReward(i))}),el('u',{},glyph('check'))));}
  const nx=Math.min(today+1,7);
  B.append(grid,el('div',{class:'dfoot'},
    el('p',{class:'muted',text:(stamp?'Day '+today+' reward added · ':'')+(today>=7?'Day 7 pays again every day you keep the streak':'Come back tomorrow for Day '+nx+' ('+dailyText(dailyReward(nx))+')')+'. Miss a day and it starts over.'}),
    el('button',{class:'go',type:'button',text:stamp?'Nice':'Close',onclick:()=>closeSheet()})));
  if(dailyChime){dailyChime=false;setTimeout(()=>{if(sheetOpen==='daily')SFX.chime();},620);}
}
function claimDaily(){ // called by startPlay; the claim lands 3 s later, after the welcome toast (and is skipped if you leave before that)
  if(window.__SKYLINE_TEST__||dailyPend||!save.character)return;dailyPend=true;
  later(3,()=>{dailyPend=false;try{
    const d=save.daily,n=dailyStep(d.last,d.streak,dayStr(new Date()));if(n===null)return;
    const first=!d.last,r=dailyApply(n);
    if(first||!dailyCanShow()){toast('Day '+n+' reward',dailyText(r),'gold');SFX.chime();}else openDaily(n);
    if(sheetOpen==='skills')renderSheet();
  }catch(e){logErr(e);}});
}
function dailyPause(){const a=$('p-daily'),s=$('p-saved'),t=dailyNext();a.textContent=t?t+' · see all days':'';a.hidden=!t;s.hidden=false;} // the pause menu has just saved
