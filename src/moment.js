import {MODEL} from './model.js';
// Presentation of one instant of the deterministic run. Everything here is derived from model samples; nothing is simulated twice.
export const DISPLAY_SPEED=.2,ENCODER_MARKS=16;
export const PHASES=Object.freeze([{id:'spinup',label:'Spin-up',from:0,to:MODEL.loadStart},{id:'load',label:'Load on',from:MODEL.loadStart,to:MODEL.loadEnd},{id:'release',label:'Load off',from:MODEL.loadEnd,to:MODEL.duration}]);
export const phaseAt=t=>PHASES.find(p=>t<p.to)||PHASES.at(-1);
export const sampleAt=(samples,t)=>samples[Math.max(0,Math.min(samples.length-1,Math.round(t/MODEL.dt)))];
// Marks passing the pickup each second on the schematic 16-mark encoder disc at real speed.
export const marksPerSecond=rpm=>rpm/60*ENCODER_MARKS;
// Before a run nothing disturbs either motor, so both strategies settle at the same no-load speed.
export function previewState({target,limit}){const drive=Math.min(target/MODEL.gain,limit);return {speed:MODEL.gain*drive,drive,saturated:target/MODEL.gain>limit+1e-9};}
// offset is the display angle each wheel had when the run started: a number for both, or {fixed,feedback}.
export function mechanismFrame(sample,{offset=0,target,limit=1}){
 const braking=sample.load>0,from=key=>typeof offset==='number'?offset:offset[key]||0;
 return {t:sample.t,load:sample.load,error:target-sample.feedback,rigs:{
  fixed:{angle:from('fixed')+sample.fAngle*DISPLAY_SPEED,speed:sample.fixed,drive:sample.uf,saturated:target/MODEL.gain>limit+1e-9,braking},
  feedback:{angle:from('feedback')+sample.bAngle*DISPLAY_SPEED,speed:sample.feedback,drive:sample.ub,saturated:sample.saturated,braking}}};
}
export function previewFrame({target,limit,angle=0}){const p=previewState({target,limit}),rig=key=>({angle:typeof angle==='number'?angle:angle[key]||0,speed:p.speed,drive:p.drive,saturated:p.saturated,braking:false});return {t:0,load:0,error:target-p.speed,rigs:{fixed:rig('fixed'),feedback:rig('feedback')}};}
const fmt=n=>n.toFixed(1),pct=u=>`${Math.round(u*100)}%`,signed=n=>Math.abs(n)<.05?'0.0':`${n<0?'−':'+'}${Math.abs(n).toFixed(1)}`;
export function describe({mode,sample,target,load,limit,metrics}){
 if(mode==='preview'){const p=previewState({target,limit});return {phase:null,title:'No-load preview',text:p.saturated?`With no load, ${pct(limit)} drive gives at most ${fmt(p.speed)} rpm, below the ${target} rpm target. The load test has not started.`:`With no load, both motors hold ${fmt(p.speed)} rpm on ${pct(p.drive)} drive. The load test has not started.`};}
 if(mode==='done')return {phase:null,title:'Run complete',text:`In the last second of load, fixed averaged ${fmt(metrics.fixedLoaded)} rpm and feedback ${fmt(metrics.feedbackLoaded)} rpm; loaded capacity was ${metrics.availableLoaded.toFixed(0)} rpm. Drag the timeline to revisit any moment.`};
 const phase=phaseAt(sample.t),error=target-sample.feedback,fb=`Feedback measures ${fmt(sample.feedback)} rpm (error ${signed(error)}) and applies ${pct(sample.ub)}${sample.saturated?', its ceiling: no more drive is available':''}.`;
 const title=`${phase.label} · ${phase.from}–${phase.to} s`;
 if(phase.id==='spinup')return {phase,title,text:`Both motors start from rest. Fixed applies ${pct(sample.uf)} drive throughout. ${fb}`};
 if(phase.id==='load')return {phase,title,text:load>0?`The same load drags both wheels. Fixed keeps ${pct(sample.uf)} drive and turns at ${fmt(sample.fixed)} rpm. ${fb}`:`Load strength is 0, so nothing is applied from 4 to 9 s. ${fb}`};
 return {phase,title,text:`The load is gone. Fixed returns toward ${fmt(MODEL.gain*sample.uf)} rpm on the same ${pct(sample.uf)} drive. ${fb}`};
}
// The control-loop equation with this instant's numbers.
export function loopText({mode,sample,target,limit}){
 if(mode==='preview'){const p=previewState({target,limit});return `No load yet: target ${target} − measured ${fmt(p.speed)} = error ${signed(target-p.speed)} rpm → drive ${pct(p.drive)}.`;}
 return `At ${sample.t.toFixed(2)} s: target ${target} − measured ${fmt(sample.feedback)} = error ${signed(target-sample.feedback)} rpm → PI drive ${pct(sample.ub)}${sample.saturated?` (at the ${pct(limit)} ceiling)`:''}. The fixed command stays at ${pct(sample.uf)} and never reads the encoder.`;
}
