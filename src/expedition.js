/** Shared spatial world rules. Solving a board awards a discovery, never CEFR credit. */
const DIRECTIONS=Object.freeze({N:[0,-1],E:[1,0],S:[0,1],W:[-1,0]});
const ID=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const key=p=>p.join(',');
const same=(a,b)=>a[0]===b[0]&&a[1]===b[1];
const adjacent=(a,b)=>Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1])<=1;
const clone=v=>structuredClone(v);
const coordinate=(v,b)=>Array.isArray(v)&&v.length===2&&v.every(Number.isInteger)&&v[0]>=0&&v[0]<b.width&&v[1]>=0&&v[1]<b.height;
const object=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).every(k=>keys.includes(k))&&keys.every(k=>Object.hasOwn(v,k));
const text=v=>typeof v==='string'&&v.trim().length>0&&v.length<=4000&&!/[<>\u0000-\u0008]/.test(v);
const localized=v=>object(v,['en','vi'])&&text(v.en)&&text(v.vi);

export function validateBoard(board){
 const errors=[],fail=m=>errors.push(m);
 if(!object(board,['id','missionId','level','width','height','start','water','bridges','switches','landmarks','goal','clue','hint']))return ['Invalid board fields'];
 if(typeof board.id!=='string'||typeof board.missionId!=='string'||!ID.test(board.id)||!ID.test(board.missionId)||board.id!==board.missionId+'-board')fail('Invalid board identity');
 if(!['A1','A2','B1','B2','C1','C2'].includes(board.level))fail('Invalid CEFR band');
 if(board.width!==7||board.height!==5||!coordinate(board.start,board)||!same(board.start,[0,4]))fail('Invalid board dimensions/start');
 if(!localized(board.clue)||!localized(board.hint))fail('Clue and hint need safe EN/VI text');
 if(new TextEncoder().encode(JSON.stringify(board)).length>12288)fail('Board exceeds 12 KiB');
 for(const k of ['water','bridges']){
  if(!Array.isArray(board[k])||board[k].length<(k==='bridges'?1:2)||board[k].length>30||board[k].some(p=>!coordinate(p,board))){fail('Invalid '+k);continue;}
  if(new Set(board[k].map(key)).size!==board[k].length)fail('Duplicate '+k+' tile');
 }
 if(!Array.isArray(board.switches)||board.switches.length<1||board.switches.length>3||board.switches.some(s=>!object(s,['id','at'])||typeof s.id!=='string'||!ID.test(s.id)||!coordinate(s.at,board)))fail('Invalid switches');
 if(!Array.isArray(board.landmarks)||board.landmarks.length<3||board.landmarks.length>4||board.landmarks.some(s=>!object(s,['id','name','at'])||typeof s.id!=='string'||!ID.test(s.id)||!text(s.name)||s.name.length>60||!coordinate(s.at,board)))fail('Invalid landmarks');
 if(errors.length)return errors;
 const water=new Set(board.water.map(key)),positions=new Set(),names=new Set(),ids=new Set();
 for(const s of [...board.switches,...board.landmarks]){
  if(ids.has(s.id)||positions.has(key(s.at)))fail('Duplicate object identity or position');ids.add(s.id);positions.add(key(s.at));
  if(water.has(key(s.at)))fail('Switches and landmarks must be on dry land');
  if(s.name){if(names.has(s.name.toLowerCase()))fail('Duplicate landmark name');names.add(s.name.toLowerCase());}
 }
 if(water.has(key(board.start)))fail('Start must be dry');
 if(board.bridges.some(p=>!water.has(key(p))))fail('Bridges must span water');
 if(!board.landmarks.some(l=>l.id===board.goal&&!same(l.at,board.start)))fail('Invalid goal');
 if(errors.length)return errors;
 for(const landmark of board.landmarks)if(!search(board,landmark.id,true))fail('Unreachable landmark '+landmark.id);
 if(search(board,board.goal,false))fail('Destination must require a bridge switch');
 return errors;
}

export function createExpedition(board){return {position:[...board.start],bridgeOpen:false,moves:0,visited:[key(board.start)],switchesUsed:0,solved:false,message:'ready'};}
export const resetExpedition=createExpedition;
function goalAt(board,position){return board.landmarks.some(l=>l.id===board.goal&&same(l.at,position));}
function step(board,state,command){
 const next={...state,position:[...state.position],visited:[...state.visited]};
 if(command==='X'){
  if(!board.switches.some(s=>adjacent(s.at,state.position)))return {...next,message:'out-of-reach'};
  next.bridgeOpen=!state.bridgeOpen;next.switchesUsed++;next.message=next.bridgeOpen?'bridge-open':'bridge-closed';return next;
 }
 const delta=DIRECTIONS[command];if(!delta)throw new Error('Unknown movement command');
 const position=[state.position[0]+delta[0],state.position[1]+delta[1]];
 if(!coordinate(position,board))return {...next,message:'edge'};
 const bridge=board.bridges.some(p=>same(p,position)),water=board.water.some(p=>same(p,position));
 if((bridge&&!state.bridgeOpen)||(water&&!bridge))return {...next,message:'blocked'};
 next.position=position;next.moves++;if(!next.visited.includes(key(position)))next.visited.push(key(position));
 next.solved=state.solved||goalAt(board,position);
 const landmark=board.landmarks.find(l=>same(l.at,position));
 next.message=goalAt(board,position)?'discovered':landmark?'landmark':'moved';return next;
}
export function moveExpedition(board,state,direction){if(!Object.hasOwn(DIRECTIONS,direction))throw new Error('Invalid direction');return step(board,state,direction);}
export function activateSwitch(board,state){return step(board,state,'X');}
export function executePlan(board,state,commands){
 if(!Array.isArray(commands)||commands.length>40||commands.some(c=>!['N','E','S','W','X'].includes(c)))throw new Error('Plan needs at most 40 N/E/S/W/X commands');
 let result=clone(state);const steps=[];
 for(const command of commands){result=step(board,result,command);steps.push({command,state:clone(result)});}
 return {state:result,steps};
}
export function replayExpedition(board,commands){
 if(!Array.isArray(commands)||commands.length>400||commands.some(c=>!['N','E','S','W','X'].includes(c)))throw new Error('Invalid saved expedition path');
 let state=createExpedition(board);for(const command of commands)state=step(board,state,command);return state;
}

function search(board,destination,allowSwitch){
 const target=board.landmarks.find(l=>l.id===destination);if(!target)return null;
 const initial=createExpedition(board),queue=[{state:initial,commands:[]}],seen=new Set([key(initial.position)+':false']);
 for(let index=0;index<queue.length;index++){
  const {state,commands}=queue[index];if(same(state.position,target.at))return commands;
  for(const c of allowSwitch?['N','E','S','W','X']:['N','E','S','W']){
   const next=step(board,state,c),id=key(next.position)+':'+next.bridgeOpen;
   if(!seen.has(id)){seen.add(id);queue.push({state:next,commands:[...commands,c]});}
  }
 }
 return null;
}
export function findRoute(board){return search(board,board.goal,true);}

/** Whole-path snapshots recover offline branches without interleaving movement. */
export function deriveExpeditions(events,boards){
 const index=new Map(boards.map(b=>[b.id,b])),states={},solved=new Set(),covered=new Map();
 for(const event of events.filter(e=>e.kind==='expedition').sort((a,b)=>b.at.localeCompare(a.at)||b.id.localeCompare(a.id))){
  if(event.kind!=='expedition')continue;
  const p=event.payload??{},board=index.get(p.boardId);if(!board)continue;
  if(states[board.id]&&solved.has(board.id))continue;
  if(!Array.isArray(p.commands)||p.commands.length>400||p.commands.some(c=>!['N','E','S','W','X'].includes(c)))continue;
  const path=p.commands.join(''),previous=covered.get(board.id)??[];
  // Newer cumulative paths already prove the outcomes of all their prefixes.
  if(states[board.id]&&previous.some(known=>known.startsWith(path)))continue;
  try{const state=replayExpedition(board,p.commands);if(!states[board.id])states[board.id]={state,commands:[...p.commands],supported:Boolean(p.supported)};if(state.solved)solved.add(board.id);previous.push(path);covered.set(board.id,previous);}catch{/* Malformed saved paths cannot award discoveries or break another profile. */}
 }
 return {states,solved};
}
