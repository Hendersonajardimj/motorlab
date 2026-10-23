import test from 'node:test';import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
test('the static build is subpath-safe and versions its own modules',()=>{
 const out=fs.mkdtempSync(path.join(os.tmpdir(),'motorlab-build-'));
 try{
  execFileSync(process.execPath,['scripts/build.mjs',out],{stdio:'pipe'});
  const {version}=JSON.parse(fs.readFileSync(path.join(out,'version.json'),'utf8'));assert.match(version,/^[0-9a-f]{10}$/);
  const html=fs.readFileSync(path.join(out,'index.html'),'utf8');
  assert.ok(!/(?:src|href)="\/(?!\/)/.test(html),'no root-absolute asset paths');
  assert.ok(html.includes(`./app.js?v=${version}`)&&html.includes(`./style.css?v=${version}`));
  assert.ok(html.includes('"three":"./vendor/three/build/three.module.js"'));
  for(const f of fs.readdirSync(out).filter(f=>f.endsWith('.js'))){const src=fs.readFileSync(path.join(out,f),'utf8');for(const [,spec] of src.matchAll(/from\s*'(\.\/[^']+)'/g)){assert.ok(spec.endsWith(`?v=${version}`),`${f} imports ${spec}`);assert.ok(fs.existsSync(path.join(out,spec.split('?')[0])),`${spec} exists`);}}
  for(const f of ['vendor/three/build/three.module.js','vendor/three/build/three.core.js','vendor/three/controls/OrbitControls.js','vendor/three/LICENSE','404.html'])assert.ok(fs.existsSync(path.join(out,f)),f);
  assert.match(fs.readFileSync(path.join(out,'404.html'),'utf8'),/data-base="\/"/);
 }finally{fs.rmSync(out,{recursive:true,force:true});}
});
