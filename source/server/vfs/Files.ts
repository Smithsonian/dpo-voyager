import { constants, promises as fs } from "fs";
import { createHash } from "crypto";
import path from "path";
import { NotFoundError, InternalError, ConflictError, BadRequestError } from "../utils/errors";
import { Uid } from "../utils/uid";
import BaseVfs from "./Base";
import { DataStream, FileProps, GetFileParams, GetFileResult, WriteDirParams, WriteFileParams } from "./types";

import { Transaction } from "./helpers/db";

interface DiskFileParams{
  size :number;
  hash :string|null;
  mime ?:string;
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
  async createFile({scene,name, mime = "application/octet-stream", user_id} :WriteFileParams, theFile :DiskFileParams|((params:CreateFileCallbackParams)=>Promise<DiskFileParams>)) :Promise<FileProps>{
    
    return await this.db.beginTransaction<FileProps>(async tr =>{
      let r = await tr.get(`
        WITH scene AS (SELECT scene_id FROM scenes WHERE ${typeof scene =="number"? "scene_id":"scene_name"} = $scene )
        INSERT INTO files (name, mime, generation, fk_scene_id, fk_author_id)
        SELECT 
          $name AS name,
          $mime AS mime,
          IFNULL(last.generation, 0) + 1 AS generation,
          scene_id AS fk_scene_id,
          $user_id AS fk_author_id
        FROM scene 
          LEFT JOIN (
            SELECT MAX(generation) AS generation, fk_scene_id 
            FROM files 
            WHERE name = $name
            GROUP BY fk_scene_id
          ) AS last
          ON scene_id = last.fk_scene_id
        GROUP BY name
        RETURNING 
        file_id,
        generation, 
        ctime
      `, {$scene: scene, $name: name, $mime: mime, $user_id: user_id});
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
        hash: theFile.hash || null,
        mime,
        name,
        author_id: user_id,
        author: author.username,
      };
    });
  }

  async getFileById(id :number) :Promise<FileProps>{
    let r = await this.db.get(`
      SELECT
        file_id AS id,
        size,
        hash,
        generation,
        first.ctime AS ctime,
        files.ctime AS mtime,
        files.name AS name,
        mime,
        files.fk_author_id AS author_id,
        username AS author
      FROM files 
        INNER JOIN (SELECT MIN(ctime) AS ctime, fk_scene_id, name FROM files GROUP BY fk_scene_id, name ) AS first
          ON files.fk_scene_id = first.fk_scene_id AND files.name = first.name
        INNER JOIN users ON files.fk_author_id = user_id
      WHERE id = $id
    `, {$id: id});
    if(!r || !r.ctime) throw new NotFoundError(`No file found with id : ${id}`);
    return {
      ...r,
      ctime: BaseVfs.toDate(r.ctime), //z specifies the string as UTC != localtime
      mtime: BaseVfs.toDate(r.mtime),
    };
  }

  async getFileProps({scene, name, archive = false} :GetFileParams) :Promise<FileProps>{
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
        files.name AS name,
        mime,
        files.fk_author_id AS author_id,
        username AS author
      FROM files 
        INNER JOIN scene ON files.fk_scene_id = scene.scene_id 
        INNER JOIN (SELECT MIN(ctime) AS ctime, fk_scene_id, name FROM files GROUP BY fk_scene_id, name ) AS first
          ON files.fk_scene_id = first.fk_scene_id AND files.name = first.name
        INNER JOIN users ON files.fk_author_id = user_id
      WHERE files.name = $name
      ORDER BY generation DESC
      LIMIT 1
    `, {$scene: scene, $name: name});
    if(!r || !r.ctime || (!r.hash && !archive)) throw new NotFoundError(`${path.join(scene.toString(), name)}${archive?" incl. archives":""}`);
    return {
      ...r,
      ctime: BaseVfs.toDate(r.ctime), //z specifies the string as UTC != localtime
      mtime: BaseVfs.toDate(r.mtime),
    };
  }

  /** Get a file's properties and a stream to its data
   * Simple shorthand to `getFileProps`with `fs.open`
   * Will throw an error if trying to open a deleted file or a directory
   * /!\ don't forget to close the stream /!\
   * @see getFileProps
   */
  async getFile(props:GetFileParams) :Promise<GetFileResult>{
    let r = await this.getFileProps(props);
    if(!r.hash) throw new NotFoundError(`Trying to open deleted file : ${ r.name }`);
    if(r.hash === "directory") throw new BadRequestError(`${props.name} in ${props.scene} appears to be a directory`);
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
  async getFileHistory({scene, name} :GetFileParams):Promise<GetFileResult[]>{
    let is_string = typeof scene === "string";
    let rows = await this.db.all(`
      ${(is_string?`WITH scene AS (SELECT scene_id FROM scenes WHERE scene_name = $scene)`:"")}
      SELECT
        file_id as id,
        size,
        hash,
        generation,
        ctime,
        files.name AS name,
        mime,
        fk_author_id AS author_id,
        username AS author
      FROM files 
        INNER JOIN users ON fk_author_id = user_id
      ${(is_string? ` INNER JOIN scene ON fk_scene_id = scene_id WHERE name = $name`
        :"WHERE fk_scene_id = $scene AND name = $name"
        )}
      ORDER BY generation DESC
    `, {$scene: scene, $name: name});
    if(!rows || !rows.length) throw new NotFoundError();
    return rows.map( r=>({
      ...r,
      mtime: BaseVfs.toDate(r.ctime), //z specifies the string as UTC != localtime
      ctime: BaseVfs.toDate(r.ctime), //z specifies the string as UTC != localtime
    }));
  }

  async removeFile(params :WriteFileParams) :Promise<number>{
    return await this.isolate<number>(async function(tr){
      //Check if file does exist
      let prev = await tr.getFileProps({...params, archive: true});
      if(!prev.hash){
        throw new ConflictError(`File ${path.join(params.scene.toString(), params.name)} is already deleted`);
      }
      let f = await tr.createFile(params, {hash: null, size: 0});
      return f.id;

    })
  }
  
  async renameFile(props :WriteFileParams, nextName :string) :Promise<number>{
    return await this.isolate<number>(async tr=>{
      let scene_id :number = ((typeof props.scene === "string")?
        await tr.db.get<{scene_id:number}>(`SELECT scene_id FROM scenes WHERE scene_name = $name`, {$name : props.scene})
          .then(r=>{
            if(!r) throw new NotFoundError(`No scene with id ${props.scene}`);
            return r.scene_id;
          })
        : props.scene
      );
      //Get current file
      let thisFile = await tr.getFileProps(props);
      //Get dest file
      let destFile = await tr.getFileProps({...props, name: nextName, archive: true})
      .catch(e=>{
        if(e.code == 404) return  {generation:0, hash:null};
        throw e;
      });
      if(destFile.hash){
        throw new ConflictError(`A file named ${nextName} already exists in scene ${scene_id}`);
      }

      await tr.createFile(props, {hash: null, size: 0});
      let f = await tr.createFile({ ...props, mime:thisFile.mime, name: nextName}, thisFile);

      if(!f?.id)  throw new NotFoundError(`can't create renamed file`);
      return f.id;
    });
  }
  /**
   * Get a list of all files in a scenes in their current state.
   * @see getSceneHistory for a list of all versions
   * Ordering should be consistent with `getSceneHistory`
   */
  async listFiles(scene_id :number, archive :boolean =false, withFolders = false) :Promise<FileProps[]>{

    return (await this.db.all<{
      ctime:string,
      mtime:string, 
      id:number,
      size:number,
      hash:string,
      generation :number,
      mime :string,
      name:string,
      author_id :number,
      author :string
    }[]>(`
      WITH ag AS ( 
        SELECT fk_scene_id, name, MAX(ctime) as mtime, MIN(ctime) as ctime , MAX(generation) AS last
        FROM files
        WHERE fk_scene_id = $scene_id
        GROUP BY fk_scene_id, name
      )
      SELECT 
        ag.mtime as mtime,
        ag.ctime as ctime,
        files.size,
        hash,
        ag.last as generation,
        file_id as id,
        files.name AS name,
        mime,
        fk_author_id AS author_id,
        username AS author
      FROM ag
        INNER JOIN files 
          ON files.fk_scene_id = ag.fk_scene_id AND files.name = ag.name AND files.generation = ag.last
        INNER JOIN users 
          ON files.fk_author_id = user_id
      WHERE 1
        ${((archive)?"":`AND hash IS NOT NULL`)}
        ${((withFolders)? "": `AND mime IS NOT 'text/directory'`)}
      ORDER BY mtime DESC, name ASC
    `, {$scene_id: scene_id})).map(({ctime, mtime, ...props})=>({
        ...props,
        ctime: BaseVfs.toDate(ctime),
        mtime: BaseVfs.toDate(mtime),
    }));
  }

  async createFolder({scene, name, user_id} :WriteDirParams){
    return await this.isolate(async tr =>{
      try{
        await tr.getFileProps({scene, name});
        throw new ConflictError(`Folder ${name} already exists in scene ${ scene}`);
      }catch(e){
        if((e as any).code != 404) throw e;
      }
      return await tr.createFile({
        scene, 
        name, 
        mime: "text/directory",
        user_id,
      }, {hash: "directory", size: 0});
    });
  }

  async listFolders(scene :number){
    return (await this.listFiles(scene, false, true))
    .filter(f=> f.mime == "text/directory");
  }

  async removeFolder({scene, name, user_id}:WriteDirParams){
    return await this.removeFile({scene, name, user_id, mime: "text/directory"});
  }
}