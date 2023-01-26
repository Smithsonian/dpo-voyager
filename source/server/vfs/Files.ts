import { constants, promises as fs } from "fs";
import { createHash } from "crypto";
import path from "path";
import { NotFoundError, InternalError, ConflictError } from "../utils/errors";
import { Uid } from "../utils/uid";
import BaseVfs from "./Base";
import { DataStream, FileProps, FileType, GetFileParams, GetFileResult, WriteFileParams } from "./types";
import { Database } from "sqlite";
import { Transaction } from "./helpers/db";

interface DiskFileParams{
  size :number;
  hash :string|null;
}
interface CreateFileCallbackParams{
  id :number;
  /**
   * the database transaction used in this operation
   */
  tr :Transaction;
}

export default abstract class FilesVfs extends BaseVfs{

  /**
   * Write a stream to a temporary file then atomically rename it to the destination.
   * Prevents data corruption due to I/O caching at the system level
   * Wraps createFile to provide safe file creation with on-failure cleanup and atomic rename
   */
  async writeFile(
    dataStream :DataStream, 
    params :WriteFileParams
  ) :Promise<FileProps>{

    return this.createFile(params, async ({id})=>{
      let file_name = Uid.toString(id)
      let tmpfile = path.join(this.uploadsDir, file_name);
      let handle = await fs.open(tmpfile, constants.O_RDWR|constants.O_CREAT|constants.O_EXCL);
      let hashsum = createHash("sha256");
      let size = 0;
      try{
        for await (let d of dataStream){
          let {bytesWritten} = await handle.write(d);
          size += bytesWritten;
          hashsum.update(d);
        }
        //hash.digest("base64url")
        let hash = hashsum.digest("base64url");
        let destfile = path.join(this.objectsDir, hash);
        try{
          // It's always possible for the transaction to fail afterwards, creating a loose object
          // However it's not possible to safely clean it up without race conditions over any other row that may be referencing it
          await fs.link(tmpfile, destfile);
        }catch(e){
          if((e as any).code != "EEXIST") throw e;
          //If a file with the same hash exists, we presume it's the same file and don't overwrite it.
        }
        await fs.unlink(tmpfile);
        return {hash, size};
      }catch(e){
         //istanbul ignore next
         await fs.rm(tmpfile, {force: true}).catch(e=>console.error("Error while trying to remove tmpfile : ", e));
         //istanbul ignore next
         throw e; //Transaction will rollback
      }finally{
        await handle.close();
      }
    });
    
  }
  /**
   * create an entry for a file. It is expected to already exist or be created in the callback
   * It is generally best to use one of the more specialized functions that provide more security checks
   * @see writeFile for a wrapper that safely handles file creation 
   */
  async createFile({scene, type, name, user_id} :WriteFileParams, theFile :DiskFileParams|((params:CreateFileCallbackParams)=>Promise<DiskFileParams>)) :Promise<FileProps>{
    return await this.db.beginTransaction<FileProps>(async tr =>{
      let r = await tr.get(`
        WITH scene AS (SELECT scene_id FROM scenes WHERE ${typeof scene =="number"? "scene_id":"scene_name"} = $scene )
        INSERT INTO files (name, type, generation, fk_scene_id, fk_author_id)
        SELECT 
          $name AS name,
          $type AS type,
          IFNULL(MAX(generation), 0) + 1 AS generation,
          scene_id AS fk_scene_id,
          $user_id AS fk_author_id
        FROM scene 
          LEFT JOIN files ON scene_id = fk_scene_id AND name = $name AND type = $type
        GROUP BY type, name
        RETURNING 
        file_id,
        generation, 
        ctime
      `, {$scene: scene, $name: name, $type :type, $user_id: user_id});
      if(!r) throw new NotFoundError(`Can't find a scene named ${scene}`);

      let {file_id, generation, ctime} = r;
      if(typeof theFile === "function"){
        theFile = await theFile({id: file_id, tr});
      }
      if(theFile.hash){
        r = await tr.run(`UPDATE files SET hash = $hash, size = $size WHERE file_id = $id`, {$hash: theFile.hash, $size: theFile.size, $id: file_id});
        if(r.changes != 1) throw new InternalError(`Failed to update file hash`);
      }

      let author = await tr.get(`SELECT username FROM users WHERE user_id = $user_id`,{$user_id: user_id});
      return {
        generation,
        id: file_id,
        ctime: BaseVfs.toDate(ctime),
        mtime: BaseVfs.toDate(ctime),
        size : theFile.size,
        hash: theFile.hash || "",
        type,
        name,
        author_id: user_id,
        author: author.username,
      };
    });
  }

  async getFileProps({scene, type, name, archive = false} :GetFileParams) :Promise<FileProps>{
    let is_string = typeof scene === "string";
    let r = await this.db.get(`
      WITH scene AS (SELECT scene_id FROM scenes WHERE ${(is_string?"scene_name":"scene_id")} = $scene )
      SELECT
        file_id AS id,
        size,
        hash,
        generation,
        first.ctime AS ctime,
        files.ctime AS mtime,
        type,
        name,
        files.fk_author_id AS author_id,
        username AS author
      FROM files 
        INNER JOIN (SELECT MIN(ctime) AS ctime, pathref FROM files GROUP BY pathref ) AS first
          ON files.pathref = first.pathref
        INNER JOIN users ON files.fk_author_id = user_id
        INNER JOIN scene ON fk_scene_id = scene.scene_id AND type = $type AND name = $name
      ORDER BY generation DESC
      LIMIT 1
    `, {$scene: scene, $type: type, $name: name});
    if(!r || !r.ctime || (!r.hash && !archive)) throw new NotFoundError();
    return {
      ...r,
      ctime: BaseVfs.toDate(r.ctime), //z specifies the string as UTC != localtime
      mtime: BaseVfs.toDate(r.mtime),
    };
  }

  /**
   * don't forget to close the stream
   */
  async getFile(props:GetFileParams) :Promise<GetFileResult>{
    let r = await this.getFileProps(props);
    let handle = await fs.open(path.join(this.objectsDir, r.hash), constants.O_RDONLY);
    return {
      ...r,
      stream: handle.createReadStream(),
    };
  }
  /**
   * Get an history of versions for a file
   * It is ordered as last-in-first-out
   * for each entry, ctime == mtime always because files are immutable
   */
  async getFileHistory({scene, type, name} :GetFileParams):Promise<GetFileResult[]>{
    let is_string = typeof type === "string";
    let rows = await this.db.all(`
      ${(is_string?`WITH scene AS (SELECT scene_id FROM scenes WHERE scene_name = $scene)`:"")}
      SELECT
        file_id as id,
        size,
        hash,
        generation,
        ctime,
        type,
        name,
        fk_author_id AS author_id,
        username AS author
      FROM files 
      ${(is_string? `INNER JOIN scene ON fk_scene_id = scene_id AND type = $type AND name = $name`
        :"WHERE fk_scene_id = $scene"
        )}
        INNER JOIN users ON fk_author_id = user_id
      ORDER BY generation DESC
    `, {$scene: scene, $type: type, $name: name});
    if(!rows || !rows.length) throw new NotFoundError();
    return rows.map( r=>({
      ...r,
      mtime: BaseVfs.toDate(r.ctime), //z specifies the string as UTC != localtime
      ctime: BaseVfs.toDate(r.ctime), //z specifies the string as UTC != localtime
    }));
  }
  async removeFile(params :WriteFileParams) :Promise<number>{
    return await this.db.beginTransaction<number>(async tr=>{
      //Check if file does exist
      let prev = await this.getFileProps.bind({db: tr})({...params, archive: true});
      if(!prev.hash){
        throw new ConflictError(`File ${params.scene}/${params.type}/${params.name} is already deleted`);
      }
      let f = await this.createFile.bind({db: tr})(params, {hash: null, size: 0});
      return f.id;

    })
  }
  
  async renameFile(props :WriteFileParams, nextName :string) :Promise<number>{
    return await this.db.beginTransaction<number>(async tr=>{
      let scene_id :number = ((typeof props.scene === "string")?
        await tr.get<{scene_id:number}>(`SELECT scene_id FROM scenes WHERE scene_name = $name`, {$name : props.scene})
          .then(r=>{
            if(!r) throw new NotFoundError(`No scene with id ${props.scene}`);
            return r.scene_id;
          })
        : props.scene
      );
      //Get current file
      let thisFile = await this.getFileProps.bind({db: tr})(props);
      //Get dest file
      let destFile = await this.getFileProps.bind({db: tr})({...props, name: nextName, archive: true})
      .catch(e=>{
        if(e.code == 404) return  {generation:0, hash:null};
        throw e;
      });
      if(destFile.hash){
        throw new ConflictError(`A file named ${nextName} with type ${thisFile.type} already exists in scene ${scene_id}`);
      }

      await this.createFile.bind({db: tr})(props, {hash: null, size: 0});
      let f = await this.createFile.bind({db: tr})({ ...props, name: nextName}, thisFile);

      if(!f?.id)  throw new NotFoundError(`can't create renamed file`);
      return f.id;
    });
  }

  async listFiles(scene_id:number, archive :boolean =false) :Promise<FileProps[]>{
    return (await this.db.all<{
      ctime:string,
      mtime:string, 
      id:number,
      size:number,
      hash:string,
      generation :number,
      type: FileType,
      name:string,
      author_id :number,
      author :string
    }[]>(`
      SELECT 
        ag.mtime as mtime,
        ag.ctime as ctime,
        size,
        hash,
        ag.last as generation,
        file_id as id,
        type,
        name,
        fk_author_id AS author_id,
        username AS author
      FROM files 
        INNER JOIN (
          SELECT pathref, MAX(ctime) as mtime, MIN(ctime) as ctime , MAX(generation) AS last
          FROM files
          WHERE fk_scene_id = $scene_id
          GROUP BY pathref
        ) AS ag
        ON files.pathref = ag.pathref
          AND files.generation = ag.last
        INNER JOIN users ON files.fk_author_id = user_id
          ${archive?"":`AND hash IS NOT NULL`}
    `, {$scene_id: scene_id})).map(({ctime, mtime, name, type, ...props})=>({
        ...props,
        name,
        type,
        ctime: BaseVfs.toDate(ctime),
        mtime: BaseVfs.toDate(mtime),
    }))
  }
}