import test from 'node:test';
import assert from 'node:assert/strict';
import {motionAllowed,animateVisual} from '../src/motion.js';
test('motion respects OS preference, explicit preference, Eco and reduced data independently',()=>{
 assert.equal(motionAllowed(),true);
 for(const preference of [{motion:'reduced'},{quality:'eco'},{reduced:true},{saveData:true},{motion:'full',reduced:true}])assert.equal(motionAllowed(preference),false);
 assert.equal(motionAllowed({motion:'full',quality:'balanced'}),true);
});
test('visual enhancement is optional in non-browser or unsupported contexts',()=>{
 assert.equal(animateVisual(null,[]),null);
 assert.equal(animateVisual({},[]),null);
});
