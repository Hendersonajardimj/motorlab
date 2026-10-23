import fs from 'node:fs/promises';
import crypto from 'node:crypto';
const out=process.argv[2]||'dist';
await fs.rm(out,{recursive:true,force:true});
await fs.mkdir(`${out}/vendor/three/controls`,{recursive:true});
await fs.cp('src',out,{recursive:true});
await fs.cp('node_modules/three/build',`${out}/vendor/three/build`,{recursive:true});
await fs.copyFile('node_modules/three/examples/jsm/controls/OrbitControls.js',`${out}/vendor/three/controls/OrbitControls.js`);
await fs.copyFile('node_modules/three/LICENSE',`${out}/vendor/three/LICENSE`);
// Version the app's own modules and stylesheet by content. A page from one release then never combines cached files from another.
const own=(await fs.readdir('src')).filter(f=>/\.(js|css)$/.test(f)).sort();
const hash=crypto.createHash('sha256');for(const f of own)hash.update(f).update(await fs.readFile(`src/${f}`));
const version=hash.digest('hex').slice(0,10);
for(const f of [...own.filter(f=>f.endsWith('.js')),'index.html']){
 const file=`${out}/${f}`,text=await fs.readFile(file,'utf8');
 await fs.writeFile(file,text.replace(/(["'])\.\/([\w-]+\.(?:js|css))\1/g,(match,quote,name)=>own.includes(name)?`${quote}./${name}?v=${version}${quote}`:match));
}
await fs.writeFile(`${out}/version.json`,JSON.stringify({version,three:'0.185.1'})+'\n');
console.log(`Built standalone static app in ${out}, version ${version}, Three.js 0.185.1`);
