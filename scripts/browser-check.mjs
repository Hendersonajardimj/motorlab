// Browser acceptance for a built MotorLab served under a subpath, e.g. `MOTOR_LAB_BASE=/motorlab npm start`.
// Usage: node scripts/browser-check.mjs http://127.0.0.1:4319/motorlab/ [evidence-dir]
// Needs playwright-core (or PLAYWRIGHT_CORE=/path/to/playwright-core) and a Chromium it can launch. Not part of `npm test`.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {simulate} from '../src/model.js';
import {sampleAt,phaseAt,DISPLAY_SPEED} from '../src/moment.js';
const {chromium}=await import(process.env.PLAYWRIGHT_CORE||'playwright-core');
const base=process.argv[2]||'http://127.0.0.1:4319/motorlab/',out=process.argv[3]||'browser-check';fs.mkdirSync(out,{recursive:true});
const KEY='motorlab-public-progress-v1',results=[];let failures=0;
const check=(name,ok,detail)=>{results.push({name,ok:!!ok,detail});if(!ok)failures++;console.log(`${ok?'PASS':'FAIL'} ${name}${detail!==undefined?' · '+JSON.stringify(detail):''}`);};
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex').slice(0,12);
async function open(name,{viewport={width:1280,height:720},reducedMotion='no-preference',seed,path='',video}={}){
 const ctx=await browser.newContext({viewport,reducedMotion,...(video?{recordVideo:{dir:out,size:viewport}}:{})});
 if(seed)await ctx.addInitScript(([k,v])=>{if(!sessionStorage.getItem('seeded')){localStorage.setItem(k,v);sessionStorage.setItem('seeded','1');}},[KEY,seed]);
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('requestfailed',r=>errors.push(`failed ${r.url()}`));
 const response=await page.goto(base+path,{waitUntil:'networkidle'});if(response.status()===200){await page.waitForSelector('#scene[data-mode]');await page.waitForFunction(()=>document.getElementById('run').textContent.trim()!=='');}await page.waitForTimeout(600);return {ctx,page,errors,response};
}
const scene=page=>page.$eval('#scene',e=>({...e.dataset}));
async function canvasHashes(page,n=4,gap=400){const hs=[];for(let i=0;i<n;i++){const el=await page.$('#scene canvas, #scene svg');hs.push(hash(await el.screenshot()));await page.waitForTimeout(gap);}return hs;}
const inView=(page,sel)=>page.$eval(sel,e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth;});
const overflow=page=>page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
async function predict(page){await page.click('[data-step="1"]');await page.selectOption('#pred-fixed','drop');await page.selectOption('#pred-feedback','recover');await page.click('#record-prediction');}
const until=(page,t)=>page.waitForFunction(t=>Number(document.getElementById('scene').dataset.t)>=t,t,{timeout:40000});
const num=s=>parseFloat(String(s).replace('−','-').replace(/^[^0-9+-]+/,''));
const run=simulate({target:100,load:45,limit:1});

// 1. Fresh desktop visit: the mechanism moves at once and the next action is visible.
{const {ctx,page,errors}=await open('fresh');
 const s0=await scene(page),hs=await canvasHashes(page),s1=await scene(page);
 check('fresh: WebGL scene',s0.mode==='webgl',s0.mode);
 check('fresh: no-load preview moves (canvas changes)',new Set(hs).size>=3,hs);
 check('fresh: wheel angle advances in preview',Number(s1.wheelAngle)!==Number(s0.wheelAngle),[s0.wheelAngle,s1.wheelAngle]);
 check('fresh: caption says no-load preview',(await page.textContent('#caption-title'))==='No-load preview');
 check('fresh: next action visible in first viewport',await inView(page,'#run'),await page.textContent('#run'));
 check('fresh: next action is to predict',/prediction first/i.test(await page.textContent('#run')));
 await page.screenshot({path:`${out}/01-fresh-1280.png`});
 await page.click('#run');
 check('fresh: prediction button opens step 02 and focuses the first choice',(await page.textContent('#step-label')).startsWith('02')&&await page.evaluate(()=>document.activeElement.id)==='pred-fixed');
 await page.selectOption('#pred-fixed','drop');await page.selectOption('#pred-feedback','recover');await page.click('#record-prediction');
 check('run: button ready after prediction',/Run load test/.test(await page.textContent('#run')));
 await page.click('#run');await page.waitForTimeout(900);
 check('run: status Running',(await page.textContent('#run-status'))==='Running');
 const r1=await canvasHashes(page,3,250);check('run: mechanism frames change while running',new Set(r1).size>=3,r1);
 await until(page,4.3);await page.click('#run');await page.waitForTimeout(700);
 const p=await scene(page),t=Number(p.t),smp=sampleAt(run.samples,t);
 const shown=await page.evaluate(()=>({time:document.getElementById('time').textContent,fixed:document.getElementById('fixed-speed').textContent,feedback:document.getElementById('feedback-speed').textContent,fd:document.getElementById('fixed-drive').textContent,bd:document.getElementById('feedback-drive').textContent,load:document.getElementById('load-now').textContent,status:document.getElementById('run-status').textContent,title:document.getElementById('caption-title').textContent,run:document.getElementById('run').textContent,timeline:document.getElementById('timeline').value,path:document.querySelector('#plot path[stroke="#31816a"]')?.getAttribute('d').length}));
 check('pause: status and button',/^Paused at/.test(shown.status)&&/Resume/.test(shown.run),shown);
 check('pause: readouts equal the model sample at the shown time',Math.abs(num(shown.fixed)-smp.fixed)<.06&&Math.abs(num(shown.feedback)-smp.feedback)<.06&&parseFloat(shown.time)===Number(t.toFixed(2)),{t,fixed:smp.fixed.toFixed(2),feedback:smp.feedback.toFixed(2),shown});
 check('pause: drive readouts equal model drive',num(shown.fd)===Math.round(smp.uf*100)&&num(shown.bd)===Math.round(smp.ub*100),{uf:smp.uf,ub:smp.ub});
 const loaded=t>=4&&t<9;check('pause: phase, brake and load match the model',p.braking===String(loaded)&&num(shown.load)===smp.load&&shown.title.includes(phaseAt(t).label),{t,braking:p.braking,title:shown.title});
 check('pause: timeline follows time',Math.abs(Number(shown.timeline)-t)<.06,shown.timeline);
 const ph=await canvasHashes(page,3,400);check('pause: mechanism holds still',new Set(ph).size===1,ph);
 await page.screenshot({path:`${out}/02-paused-load-1280.png`});
 // Keyboard scrubbing: the mechanism angle difference equals the model's angle difference.
 // The range input snaps to 0.1 s steps; the shown time can sit up to one step inside that.
 const settled=async()=>{await page.waitForTimeout(150);await page.waitForFunction(()=>Math.abs(Number(document.getElementById('scene').dataset.t)-Number(document.getElementById('timeline').value))<.051&&document.getElementById('time').textContent.startsWith(document.getElementById('scene').dataset.t),null,{timeout:10000});return scene(page);};
 await page.focus('#timeline');await page.keyboard.press('Home');const a0=await settled();
 for(let i=0;i<30;i++)await page.keyboard.press('ArrowRight');const a1=await settled();
 const expected=(sampleAt(run.samples,Number(a1.t)).bAngle-sampleAt(run.samples,Number(a0.t)).bAngle)*DISPLAY_SPEED;
 check('scrub: keyboard moves time within the revealed run',Number(a0.t)===0&&Math.abs(Number(a1.t)-3)<.06,[a0.t,a1.t]);
 check('scrub: wheel angle change equals the model angle change',Math.abs((Number(a1.wheelAngle)-Number(a0.wheelAngle))-expected)<.01,{shown:Number(a1.wheelAngle)-Number(a0.wheelAngle),expected});
 for(let i=0;i<120;i++)await page.keyboard.press('ArrowRight');const a2=await settled();
 check('scrub: cannot run ahead of the revealed time',Math.abs(Number(a2.t)-t)<.06,[a2.t,t]);
 // Keyboard play: Space on the focused run button resumes; finish the run.
 await page.focus('#run');await page.keyboard.press('Space');await page.waitForTimeout(400);
 check('keyboard: Space on Run resumes',(await page.textContent('#run-status'))==='Running');
 await page.waitForFunction(()=>document.getElementById('run-status').textContent==='Run complete',null,{timeout:30000});
 const done=await page.evaluate(k=>({run:document.getElementById('run').textContent,title:document.getElementById('caption-title').textContent,result:document.getElementById('result').textContent,stored:JSON.parse(localStorage.getItem(k))}),KEY);
 check('finish: complete state, evidence, one recorded attempt',/Run again/.test(done.run)&&done.title==='Run complete'&&/Fixed: 55\.0 rpm/.test(done.result)&&done.stored.attempts.length===1&&done.stored.finished===true,{run:done.run,attempts:done.stored.attempts.length});
 const graphPoints=await page.$eval('#plot path[stroke="#31816a"]',e=>e.getAttribute('d').split('L').length);check('finish: graph holds the full run',graphPoints>=290,graphPoints);
 await page.screenshot({path:`${out}/03-complete-1280.png`});
 await page.locator('.plot-card').screenshot({path:`${out}/03b-graph-complete.png`});await page.locator('.schematic-card').screenshot({path:`${out}/03c-loop-complete.png`});
 await page.click('#reset');await page.waitForTimeout(500);
 check('reset: back to preview with prediction kept',(await page.textContent('#caption-title'))==='No-load preview'&&/Run load test/.test(await page.textContent('#run'))&&(await page.textContent('#time')).startsWith('0.00'));
 // Tab order reaches the motion toggle, the scene and the transport.
 await page.focus('#still');const order=[];for(let i=0;i<4;i++){await page.keyboard.press('Tab');order.push(await page.evaluate(()=>document.activeElement.id||document.activeElement.textContent.trim()));}
 check('keyboard: still → scene → run (reset and timeline are disabled in preview)',order[0]==='scene'&&order[1]==='run',order);
 check('fresh journey: no console errors',errors.length===0,errors);await ctx.close();}

// 2. System reduced motion: still by default, experiment still works, motion can be chosen.
{const {ctx,page,errors}=await open('reduced',{reducedMotion:'reduce'});
 const st=await page.evaluate(()=>({pressed:document.getElementById('still').getAttribute('aria-pressed'),note:document.getElementById('motion-note').hidden?'':document.getElementById('motion-note').textContent}));
 check('reduced: still view on from the system setting',st.pressed==='true'&&/system/.test(st.note),st);
 const hs=await canvasHashes(page,3,400);check('reduced: preview does not move',new Set(hs).size===1,hs);
 await predict(page);await page.click('#run');await until(page,4.6);
 const s=await scene(page);check('reduced: run advances; wheels stay put; brake still shows load',Number(s.t)>4.5&&s.wheelAngle==='0.000'&&s.braking==='true',s);
 check('reduced: graph and readouts update',num(await page.textContent('#fixed-speed'))<99,await page.textContent('#fixed-speed'));
 await page.screenshot({path:`${out}/04-reduced-running-1280.png`});
 await page.click('#motion-on');await page.waitForTimeout(600);const m0=await scene(page);await page.waitForTimeout(500);const m1=await scene(page);
 check('reduced: Show motion overrides for this device',(await page.getAttribute('#still','aria-pressed'))==='false'&&m0.wheelAngle!==m1.wheelAngle&&(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).motion,KEY))==='on',[m0.wheelAngle,m1.wheelAngle]);
 check('reduced: no console errors',errors.length===0,errors);await ctx.close();}

// 3. Restored record saved by the published version with Still view on, paused at 9.47 s (as seen on Joshua's Mac).
const legacy={version:1,step:2,target:100,load:45,limit:1,predFixed:'drop',predFeedback:'recover',predictionSnapshot:{fixed:'drop',feedback:'recover',target:100,load:45,limit:1,at:'2026-10-10T21:30:00.000Z'},elapsed:9.47,finished:false,attempts:[],cause:'',action:'',limits:'',transfer:'',note:'kept note',assessment:null,scroll:[0,0,0,0],reduced:true,updated:'2026-10-10T21:31:00.000Z'};
{const raw=JSON.stringify(legacy),{ctx,page,errors}=await open('restored',{seed:raw});
 const st=await page.evaluate(k=>({backup:localStorage.getItem(k+'-before-motion-setting'),stored:JSON.parse(localStorage.getItem(k)),pressed:document.getElementById('still').getAttribute('aria-pressed'),note:document.getElementById('motion-note').textContent,run:document.getElementById('run').textContent,title:document.getElementById('caption-title').textContent,time:document.getElementById('time').textContent,mq:matchMedia('(prefers-reduced-motion: reduce)').matches}),KEY);
 check('restored: untouched copy of the original record kept',st.backup===raw);
 const kept=['step','elapsed','predictionSnapshot','note','attempts','target','load','limit'].every(k=>JSON.stringify(st.stored[k])===JSON.stringify(legacy[k]));
 check('restored: progress preserved and saved still view respected',kept&&st.stored.motion==='still'&&st.pressed==='true'&&!st.mq,{motion:st.stored.motion});
 check('restored: state and next action are explicit',/saved on this device/.test(st.note)&&/Resume/.test(st.run)&&/Paused · Load off/.test(st.title)&&st.time.startsWith('9.47'),st);
 check('restored: Resume and Show motion in first viewport',await inView(page,'#run')&&await inView(page,'#motion-on'));
 await page.screenshot({path:`${out}/05-restored-still-1280.png`});
 await page.click('#motion-on');await page.click('#run');await page.waitForTimeout(400);const a=await scene(page);await page.waitForTimeout(500);const b=await scene(page);
 check('restored: after Show motion, resume turns the wheels',a.wheelAngle!==b.wheelAngle&&Number(b.t)>9.47,[a,b].map(s=>[s.t,s.wheelAngle]));
 check('restored: no console errors',errors.length===0,errors);await ctx.close();}

// 4. Forced 2D fallback.
{const {ctx,page,errors}=await open('fallback',{path:'?fallback=1'});
 const s0=await scene(page);await page.waitForTimeout(600);const s1=await scene(page);
 check('fallback: 2D view, preview turns',s0.mode==='fallback'&&s0.wheelAngle!==s1.wheelAngle,[s0.wheelAngle,s1.wheelAngle]);
 await predict(page);await page.click('#run');await until(page,4.5);await page.click('#run');await page.waitForTimeout(200);
 const s=await scene(page);check('fallback: run works, brake shown',s.braking==='true'&&await page.$eval('[data-rig="fixed"]',g=>g.classList.contains('braking')),s);
 await page.screenshot({path:`${out}/06-fallback-1280.png`});
 await page.click('#still');await page.waitForTimeout(100);check('fallback: still view stops rotation',(await scene(page)).wheelAngle==='0.000');
 check('fallback: no console errors',errors.length===0,errors);await ctx.close();}

// 5. Widths.
for(const [w,h] of [[390,844],[1024,768],[1440,900]]){const {ctx,page,errors}=await open(`w${w}`,{viewport:{width:w,height:h}});
 check(`${w}px: no horizontal overflow`,await overflow(page)<=0,await overflow(page));
 const tags=await page.$$eval('.rig-tag',els=>els.map(e=>{const r=e.getBoundingClientRect(),s=document.getElementById('scene').getBoundingClientRect();return r.left>=s.left-1&&r.right<=s.right+1&&r.top>=s.top-1&&r.bottom<=s.bottom+1;}));
 check(`${w}px: rig tags inside the scene`,tags.length===2&&tags.every(Boolean),tags);
 await page.screenshot({path:`${out}/07-fresh-${w}.png`});
 if(w===390){await predict(page);await page.click('#goto-run');await page.waitForFunction(()=>{const r=document.getElementById('run').getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;},null,{timeout:3000}).catch(()=>{});check('390px: step 03 link brings Run into view and focus',await inView(page,'#run')&&await page.evaluate(()=>document.activeElement.id)==='run');await page.keyboard.press('Enter');await until(page,5.2);await page.click('#run');await page.waitForTimeout(300);await page.screenshot({path:`${out}/08-paused-390.png`,fullPage:false});check('390px: run and pause',/Paused/.test(await page.textContent('#run-status')));}
 check(`${w}px: no console errors`,errors.length===0,errors);await ctx.close();}

// 6. Direct GitHub Pages-style subpath URLs.
{const ctx=await browser.newContext(),page=await ctx.newPage(),root=base.replace(/\/$/,'');
 for(const path of ['','index.html','?fallback=1','index.html?fallback=1','#lesson']){const r=await page.goto(base+path,{waitUntil:'networkidle'});const mode=await page.$eval('#scene',e=>e.dataset.mode);check(`url ${base+path}: ${r.status()} ${mode}`,r.status()===200&&mode===(path.includes('fallback')?'fallback':'webgl'));}
 const r=await page.goto(root,{waitUntil:'networkidle'});check(`url ${root} (no slash) lands on the lesson`,r.status()===200&&page.url()===base,page.url());
 const assets=await page.evaluate(()=>[...document.querySelectorAll('script[src],link[rel=stylesheet]')].map(e=>e.getAttribute('src')||e.getAttribute('href')));check('assets: relative and versioned',assets.every(a=>/^\.\/[\w-]+\.(js|css)\?v=[0-9a-f]{10}$/.test(a)),assets);
 const nf=await page.goto(base+'no-such-page',{waitUntil:'networkidle'});const home=await page.getAttribute('#home','href');check('missing path: 404 page links back to the lesson',nf.status()===404&&new URL(home,page.url()).href===base,{status:nf.status(),home});
 await page.click('#home');await page.waitForLoadState('networkidle');check('missing path: link opens the lesson',page.url()===base&&await page.$('#scene')!==null,page.url());
 await ctx.close();}
await browser.close();
fs.writeFileSync(`${out}/results.json`,JSON.stringify({base,at:new Date().toISOString(),passed:results.filter(r=>r.ok).length,failed:failures,results},null,2));
console.log(`${results.length-failures}/${results.length} passed`);process.exit(failures?1:0);
