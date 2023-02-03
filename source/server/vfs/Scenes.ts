import { AccessType, AccessTypes } from "../auth/UserManager";
import config from "../utils/config";
import { ConflictError,  NotFoundError } from "../utils/errors";
import { Uid } from "../utils/uid";
import BaseVfs from "./Base";
import { ItemEntry, ItemProps, Scene } from "./types";



export default abstract class ScenesVfs extends BaseVfs{

  async createScene(name :string):Promise<number>
  async createScene(name :string, author_id :number):Promise<number>
  async createScene(name :string, permissions:Record<string,AccessType>):Promise<number>
  async createScene(name :string, perms ?:Record<string,AccessType>|number) :Promise<number>{
    let permissions :Record<string,AccessType> = (typeof perms === "object")? perms : {};
    //Always provide permissions for default user
    permissions['0'] ??= (config.public?"read":"none");
    //If an author_id is provided, it is an administrator
    if(typeof perms === "number" ) permissions[perms.toString(10)] = "admin";

    for(let i=0; i<3; i++){
      try{
        let r = await this.db.get(`
          INSERT INTO scenes (scene_name, scene_id, access) 
          VALUES (
            $scene_name,
            $scene_id,
            $access
          )
          RETURNING scene_id AS scene_id;
        `, {
          $scene_name:name, 
          $scene_id: Uid.make(),
          $access: JSON.stringify(permissions)
        });
        return r.scene_id;
      }catch(e){
        if((e as any).code == "SQLITE_CONSTRAINT"){
          if(/UNIQUE.*scene_id/.test((e as any).message)){
            continue;
          }else if(/UNIQUE.*scene_name/.test((e as any).message)){
            throw new ConflictError(`A scene named ${name} already exists`);
          }else{
            throw e;
          }
        }else{
          throw e;
        }
      }
    }
    throw new ConflictError(`Unable to find a free id`);
  }
  /**
   * WARNING: should not be used in normal operations
   * It will irrecorevably delete all associated resources
   */
  async removeScene($scene_id:number){
    let r = await this.db.run(`DELETE FROM scenes WHERE scene_id = $scene_id`, {$scene_id});
  }

  async renameScene($scene_id :number, $nextName :string){
    let r = await this.db.run(`
      UPDATE scenes
      SET scene_name = $nextName
      WHERE scene_id = $scene_id
    `, {$scene_id, $nextName});
    if(!r?.changes) throw new NotFoundError(`no scene found with id: ${$scene_id}`);
  }
  /**
   * 
   * @param user_id filter scenes with read access from user_id
   * @returns 
   */
  async getScenes(user_id ?:number) :Promise<Scene[]>{
    
    return (await this.db.all(`
      SELECT 
        IFNULL(document.ctime, scenes.ctime) as mtime,
        scenes.ctime as ctime,
        scene_id as id,
        scene_name as name
      FROM scenes
        LEFT JOIN (SELECT MAX(ctime) AS ctime, fk_scene_id FROM documents GROUP BY fk_scene_id) AS document ON fk_scene_id = scene_id
      ${typeof user_id === "number"? `WHERE 
        IFNULL(
          json_extract(scenes.access, '$.' || $user_id),
          json_extract(scenes.access, '$.0')
        ) IN (${ AccessTypes.slice(2).map(s=>`'${s}'`).join(", ") })
      `:""}
      GROUP BY scene_id
      ORDER BY scene_name ASC
    `, {$user_id: user_id?.toString(10)})).map(({ctime, mtime, id, ...m})=>({
      ...m,
      id,
      ctime: BaseVfs.toDate(ctime),
      mtime: BaseVfs.toDate(mtime),
    }));
  }

  async getScene(nameOrId :string|number) :Promise<Scene>{
    let key = ((typeof nameOrId =="number")? "scene_id":"scene_name");
    let r = await this.db.get(`
      SELECT
        scene_name AS name,
        scene_id AS id,
        scenes.ctime AS ctime,
        documents.ctime AS mtime,
        user_id AS author_id,
        username AS author
      FROM scenes 
      INNER JOIN documents ON fk_scene_id = scene_id
      LEFT JOIN users ON fk_author_id = user_id
      WHERE ${key} = $value
      ORDER BY generation DESC
      LIMIT 1
    `, {$value: nameOrId});
    if(!r|| !r.name) throw new NotFoundError(`No scene found with ${key}: ${nameOrId}`);
    return {
      ...r,
      ctime: BaseVfs.toDate(r.ctime),
      mtime: BaseVfs.toDate(r.mtime),
    }
  }

  /**
   * Get every version of anything contained in this scene.
   * This could get quite large...
   * @todo handle size limit and pagination
   * @bug 
   */
  async getSceneHistory(id :number) :Promise<ItemEntry[]>{

    let entries = await this.db.all(`
      SELECT name, id, generation, ctime, username AS author, author_id, size
      FROM(
        SELECT 
          "scene.svx.json" as name,
          doc_id AS id,
          generation,
          ctime,
          fk_author_id AS author_id,
          LENGTH(CAST(data AS BLOB)) AS size
        FROM documents
        WHERE fk_scene_id = $scene
        UNION ALL
        SELECT
          type || "/" || name AS name,
          file_id AS id,
          generation,
          ctime,
          fk_author_id AS author_id,
          size
        FROM files
        WHERE fk_scene_id = $scene
      )
      INNER JOIN users ON author_id = user_id
      ORDER BY ctime DESC, name ASC, generation DESC
    `, {$scene: id});

    return entries.map(m=>({
      ...m,
      ctime: BaseVfs.toDate(m.ctime),
    }));
  }

}