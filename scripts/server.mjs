import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('dist');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.wav':'audio/wav'};
const port=Number(process.env.MOTOR_LAB_PORT||4319);
http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  const file=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  const data=await fs.readFile(file);
  const headers={'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes'};
  const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
  if(range){const start=Number(range[1]),end=Math.min(data.length-1,range[2]?Number(range[2]):data.length-1);if(start> end){res.writeHead(416,{'Content-Range':`bytes */${data.length}`}).end();return;}res.writeHead(206,{...headers,'Content-Length':end-start+1,'Content-Range':`bytes ${start}-${end}/${data.length}`}).end(data.subarray(start,end+1));}
  else res.writeHead(200,{...headers,'Content-Length':data.length}).end(data);
 }catch{res.writeHead(404).end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Motor lab ready: http://127.0.0.1:${port}`));
