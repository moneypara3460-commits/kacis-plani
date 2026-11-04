// ES modülü olan dosyaları node'da test için yükler (engine.js, levels.js)
const fs=require("fs"),path=require("path");
module.exports=function load(file){
  let src=fs.readFileSync(path.join(__dirname,"..",file),"utf8");
  src=src.replace(/^import .*$/gm,"");
  const names=[...src.matchAll(/^export (?:const|function) (\w+)/gm)].map(m=>m[1]);
  const body=src.replace(/^export /gm,"")+"\nreturn {"+names.join(",")+"};";
  return new Function(body)();
};
