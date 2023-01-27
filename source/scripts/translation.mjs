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

let master = await read("en");
let tr = await read("fr");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '> ',
});


let res = {};
for(let [key, ref] of Object.entries(master)){
  if(typeof tr[key] !== "undefined"){
    res[key] = tr[key];
    continue;
  }
  console.log(ref);
  rl.setPrompt(`[${key}]`);
  rl.prompt();
  let [line] = await once(rl, "line");
  if(!line) {
    console.log("Skipping %s", key);
    continue;
  }
  console.log("Line : (%s)", line);
  res[key] = line;
}
rl.close();

await write("fr", res);