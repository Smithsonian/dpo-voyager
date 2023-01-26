import { FileHandle } from "fs/promises";
import assert from "assert/strict";
import { Readable } from "stream";


const crc_table = (()=>{
  let t = new Uint32Array(256);
  for(let n = 0; n < 256; n++){
    let c = n;
    for(let k = 0; k <8; k++){
      c = ((c&1) ? (3988292384 ^ (c >>> 1)) : (c >>> 1));
    }
    t[n] = c;
  }
  return t;
})();


function *_crc32() :Generator<number,number,Buffer>{
  let crc = -1;
  let next;
  while(next = yield (crc ^ (-1)) >>>0){
    for(let b of next){
      crc = ((crc >>> 8) ^ crc_table[(crc ^ b) & 0xff]);
    }
  };
  return (crc ^ (-1)) >>>0;
}

export function crc32(){
  let g = _crc32();
  g.next();
  return g;
}




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

/**
 * simple implementation of Zip to allow export
 * Should be compatible with standard implementations
 * It *could* compress files but images and videos are already compressed. 
 * `*.glb` files generally only deflate by ~5% and text files are negligible in size.
 * @see https://pkware.cachefly.net/webdocs/APPNOTE/APPNOTE-6.3.0.TXT
 */
export async function *zip(files :AsyncIterable<ZipEntry>|Iterable<ZipEntry>, {comments = "" }={}){
  let cd = Buffer.alloc(0);
  let files_count = 0, archive_size = 0;
  for await (let {filename, mtime, stream, isDirectory = !!stream} of files){
    if(!stream && !isDirectory){
      throw new Error("Files require a Readable stream");
    }
    files_count++;
    if(mtime.getUTCFullYear() < 1980){
      mtime = new Date("1980-01-01T0:0:0Z");
    }
    let extra = Buffer.alloc(0);
    let local_header_offset = archive_size;
    let header = Buffer.alloc(30 + Buffer.byteLength(filename) +extra.length);
    header.writeUint32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4); //Version 2.0 needed (deflate and folder support)
    header.writeUInt16LE( 0
      | 1 << 3 // crc32 and size are set to 0 and added at the end
      | 1 << 11 // UTF-8 filenames
      , 6); //Version 2.0 needed (deflate and folder support)
    header.writeUInt16LE(0, 8) // compression : 0 - none or 8 - Deflate
    //mtime time and date
    // see: https://learn.microsoft.com/fr-fr/windows/win32/api/winbase/nf-winbase-dosdatetimetofiletime?redirectedfrom=MSDN
    header.writeUInt16LE(0
      | Math.floor(mtime.getUTCSeconds()/2)
      | mtime.getUTCMinutes() << 5
      | mtime.getUTCHours() << 11
      , 10);
    header.writeUInt16LE(0
      | mtime.getUTCDate()
      | (mtime.getUTCMonth()+1 /* months start at 1 */) <<5
      | (mtime.getUTCFullYear() - 1980) << 9
      , 12);
    //CRC32 and sizes set to 0 because GP bit 3 is set
    header.writeUInt32LE(0, 14); 
    header.writeUInt32LE(0, 18);
    header.writeUInt32LE(0, 22);
    
    header.writeUInt16LE(Buffer.byteLength(filename), 26);
    header.writeUInt16LE(extra.length, 28);
    header.write(filename, 30, "utf-8");
    extra.copy(header, 30 +  Buffer.byteLength(filename));
    yield header; //End of file header
    archive_size += header.length;

    let size = 0;
    let crc = crc32(); 
    if(stream){
      for await (let data of stream){ // TODO: best block length for network?
        size += data.length;
        crc.next(data);
        yield data;
        archive_size += data.length;
      }
    }
    //Data descriptor
    let dd = Buffer.alloc(16);
    dd.writeUInt32LE(0x08074b50, 0);
    dd.writeUInt32LE(crc.next().value, 4);
    dd.writeUInt32LE(size, 8) //Compressed size
    dd.writeUInt32LE(size, 12);
    yield dd;
    archive_size += dd.length;
    
    let cdr = Buffer.alloc(header.length + 16);
    cdr.writeUInt32LE(0x02014b50, 0)
    cdr.writeUInt16LE( 0 | 20, 4); // made by MS-DOS with zip v2.0
    //Copy the original header
    header.copy(cdr, 6, 4, 30);
    //Overwrite the sizes using data-descriptor
    dd.copy(cdr, 16, 4);
    cdr.writeUInt16LE(0, 32); //comment length
    cdr.writeUInt16LE(0, 34) //disk number
    cdr.writeUInt16LE(0, 36) //Internal attributes. Indicate ASCII files here
    cdr.writeUInt16LE(isDirectory? 0x10 :0x0, 38) //DOS directory or archive (first two bytes of external attributes
    cdr.writeUInt16LE(parseInt((isDirectory? "040755":"100644"), 8), 40)//external attributes
    cdr.writeUInt32LE(local_header_offset, 42); //relative offset of header
    cdr.write(filename, 46, "utf-8");
    extra.copy(header, 46 +  Buffer.byteLength(filename));
    cd = Buffer.concat([cd, cdr]);
  }
  // Digital signature is omitted

  //End of central directory
  let eocdr = Buffer.alloc(22 + Buffer.byteLength(comments));
  eocdr.writeUInt32LE(0x06054b50, 0);
  eocdr.writeUInt16LE(0, 4); //Disk number
  eocdr.writeUInt16LE(0, 6); //start disk of CDR
  eocdr.writeUInt16LE(files_count, 8); //records on this disk
  eocdr.writeUInt16LE(files_count, 10) //total records
  eocdr.writeUInt32LE(cd.length, 12); //Size of central directory
  eocdr.writeUInt32LE(archive_size, 16); //central directory offset
  eocdr.writeUInt16LE(Buffer.byteLength(comments), 20) //comments length
  eocdr.write(comments, 22, "utf-8");
  let t = Buffer.concat([cd, eocdr]);
  yield t;
}

async function get_eocdr_buffer(handle :FileHandle) :Promise<Buffer>{
  let stats = await handle.stat();
  let b = Buffer.alloc(65535);
  let {bytesRead} = await handle.read({buffer: b, position: Math.max(stats.size - 65535, 0)});
  let offset = 0, slice :Buffer|undefined = undefined;
  for(offset; offset < bytesRead-22; offset++){
    //Find a eocd signature matching a correct comments length
    if(b.readUInt32LE(bytesRead -offset -22) == 0x06054b50 && b.readUInt16LE(bytesRead - offset-2) == offset){
      return b.slice(bytesRead -offset -22);
    }
  }
  throw new Error("Could not find end of central directory record");

}

export async function zip_read_eocdr(handle :FileHandle){
  let slice = await get_eocdr_buffer(handle);
  let data_size = slice.readUInt32LE(16);
  let eocdr_size = 22+slice.readUInt16LE(20);
  let cdr_size = slice.readUInt32LE(12);
  return {
    entries: slice.readUInt16LE(10),
    cdr_size,
    cdr_start: data_size,
    file_size: data_size+cdr_size + eocdr_size,
    comments: slice.slice(22, eocdr_size).toString("utf8"),
  };
}

export async function *read_cd(handle : FileHandle){
  let eocdr = await zip_read_eocdr(handle);
  let cdr = Buffer.alloc(eocdr.cdr_size);
  assert( (await handle.read({buffer:cdr, position: eocdr.cdr_start})).bytesRead == cdr.length, "Can't read Zip Central Directory Records");
  let offset = 0;
  while(offset < eocdr.cdr_size){
    let view = cdr.slice(offset, offset +46);
    yield {
      name: cdr.slice(offset+46, view.readUInt16LE(28)).toString("utf-8"),
      unixMode: view.readUInt16LE(40).toString(8),
      dosMode: view.readUInt32LE(38).toString(16),
    }
  }
}

export async function *unzipScenes() :AsyncGenerator<string,any,unknown>{

}