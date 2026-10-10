export const MODEL=Object.freeze({gain:200,tau:.65,dt:.01,duration:12,loadStart:4,loadEnd:9,kp:.003,ki:.009});
export const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
export function simulate({target=100,load=45,limit=1}={}){
 const m=MODEL; let fixed=0,feedback=0,integral=0,fAngle=0,bAngle=0;
 const samples=[]; let saturatedSeconds=0;
 for(let i=0;i<=Math.round(m.duration/m.dt);i++){
  const t=i*m.dt,d=t>=m.loadStart&&t<m.loadEnd?load:0;
  const uf=clamp(target/m.gain,0,limit),error=target-feedback;
  const raw=target/m.gain+m.kp*error+m.ki*integral;
  const ub=clamp(raw,0,limit);
  // Conditional integration avoids accumulating error against a saturated actuator.
  if((raw>=0&&raw<=limit)||(raw>limit&&error<0)||(raw<0&&error>0)) integral+=error*m.dt;
  samples.push({t,load:d,fixed,feedback,uf,ub,fAngle,bAngle,saturated:raw>limit+1e-6});
  if(t>=7&&t<9&&raw>limit+1e-6)saturatedSeconds+=m.dt;
  fixed=Math.max(0,fixed+(m.gain*uf-fixed-d)/m.tau*m.dt);
  feedback=Math.max(0,feedback+(m.gain*ub-feedback-d)/m.tau*m.dt);
  fAngle+=fixed*2*Math.PI/60*m.dt;bAngle+=feedback*2*Math.PI/60*m.dt;
 }
 const loaded=samples.filter(s=>s.t>=8&&s.t<9);
 const avg=k=>loaded.reduce((sum,s)=>sum+s[k],0)/loaded.length;
 return {samples,metrics:{fixedLoaded:avg('fixed'),feedbackLoaded:avg('feedback'),feedbackDrive:avg('ub'),saturatedSeconds,availableLoaded:Math.max(0,m.gain*limit-load),reachable:target<=m.gain*limit-load}};
}
