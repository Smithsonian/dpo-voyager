import { NotFoundError } from "../utils/errors";
import { Uid } from "../utils/uid";
import BaseVfs from "./Base";
import { DocProps } from "./types";



export default abstract class DocsVfs extends BaseVfs{

  /**
   * 
   * @returns the created document id
   */
  async writeDoc($data :string, scene :number|string, author :null|number = 0) :Promise<number>{
    return await this.db.beginTransaction(async tr=>{
      let r = await tr.get<{doc_id:number}>(`
        WITH scene AS (SELECT scene_id FROM scenes WHERE ${typeof scene =="number"?"scene_id":"scene_name"} = $scene)
        INSERT INTO documents (data, generation, fk_author_id, fk_scene_id) 
        SELECT 
          $data AS data,
          IFNULL(MAX(generation), 0) + 1 AS generation,
          $author AS fk_author_id,
          scene.scene_id AS fk_scene_id
        FROM scene
          LEFT JOIN (
            SELECT MAX(generation) AS generation, fk_scene_id
            FROM documents
            GROUP BY fk_scene_id
          ) ON scene_id = fk_scene_id
        RETURNING doc_id
      `,{$data, $scene: scene, $author: author ?? null}).catch(e=> {
        if(e.message == "SQLITE_CONSTRAINT: NOT NULL constraint failed: documents.fk_scene_id") return undefined;
        throw e;
      });
      if(!r) throw new NotFoundError(`Can't find a scene matching : ${scene}`);
      return r.doc_id
    });
  }

  async getDoc($scene_id :number, generation ?:number) :Promise<DocProps>{
    let r = await this.db.get(`
      SELECT
        doc_id AS id,
        scenes.ctime AS ctime, 
        documents.ctime AS mtime,
        fk_author_id AS author_id,
        username AS author,
        data,
        generation
      FROM documents 
        INNER JOIN scenes
          ON scene_id = fk_scene_id
        INNER JOIN users
          ON fk_author_id = user_id
      WHERE scene_id = $scene_id
        ${generation?"AND generation = $generation": ""}
      ORDER BY generation DESC
      LIMIT 1
    `, {$scene_id, $generation: generation});
    if(!r) throw new NotFoundError(`No document for scene_id ${$scene_id}`);
    return {
      ...r,
      ctime: BaseVfs.toDate(r.ctime),
      mtime: BaseVfs.toDate(r.mtime),
    };
  }

  async getDocHistory($scene_id :number) :Promise<DocProps[]>{
    let r = await this.db.all(`
      SELECT
        doc_id AS id,
        ctime AS ctime, 
        ctime AS mtime,
        fk_author_id AS author_id,
        username AS author,
        data,
        generation
      FROM documents 
        INNER JOIN users
          ON fk_author_id = user_id
      WHERE fk_scene_id = $scene_id
      ORDER BY generation DESC
    `, {$scene_id});
    if(!r?.length) throw new NotFoundError(`No document for scene_id ${$scene_id}`);
    return r.map(d=>({
      ...d,
      ctime: BaseVfs.toDate(d.ctime),
      mtime: BaseVfs.toDate(d.mtime),
    }));
  }
}