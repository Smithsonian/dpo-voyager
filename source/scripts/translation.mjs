'use strict';
import readline from 'node:readline';
import fs from "node:fs/promises";
import path from "node:path";
import {once} from "events";

async function read(l){
  return JSON.parse(await fs.readFile(path.resolve("assets/language",`string.resources.${l}.json`), {encoding: "utf-8"}));
}
async function write(l, data){
  return await fs.writeFile(path.resolve("assets/language",`string.resources.${l}.json`), JSON.stringify(data, null, 2), {encoding: "utf-8"});
}

async function sort(l){
  let tr = await read(l);
  let res = {};
  for (let key of Object.keys(tr).sort((a, b) => a.localeCompare(b, 'en', {sensitivity: "base"}))){
    res[key] = tr[key];
  }
  await write(l, res);
}

async function complete(l, src){
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> ',
  });  
  let tr = await read(l);
  let res = {};
  for(let [key, ref] of Object.entries(src)){
    if(typeof tr[key] !== "undefined"){
      res[key] = tr[key];
      continue;
    }
    rl.setPrompt(`[${key}]`);
    rl.prompt();
    let [line] = await once(rl, "line");
    if(!line) {
      console.log("Skipping %s", key);
      continue;
    }
    res[key] = line;
  }
  //Confirm deletion of any key not found
  let all = false;
  for(let key of Object.keys(tr)){
    if(typeof res[key] === "undefined"){
      let keep = all || await (async ()=>{
        console.log(`String "${key}" would be deleted. Confirm? (y/N/all)`);
        let [line] = await once(rl, "line");
        if(line.toLowerCase() === "all"){
          all = true;
          return true;
        }else if(line.toLowerCase() === "y"){
          return true;
        }
      })();
      if(keep){
        res[key] = tr[key];
      }
    }
  }
  rl.close();
  await write(l, res);
}

async function fromTranslation(){
  return await read("en");
}


/**
 * 
 * @param {string} dir 
 * @yield {Promise<string>} a list of strings
 */
async function* walk(dir){
  let children = await fs.opendir(dir);
  for await (let child of children){
    if(child.isDirectory() && child.name !== "node_modules"){
      yield* walk(path.join(dir, child.name));
      continue;
    } else if(!child.isFile()) continue; //symlink or whatever
    else if(!/\.ts$/i.test(child.name)) continue;
    const filepath = path.join(dir, child.name);
    const content = await fs.readFile(filepath, {encoding:"utf8"});
    let re = /\.getLocalizedString\s*\(\s*["'`]([\w\s]+)["'`]\s*\)/g;
    let m;
    while((m = re.exec(content)) !== null){
      yield m[1];
    }
  }
}

async function fromSource(){
  let keys = {};
  for await (let key of walk(path.resolve("source/client"))){
    keys[key] = key;
  }
  return keys;
}


//complete("fr",await fromSource());
await sort("fr");