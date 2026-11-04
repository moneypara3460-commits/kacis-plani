// Bölüm üreteci: tuzakları rastgele koyar, çıkarım ajanı tahminsiz çözebiliyorsa bölümü kabul eder.
const {solve,naiveLost,E}=require("./agent");
function rng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}

function layout(p,R){
  const W=p.w,H=p.h,g=[];
  for(let r=0;r<H;r++){g.push([]);for(let c=0;c<W;c++)g[r].push(r===0||c===0||r===H-1||c===W-1?"#":".");}
  const vert=R()<.5,L=vert?W:H,M=vert?H:W; // L: bölme ekseni uzunluğu
  const lines=[];
  for(let k=1;k<=p.doors;k++){
    let pos=Math.round(k*(L-1)/(p.doors+1))+(R()<.5?0:(R()<.5?-1:1));
    const gap=p.doors>=3?2:3,lo=p.doors>=3?2:3;
    pos=Math.max(lo,Math.min(L-1-lo,pos));
    if(lines.some(x=>Math.abs(x-pos)<gap))return null;
    lines.push(pos);
  }
  lines.sort((a,b)=>a-b);
  const at=(a,b)=>vert?g[b][a]:g[a][b], set=(a,b,v)=>{if(vert)g[b][a]=v;else g[a][b]=v;};
  const prot=new Set(),key=(a,b)=>a+","+b;
  for(const ln of lines){
    for(let b=1;b<M-1;b++)set(ln,b,"#");
    const d=1+Math.floor(R()*(M-2));
    set(ln,d,"D");
    for(const [da,db] of [[-1,0],[1,0],[0,-1],[0,1]])prot.add(key(ln+da,d+db));
  }
  // rastgele duvar parçaları
  const free=[];
  for(let a=1;a<L-1;a++)for(let b=1;b<M-1;b++)if(!lines.includes(a)&&!prot.has(key(a,b)))free.push([a,b]);
  for(let k=0;k<p.walls;k++){
    let [a,b]=free[Math.floor(R()*free.length)];
    const len=1+Math.floor(R()*3),ax=R()<.5;
    for(let t=0;t<len;t++){
      const aa=ax?a+t:a,bb=ax?b:b+t;
      if(aa<1||bb<1||aa>=L-1||bb>=M-1||lines.includes(aa)||prot.has(key(aa,bb)))break;
      if(at(aa,bb)===".")set(aa,bb,"#");
    }
  }
  // bantlar
  const band=(a)=>lines.filter(x=>x<a).length;
  const cellsByBand=Array.from({length:p.doors+1},()=>[]);
  for(let a=1;a<L-1;a++)for(let b=1;b<M-1;b++)if(at(a,b)===".")cellsByBand[band(a)].push([a,b]);
  if(cellsByBand.some(x=>x.length<3))return null;
  const pick=arr=>{const i=Math.floor(R()*arr.length);return arr.splice(i,1)[0];};
  // başlangıç/çıkış
  const sCells=cellsByBand[0].slice(),eCells=cellsByBand[p.doors].slice();
  const S=pick(sCells);
  let Ex=null;
  for(let t=0;t<20&&!Ex;t++){const c=eCells[Math.floor(R()*eCells.length)];if(Math.abs(c[0]-S[0])+Math.abs(c[1]-S[1])>=p.minDist)Ex=c;}
  if(!Ex)return null;
  set(S[0],S[1],"S");set(Ex[0],Ex[1],"E");
  for(let k=0;k<p.doors;k++){
    const arr=cellsByBand[k].filter(([a,b])=>at(a,b)===".");
    if(arr.length<2)return null;
    const c=arr[Math.floor(R()*arr.length)];set(c[0],c[1],"K");
  }
  // bağlantı kontrolü (kapılar geçilebilir)
  const rows=g.map(r=>r.join(""));
  const lv=E.parseLevel(rows);
  const seen=new Array(lv.cells.length).fill(0),q=[lv.start];seen[lv.start]=1;
  while(q.length){const u=q.pop();for(const v of E.neighbors4(lv,u))if(!seen[v]&&lv.cells[v]!=="#"){seen[v]=1;q.push(v);}}
  for(let i=0;i<lv.cells.length;i++)if(lv.cells[i]!=="#"&&!seen[i])return null;
  return g;
}

function addTraps(g,p,R){
  const H=g.length,W=g[0].length;
  const lv0=E.parseLevel(g.map(r=>r.join("")));
  const near=new Set([lv0.start,...E.neighbors8(lv0,lv0.start)]);
  const cand=[];
  for(let i=0;i<lv0.cells.length;i++)if(lv0.cells[i]==="."&&!near.has(i))cand.push(i);
  if(cand.length<p.traps+3)return null;
  const out=g.map(r=>r.slice());
  for(let k=0;k<p.traps;k++){const j=Math.floor(R()*cand.length);const i=cand.splice(j,1)[0];out[Math.floor(i/W)][i%W]="T";}
  return out.map(r=>r.join(""));
}

function make(p,seed,tries=200000){
  const R=rng(seed);const good=[];
  let lay=null,laid=0;
  for(let t=0;t<tries&&good.length<p.keep;t++){
    if(!lay||t%40===0){lay=null;for(let a=0;a<200&&!lay;a++)lay=layout(p,R);if(!lay)return null;}
    const rows=addTraps(lay,p,R);if(!rows)continue;
    const lv=E.parseLevel(rows);
    const full=solve(lv,{subset:true});if(!full.solved)continue;
    const basic=solve(lv,{subset:false});
    if(p.needSubset&&basic.solved)continue;
    if(!p.needSubset&&!basic.solved)continue;
    const nl=naiveLost(lv);if(nl<p.minNaive)continue;
    good.push({rows,nl,sub:full.usedSubset});
  }
  good.sort((a,b)=>b.nl-a.nl||b.sub-a.sub);
  return good[0]||null;
}
module.exports={make,rng,layout,addTraps};
