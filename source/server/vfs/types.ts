import { Request } from "express";
import {ReadStream} from "fs";
import {Readable} from "stream";


export const FileTypes = [
  "articles",
  "images",
  "models"
] as const;
export function isFileType(type :any) :type is FileType{
  return FileTypes.indexOf(type) !== -1;
}
export type FileType = typeof FileTypes[number];


export type DataStream = ReadStream|AsyncGenerator<Buffer|Uint8Array>|Request;



export interface GetFileParams {
  /** Scene name or scene id */
  scene :string|number;
  type  :FileType;
  name  :string;
  /**Also return deleted files */
  archive ?:boolean;
}
export interface WriteFileParams extends GetFileParams {
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
  type: FileType|"documents";
}

export interface FileProps extends ItemProps{
  size  :number;
  generation :number;
  hash :string;
  type: FileType;
  name: string;
}

export interface GetFileResult extends FileProps{
  stream :Readable;
}


export interface Scene extends ItemProps{
}

export interface DocProps extends ItemProps{
  data: string;
  generation :number;
  name :"scene.svx.json";
  size :number;
}