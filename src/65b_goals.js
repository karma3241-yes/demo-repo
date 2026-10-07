// ================================================================
// Starter goals: one goal at a time in a small pill (#goal), each pays XP. save.goal is the index of the current one
// (-1 = a save from before goals: what it already did is skipped without a payout). The guide comes first; the pill shows once it is done.
const GOALS=[
  {id:'swap',text:'Try another hero (J / swap icon)',done:()=>save.guide.swap===true,xp:50},
  {id:'stop1',text:'Stop a crime (follow the ! marker)',done:()=>save.stats.crimesStopped>=1,xp:100},
  {id:'lv2',text:'Reach level 2',done:()=>save.level>=2,xp:50},
  {id:'skill',text:'Spend a skill point (K / star)',done:()=>Object.values(save.powerLevels).some(v=>v>1)||Object.values(save.passives).some(v=>v>0),xp:50},
  {id:'stop3',text:'Stop 3 crimes',done:()=>save.stats.crimesStopped>=3,xp:150},
  {id:'key3',text:'Unlock your 3rd power (LV '+KIT_LV[2]+')',done:()=>save.level>=KIT_LV[2],xp:100},
  {id:'defeat10',text:'Defeat 10 villains',done:()=>save.stats.defeated>=10,xp:150},
  {id:'lv5',text:'Reach level 5',done:()=>save.level>=5,xp:200},
];
let goalT=0,goalTop=-1;
function nextUnlockText(){const i=KIT_LV.findIndex(l=>l>save.level);if(i<0)return '';
  const p=Math.round(100*clamp((save.level-1+save.xp/xpNeed())/(KIT_LV[i]-1),0,1));return 'Next unlock: key '+(i+1)+' at LV '+KIT_LV[i]+' ('+p+'%)';}
function placeGoal(g){ // desktop: sit under the icon bar (and the leaderboard); touch: CSS puts it in the left column
  let y=-1;if(!touchOn()){y=0;for(const b of [$('hudbar'),$('lbmini')])if(b&&!b.hidden&&b.offsetHeight)y=Math.max(y,b.offsetTop+b.offsetHeight);y+=8;}
  if(y!==goalTop){goalTop=y;g.style.top=y<0?'':y+'px';}}
function updateGoal(){
  const g=$('goal');if(!g)return;
  if(state!=='play'||!save.character||!save.guide.done){g.hidden=true;return;}
  try{
    if(save.goal<0){let i=0;while(i<GOALS.length&&GOALS[i].done())i++;save.goal=i;persist();}
    let G=GOALS[save.goal];
    if(G&&G.done()){save.goal++;addXP(G.xp);persist();SFX.play('reward');toast('Goal done','+'+G.xp+' XP · '+G.text,'gold');G=GOALS[save.goal];}
    const t=G?G.text:nextUnlockText();
    if(!t){g.hidden=true;return;}
    g.hidden=false;setText($('goal-t'),'goalt',t);setText($('goal-x'),'goalx',G?'+'+G.xp+' XP':'');placeGoal(g);
  }catch(e){logErr(e);}
}
