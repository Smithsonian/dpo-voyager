import fs from "fs/promises";
import timers from "timers/promises";
import {constants} from "fs";
import BaseVfs from "./Base";
import FilesVfs from "./Files";



export default abstract class CleanVfs extends BaseVfs{
  /**
   * performs routine cleanup tasks
   * A reasonable delay is added where necessary to ensure the server can continue running properly
   */
  public async clean(){
    let cleanups = [
      this.cleanLooseObjects,
      this.checkForMissingObjects,
      this.fixMissingArticles,
    ];
    for (let fn of cleanups){
      await fn.call(this);
      await timers.setTimeout(600);
    }
  }

  protected async cleanLooseObjects(){
    let it = await fs.opendir(this.objectsDir);
    let loose = [];
    for await (let object of it){
        let row = await this.db.get(`SELECT COUNT(file_id) AS count FROM files WHERE hash = $name`, {$name:object.name});
        if(!row || row.count == 0 ){
            loose.push(object.name);
        }
    }
    //Loose objects are OK : wan may delete scenes which will remove all history
    if(loose.length)console.log("Cleaning %d loose objects", loose.length);
    for(let object of loose){
      fs.unlink(this.filepath(object));
    }
  }

  /**
   * Utility function used mainly for debugging to check if some objects are referenced but not present on disk
   */
  protected async checkForMissingObjects(){
    let objects = await this.db.all(`SELECT DISTINCT hash AS hash FROM files`);
    let missing = 0;
    for(let object of objects){
      if(object.hash === "directory" || object.hash === null) continue;
      try{
        await fs.access(this.filepath(object), constants.R_OK)
      }catch(e){
        missing++;
        console.error(`File ${object.hash} can not be read on disk`);
      }
    }
    if(missing)console.error("found %d missing objects (can't fix)", missing);
  }

  /**
   * Find any active document that have articles which are deleted 
   */
  protected async fixMissingArticles(){
    this.isolate(async (tr)=>{
      let missing = await tr.db.all<[{scene:string, name:string}]>(`
       SELECT DISTINCT scene_name AS scene, value AS name 
       FROM 
         (
           SELECT MAX(generation) AS generation, fk_scene_id 
           FROM documents 
           GROUP BY fk_scene_id
         ) AS last,
         scenes ON last.fk_scene_id = scenes.scene_id,
         documents ON documents.generation = last.generation AND documents.fk_scene_id = last.fk_scene_id,
         json_tree(documents.data, '$.metas') AS articles 
       WHERE 
         fullkey LIKE "$.metas[_].articles[%].uris.__"
         AND NOT EXISTS (
           SELECT files.name
           FROM 
             (
               SELECT MAX(generation) AS generation, fk_scene_id, name
               FROM files
               GROUP BY fk_scene_id, name
             ) AS last,
             files ON last.generation = files.generation AND last.name = files.name AND last.fk_scene_id = files.fk_scene_id
           WHERE 
             files.hash IS NOT NULL
             AND files.name = articles.value
             AND files.fk_scene_id = documents.fk_scene_id
         )
       ;
      `);
      if(100 < missing.length){
        console.error(`Too many missing articles (${missing.length}). Something is wrong! (won't fix)`);
        return
      }else if(!missing?.length) return;
      // We need a dummy document to exist somewhere to get a proper hash : 
      let {scene, name} = missing.pop() as {scene :string, name :string};
      let props = await (tr as any as FilesVfs).writeFile(
        (async function*ds(){ yield Buffer.from("<h1>No Content</h1>\n");})(),
        {scene, name, user_id: 0, mime: "text/html"}
      );

      for(let {scene, name} of missing){
        console.warn("Create missing article : %s/%s", scene, name);
        (tr as any as FilesVfs).createFile({scene, name, user_id: 0, mime: "text/html"}, {
          size: props.size,
          hash: props.hash,
        });
      }
      console.warn(`all missing articles created`);
    });
  }

}