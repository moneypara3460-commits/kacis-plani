// Tüm bölümleri kontrol eder:  node tools/check.js
const load=require("./load");const {solve,naiveLost,E}=require("./agent");
const {LEVELS}=load("levels.js");
let bad=0;
LEVELS.forEach((L,i)=>{
  const lv=E.parseLevel(L.rows);
  const a=solve(lv),b=solve(lv,{subset:false});
  // motorla gerçek oynama: tuzakları bilen bir yürüyüşçü, anahtar/kapı sırasına göre
  let s=E.newState(lv),lost0=null;
  for(let k=0;k<400&&s.status==="play";k++){
    const prev=new Array(lv.cells.length).fill(-1);prev[s.pos]=s.pos;const q=[s.pos],ord=[];
    while(q.length){const u=q.shift();ord.push(u);for(const v of E.neighbors4(lv,u)){
      if(prev[v]>=0||lv.cells[v]==="#"||lv.cells[v]==="T")continue;
      if(lv.cells[v]==="D"&&!s.opened[v]&&s.keys<1)continue;prev[v]=u;q.push(v);}}
    const goal=prev[lv.exit]>=0?lv.exit:ord.find(j=>lv.cells[j]==="K"&&!s.taken[j]);
    if(goal===undefined)break;
    let v=goal;while(prev[v]!==s.pos)v=prev[v];
    s=E.moveTo(lv,s,v).s;
  }
  const ok=a.solved&&s.status==="won"&&s.lost===0&&(L.name&&L.hint);
  if(!ok)bad++;
  console.log(String(i+1).padStart(2),L.name.padEnd(18),lv.w+"x"+lv.h,"tuzak",lv.traps,"kapı",lv.doors,"çözülür:",a.solved,"yalnız temel:",b.solved,"dikkatsiz kayıp:",naiveLost(lv),"motor:",s.status,s.lost,ok?"OK":"HATA");
});
console.log(bad?"HATA VAR":"HEPSİ TAMAM");
