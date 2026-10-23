import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('dist');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.wav':'audio/wav'};
const port=Number(process.env.MOTOR_LAB_PORT||4319);
// MOTOR_LAB_BASE=/motorlab serves the site under a subdirectory, as GitHub Pages does for a project site.
const base=`/${(process.env.MOTOR_LAB_BASE||'').replace(/^\/+|\/+$/g,'')}/`.replace('//','/');
const notFound=async res=>{try{const page=(await fs.readFile(path.join(root,'404.html'),'utf8')).replace('data-base="/"',`data-base="${base}"`);res.writeHead(404,{'Content-Type':'text/html','Cache-Control':'no-store'}).end(page);}catch{res.writeHead(404).end('Not found');}};
http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  if(base!=='/'&&url.pathname===base.slice(0,-1)){res.writeHead(301,{Location:base+url.search}).end();return;}
  if(!url.pathname.startsWith(base)){await notFound(res);return;}
  const rel=url.pathname.slice(base.length-1);
  const file=path.resolve(root,'.'+decodeURIComponent(rel==='/'?'/index.html':rel));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  const data=await fs.readFile(file);
  const headers={'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes'};
  const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
  if(range){const start=Number(range[1]),end=Math.min(data.length-1,range[2]?Number(range[2]):data.length-1);if(start> end){res.writeHead(416,{'Content-Range':`bytes */${data.length}`}).end();return;}res.writeHead(206,{...headers,'Content-Length':end-start+1,'Content-Range':`bytes ${start}-${end}/${data.length}`}).end(data.subarray(start,end+1));}
  else res.writeHead(200,{...headers,'Content-Length':data.length}).end(data);
 }catch{await notFound(res);}
}).listen(port,'127.0.0.1',()=>console.log(`Motor lab ready: http://127.0.0.1:${port}${base}`));
