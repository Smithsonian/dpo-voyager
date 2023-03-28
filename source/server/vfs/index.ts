import fs from "fs/promises";
import path from "path";
import open, {Database} from "./helpers/db";


import BaseVfs from "./Base";
import FilesVfs from "./Files";
import DocsVfs from "./Docs";
import ScenesVfs from "./Scenes";
import CleanVfs from "./Clean";
import StatsVfs from "./Stats";

export * from "./types";


/**
 * Virtual filesystem interactions.
 * Wraps calls in necessary locks and checks to prevent file corruption
 */
class Vfs extends BaseVfs{

  constructor(protected rootDir :string, protected db :Database){
    super(rootDir, db);
  }
  public get isOpen(){
    return !!this.db;
  }

  static async Open(rootDir :string, {db, createDirs=true, migrate = true} :{db ?:Database, createDirs?:boolean, migrate ?:"force"|boolean} = {} ){
    if(createDirs){
      await fs.mkdir(path.join(rootDir, "objects"), {recursive: true});
      await fs.rm(path.join(rootDir, "uploads"), {recursive: true, force: true});
      await fs.mkdir(path.join(rootDir, "uploads"), {recursive: true});
    }
    db ??= await open({
      filename: path.join(rootDir,'database.db'),
      migrate,
    });

    let vfs = new Vfs(rootDir, db);
    return vfs;
  }
  
  async close(){
    await this.db.close();
  }
}

interface Vfs extends FilesVfs, DocsVfs, ScenesVfs, StatsVfs, CleanVfs {};
applyMixins(Vfs, [FilesVfs, DocsVfs, ScenesVfs, StatsVfs, CleanVfs]);

export default Vfs;


/**
 * ad-hoc function to merge subclasses
 */
function applyMixins(derivedCtor: any, constructors: any[]) {
  constructors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
      Object.defineProperty(
        derivedCtor.prototype,
        name,
        Object.getOwnPropertyDescriptor(baseCtor.prototype, name) ||
          Object.create(null)
      );
    });
  });
}
