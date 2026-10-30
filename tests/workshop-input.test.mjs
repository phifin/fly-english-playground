import test from 'node:test';
import assert from 'node:assert/strict';
import {installWorkshopInput} from '../src/workshop-input.js';

class Element extends EventTarget{
 constructor(kind,doc){super();this.kind=kind;this.ownerDocument=doc;this.dataset={};this.children=[];this.isConnected=true;this.style={};const classes=new Set();this.classList={add:value=>classes.add(value),remove:value=>classes.delete(value),contains:value=>classes.has(value)};}
 closest(selector){if(selector==='.workshop')return this.scene;if(selector.includes(`"${this.dataset.action}"`))return this;return null;}
 contains(child){return child===this||this.children.includes(child);}
 append(child){this.children.push(child);child.parent=this;}
 remove(){if(this.parent)this.parent.children=this.parent.children.filter(child=>child!==this);this.isConnected=false;}
 setAttribute(){}
 querySelector(){return {cloneNode:()=>new Element('svg',this.ownerDocument)};}
 focus(){this.ownerDocument.activeElement=this;}
 setPointerCapture(id){this.capture=id;}
 hasPointerCapture(id){return this.capture===id;}
 releasePointerCapture(){this.capture=null;}
}
function setup(onPlace=()=>{}){
 const win=new EventTarget();Object.assign(win,{innerWidth:390,innerHeight:700,setTimeout,clearTimeout});
 const doc={defaultView:win,activeElement:null,hit:null,elementFromPoint(){return this.hit;},createElement(kind){return new Element(kind,this);}};
 doc.body=new Element('body',doc);
 const root=new Element('root',doc),scene=new Element('scene',doc),toy=new Element('toy',doc),target=new Element('target',doc);
 toy.dataset={action:'workshop-select',value:'boat'};target.dataset={action:'workshop-place',value:'water'};toy.scene=scene;target.scene=scene;
 root.append(scene);root.append(toy);root.append(target);
 const errors=[],cleanup=installWorkshopInput(root,{onPlace,onError:error=>errors.push(error)});
 const emit=(host,type,props={})=>{const e=new Event(type,{cancelable:true});for(const [key,value]of Object.entries({pointerId:1,button:0,isPrimary:true,clientX:100,clientY:100,...props}))Object.defineProperty(e,key,{value});host.dispatchEvent(e);return e;};
 const down=(props={})=>emit(root,'pointerdown',{target:toy,...props});
 return {root,scene,toy,target,win,doc,cleanup,errors,emit,down};
}

test('a tap keeps native button activation and does not capture or place',()=>{
 const calls=[],s=setup((...args)=>calls.push(args));
 s.down();assert.equal(s.root.capture,undefined);
 s.emit(s.win,'pointermove',{clientX:104,clientY:102});s.emit(s.win,'pointerup');
 assert.equal(s.emit(s.root,'click',{detail:1}).defaultPrevented,false);
 assert.deepEqual(calls,[]);assert.equal(s.doc.body.children.length,0);s.cleanup();
});

test('mouse and touch drags place exactly once at the actual pointer destination',async()=>{
 for(const pointerType of ['mouse','touch']){
  const calls=[],s=setup(async(...args)=>calls.push(args));s.doc.hit=s.target;
  s.down({pointerType});const movement=s.emit(s.win,'pointermove',{pointerType,clientX:160,clientY:190});
  assert.equal(movement.defaultPrevented,true);assert.equal(s.root.capture,1);
  assert.equal(s.scene.classList.contains('is-dragging'),true);assert.equal(s.target.classList.contains('is-drop-target'),true);
  assert.equal(s.doc.body.children.length,1);
  // Touch implicitly captures the source before explicit capture moves to root.
  s.emit(s.root,'lostpointercapture',{target:s.toy});assert.equal(s.doc.body.children.length,1);
  s.emit(s.win,'pointerup',{pointerType,clientX:160,clientY:190});
  assert.deepEqual(calls,[['boat','water']]);assert.equal(s.doc.activeElement,s.target);
  assert.equal(s.doc.body.children.length,0);assert.equal(s.target.classList.contains('is-drop-target'),false);
  assert.equal(s.emit(s.root,'click',{detail:0}).defaultPrevented,false);
  assert.equal(s.emit(s.root,'click',{detail:1}).defaultPrevented,true);
  s.emit(s.win,'pointerup');assert.equal(calls.length,1);s.cleanup();
 }
});

test('release outside a destination does not place and returns focus to the toy',()=>{
 const calls=[],s=setup((...args)=>calls.push(args));s.doc.hit=s.target;s.down();s.emit(s.win,'pointermove',{clientX:140});
 s.doc.hit=null;s.emit(s.win,'pointerup',{clientX:140});
 assert.deepEqual(calls,[]);assert.equal(s.doc.activeElement,s.toy);assert.equal(s.doc.body.children.length,0);s.cleanup();
});

test('cancel, blur, Escape, navigation and disposal leave no ghost or placement',()=>{
 for(const reason of ['pointercancel','blur','Escape','navigation','capturelost','dispose']){
  const calls=[],s=setup((...args)=>calls.push(args));s.doc.hit=s.target;s.down();s.emit(s.win,'pointermove',{clientX:140});
  if(reason==='dispose')s.cleanup();
  else if(reason==='navigation'){s.toy.isConnected=false;s.emit(s.win,'pointermove',{clientX:150});}
  else if(reason==='Escape')s.emit(s.win,'keydown',{key:'Escape'});
  else if(reason==='capturelost')s.emit(s.root,'lostpointercapture');
  else s.emit(s.win,reason);
  s.emit(s.win,'pointerup');assert.deepEqual(calls,[],reason);assert.equal(s.doc.body.children.length,0,reason);
  assert.equal(s.scene.classList.contains('is-dragging'),false,reason);assert.equal(s.root.capture,null,reason);s.cleanup();
 }
});

test('extra pointers and non-toy scrolling do not start or interrupt a drag',()=>{
 const s=setup();s.emit(s.root,'pointerdown',{target:s.scene});
 assert.equal(s.emit(s.win,'pointermove',{clientX:140}).defaultPrevented,false);
 s.down({isPrimary:false});s.emit(s.win,'pointermove',{clientX:140});assert.equal(s.doc.body.children.length,0);
 s.down();s.emit(s.win,'pointermove',{pointerId:2,clientX:140});assert.equal(s.doc.body.children.length,0);
 s.emit(s.win,'pointercancel',{pointerId:0});
 s.emit(s.win,'pointermove',{clientX:-20,clientY:900});
 assert.equal(s.doc.body.children[0].style.transform,'translate(4px,624px)');s.cleanup();
});

test('async persistence failures reach application error handling without leaving dragging state',async()=>{
 const failure=new Error('write failed'),s=setup(async()=>{throw failure;});s.doc.hit=s.target;
 s.down();s.emit(s.win,'pointermove',{clientX:140});s.emit(s.win,'pointerup');
 await Promise.resolve();assert.deepEqual(s.errors,[failure]);assert.equal(s.doc.body.children.length,0);s.cleanup();
});
