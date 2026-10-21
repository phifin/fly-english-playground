import test from 'node:test';
import assert from 'node:assert/strict';
import {validatePack,contentHash} from '../scripts/content.mjs';
test('content validation fails closed on malformed top-level data',()=>{for(const p of [null,[],{}, {schemaVersion:2,batchId:'bad',missions:[],provenance:[]}])assert.ok(validatePack(p).length);});
test('content hashes bind actual record material and not a submitted approval',()=>{assert.notEqual(contentHash({prompt:'a'}),contentHash({prompt:'b'}));assert.ok(validatePack({schemaVersion:1,batchId:'test',approved:true,provenance:[],missions:[]}).some(e=>e.includes('unexpected field approved')));});
