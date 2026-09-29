// ================================================================
// Wanted level (1-5 stars) and bounty
// ================================================================
// Crimes against civilians and police build heat. Heat becomes stars: 1 star sends officers,
// 2 brings police cars, 3 sends more of everything, 4 calls in helicopters, 5 is everything
// at once. Stay out of sight of the police long enough and you lose a star at a time.
// Villains also build a bounty. It stays on your head until a hero player takes you down
// and collects it (a rival hero NPC can claim it too).
const WANTED={stars:[1,4,9,16,26],max:40,lose:[0,10,13,16,20,25]};
P.wantedPts=0;P.stars=0;let unseenT=0;
const starsFor=p=>{let s=0;for(const t of WANTED.stars)if(p>=t)s++;return s;};
function syncHeat(){P.heat=P.stars?P.stars*2:0;} // older systems read P.heat: police chase above 0, helicopters from 7 (4 stars)
function addWanted(n,bounty){
  if(!(n>0)||P.dead||state!=='play'||!ROOM.police)return;
  const before=P.stars;P.wantedPts=Math.min(WANTED.max,P.wantedPts+n);P.stars=starsFor(P.wantedPts);unseenT=0;syncHeat();
  if(P.stars>before){SFX.tone('square',700,900,0.12,0.06);later(0.15,()=>SFX.tone('square',900,700,0.12,0.06));
    feed('Wanted '+'★'.repeat(P.stars),['','The police are looking for you','Police cars are on the way','Every cop in the city wants you','Helicopters are in the air','Everything they have'][P.stars]);}
  if(bounty&&playerFaction()!=='hero')addBounty(bounty*(1+P.stars*0.5));
}
function clearWanted(){P.wantedPts=0;P.stars=0;unseenT=0;syncHeat();}
function addBounty(n){n=Math.round(n/10)*10;if(n<=0)return;save.bounty=Math.min(1e6,(save.bounty||0)+n);}
// can the police see you right now?
function policeSee(){
  for(const h of humans)if(h.alive&&h.role==='police'&&!h.hidden&&Math.abs(h.pos.x-P.pos.x)<80&&Math.abs(h.pos.z-P.pos.z)<80&&Math.hypot(h.pos.x-P.pos.x,h.pos.y-P.pos.y,h.pos.z-P.pos.z)<75)return true;
  for(const v of vehicles)if(v.alive&&v.vtype==='police'&&(v.state==='chase'||v.siren)&&Math.hypot(v.pos.x-P.pos.x,v.pos.z-P.pos.z)<95)return true;
  for(const h of helis)if(h.alive&&!h.leave&&Math.hypot(h.pos.x-P.pos.x,h.pos.z-P.pos.z)<160)return true;
  return false;
}
function updateWanted(dt){
  if(!P.stars){syncHeat();return;}
  if(P.dead||P.invisible>0||!ROOM.police)unseenT+=dt*3;else if(policeSee())unseenT=0;else unseenT+=dt;
  if(unseenT>WANTED.lose[P.stars]){P.stars--;P.wantedPts=P.stars?WANTED.stars[P.stars-1]:0;unseenT=0;syncHeat();
    feed(P.stars?'Wanted '+'★'.repeat(P.stars):'You lost them',P.stars?'Lost a star · keep out of sight':'The police stopped looking');}
  syncHeat();
}
// you went down: the police stand down; a hero (player or rival) who took you down collects your bounty
function bountyOnDown(killer){
  clearWanted();const b=save.bounty||0;if(!b||!killer)return;
  if(killer.kind==='remote'&&killer.faction==='hero'){MP.fx('bc',{to:killer.peer,a:b,n:save.character?save.character.name:'A villain'});save.bounty=0;feed('Bounty claimed',killer.name+' collected your $'+b.toLocaleString('en-US')+' bounty');}
  else if(killer.kind==='rival'&&killer.faction==='hero'){save.bounty=0;feed('Bounty claimed',killer.name+' collected your $'+b.toLocaleString('en-US')+' bounty');}
  persist();
}
function onBountyFx(d,r){
  if(d.to!==MP.myPeer)return;const a=clamp(+d.a||0,0,1e6);if(!a)return;
  const xp=Math.round(a/10),rep=Math.round(Math.min(500,a/100));addXP(xp);addRep(rep);
  toast('Bounty collected · $'+a.toLocaleString('en-US'),'You took down '+(safeName(String(d.n||''))||r.name)+' · +'+xp+' XP · +'+rep+' rep','gold');SFX.chime();persist();
}
const starText=n=>'★'.repeat(n)+'☆'.repeat(5-n);
