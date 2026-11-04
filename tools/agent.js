// Çıkarım ajanı: oyuncunun görebildiği bilgiyle (sayılar, harita) tahmin yapmadan çıkışa ulaşabilir mi?
// Mayın Tarlası mantığı: temel kural + alt küme kuralı.
const load=require("./load");
const E=load("engine.js");
const {neighbors8,neighbors4,newState,move}=E;

function solve(lv,{subset=true}={}){
  const n=lv.cells.length;
  const vis=new Array(n).fill(0),safe=new Array(n).fill(0),trap=new Array(n).fill(0);
  const opened=new Array(n).fill(0),taken=new Array(n).fill(0);
  const wall=i=>lv.cells[i]==="#";
  for(let i=0;i<n;i++){const ch=lv.cells[i];if(ch!=="#"&&ch!=="."&&ch!=="T")safe[i]=1;}
  vis[lv.start]=1;safe[lv.start]=1;
  let keys=0,usedSubset=0,rounds=0;
  const passable=j=>!wall(j)&&!trap[j]&&(safe[j]||vis[j])&&(lv.cells[j]!=="D"||opened[j]);
  function bfs(){
    let found=0;const q=[];
    for(let i=0;i<n;i++)if(vis[i])q.push(i);
    const seen=new Array(n).fill(0);q.forEach(i=>seen[i]=1);
    while(q.length){
      const u=q.shift();
      for(const v of neighbors4(lv,u)){
        if(seen[v]||!passable(v))continue;
        seen[v]=1;q.push(v);
        if(!vis[v]){vis[v]=1;safe[v]=1;found++;
          if(lv.cells[v]==="K"&&!taken[v]){taken[v]=1;keys++;}}
      }
    }
    return found;
  }
  function cons(){
    const out=[];
    for(let v=0;v<n;v++){
      if(!vis[v])continue;
      const U=[];let tr=0;
      for(const j of neighbors8(lv,v)){
        if(wall(j))continue;
        if(trap[j])tr++;else if(!safe[j]&&!vis[j])U.push(j);
      }
      if(U.length)out.push({U,rem:lv.nb[v]-tr});
    }
    return out;
  }
  function basic(){
    let ch=0,again=true;
    while(again){
      again=false;
      for(const c of cons()){
        if(c.rem===0){for(const j of c.U)if(!safe[j]){safe[j]=1;ch++;again=true;}}
        else if(c.rem===c.U.length){for(const j of c.U)if(!trap[j]){trap[j]=1;ch++;again=true;}}
      }
    }
    return ch;
  }
  function sub(){
    const cs=cons();let ch=0;
    for(const a of cs)for(const b of cs){
      if(a===b||a.U.length>=b.U.length)continue;
      if(!a.U.every(x=>b.U.includes(x)))continue;
      const diff=b.U.filter(x=>!a.U.includes(x)),r=b.rem-a.rem;
      if(r===0){for(const j of diff)if(!safe[j]){safe[j]=1;ch++;}}
      else if(r===diff.length){for(const j of diff)if(!trap[j]){trap[j]=1;ch++;}}
    }
    return ch;
  }
  for(let guard=0;guard<500;guard++){
    rounds++;
    let prog=bfs();
    if(vis[lv.exit])return {solved:true,usedSubset,rounds};
    let d=basic();
    if(!d&&subset){d=sub();if(d)usedSubset++;}
    prog+=d;
    if(prog)continue;
    // kapı aç
    let did=false;
    if(keys>0){
      for(let i=0;i<n&&!did;i++){
        if(lv.cells[i]==="D"&&!opened[i]&&neighbors4(lv,i).some(j=>vis[j])){opened[i]=1;keys--;did=true;}
      }
    }
    if(!did)return {solved:false,usedSubset,rounds};
  }
  return {solved:false,usedSubset,rounds};
}

// Dikkatsiz oyuncu: sayılara bakmadan en kısa yoldan gider. Kaç can kaybeder?
function naiveLost(lv){
  let s=newState(lv);s.lives=999;
  for(let step=0;step<5000;step++){
    if(s.status==="won")return s.lost;
    const n=lv.cells.length,prev=new Array(n).fill(-1);prev[s.pos]=s.pos;
    const q=[s.pos];const order=[];
    while(q.length){
      const u=q.shift();order.push(u);
      for(const v of neighbors4(lv,u)){
        if(prev[v]>=0||lv.cells[v]==="#"||s.revealed[v])continue;
        if(lv.cells[v]==="D"&&!s.opened[v]&&s.keys<1)continue;
        prev[v]=u;q.push(v);
      }
    }
    let goal=prev[lv.exit]>=0?lv.exit:order.find(i=>lv.cells[i]==="K"&&!s.taken[i]);
    if(goal===undefined)return 999;
    let v=goal;while(prev[v]!==s.pos)v=prev[v];
    s=E.moveTo(lv,s,v).s;
  }
  return 999;
}
module.exports={solve,naiveLost,E};
