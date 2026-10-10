import fs from 'node:fs/promises';
await fs.rm('dist',{recursive:true,force:true});
await fs.mkdir('dist/vendor/three/controls',{recursive:true});
await fs.cp('src','dist',{recursive:true});
await fs.cp('node_modules/three/build','dist/vendor/three/build',{recursive:true});
await fs.copyFile('node_modules/three/examples/jsm/controls/OrbitControls.js','dist/vendor/three/controls/OrbitControls.js');
await fs.copyFile('node_modules/three/LICENSE','dist/vendor/three/LICENSE');
console.log('Built standalone static app in dist, Three.js 0.185.1');
