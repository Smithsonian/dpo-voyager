
import open, {Database} from "./helpers/db";
import path from "path";
import { InternalError } from "../utils/errors";
import { FileProps } from "./types";

type GConstructor<T = {}> = new (...args: any[]) => T;
type DerivedVfs = GConstructor<BaseVfs>;
export default abstract class BaseVfs{

  constructor(protected rootDir :string, protected db :Database){}

  /**
   * Shouldn't be used outside of tests
   */
  public get _db(){return this.db; }
  public get uploadsDir(){ return path.join(this.rootDir, "uploads"); }
  public get objectsDir(){ return path.join(this.rootDir, "objects"); }
  
  public filepath(f :FileProps|string|{hash:string}){
    return path.join(this.objectsDir, typeof f ==="string"?f:f.hash);
  }

  abstract close() :Promise<any>;
  public abstract get isOpen():boolean;
    /**
 * Converts a date as stored by sqlite into a js Date object
 * Necessary because sqlite applies the ISO standard and omits the "Z" for UTC generated timestamps, 
 * while JS applies consider these timestamps as localtime
 * @param str 
 * @returns 
 */
  static toDate(str :string){
    // Matches Z | ±HH:mm at the end of string
    let m = /^(\d{4}|[+\-]\d{6})(?:-(\d{2})(?:-(\d{2}))?)?(?:[T\s](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3}))?)?(?<timezone>(Z)|([+\-])(\d{2})(?::(\d{2}))?)?)?$/.exec(str)
    if(!m) throw new InternalError("Badly formatted date : "+str);
    return new Date(((m.groups as any).timezone? str: str+"Z"));
  }
}