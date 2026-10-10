import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
export function createMechanism(host,{onPart,reduced=false,forceFallback=false}={}){
 const descriptions={motor:'Motor: converts the drive command into rotation. Electrical and mechanical behavior is simplified.',wheel:'Wheel: shares the shaft’s angle. We show rotation at one fifth of real speed for readability.',encoder:'Encoder: observes shaft rotation. Its ideal speed estimate returns to the controller; it does not drive the motor.'};
 let renderer;
 try{if(forceFallback)throw Error('Fallback requested');renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});}catch{
  host.innerHTML='<div class="fallback"><svg viewBox="0 0 400 180" role="img" aria-label="Static motor linked by shaft to encoder and wheel"><rect x="35" y="50" width="120" height="80" rx="16" fill="#9aab8d"/><path d="M155 90H340" stroke="#d2c7a4" stroke-width="12"/><circle cx="240" cy="90" r="30" fill="#d4ab64"/><circle cx="345" cy="90" r="55" fill="#56735f" stroke="#bdcbae" stroke-width="7"/><text x="90" y="155" fill="#bdcbae">Motor</text><text x="207" y="155" fill="#bdcbae">Encoder</text><text x="321" y="165" fill="#bdcbae">Wheel</text></svg><span>Static fallback · all experiments and lessons work</span></div>';
  host.dataset.mode='fallback';host.setAttribute('role','img');host.setAttribute('aria-label','Static motor, shaft, encoder and wheel diagram. The speed experiment remains interactive.');return {update(){},part(p){onPart?.(descriptions[p]);},explode(){},rotate(){},zoom(){},reset(){},setReduced(){}};
 }
 host.dataset.mode='webgl';renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0x000000,0);host.appendChild(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(28,1,.1,80);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=!reduced;controls.enablePan=false;controls.minDistance=3.4;controls.maxDistance=11;controls.maxPolarAngle=Math.PI*.85;
 let fitDistance=4.72;const reset=()=>{camera.position.set(2.8,1.9,3.3).setLength(fitDistance);controls.target.set(.05,0,0);controls.update();};reset();
 scene.add(new THREE.HemisphereLight(0xeaf3df,0x1c2928,2.1));const light=new THREE.DirectionalLight(0xfff0ca,3);light.position.set(2,5,4);scene.add(light);const rim=new THREE.DirectionalLight(0x89bb9b,2);rim.position.set(-4,1,-3);scene.add(rim);
 const mats={metal:new THREE.MeshStandardMaterial({color:0x9bafa1,metalness:.65,roughness:.38}),dark:new THREE.MeshStandardMaterial({color:0x405746,metalness:.4,roughness:.7}),gold:new THREE.MeshStandardMaterial({color:0xc8a267,metalness:.65,roughness:.42}),green:new THREE.MeshStandardMaterial({color:0x47735c,metalness:.25,roughness:.65}),rubber:new THREE.MeshStandardMaterial({color:0x25342a,roughness:.85})};
 const rig=new THREE.Group();scene.add(rig);const groups={motor:new THREE.Group(),wheel:new THREE.Group(),encoder:new THREE.Group()};Object.values(groups).forEach(g=>rig.add(g));
 const mesh=(geo,mat,group,x=0,y=0,z=0)=>{const o=new THREE.Mesh(geo,mat.clone());o.position.set(x,y,z);group.add(o);return o;};
 const cyl=(r,l,mat,group,x,y=0,z=0)=>{const o=mesh(new THREE.CylinderGeometry(r,r,l,48),mat,group,x,y,z);o.rotation.z=Math.PI/2;return o;};
 cyl(.59,1.28,mats.metal,groups.motor,-1.08);cyl(.55,.11,mats.dark,groups.motor,-1.78);cyl(.6,.09,mats.gold,groups.motor,-.4);
 for(let i=0;i<8;i++)cyl(.615,.025,mats.dark,groups.motor,-1.58+i*.14);
 mesh(new THREE.BoxGeometry(.95,.16,.78),mats.dark,groups.motor,-1.03,-.57,0);
 for(const z of [-.36,.36]){const bolt=mesh(new THREE.CylinderGeometry(.065,.065,.045,6),mats.gold,groups.motor,-1.28,-.49,z);bolt.position.x=-1.35;}
 cyl(.09,2,mats.metal,rig,.28);groups.wheel.position.x=1.23;
 cyl(.68,.26,mats.rubber,groups.wheel,0);cyl(.54,.28,mats.dark,groups.wheel,0);cyl(.14,.34,mats.gold,groups.wheel,0);
 for(let i=0;i<8;i++){const a=i*Math.PI/4;const spoke=mesh(new THREE.BoxGeometry(.3,.53,.045),mats.metal,groups.wheel,0,Math.sin(a)*.27,Math.cos(a)*.27);spoke.rotation.x=-a;}
 const marker=mesh(new THREE.BoxGeometry(.29,.11,.07),mats.gold,groups.wheel,0,.61,0);
 groups.encoder.position.x=.38;cyl(.37,.065,mats.gold,groups.encoder,0);
 for(let i=0;i<16;i++){const a=i*Math.PI/8;mesh(new THREE.BoxGeometry(.08,.045,.045),mats.dark,groups.encoder,.045,Math.sin(a)*.3,Math.cos(a)*.3);}
 const pickup=mesh(new THREE.BoxGeometry(.18,.25,.42),mats.green,rig,.39,.54,0);const diode=mesh(new THREE.BoxGeometry(.04,.065,.09),mats.gold,rig,.49,.48,0);
 const base=mesh(new THREE.BoxGeometry(3.6,.13,1.4),mats.dark,rig,-.18,-.84,0);for(const x of [-1.55,1.1])for(const z of [-.58,.58])mesh(new THREE.CylinderGeometry(.035,.035,.03,12),mats.gold,rig,x,-.755,z);
 const grid=new THREE.GridHelper(9,30,0x546753,0x334b3a);grid.position.y=-.92;grid.material.transparent=true;grid.material.opacity=.18;scene.add(grid);
 const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let start=null;
 renderer.domElement.addEventListener('pointerdown',e=>start=[e.clientX,e.clientY]);
 renderer.domElement.addEventListener('pointerup',e=>{if(!start||Math.hypot(e.clientX-start[0],e.clientY-start[1])>7)return;const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(Object.values(groups),true)[0];if(hit){const p=Object.keys(groups).find(k=>{let obj=hit.object;while(obj){if(obj===groups[k])return true;obj=obj.parent;}return false;});if(p)part(p);}});
 function part(p){Object.entries(groups).forEach(([k,g])=>g.traverse(o=>{if(o.isMesh)o.material.emissive.set(k===p?0x244a24:0x000000);}));onPart?.(descriptions[p]);host.dataset.part=p;}
 const size=()=>{const r=host.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;const nextFit=Math.max(4.72,4.4/(2*Math.tan(14*Math.PI/180)*camera.aspect));const offset=camera.position.clone().sub(controls.target).multiplyScalar(nextFit/fitDistance);camera.position.copy(controls.target.clone().add(offset));fitDistance=nextFit;camera.updateProjectionMatrix();controls.update();};new ResizeObserver(size).observe(host);size();
 let current=null,isReduced=reduced,exploded=false,frames=0,last=performance.now(),seen=0,dirty=true,accum=0,lastAngle=null;
 controls.addEventListener('change',()=>dirty=true);
 function frame(now){requestAnimationFrame(frame);const dt=now-last;last=now;accum+=dt;if(accum>=1000){host.dataset.fps=String(Math.round(seen*1000/accum));host.dataset.frames=String(frames);seen=0;accum=0;}
  if(current&&!isReduced&&current.bAngle!==lastAngle){lastAngle=current.bAngle;groups.wheel.rotation.x=current.bAngle*.2;groups.encoder.rotation.x=current.bAngle*.2;dirty=true;}controls.update();
  if(dirty){renderer.render(scene,camera);frames++;seen++;dirty=false;}host.dataset.camera=camera.position.toArray().map(n=>n.toFixed(2)).join(',');
 }requestAnimationFrame(frame);
 host.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','+','-','Home'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')rotate(-.2);if(e.key==='ArrowRight')rotate(.2);if(e.key==='+')zoom(.85);if(e.key==='-')zoom(1.15);if(e.key==='Home')reset();}});
 function rotate(angle){const v=camera.position.clone().sub(controls.target);v.applyAxisAngle(new THREE.Vector3(0,1,0),angle);camera.position.copy(v.add(controls.target));controls.update();dirty=true;}
 function zoom(factor){const v=camera.position.clone().sub(controls.target);v.multiplyScalar(factor);v.setLength(Math.max(controls.minDistance,Math.min(controls.maxDistance,v.length())));camera.position.copy(v.add(controls.target));controls.update();dirty=true;}
 return {update(sample){current=sample;if(isReduced&&sample?.t===0){groups.wheel.rotation.x=0;groups.encoder.rotation.x=0;dirty=true;}},part,rotate,zoom,reset(){reset();dirty=true;},explode(){exploded=!exploded;groups.motor.position.x=exploded?-.4:0;groups.wheel.position.x=exploded?1.85:1.23;groups.encoder.position.y=exploded?.65:0;dirty=true;return exploded;},setReduced(v){isReduced=v;controls.enableDamping=!v;dirty=true;}};
}
