import test from 'node:test';import assert from 'node:assert/strict';
import {storedMotion,isStill,toggledMotion,motionNote} from '../src/motion.js';
test('records saved before the motion setting keep a saved still view',()=>{
 assert.equal(storedMotion({version:1,reduced:true,elapsed:9.47}),'still');
 assert.equal(storedMotion({version:1,reduced:false}),'auto');assert.equal(storedMotion(null),'auto');
 assert.equal(storedMotion({motion:'on',reduced:true}),'on');assert.equal(storedMotion({motion:'nonsense',reduced:false}),'auto');
});
test('auto follows the system; explicit choices win; the state is explained',()=>{
 assert.equal(isStill('auto',true),true);assert.equal(isStill('auto',false),false);assert.equal(isStill('on',true),false);assert.equal(isStill('still',false),true);
 assert.match(motionNote('auto',true),/system/);assert.match(motionNote('still',false),/saved on this device/);assert.equal(motionNote('auto',false),'');assert.equal(motionNote('on',true),'');
});
test('toggling twice returns to following the system',()=>{
 for(const system of [true,false]){const once=toggledMotion('auto',system);assert.equal(isStill(once,system),!system);assert.equal(toggledMotion(once,system),'auto');}
 assert.equal(toggledMotion('still',false),'auto');assert.equal(toggledMotion('on',true),'auto');
});
