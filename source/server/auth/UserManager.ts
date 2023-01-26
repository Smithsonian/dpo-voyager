import fs from "fs/promises";
import crypto from "crypto";
import path from "path";
import {promisify, callbackify} from "util";

import uid, { Uid } from "../utils/uid";
import { BadRequestError, InternalError, NotFoundError, UnauthorizedError } from "../utils/errors";
import User, {SafeUser, StoredUser} from "./User";

import openDatabase, {Database, DbOptions} from "../vfs/helpers/db";


const scrypt :(
  password :crypto.BinaryLike, 
  salt :crypto.BinaryLike, 
  keylen :number,  
  options: crypto.ScryptOptions
)=>Promise<Buffer> = promisify(crypto.scrypt);

interface ParsedPassword {
  algo :string;
  params :{[key: string]: number}
  salt :string;
  hash :string;
}

/**
 * Ordered list of permission. 
 * Permissions are always a superset of anything under them so they can be index-compared.
 */
export const AccessTypes = [
  null,
  "none",
  "read",
  "write",
  "admin"
] as const;
export function isAccessType(type :any) :type is AccessType{
  return AccessTypes.indexOf(type) !== -1;
}
export type AccessType = typeof AccessTypes[number];


export default class UserManager {

  constructor(private db :Database){}

  static async open(opts :DbOptions){
    let db = await openDatabase(opts);
    let u = new UserManager(db);
    return u;
  }
  /**
   * Checks if username is acceptable. Used both as input-validation and deserialization check
   * @see addUser()
   * @see UserManager.deserialize() 
   */
  static isValidUserName(username :string){
    return /^[\w]{3,40}$/.test(username)
  }
  static isValidPasswordHash(hash :string) :boolean{
    try{
      UserManager.parsePassword(hash);
    }catch(e){
      return false;
    }
    return true;
  }
  /**
   * 
   * @param pw a password string as encoded by formatPassword()
   * @returns 
   */
  static parsePassword(pw :string) :ParsedPassword{
    let m  = /^\$(?<algo>scrypt)(?:\$(?<params>(?:[^\$=]+=[^\$]+\$)*))?(?<salt>[^\$]+)\$(?<hash>[^\$]+)$/.exec(pw);
    if(!m?.groups) throw new Error("Malformed password string");
    let {algo, salt, hash, params:rawParams} = m.groups;
    //@ts-ignore
    let params = rawParams.split("$").slice(0,-1).reduce((params :{[key :string] :number}, param :string)=> {
      let [key, value] = param.split("=");
      return {...params, [key]: parseInt(value, 10)};
    },{});
    return {algo, salt, hash, params};
  }

  /**
   * Encode a clear-text password into a string. 
   * Includes all encoding parameters in the string with a randomly generated salt
   */
  static async formatPassword(pw :string) :Promise<string>{
    let salt = crypto.randomBytes(16).toString("base64url");
    let length = 64;
    let params = {N: 16384, r: 8, p: 1 };
    let key = await scrypt(pw, salt, length,  params);
    return `$scrypt$${Object.entries(params).map(([key, value])=>(`${key}=${value}`)).join("$")}$${salt}$${key.toString("base64url")}`;
  }

  /**
   * 
   * @param password clear-text password
   * @param hash encoded string to compare against
   */
  static async verifyPassword(password :string, hash :string) :Promise<boolean>{
    let {algo, salt, hash:storedHash, params} = UserManager.parsePassword(hash);
    if(algo != "scrypt") throw new Error(`bad password algorithm : ${algo}`);
    let key = await scrypt(password, salt, Buffer.from(storedHash, "base64url").length, params);
    return key.toString("base64url") == storedHash;
  }
  /**
   * parse a string (eg. made by `UserManager.serialize()`) into a valid user.
   * Performs necessary validity checks
   * Any errors will try to hide sensitive data like the user's password
   * @see UserManager.serialize()
   */
  static deserialize(u :StoredUser) :User{
    return  new User({
      username: u.username, 
      email: u.email??undefined,
      uid: u.user_id,
      isAdministrator: !!u.isAdministrator,
      password: u.password, 
    });
  }

  static serialize({username, email, password, uid, isAdministrator} :User) :StoredUser{
    return {
      username,
      email,
      password,
      user_id: uid,
      isAdministrator: (isAdministrator?1:0),
    };
  }


  /**
   * Write user data to disk. use addUser to generate a valid new user
   * @param user 
   */
  async write(user :User) :Promise<void>{
    let u = UserManager.serialize(user);
    await this.db.run(`
      INSERT INTO users (user_id, username, email, password, isAdministrator)
      VALUES ($uid, $username, $email, $password, $isAdministrator)
    `, {
      $uid: u.user_id,
      $username: u.username,
      $email: u.email ?? null,
      $password: u.password ?? null,
      $isAdministrator: ((u.isAdministrator)?1:0)
    });
  }


  /**
   * Reads users file and checks users validity
   * @throws {BadRequestError} is username is invalid
   * @throws {NotFoundError} is username is not found
   * @throws {Error} if fs.readFile fails (generally with error.code == ENOENT)
   */
  async getUserByName(username : string) :Promise<User>{
    if(!UserManager.isValidUserName(username)) throw new BadRequestError(`Invalid user name`);
    let u = await this.db.get<StoredUser>(`SELECT * FROM users WHERE username = $username`, {$username: username});
    if(!u) throw new NotFoundError(`no user with username ${username}`);
    return UserManager.deserialize(u);
  }

  async getDefaultUser() :Promise<User>{
    return User.createDefault();
  }
  
  /**
   * List users
   */
   async getUsers() :Promise<SafeUser[]>
   async getUsers(safe :true) :Promise<SafeUser[]>
   async getUsers(safe :false) :Promise<User[]>
   async getUsers(safe :boolean =true){
    return (await this.db.all<StoredUser[]>(`
      SELECT ${safe?"user_id, username, email, isAdministrator":"*"} 
      FROM users
      WHERE user_id != 0`)).map(u=>UserManager.deserialize(u));
  }

  async userCount() :Promise<number>{
    let r = await this.db.get(`SELECT COUNT(user_id) as count FROM users`);
    if(!r) throw new InternalError(`Bad db configuration : can't get user count`);
    return r.count;
  }
  /**
   * 
   * @param name 
   * @param password clear-text password 
   * @param callback 
   * @throws {UnauthorizedError}
   */
  async getUserByNamePassword(name : string, password : string) :Promise<User>{
    let u = await this.getUserByName(name);
    if(!u?.password) throw new UnauthorizedError("Username not found");
    if(!await UserManager.verifyPassword(password, u.password)){
      throw new UnauthorizedError("Bad password");
    }else{
      return u;
    }
  }
  /**
   * Performs any necessary checks and create a new user
   * @param username 
   * @param password clear-text password
   * @param isAdministrator 
   */
  async addUser(username : string, password : string, isAdministrator : boolean = false) : Promise<User>{ 
    if(!UserManager.isValidUserName(username)) throw new Error(`Invalid username : ${username}`);
    if(password.length < 8) throw new Error(`Password too short (min. 8 char long)`);
    let user = new User({
      username, 
      password: await UserManager.formatPassword(password), 
      isAdministrator, 
      uid: 0,
    });

    for(let i = 0; i < 3; i++){
      //Retry 3 times in case we are unlucky with the RNG
      try{
        /* 48bits is a safe integer (ie. less than 2^53-1)*/
        user.uid = Uid.make();
        await this.write(user);
        break;
      }catch(e){
        if((e as any).code == "SQLITE_CONSTRAINT" && /UNIQUE.*user_id/.test((e as any).message)) continue;
        else throw e;
      }
    }
    return user;
  }

  async removeUser(uid :number){
    let r = await this.db.run(`DELETE FROM users WHERE user_id = $uid`, {$uid:uid});
    if(!r || !r.changes) throw new NotFoundError(`No user to delete with uid ${uid}`);
  }

  async grant(scene :string, username :string, role :AccessType){
    if(!isAccessType(role)) throw new BadRequestError(`Bad access type requested : ${role}`);
    let r = await this.db.run(`
      UPDATE scenes
      SET access = json_set(access, '$.' || user_id, $role)
      FROM (SELECT user_id FROM users WHERE username = $username)
      WHERE scene_name = $scene
    `, {$scene: scene, $username: username, $role: role});
    if(!r || !r.changes) throw new NotFoundError(`Can't find matching user or scene`);
    if(1 < r.changes) throw new InternalError(`grant permissions somehow modified multiple users`);
  }

  async getAccessRights(scene :string, uid :number) :Promise<AccessType>{
    return (await this.db.get(`
      SELECT COALESCE(
        json_extract(access, '$.' || $uid),
        json_extract(access, '$.0')
      ) AS access
      FROM scenes
      WHERE scene_name = $scene
    `, {$scene:scene, $uid:uid.toString(10)}))?.access;
  }

  /**
   * 
   * @see https://www.sqlite.org/json1.html#jeach for json_each documentation
   */
  async getPermissions(nameOrId :string|number) :Promise<[{uid:number, username :string, access :AccessType}]>{
    let key = ((typeof nameOrId =="number")? "scene_id":"scene_name");
    let r = await this.db.all(`
      WITH scene AS (SELECT access FROM scenes WHERE ${key} = $value)
      SELECT lines.key AS uid, username, lines.value AS access
      FROM scene, json_each(scene.access) AS lines
      LEFT JOIN users ON lines.key = user_id
    `, {$value: nameOrId});
    if(!r?.length) throw new NotFoundError(`No scene found with ${key}: ${nameOrId}`);
    return r.map(l=>({...l, uid:parseInt(l.uid)})) as any;
  }

  async getKeys() :Promise<string[]>{
    return (
      await this.db.all<Record<"key_data", Buffer>[]>(`
        SELECT key_data FROM keys
        ORDER BY key_id DESC
      `)
    ).map(r=> r.key_data.toString("base64"));
  }
  async addKey(){
    await this.db.run(`INSERT INTO keys (key_data) VALUES (randomblob(16));`);
  }
}