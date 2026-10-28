import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { accountLabel, accountHeader, accountView, entryChoices, googleButton } from '../src/identity-view.js';

const local={id:'local',name:'Hà',updatedAt:'2026-10-27T01:00:00Z'};
const linked={...local,id:'linked',cloudOwnerUid:'mine'};
const signedIn={configured:true,uid:'mine',approved:true,state:'ready'};
const label=(status={},profile=local)=>accountLabel({status,profile});

test('identity distinguishes device learner, Google identity and confirmed per-learner save',()=>{
 assert.equal(label().tone,'guest');
 assert.equal(label(signedIn).tone,'local');
 assert.equal(label(signedIn,linked).tone,'linked');
 assert.equal(label({...signedIn,code:'cloud/sync-complete'},linked).tone,'linked');
 const saved={...signedIn,syncedProfileId:linked.id,syncedAt:'2026-10-27T02:00:00Z'};
 assert.equal(label(saved,linked).tone,'saved');
 assert.equal(label({...saved,syncedProfileId:'other'},linked).tone,'linked');
 assert.equal(label({...saved,dirty:true},linked).tone,'linked');
 assert.equal(label({...saved,dirtyProfileIds:['linked']},linked).tone,'linked');
 assert.equal(label(saved,{...linked,updatedAt:'2026-10-27T03:00:00Z'}).tone,'linked');
 assert.equal(label({...saved,online:false},linked).tone,'offline');
 assert.equal(label({...signedIn,state:'syncing',syncingProfileId:'linked'},linked).tone,'syncing');
 assert.equal(label({...signedIn,state:'syncing',syncingProfileId:'other'},linked).tone,'linked');
});

test('restoring, pending and blocked identities never imply cloud saving',()=>{
 assert.equal(label({state:'restoring-session'}).tone,'checking');
 assert.equal(label({state:'checking-access',uid:'mine'}).tone,'checking');
 assert.equal(label({uid:'mine',state:'pending'}).tone,'pending');
 assert.equal(label({uid:'mine',state:'access-error'}).tone,'pending');
 assert.equal(label({uid:'mine',state:'blocked'}).tone,'blocked');
 assert.equal(label({uid:'different',approved:true},linked).tone,'other-account');
});

test('entry offers a single Google action only when signed out and configured',()=>{
 const guest=entryChoices({status:{configured:true},resume:local});
 assert.equal((guest.match(/data-action="cloud-signin"/g)||[]).length,1);
 assert.match(guest,/data-action="choose-profile" data-id="local"/);
 assert.match(guest,/Guest play saves on this device/);
 for(const status of [signedIn,{configured:true,state:'restoring-session'},{configured:false}])
  assert.doesNotMatch(entryChoices({status,resume:local}),/data-action="cloud-signin"/);
 assert.doesNotMatch(entryChoices({status:{configured:true},resume:linked}),/data-id="linked"/);
});

test('account page and header hide another account learner and escape names',()=>{
 const privateLearner={...linked,id:'private',name:'Secret Name',cloudOwnerUid:'other'};
 const bad={...local,name:'<img src=x onerror=alert(1)>',id:'a" data-injected="yes'};
 const html=accountView({status:signedIn,profile:local,profiles:[local,linked,privateLearner,bad],cloudHtml:'<section id="trusted-cloud"></section>'});
 assert.doesNotMatch(html,/Secret Name|data-id="private"|<img src=x|data-injected="yes"/);
 assert.match(html,/&lt;img/);
 assert.match(html,/Guests on this device/);
 assert.match(html,/id="trusted-cloud"/);
 assert.doesNotMatch(accountHeader({status:signedIn,profile:privateLearner}),/Secret Name/);
 const header=accountHeader({status:{},profile:local});
 assert.match(header,/data-action="account"/);
 assert.doesNotMatch(header,/aria-haspopup|aria-expanded/);
});

test('Vietnamese identity guidance is native Unicode and independent of experience mode',()=>{
 const vi=accountView({language:'vi',profiles:[local]});
 assert.match(vi,/Tài khoản và người học/);
 assert.match(vi,/Khách trên thiết bị này/);
 assert.equal(vi,vi.normalize('NFC'));
 assert.match(googleButton({language:'vi'}),/Đăng nhập bằng Google/);
 assert.throws(()=>googleButton({action:'" onclick=evil'}),/Unsupported/);
 assert.match(googleButton({label:'<unsafe>'}),/&lt;unsafe&gt;/);
});

test('Google asset preserves the exact official gradient artwork and aspect ratio',()=>{
 const svg=readFileSync(new URL('../assets/google-g.svg',import.meta.url),'utf8');
 assert.match(svg,/viewBox="0 0 200 204"/);
 assert.doesNotMatch(svg,/foreignObject|<script|https?:\/\/(?!www\.w3\.org)/);
 const bytes=Buffer.from(svg.match(/base64,([^"']+)/)[1],'base64');
 assert.equal(createHash('sha256').update(bytes).digest('hex'),'d1ce9c2af0b10a7333abc99bc706f9a6a199e5b65bf3e3009624f076b8638e6a');
 assert.equal(bytes.readUInt32BE(16),200);assert.equal(bytes.readUInt32BE(20),204);
});
