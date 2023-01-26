import fs from "fs/promises";
import {constants} from "fs";
import BaseVfs from "./Base";



export default abstract class CleanVfs extends BaseVfs{
  /**
   * performs routine cleanup tasks
   */
  public async clean(){
    await this.cleanLooseObjects();
    await this.checkForMissingObjects();
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
      try{
        await fs.access(this.filepath(object), constants.R_OK)
      }catch(e){
        missing++;
        console.error(`File ${object.hash} can not be read on disk`);
      }
    }
    if(missing)console.log("found %d missing objects", missing);
  }

  /**
   * This could be done by a trigger
   * except we don't want files to be automatically removed when a scene is deleted
   * this allow for quick recuperation by just re-creating a scene with the same id
   */
  protected async removeDeletedScenesFiles(){
    let files = this.db.run(` DELETE FROM files WHERE `)
  }
}