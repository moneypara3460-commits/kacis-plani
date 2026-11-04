// Motor kuralları testi:  node tools/test.js
const load=require("./load");const E=load("engine.js");
const assert=require("assert");
const lv=E.parseLevel(["#######","#S.T.E#","#.#K#.#","#.D...#","#######"]);
let s=E.newState(lv);
assert.equal(lv.nb[lv.start],0);
// sağa git
let r=E.move(lv,s,1);assert.equal(r.ev,"step");s=r.s;
// tuzağa bas: can kaybet, yerinde kal
r=E.move(lv,s,1);assert.equal(r.ev,"trap");assert.equal(r.s.pos,s.pos);assert.equal(r.s.lives,2);s=r.s;
// açığa çıkan tuzağa tekrar basılamaz
r=E.move(lv,s,1);assert.equal(r.ev,"blocked");assert.equal(r.s.lives,2);
// bayraklı kareye basılamaz
let f=E.toggleFlag(lv,s,lv.start+3);assert.equal(f.flags[lv.start+3],1);
// duvara çarpma
r=E.move(lv,s,0);assert.equal(r.ev,"blocked");
// kilitli kapı
let t=E.newState(lv);t=E.move(lv,t,2).s;t=E.move(lv,t,2).s; // (1,3)
r=E.move(lv,t,1);assert.equal(r.ev,"locked");
// 3 tuzak = kayıp
let l=E.newState(lv);l.pos=9;for(let i=0;i<3;i++){l.revealed[10]=0;r=E.move(lv,l,1);l=r.s;}
assert.equal(l.status,"lost");assert.equal(r.ev,"lose");
// bayrak kaldırma
f=E.toggleFlag(lv,f,lv.start+3);assert.equal(f.flags[lv.start+3],0);
// zeroSafe
const z=E.zeroSafe(lv,E.newState(lv));assert.equal(z[lv.start+1],1);
// yıldızlar
assert.deepEqual([0,1,2,3].map(E.starsFor),[3,2,1,1]);
console.log("Motor testleri geçti");
