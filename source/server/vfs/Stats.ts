
import os from "os";
import BaseVfs from "./Base";

interface ServerStats{
  files: {
    mtime :Date,
    size :number,
    scenes :number,
    files :number
  };
  process: {
    freemem :number,
    load :[number, number, number],
    cores :number
  }
}

export default abstract class StatsVfs extends BaseVfs{
  async getStats() :Promise<ServerStats>{
    let mtime = new Date((await this.db.get<{mtime:string}>(`
      SELECT MAX(ctime) AS mtime FROM documents;
    `))?.mtime ?? 0);

    let {size} = (await this.db.get<{size:number}>(`
      SELECT SUM(size) AS size
      FROM (
        SELECT DISTINCT hash AS id, size
        FROM files
      UNION
        SELECT DISTINCT data AS id, LENGTH(CAST(data AS BLOB)) AS size
        FROM documents
      )
    `)) ?? {size: 0};

    let {scenes} = await this.db.get(`SELECT COUNT(scene_name) AS scenes FROM scenes`);

    let {files} = await this.db.get<{files:number}>(`
        SELECT COUNT (name) AS files
        FROM (
          SELECT DISTINCT name, fk_scene_id AS id FROM files
        UNION
          SELECT DISTINCT "scene.svx.json" AS name, fk_scene_id AS id FROM documents
        )
    `) ?? {files: 0};

    return {
      files:{mtime, size, scenes, files},
      process:{
        freemem: os.freemem(),
        load: os.loadavg() as ServerStats["process"]["load"],
        cores: os.cpus().length
      }
    };
  }
}