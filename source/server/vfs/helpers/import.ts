import fs from "fs/promises";
import path from "path";
import assert from "assert/strict";

import Vfs, { FileType } from "..";
import db, { Database } from "./db";
import { constants } from "fs";
import User from "../../auth/User";
import UserManager from "../../auth/UserManager";
import { Uid } from "../../utils/uid";
import { HTTPError } from "../../utils/errors";


type Stats = Record<string, number>;

/**
 * Use to import webDAV files into a new database
 * On failure, everything should be rolled-back but loose objects will be left on disk
 * sourceDir and targetDir can be the same as subdirectories will be used.
 * @param sourceDir WebDAV directory to migrate from 
 * @param targetDir Target directory
 * @returns 
 */
export default async function importAll(sourceDir :string, targetDir :string) :Promise<{models:Stats, users:number}>{
  let stats = {};
  let vfs = await Vfs.Open(targetDir, {migrate: true, createDirs: true});
  try{
    /*@ts-ignore*/
    let _db = vfs.db;
    assert.ok(_db, "Expect a database instance");
    await _db.beginTransaction(async tr=>{
      (tr as any).beginTransaction = async (work :any)=> await work(tr);
      Object.assign(stats,
        await importUsers(sourceDir, tr as Database),
        await importFiles(sourceDir, targetDir, tr as Database),
      );
    });

  }finally{
    await vfs.close();
  }
  return stats as any;
}


export function getType(filepath :string):FileType{
  if(/\.glb$/i.test(filepath)) return "models";
  else if(/\.(png|jpe?g|webp)$/i.test(filepath)) return "images";
  else if(
        /\.(html|txt)$/.test(filepath)
    ||  /media\/articles\/[^/.]+$/.test(filepath)
  ) return "articles";
  else throw new Error(`Unknown file type for ${path.basename(filepath)}`);
}

export async function importModel(modelDir :string, scene_id :number, vfs :Vfs): Promise<Stats>{
  let modelName = path.basename(modelDir);
  let docFile = path.join(modelDir, modelName+".svx.json");
  let docData = await fs.readFile(docFile, {encoding: "utf8"});
  let stats = {articles: 0, images: 0, models: 0};
  let doc;
  try{
    doc = JSON.parse(docData);
  }catch(e){
    throw new Error(`Document ${docFile} is not valid JSON`);
  }
  //Modify document in-place
  for (let model of doc.models ?? []){
    for(let deriv of model.derivatives){
      for(let asset of deriv.assets){
        if(!asset.uri) continue;
        asset.uri = path.join("models", path.basename(asset.uri));
      }
    }
    if(model.annotationsBoxes?.uri){
      model.annotationsBoxes.uri = path.join("models", path.basename(model.annotationsBoxes.uri));
    }
  }
  for(let meta of doc.metas ?? []){
    for(let article of (meta.articles ?? [])){
      for(let key in article.uris){
        article.uris[key] = article.uris[key].replace("media/articles", "articles");
      }
    }
  }
  await vfs.writeDoc(JSON.stringify(doc), scene_id);
  for (let dir of [modelDir, path.join(modelDir, "media/articles")]){
    let files = await fs.opendir(dir).catch(e=>{
      if((e as any).code == "ENOENT") return [];
      else throw e;
    });
    for await (let file of files){
      let filepath = path.join(dir, file.name);
      if(!file.isFile()) continue;
      else if(filepath == docFile) continue;
      else if(/\.(save?|bac?k)$/.test(filepath)) continue;
      else if(/\.json$/.test(filepath)) continue;
      else{
        let type = getType(filepath);
        let handle = await fs.open(filepath, constants.O_RDONLY);
        console.log("import file :",type, path.basename(filepath));
        await vfs.writeFile(handle.createReadStream(), {
          user_id: 0, 
          scene: scene_id,
          type,
          name: file.name,
        });
        stats[type]++;
      }
    }
  }
  return stats;
}


export async function importFiles(sourceDir :string, targetDir :string, db:Database):Promise<Object>{
  let modelsDir = path.join(sourceDir, "models");
  let models = await fs.opendir(modelsDir).catch((e)=>{if((e as any).code == "ENOENT") return [];else throw e;});
  let stats :{ models :Stats[]} = {models: []};
  for await (let model of models){
    if(!model.isDirectory())continue;
    let vfs = new Vfs(targetDir, db);
    let scene_id;
    try{
      scene_id = await vfs.createScene(model.name);
    }catch(e){
      if((e as HTTPError).code === 409) {
        console.log(`Skip import of ${ model.name} (Conflict)`);
        continue;
      }
    }
    try{
      let modelStats = await importModel(path.join(modelsDir, model.name), scene_id as number, vfs);
      stats.models.push(modelStats);
    }catch(e){
      throw new Error(`Failed to import model ${model.name} (${(e as Error).message}). Rolling back.`);
    }
  }
  return stats;
}


export async function importUsers(sourceDir :string, db :Database) :Promise<Object>{
  let stats = {users:0};
  let userManager = new UserManager(db);
  let userFile = await fs.readFile(path.join(sourceDir, "secrets", "users.index"), {encoding: "utf8"})
  .catch(e=> {if((e as any).code == "ENOENT") return ""; else throw e;});
  let lines = userFile.split("\n");
  for (let line of lines){
    if(!line) continue;
    let str = line.split(":");
    if(str.length != 4 
      || !UserManager.isValidUserName(str[0])
      || !str[1]
      || (["true", "false"].indexOf(str[2]) == -1) 
      || !UserManager.isValidPasswordHash(str[3])
    ) {
      throw new Error(`Invalid user string`);
    }
    let u = new User({username: str[0], password: str[3], uid: Uid.make(), isAdministrator: str[2] == "true"});
    await userManager.write(u);
    stats.users++;
  }
  return stats;
}