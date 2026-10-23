import test from 'node:test';import assert from 'node:assert/strict';
import {simulate,MODEL} from '../src/model.js';import {phaseAt,sampleAt,mechanismFrame,previewFrame,describe,loopText,marksPerSecond,DISPLAY_SPEED} from '../src/moment.js';
test('phases switch exactly when the model applies and removes the load',()=>{
 const {samples}=simulate();
 for(const t of [0,3.99,4,8.99,9,12]){const s=sampleAt(samples,t);assert.equal(s.t,t);assert.equal(phaseAt(t).id==='load',s.load>0,`t=${t}`);}
 assert.equal(phaseAt(12).id,'release');
});
test('mechanism frames are the model sample: speed, drive, brake and angle',()=>{
 const run=simulate(),offset=1.3;
 for(const t of [.5,5,8.5,10]){const s=sampleAt(run.samples,t),f=mechanismFrame(s,{offset,target:100,limit:1});
  assert.equal(f.rigs.fixed.speed,s.fixed);assert.equal(f.rigs.feedback.speed,s.feedback);assert.equal(f.rigs.fixed.drive,s.uf);assert.equal(f.rigs.feedback.drive,s.ub);
  assert.equal(f.rigs.fixed.braking,s.load>0);assert.equal(f.rigs.feedback.braking,s.load>0);assert.equal(f.error,100-s.feedback);
  assert.equal(f.rigs.feedback.angle,offset+s.bAngle*DISPLAY_SPEED);assert.equal(f.rigs.fixed.angle,offset+s.fAngle*DISPLAY_SPEED);}
 // Under load the loaded fixed wheel turns less between frames than the feedback wheel.
 const a=mechanismFrame(sampleAt(run.samples,8),{target:100,limit:1}),b=mechanismFrame(sampleAt(run.samples,9),{target:100,limit:1});
 assert.ok(b.rigs.feedback.angle-a.rigs.feedback.angle>(b.rigs.fixed.angle-a.rigs.fixed.angle)*1.5);
});
test('saturation is reported on the rig that hits the ceiling',()=>{
 const run=simulate({target:160,load:70,limit:.8}),f=mechanismFrame(sampleAt(run.samples,8.5),{target:160,limit:.8});
 assert.equal(f.rigs.feedback.saturated,true);assert.equal(f.rigs.feedback.drive,.8);
 // The fixed command asks for exactly 0.80 here, so it sits at the ceiling without being clipped; at 180 rpm it is clipped.
 assert.equal(f.rigs.fixed.saturated,false);assert.equal(mechanismFrame(sampleAt(simulate({target:180,load:70,limit:.8}).samples,8.5),{target:180,limit:.8}).rigs.fixed.saturated,true);
 const ok=mechanismFrame(sampleAt(simulate().samples,8.5),{target:100,limit:1});assert.equal(ok.rigs.feedback.saturated,false);assert.equal(ok.rigs.fixed.saturated,false);
});
test('the no-load preview is the model steady state, identical for both strategies',()=>{
 const p=previewFrame({target:100,limit:1,angle:.4});assert.deepEqual(p.rigs.fixed,p.rigs.feedback);assert.equal(p.rigs.fixed.speed,100);assert.equal(p.rigs.fixed.drive,.5);assert.equal(p.rigs.fixed.braking,false);
 const run=simulate({target:80,load:0});assert.ok(Math.abs(run.samples.at(-1).fixed-previewFrame({target:80,limit:1}).rigs.fixed.speed)<.1);
 const capped=previewFrame({target:180,limit:.4});assert.equal(capped.rigs.fixed.speed,MODEL.gain*.4);assert.equal(capped.rigs.fixed.saturated,true);
});
test('captions state the numbers on screen and the ceiling only when it binds',()=>{
 const run=simulate(),s=sampleAt(run.samples,8.5),c=describe({mode:'run',sample:s,target:100,load:45,limit:1,metrics:run.metrics});
 assert.match(c.title,/^Load on · 4–9 s$/);assert.ok(c.text.includes(`Fixed keeps 50% drive and turns at ${s.fixed.toFixed(1)} rpm`));assert.ok(c.text.includes(`applies ${Math.round(s.ub*100)}%`));assert.ok(!/ceiling/.test(c.text));
 const sat=simulate({target:160,load:70,limit:.8}),cs=describe({mode:'run',sample:sampleAt(sat.samples,8.5),target:160,load:70,limit:.8,metrics:sat.metrics});assert.match(cs.text,/its ceiling: no more drive is available/);
 assert.match(describe({mode:'preview',target:180,limit:.4}).text,/at most 80\.0 rpm, below the 180 rpm target/);
 assert.match(describe({mode:'done',metrics:run.metrics}).text,/fixed averaged 55\.0 rpm and feedback 100\.2 rpm/);
 assert.match(describe({mode:'run',sample:sampleAt(simulate({load:0}).samples,6),target:100,load:0,limit:1,metrics:run.metrics}).text,/Load strength is 0/);
 assert.match(loopText({mode:'run',sample:s,target:100,limit:1}),/^At 8\.50 s: target 100 − measured 100\.2 = error −0\.2 rpm → PI drive 72%\. The fixed command stays at 50%/);
});
test('encoder marks per second scale with speed',()=>{assert.ok(Math.abs(marksPerSecond(100)-26.667)<.001);assert.ok(marksPerSecond(55)<marksPerSecond(100));});
