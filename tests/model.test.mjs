import test from 'node:test';import assert from 'node:assert/strict';
import {simulate} from '../src/model.js';import {deterministicCoach} from '../src/coaching.js';
test('fixed drive approaches analytical loaded equilibrium; feedback rejects a feasible disturbance',()=>{
 const {metrics,samples}=simulate();
 assert.ok(Math.abs(metrics.fixedLoaded-55)<.2);
 assert.ok(Math.abs(metrics.feedbackLoaded-100)<1);
 assert.equal(samples.find(s=>s.t===4).load,45);assert.equal(samples.find(s=>s.t===9).load,0);
});
test('actuator saturation limits reachable speed and anti-windup recovers after the load',()=>{
 const {metrics,samples}=simulate({target:160,load:70,limit:.8});
 assert.equal(metrics.availableLoaded,90);assert.equal(metrics.reachable,false);
 assert.ok(Math.abs(metrics.feedbackLoaded-90)<1);assert.ok(metrics.saturatedSeconds>1.8);
 assert.ok(samples.every(s=>s.ub>=0&&s.ub<=.8&&Number.isFinite(s.feedback)));
 assert.ok(samples.at(-1).feedback<=161);
});
test('zero disturbance converges to the target and runs are reproducible',()=>{
 const a=simulate({target:80,load:0}),b=simulate({target:80,load:0});
 assert.deepEqual(a,b);assert.ok(Math.abs(a.samples.at(-1).feedback-80)<.1);
});
test('coaching requires causal choices and never pretends to evaluate prose',()=>{
 const metrics=simulate().metrics;
 assert.equal(deterministicCoach.assess({cause:'command',action:'error',limits:'bounded',transfer:'capacity',note:'looks good',metrics}).complete,false);
 const result=deterministicCoach.assess({cause:'load',action:'error',limits:'bounded',transfer:'capacity',note:'my explanation',metrics});
 assert.equal(result.complete,true);assert.equal(result.noteReviewed,false);
});
