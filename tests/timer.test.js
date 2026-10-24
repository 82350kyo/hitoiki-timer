import test from 'node:test';
import assert from 'node:assert/strict';
import {remaining,sectorPath,restore} from '../timer.js';
test('background time uses deadline, not interval count',()=>{const s={running:true,endAt:100000};assert.equal(remaining(s,1000),99000);assert.equal(remaining(s,99000),1000);assert.equal(remaining(s,150000),0);});
test('pause preserves remaining time',()=>{assert.equal(remaining({running:false,remaining:23000},999999),23000);});
test('sector is empty at zero, half at 50%, full at 100%',()=>{assert.equal(sectorPath(0),'');assert.match(sectorPath(.5),/A 148 148 0 0 1 200/);assert.equal((sectorPath(1).match(/A /g)||[]).length,2);assert.equal(sectorPath(2),sectorPath(1));});
test('invalid or corrupted persistence is ignored',()=>{assert.equal(restore('{'),null);assert.equal(restore('{}'),null);const s={scale:60,minutes:25,mode:'focus',remaining:1000,running:false};assert.deepEqual(restore(JSON.stringify(s)),s);assert.equal(restore(JSON.stringify({...s,minutes:90})),null);assert.equal(restore(JSON.stringify({...s,remaining:-1})),null);});
