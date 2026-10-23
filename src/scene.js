import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {ENCODER_MARKS} from './moment.js';
import {createSchematic,DESCRIPTIONS} from './schematic.js';
const RIGS=[['fixed','FIXED COMMAND',1.15,0xcc764c],['feedback','FEEDBACK',-1.15,0x5fae8a]];
// Two identical schematic assemblies driven by the same model run: only the control strategy differs.
export function createMechanism(host,{onPart,reduced=false,forceFallback=false}={}){
 let renderer;
 try{if(forceFallback)throw Error('Fallback requested');renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});}catch{return createSchematic(host,{onPart,reduced});}
 host.dataset.mode='webgl';renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0x000000,0);host.appendChild(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(28,1,.1,80);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=!reduced;controls.enablePan=false;controls.minDistance=4;controls.maxDistance=16;controls.maxPolarAngle=Math.PI*.85;
 const home=new THREE.Vector3(5.4,2.5,-2.0),target=new THREE.Vector3(-.1,-.15,0);let fitDistance=6.5;
 const reset=()=>{camera.position.copy(home).setLength(fitDistance).add(target);controls.target.copy(target);controls.update();};
 scene.add(new THREE.HemisphereLight(0xeaf3df,0x1c2928,2.1));const light=new THREE.DirectionalLight(0xfff0ca,3);light.position.set(2,5,4);scene.add(light);const rim=new THREE.DirectionalLight(0x89bb9b,2);rim.position.set(-4,1,-3);scene.add(rim);
 const mats={metal:new THREE.MeshStandardMaterial({color:0x9bafa1,metalness:.65,roughness:.38}),dark:new THREE.MeshStandardMaterial({color:0x405746,metalness:.4,roughness:.7}),gold:new THREE.MeshStandardMaterial({color:0xc8a267,metalness:.65,roughness:.42}),green:new THREE.MeshStandardMaterial({color:0x47735c,metalness:.25,roughness:.65}),rubber:new THREE.MeshStandardMaterial({color:0x25342a,roughness:.85}),pad:new THREE.MeshStandardMaterial({color:0x6b4b3a,roughness:.8})};
 const mesh=(geo,mat,group,x=0,y=0,z=0)=>{const o=new THREE.Mesh(geo,mat.clone());o.position.set(x,y,z);group.add(o);return o;};
 const cyl=(r,l,mat,group,x,y=0,z=0)=>{const o=mesh(new THREE.CylinderGeometry(r,r,l,48),mat,group,x,y,z);o.rotation.z=Math.PI/2;return o;};
 const rigs={},pickables=[];
 for(const [key,name,z,accent] of RIGS){
  const rig=new THREE.Group();rig.position.z=z;scene.add(rig);const groups={motor:new THREE.Group(),wheel:new THREE.Group(),encoder:new THREE.Group()};Object.values(groups).forEach(g=>rig.add(g));
  cyl(.59,1.28,mats.metal,groups.motor,-1.08);cyl(.55,.11,mats.dark,groups.motor,-1.78);cyl(.6,.09,mats.gold,groups.motor,-.4);
  for(let i=0;i<8;i++)cyl(.615,.025,mats.dark,groups.motor,-1.58+i*.14);
  mesh(new THREE.BoxGeometry(.95,.16,.78),mats.dark,groups.motor,-1.03,-.57,0);
  // Drive band: its glow follows the drive command, so a changing command is visible on the motor itself.
  const band=cyl(.63,.16,mats.dark,rig,-.62);band.material.emissive.set(0xffa860);band.userData.fixedEmissive=true;
  cyl(.09,2,mats.metal,rig,.28);groups.wheel.position.x=1.23;
  cyl(.68,.26,mats.rubber,groups.wheel,0);cyl(.54,.28,mats.dark,groups.wheel,0);cyl(.14,.34,mats.gold,groups.wheel,0);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;const spoke=mesh(new THREE.BoxGeometry(.3,.53,.045),mats.metal,groups.wheel,0,Math.sin(a)*.27,Math.cos(a)*.27);spoke.rotation.x=-a;}
  const marker=mesh(new THREE.BoxGeometry(.3,.12,.08),mats.gold,groups.wheel,0,.62,0);marker.material.color.set(accent);
  groups.encoder.position.x=.38;cyl(.37,.065,mats.gold,groups.encoder,0);
  for(let i=0;i<ENCODER_MARKS;i++){const a=i*Math.PI*2/ENCODER_MARKS;mesh(new THREE.BoxGeometry(.08,.045,.045),mats.dark,groups.encoder,.045,Math.sin(a)*.3,Math.cos(a)*.3);}
  mesh(new THREE.BoxGeometry(.18,.25,.42),mats.green,rig,.39,.54,0);const diode=mesh(new THREE.BoxGeometry(.05,.07,.1),mats.gold,rig,.49,.47,0);diode.userData.fixedEmissive=true;
  // Brake shoe: a picture of the load. It closes on the tyre while load is applied.
  const post=mesh(new THREE.BoxGeometry(.07,1.85,.07),mats.dark,rig,1.23,.125,.52);post.userData.fixedEmissive=true;
  const shoe=new THREE.Group();shoe.position.set(1.23,.9,0);rig.add(shoe);const arm=mesh(new THREE.BoxGeometry(.06,.06,.56),mats.dark,shoe,0,.12,.26);arm.userData.fixedEmissive=true;const pad=mesh(new THREE.BoxGeometry(.3,.09,.36),mats.pad,shoe,0,0,0);pad.userData.fixedEmissive=true;
  // Controller box. Only the feedback rig has the encoder cable back to it; the fixed command never reads the encoder.
  const box=mesh(new THREE.BoxGeometry(.5,.26,.36),mats.dark,rig,-.25,-.64,-.48);box.userData.fixedEmissive=true;const lamp=mesh(new THREE.BoxGeometry(.18,.03,.2),mats.gold,rig,-.25,-.5,-.48);lamp.material.color.set(accent);lamp.userData.fixedEmissive=true;
  const tube=(points,color)=>{const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const o=new THREE.Mesh(new THREE.TubeGeometry(curve,40,.022,8),new THREE.MeshStandardMaterial({color,roughness:.6}));o.userData.fixedEmissive=true;rig.add(o);return curve;};
  tube([[-.25,-.6,-.36],[-.6,-.42,-.32],[-1.05,-.38,-.42],[-1.78,-.2,-.3]],0x8f7a55);
  const signal=key==='feedback'?tube([[.42,.67,-.12],[.44,.9,-.4],[.2,.55,-.75],[-.1,-.2,-.7],[-.2,-.5,-.55]],0x6ea98b):null;
  const pulses=signal?Array.from({length:6},()=>{const p=new THREE.Mesh(new THREE.SphereGeometry(.05,12,12),new THREE.MeshBasicMaterial({color:0xd9ffb8}));p.visible=false;rig.add(p);return {mesh:p,born:-1};}):[];
  for(const [part,g] of Object.entries(groups))pickables.push([part,g]);
  rigs[key]={rig,groups,band,diode,shoe,pad,signal,pulses,anchor:new THREE.Vector3(.2,1.45,0),lastMark:null,flash:-1};
 }
 const base=new THREE.Mesh(new THREE.BoxGeometry(3.7,.13,3.9),mats.dark.clone());base.position.set(-.18,-.84,0);scene.add(base);for(const x of [-1.55,1.1])for(const z of [-1.7,1.7])mesh(new THREE.CylinderGeometry(.035,.035,.03,12),mats.gold,scene,x,-.755,z);
 const grid=new THREE.GridHelper(12,40,0x546753,0x334b3a);grid.position.y=-.92;grid.material.transparent=true;grid.material.opacity=.18;scene.add(grid);
 // Rig name tags follow their 3D anchors.
 const tags=Object.fromEntries(RIGS.map(([key,name])=>{const el=document.createElement('div');el.className=`rig-tag ${key}`;el.setAttribute('aria-hidden','true');el.innerHTML=`<b>${name}</b><span></span>`;host.appendChild(el);return [key,el];}));
 const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let start=null;
 renderer.domElement.addEventListener('pointerdown',e=>start=[e.clientX,e.clientY]);
 renderer.domElement.addEventListener('pointerup',e=>{if(!start||Math.hypot(e.clientX-start[0],e.clientY-start[1])>7)return;const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(pickables.map(([,g])=>g),true)[0];if(hit){const found=pickables.find(([,g])=>{let obj=hit.object;while(obj){if(obj===g)return true;obj=obj.parent;}return false;});if(found)part(found[0]);}});
 function part(p){for(const [k,g] of pickables)g.traverse(o=>{if(o.isMesh&&!o.userData.fixedEmissive)o.material.emissive.set(k===p?0x244a24:0x000000);});onPart?.(DESCRIPTIONS[p]);host.dataset.part=p;dirty=true;}
 const size=()=>{const r=host.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;const nextFit=Math.max(6.5,5.8/(2*Math.tan(14*Math.PI/180)*camera.aspect));const offset=camera.position.clone().sub(controls.target).multiplyScalar(nextFit/fitDistance);camera.position.copy(controls.target.clone().add(offset));fitDistance=nextFit;camera.updateProjectionMatrix();controls.update();dirty=true;};
 let current=null,isReduced=reduced,exploded=false,frames=0,dirty=true,visible=true,last=performance.now();
 reset();new ResizeObserver(size).observe(host);size();
 new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;dirty=true;}).observe(host);
 controls.addEventListener('change',()=>dirty=true);
 const v=new THREE.Vector3();
 function placeTags(){const w=renderer.domElement.clientWidth,h=renderer.domElement.clientHeight;for(const [key,r] of Object.entries(rigs)){v.copy(r.anchor);r.rig.localToWorld(v);v.project(camera);const el=tags[key],tw=el.offsetWidth,th=el.offsetHeight;
  // Keep each tag inside the canvas, above its anchor where there is room.
  const x=Math.max(6,Math.min(w-tw-6,(v.x+1)/2*w-tw/2)),y=Math.max(6,Math.min(h-th-6,(1-v.y)/2*h-th));el.style.transform=`translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;el.hidden=v.z>1;}}
 function apply(now){
  if(!current)return;
  for(const [key,r] of Object.entries(rigs)){const s=current.rigs[key];
   if(!isReduced){r.groups.wheel.rotation.x=s.angle;r.groups.encoder.rotation.x=s.angle;}
   // A mark passing the pickup flashes the diode and, on the feedback rig, sends a pulse back along the cable.
   const mark=Math.floor(s.angle/(Math.PI*2/ENCODER_MARKS));if(r.lastMark!==null&&mark!==r.lastMark&&!isReduced){r.flash=now;const free=r.pulses.find(p=>p.born<0);if(free)free.born=now;}r.lastMark=mark;
   r.diode.material.emissive.set(!isReduced&&now-r.flash<70?0xd9ffb8:0x000000);
   r.band.material.emissive.set(s.saturated?0xff6a3d:0xffa860);r.band.material.emissiveIntensity=.08+s.drive*s.drive*2;
   r.shoe.position.y=(s.braking?.73:.9)+(exploded?.25:0);r.pad.material.emissive.set(s.braking?0xc8522c:0x000000);r.pad.material.emissiveIntensity=s.braking?.35+.65*Math.min(1,current.load/100):0;
   tags[key].querySelector('span').textContent=`${s.speed.toFixed(1)} rpm · drive ${Math.round(s.drive*100)}%${s.saturated?' · ceiling':''}`;
  }
  host.dataset.t=current.t.toFixed(2);host.dataset.wheelAngle=rigs.feedback.groups.wheel.rotation.x.toFixed(3);host.dataset.braking=String(current.rigs.feedback.braking);
 }
 function frame(now){requestAnimationFrame(frame);const dt=now-last;last=now;
  let moving=false;for(const r of Object.values(rigs))for(const p of r.pulses){if(p.born<0)continue;const u=(now-p.born)/420;if(u>=1||isReduced){p.born=-1;p.mesh.visible=false;}else{p.mesh.position.copy(r.signal.getPointAt(u));p.mesh.visible=true;moving=true;}dirty=true;}
  if(!isReduced&&now-Math.max(rigs.fixed.flash,rigs.feedback.flash)<120)dirty=true;
  controls.update();
  if(dirty&&visible){apply(now);placeTags();renderer.render(scene,camera);frames++;host.dataset.frames=String(frames);dirty=false;}
  host.dataset.camera=camera.position.toArray().map(n=>n.toFixed(2)).join(',');
 }requestAnimationFrame(frame);
 host.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','+','-','Home'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')rotate(-.2);if(e.key==='ArrowRight')rotate(.2);if(e.key==='+')zoom(.85);if(e.key==='-')zoom(1.15);if(e.key==='Home')reset();}});
 function rotate(angle){const v=camera.position.clone().sub(controls.target);v.applyAxisAngle(new THREE.Vector3(0,1,0),angle);camera.position.copy(v.add(controls.target));controls.update();dirty=true;}
 function zoom(factor){const v=camera.position.clone().sub(controls.target);v.multiplyScalar(factor);v.setLength(Math.max(controls.minDistance,Math.min(controls.maxDistance,v.length())));camera.position.copy(v.add(controls.target));controls.update();dirty=true;}
 return {mode:'webgl',update(next){current=next;dirty=true;},part,rotate,zoom,reset(){reset();dirty=true;},explode(){exploded=!exploded;for(const r of Object.values(rigs)){r.groups.motor.position.x=exploded?-.4:0;r.groups.wheel.position.x=exploded?1.85:1.23;r.groups.encoder.position.y=exploded?.65:0;r.shoe.position.x=exploded?1.85:1.23;}dirty=true;return exploded;},setReduced(value){isReduced=value;controls.enableDamping=!value;if(value)for(const r of Object.values(rigs)){r.groups.wheel.rotation.x=0;r.groups.encoder.rotation.x=0;}dirty=true;}};
}
