import { FileHandle } from "fs/promises";
import assert from "assert/strict";
import { Readable } from "stream";


import { crc32 } from "./crc32";
import {DateTime} from "./datetime";



export async function *asyncMap<Tin,Tout>(it :IterableIterator<Tin>|Tin[]|AsyncIterableIterator<Tin>|Tin[], callbackFn: (value :Tin)=> Promise<Tout>) :AsyncGenerator<Tout,any,unknown>{
  for await (let i of it){
    yield await callbackFn(i);
  }
}

export interface ZipEntry{
  filename :string;
  isDirectory ?:boolean;
  mtime :Date;
  stream ?:Readable|AsyncIterableIterator<Buffer>|IterableIterator<Buffer>|Buffer[];
}

export interface FileHeader{
  filename :string;
  extra ?:string;
  mtime :Date;
  flags :number;
}

export interface CDHeader extends FileHeader{
  dosMode :number;
  unixMode :number;
  size :number;
  compressedSize ?:number;
  crc :number;
  offset :number;
}

export const flags = {
  ENCRYPTED: 1 << 0,
  COMPRESS_OPTION_1: 1 <<1,
  COMPRESS_OPTION_2: 1 << 2,
  USE_DATA_DESCRIPTOR: 1 <<3,
  RESERVED_BIT: 1 << 4,
  COMPRESSED_PATCH: 1 << 5,
  UNUSED_BIT_7:  1 << 7,
  UNUSED_BIT_8:  1 << 8,
  UNUSED_BIT_9:  1 << 9,
  UNUSED_BIT_10:  1 << 10,
  UTF_FILENAME: 1 << 11,
  RESERVED_BIT_12:  1 << 12,
  ENCRYPTED_CENTRAL_DIR:  1 << 13,
  RESERVED_BIT_14:  1 << 14,
  RESERVED_BIT_15:  1 << 15,
} as const;

const cd_header_length = 46 as const;
const eocd_length = 22 as const;


export function create_file_header({ filename, extra="", mtime, flags } :FileHeader):Buffer{
  let name_length = Buffer.byteLength(filename);
  let extra_length = Buffer.byteLength(extra);

  let header = Buffer.alloc(30 + Buffer.byteLength(filename) +extra.length);
  header.writeUint32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4); // Version 2.0 needed (deflate and folder support)
  header.writeUInt16LE(flags, 6);                     // General purpose flags
  header.writeUInt16LE(0, 8)  // compression : 0 - none or 8 - Deflate
  // mtime time and date
  // see: https://learn.microsoft.com/fr-fr/windows/win32/api/winbase/nf-winbase-dosdatetimetofiletime?redirectedfrom=MSDN
  header.writeUInt32LE(DateTime.toDos(mtime), 10); // DOS time & date
  //CRC32 and sizes set to 0 because GP bit 3 is set
  header.writeUInt32LE(0, 14);// crc32
  header.writeUInt32LE(0, 18);// compressed size
  header.writeUInt32LE(0, 22);// uncompressed size
  
  header.writeUInt16LE(name_length, 26); // Name length
  header.writeUInt16LE(extra_length, 28); //extra length
  header.write(filename, 30, "utf-8"); // name
  header.write(extra, 30 + name_length);
  return header;
}

export function create_data_descriptor({size, compressedSize=size, crc}:{size:number,compressedSize?:number, crc:number}):Buffer{
  let dd = Buffer.alloc(16);
  dd.writeUInt32LE(0x08074b50, 0);
  dd.writeUInt32LE(crc, 4);
  dd.writeUInt32LE(compressedSize, 8) //Compressed size
  dd.writeUInt32LE(size, 12); // Uncompressed size
  return dd;
}

export function create_cd_header({filename, mtime, extra="", dosMode, unixMode, size, compressedSize = size, crc, flags, offset}:CDHeader){
  let name_length = Buffer.byteLength(filename);
  let extra_length = Buffer.byteLength(extra);
  //Construct central directory record
  let cdr = Buffer.alloc(cd_header_length + name_length + extra_length);

  cdr.writeUInt32LE(0x02014b50, 0); // Signature
  cdr.writeUInt16LE( 3 << 8 | 20, 4); // made by UNIX with zip v2.0
  cdr.writeUInt16LE(20, 6); // need version 2.0 to extract
  cdr.writeUInt16LE(flags, 8); //General purpose flags
  cdr.writeUInt16LE(0, 10); // Compression
  cdr.writeUInt32LE(DateTime.toDos(mtime), 12) // last mod file time & date
  cdr.writeUInt32LE(crc, 16) //crc-32
  cdr.writeUint32LE(compressedSize, 20); // compressed size
  cdr.writeUint32LE(size, 24); // uncompressed size
  cdr.writeUInt16LE(name_length, 28); // file name length
  cdr.writeUInt16LE(extra_length, 30); // extra field length
  cdr.writeUInt16LE(0, 32); //comment length
  cdr.writeUInt16LE(0, 34) //disk number
  cdr.writeUInt16LE(0, 36) //Internal attributes. Indicate ASCII files here
  cdr.writeUInt16LE(dosMode, 38) //DOS directory or archive (first two bytes of external attributes
  cdr.writeUInt16LE(unixMode, 40)// external attributes (unix mode)
  cdr.writeUInt32LE(offset, 42); //relative offset of file header
  cdr.write(filename, cd_header_length, "utf-8");
  cdr.write(extra, cd_header_length + name_length, "utf-8");
  
  return cdr;
}


export function parse_cd_header(cd :Buffer, offset :number) :CDHeader & {length:number}{
  let cdh = cd.slice(offset, offset +cd_header_length);
  
  let mtime = DateTime.toUnix(cdh.readUInt32LE(12));
  let name_length = cdh.readUInt16LE(28);
  let extra_length = cdh.readUInt16LE(30);
  return {
    filename: cd.slice(offset+cd_header_length, offset + cd_header_length +name_length).toString("utf-8"),
    extra: cd.slice(offset + cd_header_length + name_length, offset + cd_header_length + name_length + extra_length).toString("utf-8"),
    // 0 header signature
    // 4 version made by
    // 6 version needed
    flags: cdh.readUint16LE(8),
    // compression: cdh.readUInt16LE(8),
    // 12 last mod time
    //14 last mod date
    crc: cdh.readUInt32LE(16),
    // 20 compressed size
    size: cdh.readUInt32LE(24),
    mtime,
    // 28 file name length
    // 30 extra field length
    // 32 comment length
    // 34 disk number start
    // 36 internal file attributes
    dosMode: cdh.readUInt16LE(38),
    unixMode: cdh.readUInt16LE(40),
    offset: cdh.readUInt32LE(42),
    length: cd_header_length + name_length + extra_length,
  }
}

/**
 * simple implementation of Zip to allow export
 * Should be compatible with standard implementations
 * It *could* compress files but images and videos are already compressed. 
 * `*.glb` files generally only deflate by ~5% and text files are negligible in size.
 * @see https://pkware.cachefly.net/webdocs/APPNOTE/APPNOTE-6.3.0.TXT
 */
export async function *zip(files :AsyncIterable<ZipEntry>|Iterable<ZipEntry>, {comments = "" }={}) :AsyncGenerator<Buffer,void,unknown>{

  let cd = Buffer.alloc(0);
  let files_count = 0, archive_size = 0;

  let flag_bits = flags.USE_DATA_DESCRIPTOR | flags.UTF_FILENAME;

  for await (let {filename, mtime, stream, isDirectory} of files){
    if(!stream && !isDirectory){
      throw new Error("Files require a Readable stream");
    }
    files_count++;

    if(mtime.getUTCFullYear() < 1980){
      mtime = new Date("1980-01-01T0:0:0Z");
    }

    let local_header_offset = archive_size;

    //File header
    let header = create_file_header({filename, mtime, flags: flag_bits});
    yield header; 
    archive_size += header.length;
    //End of file header

    let size = 0;
    let sum = crc32(); 
    if(stream){
      for await (let data of stream){ // TODO: best block length for network?
        size += data.length;
        sum.next(data);
        yield data;
        archive_size += data.length;
      }
    }
    let crc = sum.next().value;
    //Data descriptor
    let dd = create_data_descriptor({size, crc});
    yield dd;
    archive_size += dd.length;
    
    //Construct central directory record for later use
    let cdr = create_cd_header({
      filename,
      size,
      crc,
      flags: flag_bits,
      mtime,
      dosMode: (isDirectory? 0x10: 0),
      unixMode: parseInt((isDirectory? "040755":"100644"), 8),
      offset: local_header_offset,
    });

    //Append to central directory
    cd = Buffer.concat([cd, cdr]);
  }

  // Digital signature is omitted


  //End of central directory
  let eocdr = Buffer.alloc(22 + Buffer.byteLength(comments));
  eocdr.writeUInt32LE(0x06054b50, 0);
  eocdr.writeUInt16LE(0, 4); //Disk number
  eocdr.writeUInt16LE(0, 6); //start disk of CD
  eocdr.writeUInt16LE(files_count, 8); //records on this disk
  eocdr.writeUInt16LE(files_count, 10) //total records
  eocdr.writeUInt32LE(cd.length, 12); //Size of central directory
  eocdr.writeUInt32LE(archive_size, 16); //central directory offset
  eocdr.writeUInt16LE(Buffer.byteLength(comments), 20) //comments length
  eocdr.write(comments, 22, "utf-8");

  yield Buffer.concat([cd, eocdr]);
}


/**
 * search for an "end of central directory record" at the end of the file.
 * That is, something with 0x06054b50. Then check for false positives by verifying if comment length matches.
 */
async function get_eocd_buffer(handle :FileHandle) :Promise<Buffer>{
  let stats = await handle.stat();
  //We expect comments to be below 65kb.
  let b = Buffer.alloc(65535);
  let {bytesRead} = await handle.read({buffer: b, position: Math.max(stats.size - 65535, 0)});
  let offset = 0;
  for(offset; offset < bytesRead-eocd_length; offset++){
    //Find a eocd signature matching a correct comments length
    if(b.readUInt32LE(bytesRead -offset - eocd_length) == 0x06054b50 && b.readUInt16LE(bytesRead - offset-2) == offset){
      return b.slice(bytesRead -offset - eocd_length);
    }
  }
  throw new Error("Could not find end of central directory record");
}

export async function zip_read_eocd(handle :FileHandle){
  let slice = await get_eocd_buffer(handle);
  let data_size = slice.readUInt32LE(16);
  let comment_length = slice.readUInt16LE(20);
  let cd_size = slice.readUInt32LE(12);
  return {
    entries: slice.readUInt16LE(10),
    cd_size: cd_size,
    cd_start: data_size,
    file_size: data_size+cd_size + eocd_length + comment_length,
    comments: slice.slice(eocd_length, eocd_length + comment_length).toString("utf8"),
  };
}

/**
 * 
 * Iterate over a file's central directory headers
 * It only read the file once before the first loop so it's safe to just unwrap the iterator
 */
export async function *read_cdh(handle : FileHandle) :AsyncGenerator<CDHeader, void, void >{
  let eocd = await zip_read_eocd(handle);
  let cd = Buffer.alloc(eocd.cd_size);
  assert( (await handle.read({buffer:cd, position: eocd.cd_start})).bytesRead == cd.length, "Can't read Zip Central Directory Records");
  let offset = 0;
  while(offset < eocd.cd_size){
    let header = parse_cd_header(cd, offset);
    //FIXME verify file header
    yield header;
    offset = offset + header.length;

  }
}

/**
 * Unpacks a zip file to an iterator of ZipEntry
 * Can't work from a stream beacause it must read the end of the file (Central Directory) first.
 */
export async function *unzip(handle :FileHandle) :AsyncGenerator<ZipEntry, void, void>{
  for await (let record of read_cdh(handle)){
    yield {
      filename: record.filename,
      mtime: record.mtime,
      stream : handle.createReadStream({autoClose: false, start: record.offset, end: record.offset + record.size}),
    }
  }
}