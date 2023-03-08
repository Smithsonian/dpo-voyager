
import open, {Database} from "./helpers/db";
import path from "path";
import { InternalError } from "../utils/errors";
import { FileProps } from "./types";


export default abstract class BaseVfs{

  constructor(protected rootDir :string, protected db :Database){}

  /**
   * Shouldn't be used outside of tests
   */
  public get _db(){return this.db; }
  public get uploadsDir(){ return path.join(this.rootDir, "uploads"); }
  public get objectsDir(){ return path.join(this.rootDir, "objects"); }

  /**
   * Runs a sequence of methods in isolation
   * Every calls to Vfs.db inside of the callback will be wrapped in a transaction
   * It _can_ be nested but be sure you understand how savepoints will be unwrapped and how SQLITE_BUSY works
   * @param fn 
   * @returns 
   */
  public isolate = async <T>(fn :(this: typeof this, vfs :typeof this)=> Promise<T>)=>{
    return await this.db.beginTransaction(async (transaction)=>{
      let that = new Proxy<typeof this>(this, {
        get(target, prop, receiver){
          if(prop === "db"){
            return transaction;
          }
          return Reflect.get(target, prop, receiver);
        }
      });
      return await fn.call(that, that);
    }) as T;
  }
  
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