// ================================================================
// Room host controls (room-code multiplayer)
// ================================================================
// The player who created the room decides the rules for everyone: who can fight whom,
// whether crimes and police happen, the time of day, and who is in the room.
const ROOM_DEFAULT={pvp:'factions',crimes:true,police:true,locked:false};
const ROOM=Object.assign({},ROOM_DEFAULT);
const PVP_MODES={factions:'Heroes vs villains',all:'Everyone can fight',off:'No fighting between players'};
const isRoomHost=()=>P2P.state==='open'&&P2P.host;
function resetRoom(){Object.assign(ROOM,ROOM_DEFAULT);}
function applyRoom(d,quiet){
  if(!d||typeof d!=='object')return;const before=JSON.stringify(ROOM);
  if(PVP_MODES[d.pvp])ROOM.pvp=d.pvp;for(const k of ['crimes','police','locked'])if(typeof d[k]==='boolean')ROOM[k]=d[k];
  if(!ROOM.police){clearWanted();for(const h of humans)if(h.role==='police'&&h.target===P)h.target=null;}
  if(!quiet&&before!==JSON.stringify(ROOM)&&state==='play')feed('Room rules changed',PVP_MODES[ROOM.pvp]+(ROOM.crimes?'':' · no crimes')+(ROOM.police?'':' · no police'));
  if(sheetOpen==='mp')renderSheet();
}
function hostSet(k,v){if(!isRoomHost())return;ROOM[k]=v;applyRoom(ROOM,true);P2P.broadcast({t:'rs',d:ROOM},null);if(state==='play')feed('Room rules changed','');Portal.roomChanged();}
function kickPeer(id){
  if(!isRoomHost())return;const c=P2P.conns.get(id),r=MP.peers.get(id);
  if(c){try{c.send({t:'kick'});}catch(e){}setTimeout(()=>{try{c.close();}catch(e){}},250);}
  if(r)feed(r.name+' was removed','');
}
// grow every fallen building back right away, for everyone in the room
function rebuildCity(broadcast){
  let n=0;for(const b of bldgs)if(b.state==='down'||b.state==='fall'){b.state='down';b.regrowAt=time;n++;}
  if(broadcast&&isRoomHost())P2P.broadcast({t:'rebuild'},null);
  feed('Rebuilding the city',n?n+' building'+(n>1?'s':'')+' growing back':'Nothing to rebuild');
}
function renderHostControls(B){
  const tgl=(label,k,note)=>{const c=el('input',{type:'checkbox'});c.checked=!!ROOM[k];c.addEventListener('change',()=>hostSet(k,c.checked));
    return el('label',{class:'row'},el('span',{text:label+(note?' · '+note:'')}),c);};
  const pvp=el('select',{'aria-label':'Player fighting'},...Object.keys(PVP_MODES).map(k=>{const o=el('option',{value:k,text:PVP_MODES[k]});if(ROOM.pvp===k)o.selected=true;return o;}));
  pvp.addEventListener('change',()=>hostSet('pvp',pvp.value));
  const tods=[['Morning',0.3],['Noon',0.5],['Evening',0.74],['Night',0.95]].map(([n,v])=>el('button',{class:'ghost',type:'button',text:n,onclick:()=>{tod=v;feed('Time of day',n);}}));
  B.append(el('h3',{text:'Host controls'}),
    el('label',{class:'row'},el('span',{text:'Player fighting'}),pvp),
    tgl('Crimes happen','crimes'),tgl('Police and wanted levels','police'),tgl('Lock the room','locked','nobody new can join'),
    el('p',{class:'muted',text:'Time of day'}),el('div',{class:'cta'},...tods),
    el('div',{class:'cta'},el('button',{class:'ghost',type:'button',text:'Rebuild the city now',onclick:()=>rebuildCity(true)})));
  if(MP.peers.size){B.append(el('p',{class:'muted',text:'Remove a player'}));
    for(const [id,r] of MP.peers)B.append(el('div',{class:'row'},el('span',{text:r.name+' · LV '+r.level}),el('button',{class:'ghost',type:'button',text:'Remove',onclick:()=>kickPeer(id)})));}
}
