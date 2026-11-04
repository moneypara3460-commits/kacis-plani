// Bölümleri üretir ve ../levels.js dosyasına yazar:  node tools/build.js
const fs=require("fs"),path=require("path");
const {make}=require("./gen");
const L=(name,hint,p)=>({name,hint,p:{minDist:5,keep:12,walls:4,...p}});
const SPEC=[
 L("İlk Adım","Sayı, çevresindeki 8 karede kaç tuzak olduğunu söyler.",{w:7,h:7,doors:0,walls:2,traps:4,needSubset:false,minNaive:1,minDist:5}),
 L("Sayılar","0 görürsen çevren tamamen güvenlidir.",{w:7,h:7,doors:0,walls:2,traps:6,needSubset:false,minNaive:2,minDist:5}),
 L("Bayrak","Tuzak olduğundan eminsen 🚩 koy, yanlışlıkla basma.",{w:8,h:8,doors:0,walls:4,traps:10,needSubset:false,minNaive:2,minDist:7}),
 L("Anahtar","Anahtarı al, kilitli kapıyı aç. Her anahtar bir kapı açar.",{w:8,h:8,doors:1,walls:4,traps:8,needSubset:false,minNaive:2,minDist:7}),
 L("Yan Yana","İki sayıyı birlikte düşün: biri diğerinin içindeyse fark ortaya çıkar.",{w:9,h:9,doors:0,walls:6,traps:14,needSubset:true,minNaive:3,minDist:8}),
 L("Dar Geçit","Kapının önünde tuzaklar var, anahtara dikkat.",{w:9,h:9,doors:1,walls:6,traps:12,needSubset:false,minNaive:3,minDist:8}),
 L("Mayın Tarlası","Sayılardan tuzakları tek tek bul.",{w:9,h:9,doors:0,walls:6,traps:15,needSubset:true,minNaive:4,minDist:8}),
 L("Çifte Kilit","İki kapı, iki anahtar.",{w:10,h:10,doors:2,walls:8,traps:13,needSubset:false,minNaive:3,minDist:9}),
 L("Labirent","Duvarlar sayıları değiştirir; sadece zemin karelerinde tuzak olur.",{w:10,h:10,doors:1,walls:10,traps:12,needSubset:true,minNaive:3,minDist:10}),
 L("Karanlık Koridor","Biraz sabır: önce güvenli yerleri aç, sonra ilerle.",{w:11,h:11,doors:1,walls:10,traps:15,needSubset:true,minNaive:4,minDist:11}),
 L("Anahtar Avı","Anahtar da bir ödül, ona giden yol da tehlikeli.",{w:11,h:11,doors:1,walls:12,traps:17,needSubset:true,minNaive:5,minDist:11}),
 L("Kaçış Planı","Son bölüm. Tüm bilgiyi kullan.",{w:11,h:11,doors:2,walls:10,traps:14,needSubset:true,minNaive:4,minDist:12})
];
const out=[];
for(const [i,s] of SPEC.entries()){
  let r=null;const t0=Date.now();
  for(let seed=1;seed<=8&&!r;seed++)r=make(s.p,i*1000+seed,60000);
  if(!r){console.log("BAŞARISIZ",i+1,s.name);process.exit(1);}
  console.log(i+1,s.name,"naive:",r.nl,"alt küme:",r.sub,(Date.now()-t0)+"ms");
  out.push({name:s.name,hint:s.hint,rows:r.rows});
}
const js="// KAÇIŞ PLANI bölümleri (tools/build.js ile üretildi, hepsi tahmin gerektirmeden çözülebilir)\n// # duvar, . zemin, S başlangıç, E çıkış, T gizli tuzak, K anahtar, D kilitli kapı\nexport const LEVELS = "+JSON.stringify(out,null,1).replace(/\n\s+"/g,'\n  "')+";\n";
fs.writeFileSync(path.join(__dirname,"..","levels.js"),js);
