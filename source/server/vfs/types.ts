import { Request } from "express";
import {ReadStream} from "fs";
import {Readable} from "stream";
import { AccessType } from "../auth/UserManager";


export type DataStream = ReadStream|AsyncGenerator<Buffer|Uint8Array>|Request;



export interface GetFileParams {
  /** Scene name or scene id */
  scene :string|number;
  name  :string;
  /**Also return deleted files */
  archive ?:boolean;
}

export interface WriteFileParams extends GetFileParams {
  user_id :number;
  mime ?:string;
}

export interface WriteDirParams{
  scene :string|number;
  name :string;
  user_id :number;
}


export interface ItemProps{
  ctime :Date;
  mtime :Date;
  author_id :number;
  author :string;
  id :number;
  name :string;
}

/** any item stored in a scene, with a name that identifies it */
export interface ItemEntry extends ItemProps{
  generation :number;
  size :number;
  mime :string;
}

export interface FileProps extends ItemEntry{
  /**sha254 base64 encoded string or null for deleted files */
  hash :string|null;
}

export interface GetFileResult extends FileProps{
  stream :Readable;
}


export interface Scene extends ItemProps{
  /** optional name of the scene's thumbnail. Will generally be null due to sql types */
  thumb ?:string|null;
  /** Access level. Only makes sense when in reference to a user ID */
  access :{
    user ?:AccessType,
    any :AccessType,
    default :AccessType,
  };
}

export interface DocProps extends ItemEntry{
  name :"scene.svx.json";
  mime: "application/si-dpo-3d.document+json";
  data: string;
}

/**
 * Query structure to filter scene results.
 * Any unspecified value means "return everything"
 */
export interface SceneQuery {
  /** desired scene access level */
  access ?:AccessType[];
  match ?:string;
}
